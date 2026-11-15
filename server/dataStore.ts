import crypto from 'crypto';
import type { Request } from 'express';
import {
  INITIAL_COURSES,
  INITIAL_EXAMS,
  INITIAL_FORUM_POSTS,
  INITIAL_STUDENT_PROFILE,
  INITIAL_VOCABULARY,
  INITIAL_VOCAB_DECKS,
  INITIAL_APP_USERS,
} from '../src/data/initialData.ts';
import {
  Course,
  Exam,
  ForumPost,
  StudentProfile,
  VocabItem,
  AuthUser,
  AppUser,
  VocabDeck,
} from '../src/types/hsk.ts';
import { JsonCollection, deepClone, readLegacyDatabase } from './db/JsonDatabase.ts';

export interface AuthSession {
  token: string;
  userId: string;
  email: string;
  role: AuthUser['role'];
  createdAt: string;
  expiresAt: string;
}

const DEFAULT_ADMIN_AUTH_USER: AuthUser = {
  id: 'usr-admin-1',
  name: 'Thắng Trần (Quản trị viên)',
  email: 'thangtv1.hyn@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  provider: 'google',
  role: 'admin',
  status: 'active',
  targetLevel: 'HSK 5',
  joinedAt: '2026-01-10',
};

const PASSWORD_HASH_PREFIX = 'scrypt:';

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `${PASSWORD_HASH_PREFIX}${salt}:${derived}`;
}

export function verifyPassword(plain: string, stored?: string): boolean {
  if (!stored || !plain) return false;
  const candidates = Array.from(new Set([String(plain), String(plain).trim()]));
  if (stored.startsWith(PASSWORD_HASH_PREFIX)) {
    const rest = stored.slice(PASSWORD_HASH_PREFIX.length);
    const [salt, keyHex] = rest.split(':');
    if (!salt || !keyHex) return false;
    const keyBuf = Buffer.from(keyHex, 'hex');
    for (const candidate of candidates) {
      const derived = crypto.scryptSync(candidate, salt, 64);
      if (derived.length === keyBuf.length && crypto.timingSafeEqual(derived, keyBuf)) {
        return true;
      }
    }
    return false;
  }
  return candidates.includes(stored);
}

export function sanitizeAppUser(user: AppUser): Omit<AppUser, 'password'> {
  const { password: _removed, ...safe } = user;
  return safe;
}

export function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        cookies[key] = decodeURIComponent(val);
      } catch {
        cookies[key] = val;
      }
    }
  }
  return cookies;
}

export function extractSessionToken(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.mixiang_session) {
    return cookies.mixiang_session;
  }
  return '';
}

export class HSKDataStore {
  private readonly coursesCol = new JsonCollection<Course>('courses', () => INITIAL_COURSES);
  private readonly examsCol = new JsonCollection<Exam>('exams', () => INITIAL_EXAMS);
  private readonly vocabCol = new JsonCollection<VocabItem>('vocabularies', () => INITIAL_VOCABULARY);
  private readonly decksCol = new JsonCollection<VocabDeck>('vocabDecks', () => INITIAL_VOCAB_DECKS);
  private readonly forumCol = new JsonCollection<ForumPost>('forumPosts', () => INITIAL_FORUM_POSTS);
  private readonly studentsCol = new JsonCollection<StudentProfile>('students', () => [INITIAL_STUDENT_PROFILE]);
  private readonly appUsersCol = new JsonCollection<AppUser>('appUsers', () =>
    INITIAL_APP_USERS.map((u) => {
      const rawPassword = u.password || '123456';
      return {
        ...u,
        password: rawPassword.startsWith(PASSWORD_HASH_PREFIX)
          ? rawPassword
          : hashPassword(rawPassword),
      };
    })
  );
  private readonly authUsersCol = new JsonCollection<AuthUser>('authUsers', () => [DEFAULT_ADMIN_AUTH_USER]);
  private readonly sessionsCol = new JsonCollection<AuthSession>('sessions', () => []);

  courses: Course[] = [];
  exams: Exam[] = [];
  vocabularies: VocabItem[] = [];
  vocabDecks: VocabDeck[] = [];
  forumPosts: ForumPost[] = [];
  students: StudentProfile[] = [];
  appUsers: AppUser[] = [];
  users: AuthUser[] = [];
  sessions: AuthSession[] = [];

  constructor() {
    this.load();
  }

  load(): void {
    const legacy = readLegacyDatabase();

    this.courses = this.coursesCol.load(legacy?.courses);
    this.exams = this.examsCol.load(legacy?.exams);
    this.vocabularies = this.vocabCol.load(legacy?.vocabularies);
    this.vocabDecks = this.decksCol.load(legacy?.vocabDecks);
    this.forumPosts = this.forumCol.load(legacy?.forumPosts);
    this.students = this.studentsCol.load(legacy?.students);
    this.appUsers = this.appUsersCol.load(legacy?.appUsers);
    this.users = this.authUsersCol.load(legacy?.users);
    this.sessions = this.sessionsCol.load();

    // Ensure seed Boya decks & vocabularies exist
    let vocabUpdated = false;
    let deckUpdated = false;
    for (const seedDeck of INITIAL_VOCAB_DECKS) {
      if (!this.vocabDecks.some((d) => d.id === seedDeck.id)) {
        this.vocabDecks.push(deepClone(seedDeck));
        deckUpdated = true;
      }
    }
    for (const seedVocab of INITIAL_VOCABULARY) {
      if (!this.vocabularies.some((v) => v.id === seedVocab.id || v.word === seedVocab.word)) {
        this.vocabularies.push(deepClone(seedVocab));
        vocabUpdated = true;
      }
    }
    if (vocabUpdated) this.vocabCol.save();
    if (deckUpdated) this.decksCol.save();

    // Prune expired sessions and hash any legacy plaintext or missing passwords on startup
    const now = Date.now();
    const validSessions = this.sessions.filter((s) => new Date(s.expiresAt).getTime() > now);
    if (validSessions.length !== this.sessions.length) {
      this.sessions = validSessions;
      this.sessionsCol.setAll(this.sessions);
    }

    let usersUpdated = false;
    for (const u of this.appUsers) {
      if (!u.password) {
        u.password = hashPassword('123456');
        usersUpdated = true;
      } else if (u.password && !u.password.startsWith(PASSWORD_HASH_PREFIX)) {
        u.password = hashPassword(u.password);
        usersUpdated = true;
      }
    }
    if (usersUpdated) this.appUsersCol.save();
  }

  save(): void {
    this.coursesCol.setAll(this.courses);
    this.examsCol.setAll(this.exams);
    this.vocabCol.setAll(this.vocabularies);
    this.decksCol.setAll(this.vocabDecks);
    this.forumCol.setAll(this.forumPosts);
    this.studentsCol.setAll(this.students);
    this.appUsersCol.setAll(this.appUsers);
    this.authUsersCol.setAll(this.users);
    this.sessionsCol.setAll(this.sessions);
  }

  saveUsersAndSessions(): void {
    this.appUsersCol.setAll(this.appUsers);
    this.authUsersCol.setAll(this.users);
    this.studentsCol.setAll(this.students);
    this.sessionsCol.setAll(this.sessions);
  }

  resetToInitial(): void {
    this.courses = this.coursesCol.reset();
    this.exams = this.examsCol.reset();
    this.vocabularies = this.vocabCol.reset();
    this.vocabDecks = this.decksCol.reset();
    this.forumPosts = this.forumCol.reset();
    this.students = this.studentsCol.reset();
    this.appUsers = this.appUsersCol.reset();
    this.users = this.authUsersCol.reset();
    this.sessions = this.sessionsCol.reset();
  }

  createSession(user: AuthUser): AuthSession {
    const token = crypto.randomBytes(32).toString('hex');
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    const session: AuthSession = {
      token,
      userId: user.id,
      email: user.email.toLowerCase(),
      role: user.role || 'student',
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    this.sessions.unshift(session);
    this.sessionsCol.setAll(this.sessions);
    return session;
  }

  getSession(token?: string): AuthSession | null {
    if (!token) return null;
    const session = this.sessions.find((s) => s.token === token);
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      this.revokeSession(token);
      return null;
    }
    return session;
  }

  revokeSession(token?: string): boolean {
    if (!token) return false;
    const before = this.sessions.length;
    this.sessions = this.sessions.filter((s) => s.token !== token);
    if (this.sessions.length !== before) {
      this.sessionsCol.setAll(this.sessions);
      return true;
    }
    return false;
  }

  revokeUserSessions(userIdOrEmail: string): void {
    const clean = userIdOrEmail.trim().toLowerCase();
    const before = this.sessions.length;
    this.sessions = this.sessions.filter(
      (s) => s.userId !== userIdOrEmail && s.email.toLowerCase() !== clean
    );
    if (this.sessions.length !== before) {
      this.sessionsCol.setAll(this.sessions);
    }
  }

  // Helper to get active profile by session token, userId, email, or Express request
  getActiveProfile(identifier?: string | Request): StudentProfile {
    let targetEmail = '';
    let targetUserId = '';

    if (typeof identifier === 'string' && identifier.trim()) {
      const clean = identifier.trim().toLowerCase();
      if (clean.includes('@')) {
        targetEmail = clean;
      } else {
        targetUserId = identifier.trim();
      }
    } else if (identifier && typeof identifier === 'object') {
      const req = identifier as Request;
      const token = extractSessionToken(req);
      const activeSession = this.getSession(token);
      if (activeSession) {
        targetEmail = activeSession.email;
        targetUserId = activeSession.userId;
      }

      if (!targetEmail) {
        const rawEmail =
          (req.headers['x-user-email'] as string) ||
          (req.query?.email as string) ||
          (req.body?.email as string) ||
          (req.body?.userEmail as string) ||
          '';
        if (rawEmail && typeof rawEmail === 'string') {
          targetEmail = rawEmail.trim().toLowerCase();
        }
      }
      if (!targetUserId) {
        const rawId =
          (req.headers['x-user-id'] as string) ||
          (req.query?.userId as string) ||
          (req.body?.userId as string) ||
          '';
        if (rawId && typeof rawId === 'string') {
          targetUserId = rawId.trim();
        }
      }
    }

    if (targetEmail) {
      const foundByEmail = this.students.find((s) => s.email.toLowerCase() === targetEmail);
      if (foundByEmail) return foundByEmail;
    }

    if (targetUserId) {
      const foundById = this.students.find((s) => s.id === targetUserId);
      if (foundById) return foundById;
    }

    const matchedAppUser = this.appUsers.find(
      (u) =>
        (targetEmail && u.email.toLowerCase() === targetEmail) ||
        (targetUserId && u.id === targetUserId)
    );

    if (matchedAppUser) {
      const newProfile: StudentProfile = {
        id: matchedAppUser.id,
        name: matchedAppUser.name,
        email: matchedAppUser.email,
        avatar:
          matchedAppUser.avatar ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        targetLevel: matchedAppUser.level || 'HSK 1',
        streakDays: matchedAppUser.streak || 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        xp: 100,
        role: matchedAppUser.role,
        status: matchedAppUser.status,
        reminderTime: '20:30',
        reminderEnabled: true,
        dailyGoalMinutes: 30,
        masteredVocabIds: [],
        learningVocabIds: [],
        completedLessonIds: [],
        examHistory: [],
        studyLog: {},
      };
      this.students.push(newProfile);
      this.studentsCol.setAll(this.students);
      return newProfile;
    }

    if (!this.students[0]) {
      this.students.push(deepClone(INITIAL_STUDENT_PROFILE));
      this.studentsCol.setAll(this.students);
    }

    return this.students[0];
  }

  syncProfileToAppUser(profile: StudentProfile): void {
    const appUser = this.appUsers.find(
      (u) => u.id === profile.id || u.email.toLowerCase() === profile.email.toLowerCase()
    );
    if (appUser) {
      appUser.completedLessons = profile.completedLessonIds.length;
      appUser.examsTaken = profile.examHistory.length;
      appUser.streak = profile.streakDays;
      if (profile.examHistory.length > 0) {
        const total = profile.examHistory.reduce((sum, e) => sum + e.totalScore, 0);
        appUser.avgScore = Math.round(total / profile.examHistory.length);
      }
      this.appUsersCol.setAll(this.appUsers);
    }
    this.studentsCol.setAll(this.students);
  }
}

export const db = new HSKDataStore();

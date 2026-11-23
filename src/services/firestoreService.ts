import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  DocumentReference,
} from 'firebase/firestore';
import {
  auth,
  db,
  BOOTSTRAPPED_ADMIN_EMAIL,
  OperationType,
  handleFirestoreError,
} from '../firebase';
import {
  AppUser,
  AuthUser,
  Course,
  DialogueLine,
  Exam,
  ExamQuestion,
  ExamResult,
  ForumPost,
  ForumReply,
  GrammarPoint,
  HSKLevel,
  Lesson,
  PracticeQuestion,
  SiteUIConfig,
  StudentProfile,
  UserRole,
  UserStatus,
  VocabDeck,
  VocabItem,
} from '../types/hsk';

const VALID_LEVELS: HSKLevel[] = ['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5'];
const VALID_FORUM_LEVELS = ['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'Toàn bộ'] as const;
const VALID_FORUM_CATEGORIES = [
  'Ngữ pháp',
  'Từ vựng',
  'Kinh nghiệm thi',
  'Chữa bài',
  'Hỏi đáp chung',
] as const;
const MAX_IMAGE_CHARS = 180000;
// Keep each writeBatch <= 10 docs so total Firestore Security Rules expressions per batch
// stay well under Firestore's 1,000-expressions-per-request limit (even for 3,000+ vocab cards).
const BATCH_CHUNK_SIZE = 8;
const MAX_CONCURRENT_BATCHES = 5;

/**
 * Recursively strips `undefined` values from objects/arrays because Firestore rejects `undefined`.
 */
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out as T;
  }
  return value;
}

/**
 * Guarantees every Firestore document ID strictly satisfies ^[a-zA-Z0-9_\-]+$ (1..128 chars).
 */
export function sanitizeDocId(rawId: string | undefined, prefix: string): string {
  const cleaned = String(rawId || '')
    .trim()
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 128);
  if (cleaned.length > 0) return cleaned;
  return `${prefix}-${Date.now()}`;
}

function normalizeHSKLevel(level: unknown): HSKLevel {
  return VALID_LEVELS.includes(level as HSKLevel) ? (level as HSKLevel) : 'HSK 1';
}

function clampString(val: unknown, maxLen: number, fallback = ''): string {
  if (typeof val !== 'string') return fallback;
  return val.length > maxLen ? val.slice(0, maxLen) : val;
}

function clampOptionalString(val: unknown, maxLen: number): string | undefined {
  if (typeof val !== 'string') return undefined;
  return val.length > maxLen ? val.slice(0, maxLen) : val;
}

function safeImageUrl(val: unknown, fallback = ''): string {
  if (typeof val !== 'string') return fallback;
  // Never slice a base64 data:image URL mid-stream because doing so corrupts the image
  if (val.startsWith('data:image/') && val.length > MAX_IMAGE_CHARS) {
    throw new Error(
      `Ảnh tải lên quá lớn (${Math.round(val.length / 1024)} KB, giới hạn ${Math.round(
        MAX_IMAGE_CHARS / 1024
      )} KB/ảnh). Vui lòng tải lại ảnh để hệ thống tự động nén.`
    );
  }
  return val.length > MAX_IMAGE_CHARS ? val.slice(0, MAX_IMAGE_CHARS) : val;
}

function clampNumber(val: unknown, min: number, max: number, fallback: number): number {
  const num = typeof val === 'number' && Number.isFinite(val) ? val : Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function clampOptionalNumber(val: unknown, min: number, max: number): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  const num = typeof val === 'number' && Number.isFinite(val) ? val : Number(val);
  if (!Number.isFinite(num)) return undefined;
  return Math.min(max, Math.max(min, num));
}

export interface BatchWriteOp {
  type: 'set' | 'delete';
  ref: DocumentReference;
  data?: Record<string, unknown>;
}

/**
 * Splits large write/delete sets (e.g., 3,000+ vocabulary cards) into safe 10-op Firestore batches
 * executed with bounded concurrency so every single request stays well under Firestore's
 * 1,000 security-rule-expressions-per-request quota.
 */
export async function commitChunkedBatches(ops: BatchWriteOp[]): Promise<void> {
  if (ops.length === 0) return;

  const chunks: BatchWriteOp[][] = [];
  for (let i = 0; i < ops.length; i += BATCH_CHUNK_SIZE) {
    chunks.push(ops.slice(i, i + BATCH_CHUNK_SIZE));
  }

  for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_BATCHES) {
    const wave = chunks.slice(i, i + MAX_CONCURRENT_BATCHES);
    await Promise.all(
      wave.map(async (chunk) => {
        const batch = writeBatch(db);
        for (const op of chunk) {
          if (op.type === 'set' && op.data) {
            batch.set(op.ref, stripUndefined(op.data));
          } else if (op.type === 'delete') {
            batch.delete(op.ref);
          }
        }
        await batch.commit();
      })
    );
  }
}

export function isBootstrappedAdminSignedIn(): boolean {
  const user = auth.currentUser;
  return Boolean(
    user &&
      user.emailVerified &&
      user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
  );
}

export async function isCurrentFirebaseUserAdmin(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  if (isBootstrappedAdminSignedIn()) return true;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch {
    return false;
  }
}

// =============================================================================
// FIELD-COMPLETE SERIALIZERS & DESERIALIZERS (100% ALIGNED WITH firestore.rules)
// =============================================================================

export function normalizeVocabItem(item: VocabItem): VocabItem {
  return stripUndefined({
    id: sanitizeDocId(item.id, 'v'),
    word: clampString(item.word, 100, '?') || '?',
    pinyin: clampString(item.pinyin, 200, '-') || '-',
    sinoVietnamese: clampString(item.sinoVietnamese, 200, ''),
    meaning: clampString(item.meaning, 400, '-') || '-',
    level: normalizeHSKLevel(item.level),
    category: clampOptionalString(item.category, 150),
    radical: clampOptionalString(item.radical, 100),
    strokeCount: clampOptionalNumber(item.strokeCount, 0, 100),
    exampleSentence: clampString(item.exampleSentence, 600, ''),
    examplePinyin: clampString(item.examplePinyin, 600, ''),
    exampleMeaning: clampString(item.exampleMeaning, 600, ''),
    imageUrl: clampOptionalString(item.imageUrl, MAX_IMAGE_CHARS),
  });
}

export function toCourseDoc(course: Course, orderIndex?: number): Record<string, unknown> {
  const id = sanitizeDocId(course.id, 'c');
  const cs = course.colorScheme || {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-600',
  };
  return stripUndefined({
    id,
    level: normalizeHSKLevel(course.level),
    title: clampString(course.title, 200, 'Khóa học HSK') || 'Khóa học HSK',
    vietnameseTitle: clampString(course.vietnameseTitle, 250, course.title || 'Khóa học HSK') || 'Khóa học HSK',
    description: clampString(course.description, 2000, ''),
    coverImage: clampOptionalString(course.coverImage, MAX_IMAGE_CHARS),
    targetVocabCount: clampNumber(course.targetVocabCount, 0, 50000, 150),
    grammarPointsCount: clampNumber(course.grammarPointsCount, 0, 5000, 20),
    colorScheme: {
      bg: clampString(cs.bg, 100, 'bg-red-50') || 'bg-red-50',
      border: clampString(cs.border, 100, 'border-red-200') || 'border-red-200',
      text: clampString(cs.text, 100, 'text-red-700') || 'text-red-700',
      badge: clampString(cs.badge, 100, 'bg-red-600') || 'bg-red-600',
    },
    orderIndex: clampOptionalNumber(orderIndex, 0, 10000),
    updatedAt: new Date().toISOString(),
  });
}

export function toLessonDoc(courseId: string, lesson: Lesson): Record<string, unknown> {
  const safeCourseId = sanitizeDocId(courseId, 'c');
  const safeLessonId = sanitizeDocId(lesson.id, 'l');

  const vocabulary: VocabItem[] = (Array.isArray(lesson.vocabulary) ? lesson.vocabulary : [])
    .slice(0, 200)
    .map(normalizeVocabItem);

  const grammar: GrammarPoint[] = (Array.isArray(lesson.grammar) ? lesson.grammar : [])
    .slice(0, 100)
    .map((g, idx) =>
      stripUndefined({
        id: sanitizeDocId(g.id, `g-${idx}`),
        title: clampString(g.title, 250, ''),
        structure: clampString(g.structure, 400, ''),
        explanation: clampString(g.explanation, 2000, ''),
        examples: (Array.isArray(g.examples) ? g.examples : []).slice(0, 20).map((ex) => ({
          hanzi: clampString(ex.hanzi, 500, ''),
          pinyin: clampString(ex.pinyin, 500, ''),
          translation: clampString(ex.translation, 500, ''),
        })),
      })
    );

  const dialogue: DialogueLine[] = (Array.isArray(lesson.dialogue) ? lesson.dialogue : [])
    .slice(0, 200)
    .map((d, idx) =>
      stripUndefined({
        id: sanitizeDocId(d.id, `dl-${idx}`),
        speaker: clampString(d.speaker, 120, ''),
        avatar: clampOptionalString(d.avatar, 150000),
        chinese: clampString(d.chinese, 1000, ''),
        pinyin: clampString(d.pinyin, 1000, ''),
        vietnamese: clampString(d.vietnamese, 1000, ''),
      })
    );

  const practiceQuestions: PracticeQuestion[] = (
    Array.isArray(lesson.practiceQuestions) ? lesson.practiceQuestions : []
  )
    .slice(0, 200)
    .map((pq, idx) =>
      stripUndefined({
        id: sanitizeDocId(pq.id, `pq-${idx}`),
        type:
          pq.type === 'sentence_reorder' || pq.type === 'fill_blank' ? pq.type : 'single_choice',
        question: clampString(pq.question, 1000, ''),
        pinyin: clampOptionalString(pq.pinyin, 1000),
        options: (Array.isArray(pq.options) ? pq.options : []).map((o) => clampString(o, 500, '')),
        correctAnswer: clampNumber(pq.correctAnswer, 0, 20, 0),
        explanation: clampString(pq.explanation, 1500, ''),
      })
    );

  return stripUndefined({
    id: safeLessonId,
    courseId: safeCourseId,
    level: normalizeHSKLevel(lesson.level),
    lessonNumber: clampNumber(lesson.lessonNumber, 0, 500, 1),
    title: clampString(lesson.title, 250, 'Bài học') || 'Bài học',
    vietnameseTitle: clampString(lesson.vietnameseTitle, 250, lesson.title || 'Bài học') || 'Bài học',
    durationMinutes: clampNumber(lesson.durationMinutes, 0, 600, 30),
    description: clampString(lesson.description, 2000, ''),
    vocabulary,
    grammar,
    dialogue,
    practiceQuestions,
    updatedAt: new Date().toISOString(),
  });
}

export function toVocabDeckDoc(deck: VocabDeck): Record<string, unknown> {
  const id = sanitizeDocId(deck.id, 'deck');
  const createdBy =
    deck.createdBy === 'admin' || deck.createdBy === 'ai' || deck.createdBy === 'system'
      ? deck.createdBy
      : 'admin';
  return stripUndefined({
    id,
    title: clampString(deck.title, 250, 'Bộ thẻ từ vựng') || 'Bộ thẻ từ vựng',
    vietnameseTitle: clampOptionalString(deck.vietnameseTitle, 250),
    description: clampString(deck.description, 2000, ''),
    level: normalizeHSKLevel(deck.level),
    category: clampString(deck.category, 150, 'HSK') || 'HSK',
    color: clampOptionalString(deck.color, 40),
    createdAt: clampString(deck.createdAt, 64, new Date().toISOString().split('T')[0]) || new Date().toISOString().split('T')[0],
    createdBy,
    cardCount: clampNumber(
      Array.isArray(deck.cards) ? deck.cards.length : deck.cardCount ?? 0,
      0,
      50000,
      0
    ),
    updatedAt: new Date().toISOString(),
  });
}

export function toVocabCardDoc(
  deckId: string,
  card: VocabItem,
  orderIndex?: number
): Record<string, unknown> {
  const safeDeckId = sanitizeDocId(deckId, 'deck');
  const normalized = normalizeVocabItem(card);
  return stripUndefined({
    ...normalized,
    deckId: safeDeckId,
    orderIndex: clampOptionalNumber(orderIndex, 0, 50000),
    updatedAt: new Date().toISOString(),
  });
}

export function toExamDoc(exam: Exam): Record<string, unknown> {
  const id = sanitizeDocId(exam.id, 'exam');
  const questions: ExamQuestion[] = (Array.isArray(exam.questions) ? exam.questions : [])
    .slice(0, 200)
    .map((q, idx) =>
      stripUndefined({
        id: sanitizeDocId(q.id, `q-${idx}`),
        section:
          q.section === 'listening' ||
          q.section === 'reading' ||
          q.section === 'writing' ||
          q.section === 'speaking'
            ? q.section
            : 'reading',
        questionType: q.questionType,
        question: clampString(q.question, 1500, ''),
        pinyin: clampOptionalString(q.pinyin, 1000),
        audioPrompt: clampOptionalString(q.audioPrompt, 1500),
        options: Array.isArray(q.options) ? q.options.map((o) => clampString(o, 500, '')) : undefined,
        correctAnswer: clampOptionalNumber(q.correctAnswer, 0, 20),
        correctText: clampOptionalString(q.correctText, 1500),
        explanation: clampString(q.explanation, 2000, ''),
      })
    );

  return stripUndefined({
    id,
    level: normalizeHSKLevel(exam.level),
    title: clampString(exam.title, 250, 'Đề thi thử HSK') || 'Đề thi thử HSK',
    subtitle: clampString(exam.subtitle, 300, ''),
    timeLimitMinutes: clampNumber(exam.timeLimitMinutes, 1, 300, 40),
    passScore: clampNumber(exam.passScore, 0, 1000, 120),
    totalPoints: clampNumber(exam.totalPoints, 1, 1000, 200),
    questions,
    updatedAt: new Date().toISOString(),
  });
}

export function toForumPostDoc(post: ForumPost, fallbackAuthorUid: string): Record<string, unknown> {
  const id = sanitizeDocId(post.id, 'fp');
  const authorUid = clampString(post.authorUid || fallbackAuthorUid, 128, 'system') || 'system';
  const role =
    post.role === 'admin' || post.role === 'teacher' || post.role === 'student'
      ? post.role
      : 'student';
  const level = VALID_FORUM_LEVELS.includes(post.level as any) ? post.level : 'HSK 1';
  const category = VALID_FORUM_CATEGORIES.includes(post.category as any)
    ? post.category
    : 'Hỏi đáp chung';

  const replies: ForumReply[] = (Array.isArray(post.replies) ? post.replies : [])
    .slice(0, 200)
    .map((r, idx) =>
      stripUndefined({
        id: sanitizeDocId(r.id, `fr-${idx}`),
        authorName: clampString(r.authorName, 120, 'Học viên') || 'Học viên',
        authorAvatar: clampString(r.authorAvatar, 150000, ''),
        role:
          r.role === 'admin' || r.role === 'teacher' || r.role === 'ai' || r.role === 'student'
            ? r.role
            : 'student',
        content: clampString(r.content, 5000, ''),
        createdAt: clampString(r.createdAt, 64, new Date().toISOString()),
        likes: clampNumber(r.likes, 0, 1000000, 0),
      })
    );

  return stripUndefined({
    id,
    authorUid,
    authorName: clampString(post.authorName, 120, 'Học viên') || 'Học viên',
    authorAvatar: clampOptionalString(post.authorAvatar, 150000),
    role,
    title: clampString(post.title, 250, 'Câu hỏi HSK') || 'Câu hỏi HSK',
    content: clampString(post.content, 5000, ' ') || ' ',
    level,
    category,
    tags: (Array.isArray(post.tags) ? post.tags : [])
      .slice(0, 20)
      .map((t) => clampString(t, 60, '')),
    likes: clampNumber(post.likes, 0, 1000000, 0),
    repliesCount: clampNumber(
      typeof post.repliesCount === 'number' ? post.repliesCount : replies.length,
      0,
      1000,
      replies.length
    ),
    createdAt: clampString(post.createdAt, 64, new Date().toISOString()),
    isPinned: Boolean(post.isPinned),
    isSolved: Boolean(post.isSolved),
    replies,
    updatedAt: new Date().toISOString(),
  });
}

export function toSiteConfigDoc(config: SiteUIConfig): Record<string, unknown> {
  return stripUndefined({
    primaryColor: clampString(config.primaryColor, 40, '#C85A43') || '#C85A43',
    canvasColor: clampString(config.canvasColor, 40, '#F7F4EC') || '#F7F4EC',
    fontScale:
      config.fontScale === '13.5px' || config.fontScale === '14px' || config.fontScale === '15px'
        ? config.fontScale
        : '14px',
    headerLogoUrl:
      typeof config.headerLogoUrl === 'string' ? safeImageUrl(config.headerLogoUrl, '') : undefined,
    brandName: clampString(config.brandName, 120, 'MiXiangg') || 'MiXiangg',
    brandHighlight: clampString(config.brandHighlight, 120, 'HSK'),
    brandSubtitle: clampString(config.brandSubtitle, 200, ''),
    heroBadge: clampString(config.heroBadge, 200, ''),
    heroTitleLine1: clampString(config.heroTitleLine1, 200, ''),
    heroTitleHighlight: clampString(config.heroTitleHighlight, 200, ''),
    heroTitleLine3: clampString(config.heroTitleLine3, 200, ''),
    heroDescription: clampString(config.heroDescription, 1000, ''),
    heroCtaPrimary: clampString(config.heroCtaPrimary, 120, ''),
    heroCtaSecondary: clampString(config.heroCtaSecondary, 120, ''),
    stat1Value: clampString(config.stat1Value, 60, ''),
    stat1Label: clampString(config.stat1Label, 120, ''),
    stat2Value: clampString(config.stat2Value, 60, ''),
    stat2Label: clampString(config.stat2Label, 120, ''),
    stat3Value: clampString(config.stat3Value, 60, ''),
    stat3Label: clampString(config.stat3Label, 120, ''),
    posterSectionBadge: clampString(config.posterSectionBadge, 200, ''),
    posterSectionTitle: clampString(config.posterSectionTitle, 200, ''),
    posterSectionSubtitle: clampString(config.posterSectionSubtitle, 500, ''),
    poster1Url: safeImageUrl(config.poster1Url, ''),
    poster1Caption: clampString(config.poster1Caption, 300, ''),
    poster2Url: safeImageUrl(config.poster2Url, ''),
    poster2Caption: clampString(config.poster2Caption, 300, ''),
    admissionBadge: clampString(config.admissionBadge, 200, ''),
    admissionTitle: clampString(config.admissionTitle, 250, ''),
    admissionDescription: clampString(config.admissionDescription, 1000, ''),
    admissionCta: clampString(config.admissionCta, 120, ''),
    momentsSectionBadge: clampString(config.momentsSectionBadge, 200, ''),
    momentsSectionTitle: clampString(config.momentsSectionTitle, 250, ''),
    momentsSectionSubtitle: clampString(config.momentsSectionSubtitle, 500, ''),
    classroomMoments: (Array.isArray(config.classroomMoments) ? config.classroomMoments : [])
      .slice(0, 30)
      .map((m, idx) => ({
        id: sanitizeDocId(m.id, `moment-${idx}`),
        title: clampString(m.title, 200, ''),
        subtitle: clampString(m.subtitle, 300, ''),
        detail: clampString(m.detail, 1000, ''),
        date: clampString(m.date, 64, ''),
        location: clampString(m.location, 200, ''),
        image: safeImageUrl(m.image, ''),
      })),
    showCoursesSection: Boolean(config.showCoursesSection),
    showPostersSection: Boolean(config.showPostersSection),
    showAdmissionBanner: Boolean(config.showAdmissionBanner),
    showMomentsSection: Boolean(config.showMomentsSection),
    footerLogoUrl: safeImageUrl(config.footerLogoUrl, ''),
    footerTitle: clampString(config.footerTitle, 200, ''),
    footerSubtitle: clampString(config.footerSubtitle, 300, ''),
    hotline: clampString(config.hotline, 80, ''),
    footerCtaText: clampString(config.footerCtaText, 120, ''),
    facebook: clampString(config.facebook, 300, ''),
    copyrightText: clampString(config.copyrightText, 250, ''),
    motto: clampString(config.motto, 300, ''),
    updatedAt: new Date().toISOString(),
  });
}

export function normalizeExamResult(res: ExamResult): ExamResult {
  return stripUndefined({
    id: sanitizeDocId(res.id, 'res'),
    examId: sanitizeDocId(res.examId, 'exam'),
    examTitle: clampString(res.examTitle, 250, ''),
    level: normalizeHSKLevel(res.level),
    date: clampString(res.date, 64, new Date().toISOString()),
    listeningScore: clampNumber(res.listeningScore, 0, 1000, 0),
    readingScore: clampNumber(res.readingScore, 0, 1000, 0),
    writingScore: clampNumber(res.writingScore, 0, 1000, 0),
    speakingScore: clampOptionalNumber(res.speakingScore, 0, 1000),
    totalScore: clampNumber(res.totalScore, 0, 1000, 0),
    maxScore: clampNumber(res.maxScore, 1, 1000, 200),
    passed: Boolean(res.passed),
    timeSpentSeconds: clampNumber(res.timeSpentSeconds, 0, 86400, 0),
    userAnswers:
      res.userAnswers && typeof res.userAnswers === 'object' ? { ...res.userAnswers } : {},
  });
}

/**
 * Merges AppUser + StudentProfile into the single `/users/{userId}` Firestore document.
 * NEVER stores `password` in Firestore.
 */
export function toUserAccountDoc(
  userId: string,
  profile: Partial<StudentProfile>,
  appUser?: Partial<AppUser> & Partial<AuthUser>
): Record<string, unknown> {
  const safeId = sanitizeDocId(userId, 'usr');
  const role: UserRole =
    appUser?.role === 'admin' || appUser?.role === 'teacher' || appUser?.role === 'student'
      ? appUser.role
      : profile.role === 'admin' || profile.role === 'teacher' || profile.role === 'student'
      ? profile.role
      : 'student';
  const status: UserStatus =
    appUser?.status === 'suspended' || profile.status === 'suspended' ? 'suspended' : 'active';
  const level = normalizeHSKLevel(appUser?.level || profile.targetLevel || appUser?.targetLevel);
  const targetLevel = normalizeHSKLevel(profile.targetLevel || appUser?.targetLevel || level);
  const provider: 'google' | 'email' = appUser?.provider === 'email' ? 'email' : 'google';

  const masteredVocabIds = (
    Array.isArray(profile.masteredVocabIds) ? profile.masteredVocabIds : []
  ).slice(0, 5000);
  const learningVocabIds = (
    Array.isArray(profile.learningVocabIds) ? profile.learningVocabIds : []
  ).slice(0, 5000);
  const completedLessonIds = (
    Array.isArray(profile.completedLessonIds) ? profile.completedLessonIds : []
  ).slice(0, 500);
  const examHistory = (Array.isArray(profile.examHistory) ? profile.examHistory : [])
    .slice(0, 200)
    .map(normalizeExamResult);

  const avgScore =
    examHistory.length > 0
      ? Math.round(
          examHistory.reduce((acc, item) => acc + item.totalScore, 0) / examHistory.length
        )
      : clampNumber(appUser?.avgScore, 0, 1000, 0);

  return stripUndefined({
    id: safeId,
    uid: clampOptionalString(appUser?.uid || profile.uid || safeId, 128),
    name: clampString(appUser?.name || profile.name, 120, 'Học viên HSK') || 'Học viên HSK',
    email: clampString(appUser?.email || profile.email, 200, 'student@mixiangg.vn').toLowerCase(),
    avatar: clampOptionalString(appUser?.avatar || profile.avatar, MAX_IMAGE_CHARS),
    role,
    status,
    level,
    targetLevel,
    provider,
    joinedDate: clampString(
      appUser?.joinedDate || appUser?.joinedAt,
      64,
      new Date().toISOString().split('T')[0]
    ),
    streakDays: clampNumber(profile.streakDays ?? appUser?.streak, 0, 10000, 1),
    lastActiveDate: clampString(
      profile.lastActiveDate,
      64,
      new Date().toISOString().split('T')[0]
    ),
    xp: clampNumber(profile.xp, 0, 10000000, 0),
    reminderTime: clampString(profile.reminderTime, 16, '20:00'),
    reminderEnabled: profile.reminderEnabled ?? true,
    dailyGoalMinutes: clampNumber(profile.dailyGoalMinutes, 1, 720, 30),
    masteredVocabIds,
    learningVocabIds,
    completedLessonIds,
    examHistory,
    studyLog:
      profile.studyLog && typeof profile.studyLog === 'object' ? { ...profile.studyLog } : {},
    completedLessons: clampNumber(
      completedLessonIds.length || appUser?.completedLessons,
      0,
      5000,
      0
    ),
    examsTaken: clampNumber(examHistory.length || appUser?.examsTaken, 0, 5000, 0),
    avgScore,
    note: clampOptionalString(appUser?.note, 500),
    updatedAt: new Date().toISOString(),
  });
}

export function fromUserAccountDoc(data: Record<string, unknown>): {
  appUser: AppUser;
  studentProfile: StudentProfile;
} {
  const id = String(data.id || data.uid || 'usr-unknown');
  const name = String(data.name || 'Học viên HSK');
  const email = String(data.email || '');
  const avatar = typeof data.avatar === 'string' ? data.avatar : '';
  const role: UserRole =
    data.role === 'admin' || data.role === 'teacher' || data.role === 'student'
      ? data.role
      : 'student';
  const status: UserStatus = data.status === 'suspended' ? 'suspended' : 'active';
  const level = normalizeHSKLevel(data.level || data.targetLevel);
  const targetLevel = normalizeHSKLevel(data.targetLevel || data.level);
  const provider: 'google' | 'email' = data.provider === 'email' ? 'email' : 'google';
  const joinedDate = String(data.joinedDate || new Date().toISOString().split('T')[0]);
  const streakDays = typeof data.streakDays === 'number' ? data.streakDays : 1;
  const completedLessonIds = Array.isArray(data.completedLessonIds)
    ? (data.completedLessonIds as string[])
    : [];
  const masteredVocabIds = Array.isArray(data.masteredVocabIds)
    ? (data.masteredVocabIds as string[])
    : [];
  const learningVocabIds = Array.isArray(data.learningVocabIds)
    ? (data.learningVocabIds as string[])
    : [];
  const examHistory = Array.isArray(data.examHistory)
    ? (data.examHistory as ExamResult[])
    : [];
  const studyLog =
    data.studyLog && typeof data.studyLog === 'object'
      ? (data.studyLog as Record<string, number>)
      : {};

  const appUser: AppUser = {
    id,
    uid: typeof data.uid === 'string' ? data.uid : id,
    name,
    email,
    avatar,
    role,
    status,
    level,
    provider,
    joinedDate,
    streak: streakDays,
    completedLessons:
      typeof data.completedLessons === 'number' ? data.completedLessons : completedLessonIds.length,
    examsTaken: typeof data.examsTaken === 'number' ? data.examsTaken : examHistory.length,
    avgScore: typeof data.avgScore === 'number' ? data.avgScore : 0,
    note: typeof data.note === 'string' ? data.note : undefined,
  };

  const studentProfile: StudentProfile = {
    id,
    uid: typeof data.uid === 'string' ? data.uid : id,
    name,
    email,
    avatar,
    targetLevel,
    streakDays,
    lastActiveDate: String(data.lastActiveDate || new Date().toISOString().split('T')[0]),
    xp: typeof data.xp === 'number' ? data.xp : 0,
    role,
    status,
    reminderTime: String(data.reminderTime || '20:00'),
    reminderEnabled: typeof data.reminderEnabled === 'boolean' ? data.reminderEnabled : true,
    dailyGoalMinutes: typeof data.dailyGoalMinutes === 'number' ? data.dailyGoalMinutes : 30,
    masteredVocabIds,
    learningVocabIds,
    completedLessonIds,
    examHistory,
    studyLog,
  };

  return { appUser, studentProfile };
}

// =============================================================================
// 1. COURSES & LESSONS CRUD
// =============================================================================

export async function fetchAllCoursesFromFirestore(): Promise<Course[]> {
  try {
    const coursesSnap = await getDocs(collection(db, 'courses'));
    if (coursesSnap.empty) return [];

    const coursesWithOrder = await Promise.all(
      coursesSnap.docs.map(async (courseDoc) => {
        const data = courseDoc.data();
        const lessonsSnap = await getDocs(collection(db, 'courses', courseDoc.id, 'lessons'));
        const lessons: Lesson[] = lessonsSnap.docs
          .map((lDoc) => {
            const ld = lDoc.data();
            return {
              id: String(ld.id || lDoc.id),
              courseId: String(ld.courseId || courseDoc.id),
              level: normalizeHSKLevel(ld.level),
              lessonNumber: Number(ld.lessonNumber || 1),
              title: String(ld.title || ''),
              vietnameseTitle: String(ld.vietnameseTitle || ''),
              durationMinutes: Number(ld.durationMinutes || 30),
              description: String(ld.description || ''),
              vocabulary: Array.isArray(ld.vocabulary) ? (ld.vocabulary as VocabItem[]) : [],
              grammar: Array.isArray(ld.grammar) ? (ld.grammar as GrammarPoint[]) : [],
              dialogue: Array.isArray(ld.dialogue) ? (ld.dialogue as DialogueLine[]) : [],
              practiceQuestions: Array.isArray(ld.practiceQuestions)
                ? (ld.practiceQuestions as PracticeQuestion[])
                : [],
            };
          })
          .sort((a, b) => a.lessonNumber - b.lessonNumber);

        const course: Course = {
          id: String(data.id || courseDoc.id),
          level: normalizeHSKLevel(data.level),
          title: String(data.title || ''),
          vietnameseTitle: String(data.vietnameseTitle || ''),
          description: String(data.description || ''),
          coverImage: typeof data.coverImage === 'string' ? data.coverImage : undefined,
          targetVocabCount: Number(data.targetVocabCount || 0),
          grammarPointsCount: Number(data.grammarPointsCount || 0),
          colorScheme: data.colorScheme || {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-700',
            badge: 'bg-red-600',
          },
          lessons,
        };
        return {
          course,
          orderIndex: typeof data.orderIndex === 'number' ? data.orderIndex : 999,
        };
      })
    );

    return coursesWithOrder
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((item) => item.course);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'courses');
  }
}

export async function saveCourseToFirestore(course: Course, orderIndex?: number): Promise<void> {
  const safeCourseId = sanitizeDocId(course.id, 'c');
  try {
    const courseRef = doc(db, 'courses', safeCourseId);
    const ops: BatchWriteOp[] = [
      { type: 'set', ref: courseRef, data: toCourseDoc({ ...course, id: safeCourseId }, orderIndex) },
    ];

    const existingLessonsSnap = await getDocs(collection(db, 'courses', safeCourseId, 'lessons'));
    const nextLessonIds = new Set<string>();

    for (const lesson of course.lessons || []) {
      const safeLessonId = sanitizeDocId(lesson.id, 'l');
      nextLessonIds.add(safeLessonId);
      ops.push({
        type: 'set',
        ref: doc(db, 'courses', safeCourseId, 'lessons', safeLessonId),
        data: toLessonDoc(safeCourseId, { ...lesson, id: safeLessonId }),
      });
    }

    for (const oldDoc of existingLessonsSnap.docs) {
      if (!nextLessonIds.has(oldDoc.id)) {
        ops.push({ type: 'delete', ref: oldDoc.ref });
      }
    }

    await commitChunkedBatches(ops);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `courses/${safeCourseId}`);
  }
}

export async function deleteCourseFromFirestore(courseId: string): Promise<void> {
  const safeCourseId = sanitizeDocId(courseId, 'c');
  try {
    const lessonsSnap = await getDocs(collection(db, 'courses', safeCourseId, 'lessons'));
    const ops: BatchWriteOp[] = lessonsSnap.docs.map((d) => ({ type: 'delete', ref: d.ref }));
    ops.push({ type: 'delete', ref: doc(db, 'courses', safeCourseId) });
    await commitChunkedBatches(ops);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `courses/${safeCourseId}`);
  }
}

export async function saveLessonToFirestore(courseId: string, lesson: Lesson): Promise<void> {
  const safeCourseId = sanitizeDocId(courseId, 'c');
  const safeLessonId = sanitizeDocId(lesson.id, 'l');
  try {
    await setDoc(
      doc(db, 'courses', safeCourseId, 'lessons', safeLessonId),
      toLessonDoc(safeCourseId, { ...lesson, id: safeLessonId })
    );
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      `courses/${safeCourseId}/lessons/${safeLessonId}`
    );
  }
}

export async function deleteLessonFromFirestore(courseId: string, lessonId: string): Promise<void> {
  const safeCourseId = sanitizeDocId(courseId, 'c');
  const safeLessonId = sanitizeDocId(lessonId, 'l');
  try {
    await deleteDoc(doc(db, 'courses', safeCourseId, 'lessons', safeLessonId));
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.DELETE,
      `courses/${safeCourseId}/lessons/${safeLessonId}`
    );
  }
}

// =============================================================================
// 2. VOCAB DECKS & 3,000+ VOCAB CARDS CRUD
// =============================================================================

export async function fetchAllVocabDecksFromFirestore(): Promise<VocabDeck[]> {
  try {
    const decksSnap = await getDocs(collection(db, 'vocabDecks'));
    if (decksSnap.empty) return [];

    const decks = await Promise.all(
      decksSnap.docs.map(async (deckDoc) => {
        const data = deckDoc.data();
        const cardsSnap = await getDocs(collection(db, 'vocabDecks', deckDoc.id, 'cards'));
        const cardsWithOrder = cardsSnap.docs.map((cDoc) => {
          const cd = cDoc.data();
          const card: VocabItem = {
            id: String(cd.id || cDoc.id),
            word: String(cd.word || ''),
            pinyin: String(cd.pinyin || ''),
            sinoVietnamese: String(cd.sinoVietnamese || ''),
            meaning: String(cd.meaning || ''),
            level: normalizeHSKLevel(cd.level),
            category: typeof cd.category === 'string' ? cd.category : undefined,
            radical: typeof cd.radical === 'string' ? cd.radical : undefined,
            strokeCount: typeof cd.strokeCount === 'number' ? cd.strokeCount : undefined,
            exampleSentence: String(cd.exampleSentence || ''),
            examplePinyin: String(cd.examplePinyin || ''),
            exampleMeaning: String(cd.exampleMeaning || ''),
            imageUrl: typeof cd.imageUrl === 'string' ? cd.imageUrl : undefined,
          };
          return {
            card,
            orderIndex: typeof cd.orderIndex === 'number' ? cd.orderIndex : 99999,
          };
        });

        cardsWithOrder.sort((a, b) => a.orderIndex - b.orderIndex);
        const cards = cardsWithOrder.map((c) => c.card);

        const deck: VocabDeck = {
          id: String(data.id || deckDoc.id),
          title: String(data.title || ''),
          vietnameseTitle: typeof data.vietnameseTitle === 'string' ? data.vietnameseTitle : undefined,
          description: String(data.description || ''),
          level: normalizeHSKLevel(data.level),
          category: String(data.category || 'HSK'),
          color: typeof data.color === 'string' ? data.color : undefined,
          createdAt: String(data.createdAt || new Date().toISOString().split('T')[0]),
          createdBy:
            data.createdBy === 'admin' || data.createdBy === 'ai' || data.createdBy === 'system'
              ? data.createdBy
              : 'admin',
          cardCount: cards.length,
          cards,
        };
        return deck;
      })
    );

    return decks;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'vocabDecks');
  }
}

export async function saveVocabDeckToFirestore(deck: VocabDeck): Promise<void> {
  const safeDeckId = sanitizeDocId(deck.id, 'deck');
  try {
    const deckRef = doc(db, 'vocabDecks', safeDeckId);
    const ops: BatchWriteOp[] = [
      { type: 'set', ref: deckRef, data: toVocabDeckDoc({ ...deck, id: safeDeckId }) },
    ];

    const existingCardsSnap = await getDocs(collection(db, 'vocabDecks', safeDeckId, 'cards'));
    const nextCardIds = new Set<string>();

    (deck.cards || []).forEach((card, idx) => {
      const safeCardId = sanitizeDocId(card.id, `v-${idx}`);
      nextCardIds.add(safeCardId);
      ops.push({
        type: 'set',
        ref: doc(db, 'vocabDecks', safeDeckId, 'cards', safeCardId),
        data: toVocabCardDoc(safeDeckId, { ...card, id: safeCardId }, idx),
      });
    });

    for (const oldDoc of existingCardsSnap.docs) {
      if (!nextCardIds.has(oldDoc.id)) {
        ops.push({ type: 'delete', ref: oldDoc.ref });
      }
    }

    await commitChunkedBatches(ops);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `vocabDecks/${safeDeckId}`);
  }
}

export async function deleteVocabDeckFromFirestore(deckId: string): Promise<void> {
  const safeDeckId = sanitizeDocId(deckId, 'deck');
  try {
    const cardsSnap = await getDocs(collection(db, 'vocabDecks', safeDeckId, 'cards'));
    const ops: BatchWriteOp[] = cardsSnap.docs.map((d) => ({ type: 'delete', ref: d.ref }));
    ops.push({ type: 'delete', ref: doc(db, 'vocabDecks', safeDeckId) });
    await commitChunkedBatches(ops);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `vocabDecks/${safeDeckId}`);
  }
}

export async function saveVocabCardToFirestore(
  deckId: string,
  card: VocabItem,
  newCardCount?: number,
  orderIndex?: number
): Promise<void> {
  const safeDeckId = sanitizeDocId(deckId, 'deck');
  const safeCardId = sanitizeDocId(card.id, 'v');
  try {
    await setDoc(
      doc(db, 'vocabDecks', safeDeckId, 'cards', safeCardId),
      toVocabCardDoc(safeDeckId, { ...card, id: safeCardId }, orderIndex)
    );
    if (typeof newCardCount === 'number') {
      const deckRef = doc(db, 'vocabDecks', safeDeckId);
      const deckSnap = await getDoc(deckRef);
      if (deckSnap.exists()) {
        await updateDoc(deckRef, {
          cardCount: clampNumber(newCardCount, 0, 50000, 0),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      `vocabDecks/${safeDeckId}/cards/${safeCardId}`
    );
  }
}

export async function deleteVocabCardFromFirestore(
  deckId: string,
  cardId: string,
  newCardCount?: number
): Promise<void> {
  const safeDeckId = sanitizeDocId(deckId, 'deck');
  const safeCardId = sanitizeDocId(cardId, 'v');
  try {
    await deleteDoc(doc(db, 'vocabDecks', safeDeckId, 'cards', safeCardId));
    if (typeof newCardCount === 'number') {
      const deckRef = doc(db, 'vocabDecks', safeDeckId);
      const deckSnap = await getDoc(deckRef);
      if (deckSnap.exists()) {
        await updateDoc(deckRef, {
          cardCount: clampNumber(newCardCount, 0, 50000, 0),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.DELETE,
      `vocabDecks/${safeDeckId}/cards/${safeCardId}`
    );
  }
}

// =============================================================================
// 3. EXAMS CRUD
// =============================================================================

export async function fetchAllExamsFromFirestore(): Promise<Exam[]> {
  try {
    const snap = await getDocs(collection(db, 'exams'));
    if (snap.empty) return [];
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: String(data.id || d.id),
        level: normalizeHSKLevel(data.level),
        title: String(data.title || ''),
        subtitle: String(data.subtitle || ''),
        timeLimitMinutes: Number(data.timeLimitMinutes || 40),
        passScore: Number(data.passScore || 120),
        totalPoints: Number(data.totalPoints || 200),
        questions: Array.isArray(data.questions) ? (data.questions as ExamQuestion[]) : [],
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'exams');
  }
}

export async function saveExamToFirestore(exam: Exam): Promise<void> {
  const safeId = sanitizeDocId(exam.id, 'exam');
  try {
    await setDoc(doc(db, 'exams', safeId), toExamDoc({ ...exam, id: safeId }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `exams/${safeId}`);
  }
}

export async function deleteExamFromFirestore(examId: string): Promise<void> {
  const safeId = sanitizeDocId(examId, 'exam');
  try {
    await deleteDoc(doc(db, 'exams', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `exams/${safeId}`);
  }
}

// =============================================================================
// 4. FORUM POSTS CRUD
// =============================================================================

export async function fetchAllForumPostsFromFirestore(): Promise<ForumPost[]> {
  try {
    const snap = await getDocs(collection(db, 'forumPosts'));
    if (snap.empty) return [];
    return snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: String(data.id || d.id),
          authorUid: typeof data.authorUid === 'string' ? data.authorUid : undefined,
          authorName: String(data.authorName || ''),
          authorAvatar: String(data.authorAvatar || ''),
          role:
            data.role === 'admin' || data.role === 'teacher' || data.role === 'student'
              ? data.role
              : 'student',
          title: String(data.title || ''),
          content: String(data.content || ''),
          level: VALID_FORUM_LEVELS.includes(data.level) ? data.level : 'HSK 1',
          category: VALID_FORUM_CATEGORIES.includes(data.category)
            ? data.category
            : 'Hỏi đáp chung',
          tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
          likes: Number(data.likes || 0),
          repliesCount: Number(data.repliesCount || 0),
          createdAt: String(data.createdAt || ''),
          isPinned: Boolean(data.isPinned),
          isSolved: Boolean(data.isSolved),
          replies: Array.isArray(data.replies) ? (data.replies as ForumReply[]) : [],
        } as ForumPost;
      })
      .sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'forumPosts');
  }
}

export async function createForumPostInFirestore(post: ForumPost): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const safeId = sanitizeDocId(post.id, 'fp');
  try {
    const isAdminUser = await isCurrentFirebaseUserAdmin();
    const docData = toForumPostDoc(
      {
        ...post,
        id: safeId,
        authorUid: uid,
        role: isAdminUser ? post.role : 'student',
        isPinned: isAdminUser ? Boolean(post.isPinned) : false,
      },
      uid
    );
    await setDoc(doc(db, 'forumPosts', safeId), docData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `forumPosts/${safeId}`);
  }
}

export async function likeForumPostInFirestore(postId: string): Promise<void> {
  if (!auth.currentUser) return;
  const safeId = sanitizeDocId(postId, 'fp');
  try {
    const ref = doc(db, 'forumPosts', safeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const currentLikes = Number(snap.data().likes || 0);
    await updateDoc(ref, {
      likes: currentLikes + 1,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `forumPosts/${safeId}`);
  }
}

export async function addForumReplyInFirestore(
  postId: string,
  reply: ForumReply,
  markSolvedIfAllowed = false
): Promise<void> {
  if (!auth.currentUser) return;
  const safeId = sanitizeDocId(postId, 'fp');
  try {
    const ref = doc(db, 'forumPosts', safeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    const existingReplies = Array.isArray(data.replies) ? data.replies : [];
    const currentRepliesCount = Number(data.repliesCount ?? existingReplies.length);

    const sanitizedReply: ForumReply = stripUndefined({
      id: sanitizeDocId(reply.id, 'fr'),
      authorName: clampString(reply.authorName, 120, 'Học viên') || 'Học viên',
      authorAvatar: clampString(reply.authorAvatar, 150000, ''),
      role: reply.role,
      content: clampString(reply.content, 5000, ''),
      createdAt: clampString(reply.createdAt, 64, new Date().toISOString()),
      likes: clampNumber(reply.likes, 0, 1000000, 0),
    });

    const isAdminUser = await isCurrentFirebaseUserAdmin();
    const isAuthor = data.authorUid === auth.currentUser.uid;
    const payload: Record<string, unknown> = {
      replies: [...existingReplies, sanitizedReply].slice(0, 200),
      repliesCount: currentRepliesCount + 1,
      updatedAt: new Date().toISOString(),
    };

    if (markSolvedIfAllowed && (isAdminUser || isAuthor)) {
      payload.isSolved = true;
    }

    await updateDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `forumPosts/${safeId}`);
  }
}

export async function toggleForumPostFlagInFirestore(
  postId: string,
  field: 'isPinned' | 'isSolved',
  nextValue: boolean
): Promise<void> {
  if (!auth.currentUser) return;
  const safeId = sanitizeDocId(postId, 'fp');
  try {
    const ref = doc(db, 'forumPosts', safeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    await updateDoc(ref, {
      [field]: nextValue,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `forumPosts/${safeId}`);
  }
}

// =============================================================================
// 5. SITE UI CONFIG CRUD
// =============================================================================

export async function fetchSiteConfigFromFirestore(): Promise<Partial<SiteUIConfig> | null> {
  try {
    const snap = await getDoc(doc(db, 'siteConfig', 'main'));
    if (!snap.exists()) return null;
    const data = snap.data();
    const { updatedAt: _ignore, ...rest } = data;
    return rest as Partial<SiteUIConfig>;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'siteConfig/main');
  }
}

export const MAX_SITE_CONFIG_BYTES = 950_000;

export function estimateSiteConfigBytes(config: SiteUIConfig): number {
  try {
    return new TextEncoder().encode(JSON.stringify(config)).length;
  } catch {
    return JSON.stringify(config).length;
  }
}

export async function saveSiteConfigToFirestore(config: SiteUIConfig): Promise<void> {
  const payload = toSiteConfigDoc(config);
  const totalBytes = new TextEncoder().encode(JSON.stringify(payload)).length;
  if (totalBytes > MAX_SITE_CONFIG_BYTES) {
    throw new Error(
      `Tổng dung lượng ảnh giao diện hiện tại (${Math.round(
        totalBytes / 1024
      )} KB) vượt giới hạn lưu trữ đám mây (950 KB). Vui lòng bấm "Dọn ảnh lỗi cũ" hoặc xóa bớt ảnh cũ trước khi tải thêm.`
    );
  }
  try {
    await setDoc(doc(db, 'siteConfig', 'main'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'siteConfig/main');
  }
}

// =============================================================================
// 6. USERS & LEARNING PROGRESS CRUD (PII ISOLATED)
// =============================================================================

export async function fetchUserAccountFromFirestore(
  userId: string
): Promise<{ appUser: AppUser; studentProfile: StudentProfile } | null> {
  const safeId = sanitizeDocId(userId, 'usr');
  try {
    const snap = await getDoc(doc(db, 'users', safeId));
    if (!snap.exists()) return null;
    return fromUserAccountDoc(snap.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${safeId}`);
  }
}

/**
 * Safely creates or updates the signed-in user's own `/users/{uid}` document.
 * Respects anti-escalation rules: non-admin updates only touch allowed profile & learning fields.
 */
export async function syncOwnUserAccountToFirestore(
  profile: StudentProfile,
  authUser: AuthUser
): Promise<void> {
  const fbUser = auth.currentUser;
  if (!fbUser) return;
  const uid = fbUser.uid;
  const ref = doc(db, 'users', uid);

  try {
    const snap = await getDoc(ref);
    const isAdminUser = await isCurrentFirebaseUserAdmin();
    const fullDoc = toUserAccountDoc(
      uid,
      { ...profile, id: uid, uid },
      {
        ...authUser,
        id: uid,
        uid,
        email: fbUser.email || authUser.email,
        role: isAdminUser ? authUser.role || 'admin' : 'student',
        status: 'active',
        provider: authUser.provider || 'google',
      }
    );

    if (!snap.exists()) {
      await setDoc(ref, fullDoc);
      return;
    }

    if (isAdminUser) {
      await updateDoc(ref, fullDoc);
      return;
    }

    // Owner update strictly scoped to non-privileged fields allowed by firestore.rules
    const ownerSafeUpdate = stripUndefined({
      uid: fullDoc.uid,
      name: fullDoc.name,
      avatar: fullDoc.avatar,
      level: fullDoc.level,
      targetLevel: fullDoc.targetLevel,
      streakDays: fullDoc.streakDays,
      lastActiveDate: fullDoc.lastActiveDate,
      xp: fullDoc.xp,
      reminderTime: fullDoc.reminderTime,
      reminderEnabled: fullDoc.reminderEnabled,
      dailyGoalMinutes: fullDoc.dailyGoalMinutes,
      masteredVocabIds: fullDoc.masteredVocabIds,
      learningVocabIds: fullDoc.learningVocabIds,
      completedLessonIds: fullDoc.completedLessonIds,
      examHistory: fullDoc.examHistory,
      studyLog: fullDoc.studyLog,
      completedLessons: fullDoc.completedLessons,
      examsTaken: fullDoc.examsTaken,
      avgScore: fullDoc.avgScore,
      updatedAt: fullDoc.updatedAt,
    });
    await updateDoc(ref, ownerSafeUpdate);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
}

export async function fetchAllUsersFromFirestore(): Promise<AppUser[]> {
  if (!isBootstrappedAdminSignedIn()) return [];
  try {
    const snap = await getDocs(collection(db, 'users'));
    if (snap.empty) return [];
    return snap.docs.map((d) => fromUserAccountDoc(d.data()).appUser);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }
}

export async function adminSaveUserToFirestore(
  userId: string,
  user: AppUser,
  existingProfile?: Partial<StudentProfile>
): Promise<void> {
  const safeId = sanitizeDocId(userId, 'usr');
  try {
    const ref = doc(db, 'users', safeId);
    const snap = await getDoc(ref);
    const prevData = snap.exists() ? fromUserAccountDoc(snap.data()).studentProfile : undefined;
    const mergedProfile: Partial<StudentProfile> = {
      ...(prevData || {}),
      ...(existingProfile || {}),
      name: user.name,
      email: user.email,
      avatar: user.avatar || prevData?.avatar || '',
      role: user.role,
      status: user.status,
      targetLevel: user.level,
      streakDays: user.streak ?? prevData?.streakDays ?? 1,
    };

    const userDoc = toUserAccountDoc(safeId, mergedProfile, { ...user, id: safeId });
    await setDoc(ref, userDoc);

    // Sync /admins/{uid} marker when bootstrapped admin promotes/demotes a Firebase UID
    const targetUid = user.uid || safeId;
    if (
      isBootstrappedAdminSignedIn() &&
      targetUid &&
      auth.currentUser &&
      targetUid !== auth.currentUser.uid
    ) {
      const adminRef = doc(db, 'admins', targetUid);
      if (user.role === 'admin' || user.role === 'teacher') {
        await setDoc(adminRef, {
          uid: targetUid,
          email: user.email.toLowerCase(),
          grantedAt: new Date().toISOString(),
        });
      } else {
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          await deleteDoc(adminRef);
        }
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${safeId}`);
  }
}

export async function adminDeleteUserFromFirestore(userId: string): Promise<void> {
  const safeId = sanitizeDocId(userId, 'usr');
  try {
    await deleteDoc(doc(db, 'users', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${safeId}`);
  }
}

// =============================================================================
// 7. INITIAL ONE-TIME SEED TO CLOUD FIRESTORE (ADMIN ONLY)
// =============================================================================

export interface SeedPayload {
  courses: Course[];
  vocabDecks: VocabDeck[];
  exams: Exam[];
  forumPosts: ForumPost[];
  siteUIConfig: SiteUIConfig;
}

export async function seedInitialDataToFirestoreIfEmpty(
  payload: SeedPayload
): Promise<{ seededCollections: string[] }> {
  const isAdminUser = await isCurrentFirebaseUserAdmin();
  if (!isAdminUser || !auth.currentUser) {
    return { seededCollections: [] };
  }

  const seededCollections: string[] = [];
  const adminUid = auth.currentUser.uid;
  let currentStep = 'seed/check';

  try {
    const [coursesSnap, decksSnap, examsSnap, forumSnap, siteSnap] = await Promise.all([
      getDocs(collection(db, 'courses')),
      getDocs(collection(db, 'vocabDecks')),
      getDocs(collection(db, 'exams')),
      getDocs(collection(db, 'forumPosts')),
      getDoc(doc(db, 'siteConfig', 'main')),
    ]);

    if (coursesSnap.empty && payload.courses.length > 0) {
      currentStep = 'seed/courses';
      const courseOps: BatchWriteOp[] = [];
      payload.courses.forEach((course, idx) => {
        const safeCourseId = sanitizeDocId(course.id, `c-${idx}`);
        courseOps.push({
          type: 'set',
          ref: doc(db, 'courses', safeCourseId),
          data: toCourseDoc({ ...course, id: safeCourseId }, idx),
        });
        (course.lessons || []).forEach((lesson) => {
          const safeLessonId = sanitizeDocId(lesson.id, 'l');
          courseOps.push({
            type: 'set',
            ref: doc(db, 'courses', safeCourseId, 'lessons', safeLessonId),
            data: toLessonDoc(safeCourseId, { ...lesson, id: safeLessonId }),
          });
        });
      });
      await commitChunkedBatches(courseOps);
      seededCollections.push('courses');
    }

    if (decksSnap.empty && payload.vocabDecks.length > 0) {
      currentStep = 'seed/vocabDecks';
      const deckOps: BatchWriteOp[] = [];
      payload.vocabDecks.forEach((deck, dIdx) => {
        const safeDeckId = sanitizeDocId(deck.id, `deck-${dIdx}`);
        deckOps.push({
          type: 'set',
          ref: doc(db, 'vocabDecks', safeDeckId),
          data: toVocabDeckDoc({ ...deck, id: safeDeckId }),
        });
        (deck.cards || []).forEach((card, cIdx) => {
          const safeCardId = sanitizeDocId(card.id, `v-${dIdx}-${cIdx}`);
          deckOps.push({
            type: 'set',
            ref: doc(db, 'vocabDecks', safeDeckId, 'cards', safeCardId),
            data: toVocabCardDoc(safeDeckId, { ...card, id: safeCardId }, cIdx),
          });
        });
      });
      await commitChunkedBatches(deckOps);
      seededCollections.push('vocabDecks');
    }

    if (examsSnap.empty && payload.exams.length > 0) {
      currentStep = 'seed/exams';
      const examOps: BatchWriteOp[] = payload.exams.map((exam, idx) => {
        const safeId = sanitizeDocId(exam.id, `exam-${idx}`);
        return {
          type: 'set',
          ref: doc(db, 'exams', safeId),
          data: toExamDoc({ ...exam, id: safeId }),
        };
      });
      await commitChunkedBatches(examOps);
      seededCollections.push('exams');
    }

    if (forumSnap.empty && payload.forumPosts.length > 0) {
      currentStep = 'seed/forumPosts';
      const forumOps: BatchWriteOp[] = payload.forumPosts.map((post, idx) => {
        const safeId = sanitizeDocId(post.id, `fp-${idx}`);
        return {
          type: 'set',
          ref: doc(db, 'forumPosts', safeId),
          data: toForumPostDoc({ ...post, id: safeId }, adminUid),
        };
      });
      await commitChunkedBatches(forumOps);
      seededCollections.push('forumPosts');
    }

    if (!siteSnap.exists()) {
      currentStep = 'seed/siteConfig';
      await setDoc(doc(db, 'siteConfig', 'main'), toSiteConfigDoc(payload.siteUIConfig));
      seededCollections.push('siteConfig');
    }

    return { seededCollections };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, currentStep);
  }
}

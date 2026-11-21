import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Router, type Request, type Response } from 'express';
import {
  db,
  hashPassword,
  verifyPassword,
  extractSessionToken,
} from '../dataStore.js';
import { AuthUser, AppUser, StudentProfile } from '../../src/types/hsk.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const OWNER_ADMIN_EMAIL = 'thangtv1.hyn@gmail.com';

function loadFirebaseWebConfig(): { apiKey?: string; projectId?: string } {
  try {
    const configPath = path.resolve(__dirname, '..', '..', 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (err) {
    console.warn('Unable to read firebase-applet-config.json:', err);
  }
  return {
    apiKey: process.env.FIREBASE_WEB_API_KEY,
    projectId: process.env.FIREBASE_PROJECT_ID,
  };
}

async function verifyFirebaseGoogleIdToken(idToken: string): Promise<{
  email: string;
  name: string;
  avatar: string;
}> {
  const cfg = loadFirebaseWebConfig();
  if (!cfg.apiKey) {
    throw new Error('Máy chủ chưa cấu hình Firebase Authentication để xác thực tài khoản Google.');
  }

  const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
    cfg.apiKey
  )}`;

  const res = await fetch(verifyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error('Phiên xác thực Google không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
  }

  const data: any = await res.json();
  const userRecord = Array.isArray(data?.users) ? data.users[0] : null;
  if (!userRecord || !userRecord.email) {
    throw new Error('Không thể xác minh thông tin tài khoản Google.');
  }

  const isGoogleProvider = Array.isArray(userRecord.providerUserInfo)
    ? userRecord.providerUserInfo.some((p: any) => p?.providerId === 'google.com')
    : false;

  if (!userRecord.emailVerified && !isGoogleProvider) {
    throw new Error('Tài khoản Google chưa được xác minh email.');
  }

  return {
    email: String(userRecord.email).trim().toLowerCase(),
    name: String(userRecord.displayName || userRecord.email.split('@')[0]).trim(),
    avatar: typeof userRecord.photoUrl === 'string' ? userRecord.photoUrl.trim() : '',
  };
}

function isSecureRequest(req: Request): boolean {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
  return req.secure || forwardedProto.includes('https');
}

function setSessionCookie(req: Request, res: Response, token: string): void {
  const cookieAttrs = isSecureRequest(req)
    ? `Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=${SESSION_MAX_AGE_SECONDS}`
    : `Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
  res.setHeader('Set-Cookie', `mixiang_session=${encodeURIComponent(token)}; ${cookieAttrs}`);
}

function clearSessionCookie(req: Request, res: Response): void {
  const cookieAttrs = isSecureRequest(req)
    ? 'Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=0'
    : 'Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
  res.setHeader('Set-Cookie', `mixiang_session=; ${cookieAttrs}`);
}

const DEFAULT_CARTOON_AVATAR_URL = '/assets/aistudio/icon2_d1d361e7.png';

function normalizeAvatarUrl(avatar?: string): string {
  if (!avatar || avatar.includes('images.unsplash.com/photo-')) {
    return DEFAULT_CARTOON_AVATAR_URL;
  }
  return avatar;
}

function buildAuthUser(appUser: AppUser, fallbackAvatar?: string): AuthUser {
  return {
    id: appUser.id,
    name: appUser.name,
    email: appUser.email,
    avatar: normalizeAvatarUrl(appUser.avatar || fallbackAvatar),
    provider: appUser.provider,
    role: appUser.role,
    status: appUser.status,
    targetLevel: appUser.level,
    joinedAt: appUser.joinedDate,
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Self-service User Registration
router.post('/register', (req, res) => {
  try {
    const { name, email, password, level = 'HSK 1' } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Họ tên, email và mật khẩu là bắt buộc' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Địa chỉ email không hợp lệ' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const existingUser = db.appUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existingUser) {
      return res.status(409).json({
        error:
          'Email này đã có tài khoản trên hệ thống. Vui lòng chuyển sang tab "Đăng nhập" (Mật khẩu mặc định: 123456) hoặc bấm "Đặt lại mật khẩu".',
      });
    }

    const newAppUser: AppUser = {
      id: `usr-${Date.now()}`,
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashPassword(String(password).trim()),
      avatar: DEFAULT_CARTOON_AVATAR_URL,
      role: 'student',
      status: 'active',
      level,
      provider: 'email',
      joinedDate: new Date().toISOString().split('T')[0],
      streak: 1,
      completedLessons: 0,
      examsTaken: 0,
      avgScore: 0,
    };

    db.appUsers.unshift(newAppUser);

    const authUser = buildAuthUser(newAppUser);
    db.users.unshift(authUser);

    const newProfile: StudentProfile = {
      id: newAppUser.id,
      name: newAppUser.name,
      email: newAppUser.email,
      avatar: authUser.avatar,
      targetLevel: level,
      streakDays: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      xp: 50,
      role: 'student',
      status: 'active',
      reminderTime: '20:30',
      reminderEnabled: true,
      dailyGoalMinutes: 30,
      masteredVocabIds: [],
      learningVocabIds: [],
      completedLessonIds: [],
      examHistory: [],
      studyLog: { [new Date().toISOString().split('T')[0]]: 5 },
    };
    db.students.unshift(newProfile);

    const session = db.createSession(authUser);
    db.saveUsersAndSessions();
    setSessionCookie(req, res, session.token);

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công! Chào mừng bạn gia nhập MiXiangg HSK.',
      token: session.token,
      user: authUser,
      profile: newProfile,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Email / Password Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu' });
    }

    const normalizedInput = String(email).trim().toLowerCase();
    const appUser = db.appUsers.find(
      (u) =>
        u.email.toLowerCase() === normalizedInput ||
        (!normalizedInput.includes('@') && u.email.toLowerCase().split('@')[0] === normalizedInput)
    );

    if (!appUser) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại trên hệ thống' });
    }

    if (appUser.status === 'suspended') {
      db.revokeUserSessions(appUser.email);
      return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' });
    }

    if (!appUser.password) {
      return res.status(401).json({
        error:
          'Tài khoản này sử dụng đăng nhập Google. Vui lòng bấm nút "Đăng nhập bằng tài khoản Google".',
      });
    }

    if (!verifyPassword(String(password), appUser.password)) {
      return res.status(401).json({
        error: 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.',
      });
    }

    // Upgrade plaintext password to scrypt hash if needed
    if (!appUser.password.startsWith('scrypt:')) {
      appUser.password = hashPassword(String(password).trim());
    }

    const normalizedEmail = appUser.email.toLowerCase();
    const authUser = buildAuthUser(appUser);
    const existingAuthIdx = db.users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);
    if (existingAuthIdx !== -1) {
      db.users.splice(existingAuthIdx, 1);
    }
    db.users.unshift(authUser);

    const profile = db.getActiveProfile(normalizedEmail);
    if (profile) {
      profile.avatar = authUser.avatar;
      profile.name = authUser.name;
    }
    const session = db.createSession(authUser);
    db.saveUsersAndSessions();
    setSessionCookie(req, res, session.token);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token: session.token,
      user: authUser,
      profile,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Self-service Reset / Set New Password by Email
router.post('/reset-password', (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu mới' });
    }

    const cleanPassword = String(newPassword).trim();
    if (cleanPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const normalizedInput = String(email).trim().toLowerCase();
    const appUser = db.appUsers.find(
      (u) =>
        u.email.toLowerCase() === normalizedInput ||
        (!normalizedInput.includes('@') && u.email.toLowerCase().split('@')[0] === normalizedInput)
    );

    if (!appUser) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản với email này trên hệ thống' });
    }

    if (appUser.status === 'suspended') {
      db.revokeUserSessions(appUser.email);
      return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' });
    }

    if (appUser.role === 'admin') {
      return res.status(403).json({
        error:
          'Tài khoản quản trị viên không hỗ trợ đặt lại mật khẩu công khai. Vui lòng đăng nhập bằng tài khoản Google chính chủ của bạn.',
      });
    }

    appUser.password = hashPassword(cleanPassword);

    const normalizedEmail = appUser.email.toLowerCase();
    const authUser = buildAuthUser(appUser);
    const existingAuthIdx = db.users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);
    if (existingAuthIdx !== -1) {
      db.users.splice(existingAuthIdx, 1);
    }
    db.users.unshift(authUser);

    const profile = db.getActiveProfile(normalizedEmail);
    if (profile) {
      profile.avatar = authUser.avatar;
      profile.name = authUser.name;
    }
    const session = db.createSession(authUser);
    db.saveUsersAndSessions();
    setSessionCookie(req, res, session.token);

    res.json({
      success: true,
      message: 'Đặt mật khẩu mới và đăng nhập thành công!',
      token: session.token,
      user: authUser,
      profile,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Register or Login with VERIFIED Google Account (Firebase ID Token required)
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken || typeof idToken !== 'string' || idToken.trim().length < 20) {
      return res.status(401).json({
        error: 'Thiếu mã xác thực Google hợp lệ. Vui lòng bấm "Đăng nhập với tài khoản Google".',
      });
    }

    let verified: { email: string; name: string; avatar: string };
    try {
      verified = await verifyFirebaseGoogleIdToken(idToken.trim());
    } catch (verifyErr: any) {
      return res.status(401).json({
        error: verifyErr?.message || 'Xác thực tài khoản Google thất bại. Vui lòng thử lại.',
      });
    }

    const normalizedEmail = verified.email;
    let appUser = db.appUsers.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!appUser) {
      const assignedRole = normalizedEmail === OWNER_ADMIN_EMAIL ? 'admin' : 'student';

      appUser = {
        id: `usr-${Date.now()}`,
        name: verified.name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password: '',
        avatar: normalizeAvatarUrl(verified.avatar),
        role: assignedRole,
        status: 'active',
        level: 'HSK 1',
        provider: 'google',
        joinedDate: new Date().toISOString().split('T')[0],
        streak: 1,
        completedLessons: 0,
        examsTaken: 0,
        avgScore: 0,
      };
      db.appUsers.unshift(appUser);
    }

    if (appUser.status === 'suspended') {
      db.revokeUserSessions(appUser.email);
      return res.status(403).json({
        error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
      });
    }

    const authUser = buildAuthUser(appUser, verified.avatar);
    const existingAuthIdx = db.users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);
    if (existingAuthIdx !== -1) {
      db.users.splice(existingAuthIdx, 1);
    }
    db.users.unshift(authUser);

    const profile = db.getActiveProfile(normalizedEmail);
    if (profile) {
      profile.avatar = authUser.avatar;
      profile.name = authUser.name;
    }
    const session = db.createSession(authUser);
    db.saveUsersAndSessions();
    setSessionCookie(req, res, session.token);

    res.json({
      success: true,
      message: `Đăng nhập Google thành công (${authUser.email})`,
      token: session.token,
      user: authUser,
      profile,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get current authenticated session & profile
router.get('/me', (req, res) => {
  const token = extractSessionToken(req);
  const session = db.getSession(token);

  if (!session) {
    return res.status(401).json({
      authenticated: false,
      error: 'Phiên đăng nhập không tồn tại hoặc đã đăng xuất',
      user: null,
      profile: null,
    });
  }

  const appUser = db.appUsers.find(
    (u) => u.id === session.userId || u.email.toLowerCase() === session.email.toLowerCase()
  );

  if (!appUser || appUser.status === 'suspended') {
    db.revokeSession(token);
    clearSessionCookie(req, res);
    return res.status(401).json({
      authenticated: false,
      error: appUser?.status === 'suspended' ? 'Tài khoản đã bị khóa' : 'Tài khoản không còn tồn tại',
      user: null,
      profile: null,
    });
  }

  const user = buildAuthUser(appUser);
  const profile = db.getActiveProfile(appUser.email);
  if (profile) {
    profile.avatar = user.avatar;
    profile.name = user.name;
  }

  res.json({
    authenticated: true,
    user,
    profile,
  });
});

// Update profile / password for current authenticated user
router.put('/profile', (req, res) => {
  try {
    const token = extractSessionToken(req);
    const session = db.getSession(token);
    if (!session) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập để cập nhật thông tin tài khoản.' });
    }

    const { email, name, avatar, targetLevel, level, password, currentPassword } = req.body;
    const sessionEmail = session.email.trim().toLowerCase();
    const requestedEmail = typeof email === 'string' ? email.trim().toLowerCase() : sessionEmail;

    // Non-admins can only update their own authenticated account
    const lookupEmail = session.role === 'admin' && requestedEmail ? requestedEmail : sessionEmail;
    const appUser = db.appUsers.find((u) => u.email.toLowerCase() === lookupEmail);

    if (!appUser) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin tài khoản' });
    }

    const targetEmail = appUser.email.toLowerCase();

    if (password !== undefined && password !== '') {
      if (String(password).trim().length < 6) {
        return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      }
      if (appUser.password && currentPassword) {
        if (!verifyPassword(String(currentPassword), appUser.password)) {
          return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
        }
      }
      appUser.password = hashPassword(String(password).trim());
    }

    const resolvedLevel = targetLevel || level;
    const cleanName = typeof name === 'string' && name.trim() ? name.trim() : undefined;
    const cleanAvatar = typeof avatar === 'string' && avatar.trim() ? avatar.trim() : undefined;

    if (cleanName) appUser.name = cleanName;
    if (cleanAvatar) appUser.avatar = cleanAvatar;
    if (resolvedLevel) appUser.level = resolvedLevel;

    for (const authUser of db.users) {
      if (authUser.id === appUser.id || authUser.email.toLowerCase() === targetEmail) {
        if (cleanName) authUser.name = cleanName;
        if (cleanAvatar) authUser.avatar = cleanAvatar;
        if (resolvedLevel) authUser.targetLevel = resolvedLevel;
      }
    }

    const studentProfile = db.getActiveProfile(targetEmail);
    if (studentProfile) {
      if (cleanName) studentProfile.name = cleanName;
      if (cleanAvatar) studentProfile.avatar = cleanAvatar;
      if (resolvedLevel) studentProfile.targetLevel = resolvedLevel;
    }

    // Ensure any duplicate student profile records matching id or email stay in sync
    for (const sp of db.students) {
      if (sp.id === appUser.id || sp.email.toLowerCase() === targetEmail) {
        if (cleanName) sp.name = cleanName;
        if (cleanAvatar) sp.avatar = cleanAvatar;
        if (resolvedLevel) sp.targetLevel = resolvedLevel;
      }
    }

    db.saveUsersAndSessions();

    res.json({
      success: true,
      message: 'Cập nhật thông tin tài khoản thành công',
      user: buildAuthUser(appUser),
      profile: studentProfile || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Logout - Revoke active session token & clear session cookie
router.post('/logout', (req, res) => {
  const token = extractSessionToken(req);
  const revoked = db.revokeSession(token);
  clearSessionCookie(req, res);
  res.json({
    success: true,
    authenticated: false,
    revoked,
    message: 'Đã đăng xuất thành công',
  });
});

export default router;

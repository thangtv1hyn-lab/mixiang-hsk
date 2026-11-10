import { Router } from 'express';
import { db } from '../dataStore.ts';
import { AuthUser, AppUser, StudentProfile } from '../../src/types/hsk.ts';

const router = Router();

// Self-service User Registration (Tự tạo tài khoản)
router.post('/register', (req, res) => {
  try {
    const { name, email, password, level = 'HSK 1' } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Họ tên, email và mật khẩu là bắt buộc' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = db.appUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'Email này đã được đăng ký trong hệ thống' });
    }

    const newAppUser: AppUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password,
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

    const authUser: AuthUser = {
      id: newAppUser.id,
      name: newAppUser.name,
      email: newAppUser.email,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      provider: 'email',
      role: 'student',
      status: 'active',
      targetLevel: level,
      joinedAt: new Date().toISOString(),
    };
    db.users.push(authUser);

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
    db.students.push(newProfile);

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công! Chào mừng bạn gia nhập MiXiangg HSK.',
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

    const normalizedEmail = email.trim().toLowerCase();
    const appUser = db.appUsers.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!appUser) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại trên hệ thống' });
    }

    if (appUser.status === 'suspended') {
      return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' });
    }

    // In a production environment with hashed passwords: verify bcrypt.
    // For this prototype, accept correct password or allow login if created without password
    if (appUser.password && appUser.password !== password) {
      return res.status(401).json({ error: 'Mật khẩu không chính xác' });
    }

    const authUser: AuthUser = {
      id: appUser.id,
      name: appUser.name,
      email: appUser.email,
      avatar: appUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      provider: appUser.provider,
      role: appUser.role,
      status: appUser.status,
      targetLevel: appUser.level,
      joinedAt: appUser.joinedDate,
    };

    let profile = db.students.find((s) => s.email.toLowerCase() === normalizedEmail);
    if (!profile) {
      profile = {
        id: appUser.id,
        name: appUser.name,
        email: appUser.email,
        avatar: authUser.avatar,
        targetLevel: appUser.level,
        streakDays: appUser.streak || 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        xp: 100,
        role: appUser.role,
        status: appUser.status,
        reminderTime: '20:30',
        reminderEnabled: true,
        dailyGoalMinutes: 30,
        masteredVocabIds: [],
        learningVocabIds: [],
        completedLessonIds: [],
        examHistory: [],
        studyLog: {},
      };
      db.students.push(profile);
    }

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: authUser,
      profile,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Register or Login with Google account
router.post('/google', (req, res) => {
  try {
    const { email, name, avatar } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email là bắt buộc' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let appUser = db.appUsers.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!appUser) {
      // Determine role: if matches thangtv1.hyn@gmail.com, make admin, else student
      const assignedRole = normalizedEmail === 'thangtv1.hyn@gmail.com' ? 'admin' : 'student';

      appUser = {
        id: `usr-${Date.now()}`,
        name: name || email.split('@')[0],
        email: normalizedEmail,
        avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        role: assignedRole,
        status: 'active',
        level: 'HSK 3',
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
      return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' });
    }

    const authUser: AuthUser = {
      id: appUser.id,
      name: appUser.name,
      email: appUser.email,
      avatar: appUser.avatar || avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      provider: 'google',
      role: appUser.role,
      status: appUser.status,
      targetLevel: appUser.level,
      joinedAt: appUser.joinedDate,
    };

    let profile = db.students.find((s) => s.email.toLowerCase() === normalizedEmail);
    if (!profile) {
      profile = {
        id: appUser.id,
        name: appUser.name,
        email: appUser.email,
        avatar: authUser.avatar,
        targetLevel: appUser.level,
        streakDays: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        xp: 100,
        role: appUser.role,
        status: appUser.status,
        reminderTime: '20:30',
        reminderEnabled: true,
        dailyGoalMinutes: 30,
        masteredVocabIds: [],
        learningVocabIds: [],
        completedLessonIds: [],
        examHistory: [],
        studyLog: { [new Date().toISOString().split('T')[0]]: 10 },
      };
      db.students.push(profile);
    }

    res.json({
      success: true,
      message: 'Đăng nhập Google thành công',
      user: authUser,
      profile,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Current user profile
router.get('/me', (req, res) => {
  const user = db.users[0] || null;
  const profile = db.students[0] || null;
  res.json({ user, profile });
});

// Update profile / password for current user
router.put('/profile', (req, res) => {
  try {
    const { email, name, avatar, targetLevel, password, currentPassword } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email người dùng là bắt buộc' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const appUser = db.appUsers.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!appUser) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin tài khoản' });
    }

    // If changing password, verify current password if set
    if (password) {
      if (appUser.password && currentPassword && appUser.password !== currentPassword) {
        return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
      }
      appUser.password = password;
    }

    if (name) appUser.name = name.trim();
    if (avatar) appUser.avatar = avatar;
    if (targetLevel) appUser.level = targetLevel;

    // Update in db.users & db.students
    const authUser = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (authUser) {
      if (name) authUser.name = name.trim();
      if (avatar) authUser.avatar = avatar;
      if (targetLevel) authUser.targetLevel = targetLevel;
    }

    const studentProfile = db.students.find((s) => s.email.toLowerCase() === normalizedEmail);
    if (studentProfile) {
      if (name) studentProfile.name = name.trim();
      if (avatar) studentProfile.avatar = avatar;
      if (targetLevel) studentProfile.targetLevel = targetLevel;
    }

    res.json({
      success: true,
      message: 'Cập nhật thông tin tài khoản thành công',
      user: {
        id: appUser.id,
        name: appUser.name,
        email: appUser.email,
        avatar: appUser.avatar,
        role: appUser.role,
        status: appUser.status,
        targetLevel: appUser.level,
        provider: appUser.provider,
        joinedAt: appUser.joinedDate,
      },
      profile: studentProfile || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Đã đăng xuất' });
});

export default router;

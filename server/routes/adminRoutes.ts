import { Router } from 'express';
import { db } from '../dataStore.ts';
import { AppUser, UserRole, UserStatus } from '../../src/types/hsk.ts';

const router = Router();

// Get list of all users for admin management and role assignment
router.get('/users', (req, res) => {
  const { q, role, status } = req.query;
  let users = db.appUsers;

  if (role && role !== 'all') {
    users = users.filter((u) => u.role === role);
  }

  if (status && status !== 'all') {
    users = users.filter((u) => u.status === status);
  }

  if (q && typeof q === 'string') {
    const query = q.toLowerCase();
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.level.toLowerCase().includes(query)
    );
  }

  res.json(users);
});

// Admin creates a new user directly with assigned role
router.post('/users', (req, res) => {
  try {
    const { name, email, password, role = 'student', status = 'active', level = 'HSK 1', note } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Họ tên và email là bắt buộc' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (db.appUsers.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return res.status(400).json({ error: 'Email này đã tồn tại trong hệ thống' });
    }

    const newUser: AppUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password: password || '123456',
      role: (role as UserRole) || 'student',
      status: (status as UserStatus) || 'active',
      level,
      provider: 'email',
      joinedDate: new Date().toISOString().split('T')[0],
      streak: 0,
      completedLessons: 0,
      examsTaken: 0,
      avgScore: 0,
      note,
    };

    db.appUsers.unshift(newUser);

    // Also add to db.students if student or teacher
    db.students.push({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      targetLevel: newUser.level,
      streakDays: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
      xp: 0,
      role: newUser.role,
      status: newUser.status,
      reminderTime: '20:30',
      reminderEnabled: true,
      dailyGoalMinutes: 30,
      masteredVocabIds: [],
      learningVocabIds: [],
      completedLessonIds: [],
      examHistory: [],
      studyLog: {},
    });

    res.status(201).json(newUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin updates role of a user
router.put('/users/:id/role', (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !['student', 'teacher', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Vai trò không hợp lệ (student, teacher, admin)' });
  }

  const user = db.appUsers.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }

  user.role = role as UserRole;

  // Sync with matching student profile if exists
  const student = db.students.find((s) => s.id === id || s.email === user.email);
  if (student) {
    student.role = role as UserRole;
  }

  // Sync with matching authUser
  const authUser = db.users.find((u) => u.id === id || u.email === user.email);
  if (authUser) {
    authUser.role = role as UserRole;
  }

  res.json({ success: true, message: `Đã cập nhật vai trò thành công: ${role}`, user });
});

// Admin toggles user status (active / suspended)
router.put('/users/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
  }

  const user = db.appUsers.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }

  user.status = status as UserStatus;

  const student = db.students.find((s) => s.id === id || s.email === user.email);
  if (student) {
    student.status = status as UserStatus;
  }

  res.json({ success: true, message: `Trạng thái đã cập nhật: ${status}`, user });
});

// Admin edits user information
router.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, level, role, status, password, note } = req.body;

  const userIndex = db.appUsers.findIndex((u) => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }

  const user = db.appUsers[userIndex];
  if (name) user.name = name;
  if (email) user.email = email.trim().toLowerCase();
  if (level) user.level = level;
  if (role) user.role = role;
  if (status) user.status = status;
  if (password) user.password = password;
  if (note !== undefined) user.note = note;

  // Sync student profile
  const student = db.students.find((s) => s.id === id || s.email === user.email);
  if (student) {
    if (name) student.name = name;
    if (level) student.targetLevel = level;
    if (role) student.role = role;
    if (status) student.status = status;
  }

  res.json({ success: true, user });
});

// Admin deletes a user
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  const index = db.appUsers.findIndex((u) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }

  const deletedUser = db.appUsers.splice(index, 1)[0];
  db.students = db.students.filter((s) => s.id !== id && s.email !== deletedUser.email);
  db.users = db.users.filter((u) => u.id !== id && u.email !== deletedUser.email);

  res.json({ success: true, message: 'Đã xóa người dùng khỏi hệ thống' });
});

// Legacy /students endpoint
router.get('/students', (req, res) => {
  res.json(db.appUsers);
});

// Get system-wide platform statistics
router.get('/stats', (req, res) => {
  const totalCourses = db.courses.length;
  const totalLessons = db.courses.reduce((acc, c) => acc + c.lessons.length, 0);
  const totalVocab = db.vocabularies.length;
  const totalDecks = db.vocabDecks.length;
  const totalExams = db.exams.length;
  const totalForumPosts = db.forumPosts.length;
  const totalUsers = db.appUsers.length;
  const adminCount = db.appUsers.filter((u) => u.role === 'admin').length;
  const teacherCount = db.appUsers.filter((u) => u.role === 'teacher').length;
  const studentCount = db.appUsers.filter((u) => u.role === 'student').length;

  res.json({
    totalCourses,
    totalLessons,
    totalVocab,
    totalDecks,
    totalExams,
    totalForumPosts,
    totalUsers,
    adminCount,
    teacherCount,
    studentCount,
    averageStreak: 18,
    completionRate: 92,
    passRate: 88,
  });
});

export default router;

import { Router } from 'express';
import { db } from '../dataStore.ts';
import { Course, Lesson } from '../../src/types/hsk.ts';

const router = Router();

// Get all courses (HSK 1 - 5)
router.get('/', (req, res) => {
  const { level } = req.query;
  let result = db.courses;
  if (level && level !== 'ALL') {
    result = result.filter((c) => c.level === level);
  }
  res.json(result);
});

// Get single course by ID
router.get('/:id', (req, res) => {
  const course = db.courses.find((c) => c.id === req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Không tìm thấy khóa học' });
  }
  res.json(course);
});

// Admin: Create new course (preserve client-supplied ID if provided)
router.post('/', (req, res) => {
  try {
    const {
      id,
      level,
      title,
      vietnameseTitle,
      description,
      coverImage,
      targetVocabCount,
      grammarPointsCount,
      colorScheme,
      lessons,
    } = req.body;
    if (!title || !level) {
      return res.status(400).json({ error: 'Tiêu đề và cấp độ là bắt buộc' });
    }

    const newCourse: Course = {
      id: id || `c-custom-${Date.now()}`,
      level,
      title: String(title).trim(),
      vietnameseTitle: vietnameseTitle || title,
      description: description || `Khóa học chuẩn ${level}`,
      coverImage: coverImage || undefined,
      targetVocabCount: Number(targetVocabCount) || 300,
      grammarPointsCount: Number(grammarPointsCount) || 50,
      colorScheme: colorScheme || {
        bg: 'from-rose-500/10 to-red-500/10',
        border: 'border-rose-400',
        text: 'text-rose-700',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
      },
      lessons: Array.isArray(lessons) ? lessons : [],
    };

    const existingIdx = db.courses.findIndex((c) => c.id === newCourse.id);
    if (existingIdx !== -1) {
      db.courses[existingIdx] = newCourse;
    } else {
      db.courses.unshift(newCourse);
    }
    db.save();

    res.status(201).json(newCourse);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update course
router.put('/:id', (req, res) => {
  const index = db.courses.findIndex((c) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy khóa học' });
  }

  db.courses[index] = {
    ...db.courses[index],
    ...req.body,
    id: db.courses[index].id,
  };
  db.save();

  res.json(db.courses[index]);
});

// Admin: Delete course
router.delete('/:id', (req, res) => {
  const index = db.courses.findIndex((c) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy khóa học' });
  }
  const deleted = db.courses.splice(index, 1);
  db.save();
  res.json({ success: true, deleted: deleted[0] });
});

// Admin: Add lesson to course (preserve client-supplied ID if provided)
router.post('/:courseId/lessons', (req, res) => {
  try {
    const course = db.courses.find((c) => c.id === req.params.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Không tìm thấy khóa học' });
    }

    const {
      id,
      lessonNumber,
      title,
      vietnameseTitle,
      durationMinutes,
      description,
      vocabulary = [],
      grammar = [],
      dialogue = [],
      practiceQuestions = [],
    } = req.body;

    const newLesson: Lesson = {
      id: id || `l-custom-${Date.now()}`,
      courseId: course.id,
      level: course.level,
      lessonNumber: Number(lessonNumber) || course.lessons.length + 1,
      title: title || 'Bài học mới',
      vietnameseTitle: vietnameseTitle || title || 'Bài học mới',
      durationMinutes: Number(durationMinutes) || 30,
      description: description || '',
      vocabulary,
      grammar,
      dialogue,
      practiceQuestions,
    };

    const existingIdx = course.lessons.findIndex((l) => l.id === newLesson.id);
    if (existingIdx !== -1) {
      course.lessons[existingIdx] = newLesson;
    } else {
      course.lessons.push(newLesson);
    }
    db.save();

    res.status(201).json(newLesson);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update lesson in course
router.put('/:courseId/lessons/:lessonId', (req, res) => {
  try {
    const course = db.courses.find((c) => c.id === req.params.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Không tìm thấy khóa học' });
    }

    const lessonIdx = course.lessons.findIndex((l) => l.id === req.params.lessonId);
    if (lessonIdx === -1) {
      return res.status(404).json({ error: 'Không tìm thấy bài học' });
    }

    course.lessons[lessonIdx] = {
      ...course.lessons[lessonIdx],
      ...req.body,
      id: course.lessons[lessonIdx].id,
      courseId: course.id,
    };
    db.save();

    res.json(course.lessons[lessonIdx]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete lesson from course
router.delete('/:courseId/lessons/:lessonId', (req, res) => {
  const course = db.courses.find((c) => c.id === req.params.courseId);
  if (!course) {
    return res.status(404).json({ error: 'Không tìm thấy khóa học' });
  }

  const lessonIdx = course.lessons.findIndex((l) => l.id === req.params.lessonId);
  if (lessonIdx === -1) {
    return res.status(404).json({ error: 'Không tìm thấy bài học' });
  }

  const deletedLesson = course.lessons.splice(lessonIdx, 1);
  db.save();
  res.json({ success: true, deleted: deletedLesson[0] });
});

// Student: Mark lesson as completed
router.post('/lessons/:id/complete', (req, res) => {
  const lessonId = req.params.id;
  const profile = db.getActiveProfile(req);

  if (!profile.completedLessonIds.includes(lessonId)) {
    profile.completedLessonIds.push(lessonId);
    profile.xp += 50;

    const today = new Date().toISOString().split('T')[0];
    profile.studyLog[today] = (profile.studyLog[today] || 0) + 20;
  }

  db.syncProfileToAppUser(profile);

  res.json({
    success: true,
    message: 'Hoàn thành bài học (+50 XP)',
    completedLessonIds: profile.completedLessonIds,
    xp: profile.xp,
    studyLog: profile.studyLog,
  });
});

export default router;

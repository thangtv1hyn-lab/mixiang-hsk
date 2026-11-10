import { Router } from 'express';
import { db } from '../dataStore.ts';
import { Course, Lesson } from '../../src/types/hsk.ts';

const router = Router();

// Get all courses (HSK 1 - 5)
router.get('/', (req, res) => {
  const { level } = req.query;
  let result = db.courses;
  if (level) {
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

// Admin: Create new course
router.post('/', (req, res) => {
  try {
    const { level, title, vietnameseTitle, description, targetVocabCount, grammarPointsCount } = req.body;
    if (!title || !level) {
      return res.status(400).json({ error: 'Tiêu đề và cấp độ là bắt buộc' });
    }

    const newCourse: Course = {
      id: `c-custom-${Date.now()}`,
      level,
      title,
      vietnameseTitle: vietnameseTitle || title,
      description: description || `Khóa học chuẩn ${level}`,
      targetVocabCount: Number(targetVocabCount) || 300,
      grammarPointsCount: Number(grammarPointsCount) || 50,
      colorScheme: {
        bg: 'from-rose-500/10 to-red-500/10',
        border: 'border-rose-400',
        text: 'text-rose-700',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
      },
      lessons: [],
    };

    db.courses.unshift(newCourse);
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
  };

  res.json(db.courses[index]);
});

// Admin: Delete course
router.delete('/:id', (req, res) => {
  const index = db.courses.findIndex((c) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy khóa học' });
  }
  const deleted = db.courses.splice(index, 1);
  res.json({ success: true, deleted: deleted[0] });
});

// Admin: Add lesson to course
router.post('/:courseId/lessons', (req, res) => {
  try {
    const course = db.courses.find((c) => c.id === req.params.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Không tìm thấy khóa học' });
    }

    const {
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
      id: `l-custom-${Date.now()}`,
      courseId: course.id,
      level: course.level,
      lessonNumber: course.lessons.length + 1,
      title: title || 'Bài học mới',
      vietnameseTitle: vietnameseTitle || title || 'Bài học mới',
      durationMinutes: Number(durationMinutes) || 30,
      description: description || '',
      vocabulary,
      grammar,
      dialogue,
      practiceQuestions,
    };

    course.lessons.push(newLesson);
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
    };

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
  res.json({ success: true, deleted: deletedLesson[0] });
});

// Student: Mark lesson as completed
router.post('/lessons/:id/complete', (req, res) => {
  const lessonId = req.params.id;
  const profile = db.getActiveProfile();

  if (!profile.completedLessonIds.includes(lessonId)) {
    profile.completedLessonIds.push(lessonId);
    profile.xp += 50;

    const today = new Date().toISOString().split('T')[0];
    profile.studyLog[today] = (profile.studyLog[today] || 0) + 20;
  }

  res.json({
    success: true,
    message: 'Hoàn thành bài học (+50 XP)',
    completedLessonIds: profile.completedLessonIds,
    xp: profile.xp,
  });
});

export default router;

import {
  INITIAL_COURSES,
  INITIAL_EXAMS,
  INITIAL_FORUM_POSTS,
  INITIAL_STUDENT_PROFILE,
  INITIAL_VOCABULARY,
  INITIAL_VOCAB_DECKS,
  INITIAL_APP_USERS,
  MOCK_STUDENTS_LIST,
} from '../src/data/initialData.ts';
import {
  Course,
  Exam,
  ExamResult,
  ForumPost,
  Lesson,
  StudentProfile,
  VocabItem,
  AuthUser,
  AppUser,
  VocabDeck,
} from '../src/types/hsk.ts';

// In-Memory Database store with pre-seeded rich HSK 1-5 data
class HSKDataStore {
  courses: Course[] = JSON.parse(JSON.stringify(INITIAL_COURSES));
  exams: Exam[] = JSON.parse(JSON.stringify(INITIAL_EXAMS));
  vocabularies: VocabItem[] = JSON.parse(JSON.stringify(INITIAL_VOCABULARY));
  vocabDecks: VocabDeck[] = JSON.parse(JSON.stringify(INITIAL_VOCAB_DECKS));
  forumPosts: ForumPost[] = JSON.parse(JSON.stringify(INITIAL_FORUM_POSTS));
  students: StudentProfile[] = [JSON.parse(JSON.stringify(INITIAL_STUDENT_PROFILE))];
  appUsers: AppUser[] = JSON.parse(JSON.stringify(INITIAL_APP_USERS));
  users: AuthUser[] = [
    {
      id: 'usr-admin-1',
      name: 'Thắng Trần (Quản trị viên)',
      email: 'thangtv1.hyn@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      provider: 'google',
      role: 'admin',
      targetLevel: 'HSK 5',
      joinedAt: new Date().toISOString(),
    },
  ];

  // Helper to get active profile
  getActiveProfile(userId?: string): StudentProfile {
    return this.students[0];
  }
}

export const db = new HSKDataStore();

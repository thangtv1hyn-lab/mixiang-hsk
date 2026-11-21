export type HSKLevel = 'HSK 1' | 'HSK 2' | 'HSK 3' | 'HSK 4' | 'HSK 5';

export interface VocabItem {
  id: string;
  word: string;
  pinyin: string;
  sinoVietnamese: string; // Âm Hán Việt
  meaning: string;
  level: HSKLevel;
  category?: string;
  radical?: string; // Bộ thủ
  strokeCount?: number;
  exampleSentence: string;
  examplePinyin: string;
  exampleMeaning: string;
  imageUrl?: string;
}

export interface GrammarPoint {
  id: string;
  title: string;
  structure: string;
  explanation: string;
  examples: Array<{
    hanzi: string;
    pinyin: string;
    translation: string;
  }>;
}

export interface DialogueLine {
  id: string;
  speaker: string;
  avatar?: string;
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

export interface PracticeQuestion {
  id: string;
  type: 'single_choice' | 'sentence_reorder' | 'fill_blank';
  question: string;
  pinyin?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  level: HSKLevel;
  lessonNumber: number;
  title: string;
  vietnameseTitle: string;
  durationMinutes: number;
  description: string;
  vocabulary: VocabItem[];
  grammar: GrammarPoint[];
  dialogue: DialogueLine[];
  practiceQuestions: PracticeQuestion[];
}

export interface Course {
  id: string;
  level: HSKLevel;
  title: string;
  vietnameseTitle: string;
  description: string;
  coverImage?: string;
  targetVocabCount: number;
  grammarPointsCount: number;
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    badge: string;
  };
  lessons: Lesson[];
}

export type ExamQuestionType = 'choice' | 'fill_blank' | 'writing' | 'speaking';

export interface ExamQuestion {
  id: string;
  section: 'listening' | 'reading' | 'writing' | 'speaking';
  questionType?: ExamQuestionType; // default 'choice'
  question: string;
  pinyin?: string;
  audioPrompt?: string; // Content read out by TTS for listening test
  options?: string[]; // choices for multiple choice
  correctAnswer?: number; // 0..3 for choice
  correctText?: string; // target text for fill_blank, writing, speaking
  explanation: string;
}

export interface Exam {
  id: string;
  level: HSKLevel;
  title: string;
  subtitle: string;
  timeLimitMinutes: number;
  passScore: number; // e.g. 180 on 300 scale
  totalPoints: number;
  questions: ExamQuestion[];
}

export interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  level: HSKLevel;
  date: string;
  listeningScore: number;
  readingScore: number;
  writingScore: number;
  speakingScore?: number;
  totalScore: number;
  maxScore: number;
  passed: boolean;
  timeSpentSeconds: number;
  userAnswers: { [questionId: string]: number | string };
}

export interface ForumReply {
  id: string;
  authorName: string;
  authorAvatar: string;
  role: 'student' | 'teacher' | 'admin' | 'ai';
  content: string;
  createdAt: string;
  likes: number;
}

export interface ForumPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  role: 'student' | 'teacher' | 'admin';
  title: string;
  content: string;
  level: HSKLevel | 'Toàn bộ';
  category: 'Ngữ pháp' | 'Từ vựng' | 'Kinh nghiệm thi' | 'Chữa bài' | 'Hỏi đáp chung';
  tags: string[];
  likes: number;
  repliesCount: number;
  createdAt: string;
  isPinned?: boolean;
  isSolved?: boolean;
  replies: ForumReply[];
}

export type UserRole = 'student' | 'teacher' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  level: HSKLevel;
  password?: string;
  provider: 'email' | 'google';
  joinedDate: string;
  streak?: number;
  completedLessons?: number;
  examsTaken?: number;
  avgScore?: number;
  note?: string;
}

export interface VocabDeck {
  id: string;
  title: string;
  vietnameseTitle?: string;
  description: string;
  level: HSKLevel;
  category: string;
  color?: string; // 'rose' | 'amber' | 'emerald' | 'blue' | 'purple' | 'indigo'
  createdAt: string;
  createdBy: 'admin' | 'ai' | 'system';
  cardCount?: number;
  cards: VocabItem[];
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  targetLevel: HSKLevel;
  streakDays: number;
  lastActiveDate: string;
  xp: number;
  role: UserRole;
  status?: UserStatus;
  reminderTime: string;
  reminderEnabled: boolean;
  dailyGoalMinutes: number;
  masteredVocabIds: string[];
  learningVocabIds: string[];
  completedLessonIds: string[];
  examHistory: ExamResult[];
  studyLog: { [dateStr: string]: number }; // date (YYYY-MM-DD) -> minutes
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'email';
  role: UserRole;
  status?: UserStatus;
  targetLevel?: HSKLevel;
  joinedAt: string;
}

export interface ClassroomMomentItem {
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  date: string;
  location: string;
  image: string;
}

export interface SiteUIConfig {
  // Theme & Typography
  primaryColor: string;
  canvasColor: string;
  fontScale: '13.5px' | '14px' | '15px';

  // Brand & Header
  headerLogoUrl?: string;
  brandName: string;
  brandHighlight: string;
  brandSubtitle: string;

  // Hero Section
  heroBadge: string;
  heroTitleLine1: string;
  heroTitleHighlight: string;
  heroTitleLine3: string;
  heroDescription: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;

  // Section 3: Đồng Hành Cùng Giảng Viên (2 Posters) & Admission Banner
  posterSectionBadge: string;
  posterSectionTitle: string;
  posterSectionSubtitle: string;
  poster1Url: string;
  poster1Caption: string;
  poster2Url: string;
  poster2Caption: string;
  admissionBadge: string;
  admissionTitle: string;
  admissionDescription: string;
  admissionCta: string;

  // Section 4: Khoảnh Khắc Cùng Lớp Học (Kỷ Niệm Đáng Nhớ)
  momentsSectionBadge: string;
  momentsSectionTitle: string;
  momentsSectionSubtitle: string;
  classroomMoments: ClassroomMomentItem[];

  // Section Visibility
  showCoursesSection: boolean;
  showPostersSection: boolean;
  showAdmissionBanner: boolean;
  showMomentsSection: boolean;

  // Footer Info (Matching Banner Card Design)
  footerLogoUrl: string;
  footerTitle: string;
  footerSubtitle: string;
  hotline: string;
  footerCtaText: string;
  facebook: string;
  copyrightText: string;
  motto: string;
}




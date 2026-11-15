import React, { useState } from 'react';
import {
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Users,
  PlusCircle,
  Trash2,
  Edit3,
  Sparkles,
  BarChart3,
  FileCheck2,
  CheckCircle2,
  Plus,
  Search,
  Download,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Shield,
  UserCheck,
  Volume2,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useHSK } from '../context/HSKContext';
import {
  Course,
  Exam,
  ExamQuestion,
  HSKLevel,
  Lesson,
  VocabItem,
  VocabDeck,
  AppUser,
  UserRole,
  UserStatus,
} from '../types/hsk';
import { MOCK_STUDENTS_LIST } from '../data/initialData';
import { EditCourseModal } from './admin/EditCourseModal';
import { LessonEditorModal } from './admin/LessonEditorModal';
import { ExamEditorModal } from './admin/ExamEditorModal';
import { DeckEditorModal } from './admin/DeckEditorModal';
import { CardEditorModal } from './admin/CardEditorModal';
import { AIFlashcardGeneratorModal } from './admin/AIFlashcardGeneratorModal';
import { UserManagementModal } from './admin/UserManagementModal';
import { speakChinese } from '../utils/audioSpeech';

export const AdminDashboard: React.FC = () => {
  const {
    courses,
    addCourse,
    updateCourse,
    deleteCourse,
    addLesson,
    updateLesson,
    deleteLesson,
    exams,
    addExam,
    updateExam,
    deleteExam,
    vocabDecks,
    addVocabDeck,
    updateVocabDeck,
    deleteVocabDeck,
    addCardToDeck,
    updateCardInDeck,
    deleteCardFromDeck,
    appUsers,
    addUserAdmin,
    updateUserRoleAdmin,
    updateUserStatusAdmin,
    updateUserAdmin,
    deleteUserAdmin,
    userRole,
    setActiveTab,
  } = useHSK();

  const [activeAdminTab, setActiveAdminTab] = useState<'courses' | 'exams' | 'decks' | 'users' | 'students_tracking' | 'overview'>('courses');

  // Modal states for Course, Lesson, and Exam editors
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false);

  const [courseForLessonEditor, setCourseForLessonEditor] = useState<Course | null>(null);
  const [lessonToEdit, setLessonToEdit] = useState<Lesson | null>(null);
  const [isLessonEditorOpen, setIsLessonEditorOpen] = useState(false);

  const [examToEdit, setExamToEdit] = useState<Exam | null>(null);
  const [isExamEditorOpen, setIsExamEditorOpen] = useState(false);

  // Modal states for Decks and Flashcards
  const [deckToEdit, setDeckToEdit] = useState<VocabDeck | null>(null);
  const [isDeckEditorOpen, setIsDeckEditorOpen] = useState(false);
  const [isAIFlashcardModalOpen, setIsAIFlashcardModalOpen] = useState(false);

  const [deckForCardModal, setDeckForCardModal] = useState<VocabDeck | null>(null);
  const [cardToEdit, setCardToEdit] = useState<VocabItem | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  const [expandedDeckId, setExpandedDeckId] = useState<string | null>(null);
  const [deckLevelFilter, setDeckLevelFilter] = useState<HSKLevel | 'ALL'>('ALL');

  // Modal states for User Management & Role Assignment
  const [userToEdit, setUserToEdit] = useState<AppUser | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | UserStatus>('all');

  // Course creation state
  const [isAddCourseModal, setIsAddCourseModal] = useState(false);
  const [courseLevel, setCourseLevel] = useState<HSKLevel>('HSK 3');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');

  // Lesson creation state
  const [isAddLessonModal, setIsAddLessonModal] = useState(false);
  const [selectedCourseForLesson, setSelectedCourseForLesson] = useState<string>(courses[0]?.id || '');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonVnTitle, setLessonVnTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonDuration, setLessonDuration] = useState(30);
  const [isGeneratingAiLesson, setIsGeneratingAiLesson] = useState(false);
  const [aiTopicPrompt, setAiTopicPrompt] = useState('Giao tiếp trong văn phòng làm việc');

  // Exam creation state
  const [isAddExamModal, setIsAddExamModal] = useState(false);
  const [examLevel, setExamLevel] = useState<HSKLevel>('HSK 2');
  const [examTitle, setExamTitle] = useState('');
  const [examSubtitle, setExamSubtitle] = useState('');
  const [examTime, setExamTime] = useState(25);
  const [examPassScore, setExamPassScore] = useState(120);
  const [examTotalPoints, setExamTotalPoints] = useState(200);

  // Student search & backend sync
  const [studentSearch, setStudentSearch] = useState('');
  const [studentsList, setStudentsList] = useState(MOCK_STUDENTS_LIST);
  const [serverStats, setServerStats] = useState<{
    totalCourses?: number;
    totalLessons?: number;
    totalVocab?: number;
    totalExams?: number;
    activeStudentsCount?: number;
    averageStreak?: number;
    completionRate?: number;
    passRate?: number;
  }>({});

  React.useEffect(() => {
    fetch('/api/admin/students')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setStudentsList(data);
      })
      .catch(() => {});

    fetch('/api/admin/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setServerStats(data);
      })
      .catch(() => {});
  }, []);

  // Handle Create Course
  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) return;

    const newCourse: Course = {
      id: `c-custom-${Date.now()}`,
      level: courseLevel,
      title: courseTitle,
      vietnameseTitle: courseTitle,
      description: courseDesc || `Khóa học chuyên sâu ${courseLevel}`,
      targetVocabCount: 300,
      grammarPointsCount: 50,
      colorScheme: {
        bg: 'from-rose-500/10 to-red-500/10',
        border: 'border-rose-400',
        text: 'text-rose-700',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
      },
      lessons: [],
    };

    addCourse(newCourse);
    setCourseTitle('');
    setCourseDesc('');
    setIsAddCourseModal(false);
  };

  // AI Generate Lesson
  const handleAiGenerateLesson = async () => {
    setIsGeneratingAiLesson(true);
    try {
      const response = await fetch('/api/gemini/admin-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lesson',
          topic: aiTopicPrompt,
          level: courseLevel,
        }),
      });

      const data = await response.json();
      if (data.title) {
        setLessonTitle(data.title);
        setLessonVnTitle(data.title);
      }
      if (data.description) {
        setLessonDesc(data.description);
      }
    } catch (err) {
      console.error('AI generate lesson err:', err);
      setLessonTitle(`第X课：${aiTopicPrompt}`);
      setLessonVnTitle(`Bài học chủ đề: ${aiTopicPrompt}`);
      setLessonDesc(`Nắm vững từ vựng và mẫu câu thường gặp về chủ đề ${aiTopicPrompt}.`);
    } finally {
      setIsGeneratingAiLesson(false);
    }
  };

  // Handle Create Lesson
  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim()) return;

    const course = courses.find((c) => c.id === selectedCourseForLesson) || courses[0];
    const newLesson: Lesson = {
      id: `l-custom-${Date.now()}`,
      courseId: selectedCourseForLesson,
      level: course?.level || 'HSK 1',
      lessonNumber: (course?.lessons.length || 0) + 1,
      title: lessonTitle,
      vietnameseTitle: lessonVnTitle || lessonTitle,
      durationMinutes: Number(lessonDuration),
      description: lessonDesc || 'Bài học thực hành mới',
      vocabulary: [
        {
          id: `v-custom-${Date.now()}`,
          word: '学习',
          pinyin: 'xuéxí',
          sinoVietnamese: 'Học tập',
          meaning: 'Học tập, nghiên cứu',
          level: course?.level || 'HSK 1',
          exampleSentence: '我们每天都在努力学习汉语。',
          examplePinyin: 'Wǒmen měitiān dōu zài nǔlì xuéxí Hànyǔ.',
          exampleMeaning: 'Chúng tôi mỗi ngày đều nỗ lực học tiếng Trung.',
        },
      ],
      grammar: [
        {
          id: `g-custom-${Date.now()}`,
          title: 'Điểm ngữ pháp bài học mới',
          structure: 'Chủ ngữ + Động từ + Tân ngữ',
          explanation: 'Cấu trúc câu khẳng định cơ bản trong tiếng Hán.',
          examples: [
            { hanzi: '我学中文。', pinyin: 'Wǒ xué Zhōngwén.', translation: 'Tôi học tiếng Trung.' },
          ],
        },
      ],
      dialogue: [
        {
          id: `d-custom-${Date.now()}`,
          speaker: 'A',
          chinese: '你好，你在学习什么？',
          pinyin: 'Nǐ hǎo, nǐ zài xuéxí shénme?',
          vietnamese: 'Xin chào, bạn đang học gì thế?',
        },
        {
          id: `d-custom-${Date.now()}-2`,
          speaker: 'B',
          chinese: '我在学习汉语，很有意思！',
          pinyin: 'Wǒ zài xuéxí Hànyǔ, hěn yǒu yìsi!',
          vietnamese: 'Tôi đang học tiếng Trung, rất thú vị!',
        },
      ],
      practiceQuestions: [
        {
          id: `pq-custom-${Date.now()}`,
          type: 'single_choice',
          question: 'Chọn câu viết đúng:',
          options: ['A. 我学汉语', 'B. 汉语我学', 'C. 学我汉语', 'D. 我汉语学'],
          correctAnswer: 0,
          explanation: 'Trật tự câu cơ bản: Chủ ngữ (我) + Động từ (学) + Tân ngữ (汉语).',
        },
      ],
    };

    addLesson(selectedCourseForLesson, newLesson);
    setLessonTitle('');
    setLessonVnTitle('');
    setLessonDesc('');
    setIsAddLessonModal(false);
  };

  // Handle Create Exam
  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim()) return;

    const newExam: Exam = {
      id: `exam-custom-${Date.now()}`,
      level: examLevel,
      title: examTitle,
      subtitle: examSubtitle || `Đề kiểm tra định kỳ chuẩn ${examLevel}`,
      timeLimitMinutes: Number(examTime),
      passScore: Number(examPassScore),
      totalPoints: Number(examTotalPoints),
      questions: [
        {
          id: `q-c1-${Date.now()}`,
          section: 'listening',
          question: 'Nghe đoạn ghi âm và chọn câu trả lời đúng:',
          pinyin: 'Qǐng tīng: "我想去北京旅游。"',
          audioPrompt: '我想去北京旅游。',
          options: ['A. Tôi muốn đi du lịch Bắc Kinh', 'B. Tôi muốn đi Thượng Hải', 'C. Tôi thích ở nhà', 'D. Tôi không thích du lịch'],
          correctAnswer: 0,
          explanation: 'Câu trong băng là "我想去北京旅游。" (Tôi muốn đi Bắc Kinh du lịch).',
        },
        {
          id: `q-c2-${Date.now()}`,
          section: 'reading',
          question: 'Điền từ đúng vào chỗ trống: "他每天都____汉语。"',
          options: ['A. 学习 (xuéxí)', 'B. 睡觉 (shuìjiào)', 'C. 跑 (pǎo)', 'D. 买 (mǎi)'],
          correctAnswer: 0,
          explanation: '学习汉语 nghĩa là học tiếng Trung.',
        },
      ],
    };

    addExam(newExam);
    setExamTitle('');
    setExamSubtitle('');
    setIsAddExamModal(false);
  };

  const filteredUsers = appUsers.filter((u) => {
    const matchesQuery =
      u.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      u.level.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
    return matchesQuery && matchesRole && matchesStatus;
  });

  const filteredDecks = vocabDecks.filter((d) => {
    const matchesLevel = deckLevelFilter === 'ALL' || d.level === deckLevelFilter;
    return matchesLevel;
  });

  if (userRole === 'student') {
    return (
      <div className="bg-white rounded-3xl border-2 border-[#E8DFCE] p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm my-12 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-[#FFF5F3] border border-red-200 text-red-600 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-[22px] font-black text-[#18181B]">
          Khu vực dành cho Ban Quản Trị & Giáo Viên
        </h2>
        <p className="text-[19px] text-slate-600 leading-relaxed">
          Tài khoản học viên không có quyền truy cập vào bảng điều khiển này. Vui lòng quay lại khu vực khóa học hoặc làm bài tập để tiếp tục học tập.
        </p>
        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          className="px-6 py-3 rounded-2xl bg-red-600 text-white font-bold text-[14px] sm:text-[16px] hover:bg-red-700 transition-colors cursor-pointer"
        >
          Quay lại Khóa học
        </button>
      </div>
    );
  }

  const isTeacher = userRole === 'teacher';
  const isAdmin = userRole === 'admin';

  const adminTabs = [
    { id: 'courses', label: `Khóa học & Bài học (${courses.length})`, icon: BookOpen },
    { id: 'exams', label: `Đề thi thử (${exams.length})`, icon: GraduationCap },
    { id: 'decks', label: `Bộ từ vựng & Flashcards (${vocabDecks.length})`, icon: Layers },
    ...(isAdmin
      ? [{ id: 'users', label: `Người dùng & Phân quyền (${appUsers.length})`, icon: ShieldCheck }]
      : [{ id: 'students_tracking', label: `Theo dõi học viên (${appUsers.filter((u) => u.role === 'student').length})`, icon: Users }]),
    { id: 'overview', label: isAdmin ? 'Thống kê hệ thống' : 'Thống kê giảng dạy', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Admin / Teacher Top Header (Đồng bộ Đỏ - Be - Đen) */}
      <div className="bg-gradient-to-br from-red-600 via-red-700 to-[#18181B] border border-red-500/70 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="space-y-2 flex-1">
            <span className="inline-flex items-center gap-2 text-[14px] font-bold text-amber-200">
              <ShieldCheck className="w-5 h-5 text-amber-300 shrink-0" />
              <span>
                {isTeacher
                  ? 'Cổng Thông Tin Giảng Dạy & Quản Lý Giáo Viên'
                  : 'Hệ Thống Quản Trị Trung Tâm MiXiangg HSK'}
              </span>
            </span>
            <h1 className="font-serif text-[24px] sm:text-[30px] font-black tracking-tight leading-tight">
              {isTeacher ? 'Bảng Điều Khiển Giáo Viên' : 'Bảng Điều Khiển Quản Trị Viên'}
            </h1>
            <p className="text-[19px] text-rose-50 leading-relaxed max-w-3xl">
              {isTeacher
                ? 'Thêm/sửa/xóa khóa học, bài học, đề thi thử, từ vựng và theo dõi sát sao lộ trình học tập của học viên.'
                : 'Toàn quyền quản trị khóa học HSK 1–5, bộ từ vựng flashcards & AI, đề thi thử tự động và phân quyền tài khoản.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setDeckToEdit(null);
                setIsAIFlashcardModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-amber-300 hover:bg-amber-200 text-[#18181B] font-black text-[14px] flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <Sparkles className="w-5 h-5 shrink-0" />
              <span>Flashcard AI</span>
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setUserToEdit(null);
                  setIsUserModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-[14px] flex items-center gap-2 border border-white/25 cursor-pointer transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Thêm tài khoản</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsAddCourseModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#18181B] hover:bg-black text-white font-bold text-[14px] flex items-center gap-2 border border-white/20 shadow-xs cursor-pointer transition-colors"
            >
              <PlusCircle className="w-5 h-5 text-amber-300" />
              <span>Tạo khóa học</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#F5EFEB] rounded-2xl border border-[#E8DFCE]">
        {adminTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeAdminTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveAdminTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'text-[#18181B] hover:bg-white hover:text-red-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: COURSES & LESSONS */}
      {activeAdminTab === 'courses' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-serif font-black text-[#18181B] text-[21px] sm:text-[22px]">
              Danh sách các khóa học hiện hành ({courses.length} khóa)
            </h3>
            <button
              type="button"
              onClick={() => setIsAddCourseModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-red-600 text-white font-bold text-[14px] flex items-center gap-2 hover:bg-red-700 shadow-xs cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Thêm khóa học mới</span>
            </button>
          </div>

          <div className="space-y-5">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-3xl border-2 border-[#E8DFCE] p-6 sm:p-7 shadow-2xs space-y-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#EFE7D6]">
                  <div className="flex items-start gap-3">
                    <span className="px-3 py-1 rounded-xl text-[14px] font-mono font-bold bg-[#FFF5F3] text-red-700 border border-red-200 shrink-0">
                      {course.level}
                    </span>
                    <div className="space-y-1">
                      <h4 className="font-serif font-black text-[21px] text-[#18181B]">
                        {course.vietnameseTitle}
                      </h4>
                      <p className="text-[16px] sm:text-[18px] text-slate-600">{course.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setCourseToEdit(course);
                        setIsEditCourseModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#FAF7F0] text-[#18181B] font-bold text-[14px] border border-[#E8DFCE] hover:border-red-500 hover:bg-[#FFF5F3] flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Chỉnh sửa thông tin khóa học"
                    >
                      <Edit3 className="w-4 h-4 text-red-600" />
                      <span>Sửa khóa học</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCourseForLessonEditor(course);
                        setLessonToEdit(null);
                        setIsLessonEditorOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-[14px] hover:bg-red-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Soạn bài học mới thủ công hoặc trợ giúp bằng AI"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Soạn bài học mới</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Bạn có chắc muốn xóa khóa học ${course.level}?`)) {
                          deleteCourse(course.id);
                        }
                      }}
                      className="p-2.5 rounded-xl border border-[#E8DFCE] text-slate-500 hover:text-red-600 hover:bg-[#FFF5F3] cursor-pointer"
                      title="Xóa khóa học"
                      aria-label="Xóa khóa học"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Lessons in this course */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[14px] font-bold text-[#18181B]">
                      Các bài học thuộc khóa ({course.lessons.length} bài):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCourseForLessonEditor(course);
                        setLessonToEdit(null);
                        setIsLessonEditorOpen(true);
                      }}
                      className="text-[14px] text-red-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Soạn bài học thủ công</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {course.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="p-4 rounded-2xl bg-[#FDFBF6] border border-[#E8DFCE] flex items-center justify-between gap-3 hover:border-amber-500/70 transition-colors"
                      >
                        <div className="space-y-1 min-w-0">
                          <span className="font-serif font-bold text-[16px] text-[#18181B] block truncate">
                            Bài {lesson.lessonNumber}: {lesson.title}
                          </span>
                          <span className="text-slate-600 block text-[13px] truncate">
                            {lesson.vietnameseTitle} ({lesson.durationMinutes}p) · {lesson.vocabulary.length} từ · {lesson.grammar.length} ngữ pháp
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setCourseForLessonEditor(course);
                              setLessonToEdit(lesson);
                              setIsLessonEditorOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white border border-[#E8DFCE] text-[#18181B] hover:text-red-600 hover:border-red-400 flex items-center gap-1.5 text-[13px] font-bold cursor-pointer"
                            title="Chỉnh sửa bài học"
                          >
                            <Edit3 className="w-4 h-4 text-red-600" />
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteLesson(course.id, lesson.id)}
                            className="text-slate-400 hover:text-red-600 p-2 rounded-xl hover:bg-[#FFF5F3] cursor-pointer"
                            title="Xóa bài học"
                            aria-label="Xóa bài học"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: EXAMS */}
      {activeAdminTab === 'exams' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="font-serif font-black text-[#18181B] text-[21px] sm:text-[22px]">
                Quản lý Ngân hàng Đề thi thử HSK ({exams.length} đề)
              </h3>
              <p className="text-[18px] text-slate-600">
                Chỉnh sửa câu hỏi, nạp câu hỏi từ file Excel, hoặc tạo tự động bằng AI
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setExamToEdit(null);
                setIsExamEditorOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-red-600 text-white font-bold text-[14px] flex items-center gap-2 hover:bg-red-700 shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-5 h-5" />
              <span>Soạn đề thi mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-3xl border-2 border-[#E8DFCE] p-6 shadow-2xs flex flex-col justify-between hover:border-amber-500/70 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-xl text-[14px] font-bold bg-[#FFF5F3] text-red-700 border border-red-200">
                      {exam.level}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setExamToEdit(exam);
                          setIsExamEditorOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#FAF7F0] text-[#18181B] hover:bg-[#FFF5F3] border border-[#E8DFCE] hover:border-red-400 font-bold text-[13px] flex items-center gap-1.5 cursor-pointer"
                        title="Sửa kì thi"
                      >
                        <Edit3 className="w-4 h-4 text-red-600" />
                        <span>Sửa đề thi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Bạn có chắc muốn xóa đề thi "${exam.title}"?`)) {
                            deleteExam(exam.id);
                          }
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-[#FFF5F3] cursor-pointer"
                        title="Xóa đề thi"
                        aria-label="Xóa đề thi"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-serif font-black text-[19px] text-[#18181B] leading-snug">{exam.title}</h4>
                    <p className="text-[16px] text-slate-600 mt-1">{exam.subtitle}</p>
                  </div>

                  <div className="pt-3 text-[14px] text-slate-600 flex flex-wrap items-center gap-3 border-t border-[#EFE7D6] font-mono tabular-nums">
                    <span>Thời gian: <strong className="text-[#18181B]">{exam.timeLimitMinutes}p</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Số câu: <strong className="text-[#18181B]">{exam.questions.length} câu</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Đạt: <strong className="text-red-600">{exam.passScore}/{exam.totalPoints}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VOCABULARY DECKS & FLASHCARDS MANAGEMENT */}
      {activeAdminTab === 'decks' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border-2 border-[#E8DFCE] shadow-2xs">
            <div className="space-y-1">
              <h3 className="font-serif font-black text-[#18181B] text-[21px] sm:text-[22px] flex flex-wrap items-center gap-2.5">
                <span>Quản lý Bộ Từ Vựng & Thẻ Flashcards</span>
                <span className="text-[14px] font-mono font-bold px-3 py-0.5 rounded-full bg-[#FFF5F3] text-red-700 border border-red-200 tabular-nums">
                  {vocabDecks.length} bộ thẻ
                </span>
              </h3>
              <p className="text-[18px] text-slate-600">
                Thêm, sửa, xóa bộ thẻ và từng từ vựng; hoặc dùng Lão Sư AI tự động tạo trọn bộ theo chủ đề
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDeckToEdit(null);
                  setIsAIFlashcardModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-[#18181B] hover:bg-black text-amber-300 font-bold text-[14px] flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                <span>Tạo bằng AI</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeckToEdit(null);
                  setIsDeckEditorOpen(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-[14px] flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>Thêm bộ từ mới</span>
              </button>
            </div>
          </div>

          {/* Level Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#F5EFEB] rounded-2xl border border-[#E8DFCE]">
            {(['ALL', 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setDeckLevelFilter(lvl)}
                className={`px-4 py-2 rounded-xl text-[14px] font-extrabold transition-all cursor-pointer ${
                  deckLevelFilter === lvl
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-[#18181B] hover:bg-white hover:text-red-700'
                }`}
              >
                {lvl === 'ALL' ? 'Tất cả cấp độ' : lvl}
              </button>
            ))}
          </div>

          {/* Decks Grid */}
          <div className="space-y-4">
            {filteredDecks.map((deck) => {
              const isExpanded = expandedDeckId === deck.id;
              return (
                <div
                  key={deck.id}
                  className="bg-white rounded-3xl border-2 border-[#E8DFCE] shadow-2xs overflow-hidden transition-all"
                >
                  <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-[13px]">
                        <span className="px-3 py-0.5 rounded-xl font-bold bg-[#FFF5F3] text-red-700 border border-red-200">
                          {deck.level}
                        </span>
                        <span className="px-3 py-0.5 rounded-xl font-semibold bg-[#FAF7F0] text-[#18181B] border border-[#E8DFCE]">
                          {deck.category}
                        </span>
                        {deck.createdBy === 'ai' ? (
                          <span className="px-3 py-0.5 rounded-xl font-bold bg-[#FEFCE8] text-amber-800 border border-amber-300 flex items-center gap-1">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            Tạo bởi AI
                          </span>
                        ) : (
                          <span className="px-3 py-0.5 rounded-xl font-semibold bg-[#FAF7F0] text-slate-600 border border-[#E8DFCE]">
                            Quản trị viên
                          </span>
                        )}
                        <span className="font-mono font-bold text-slate-600 tabular-nums">
                          · {deck.cards.length} thẻ
                        </span>
                      </div>

                      <h4 className="font-serif text-[19px] sm:text-[21px] font-black text-[#18181B]">
                        {deck.title}
                      </h4>
                      {deck.vietnameseTitle && (
                        <p className="text-[16px] font-bold text-red-700">
                          {deck.vietnameseTitle}
                        </p>
                      )}
                      <p className="text-[16px] text-slate-600 max-w-3xl leading-relaxed">
                        {deck.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setDeckForCardModal(deck);
                          setCardToEdit(null);
                          setIsCardModalOpen(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#FFF5F3] hover:bg-red-600 text-red-700 hover:text-white font-bold text-[13px] flex items-center gap-1.5 border border-red-200 cursor-pointer transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Thêm thẻ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeckToEdit(deck);
                          setIsDeckEditorOpen(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#FFF5F3] text-[#18181B] font-bold text-[13px] flex items-center gap-1.5 border border-[#E8DFCE] cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 text-red-600" />
                        <span>Sửa bộ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Bạn có chắc chắn muốn xóa bộ từ vựng "${deck.title}"?`)) {
                            deleteVocabDeck(deck.id);
                          }
                        }}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-[#FFF5F3] transition-colors cursor-pointer"
                        title="Xóa bộ từ vựng"
                        aria-label="Xóa bộ từ vựng"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedDeckId(isExpanded ? null : deck.id)}
                        className="px-3.5 py-2 rounded-xl bg-[#18181B] hover:bg-red-700 text-white font-bold text-[13px] flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <span>{isExpanded ? 'Ẩn thẻ' : `Xem ${deck.cards.length} thẻ`}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Cards View */}
                  {isExpanded && (
                    <div className="border-t border-[#EFE7D6] bg-[#FDFBF6] p-6 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[14px] font-bold text-[#18181B]">
                          Danh sách thẻ flashcard bên trong ({deck.cards.length} thẻ):
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setDeckForCardModal(deck);
                            setCardToEdit(null);
                            setIsCardModalOpen(true);
                          }}
                          className="text-[14px] font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Thêm từ vựng mới vào bộ này</span>
                        </button>
                      </div>

                      {deck.cards.length === 0 ? (
                        <div className="text-center py-6 text-[16px] text-slate-500">
                          Bộ từ này chưa có thẻ nào. Bấm nút "Thêm thẻ" để bắt đầu soạn!
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {deck.cards.map((card) => (
                            <div
                              key={card.id}
                              className="bg-white rounded-2xl border border-[#E8DFCE] p-4 shadow-2xs space-y-2 hover:border-amber-500/70 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="text-[22px] font-black text-[#18181B] font-serif leading-none">
                                      {card.word}
                                    </span>
                                    <span className="text-[14px] font-mono font-bold text-red-600">
                                      {card.pinyin}
                                    </span>
                                  </div>
                                  {card.sinoVietnamese && (
                                    <span className="text-[13px] text-slate-500 block mt-0.5">
                                      ({card.sinoVietnamese})
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => speakChinese(card.word)}
                                    className="p-1.5 rounded-lg text-red-600 hover:bg-[#FFF5F3] cursor-pointer"
                                    title="Phát âm"
                                    aria-label="Phát âm"
                                  >
                                    <Volume2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeckForCardModal(deck);
                                      setCardToEdit(card);
                                      setIsCardModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#18181B] hover:bg-[#FAF7F0] cursor-pointer"
                                    title="Sửa thẻ"
                                    aria-label="Sửa thẻ"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Xóa thẻ "${card.word}" khỏi bộ này?`)) {
                                        deleteCardFromDeck(deck.id, card.id);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-[#FFF5F3] cursor-pointer"
                                    title="Xóa thẻ"
                                    aria-label="Xóa thẻ"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <p className="text-[16px] font-bold text-[#18181B]">
                                {card.meaning}
                              </p>

                              {card.exampleSentence && (
                                <div className="text-[13px] bg-[#FDFBF6] p-2.5 rounded-xl border border-[#EFE7D6] space-y-0.5">
                                  <p className="font-serif text-[14px] text-[#18181B]">{card.exampleSentence}</p>
                                  <p className="text-[13px] text-slate-600">{card.exampleMeaning}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: USER MANAGEMENT & ROLE PERMISSION (ADMIN ONLY) */}
      {activeAdminTab === 'users' && isAdmin && (
        <div className="bg-white rounded-3xl border-2 border-[#E8DFCE] overflow-hidden shadow-2xs space-y-5 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="font-serif font-black text-[#18181B] text-[21px] sm:text-[22px] flex flex-wrap items-center gap-2.5">
                <span>Quản trị Tài Khoản & Phân Quyền</span>
                <span className="text-[14px] font-mono font-bold px-3 py-0.5 rounded-full bg-[#FFF5F3] text-red-700 border border-red-200 tabular-nums">
                  {filteredUsers.length} tài khoản
                </span>
              </h3>
              <p className="text-[18px] text-slate-600">
                Phân quyền Quản trị viên, Giáo viên, Học viên và quản lý trạng thái tài khoản
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setUserToEdit(null);
                setIsUserModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-[14px] flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-5 h-5" />
              <span>Thêm tài khoản mới</span>
            </button>
          </div>

          {/* Role Filters & Search */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              {(['all', 'admin', 'teacher', 'student'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setUserRoleFilter(r)}
                  className={`px-3.5 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
                    userRoleFilter === r
                      ? 'bg-red-700 text-white shadow-xs'
                      : 'bg-[#FAF7F0] text-[#18181B] border border-[#E8DFCE] hover:bg-[#FFF5F3]'
                  }`}
                >
                  {r === 'all'
                    ? 'Tất cả vai trò'
                    : r === 'admin'
                    ? 'Quản trị viên'
                    : r === 'teacher'
                    ? 'Giáo viên'
                    : 'Học viên'}
                </button>
              ))}

              <div className="h-5 w-px bg-[#E8DFCE] mx-1 hidden sm:block" />

              {(['all', 'active', 'suspended'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setUserStatusFilter(st)}
                  className={`px-3.5 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
                    userStatusFilter === st
                      ? 'bg-[#18181B] text-white'
                      : 'bg-[#FAF7F0] text-[#18181B] border border-[#E8DFCE] hover:bg-[#FFF5F3]'
                  }`}
                >
                  {st === 'all' ? 'Tất cả trạng thái' : st === 'active' ? 'Hoạt động' : 'Đã khóa'}
                </button>
              ))}
            </div>

            <div className="relative lg:w-72">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên, email, cấp độ..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 text-[14px] rounded-2xl border border-[#E8DFCE] bg-[#FDFBF6] focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#FAF7F0] text-[#18181B] font-bold border-b border-[#E8DFCE]">
                <tr>
                  <th className="py-3.5 px-4">Tài khoản & Email</th>
                  <th className="py-3.5 px-4">Mục tiêu HSK</th>
                  <th className="py-3.5 px-4">Phân quyền Vai trò</th>
                  <th className="py-3.5 px-4">Tiến độ học</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7D6]">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#FFF9F6] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar || '/assets/aistudio/logo_2cd38f9f.jpg'}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-[#E8DFCE] shrink-0"
                        />
                        <div>
                          <span className="font-bold text-[#18181B] block">{user.name}</span>
                          <span className="text-[12px] text-slate-500 font-medium">{user.email}</span>
                          {user.note && (
                            <span className="text-[12px] text-red-600 block italic">{user.note}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-3 py-1 rounded-xl text-[13px] font-bold bg-[#FFF5F3] text-red-700 border border-red-200">
                        {user.level}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRoleAdmin(user.id, e.target.value as UserRole)}
                        className={`text-[13px] font-bold py-1.5 px-3 rounded-xl border cursor-pointer focus:outline-none ${
                          user.role === 'admin'
                            ? 'bg-[#FFF5F3] text-red-800 border-red-300'
                            : user.role === 'teacher'
                            ? 'bg-[#FEFCE8] text-amber-900 border-amber-300'
                            : 'bg-[#FAF7F0] text-[#18181B] border-[#E8DFCE]'
                        }`}
                      >
                        <option value="student">Học viên</option>
                        <option value="teacher">Giáo viên</option>
                        <option value="admin">Quản trị viên</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-[13px] space-y-0.5 tabular-nums">
                        <span className="text-red-600 font-bold block">
                          {user.streak || 0} ngày liên tiếp
                        </span>
                        <span className="text-slate-600 text-[12px] block">
                          {user.completedLessons || 0} bài · Thi: {user.examsTaken || 0} lần
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() =>
                          updateUserStatusAdmin(user.id, user.status === 'active' ? 'suspended' : 'active')
                        }
                        className={`px-3 py-1 rounded-full text-[13px] font-bold border transition-colors cursor-pointer ${
                          user.status === 'active'
                            ? 'bg-[#ECFDF5] text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-[#FFF5F3] text-red-700 border-red-300 hover:bg-red-100'
                        }`}
                      >
                        {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setUserToEdit(user);
                            setIsUserModalOpen(true);
                          }}
                          className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-[#FFF5F3] transition-colors cursor-pointer"
                          title="Chỉnh sửa thông tin"
                          aria-label="Chỉnh sửa thông tin"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa tài khoản "${user.name}" (${user.email}) khỏi hệ thống?`)) {
                              deleteUserAdmin(user.id);
                            }
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-[#FFF5F3] transition-colors cursor-pointer"
                          title="Xóa tài khoản"
                          aria-label="Xóa tài khoản"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB FOR TEACHERS: THEO DÕI HỌC VIÊN */}
      {activeAdminTab === 'students_tracking' && (
        <div className="bg-white rounded-3xl border-2 border-[#E8DFCE] p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-serif text-[21px] sm:text-[22px] font-black text-[#18181B] flex items-center gap-2.5">
                <Users className="w-7 h-7 text-red-600 shrink-0" />
                <span>Theo Dõi Lộ Trình & Kết Quả Học Viên</span>
              </h3>
              <p className="text-[18px] text-slate-600">
                Quan sát tiến độ học, hoàn thành bài giảng và điểm số thi thử của từng học viên.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm học viên, email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 text-[14px] rounded-2xl border border-[#E8DFCE] bg-[#FDFBF6] focus:bg-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          {/* Quick Metrics (Pastel Đỏ - Vàng - Mint - Be) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#FFF5F3] border border-red-200">
              <span className="text-[13px] font-bold text-red-800">Tổng số học viên</span>
              <div className="font-mono text-[22px] font-black text-[#18181B] mt-1 tabular-nums">
                {appUsers.filter((u) => u.role === 'student').length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#FEFCE8] border border-amber-200">
              <span className="text-[13px] font-bold text-amber-800">Đang giữ chuỗi học</span>
              <div className="font-mono text-[22px] font-black text-[#18181B] mt-1 tabular-nums">
                {appUsers.filter((u) => u.role === 'student' && (u.streak || 0) > 0).length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-emerald-200">
              <span className="text-[13px] font-bold text-emerald-800">Đã tham gia thi thử</span>
              <div className="font-mono text-[22px] font-black text-[#18181B] mt-1 tabular-nums">
                {appUsers.filter((u) => u.role === 'student' && (u.examsTaken || 0) > 0).length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E8DFCE]">
              <span className="text-[13px] font-bold text-slate-700">Bài học hoàn thành TB</span>
              <div className="font-mono text-[22px] font-black text-red-600 mt-1 tabular-nums">
                {Math.round(
                  appUsers
                    .filter((u) => u.role === 'student')
                    .reduce((acc, u) => acc + (u.completedLessons || 0), 0) /
                    Math.max(1, appUsers.filter((u) => u.role === 'student').length)
                )} bài
              </div>
            </div>
          </div>

          {/* Students Read-Only Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#FAF7F0] text-[#18181B] font-bold border-b border-[#E8DFCE]">
                <tr>
                  <th className="py-3.5 px-4">Học viên</th>
                  <th className="py-3.5 px-4">Mục tiêu HSK</th>
                  <th className="py-3.5 px-4">Chuỗi học tập</th>
                  <th className="py-3.5 px-4">Tiến độ bài học</th>
                  <th className="py-3.5 px-4">Thi thử HSK</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7D6]">
                {appUsers
                  .filter((u) => u.role === 'student')
                  .filter((u) =>
                    u.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                    u.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
                    u.level.toLowerCase().includes(studentSearch.toLowerCase())
                  )
                  .map((student) => (
                    <tr key={student.id} className="hover:bg-[#FFF9F6] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatar || '/assets/aistudio/logo_2cd38f9f.jpg'}
                            alt={student.name}
                            className="w-10 h-10 rounded-full object-cover ring-1 ring-[#E8DFCE] shrink-0"
                          />
                          <div>
                            <span className="font-bold text-[#18181B] block">{student.name}</span>
                            <span className="text-[12px] text-slate-500 font-medium">{student.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-3 py-1 rounded-xl text-[13px] font-bold bg-[#FFF5F3] text-red-700 border border-red-200">
                          {student.level}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-red-600 font-mono font-bold tabular-nums">
                          {student.streak || 0} ngày
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-[160px]">
                          <div className="flex justify-between text-[12px] font-mono font-bold text-[#18181B] tabular-nums">
                            <span>{student.completedLessons || 0} bài</span>
                            <span>{Math.min(100, Math.round(((student.completedLessons || 0) / 10) * 100))}%</span>
                          </div>
                          <div className="w-full bg-[#EFE7D6] h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-red-600 h-full rounded-full"
                              style={{ width: `${Math.min(100, Math.round(((student.completedLessons || 0) / 10) * 100))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-[13px] space-y-0.5 tabular-nums">
                          <span className="font-bold text-[#18181B] block">
                            {student.examsTaken || 0} lần thi
                          </span>
                          <span className="text-slate-500 text-[12px] block">
                            Điểm TB: {student.avgScore ? `${student.avgScore}/300` : 'Chưa thi'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[13px] font-bold border ${
                            student.status === 'active'
                              ? 'bg-[#ECFDF5] text-emerald-800 border-emerald-300'
                              : 'bg-[#FFF5F3] text-red-700 border-red-300'
                          }`}
                        >
                          {student.status === 'active' ? 'Đang học' : 'Đã khóa'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM OVERVIEW */}
      {activeAdminTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <div className="bg-[#FFF5F3] rounded-3xl border-2 border-red-200 p-6 shadow-2xs">
            <span className="text-[14px] font-bold text-red-800">Tổng số khóa học HSK</span>
            <div className="font-mono text-[27px] font-black text-[#18181B] mt-2 tabular-nums">
              {courses.length} khóa
            </div>
            <span className="text-[13px] text-slate-600 mt-1 block">Từ HSK 1 đến HSK 5</span>
          </div>

          <div className="bg-[#FEFCE8] rounded-3xl border-2 border-amber-200 p-6 shadow-2xs">
            <span className="text-[14px] font-bold text-amber-800">Tổng số bài học</span>
            <div className="font-mono text-[27px] font-black text-red-600 mt-2 tabular-nums">
              {courses.reduce((acc, c) => acc + c.lessons.length, 0)} bài
            </div>
            <span className="text-[13px] text-slate-600 mt-1 block">Tích hợp âm thanh & bài tập</span>
          </div>

          <div className="bg-[#ECFDF5] rounded-3xl border-2 border-emerald-200 p-6 shadow-2xs">
            <span className="text-[14px] font-bold text-emerald-800">Đề thi thử hệ thống</span>
            <div className="font-mono text-[27px] font-black text-[#18181B] mt-2 tabular-nums">
              {exams.length} bộ đề
            </div>
            <span className="text-[13px] text-slate-600 mt-1 block">Có đồng hồ & chấm tự động</span>
          </div>

          <div className="bg-white rounded-3xl border-2 border-[#E8DFCE] p-6 shadow-2xs">
            <span className="text-[14px] font-bold text-slate-700">Học viên hoạt động</span>
            <div className="font-mono text-[27px] font-black text-red-600 mt-2 tabular-nums">
              {serverStats.activeStudentsCount || studentsList.length} người
            </div>
            <span className="text-[13px] text-slate-600 mt-1 block">
              Tỷ lệ hoàn thành: {serverStats.completionRate || 92}%
            </span>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {isAddCourseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border-2 border-[#E8DFCE] shadow-2xl space-y-4">
            <h3 className="font-serif text-[21px] font-black text-[#18181B]">Tạo Khóa Học HSK Mới</h3>
            <form onSubmit={handleCreateCourse} className="space-y-4 text-[14px]">
              <div>
                <label className="font-bold text-[#18181B] block mb-1">Cấp độ HSK:</label>
                <select
                  value={courseLevel}
                  onChange={(e) => setCourseLevel(e.target.value as any)}
                  className="w-full p-3 rounded-2xl border border-[#E8DFCE] bg-[#FDFBF6] focus:border-red-600 focus:outline-none"
                >
                  <option value="HSK 1">HSK 1</option>
                  <option value="HSK 2">HSK 2</option>
                  <option value="HSK 3">HSK 3</option>
                  <option value="HSK 4">HSK 4</option>
                  <option value="HSK 5">HSK 5</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#18181B] block mb-1">Tên khóa học:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Khóa học HSK 3 - Luyện thi cấp tốc..."
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[#E8DFCE] bg-[#FDFBF6] focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#18181B] block mb-1">Mô tả khóa học:</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả mục tiêu từ vựng, ngữ pháp..."
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[#E8DFCE] bg-[#FDFBF6] focus:border-red-600 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCourseModal(false)}
                  className="px-4 py-2.5 rounded-xl text-[#18181B] hover:bg-[#FAF7F0] border border-[#E8DFCE] font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-xs cursor-pointer"
                >
                  Lưu khóa học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lesson Modal */}
      {isAddLessonModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border-2 border-[#E8DFCE] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-[21px] font-black text-[#18181B]">Thêm Bài Học Mới</h3>
              <span className="text-[13px] px-3 py-1 rounded-full bg-[#FFF5F3] text-red-700 border border-red-200 font-bold">
                Admin Tool
              </span>
            </div>

            {/* Quick AI Drafting Helper */}
            <div className="bg-[#FEFCE8] p-4 rounded-2xl border border-amber-300 space-y-2 text-[14px]">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span>Trợ lý AI tự động soạn bài học theo chủ đề:</span>
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={aiTopicPrompt}
                  onChange={(e) => setAiTopicPrompt(e.target.value)}
                  placeholder="Nhập chủ đề bài học..."
                  className="flex-1 p-2.5 rounded-xl border border-amber-300 bg-white text-[14px]"
                />
                <button
                  type="button"
                  disabled={isGeneratingAiLesson}
                  onClick={handleAiGenerateLesson}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 shrink-0 cursor-pointer"
                >
                  {isGeneratingAiLesson ? 'Đang tạo...' : 'AI Soạn'}
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateLesson} className="space-y-4 text-[14px]">
              <div>
                <label className="font-bold text-[#18181B] block mb-1">Thuộc khóa học:</label>
                <select
                  value={selectedCourseForLesson}
                  onChange={(e) => setSelectedCourseForLesson(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[#E8DFCE] bg-[#FDFBF6]"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.level} - {c.vietnameseTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#18181B] block mb-1">Tiêu đề tiếng Trung:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 第5课：周末你打算做什么？"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[#E8DFCE] bg-[#FDFBF6] font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-[#18181B] block mb-1">Tiêu đề tiếng Việt:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bài 5: Cuối tuần bạn dự định làm gì?"
                  value={lessonVnTitle}
                  onChange={(e) => setLessonVnTitle(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[#E8DFCE] bg-[#FDFBF6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#18181B] block mb-1">Thời lượng (phút):</label>
                  <input
                    type="number"
                    min="10"
                    max="120"
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(Number(e.target.value))}
                    className="w-full p-3 rounded-2xl border border-[#E8DFCE] bg-[#FDFBF6]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#18181B] block mb-1">Mục tiêu bài học:</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả các kỹ năng đạt được sau bài học..."
                  value={lessonDesc}
                  onChange={(e) => setLessonDesc(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[#E8DFCE] bg-[#FDFBF6]"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddLessonModal(false)}
                  className="px-4 py-2.5 rounded-xl text-[#18181B] hover:bg-[#FAF7F0] border border-[#E8DFCE] font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-xs cursor-pointer"
                >
                  Lưu bài học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Exam Modal */}
      {isAddExamModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border-2 border-[#E8DFCE] shadow-2xl space-y-4">
            <h3 className="font-serif text-[21px] font-black text-[#18181B]">Tạo Đề Thi Thử HSK Mới</h3>
            <form onSubmit={handleCreateExam} className="space-y-4 text-[14px]">
              <div>
                <label className="font-bold text-[#18181B] block mb-1">Cấp độ HSK:</label>
                <select
                  value={examLevel}
                  onChange={(e) => setExamLevel(e.target.value as any)}
                  className="w-full p-3 rounded-2xl border border-[#E8DFCE] bg-[#FDFBF6]"
                >
                  <option value="HSK 1">HSK 1</option>
                  <option value="HSK 2">HSK 2</option>
                  <option value="HSK 3">HSK 3</option>
                  <option value="HSK 4">HSK 4</option>
                  <option value="HSK 5">HSK 5</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#18181B] block mb-1">Tên đề thi:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đề thi thử HSK 3 Chuẩn Hán Ban - Đề số 02"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[#E8DFCE] bg-[#FDFBF6] font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-[#18181B] block mb-1">Phút:</label>
                  <input
                    type="number"
                    value={examTime}
                    onChange={(e) => setExamTime(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF6]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#18181B] block mb-1">Điểm đạt:</label>
                  <input
                    type="number"
                    value={examPassScore}
                    onChange={(e) => setExamPassScore(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF6]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#18181B] block mb-1">Tổng điểm:</label>
                  <input
                    type="number"
                    value={examTotalPoints}
                    onChange={(e) => setExamTotalPoints(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF6]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddExamModal(false)}
                  className="px-4 py-2.5 rounded-xl text-[#18181B] hover:bg-[#FAF7F0] border border-[#E8DFCE] font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-xs cursor-pointer"
                >
                  Tạo đề thi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      <EditCourseModal
        isOpen={isEditCourseModalOpen}
        onClose={() => setIsEditCourseModalOpen(false)}
        course={courseToEdit}
        onSave={(updatedCourse) => updateCourse(updatedCourse)}
      />

      {/* Lesson Editor Modal (for both manual lesson drafting & editing) */}
      <LessonEditorModal
        isOpen={isLessonEditorOpen}
        onClose={() => setIsLessonEditorOpen(false)}
        course={courseForLessonEditor || courses[0]}
        initialLesson={lessonToEdit}
        onSaveLesson={(lesson) => {
          const targetCourse = courseForLessonEditor || courses[0];
          if (!targetCourse) return;
          const isExisting = targetCourse.lessons.some((l) => l.id === lesson.id);
          if (isExisting) {
            updateLesson(targetCourse.id, lesson);
          } else {
            addLesson(targetCourse.id, lesson);
          }
        }}
      />

      {/* Exam Editor Modal (for editing, adding questions, Excel import & AI generate) */}
      <ExamEditorModal
        isOpen={isExamEditorOpen}
        onClose={() => setIsExamEditorOpen(false)}
        exam={examToEdit}
        onSaveExam={(examObj) => {
          const isExisting = exams.some((e) => e.id === examObj.id);
          if (isExisting) {
            updateExam(examObj);
          } else {
            addExam(examObj);
          }
        }}
      />

      {/* Deck Editor Modal (Add/Edit Vocabulary Deck) */}
      <DeckEditorModal
        isOpen={isDeckEditorOpen}
        onClose={() => setIsDeckEditorOpen(false)}
        initialDeck={deckToEdit}
        onSave={(deck) => {
          const exists = vocabDecks.some((d) => d.id === deck.id);
          if (exists) {
            updateVocabDeck(deck);
          } else {
            addVocabDeck(deck);
          }
        }}
      />

      {/* Flashcard Card Editor Modal (Add/Edit Card in Deck) */}
      {deckForCardModal && (
        <CardEditorModal
          isOpen={isCardModalOpen}
          onClose={() => setIsCardModalOpen(false)}
          initialCard={cardToEdit}
          deckLevel={deckForCardModal.level}
          deckCategory={deckForCardModal.category}
          onSave={(card) => {
            if (cardToEdit) {
              updateCardInDeck(deckForCardModal.id, card);
            } else {
              addCardToDeck(deckForCardModal.id, card);
            }
          }}
        />
      )}

      {/* AI Flashcard Deck Generator Modal */}
      <AIFlashcardGeneratorModal
        isOpen={isAIFlashcardModalOpen}
        onClose={() => setIsAIFlashcardModalOpen(false)}
        defaultLevel="HSK 2"
        onDeckCreated={(newDeck) => {
          addVocabDeck(newDeck);
          setActiveAdminTab('decks');
        }}
      />

      {/* User Management & Role Modal */}
      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        initialUser={userToEdit}
        onSave={async (userData) => {
          if (userToEdit) {
            return await updateUserAdmin(userToEdit.id, userData);
          } else {
            return await addUserAdmin(userData);
          }
        }}
      />
    </div>
  );
};


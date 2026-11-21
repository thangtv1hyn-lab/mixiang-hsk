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
  Plus,
  Search,
  Layers,
  Volume2,
  Lock,
  ChevronDown,
  ChevronUp,
  Palette,
  LayoutDashboard,
  Menu,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Bot,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useHSK } from '../context/HSKContext';
import {
  Course,
  Exam,
  HSKLevel,
  Lesson,
  VocabItem,
  VocabDeck,
  AppUser,
  UserRole,
  UserStatus,
  GrammarPoint,
  DialogueLine,
  PracticeQuestion,
} from '../types/hsk';
import { MOCK_STUDENTS_LIST } from '../data/initialData';
import { EditCourseModal } from './admin/EditCourseModal';
import { LessonEditorModal } from './admin/LessonEditorModal';
import { ExamEditorModal } from './admin/ExamEditorModal';
import { DeckEditorModal } from './admin/DeckEditorModal';
import { CardEditorModal } from './admin/CardEditorModal';
import { AIFlashcardGeneratorModal } from './admin/AIFlashcardGeneratorModal';
import { UserManagementModal } from './admin/UserManagementModal';
import { UIEditorPanel } from './admin/UIEditorPanel';
import { speakChinese } from '../utils/audioSpeech';
import { resolveCartoonAvatar } from '../utils/cartoonAvatars';
import { estimateDataUrlKB } from '../utils/imageCompression';
import { safeParseJson } from '../utils/safeFetchJson';

type AdminTabId =
  | 'overview'
  | 'courses'
  | 'decks'
  | 'exams'
  | 'users'
  | 'students_tracking'
  | 'ui_editor';

interface AdminDashboardProps {
  onOpenAiTutor?: () => void;
}

const DEFAULT_HSK_COVERS: Record<HSKLevel, string> = {
  'HSK 1': '/assets/aistudio/hsk1_2aed1171.png',
  'HSK 2': '/assets/aistudio/hsk2_40c3fcef.png',
  'HSK 3': '/assets/aistudio/hsk3_4d56bb96.png',
  'HSK 4': '/assets/aistudio/hsk4_d9e3fc6a.png',
  'HSK 5': '/assets/aistudio/hsk5_f308a036.png',
};

const AI_COURSE_SUGGESTIONS = [
  'Giao tiếp đời sống & Du lịch Trung Quốc',
  'Tiếng Trung Văn Phòng & Thương Mại Thực Chiến',
  'Luyện thi HSK cấp tốc theo chủ đề trọng tâm',
  'Giáo trình Boya tinh gọn cho người mới bắt đầu',
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenAiTutor }) => {
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

  const [activeAdminTab, setActiveAdminTab] = useState<AdminTabId>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Two-step inline delete confirmation (iframe-safe, no window.confirm)
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | null>(null);

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

  // Course creation state (Manual + AI mode)
  const [isAddCourseModal, setIsAddCourseModal] = useState(false);
  const [courseCreateMode, setCourseCreateMode] = useState<'ai' | 'manual'>('ai');
  const [courseLevel, setCourseLevel] = useState<HSKLevel>('HSK 2');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseVnTitle, setCourseVnTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');

  // AI Course Generator specific states
  const [aiCourseCurriculum, setAiCourseCurriculum] = useState<'HSK' | 'BOYA' | 'COMM'>('HSK');
  const [aiCourseTopic, setAiCourseTopic] = useState('Giao tiếp đời sống & Du lịch Trung Quốc');
  const [aiCourseLessonCount, setAiCourseLessonCount] = useState<number>(3);
  const [isGeneratingAiCourse, setIsGeneratingAiCourse] = useState(false);
  const [aiCourseError, setAiCourseError] = useState('');
  const [aiGeneratedCourseDraft, setAiGeneratedCourseDraft] = useState<{
    title: string;
    vietnameseTitle: string;
    description: string;
    targetVocabCount: number;
    grammarPointsCount: number;
    lessons: Lesson[];
  } | null>(null);

  // Quick Add Lesson modal state (with full AI content retention)
  const [isAddLessonModal, setIsAddLessonModal] = useState(false);
  const [selectedCourseForLesson, setSelectedCourseForLesson] = useState<string>(
    courses[0]?.id || ''
  );
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonVnTitle, setLessonVnTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonDuration, setLessonDuration] = useState(35);
  const [isGeneratingAiLesson, setIsGeneratingAiLesson] = useState(false);
  const [aiTopicPrompt, setAiTopicPrompt] = useState('Giao tiếp trong văn phòng làm việc');
  const [aiLessonError, setAiLessonError] = useState('');
  const [aiLessonDraftData, setAiLessonDraftData] = useState<{
    vocabulary: VocabItem[];
    grammar: GrammarPoint[];
    dialogue: DialogueLine[];
    practiceQuestions: PracticeQuestion[];
  } | null>(null);

  // Student search & backend stats sync
  const [studentSearch, setStudentSearch] = useState('');
  const [studentsList, setStudentsList] = useState(MOCK_STUDENTS_LIST);
  const [serverStats, setServerStats] = useState<{
    activeStudentsCount?: number;
    completionRate?: number;
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

  const openCreateCourseModal = (mode: 'ai' | 'manual') => {
    setCourseCreateMode(mode);
    setAiCourseError('');
    setAiGeneratedCourseDraft(null);
    setCourseTitle('');
    setCourseVnTitle('');
    setCourseDesc('');
    setIsAddCourseModal(true);
  };

  // Generate complete Course with AI (Free Gemini API)
  const handleAiGenerateCourse = async () => {
    if (!aiCourseTopic.trim()) {
      setAiCourseError('Vui lòng nhập chủ đề hoặc định hướng khóa học.');
      return;
    }
    setIsGeneratingAiCourse(true);
    setAiCourseError('');
    setAiGeneratedCourseDraft(null);

    try {
      const res = await fetch('/api/gemini/admin-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'course',
          level: courseLevel,
          curriculum: aiCourseCurriculum,
          topic: aiCourseTopic.trim(),
          lessonCount: aiCourseLessonCount,
        }),
      });

      const data = await safeParseJson<any>(
        res,
        'AI không thể tạo khóa học lúc này. Vui lòng thử lại.'
      );
      if (!res.ok) {
        throw new Error(data.error || 'AI không thể tạo khóa học lúc này. Vui lòng thử lại.');
      }

      const courseId = `c-ai-${Date.now()}`;
      const rawLessons = Array.isArray(data.lessons) ? data.lessons : [];
      const formattedLessons: Lesson[] = rawLessons.map((l: any, lIdx: number) => ({
        id: `l-ai-${Date.now()}-${lIdx}`,
        courseId,
        level: courseLevel,
        lessonNumber: Number(l.lessonNumber) || lIdx + 1,
        title: l.title || `第${lIdx + 1}课：${aiCourseTopic}`,
        vietnameseTitle: l.vietnameseTitle || l.title || `Bài ${lIdx + 1}`,
        durationMinutes: Number(l.durationMinutes) || 35,
        description: l.description || '',
        vocabulary: (Array.isArray(l.vocabulary) ? l.vocabulary : []).map(
          (v: any, vIdx: number) => ({
            id: `v-ai-${Date.now()}-${lIdx}-${vIdx}`,
            word: v.word || '',
            pinyin: v.pinyin || '',
            sinoVietnamese: v.sino || v.sinoVietnamese || '',
            meaning: v.meaning || '',
            level: courseLevel,
            exampleSentence: v.example || v.exampleSentence || '',
            examplePinyin: v.examplePinyin || '',
            exampleMeaning: v.exampleMeaning || '',
          })
        ),
        grammar: (Array.isArray(l.grammar) ? l.grammar : []).map((g: any, gIdx: number) => ({
          id: `g-ai-${Date.now()}-${lIdx}-${gIdx}`,
          title: g.title || '',
          structure: g.structure || '',
          explanation: g.explanation || '',
          examples: (Array.isArray(g.examples) ? g.examples : []).map((ex: any) =>
            typeof ex === 'string'
              ? { hanzi: ex, pinyin: '', translation: '' }
              : {
                  hanzi: ex.hanzi || '',
                  pinyin: ex.pinyin || '',
                  translation: ex.translation || '',
                }
          ),
        })),
        dialogue: (Array.isArray(l.dialogue) ? l.dialogue : []).map((d: any, dIdx: number) => ({
          id: `dl-ai-${Date.now()}-${lIdx}-${dIdx}`,
          speaker: d.speaker || (dIdx % 2 === 0 ? 'A' : 'B'),
          chinese: d.chinese || '',
          pinyin: d.pinyin || '',
          vietnamese: d.vietnamese || '',
        })),
        practiceQuestions: (Array.isArray(l.practiceQuestions) ? l.practiceQuestions : []).map(
          (q: any, qIdx: number) => ({
            id: `pq-ai-${Date.now()}-${lIdx}-${qIdx}`,
            type: q.type || 'single_choice',
            question: q.question || '',
            pinyin: q.pinyin || '',
            options:
              Array.isArray(q.options) && q.options.length >= 2
                ? q.options
                : ['A. Đáp án 1', 'B. Đáp án 2'],
            correctAnswer: Number(q.correctAnswer) || 0,
            explanation: q.explanation || '',
          })
        ),
      }));

      setAiGeneratedCourseDraft({
        title: data.title || `${courseLevel} · ${aiCourseTopic.trim()}`,
        vietnameseTitle:
          data.vietnameseTitle || `Khóa học ${courseLevel}: ${aiCourseTopic.trim()}`,
        description:
          data.description || `Khóa học chuẩn ${courseLevel} chủ đề ${aiCourseTopic.trim()}.`,
        targetVocabCount: Number(data.targetVocabCount) || 300,
        grammarPointsCount: Number(data.grammarPointsCount) || 30,
        lessons: formattedLessons,
      });
    } catch (err: any) {
      setAiCourseError(err?.message || 'Lỗi kết nối AI tạo khóa học. Vui lòng thử lại.');
    } finally {
      setIsGeneratingAiCourse(false);
    }
  };

  // Save AI Generated Course
  const handleSaveAiCourse = () => {
    if (!aiGeneratedCourseDraft) return;
    const courseId = aiGeneratedCourseDraft.lessons[0]?.courseId || `c-ai-${Date.now()}`;
    const newCourse: Course = {
      id: courseId,
      level: courseLevel,
      title: aiGeneratedCourseDraft.title.trim() || `${courseLevel} · ${aiCourseTopic}`,
      vietnameseTitle:
        aiGeneratedCourseDraft.vietnameseTitle.trim() || aiGeneratedCourseDraft.title.trim(),
      description: aiGeneratedCourseDraft.description.trim(),
      coverImage: DEFAULT_HSK_COVERS[courseLevel],
      targetVocabCount: aiGeneratedCourseDraft.targetVocabCount,
      grammarPointsCount: aiGeneratedCourseDraft.grammarPointsCount,
      colorScheme: {
        bg: 'from-rose-500/10 to-red-500/10',
        border: 'border-rose-400',
        text: 'text-rose-700',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
      },
      lessons: aiGeneratedCourseDraft.lessons.map((l) => ({ ...l, courseId })),
    };

    addCourse(newCourse);
    setAiGeneratedCourseDraft(null);
    setIsAddCourseModal(false);
    setActiveAdminTab('courses');
    confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
  };

  // Handle Manual Create Course
  const handleCreateCourseManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) return;

    const newCourse: Course = {
      id: `c-custom-${Date.now()}`,
      level: courseLevel,
      title: courseTitle.trim(),
      vietnameseTitle: courseVnTitle.trim() || courseTitle.trim(),
      description: courseDesc.trim() || `Khóa học chuyên sâu ${courseLevel}`,
      coverImage: DEFAULT_HSK_COVERS[courseLevel],
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
    setCourseVnTitle('');
    setCourseDesc('');
    setIsAddCourseModal(false);
    setActiveAdminTab('courses');
  };

  // AI Generate Lesson (Fixed: maps & preserves ALL vocabulary, grammar, dialogue, practiceQuestions)
  const handleAiGenerateLesson = async () => {
    if (!aiTopicPrompt.trim()) {
      setAiLessonError('Vui lòng nhập chủ đề bài học trước khi tạo.');
      return;
    }
    const targetCourse = courses.find((c) => c.id === selectedCourseForLesson) || courses[0];
    const targetLevel = targetCourse?.level || courseLevel;

    setIsGeneratingAiLesson(true);
    setAiLessonError('');
    setAiLessonDraftData(null);

    try {
      const response = await fetch('/api/gemini/admin-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lesson',
          topic: aiTopicPrompt.trim(),
          level: targetLevel,
        }),
      });

      const data = await safeParseJson<any>(
        response,
        'AI chưa tạo được bài học lúc này. Vui lòng thử lại.'
      );
      if (!response.ok) {
        throw new Error(data.error || 'AI chưa tạo được bài học lúc này. Vui lòng thử lại.');
      }

      if (data.title) setLessonTitle(data.title);
      if (data.vietnameseTitle) setLessonVnTitle(data.vietnameseTitle);
      else if (data.title) setLessonVnTitle(data.title);
      if (data.durationMinutes) setLessonDuration(Number(data.durationMinutes) || 35);
      if (data.description) setLessonDesc(data.description);

      const formattedVocab: VocabItem[] = (Array.isArray(data.vocabulary) ? data.vocabulary : []).map(
        (v: any, idx: number) => ({
          id: `v-ai-${Date.now()}-${idx}`,
          word: v.word || '',
          pinyin: v.pinyin || '',
          sinoVietnamese: v.sino || v.sinoVietnamese || '',
          meaning: v.meaning || '',
          level: targetLevel,
          exampleSentence: v.example || v.exampleSentence || '',
          examplePinyin: v.examplePinyin || '',
          exampleMeaning: v.exampleMeaning || '',
        })
      );

      const formattedGrammar: GrammarPoint[] = (
        Array.isArray(data.grammar) ? data.grammar : []
      ).map((g: any, idx: number) => ({
        id: `g-ai-${Date.now()}-${idx}`,
        title: g.title || '',
        structure: g.structure || '',
        explanation: g.explanation || '',
        examples: (Array.isArray(g.examples) ? g.examples : []).map((ex: any) =>
          typeof ex === 'string'
            ? { hanzi: ex, pinyin: '', translation: '' }
            : {
                hanzi: ex.hanzi || '',
                pinyin: ex.pinyin || '',
                translation: ex.translation || '',
              }
        ),
      }));

      const formattedDialogue: DialogueLine[] = (
        Array.isArray(data.dialogue) ? data.dialogue : []
      ).map((d: any, idx: number) => ({
        id: `dl-ai-${Date.now()}-${idx}`,
        speaker: d.speaker || (idx % 2 === 0 ? 'A' : 'B'),
        chinese: d.chinese || '',
        pinyin: d.pinyin || '',
        vietnamese: d.vietnamese || '',
      }));

      const formattedPractice: PracticeQuestion[] = (
        Array.isArray(data.practiceQuestions) ? data.practiceQuestions : []
      ).map((q: any, idx: number) => ({
        id: `pq-ai-${Date.now()}-${idx}`,
        type: q.type || 'single_choice',
        question: q.question || '',
        pinyin: q.pinyin || '',
        options:
          Array.isArray(q.options) && q.options.length >= 2
            ? q.options
            : ['A. Đáp án 1', 'B. Đáp án 2'],
        correctAnswer: Number(q.correctAnswer) || 0,
        explanation: q.explanation || '',
      }));

      setAiLessonDraftData({
        vocabulary: formattedVocab,
        grammar: formattedGrammar,
        dialogue: formattedDialogue,
        practiceQuestions: formattedPractice,
      });
    } catch (err: any) {
      console.error('AI generate lesson err:', err);
      setAiLessonError(err?.message || 'Lỗi kết nối AI soạn bài. Vui lòng thử lại.');
    } finally {
      setIsGeneratingAiLesson(false);
    }
  };

  // Handle Create Lesson (uses AI-generated rich data if drafted!)
  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim()) return;

    const course = courses.find((c) => c.id === selectedCourseForLesson) || courses[0];
    if (!course) return;

    const newLesson: Lesson = {
      id: `l-custom-${Date.now()}`,
      courseId: course.id,
      level: course.level,
      lessonNumber: course.lessons.length + 1,
      title: lessonTitle.trim(),
      vietnameseTitle: lessonVnTitle.trim() || lessonTitle.trim(),
      durationMinutes: Number(lessonDuration) || 35,
      description: lessonDesc.trim() || 'Bài học thực hành mới',
      vocabulary: aiLessonDraftData?.vocabulary?.length ? aiLessonDraftData.vocabulary : [],
      grammar: aiLessonDraftData?.grammar?.length ? aiLessonDraftData.grammar : [],
      dialogue: aiLessonDraftData?.dialogue?.length ? aiLessonDraftData.dialogue : [],
      practiceQuestions: aiLessonDraftData?.practiceQuestions?.length
        ? aiLessonDraftData.practiceQuestions
        : [],
    };

    addLesson(course.id, newLesson);
    setLessonTitle('');
    setLessonVnTitle('');
    setLessonDesc('');
    setAiLessonDraftData(null);
    setIsAddLessonModal(false);
  };

  const filteredUsers = appUsers.filter((u) => {
    const q = studentSearch.toLowerCase();
    const matchesQuery =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.level.toLowerCase().includes(q);
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
    return matchesQuery && matchesRole && matchesStatus;
  });

  const filteredDecks = vocabDecks.filter(
    (d) => deckLevelFilter === 'ALL' || d.level === deckLevelFilter
  );

  if (userRole === 'student') {
    return (
      <div className="bg-white rounded-3xl border border-[#EAE5DC] p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs my-12 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-[#FFF5F3] border border-red-200 text-[#C85A43] flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="font-sans text-[21px] sm:text-[23px] font-extrabold text-[#1C1E21]">
          Khu vực dành cho Ban Quản Trị &amp; Giáo Viên
        </h2>
        <p className="text-[15px] text-slate-600 leading-relaxed">
          Tài khoản học viên không có quyền truy cập vào bảng điều khiển này. Vui lòng quay lại khu vực khóa học hoặc làm bài tập để tiếp tục học tập.
        </p>
        <button
          type="button"
          onClick={() => setActiveTab('courses')}
          className="px-6 py-3 min-h-[44px] rounded-xl bg-[#C85A43] text-white font-bold text-[14px] hover:bg-[#B24A34] transition-colors cursor-pointer"
        >
          Quay lại Khóa học
        </button>
      </div>
    );
  }

  const isTeacher = userRole === 'teacher';
  const isAdmin = userRole === 'admin';

  const totalLessonsCount = courses.reduce((acc, c) => acc + c.lessons.length, 0);
  const totalFlashcardsCount = vocabDecks.reduce((acc, d) => acc + d.cards.length, 0);
  const studentUsersCount = appUsers.filter((u) => u.role === 'student').length;

  const sidebarGroups: Array<{
    groupLabel: string;
    items: Array<{
      id: AdminTabId;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      count?: number;
    }>;
  }> = [
    {
      groupLabel: 'Tổng quan',
      items: [
        {
          id: 'overview',
          label: 'Bảng điều khiển',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      groupLabel: 'Nội dung đào tạo',
      items: [
        {
          id: 'courses',
          label: 'Khóa học & Bài học',
          icon: BookOpen,
          count: courses.length,
        },
        {
          id: 'decks',
          label: 'Từ vựng & Flashcards',
          icon: Layers,
          count: vocabDecks.length,
        },
        {
          id: 'exams',
          label: 'Ngân hàng Đề thi',
          icon: GraduationCap,
          count: exams.length,
        },
      ],
    },
    {
      groupLabel: 'Quản trị & Giao diện',
      items: [
        isAdmin
          ? {
              id: 'users',
              label: 'Tài khoản & Phân quyền',
              icon: Users,
              count: appUsers.length,
            }
          : {
              id: 'students_tracking',
              label: 'Theo dõi học viên',
              icon: Users,
              count: studentUsersCount,
            },
        {
          id: 'ui_editor',
          label: 'Chỉnh sửa giao diện',
          icon: Palette,
        },
      ],
    },
  ];

  const sectionMeta: Record<AdminTabId, { title: string; subtitle: string }> = {
    overview: {
      title: isTeacher ? 'Tổng quan giảng dạy' : 'Bảng điều khiển hệ thống',
      subtitle: 'Theo dõi chỉ số khóa học, kho từ vựng flashcards và truy cập nhanh các công cụ AI miễn phí.',
    },
    courses: {
      title: 'Quản lý Khóa học & Bài học',
      subtitle: 'Tạo khóa học trọn bộ bằng AI, biên soạn bài giảng HSK 1–5 & Boya có từ vựng, ngữ pháp, hội thoại.',
    },
    decks: {
      title: 'Bộ Từ Vựng & Thẻ Flashcards',
      subtitle: 'Tạo bộ thẻ hàng loạt bằng AI kèm ảnh mô tả tự động nén nhẹ hoặc tải ảnh thủ công.',
    },
    exams: {
      title: 'Ngân hàng Đề thi thử HSK',
      subtitle: 'Biên soạn đề thi nghe - đọc - viết - nói, nhập câu hỏi Excel hoặc tạo tự động bằng AI.',
    },
    users: {
      title: 'Tài khoản & Phân quyền',
      subtitle: 'Quản lý vai trò Quản trị viên, Giáo viên, Học viên và trạng thái kích hoạt tài khoản.',
    },
    students_tracking: {
      title: 'Theo dõi Tiến độ Học viên',
      subtitle: 'Quan sát chuỗi ngày học, bài giảng đã hoàn thành và kết quả thi thử của lớp học.',
    },
    ui_editor: {
      title: 'Chỉnh sửa Giao diện & Thương hiệu',
      subtitle: 'Thay đổi logo, màu sắc chủ đạo, nội dung trang chủ và thông tin liên hệ trung tâm.',
    },
  };

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Sidebar Brand Header */}
      <div className="p-4 border-b border-[#EAE5DC] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#C85A43] text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-[14.5px] text-[#1C1E21] leading-tight truncate">
              MiXiangg Admin
            </div>
            <div className="text-[11.5px] font-semibold text-slate-500 truncate">
              {isTeacher ? 'Cổng Giảng Viên' : 'Quản Trị Hệ Thống'}
            </div>
          </div>
        </div>
        {isMobile && (
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Đóng menu quản trị"
            className="w-9 h-9 rounded-xl hover:bg-[#FAF7F0] text-slate-500 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Grouped Navigation Links */}
      <nav aria-label="Menu quản trị" className="flex-1 p-3 space-y-5 overflow-y-auto">
        {sidebarGroups.map((group) => (
          <div key={group.groupLabel} className="space-y-1">
            <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {group.groupLabel}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeAdminTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveAdminTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 min-h-[42px] rounded-xl text-[13.5px] font-bold transition-colors cursor-pointer relative ${
                    isActive
                      ? 'bg-[#FCECE8] text-[#C85A43]'
                      : 'text-[#3B3E45] hover:bg-[#FAF7F0] hover:text-[#1C1E21]'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#C85A43]" />
                  )}
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-[#C85A43]' : 'text-slate-500'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.count !== undefined && (
                    <span
                      className={`text-[12px] font-mono font-bold tabular-nums shrink-0 ${
                        isActive ? 'text-[#C85A43]' : 'text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* AI Studio Shortcuts Footer inside Left Sidebar */}
      <div className="p-3 border-t border-[#EAE5DC]">
        <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#EAE5DC] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-extrabold uppercase tracking-wider text-[#1C1E21] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C85A43]" />
              <span>Trợ lý AI (Free)</span>
            </span>
          </div>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                setIsMobileSidebarOpen(false);
                openCreateCourseModal('ai');
              }}
              className="w-full px-3 py-2 min-h-[38px] rounded-xl bg-white hover:bg-[#FFF5F3] border border-[#EAE5DC] hover:border-[#C85A43] text-[#1C1E21] text-[12.5px] font-bold flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Tạo khóa học AI</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileSidebarOpen(false);
                setDeckToEdit(null);
                setIsAIFlashcardModalOpen(true);
              }}
              className="w-full px-3 py-2 min-h-[38px] rounded-xl bg-white hover:bg-[#FFF5F3] border border-[#EAE5DC] hover:border-[#C85A43] text-[#1C1E21] text-[12.5px] font-bold flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Tạo Flashcard AI</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {onOpenAiTutor && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileSidebarOpen(false);
                  onOpenAiTutor();
                }}
                className="w-full px-3 py-2 min-h-[38px] rounded-xl bg-[#1C1E21] hover:bg-black text-amber-300 text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Hỏi Lão Sư AI</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start pb-12">
      {/* ================================================================= */}
      {/* LEFT PERSISTENT SIDEBAR (DESKTOP)                                 */}
      {/* ================================================================= */}
      <aside className="hidden lg:flex flex-col w-[264px] shrink-0 bg-white rounded-2xl border border-[#EAE5DC] sticky top-24 max-h-[calc(100vh-7.5rem)] overflow-hidden">
        {renderSidebarContent(false)}
      </aside>

      {/* MOBILE SLIDE-OVER SIDEBAR DRAWER */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[280px] max-w-[85vw] h-full bg-white border-r border-[#EAE5DC] shadow-2xl"
          >
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* RIGHT MAIN DASHBOARD WORKSPACE                                    */}
      {/* ================================================================= */}
      <div className="flex-1 min-w-0 w-full space-y-6">
        {/* Contextual Workspace Header Bar */}
        <div className="bg-white rounded-2xl border border-[#EAE5DC] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Mở menu quản trị"
              className="lg:hidden w-11 h-11 rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] text-[#1C1E21] hover:border-[#C85A43] flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
                <span>Quản trị</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#C85A43] font-bold">
                  {sectionMeta[activeAdminTab].title}
                </span>
              </div>
              <h1 className="font-sans text-[20px] sm:text-[23px] font-extrabold text-[#1C1E21] tracking-tight leading-snug truncate mt-0.5">
                {sectionMeta[activeAdminTab].title}
              </h1>
              <p className="text-[13.5px] text-slate-600 mt-0.5 line-clamp-2">
                {sectionMeta[activeAdminTab].subtitle}
              </p>
            </div>
          </div>

          {/* Contextual Primary Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {(activeAdminTab === 'overview' || activeAdminTab === 'courses') && (
              <>
                <button
                  type="button"
                  onClick={() => openCreateCourseModal('ai')}
                  className="px-4 py-2.5 min-h-[42px] rounded-xl bg-[#1C1E21] hover:bg-black text-amber-300 font-bold text-[13.5px] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Tạo khóa học AI</span>
                </button>
                <button
                  type="button"
                  onClick={() => openCreateCourseModal('manual')}
                  className="px-4 py-2.5 min-h-[42px] rounded-xl bg-[#C85A43] hover:bg-[#B24A34] text-white font-bold text-[13.5px] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm khóa học</span>
                </button>
              </>
            )}

            {activeAdminTab === 'decks' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDeckToEdit(null);
                    setIsAIFlashcardModalOpen(true);
                  }}
                  className="px-4 py-2.5 min-h-[42px] rounded-xl bg-[#1C1E21] hover:bg-black text-amber-300 font-bold text-[13.5px] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Tạo Flashcard AI</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeckToEdit(null);
                    setIsDeckEditorOpen(true);
                  }}
                  className="px-4 py-2.5 min-h-[42px] rounded-xl bg-[#C85A43] hover:bg-[#B24A34] text-white font-bold text-[13.5px] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm bộ từ</span>
                </button>
              </>
            )}

            {activeAdminTab === 'exams' && (
              <button
                type="button"
                onClick={() => {
                  setExamToEdit(null);
                  setIsExamEditorOpen(true);
                }}
                className="px-4 py-2.5 min-h-[42px] rounded-xl bg-[#C85A43] hover:bg-[#B24A34] text-white font-bold text-[13.5px] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Soạn đề thi mới</span>
              </button>
            )}

            {activeAdminTab === 'users' && isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setUserToEdit(null);
                  setIsUserModalOpen(true);
                }}
                className="px-4 py-2.5 min-h-[42px] rounded-xl bg-[#C85A43] hover:bg-[#B24A34] text-white font-bold text-[13.5px] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm tài khoản</span>
              </button>
            )}
          </div>
        </div>

        {/* =============================================================== */}
        {/* TAB 0: OVERVIEW (DASHBOARD HOME)                                */}
        {/* =============================================================== */}
        {activeAdminTab === 'overview' && (
          <div className="space-y-6">
            {/* 4-Column KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => setActiveAdminTab('courses')}
                className="bg-white rounded-2xl border border-[#EAE5DC] hover:border-[#C85A43] p-5 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-slate-500 text-[13px] font-semibold">
                  <span>Khóa học HSK</span>
                  <BookOpen className="w-4 h-4 text-[#C85A43]" />
                </div>
                <div className="font-mono text-[28px] font-black text-[#1C1E21] mt-2 tabular-nums leading-none">
                  {courses.length}
                </div>
                <div className="text-[12.5px] text-slate-500 mt-2 tabular-nums">
                  {totalLessonsCount} bài học đã xuất bản
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveAdminTab('decks')}
                className="bg-white rounded-2xl border border-[#EAE5DC] hover:border-[#C85A43] p-5 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-slate-500 text-[13px] font-semibold">
                  <span>Bộ từ vựng Flashcard</span>
                  <Layers className="w-4 h-4 text-amber-600" />
                </div>
                <div className="font-mono text-[28px] font-black text-[#1C1E21] mt-2 tabular-nums leading-none">
                  {vocabDecks.length}
                </div>
                <div className="text-[12.5px] text-slate-500 mt-2 tabular-nums">
                  {totalFlashcardsCount} thẻ từ vựng có âm thanh
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveAdminTab('exams')}
                className="bg-white rounded-2xl border border-[#EAE5DC] hover:border-[#C85A43] p-5 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-slate-500 text-[13px] font-semibold">
                  <span>Đề thi thử HSK</span>
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="font-mono text-[28px] font-black text-[#1C1E21] mt-2 tabular-nums leading-none">
                  {exams.length}
                </div>
                <div className="text-[12.5px] text-slate-500 mt-2">
                  Chấm điểm tự động &amp; giải thích
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveAdminTab(isAdmin ? 'users' : 'students_tracking')}
                className="bg-white rounded-2xl border border-[#EAE5DC] hover:border-[#C85A43] p-5 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-slate-500 text-[13px] font-semibold">
                  <span>Học viên hoạt động</span>
                  <Users className="w-4 h-4 text-sky-700" />
                </div>
                <div className="font-mono text-[28px] font-black text-[#C85A43] mt-2 tabular-nums leading-none">
                  {serverStats.activeStudentsCount || studentsList.length}
                </div>
                <div className="text-[12.5px] text-slate-500 mt-2 tabular-nums">
                  Tỷ lệ hoàn thành: {serverStats.completionRate || 92}%
                </div>
              </button>
            </div>

            {/* AI Tools Hub (100% Free API) */}
            <div className="bg-white rounded-2xl border border-[#EAE5DC] p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-sans text-[16px] font-extrabold text-[#1C1E21] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C85A43]" />
                    <span>Trung tâm tạo nội dung bằng AI (API Miễn Phí)</span>
                  </h2>
                  <p className="text-[13px] text-slate-500 mt-0.5">
                    Kiểm soát nhanh các tác vụ AI soạn khóa học, tạo thẻ flashcard kèm ảnh minh họa nén nhẹ và trả lời học viên.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => openCreateCourseModal('ai')}
                  className="p-4 rounded-xl bg-[#FAF7F0] hover:bg-[#FFF5F3] border border-[#EAE5DC] hover:border-[#C85A43] text-left transition-colors cursor-pointer space-y-2"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#FCECE8] text-[#C85A43] flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-[14.5px] text-[#1C1E21]">
                    Tạo Khóa Học Bằng AI
                  </div>
                  <p className="text-[12.5px] text-slate-600 leading-relaxed">
                    Tự động sinh trọn bộ khóa học HSK / Boya gồm nhiều bài học, từ vựng, ngữ pháp, hội thoại và câu trắc nghiệm.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDeckToEdit(null);
                    setIsAIFlashcardModalOpen(true);
                  }}
                  className="p-4 rounded-xl bg-[#FAF7F0] hover:bg-[#FFF5F3] border border-[#EAE5DC] hover:border-[#C85A43] text-left transition-colors cursor-pointer space-y-2"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-[14.5px] text-[#1C1E21]">
                    Tạo Thẻ Từ Vựng &amp; Ảnh AI
                  </div>
                  <p className="text-[12.5px] text-slate-600 leading-relaxed">
                    Tạo bộ flashcard theo chủ đề, hỗ trợ AI vẽ ảnh minh họa hoặc tải ảnh thủ công và tự động nén dung lượng thấp.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAiTutor?.()}
                  className="p-4 rounded-xl bg-[#FAF7F0] hover:bg-[#FFF5F3] border border-[#EAE5DC] hover:border-[#C85A43] text-left transition-colors cursor-pointer space-y-2"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#1C1E21] text-amber-300 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-[14.5px] text-[#1C1E21]">
                    Kiểm tra Lão Sư AI Trả Lời
                  </div>
                  <p className="text-[12.5px] text-slate-600 leading-relaxed">
                    Mở khung chat Lão Sư AI để kiểm thử giải thích ngữ pháp, sửa câu tiếng Trung và phát âm mẫu.
                  </p>
                </button>
              </div>
            </div>

            {/* Summary Split: Recent Courses + Recent Decks */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-[#EAE5DC] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[15px] text-[#1C1E21]">
                    Khóa học hiện hành
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveAdminTab('courses')}
                    className="text-[13px] font-bold text-[#C85A43] hover:underline cursor-pointer"
                  >
                    Quản lý tất cả →
                  </button>
                </div>
                <div className="divide-y divide-[#EFECE6]">
                  {courses.slice(0, 5).map((course) => (
                    <div
                      key={course.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[12px] font-mono font-bold text-[#C85A43] bg-[#FCECE8] px-2.5 py-1 rounded-lg shrink-0">
                          {course.level}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-[14px] text-[#1C1E21] truncate">
                            {course.vietnameseTitle}
                          </div>
                          <div className="text-[12px] text-slate-500 tabular-nums">
                            {course.lessons.length} bài học
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCourseToEdit(course);
                          setIsEditCourseModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-[#EAE5DC] hover:border-[#C85A43] text-[12.5px] font-bold text-[#1C1E21] shrink-0 cursor-pointer"
                      >
                        Sửa
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#EAE5DC] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[15px] text-[#1C1E21]">
                    Bộ từ vựng Flashcards gần đây
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveAdminTab('decks')}
                    className="text-[13px] font-bold text-[#C85A43] hover:underline cursor-pointer"
                  >
                    Xem tất cả →
                  </button>
                </div>
                <div className="divide-y divide-[#EFECE6]">
                  {vocabDecks.slice(0, 5).map((deck) => (
                    <div
                      key={deck.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[12px] font-mono font-bold text-slate-700 bg-[#FAF7F0] border border-[#EAE5DC] px-2.5 py-1 rounded-lg shrink-0">
                          {deck.level}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-[14px] text-[#1C1E21] truncate">
                            {deck.title}
                          </div>
                          <div className="text-[12px] text-slate-500 tabular-nums">
                            {deck.cards.length} thẻ ·{' '}
                            {deck.createdBy === 'ai' ? 'Tạo bằng AI' : 'Quản trị viên'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedDeckId(deck.id);
                          setActiveAdminTab('decks');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-[#EAE5DC] hover:border-[#C85A43] text-[12.5px] font-bold text-[#1C1E21] shrink-0 cursor-pointer"
                      >
                        Mở thẻ
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 1: COURSES & LESSONS                                        */}
        {/* =============================================================== */}
        {activeAdminTab === 'courses' && (
          <div className="space-y-4">
            {courses.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-[#D6CBB3] p-10 text-center space-y-4">
                <BookOpen className="w-10 h-10 text-[#C85A43] mx-auto opacity-80" />
                <div className="space-y-1">
                  <h3 className="font-bold text-[17px] text-[#1C1E21]">Chưa có khóa học nào</h3>
                  <p className="text-[14px] text-slate-500">
                    Bắt đầu tạo khóa học đầu tiên bằng AI hoặc biên soạn thủ công.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openCreateCourseModal('ai')}
                  className="px-5 py-2.5 min-h-[44px] rounded-xl bg-[#C85A43] text-white font-bold text-[14px] inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Tạo khóa học bằng AI</span>
                </button>
              </div>
            ) : (
              courses.map((course) => {
                const delKey = `course-${course.id}`;
                return (
                  <div
                    key={course.id}
                    className="bg-white rounded-2xl border border-[#EAE5DC] p-5 sm:p-6 space-y-4"
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-[#EFECE6]">
                      <div className="flex items-start gap-3.5 min-w-0">
                        {course.coverImage && (
                          <img
                            src={course.coverImage}
                            alt={course.vietnameseTitle}
                            className="w-20 h-14 rounded-xl object-cover border border-[#EAE5DC] shrink-0 hidden sm:block"
                          />
                        )}
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg text-[12px] font-mono font-bold bg-[#FCECE8] text-[#C85A43]">
                              {course.level}
                            </span>
                            <span className="text-[12.5px] font-mono font-semibold text-slate-500 tabular-nums">
                              {course.lessons.length} bài học
                            </span>
                          </div>
                          <h4 className="font-sans font-extrabold text-[17.5px] text-[#1C1E21] leading-snug">
                            {course.vietnameseTitle}
                          </h4>
                          <p className="text-[13.5px] text-slate-600 line-clamp-2">
                            {course.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCourseForLesson(course.id);
                            setAiLessonError('');
                            setAiLessonDraftData(null);
                            setIsAddLessonModal(true);
                          }}
                          className="px-3.5 py-2 min-h-[40px] rounded-xl bg-[#1C1E21] hover:bg-black text-amber-300 font-bold text-[13px] flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Soạn bài AI</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCourseForLessonEditor(course);
                            setLessonToEdit(null);
                            setIsLessonEditorOpen(true);
                          }}
                          className="px-3.5 py-2 min-h-[40px] rounded-xl bg-[#C85A43] hover:bg-[#B24A34] text-white font-bold text-[13px] flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Soạn chi tiết</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCourseToEdit(course);
                            setIsEditCourseModalOpen(true);
                          }}
                          className="px-3.5 py-2 min-h-[40px] rounded-xl bg-[#FAF7F0] hover:bg-[#FFF5F3] text-[#1C1E21] font-bold text-[13px] border border-[#EAE5DC] hover:border-[#C85A43] flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#C85A43]" />
                          <span>Sửa</span>
                        </button>

                        {pendingDeleteKey === delKey ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                deleteCourse(course.id);
                                setPendingDeleteKey(null);
                              }}
                              className="px-3 py-2 min-h-[40px] rounded-xl bg-red-600 text-white text-[12.5px] font-bold cursor-pointer"
                            >
                              Xác nhận xóa
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteKey(null)}
                              className="px-2.5 py-2 min-h-[40px] rounded-xl border border-[#EAE5DC] text-[12.5px] font-semibold text-slate-600 cursor-pointer"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPendingDeleteKey(delKey)}
                            className="w-10 h-10 rounded-xl border border-[#EAE5DC] text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                            title="Xóa khóa học"
                            aria-label="Xóa khóa học"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Lessons list inside course */}
                    {course.lessons.length === 0 ? (
                      <div className="p-4 rounded-xl bg-[#FAF7F0] border border-dashed border-[#D6CBB3] text-center text-[13.5px] text-slate-500">
                        Khóa học chưa có bài học nào. Bấm <strong>Soạn bài AI</strong> hoặc{' '}
                        <strong>Soạn chi tiết</strong> để thêm bài học đầu tiên.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {course.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#EAE5DC] flex items-center justify-between gap-3 hover:border-[#C85A43]/60 transition-colors"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <span className="font-bold text-[14.5px] text-[#1C1E21] block truncate">
                                Bài {lesson.lessonNumber}: {lesson.title}
                              </span>
                              <span className="text-slate-600 block text-[12.5px] truncate tabular-nums">
                                {lesson.vietnameseTitle} · {lesson.durationMinutes}p ·{' '}
                                {lesson.vocabulary.length} từ · {lesson.dialogue.length} thoại
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setCourseForLessonEditor(course);
                                  setLessonToEdit(lesson);
                                  setIsLessonEditorOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-white border border-[#EAE5DC] text-[#1C1E21] hover:text-[#C85A43] hover:border-[#C85A43] flex items-center gap-1 text-[12.5px] font-bold cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Sửa</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteLesson(course.id, lesson.id)}
                                className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                                title="Xóa bài học"
                                aria-label="Xóa bài học"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 2: VOCABULARY DECKS & FLASHCARDS                            */}
        {/* =============================================================== */}
        {activeAdminTab === 'decks' && (
          <div className="space-y-4">
            {/* Level Filter Bar */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white rounded-xl border border-[#EAE5DC]">
              {(['ALL', 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDeckLevelFilter(lvl)}
                  className={`px-3.5 py-2 rounded-lg text-[13px] font-bold transition-colors cursor-pointer ${
                    deckLevelFilter === lvl
                      ? 'bg-[#C85A43] text-white'
                      : 'text-[#3B3E45] hover:bg-[#FAF7F0]'
                  }`}
                >
                  {lvl === 'ALL' ? 'Tất cả cấp độ' : lvl}
                </button>
              ))}
            </div>

            {filteredDecks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-[#D6CBB3] p-10 text-center space-y-3">
                <Layers className="w-9 h-9 text-[#C85A43] mx-auto opacity-80" />
                <div className="font-bold text-[16px] text-[#1C1E21]">
                  Chưa có bộ từ vựng ở cấp độ này
                </div>
                <button
                  type="button"
                  onClick={() => setIsAIFlashcardModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#1C1E21] text-amber-300 font-bold text-[13.5px] inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Tạo bộ thẻ bằng AI ngay</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDecks.map((deck) => {
                  const isExpanded = expandedDeckId === deck.id;
                  const delKey = `deck-${deck.id}`;
                  const cardsWithImage = deck.cards.filter((c) => Boolean(c.imageUrl)).length;

                  return (
                    <div
                      key={deck.id}
                      className="bg-white rounded-2xl border border-[#EAE5DC] overflow-hidden"
                    >
                      <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-[12.5px] font-semibold text-slate-600 tabular-nums">
                            <span className="px-2.5 py-0.5 rounded-lg font-mono font-bold bg-[#FCECE8] text-[#C85A43]">
                              {deck.level}
                            </span>
                            <span>{deck.category}</span>
                            <span>·</span>
                            <span>{deck.cards.length} thẻ</span>
                            {cardsWithImage > 0 && (
                              <>
                                <span>·</span>
                                <span className="text-emerald-700 inline-flex items-center gap-1">
                                  <ImageIcon className="w-3.5 h-3.5" />
                                  {cardsWithImage} ảnh mô tả
                                </span>
                              </>
                            )}
                            {deck.createdBy === 'ai' && (
                              <>
                                <span>·</span>
                                <span className="text-amber-700 font-bold">AI biên soạn</span>
                              </>
                            )}
                          </div>
                          <h4 className="font-sans text-[17px] font-extrabold text-[#1C1E21] truncate">
                            {deck.title}
                          </h4>
                          <p className="text-[13.5px] text-slate-600 line-clamp-2">
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
                            className="px-3.5 py-2 min-h-[40px] rounded-xl bg-[#FCECE8] hover:bg-[#C85A43] text-[#C85A43] hover:text-white font-bold text-[13px] flex items-center gap-1.5 cursor-pointer transition-colors"
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
                            className="px-3.5 py-2 min-h-[40px] rounded-xl bg-[#FAF7F0] hover:bg-[#FFF5F3] text-[#1C1E21] font-bold text-[13px] border border-[#EAE5DC] flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#C85A43]" />
                            <span>Sửa bộ</span>
                          </button>

                          {pendingDeleteKey === delKey ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  deleteVocabDeck(deck.id);
                                  setPendingDeleteKey(null);
                                }}
                                className="px-3 py-2 min-h-[40px] rounded-xl bg-red-600 text-white text-[12.5px] font-bold cursor-pointer"
                              >
                                Xóa
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDeleteKey(null)}
                                className="px-2.5 py-2 min-h-[40px] rounded-xl border border-[#EAE5DC] text-[12.5px] font-semibold cursor-pointer"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPendingDeleteKey(delKey)}
                              className="w-10 h-10 rounded-xl border border-[#EAE5DC] text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                              title="Xóa bộ từ vựng"
                              aria-label="Xóa bộ từ vựng"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setExpandedDeckId(isExpanded ? null : deck.id)}
                            className="px-3.5 py-2 min-h-[40px] rounded-xl bg-[#1C1E21] hover:bg-[#C85A43] text-white font-bold text-[13px] flex items-center gap-1.5 cursor-pointer transition-colors tabular-nums"
                          >
                            <span>{isExpanded ? 'Ẩn thẻ' : `Xem ${deck.cards.length} thẻ`}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-[#EFECE6] bg-[#FAF7F0] p-5 space-y-4">
                          {deck.cards.length === 0 ? (
                            <div className="text-center py-6 text-[14px] text-slate-500">
                              Bộ từ này chưa có thẻ nào. Bấm <strong>Thêm thẻ</strong> để soạn từ đầu tiên.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                              {deck.cards.map((card) => {
                                const imgKB = card.imageUrl?.startsWith('data:')
                                  ? estimateDataUrlKB(card.imageUrl)
                                  : 0;
                                return (
                                  <div
                                    key={card.id}
                                    className="bg-white rounded-xl border border-[#EAE5DC] p-3.5 space-y-2.5 hover:border-[#C85A43]/60 transition-colors"
                                  >
                                    {card.imageUrl && (
                                      <div className="w-full aspect-[4/3] rounded-lg border border-[#EAE5DC] bg-[#FAF7F0] overflow-hidden relative">
                                        <img
                                          src={card.imageUrl}
                                          alt={card.meaning}
                                          loading="lazy"
                                          referrerPolicy="no-referrer"
                                          className="w-full h-full object-cover"
                                        />
                                        {imgKB > 0 && (
                                          <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/65 text-white text-[11px] font-mono font-bold tabular-nums">
                                            {imgKB} KB
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <div className="flex items-baseline gap-2 flex-wrap">
                                          <span className="text-[20px] font-black text-[#1C1E21] font-serif leading-none">
                                            {card.word}
                                          </span>
                                          <span className="text-[13px] font-mono font-bold text-[#C85A43]">
                                            {card.pinyin}
                                          </span>
                                        </div>
                                        {card.sinoVietnamese && (
                                          <span className="text-[12px] text-slate-500 block mt-0.5">
                                            ({card.sinoVietnamese})
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-0.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => speakChinese(card.word)}
                                          className="p-1.5 rounded-lg text-[#C85A43] hover:bg-[#FFF5F3] cursor-pointer"
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
                                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#1C1E21] hover:bg-[#FAF7F0] cursor-pointer"
                                          title="Sửa thẻ & ảnh mô tả"
                                          aria-label="Sửa thẻ"
                                        >
                                          <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => deleteCardFromDeck(deck.id, card.id)}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                          title="Xóa thẻ"
                                          aria-label="Xóa thẻ"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>

                                    <p className="text-[14px] font-bold text-[#1C1E21]">
                                      {card.meaning}
                                    </p>

                                    {card.exampleSentence && (
                                      <div className="text-[12.5px] bg-[#FAF7F0] p-2.5 rounded-lg border border-[#EFECE6] space-y-0.5">
                                        <p className="font-serif text-[13.5px] text-[#1C1E21]">
                                          {card.exampleSentence}
                                        </p>
                                        <p className="text-slate-600">{card.exampleMeaning}</p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 3: EXAMS                                                    */}
        {/* =============================================================== */}
        {activeAdminTab === 'exams' && (
          <div className="space-y-4">
            {exams.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-[#D6CBB3] p-10 text-center space-y-3">
                <GraduationCap className="w-9 h-9 text-[#C85A43] mx-auto opacity-80" />
                <div className="font-bold text-[16px] text-[#1C1E21]">
                  Chưa có đề thi thử nào trong ngân hàng
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setExamToEdit(null);
                    setIsExamEditorOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#C85A43] text-white font-bold text-[13.5px] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Soạn đề thi đầu tiên</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {exams.map((exam) => {
                  const delKey = `exam-${exam.id}`;
                  return (
                    <div
                      key={exam.id}
                      className="bg-white rounded-2xl border border-[#EAE5DC] p-5 flex flex-col justify-between gap-4 hover:border-[#C85A43]/60 transition-colors"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg text-[12.5px] font-mono font-bold bg-[#FCECE8] text-[#C85A43]">
                            {exam.level}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setExamToEdit(exam);
                                setIsExamEditorOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#FAF7F0] hover:bg-[#FFF5F3] border border-[#EAE5DC] hover:border-[#C85A43] font-bold text-[12.5px] text-[#1C1E21] flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#C85A43]" />
                              <span>Sửa đề</span>
                            </button>
                            {pendingDeleteKey === delKey ? (
                              <button
                                type="button"
                                onClick={() => {
                                  deleteExam(exam.id);
                                  setPendingDeleteKey(null);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-[12px] font-bold cursor-pointer"
                              >
                                Xác nhận
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPendingDeleteKey(delKey)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                title="Xóa đề thi"
                                aria-label="Xóa đề thi"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-sans font-extrabold text-[16.5px] text-[#1C1E21] leading-snug">
                            {exam.title}
                          </h4>
                          <p className="text-[13.5px] text-slate-600 mt-1">{exam.subtitle}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#EFECE6] text-[13px] text-slate-600 flex flex-wrap items-center gap-3 font-mono tabular-nums">
                        <span>
                          Thời gian: <strong className="text-[#1C1E21]">{exam.timeLimitMinutes}p</strong>
                        </span>
                        <span>·</span>
                        <span>
                          Số câu: <strong className="text-[#1C1E21]">{exam.questions.length}</strong>
                        </span>
                        <span>·</span>
                        <span>
                          Điểm đạt:{' '}
                          <strong className="text-[#C85A43]">
                            {exam.passScore}/{exam.totalPoints}
                          </strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 4: USER MANAGEMENT (ADMIN ONLY)                             */}
        {/* =============================================================== */}
        {activeAdminTab === 'users' && isAdmin && (
          <div className="bg-white rounded-2xl border border-[#EAE5DC] overflow-hidden p-5 space-y-4">
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-[12.5px]">
                {(['all', 'admin', 'teacher', 'student'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setUserRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      userRoleFilter === r
                        ? 'bg-[#C85A43] text-white'
                        : 'bg-[#FAF7F0] text-[#3B3E45] border border-[#EAE5DC] hover:border-[#C85A43]'
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
                <div className="h-4 w-px bg-[#EAE5DC] mx-1 hidden sm:block" />
                {(['all', 'active', 'suspended'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setUserStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      userStatusFilter === st
                        ? 'bg-[#1C1E21] text-white'
                        : 'bg-[#FAF7F0] text-[#3B3E45] border border-[#EAE5DC] hover:border-[#C85A43]'
                    }`}
                  >
                    {st === 'all' ? 'Mọi trạng thái' : st === 'active' ? 'Hoạt động' : 'Đã khóa'}
                  </button>
                ))}
              </div>

              <div className="relative xl:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm tên, email, cấp độ..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 text-[13.5px] rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-[#C85A43]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13.5px]">
                <thead className="bg-[#FAF7F0] text-[#1C1E21] font-bold border-y border-[#EAE5DC]">
                  <tr>
                    <th className="py-3 px-4">Tài khoản &amp; Email</th>
                    <th className="py-3 px-4">Mục tiêu</th>
                    <th className="py-3 px-4">Vai trò</th>
                    <th className="py-3 px-4">Tiến độ</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFECE6]">
                  {filteredUsers.map((user) => {
                    const delKey = `user-${user.id}`;
                    return (
                      <tr key={user.id} className="hover:bg-[#FAF7F0]/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={resolveCartoonAvatar(user.avatar, user.email)}
                              alt={user.name}
                              className="w-9 h-9 rounded-full object-cover ring-1 ring-[#EAE5DC] shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-[#1C1E21] block truncate">
                                {user.name}
                              </span>
                              <span className="text-[12px] text-slate-500 block truncate">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#C85A43]">
                          {user.level}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={user.role}
                            onChange={(e) =>
                              updateUserRoleAdmin(user.id, e.target.value as UserRole)
                            }
                            className="text-[12.5px] font-bold py-1.5 px-2.5 rounded-lg border border-[#EAE5DC] bg-[#FAF7F0] cursor-pointer focus:outline-none focus:border-[#C85A43]"
                          >
                            <option value="student">Học viên</option>
                            <option value="teacher">Giáo viên</option>
                            <option value="admin">Quản trị viên</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 tabular-nums text-[12.5px] text-slate-600">
                          <span className="font-bold text-[#1C1E21] block">
                            {user.completedLessons || 0} bài đã học
                          </span>
                          <span>Thi thử: {user.examsTaken || 0} lần</span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() =>
                              updateUserStatusAdmin(
                                user.id,
                                user.status === 'active' ? 'suspended' : 'active'
                              )
                            }
                            className={`px-2.5 py-1 rounded-lg text-[12px] font-bold border cursor-pointer ${
                              user.status === 'active'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setUserToEdit(user);
                                setIsUserModalOpen(true);
                              }}
                              className="p-2 rounded-lg text-slate-500 hover:text-[#C85A43] hover:bg-[#FFF5F3] cursor-pointer"
                              title="Chỉnh sửa"
                              aria-label="Chỉnh sửa tài khoản"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {pendingDeleteKey === delKey ? (
                              <button
                                type="button"
                                onClick={() => {
                                  deleteUserAdmin(user.id);
                                  setPendingDeleteKey(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[12px] font-bold cursor-pointer"
                              >
                                Xóa
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPendingDeleteKey(delKey)}
                                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                title="Xóa tài khoản"
                                aria-label="Xóa tài khoản"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 5: TEACHER STUDENT TRACKING                                 */}
        {/* =============================================================== */}
        {activeAdminTab === 'students_tracking' && (
          <div className="bg-white rounded-2xl border border-[#EAE5DC] p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[14px] font-bold text-[#1C1E21] tabular-nums">
                Danh sách học viên ({studentUsersCount})
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm học viên, email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 text-[13.5px] rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-[#C85A43]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13.5px]">
                <thead className="bg-[#FAF7F0] text-[#1C1E21] font-bold border-y border-[#EAE5DC]">
                  <tr>
                    <th className="py-3 px-4">Học viên</th>
                    <th className="py-3 px-4">Mục tiêu</th>
                    <th className="py-3 px-4">Tiến độ bài học</th>
                    <th className="py-3 px-4">Thi thử</th>
                    <th className="py-3 px-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFECE6]">
                  {appUsers
                    .filter((u) => u.role === 'student')
                    .filter((u) => {
                      const q = studentSearch.toLowerCase();
                      return (
                        u.name.toLowerCase().includes(q) ||
                        u.email.toLowerCase().includes(q) ||
                        u.level.toLowerCase().includes(q)
                      );
                    })
                    .map((student) => {
                      const pct = Math.min(
                        100,
                        Math.round(((student.completedLessons || 0) / 10) * 100)
                      );
                      return (
                        <tr key={student.id} className="hover:bg-[#FAF7F0]/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={resolveCartoonAvatar(student.avatar, student.email)}
                                alt={student.name}
                                className="w-9 h-9 rounded-full object-cover ring-1 ring-[#EAE5DC] shrink-0"
                              />
                              <div>
                                <span className="font-bold text-[#1C1E21] block">
                                  {student.name}
                                </span>
                                <span className="text-[12px] text-slate-500">{student.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[#C85A43]">
                            {student.level}
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1 max-w-[160px] tabular-nums">
                              <div className="flex justify-between text-[12px] font-mono font-bold text-[#1C1E21]">
                                <span>{student.completedLessons || 0} bài</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="w-full bg-[#EFECE6] h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#C85A43] h-full rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 tabular-nums text-[12.5px]">
                            <span className="font-bold text-[#1C1E21] block">
                              {student.examsTaken || 0} lần thi
                            </span>
                            <span className="text-slate-500">
                              Điểm TB: {student.avgScore ? `${student.avgScore}/300` : 'Chưa thi'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-lg text-[12px] font-bold border ${
                                student.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}
                            >
                              {student.status === 'active' ? 'Đang học' : 'Đã khóa'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 6: UI CUSTOMIZATION EDITOR                                  */}
        {/* =============================================================== */}
        {activeAdminTab === 'ui_editor' && <UIEditorPanel />}
      </div>

      {/* ================================================================= */}
      {/* MODAL 1: ADD COURSE (DUAL MODE: AI COURSE GENERATOR & MANUAL)     */}
      {/* ================================================================= */}
      {isAddCourseModal && (
        <div
          onClick={() => setIsAddCourseModal(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-[#EAE5DC] shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto relative"
          >
            <button
              type="button"
              onClick={() => setIsAddCourseModal(false)}
              aria-label="Đóng cửa sổ tạo khóa học"
              className="absolute top-5 right-5 w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-[#FAF7F0] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pr-10">
              <h3 className="font-sans text-[19px] font-extrabold text-[#1C1E21]">
                Tạo Khóa Học HSK / Boya Mới
              </h3>
              <p className="text-[13px] text-slate-500 mt-0.5">
                Chọn chế độ AI tự động thiết kế trọn bộ bài học (API Free) hoặc tự tạo khóa học thủ công.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAF7F0] rounded-xl border border-[#EAE5DC]">
              <button
                type="button"
                onClick={() => setCourseCreateMode('ai')}
                className={`py-2.5 px-3 rounded-lg text-[13.5px] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  courseCreateMode === 'ai'
                    ? 'bg-[#1C1E21] text-amber-300 shadow-2xs'
                    : 'text-slate-600 hover:text-[#1C1E21]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Tạo trọn bộ bằng AI</span>
              </button>
              <button
                type="button"
                onClick={() => setCourseCreateMode('manual')}
                className={`py-2.5 px-3 rounded-lg text-[13.5px] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  courseCreateMode === 'manual'
                    ? 'bg-[#C85A43] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-[#1C1E21]'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tạo thủ công</span>
              </button>
            </div>

            {courseCreateMode === 'ai' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[12.5px] font-bold text-[#1C1E21] block mb-1">
                      Cấp độ HSK:
                    </label>
                    <select
                      value={courseLevel}
                      onChange={(e) => setCourseLevel(e.target.value as HSKLevel)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] text-[13.5px] font-semibold focus:border-[#C85A43] focus:outline-none"
                    >
                      <option value="HSK 1">HSK 1</option>
                      <option value="HSK 2">HSK 2</option>
                      <option value="HSK 3">HSK 3</option>
                      <option value="HSK 4">HSK 4</option>
                      <option value="HSK 5">HSK 5</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[12.5px] font-bold text-[#1C1E21] block mb-1">
                      Giáo trình:
                    </label>
                    <select
                      value={aiCourseCurriculum}
                      onChange={(e) => setAiCourseCurriculum(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] text-[13.5px] font-semibold focus:border-[#C85A43] focus:outline-none"
                    >
                      <option value="HSK">Chuẩn HSK Quốc tế</option>
                      <option value="BOYA">Giáo trình Boya</option>
                      <option value="COMM">Giao tiếp thực chiến</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[12.5px] font-bold text-[#1C1E21] block mb-1">
                      Số bài học tạo sẵn:
                    </label>
                    <select
                      value={aiCourseLessonCount}
                      onChange={(e) => setAiCourseLessonCount(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] text-[13.5px] font-semibold focus:border-[#C85A43] focus:outline-none tabular-nums"
                    >
                      <option value={2}>2 bài học hoàn chỉnh</option>
                      <option value={3}>3 bài học hoàn chỉnh</option>
                      <option value={4}>4 bài học hoàn chỉnh</option>
                      <option value={5}>5 bài học hoàn chỉnh</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[12.5px] font-bold text-[#1C1E21] block mb-1">
                    Chủ đề / Định hướng khóa học <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={aiCourseTopic}
                    onChange={(e) => setAiCourseTopic(e.target.value)}
                    placeholder="Ví dụ: Giao tiếp đi làm công ty Trung Quốc, Luyện thi HSK 3 cấp tốc..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] focus:bg-white focus:border-[#C85A43] focus:outline-none text-[14px] font-semibold"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {AI_COURSE_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setAiCourseTopic(s)}
                        className="text-[11.5px] px-2.5 py-1 rounded-lg bg-[#FAF7F0] hover:bg-[#FCECE8] border border-[#EAE5DC] text-slate-700 font-semibold cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAiGenerateCourse}
                  disabled={isGeneratingAiCourse}
                  className="w-full py-3 min-h-[44px] rounded-xl bg-[#1C1E21] hover:bg-black text-amber-300 font-bold text-[14px] flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isGeneratingAiCourse ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>AI đang thiết kế khóa học &amp; {aiCourseLessonCount} bài học...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>AI Thiết Kế Trọn Bộ Khóa Học</span>
                    </>
                  )}
                </button>

                {aiCourseError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{aiCourseError}</span>
                  </div>
                )}

                {/* AI Course Preview */}
                {aiGeneratedCourseDraft && (
                  <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#EAE5DC] space-y-3">
                    <div className="flex items-center gap-2 text-emerald-700 text-[13px] font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        AI đã thiết kế xong khóa học gồm {aiGeneratedCourseDraft.lessons.length} bài học chi tiết!
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11.5px] font-bold text-slate-600 block mb-0.5">
                          Tên khóa học (Hiển thị)
                        </label>
                        <input
                          type="text"
                          value={aiGeneratedCourseDraft.vietnameseTitle}
                          onChange={(e) =>
                            setAiGeneratedCourseDraft({
                              ...aiGeneratedCourseDraft,
                              vietnameseTitle: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#EAE5DC] bg-white text-[13.5px] font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11.5px] font-bold text-slate-600 block mb-0.5">
                          Tên ngắn / Song ngữ
                        </label>
                        <input
                          type="text"
                          value={aiGeneratedCourseDraft.title}
                          onChange={(e) =>
                            setAiGeneratedCourseDraft({
                              ...aiGeneratedCourseDraft,
                              title: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#EAE5DC] bg-white text-[13.5px] font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11.5px] font-bold text-slate-600 block mb-0.5">
                        Mô tả mục tiêu khóa học
                      </label>
                      <textarea
                        rows={2}
                        value={aiGeneratedCourseDraft.description}
                        onChange={(e) =>
                          setAiGeneratedCourseDraft({
                            ...aiGeneratedCourseDraft,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-[#EAE5DC] bg-white text-[13px]"
                      />
                    </div>

                    <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
                      {aiGeneratedCourseDraft.lessons.map((lesson, idx) => (
                        <div
                          key={lesson.id || idx}
                          className="p-3 rounded-xl bg-white border border-[#EAE5DC] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-[13.5px] text-[#1C1E21] truncate">
                              Bài {lesson.lessonNumber}: {lesson.title}
                            </div>
                            <div className="text-[12px] text-slate-500 truncate">
                              {lesson.vietnameseTitle}
                            </div>
                          </div>
                          <div className="text-[11.5px] font-mono font-bold text-slate-600 tabular-nums shrink-0">
                            {lesson.vocabulary.length} từ · {lesson.grammar.length} NP ·{' '}
                            {lesson.dialogue.length} thoại · {lesson.practiceQuestions.length} câu hỏi
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE5DC]">
                      <button
                        type="button"
                        onClick={() => setIsAddCourseModal(false)}
                        className="px-4 py-2 min-h-[42px] rounded-xl border border-[#EAE5DC] bg-white text-[13px] font-bold text-slate-600 cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAiCourse}
                        className="px-5 py-2 min-h-[42px] rounded-xl bg-[#C85A43] hover:bg-[#B24A34] text-white text-[13.5px] font-bold cursor-pointer"
                      >
                        Lưu khóa học &amp; {aiGeneratedCourseDraft.lessons.length} bài học
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleCreateCourseManual} className="space-y-4 text-[13.5px]">
                <div>
                  <label className="font-bold text-[#1C1E21] block mb-1">Cấp độ HSK:</label>
                  <select
                    value={courseLevel}
                    onChange={(e) => setCourseLevel(e.target.value as HSKLevel)}
                    className="w-full p-3 rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] focus:border-[#C85A43] focus:outline-none font-semibold"
                  >
                    <option value="HSK 1">HSK 1</option>
                    <option value="HSK 2">HSK 2</option>
                    <option value="HSK 3">HSK 3</option>
                    <option value="HSK 4">HSK 4</option>
                    <option value="HSK 5">HSK 5</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#1C1E21] block mb-1">
                    Tên khóa học <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Khóa học HSK 3 - Luyện thi cấp tốc"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] focus:bg-white focus:border-[#C85A43] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1C1E21] block mb-1">
                    Tên hiển thị tiếng Việt (Tùy chọn):
                  </label>
                  <input
                    type="text"
                    placeholder="Để trống nếu dùng giống tên khóa học"
                    value={courseVnTitle}
                    onChange={(e) => setCourseVnTitle(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] focus:bg-white focus:border-[#C85A43] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1C1E21] block mb-1">Mô tả khóa học:</label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả mục tiêu từ vựng, ngữ pháp..."
                    value={courseDesc}
                    onChange={(e) => setCourseDesc(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] focus:bg-white focus:border-[#C85A43] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddCourseModal(false)}
                    className="px-4 py-2.5 min-h-[42px] rounded-xl text-[#1C1E21] hover:bg-[#FAF7F0] border border-[#EAE5DC] font-bold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 min-h-[42px] rounded-xl bg-[#C85A43] text-white font-bold hover:bg-[#B24A34] cursor-pointer"
                  >
                    Lưu khóa học
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: QUICK ADD LESSON WITH FULL AI DRAFT RETENTION            */}
      {/* ================================================================= */}
      {isAddLessonModal && (
        <div
          onClick={() => setIsAddLessonModal(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#EAE5DC] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative"
          >
            <button
              type="button"
              onClick={() => setIsAddLessonModal(false)}
              aria-label="Đóng cửa sổ"
              className="absolute top-5 right-5 w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-[#FAF7F0] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-sans text-[19px] font-extrabold text-[#1C1E21] pr-10">
              Soạn Nhanh Bài Học Bằng AI
            </h3>

            {/* Quick AI Drafting Helper */}
            <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#EAE5DC] space-y-2.5 text-[13.5px]">
              <span className="font-bold text-[#1C1E21] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#C85A43]" />
                <span>Nhập chủ đề để AI tự soạn trọn bộ từ vựng, ngữ pháp, hội thoại &amp; bài tập:</span>
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={aiTopicPrompt}
                  onChange={(e) => setAiTopicPrompt(e.target.value)}
                  placeholder="Nhập chủ đề bài học..."
                  className="flex-1 px-3 py-2.5 rounded-xl border border-[#EAE5DC] bg-white text-[13.5px]"
                />
                <button
                  type="button"
                  disabled={isGeneratingAiLesson}
                  onClick={handleAiGenerateLesson}
                  className="px-4 py-2.5 min-h-[42px] rounded-xl bg-[#1C1E21] hover:bg-black text-amber-300 font-bold shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isGeneratingAiLesson && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isGeneratingAiLesson ? 'Đang soạn...' : 'AI Soạn'}</span>
                </button>
              </div>

              {aiLessonError && (
                <div className="text-[12.5px] font-semibold text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{aiLessonError}</span>
                </div>
              )}

              {aiLessonDraftData && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12.5px] font-bold flex items-center gap-1.5 tabular-nums">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Đã sẵn sàng lưu: {aiLessonDraftData.vocabulary.length} từ vựng ·{' '}
                    {aiLessonDraftData.grammar.length} ngữ pháp ·{' '}
                    {aiLessonDraftData.dialogue.length} lượt thoại ·{' '}
                    {aiLessonDraftData.practiceQuestions.length} bài tập!
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={handleCreateLesson} className="space-y-3.5 text-[13.5px]">
              <div>
                <label className="font-bold text-[#1C1E21] block mb-1">Thuộc khóa học:</label>
                <select
                  value={selectedCourseForLesson}
                  onChange={(e) => setSelectedCourseForLesson(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] font-semibold"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.level} - {c.vietnameseTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#1C1E21] block mb-1">
                  Tiêu đề tiếng Trung <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 第5课：周末你打算做什么？"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] focus:bg-white font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-[#1C1E21] block mb-1">
                  Tiêu đề tiếng Việt <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bài 5: Cuối tuần bạn dự định làm gì?"
                  value={lessonVnTitle}
                  onChange={(e) => setLessonVnTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1C1E21] block mb-1">Thời lượng (phút):</label>
                  <input
                    type="number"
                    min={10}
                    max={120}
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1C1E21] block mb-1">Mục tiêu bài học:</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả các kỹ năng đạt được sau bài học..."
                  value={lessonDesc}
                  onChange={(e) => setLessonDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddLessonModal(false)}
                  className="px-4 py-2.5 min-h-[42px] rounded-xl text-[#1C1E21] hover:bg-[#FAF7F0] border border-[#EAE5DC] font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 min-h-[42px] rounded-xl bg-[#C85A43] hover:bg-[#B24A34] text-white font-bold cursor-pointer"
                >
                  Lưu bài học
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

      {/* Lesson Editor Modal */}
      {courses.length > 0 && (
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
      )}

      {/* Exam Editor Modal */}
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

      {/* Deck Editor Modal */}
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

      {/* Flashcard Card Editor Modal */}
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

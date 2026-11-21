import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  PlusCircle,
  ChevronRight,
  Search,
  ArrowLeft,
  Layers,
  StickyNote,
  Volume2,
  BookmarkCheck,
  Plus,
  Trash2,
  Pin,
  FileText,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react';
import { useHSK } from '../context/HSKContext';
import { Course, HSKLevel, Lesson } from '../types/hsk';
import { VocabIllustration } from './VocabIllustration';
import { speakChinese } from '../utils/audioSpeech';

interface CoursesViewProps {
  onOpenLesson: (lesson: Lesson) => void;
  onOpenAdminNewCourse?: () => void;
  onOpenAiTutor?: () => void;
  resetKey?: number;
}

interface CourseNoteItem {
  id: string;
  courseId: string;
  lessonTitle: string;
  title: string;
  content: string;
  createdAt: string;
  isPinned?: boolean;
}

const NOTES_STORAGE_KEY = 'mixiang_hsk_course_notes_v1';

const COURSE_COVER_BY_LEVEL: Record<HSKLevel, string> = {
  'HSK 1': '/assets/aistudio/hsk1_2aed1171.png',
  'HSK 2': '/assets/aistudio/hsk2_40c3fcef.png',
  'HSK 3': '/assets/aistudio/hsk3_4d56bb96.png',
  'HSK 4': '/assets/aistudio/hsk4_d9e3fc6a.png',
  'HSK 5': '/assets/aistudio/hsk5_f308a036.png',
};

const getCourseCover = (course: Course): string =>
  course.coverImage || COURSE_COVER_BY_LEVEL[course.level] || '/assets/aistudio/hsk1_2aed1171.png';

const DEFAULT_COURSE_NOTES: CourseNoteItem[] = [
  {
    id: 'note-default-1',
    courseId: 'c-hsk1',
    lessonTitle: 'Bài 1: Làm quen & Chào hỏi cơ bản',
    title: 'Quy tắc biến điệu hai thanh 3 đi liền nhau',
    content:
      'Khi hai chữ mang thanh 3 đứng liền nhau (ví dụ: 你好 nǐ hǎo, 很好 hěn hǎo), chữ thứ nhất sẽ đọc biến điệu thành thanh 2 (ní hǎo, hén hǎo), nhưng khi viết Pinyin vẫn giữ nguyên dấu thanh 3.',
    createdAt: 'Ghi chú trọng tâm',
    isPinned: true,
  },
  {
    id: 'note-default-2',
    courseId: 'c-hsk1',
    lessonTitle: 'Bài 2: Lời cảm ơn và xin lỗi trong đời sống',
    title: 'Biến điệu của phó từ phủ định 不 (bù)',
    content:
      'Chữ 不 (bù) bình thường mang thanh 4. Tuy nhiên khi đứng trước một âm tiết mang thanh 4 khác (như 是 shì, 客气 kèqi), chữ 不 sẽ đọc thành thanh 2: 不是 (bú shì), 不客气 (bú kèqi).',
    createdAt: 'Ghi chú trọng tâm',
    isPinned: false,
  },
  {
    id: 'note-default-3',
    courseId: 'c-hsk2',
    lessonTitle: 'Bài 1: Lên kế hoạch du lịch và thời tiết',
    title: 'Cách dùng phó từ chỉ mức độ cao nhất 最 (zuì)',
    content:
      'Cấu trúc: 最 + Tính từ / Động từ tâm lý (最好: tốt nhất, 最喜欢: thích nhất). Dùng để nhấn mạnh sự lựa chọn hoặc đánh giá đứng đầu trong một tập hợp.',
    createdAt: 'Ghi chú trọng tâm',
    isPinned: true,
  },
];

export const CoursesView: React.FC<CoursesViewProps> = ({
  onOpenLesson,
  onOpenAiTutor,
  resetKey,
}) => {
  const {
    courses,
    activeLevel,
    setActiveLevel,
    studentProfile,
    userRole,
    setActiveTab,
    showPinyin,
    setShowPinyin,
    markVocabMastered,
    markVocabLearning,
  } = useHSK();

  // State: null = Course List Page; string = Inside a selected Course Learning Workspace
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<'ALL' | HSKLevel>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Inside Course Learning Workspace states
  const [activeCourseTag, setActiveCourseTag] = useState<'syllabus' | 'vocab' | 'notes'>('syllabus');
  const [selectedLessonFilter, setSelectedLessonFilter] = useState<string>('ALL');
  const [vocabSearchQuery, setVocabSearchQuery] = useState('');
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [lessonSectionTabs, setLessonSectionTabs] = useState<
    Record<string, 'vocab' | 'grammar' | 'dialogue' | 'review'>
  >({});
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [inlineQuizAnswers, setInlineQuizAnswers] = useState<{ [qId: string]: number }>({});

  // Course Notes state persisted in localStorage
  const [courseNotes, setCourseNotes] = useState<CourseNoteItem[]>(() => {
    try {
      const saved = localStorage.getItem(NOTES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_COURSE_NOTES;
  });

  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteLesson, setNewNoteLesson] = useState('Ghi chú chung');

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(courseNotes));
    } catch {
      // ignore storage quota errors
    }
  }, [courseNotes]);

  // Reset back to course list when clicking "Khóa Học" in top menu
  useEffect(() => {
    if (resetKey !== undefined) {
      setSelectedCourseId(null);
    }
  }, [resetKey]);

  const levels: HSKLevel[] = ['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5'];

  const handlePlayAudio = async (text: string, id: string) => {
    setPlayingAudioId(id);
    await speakChinese(text, 0.9);
    setPlayingAudioId(null);
  };

  const handleEnterCourse = (course: Course) => {
    setActiveLevel(course.level);
    setSelectedCourseId(course.id);
    setActiveCourseTag('syllabus');
    setSelectedLessonFilter('ALL');
    setVocabSearchQuery('');
    const firstLesson = course.lessons
      .slice()
      .sort((a, b) => (a.lessonNumber || 0) - (b.lessonNumber || 0))[0];
    setExpandedLessonId(null);
    setLessonSectionTabs({});
    setNewNoteLesson(firstLesson ? firstLesson.vietnameseTitle : 'Ghi chú chung');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || null;

  // ============================================================================
  // VIEW 2: KHI VÀO HỌC (TÊN KHÓA HỌC & MÔ TẢ Ở ĐẦU, BÊN TRÁI LÀ 3 TAG)
  // ============================================================================
  if (selectedCourse) {
    const sortedLessons = selectedCourse.lessons
      .slice()
      .sort((a, b) => (a.lessonNumber || 0) - (b.lessonNumber || 0));

    const completedCount = sortedLessons.filter((l) =>
      studentProfile.completedLessonIds.includes(l.id)
    ).length;

    const progressPercent = sortedLessons.length
      ? Math.round((completedCount / sortedLessons.length) * 100)
      : 0;

    // Collect all vocabulary in this course (deduplicated by id)
    const courseVocabMap = new Map<
      string,
      { vocab: Lesson['vocabulary'][number]; lessonTitle: string; lessonId: string }
    >();
    sortedLessons.forEach((lesson) => {
      lesson.vocabulary.forEach((v) => {
        if (!courseVocabMap.has(v.id)) {
          courseVocabMap.set(v.id, {
            vocab: v,
            lessonTitle: `Bài ${lesson.lessonNumber}: ${lesson.vietnameseTitle}`,
            lessonId: lesson.id,
          });
        }
      });
    });
    const allCourseVocabs = Array.from(courseVocabMap.values());

    const filteredCourseVocabs = allCourseVocabs.filter((item) => {
      const matchesLesson =
        selectedLessonFilter === 'ALL' || item.lessonId === selectedLessonFilter;
      const q = vocabSearchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.vocab.word.toLowerCase().includes(q) ||
        item.vocab.pinyin.toLowerCase().includes(q) ||
        item.vocab.meaning.toLowerCase().includes(q) ||
        (item.vocab.sinoVietnamese || '').toLowerCase().includes(q);
      return matchesLesson && matchesQuery;
    });

    const currentCourseNotes = courseNotes
      .filter((n) => n.courseId === selectedCourse.id)
      .slice()
      .sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)));

    const handleAddNote = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newNoteTitle.trim() && !newNoteContent.trim()) return;
      const item: CourseNoteItem = {
        id: `note-${Date.now()}`,
        courseId: selectedCourse.id,
        lessonTitle: newNoteLesson || 'Ghi chú chung',
        title: newNoteTitle.trim() || 'Ghi chú bài học',
        content: newNoteContent.trim(),
        createdAt: new Date().toLocaleDateString('vi-VN'),
        isPinned: false,
      };
      setCourseNotes((prev) => [item, ...prev]);
      setNewNoteTitle('');
      setNewNoteContent('');
    };

    const handleTogglePinNote = (noteId: string) => {
      setCourseNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, isPinned: !n.isPinned } : n))
      );
    };

    const handleDeleteNote = (noteId: string) => {
      setCourseNotes((prev) => prev.filter((n) => n.id !== noteId));
    };

    return (
      <div className="space-y-6 pb-14">
        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedCourseId(null)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFCE] text-[14px] sm:text-[15px] font-bold text-[#18181B] hover:border-red-600 hover:text-red-600 transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách khóa học</span>
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowPinyin(!showPinyin)}
              aria-pressed={showPinyin}
              className={`px-4 py-2.5 rounded-2xl text-[14px] font-bold border transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-2 ${
                showPinyin
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-white'
              }`}
            >
              {showPinyin ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
              <span>Pinyin: {showPinyin ? 'Đang bật' : 'Đang tắt'}</span>
            </button>

            {onOpenAiTutor && (
              <button
                type="button"
                onClick={onOpenAiTutor}
                className="px-4 py-2.5 rounded-2xl text-[14px] font-bold bg-[#18181B] hover:bg-red-800 text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Lão Sư AI</span>
              </button>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* HEADER ĐẦU TRANG: TÊN KHÓA HỌC VÀ MÔ TẢ GHI LÊN ĐẦU              */}
        {/* ================================================================= */}
        <div className="bg-white rounded-3xl border border-[#E8DFCE] p-6 sm:p-8 shadow-2xs">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 min-w-0">
              <div className="w-full sm:w-44 aspect-16/10 rounded-2xl overflow-hidden border border-[#E8DFCE] bg-[#FAF7F0] shadow-2xs shrink-0">
                <img
                  src={getCourseCover(selectedCourse)}
                  alt={selectedCourse.vietnameseTitle}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5 text-[14px] font-bold text-slate-600">
                  <span className="px-3 py-1 rounded-xl bg-red-600 text-white font-extrabold">
                    {selectedCourse.level}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{sortedLessons.length} bài học thực hành</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{selectedCourse.targetVocabCount} từ vựng</span>
                </div>

                <h1 className="font-sans text-[22px] sm:text-[28px] font-bold text-[#18181B] leading-snug">
                  {selectedCourse.vietnameseTitle}
                </h1>

                <p className="text-[16px] sm:text-[17px] text-slate-700 leading-relaxed max-w-4xl">
                  {selectedCourse.description}
                </p>
              </div>
            </div>

            {/* Thanh tiến độ % nằm phía dưới */}
            <div className="pt-4 border-t border-[#EFE7D6] flex items-center gap-3.5">
              <div
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Đã học ${progressPercent}%`}
                className="flex-1 bg-[#E8DFCE] rounded-full h-3 overflow-hidden"
              >
                <div
                  className="bg-gradient-to-r from-[#C85A43] to-amber-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="font-mono font-black text-[15px] text-[#C85A43] tabular-nums shrink-0">
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* BỐ CỤC CHÍNH: BÊN TRÁI LÀ 3 TAG (GIÁO TRÌNH, TỪ VỰNG, GHI CHÚ)   */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI: 3 TAG ĐIỀU HƯỚNG (GIÁO TRÌNH, TỪ VỰNG, GHI CHÚ) */}
          <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl border border-[#E8DFCE] p-3 lg:p-4 shadow-2xs space-y-2">
              <div className="hidden lg:block px-2 py-1 text-[12px] font-extrabold uppercase tracking-wider text-slate-400">
                Danh mục khóa học
              </div>

              <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
                {[
                  {
                    id: 'syllabus' as const,
                    label: 'Giáo trình',
                    subtitle: `${sortedLessons.length} bài học`,
                    icon: BookOpen,
                  },
                  {
                    id: 'vocab' as const,
                    label: 'Từ vựng',
                    subtitle: `${allCourseVocabs.length} từ trọng tâm`,
                    icon: Layers,
                  },
                  {
                    id: 'notes' as const,
                    label: 'Ghi chú',
                    subtitle: `${currentCourseNotes.length} ghi chú`,
                    icon: StickyNote,
                  },
                ].map((tag) => {
                  const Icon = tag.icon;
                  const isActive = activeCourseTag === tag.id;
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => setActiveCourseTag(tag.id)}
                      className={`w-full flex flex-col lg:flex-row items-center lg:justify-between gap-1.5 lg:gap-3 px-2.5 py-2.5 lg:px-4 lg:py-3.5 rounded-2xl text-center lg:text-left transition-all cursor-pointer min-h-[48px] ${
                        isActive
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-[#FAF7F0] text-[#18181B] hover:bg-[#FCECE8] hover:text-red-700 border border-[#E8DFCE]'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row items-center gap-1.5 lg:gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-white text-red-600 border border-[#E8DFCE]'
                          }`}
                        >
                          <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-sans font-bold text-[13px] sm:text-[14px] lg:text-[15.5px] leading-tight truncate">
                            {tag.label}
                          </div>
                          <div
                            className={`hidden lg:block text-[12.5px] font-medium truncate ${
                              isActive ? 'text-rose-100' : 'text-slate-500'
                            }`}
                          >
                            {tag.subtitle}
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        className={`hidden lg:block w-4 h-4 shrink-0 transition-transform ${
                          isActive ? 'text-white translate-x-0.5' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mục lục nhanh các bài học trong khóa (Hiển thị trên Desktop để tránh chiếm màn hình Mobile) */}
            <div className="hidden lg:block bg-white rounded-3xl border border-[#E8DFCE] p-4 shadow-2xs space-y-2.5">
              <div className="px-2 text-[12px] font-extrabold uppercase tracking-wider text-slate-400">
                Mục lục bài học ({sortedLessons.length})
              </div>
              <div className="space-y-1.5">
                {sortedLessons.map((lesson) => {
                  const isDone = studentProfile.completedLessonIds.includes(lesson.id);
                  const isCurrentExpanded =
                    activeCourseTag === 'syllabus' && expandedLessonId === lesson.id;
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => {
                        setActiveCourseTag('syllabus');
                        setExpandedLessonId(lesson.id);
                        setTimeout(() => {
                          document
                            .getElementById(`lesson-card-${lesson.id}`)
                            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 60);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-[13.5px] font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        isCurrentExpanded
                          ? 'bg-[#FCECE8] text-red-700 font-bold border border-red-200'
                          : 'hover:bg-[#FAF7F0] text-[#18181B]'
                      }`}
                    >
                      <span className="truncate">
                        Bài {lesson.lessonNumber}: {lesson.vietnameseTitle.replace(/^Bài \d+:\s*/i, '')}
                      </span>
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400 shrink-0 tabular-nums">
                          {lesson.durationMinutes}p
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* CỘT PHẢI: NỘI DUNG TƯƠNG ỨNG VỚI TAG ĐANG CHỌN */}
          <div className="lg:col-span-9 space-y-5">
            {/* ============================================================= */}
            {/* TAG 1: GIÁO TRÌNH (DANH SÁCH & NỘI DUNG CHI TIẾT BÀI HỌC)     */}
            {/* ============================================================= */}
            {activeCourseTag === 'syllabus' && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl border border-[#E8DFCE] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-sans text-[20px] sm:text-[22px] font-bold text-[#18181B]">
                      Giáo trình & Bài học ({sortedLessons.length} bài)
                    </h2>
                    <p className="text-[15px] text-slate-600">
                      Kích vào từng mục bài học để mở các phần Từ vựng, Ngữ pháp, Hội thoại và Ôn tập.
                    </p>
                  </div>
                </div>

                {sortedLessons.map((lesson) => {
                  const isCompleted = studentProfile.completedLessonIds.includes(lesson.id);
                  const isExpanded = expandedLessonId === lesson.id;
                  const activeLessonTab = lessonSectionTabs[lesson.id] || 'vocab';

                  const setActiveLessonTab = (
                    tab: 'vocab' | 'grammar' | 'dialogue' | 'review'
                  ) => {
                    setLessonSectionTabs((prev) => ({ ...prev, [lesson.id]: tab }));
                  };

                  const lessonAnsweredCount = lesson.practiceQuestions.filter(
                    (q) => inlineQuizAnswers[q.id] !== undefined
                  ).length;
                  const lessonCorrectCount = lesson.practiceQuestions.filter(
                    (q) => inlineQuizAnswers[q.id] === q.correctAnswer
                  ).length;

                  const handleResetLessonQuiz = () => {
                    setInlineQuizAnswers((prev) => {
                      const next = { ...prev };
                      lesson.practiceQuestions.forEach((q) => {
                        delete next[q.id];
                      });
                      return next;
                    });
                  };

                  return (
                    <div
                      key={lesson.id}
                      id={`lesson-card-${lesson.id}`}
                      className={`rounded-3xl border-2 transition-all overflow-hidden scroll-mt-24 ${
                        isExpanded
                          ? 'border-[#C85A43] bg-white shadow-sm'
                          : isCompleted
                          ? 'border-red-300 bg-[#FFFDFB] hover:border-[#C85A43]'
                          : 'border-[#E8DFCE] bg-white hover:border-[#C85A43]/70'
                      }`}
                    >
                      {/* Lesson Header Card — click anywhere to toggle */}
                      <div
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        onClick={() =>
                          setExpandedLessonId(isExpanded ? null : lesson.id)
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setExpandedLessonId(isExpanded ? null : lesson.id);
                          }
                        }}
                        className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C85A43]/40"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="px-3 py-1 rounded-xl bg-[#FCECE8] text-red-700 font-extrabold text-[13px]">
                              Bài {lesson.lessonNumber}
                            </span>
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 text-[13px] font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Đã hoàn thành</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-500">
                                <Clock className="w-4 h-4" />
                                <span>{lesson.durationMinutes} phút</span>
                              </span>
                            )}
                            <span className="text-[12.5px] font-semibold text-slate-500 tabular-nums">
                              · {lesson.vocabulary.length} từ vựng · {lesson.grammar.length} ngữ pháp
                            </span>
                          </div>

                          <h3 className="font-sans font-bold text-[20px] sm:text-[22px] text-[#18181B] leading-snug break-words">
                            {lesson.title}
                          </h3>
                          <div className="text-[16px] font-bold text-red-700 break-words">
                            {lesson.vietnameseTitle}
                          </div>
                          <p className="text-[15px] text-slate-600 leading-relaxed break-words">
                            {lesson.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap sm:flex-col items-stretch sm:items-end justify-between gap-2.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenLesson(lesson);
                            }}
                            className="px-5 py-2.5 min-h-[44px] rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-[14px] flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <span>Vào bài học</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          <span className="px-4 py-2 min-h-[40px] rounded-xl bg-[#FAF7F0] text-[#18181B] font-bold text-[13px] border border-[#E8DFCE] flex items-center justify-center gap-1.5 whitespace-nowrap">
                            <span>{isExpanded ? 'Thu gọn' : 'Mở nội dung'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-[#C85A43]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Lesson Content with 4 Tabs: Từ vựng, Ngữ pháp, Hội thoại, Ôn tập */}
                      {isExpanded && (
                        <div className="border-t border-[#E8DFCE] bg-[#FDFBF7] p-5 sm:p-6 space-y-5">
                          {/* 4 Section Tabs */}
                          <div
                            role="tablist"
                            aria-label={`Các phần của Bài ${lesson.lessonNumber}`}
                            className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 p-1.5 bg-[#F5EFEB] rounded-2xl border border-[#E8DFCE]"
                          >
                            {[
                              {
                                id: 'vocab' as const,
                                label: 'Từ vựng',
                                count: lesson.vocabulary.length,
                                icon: BookOpen,
                              },
                              {
                                id: 'grammar' as const,
                                label: 'Ngữ pháp',
                                count: lesson.grammar.length,
                                icon: FileText,
                              },
                              {
                                id: 'dialogue' as const,
                                label: 'Hội thoại',
                                count: lesson.dialogue.length,
                                icon: MessageCircle,
                              },
                              {
                                id: 'review' as const,
                                label: 'Ôn tập',
                                count: lesson.practiceQuestions.length,
                                icon: HelpCircle,
                              },
                            ].map((tab) => {
                              const TabIcon = tab.icon;
                              const isTabActive = activeLessonTab === tab.id;
                              return (
                                <button
                                  key={tab.id}
                                  type="button"
                                  role="tab"
                                  aria-selected={isTabActive}
                                  onClick={() => setActiveLessonTab(tab.id)}
                                  className={`flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-[14px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                                    isTabActive
                                      ? 'bg-[#C85A43] text-white shadow-xs'
                                      : 'text-[#18181B] hover:bg-white hover:text-[#C85A43]'
                                  }`}
                                >
                                  <TabIcon className="w-4 h-4 shrink-0" />
                                  <span>{tab.label}</span>
                                  <span
                                    className={`px-2 py-0.5 rounded-lg text-[12px] font-extrabold tabular-nums ${
                                      isTabActive
                                        ? 'bg-white/20 text-white'
                                        : 'bg-white text-slate-600 border border-[#E8DFCE]'
                                    }`}
                                  >
                                    {tab.count}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {/* TAB 1: TỪ VỰNG */}
                          {activeLessonTab === 'vocab' && (
                            <div role="tabpanel" className="space-y-4">
                              {lesson.vocabulary.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-dashed border-[#D6CBB3] p-8 text-center space-y-1.5">
                                  <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                                  <p className="font-bold text-[16px] text-[#18181B]">
                                    Chưa có từ vựng cho bài học này
                                  </p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {lesson.vocabulary.map((vocab, vIdx) => {
                                    const isMastered = studentProfile.masteredVocabIds.includes(
                                      vocab.id
                                    );
                                    return (
                                      <div
                                        key={vocab.id}
                                        className={`rounded-2xl border-2 p-4 sm:p-5 transition-all flex flex-col justify-between ${
                                          isMastered
                                            ? 'border-emerald-400 bg-[#ECFDF5]'
                                            : 'bg-white border-[#E8DFCE] hover:border-[#C85A43]/60'
                                        }`}
                                      >
                                        <div>
                                          <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="space-y-1.5 min-w-0">
                                              <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="px-2 py-0.5 rounded-lg bg-[#18181B] text-amber-300 font-mono text-[12px] font-bold">
                                                  #{String(vIdx + 1).padStart(2, '0')}
                                                </span>
                                                <span className="text-[12.5px] font-bold text-[#18181B] bg-[#FAF7F0] border border-[#E8DFCE] px-2.5 py-0.5 rounded-lg">
                                                  Hán Việt: {vocab.sinoVietnamese || '-'}
                                                </span>
                                              </div>

                                              <div className="flex items-baseline gap-2.5 flex-wrap pt-0.5">
                                                <h4 className="font-serif text-[30px] font-black text-[#18181B] leading-none">
                                                  {vocab.word}
                                                </h4>
                                                {showPinyin && (
                                                  <span className="text-[16.5px] font-bold font-mono text-red-600">
                                                    {vocab.pinyin}
                                                  </span>
                                                )}
                                              </div>
                                            </div>

                                            <button
                                              type="button"
                                              onClick={() =>
                                                handlePlayAudio(
                                                  vocab.word,
                                                  `syl-v-${lesson.id}-${vocab.id}`
                                                )
                                              }
                                              className={`min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                                playingAudioId ===
                                                `syl-v-${lesson.id}-${vocab.id}`
                                                  ? 'bg-red-600 text-white border-red-600 scale-105'
                                                  : 'bg-[#FFF5F3] text-red-700 border-red-200 hover:bg-red-600 hover:text-white'
                                              }`}
                                              title="Nghe phát âm"
                                              aria-label={`Nghe phát âm ${vocab.word}`}
                                            >
                                              <Volume2 className="w-5 h-5" />
                                            </button>
                                          </div>

                                          <div className="mb-3">
                                            <VocabIllustration vocab={vocab} compact />
                                          </div>

                                          <div className="text-[16px] font-extrabold text-[#18181B] mb-3 bg-[#FEFCE8] p-3 rounded-xl border border-amber-200/80">
                                            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                                              Nghĩa tiếng Việt
                                            </span>
                                            {vocab.meaning}
                                          </div>

                                          <div className="bg-[#FDFBF6] rounded-xl p-3 border border-[#E8DFCE] space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="font-serif font-bold text-[16.5px] text-[#18181B] break-words">
                                                {vocab.exampleSentence}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handlePlayAudio(
                                                    vocab.exampleSentence,
                                                    `syl-vex-${lesson.id}-${vocab.id}`
                                                  )
                                                }
                                                className="text-red-600 hover:bg-[#FFF5F3] p-2 rounded-lg transition-colors cursor-pointer shrink-0"
                                                title="Nghe câu ví dụ"
                                                aria-label="Nghe câu ví dụ"
                                              >
                                                <Volume2 className="w-4 h-4" />
                                              </button>
                                            </div>
                                            {showPinyin && (
                                              <p className="text-[13.5px] font-mono text-red-700 font-semibold">
                                                {vocab.examplePinyin}
                                              </p>
                                            )}
                                            <p className="text-[14px] text-slate-700 font-medium">
                                              {vocab.exampleMeaning}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-end pt-3 mt-3 border-t border-[#EFE7D6]">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              isMastered
                                                ? markVocabLearning(vocab.id)
                                                : markVocabMastered(vocab.id)
                                            }
                                            className={`flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl text-[13px] font-bold transition-colors cursor-pointer ${
                                              isMastered
                                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                                : 'bg-[#FAF7F0] text-[#18181B] border border-[#E8DFCE] hover:border-red-500'
                                            }`}
                                          >
                                            <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                                            <span>{isMastered ? 'Đã thuộc' : 'Đánh dấu thuộc'}</span>
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* TAB 2: NGỮ PHÁP */}
                          {activeLessonTab === 'grammar' && (
                            <div role="tabpanel" className="space-y-4">
                              {lesson.grammar.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-dashed border-[#D6CBB3] p-8 text-center space-y-1.5">
                                  <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                                  <p className="font-bold text-[16px] text-[#18181B]">
                                    Chưa có điểm ngữ pháp cho bài học này
                                  </p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 gap-4">
                                  {lesson.grammar.map((g, gIdx) => (
                                    <div
                                      key={g.id}
                                      className="bg-white rounded-2xl border border-[#E8DFCE] p-5 space-y-3"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <span className="w-7 h-7 rounded-lg bg-[#C85A43] text-white font-black text-[13px] flex items-center justify-center shrink-0">
                                          {gIdx + 1}
                                        </span>
                                        <h4 className="font-sans font-bold text-[17px] text-[#18181B]">
                                          {g.title}
                                        </h4>
                                      </div>

                                      <div className="bg-[#FEFCE8] rounded-xl p-3.5 border border-amber-300/70">
                                        <span className="text-[12px] font-bold uppercase tracking-wider text-amber-800 block">
                                          Cấu trúc
                                        </span>
                                        <p className="font-mono font-bold text-[16px] text-[#18181B]">
                                          {g.structure}
                                        </p>
                                      </div>

                                      <p className="text-[15.5px] text-slate-700 leading-relaxed whitespace-pre-line">
                                        {g.explanation}
                                      </p>

                                      <div className="space-y-2 pt-1">
                                        {g.examples.map((ex, exIdx) => (
                                          <div
                                            key={exIdx}
                                            className="bg-[#FAF7F0] rounded-xl p-3.5 border border-[#E8DFCE] flex items-center justify-between gap-3"
                                          >
                                            <div className="min-w-0">
                                              <p className="font-serif font-bold text-[18px] text-[#18181B] break-words">
                                                {ex.hanzi}
                                              </p>
                                              {showPinyin && (
                                                <p className="font-mono text-[14px] text-red-700 font-semibold">
                                                  {ex.pinyin}
                                                </p>
                                              )}
                                              <p className="text-[15px] text-slate-700">
                                                ➔ {ex.translation}
                                              </p>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handlePlayAudio(
                                                  ex.hanzi,
                                                  `syl-gram-${lesson.id}-${gIdx}-${exIdx}`
                                                )
                                              }
                                              className={`min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                                playingAudioId ===
                                                `syl-gram-${lesson.id}-${gIdx}-${exIdx}`
                                                  ? 'bg-red-600 text-white border-red-600'
                                                  : 'bg-white border-[#E8DFCE] text-red-600 hover:bg-red-600 hover:text-white'
                                              }`}
                                              title="Nghe phát âm ví dụ"
                                              aria-label="Nghe phát âm ví dụ"
                                            >
                                              <Volume2 className="w-5 h-5" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* TAB 3: HỘI THOẠI */}
                          {activeLessonTab === 'dialogue' && (
                            <div role="tabpanel" className="space-y-3">
                              {lesson.dialogue.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-dashed border-[#D6CBB3] p-8 text-center space-y-1.5">
                                  <MessageCircle className="w-8 h-8 text-slate-400 mx-auto" />
                                  <p className="font-bold text-[16px] text-[#18181B]">
                                    Chưa có hội thoại cho bài học này
                                  </p>
                                </div>
                              ) : (
                                <div className="bg-white rounded-2xl border border-[#E8DFCE] divide-y divide-[#F0E9D8] overflow-hidden">
                                  {lesson.dialogue.map((line) => (
                                    <div
                                      key={line.id}
                                      className="p-4 flex items-start justify-between gap-3 hover:bg-[#FAF7F0] transition-colors"
                                    >
                                      <div className="space-y-1 min-w-0">
                                        <span className="inline-block px-2.5 py-0.5 rounded-lg bg-[#FCECE8] text-red-700 font-bold text-[12px]">
                                          {line.speaker}
                                        </span>
                                        <p className="font-serif font-bold text-[19px] text-[#18181B] break-words">
                                          {line.chinese}
                                        </p>
                                        {showPinyin && (
                                          <p className="font-mono text-[14px] text-red-600 font-semibold">
                                            {line.pinyin}
                                          </p>
                                        )}
                                        <p className="text-[15px] text-slate-700">
                                          {line.vietnamese}
                                        </p>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handlePlayAudio(line.chinese, `syl-dlg-${line.id}`)
                                        }
                                        className={`min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                          playingAudioId === `syl-dlg-${line.id}`
                                            ? 'bg-red-600 text-white border-red-600'
                                            : 'bg-[#FAF7F0] text-red-600 border-[#E8DFCE] hover:bg-red-600 hover:text-white'
                                        }`}
                                        title="Nghe câu thoại"
                                        aria-label="Nghe câu thoại"
                                      >
                                        <Volume2 className="w-5 h-5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* TAB 4: ÔN TẬP */}
                          {activeLessonTab === 'review' && (
                            <div role="tabpanel" className="space-y-4">
                              {lesson.practiceQuestions.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-dashed border-[#D6CBB3] p-8 text-center space-y-1.5">
                                  <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                                  <p className="font-bold text-[16px] text-[#18181B]">
                                    Chưa có câu hỏi ôn tập cho bài học này
                                  </p>
                                </div>
                              ) : (
                                <>
                                  {lessonAnsweredCount > 0 && (
                                    <div className="bg-white rounded-2xl border border-[#E8DFCE] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                                      <div className="text-[14px] font-bold text-[#18181B] tabular-nums">
                                        Đã trả lời{' '}
                                        <span className="text-[#C85A43]">
                                          {lessonAnsweredCount}/{lesson.practiceQuestions.length}
                                        </span>{' '}
                                        câu · Đúng{' '}
                                        <span className="text-emerald-700">
                                          {lessonCorrectCount}
                                        </span>{' '}
                                        câu
                                      </div>
                                      <button
                                        type="button"
                                        onClick={handleResetLessonQuiz}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#FCECE8] text-[#18181B] hover:text-[#C85A43] border border-[#E8DFCE] text-[13px] font-bold transition-colors cursor-pointer"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Làm lại</span>
                                      </button>
                                    </div>
                                  )}

                                  <div className="space-y-3">
                                    {lesson.practiceQuestions.map((q, qIdx) => {
                                      const selected = inlineQuizAnswers[q.id];
                                      const isAnswered = selected !== undefined;
                                      const isCorrect = selected === q.correctAnswer;

                                      return (
                                        <div
                                          key={q.id}
                                          className="bg-white rounded-2xl border border-[#E8DFCE] p-5 space-y-3"
                                        >
                                          <p className="font-sans font-bold text-[16px] text-[#18181B] break-words">
                                            Câu {qIdx + 1}: {q.question}
                                          </p>
                                          {q.pinyin && showPinyin && (
                                            <p className="text-[14px] font-mono text-red-600 font-semibold">
                                              {q.pinyin}
                                            </p>
                                          )}
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {q.options.map((opt, optIdx) => {
                                              const isThisSelected = selected === optIdx;
                                              const isThisCorrect = optIdx === q.correctAnswer;
                                              let btnClass =
                                                'border-[#E8DFCE] bg-[#FAF7F0] text-[#18181B] hover:border-[#C85A43]';
                                              if (isAnswered) {
                                                if (isThisCorrect) {
                                                  btnClass =
                                                    'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                                                } else if (isThisSelected) {
                                                  btnClass =
                                                    'border-red-500 bg-red-50 text-red-900 font-bold';
                                                }
                                              }
                                              return (
                                                <button
                                                  key={optIdx}
                                                  type="button"
                                                  disabled={isAnswered}
                                                  onClick={() =>
                                                    setInlineQuizAnswers((prev) => ({
                                                      ...prev,
                                                      [q.id]: optIdx,
                                                    }))
                                                  }
                                                  className={`p-3 min-h-[44px] rounded-xl border text-left text-[14.5px] flex items-center justify-between gap-2 transition-all cursor-pointer disabled:cursor-default ${btnClass}`}
                                                >
                                                  <span className="break-words">{opt}</span>
                                                  {isAnswered && isThisCorrect && (
                                                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                                  )}
                                                  {isAnswered && isThisSelected && !isThisCorrect && (
                                                    <X className="w-4 h-4 text-red-600 shrink-0" />
                                                  )}
                                                </button>
                                              );
                                            })}
                                          </div>
                                          {isAnswered && (
                                            <div
                                              className={`p-3 rounded-xl text-[14px] border ${
                                                isCorrect
                                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                                  : 'bg-amber-50 text-amber-950 border-amber-200'
                                              }`}
                                            >
                                              <strong>
                                                {isCorrect ? '✓ Chính xác: ' : '✗ Giải thích: '}
                                              </strong>
                                              {q.explanation}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ============================================================= */}
            {/* TAG 2: TỪ VỰNG CỦA KHÓA HỌC                                   */}
            {/* ============================================================= */}
            {activeCourseTag === 'vocab' && (
              <div className="space-y-5">
                <div className="bg-white rounded-3xl border border-[#E8DFCE] p-5 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-sans text-[20px] sm:text-[22px] font-bold text-[#18181B]">
                        Từ vựng khóa học ({filteredCourseVocabs.length} từ)
                      </h2>
                      <p className="text-[15px] text-slate-600">
                        Tất cả từ vựng có hình ảnh minh họa thực tế, phát âm chuẩn và câu ví dụ ngữ cảnh.
                      </p>
                    </div>
                  </div>

                  {/* Filter by lesson & search */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={vocabSearchQuery}
                        onChange={(e) => setVocabSearchQuery(e.target.value)}
                        placeholder="Tìm chữ Hán, Pinyin, Hán Việt hoặc nghĩa..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8DFCE] bg-[#FAF7F0] text-[14.5px] focus:outline-none focus:bg-white focus:border-red-600"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedLessonFilter('ALL')}
                        className={`px-3.5 py-2 rounded-xl text-[13px] font-bold transition-colors cursor-pointer ${
                          selectedLessonFilter === 'ALL'
                            ? 'bg-red-600 text-white'
                            : 'bg-[#FAF7F0] text-[#18181B] border border-[#E8DFCE] hover:bg-white'
                        }`}
                      >
                        Tất cả bài
                      </button>
                      {sortedLessons.map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setSelectedLessonFilter(l.id)}
                          className={`px-3.5 py-2 rounded-xl text-[13px] font-bold transition-colors cursor-pointer ${
                            selectedLessonFilter === l.id
                              ? 'bg-red-600 text-white'
                              : 'bg-[#FAF7F0] text-[#18181B] border border-[#E8DFCE] hover:bg-white'
                          }`}
                        >
                          Bài {l.lessonNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {filteredCourseVocabs.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-dashed border-[#D6CBB3] p-10 text-center space-y-2">
                    <Layers className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="font-bold text-[17px] text-[#18181B]">
                      Không tìm thấy từ vựng phù hợp
                    </p>
                    <p className="text-[14.5px] text-slate-500">
                      Hãy thử từ khóa khác hoặc chọn &ldquo;Tất cả bài&rdquo;.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCourseVocabs.map(({ vocab, lessonTitle }, idx) => {
                      const isMastered = studentProfile.masteredVocabIds.includes(vocab.id);

                      return (
                        <div
                          key={vocab.id}
                          className={`rounded-3xl border-2 p-5 transition-all flex flex-col justify-between ${
                            isMastered
                              ? 'border-emerald-400 bg-[#ECFDF5]'
                              : 'bg-white border-[#E8DFCE] hover:border-red-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="px-2.5 py-0.5 rounded-lg bg-[#18181B] text-amber-300 font-mono text-[12px] font-bold">
                                    #{String(idx + 1).padStart(2, '0')}
                                  </span>
                                  <span className="text-[12.5px] font-bold text-[#18181B] bg-[#FAF7F0] border border-[#E8DFCE] px-2.5 py-0.5 rounded-lg">
                                    Hán Việt: {vocab.sinoVietnamese || '-'}
                                  </span>
                                </div>

                                <div className="flex items-baseline gap-3 flex-wrap pt-1">
                                  <h3 className="font-serif text-[34px] font-black text-[#18181B] leading-none">
                                    {vocab.word}
                                  </h3>
                                  {showPinyin && (
                                    <span className="text-[18px] font-bold font-mono text-red-600">
                                      {vocab.pinyin}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handlePlayAudio(vocab.word, `cv-${vocab.id}`)}
                                className={`p-3 rounded-2xl border transition-all cursor-pointer shrink-0 ${
                                  playingAudioId === `cv-${vocab.id}`
                                    ? 'bg-red-600 text-white border-red-600 scale-105'
                                    : 'bg-[#FFF5F3] text-red-700 border-red-200 hover:bg-red-600 hover:text-white'
                                }`}
                                title="Nghe phát âm"
                              >
                                <Volume2 className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="mb-3">
                              <VocabIllustration vocab={vocab} compact />
                            </div>

                            <div className="text-[17px] font-extrabold text-[#18181B] mb-3 bg-[#FEFCE8] p-3.5 rounded-2xl border border-amber-200/80">
                              <span className="text-[11.5px] font-bold text-amber-800 uppercase tracking-wider block">
                                Nghĩa tiếng Việt
                              </span>
                              {vocab.meaning}
                            </div>

                            <div className="bg-[#FDFBF6] rounded-2xl p-3.5 border border-[#E8DFCE] space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-serif font-bold text-[17px] text-[#18181B]">
                                  {vocab.exampleSentence}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handlePlayAudio(
                                      vocab.exampleSentence,
                                      `cv-ex-${vocab.id}`
                                    )
                                  }
                                  className="text-red-600 hover:bg-[#FFF5F3] p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                                  title="Nghe câu ví dụ"
                                >
                                  <Volume2 className="w-4 h-4" />
                                </button>
                              </div>
                              {showPinyin && (
                                <p className="text-[13.5px] font-mono text-red-700 font-semibold">
                                  {vocab.examplePinyin}
                                </p>
                              )}
                              <p className="text-[14.5px] text-slate-700 font-medium">
                                {vocab.exampleMeaning}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-[#EFE7D6] gap-2">
                            <span className="text-[12px] font-semibold text-slate-500 truncate">
                              {lessonTitle}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                isMastered
                                  ? markVocabLearning(vocab.id)
                                  : markVocabMastered(vocab.id)
                              }
                              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[13px] font-bold transition-colors cursor-pointer shrink-0 ${
                                isMastered
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : 'bg-[#FAF7F0] text-[#18181B] border border-[#E8DFCE] hover:border-red-500'
                              }`}
                            >
                              <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                              <span>{isMastered ? 'Đã thuộc' : 'Đánh dấu thuộc'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================= */}
            {/* TAG 3: GHI CHÚ KHÓA HỌC                                       */}
            {/* ============================================================= */}
            {activeCourseTag === 'notes' && (
              <div className="space-y-5">
                {/* Form Tạo Ghi Chú Mới */}
                <form
                  onSubmit={handleAddNote}
                  className="bg-white rounded-3xl border border-[#E8DFCE] p-5 sm:p-6 shadow-2xs space-y-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-sans text-[20px] sm:text-[22px] font-bold text-[#18181B]">
                        Sổ tay Ghi chú Khóa học ({selectedCourse.level})
                      </h2>
                      <p className="text-[14.5px] text-slate-600">
                        Lưu lại các cấu trúc ngữ pháp, từ vựng dễ nhầm lẫn hoặc mẹo nhớ chữ Hán của riêng bạn.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-4">
                      <label className="block text-[12.5px] font-bold text-slate-600 mb-1">
                        Thuộc bài học
                      </label>
                      <select
                        value={newNoteLesson}
                        onChange={(e) => setNewNoteLesson(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFCE] bg-[#FAF7F0] text-[14px] font-semibold text-[#18181B] focus:outline-none focus:border-red-600"
                      >
                        <option value="Ghi chú chung">Ghi chú chung cả khóa</option>
                        {sortedLessons.map((l) => (
                          <option key={l.id} value={l.vietnameseTitle}>
                            {l.vietnameseTitle}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-8">
                      <label className="block text-[12.5px] font-bold text-slate-600 mb-1">
                        Tiêu đề ghi chú
                      </label>
                      <input
                        type="text"
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        placeholder="Ví dụ: Phân biệt 二 (èr) và 两 (liǎng)..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFCE] bg-[#FAF7F0] text-[14px] focus:outline-none focus:bg-white focus:border-red-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12.5px] font-bold text-slate-600 mb-1">
                      Nội dung chi tiết
                    </label>
                    <textarea
                      rows={3}
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Nhập nội dung ghi chú, ví dụ câu tiếng Trung hoặc lưu ý phát âm..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFCE] bg-[#FAF7F0] text-[14.5px] focus:outline-none focus:bg-white focus:border-red-600"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[14px] inline-flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Lưu ghi chú</span>
                    </button>
                  </div>
                </form>

                {/* Danh sách Ghi Chú Đã Lưu */}
                {currentCourseNotes.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-dashed border-[#D6CBB3] p-10 text-center space-y-2">
                    <StickyNote className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="font-bold text-[17px] text-[#18181B]">
                      Chưa có ghi chú nào cho khóa {selectedCourse.level}
                    </p>
                    <p className="text-[14.5px] text-slate-500">
                      Hãy viết ghi chú đầu tiên ở khung phía trên để lưu lại kiến thức quan trọng.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {currentCourseNotes.map((note) => (
                      <div
                        key={note.id}
                        className={`rounded-3xl border p-5 sm:p-6 transition-all space-y-2.5 ${
                          note.isPinned
                            ? 'bg-[#FFFDF5] border-amber-300 shadow-2xs'
                            : 'bg-white border-[#E8DFCE]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-lg bg-[#FCECE8] text-red-700 font-bold text-[12px]">
                                {note.lessonTitle}
                              </span>
                              <span className="text-[12px] text-slate-400 font-medium">
                                {note.createdAt}
                              </span>
                              {note.isPinned && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[11px]">
                                  ★ Đã ghim
                                </span>
                              )}
                            </div>
                            <h3 className="font-sans font-bold text-[18px] text-[#18181B]">
                              {note.title}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleTogglePinNote(note.id)}
                              title={note.isPinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                note.isPinned
                                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                                  : 'bg-[#FAF7F0] border-[#E8DFCE] text-slate-500 hover:text-[#18181B]'
                              }`}
                            >
                              <Pin className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              title="Xóa ghi chú"
                              className="p-2 rounded-xl bg-[#FAF7F0] border border-[#E8DFCE] text-slate-500 hover:text-red-600 hover:border-red-300 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <p className="text-[15.5px] text-slate-700 leading-relaxed whitespace-pre-line">
                          {note.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 1: TRANG DANH SÁCH KHÓA HỌC (KHI KÍCH VÀO "KHÓA HỌC" TRÊN MENU)
  // ============================================================================
  const filteredCourses = courses.filter((course) => {
    const matchesLevel = levelFilter === 'ALL' || course.level === levelFilter;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesLevel;
    const matchesCourseText =
      course.title.toLowerCase().includes(q) ||
      course.vietnameseTitle.toLowerCase().includes(q) ||
      course.description.toLowerCase().includes(q) ||
      course.level.toLowerCase().includes(q);
    const matchesAnyLesson = course.lessons.some(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.vietnameseTitle.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
    );
    return matchesLevel && (matchesCourseText || matchesAnyLesson);
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Editorial Hero Banner (Màu đỏ pastel chủ đạo) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white p-6 sm:p-8 shadow-md border border-red-400/70">
        <div className="relative z-10 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3.5 flex-1">
              <div className="flex items-center gap-2 text-[14px] font-bold text-amber-200">
                <Sparkles className="w-5 h-5 shrink-0" />
                <span>Chương trình Tiếng Trung chuẩn HSK 3.0</span>
              </div>

              <h1 className="font-sans text-[24px] sm:text-[30px] font-bold tracking-tight leading-tight text-balance">
                Lộ trình Chinh phục Tiếng Trung từ HSK 1 đến HSK 5
              </h1>

              <p className="text-[18px] sm:text-[19px] text-rose-50 leading-relaxed max-w-3xl">
                Chọn khóa học phù hợp để bắt đầu học giáo trình bài bản, từ vựng minh họa trực quan và sổ tay ghi chú cá nhân.
              </p>
            </div>

            {/* Mascot Illustration (Boya Character) */}
            <div className="shrink-0 flex justify-center md:justify-end">
              <img
                src="/assets/aistudio/icon4_80b113ba.png"
                alt="Cô giáo Boya MiXiangg HSK"
                className="h-36 sm:h-44 w-auto object-contain drop-shadow-md select-none"
              />
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/15">
            <div>
              <span className="text-rose-100 block text-[14px]">Trình độ mục tiêu</span>
              <span className="font-black text-[21px] text-white">{studentProfile.targetLevel}</span>
            </div>
            <div>
              <span className="text-rose-100 block text-[14px]">Đã hoàn thành</span>
              <span className="font-black text-[21px] text-white tabular-nums">
                {studentProfile.completedLessonIds.length} bài
              </span>
            </div>
            <div>
              <span className="text-rose-100 block text-[14px]">Từ vựng thuộc</span>
              <span className="font-black text-[21px] text-amber-300 tabular-nums">
                {studentProfile.masteredVocabIds.length} từ
              </span>
            </div>
            <div>
              <span className="text-rose-100 block text-[14px]">Điểm tích lũy</span>
              <span className="font-black text-[21px] text-amber-300 tabular-nums">
                {studentProfile.xp} XP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Level Filter Tabs & Search Controls (Giống bố cục ảnh mẫu) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#F5EFEB] rounded-2xl border border-[#E6DEC8]">
          <button
            type="button"
            onClick={() => setLevelFilter('ALL')}
            className={`px-5 py-2.5 rounded-xl text-[15px] sm:text-[16px] font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              levelFilter === 'ALL'
                ? 'bg-[#B94A34] text-white shadow-sm'
                : 'text-[#18181B] hover:bg-white hover:text-[#B94A34]'
            }`}
          >
            Tất cả ({courses.length})
          </button>
          {levels.map((lvl) => {
            const isSelected = levelFilter === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(isSelected ? 'ALL' : lvl)}
                className={`px-5 py-2.5 rounded-xl text-[15px] sm:text-[16px] font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[#B94A34] text-white shadow-sm'
                    : 'text-[#18181B] hover:bg-white hover:text-[#B94A34]'
                }`}
              >
                {lvl}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên bài học, chủ đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-[16px] rounded-2xl border border-[#E6DEC8] bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowPinyin(!showPinyin)}
              aria-pressed={showPinyin}
              className={`px-4 py-3 rounded-2xl text-[14px] font-bold border transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-2 ${
                showPinyin
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-white'
              }`}
            >
              {showPinyin ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
              <span>Pinyin: {showPinyin ? 'Đang bật' : 'Đang tắt'}</span>
            </button>

            {onOpenAiTutor && (
              <button
                type="button"
                onClick={onOpenAiTutor}
                className="px-4 py-3 rounded-2xl text-[14px] font-bold bg-[#18181B] hover:bg-red-800 text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>Lão Sư AI</span>
              </button>
            )}

            {userRole !== 'student' && (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className="px-4 py-3 rounded-2xl bg-red-700 hover:bg-red-800 text-white text-[14px] font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Quản lý</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* DANH SÁCH KHÓA HỌC (1 CỘT DỌC NHƯ ẢNH MẪU + NÚT VÀO HỌC)         */}
      {/* ================================================================= */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-[#D6CBB3] p-12 text-center space-y-2">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <p className="text-[#18181B] font-bold text-[19px]">
            Không tìm thấy khóa học phù hợp với từ khóa.
          </p>
          <p className="text-slate-600 text-[16px]">
            Hãy thử từ khóa khác hoặc chọn xem tất cả cấp độ HSK.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredCourses.map((course) => {
            const completedCount = course.lessons.filter((l) =>
              studentProfile.completedLessonIds.includes(l.id)
            ).length;

            const progressPercent = course.lessons.length
              ? Math.round((completedCount / course.lessons.length) * 100)
              : 0;

            return (
              <div
                key={course.id}
                onClick={() => handleEnterCourse(course)}
                className="group bg-white rounded-3xl border border-[#E8DFCE] hover:border-[#C85A43] p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: Course Thumbnail + Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5 flex-1 min-w-0">
                    <div className="w-full sm:w-56 md:w-64 aspect-16/10 rounded-2xl overflow-hidden border border-[#E8DFCE] bg-[#FAF7F0] shrink-0 shadow-2xs">
                      <img
                        src={getCourseCover(course)}
                        alt={course.vietnameseTitle}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    </div>

                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-[13.5px] font-bold text-slate-600">
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#FFF5F3] text-[#C85A43] border border-[#F3C5B6] font-black">
                          {course.level}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {course.lessons.length} bài học thực hành
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{course.targetVocabCount} từ vựng</span>
                      </div>

                      <h2 className="font-sans text-[20px] sm:text-[23px] font-bold not-italic text-[#18181B] group-hover:text-[#C85A43] transition-colors leading-snug">
                        {course.vietnameseTitle}
                      </h2>

                      <p className="text-[14.5px] sm:text-[15.5px] text-slate-600 leading-relaxed line-clamp-2">
                        {course.description}
                      </p>

                      <div className="pt-1 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEnterCourse(course);
                          }}
                          className="px-5 py-2.5 min-h-[44px] rounded-2xl bg-[#C85A43] hover:bg-[#B24A34] text-white font-bold text-[14.5px] inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                        >
                          <span>Vào học</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: Compact Progress Box */}
                  <div className="bg-[#FAF7F0] rounded-2xl p-4 lg:w-[228px] border border-[#E8DFCE] space-y-2.5 shrink-0">
                    <div className="flex items-center justify-between gap-2 text-[14.5px] font-bold text-[#18181B]">
                      <span>Tiến độ</span>
                      <span className="font-mono font-black text-[#C85A43] tabular-nums">
                        {progressPercent}%
                      </span>
                    </div>
                    <div className="w-full bg-[#E8DFCE] rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#C85A43] to-amber-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="text-[13px] font-semibold text-slate-600 tabular-nums">
                      Đã học {completedCount}/{course.lessons.length} bài
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

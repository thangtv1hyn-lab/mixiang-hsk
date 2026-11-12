import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  PlusCircle,
  ChevronRight,
  Flame,
  Award,
  Layers,
  Search,
  Filter,
  PlayCircle,
  HelpCircle,
  BookmarkCheck,
} from 'lucide-react';
import { useHSK } from '../context/HSKContext';
import { HSKLevel, Lesson, Course } from '../types/hsk';

interface CoursesViewProps {
  onOpenLesson: (lesson: Lesson) => void;
  onOpenAdminNewCourse?: () => void;
  onOpenAiTutor?: () => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  onOpenLesson,
  onOpenAdminNewCourse,
  onOpenAiTutor,
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
  } = useHSK();

  const [searchQuery, setSearchQuery] = useState('');

  const levels: HSKLevel[] = ['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5'];

  const currentCourse = courses.find((c) => c.level === activeLevel) || courses[0];

  // Filter lessons
  const filteredLessons = currentCourse?.lessons.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.vietnameseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) || [];

  const completedCount = currentCourse?.lessons.filter((l) =>
    studentProfile.completedLessonIds.includes(l.id)
  ).length || 0;

  const progressPercent = currentCourse?.lessons.length
    ? Math.round((completedCount / currentCourse.lessons.length) * 100)
    : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-900 via-red-800 to-amber-900 text-white p-6 sm:p-8 shadow-lg">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none select-none">
          <span className="font-serif text-[180px] font-black">汉语</span>
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-rose-200 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Chương trình giảng dạy Tiếng Trung chuẩn HSK 3.0</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Lộ trình Chinh phục Tiếng Trung từ HSK 1 đến HSK 5
          </h1>
          <p className="text-rose-100 text-sm sm:text-base leading-relaxed mb-6">
            Học tập bài bản với ngữ pháp chuyên sâu, hội thoại thực tế, phát âm chuẩn Bắc Kinh có AI chấm điểm, và hệ thống đề thi thử tự động.
          </p>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-rose-700/50 text-xs sm:text-sm">
            <div>
              <span className="text-rose-300 block text-[11px]">Trình độ hiện tại</span>
              <span className="font-bold text-base text-white">{studentProfile.targetLevel}</span>
            </div>
            <div>
              <span className="text-rose-300 block text-[11px]">Bài học hoàn thành</span>
              <span className="font-bold text-base text-white">
                {studentProfile.completedLessonIds.length} bài
              </span>
            </div>
            <div>
              <span className="text-rose-300 block text-[11px]">Từ vựng thành thạo</span>
              <span className="font-bold text-base text-emerald-300">
                {studentProfile.masteredVocabIds.length} từ
              </span>
            </div>
            <div>
              <span className="text-rose-300 block text-[11px]">Điểm tích lũy</span>
              <span className="font-bold text-base text-amber-300">
                {studentProfile.xp} XP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Level Selector Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-[#F5EFEB] rounded-xl border border-[#E6DEC8] overflow-x-auto">
          {levels.map((lvl) => {
            const isSelected = activeLevel === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setActiveLevel(lvl)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-white text-red-700 shadow-2xs border border-red-200'
                    : 'text-[#18181B]/70 hover:text-red-700'
                }`}
              >
                {lvl}
              </button>
            );
          })}
        </div>

        {/* Actions Toolbar: Pinyin, AI Tutor, Search & Admin */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pinyin Toggle Button */}
          <button
            onClick={() => setShowPinyin(!showPinyin)}
            title={showPinyin ? 'Đang bật phiên âm Pinyin' : 'Đang ẩn phiên âm Pinyin'}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shadow-xs ${
              showPinyin
                ? 'bg-red-50 text-red-700 border-red-300'
                : 'bg-white text-slate-700 border-[#E6DEC8] hover:bg-[#FAF7F0]'
            }`}
          >
            <span className="font-mono text-xs">Pinyin</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                showPinyin ? 'bg-red-600' : 'bg-slate-300'
              }`}
            ></span>
          </button>

          {/* AI Tutor Button */}
          {onOpenAiTutor && (
            <button
              onClick={onOpenAiTutor}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-700 via-red-600 to-rose-700 text-white shadow-xs hover:from-red-800 hover:to-rose-800 transition-all cursor-pointer whitespace-nowrap hover:shadow-md"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Lão Sư AI</span>
            </button>
          )}

          {/* Search bar */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm bài học, chủ đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E6DEC8] bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          {userRole !== 'student' && (
            <button
              onClick={() => setActiveTab('admin')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#18181B] text-white text-xs font-bold hover:bg-black transition-colors shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Quản lý</span>
            </button>
          )}
        </div>
      </div>

      {/* Course Overview Card */}
      {currentCourse && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${currentCourse.colorScheme.badge}`}>
                  {currentCourse.level}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  {currentCourse.lessons.length} bài học thực hành
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                {currentCourse.vietnameseTitle}
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                {currentCourse.description}
              </p>
            </div>

            {/* Target metrics & Progress */}
            <div className="bg-slate-50 rounded-xl p-4 min-w-[260px] border border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                <span>Tiến độ hoàn thành</span>
                <span className="font-bold text-slate-900">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Mục tiêu: {currentCourse.targetVocabCount} từ vựng</span>
                <span>{currentCourse.grammarPointsCount} ngữ pháp</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lessons List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-rose-600" />
              <span>Danh sách bài học ({filteredLessons.length} bài)</span>
            </h3>
            <p className="text-xs text-slate-500">Mỗi bài học tích hợp từ vựng, ngữ pháp, hội thoại và bài tập tương tác</p>
          </div>
        </div>

        {filteredLessons.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium text-sm">Không tìm thấy bài học nào phù hợp với từ khóa.</p>
            <p className="text-slate-400 text-xs mt-1">Hãy thử tìm kiếm với từ khóa khác hoặc chuyển sang cấp độ khác.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLessons.map((lesson) => {
              const isCompleted = studentProfile.completedLessonIds.includes(lesson.id);

              return (
                <div
                  key={lesson.id}
                  onClick={() => onOpenLesson(lesson)}
                  className={`group relative bg-white rounded-xl border transition-all duration-200 p-5 cursor-pointer hover:shadow-md ${
                    isCompleted
                      ? 'border-red-200 hover:border-red-300 bg-red-50/20'
                      : 'border-[#E6DEC8] hover:border-red-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-red-50 text-red-700 font-bold text-xs flex items-center justify-center border border-red-200">
                        {lesson.lessonNumber}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Bài {lesson.lessonNumber}
                      </span>
                    </div>

                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100/90 px-2.5 py-0.5 rounded-full border border-red-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                        Đã học
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-[#F5EFEB] px-2 py-0.5 rounded-full border border-[#E6DEC8]">
                        <Clock className="w-3 h-3" />
                        {lesson.durationMinutes} phút
                      </span>
                    )}
                  </div>

                  {/* Title in Chinese and Vietnamese */}
                  <h4 className="font-bold text-base text-[#18181B] group-hover:text-red-700 transition-colors mb-1">
                    {lesson.title}
                  </h4>
                  <p className="text-xs text-red-800 font-medium mb-2">
                    {lesson.vietnameseTitle}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    {lesson.description}
                  </p>

                  {/* Lesson Meta Badges */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#F5EFEB] text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                      <span>{lesson.vocabulary.length} từ mới</span>
                      <span>•</span>
                      <span>{lesson.grammar.length} điểm ngữ pháp</span>
                    </div>

                    <div className="flex items-center gap-1 font-bold text-red-700 group-hover:translate-x-1 transition-transform">
                      <span>Vào học</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

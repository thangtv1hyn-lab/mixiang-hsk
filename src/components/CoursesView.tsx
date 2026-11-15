import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  PlusCircle,
  ChevronRight,
  Search,
} from 'lucide-react';
import { useHSK } from '../context/HSKContext';
import { HSKLevel, Lesson } from '../types/hsk';

interface CoursesViewProps {
  onOpenLesson: (lesson: Lesson) => void;
  onOpenAdminNewCourse?: () => void;
  onOpenAiTutor?: () => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  onOpenLesson,
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
  const filteredLessons =
    currentCourse?.lessons.filter((l) => {
      const q = searchQuery.toLowerCase();
      return (
        l.title.toLowerCase().includes(q) ||
        l.vietnameseTitle.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
      );
    }) || [];

  const completedCount =
    currentCourse?.lessons.filter((l) =>
      studentProfile.completedLessonIds.includes(l.id)
    ).length || 0;

  const progressPercent = currentCourse?.lessons.length
    ? Math.round((completedCount / currentCourse.lessons.length) * 100)
    : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Editorial Hero Banner (Đỏ - Be - Đen tươi sáng) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-red-700 to-[#18181B] text-white p-6 sm:p-8 shadow-md border border-red-500/70">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 text-[14px] font-bold text-amber-200">
            <Sparkles className="w-5 h-5 shrink-0" />
            <span>Chương trình Tiếng Trung chuẩn HSK 3.0</span>
          </div>

          <h1 className="font-serif text-[24px] sm:text-[30px] font-black tracking-tight leading-tight text-balance">
            Lộ trình Chinh phục Tiếng Trung từ HSK 1 đến HSK 5
          </h1>

          <p className="text-[19px] text-rose-50 leading-relaxed max-w-3xl">
            Học bài bản với ngữ pháp chuyên sâu, hội thoại thực tế, phát âm chuẩn Bắc Kinh có AI chấm điểm.
          </p>

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

      {/* Level Selector & Controls */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#F5EFEB] rounded-2xl border border-[#E6DEC8]">
          {levels.map((lvl) => {
            const isSelected = activeLevel === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setActiveLevel(lvl)}
                className={`px-5 py-2.5 rounded-xl text-[16px] font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-red-700 text-white shadow-sm'
                    : 'text-[#18181B] hover:bg-white hover:text-red-700'
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
              className={`px-4 py-3 rounded-2xl text-[14px] font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                showPinyin
                  ? 'bg-red-50 text-red-800 border-red-300'
                  : 'bg-white text-[#18181B] border-[#E6DEC8] hover:bg-[#FAF7F0]'
              }`}
            >
              Pinyin: {showPinyin ? 'Đang bật' : 'Đang ẩn'}
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

      {/* Course Overview Card */}
      {currentCourse && (
        <div className="bg-white rounded-3xl border border-[#E8DFCE] p-6 sm:p-8 shadow-2xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2.5 text-[14px] font-bold text-slate-600">
                <span className="text-red-600 font-black">{currentCourse.level}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{currentCourse.lessons.length} bài học thực hành</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{currentCourse.targetVocabCount} từ vựng</span>
              </div>
              <h2 className="font-serif text-[22px] sm:text-[27px] font-black text-[#18181B] leading-snug">
                {currentCourse.vietnameseTitle}
              </h2>
              <p className="text-[19px] text-slate-700 leading-relaxed">
                {currentCourse.description}
              </p>
            </div>

            {/* Progress Card */}
            <div className="bg-[#FAF7F0] rounded-2xl p-5 lg:w-[300px] border border-[#E8DFCE] space-y-3 shrink-0">
              <div className="flex items-center justify-between text-[16px] font-bold text-[#18181B]">
                <span>Tiến độ</span>
                <span className="font-mono font-black text-red-600 tabular-nums">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full bg-[#E8DFCE] rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-600 to-amber-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[14px] font-semibold text-slate-600 tabular-nums">
                <span>Đã học {completedCount}/{currentCourse.lessons.length} bài</span>
                <span>{currentCourse.grammarPointsCount} ngữ pháp</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lessons Grid */}
      <div className="space-y-5">
        <div className="text-center border-b border-[#E8DFCE] pb-4 space-y-1">
          <h3 className="font-serif text-[21px] sm:text-[26px] font-black text-[#18181B] inline-flex items-center justify-center gap-2.5">
            <BookOpen className="w-7 h-7 text-red-600 shrink-0" />
            <span>Danh sách bài học ({filteredLessons.length} bài)</span>
          </h3>
          <p className="text-[19px] text-slate-600">
            Chọn bài học để xem mô tả chi tiết, từ vựng, ngữ pháp và hội thoại
          </p>
        </div>

        {filteredLessons.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-[#D6CBB3] p-12 text-center space-y-2">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
            <p className="text-[#18181B] font-bold text-[19px]">
              Không tìm thấy bài học phù hợp với từ khóa.
            </p>
            <p className="text-slate-600 text-[19px]">
              Hãy thử từ khóa khác hoặc chuyển sang cấp độ HSK khác.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredLessons.map((lesson) => {
              const isCompleted = studentProfile.completedLessonIds.includes(lesson.id);

              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => onOpenLesson(lesson)}
                  className={`group text-left rounded-3xl border-2 transition-all duration-300 ease-out p-6 cursor-pointer hover:-translate-y-1.5 hover:scale-[1.015] hover:shadow-xl flex flex-col justify-between ${
                    isCompleted
                      ? 'border-red-400/80 hover:border-amber-500/75 bg-[#FFF5F3] hover:bg-[#FFEAE6]'
                      : 'bg-white border-[#E6DEC8] hover:border-amber-500/70 hover:bg-[#FFF9F6]'
                  }`}
                >
                  <div className="space-y-3 w-full">
                    <div className="flex items-center justify-between gap-2 text-[14px] font-bold">
                      <span className="font-mono text-red-700 tabular-nums">
                        Bài {String(lesson.lessonNumber).padStart(2, '0')}
                      </span>

                      {isCompleted ? (
                        <span className="flex items-center gap-1.5 text-red-700 font-extrabold">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Đã hoàn thành</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-600 tabular-nums">
                          <Clock className="w-5 h-5" />
                          <span>{lesson.durationMinutes} phút</span>
                        </span>
                      )}
                    </div>

                    <h4 className="font-serif font-black text-[22px] text-[#18181B] group-hover:text-red-600 transition-colors leading-snug">
                      {lesson.title}
                    </h4>
                    <div className="text-[18px] font-bold text-red-700">
                      {lesson.vietnameseTitle}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-5 border-t border-[#F5EFEB] text-[14px] font-semibold text-slate-600 w-full">
                    <div className="flex items-center gap-2 tabular-nums">
                      <span>{lesson.vocabulary.length} từ mới</span>
                      <span aria-hidden="true">·</span>
                      <span>{lesson.grammar.length} ngữ pháp</span>
                    </div>

                    <span className="flex items-center gap-1 font-extrabold text-red-700 group-hover:translate-x-1 transition-transform">
                      <span>Vào học</span>
                      <ChevronRight className="w-5 h-5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

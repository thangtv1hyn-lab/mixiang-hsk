import React, { useState } from 'react';
import {
  LogIn,
  LogOut,
  Bell,
  Flame,
  CheckCircle2,
  Circle,
  BookOpen,
  Trophy,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Award,
  Clock,
  Settings,
  X,
  ShieldCheck,
  Calendar,
  User,
  TrendingUp,
  PlayCircle,
} from 'lucide-react';
import { useHSK } from '../context/HSKContext';

interface RightSidebarProps {
  onOpenGoogleAuth: () => void;
  onOpenReminder: () => void;
  onCloseMobileDrawer?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  onOpenGoogleAuth,
  onOpenReminder,
  onCloseMobileDrawer,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const {
    isAuthenticated,
    currentUser,
    userRole,
    studentProfile,
    courses,
    exams,
    setActiveTab,
    setActiveLevel,
    setCurrentLesson,
    setCurrentExam,
    setIsUserProfileOpen,
    logout,
  } = useHSK();

  // Collapsible dropdown states for Column 3 sections (collapsed by default, expand on click)
  const [openSections, setOpenSections] = useState({
    quickProgress: false,
    notifications: false,
    streak: false,
    missions: false,
    courses: false,
    exams: false,
  });

  // Monthly calendar navigation state
  const today = new Date();
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const todayStr = today.toISOString().split('T')[0];
  const todayMinutes = studentProfile.studyLog[todayStr] || 0;
  const dailyGoal = studentProfile.dailyGoalMinutes || 30;
  const dailyGoalPct = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));

  const isStudent = userRole === 'student';
  const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin';

  // Build full Monthly Calendar grid (Monday-first: T2 -> CN)
  const viewDate = new Date(today.getFullYear(), today.getMonth() + calendarMonthOffset, 1);
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = viewDate.getDay(); // 0=Sun, 1=Mon...
  const leadingBlanks = firstWeekday === 0 ? 6 : firstWeekday - 1;

  const monthCells: Array<
    | { empty: true; key: string }
    | {
        empty: false;
        key: string;
        dayNum: number;
        iso: string;
        loggedMinutes: number;
        isToday: boolean;
        isStudied: boolean;
        isFuture: boolean;
      }
  > = [];

  for (let b = 0; b < leadingBlanks; b++) {
    monthCells.push({ empty: true, key: `blank-${b}` });
  }

  for (let dNum = 1; dNum <= daysInMonth; dNum++) {
    const cellDate = new Date(viewYear, viewMonth, dNum);
    const yyyy = cellDate.getFullYear();
    const mm = String(cellDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dNum).padStart(2, '0');
    const iso = `${yyyy}-${mm}-${dd}`;
    const loggedMinutes = studentProfile.studyLog[iso] || 0;
    const isToday = iso === todayStr;

    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffDays = Math.floor(
      (todayMidnight.getTime() - cellDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const inStreakWindow = diffDays >= 0 && diffDays < studentProfile.streakDays;
    const isStudied = loggedMinutes > 0 || inStreakWindow;
    const isFuture = cellDate > todayMidnight;

    monthCells.push({
      empty: false,
      key: iso,
      dayNum: dNum,
      iso,
      loggedMinutes,
      isToday,
      isStudied,
      isFuture,
    });
  }

  // Today's dynamic missions (Student only)
  const missions = [
    {
      id: 'm-lesson',
      label: 'Hoàn thành 1 bài học HSK',
      done: studentProfile.completedLessonIds.length > 0,
      targetTab: 'courses',
      meta: `${studentProfile.completedLessonIds.length} bài đã xong`,
    },
    {
      id: 'm-vocab',
      label: 'Ôn tập từ vựng Flashcard',
      done:
        studentProfile.masteredVocabIds.length + studentProfile.learningVocabIds.length > 0,
      targetTab: 'vocab',
      meta: `${studentProfile.masteredVocabIds.length} từ thuộc`,
    },
    {
      id: 'm-exam',
      label: 'Thử sức 1 đề thi thử HSK',
      done: studentProfile.examHistory.length > 0,
      targetTab: 'exams',
      meta: `${studentProfile.examHistory.length} bài đã nộp`,
    },
    {
      id: 'm-forum',
      label: 'Thảo luận trên Diễn đàn',
      done: false,
      targetTab: 'forum',
      meta: 'Đặt câu hỏi HSK',
    },
  ];

  const completedMissionsCount = missions.filter((m) => m.done).length;

  const navigateWithAuth = (tab: string) => {
    if (!isAuthenticated) {
      onOpenGoogleAuth();
      onCloseMobileDrawer?.();
      return;
    }
    setActiveTab(tab);
    onCloseMobileDrawer?.();
  };

  const myCourses = [...courses]
    .sort((a, b) => {
      if (a.level === studentProfile.targetLevel) return -1;
      if (b.level === studentProfile.targetLevel) return 1;
      return 0;
    })
    .slice(0, 3);

  // Quick Progress calculations (current HSK level progress + Next Lessons)
  const currentLevelCourse =
    courses.find((c) => c.level === studentProfile.targetLevel) || courses[0];
  const currentLevelLessons = currentLevelCourse?.lessons || [];
  const currentLevelCompletedCount = currentLevelLessons.filter((l) =>
    studentProfile.completedLessonIds.includes(l.id)
  ).length;
  const currentLevelTotalCount = currentLevelLessons.length;
  const currentLevelProgressPct =
    currentLevelTotalCount > 0
      ? Math.round((currentLevelCompletedCount / currentLevelTotalCount) * 100)
      : 0;

  const uncompletedInTargetLevel = currentLevelLessons.filter(
    (l) => !studentProfile.completedLessonIds.includes(l.id)
  );
  const uncompletedAcrossCourses = courses
    .flatMap((c) => c.lessons)
    .filter((l) => !studentProfile.completedLessonIds.includes(l.id));
  const nextLessons = (
    uncompletedInTargetLevel.length > 0
      ? uncompletedInTargetLevel
      : uncompletedAcrossCourses.length > 0
      ? uncompletedAcrossCourses
      : currentLevelLessons
  ).slice(0, 3);

  const latestExamsHistory = [...studentProfile.examHistory].reverse().slice(0, 2);

  // Collapsed Desktop Rail (mirrors Column 1 collapse — only the single square icon/avatar button)
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-1">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={false}
          title="Bấm để hiện bảng tài khoản & tiến độ học"
          className="w-14 h-14 rounded-2xl bg-white border-2 border-red-600 p-1 shadow-xs overflow-hidden flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
        >
          {isAuthenticated ? (
            <img
              src={currentUser?.avatar || studentProfile.avatar}
              alt={currentUser?.name || studentProfile.name}
              referrerPolicy="no-referrer"
              className="w-full h-full rounded-xl object-cover"
            />
          ) : (
            <User className="w-7 h-7 text-red-600" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {onCloseMobileDrawer && (
        <div className="flex items-center justify-between pb-2 border-b border-[#E8DFCE] lg:hidden">
          <span className="font-bold text-[15px] text-[#18181B]">
            {isAuthenticated
              ? isTeacherOrAdmin
                ? 'Không Gian Giảng Dạy'
                : 'Góc Học Tập Cá Nhân'
              : 'Đăng Nhập Tài Khoản'}
          </span>
          <button
            type="button"
            onClick={onCloseMobileDrawer}
            aria-label="Đóng bảng cá nhân"
            className="p-2 rounded-xl border border-[#E8DFCE] bg-white text-[#18181B] cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* 1. ĐĂNG NHẬP / TÀI KHOẢN (Không có chuông, nút đăng xuất chỉ dùng biểu tượng) */}
      <section className="bg-white rounded-3xl border border-[#E8DFCE] p-5 shadow-2xs space-y-4">
        {!isAuthenticated ? (
          <div className="space-y-3.5">
            <button
              type="button"
              onClick={onToggleCollapse}
              title={onToggleCollapse ? 'Bấm để thu gọn cột phải' : undefined}
              className="w-full flex items-center justify-between gap-2 text-left cursor-pointer group"
            >
              <h3 className="font-serif font-black text-[18px] text-[#18181B] group-hover:text-red-600 transition-colors leading-tight">
                Tài khoản MiXiangg
              </h3>
              <span className="text-[12px] font-extrabold text-red-600 shrink-0">
                Chưa đăng nhập
              </span>
            </button>
            <p className="text-[14px] text-slate-700 leading-relaxed font-medium">
              Đăng nhập để mở khóa Thông báo, Chuỗi ngày học, Nhiệm vụ hôm nay, Khóa học và Cuộc thi của bạn.
            </p>
            <button
              type="button"
              onClick={() => {
                onOpenGoogleAuth();
                onCloseMobileDrawer?.();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-[15px] flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <LogIn className="w-5 h-5 shrink-0" />
              <span>Đăng nhập / Đăng ký</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-expanded={!isCollapsed}
              title={onToggleCollapse ? 'Bấm để ẩn/hiện bảng bên phải' : undefined}
              className="w-full flex items-center gap-3.5 text-left group cursor-pointer rounded-xl"
            >
              <img
                src={currentUser?.avatar || studentProfile.avatar}
                alt={currentUser?.name || studentProfile.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full object-cover border-2 border-red-600 shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="min-w-0 flex-1">
                <div className="font-black text-[16px] text-[#18181B] group-hover:text-red-600 transition-colors truncate">
                  {currentUser?.name || studentProfile.name}
                </div>
                <div className="text-[13px] font-bold text-slate-600 flex items-center gap-1.5">
                  <span className="text-red-600 font-extrabold">
                    {userRole === 'admin'
                      ? 'Quản trị'
                      : userRole === 'teacher'
                      ? 'Giáo viên'
                      : 'Học viên'}
                  </span>
                  {isStudent && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{studentProfile.targetLevel}</span>
                    </>
                  )}
                </div>
              </div>
            </button>

            {/* Row: Hồ sơ | Biểu tượng Đăng xuất */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsUserProfileOpen(true);
                  onCloseMobileDrawer?.();
                }}
                className="flex-1 py-3 px-3.5 rounded-2xl bg-[#FDFBF6] hover:bg-[#FFF5F3] border border-[#E8DFCE] text-[#18181B] font-extrabold text-[14px] flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Settings className="w-5 h-5 text-red-600 shrink-0" />
                <span>Hồ sơ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  logout();
                  onCloseMobileDrawer?.();
                }}
                aria-label="Đăng xuất"
                title="Đăng xuất"
                className="p-3 rounded-2xl bg-[#FDFBF6] hover:bg-red-600 border border-[#E8DFCE] hover:border-red-600 text-red-600 hover:text-white flex items-center justify-center cursor-pointer transition-colors shrink-0"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* TIẾN ĐỘ NHANH (QUICK PROGRESS - HIỂN THỊ KHI ĐÃ ĐĂNG NHẬP) */}
      {isAuthenticated && (
        <section className="bg-white rounded-2xl border border-[#E8DFCE] overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => toggleSection('quickProgress')}
            aria-expanded={openSections.quickProgress}
            className="w-full p-4 flex items-center justify-between gap-2 hover:bg-[#FDFBF6] transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <TrendingUp className="w-5 h-5 text-red-600 shrink-0" />
              <h3 className="font-bold text-[14px] text-[#18181B] truncate">
                Tiến độ nhanh
              </h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[12px] font-mono font-bold text-red-600 tabular-nums">
                {currentLevelProgressPct}%
              </span>
              <ChevronDown
                className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${
                  openSections.quickProgress ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {openSections.quickProgress && (
            <div className="px-4 pb-4 pt-3 space-y-3 border-t border-[#F2ECE0]">
              {/* Thanh tiến độ cấp độ HSK hiện tại */}
              <div className="p-3 rounded-xl bg-[#FFF8F5] border border-red-200/70 space-y-2">
                <div className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="font-bold text-[#18181B]">
                    Mục tiêu {currentLevelCourse?.level || studentProfile.targetLevel}
                  </span>
                  <span className="font-mono font-bold text-red-600 tabular-nums">
                    {currentLevelCompletedCount}/{currentLevelTotalCount} bài
                  </span>
                </div>

                <div
                  className="w-full h-2.5 rounded-full bg-[#EFE7D6] overflow-hidden"
                  role="progressbar"
                  aria-valuenow={currentLevelProgressPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-500"
                    style={{ width: `${currentLevelProgressPct}%` }}
                  />
                </div>

                <div className="text-[13px] text-slate-600 truncate">
                  {currentLevelCourse?.vietnameseTitle || 'Lộ trình HSK chuẩn'}
                </div>
              </div>

              {/* Danh sách Bài học tiếp theo (Next Lessons) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[13px] font-bold text-slate-600">
                  <span>Bài học tiếp theo</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentLevelCourse) setActiveLevel(currentLevelCourse.level);
                      navigateWithAuth('courses');
                    }}
                    className="text-red-600 hover:underline cursor-pointer"
                  >
                    Tất cả →
                  </button>
                </div>

                {nextLessons.length > 0 ? (
                  <div className="space-y-2">
                    {nextLessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => {
                          setActiveLevel(lesson.level);
                          setCurrentLesson(lesson);
                          setActiveTab('lesson-detail');
                          onCloseMobileDrawer?.();
                        }}
                        className="group w-full p-2.5 rounded-xl bg-[#FDFBF6] hover:bg-[#FFF5F3] border border-[#E8DFCE] hover:border-amber-500/65 hover:-translate-y-0.5 text-left transition-all duration-200 ease-out cursor-pointer flex items-center gap-2.5"
                      >
                        <PlayCircle className="w-5 h-5 text-red-600 shrink-0 group-hover:scale-110 transition-transform" />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[12px] text-[#18181B] group-hover:text-red-700 truncate">
                            {lesson.vietnameseTitle}
                          </div>
                          <div className="text-[12px] text-slate-500 font-mono tabular-nums">
                            {lesson.level} · Bài {lesson.lessonNumber} · {lesson.durationMinutes}p
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-slate-600 p-2 rounded-xl bg-[#FDFBF6] border border-[#E8DFCE]">
                    Chưa có bài học nào trong cấp độ này.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* CÁC CHỨC NĂNG DÀNH RIÊNG CHO HỌC VIÊN KHI ĐÃ ĐĂNG NHẬP */}
      {isAuthenticated && isStudent && (
        <>
          {/* 2. THÔNG BÁO (CÓ NÚT BUTTON DOWN) */}
          <section className="bg-white rounded-2xl border border-[#E8DFCE] overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleSection('notifications')}
              aria-expanded={openSections.notifications}
              className="w-full p-4 flex items-center justify-between gap-2 hover:bg-[#FDFBF6] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Bell className="w-5 h-5 text-red-600 shrink-0" />
                <h3 className="font-bold text-[14px] text-[#18181B] truncate">Thông báo</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[12px] font-mono font-bold text-red-600 tabular-nums">
                  {studentProfile.examHistory.length > 0 ? '2' : '1'}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${
                    openSections.notifications ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {openSections.notifications && (
              <div className="px-4 pb-4 pt-2 space-y-2.5 border-t border-[#F2ECE0]">
                <button
                  type="button"
                  onClick={() => {
                    onOpenReminder();
                    onCloseMobileDrawer?.();
                  }}
                  className="w-full text-left p-3 rounded-xl bg-[#FFF5F3] border border-red-200/80 hover:border-red-400 transition-colors cursor-pointer"
                >
                  <div className="font-bold text-[12px] text-[#18181B] flex items-center justify-between gap-2">
                    <span>Lịch nhắc học</span>
                    <span className="text-[12px] font-mono tabular-nums text-red-600">
                      {studentProfile.reminderEnabled ? studentProfile.reminderTime : 'Đang tắt'}
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-600 mt-0.5 leading-snug">
                    {studentProfile.reminderEnabled
                      ? `Nhắc ôn HSK vào ${studentProfile.reminderTime} mỗi ngày.`
                      : 'Bấm để bật nhắc nhở giữ chuỗi học tập.'}
                  </p>
                </button>

                {studentProfile.examHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => navigateWithAuth('exams')}
                    className="w-full text-left p-3 rounded-xl bg-[#FDFBF6] border border-[#E8DFCE] hover:border-red-400 transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-[12px] text-[#18181B]">
                      Kết quả thi gần nhất
                    </div>
                    <p className="text-[12px] text-red-700 font-semibold mt-0.5 tabular-nums">
                      Đạt{' '}
                      {
                        studentProfile.examHistory[studentProfile.examHistory.length - 1]
                          .totalScore
                      }
                      /
                      {
                        studentProfile.examHistory[studentProfile.examHistory.length - 1]
                          .maxScore
                      }{' '}
                      điểm
                    </p>
                  </button>
                )}
              </div>
            )}
          </section>

          {/* 3. CHUỖI NGÀY HỌC (LỊCH THÁNG TRỰC QUAN - ẨN MẶC ĐỊNH, KÍCH MỚI SHOW RA) */}
          <section className="bg-gradient-to-br from-red-600 to-rose-700 text-white rounded-2xl border border-red-500 overflow-hidden shadow-sm">
            {/* Header có thể kích để đóng/mở */}
            <button
              type="button"
              onClick={() => toggleSection('streak')}
              aria-expanded={openSections.streak}
              className="w-full p-4 flex items-center justify-between gap-2 hover:bg-black/10 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Flame className="w-5 h-5 text-amber-300 fill-amber-300 shrink-0" />
                <h3 className="font-bold text-[14px] leading-tight truncate">Chuỗi ngày học</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono font-extrabold text-[14px] text-amber-200 tabular-nums">
                  {studentProfile.streakDays} ngày
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-amber-200 transition-transform duration-200 ${
                    openSections.streak ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {openSections.streak && (
              <div className="px-4 pb-4 pt-2 space-y-3.5 border-t border-white/15">
                {/* LỊCH THÁNG TRỰC QUAN */}
                <div className="bg-black/15 rounded-xl p-3 space-y-2.5 border border-white/15">
                  <div className="flex items-center justify-between text-[12px] text-rose-50 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>
                        Tháng {viewMonth + 1}/{viewYear}
                      </span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCalendarMonthOffset((m) => m - 1)}
                        aria-label="Tháng trước"
                        className="p-1 rounded-md hover:bg-white/15 text-white cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarMonthOffset((m) => m + 1)}
                        aria-label="Tháng sau"
                        className="p-1 rounded-md hover:bg-white/15 text-white cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[12px] font-bold text-rose-100/90">
                    <span>T2</span>
                    <span>T3</span>
                    <span>T4</span>
                    <span>T5</span>
                    <span>T6</span>
                    <span>T7</span>
                    <span>CN</span>
                  </div>

                  {/* Monthly Day Cells */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {monthCells.map((cell) => {
                      if (cell.empty || !('dayNum' in cell)) {
                        return <div key={cell.key} className="h-7" />;
                      }

                      return (
                        <div
                          key={cell.key}
                          title={
                            cell.loggedMinutes > 0
                              ? `${cell.iso}: ${cell.loggedMinutes} phút học`
                              : cell.iso
                          }
                          className={`h-7 rounded-md flex items-center justify-center text-[13px] font-mono font-bold tabular-nums transition-colors ${
                            cell.isStudied
                              ? 'bg-amber-300 text-[#18181B]'
                              : cell.isToday
                              ? 'bg-white/25 text-white ring-2 ring-amber-200'
                              : cell.isFuture
                              ? 'bg-white/5 text-white/45'
                              : 'bg-white/15 text-white/85'
                          }`}
                        >
                          {cell.dayNum}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[12px] text-rose-100 pt-1 border-t border-white/10">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-amber-300 inline-block" />
                      <span>Đã học</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs ring-2 ring-amber-200 inline-block" />
                      <span>Hôm nay</span>
                    </span>
                  </div>
                </div>

                {/* XP & Mục tiêu hôm nay */}
                <div className="space-y-2 text-[12px]">
                  <div className="flex items-center justify-between text-rose-50">
                    <span className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>Điểm tích lũy</span>
                    </span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {studentProfile.xp.toLocaleString()} XP
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-rose-50">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-300 shrink-0" />
                        <span>Mục tiêu hôm nay</span>
                      </span>
                      <span className="font-mono font-bold text-amber-200 tabular-nums">
                        {todayMinutes}/{dailyGoal} phút
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-black/25 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-300 transition-all duration-300"
                        style={{ width: `${dailyGoalPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 4. NHIỆM VỤ HÔM NAY (CÓ NÚT BUTTON DOWN) */}
          <section className="bg-white rounded-2xl border border-[#E8DFCE] overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => toggleSection('missions')}
              aria-expanded={openSections.missions}
              className="w-full p-4 flex items-center justify-between gap-2 hover:bg-[#FDFBF6] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0" />
                <h3 className="font-bold text-[14px] text-[#18181B] truncate">
                  Nhiệm vụ hôm nay
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[12px] font-mono font-bold text-red-600 tabular-nums">
                  {completedMissionsCount}/{missions.length}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${
                    openSections.missions ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {openSections.missions && (
              <div className="px-4 pb-4 pt-2 space-y-2 border-t border-[#F2ECE0]">
                {missions.map((mission) => (
                  <button
                    key={mission.id}
                    type="button"
                    onClick={() => navigateWithAuth(mission.targetTab)}
                    className={`w-full flex items-start gap-2.5 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      mission.done
                        ? 'bg-[#FFF5F3] border-red-200'
                        : 'bg-white border-[#E8DFCE] hover:border-red-400 hover:bg-[#FDFBF6]'
                    }`}
                  >
                    {mission.done ? (
                      <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-[12px] font-bold leading-snug ${
                          mission.done ? 'line-through text-slate-500' : 'text-[#18181B]'
                        }`}
                      >
                        {mission.label}
                      </div>
                      <div className="text-[13px] text-slate-500 mt-0.5">{mission.meta}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* 5. KHÓA HỌC CỦA TÔI (CÓ NÚT BUTTON DOWN) */}
      {isAuthenticated && (
        <section className="bg-white rounded-2xl border border-[#E8DFCE] overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => toggleSection('courses')}
            aria-expanded={openSections.courses}
            className="w-full p-4 flex items-center justify-between gap-2 hover:bg-[#FDFBF6] transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <BookOpen className="w-5 h-5 text-red-600 shrink-0" />
              <h3 className="font-bold text-[14px] text-[#18181B] truncate">
                Khóa học của tôi
              </h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[12px] font-mono font-bold text-red-600 tabular-nums">
                {myCourses.length}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${
                  openSections.courses ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {openSections.courses && (
            <div className="px-4 pb-4 pt-2 space-y-2.5 border-t border-[#F2ECE0]">
              {myCourses.map((course) => {
                const total = course.lessons.length || 1;
                const done = course.lessons.filter((l) =>
                  studentProfile.completedLessonIds.includes(l.id)
                ).length;
                const pct = Math.round((done / total) * 100);

                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => {
                      setActiveLevel(course.level);
                      navigateWithAuth('courses');
                    }}
                    className="w-full p-3 rounded-xl bg-[#FDFBF6] hover:bg-[#FFF5F3] border border-[#E8DFCE] text-left transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[12px] text-[#18181B]">
                        {course.level}
                      </span>
                      <span className="font-mono text-[12px] font-bold text-red-600 tabular-nums">
                        {isTeacherOrAdmin
                          ? `${course.lessons.length} bài giảng`
                          : `${done}/${course.lessons.length} bài`}
                      </span>
                    </div>
                    <div className="text-[12px] text-slate-600 truncate">
                      {course.vietnameseTitle}
                    </div>
                    {isStudent && (
                      <div className="w-full h-2 rounded-full bg-[#E8DFCE] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-600 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => navigateWithAuth(isTeacherOrAdmin ? 'admin' : 'courses')}
                className="w-full py-1.5 text-center text-[12px] font-bold text-red-600 hover:underline cursor-pointer"
              >
                {isTeacherOrAdmin ? 'Mở quản lý khóa học →' : 'Xem tất cả khóa học →'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* 6. CUỘC THI / KỲ THI CỦA TÔI (CÓ NÚT BUTTON DOWN) */}
      {isAuthenticated && (
        <section className="bg-white rounded-2xl border border-[#E8DFCE] overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => toggleSection('exams')}
            aria-expanded={openSections.exams}
            className="w-full p-4 flex items-center justify-between gap-2 hover:bg-[#FDFBF6] transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Trophy className="w-5 h-5 text-red-600 shrink-0" />
              <h3 className="font-bold text-[14px] text-[#18181B] truncate">
                {isTeacherOrAdmin ? 'Kỳ thi của tôi' : 'Cuộc thi của tôi'}
              </h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[12px] font-mono font-bold text-red-600 tabular-nums">
                {isTeacherOrAdmin ? exams.length : studentProfile.examHistory.length}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${
                  openSections.exams ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {openSections.exams && (
            <div className="px-4 pb-4 pt-2 space-y-2.5 border-t border-[#F2ECE0]">
              {isTeacherOrAdmin ? (
                <div className="space-y-2">
                  {exams.slice(0, 3).map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => navigateWithAuth('exams')}
                      className="w-full p-3 rounded-xl bg-[#FDFBF6] hover:bg-[#FFF5F3] border border-[#E8DFCE] text-left transition-colors cursor-pointer"
                    >
                      <div className="font-bold text-[12px] text-[#18181B] truncate">
                        {ex.title}
                      </div>
                      <div className="flex items-center justify-between text-[12px] text-slate-600 mt-1">
                        <span className="font-bold text-red-600">{ex.level}</span>
                        <span className="font-mono tabular-nums">{ex.questions.length} câu hỏi</span>
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => navigateWithAuth('admin')}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#18181B] hover:bg-red-600 text-white font-bold text-[12px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Mở Bảng Quản lý Đề thi</span>
                  </button>
                </div>
              ) : latestExamsHistory.length > 0 ? (
                <div className="space-y-2">
                  {latestExamsHistory.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateWithAuth('exams')}
                      className="w-full p-3 rounded-xl bg-[#FDFBF6] hover:bg-[#FFF5F3] border border-[#E8DFCE] text-left transition-colors cursor-pointer"
                    >
                      <div className="font-bold text-[12px] text-[#18181B] truncate">
                        {item.examTitle}
                      </div>
                      <div className="flex items-center justify-between text-[12px] mt-1">
                        <span
                          className={
                            item.passed
                              ? 'text-red-600 font-bold'
                              : 'text-slate-600 font-semibold'
                          }
                        >
                          {item.passed ? 'Đạt chuẩn' : 'Cần cố gắng'}
                        </span>
                        <span className="font-mono font-extrabold text-[#18181B] tabular-nums">
                          {item.totalScore}/{item.maxScore} đ
                        </span>
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => navigateWithAuth('exams')}
                    className="w-full py-1.5 text-center text-[12px] font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Vào phòng thi thử →
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#FDFBF6] border border-[#E8DFCE] space-y-2">
                  <div className="text-[12px] font-bold text-[#18181B]">
                    {exams[0]?.title || 'Đề thi thử HSK chuẩn'}
                  </div>
                  <p className="text-[12px] text-slate-600 leading-snug">
                    Bạn chưa tham gia kỳ thi nào. Hãy thử sức ngay để xếp hạng năng lực!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (exams[0] && isAuthenticated) {
                        setCurrentExam(exams[0]);
                        setActiveTab('exam-taking');
                        onCloseMobileDrawer?.();
                      } else {
                        navigateWithAuth('exams');
                      }
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[12px] transition-colors cursor-pointer"
                  >
                    Vào thi thử ngay
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

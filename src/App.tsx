import React, { useState } from 'react';
import { HSKProvider, useHSK } from './context/HSKContext';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { IndexHomeView } from './components/IndexHomeView';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AuthRequiredGate } from './components/AuthRequiredGate';
import { CoursesView } from './components/CoursesView';
import { LessonDetailView } from './components/LessonDetailView';
import { VocabularyFlashcardsView } from './components/VocabularyFlashcardsView';
import { ExamsView } from './components/ExamsView';
import { ExamTakingView } from './components/ExamTakingView';
import { ExamResultView } from './components/ExamResultView';
import { ReportsView } from './components/ReportsView';
import { ForumView } from './components/ForumView';
import { AdminDashboard } from './components/AdminDashboard';
import { MobileAppCompanion } from './components/MobileAppCompanion';
import { ReminderModal } from './components/ReminderModal';
import { AITutorFloatingDrawer } from './components/AITutorFloatingDrawer';
import { GamesView } from './components/GamesView';
import {
  Sparkles,
  Menu,
  User,
  Bell,
  GraduationCap,
  Layers,
  FileText,
  Gamepad2,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  LogOut,
  PanelRight,
  BookOpen,
  Award,
} from 'lucide-react';
import { Exam, Lesson } from './types/hsk';
import { resolveCartoonAvatar } from './utils/cartoonAvatars';

function MainAppContent() {
  const {
    activeTab,
    setActiveTab,
    currentLesson,
    setCurrentLesson,
    currentExam,
    setCurrentExam,
    lastExamResult,
    setLastExamResult,
    isGoogleAuthModalOpen,
    setIsGoogleAuthModalOpen,
    isUserProfileOpen,
    setIsUserProfileOpen,
    userRole,
    isAuthenticated,
    currentUser,
    studentProfile,
    logout,
    siteUIConfig,
  } = useHSK();

  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [coursesResetKey, setCoursesResetKey] = useState(0);

  const handleOpenLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setActiveTab('lesson-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartExam = (exam: Exam) => {
    setCurrentExam(exam);
    setActiveTab('exam-taking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (tabId: string, requiresAuth = true) => {
    if (requiresAuth && !isAuthenticated) {
      setIsGoogleAuthModalOpen(true);
      return;
    }
    if (tabId === 'courses') {
      setCoursesResetKey((prev) => prev + 1);
    }
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const topNavItems = [
    { id: 'courses', label: 'Khóa Học', icon: GraduationCap },
    { id: 'vocab', label: 'Từ Vựng', icon: Layers },
    { id: 'exams', label: 'Luyện Thi', icon: FileText },
    { id: 'games', label: 'Trò Chơi', icon: Gamepad2 },
    { id: 'forum', label: 'Diễn Đàn', icon: MessageSquare },
    { id: 'reports', label: 'Tiến Độ', icon: BarChart3 },
  ];

  return (
    <div
      className="min-h-screen text-[#1C1E21] flex flex-col font-sans selection:bg-red-600 selection:text-white"
      style={{ backgroundColor: siteUIConfig.canvasColor || '#F7F4EC' }}
    >
      {/* ================================================================= */}
      {/* 1. TOP HEADER NAVIGATION BAR (CHUẨN GIAO DIỆN PDF MIXIANGG HSK) */}
      {/* ================================================================= */}
      <header className="sticky top-0 z-40 w-full bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#EAE5DC]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Left: Mobile Menu Button + Brand Identity */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsLeftDrawerOpen(true)}
              aria-label="Mở menu điều hướng"
              className="lg:hidden p-2 rounded-xl border border-[#EAE5DC] bg-white text-[#1C1E21] hover:border-red-600 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('home', false)}
              className="flex items-center gap-3 text-left group cursor-pointer"
            >
              {siteUIConfig.headerLogoUrl ? (
                <div className="w-11 h-11 rounded-full bg-white border border-[#EAE5DC] overflow-hidden flex items-center justify-center shadow-xs transition-opacity group-hover:opacity-90 shrink-0">
                  <img
                    src={siteUIConfig.headerLogoUrl}
                    alt={siteUIConfig.brandName || 'MiXiangg HSK'}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div
                  className="w-11 h-11 rounded-full text-white flex items-center justify-center font-serif text-[22px] font-bold shadow-xs transition-opacity group-hover:opacity-90 shrink-0"
                  style={{ backgroundColor: siteUIConfig.primaryColor || '#C85A43' }}
                >
                  米
                </div>
              )}
              <div>
                <div className="text-[19px] font-extrabold leading-tight tracking-tight text-[#1C1E21]">
                  {siteUIConfig.brandName}{' '}
                  <span style={{ color: siteUIConfig.primaryColor || '#C85A43' }}>
                    {siteUIConfig.brandHighlight}
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Center: Horizontal Navigation Links */}
          <nav aria-label="Điều hướng chính" className="hidden lg:flex items-center gap-1 xl:gap-2">
            {topNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id ||
                (item.id === 'courses' && activeTab === 'lesson-detail') ||
                (item.id === 'exams' &&
                  (activeTab === 'exam-taking' || activeTab === 'exam-result'));

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id, true)}
                  className={`px-3.5 py-2 rounded-xl text-[14px] font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#FCECE8] text-[#C85A43]'
                      : 'text-[#3B3E45] hover:text-[#C85A43] hover:bg-[#F5F1E8]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {userRole !== 'student' && (
              <button
                type="button"
                onClick={() => handleNavClick('admin', true)}
                className={`px-3.5 py-2 rounded-xl text-[14px] font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'admin'
                    ? 'bg-[#1C1E21] text-white'
                    : 'text-[#1C1E21] bg-[#EFECE6] hover:bg-[#1C1E21] hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{userRole === 'admin' ? 'Quản Trị' : 'Giảng Dạy'}</span>
              </button>
            )}
          </nav>

          {/* Right: Notification Bell & Login / User Account */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsReminderOpen(true)}
              aria-label="Thông báo & Lịch nhắc học tập"
              title="Lịch nhắc học tập hàng ngày"
              className="w-10 h-10 rounded-full bg-white border border-[#EAE5DC] hover:border-[#C85A43] flex items-center justify-center relative transition-colors cursor-pointer shadow-2xs"
            >
              <Bell className="w-4 h-4 text-[#3B3E45]" />
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-[#C85A43] ring-2 ring-white" />
            </button>

            {!isAuthenticated ? (
              <button
                type="button"
                onClick={() => setIsGoogleAuthModalOpen(true)}
                className="px-5 py-2.5 rounded-full bg-[#C85A43] hover:bg-[#B24A34] text-white font-bold text-[13.5px] flex items-center gap-2 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Đăng Nhập</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsUserProfileOpen(true)}
                  title={currentUser?.name || studentProfile.name || 'Hồ sơ tài khoản'}
                  aria-label="Hồ sơ tài khoản"
                  className="w-10 h-10 rounded-full bg-white border border-[#EAE5DC] hover:border-[#C85A43] flex items-center justify-center transition-colors cursor-pointer overflow-hidden p-0.5"
                >
                  <img
                    src={resolveCartoonAvatar(
                      currentUser?.avatar || studentProfile.avatar,
                      currentUser?.email || studentProfile.email
                    )}
                    alt={currentUser?.name || studentProfile.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setIsRightDrawerOpen(true)}
                  title="Bảng xếp hạng & Tiến độ cá nhân"
                  aria-label="Mở bảng xếp hạng và tiến độ"
                  className="p-2.5 rounded-full bg-white border border-[#EAE5DC] hover:border-[#C85A43] text-[#3B3E45] hover:text-[#C85A43] transition-colors cursor-pointer"
                >
                  <PanelRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={logout}
                  title="Đăng xuất"
                  aria-label="Đăng xuất"
                  className="p-2.5 rounded-full bg-white border border-[#EAE5DC] hover:border-[#C85A43] text-slate-400 hover:text-[#C85A43] transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ================================================================= */}
      {/* 3. MAIN CONTENT AREA */}
      {/* ================================================================= */}
      <main className="flex-1 w-full">
        {activeTab === 'home' ? (
          <IndexHomeView
            onOpenGoogleAuth={() => setIsGoogleAuthModalOpen(true)}
            onOpenReminder={() => setIsReminderOpen(true)}
            onOpenAiTutor={() => setIsAiTutorOpen(true)}
            externalConsultationOpen={isConsultModalOpen}
            onCloseExternalConsultation={() => setIsConsultModalOpen(false)}
          />
        ) : (
          <div
            className={`${
              activeTab === 'admin'
                ? 'max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6'
                : 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'
            }`}
          >
            {!isAuthenticated ? (
              <AuthRequiredGate
                onLogin={() => setIsGoogleAuthModalOpen(true)}
                onGoHome={() => setActiveTab('home')}
              />
            ) : (
              <>
                {activeTab === 'courses' && (
                  <CoursesView
                    onOpenLesson={handleOpenLesson}
                    onOpenAiTutor={() => setIsAiTutorOpen(true)}
                    resetKey={coursesResetKey}
                  />
                )}

                {activeTab === 'lesson-detail' && currentLesson && (
                  <LessonDetailView
                    lesson={currentLesson}
                    onBack={() => setActiveTab('courses')}
                  />
                )}

                {activeTab === 'vocab' && <VocabularyFlashcardsView />}

                {activeTab === 'games' && <GamesView />}

                {activeTab === 'exams' && (
                  <ExamsView
                    onStartExam={handleStartExam}
                    onViewResult={() => setActiveTab('exam-result')}
                  />
                )}

                {activeTab === 'exam-taking' && currentExam && (
                  <ExamTakingView
                    exam={currentExam}
                    onFinishExam={(result) => {
                      setLastExamResult(result);
                      setActiveTab('exam-result');
                    }}
                    onCancel={() => setActiveTab('exams')}
                  />
                )}

                {activeTab === 'exam-result' && lastExamResult && (
                  <ExamResultView
                    result={lastExamResult}
                    onRetake={() => {
                      if (currentExam) {
                        setActiveTab('exam-taking');
                      } else {
                        setActiveTab('exams');
                      }
                    }}
                    onGoToReports={() => setActiveTab('reports')}
                    onGoToExamsList={() => setActiveTab('exams')}
                  />
                )}

                {activeTab === 'reports' && <ReportsView />}

                {activeTab === 'forum' && <ForumView />}

                {activeTab === 'admin' && userRole !== 'student' && (
                  <AdminDashboard onOpenAiTutor={() => setIsAiTutorOpen(true)} />
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* ================================================================= */}
      {/* 4. FOOTER CARD (CHUẨN GIAO DIỆN ẢNH MẪU MIXIANGG HSK) */}
      {/* ================================================================= */}
      <footer
        className="w-full border-t border-[#E6DFCE] pt-6 sm:pt-8 pb-24 lg:pb-8 px-4 sm:px-6 lg:px-8 mt-auto"
        style={{ backgroundColor: siteUIConfig.canvasColor || '#F7F4EC' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl border border-[#EAE5DC] shadow-2xs px-6 sm:px-10 py-6 sm:py-7 flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Left: MiXiangg HSK Signature Logo Banner */}
            <button
              type="button"
              onClick={() => handleNavClick('home', false)}
              className="cursor-pointer focus:outline-none shrink-0"
              title="Về trang chủ MiXiangg HSK"
            >
              <img
                src={siteUIConfig.footerLogoUrl || '/assets/aistudio/banner_d01a30da.jpg'}
                alt="MiXiangg HSK Chinese Learning"
                className="h-20 sm:h-24 w-auto object-contain"
              />
            </button>

            {/* Right: Admission Info + CTA Button */}
            <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-7 text-center sm:text-right">
              <div className="space-y-1">
                <div className="text-[15.5px] sm:text-[17.5px] font-extrabold text-[#18181B] tracking-tight">
                  {siteUIConfig.footerTitle}
                </div>
                <div className="text-[13px] sm:text-[14.5px] text-[#686B72] font-medium">
                  {siteUIConfig.footerSubtitle}
                  {siteUIConfig.hotline && (
                    <>
                      {' · Hotline / Zalo: '}
                      <a
                        href={`tel:${siteUIConfig.hotline.replace(/[^0-9+]/g, '')}`}
                        className="font-mono font-bold text-[#B83B2A] hover:underline"
                      >
                        {siteUIConfig.hotline}
                      </a>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleNavClick('courses', true)}
                style={{ backgroundColor: siteUIConfig.primaryColor || '#C85A43' }}
                className="px-6 py-3.5 rounded-2xl text-white font-bold text-[14px] border border-[#A6422D] shadow-[0_3px_0_#9E3E2A] hover:opacity-95 active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                {siteUIConfig.footerCtaText || 'Xem Lộ trình Khóa học'}
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ================================================================= */}
      {/* 5. MOBILE BOTTOM NAVIGATION BAR (CHUẨN GIAO DIỆN ẢNH MÔ TẢ)       */}
      {/* ================================================================= */}
      <nav
        aria-label="Menu điều hướng di động"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 min-h-16 bg-white/95 backdrop-blur-md border-t border-[#EAE5DC] shadow-[0_-4px_20px_rgba(28,30,33,0.06)] flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]"
      >
        <button
          type="button"
          onClick={() => handleNavClick('courses', true)}
          aria-current={activeTab === 'courses' || activeTab === 'lesson-detail' ? 'page' : undefined}
          className={`relative flex flex-col items-center justify-center gap-1 min-w-[68px] min-h-[48px] px-2 rounded-xl text-[12px] font-bold transition-colors cursor-pointer ${
            activeTab === 'courses' || activeTab === 'lesson-detail'
              ? 'text-[#C85A43]'
              : 'text-[#686B72] hover:text-[#C85A43]'
          }`}
        >
          {(activeTab === 'courses' || activeTab === 'lesson-detail') && (
            <span className="absolute top-0 w-7 h-0.5 rounded-full bg-[#C85A43]" />
          )}
          <BookOpen className="w-5 h-5" />
          <span>Học tập</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('vocab', true)}
          aria-current={activeTab === 'vocab' ? 'page' : undefined}
          className={`relative flex flex-col items-center justify-center gap-1 min-w-[68px] min-h-[48px] px-2 rounded-xl text-[12px] font-bold transition-colors cursor-pointer ${
            activeTab === 'vocab'
              ? 'text-[#C85A43]'
              : 'text-[#686B72] hover:text-[#C85A43]'
          }`}
        >
          {activeTab === 'vocab' && (
            <span className="absolute top-0 w-7 h-0.5 rounded-full bg-[#C85A43]" />
          )}
          <Layers className="w-5 h-5" />
          <span>Từ vựng</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!isAuthenticated) {
              setIsGoogleAuthModalOpen(true);
            } else {
              setIsAiTutorOpen(true);
            }
          }}
          className={`relative flex flex-col items-center justify-center gap-1 min-w-[68px] min-h-[48px] px-2 rounded-xl text-[12px] font-bold transition-colors cursor-pointer ${
            isAiTutorOpen
              ? 'text-[#C85A43]'
              : 'text-[#686B72] hover:text-[#C85A43]'
          }`}
        >
          {isAiTutorOpen && (
            <span className="absolute top-0 w-7 h-0.5 rounded-full bg-[#C85A43]" />
          )}
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>Lão Sư AI</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('reports', true)}
          aria-current={activeTab === 'reports' ? 'page' : undefined}
          className={`relative flex flex-col items-center justify-center gap-1 min-w-[68px] min-h-[48px] px-2 rounded-xl text-[12px] font-bold transition-colors cursor-pointer ${
            activeTab === 'reports'
              ? 'text-[#C85A43]'
              : 'text-[#686B72] hover:text-[#C85A43]'
          }`}
        >
          {activeTab === 'reports' && (
            <span className="absolute top-0 w-7 h-0.5 rounded-full bg-[#C85A43]" />
          )}
          <Award className="w-5 h-5" />
          <span>Cá nhân</span>
        </button>
      </nav>

      {/* Mobile Drawer: Left Sidebar */}
      {isLeftDrawerOpen && (
        <div
          onClick={() => setIsLeftDrawerOpen(false)}
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[290px] max-w-[85vw] h-full bg-[#F7F4EC] border-r border-[#EAE5DC] p-5 overflow-y-auto shadow-2xl"
          >
            <LeftSidebar
              onOpenGoogleAuth={() => setIsGoogleAuthModalOpen(true)}
              onOpenAiTutor={() => setIsAiTutorOpen(true)}
              onCloseMobileDrawer={() => setIsLeftDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Slide-over Drawer: Personal Progress & Leaderboard (RightSidebar) */}
      {isRightDrawerOpen && (
        <div
          onClick={() => setIsRightDrawerOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[330px] max-w-[88vw] h-full bg-[#F7F4EC] border-l border-[#EAE5DC] p-5 overflow-y-auto shadow-2xl"
          >
            <RightSidebar
              onOpenGoogleAuth={() => setIsGoogleAuthModalOpen(true)}
              onOpenReminder={() => setIsReminderOpen(true)}
              onCloseMobileDrawer={() => setIsRightDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Floating AI Tutor Launcher Button (Desktop) */}
      <button
        type="button"
        onClick={() => {
          if (!isAuthenticated) {
            setIsGoogleAuthModalOpen(true);
          } else {
            setIsAiTutorOpen(true);
          }
        }}
        className="hidden lg:flex fixed bottom-5 right-5 z-40 p-3.5 sm:px-5 sm:py-3 rounded-full bg-[#C85A43] hover:bg-[#B24A34] text-white shadow-xl transition-transform hover:scale-105 items-center gap-2 cursor-pointer border border-white/25"
        title="Trò chuyện với Lão Sư AI"
      >
        <span className="font-serif text-[16px] font-bold">师</span>
        <span className="hidden sm:inline font-bold text-[13px]">Hỏi Lão Sư AI</span>
        <Sparkles className="w-4 h-4 text-amber-200" />
      </button>

      {/* Modals & Drawers */}
      <AITutorFloatingDrawer
        isOpen={isAiTutorOpen}
        onClose={() => setIsAiTutorOpen(false)}
      />

      <ReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
      />

      <GoogleAuthModal
        isOpen={isGoogleAuthModalOpen}
        onClose={() => setIsGoogleAuthModalOpen(false)}
      />

      <UserProfileModal
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
      />

      <MobileAppCompanion />
    </div>
  );
}

export default function App() {
  return (
    <HSKProvider>
      <MainAppContent />
    </HSKProvider>
  );
}

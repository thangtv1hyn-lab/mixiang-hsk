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
import { Sparkles, Menu, User, PhoneCall, Bell, Smartphone } from 'lucide-react';
import { Exam, Lesson } from './types/hsk';

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
    studentProfile,
    setIsMobileCompanionOpen,
  } = useHSK();

  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(true);
  const [isRightCollapsed, setIsRightCollapsed] = useState(true);

  const handleOpenLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setActiveTab('lesson-detail');
  };

  const handleStartExam = (exam: Exam) => {
    setCurrentExam(exam);
    setActiveTab('exam-taking');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF6] text-[#18181B] flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Compact Mobile/Tablet Top Bar */}
      <div className="lg:hidden sticky top-0 z-40 h-14 px-3 bg-[#FDFBF6]/95 backdrop-blur-md border-b border-[#E8DFCE] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsLeftDrawerOpen(true)}
          aria-label="Mở menu điều hướng"
          className="p-2 rounded-xl border border-[#E8DFCE] bg-white text-[#18181B] hover:border-red-600 cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <img
            src="/assets/aistudio/logo_2cd38f9f.jpg"
            alt="MiXiangg HSK"
            className="w-8 h-8 rounded-lg border border-red-600 object-contain bg-white mix-blend-multiply"
          />
          <span className="font-black text-[14px] tracking-tight text-[#18181B]">
            MIXIANGG HSK
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIsRightDrawerOpen(true)}
          aria-label="Mở bảng tài khoản cá nhân"
          className="px-3 py-1.5 rounded-xl border border-[#E8DFCE] bg-white text-[#18181B] hover:border-red-600 flex items-center gap-1.5 font-bold text-[12px] cursor-pointer"
        >
          <User className="w-5 h-5 text-red-600" />
          <span className="tabular-nums">
            {isAuthenticated ? `${studentProfile.streakDays}d` : 'Tài khoản'}
          </span>
        </button>
      </div>

      {/* Persistent 3-Column Full-Width Shell (Cột 1 sát trái, Cột 3 sát phải, Cột 2 mở rộng tối đa) */}
      <div className="flex-1 w-full px-3 sm:px-4 lg:px-5 pt-4 lg:pt-6 pb-10 lg:flex lg:items-start lg:gap-5 xl:gap-6">
        {/* CỘT 1 (TRÁI): LOGO & MENU ĐIỀU HƯỚNG (CÓ THỂ ẨN/HIỆN MENU) */}
        <aside
          aria-label="Thanh điều hướng bên trái"
          className={`hidden lg:block shrink-0 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto transition-all duration-200 ${
            isLeftCollapsed ? 'w-[66px]' : 'w-[180px] xl:w-[196px]'
          }`}
        >
          <LeftSidebar
            onOpenGoogleAuth={() => setIsGoogleAuthModalOpen(true)}
            onOpenAiTutor={() => setIsAiTutorOpen(true)}
            isCollapsed={isLeftCollapsed}
            onToggleCollapse={() => setIsLeftCollapsed((prev) => !prev)}
          />
        </aside>

        {/* CỘT 2 (GIỮA): NỘI DUNG CHÍNH */}
        <main className="flex-1 min-w-0">
          {activeTab === 'home' && (
            <IndexHomeView
              onOpenGoogleAuth={() => setIsGoogleAuthModalOpen(true)}
              onOpenReminder={() => setIsReminderOpen(true)}
              onOpenAiTutor={() => setIsAiTutorOpen(true)}
            />
          )}

          {!isAuthenticated && activeTab !== 'home' ? (
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

              {activeTab === 'admin' && userRole !== 'student' && <AdminDashboard />}
            </>
          )}
        </main>

        {/* CỘT 3 (PHẢI): ĐĂNG NHẬP & CHỨC NĂNG THEO VAI TRÒ (CÓ THỂ THU GỌN GIỐNG CỘT 1) */}
        <aside
          aria-label="Bảng thông tin cá nhân bên phải"
          className={`hidden lg:block shrink-0 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto transition-all duration-200 ${
            isRightCollapsed ? 'w-[66px]' : 'w-[216px] xl:w-[236px]'
          }`}
        >
          <RightSidebar
            onOpenGoogleAuth={() => setIsGoogleAuthModalOpen(true)}
            onOpenReminder={() => setIsReminderOpen(true)}
            isCollapsed={isRightCollapsed}
            onToggleCollapse={() => setIsRightCollapsed((prev) => !prev)}
          />
        </aside>
      </div>

      {/* FULL-WIDTH SLIM FOOTER ACROSS ALL PAGES */}
      <footer className="w-full bg-[#18181B] text-white border-t-4 border-red-600 mt-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Brand */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white border border-red-600 p-1 shrink-0 flex items-center justify-center">
              <img
                src="/assets/aistudio/logo_2cd38f9f.jpg"
                alt="MiXiangg HSK"
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>
            <div>
              <div className="font-serif font-black text-[16px] leading-tight text-white">
                MIXIANGG HSK · CHINESE LEARNING
              </div>
              <div className="text-[12px] text-stone-300">
                Đào tạo Tiếng Trung Boya & Luyện thi HSK 1–5 (Online & Offline)
              </div>
            </div>
          </div>

          {/* Contact & Quick Links spread horizontally */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-stone-200">
            <a
              href="tel:0378105999"
              className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 font-bold tabular-nums"
            >
              <PhoneCall className="w-4 h-4 shrink-0" />
              <span>Hotline / Zalo: 0378.105.999</span>
            </a>

            <span className="text-stone-400 hidden sm:inline">|</span>
            <span>Facebook: fb.com/nguyenminhhuong.min</span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsReminderOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-red-600 text-white text-[12px] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4 text-amber-300" />
                <span>Lịch nhắc học</span>
              </button>
              <button
                type="button"
                onClick={() => setIsMobileCompanionOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-red-600 text-white text-[12px] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-amber-300" />
                <span>App di động</span>
              </button>
            </div>
          </div>

          {/* Copyright & Motto */}
          <div className="text-[12px] text-stone-400 flex items-center gap-3 shrink-0">
            <span>© 2026 MiXiangg HSK</span>
            <span className="font-calligraphy text-[16px] text-amber-300">
              学而时习之
            </span>
          </div>
        </div>
      </footer>

      {/* Mobile Drawer: Left Sidebar */}
      {isLeftDrawerOpen && (
        <div
          onClick={() => setIsLeftDrawerOpen(false)}
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[290px] max-w-[85vw] h-full bg-[#FDFBF6] border-r border-[#E8DFCE] p-5 overflow-y-auto shadow-2xl"
          >
            <LeftSidebar
              onOpenGoogleAuth={() => setIsGoogleAuthModalOpen(true)}
              onOpenAiTutor={() => setIsAiTutorOpen(true)}
              onCloseMobileDrawer={() => setIsLeftDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Mobile Drawer: Right Sidebar */}
      {isRightDrawerOpen && (
        <div
          onClick={() => setIsRightDrawerOpen(false)}
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[320px] max-w-[88vw] h-full bg-[#FDFBF6] border-l border-[#E8DFCE] p-5 overflow-y-auto shadow-2xl"
          >
            <RightSidebar
              onOpenGoogleAuth={() => setIsGoogleAuthModalOpen(true)}
              onOpenReminder={() => setIsReminderOpen(true)}
              onCloseMobileDrawer={() => setIsRightDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Floating AI Tutor Launcher Button */}
      <button
        type="button"
        onClick={() => {
          if (!isAuthenticated) {
            setIsGoogleAuthModalOpen(true);
          } else {
            setIsAiTutorOpen(true);
          }
        }}
        className="fixed bottom-5 right-5 z-40 p-3.5 sm:px-5 sm:py-3 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl transition-transform hover:scale-105 flex items-center gap-2 cursor-pointer border border-amber-300/50"
        title="Trò chuyện với Lão Sư AI"
      >
        <span className="font-serif text-[16px] font-bold">师</span>
        <span className="hidden sm:inline font-bold text-[13px]">Hỏi Lão Sư AI</span>
        <Sparkles className="w-4 h-4 text-amber-300" />
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

import React, { useState } from 'react';
import { HSKProvider, useHSK } from './context/HSKContext';
import { Header } from './components/Header';
import { IndexHomeView } from './components/IndexHomeView';
import { GoogleAuthModal } from './components/GoogleAuthModal';
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
import { Sparkles, MessageCircle, Heart, Shield, BookOpen, Smartphone } from 'lucide-react';
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
    isMobileCompanionOpen,
    setIsMobileCompanionOpen,
    isGoogleAuthModalOpen,
    setIsGoogleAuthModalOpen,
  } = useHSK();

  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);

  // Open Lesson Detail
  const handleOpenLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setActiveTab('lesson-detail');
  };

  // Start Exam
  const handleStartExam = (exam: Exam) => {
    setCurrentExam(exam);
    setActiveTab('exam-taking');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Main Header */}
      <Header
        onOpenReminder={() => setIsReminderOpen(true)}
        onOpenAiTutor={() => setIsAiTutorOpen(true)}
        onOpenGoogleAuth={() => setIsGoogleAuthModalOpen(true)}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* VIEW 0: Index Homepage with Google Registration */}
        {activeTab === 'home' && (
          <IndexHomeView
            onOpenGoogleAuth={() => setIsGoogleAuthModalOpen(true)}
          />
        )}

        {/* VIEW 1: Courses Directory */}
        {activeTab === 'courses' && (
          <CoursesView
            onOpenLesson={handleOpenLesson}
            onOpenAiTutor={() => setIsAiTutorOpen(true)}
          />
        )}

        {/* VIEW 2: Lesson Detail */}
        {activeTab === 'lesson-detail' && currentLesson && (
          <LessonDetailView
            lesson={currentLesson}
            onBack={() => setActiveTab('courses')}
          />
        )}

        {/* VIEW 3: Vocabulary & Flashcards & AI Pronunciation */}
        {activeTab === 'vocab' && <VocabularyFlashcardsView />}

        {/* VIEW 4: Exams Directory */}
        {activeTab === 'exams' && (
          <ExamsView
            onStartExam={handleStartExam}
            onViewResult={() => setActiveTab('exam-result')}
          />
        )}

        {/* VIEW 5: Taking Exam */}
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

        {/* VIEW 6: Exam Result */}
        {activeTab === 'exam-result' && lastExamResult && (
          <ExamResultView
            result={lastExamResult}
            onRetake={() => {
              const matched = currentExam || undefined;
              if (matched) {
                setActiveTab('exam-taking');
              } else {
                setActiveTab('exams');
              }
            }}
            onGoToReports={() => setActiveTab('reports')}
            onGoToExamsList={() => setActiveTab('exams')}
          />
        )}

        {/* VIEW 7: Reports & Analytics */}
        {activeTab === 'reports' && <ReportsView />}

        {/* VIEW 8: Forum Q&A */}
        {activeTab === 'forum' && <ForumView />}

        {/* VIEW 9: Admin Dashboard */}
        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Floating AI Tutor Launcher Button */}
      <button
        onClick={() => setIsAiTutorOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2 cursor-pointer group"
        title="Trò chuyện với Lão Sư AI"
      >
        <span className="font-serif text-lg font-bold">师</span>
        <span className="hidden sm:inline font-bold text-xs tracking-wide">
          Hỏi Lão Sư AI
        </span>
        <Sparkles className="w-4 h-4 text-amber-200 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Floating Drawers & Modals */}
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

      <MobileAppCompanion />

      {/* Global Footer */}
      <footer className="bg-white border-t border-slate-200/80 mt-16 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center font-serif font-bold text-xs">
              汉
            </div>
            <span className="font-bold text-slate-800">MiXiang HSK</span>
            <span>• Nền tảng học và luyện thi Tiếng Trung</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsMobileCompanionOpen(true)}
              className="hover:text-rose-600 flex items-center gap-1 font-medium"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Ứng dụng di động</span>
            </button>
            <button
              onClick={() => setIsReminderOpen(true)}
              className="hover:text-rose-600 font-medium"
            >
              Nhắc nhở học tập
            </button>
            <span>© 2026 MiXiang HSK. All rights reserved.</span>
          </div>
        </div>
      </footer>
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

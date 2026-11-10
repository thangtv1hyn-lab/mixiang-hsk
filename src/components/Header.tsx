import React, { useState } from 'react';
import {
  BookOpen,
  Layers,
  GraduationCap,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  Flame,
  Award,
  Bell,
  Home,
  LogOut,
} from 'lucide-react';
import { useHSK } from '../context/HSKContext';

interface HeaderProps {
  onOpenReminder: () => void;
  onOpenAiTutor?: () => void;
  onOpenGoogleAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenReminder, onOpenGoogleAuth }) => {
  const {
    activeTab,
    setActiveTab,
    userRole,
    isMobileCompanionOpen,
    setIsMobileCompanionOpen,
    studentProfile,
    isAuthenticated,
    currentUser,
    logout,
    setIsUserProfileOpen,
  } = useHSK();

  const navItems = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'courses', label: 'Khóa học', icon: BookOpen },
    { id: 'exams', label: 'Đề thi HSK', icon: GraduationCap },
    { id: 'vocab', label: 'Từ vựng & AI', icon: Layers },
    { id: 'reports', label: 'Báo cáo', icon: BarChart3 },
    { id: 'forum', label: 'Diễn đàn', icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-xs">
      <div className="max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4 lg:gap-6">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-2.5 cursor-pointer shrink-0 select-none group"
            onClick={() => setActiveTab('home')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-md shadow-rose-200 group-hover:scale-105 transition-transform">
              <span className="font-serif text-2xl font-bold tracking-tight">汉</span>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-rose-600 transition-colors whitespace-nowrap">
              MiXiangg HSK
            </span>
          </div>

          {/* Center Navigation - Balanced & Fits screen perfectly */}
          <nav className="hidden xl:flex items-center space-x-1 lg:space-x-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id !== 'home' && !isAuthenticated) {
                      onOpenGoogleAuth();
                      return;
                    }
                    setActiveTab(item.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-rose-50 text-rose-700 font-bold shadow-2xs border border-rose-200'
                      : 'text-slate-600 hover:text-rose-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-rose-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Admin / Teacher Nav Button */}
            {userRole === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Quản trị</span>
              </button>
            )}
            {userRole === 'teacher' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span>Giảng dạy</span>
              </button>
            )}
          </nav>

          {/* Right Action Tools - Balanced & Legible */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

            {/* Mobile Companion Trigger */}
            <button
              onClick={() => setIsMobileCompanionOpen(!isMobileCompanionOpen)}
              title="Mở giả lập ứng dụng di động"
              className={`p-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                isMobileCompanionOpen
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>

            {/* Streak & XP Badge (shown on larger screens to keep navbar compact) */}
            <div className="hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50/90 border border-orange-200 text-orange-900 text-xs font-bold whitespace-nowrap">
              <span className="flex items-center gap-1" title="Chuỗi ngày học">
                <Flame className="w-4 h-4 text-orange-600 fill-orange-500 shrink-0" />
                <span>{studentProfile.streakDays} ngày</span>
              </span>
              <span className="text-orange-300">|</span>
              <span className="flex items-center gap-1" title="Điểm tích lũy XP">
                <Award className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{studentProfile.xp} XP</span>
              </span>
            </div>

            {/* Reminder Bell */}
            <button
              onClick={onOpenReminder}
              title="Nhắc nhở học tập hàng ngày"
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {studentProfile.reminderEnabled && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
              )}
            </button>

            {/* Authentication Buttons */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenGoogleAuth}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>Đăng ký / Đăng nhập</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsUserProfileOpen(true)}
                  title="Bấm để xem và chỉnh sửa thông tin tài khoản"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    userRole === 'admin'
                      ? 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100 shadow-2xs'
                      : userRole === 'teacher'
                      ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 shadow-2xs'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 shadow-2xs'
                  }`}
                >
                  <img
                    src={currentUser?.avatar || studentProfile.avatar}
                    alt={currentUser?.name || studentProfile.name}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <span className="max-w-[120px] truncate font-bold">
                    {currentUser?.name || studentProfile.name || 'Người dùng'}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                      userRole === 'admin'
                        ? 'bg-purple-600 text-white'
                        : userRole === 'teacher'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {userRole === 'admin' ? 'Admin' : userRole === 'teacher' ? 'Giáo viên' : 'Học viên'}
                  </span>
                </button>

                <button
                  onClick={logout}
                  title="Đăng xuất"
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Medium/Mobile Navigation Bar - clean horizontal scroll without line breaks */}
        <div className="xl:hidden flex items-center justify-start sm:justify-center py-2 border-t border-slate-100 overflow-x-auto gap-1.5 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id !== 'home' && !isAuthenticated) {
                    onOpenGoogleAuth();
                    return;
                  }
                  setActiveTab(item.id);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Quản trị</span>
            </button>
          )}
          {userRole === 'teacher' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
                activeTab === 'admin'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Giảng dạy</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

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
    <header className="sticky top-0 z-40 w-full bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#E6DEC8] shadow-2xs">
      <div className="max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4 lg:gap-6">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0 select-none group"
            onClick={() => setActiveTab('home')}
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white border-2 border-red-700/80 p-1 shadow-md shadow-red-900/15 overflow-hidden flex items-center justify-center group-hover:scale-105 group-hover:border-red-600 transition-all relative">
              <div className="absolute inset-0 bg-red-500/5 pointer-events-none"></div>
              <img
                src="/assets/aistudio/logo_2cd38f9f.jpg"
                alt="MiXiangg HSK Triện Ấn"
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#18181B] group-hover:text-red-700 transition-colors whitespace-nowrap">
                  MIXIANGG
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-red-700 to-rose-700 text-white font-extrabold text-[10px] tracking-wider uppercase shadow-2xs">
                  HSK
                </span>
              </div>
              <span className="text-[10px] font-semibold text-red-800/80 tracking-wide uppercase group-hover:text-red-700 transition-colors hidden sm:block">
                Chinese Learning · 汉语学习
              </span>
            </div>
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
                      ? 'bg-[#F5EFEB] text-red-700 font-bold shadow-2xs border border-red-200/90'
                      : 'text-[#18181B]/80 hover:text-red-700 hover:bg-[#FAF7F0]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-red-600' : 'text-[#18181B]/50'}`} />
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
                    ? 'bg-[#18181B] text-white shadow-sm'
                    : 'bg-[#FAF7F0] text-[#18181B] hover:bg-[#F5EFEB] border border-[#E6DEC8]'
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
                    ? 'bg-red-800 text-white shadow-sm'
                    : 'bg-[#FAF7F0] text-red-800 hover:bg-[#F5EFEB] border border-red-200'
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
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-[#FAF7F0] text-[#18181B] border-[#E6DEC8] hover:bg-[#F5EFEB]'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>

            {/* Streak & XP Badge */}
            <div className="hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F5EFEB] border border-red-200/60 text-[#18181B] text-xs font-bold whitespace-nowrap">
              <span className="flex items-center gap-1" title="Chuỗi ngày học">
                <Flame className="w-4 h-4 text-red-600 fill-red-500 shrink-0" />
                <span>{studentProfile.streakDays} ngày</span>
              </span>
              <span className="text-red-200">|</span>
              <span className="flex items-center gap-1" title="Điểm tích lũy XP">
                <Award className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{studentProfile.xp} XP</span>
              </span>
            </div>

            {/* Reminder Bell */}
            <button
              onClick={onOpenReminder}
              title="Nhắc nhở học tập hàng ngày"
              className="relative p-2 rounded-xl text-[#18181B] hover:bg-[#F5EFEB] border border-[#E6DEC8] transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {studentProfile.reminderEnabled && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white"></span>
              )}
            </button>

            {/* Authentication Buttons */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenGoogleAuth}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>Đăng ký / Đăng nhập</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsUserProfileOpen(true)}
                  title="Bấm để xem và chỉnh sửa thông tin tài khoản"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border border-[#E6DEC8] bg-[#FAF7F0] text-[#18181B] hover:bg-[#F5EFEB] shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                >
                  <img
                    src={currentUser?.avatar || studentProfile.avatar}
                    alt={currentUser?.name || studentProfile.name}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-red-200"
                  />
                  <span className="max-w-[120px] truncate font-bold text-[#18181B]">
                    {currentUser?.name || studentProfile.name || 'Người dùng'}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                      userRole === 'admin'
                        ? 'bg-[#18181B] text-white'
                        : userRole === 'teacher'
                        ? 'bg-red-700 text-white'
                        : 'bg-[#E6DEC8] text-[#18181B]'
                    }`}
                  >
                    {userRole === 'admin' ? 'Admin' : userRole === 'teacher' ? 'Giáo viên' : 'Học viên'}
                  </span>
                </button>

                <button
                  onClick={logout}
                  title="Đăng xuất"
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-[#E6DEC8] transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Medium/Mobile Navigation Bar */}
        <div className="xl:hidden flex items-center justify-start sm:justify-center py-2 border-t border-[#E6DEC8]/60 overflow-x-auto gap-1.5 scrollbar-none">
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
                    ? 'bg-[#F5EFEB] text-red-700 border border-red-200'
                    : 'text-[#18181B] hover:bg-[#F5EFEB]'
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
                  ? 'bg-[#18181B] text-white'
                  : 'bg-[#FAF7F0] text-[#18181B] border border-[#E6DEC8]'
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
                  ? 'bg-red-700 text-white'
                  : 'bg-[#FAF7F0] text-red-800 border border-red-200'
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

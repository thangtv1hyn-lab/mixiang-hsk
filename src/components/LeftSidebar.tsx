import React from 'react';
import {
  Home,
  BookOpen,
  GraduationCap,
  Layers,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Gamepad2,
  X,
} from 'lucide-react';
import { useHSK } from '../context/HSKContext';

interface LeftSidebarProps {
  onOpenGoogleAuth: () => void;
  onOpenAiTutor: () => void;
  onCloseMobileDrawer?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  onOpenGoogleAuth,
  onOpenAiTutor,
  onCloseMobileDrawer,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const {
    activeTab,
    setActiveTab,
    userRole,
    isAuthenticated,
    isMobileCompanionOpen,
    setIsMobileCompanionOpen,
    siteUIConfig,
  } = useHSK();

  const primaryNav = [
    { id: 'home', label: 'Trang chủ', icon: Home, requiresAuth: false },
    { id: 'courses', label: 'Khóa học', icon: BookOpen, requiresAuth: true },
    { id: 'exams', label: 'Đề thi', icon: GraduationCap, requiresAuth: true },
    { id: 'vocab', label: 'Từ vựng', icon: Layers, requiresAuth: true },
    { id: 'games', label: 'Trò chơi', icon: Gamepad2, requiresAuth: true },
    { id: 'forum', label: 'Diễn đàn', icon: MessageSquare, requiresAuth: true },
  ];

  const handleNavClick = (tabId: string, requiresAuth: boolean) => {
    if (requiresAuth && !isAuthenticated) {
      onOpenGoogleAuth();
      onCloseMobileDrawer?.();
      return;
    }
    setActiveTab(tabId);
    onCloseMobileDrawer?.();
  };

  return (
    <div className="flex flex-col h-full justify-between gap-6">
      <div className="space-y-5">
        {/* Brand Logo (Bấm trực tiếp vào Logo để ẩn/hiện menu, không dùng nút phụ bên cạnh) */}
        <div
          className={`flex items-center gap-2 ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              if (onToggleCollapse) {
                onToggleCollapse();
              } else {
                handleNavClick('home', false);
              }
            }}
            aria-expanded={!isCollapsed}
            title={
              onToggleCollapse
                ? isCollapsed
                  ? 'Bấm vào logo để hiện menu'
                  : 'Bấm vào logo để ẩn menu'
                : 'Về trang chủ'
            }
            className="flex items-center gap-3 text-left group cursor-pointer focus-visible:outline-red-600 rounded-2xl p-1 min-w-0"
          >
            <div className="w-14 h-14 rounded-2xl bg-white border-2 border-red-600 p-1 shadow-xs overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <img
                src={siteUIConfig.headerLogoUrl || '/assets/aistudio/logo_2cd38f9f.jpg'}
                alt={siteUIConfig.brandName || 'MiXiangg HSK'}
                className="w-full h-full object-contain"
              />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="font-black text-[17px] leading-tight tracking-tight text-[#18181B] group-hover:text-red-600 transition-colors truncate">
                  {siteUIConfig.brandName || 'MIXIANGG'}
                </div>
                <div className="font-serif font-bold text-[12px] text-red-600 tracking-wide">
                  {siteUIConfig.brandHighlight || 'HSK'} · 汉语学习
                </div>
              </div>
            )}
          </button>

          {onCloseMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobileDrawer}
              aria-label="Đóng menu"
              className="lg:hidden p-2 rounded-xl border border-[#E8DFCE] bg-white text-[#18181B] hover:bg-[#FFF5F3] cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Main Navigation Menu */}
        {!isCollapsed && (
          <nav aria-label="Điều hướng chính" className="space-y-2">
            {primaryNav.map((item) => {
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
                  onClick={() => handleNavClick(item.id, item.requiresAuth)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[16px] font-bold transition-all cursor-pointer text-left min-h-[42px] ${
                    isActive
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-white text-[#18181B] border border-[#E8DFCE] hover:border-red-400 hover:bg-[#FFF5F3] hover:text-red-700'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 shrink-0 ${
                      isActive ? 'text-white' : 'text-red-600'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}

            {/* Admin / Teacher Entry */}
            {userRole !== 'student' && (
              <button
                type="button"
                onClick={() => handleNavClick('admin', true)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[16px] font-bold transition-all cursor-pointer text-left min-h-[42px] ${
                  activeTab === 'admin'
                    ? 'bg-[#18181B] text-white shadow-sm'
                    : 'bg-[#F7F1E5] text-[#18181B] border border-[#E8DFCE] hover:bg-[#18181B] hover:text-white'
                }`}
              >
                <ShieldCheck className="w-6 h-6 shrink-0" />
                <span className="truncate">
                  {userRole === 'admin' ? 'Quản trị' : 'Giảng dạy'}
                </span>
              </button>
            )}
          </nav>
        )}
      </div>

      {/* Quick Tools Footer inside Column 1 */}
      {!isCollapsed && (
        <div className="space-y-2.5 pt-4 border-t border-[#E8DFCE]">
          <button
            type="button"
            onClick={() => handleNavClick('reports', true)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-bold transition-colors cursor-pointer min-h-[38px] ${
              activeTab === 'reports'
                ? 'bg-[#18181B] text-white'
                : 'bg-white text-[#18181B] border border-[#E8DFCE] hover:bg-[#FFF5F3]'
            }`}
          >
            <BarChart3 className="w-5 h-5 shrink-0 text-red-600" />
            <span className="truncate">Báo cáo tiến độ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                onOpenGoogleAuth();
              } else {
                onOpenAiTutor();
              }
              onCloseMobileDrawer?.();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#18181B] hover:bg-red-700 text-white text-[14px] font-bold transition-colors cursor-pointer min-h-[38px]"
          >
            <Sparkles className="w-5 h-5 shrink-0 text-amber-300" />
            <span className="truncate">Hỏi Lão Sư AI</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMobileCompanionOpen(!isMobileCompanionOpen);
              onCloseMobileDrawer?.();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white hover:bg-[#FFF5F3] text-[#18181B] border border-[#E8DFCE] text-[14px] font-semibold transition-colors cursor-pointer min-h-[38px]"
          >
            <Smartphone className="w-5 h-5 shrink-0 text-red-600" />
            <span className="truncate">App học di động</span>
          </button>
        </div>
      )}
    </div>
  );
};

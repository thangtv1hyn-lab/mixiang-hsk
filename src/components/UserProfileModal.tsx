import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  ShieldCheck,
  Award,
  GraduationCap,
  Flame,
  BookOpen,
  Lock,
  Save,
  LogOut,
  Camera,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useHSK } from '../context/HSKContext';
import { HSKLevel } from '../types/hsk';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    studentProfile,
    userRole,
    logout,
    updateCurrentUserProfile,
  } = useHSK();

  const [activeTab, setActiveTab] = useState<'info' | 'edit' | 'password'>('info');

  // Edit form states
  const [name, setName] = useState(currentUser?.name || studentProfile.name || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || studentProfile.avatar || PRESET_AVATARS[0]);
  const [targetLevel, setTargetLevel] = useState<HSKLevel>(studentProfile.targetLevel || 'HSK 1');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatusMessage({ type: 'error', text: 'Họ và tên không được để trống.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const res = await updateCurrentUserProfile({
      name: name.trim(),
      avatar,
      level: targetLevel,
      targetLevel,
    });

    setIsSaving(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Cập nhật thông tin cá nhân thành công!' });
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      setStatusMessage({ type: 'error', text: res.message || 'Cập nhật thất bại. Vui lòng thử lại.' });
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const res = await updateCurrentUserProfile({
      password: newPassword,
      currentPassword: currentPassword.trim() || undefined,
    });

    setIsSaving(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      setStatusMessage({ type: 'error', text: res.message || 'Đổi mật khẩu thất bại.' });
    }
  };

  const handleLogout = () => {
    onClose();
    logout();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative border border-slate-100 max-h-[92vh] overflow-y-auto space-y-5">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Hồ Sơ & Thông Tin Tài Khoản
            </h3>
            <p className="text-xs text-slate-500">
              Quản lý thông tin định danh và bảo mật tài khoản cá nhân
            </p>
          </div>
        </div>

        {/* User Card Overview */}
        <div className="bg-gradient-to-br from-slate-900 via-rose-950 to-slate-950 text-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3.5">
            <img
              src={avatar || studentProfile.avatar}
              alt={name}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-rose-500/40 shadow-md shrink-0"
            />
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-base text-white truncate">
                  {name || studentProfile.name}
                </h4>
                {/* Strict Role Badges with NO toggle ability */}
                {userRole === 'admin' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3 h-3 text-amber-300" />
                    <span>Quản trị viên</span>
                  </span>
                ) : userRole === 'teacher' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 flex items-center gap-1 shrink-0">
                    <Award className="w-3 h-3 text-amber-300" />
                    <span>Giáo viên</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/30 text-rose-200 border border-rose-400/30 flex items-center gap-1 shrink-0">
                    <GraduationCap className="w-3 h-3 text-emerald-300" />
                    <span>Học viên</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 truncate font-mono">
                {currentUser?.email || studentProfile.email}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center">
            <div className="bg-white/5 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-medium">Mục tiêu</span>
              <span className="text-xs font-bold text-amber-300">{targetLevel}</span>
            </div>
            <div className="bg-white/5 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-medium">Chuỗi ngày</span>
              <span className="text-xs font-bold text-orange-400 flex items-center justify-center gap-1">
                <Flame className="w-3 h-3 fill-orange-400" />
                <span>{studentProfile.streakDays} ngày</span>
              </span>
            </div>
            <div className="bg-white/5 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-medium">Điểm tích lũy</span>
              <span className="text-xs font-bold text-emerald-300">{studentProfile.xp} XP</span>
            </div>
          </div>
        </div>

        {/* Status Toast Message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Sub Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'info' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Thông tin chi tiết
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'edit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chỉnh sửa hồ sơ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'password' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đổi mật khẩu
          </button>
        </div>

        {/* TAB 1: Detailed Info */}
        {activeTab === 'info' && (
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="font-bold text-slate-800 block text-xs">Quyền hạn tài khoản của bạn:</span>
              {userRole === 'admin' ? (
                <p className="text-slate-600 leading-relaxed">
                  👑 <strong>Quản trị viên (Admin)</strong>: Bạn có toàn quyền quản trị nội dung (khóa học, đề thi, từ vựng), phân quyền tài khoản người dùng và quản lý hệ thống.
                </p>
              ) : userRole === 'teacher' ? (
                <p className="text-slate-600 leading-relaxed">
                  👩‍🏫 <strong>Giáo viên (Teacher)</strong>: Bạn có quyền biên soạn và chỉnh sửa bài học, ngân hàng đề thi, tạo bộ thẻ Flashcard AI và theo dõi lộ trình tiến độ của học viên.
                </p>
              ) : (
                <p className="text-slate-600 leading-relaxed">
                  🎓 <strong>Học viên (Student)</strong>: Bạn có quyền học toàn bộ bài học HSK 1 - 5, luyện từ vựng qua thẻ Flashcard 3D, kiểm tra phát âm AI, thi thử trắc nghiệm và thảo luận trên diễn đàn.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 block text-[11px]">Bài học hoàn thành</span>
                <span className="font-extrabold text-sm text-slate-900">
                  {studentProfile.completedLessonIds.length} bài
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-500 block text-[11px]">Từ vựng đã thuộc</span>
                <span className="font-extrabold text-sm text-emerald-700">
                  {studentProfile.masteredVocabIds.length} từ
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                ✏️ Chỉnh sửa họ tên & ảnh đại diện
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Edit Profile */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ và tên hiển thị <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập họ và tên..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cấp độ HSK mục tiêu
              </label>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value as HSKLevel)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
              >
                <option value="HSK 1">HSK 1 - Nhập môn & Chào hỏi</option>
                <option value="HSK 2">HSK 2 - Giao tiếp hàng ngày</option>
                <option value="HSK 3">HSK 3 - Đời sống & Mua sắm</option>
                <option value="HSK 4">HSK 4 - Công việc & Thảo luận</option>
                <option value="HSK 5">HSK 5 - Chuyên sâu & Học thuật</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Chọn ảnh đại diện (Avatar)
              </label>
              <div className="flex items-center gap-2 mb-2">
                {PRESET_AVATARS.map((pAvatar, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(pAvatar)}
                    className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      avatar === pAvatar ? 'border-rose-600 scale-105 shadow-sm' : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img src={pAvatar} alt={`preset-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="Hoặc dán link ảnh đại diện tùy chỉnh (URL)..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Đang lưu...' : 'Lưu hồ sơ'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: Change Password */}
        {activeTab === 'password' && (
          <form onSubmit={handleSavePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mật khẩu hiện tại (nếu có)
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mật khẩu mới (tối thiểu 6 ký tự) <span className="text-rose-500">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showPasswordCheck"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <label htmlFor="showPasswordCheck" className="text-slate-600 cursor-pointer select-none">
                Hiển thị mật khẩu
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

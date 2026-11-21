import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  ShieldCheck,
  Award,
  GraduationCap,
  Flame,
  Lock,
  Save,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { useHSK } from '../context/HSKContext';
import { HSKLevel } from '../types/hsk';
import {
  CARTOON_AVATAR_PRESETS,
  DEFAULT_CARTOON_AVATAR,
  resolveCartoonAvatar,
  compressImageToDataUrl,
} from '../utils/cartoonAvatars';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, studentProfile, userRole, logout, updateCurrentUserProfile } = useHSK();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<'info' | 'edit' | 'password'>('info');

  // Edit form states
  const [name, setName] = useState(currentUser?.name || studentProfile.name || '');
  const [avatar, setAvatar] = useState(
    resolveCartoonAvatar(
      currentUser?.avatar || studentProfile.avatar,
      currentUser?.email || studentProfile.email
    )
  );
  const [targetLevel, setTargetLevel] = useState<HSKLevel>(
    studentProfile.targetLevel || 'HSK 1'
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const prevIsOpenRef = useRef(false);
  const prevEmailRef = useRef<string | undefined>(undefined);

  const savedAvatar = resolveCartoonAvatar(
    currentUser?.avatar || studentProfile.avatar,
    currentUser?.email || studentProfile.email
  );
  const hasUnsavedAvatar = avatar.trim() !== savedAvatar.trim();

  // Sync local form fields ONLY when modal transitions to open or signed-in user changes
  useEffect(() => {
    const emailNow = currentUser?.email || studentProfile.email;
    const justOpened = isOpen && !prevIsOpenRef.current;
    const userChanged = isOpen && emailNow !== prevEmailRef.current;

    prevIsOpenRef.current = isOpen;
    prevEmailRef.current = emailNow;

    if (!justOpened && !userChanged) return;

    setName(currentUser?.name || studentProfile.name || '');
    setAvatar(
      resolveCartoonAvatar(
        currentUser?.avatar || studentProfile.avatar,
        currentUser?.email || studentProfile.email
      )
    );
    setTargetLevel(studentProfile.targetLevel || currentUser?.targetLevel || 'HSK 1');
    setStatusMessage(null);
  }, [isOpen, currentUser?.email, currentUser?.name, currentUser?.avatar, currentUser?.targetLevel, studentProfile.email, studentProfile.name, studentProfile.avatar, studentProfile.targetLevel]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const persistAvatarOnly = async (nextAvatarUrl: string) => {
    setIsSaving(true);
    setStatusMessage(null);
    const res = await updateCurrentUserProfile({
      name: (name.trim() || currentUser?.name || studentProfile.name || 'Học viên').trim(),
      avatar: nextAvatarUrl.trim() || DEFAULT_CARTOON_AVATAR,
      level: targetLevel,
      targetLevel,
    });
    setIsSaving(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Đã lưu ảnh đại diện mới thành công!' });
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message || 'Không thể lưu ảnh đại diện. Vui lòng thử lại.',
      });
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatusMessage({
        type: 'error',
        text: 'Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP...).',
      });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setStatusMessage({
        type: 'error',
        text: 'Ảnh quá lớn (tối đa 8MB). Vui lòng chọn ảnh nhẹ hơn.',
      });
      return;
    }

    setIsUploadingAvatar(true);
    setStatusMessage(null);
    try {
      const compressed = await compressImageToDataUrl(file, 200, false);
      setAvatar(compressed);
      setActiveTab('edit');
      await persistAvatarOnly(compressed);
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Không thể xử lý hình ảnh. Vui lòng thử ảnh khác.',
      });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
      avatar: avatar.trim() || DEFAULT_CARTOON_AVATAR,
      level: targetLevel,
      targetLevel,
    });

    setIsSaving(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Đã lưu hồ sơ & ảnh đại diện thành công!' });
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message || 'Cập nhật thất bại. Vui lòng thử lại.',
      });
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

  const isCustomDataUri = avatar.startsWith('data:image/');

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Hồ sơ và thông tin tài khoản"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative border border-[#E8DFCE] max-h-[92vh] overflow-y-auto space-y-5"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ hồ sơ"
          className="absolute top-5 right-5 w-9 h-9 rounded-full text-[#686B72] hover:text-[#1C1E21] hover:bg-[#FAF7F0] flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-[#FFF5F3] text-[#C85A43] border border-[#F5DDD6] flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans text-[18px] font-extrabold text-[#1C1E21] tracking-tight">
              Hồ Sơ &amp; Thông Tin Tài Khoản
            </h3>
            <p className="text-[13px] text-[#686B72]">
              Chọn ảnh hoạt hình, tải avatar cá nhân và quản lý bảo mật
            </p>
          </div>
        </div>

        {/* User Card Overview */}
        <div className="bg-gradient-to-br from-[#1C1E21] via-[#2A2322] to-[#1C1E21] text-white rounded-2xl p-5 shadow-sm space-y-4 border border-white/10">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              title="Bấm để đổi ảnh đại diện"
              aria-label="Đổi ảnh đại diện"
              className="relative group w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-[#C85A43]/80 shadow-md shrink-0 bg-[#FFF5F3] cursor-pointer"
            >
              <img
                src={avatar || DEFAULT_CARTOON_AVATAR}
                alt={name}
                className="w-full h-full object-cover"
              />
              <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </span>
            </button>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-sans font-extrabold text-[16px] text-white truncate">
                  {name || studentProfile.name}
                </h4>
                {userRole === 'admin' ? (
                  <span className="px-2.5 py-0.5 rounded-lg text-[11.5px] font-bold bg-[#C85A43] text-white flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-200" />
                    <span>Quản trị viên</span>
                  </span>
                ) : userRole === 'teacher' ? (
                  <span className="px-2.5 py-0.5 rounded-lg text-[11.5px] font-bold bg-amber-600 text-white flex items-center gap-1 shrink-0">
                    <Award className="w-3.5 h-3.5 text-amber-100" />
                    <span>Giáo viên</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-lg text-[11.5px] font-bold bg-white/15 text-amber-200 border border-white/20 flex items-center gap-1 shrink-0">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Học viên</span>
                  </span>
                )}
              </div>
              <p className="text-[12.5px] text-stone-300 truncate font-mono">
                {currentUser?.email || studentProfile.email}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className="text-[12px] font-bold text-amber-300 hover:text-amber-200 inline-flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Đổi ảnh đại diện</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center">
            <div className="bg-white/5 p-2.5 rounded-xl">
              <span className="text-[11px] text-stone-300 block font-medium">Mục tiêu</span>
              <span className="text-[13.5px] font-extrabold text-amber-300">{targetLevel}</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl">
              <span className="text-[11px] text-stone-300 block font-medium">Chuỗi ngày</span>
              <span className="text-[13.5px] font-extrabold text-orange-300 flex items-center justify-center gap-1 tabular-nums">
                <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                <span>{studentProfile.streakDays} ngày</span>
              </span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl">
              <span className="text-[11px] text-stone-300 block font-medium">Điểm tích lũy</span>
              <span className="text-[13.5px] font-extrabold text-emerald-300 font-mono tabular-nums">
                {studentProfile.xp} XP
              </span>
            </div>
          </div>
        </div>

        {/* Status Toast Message */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl text-[13px] font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Sub Tabs */}
        <div className="flex rounded-2xl bg-[#F5EFEB] border border-[#E8DFCE] p-1 text-[13px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'info'
                ? 'bg-white text-[#C85A43] shadow-2xs'
                : 'text-[#3B3E45] hover:text-[#1C1E21]'
            }`}
          >
            Thông tin
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`flex-1 py-2 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'edit'
                ? 'bg-white text-[#C85A43] shadow-2xs'
                : 'text-[#3B3E45] hover:text-[#1C1E21]'
            }`}
          >
            Đổi Avatar &amp; Hồ sơ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-2 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'password'
                ? 'bg-white text-[#C85A43] shadow-2xs'
                : 'text-[#3B3E45] hover:text-[#1C1E21]'
            }`}
          >
            Đổi mật khẩu
          </button>
        </div>

        {/* TAB 1: Detailed Info */}
        {activeTab === 'info' && (
          <div className="space-y-4 text-[13.5px]">
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E8DFCE] space-y-1.5">
              <span className="font-bold text-[#1C1E21] block">Quyền hạn tài khoản của bạn</span>
              {userRole === 'admin' ? (
                <p className="text-[#3B3E45] leading-relaxed">
                  <strong>Quản trị viên (Admin)</strong>: Bạn có toàn quyền quản trị nội dung (khóa học, đề thi, từ vựng), phân quyền tài khoản người dùng và quản lý giao diện hệ thống.
                </p>
              ) : userRole === 'teacher' ? (
                <p className="text-[#3B3E45] leading-relaxed">
                  <strong>Giáo viên (Teacher)</strong>: Bạn có quyền biên soạn và chỉnh sửa bài học, ngân hàng đề thi, tạo bộ thẻ Flashcard AI và theo dõi lộ trình tiến độ của học viên.
                </p>
              ) : (
                <p className="text-[#3B3E45] leading-relaxed">
                  <strong>Học viên (Student)</strong>: Bạn có quyền học toàn bộ bài học HSK 1 – 5, luyện từ vựng qua thẻ Flashcard 3D, kiểm tra phát âm AI, thi thử trắc nghiệm và thảo luận trên diễn đàn.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E8DFCE]">
                <span className="text-[#686B72] block text-[12px] font-medium">
                  Bài học hoàn thành
                </span>
                <span className="font-mono font-extrabold text-[17px] text-[#1C1E21] tabular-nums">
                  {studentProfile.completedLessonIds.length} bài
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E8DFCE]">
                <span className="text-[#686B72] block text-[12px] font-medium">
                  Từ vựng đã thuộc
                </span>
                <span className="font-mono font-extrabold text-[17px] text-emerald-700 tabular-nums">
                  {studentProfile.masteredVocabIds.length} từ
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EFE7D6]">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className="text-[13.5px] font-bold text-[#C85A43] hover:underline cursor-pointer"
              >
                Chỉnh sửa họ tên &amp; đổi ảnh đại diện
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 min-h-[40px] rounded-xl text-[13.5px] font-bold text-red-700 hover:bg-red-50 border border-red-200 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Edit Profile & Avatar */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSaveProfile} className="space-y-4 text-[13.5px]">
            {/* Avatar Section */}
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E8DFCE] space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-[#1C1E21]">
                  Ảnh đại diện hoạt hình &amp; Cá nhân
                </span>
                <button
                  type="button"
                  onClick={() => setAvatar(DEFAULT_CARTOON_AVATAR)}
                  className="text-[12px] font-bold text-[#C85A43] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Mặc định</span>
                </button>
              </div>

              {/* Current Preview + Upload from Device */}
              <div className="flex items-center gap-3.5 bg-white p-3 rounded-2xl border border-[#E8DFCE]">
                <img
                  src={avatar || DEFAULT_CARTOON_AVATAR}
                  alt="Xem trước ảnh đại diện"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#C85A43] bg-[#FFF5F3] shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <label className="w-full py-2.5 px-3.5 min-h-[44px] rounded-xl bg-[#FFF5F3] hover:bg-[#C85A43] text-[#C85A43] hover:text-white border border-[#F3C5B6] font-bold text-[13px] flex items-center justify-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 shrink-0" />
                    <span>
                      {isUploadingAvatar ? 'Đang xử lý ảnh...' : 'Tải ảnh từ máy tính / điện thoại'}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      disabled={isUploadingAvatar}
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11.5px] text-[#686B72]">
                    Hỗ trợ JPG, PNG, WebP (tự động nén gọn sắc nét).
                  </p>
                </div>
              </div>

              {/* Cartoon Avatar Gallery */}
              <div>
                <span className="block text-[12px] font-bold text-[#686B72] mb-2">
                  Hoặc chọn nhanh nhân vật hoạt hình dễ thương:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {CARTOON_AVATAR_PRESETS.map((preset) => {
                    const isSelected = avatar === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        aria-label={`Chọn ảnh hoạt hình ${preset.label}`}
                        onClick={() => setAvatar(preset.url)}
                        className={`p-1.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-1 bg-white ${
                          isSelected
                            ? 'border-[#C85A43] bg-[#FFF5F3] shadow-xs scale-[1.02]'
                            : 'border-[#E8DFCE] hover:border-[#C85A43]/60'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-12 h-12 rounded-xl object-cover bg-[#FAF7F0]"
                        />
                        <span
                          className={`text-[11px] font-bold truncate max-w-full ${
                            isSelected ? 'text-[#C85A43]' : 'text-[#3B3E45]'
                          }`}
                        >
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Custom URL */}
              <div>
                <label
                  htmlFor="profile-avatar-url"
                  className="block text-[12px] font-bold text-[#686B72] mb-1"
                >
                  Hoặc dán đường dẫn ảnh (URL):
                </label>
                <input
                  id="profile-avatar-url"
                  type="text"
                  value={isCustomDataUri ? '' : avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder={
                    isCustomDataUri
                      ? 'Đang sử dụng ảnh tải lên từ thiết bị của bạn'
                      : 'https://...'
                  }
                  className="w-full px-3.5 py-2 min-h-[40px] rounded-xl border border-[#E8DFCE] bg-white focus:outline-none focus:ring-2 focus:ring-[#C85A43]/20 focus:border-[#C85A43] text-[12.5px]"
                />
              </div>

              {/* Instant Save Avatar Bar when user picks a new avatar */}
              {hasUnsavedAvatar && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E8DFCE]">
                  <span className="text-[12px] font-bold text-[#9A3412]">
                    Bạn vừa chọn ảnh đại diện mới
                  </span>
                  <button
                    type="button"
                    disabled={isSaving || isUploadingAvatar}
                    onClick={() => persistAvatarOnly(avatar)}
                    className="px-4 py-2 min-h-[40px] rounded-xl bg-[#C85A43] hover:bg-[#B24A34] text-white font-bold text-[12.5px] flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Đang lưu...' : 'Lưu ảnh đại diện'}</span>
                  </button>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="profile-name-input"
                className="block font-bold text-[#1C1E21] mb-1.5"
              >
                Họ và tên hiển thị <span className="text-red-600">*</span>
              </label>
              <input
                id="profile-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập họ và tên..."
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-[#E8DFCE] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C85A43]/20 focus:border-[#C85A43]"
              />
            </div>

            <div>
              <label
                htmlFor="profile-level-select"
                className="block font-bold text-[#1C1E21] mb-1.5"
              >
                Cấp độ HSK mục tiêu
              </label>
              <select
                id="profile-level-select"
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value as HSKLevel)}
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-[#E8DFCE] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C85A43]/20 focus:border-[#C85A43] cursor-pointer"
              >
                <option value="HSK 1">HSK 1 - Nhập môn &amp; Chào hỏi</option>
                <option value="HSK 2">HSK 2 - Giao tiếp hàng ngày</option>
                <option value="HSK 3">HSK 3 - Đời sống &amp; Mua sắm</option>
                <option value="HSK 4">HSK 4 - Công việc &amp; Thảo luận</option>
                <option value="HSK 5">HSK 5 - Chuyên sâu &amp; Học thuật</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EFE7D6]">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className="px-4 py-2.5 min-h-[44px] rounded-xl text-[#3B3E45] hover:bg-[#FAF7F0] border border-[#E8DFCE] font-bold cursor-pointer transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploadingAvatar}
                className="px-5 py-2.5 min-h-[44px] rounded-xl bg-[#C85A43] hover:bg-[#B24A34] text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Đang lưu...' : 'Lưu hồ sơ'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: Change Password */}
        {activeTab === 'password' && (
          <form onSubmit={handleSavePassword} className="space-y-4 text-[13.5px]">
            <div>
              <label
                htmlFor="current-password-input"
                className="block font-bold text-[#1C1E21] mb-1.5"
              >
                Mật khẩu hiện tại (nếu có)
              </label>
              <input
                id="current-password-input"
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại..."
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-[#E8DFCE] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C85A43]/20 focus:border-[#C85A43]"
              />
            </div>

            <div>
              <label
                htmlFor="new-password-input"
                className="block font-bold text-[#1C1E21] mb-1.5"
              >
                Mật khẩu mới (tối thiểu 6 ký tự) <span className="text-red-600">*</span>
              </label>
              <input
                id="new-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-[#E8DFCE] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C85A43]/20 focus:border-[#C85A43]"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password-input"
                className="block font-bold text-[#1C1E21] mb-1.5"
              >
                Xác nhận mật khẩu mới <span className="text-red-600">*</span>
              </label>
              <input
                id="confirm-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-[#E8DFCE] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C85A43]/20 focus:border-[#C85A43]"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="showPasswordCheck"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="w-4 h-4 accent-[#C85A43] cursor-pointer"
              />
              <label
                htmlFor="showPasswordCheck"
                className="text-[#3B3E45] font-medium cursor-pointer select-none"
              >
                Hiển thị mật khẩu
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EFE7D6]">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className="px-4 py-2.5 min-h-[44px] rounded-xl text-[#3B3E45] hover:bg-[#FAF7F0] border border-[#E8DFCE] font-bold cursor-pointer transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 min-h-[44px] rounded-xl bg-[#1C1E21] hover:bg-black text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>{isSaving ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  LogIn,
  Mail,
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useHSK } from '../context/HSKContext';
import { HSKLevel } from '../types/hsk';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    loginWithGoogle,
    registerAccount,
    loginWithEmail,
    resetPasswordWithEmail,
    setActiveTab,
  } = useHSK();

  const [activeTab, setActiveTabMode] = useState<'register' | 'login' | 'google'>('login');

  // Form states - Registration
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regLevel, setRegLevel] = useState<HSKLevel>('HSK 1');

  // Form states - Login & Reset Password
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetNewPassword, setResetNewPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const triggerSuccessCelebration = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
    setTimeout(() => {
      if (onSuccess) {
        onSuccess();
      } else {
        setActiveTab('courses');
      }
      onClose();
    }, 700);
  };

  // Handle Self Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMessage('Vui lòng điền đầy đủ họ tên, email và mật khẩu.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);
    const result = await registerAccount({
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      level: regLevel,
    });
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage(result.message || 'Đăng ký thành công!');
      triggerSuccessCelebration();
    } else {
      setErrorMessage(result.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  };

  // Handle Email / Password Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('Vui lòng nhập email và mật khẩu.');
      return;
    }

    setIsSubmitting(true);
    const result = await loginWithEmail({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage(result.message || 'Đăng nhập thành công!');
      triggerSuccessCelebration();
    } else {
      setErrorMessage(result.message || 'Đăng nhập thất bại.');
    }
  };

  // Handle Official Firebase Password Reset Email
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginEmail.trim()) {
      setErrorMessage('Vui lòng nhập email tài khoản cần đặt lại mật khẩu.');
      return;
    }

    setIsSubmitting(true);
    const result = await resetPasswordWithEmail({
      email: loginEmail.trim(),
      newPassword: resetNewPassword.trim(),
    });
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage(
        result.message ||
          'Đã gửi liên kết đặt lại mật khẩu tới email của bạn. Vui lòng kiểm tra hộp thư (kể cả mục Spam).'
      );
    } else {
      setErrorMessage(result.message || 'Không thể gửi email đặt lại mật khẩu.');
    }
  };

  // Handle Real Google OAuth Sign-In (opens Google account chooser popup)
  const handleGoogleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    const result = await loginWithGoogle();
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage(result.message || 'Đăng nhập Google thành công!');
      triggerSuccessCelebration();
    } else {
      setErrorMessage(result.message || 'Đăng nhập Google thất bại.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-[#FAF7F0] rounded-3xl max-w-2xl w-[95vw] p-6 sm:p-8 shadow-2xl relative border-2 border-[#E6DEC8] max-h-[94vh] overflow-y-auto space-y-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ đăng nhập"
          className="absolute top-5 right-5 w-10 h-10 rounded-2xl bg-white border border-[#E6DEC8] text-[#18181B] hover:bg-red-50 hover:text-red-700 hover:border-red-300 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white border-2 border-red-600 p-1.5 flex items-center justify-center shadow-sm">
            <img
              src="/assets/aistudio/logo_2cd38f9f.jpg"
              alt="MiXiangg HSK"
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </div>
          <h3 className="font-serif text-[21px] sm:text-[25px] font-black text-[#18181B] tracking-tight leading-tight">
            Tài Khoản <span className="text-red-700">MiXiangg HSK</span>
          </h3>
          <p className="text-[14px] sm:text-[16px] text-slate-700 max-w-xl mx-auto leading-snug">
            Học tiếng Trung HSK 1 đến HSK 5 & Giáo trình Boya, tự động lưu tiến độ và thi thử AI
          </p>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-2xl bg-[#F0E9DA] p-2 border border-[#E6DEC8]">
          <button
            type="button"
            onClick={() => {
              setActiveTabMode('login');
              setIsResetMode(false);
              setErrorMessage('');
            }}
            className={`py-2.5 px-4 rounded-xl text-[14px] sm:text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-red-700 text-white shadow-sm font-black'
                : 'text-[#18181B] font-bold hover:bg-white'
            }`}
          >
            <LogIn className="w-4 h-4 shrink-0" />
            <span>Đăng nhập</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTabMode('register');
              setErrorMessage('');
            }}
            className={`py-2.5 px-4 rounded-xl text-[14px] sm:text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-red-700 text-white shadow-sm font-black'
                : 'text-[#18181B] font-bold hover:bg-white'
            }`}
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>Tạo tài khoản</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTabMode('google');
              setErrorMessage('');
            }}
            className={`py-2.5 px-4 rounded-xl text-[14px] sm:text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'google'
                ? 'bg-[#18181B] text-white shadow-sm font-black'
                : 'text-[#18181B] font-bold hover:bg-white'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-[13px] sm:text-[14px] font-bold flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] sm:text-[14px] font-bold flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: SELF-REGISTRATION FORM */}
        {activeTab === 'register' && (
          <form
            onSubmit={handleRegisterSubmit}
            className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E6DEC8] space-y-4 shadow-2xs"
          >
            <div>
              <label className="block text-[14px] sm:text-[15px] font-black text-[#18181B] mb-1.5">
                Họ và tên học viên <span className="text-red-700">*</span>
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-[15px] font-semibold text-[#18181B] rounded-2xl border-2 border-[#E6DEC8] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-red-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-[14px] sm:text-[15px] font-black text-[#18181B] mb-1.5">
                Địa chỉ Email <span className="text-red-700">*</span>
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-[15px] font-semibold text-[#18181B] rounded-2xl border-2 border-[#E6DEC8] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-red-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[14px] sm:text-[15px] font-black text-[#18181B] mb-1.5">
                  Mật khẩu <span className="text-red-700">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Ít nhất 6 ký tự"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 text-[15px] font-semibold text-[#18181B] rounded-2xl border-2 border-[#E6DEC8] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-red-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[14px] sm:text-[15px] font-black text-[#18181B] mb-1.5">
                  Xác nhận mật khẩu <span className="text-red-700">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Nhập lại mật khẩu"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 text-[15px] font-semibold text-[#18181B] rounded-2xl border-2 border-[#E6DEC8] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-red-700"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[14px] sm:text-[15px] font-black text-[#18181B] mb-1.5">
                Mục tiêu cấp độ HSK đầu tiên
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5'] as HSKLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setRegLevel(lvl)}
                    className={`py-2 rounded-xl text-[13px] sm:text-[15px] font-black transition-all border-2 cursor-pointer ${
                      regLevel === lvl
                        ? 'bg-red-700 text-white border-red-700 shadow-xs'
                        : 'bg-[#FAF7F0] text-[#18181B] border-[#E6DEC8] hover:border-red-700'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-red-700 hover:bg-red-800 text-white font-black text-[15px] sm:text-[16px] flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <span>Đang tạo tài khoản...</span>
              ) : (
                <>
                  <span>Hoàn tất Đăng ký (Miễn phí 100%)</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: EMAIL / PASSWORD LOGIN & PASSWORD RESET */}
        {activeTab === 'login' && (
          <div className="space-y-4">
            {!isResetMode ? (
              <form
                onSubmit={handleLoginSubmit}
                className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E6DEC8] space-y-4 shadow-2xs"
              >
                <div>
                  <label className="block text-[14px] sm:text-[15px] font-black text-[#18181B] mb-1.5">
                    Email tài khoản
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Username"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 text-[15px] font-semibold text-[#18181B] rounded-2xl border-2 border-[#E6DEC8] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-red-700"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[14px] sm:text-[15px] font-black text-[#18181B]">
                      Mật khẩu
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(true);
                        setErrorMessage('');
                      }}
                      className="text-[13px] font-bold text-red-700 hover:underline cursor-pointer"
                    >
                      Quên / Đặt lại mật khẩu mới?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Pass"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 text-[15px] font-semibold text-[#18181B] rounded-2xl border-2 border-[#E6DEC8] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-red-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-700 cursor-pointer"
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-red-700 hover:bg-red-800 text-white font-black text-[15px] sm:text-[16px] flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isSubmitting ? (
                    <span>Đang đăng nhập...</span>
                  ) : (
                    <>
                      <span>Đăng nhập hệ thống</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E6DEC8]" />
                  </div>
                  <div className="relative flex justify-center text-[12px] font-bold uppercase tracking-wider">
                    <span className="bg-white px-3 text-slate-500">Hoặc tiếp tục nhanh bằng</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSubmit}
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] py-3 px-5 rounded-2xl bg-white hover:bg-[#FAF7F0] text-[#18181B] font-bold text-[15px] border-2 border-[#E6DEC8] hover:border-slate-400 flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>
                    {isSubmitting ? 'Đang mở cửa sổ Google...' : 'Đăng nhập bằng tài khoản Google'}
                  </span>
                </button>
              </form>
            ) : (
              /* Self-service Reset / Set New Password Form */
              <form
                onSubmit={handleResetPasswordSubmit}
                className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E6DEC8] space-y-4 shadow-2xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#E6DEC8]">
                  <div className="flex items-center gap-2 text-red-700 font-black text-[15px]">
                    <KeyRound className="w-5 h-5" />
                    <span>Đặt Lại Mật Khẩu Mới</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(false);
                      setErrorMessage('');
                    }}
                    className="text-[13px] font-bold text-slate-600 hover:text-[#18181B] cursor-pointer"
                  >
                    ← Quay lại đăng nhập
                  </button>
                </div>

                <div>
                  <label className="block text-[14px] font-black text-[#18181B] mb-1.5">
                    Email tài khoản cần đặt lại mật khẩu
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="Nhập email đã đăng ký..."
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 text-[15px] font-semibold text-[#18181B] rounded-2xl border-2 border-[#E6DEC8] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-red-700"
                    />
                  </div>
                  <p className="text-[12.5px] text-slate-600 mt-2 leading-relaxed">
                    Hệ thống sẽ gửi liên kết đặt lại mật khẩu chính thức từ Firebase về hộp thư email này.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[15px] flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Đang gửi email đặt lại...</span>
                  ) : (
                    <>
                      <span>Gửi email đặt lại mật khẩu</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: REAL GOOGLE OAUTH SIGN-IN */}
        {activeTab === 'google' && (
          <div className="space-y-5">
            <div className="bg-white border border-[#E6DEC8] rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xs text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FAF7F0] border border-[#E6DEC8] flex items-center justify-center">
                <svg className="w-9 h-9" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-serif font-black text-[19px] text-[#18181B]">
                  Đăng nhập bằng tài khoản Google của bạn
                </h4>
                <p className="text-[14px] text-slate-600 leading-relaxed max-w-md mx-auto">
                  Nhấn nút bên dưới để mở cửa sổ chọn tài khoản chính thức từ Google. Mỗi học viên
                  đăng nhập bằng Gmail riêng và được lưu tiến độ độc lập, an toàn.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleSubmit}
                disabled={isSubmitting}
                className="w-full min-h-[52px] py-3.5 px-6 rounded-2xl bg-[#18181B] hover:bg-red-700 text-white font-black text-[15px] sm:text-[16px] flex items-center justify-center gap-3 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                {isSubmitting ? (
                  <span>Đang mở cửa sổ chọn tài khoản Google...</span>
                ) : (
                  <>
                    <span>Chọn tài khoản Google để đăng nhập</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2.5 text-[14px] sm:text-[16px] text-[#18181B] bg-white p-5 rounded-3xl border border-[#E6DEC8]">
              <span className="font-black text-red-700 block text-[16px] sm:text-[18px]">
                Quyền lợi thành viên MiXiangg HSK:
              </span>
              <div className="flex items-center gap-2.5 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>Học miễn phí trọn vẹn từ HSK 1 đến HSK 5 & Giáo trình Boya</span>
              </div>
              <div className="flex items-center gap-2.5 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>Học từ vựng Flashcard AI và luyện phát âm khẩu ngữ</span>
              </div>
              <div className="flex items-center gap-2.5 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>Chấm điểm bài thi thử tự động & lưu lịch sử báo cáo</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

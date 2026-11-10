import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  UserPlus,
  LogIn,
  Mail,
  Lock,
  User,
  AlertCircle,
  GraduationCap,
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
  const { loginWithGoogle, registerAccount, loginWithEmail, setActiveTab } = useHSK();

  const [activeTab, setActiveTabMode] = useState<'register' | 'login' | 'google'>('register');

  // Form states - Registration
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regLevel, setRegLevel] = useState<HSKLevel>('HSK 1');

  // Form states - Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Google quick sign in
  const [googleEmail, setGoogleEmail] = useState('thangtv1.hyn@gmail.com');
  const [googleName, setGoogleName] = useState('Thắng Trần');

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

  // Handle Google Login
  const handleGoogleSubmit = () => {
    setIsSubmitting(true);
    setErrorMessage('');
    setTimeout(() => {
      loginWithGoogle({
        name: googleName.trim() || 'Học viên HSK',
        email: googleEmail.trim() || 'user@gmail.com',
        avatar:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      });
      setIsSubmitting(false);
      triggerSuccessCelebration();
    }, 500);
  };

  const fillQuickAccount = (email: string, roleName: string) => {
    setLoginEmail(email);
    setLoginPassword('123456');
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative border border-slate-100 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
            汉
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Tài Khoản MiXiang HSK
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Học tiếng Trung HSK 1 đến HSK 5 chuẩn hóa, tự động lưu tiến độ và thi thử AI
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold mt-4">
          <button
            type="button"
            onClick={() => {
              setActiveTabMode('register');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-rose-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tự tạo tài khoản</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTabMode('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-rose-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng nhập</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTabMode('google');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'google'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: SELF-REGISTRATION FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 mt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ và tên học viên <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Địa chỉ Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Ít nhất 6 ký tự"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Xác nhận mật khẩu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Nhập lại mật khẩu"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mục tiêu cấp độ HSK đầu tiên
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5'] as HSKLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setRegLevel(lvl)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      regLevel === lvl
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
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
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <span>Đang tạo tài khoản...</span>
              ) : (
                <>
                  <span>Hoàn tất Đăng ký (Miễn phí 100%)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: EMAIL / PASSWORD LOGIN */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 mt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email tài khoản
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu của bạn"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>

            {/* Quick Demo Credentials */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1 text-slate-600">
              <span className="font-bold text-slate-800 block text-[11px]">
                Tài khoản mẫu để trải nghiệm nhanh:
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => fillQuickAccount('thangtv1.hyn@gmail.com', 'Admin')}
                  className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 font-medium cursor-pointer"
                >
                  👑 Admin (Thắng Trần)
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickAccount('mylinh.laoshi@hskmaster.edu.vn', 'Giáo viên')}
                  className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium cursor-pointer"
                >
                  👩‍🏫 Giáo viên (Cô Mỹ Linh)
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickAccount('tuankiet.dang@gmail.com', 'Học viên')}
                  className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-medium cursor-pointer"
                >
                  🎓 Học viên (Tuấn Kiệt)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <span>Đang đăng nhập...</span>
              ) : (
                <>
                  <span>Đăng nhập hệ thống</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 3: GOOGLE ONE-CLICK */}
        {activeTab === 'google' && (
          <div className="space-y-4 mt-2">
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
                  alt="Google Account"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
                />
                <div className="flex-1 text-left min-w-0">
                  <span className="font-bold text-sm text-slate-900 block truncate">
                    {googleName}
                  </span>
                  <span className="text-xs text-slate-500 font-medium block truncate">
                    {googleEmail}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Google
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSubmit}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Đang kết nối Google...</span>
                ) : (
                  <>
                    <span>Tiếp tục với tài khoản Google</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 bg-rose-50/50 p-3.5 rounded-2xl border border-rose-100">
              <span className="font-bold text-rose-900 block text-xs">
                Quyền lợi thành viên MiXiang HSK:
              </span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Học miễn phí trọn vẹn từ HSK 1 đến HSK 5</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Học từ vựng Flashcard AI và luyện phát âm khẩu ngữ</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Chấm điểm bài thi thử tự động & lưu lịch sử báo cáo</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

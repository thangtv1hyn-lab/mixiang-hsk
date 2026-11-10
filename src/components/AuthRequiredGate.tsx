import React from 'react';
import { Lock, Sparkles, BookOpen, GraduationCap, ArrowRight, Home, CheckCircle2 } from 'lucide-react';

interface AuthRequiredGateProps {
  onLogin: () => void;
  onGoHome: () => void;
  title?: string;
  description?: string;
}

export const AuthRequiredGate: React.FC<AuthRequiredGateProps> = ({
  onLogin,
  onGoHome,
  title = 'Vui lòng đăng nhập để tiếp tục học tập',
  description = 'Bạn cần có tài khoản MiXiang HSK để truy cập toàn bộ khóa học, luyện từ vựng Flashcard AI và tham gia các kỳ thi thử có chấm điểm tự động.',
}) => {
  return (
    <div className="max-w-2xl mx-auto my-12 px-4">
      <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-xl text-center space-y-6 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-gradient-to-b from-rose-500/10 to-transparent pointer-events-none rounded-full blur-2xl" />

        {/* Lock Icon Badge */}
        <div className="relative mx-auto w-18 h-18 rounded-2xl bg-gradient-to-br from-rose-600 to-red-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/30">
          <Lock className="w-9 h-9" />
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black ring-2 ring-white">
            ★
          </span>
        </div>

        {/* Heading & Text */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span>Nội dung yêu cầu tài khoản học viên</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
            {description}
          </p>
        </div>

        {/* Key Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
          {[
            'Lưu lại lịch sử & tiến độ bài học',
            'Theo dõi chuỗi ngày học liên tục (Streak)',
            'Luyện phát âm AI có chấm điểm thanh điệu',
            'Thi thử HSK tự động tính điểm & chữa bài',
          ].map((benefit, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={onLogin}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 transition-all cursor-pointer"
          >
            <span>Đăng ký / Đăng nhập ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onGoHome}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4 text-slate-500" />
            <span>Quay về Trang chủ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

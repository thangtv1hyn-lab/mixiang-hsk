import React from 'react';
import { Lock, ArrowRight, Home, CheckCircle2 } from 'lucide-react';

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
  description = 'Bạn cần đăng nhập tài khoản MiXiangg HSK để truy cập toàn bộ khóa học, luyện từ vựng Flashcard AI và làm bài thi thử tự chấm điểm.',
}) => {
  return (
    <div className="my-6">
      <div className="bg-white rounded-3xl border border-[#E6DEC8] p-8 sm:p-10 shadow-md text-center space-y-6">
        <div className="mx-auto w-18 h-18 rounded-2xl bg-red-700 text-white flex items-center justify-center shadow-md">
          <Lock className="w-9 h-9" />
        </div>

        <div className="space-y-3">
          <div className="text-[14px] font-extrabold text-red-700">
            Nội dung dành cho học viên đã đăng nhập
          </div>
          <h2 className="text-[22px] sm:text-[27px] font-black text-[#18181B] tracking-tight leading-snug">
            {title}
          </h2>
          <p className="text-[18px] sm:text-[19px] text-slate-700 leading-relaxed max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
          {[
            'Lưu lại lịch sử & tiến độ bài học',
            'Theo dõi chuỗi ngày học liên tục',
            'Luyện phát âm AI chấm thanh điệu',
            'Thi thử HSK tự động phân tích điểm',
          ].map((benefit, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#E6DEC8] text-[16px] text-[#18181B] font-bold"
            >
              <CheckCircle2 className="w-5 h-5 text-red-700 shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            type="button"
            onClick={onLogin}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-red-700 hover:bg-red-800 text-white font-black text-[16px] flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
          >
            <span>Đăng ký / Đăng nhập ngay</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onGoHome}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-[#E6DEC8] bg-[#FAF7F0] hover:bg-[#F5EFEB] text-[#18181B] font-bold text-[16px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-5 h-5 text-red-700" />
            <span>Quay về Trang chủ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

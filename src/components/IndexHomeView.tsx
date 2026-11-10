import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Layers,
  GraduationCap,
  Award,
  CheckCircle2,
  ArrowRight,
  Flame,
  Volume2,
  Smartphone,
  BarChart3,
  MessageSquare,
  Users,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';
import { useHSK } from '../context/HSKContext';
import { speakChinese } from '../utils/audioSpeech';

interface IndexHomeViewProps {
  onOpenGoogleAuth: () => void;
}

export const IndexHomeView: React.FC<IndexHomeViewProps> = ({ onOpenGoogleAuth }) => {
  const {
    setActiveTab,
    setActiveLevel,
    isAuthenticated,
    currentUser,
    logout,
    courses,
    vocabularies,
  } = useHSK();

  const [demoVocabFlipped, setDemoVocabFlipped] = useState(false);

  const sampleVocab = vocabularies[0] || {
    word: '你好',
    pinyin: 'nǐ hǎo',
    sinoVietnamese: 'Nhĩ hảo',
    meaning: 'Xin chào',
    exampleSentence: '你好，很高兴认识你。',
    exampleMeaning: 'Xin chào, rất vui được làm quen với bạn.',
  };

  const handleSelectLevel = (level: any) => {
    setActiveLevel(level);
    setActiveTab('courses');
  };

  return (
    <div className="space-y-16 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-rose-950 to-slate-950 text-white p-8 sm:p-12 lg:p-16 shadow-2xl border border-rose-900/30">
        <div className="absolute -right-16 -bottom-16 opacity-10 pointer-events-none select-none">
          <span className="font-serif text-[260px] font-black text-rose-500">汉语</span>
        </div>

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold text-rose-200">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Nền tảng học tiếng Trung HSK 1 - 5 thông minh chuẩn Quốc Tế</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none">
            Chinh Phục Tiếng Trung{' '}
            <span className="bg-gradient-to-r from-rose-400 via-red-300 to-amber-300 bg-clip-text text-transparent">
              HSK 1 Đến HSK 5
            </span>
          </h1>

          <p className="text-base sm:text-lg text-rose-100/90 leading-relaxed max-w-2xl">
            Lộ trình bài bản với ngữ pháp chi tiết, 2.500+ từ vựng Flashcard 3D, hệ thống trợ lý
            chấm phát âm thanh điệu bằng AI và phòng thi thử tự động chấm điểm.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('courses')}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-900/50 transition-all cursor-pointer"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Tiếp tục học tập ({currentUser?.name}) ➔</span>
                </button>

                <button
                  onClick={logout}
                  className="px-4 py-3.5 rounded-2xl border border-white/20 text-xs font-semibold hover:bg-white/10 transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <>
                {/* Primary Google Sign Up CTA */}
                <button
                  onClick={onOpenGoogleAuth}
                  className="px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl transition-all hover:scale-102 cursor-pointer group"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                  <span>Đăng ký nhanh bằng tài khoản Google</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Secondary Button */}
                <button
                  onClick={() => setActiveTab('courses')}
                  className="px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm sm:text-base border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-rose-300" />
                  <span>Khám phá các khóa học HSK</span>
                </button>
              </>
            )}
          </div>

          {/* Social Proof Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-rose-800/40 text-xs sm:text-sm">
            <div>
              <span className="text-rose-300 block text-[11px] font-medium">Học viên tin dùng</span>
              <span className="font-extrabold text-base text-white">25.000+ người</span>
            </div>
            <div>
              <span className="text-rose-300 block text-[11px] font-medium">Lộ trình chuẩn hóa</span>
              <span className="font-extrabold text-base text-amber-300">HSK 1 đến HSK 5</span>
            </div>
            <div>
              <span className="text-rose-300 block text-[11px] font-medium">Từ vựng & Mẫu câu</span>
              <span className="font-extrabold text-base text-emerald-300">2.500+ từ mới</span>
            </div>
            <div>
              <span className="text-rose-300 block text-[11px] font-medium">Trợ lý học tập</span>
              <span className="font-extrabold text-base text-rose-200">AI Lão Sư 24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HSK 1 - 5 CURRICULUM ROADMAP */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            Lộ trình học tập toàn diện
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Từ Cơ Bản Đến Thành Thạo (HSK 1 - HSK 5)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Chương trình được thiết kế theo chuẩn Hán Ban Quốc Tế, chia nhỏ theo từng bài học thực hành
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            {
              level: 'HSK 1',
              title: 'Nhập môn & Chào hỏi',
              vocab: '150 từ',
              grammar: '45 điểm',
              desc: 'Phát âm Pinyin, các nét Hán tự, giao tiếp cơ bản.',
              color: 'from-amber-500 to-orange-500',
              badge: 'bg-amber-100 text-amber-800 border-amber-300',
            },
            {
              level: 'HSK 2',
              title: 'Giao tiếp đời sống',
              vocab: '300 từ',
              grammar: '75 điểm',
              desc: 'Mua sắm, ăn uống, đi lại và hỏi đường tự tin.',
              color: 'from-emerald-500 to-teal-500',
              badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
            },
            {
              level: 'HSK 3',
              title: 'Tự chủ & Làm việc',
              vocab: '600 từ',
              grammar: '120 điểm',
              desc: 'Thảo luận công việc, du lịch độc lập tại Trung Quốc.',
              color: 'from-blue-500 to-indigo-500',
              badge: 'bg-blue-100 text-blue-800 border-blue-300',
            },
            {
              level: 'HSK 4',
              title: 'Đọc hiểu & Xã hội',
              vocab: '1200 từ',
              grammar: '180 điểm',
              desc: 'Thông thạo câu chữ 把/被, thuyết trình lưu loát.',
              color: 'from-purple-500 to-violet-500',
              badge: 'bg-purple-100 text-purple-800 border-purple-300',
            },
            {
              level: 'HSK 5',
              title: 'Học thuật & Chuyên sâu',
              vocab: '2500 từ',
              grammar: '260 điểm',
              desc: 'Đọc báo, xem phim không phụ đề, viết bài luận.',
              color: 'from-rose-500 to-red-600',
              badge: 'bg-rose-100 text-rose-800 border-rose-300',
            },
          ].map((item) => (
            <div
              key={item.level}
              onClick={() => handleSelectLevel(item.level)}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-lg hover:border-rose-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${item.badge}`}>
                    {item.level}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">{item.vocab}</span>
                </div>

                <h3 className="font-extrabold text-base text-slate-900 group-hover:text-rose-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-rose-600 group-hover:translate-x-1 transition-transform">
                <span>Vào khóa học</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. CORE FEATURES MATRIX */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-xs space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            Công nghệ hỗ trợ học tập
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Những Tính Năng Vượt Trội Tại MiXiang HSK
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Kết hợp trí tuệ nhân tạo Gemini AI và phương pháp sư phạm hiện đại giúp bạn học nhanh gấp 3 lần
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Trợ lý Lão Sư AI 24/7</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Giải đáp mọi thắc mắc về ngữ pháp, phân tích câu sai và đưa ra gợi ý cách diễn đạt tự nhiên như người bản xứ.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Volume2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Chấm Phát Âm Bằng AI</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Thu âm giọng đọc, AI đối chiếu chuẩn xác thanh 1, 2, 3, 4 và hướng dẫn chỉnh khẩu hình miệng, uốn lưỡi.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Thẻ Flashcard 3D Thông Minh</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ứng dụng thuật toán Spaced Repetition (Lặp lại ngắt quãng) với 3 mức độ nhớ giúp ghi nhớ từ vựng sâu sắc.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Đề Thi Thử Tự Động Chấm Điểm</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Đồng hồ đếm ngược như phòng thi thật, chấm điểm chi tiết Nghe - Đọc - Viết kèm giải thích cặn kẽ từng câu.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Báo Cáo Tiến Độ Tuần & Tháng</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Biểu đồ thời gian học hàng ngày, radar đánh giá 5 kỹ năng và tính năng xuất báo cáo in PDF / Excel CSV.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Ứng Dụng Di Động Đi Kèm</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Giao diện tối ưu chuẩn di động, có giả lập app smartphone và mã QR quét mở ngay trên điện thoại của bạn.
            </p>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE FLASHCARD DEMO */}
      <section className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-3xl border border-rose-100 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-lg">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-3 py-1 rounded-full border border-rose-200">
            Trải nghiệm học ngay tại đây
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Học Từ Vựng & Nghe Phát Âm Ngay Bây Giờ
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Chạm vào thẻ bên phải để lật xem phiên âm Pinyin, âm Hán Việt và câu ví dụ thực tế.
            Bấm vào biểu tượng loa để nghe giọng đọc chuẩn Bắc Kinh.
          </p>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => setActiveTab('vocab')}
              className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs sm:text-sm hover:bg-rose-700 transition-colors shadow-xs"
            >
              Xem toàn bộ 2.500 từ vựng ➔
            </button>
          </div>
        </div>

        {/* Demo Flashcard */}
        <div
          onClick={() => setDemoVocabFlipped(!demoVocabFlipped)}
          className="w-full max-w-sm h-64 bg-white rounded-3xl border-2 border-rose-200 shadow-md p-6 flex flex-col justify-between items-center text-center cursor-pointer select-none hover:shadow-xl transition-all"
        >
          <div className="w-full flex justify-between text-xs text-slate-400">
            <span className="font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
              HSK 1
            </span>
            <span className="text-[11px] text-slate-400">Chạm để lật thẻ ↻</span>
          </div>

          <div className="my-auto space-y-2">
            {!demoVocabFlipped ? (
              <>
                <h3 className="font-serif text-6xl font-black text-slate-900">
                  {sampleVocab.word}
                </h3>
                <p className="text-sm font-bold text-rose-600 font-mono">
                  {sampleVocab.pinyin}
                </p>
              </>
            ) : (
              <div className="space-y-2 animate-in fade-in">
                <span className="text-2xl font-black text-amber-600 block">
                  {sampleVocab.meaning}
                </span>
                <span className="text-xs text-slate-500 block">
                  [Hán Việt: {sampleVocab.sinoVietnamese}]
                </span>
                <p className="text-xs text-slate-700 italic bg-slate-50 p-2 rounded-lg">
                  "{sampleVocab.exampleSentence}"
                </p>
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              speakChinese(sampleVocab.word);
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
            <span>Nghe phát âm chuẩn</span>
          </button>
        </div>
      </section>

      {/* 5. BOTTOM REGISTRATION CALL TO ACTION */}
      <section className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 text-center space-y-6 shadow-xl border border-slate-800">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Sẵn Sàng Chinh Phục HSK Cùng MiXiang?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Hàng ngàn học viên đã vượt qua kỳ thi HSK với số điểm xuất sắc. Đăng ký tài khoản Google
            chỉ trong 3 giây để bắt đầu học hoàn toàn miễn phí.
          </p>
        </div>

        <div className="flex justify-center pt-2">
          {!isAuthenticated ? (
            <button
              onClick={onOpenGoogleAuth}
              className="px-7 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm sm:text-base flex items-center gap-3 shadow-xl hover:scale-105 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              <span>Đăng Ký Miễn Phí Với Tài Khoản Google</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('courses')}
              className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm sm:text-base flex items-center gap-2 shadow-lg shadow-rose-900/50 transition-all cursor-pointer"
            >
              <BookOpen className="w-5 h-5" />
              <span>Vào học ngay</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

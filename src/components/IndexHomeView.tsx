import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Layers,
  Volume2,
  PenTool,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  X,
  Sparkles,
  Calendar,
  MapPin,
  UserCheck,
  ZoomIn,
} from 'lucide-react';
import { useHSK, DEFAULT_CLASSROOM_MOMENTS } from '../context/HSKContext';
import { HSKLevel } from '../types/hsk';
import { speakChinese } from '../utils/audioSpeech';

interface IndexHomeViewProps {
  onOpenGoogleAuth: () => void;
  onOpenReminder: () => void;
  onOpenAiTutor: () => void;
  externalConsultationOpen?: boolean;
  onCloseExternalConsultation?: () => void;
}

// 6-stroke SVG definition for the character "米" (mǐ - Mễ / Hạt gạo) in standard Chinese stroke order
const MI_STROKES: Array<{ d: string; label: string }> = [
  { d: 'M 32 32 C 37 37, 41 42, 43 46', label: 'Nét 1: Chấm trái (点)' },
  { d: 'M 70 30 C 66 36, 61 42, 57 46', label: 'Nét 2: Phẩy phải (撇)' },
  { d: 'M 20 52 L 80 52', label: 'Nét 3: Ngang (横)' },
  { d: 'M 50 18 L 50 85', label: 'Nét 4: Sổ giữa (竖)' },
  { d: 'M 48 52 C 40 64, 30 74, 20 81', label: 'Nét 5: Phẩy dưới (撇)' },
  { d: 'M 52 52 C 60 64, 70 74, 80 81', label: 'Nét 6: Mác dưới (捺)' },
];

export const IndexHomeView: React.FC<IndexHomeViewProps> = ({
  onOpenGoogleAuth,
  externalConsultationOpen = false,
  onCloseExternalConsultation,
}) => {
  const {
    courses,
    setActiveTab,
    setActiveLevel,
    isAuthenticated,
    siteUIConfig,
  } = useHSK();

  // Stroke animation state for "米"
  const [isAnimatingStrokes, setIsAnimatingStrokes] = useState(false);
  const [visibleStrokeCount, setVisibleStrokeCount] = useState<number>(MI_STROKES.length);

  // Consultation Registration Modal (for K24 Admission & Top Bar "Đăng ký")
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [consultForm, setConsultForm] = useState({
    fullName: '',
    phone: '',
    targetLevel: 'HSK 1 - Người mới bắt đầu',
    schedule: 'Ca tối (19:30 - 21:00)',
  });
  const [consultSubmitted, setConsultSubmitted] = useState(false);

  // Poster Lightbox Modal
  const [zoomedPoster, setZoomedPoster] = useState<{ url: string; caption: string } | null>(null);

  // Classroom moment preview modal
  const [activeMoment, setActiveMoment] = useState<{
    title: string;
    subtitle: string;
    detail: string;
    date: string;
    location: string;
    image: string;
  } | null>(null);

  useEffect(() => {
    if (externalConsultationOpen) {
      setIsConsultModalOpen(true);
    }
  }, [externalConsultationOpen]);

  const closeConsultModal = () => {
    setIsConsultModalOpen(false);
    setConsultSubmitted(false);
    onCloseExternalConsultation?.();
  };

  // Trigger step-by-step stroke order animation for "米"
  const handlePlayStrokeOrder = () => {
    setIsAnimatingStrokes(true);
    setVisibleStrokeCount(0);
  };

  useEffect(() => {
    if (!isAnimatingStrokes) return;
    if (visibleStrokeCount < MI_STROKES.length) {
      const timer = setTimeout(() => {
        setVisibleStrokeCount((prev) => prev + 1);
      }, 420);
      return () => clearTimeout(timer);
    } else {
      const endTimer = setTimeout(() => {
        setIsAnimatingStrokes(false);
      }, 600);
      return () => clearTimeout(endTimer);
    }
  }, [isAnimatingStrokes, visibleStrokeCount]);

  const handleNavigateSection = (tabId: string, level?: HSKLevel) => {
    if (level) {
      setActiveLevel(level);
    }
    if (tabId !== 'home' && !isAuthenticated) {
      onOpenGoogleAuth();
      return;
    }
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Featured courses matching Page 1 & Page 2 of the PDF
  const featuredCourses: Array<{
    level: HSKLevel;
    duration: string;
    title: string;
    description: string;
    lessonCount: number;
    image: string;
  }> = [
    {
      level: 'HSK 1',
      duration: '6 tuần (18 buổi)',
      title: 'HSK 1: Phát Âm & Nhập Môn Căn Bản',
      description:
        'Làm chủ hoàn toàn hệ thống ngữ âm Pinyin, 21 thanh mẫu, 36 vận mẫu và 4 thanh điệu. Tích lũy 150 từ vựng và các mẫu câu chào hỏi căn bản.',
      lessonCount:
        courses.find((c) => c.level === 'HSK 1')?.lessons.length || 2,
      image: '/assets/aistudio/hsk1_2aed1171.png',
    },
    {
      level: 'HSK 2',
      duration: '8 tuần (24 buổi)',
      title: 'HSK 2: Giao Tiếp Đời Sống & Mua Sắm',
      description:
        'Mở rộng 300 từ vựng cốt lõi, diễn đạt thời gian, giá cả, mua sắm, gọi món nhà hàng, chỉ đường và đặt lịch hẹn.',
      lessonCount:
        courses.find((c) => c.level === 'HSK 2')?.lessons.length || 1,
      image: '/assets/aistudio/hsk2_40c3fcef.png',
    },
    {
      level: 'HSK 3',
      duration: '10 tuần (30 buổi)',
      title: 'HSK 3: Bứt Phá Chữ Hán & Thi Thử HSK',
      description:
        'Làm chủ 600 từ vựng và toàn bộ cấu trúc câu phức, đọc hiểu đoạn văn chữ Hán không cần Pinyin, luyện kỹ năng nghe và nói HSKK.',
      lessonCount:
        courses.find((c) => c.level === 'HSK 3')?.lessons.length || 1,
      image: '/assets/aistudio/hsk3_4d56bb96.png',
    },
  ];

  // 2 Admission Posters for "Đồng Hành Cùng Giảng Viên MiXiangg"
  const admissionPosters = [
    {
      id: 'poster-1',
      url:
        siteUIConfig.poster1Url ||
        '/assets/aistudio/1794493556654_2645543663410262361_g4922351168579610784_e99743bc4875704f02020ec30504d074_7a96f4ba.jpg',
      caption:
        siteUIConfig.poster1Caption ||
        'Tuyển sinh Lớp Tiếng Trung Boya Sơ Cấp 1 — Giảng viên Nguyễn Thị Minh Hương',
    },
    {
      id: 'poster-2',
      url:
        siteUIConfig.poster2Url ||
        '/assets/aistudio/1794493556657_2645543663410262361_g4922351168579610784_dce6dc1e88bf0bec69888aec30c627a0_f9b8c805.jpg',
      caption:
        siteUIConfig.poster2Caption ||
        'Thông báo Tuyển sinh Khóa Học Tiếng Trung Online & Offline — MiXiangg HSK',
    },
  ];

  // Classroom Moments from siteUIConfig (customizable in Admin UI Editor)
  const classroomMoments =
    Array.isArray(siteUIConfig.classroomMoments) && siteUIConfig.classroomMoments.length > 0
      ? siteUIConfig.classroomMoments
      : DEFAULT_CLASSROOM_MOMENTS;

  const handleConsultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultForm.fullName.trim() || !consultForm.phone.trim()) return;
    setConsultSubmitted(true);
  };

  return (
    <div className="w-full">
      {/* =================================================================== */}
      {/* 1. HERO SECTION (NỀN KEM #F7F4EC - TRÁI: TIÊU ĐỀ, PHẢI: Ô MỄ TỰ "米") */}
      {/* =================================================================== */}
      <section
        className="w-full py-12 sm:py-16 lg:py-20 border-b border-[#EAE5DC]/70"
        style={{ backgroundColor: siteUIConfig.canvasColor || '#F7F4EC' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column (7 cols) */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F3E2DC] text-red-600 text-[13px] font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97A64] shrink-0" />
                <span className="text-[18px]">{siteUIConfig.heroBadge}</span>
              </div>

              <h1 className="font-extrabold tracking-tight leading-[1.13] text-[#1C1E21]">
                <span className="block text-[40px]">{siteUIConfig.heroTitleLine1}</span>
                <span
                  className="block text-[45px]"
                  style={{ color: siteUIConfig.primaryColor || '#C85A43' }}
                >
                  {siteUIConfig.heroTitleHighlight}
                </span>
                <span className="block text-[40px]">{siteUIConfig.heroTitleLine3}</span>
              </h1>

              <p className="text-[16px] sm:text-[17px] text-[#5C6068] leading-relaxed max-w-xl font-medium">
                {siteUIConfig.heroDescription}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleNavigateSection('courses')}
                  style={{ backgroundColor: siteUIConfig.primaryColor || '#C85A43' }}
                  className="px-6 py-3.5 rounded-2xl hover:opacity-92 text-white font-bold text-[15px] shadow-sm transition-all flex items-center gap-2.5 cursor-pointer active:scale-[0.99]"
                >
                  <GraduationCap className="w-5 h-5 shrink-0" />
                  <span>{siteUIConfig.heroCtaPrimary}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigateSection('vocab')}
                  className="px-6 py-3.5 rounded-2xl bg-white hover:bg-[#FAF7F2] text-[#1C1E21] border border-[#E4DEC9] font-bold text-[15px] shadow-2xs transition-all flex items-center gap-2.5 cursor-pointer active:scale-[0.99]"
                >
                  <Layers className="w-5 h-5 text-[#5C6068] shrink-0" />
                  <span>{siteUIConfig.heroCtaSecondary}</span>
                </button>
              </div>

              {/* 3 Proof Metrics */}
              <div className="pt-4 flex flex-wrap items-start gap-8 sm:gap-12">
                <div>
                  <div className="text-[26px] sm:text-[30px] font-black text-[#1C1E21] tabular-nums leading-tight">
                    {siteUIConfig.stat1Value}
                  </div>
                  <div className="text-[12px] text-[#7C7F86] font-medium mt-0.5">
                    {siteUIConfig.stat1Label}
                  </div>
                </div>

                <div>
                  <div
                    className="text-[26px] sm:text-[30px] font-black tabular-nums leading-tight"
                    style={{ color: siteUIConfig.primaryColor || '#C85A43' }}
                  >
                    {siteUIConfig.stat2Value}
                  </div>
                  <div className="text-[12px] text-[#7C7F86] font-medium mt-0.5">
                    {siteUIConfig.stat2Label}
                  </div>
                </div>

                <div>
                  <div className="text-[26px] sm:text-[30px] font-black text-[#D97724] leading-tight">
                    {siteUIConfig.stat3Value}
                  </div>
                  <div className="text-[12px] text-[#7C7F86] font-medium mt-0.5">
                    {siteUIConfig.stat3Label}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols) — Interactive Hanzi Stroke Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-[28px] p-6 sm:p-7 shadow-[0_20px_50px_rgba(28,30,33,0.08)] border border-[#EFECE6] max-w-[420px] mx-auto w-full">
                {/* Card Top Header */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C8F96]">
                    TRẢI NGHIỆM NÉT VIẾT CHỮ HÁN
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FCECE8] text-[#C85A43] text-[11px] font-extrabold">
                    HSK 1
                  </span>
                </div>

                {/* Ô Mễ Tự (Mi-zi-ge) Square Box */}
                <div
                  onClick={handlePlayStrokeOrder}
                  title="Bấm để xem thứ tự nét viết chữ 米 (Mễ)"
                  className="w-44 h-44 sm:w-48 sm:h-48 mx-auto my-5 rounded-2xl bg-[#F5F0E4] border-2 border-[#E2D8C1] relative flex items-center justify-center cursor-pointer select-none overflow-hidden group"
                >
                  {/* Mi-zi-ge SVG Guide Lines */}
                  <svg
                    viewBox="0 0 100 100"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    aria-hidden="true"
                  >
                    <line
                      x1="0"
                      y1="50"
                      x2="100"
                      y2="50"
                      stroke="#E0D5BE"
                      strokeWidth="0.9"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="50"
                      y1="0"
                      x2="50"
                      y2="100"
                      stroke="#E0D5BE"
                      strokeWidth="0.9"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="0"
                      y1="0"
                      x2="100"
                      y2="100"
                      stroke="#E6DEC8"
                      strokeWidth="0.8"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="100"
                      y1="0"
                      x2="0"
                      y2="100"
                      stroke="#E6DEC8"
                      strokeWidth="0.8"
                      strokeDasharray="3 3"
                    />
                  </svg>

                  {/* Character Display / Stroke Animation */}
                  {isAnimatingStrokes ? (
                    <svg
                      viewBox="0 0 100 100"
                      className="relative z-10 w-32 h-32 sm:w-36 sm:h-36"
                      aria-label="Mô phỏng nét viết chữ Mễ"
                    >
                      {MI_STROKES.map((s, idx) => (
                        <path
                          key={idx}
                          d={s.d}
                          fill="none"
                          stroke={idx === visibleStrokeCount - 1 ? '#C85A43' : '#BDB4A2'}
                          strokeWidth="7.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="transition-opacity duration-200"
                          style={{
                            opacity: idx < visibleStrokeCount ? 1 : 0.12,
                          }}
                        />
                      ))}
                    </svg>
                  ) : (
                    <span className="relative z-10 font-serif text-[96px] sm:text-[106px] leading-none text-[#C4BBB0] group-hover:text-[#A89D8F] transition-colors select-none">
                      米
                    </span>
                  )}

                  {isAnimatingStrokes && visibleStrokeCount > 0 && (
                    <span className="absolute bottom-2 inset-x-2 text-center text-[11px] font-bold text-[#C85A43] bg-white/90 py-0.5 px-2 rounded-md shadow-2xs">
                      {MI_STROKES[Math.min(visibleStrokeCount - 1, MI_STROKES.length - 1)].label}
                    </span>
                  )}
                </div>

                {/* Pinyin & Sino-Vietnamese Caption */}
                <div className="text-center space-y-3">
                  <div className="text-[15px] font-extrabold text-[#1C1E21]">
                    mǐ (Hán Việt: Mễ - Hạt gạo)
                  </div>

                  {/* Interactive Audio & Stroke Buttons */}
                  <div className="flex items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => speakChinese('米')}
                      className="px-4 py-1.5 rounded-full bg-[#FCECE8] hover:bg-[#F5D5CC] text-[#C85A43] text-[12px] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Nghe đọc</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePlayStrokeOrder}
                      className="px-4 py-1.5 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#374151] text-[12px] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5 shrink-0" />
                      <span>Xem nét viết</span>
                    </button>
                  </div>
                </div>

                {/* Meaning Callout Box */}
                <div className="mt-5 p-4 rounded-2xl bg-[#F9F8F6] border border-[#EFECE6] text-left space-y-1">
                  <div className="text-[12px] font-extrabold text-[#1C1E21]">
                    💡 Ý nghĩa tên gọi MiXiangg (米香 - Mễ Hương):
                  </div>
                  <p className="text-[12px] font-bold text-[#686B72] leading-relaxed">
                    &ldquo;Mùi thơm của hạt gạo&rdquo;, tượng trưng cho sự mộc mạc, gần gũi và là gốc rễ dinh dưỡng nuôi lớn người học tiếng Trung từ những bước đầu tiên.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 2. LỘ TRÌNH CỐT LÕI — CÁC KHÓA HỌC NỔI BẬT (NỀN TRẮNG #FFFFFF) */}
      {/* =================================================================== */}
      {siteUIConfig.showCoursesSection && (
        <section className="w-full bg-white py-14 sm:py-16 border-b border-[#EFECE6]/70">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-[#FCECE8] text-red-600 text-[11px] font-extrabold uppercase tracking-wider">
                  LỘ TRÌNH CỐT LÕI
                </span>
                <h2 className="text-[26px] sm:text-[32px] font-extrabold text-[#1C1E21] tracking-tight">
                  Các Khóa Học Nổi Bật
                </h2>
              </div>

              <button
                type="button"
                onClick={() => handleNavigateSection('courses')}
                className="text-red-600 hover:opacity-85 font-bold text-[14px] inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <span>Xem toàn bộ khóa học</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredCourses.map((course) => (
                <div
                  key={course.level}
                  onClick={() => handleNavigateSection('courses', course.level)}
                  className="group bg-[#FDFCFA] hover:bg-white rounded-3xl p-4 sm:p-5 border border-[#EAE5DC] hover:border-red-600/60 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer overflow-hidden"
                >
                  <div className="space-y-4">
                    {/* Course Representative Image */}
                    <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-[#F5F0E6] border border-[#EAE5DC]/70">
                      <img
                        src={course.image}
                        alt={course.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Top Badge & Duration */}
                    <div className="flex items-center justify-between gap-2 px-1">
                      <span
                        className="px-3 py-1 rounded-full text-white text-[11px] font-extrabold tracking-wide"
                        style={{ backgroundColor: siteUIConfig.primaryColor || '#C85A43' }}
                      >
                        {course.level}
                      </span>
                      <span className="text-[12px] font-medium text-[#7C7F86]">
                        {course.duration}
                      </span>
                    </div>

                    {/* Course Title */}
                    <h3 className="px-1 text-[18px] sm:text-[19px] font-extrabold text-[#1C1E21] group-hover:text-red-600 transition-colors leading-snug">
                      {course.title}
                    </h3>

                    {/* Course Description */}
                    <p className="px-1 text-[14.5px] text-[#686B72] leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 mt-5 px-1 border-t border-[#EFECE6] flex items-center justify-between text-[13px]">
                    <span className="font-bold text-[#1C1E21] tabular-nums">
                      {course.lessonCount} bài học
                    </span>
                    <span className="font-bold text-red-600 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Vào học ngay</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* 3. ĐỒNG HÀNH CÙNG GIẢNG VIÊN MIXIANGG (2 ẢNH POSTER) + TUYỂN SINH K24 */}
      {/* =================================================================== */}
      {(siteUIConfig.showPostersSection || siteUIConfig.showAdmissionBanner) && (
        <section
          className="w-full py-14 sm:py-16 border-b border-[#EFECE6]/70"
          style={{ backgroundColor: siteUIConfig.canvasColor || '#F7F4EC' }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            {siteUIConfig.showPostersSection && (
              <>
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto space-y-2.5">
                  <span className="inline-block px-3.5 py-1 rounded-full bg-[#FCECE8] text-red-600 text-[15px] font-extrabold uppercase tracking-wider">
                    {siteUIConfig.posterSectionBadge}
                  </span>
                  <h2 className="text-[26px] sm:text-[32px] font-extrabold text-[#1C1E21] tracking-tight">
                    {siteUIConfig.posterSectionTitle}
                  </h2>
                  {siteUIConfig.posterSectionSubtitle && (
                    <p className="text-[14.5px] font-bold text-[#686B72]">
                      {siteUIConfig.posterSectionSubtitle}
                    </p>
                  )}
                </div>

                {/* 2 Poster Images Side-by-Side (Replacing the 3 teacher profile cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                  {admissionPosters.map((poster) => (
                    <div
                      key={poster.id}
                      onClick={() =>
                        setZoomedPoster({ url: poster.url, caption: poster.caption })
                      }
                      className="group bg-white rounded-3xl p-3 sm:p-4 border border-[#EAE5DC] hover:border-red-600/60 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col overflow-hidden"
                    >
                      <div className="relative w-full rounded-2xl overflow-hidden bg-[#F5F0E6]">
                        <img
                          src={poster.url}
                          alt={poster.caption}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-auto object-contain group-hover:scale-[1.015] transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/60 text-white text-[11.5px] font-bold flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs">
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>Phóng to</span>
                        </div>
                      </div>
                      {poster.caption && (
                        <div className="pt-3 px-2 flex items-center justify-between gap-3">
                          <p className="text-[13.5px] font-bold text-[#1C1E21] group-hover:text-red-600 transition-colors">
                            {poster.caption}
                          </p>
                          <span className="text-[12px] font-extrabold text-red-600 shrink-0">
                            Xem ảnh →
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Dark Charcoal Admission Banner Card */}
            {siteUIConfig.showAdmissionBanner && (
              <div className="rounded-3xl bg-[#22252A] text-white p-7 sm:p-10 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#F59E0B]">
                    {siteUIConfig.admissionBadge}
                  </div>
                  <h3 className="text-[22px] sm:text-[28px] font-extrabold text-white tracking-tight">
                    {siteUIConfig.admissionTitle}
                  </h3>
                  <p className="text-[14px] sm:text-[15px] text-slate-300 leading-relaxed">
                    {siteUIConfig.admissionDescription}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsConsultModalOpen(true)}
                  style={{ backgroundColor: siteUIConfig.primaryColor || '#C85A43' }}
                  className="px-6 py-3.5 rounded-xl hover:opacity-90 text-white font-bold text-[14px] shadow-sm transition-opacity cursor-pointer shrink-0"
                >
                  {siteUIConfig.admissionCta}
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* 4. KỶ NIỆM ĐÁNG NHỚ — KHOẢNH KHẮC CÙNG LỚP HỌC (NỀN TRẮNG #FFFFFF) */}
      {/* =================================================================== */}
      {siteUIConfig.showMomentsSection && (
        <section className="w-full bg-white py-14 sm:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2.5">
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#FEF3C7] text-[#D97706] text-[15px] font-extrabold uppercase tracking-wider">
                {siteUIConfig.momentsSectionBadge || 'KỶ NIỆM ĐÁNG NHỚ'}
              </span>
              <h2 className="text-[26px] sm:text-[32px] font-extrabold text-[#1C1E21] tracking-tight">
                {siteUIConfig.momentsSectionTitle || 'Khoảnh Khắc Cùng Lớp Học'}
              </h2>
              {siteUIConfig.momentsSectionSubtitle && (
                <p className="text-[14.5px] font-bold text-[#686B72]">
                  {siteUIConfig.momentsSectionSubtitle}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {classroomMoments.map((item, idx) => (
                <div
                  key={item.id || `${item.title}-${idx}`}
                  onClick={() => setActiveMoment(item)}
                  className="group bg-white rounded-2xl border border-[#EAE5DC] hover:border-red-600/60 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col"
                >
                  <div className="w-full aspect-16/11 bg-[#F5F0E6] overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
                    <h3 className="text-[14.5px] font-extrabold text-[#1C1E21] group-hover:text-red-600 transition-colors truncate">
                      {item.title}
                    </h3>
                    <p className="text-[12.5px] text-[#686B72] leading-snug line-clamp-2">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* MODAL 0: LIGHTBOX XEM ẢNH POSTER TUYỂN SINH RÕ NÉT */}
      {/* =================================================================== */}
      {zoomedPoster && (
        <div
          onClick={() => setZoomedPoster(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full max-h-[92vh] bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#EAE5DC] flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EAE5DC] bg-[#FDFBF7]">
              <span className="text-[14px] font-extrabold text-[#1C1E21] truncate">
                {zoomedPoster.caption}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setZoomedPoster(null);
                    setIsConsultModalOpen(true);
                  }}
                  style={{ backgroundColor: siteUIConfig.primaryColor || '#C85A43' }}
                  className="px-4 py-1.5 rounded-xl text-white font-bold text-[12.5px] cursor-pointer"
                >
                  Đăng ký lớp học này
                </button>
                <button
                  type="button"
                  onClick={() => setZoomedPoster(null)}
                  aria-label="Đóng"
                  className="p-1.5 rounded-full text-slate-500 hover:text-red-600 hover:bg-[#FCECE8] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-3 sm:p-5 overflow-y-auto bg-[#18181B] flex items-center justify-center">
              <img
                src={zoomedPoster.url}
                alt={zoomedPoster.caption}
                className="max-h-[78vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 1: ĐĂNG KÝ TƯ VẤN KHÓA HỌC MIXIANGG K24 */}
      {/* =================================================================== */}
      {isConsultModalOpen && (
        <div
          onClick={closeConsultModal}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#EAE5DC] shadow-2xl space-y-5 relative max-h-[92vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={closeConsultModal}
              aria-label="Đóng cửa sổ"
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-[#C85A43] hover:bg-[#FCECE8] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCECE8] text-[#C85A43] text-[11px] font-extrabold uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tuyển sinh Khóa K24 • Ưu đãi học phí</span>
              </span>
              <h3 className="text-[22px] font-extrabold text-[#1C1E21]">
                Đăng Ký Tư Vấn Lộ Trình HSK
              </h3>
              <p className="text-[13.5px] text-[#686B72]">
                Nhận bộ thẻ Flashcard 300 từ vựng, kiểm tra trình độ đầu vào miễn phí và xếp lớp phù hợp.
              </p>
            </div>

            {consultSubmitted ? (
              <div className="p-6 rounded-2xl bg-[#ECFDF5] border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-[18px] font-extrabold text-emerald-950">
                  Đã ghi nhận thông tin đăng ký!
                </h4>
                <p className="text-[13.5px] text-emerald-800 leading-relaxed">
                  Cảm ơn <strong>{consultForm.fullName}</strong>! Bộ phận tuyển sinh MiXiangg HSK sẽ liên hệ qua số <strong>{consultForm.phone}</strong> trong vòng 15 phút để gửi bộ Flashcard và tư vấn lịch học.
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      closeConsultModal();
                      handleNavigateSection('courses');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#C85A43] text-white font-bold text-[13.5px] cursor-pointer"
                  >
                    Vào học thử ngay
                  </button>
                  <button
                    type="button"
                    onClick={closeConsultModal}
                    className="px-4 py-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-bold text-[13.5px] cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConsultSubmit} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-[#1C1E21] mb-1">
                    Họ và tên học viên *
                  </label>
                  <input
                    type="text"
                    required
                    value={consultForm.fullName}
                    onChange={(e) =>
                      setConsultForm({ ...consultForm, fullName: e.target.value })
                    }
                    placeholder="Ví dụ: Nguyễn Minh Anh"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EAE5DC] bg-[#FDFBF7] text-[14px] focus:outline-none focus:border-[#C85A43]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#1C1E21] mb-1">
                    Số điện thoại / Zalo nhận tài liệu *
                  </label>
                  <input
                    type="tel"
                    required
                    value={consultForm.phone}
                    onChange={(e) =>
                      setConsultForm({ ...consultForm, phone: e.target.value })
                    }
                    placeholder="Ví dụ: 0988 xxx xxx"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EAE5DC] bg-[#FDFBF7] text-[14px] focus:outline-none focus:border-[#C85A43]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-bold text-[#1C1E21] mb-1">
                      Khóa học quan tâm
                    </label>
                    <select
                      value={consultForm.targetLevel}
                      onChange={(e) =>
                        setConsultForm({ ...consultForm, targetLevel: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5DC] bg-[#FDFBF7] text-[13.5px] font-semibold focus:outline-none focus:border-[#C85A43]"
                    >
                      <option>HSK 1 - Người mới bắt đầu</option>
                      <option>HSK 2 - Giao tiếp đời sống</option>
                      <option>HSK 3 - Bứt phá chữ Hán</option>
                      <option>HSK 4-5 - Trung cao cấp</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[#1C1E21] mb-1">
                      Khung giờ dự kiến
                    </label>
                    <select
                      value={consultForm.schedule}
                      onChange={(e) =>
                        setConsultForm({ ...consultForm, schedule: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5DC] bg-[#FDFBF7] text-[13.5px] font-semibold focus:outline-none focus:border-[#C85A43]"
                    >
                      <option>Ca tối (19:30 - 21:00)</option>
                      <option>Cuối tuần (Thứ 7 - CN)</option>
                      <option>Lớp 1 kèm 1 linh hoạt</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <a
                    href="tel:0378105999"
                    className="text-[13px] font-bold text-[#C85A43] hover:underline inline-flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Gọi trực tiếp: 0378.105.999</span>
                  </a>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#C85A43] hover:bg-[#B24A34] text-white font-bold text-[14px] shadow-sm cursor-pointer"
                  >
                    Nhận Tư Vấn &amp; Quà Tặng
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: CHI TIẾT KHOẢNH KHẮC LỚP HỌC */}
      {/* =================================================================== */}
      {activeMoment && (
        <div
          onClick={() => setActiveMoment(null)}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto border border-[#EAE5DC] shadow-2xl"
          >
            <div className="relative aspect-16/10 bg-[#F5F0E6]">
              <img
                src={activeMoment.image}
                alt={activeMoment.title}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setActiveMoment(null)}
                aria-label="Đóng"
                className="absolute top-4 right-4 p-2 rounded-full bg-black/55 text-white hover:bg-[#C85A43] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-4 text-[12px] font-bold text-[#C85A43]">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{activeMoment.date}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[#686B72]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{activeMoment.location}</span>
                </span>
              </div>

              <h3 className="text-[20px] font-extrabold text-[#1C1E21]">
                {activeMoment.title}
              </h3>

              <p className="text-[14px] text-[#5C6068] leading-relaxed">
                {activeMoment.detail}
              </p>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMoment(null);
                    setIsConsultModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#C85A43] hover:bg-[#B24A34] text-white font-bold text-[13.5px] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Đăng ký tham gia lớp học</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

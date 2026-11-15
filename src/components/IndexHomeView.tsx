import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  Volume2,
  X,
  ChevronRight,
  ChevronLeft,
  PhoneCall,
  MessageSquare,
  RotateCw,
  CheckCircle2,
  Users,
  Award,
  Globe,
  Quote,
  Clock,
  Trophy,
  Gamepad2,
} from 'lucide-react';
import { useHSK } from '../context/HSKContext';
import { speakChinese } from '../utils/audioSpeech';
import { Exam, HSKLevel } from '../types/hsk';

interface IndexHomeViewProps {
  onOpenGoogleAuth: () => void;
  onOpenReminder?: () => void;
  onOpenAiTutor?: () => void;
}

export const IndexHomeView: React.FC<IndexHomeViewProps> = ({
  onOpenGoogleAuth,
}) => {
  const {
    setActiveTab,
    setActiveLevel,
    isAuthenticated,
    courses,
    exams,
    setCurrentExam,
    vocabularies,
    forumPosts,
  } = useHSK();

  // Interactive Modals State
  const [activeRadicalModal, setActiveRadicalModal] = useState(false);
  const [activeHanziStoryModal, setActiveHanziStoryModal] = useState(false);
  const [activePinyinModal, setActivePinyinModal] = useState(false);
  const [activePosterModal, setActivePosterModal] = useState<string | null>(null);

  // Hero Carousel / Slides State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSlidePaused, setIsSlidePaused] = useState(false);

  const heroSlides = [
    {
      id: 'boya-red',
      badge: 'Lớp học Tiếng Trung · Dành cho người mới',
      title: 'Tuyển sinh Lớp Tiếng Trung Cơ Bản',
      subtitle: 'Khóa 40 buổi (02 buổi/tuần) · Giáo trình Boya chuẩn quốc tế · Cam kết đầu ra HSK 3',
      image: '/assets/aistudio/1794493556654_2645543663410262361_g4922351168579610784_e99743bc4875704f02020ec30504d074_7a96f4ba.jpg',
      highlights: [
        'Khóa 40 buổi · 02 buổi/tuần',
        'Tối đa 08 học viên / lớp',
        'Học Online / Offline',
        'Đầu ra HSK 3 & 5 kỹ năng',
      ],
      hotline: '0378.105.999',
      ctaText: 'Đăng ký tư vấn xếp lớp',
    },
    {
      id: 'boya-black',
      badge: 'Lộ trình chuyên sâu · HSK 3.0',
      title: 'Tuyển sinh Khóa Tiếng Trung Toàn Diện',
      subtitle: 'Học bài bản cùng giáo trình Boya và giảng viên tận tâm · Luyện phản xạ giao tiếp tự nhiên',
      image: '/assets/aistudio/1794493556657_2645543663410262361_g4922351168579610784_dce6dc1e88bf0bec69888aec30c627a0_f9b8c805.jpg',
      highlights: [
        '5 kỹ năng Nghe Nói Đọc Viết Dịch',
        'Giáo trình Boya chuẩn Bắc Kinh',
        'Tặng tài khoản luyện HSK 3.0',
        'Tư vấn: 0378.105.999',
      ],
      hotline: '0378.105.999',
      ctaText: 'Khám phá bài học HSK',
    },
    {
      id: 'calligraphy-seal',
      badge: 'Tôn chỉ học tập truyền thống',
      title: '勤学好问 · Chuyên Cần Luyện HSK 3.0',
      subtitle: 'Giáo trình chuẩn · Luyện ngữ âm · Thẻ từ vựng · Đề thi thử tự chấm điểm',
      sealImage: '/assets/aistudio/mh_c19ddbdc.jpg',
      highlights: [
        'Nghe phát âm chuẩn bản xứ',
        'Chấm khẩu hình bằng AI',
        'Hơn 2.000 từ vựng & ngữ pháp',
        'Bộ đề thi sát đề thật',
      ],
      hotline: '0378.105.999',
      ctaText: 'Luyện Flashcard ngay',
    },
  ];

  useEffect(() => {
    if (isSlidePaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isSlidePaused, heroSlides.length]);

  // Homepage Interactive Flashcard Preview state
  const sampleVocab = vocabularies.slice(0, 6);
  const [previewCardIdx, setPreviewCardIdx] = useState(0);
  const [isPreviewFlipped, setIsPreviewFlipped] = useState(false);
  const activePreviewCard = sampleVocab[previewCardIdx] || {
    id: 'demo-1',
    word: '你好',
    pinyin: 'nǐ hǎo',
    sinoVietnamese: 'Nhĩ hảo',
    meaning: 'Xin chào',
    level: 'HSK 1' as HSKLevel,
    exampleSentence: '你好，很高兴认识你！',
    examplePinyin: 'Nǐ hǎo, hěn gāoxìng rènshi nǐ!',
    exampleMeaning: 'Xin chào, rất vui được làm quen với bạn!',
  };

  const sampleRadicals = [
    { char: '亻', pinyin: 'rén', sino: 'Nhân', meaning: 'Người, con người', ex: '你 (bạn), 他 (anh ấy)' },
    { char: '口', pinyin: 'kǒu', sino: 'Khẩu', meaning: 'Miệng, lời nói', ex: '吃 (ăn), 喝 (uống)' },
    { char: '氵', pinyin: 'shuǐ', sino: 'Thủy', meaning: 'Nước, chất lỏng', ex: '海 (biển), 洗 (rửa)' },
    { char: '木', pinyin: 'mù', sino: 'Mộc', meaning: 'Cây, gỗ', ex: '林 (rừng), 桌 (bàn)' },
    { char: '心', pinyin: 'xīn', sino: 'Tâm', meaning: 'Trái tim, tình cảm', ex: '想 (nghĩ), 念 (nhớ)' },
    { char: '讠', pinyin: 'yán', sino: 'Ngôn', meaning: 'Lời nói, ngôn ngữ', ex: '语 (ngữ), 说 (nói)' },
    { char: '女', pinyin: 'nǚ', sino: 'Nữ', meaning: 'Phụ nữ, mẹ', ex: '好 (tốt), 妈 (mẹ)' },
    { char: '日', pinyin: 'rì', sino: 'Nhật', meaning: 'Mặt trời, ban ngày', ex: '明 (sáng), 早 (sớm)' },
  ];

  const sampleStories = [
    {
      char: '休',
      pinyin: 'xiū',
      meaning: 'Nghỉ ngơi',
      story: 'Người (亻) đứng tựa lưng vào gốc cây (木) dưới bóng râm để nghỉ ngơi.',
      structure: '亻 (Nhân) + 木 (Mộc)',
    },
    {
      char: '明',
      pinyin: 'míng',
      meaning: 'Sáng sủa, thông minh',
      story: 'Mặt Trời (日) và Mặt Trăng (月) cùng tỏa sáng trên bầu trời.',
      structure: '日 (Nhật) + 月 (Nguyệt)',
    },
    {
      char: '好',
      pinyin: 'hǎo',
      meaning: 'Tốt đẹp, hay',
      story: 'Người Mẹ (女) ôm đứa con nhỏ (子) trong lòng, biểu trưng cho sự vẹn tròn.',
      structure: '女 (Nữ) + 子 (Tử)',
    },
    {
      char: '安',
      pinyin: 'ān',
      meaning: 'Bình an, yên ổn',
      story: 'Dưới mái nhà (宀) có người phụ nữ (女) chăm lo gia đình thì mọi sự bình an.',
      structure: '宀 (Miên) + 女 (Nữ)',
    },
  ];

  const testimonialScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollTestimonials = (direction: 'left' | 'right') => {
    if (!testimonialScrollRef.current) return;
    const scrollAmount = 420;
    testimonialScrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const testimonials = [
    {
      name: 'Nguyễn Minh Anh',
      role: 'Sinh viên ĐH Ngoại Thương · Đạt HSK 4 (268/300)',
      avatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      quote:
        'Trước đây mình rất sợ nhớ chữ Hán và hay sai thanh 3. Sau 40 buổi học lớp sĩ số nhỏ tại MiXiangg HSK kết hợp luyện phát âm AI mỗi tối, mình giao tiếp tự tin và vượt HSK 4 chỉ sau 5 tháng.',
      bgClass: 'bg-[#FFF5F3] border-red-200',
    },
    {
      name: 'Trần Hoàng Nam',
      role: 'Nhân viên xuất nhập khẩu · Đạt HSK 3 (280/300)',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      quote:
        'Giao diện chữ to rõ, Flashcard kèm chiết tự bộ thủ giúp mình học cực nhanh trên đường đi làm. Nhờ phòng thi thử bấm giờ giống hệt đề thật, lúc vào thi chính thức mình không còn bỡ ngỡ.',
      bgClass: 'bg-[#F0FDF9] border-teal-200',
    },
    {
      name: 'Lê Thu Hà',
      role: 'Học viên lớp Boya Online · HSK 2 lên HSK 4',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      quote:
        'Giáo viên sửa từng khẩu hình phát âm rất kỹ vì mỗi lớp chỉ tối đa 8 bạn. Lão Sư AI và diễn đàn giải đáp thắc mắc ngữ pháp giúp mình giữ chuỗi học liên tục hơn 60 ngày.',
      bgClass: 'bg-[#FFFBEB] border-amber-200',
    },
    {
      name: 'Đặng Tuấn Kiệt',
      role: 'Kỹ sư CNTT · Hoàn thành Giáo trình Boya Sơ cấp 1 & 2',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      quote:
        'Mình rất thích bộ Flashcard chia sẵn theo từng bài của Giáo trình Boya và trò chơi Mưa Từ Vựng 2D. Mỗi ngày chỉ cần ôn 20 từ trên web là nhớ mặt chữ Hán cực kỳ lâu.',
      bgClass: 'bg-[#EFF6FF] border-sky-200',
    },
    {
      name: 'Phạm Phương Thảo',
      role: 'Chuyên viên Thu mua Quốc tế · Đạt HSK 4 (276/300)',
      avatar:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
      quote:
        'Lộ trình học kết hợp giữa Giáo trình Boya và luyện đề HSK 3.0 tại MiXiangg rất thực tế. Mình áp dụng được ngay các mẫu câu đàm phán đơn hàng với đối tác Quảng Châu.',
      bgClass: 'bg-[#ECFDF5] border-emerald-200',
    },
    {
      name: 'Hoàng Minh Quân',
      role: 'Du học sinh Thạc sĩ · Chinh phục HSK 5 (265/300)',
      avatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      quote:
        'Kho thành ngữ tứ tự HSK 5 và phần chấm phát âm bằng AI giúp mình hoàn thiện cả kỹ năng viết luận lẫn khẩu ngữ học thuật trước khi sang Bắc Kinh nhập học.',
      bgClass: 'bg-[#FAF5FF] border-purple-200',
    },
  ];

  const courseCardThemes = [
    {
      kanji: '课一',
      gradient: 'from-red-600 to-rose-700',
      textAccent: 'text-amber-200',
    },
    {
      kanji: '课二',
      gradient: 'from-teal-700 to-cyan-800',
      textAccent: 'text-teal-100',
    },
    {
      kanji: '课三',
      gradient: 'from-amber-700 to-orange-800',
      textAccent: 'text-amber-100',
    },
    {
      kanji: '课四',
      gradient: 'from-emerald-700 to-green-900',
      textAccent: 'text-emerald-100',
    },
    {
      kanji: '课五',
      gradient: 'from-zinc-800 to-[#18181B]',
      textAccent: 'text-amber-300',
    },
  ];

  const handleNavigateWithAuth = (tab: string, level?: HSKLevel) => {
    if (level) setActiveLevel(level);
    if (!isAuthenticated) {
      onOpenGoogleAuth();
      return;
    }
    setActiveTab(tab);
  };

  const handleStartExamWithAuth = (exam: Exam) => {
    if (!isAuthenticated) {
      onOpenGoogleAuth();
      return;
    }
    setCurrentExam(exam);
    setActiveTab('exam-taking');
  };

  return (
    <div className="space-y-8 pb-4">
      {/* ========================================================= */}
      {/* 1. SLIDE GIỚI THIỆU + CÂU ĐỐI */}
      {/* ========================================================= */}
      <section aria-label="Slide giới thiệu">
        <div className="flex items-stretch justify-center select-none">
          {/* Slider trung tâm */}
          <div
            className="flex-1 rounded-3xl bg-gradient-to-br from-red-600 via-red-700 to-[#18181B] text-white shadow-lg relative overflow-hidden flex flex-col justify-between border border-red-500/70 min-h-[248px]"
            onMouseEnter={() => setIsSlidePaused(true)}
            onMouseLeave={() => setIsSlidePaused(false)}
          >
            {/* Top Bar */}
            <div className="relative z-10 p-5 sm:p-6 pb-2 flex items-start justify-between gap-3">
              <span className="inline-flex items-center gap-2.5 font-black text-amber-200 leading-tight">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-amber-300 shrink-0" />
                <span className="text-[19px] sm:text-[26px] lg:text-[27px] font-black leading-tight tracking-tight">
                  {heroSlides[currentSlide].badge}
                </span>
              </span>

              <div className="flex items-center gap-1.5 text-[13px] font-mono font-bold text-white/95 tabular-nums shrink-0 pt-1">
                <span>{currentSlide + 1}</span>
                <span className="text-white/45">/</span>
                <span>{heroSlides.length}</span>
              </div>
            </div>

            {/* Split Slide Content (2/3 nội dung bên trái - 1/3 ảnh slide bên phải) */}
            <div className="relative z-10 px-5 sm:px-7 py-4 flex-1 flex flex-col md:flex-row items-center justify-between gap-6 lg:gap-8">
              <div className="space-y-3.5 text-left w-full md:w-2/3 flex-1 min-w-0">
                <h1 className="font-serif text-[22px] sm:text-[29px] font-black text-white leading-tight text-balance">
                  {heroSlides[currentSlide].title}
                </h1>
                <p className="text-[19px] text-rose-50 leading-snug font-medium">
                  {heroSlides[currentSlide].subtitle}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-[18px] sm:text-[19px] text-amber-200 font-semibold">
                  {heroSlides[currentSlide].highlights.map((h, hIdx) => (
                    <span key={hIdx}>✓ {h}</span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => handleNavigateWithAuth('courses')}
                    className="px-5 py-3 rounded-xl bg-amber-300 hover:bg-amber-200 text-[#18181B] font-black text-[14px] sm:text-[16px] shadow-sm transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <span>{heroSlides[currentSlide].ctaText}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  {heroSlides[currentSlide].hotline && (
                    <a
                      href="tel:0378105999"
                      className="px-4 py-3 rounded-xl bg-black/35 hover:bg-black/55 border border-amber-300/60 text-amber-200 font-bold text-[14px] flex items-center gap-2 transition-colors"
                    >
                      <PhoneCall className="w-5 h-5 text-amber-300 shrink-0" />
                      <span className="tabular-nums">0378.105.999</span>
                    </a>
                  )}

                  {heroSlides[currentSlide].image && (
                    <button
                      type="button"
                      onClick={() => setActivePosterModal(heroSlides[currentSlide].image!)}
                      className="px-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-[14px] cursor-pointer transition-colors"
                    >
                      Xem poster
                    </button>
                  )}
                </div>
              </div>

              {/* Right Thumbnail (Chiếm 1/3 diện tích chiều ngang của Slide) */}
              <div className="w-full max-w-[240px] md:max-w-none md:w-1/3 shrink-0 relative">
                {heroSlides[currentSlide].image ? (
                  <button
                    type="button"
                    onClick={() => setActivePosterModal(heroSlides[currentSlide].image!)}
                    className="relative w-full cursor-pointer transition-transform hover:scale-[1.02] block"
                    title="Bấm để xem ảnh phóng to đầy đủ"
                  >
                    <img
                      src={heroSlides[currentSlide].image}
                      alt={heroSlides[currentSlide].title}
                      referrerPolicy="no-referrer"
                      className="w-full aspect-square object-cover rounded-2xl border-2 border-amber-300/80 shadow-xl bg-white"
                    />
                  </button>
                ) : heroSlides[currentSlide].sealImage ? (
                  <div
                    onClick={() => setActivePosterModal(heroSlides[currentSlide].sealImage!)}
                    className="w-full aspect-square rounded-2xl bg-white border-2 border-amber-300/80 shadow-xl overflow-hidden flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.02]"
                    title="Bấm để xem ảnh phóng to đầy đủ"
                  >
                    <img
                      src={heroSlides[currentSlide].sealImage}
                      alt={heroSlides[currentSlide].title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="relative z-10 p-4 flex items-center justify-between gap-2 border-t border-white/15 bg-black/20">
              <button
                type="button"
                onClick={() =>
                  setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
                }
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                aria-label="Slide trước"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5">
                {heroSlides.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setCurrentSlide(dotIdx)}
                    aria-label={`Chuyển tới slide ${dotIdx + 1}`}
                    className={`h-2.5 rounded-full transition-all cursor-pointer ${
                      currentSlide === dotIdx
                        ? 'w-8 bg-amber-300'
                        : 'w-2.5 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                aria-label="Slide kế tiếp"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* KHỐI NỘI DUNG LIỀN MẠCH · TIÊU ĐỀ CĂN GIỮA · ĐA SẮC TƯƠI TRẺ */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-[#E8DFCE] shadow-xs overflow-hidden divide-y divide-[#EFE7D6]">
        {/* 2. DANH SÁCH KHÓA HỌC (THẺ ĐA SẮC NHƯ MẪU + BỎ MÔ TẢ DƯỚI THẺ) */}
        <section aria-labelledby="section-courses" className="p-6 sm:p-8 space-y-6 bg-white">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="inline-flex items-center justify-center gap-2">
              <span className="w-1.5 h-7 rounded-full bg-red-600" />
              <h2
                id="section-courses"
                className="font-serif text-[22px] sm:text-[27px] font-black text-[#18181B] tracking-tight"
              >
                Danh sách khóa học <span className="text-red-600">新HSK教程</span>
              </h2>
            </div>
            <p className="text-[19px] text-slate-600 leading-relaxed">
              Chọn cấp độ để vào xem chi tiết giáo trình, bài giảng và bài tập luyện tập
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => handleNavigateWithAuth('courses')}
                className="inline-flex items-center gap-1.5 text-[16px] font-extrabold text-red-600 hover:text-red-700 cursor-pointer"
              >
                <span>Xem tất cả khóa học</span>
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {courses.slice(0, 4).map((course, idx) => {
              const theme = courseCardThemes[idx % courseCardThemes.length];
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => handleNavigateWithAuth('courses', course.level)}
                  className={`group relative overflow-hidden p-6 sm:p-7 rounded-3xl text-left border-2 border-white/25 hover:border-amber-300/75 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.015] hover:brightness-105 cursor-pointer flex flex-col justify-between min-h-[160px] bg-gradient-to-br ${theme.gradient} text-white shadow-md hover:shadow-xl`}
                >
                  {/* Decorative translucent circle watermark like reference design */}
                  <div className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-300 ease-out pointer-events-none" />

                  <div className="relative z-10 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-calligraphy text-[30px] leading-none text-white">
                        {theme.kanji}
                      </span>
                      <span className="px-3 py-1 rounded-xl bg-black/25 font-mono font-bold text-[14px] text-white tabular-nums">
                        {course.level}
                      </span>
                    </div>

                    <h3 className="font-serif text-[21px] sm:text-[22px] font-black leading-snug text-white pt-1">
                      {course.vietnameseTitle}
                    </h3>
                  </div>

                  <div className="relative z-10 pt-4 mt-4 border-t border-white/20 flex items-center justify-between text-[14px] font-bold">
                    <span className={`${theme.textAccent} font-mono tabular-nums`}>
                      {course.lessons.length} bài · {course.targetVocabCount} từ
                    </span>
                    <span className="inline-flex items-center gap-1 text-white font-extrabold group-hover:translate-x-0.5 transition-transform duration-300 ease-out">
                      <span>Vào học</span>
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2B. ĐỀ THI THỬ HSK NỔI BẬT (FLOAT-UP + VIỀN ẤM BÁN TRONG SUỐT KHI HOVER) */}
        <section aria-labelledby="section-exams" className="p-6 sm:p-8 space-y-6 bg-[#FFFBF4]">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="inline-flex items-center justify-center gap-2">
              <span className="w-1.5 h-7 rounded-full bg-amber-500" />
              <h2
                id="section-exams"
                className="font-serif text-[22px] sm:text-[27px] font-black text-[#18181B] tracking-tight"
              >
                Đề thi thử chuẩn <span className="text-red-600">模拟考试</span>
              </h2>
            </div>
            <p className="text-[19px] text-slate-600 leading-relaxed">
              Chọn bộ đề theo cấp độ để bấm giờ làm bài và chấm điểm tự động ngay lập tức
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => handleNavigateWithAuth('exams')}
                className="inline-flex items-center gap-1.5 text-[16px] font-extrabold text-red-600 hover:text-red-700 cursor-pointer"
              >
                <span>Xem tất cả đề thi</span>
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {exams.slice(0, 4).map((exam) => (
              <button
                key={exam.id}
                type="button"
                onClick={() => handleStartExamWithAuth(exam)}
                className="group relative overflow-hidden p-6 sm:p-7 rounded-3xl text-left bg-white hover:bg-[#FFF6F2] border-2 border-[#E8DFCE] hover:border-amber-500/70 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.015] shadow-sm hover:shadow-xl cursor-pointer flex flex-col justify-between min-h-[152px]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-[14px] font-bold">
                    <span className="inline-flex items-center gap-1.5 text-red-600 font-black">
                      <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
                      <span>{exam.level}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-600 font-mono tabular-nums">
                      <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>{exam.timeLimitMinutes} phút</span>
                    </span>
                  </div>

                  <h3 className="font-serif text-[21px] sm:text-[22px] font-black leading-snug text-[#18181B] group-hover:text-red-700 transition-colors duration-300 ease-out">
                    {exam.title}
                  </h3>
                </div>

                <div className="pt-4 mt-4 border-t border-[#EFE7D6] flex items-center justify-between text-[14px] font-bold">
                  <span className="text-slate-600 font-mono tabular-nums">
                    {exam.questions.length} câu · Đạt {exam.passScore}/{exam.totalPoints}
                  </span>
                  <span className="inline-flex items-center gap-1 text-red-600 font-extrabold group-hover:translate-x-0.5 transition-transform duration-300 ease-out">
                    <span>Thi thử</span>
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 3. LUYỆN NGỮ ÂM (NỀN PASTEL XANH MINT NHẸ) */}
        <section aria-labelledby="section-phonetics" className="p-6 sm:p-8 space-y-6 bg-[#ECFDF5]">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="inline-flex items-center justify-center gap-2">
              <span className="w-1.5 h-7 rounded-full bg-amber-500" />
              <h2
                id="section-phonetics"
                className="font-serif text-[22px] sm:text-[27px] font-black text-[#18181B] tracking-tight"
              >
                Luyện ngữ âm <span className="text-red-600">语音练习</span>
              </h2>
            </div>
            <p className="text-[19px] text-slate-600 leading-relaxed">
              Chạm vào từng thanh điệu hoặc mở bảng Pinyin đầy đủ để nghe phát âm chuẩn Bắc Kinh
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setActivePinyinModal(true)}
                className="px-5 py-2.5 rounded-xl bg-[#18181B] hover:bg-red-600 text-white font-bold text-[15px] inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Mở bảng Pinyin đầy đủ</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                tone: 'mā',
                name: 'Thanh 1',
                desc: 'Ngân cao ngang',
                cardBg: 'from-rose-500 to-red-600',
              },
              {
                tone: 'má',
                name: 'Thanh 2',
                desc: 'Đi lên rõ nét',
                cardBg: 'from-amber-500 to-orange-600',
              },
              {
                tone: 'mǎ',
                name: 'Thanh 3',
                desc: 'Xuống rồi lên',
                cardBg: 'from-teal-500 to-emerald-600',
              },
              {
                tone: 'mà',
                name: 'Thanh 4',
                desc: 'Dứt khoát xuống',
                cardBg: 'from-sky-600 to-blue-700',
              },
            ].map((item) => (
              <button
                key={item.tone}
                type="button"
                onClick={() => speakChinese(item.tone)}
                className={`p-5 rounded-2xl bg-gradient-to-br ${item.cardBg} text-white text-left transition-all duration-200 hover:scale-[1.03] hover:brightness-105 cursor-pointer space-y-1 shadow-sm hover:shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[26px] font-black text-amber-200">
                    {item.tone}
                  </span>
                  <Volume2 className="w-6 h-6 text-white/90" />
                </div>
                <div className="text-[16px] font-extrabold text-white">{item.name}</div>
                <div className="text-[13px] text-white/90">{item.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* 4. FLASHCARD TỪ VỰNG (NỀN PASTEL HỒNG NHẠT + CHỮ HÁN CỠ LỚN) */}
        <section aria-labelledby="section-flashcards" className="p-6 sm:p-8 space-y-6 bg-[#FFF1F2]">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="inline-flex items-center justify-center gap-2">
              <span className="w-1.5 h-7 rounded-full bg-teal-600" />
              <h2
                id="section-flashcards"
                className="font-serif text-[22px] sm:text-[27px] font-black text-[#18181B] tracking-tight"
              >
                Flashcard từ vựng <span className="text-red-600">生词卡片</span>
              </h2>
            </div>
            <p className="text-[19px] text-slate-600 leading-relaxed">
              Chạm vào thẻ để lật xem nghĩa tiếng Việt, Hán Việt và ví dụ giao tiếp cỡ chữ lớn
            </p>
          </div>

          {/* Interactive 3D Flip Preview */}
          <div className="max-w-2xl mx-auto space-y-3">
            <div
              onClick={() => setIsPreviewFlipped(!isPreviewFlipped)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsPreviewFlipped(!isPreviewFlipped);
                }
              }}
              className="relative h-[290px] w-full cursor-pointer perspective-1000 select-none"
            >
              <div
                className="relative w-full h-full rounded-3xl transition-transform duration-500 transform-style-3d shadow-sm"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isPreviewFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 w-full h-full rounded-3xl bg-[#FDFBF6] border-2 border-[#E8DFCE] hover:border-red-500 p-6 flex flex-col justify-between items-center text-center backface-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="w-full flex items-center justify-between text-[14px] text-slate-500 font-bold">
                    <span className="text-red-600">{activePreviewCard.level}</span>
                    <span>Chạm thẻ để lật</span>
                  </div>

                  <div className="my-auto space-y-2">
                    <div className="font-serif text-[59px] sm:text-[70px] font-black text-[#18181B] leading-none">
                      {activePreviewCard.word}
                    </div>
                    <div className="text-[22px] font-mono font-extrabold text-red-600">
                      {activePreviewCard.pinyin}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakChinese(activePreviewCard.word);
                    }}
                    className="px-5 py-2 rounded-xl bg-white hover:bg-red-600 hover:text-white border border-[#E8DFCE] text-[#18181B] font-bold text-[14px] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                    <span>Nghe phát âm</span>
                  </button>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-br from-[#18181B] to-red-950 text-white border-2 border-red-600 p-6 flex flex-col justify-between backface-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <div className="flex items-center justify-between text-[14px] text-amber-300 font-bold">
                    <span className="font-mono">{activePreviewCard.pinyin}</span>
                    <span>Hán Việt: {activePreviewCard.sinoVietnamese || '-'}</span>
                  </div>

                  <div className="my-auto space-y-3 text-center">
                    <div className="font-serif text-[26px] font-black text-white leading-tight">
                      {activePreviewCard.meaning}
                    </div>
                    <p className="text-[19px] text-stone-100 font-medium">
                      {activePreviewCard.exampleSentence}
                    </p>
                    <p className="text-[14px] text-stone-300">
                      {activePreviewCard.exampleMeaning}
                    </p>
                  </div>

                  <div className="text-center text-[13px] text-stone-300">
                    Chạm lại để quay về mặt trước
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsPreviewFlipped(false);
                  setPreviewCardIdx((prev) => (prev - 1 + sampleVocab.length) % sampleVocab.length);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#FDFBF6] border border-[#E8DFCE] hover:border-red-500 text-[#18181B] font-bold text-[14px] flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Thẻ trước</span>
              </button>

              <span className="font-mono text-[14px] font-bold text-slate-700 tabular-nums">
                {previewCardIdx + 1} / {sampleVocab.length}
              </span>

              <button
                type="button"
                onClick={() => {
                  setIsPreviewFlipped(false);
                  setPreviewCardIdx((prev) => (prev + 1) % sampleVocab.length);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#FDFBF6] border border-[#E8DFCE] hover:border-red-500 text-[#18181B] font-bold text-[14px] flex items-center gap-1.5 cursor-pointer"
              >
                <span>Thẻ sau</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 3 Stacked Full-Width Vibrant Gradient Bars (matching the layout structure of the reference image) */}
          <div className="space-y-4 pt-2">
            <button
              type="button"
              onClick={() => handleNavigateWithAuth('vocab')}
              className="w-full p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-600 to-sky-600 hover:brightness-105 text-white text-left transition-all cursor-pointer flex items-center gap-4 shadow-sm"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center shrink-0">
                <RotateCw className="w-7 h-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-[21px] font-black leading-tight text-white">
                  Kho Flashcard HSK 1–5
                </h3>
                <p className="text-[19px] text-cyan-50 mt-0.5 leading-snug">
                  Chữ cực lớn, lật thẻ 3D và ghi nhớ theo chu kỳ lặp lại thông minh
                </p>
              </div>
              <ChevronRight className="w-7 h-7 shrink-0 text-white" />
            </button>

            <button
              type="button"
              onClick={() => setActiveRadicalModal(true)}
              className="w-full p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:brightness-105 text-white text-left transition-all cursor-pointer flex items-center gap-4 shadow-sm"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/25 font-calligraphy text-[27px] text-white flex items-center justify-center shrink-0">
                部
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-[21px] font-black leading-tight text-white">
                  214 Bộ Thủ Chữ Hán
                </h3>
                <p className="text-[19px] text-amber-50 mt-0.5 leading-snug">
                  Nhận diện mặt chữ qua gốc bộ thủ và nghe đọc phát âm mẫu
                </p>
              </div>
              <ChevronRight className="w-7 h-7 shrink-0 text-white" />
            </button>

            <button
              type="button"
              onClick={() => setActiveHanziStoryModal(true)}
              className="w-full p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-[#18181B] hover:brightness-105 text-white text-left transition-all cursor-pointer flex items-center gap-4 shadow-sm"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/25 font-calligraphy text-[27px] text-white flex items-center justify-center shrink-0">
                字
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-[21px] font-black leading-tight text-white">
                  Câu Chuyện Chiết Tự
                </h3>
                <p className="text-[19px] text-rose-50 mt-0.5 leading-snug">
                  Hiểu nguồn gốc tượng hình song ngữ để nhớ chữ Hán trọn đời
                </p>
              </div>
              <ChevronRight className="w-7 h-7 shrink-0 text-white" />
            </button>
          </div>
        </section>

        {/* 4B. THẺ GIỚI THIỆU NHANH: TRÒ CHƠI ÔN TỪ VỰNG 2D */}
        <section aria-labelledby="section-games" className="p-6 sm:p-8 space-y-5 bg-[#FAF7F0]">
          <div className="rounded-3xl bg-gradient-to-br from-[#18181B] via-[#3B1117] to-red-700 text-white p-6 sm:p-8 border-2 border-red-500/60 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-[14px] font-bold text-amber-300">
                <Gamepad2 className="w-6 h-6 shrink-0" />
                <span>Mini-Game 2D siêu nhẹ · 趣味学习</span>
              </div>
              <h2
                id="section-games"
                className="font-serif text-[22px] sm:text-[27px] font-black text-white leading-tight"
              >
                Mưa Từ Vựng 2D & Ghép Cặp Hán – Việt
              </h2>
              <p className="text-[19px] text-rose-50 leading-snug">
                Chọn chế độ <strong>Bấm 4 đáp án</strong> hoặc <strong>Gõ Pinyin</strong> trước khi chơi, tự động lưu kỷ lục và đồng bộ phút học vào hồ sơ.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleNavigateWithAuth('games')}
                className="px-6 py-4 rounded-2xl bg-amber-300 hover:bg-amber-200 text-[#18181B] font-black text-[16px] flex items-center justify-center gap-2.5 shadow-sm transition-transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Gamepad2 className="w-6 h-6 shrink-0" />
                <span>Chơi ngay tại Trò chơi</span>
                <ArrowRight className="w-5 h-5 shrink-0" />
              </button>
            </div>
          </div>
        </section>

        {/* 5. GIỚI THIỆU VỀ MIXIANGG HSK (NỀN PASTEL VÀNG NHẠT - ẢNH TRÁI, GIỚI THIỆU PHẢI) */}
        <section aria-labelledby="section-about" className="p-6 sm:p-8 space-y-6 bg-[#FEFCE8]">
          <div className="flex flex-col md:flex-row items-center gap-6 lg:gap-8">
            <div className="w-full max-w-[260px] sm:max-w-[240px] md:w-[270px] lg:w-[310px] aspect-square rounded-3xl bg-white border-2 border-red-600 p-2 flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
              <img
                src="/assets/aistudio/image_f2d52981.png"
                alt="Giới thiệu về MiXiangg HSK"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>

            <div className="flex-1 text-center md:text-left space-y-3 min-w-0">
              <div className="inline-flex items-center justify-center md:justify-start gap-2">
                <span className="w-1.5 h-7 rounded-full bg-red-600" />
                <h2
                  id="section-about"
                  className="font-serif text-[22px] sm:text-[27px] font-black text-[#18181B]"
                >
                  Giới thiệu về <span className="text-red-600">MiXiangg HSK</span>
                </h2>
              </div>
              <p className="text-[19px] text-slate-700 leading-relaxed">
                MiXiangg HSK là trung tâm đào tạo tiếng Trung kết hợp nền tảng công nghệ luyện thi HSK 3.0 hiện đại, giảng dạy theo giáo trình Boya chuẩn mực với cam kết đầu ra vững vàng cả 5 kỹ năng: Nghe – Nói – Đọc – Viết – Dịch.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-amber-200 font-black text-[21px] tabular-nums">
                <Users className="w-6 h-6 shrink-0" />
                <span>Tối đa 8 HV</span>
              </div>
              <p className="text-[19px] text-rose-50 font-medium leading-snug">
                Sĩ số lớp nhỏ giúp giảng viên kèm cặp phát âm từng người.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-700 to-cyan-800 text-white space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-teal-100 font-black text-[21px] tabular-nums">
                <Award className="w-6 h-6 shrink-0" />
                <span>Chuẩn HSK 3.0</span>
              </div>
              <p className="text-[19px] text-cyan-50 font-medium leading-snug">
                Lộ trình 40 buổi đạt giao tiếp cơ bản và chứng chỉ HSK 3+.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 text-white space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-amber-100 font-black text-[21px]">
                <Globe className="w-6 h-6 shrink-0" />
                <span>Online & Offline</span>
              </div>
              <p className="text-[19px] text-amber-50 font-medium leading-snug">
                Linh hoạt hình thức học trực tiếp hoặc tương tác trực tuyến.
              </p>
            </div>
          </div>
        </section>

        {/* 6. CẢM NHẬN CỦA HỌC VIÊN (LIST NGANG + ẢNH ĐẠI DIỆN + THANH SCROLL NGANG) */}
        <section aria-labelledby="section-testimonials" className="p-6 sm:p-8 space-y-6 bg-white">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="inline-flex items-center justify-center gap-2">
              <span className="w-1.5 h-7 rounded-full bg-red-600" />
              <h2
                id="section-testimonials"
                className="font-serif text-[22px] sm:text-[27px] font-black text-[#18181B] tracking-tight"
              >
                Cảm nhận của học viên
              </h2>
            </div>
            <p className="text-[19px] text-slate-600 leading-relaxed">
              Chia sẻ thực tế từ các học viên đã hoàn thành lộ trình Boya và chinh phục chứng chỉ HSK
            </p>
          </div>

          {/* Điều hướng nhanh & chỉ dẫn cuộn ngang */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[14px] font-bold text-slate-600">
              Vuốt hoặc kéo thanh cuộn ngang bên dưới để xem tất cả ({testimonials.length} học viên)
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => scrollTestimonials('left')}
                aria-label="Xem cảm nhận trước"
                className="w-11 h-11 rounded-xl border border-[#E8DFCE] bg-[#FDFBF6] hover:bg-red-600 hover:text-white hover:border-red-600 text-[#18181B] flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={() => scrollTestimonials('right')}
                aria-label="Xem cảm nhận tiếp theo"
                className="w-11 h-11 rounded-xl border border-[#E8DFCE] bg-[#FDFBF6] hover:bg-red-600 hover:text-white hover:border-red-600 text-[#18181B] flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Horizontal Scrollable List of Student Testimonials */}
          <div
            ref={testimonialScrollRef}
            className="flex flex-nowrap items-stretch gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: 'auto' }}
          >
            {testimonials.map((t, idx) => (
              <article
                key={idx}
                className={`w-[320px] sm:w-[390px] lg:w-[420px] shrink-0 snap-start p-6 rounded-3xl border-2 flex flex-col justify-between gap-4 shadow-xs hover:shadow-md transition-all duration-200 ${t.bgClass}`}
              >
                {/* Header: Student Avatar + Name + Role */}
                <div className="flex items-center gap-4 pb-3 border-b border-black/10">
                  <img
                    src={t.avatar}
                    alt={`Ảnh đại diện học viên ${t.name}`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = `data:image/svg+xml;utf8,${encodeURIComponent(
                        `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="#DC2626"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="36" font-weight="bold">${t.name
                          .split(' ')
                          .slice(-1)[0]
                          .charAt(0)}</text></svg>`
                      )}`;
                    }}
                    className="w-16 h-16 rounded-full object-cover border-2 border-red-600 shadow-xs shrink-0 bg-white"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[18px] font-black text-[#18181B] truncate">
                      {t.name}
                    </h3>
                    <p className="text-[14px] font-bold text-red-700 leading-snug line-clamp-2 mt-0.5">
                      {t.role}
                    </p>
                  </div>
                </div>

                {/* Quote Body */}
                <div className="flex items-start gap-3 my-auto">
                  <Quote className="w-7 h-7 text-red-600 shrink-0 mt-1" />
                  <p className="text-[16px] sm:text-[18px] text-[#18181B] leading-relaxed font-medium">
                    "{t.quote}"
                  </p>
                </div>

                {/* Footer Star Rating */}
                <div className="pt-2 flex items-center justify-between text-[13px] font-bold text-slate-600">
                  <span>Học viên MiXiangg HSK</span>
                  <span className="text-amber-500 tracking-wider" aria-label="5 trên 5 sao">
                    ★★★★★
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 7. DIỄN ĐÀN (TIÊU ĐỀ GIỮA) */}
        <section aria-labelledby="section-forum" className="p-6 sm:p-8 space-y-6 bg-[#FFF5F3]">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="inline-flex items-center justify-center gap-2">
              <span className="w-1.5 h-7 rounded-full bg-rose-600" />
              <h2
                id="section-forum"
                className="font-serif text-[22px] sm:text-[27px] font-black text-[#18181B] tracking-tight"
              >
                Diễn đàn hỏi đáp HSK
              </h2>
            </div>
            <p className="text-[19px] text-slate-600 leading-relaxed">
              Thảo luận ngữ pháp, cách dùng từ và kinh nghiệm luyện đề cùng giảng viên và Lão Sư AI
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => handleNavigateWithAuth('forum')}
                className="inline-flex items-center gap-1.5 text-[16px] font-extrabold text-red-600 hover:text-red-700 cursor-pointer"
              >
                <span>Vào diễn đàn</span>
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {forumPosts.slice(0, 3).map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => handleNavigateWithAuth('forum')}
                className="w-full p-6 rounded-2xl bg-white border border-red-200/80 hover:border-red-500 text-left transition-colors cursor-pointer space-y-2.5 block shadow-2xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-[14px] text-slate-600 font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#18181B]">{post.authorName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-red-600 font-bold">{post.level}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.category}</span>
                  </div>
                  {post.isSolved && (
                    <span className="inline-flex items-center gap-1 text-teal-700 font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Đã giải đáp</span>
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-[21px] font-black text-[#18181B] leading-snug">
                  {post.title}
                </h3>

                <p className="text-[19px] text-slate-700 leading-relaxed line-clamp-2">
                  {post.content}
                </p>

                <div className="flex items-center gap-6 pt-1 text-[14px] font-bold text-slate-600 tabular-nums">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-5 h-5 text-red-600" />
                    <span>{post.repliesCount} phản hồi</span>
                  </span>
                  <span>{post.likes} lượt thích</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* ========================================================= */}
      {/* INTERACTIVE MODAL: 214 BỘ THỦ CHỮ HÁN */}
      {/* ========================================================= */}
      {activeRadicalModal && (
        <div
          onClick={() => setActiveRadicalModal(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto border-2 border-[#E8DFCE]"
          >
            <button
              type="button"
              onClick={() => setActiveRadicalModal(false)}
              aria-label="Đóng"
              className="absolute top-5 right-5 p-2 rounded-full text-slate-500 hover:text-red-600 hover:bg-[#FFF5F3] cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <span className="w-12 h-12 rounded-2xl bg-[#18181B] text-amber-300 font-calligraphy text-[24px] flex items-center justify-center">
                部
              </span>
              <div>
                <h3 className="font-serif font-black text-[21px] text-[#18181B]">
                  Bộ Thủ Tiếng Trung Thường Gặp
                </h3>
                <p className="text-[16px] text-slate-600">Chìa khóa ghi nhớ nhanh chữ Hán</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sampleRadicals.map((rad, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-[#E8DFCE] bg-[#FDFBF6] flex items-start justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-[32px] font-black text-red-600 leading-none">
                      {rad.char}
                    </span>
                    <div>
                      <div className="text-[18px] font-bold text-[#18181B]">
                        {rad.pinyin}{' '}
                        <span className="text-[14px] text-slate-500">({rad.sino})</span>
                      </div>
                      <p className="text-[16px] font-semibold text-slate-700">{rad.meaning}</p>
                      <p className="text-[13px] text-slate-500 mt-0.5">{rad.ex}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => speakChinese(`${rad.char}, ${rad.pinyin}`)}
                    className="p-2 rounded-xl text-red-600 hover:bg-white cursor-pointer"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-6 h-6" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* INTERACTIVE MODAL: CÂU CHUYỆN CHỮ HÁN */}
      {/* ========================================================= */}
      {activeHanziStoryModal && (
        <div
          onClick={() => setActiveHanziStoryModal(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto border-2 border-[#E8DFCE]"
          >
            <button
              type="button"
              onClick={() => setActiveHanziStoryModal(false)}
              aria-label="Đóng"
              className="absolute top-5 right-5 p-2 rounded-full text-slate-500 hover:text-red-600 hover:bg-[#FFF5F3] cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <span className="w-12 h-12 rounded-2xl bg-red-600 text-white font-calligraphy text-[24px] flex items-center justify-center">
                字
              </span>
              <div>
                <h3 className="font-serif font-black text-[21px] text-[#18181B]">
                  Câu Chuyện Chiết Tự Chữ Hán
                </h3>
                <p className="text-[16px] text-slate-600">
                  Hiểu nguồn gốc tượng hình để nhớ chữ lâu dài
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {sampleStories.map((story, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-[#E8DFCE] bg-[#FDFBF6] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-3">
                      <span className="font-serif text-[34px] font-black text-red-600 leading-none">
                        {story.char}
                      </span>
                      <span className="font-mono font-bold text-[19px] text-[#18181B]">
                        {story.pinyin}
                      </span>
                      <span className="text-[18px] font-bold text-slate-700">
                        · {story.meaning}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => speakChinese(`${story.char}, ${story.pinyin}`)}
                      className="p-2 rounded-xl text-red-600 hover:bg-white cursor-pointer"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-6 h-6" />
                    </button>
                  </div>

                  <p className="text-[18px] text-[#18181B] leading-relaxed">{story.story}</p>
                  <p className="text-[14px] font-mono font-bold text-slate-600">
                    Cấu tạo: {story.structure}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* INTERACTIVE MODAL: LUYỆN NGỮ ÂM PINYIN */}
      {/* ========================================================= */}
      {activePinyinModal && (
        <div
          onClick={() => setActivePinyinModal(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto border-2 border-[#E8DFCE]"
          >
            <button
              type="button"
              onClick={() => setActivePinyinModal(false)}
              aria-label="Đóng"
              className="absolute top-5 right-5 p-2 rounded-full text-slate-500 hover:text-red-600 hover:bg-[#FFF5F3] cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <span className="w-12 h-12 rounded-2xl bg-[#18181B] text-amber-300 font-calligraphy text-[24px] flex items-center justify-center">
                音
              </span>
              <div>
                <h3 className="font-serif font-black text-[21px] text-[#18181B]">
                  Bảng Thanh Mẫu & Thanh Điệu Pinyin
                </h3>
                <p className="text-[16px] text-slate-600">Bấm vào từng âm để nghe giọng đọc chuẩn</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="text-[18px] font-black text-[#18181B] mb-3">
                  1. Thanh mẫu (Phụ âm)
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                  {[
                    'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r',
                  ].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => speakChinese(p)}
                      className="p-3 rounded-xl border border-[#E8DFCE] bg-[#FDFBF6] hover:bg-red-600 hover:text-white font-mono font-black text-[19px] text-[#18181B] transition-colors cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[18px] font-black text-[#18181B] mb-3">
                  2. Bốn thanh điệu cơ bản
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { t: 'mā', desc: 'Thanh 1 (Ngang)' },
                    { t: 'má', desc: 'Thanh 2 (Đi lên)' },
                    { t: 'mǎ', desc: 'Thanh 3 (Võng xuống)' },
                    { t: 'mà', desc: 'Thanh 4 (Dứt khoát)' },
                  ].map((tone) => (
                    <button
                      key={tone.t}
                      type="button"
                      onClick={() => speakChinese(tone.t)}
                      className="p-4 rounded-2xl border border-[#E8DFCE] bg-[#FDFBF6] hover:bg-red-600 hover:text-white flex flex-col items-center gap-1 transition-colors cursor-pointer group"
                    >
                      <span className="font-mono text-[24px] font-black text-red-600 group-hover:text-amber-300">
                        {tone.t}
                      </span>
                      <span className="text-[13px] font-bold text-slate-600 group-hover:text-white text-center">
                        {tone.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL PHÓNG TO POSTER TUYỂN SINH */}
      {/* ========================================================= */}
      {activePosterModal && (
        <div
          onClick={() => setActivePosterModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-red-600 p-4 space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-serif font-bold text-[16px]">
                  汉
                </span>
                <h4 className="font-serif font-black text-[19px] text-[#18181B]">
                  Thông Tin Tuyển Sinh MiXiangg HSK
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActivePosterModal(null)}
                className="p-2 rounded-full text-slate-500 hover:text-red-600 hover:bg-[#FFF5F3] cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-[#E8DFCE]">
              <img
                src={activePosterModal}
                alt="Poster tuyển sinh chi tiết"
                className="w-full h-auto object-contain rounded-xl"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[#FDFBF6] rounded-2xl border border-[#E8DFCE]">
              <div className="flex items-center gap-2 text-[16px] font-bold text-[#18181B]">
                <PhoneCall className="w-5 h-5 text-red-600" />
                <span>
                  Hotline: <strong className="text-red-600 tabular-nums">0378.105.999</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="tel:0378105999"
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[14px]"
                >
                  Gọi ngay
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setActivePosterModal(null);
                    handleNavigateWithAuth('courses');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#18181B] hover:bg-black text-white font-bold text-[14px] cursor-pointer"
                >
                  Xem khóa học
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

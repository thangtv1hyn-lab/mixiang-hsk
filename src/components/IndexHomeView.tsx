import React, { useState, useEffect } from 'react';
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
  Check,
  Trophy,
  Play,
  RotateCcw,
  X,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  PhoneCall,
  Headphones,
  Gamepad2,
  BookMarked,
  FileQuestion,
  Lock,
  Mic,
  Camera,
  Coins,
  Smile,
  Crown,
  Medal,
  TrendingUp,
} from 'lucide-react';
import { useHSK } from '../context/HSKContext';
import { speakChinese } from '../utils/audioSpeech';
import confetti from 'canvas-confetti';
import { HSKLevel } from '../types/hsk';

interface IndexHomeViewProps {
  onOpenGoogleAuth: () => void;
}

export const IndexHomeView: React.FC<IndexHomeViewProps> = ({ onOpenGoogleAuth }) => {
  const {
    setActiveTab,
    setActiveLevel,
    isAuthenticated,
    currentUser,
    courses,
    vocabularies,
  } = useHSK();

  // Daily Tasks state
  const [tasks, setTasks] = useState({
    task1: false,
    task2: false,
    task3: false,
  });

  // Modals for interactive exploration
  const [activeGameModal, setActiveGameModal] = useState<string | null>(null);
  const [activeRadicalModal, setActiveRadicalModal] = useState(false);
  const [activeHanziStoryModal, setActiveHanziStoryModal] = useState(false);
  const [activePinyinModal, setActivePinyinModal] = useState(false);

  // Hero Carousel / Slides State (3 authentic slides: Boya Red, Boya Black, Brand Banner)
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSlidePaused, setIsSlidePaused] = useState(false);
  const [activePosterModal, setActivePosterModal] = useState<string | null>(null);

  const heroSlides = [
    {
      id: 'boya-red',
      title: 'Tuyển sinh Lớp Học Tiếng Trung Cơ Bản - Boya',
      image: '/assets/aistudio/1794493556654_2645543663410262361_g4922351168579610784_e99743bc4875704f02020ec30504d074_7a96f4ba.jpg',
    },
    {
      id: 'boya-black',
      title: 'Tuyển sinh Khóa Học Tiếng Trung Dành Cho Người Mới Bắt Đầu - Boya',
      image: '/assets/aistudio/1794493556657_2645543663410262361_g4922351168579610784_dce6dc1e88bf0bec69888aec30c627a0_f9b8c805.jpg',
    },
    {
      id: 'brand-banner',
      title: 'MIXIANGG HSK · CHINESE LEARNING · 汉语学习',
      image: '/assets/aistudio/banner_d01a30da.jpg',
    },
  ];

  useEffect(() => {
    if (isSlidePaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isSlidePaused, heroSlides.length]);

  // Leaderboard timeframe: 'today' | 'week' | 'month'
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<'today' | 'week' | 'month'>('today');

  const leaderboardData = {
    today: [
      { rank: 1, name: 'Nguyễn Mỹ Linh (Cô Linh)', score: 380, level: 'HSK 4', title: 'Trạng nguyên', avatar: '👩‍🏫', isCurrentUser: false },
      { rank: 2, name: 'Lê Tuấn Kiệt', score: 320, level: 'HSK 3', title: 'Bảng nhãn', avatar: '🧑‍🎓', isCurrentUser: false },
      { rank: 3, name: 'Hoàng Mai Anh', score: 290, level: 'HSK 3', title: 'Thám hoa', avatar: '👩', isCurrentUser: false },
      { rank: 4, name: 'Đặng Quốc Bảo', score: 240, level: 'HSK 2', title: 'Cử nhân', avatar: '👨‍💼', isCurrentUser: false },
      { rank: 5, name: 'Trần Phương Thảo', score: 210, level: 'HSK 2', title: 'Tú tài', avatar: '👧', isCurrentUser: false },
      { rank: 6, name: 'Phạm Minh Đức', score: 180, level: 'HSK 1', title: 'Tú tài', avatar: '👦', isCurrentUser: false },
      { rank: 7, name: 'Vũ Hải Yến', score: 150, level: 'HSK 1', title: 'Đồng sinh', avatar: '👩‍🦰', isCurrentUser: false },
      { rank: 8, name: currentUser?.name || 'Thắng Trần (Bạn)', score: 95, level: 'HSK 1', title: 'Đồng sinh', avatar: '👤', isCurrentUser: true },
    ],
    week: [
      { rank: 1, name: 'Lê Tuấn Kiệt', score: 1850, level: 'HSK 3', title: 'Trạng nguyên', avatar: '🧑‍🎓', isCurrentUser: false },
      { rank: 2, name: 'Nguyễn Mỹ Linh (Cô Linh)', score: 1720, level: 'HSK 4', title: 'Bảng nhãn', avatar: '👩‍🏫', isCurrentUser: false },
      { rank: 3, name: 'Hoàng Mai Anh', score: 1490, level: 'HSK 3', title: 'Thám hoa', avatar: '👩', isCurrentUser: false },
      { rank: 4, name: 'Trần Phương Thảo', score: 1280, level: 'HSK 2', title: 'Cử nhân', avatar: '👧', isCurrentUser: false },
      { rank: 5, name: 'Đặng Quốc Bảo', score: 1140, level: 'HSK 2', title: 'Cử nhân', avatar: '👨‍💼', isCurrentUser: false },
      { rank: 6, name: 'Phạm Minh Đức', score: 950, level: 'HSK 1', title: 'Tú tài', avatar: '👦', isCurrentUser: false },
      { rank: 7, name: currentUser?.name || 'Thắng Trần (Bạn)', score: 620, level: 'HSK 1', title: 'Đồng sinh', avatar: '👤', isCurrentUser: true },
      { rank: 8, name: 'Vũ Hải Yến', score: 580, level: 'HSK 1', title: 'Đồng sinh', avatar: '👩‍🦰', isCurrentUser: false },
    ],
    month: [
      { rank: 1, name: 'Nguyễn Mỹ Linh (Cô Linh)', score: 6450, level: 'HSK 4', title: 'Trạng nguyên', avatar: '👩‍🏫', isCurrentUser: false },
      { rank: 2, name: 'Lê Tuấn Kiệt', score: 5820, level: 'HSK 3', title: 'Bảng nhãn', avatar: '🧑‍🎓', isCurrentUser: false },
      { rank: 3, name: 'Đặng Quốc Bảo', score: 4920, level: 'HSK 2', title: 'Thám hoa', avatar: '👨‍💼', isCurrentUser: false },
      { rank: 4, name: 'Hoàng Mai Anh', score: 4310, level: 'HSK 3', title: 'Cử nhân', avatar: '👩', isCurrentUser: false },
      { rank: 5, name: 'Trần Phương Thảo', score: 3890, level: 'HSK 2', title: 'Cử nhân', avatar: '👧', isCurrentUser: false },
      { rank: 6, name: currentUser?.name || 'Thắng Trần (Bạn)', score: 2150, level: 'HSK 1', title: 'Tú tài', avatar: '👤', isCurrentUser: true },
    ],
  };

  // Mini-game playable states for "Gõ pinyin" & "Nối từ"
  const [typingInput, setTypingInput] = useState('');
  const [typingScore, setTypingScore] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);

  const completedTaskCount = (tasks.task1 ? 1 : 0) + (tasks.task2 ? 1 : 0) + (tasks.task3 ? 1 : 0);

  const toggleTask = (taskId: 'task1' | 'task2' | 'task3') => {
    setTasks((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      if (!prev[taskId]) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
      return next;
    });
  };

  const handleNavigateCourse = (level: HSKLevel) => {
    setActiveLevel(level);
    if (!isAuthenticated) {
      onOpenGoogleAuth();
      return;
    }
    setActiveTab('courses');
  };

  // 12 Gamified Mini-games definition matching Image 2
  const gamesList = [
    {
      id: 'go-pinyin',
      title: 'Gõ pinyin',
      desc: 'Chữ Hán rơi xuống — gõ pinyin (không dấu) để bắn hạ trước khi chạm đáy.',
      color: 'bg-blue-600',
      tag: 'Phản xạ gõ phím',
      icon: '⌨️',
    },
    {
      id: 'chay-tren-may',
      title: 'Chạy trên mây',
      desc: 'Chạy sang làn có từ đúng nghĩa trước khi tới cổng. Trả lời đúng liên tiếp sẽ chạy nhanh hơn.',
      color: 'bg-teal-600',
      tag: 'Nhanh mắt nhanh tay',
      icon: '🏃',
    },
    {
      id: 'ban-bong-bong',
      title: 'Bắn bong bóng',
      desc: 'Bong bóng chữ Hán bay lên — chạm đúng bong bóng có nghĩa ở trên trước khi nó bay mất.',
      color: 'bg-rose-700',
      tag: 'Phản xạ từ vựng',
      icon: '🫧',
    },
    {
      id: 'noi-tu',
      title: 'Nối từ',
      desc: 'Nối chữ Hán ở cột trái với nghĩa đúng ở cột phải. Nối càng nhanh càng nhiều điểm.',
      color: 'bg-red-700',
      tag: 'Ghép đôi từ vựng',
      icon: '🔗',
    },
    {
      id: 'nghe-chon-chu',
      title: 'Nghe chọn chữ',
      desc: 'Nghe máy đọc một từ rồi chọn đúng chữ Hán trong 4 đáp án trước khi hết giờ.',
      color: 'bg-amber-600',
      tag: 'Luyện thính lực',
      icon: '🎧',
    },
    {
      id: 'chon-thanh-dieu',
      title: 'Chọn thanh điệu',
      desc: 'Nhìn chữ Hán, chọn cách viết pinyin có thanh điệu đúng trong 4 đáp án.',
      color: 'bg-emerald-600',
      tag: 'Chuẩn 4 thanh điệu',
      icon: '🎵',
    },
    {
      id: 'ghep-chu-thanh-tu',
      title: 'Ghép chữ thành từ',
      desc: 'Xem nghĩa, bấm các chữ Hán theo đúng thứ tự để ghép thành từ.',
      color: 'bg-lime-800',
      tag: 'Cấu tạo từ vựng',
      icon: '🧩',
    },
    {
      id: 'nghieng-dau-chon-dung',
      title: 'Nghiêng đầu chọn đúng',
      desc: 'Camera nhìn em: nghiêng đầu, quay mặt hoặc chỉ tay sang trái/phải để chọn đáp án đúng.',
      color: 'bg-sky-600',
      tag: 'Vận động thể chất',
      icon: '🧒',
    },
    {
      id: 'chem-hoa-qua',
      title: 'Chém hoa quả',
      desc: 'Hoa quả có chữ Hán bay lên — vung ngón tay trước camera (hoặc vuốt màn hình) chém đúng quả có từ được hỏi!',
      color: 'bg-red-600',
      tag: 'Ninja từ vựng',
      icon: '🍉',
    },
    {
      id: 'nhay-sang-dung-cong',
      title: 'Nhảy sang đúng cổng',
      desc: 'Vừa học vừa tập thể dục: di chuyển cả người sang cổng có từ đúng rồi bật nhảy — camera sẽ nhìn em!',
      color: 'bg-emerald-700',
      tag: 'Vừa học vừa nhảy',
      icon: '🐫',
    },
    {
      id: 'noi-de-nhay',
      title: 'Nói để nhảy',
      desc: 'Khủng long chạy gặp chướng ngại có ghi từ tiếng Trung — đọc to, đúng từ đó thì khủng long mới nhảy qua!',
      color: 'bg-amber-700',
      tag: 'Luyện phát âm to rõ',
      icon: '🦖',
    },
    {
      id: 'karaoke-bai-khoa',
      title: 'Karaoke bài khoá',
      desc: 'Nghe giọng đọc gốc của sách từng câu rồi đọc theo — chữ đọc đúng sáng xanh. Có chế độ đóng vai và học thuộc.',
      color: 'bg-[#18181B]',
      tag: 'Hát theo bài khoá',
      icon: '🎤',
    },
  ];

  // 214 Radicals sample list
  const sampleRadicals = [
    { char: '亻', pinyin: 'rén', sino: 'Nhân', meaning: 'Người, con người', ex: '你 (bạn), 他 (anh ấy)' },
    { char: '口', pinyin: 'kǒu', sino: 'Khẩu', meaning: 'Miệng, lời nói', ex: '吃 (ăn), 喝 (uống)' },
    { char: '氵', pinyin: 'shuǐ', sino: 'Thủy', meaning: 'Nước, chất lỏng', ex: '海 (biển), 洗 (rửa)' },
    { char: '木', pinyin: 'mù', sino: 'Mộc', meaning: 'Cây, gỗ', ex: '林 (rừng), 桌 (bàn)' },
    { char: '心', pinyin: 'xīn', sino: 'Tâm', meaning: 'Trái tim, tình cảm', ex: '想 (nghĩ), 念 (nhớ)' },
    { char: '讠', pinyin: 'yán', sino: 'Ngôn', meaning: 'Lời nói, ngôn ngữ', ex: '语 (ngữ), 说 (nói)' },
    { char: '扌', pinyin: 'shǒu', sino: 'Thủ', meaning: 'Tay, động tác tay', ex: '打 (đánh), 提 (xách)' },
    { char: '女', pinyin: 'nǚ', sino: 'Nữ', meaning: 'Phụ nữ, giống cái', ex: '好 (tốt), 妈 (mẹ)' },
    { char: '日', pinyin: 'rì', sino: 'Nhật', meaning: 'Mặt trời, ban ngày', ex: '明 (sáng), 早 (sớm)' },
    { char: '饣', pinyin: 'shí', sino: 'Thực', meaning: 'Ăn uống, thức ăn', ex: '饭 (cơm), 饱 (no)' },
    { char: '宀', pinyin: 'mián', sino: 'Miên', meaning: 'Mái nhà, chỗ ở', ex: '家 (nhà), 安 (an)' },
    { char: '走', pinyin: 'zǒu', sino: 'Tẩu', meaning: 'Đi lại, chạy', ex: '起 (dậy), 超 (vượt)' },
  ];

  // 1063 Hanzi Stories sample
  const sampleStories = [
    {
      char: '休',
      pinyin: 'xiū',
      meaning: 'Nghỉ ngơi',
      story: 'Gồm bộ Nhân (亻- người) đứng tựa lưng vào gốc cây (木 - mộc) dưới bóng râm để nghỉ ngơi sau giờ làm việc vất vả.',
      structure: '亻 (Nhân) + 木 (Mộc)',
    },
    {
      char: '明',
      pinyin: 'míng',
      meaning: 'Sáng sủa, thông minh',
      story: 'Kết hợp giữa Mặt Trời (日 - nhật) và Mặt Trăng (月 - nguyệt), hai vật thể sáng nhất trên bầu trời cùng tỏa ánh sáng chan hòa.',
      structure: '日 (Nhật) + 月 (Nguyệt)',
    },
    {
      char: '好',
      pinyin: 'hǎo',
      meaning: 'Tốt đẹp, hay',
      story: 'Hình ảnh người Mẹ (女 - nữ) ôm đứa con trai nhỏ (子 - tử) trong lòng, biểu trưng cho sự hòa thuận, hạnh phúc và vẹn tròn.',
      structure: '女 (Nữ) + 子 (Tử)',
    },
    {
      char: '安',
      pinyin: 'ān',
      meaning: 'Bình an, yên ổn',
      story: 'Bên dưới mái nhà (宀 - miên) có người phụ nữ (女 - nữ) trông coi chăm sóc gia đình thì mọi sự đều bình an, an lành.',
      structure: '宀 (Miên) + 女 (Nữ)',
    },
  ];

  return (
    <div className="space-y-10 pb-20 max-w-5xl mx-auto">
      {/* ========================================================= */}
      {/* PHÂN KHU 1: THEO HÌNH 1 (BANNER CÂU ĐỐI, NHIỆM VỤ, SÁCH BÀI TẬP) */}
      {/* ========================================================= */}
      <section className="space-y-6">
        {/* 1.1. TOP HERO WITH TRADITIONAL COUPLETS */}
        <div className="flex items-stretch justify-center gap-2 sm:gap-4 select-none">
          {/* Câu đối bên trái (Thẻ trúc thư pháp) */}
          <div className="w-12 sm:w-16 rounded-2xl bg-[#FAF7F0] border-2 border-red-700/60 shadow-md flex flex-col items-center justify-around py-6 px-1 text-slate-900 font-serif font-black text-sm sm:text-lg leading-tight tracking-widest text-center shadow-stone-300/40">
            <span className="text-red-700">学</span>
            <span>而</span>
            <span>时</span>
            <span>习</span>
            <span className="text-red-700">之</span>
          </div>

          {/* Banner & Slider ảnh tuyển sinh trung tâm - Full Ảnh Không Diễn Giải Thêm Chữ */}
          <div
            className="flex-1 rounded-3xl bg-[#18181B] text-white shadow-xl relative overflow-hidden flex flex-col justify-center items-center border-2 border-red-700/60 min-h-[240px] sm:min-h-[320px] md:min-h-[380px] lg:min-h-[420px] group/slider transition-all select-none"
            onMouseEnter={() => setIsSlidePaused(true)}
            onMouseLeave={() => setIsSlidePaused(false)}
          >
            {/* Ambient Blurred Background of the current slide image */}
            <div
              className="absolute inset-0 bg-cover bg-center blur-2xl opacity-30 scale-110 pointer-events-none transition-all duration-700"
              style={{ backgroundImage: `url(${heroSlides[currentSlide].image})` }}
            />
            {/* Subtle lacquer vignette overlay */}
            <div className="absolute inset-0 bg-radial from-transparent via-[#18181B]/40 to-[#18181B]/80 pointer-events-none" />

            {/* FULL SLIDE IMAGE */}
            <div
              onClick={() => setActivePosterModal(heroSlides[currentSlide].image)}
              className="relative z-10 w-full h-full flex items-center justify-center p-2 sm:p-3 cursor-pointer group/img"
              title="Bấm để xem ảnh phóng to đầy đủ"
            >
              <img
                src={heroSlides[currentSlide].image}
                alt={heroSlides[currentSlide].title}
                className="w-full max-h-[380px] sm:max-h-[440px] object-contain drop-shadow-2xl rounded-2xl transition-transform duration-500 group-hover/img:scale-[1.01]"
              />

              {/* Discreet hover zoom badge */}
              <div className="absolute bottom-4 right-4 z-20 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black text-amber-300 border border-amber-400/40 text-[11px] font-bold backdrop-blur-md opacity-0 group-hover/slider:opacity-100 transition-opacity flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Bấm phóng to xem chi tiết</span>
              </div>
            </div>

            {/* Left Nav Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-red-700 text-white border border-white/20 hover:border-red-400 shadow-xl backdrop-blur-md transition-all cursor-pointer opacity-75 hover:opacity-100 hover:scale-110"
              title="Slide trước"
              aria-label="Slide trước"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Right Nav Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-red-700 text-white border border-white/20 hover:border-red-400 shadow-xl backdrop-blur-md transition-all cursor-pointer opacity-75 hover:opacity-100 hover:scale-110"
              title="Slide kế tiếp"
              aria-label="Slide kế tiếp"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Bottom Floating Indicator & Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/75 border border-white/20 backdrop-blur-md shadow-lg">
              <span className="text-[11px] font-mono font-bold text-amber-300">
                {currentSlide + 1} / {heroSlides.length}
              </span>
              <div className="w-[1px] h-3 bg-white/25" />
              <div className="flex items-center gap-1.5">
                {heroSlides.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide(dotIdx);
                    }}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      currentSlide === dotIdx
                        ? 'w-6 bg-amber-400 shadow-xs'
                        : 'w-2 bg-white/40 hover:bg-white/80'
                    }`}
                    title={`Chuyển tới ảnh ${dotIdx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Câu đối bên phải (Thẻ trúc thư pháp) */}
          <div className="w-12 sm:w-16 rounded-2xl bg-[#FAF7F0] border-2 border-red-700/60 shadow-md flex flex-col items-center justify-around py-6 px-1 text-slate-900 font-serif font-black text-sm sm:text-lg leading-tight tracking-widest text-center shadow-stone-300/40">
            <span className="text-red-700">不</span>
            <span>亦</span>
            <span>说</span>
            <span className="text-red-700">乎</span>
          </div>
        </div>

        {/* 1.2. STATS BAR: CHUỖI NGÀY & CẤP BẬC */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
          {/* Thẻ chuỗi ngày liên tiếp */}
          <div className="md:col-span-3 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center">
            <div className="text-slate-400 mb-1">
              <Flame className="w-6 h-6 text-slate-400" />
            </div>
            <span className="text-2xl font-black text-slate-900">1</span>
            <span className="text-xs font-bold text-slate-600">ngày liên tiếp</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Học ngay để giữ chuỗi!</span>
          </div>

          {/* Thẻ Cấp bậc & Xu */}
          <div className="md:col-span-9 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-xl bg-rose-500 text-white font-serif font-extrabold text-sm shadow-xs">
                  童生
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Đồng sinh</h3>
                  <p className="text-xs text-slate-500">
                    0 điểm · còn 150 điểm lên <strong className="text-slate-800">Tú tài</strong>
                  </p>
                </div>
              </div>

              {/* Coin counter */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs">
                <span>🪙</span>
                <span>0</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
              <div className="bg-rose-500 h-2 rounded-full w-[8%]"></div>
            </div>
          </div>
        </div>

        {/* 1.3. NHIỆM VỤ HÔM NAY (DAILY TASKS) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
              Nhiệm vụ hôm nay
            </h3>
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              Làm đủ 3 nhiệm vụ: +15 điểm
            </span>
          </div>

          <div className="space-y-3">
            {/* Task 1 */}
            <div
              onClick={() => toggleTask('task1')}
              className={`p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                tasks.task1 ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {tasks.task1 ? <Check className="w-4 h-4" /> : '📖'}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Làm 1 phần bài tập</h4>
                  <p className="text-[11px] text-slate-500">Sách bài tập, giáo trình, ngữ âm...</p>
                </div>
              </div>
              <span className={`text-xs font-mono font-bold ${tasks.task1 ? 'text-emerald-700' : 'text-slate-400'}`}>
                {tasks.task1 ? '1/1' : '0/1'}
              </span>
            </div>

            {/* Task 2 */}
            <div
              onClick={() => toggleTask('task2')}
              className={`p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                tasks.task2 ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {tasks.task2 ? <Check className="w-4 h-4" /> : '🎮'}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Chơi 1 lượt trò chơi</h4>
                  <p className="text-[11px] text-slate-500">Bất kỳ trò nào</p>
                </div>
              </div>
              <span className={`text-xs font-mono font-bold ${tasks.task2 ? 'text-emerald-700' : 'text-slate-400'}`}>
                {tasks.task2 ? '1/1' : '0/1'}
              </span>
            </div>

            {/* Task 3 */}
            <div
              onClick={() => toggleTask('task3')}
              className={`p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                tasks.task3 ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {tasks.task3 ? <Check className="w-4 h-4" /> : '🗂️'}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">Ôn tập 20 thẻ / từ</h4>
                  <p className="text-[11px] text-slate-500">Flashcard, sổ lỗi sai hoặc luyện đọc</p>
                </div>
              </div>
              <span className={`text-xs font-mono font-bold ${tasks.task3 ? 'text-emerald-700' : 'text-slate-400'}`}>
                {tasks.task3 ? '20/20' : '0/20'}
              </span>
            </div>
          </div>
        </div>

        {/* 1.4. ROW OF 3 QUICK ACTION SHORTCUTS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1: Ôn lỗi sai hôm nay */}
          <div
            onClick={() => {
              if (!isAuthenticated) {
                onOpenGoogleAuth();
                return;
              }
              setActiveTab('vocab');
            }}
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#18181B] via-zinc-800 to-[#18181B] border border-red-900/30 text-white shadow-md cursor-pointer hover:shadow-lg transition-transform hover:-translate-y-0.5 space-y-1"
          >
            <div className="text-lg">🗂️</div>
            <h4 className="font-extrabold text-sm sm:text-base">Ôn lỗi sai hôm nay</h4>
            <p className="text-xs text-slate-300">Không có từ đến hạn</p>
          </div>

          {/* Card 2: Bài được giao */}
          <div
            onClick={() => {
              if (!isAuthenticated) {
                onOpenGoogleAuth();
                return;
              }
              setActiveTab('courses');
            }}
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md cursor-pointer hover:shadow-lg transition-transform hover:-translate-y-0.5 space-y-1"
          >
            <div className="text-lg">📋</div>
            <h4 className="font-extrabold text-sm sm:text-base">Bài được giao</h4>
            <p className="text-xs text-orange-100">Chưa xếp lớp</p>
          </div>

          {/* Card 3: Thi thử mini */}
          <div
            onClick={() => {
              if (!isAuthenticated) {
                onOpenGoogleAuth();
                return;
              }
              setActiveTab('exams');
            }}
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-700 text-white shadow-md cursor-pointer hover:shadow-lg transition-transform hover:-translate-y-0.5 space-y-1"
          >
            <div className="text-lg">📝</div>
            <h4 className="font-extrabold text-sm sm:text-base">Thi thử mini</h4>
            <p className="text-xs text-teal-100">15 phút · báo cáo kỹ năng</p>
          </div>
        </div>

        {/* 1.5. DANH SÁCH KHÓA HỌC 新HSK教程 */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-red-600"></span>
            <h3 className="font-black text-slate-900 text-base sm:text-lg">
              Danh sách khóa học <span className="font-serif font-bold text-slate-700">新HSK教程</span>
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Chọn khóa học ➔ chọn bài học ➔ học từ vựng, ngữ pháp, đối thoại và làm bài tập.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Khóa học HSK 1 */}
            <div
              onClick={() => handleNavigateCourse('HSK 1')}
              className="p-6 rounded-3xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[160px] relative overflow-hidden"
            >
              <div className="font-serif text-5xl font-black text-white/90">1</div>
              <div className="space-y-1 mt-3">
                <h4 className="text-base sm:text-lg font-black">Khóa học HSK 1</h4>
                <p className="text-xs text-pink-100 font-serif">新HSK教程 1 · Khóa học chuẩn</p>
                <div className="pt-2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                    16/16 bài học
                  </span>
                </div>
              </div>
            </div>

            {/* Khóa học HSK 2 */}
            <div
              onClick={() => handleNavigateCourse('HSK 2')}
              className="p-6 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[160px] relative overflow-hidden"
            >
              <div className="font-serif text-5xl font-black text-white/90">2</div>
              <div className="space-y-1 mt-3">
                <h4 className="text-base sm:text-lg font-black">Khóa học HSK 2</h4>
                <p className="text-xs text-amber-100 font-serif">新HSK教程 2 · Khóa học chuẩn</p>
                <div className="pt-2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                    16/16 bài học
                  </span>
                </div>
              </div>
            </div>

            {/* Khóa học HSK 3 */}
            <div
              onClick={() => handleNavigateCourse('HSK 3')}
              className="p-6 rounded-3xl bg-gradient-to-br from-[#18181B] via-zinc-800 to-stone-900 border border-red-700/40 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[160px] relative overflow-hidden"
            >
              <div className="font-serif text-5xl font-black text-amber-400/90">3</div>
              <div className="space-y-1 mt-3">
                <h4 className="text-base sm:text-lg font-black">Khóa học HSK 3</h4>
                <p className="text-xs text-red-200 font-serif">新HSK教程 3 · Khóa học chuẩn</p>
                <div className="pt-2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                    19/19 bài học
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* PHÂN KHU 2: LUYỆN NGỮ ÂM */}
      {/* ========================================================= */}
      <section className="space-y-6 pt-4">
        {/* 2.1. LUYỆN NGỮ ÂM CARD */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-red-600"></span>
            <h3 className="font-black text-slate-900 text-base sm:text-lg">
              Luyện ngữ âm
            </h3>
          </div>

          <div
            onClick={() => setActivePinyinModal(true)}
            className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#803322] to-[#541E12] text-white shadow-xl cursor-pointer hover:shadow-2xl transition-all hover:scale-[1.01] flex items-center justify-between gap-6 relative overflow-hidden border border-[#A24832]/30"
          >
            <div className="space-y-2 z-10">
              <div className="font-serif text-5xl sm:text-6xl font-black text-white/90">
                音
              </div>
              <h4 className="text-xl sm:text-2xl font-black text-white">
                Luyện ngữ âm (Pinyin)
              </h4>
              <p className="text-xs sm:text-sm text-amber-200/90 font-serif">
                汉语听力教程 1 · 语音练习
              </p>
              <div className="pt-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/20">
                  15 bài · Nghe - chọn - điền pinyin
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                speakChinese('拼音发音练习：b, p, m, f, d, t, n, l, ā, á, ǎ, à');
              }}
              className="p-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-lg transition-transform hover:scale-110 cursor-pointer shadow-lg z-10"
              title="Nghe mẫu phát âm"
            >
              <Volume2 className="w-7 h-7 text-amber-300" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* PHÂN KHU 3: THEO HÌNH 3 (BẢNG XẾP HẠNG, FLASHCARD, GIÁO TRÌNH) */}
      {/* ========================================================= */}
      <section className="space-y-6 pt-4">
        {/* 3.1. BẢNG XẾP HẠNG HỌC VIÊN XUẤT SẮC (THEME ĐỎ - BE - ĐEN) */}
        <div className="rounded-3xl bg-[#FFFDF9] border-2 border-red-600/30 shadow-lg overflow-hidden space-y-5">
          {/* Header Banner - Đỏ sơn mài truyền thống */}
          <div className="bg-gradient-to-r from-red-800 via-red-600 to-rose-700 text-white p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-amber-400/40">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 shadow-inner border border-white/20">
                🏆
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-black text-lg sm:text-xl tracking-wide text-amber-200">
                    Bảng Xếp Hạng Học Viên Xuất Sắc
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-red-950 uppercase">
                    HSK 3.0
                  </span>
                </div>
                <p className="text-xs text-rose-100/90 mt-0.5">
                  Tích lũy điểm khi học bài, làm bài tập và luyện đề để vinh danh trên bảng vàng
                </p>
              </div>
            </div>

            {/* Timeframe Filter Tabs (Đen & Be) */}
            <div className="flex items-center bg-black/40 p-1 rounded-2xl border border-white/15 self-stretch md:self-auto justify-center">
              {[
                { id: 'today', label: 'Hôm nay' },
                { id: 'week', label: 'Tuần này' },
                { id: 'month', label: 'Tháng này' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setLeaderboardTimeframe(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    leaderboardTimeframe === tab.id
                      ? 'bg-amber-300 text-red-950 shadow-sm scale-105'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* Top 3 Podium (Bục Vinh Quang 3 Hạng Đầu) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-end pt-2">
              {/* Top 2 - Bảng nhãn */}
              {leaderboardData[leaderboardTimeframe][1] && (
                <div className="order-2 sm:order-1 p-4 rounded-2xl bg-[#FAF7F0] border-2 border-slate-300 shadow-xs flex flex-col items-center text-center relative hover:shadow-md transition-shadow">
                  <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-slate-200 border border-slate-400 text-slate-800 font-extrabold text-xs shadow-xs">
                    🥈 Hạng 2 · {leaderboardData[leaderboardTimeframe][1].title}
                  </div>
                  <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-slate-400 text-3xl flex items-center justify-center mt-2 shadow-inner">
                    {leaderboardData[leaderboardTimeframe][1].avatar}
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base mt-2 line-clamp-1">
                    {leaderboardData[leaderboardTimeframe][1].name}
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold mt-0.5">
                    {leaderboardData[leaderboardTimeframe][1].level}
                  </span>
                  <div className="mt-2 text-base font-black text-slate-900 font-mono">
                    {leaderboardData[leaderboardTimeframe][1].score.toLocaleString()} <span className="text-xs font-semibold text-slate-500">điểm</span>
                  </div>
                </div>
              )}

              {/* Top 1 - Trạng nguyên (Cao nhất, Nổi bật Đỏ - Vàng) */}
              {leaderboardData[leaderboardTimeframe][0] && (
                <div className="order-1 sm:order-2 p-5 rounded-3xl bg-gradient-to-b from-[#FFFDF9] to-[#FAF7F0] border-2 border-red-600 shadow-xl flex flex-col items-center text-center relative -translate-y-1 sm:-translate-y-2">
                  <div className="absolute -top-4 px-4 py-1 rounded-full bg-red-600 border border-amber-300 text-amber-200 font-extrabold text-xs shadow-md flex items-center gap-1 animate-pulse">
                    <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    <span>🥇 Quán Quân · {leaderboardData[leaderboardTimeframe][0].title}</span>
                  </div>
                  <div className="w-20 h-20 rounded-full bg-red-100 border-3 border-red-500 text-4xl flex items-center justify-center mt-2 shadow-lg ring-4 ring-amber-300/40">
                    {leaderboardData[leaderboardTimeframe][0].avatar}
                  </div>
                  <h4 className="font-black text-red-950 text-base sm:text-lg mt-2 line-clamp-1">
                    {leaderboardData[leaderboardTimeframe][0].name}
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-md bg-red-100 text-red-700 text-xs font-bold mt-0.5 border border-red-200">
                    {leaderboardData[leaderboardTimeframe][0].level}
                  </span>
                  <div className="mt-2 text-xl font-black text-red-700 font-mono">
                    {leaderboardData[leaderboardTimeframe][0].score.toLocaleString()} <span className="text-xs font-semibold text-red-900">điểm</span>
                  </div>
                </div>
              )}

              {/* Top 3 - Thám hoa */}
              {leaderboardData[leaderboardTimeframe][2] && (
                <div className="order-3 p-4 rounded-2xl bg-[#FAF7F0] border-2 border-amber-700/30 shadow-xs flex flex-col items-center text-center relative hover:shadow-md transition-shadow">
                  <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-amber-100 border border-amber-600 text-amber-900 font-extrabold text-xs shadow-xs">
                    🥉 Hạng 3 · {leaderboardData[leaderboardTimeframe][2].title}
                  </div>
                  <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-600 text-3xl flex items-center justify-center mt-2 shadow-inner">
                    {leaderboardData[leaderboardTimeframe][2].avatar}
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base mt-2 line-clamp-1">
                    {leaderboardData[leaderboardTimeframe][2].name}
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold mt-0.5">
                    {leaderboardData[leaderboardTimeframe][2].level}
                  </span>
                  <div className="mt-2 text-base font-black text-slate-900 font-mono">
                    {leaderboardData[leaderboardTimeframe][2].score.toLocaleString()} <span className="text-xs font-semibold text-slate-500">điểm</span>
                  </div>
                </div>
              )}
            </div>

            {/* Danh sách học viên từ Hạng 4 trở đi */}
            <div className="rounded-2xl border border-[#EBE4D5] overflow-hidden bg-white shadow-2xs">
              <div className="bg-[#F5EFEB] px-4 py-2.5 text-slate-700 text-xs font-bold flex items-center justify-between border-b border-[#EBE4D5]">
                <span>Thứ hạng & Học viên</span>
                <span>Cấp độ & Điểm tích lũy</span>
              </div>

              <div className="divide-y divide-[#F0EAE1]">
                {leaderboardData[leaderboardTimeframe].slice(3).map((item) => (
                  <div
                    key={item.rank}
                    className={`px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                      item.isCurrentUser
                        ? 'bg-red-50/90 border-l-4 border-red-600'
                        : 'hover:bg-[#FAF7F0]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                          item.isCurrentUser
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-900 text-white'
                        }`}
                      >
                        #{item.rank}
                      </span>
                      <div className="text-xl">{item.avatar}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            {item.name}
                          </span>
                          {item.isCurrentUser && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white">
                              Bạn
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Học vị: <strong className="text-slate-700">{item.title}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-sm text-red-700 font-mono block">
                        {item.score.toLocaleString()} điểm
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {item.level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Thanh thông tin thứ hạng của bạn */}
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-red-600/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-serif font-black text-lg flex items-center justify-center shadow-xs">
                  榜
                </div>
                <div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                    Thứ hạng hiện tại: <strong className="text-red-700">#8</strong> • Còn thiếu <strong className="text-slate-900">55 điểm</strong> để vượt qua hạng #7!
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Làm bài tập hoặc luyện flashcard ngay hôm nay để leo hạng cao hơn
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    onOpenGoogleAuth();
                    return;
                  }
                  setActiveTab('courses');
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                <span>Học ngay để leo hạng</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3.2. FLASHCARD TỪ VỰNG (3 WIDE CARDS) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-red-600"></span>
            <h3 className="font-black text-slate-900 text-base sm:text-lg">
              Flashcard từ vựng
            </h3>
          </div>

          <div className="space-y-3">
            {/* Card 1: Flashcard HSK 1 - 4 */}
            <div
              onClick={() => {
                if (!isAuthenticated) {
                  onOpenGoogleAuth();
                  return;
                }
                setActiveTab('vocab');
              }}
              className="p-5 rounded-2xl bg-gradient-to-r from-red-800 to-rose-700 text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.01] cursor-pointer flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0">
                🗂️
              </div>
              <div className="flex-1">
                <h4 className="font-black text-sm sm:text-base">Flashcard HSK 1 – 4</h4>
                <p className="text-xs text-red-100/90">
                  Chọn các bài đã học · lật từng thẻ hoặc xem 6/8 thẻ một trang để luyện đọc · đánh dấu từ đã thuộc
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/70" />
            </div>

            {/* Card 2: Học bộ thủ */}
            <div
              onClick={() => setActiveRadicalModal(true)}
              className="p-5 rounded-2xl bg-gradient-to-r from-[#18181B] via-zinc-800 to-stone-900 border border-red-900/40 text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.01] cursor-pointer flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-white/20 font-serif font-black text-2xl flex items-center justify-center shrink-0">
                部
              </div>
              <div className="flex-1">
                <h4 className="font-black text-sm sm:text-base">Học bộ thủ</h4>
                <p className="text-xs text-slate-300">
                  Tên, nghĩa, cách nhận biết các bộ thủ trong từ vựng HSK 1–4 · luyện đoán bộ thủ · 214 bộ thủ
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/70" />
            </div>

            {/* Card 3: Câu chuyện chữ Hán */}
            <div
              onClick={() => setActiveHanziStoryModal(true)}
              className="p-5 rounded-2xl bg-gradient-to-r from-stone-900 via-amber-950 to-[#18181B] border border-amber-600/30 text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.01] cursor-pointer flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-white/20 font-serif font-black text-2xl flex items-center justify-center shrink-0">
                字
              </div>
              <div className="flex-1">
                <h4 className="font-black text-sm sm:text-base">Câu chuyện chữ Hán</h4>
                <p className="text-xs text-amber-100/90">
                  1063 chữ trong từ mới HSK 1–4: chữ vẽ hình gì, vì sao mang nghĩa đó · song ngữ Trung – Việt
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/70" />
            </div>
          </div>
        </div>

        {/* 3.3. GIÁO TRÌNH HSK (GRID OF 4 BOOKS) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-red-600"></span>
            <h3 className="font-black text-slate-900 text-base sm:text-lg">
              Giáo trình
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* 课1: HSK 1 */}
            <div
              onClick={() => handleNavigateCourse('HSK 1')}
              className="p-5 rounded-3xl bg-[#7F1D1D] text-white shadow-md hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer flex flex-col justify-between min-h-[170px]"
            >
              <div className="font-serif text-4xl font-black text-white/90">课1</div>
              <div className="space-y-1 mt-3">
                <h4 className="text-sm sm:text-base font-black">Giáo trình HSK 1</h4>
                <p className="text-[11px] text-red-200 font-serif">新HSK教程 1 · 课本</p>
                <div className="pt-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                    15 bài · Thẻ từ & Bài khoá · Tập viết chữ
                  </span>
                </div>
              </div>
            </div>

            {/* 课2: HSK 2 */}
            <div
              onClick={() => handleNavigateCourse('HSK 2')}
              className="p-5 rounded-3xl bg-[#991B1B] text-white shadow-md hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer flex flex-col justify-between min-h-[170px]"
            >
              <div className="font-serif text-4xl font-black text-white/90">课2</div>
              <div className="space-y-1 mt-3">
                <h4 className="text-sm sm:text-base font-black">Giáo trình HSK 2</h4>
                <p className="text-[11px] text-red-100 font-serif">新HSK教程 2 · 课本</p>
                <div className="pt-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                    15 bài · Thẻ từ & Bài khoá · Tập viết chữ
                  </span>
                </div>
              </div>
            </div>

            {/* 课3: HSK 3 */}
            <div
              onClick={() => handleNavigateCourse('HSK 3')}
              className="p-5 rounded-3xl bg-[#18181B] border border-amber-600/30 text-white shadow-md hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer flex flex-col justify-between min-h-[170px]"
            >
              <div className="font-serif text-4xl font-black text-amber-400">课3</div>
              <div className="space-y-1 mt-3">
                <h4 className="text-sm sm:text-base font-black">Giáo trình HSK 3</h4>
                <p className="text-[11px] text-amber-200 font-serif">新HSK教程 3 · 课本</p>
                <div className="pt-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                    18 bài · Thẻ từ & Bài khoá
                  </span>
                </div>
              </div>
            </div>

            {/* 课4: HSK 4 */}
            <div
              onClick={() => {
                alert('Tài liệu HSK 4 đang được cập nhật thêm các bài tập ngữ pháp nâng cao. Bạn vui lòng hoàn thành HSK 1-3 trước nhé!');
              }}
              className="p-5 rounded-3xl bg-[#27272A] border border-zinc-700 text-white shadow-md transition-all flex flex-col justify-between min-h-[170px] cursor-pointer hover:bg-[#18181B]"
            >
              <div className="font-serif text-4xl font-black text-zinc-400">课4</div>
              <div className="space-y-1 mt-3">
                <h4 className="text-sm sm:text-base font-black">Giáo trình HSK 4 (Thượng + hạ)</h4>
                <p className="text-[11px] text-zinc-300 font-serif">新HSK教程 4上·4下 · 课本</p>
                <div className="pt-2 flex items-center gap-1 text-[11px] font-bold text-amber-200 bg-black/40 px-2 py-0.5 rounded-full w-fit">
                  <Lock className="w-3 h-3" />
                  <span>Chưa được cấp quyền</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* PHÂN KHU 4: TRÒ CHƠI TỪ VỰNG (DƯỚI CÙNG TRANG CHỦ) */}
      {/* ========================================================= */}
      <section className="space-y-4 pt-4 pb-6">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-red-600"></span>
          <h3 className="font-black text-slate-900 text-base sm:text-lg">
            Trò chơi từ vựng
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Luyện phản xạ gõ pinyin, nhận diện chữ Hán và ngữ âm qua 12 trò chơi tương tác thú vị.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {gamesList.map((game) => (
            <div
              key={game.id}
              onClick={() => setActiveGameModal(game.id)}
              className={`p-5 rounded-3xl ${game.color} text-white shadow-md hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer flex flex-col justify-between min-h-[160px] border border-white/15`}
            >
              <div>
                <div className="text-2xl mb-2">{game.icon}</div>
                <h4 className="text-base sm:text-lg font-black tracking-wide mb-1">
                  {game.title}
                </h4>
                <p className="text-xs text-white/90 leading-relaxed font-medium">
                  {game.desc}
                </p>
              </div>
              <div className="pt-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/20 text-white/90">
                  {game.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* INTERACTIVE MODAL: 214 BỘ THỦ CHỮ HÁN */}
      {/* ========================================================= */}
      {activeRadicalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setActiveRadicalModal(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-serif font-black text-2xl flex items-center justify-center">
                部
              </span>
              <div>
                <h3 className="font-black text-lg text-slate-900">214 Bộ Thủ Tiếng Trung Thường Gặp</h3>
                <p className="text-xs text-slate-500">Chìa khóa ghi nhớ nhanh chữ Hán và tra cứu từ điển</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {sampleRadicals.map((rad, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-3xl font-extrabold text-blue-600">{rad.char}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900">{rad.pinyin}</span>
                        <span className="text-xs text-slate-500">({rad.sino})</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700">{rad.meaning}</p>
                      <p className="text-[11px] text-slate-500 italic mt-0.5">Ví dụ: {rad.ex}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => speakChinese(`${rad.char}, ${rad.pinyin}`)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setActiveHanziStoryModal(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-serif font-black text-2xl flex items-center justify-center">
                字
              </span>
              <div>
                <h3 className="font-black text-lg text-slate-900">Câu Chuyện Chiết Tự Chữ Hán</h3>
                <p className="text-xs text-slate-500">Hiểu nguồn gốc tượng hình để nhớ chữ trọn đời</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {sampleStories.map((story, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-3xl font-extrabold text-emerald-700">{story.char}</span>
                      <span className="font-mono font-bold text-sm text-slate-800">{story.pinyin}</span>
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {story.meaning}
                      </span>
                    </div>

                    <button
                      onClick={() => speakChinese(`${story.char}, ${story.pinyin}`)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-white"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                    <p className="font-medium">{story.story}</p>
                    <p className="text-[11px] text-slate-500 mt-1 font-mono">Cấu tạo: {story.structure}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* INTERACTIVE MODAL: LUYỆN PHÁT ÂM NGỮ ÂM PINYIN */}
      {activePinyinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setActivePinyinModal(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-serif font-black text-2xl flex items-center justify-center">
                音
              </span>
              <div>
                <h3 className="font-black text-lg text-slate-900">Luyện Ngữ Âm Pinyin (Thanh mẫu & Vận mẫu)</h3>
                <p className="text-xs text-slate-500">Bấm từng âm để nghe giọng phát âm chuẩn bản xứ</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">
                  1. Thanh mẫu (Phụ âm):
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r'].map((p) => (
                    <button
                      key={p}
                      onClick={() => speakChinese(p)}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 font-mono font-bold text-sm text-slate-800 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">
                  2. Bốn thanh điệu (Thanh 1, 2, 3, 4):
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { t: 'mā', desc: 'Thanh 1 (Ngân cao ngang)' },
                    { t: 'má', desc: 'Thanh 2 (Đi lên như dấu sắc)' },
                    { t: 'mǎ', desc: 'Thanh 3 (Xuống rồi lên)' },
                    { t: 'mà', desc: 'Thanh 4 (Dứt khoát từ cao xuống)' },
                  ].map((tone) => (
                    <button
                      key={tone.t}
                      onClick={() => speakChinese(tone.t)}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 flex flex-col items-center gap-1 transition-colors"
                    >
                      <span className="font-mono text-xl font-extrabold text-rose-600">{tone.t}</span>
                      <span className="text-[10px] text-slate-500 text-center leading-tight">{tone.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* INTERACTIVE MODAL: MINI GAME CHƠI TRỰC TIẾP */}
      {activeGameModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveGameModal(null)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-xl bg-red-100 text-red-700 font-black text-xl flex items-center justify-center">
                🎮
              </span>
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  {gamesList.find((g) => g.id === activeGameModal)?.title || 'Trò chơi từ vựng'}
                </h3>
                <p className="text-xs text-slate-500">Trải nghiệm vừa học vừa chơi sinh động</p>
              </div>
            </div>

            {/* Quick playable challenge for "Gõ pinyin" or "Nghe chọn chữ" */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Chữ Hán mục tiêu:
                </span>
                <span className="font-serif text-5xl font-black text-slate-900 tracking-wider">
                  谢谢
                </span>
                <p className="text-xs text-rose-600 font-semibold mt-1">Gõ pinyin tương ứng (không dấu)</p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <input
                  type="text"
                  placeholder="Gõ pinyin..."
                  value={typingInput}
                  onChange={(e) => setTypingInput(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    if (typingInput.trim().toLowerCase() === 'xiexie') {
                      setTypingScore((s) => s + 10);
                      speakChinese('谢谢, 非常好！');
                      confetti({ particleCount: 40 });
                      alert('Chính xác! +10 điểm (+1 lượt nhiệm vụ hôm nay)!');
                      setTasks((t) => ({ ...t, task2: true }));
                      setTypingInput('');
                    } else {
                      alert('Chưa chính xác, đáp án là: xiexie');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 cursor-pointer shadow-xs"
                >
                  Bắn hạ
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                <span>Điểm tích lũy: <strong className="text-blue-600 font-bold">{typingScore}</strong></span>
                <button
                  onClick={() => speakChinese('谢谢')}
                  className="flex items-center gap-1 text-slate-600 hover:text-rose-600"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Nghe phát âm</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PHÓNG TO POSTER TUYỂN SINH */}
      {activePosterModal && (
        <div
          onClick={() => setActivePosterModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-red-700/60 p-2 sm:p-3 space-y-3 cursor-default animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between px-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-red-700 text-white flex items-center justify-center font-serif font-bold text-xs">
                  汉
                </span>
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Thông Tin Tuyển Sinh Khóa Học Tiếng Trung HSK
                </h4>
              </div>
              <button
                onClick={() => setActivePosterModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto rounded-2xl border border-slate-200">
              <img
                src={activePosterModal}
                alt="Poster tuyển sinh chi tiết"
                className="w-full h-auto object-contain rounded-xl"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-2 bg-[#FAF7F0] rounded-2xl border border-[#E6DEC8]">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <PhoneCall className="w-4 h-4 text-red-600" />
                <span>Hotline tư vấn & ghi danh: <strong className="text-red-700 text-sm">0378.105.999</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="tel:0378105999"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs"
                >
                  Gọi tư vấn ngay
                </a>
                <button
                  onClick={() => {
                    setActivePosterModal(null);
                    if (!isAuthenticated) {
                      onOpenGoogleAuth();
                    } else {
                      setActiveTab('courses');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-[#18181B] hover:bg-black text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Vào danh sách khóa học
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

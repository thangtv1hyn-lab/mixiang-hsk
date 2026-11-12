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
  Check,
  Trophy,
  Play,
  RotateCcw,
  X,
  ExternalLink,
  ChevronRight,
  Headphones,
  Gamepad2,
  BookMarked,
  FileQuestion,
  Lock,
  Mic,
  Camera,
  Coins,
  Smile,
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
      color: 'bg-purple-600',
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
      color: 'bg-violet-700',
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
          {/* Câu đối bên trái (Thẻ trúc vàng) */}
          <div className="w-12 sm:w-16 rounded-2xl bg-amber-100/90 border-2 border-amber-300/80 shadow-md flex flex-col items-center justify-center py-4 px-1 text-amber-900 font-serif font-black text-sm sm:text-base leading-tight tracking-widest text-center shadow-amber-200/50">
            <span>学</span>
            <span>而</span>
            <span>时</span>
            <span>习</span>
            <span>之</span>
          </div>

          {/* Banner trung tâm bo tròn sắc tím hồng */}
          <div className="flex-1 rounded-3xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-500 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col items-center justify-center text-center border border-purple-300/30">
            {/* Chữ thư pháp lớn */}
            <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-wider text-white drop-shadow-md">
              勤学好问
            </h1>
            <h2 className="text-base sm:text-xl font-extrabold text-pink-100 mt-1">
              Luyện HSK 3.0
            </h2>
            <p className="text-xs sm:text-sm text-pink-200/95 font-medium mt-2">
              Sách bài tập · Giáo trình · Luyện ngữ âm · Flashcard · Trò chơi
            </p>

            {/* Huy hiệu Hán Ngữ góc phải */}
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 px-3 py-1 rounded-xl bg-amber-300 text-amber-950 font-serif font-extrabold text-xs shadow-md border border-amber-400">
              汉语
            </div>
          </div>

          {/* Câu đối bên phải (Thẻ trúc vàng) */}
          <div className="w-12 sm:w-16 rounded-2xl bg-amber-100/90 border-2 border-amber-300/80 shadow-md flex flex-col items-center justify-center py-4 px-1 text-amber-900 font-serif font-black text-sm sm:text-base leading-tight tracking-widest text-center shadow-amber-200/50">
            <span>不</span>
            <span>亦</span>
            <span>说</span>
            <span>乎</span>
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
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md cursor-pointer hover:shadow-lg transition-transform hover:-translate-y-0.5 space-y-1"
          >
            <div className="text-lg">🗂️</div>
            <h4 className="font-extrabold text-sm sm:text-base">Ôn lỗi sai hôm nay</h4>
            <p className="text-xs text-indigo-100">Không có từ đến hạn</p>
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

        {/* 1.5. SÁCH BÀI TẬP 新HSK教程 学练手册 */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-purple-600"></span>
            <h3 className="font-black text-slate-900 text-base sm:text-lg">
              Sách bài tập <span className="font-serif font-bold text-slate-700">新HSK教程 学练手册</span>
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Chọn quyển ➔ chọn bài ➔ nghe, làm bài và bấm Nộp bài để xem kết quả ngay.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Quyển 1 - HSK 1 */}
            <div
              onClick={() => handleNavigateCourse('HSK 1')}
              className="p-6 rounded-3xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[160px] relative overflow-hidden"
            >
              <div className="font-serif text-5xl font-black text-white/90">1</div>
              <div className="space-y-1 mt-3">
                <h4 className="text-base sm:text-lg font-black">Quyển 1 · HSK 1</h4>
                <p className="text-xs text-pink-100 font-serif">新HSK教程 1 学练手册</p>
                <div className="pt-2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                    16/16 bài
                  </span>
                </div>
              </div>
            </div>

            {/* Quyển 2 - HSK 2 */}
            <div
              onClick={() => handleNavigateCourse('HSK 2')}
              className="p-6 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[160px] relative overflow-hidden"
            >
              <div className="font-serif text-5xl font-black text-white/90">2</div>
              <div className="space-y-1 mt-3">
                <h4 className="text-base sm:text-lg font-black">Quyển 2 · HSK 2</h4>
                <p className="text-xs text-amber-100 font-serif">新HSK教程 2 学练手册</p>
                <div className="pt-2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                    16/16 bài
                  </span>
                </div>
              </div>
            </div>

            {/* Quyển 3 - HSK 3 */}
            <div
              onClick={() => handleNavigateCourse('HSK 3')}
              className="p-6 rounded-3xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[160px] relative overflow-hidden"
            >
              <div className="font-serif text-5xl font-black text-white/90">3</div>
              <div className="space-y-1 mt-3">
                <h4 className="text-base sm:text-lg font-black">Quyển 3 · HSK 3</h4>
                <p className="text-xs text-teal-100 font-serif">新HSK教程 3 学练手册</p>
                <div className="pt-2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                    19/19 bài
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* PHÂN KHU 2: THEO HÌNH 2 (LUYỆN NGỮ ÂM & 12 TRÒ CHƠI TỪ VỰNG) */}
      {/* ========================================================= */}
      <section className="space-y-6 pt-4">
        {/* 2.1. LUYỆN NGỮ ÂM CARD */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-purple-600"></span>
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

        {/* 2.2. TRÒ CHƠI TỪ VỰNG (12 CARDS GRID) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-purple-600"></span>
            <h3 className="font-black text-slate-900 text-base sm:text-lg">
              Trò chơi từ vựng
            </h3>
          </div>

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
        </div>
      </section>

      {/* ========================================================= */}
      {/* PHÂN KHU 3: THEO HÌNH 3 (BẢNG XẾP HẠNG, FLASHCARD, GIÁO TRÌNH) */}
      {/* ========================================================= */}
      <section className="space-y-6 pt-4">
        {/* 3.1. BẢNG XẾP HẠNG BANNER */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 shadow-inner">
              🏆
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg">Bảng xếp hạng</h3>
              <p className="text-xs text-white/90">
                Làm bài tập, chơi trò chơi để tích điểm và leo hạng theo ngày, tuần, tháng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <div className="px-3.5 py-1.5 rounded-xl bg-white/20 border border-white/20 text-center">
              <span className="block text-sm font-black">0</span>
              <span className="text-[10px] text-white/80">hôm nay</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-white/20 border border-white/20 text-center">
              <span className="block text-sm font-black">0</span>
              <span className="text-[10px] text-white/80">tuần này</span>
            </div>
          </div>
        </div>

        {/* 3.2. FLASHCARD TỪ VỰNG (3 WIDE CARDS) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-purple-600"></span>
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
              className="p-5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.01] cursor-pointer flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0">
                🗂️
              </div>
              <div className="flex-1">
                <h4 className="font-black text-sm sm:text-base">Flashcard HSK 1 – 4</h4>
                <p className="text-xs text-sky-100">
                  Chọn các bài đã học · lật từng thẻ hoặc xem 6/8 thẻ một trang để luyện đọc · đánh dấu từ đã thuộc
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/70" />
            </div>

            {/* Card 2: Học bộ thủ */}
            <div
              onClick={() => setActiveRadicalModal(true)}
              className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.01] cursor-pointer flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-white/20 font-serif font-black text-2xl flex items-center justify-center shrink-0">
                部
              </div>
              <div className="flex-1">
                <h4 className="font-black text-sm sm:text-base">Học bộ thủ</h4>
                <p className="text-xs text-blue-100">
                  Tên, nghĩa, cách nhận biết các bộ thủ trong từ vựng HSK 1–4 · luyện đoán bộ thủ · 214 bộ thủ
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/70" />
            </div>

            {/* Card 3: Câu chuyện chữ Hán */}
            <div
              onClick={() => setActiveHanziStoryModal(true)}
              className="p-5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.01] cursor-pointer flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-white/20 font-serif font-black text-2xl flex items-center justify-center shrink-0">
                字
              </div>
              <div className="flex-1">
                <h4 className="font-black text-sm sm:text-base">Câu chuyện chữ Hán</h4>
                <p className="text-xs text-teal-100">
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
            <span className="w-1.5 h-5 rounded-full bg-purple-600"></span>
            <h3 className="font-black text-slate-900 text-base sm:text-lg">
              Giáo trình
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* 课1: HSK 1 */}
            <div
              onClick={() => handleNavigateCourse('HSK 1')}
              className="p-5 rounded-3xl bg-[#592787] text-white shadow-md hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer flex flex-col justify-between min-h-[170px]"
            >
              <div className="font-serif text-4xl font-black text-white/90">课1</div>
              <div className="space-y-1 mt-3">
                <h4 className="text-sm sm:text-base font-black">Giáo trình HSK 1</h4>
                <p className="text-[11px] text-purple-200 font-serif">新HSK教程 1 · 课本</p>
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
              className="p-5 rounded-3xl bg-[#1C5F69] text-white shadow-md hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer flex flex-col justify-between min-h-[170px]"
            >
              <div className="font-serif text-4xl font-black text-white/90">课2</div>
              <div className="space-y-1 mt-3">
                <h4 className="text-sm sm:text-base font-black">Giáo trình HSK 2</h4>
                <p className="text-[11px] text-teal-200 font-serif">新HSK教程 2 · 课本</p>
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
              className="p-5 rounded-3xl bg-[#9E3E1A] text-white shadow-md hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer flex flex-col justify-between min-h-[170px]"
            >
              <div className="font-serif text-4xl font-black text-white/90">课3</div>
              <div className="space-y-1 mt-3">
                <h4 className="text-sm sm:text-base font-black">Giáo trình HSK 3</h4>
                <p className="text-[11px] text-orange-200 font-serif">新HSK教程 3 · 课本</p>
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
              className="p-5 rounded-3xl bg-[#44634B] text-white shadow-md transition-all flex flex-col justify-between min-h-[170px] cursor-pointer hover:bg-[#3B5741]"
            >
              <div className="font-serif text-4xl font-black text-white/90">课4</div>
              <div className="space-y-1 mt-3">
                <h4 className="text-sm sm:text-base font-black">Giáo trình HSK 4 (Thượng + hạ)</h4>
                <p className="text-[11px] text-emerald-200 font-serif">新HSK教程 4上·4下 · 课本</p>
                <div className="pt-2 flex items-center gap-1 text-[11px] font-bold text-amber-200 bg-black/20 px-2 py-0.5 rounded-full w-fit">
                  <Lock className="w-3 h-3" />
                  <span>Chưa được cấp quyền</span>
                </div>
              </div>
            </div>
          </div>
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
              <span className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 font-black text-xl flex items-center justify-center">
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
    </div>
  );
};

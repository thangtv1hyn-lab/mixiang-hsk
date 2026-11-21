import React, { useState } from 'react';
import { ImagePlus, Check, X, Sparkles, RefreshCw } from 'lucide-react';
import { VocabItem } from '../types/hsk';
import { compressImageFile, compressSvgToWebp } from '../utils/imageCompression';
import { safeParseJson } from '../utils/safeFetchJson';

export function getPinyinToneDescription(pinyin: string = ''): string {
  const lower = pinyin.toLowerCase();
  if (/[ǎěǐǒǔǚ]/.test(lower)) {
    return 'Thanh 3 (Thượng thanh - Trầm bổng 214)';
  }
  if (/[àèìòùǜ]/.test(lower)) {
    return 'Thanh 4 (Khứ thanh - Xuống mạnh 51)';
  }
  if (/[áéíóúǘ]/.test(lower)) {
    return 'Thanh 2 (Dương bình - Lên cao 35)';
  }
  if (/[āēīōūǖ]/.test(lower)) {
    return 'Thanh 1 (Âm bình - Cao đều 55)';
  }
  return 'Thanh nhẹ (Khinh thanh - Tự nhiên)';
}

const CUSTOM_VOCAB_IMAGES_KEY = 'mixiang_hsk_custom_vocab_images_v1';

function getStoredCustomImage(vocabId: string): string | null {
  try {
    const raw = localStorage.getItem(CUSTOM_VOCAB_IMAGES_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[vocabId] || null;
  } catch {
    return null;
  }
}

function saveStoredCustomImage(vocabId: string, url: string) {
  try {
    const raw = localStorage.getItem(CUSTOM_VOCAB_IMAGES_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    if (url.trim()) {
      map[vocabId] = url.trim();
    } else {
      delete map[vocabId];
    }
    localStorage.setItem(CUSTOM_VOCAB_IMAGES_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

// Danh mục ảnh thực tế mô tả trực quan theo từ vựng & ngữ cảnh
const PHOTO_RULES: Array<{ pattern: RegExp; url: string }> = [
  // Kiểm thử, hệ thống, máy tính, phần mềm, công nghệ
  {
    pattern: /测试|系统|电脑|软件|网|程序|kiểm thử|hệ thống|máy tính|công nghệ|lập trình|dữ liệu/i,
    url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=700&q=80',
  },
  // Điện thoại, gọi điện, liên lạc
  {
    pattern: /手机|电话|打|연락|điện thoại|gọi điện|nhắn tin/i,
    url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=80',
  },
  // Chào hỏi, giao tiếp, bạn bè, gặp gỡ
  {
    pattern: /你好|您好|再见|谢谢|对不起|朋友|认识|介绍|大家|欢迎|chào|cảm ơn|xin lỗi|tạm biệt|bạn bè|gặp|làm quen/i,
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=700&q=80',
  },
  // Giáo viên, lớp học, trường học, giảng dạy
  {
    pattern: /老师|学校|学院|教室|课|班|教|giáo viên|thầy|cô|trường|lớp học|bài giảng/i,
    url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=700&q=80',
  },
  // Học sinh, du học sinh, bạn cùng phòng, học tập, kỳ thi
  {
    pattern: /学生|留学生|同学|同屋|学习|考试|作业|练习|học sinh|sinh viên|du học|bạn cùng phòng|học tập|ôn tập|thi/i,
    url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=700&q=80',
  },
  // Sách, từ điển, đọc sách, thư viện, chữ Hán, viết
  {
    pattern: /书|词典|字典|杂志|报纸|汉字|字|写|读|图书馆|本子|笔|sách|từ điển|tạp chí|báo|chữ hán|đọc|viết|thư viện|bút/i,
    url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=700&q=80',
  },
  // Trà, uống trà
  {
    pattern: /茶|喝茶|trà/i,
    url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=700&q=80',
  },
  // Cà phê, đồ uống, nước, sữa, cốc
  {
    pattern: /咖啡|水|牛奶|啤酒|杯|喝|cà phê|nước|sữa|bia|uống|cốc|ly/i,
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=700&q=80',
  },
  // Ăn uống, cơm, mì, món ăn, nhà hàng, căn tin
  {
    pattern: /吃|米饭|面条|菜|饭店|食堂|饺子|包子|鸡蛋|肉|鱼|做饭|晚饭|午饭|早饭|ăn|cơm|mì|món ăn|nhà hàng|bữa|nấu ăn|bánh/i,
    url: 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=700&q=80',
  },
  // Hoa quả, táo, dưa hấu
  {
    pattern: /水果|苹果|西瓜|香蕉|hoa quả|trái cây|quả táo|dưa hấu/i,
    url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=700&q=80',
  },
  // Bắc Kinh, Trung Quốc, văn hóa, du lịch
  {
    pattern: /北京|中国|汉语|中文|旅游|故宫|长城|bắc kinh|trung quốc|tiếng trung|du lịch|vạn lý trường thành/i,
    url: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=700&q=80',
  },
  // Máy bay, sân bay
  {
    pattern: /飞机|机场|飞|máy bay|sân bay|chuyến bay/i,
    url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=700&q=80',
  },
  // Tàu hỏa, xe hơi, taxi, đi lại, đường phố
  {
    pattern: /火车|高铁|汽车|出租车|车站|路|去|来|走|坐|开车|tàu hỏa|xe|taxi|nhà ga|đường|đi|đến/i,
    url: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=700&q=80',
  },
  // Gia đình, bố mẹ, con cái, người thân
  {
    pattern: /爸爸|妈妈|父母|孩子|儿子|女儿|哥哥|姐姐|弟弟|妹妹|家人|爷爷|奶奶|bố|mẹ|con|anh|chị|em|gia đình|ông|bà/i,
    url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=700&q=80',
  },
  // Nhà cửa, phòng ốc, ký túc xá, bàn ghế
  {
    pattern: /家|房间|宿舍|房子|门|窗户|桌子|椅子|床|nhà|phòng|ký túc xá|cửa|bàn|ghế|giường/i,
    url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=700&q=80',
  },
  // Mua sắm, cửa hàng, siêu thị, tiền, quần áo
  {
    pattern: /买|卖|商店|超市|市场|钱|块|贵|便宜|衣服|穿|件|mua|bán|cửa hàng|siêu thị|tiền|quần áo|đắt|rẻ/i,
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=700&q=80',
  },
  // Thời gian, đồng hồ, ngày tháng, buổi sáng, buổi tối
  {
    pattern: /时间|时候|点|分|钟|今天|明天|昨天|早上|上午|下午|晚上|星期|周末|年|月|日|thời gian|giờ|phút|hôm nay|ngày mai|hôm qua|buổi sáng|buổi tối|tuần|năm|tháng/i,
    url: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?auto=format&fit=crop&w=700&q=80',
  },
  // Thời tiết, mưa, nắng, núi, thiên nhiên, công viên, hoa
  {
    pattern: /天气|下雨|雨|雪|冷|热|山|花|树|公园|风景|春|夏|秋|冬|thời tiết|mưa|tuyết|lạnh|nóng|núi|hoa|cây|công viên|phong cảnh|mùa/i,
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=700&q=80',
  },
  // Động vật, mèo, chó, gấu trúc
  {
    pattern: /猫|狗|熊猫|动物|mèo|chó|gấu trúc|động vật/i,
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=700&q=80',
  },
  // Thể thao, chạy bộ, bóng, bơi lội
  {
    pattern: /运动|跑步|跑|打球|篮球|足球|游泳|thể thao|chạy bộ|bóng rổ|bóng đá|bơi/i,
    url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=700&q=80',
  },
  // Bệnh viện, bác sĩ, sức khỏe, thuốc, nghỉ ngơi, ngủ
  {
    pattern: /医院|医生|身体|药|生病|休息|睡觉|累|bệnh viện|bác sĩ|sức khỏe|thuốc|ốm|nghỉ ngơi|ngủ|mệt/i,
    url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=700&q=80',
  },
  // Công việc, văn phòng, công ty
  {
    pattern: /工作|公司|办公室|忙|会议|làm việc|công việc|công ty|văn phòng|bận|họp/i,
    url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=700&q=80',
  },
  // Phim ảnh, âm nhạc, giải trí, tivi
  {
    pattern: /电影|音乐|唱歌|跳舞|电视|看|听|phim|âm nhạc|hát|nhảy|tivi|xem|nghe/i,
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=700&q=80',
  },
];

const FALLBACK_PHOTOS = [
  'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=700&q=80',
];

export function getVocabPhotoUrl(vocab: VocabItem): string {
  const customStored = getStoredCustomImage(vocab.id);
  if (customStored) return customStored;
  if (vocab.imageUrl && vocab.imageUrl.trim()) return vocab.imageUrl.trim();

  const text = `${vocab.word} ${vocab.meaning} ${vocab.exampleMeaning || ''} ${vocab.category || ''}`;
  for (const rule of PHOTO_RULES) {
    if (rule.pattern.test(text)) {
      return rule.url;
    }
  }

  let hash = 0;
  for (let i = 0; i < vocab.word.length; i++) {
    hash = (hash * 31 + vocab.word.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_PHOTOS[hash % FALLBACK_PHOTOS.length];
}

interface VocabIllustrationProps {
  vocab: VocabItem;
  compact?: boolean;
}

export const VocabIllustration: React.FC<VocabIllustrationProps> = ({
  vocab,
  compact = false,
}) => {
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [, setRefreshTick] = useState(0);

  const cleanMeaning = (vocab.meaning || '')
    .replace(/\s*\((?:Boya|Bài|HSK|Giáo trình|Quyển)[^)]*\)/gi, '')
    .trim();

  const photoUrl = getVocabPhotoUrl(vocab);

  const handleSaveCustomPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveStoredCustomImage(vocab.id, customUrlInput);
    setIsEditingImage(false);
    setRefreshTick((t) => t + 1);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingImage(true);
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 400,
        maxHeight: 300,
        quality: 0.72,
        targetMaxKB: 35,
      });
      saveStoredCustomImage(vocab.id, compressed.dataUrl);
      setIsEditingImage(false);
      setRefreshTick((t) => t + 1);
    } catch (err) {
      console.error('Compress vocab upload error:', err);
    } finally {
      setIsProcessingImage(false);
      e.target.value = '';
    }
  };

  const handleQuickAiDraw = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isProcessingImage) return;
    setIsProcessingImage(true);
    try {
      const res = await fetch('/api/gemini/vocab-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: vocab.word,
          pinyin: vocab.pinyin,
          meaning: cleanMeaning || vocab.meaning,
          exampleSentence: vocab.exampleSentence,
        }),
      });
      const data = await safeParseJson<{ svg?: string }>(res);
      if (res.ok && data.svg) {
        const compressed = await compressSvgToWebp(data.svg, {
          maxWidth: 400,
          maxHeight: 300,
          quality: 0.76,
          targetMaxKB: 30,
        });
        saveStoredCustomImage(vocab.id, compressed.dataUrl);
        setIsEditingImage(false);
        setRefreshTick((t) => t + 1);
      }
    } catch (err) {
      console.error('Quick AI draw error:', err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (isEditingImage) e.stopPropagation();
      }}
      className={`relative overflow-hidden rounded-2xl border border-[#E8DFCE] bg-[#F7F4EC] ${
        compact ? 'h-28 sm:h-32' : 'h-36 sm:h-44'
      } w-full max-w-[340px] sm:max-w-[380px] mx-auto shadow-xs group`}
    >
      <img
        src={photoUrl}
        alt={cleanMeaning || vocab.word}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src !== FALLBACK_PHOTOS[0]) {
            target.src = FALLBACK_PHOTOS[0];
          }
        }}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Subtle gradient overlay at bottom for caption readability */}
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/65 via-black/25 to-transparent pointer-events-none" />

      {/* Bottom caption badge */}
      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
        <span className="px-2.5 py-0.5 rounded-lg bg-black/55 backdrop-blur-xs text-white text-[12px] font-bold truncate">
          {cleanMeaning}
        </span>
      </div>

      {/* Button to change/upload custom photo for this vocabulary card */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setCustomUrlInput(getStoredCustomImage(vocab.id) || vocab.imageUrl || '');
          setIsEditingImage((prev) => !prev);
        }}
        title="Đổi ảnh mô tả cho từ vựng này"
        className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/50 hover:bg-[#C85A43] text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
      >
        <ImagePlus className="w-4 h-4" />
      </button>

      {/* Inline Quick Photo Changer Popover */}
      {isEditingImage && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-20 bg-black/85 backdrop-blur-xs p-3 flex flex-col justify-center gap-2 text-left"
        >
          <div className="flex items-center justify-between text-white text-[12px] font-bold">
            <span>Đổi ảnh mô tả cho từ “{vocab.word}”:</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingImage(false);
              }}
              className="p-1 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              placeholder="Dán link ảnh (https://...)"
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-white text-[#1C1E21] text-[12px] font-medium focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSaveCustomPhoto}
              className="px-2.5 py-1.5 rounded-lg bg-[#C85A43] text-white text-[12px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Lưu</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleQuickAiDraw}
                disabled={isProcessingImage}
                className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#1C1E21] text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isProcessingImage ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>{isProcessingImage ? 'Đang xử lý...' : 'Vẽ ảnh AI'}</span>
              </button>

              <label className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold cursor-pointer">
                <span>Tải ảnh &amp; nén</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isProcessingImage}
                  className="hidden"
                />
              </label>
            </div>

            {getStoredCustomImage(vocab.id) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  saveStoredCustomImage(vocab.id, '');
                  setIsEditingImage(false);
                  setRefreshTick((t) => t + 1);
                }}
                className="text-[11px] text-amber-300 hover:underline cursor-pointer"
              >
                Khôi phục
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

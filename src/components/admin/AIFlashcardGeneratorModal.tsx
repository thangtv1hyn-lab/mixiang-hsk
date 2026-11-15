import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Save,
  Volume2,
  Trash2,
  RefreshCw,
  AlertCircle,
  Lightbulb,
  BookOpen,
  Hash,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VocabDeck, VocabItem, HSKLevel } from '../../types/hsk';
import { speakChinese } from '../../utils/audioSpeech';

interface AIFlashcardGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeckCreated: (deck: VocabDeck) => void;
  defaultLevel?: HSKLevel;
}

const HSK_POPULAR_TOPICS = [
  'Ẩm thực & Gọi món Trung Hoa',
  'Giao tiếp Công sở & Họp hành',
  'Sân bay, Khách sạn & Du lịch',
  'Mua sắm, Trả giá & Siêu thị',
  'Khám bệnh, Nhà thuốc & Sức khỏe',
  'Cảm xúc, Tính cách & Sở thích',
  'Thành ngữ tứ tự (成语) HSK 5',
  'Công nghệ thông tin & Mạng xã hội',
];

const BOYA_POPULAR_TOPICS = [
  'Boya Sơ cấp 1: Du học sinh, Ký túc xá & Thư viện',
  'Boya Sơ cấp 1: Mua sắm, Nhà ăn & Cuối tuần ở Bắc Kinh',
  'Boya Sơ cấp 2: Thuê nhà, Chủ nhà & Ấn tượng văn hóa',
  'Boya Sơ cấp 2: Du lịch tàu hỏa, Khám bệnh & Kể chuyện',
  'Boya Trung cấp 1: Nhập gia tùy tục & Giao tiếp thế hệ',
  'Boya Trung cấp 2: Thành ngữ, Tâm lý & Nghị luận xã hội',
];

const BOYA_BOOKS: Array<{
  id: string;
  label: string;
  mappedLevel: HSKLevel;
  defaultTopic: string;
}> = [
  {
    id: 'Giáo trình Boya - Sơ cấp 1',
    label: 'Giáo trình Boya Sơ cấp 1 (博雅汉语·初级起步篇 I · HSK 1-2)',
    mappedLevel: 'HSK 1',
    defaultTopic: 'Boya Sơ cấp 1: Du học sinh, Ký túc xá & Thư viện',
  },
  {
    id: 'Giáo trình Boya - Sơ cấp 2',
    label: 'Giáo trình Boya Sơ cấp 2 (博雅汉语·初级起步篇 II · HSK 2-3)',
    mappedLevel: 'HSK 2',
    defaultTopic: 'Boya Sơ cấp 2: Thuê nhà, Chủ nhà & Ấn tượng văn hóa',
  },
  {
    id: 'Giáo trình Boya - Trung cấp 1',
    label: 'Giáo trình Boya Trung cấp 1 (博雅汉语·准中级加速篇 I · HSK 3-4)',
    mappedLevel: 'HSK 4',
    defaultTopic: 'Boya Trung cấp 1: Nhập gia tùy tục & Giao tiếp thế hệ',
  },
  {
    id: 'Giáo trình Boya - Trung cấp 2',
    label: 'Giáo trình Boya Trung cấp 2 (博雅汉语·中级冲刺篇 · HSK 4-5)',
    mappedLevel: 'HSK 5',
    defaultTopic: 'Boya Trung cấp 2: Thành ngữ, Tâm lý & Nghị luận xã hội',
  },
];

export const AIFlashcardGeneratorModal: React.FC<AIFlashcardGeneratorModalProps> = ({
  isOpen,
  onClose,
  onDeckCreated,
  defaultLevel = 'HSK 2',
}) => {
  const [curriculum, setCurriculum] = useState<'HSK' | 'BOYA'>('HSK');
  const [boyaBook, setBoyaBook] = useState<string>(BOYA_BOOKS[0].id);
  const [topic, setTopic] = useState('Ẩm thực & Gọi món Trung Hoa');
  const [level, setLevel] = useState<HSKLevel>(defaultLevel);
  const [countInput, setCountInput] = useState<string>('10');
  const [color, setColor] = useState('rose');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDeck, setGeneratedDeck] = useState<VocabDeck | null>(null);
  const [editableCards, setEditableCards] = useState<VocabItem[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const parsedCount = Math.max(1, Math.min(500, parseInt(countInput, 10) || 10));

  const handleSelectCurriculum = (nextCurriculum: 'HSK' | 'BOYA') => {
    setCurriculum(nextCurriculum);
    if (nextCurriculum === 'BOYA') {
      const selectedBook = BOYA_BOOKS.find((b) => b.id === boyaBook) || BOYA_BOOKS[0];
      setLevel(selectedBook.mappedLevel);
      setColor('emerald');
      if (HSK_POPULAR_TOPICS.includes(topic)) {
        setTopic(selectedBook.defaultTopic);
      }
    } else {
      setColor('rose');
      if (BOYA_POPULAR_TOPICS.includes(topic)) {
        setTopic(HSK_POPULAR_TOPICS[0]);
      }
    }
  };

  const handleSelectBoyaBook = (bookId: string) => {
    setBoyaBook(bookId);
    const found = BOYA_BOOKS.find((b) => b.id === bookId);
    if (found) {
      setLevel(found.mappedLevel);
      setTopic(found.defaultTopic);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setErrorMsg('Vui lòng nhập chủ đề hoặc bài học cần tạo từ vựng.');
      return;
    }

    const validCount = Math.max(1, Math.min(500, parseInt(countInput, 10) || 10));
    setCountInput(String(validCount));
    setErrorMsg('');
    setIsGenerating(true);
    setGeneratedDeck(null);
    setEditableCards([]);

    try {
      const res = await fetch('/api/vocab/ai-generate-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          level,
          curriculum,
          boyaBook: curriculum === 'BOYA' ? boyaBook : '',
          count: validCount,
          saveImmediately: false,
        }),
      });

      if (!res.ok) {
        throw new Error('Máy chủ AI bận, vui lòng thử lại sau giây lát');
      }

      const data: VocabDeck = await res.json();
      data.color = color;
      setGeneratedDeck(data);
      setEditableCards(data.cards || []);
    } catch (err: any) {
      console.warn('AI deck generation error:', err);
      setErrorMsg(err.message || 'Lỗi khi tạo bộ từ bằng AI. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCardChange = (index: number, field: keyof VocabItem, value: any) => {
    setEditableCards((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDeleteCard = (index: number) => {
    setEditableCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDeck = () => {
    if (!generatedDeck) return;

    const finalCategory =
      curriculum === 'BOYA' ? `${boyaBook} · ${topic.trim()}` : topic.trim();

    const finalDeck: VocabDeck = {
      ...generatedDeck,
      title:
        generatedDeck.title ||
        (curriculum === 'BOYA' ? `${boyaBook}: ${topic}` : `${level}: ${topic}`),
      category: finalCategory,
      level,
      color,
      cards: editableCards.map((c) => ({
        ...c,
        level,
        category: finalCategory,
      })),
      cardCount: editableCards.length,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: 'ai',
    };

    onDeckCreated(finalDeck);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    onClose();
  };

  const suggestedTopics = curriculum === 'BOYA' ? BOYA_POPULAR_TOPICS : HSK_POPULAR_TOPICS;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF7F0] rounded-2xl w-[95vw] max-w-3xl p-4 sm:p-5 shadow-2xl relative border-2 border-[#E6DEC8] max-h-[94vh] overflow-y-auto space-y-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ"
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-xl bg-white border border-[#E6DEC8] text-[#18181B] hover:bg-red-50 hover:text-red-700 hover:border-red-300 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 pr-10">
          <div className="w-10 h-10 rounded-xl bg-red-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif font-black text-[#18181B] text-[18px] sm:text-[20px] leading-tight">
                Tạo Bộ Flashcards Bằng Lão Sư AI
              </h3>
              <span className="text-[12px] font-extrabold px-2.5 py-0.5 rounded-lg bg-[#FDEEE9] text-red-700 border border-[#F5D0C5]">
                Hỗ trợ HSK 1–5 & Giáo trình Boya
              </span>
            </div>
            <p className="text-[13px] sm:text-[14px] text-slate-700 mt-0.5 leading-snug">
              Tự nhập số lượng từ vựng bất kỳ (tối đa 500 từ) hoặc chọn theo Giáo trình Boya / HSK, AI sẽ biên soạn trọn bộ thẻ kèm Pinyin, Hán Việt và câu ví dụ.
            </p>
          </div>
        </div>

        {/* Setup Form */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E6DEC8] space-y-3 shadow-2xs">
          {/* Row 1: Curriculum Switcher (Chuẩn HSK vs Giáo trình Boya) */}
          <div className="space-y-1.5">
            <label className="block text-[13px] sm:text-[14px] font-black text-[#18181B]">
              1. Chọn Hệ Giáo Trình / Chương Trình Học:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectCurriculum('HSK')}
                className={`px-3.5 py-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                  curriculum === 'HSK'
                    ? 'bg-[#FFF9F5] border-red-700 text-[#18181B] shadow-2xs'
                    : 'bg-[#FAF7F0] border-[#E6DEC8] text-slate-700 hover:border-red-400'
                }`}
              >
                <div>
                  <div className="text-[14px] sm:text-[15px] font-black text-[#18181B]">
                    Giáo trình Chuẩn HSK (HSK 1 – HSK 5)
                  </div>
                  <div className="text-[12px] text-slate-600 font-medium">
                    Từ vựng chuẩn khung năng lực Hán ngữ quốc tế
                  </div>
                </div>
                <span
                  className={`w-5 h-5 rounded-full border-2 text-xs flex items-center justify-center shrink-0 ${
                    curriculum === 'HSK' ? 'border-red-700 bg-red-700 text-white' : 'border-slate-400'
                  }`}
                >
                  {curriculum === 'HSK' && '✓'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectCurriculum('BOYA')}
                className={`px-3.5 py-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                  curriculum === 'BOYA'
                    ? 'bg-[#EAF7F0] border-emerald-700 text-[#18181B] shadow-2xs'
                    : 'bg-[#FAF7F0] border-[#E6DEC8] text-slate-700 hover:border-emerald-500'
                }`}
              >
                <div>
                  <div className="text-[14px] sm:text-[15px] font-black text-[#18181B] flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-700" />
                    <span>Giáo trình Boya (博雅汉语)</span>
                  </div>
                  <div className="text-[12px] text-slate-600 font-medium">
                    Boya Sơ cấp 1, Sơ cấp 2, Trung cấp 1 & Trung cấp 2
                  </div>
                </div>
                <span
                  className={`w-5 h-5 rounded-full border-2 text-xs flex items-center justify-center shrink-0 ${
                    curriculum === 'BOYA'
                      ? 'border-emerald-700 bg-emerald-700 text-white'
                      : 'border-slate-400'
                  }`}
                >
                  {curriculum === 'BOYA' && '✓'}
                </span>
              </button>
            </div>
          </div>

          {/* Row 2: Level / Boya Book + Topic Input */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
            <div className="lg:col-span-5">
              <label className="block text-[13px] sm:text-[14px] font-black text-[#18181B] mb-1">
                {curriculum === 'BOYA'
                  ? '2. Chọn Quyển Giáo Trình Boya:'
                  : '2. Cấp độ HSK mục tiêu:'}
              </label>

              {curriculum === 'BOYA' ? (
                <select
                  value={boyaBook}
                  onChange={(e) => handleSelectBoyaBook(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] sm:text-[14px] rounded-xl border-2 border-emerald-600/40 bg-[#EAF7F0]/60 focus:bg-white focus:outline-none focus:border-emerald-700 font-bold text-[#18181B]"
                >
                  {BOYA_BOOKS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as HSKLevel)}
                  className="w-full px-3 py-2 text-[13px] sm:text-[14px] rounded-xl border-2 border-[#E6DEC8] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-red-700 font-bold text-[#18181B]"
                >
                  <option value="HSK 1">HSK 1 (Cơ bản - 150 từ)</option>
                  <option value="HSK 2">HSK 2 (Sơ cấp - 300 từ)</option>
                  <option value="HSK 3">HSK 3 (Trung cấp 1 - 600 từ)</option>
                  <option value="HSK 4">HSK 4 (Trung cấp 2 - 1200 từ)</option>
                  <option value="HSK 5">HSK 5 (Cao cấp - 2500 từ)</option>
                </select>
              )}
            </div>

            <div className="lg:col-span-7">
              <label className="block text-[13px] sm:text-[14px] font-black text-[#18181B] mb-1">
                3. Chủ đề hoặc Bài khóa <span className="text-red-700">*</span>
              </label>
              <input
                type="text"
                placeholder={
                  curriculum === 'BOYA'
                    ? 'Ví dụ: Bài 1-5 Boya Sơ cấp 1, Thuê nhà, Du học Bắc Kinh...'
                    : 'Ví dụ: Gọi món lẩu Tứ Xuyên, Đàm phán thương mại...'
                }
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 text-[13px] sm:text-[14px] rounded-xl border-2 border-[#E6DEC8] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-red-700 font-bold text-[#18181B]"
              />
            </div>
          </div>

          {/* Quick topics chips */}
          <div className="space-y-1.5">
            <span className="text-[12px] sm:text-[13px] font-extrabold text-[#18181B] flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {curriculum === 'BOYA'
                  ? 'Gợi ý các bài học trong Giáo trình Boya:'
                  : 'Gợi ý chủ đề HSK thông dụng:'}
              </span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {suggestedTopics.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className={`text-[12px] sm:text-[13px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    topic === t
                      ? 'bg-red-700 text-white border-red-700 font-bold'
                      : 'bg-[#FAF7F0] text-[#18181B] border-[#E6DEC8] hover:border-red-700 font-medium'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Custom Word Count Input + Quick Presets + Submit Button */}
          <div className="pt-2.5 border-t border-[#E6DEC8] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="custom-word-count-input"
                className="text-[13px] sm:text-[14px] font-black text-[#18181B] flex items-center gap-1"
              >
                <Hash className="w-4 h-4 text-red-700" />
                <span>4. Số lượng từ (tự nhập):</span>
              </label>

              {/* Direct Custom Number Input */}
              <div className="flex items-center gap-1.5">
                <input
                  id="custom-word-count-input"
                  type="number"
                  min={1}
                  max={500}
                  value={countInput}
                  onChange={(e) => setCountInput(e.target.value)}
                  placeholder="Nhập số từ..."
                  className="w-20 px-2.5 py-1.5 rounded-lg border-2 border-red-700 bg-white text-[14px] sm:text-[15px] font-mono font-black text-red-700 text-center focus:outline-none focus:ring-2 focus:ring-red-700/20"
                />
                <span className="text-[13px] font-bold text-slate-600">từ</span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1">
                {[10, 20, 30, 50, 100, 150].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCountInput(String(n))}
                    className={`px-2.5 py-1 rounded-lg text-[12px] sm:text-[13px] font-mono font-extrabold transition-colors cursor-pointer ${
                      parsedCount === n
                        ? 'bg-[#18181B] text-white'
                        : 'bg-[#FAF7F0] text-[#18181B] hover:border-red-700 border border-[#E6DEC8]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-black text-[14px] sm:text-[15px] flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang tạo {parsedCount} thẻ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Tạo {parsedCount} thẻ Flashcard</span>
                </>
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PREVIEW & EDIT SECTION */}
        {generatedDeck && (
          <div className="space-y-3 pt-2.5 border-t border-[#E6DEC8]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3.5 rounded-2xl border border-[#E6DEC8]">
              <div>
                <span className="text-[12px] font-extrabold text-red-700 uppercase tracking-wider block">
                  Đã tạo xong ({editableCards.length} thẻ flashcards)
                </span>
                <h4 className="font-serif font-black text-[#18181B] text-[17px] sm:text-[19px]">
                  {generatedDeck.title}
                </h4>
                <p className="text-[13px] text-slate-600 mt-0.5">
                  {generatedDeck.description}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveDeck}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[14px] flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>Lưu vào Bộ Từ Vựng</span>
              </button>
            </div>

            {/* List of generated cards */}
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {editableCards.map((card, idx) => (
                <div
                  key={card.id || idx}
                  className="bg-white border border-[#E6DEC8] rounded-2xl p-3 shadow-2xs space-y-2 hover:border-red-700/60 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#FDEEE9] text-red-700 text-[12px] font-mono font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => speakChinese(card.word)}
                        className="px-2.5 py-1 rounded-lg bg-[#FAF7F0] text-[#18181B] hover:bg-red-700 hover:text-white border border-[#E6DEC8] text-[12px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Nghe</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteCard(idx)}
                      className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Xóa thẻ này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-600 mb-0.5">
                        Chữ Hán
                      </label>
                      <input
                        type="text"
                        value={card.word}
                        onChange={(e) => handleCardChange(idx, 'word', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#E6DEC8] text-[16px] font-black text-[#18181B] font-serif"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-600 mb-0.5">
                        Pinyin
                      </label>
                      <input
                        type="text"
                        value={card.pinyin}
                        onChange={(e) => handleCardChange(idx, 'pinyin', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#E6DEC8] text-[14px] font-mono font-bold text-red-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-600 mb-0.5">
                        Hán Việt
                      </label>
                      <input
                        type="text"
                        value={card.sinoVietnamese || ''}
                        onChange={(e) => handleCardChange(idx, 'sinoVietnamese', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#E6DEC8] text-[14px] font-bold text-[#18181B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-600 mb-0.5">
                        Nghĩa tiếng Việt
                      </label>
                      <input
                        type="text"
                        value={card.meaning}
                        onChange={(e) => handleCardChange(idx, 'meaning', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#E6DEC8] text-[14px] font-extrabold text-red-800"
                      />
                    </div>
                  </div>

                  <div className="bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E6DEC8] space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-slate-600 w-16 shrink-0">
                        Ví dụ:
                      </span>
                      <input
                        type="text"
                        value={card.exampleSentence || ''}
                        onChange={(e) => handleCardChange(idx, 'exampleSentence', e.target.value)}
                        className="w-full px-2.5 py-1 rounded-lg border border-[#E6DEC8] bg-white font-serif text-[14px] font-bold text-[#18181B]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-slate-600 w-16 shrink-0">
                        Dịch nghĩa:
                      </span>
                      <input
                        type="text"
                        value={card.exampleMeaning || ''}
                        onChange={(e) => handleCardChange(idx, 'exampleMeaning', e.target.value)}
                        className="w-full px-2.5 py-1 rounded-lg border border-[#E6DEC8] bg-white text-[13px] text-slate-700 font-medium"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6DEC8]">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl border border-[#E6DEC8] bg-white text-[13px] font-bold text-[#18181B] hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveDeck}
                className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-black text-[14px] flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Hoàn tất & Lưu bộ Flashcard này</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

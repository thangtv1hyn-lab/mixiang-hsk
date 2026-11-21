import React, { useState, useRef } from 'react';
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
  Image as ImageIcon,
  Upload,
  Square,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VocabDeck, VocabItem, HSKLevel } from '../../types/hsk';
import { speakChinese } from '../../utils/audioSpeech';
import {
  compressImageFile,
  compressSvgToWebp,
  estimateDataUrlKB,
} from '../../utils/imageCompression';
import { safeParseJson } from '../../utils/safeFetchJson';

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
  const [aiNotice, setAiNotice] = useState('');

  // Per-card & batch AI illustration states
  const [generatingImgIdx, setGeneratingImgIdx] = useState<number | null>(null);
  const [isBatchGeneratingImages, setIsBatchGeneratingImages] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const batchAbortRef = useRef(false);

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
    setAiNotice('');
    setIsGenerating(true);
    setGeneratedDeck(null);
    setEditableCards([]);
    batchAbortRef.current = true;
    setIsBatchGeneratingImages(false);

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

      const data = await safeParseJson<any>(
        res,
        'Máy chủ AI bận, vui lòng thử lại sau giây lát'
      );
      if (!res.ok) {
        throw new Error(data.error || 'Máy chủ AI bận, vui lòng thử lại sau giây lát');
      }

      data.color = color;
      setGeneratedDeck(data);
      setEditableCards(data.cards || []);
      if (data.aiNotice) {
        setAiNotice(data.aiNotice);
      }
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

  const generateAiImageForCard = async (index: number, card: VocabItem): Promise<boolean> => {
    if (!card?.word?.trim()) return false;
    setGeneratingImgIdx(index);
    setErrorMsg('');
    try {
      const res = await fetch('/api/gemini/vocab-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: card.word,
          pinyin: card.pinyin,
          meaning: card.meaning,
          exampleSentence: card.exampleSentence,
        }),
      });
      const data = await safeParseJson<{ svg?: string; error?: string }>(
        res,
        'Không thể tạo ảnh AI cho thẻ này.'
      );
      if (!res.ok || !data.svg) {
        throw new Error(data.error || 'Không thể tạo ảnh AI cho thẻ này.');
      }
      const compressed = await compressSvgToWebp(data.svg, {
        maxWidth: 400,
        maxHeight: 300,
        quality: 0.78,
        targetMaxKB: 30,
      });
      handleCardChange(index, 'imageUrl', compressed.dataUrl);
      return true;
    } catch (err: any) {
      setErrorMsg(err?.message || `Không thể tạo ảnh cho từ "${card.word}".`);
      return false;
    } finally {
      setGeneratingImgIdx((prev) => (prev === index ? null : prev));
    }
  };

  const handleManualCardImage = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 420,
        maxHeight: 315,
        quality: 0.74,
        targetMaxKB: 36,
      });
      handleCardChange(index, 'imageUrl', compressed.dataUrl);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi nén ảnh tải lên.');
    } finally {
      e.target.value = '';
    }
  };

  const handleBatchGenerateAiImages = async () => {
    if (isBatchGeneratingImages || editableCards.length === 0) return;

    // Limit single batch click to max 10 missing-image cards so it stays snappy on free API
    const targetIndices = editableCards
      .map((c, idx) => ({ c, idx }))
      .filter(({ c }) => !c.imageUrl)
      .slice(0, 10)
      .map(({ idx }) => idx);

    if (targetIndices.length === 0) return;

    batchAbortRef.current = false;
    setIsBatchGeneratingImages(true);
    setBatchProgress({ done: 0, total: targetIndices.length });

    let completed = 0;
    for (const idx of targetIndices) {
      if (batchAbortRef.current) break;
      const cardSnapshot = editableCards[idx];
      if (!cardSnapshot) continue;
      await generateAiImageForCard(idx, cardSnapshot);
      completed += 1;
      setBatchProgress({ done: completed, total: targetIndices.length });
    }

    setIsBatchGeneratingImages(false);
  };

  const handleSaveDeck = () => {
    if (!generatedDeck) return;
    batchAbortRef.current = true;

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
  const cardsWithImageCount = editableCards.filter((c) => Boolean(c.imageUrl)).length;
  const missingImageCount = editableCards.length - cardsWithImageCount;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FAF7F0] rounded-2xl w-[96vw] max-w-4xl p-4 sm:p-6 shadow-2xl relative border border-[#EAE5DC] max-h-[94vh] overflow-y-auto space-y-4"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ"
          className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white border border-[#EAE5DC] text-[#1C1E21] hover:bg-red-50 hover:text-red-700 hover:border-red-300 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 pr-10">
          <div className="w-11 h-11 rounded-xl bg-[#C85A43] text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-sans font-extrabold text-[#1C1E21] text-[18px] sm:text-[20px] leading-tight">
                Tạo Bộ Flashcards Bằng Lão Sư AI
              </h3>
              <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-lg bg-[#FCECE8] text-[#C85A43]">
                API Free · HSK 1–5 &amp; Boya
              </span>
            </div>
            <p className="text-[13px] sm:text-[14px] text-slate-600 mt-0.5 leading-snug">
              AI tự động soạn từ vựng kèm Pinyin, Hán Việt, câu ví dụ — hỗ trợ tạo ảnh minh họa AI &amp; tải ảnh thủ công tự động nén nhẹ (~15–35 KB).
            </p>
          </div>
        </div>

        {/* Setup Form */}
        <div className="bg-white p-4 rounded-2xl border border-[#EAE5DC] space-y-3.5">
          {/* Row 1: Curriculum Switcher */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-bold text-[#1C1E21]">
              1. Chọn Hệ Giáo Trình / Chương Trình Học:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectCurriculum('HSK')}
                className={`px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  curriculum === 'HSK'
                    ? 'bg-[#FFF5F3] border-[#C85A43] text-[#1C1E21]'
                    : 'bg-[#FAF7F0] border-[#EAE5DC] text-slate-700 hover:border-[#C85A43]/60'
                }`}
              >
                <div>
                  <div className="text-[14px] font-bold text-[#1C1E21]">
                    Giáo trình Chuẩn HSK (HSK 1 – HSK 5)
                  </div>
                  <div className="text-[12px] text-slate-600">
                    Từ vựng chuẩn khung năng lực Hán ngữ quốc tế
                  </div>
                </div>
                <span
                  className={`w-5 h-5 rounded-full border-2 text-xs flex items-center justify-center shrink-0 ${
                    curriculum === 'HSK'
                      ? 'border-[#C85A43] bg-[#C85A43] text-white'
                      : 'border-slate-300'
                  }`}
                >
                  {curriculum === 'HSK' && '✓'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectCurriculum('BOYA')}
                className={`px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  curriculum === 'BOYA'
                    ? 'bg-[#EAF7F0] border-emerald-700 text-[#1C1E21]'
                    : 'bg-[#FAF7F0] border-[#EAE5DC] text-slate-700 hover:border-emerald-500'
                }`}
              >
                <div>
                  <div className="text-[14px] font-bold text-[#1C1E21] flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-700" />
                    <span>Giáo trình Boya (博雅汉语)</span>
                  </div>
                  <div className="text-[12px] text-slate-600">
                    Boya Sơ cấp 1, Sơ cấp 2, Trung cấp 1 &amp; Trung cấp 2
                  </div>
                </div>
                <span
                  className={`w-5 h-5 rounded-full border-2 text-xs flex items-center justify-center shrink-0 ${
                    curriculum === 'BOYA'
                      ? 'border-emerald-700 bg-emerald-700 text-white'
                      : 'border-slate-300'
                  }`}
                >
                  {curriculum === 'BOYA' && '✓'}
                </span>
              </button>
            </div>
          </div>

          {/* Row 2: Level / Boya Book + Topic Input */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-5">
              <label className="block text-[13px] font-bold text-[#1C1E21] mb-1">
                {curriculum === 'BOYA'
                  ? '2. Chọn Quyển Giáo Trình Boya:'
                  : '2. Cấp độ HSK mục tiêu:'}
              </label>

              {curriculum === 'BOYA' ? (
                <select
                  value={boyaBook}
                  onChange={(e) => handleSelectBoyaBook(e.target.value)}
                  className="w-full px-3 py-2.5 text-[13.5px] rounded-xl border border-emerald-600/40 bg-[#EAF7F0]/60 focus:bg-white focus:outline-none focus:border-emerald-700 font-semibold text-[#1C1E21]"
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
                  className="w-full px-3 py-2.5 text-[13.5px] rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-[#C85A43] font-semibold text-[#1C1E21]"
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
              <label className="block text-[13px] font-bold text-[#1C1E21] mb-1">
                3. Chủ đề hoặc Bài khóa <span className="text-red-600">*</span>
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
                className="w-full px-3.5 py-2.5 text-[13.5px] rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-[#C85A43] font-semibold text-[#1C1E21]"
              />
            </div>
          </div>

          {/* Quick topics chips */}
          <div className="space-y-1.5">
            <span className="text-[12px] font-bold text-slate-600 flex items-center gap-1.5">
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
                  className={`text-[12px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    topic === t
                      ? 'bg-[#C85A43] text-white border-[#C85A43] font-bold'
                      : 'bg-[#FAF7F0] text-[#1C1E21] border-[#EAE5DC] hover:border-[#C85A43] font-medium'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Custom Word Count Input + Quick Presets + Submit Button */}
          <div className="pt-3 border-t border-[#EAE5DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="custom-word-count-input"
                className="text-[13px] font-bold text-[#1C1E21] flex items-center gap-1"
              >
                <Hash className="w-4 h-4 text-[#C85A43]" />
                <span>4. Số lượng từ:</span>
              </label>

              <div className="flex items-center gap-1.5">
                <input
                  id="custom-word-count-input"
                  type="number"
                  min={1}
                  max={500}
                  value={countInput}
                  onChange={(e) => setCountInput(e.target.value)}
                  className="w-20 px-2.5 py-1.5 rounded-lg border-2 border-[#C85A43] bg-white text-[14px] font-mono font-black text-[#C85A43] text-center focus:outline-none tabular-nums"
                />
                <span className="text-[13px] font-semibold text-slate-600">từ</span>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {[5, 10, 20, 30, 50].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCountInput(String(n))}
                    className={`px-2.5 py-1 rounded-lg text-[12px] font-mono font-bold transition-colors cursor-pointer tabular-nums ${
                      parsedCount === n
                        ? 'bg-[#1C1E21] text-white'
                        : 'bg-[#FAF7F0] text-[#1C1E21] hover:border-[#C85A43] border border-[#EAE5DC]'
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
              className="px-4 py-2.5 min-h-[42px] rounded-xl bg-[#C85A43] hover:bg-[#B24A34] text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
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
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {aiNotice && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[13px] font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{aiNotice}</span>
          </div>
        )}

        {/* PREVIEW & EDIT SECTION */}
        {generatedDeck && (
          <div className="space-y-3.5 pt-3 border-t border-[#EAE5DC]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EAE5DC]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[12px] font-bold text-[#C85A43] tabular-nums">
                  <span>Đã tạo {editableCards.length} thẻ</span>
                  <span>·</span>
                  <span className="text-emerald-700">
                    {cardsWithImageCount}/{editableCards.length} thẻ có ảnh mô tả
                  </span>
                </div>
                <h4 className="font-sans font-extrabold text-[#1C1E21] text-[17px] truncate mt-0.5">
                  {generatedDeck.title}
                </h4>
                <p className="text-[13px] text-slate-600 mt-0.5 line-clamp-2">
                  {generatedDeck.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {isBatchGeneratingImages ? (
                  <button
                    type="button"
                    onClick={() => {
                      batchAbortRef.current = true;
                    }}
                    className="px-3.5 py-2.5 min-h-[42px] rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-bold text-[13px] flex items-center gap-1.5 cursor-pointer tabular-nums"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>
                      Đang vẽ &amp; nén ({batchProgress.done}/{batchProgress.total}) · Dừng
                    </span>
                  </button>
                ) : (
                  missingImageCount > 0 && (
                    <button
                      type="button"
                      onClick={handleBatchGenerateAiImages}
                      disabled={generatingImgIdx !== null}
                      className="px-3.5 py-2.5 min-h-[42px] rounded-xl bg-[#1C1E21] hover:bg-black text-amber-300 font-bold text-[13px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Tạo tối đa 10 ảnh minh họa AI mỗi lượt và tự động nén nhẹ"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>
                        Vẽ ảnh AI ({Math.min(missingImageCount, 10)} thẻ)
                      </span>
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={handleSaveDeck}
                  disabled={isBatchGeneratingImages}
                  className="px-4 py-2.5 min-h-[42px] rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[13.5px] flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu vào Bộ Từ Vựng</span>
                </button>
              </div>
            </div>

            {/* List of generated cards */}
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {editableCards.map((card, idx) => {
                const imgKB = card.imageUrl?.startsWith('data:')
                  ? estimateDataUrlKB(card.imageUrl)
                  : 0;
                const isThisImgLoading = generatingImgIdx === idx;

                return (
                  <div
                    key={card.id || idx}
                    className="bg-white border border-[#EAE5DC] rounded-2xl p-3.5 space-y-2.5 hover:border-[#C85A43]/60 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#FCECE8] text-[#C85A43] text-[12px] font-mono font-black flex items-center justify-center shrink-0 tabular-nums">
                          {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => speakChinese(card.word)}
                          className="px-2.5 py-1 rounded-lg bg-[#FAF7F0] text-[#1C1E21] hover:bg-[#C85A43] hover:text-white border border-[#EAE5DC] text-[12px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Nghe phát âm"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Nghe</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => generateAiImageForCard(idx, card)}
                          disabled={isThisImgLoading || isBatchGeneratingImages}
                          className="px-2.5 py-1 rounded-lg bg-[#1C1E21] hover:bg-black text-amber-300 text-[12px] font-bold flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isThisImgLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          <span>{isThisImgLoading ? 'Đang vẽ...' : 'Ảnh AI'}</span>
                        </button>

                        <label className="px-2.5 py-1 rounded-lg bg-[#FAF7F0] hover:bg-[#FFF5F3] border border-[#EAE5DC] hover:border-[#C85A43] text-[#1C1E21] text-[12px] font-bold inline-flex items-center gap-1 cursor-pointer">
                          <Upload className="w-3.5 h-3.5 text-[#C85A43]" />
                          <span>Tải ảnh</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleManualCardImage(idx, e)}
                            className="hidden"
                          />
                        </label>

                        {card.imageUrl && (
                          <span className="text-[11.5px] font-mono font-bold text-emerald-700 flex items-center gap-1 tabular-nums">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{imgKB > 0 ? `${imgKB} KB` : 'Đã có ảnh'}</span>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteCard(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa thẻ này"
                        aria-label="Xóa thẻ này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {card.imageUrl && (
                        <div className="w-full sm:w-28 aspect-[4/3] rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] overflow-hidden relative shrink-0">
                          <img
                            src={card.imageUrl}
                            alt={card.meaning || card.word}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleCardChange(idx, 'imageUrl', undefined)}
                            title="Gỡ ảnh"
                            className="absolute top-1 right-1 w-6 h-6 rounded-md bg-black/65 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[11.5px] font-bold text-slate-600 mb-0.5">
                              Chữ Hán
                            </label>
                            <input
                              type="text"
                              value={card.word}
                              onChange={(e) => handleCardChange(idx, 'word', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#EAE5DC] text-[15px] font-black text-[#1C1E21] font-serif"
                            />
                          </div>
                          <div>
                            <label className="block text-[11.5px] font-bold text-slate-600 mb-0.5">
                              Pinyin
                            </label>
                            <input
                              type="text"
                              value={card.pinyin}
                              onChange={(e) => handleCardChange(idx, 'pinyin', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#EAE5DC] text-[13px] font-mono font-bold text-[#C85A43]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11.5px] font-bold text-slate-600 mb-0.5">
                              Hán Việt
                            </label>
                            <input
                              type="text"
                              value={card.sinoVietnamese || ''}
                              onChange={(e) =>
                                handleCardChange(idx, 'sinoVietnamese', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#EAE5DC] text-[13px] font-semibold text-[#1C1E21]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11.5px] font-bold text-slate-600 mb-0.5">
                              Nghĩa tiếng Việt
                            </label>
                            <input
                              type="text"
                              value={card.meaning}
                              onChange={(e) => handleCardChange(idx, 'meaning', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#EAE5DC] text-[13px] font-bold text-[#1C1E21]"
                            />
                          </div>
                        </div>

                        <div className="bg-[#FAF7F0] p-2.5 rounded-xl border border-[#EAE5DC] space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[11.5px] font-bold text-slate-600 w-16 shrink-0">
                              Ví dụ:
                            </span>
                            <input
                              type="text"
                              value={card.exampleSentence || ''}
                              onChange={(e) =>
                                handleCardChange(idx, 'exampleSentence', e.target.value)
                              }
                              className="w-full px-2.5 py-1 rounded-lg border border-[#EAE5DC] bg-white font-serif text-[13.5px] font-bold text-[#1C1E21]"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11.5px] font-bold text-slate-600 w-16 shrink-0">
                              Dịch nghĩa:
                            </span>
                            <input
                              type="text"
                              value={card.exampleMeaning || ''}
                              onChange={(e) =>
                                handleCardChange(idx, 'exampleMeaning', e.target.value)
                              }
                              className="w-full px-2.5 py-1 rounded-lg border border-[#EAE5DC] bg-white text-[12.5px] text-slate-700 font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE5DC]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 min-h-[42px] rounded-xl border border-[#EAE5DC] bg-white text-[13px] font-bold text-[#1C1E21] hover:bg-[#FAF7F0] cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveDeck}
                disabled={isBatchGeneratingImages}
                className="px-5 py-2 min-h-[42px] rounded-xl bg-[#C85A43] hover:bg-[#B24A34] text-white font-bold text-[14px] flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Hoàn tất &amp; Lưu bộ Flashcard</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

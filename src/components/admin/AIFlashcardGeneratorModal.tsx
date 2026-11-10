import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Bot,
  Layers,
  Save,
  Volume2,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
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

const POPULAR_TOPICS = [
  'Ẩm thực & Gọi món Trung Hoa',
  'Giao tiếp Công sở & Họp hành',
  'Sân bay, Khách sạn & Du lịch',
  'Mua sắm, Trả giá & Siêu thị',
  'Khám bệnh, Nhà thuốc & Sức khỏe',
  'Cảm xúc, Tính cách & Sở thích',
  'Thành ngữ tứ tự (成语) HSK 5',
  'Công nghệ thông tin & Mạng xã hội',
];

export const AIFlashcardGeneratorModal: React.FC<AIFlashcardGeneratorModalProps> = ({
  isOpen,
  onClose,
  onDeckCreated,
  defaultLevel = 'HSK 2',
}) => {
  const [topic, setTopic] = useState('Ẩm thực & Gọi món Trung Hoa');
  const [level, setLevel] = useState<HSKLevel>(defaultLevel);
  const [count, setCount] = useState<number>(8);
  const [color, setColor] = useState('purple');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDeck, setGeneratedDeck] = useState<VocabDeck | null>(null);
  const [editableCards, setEditableCards] = useState<VocabItem[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setErrorMsg('Vui lòng nhập chủ đề từ vựng cần tạo.');
      return;
    }

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
          count,
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

    const finalDeck: VocabDeck = {
      ...generatedDeck,
      title: generatedDeck.title || `${level}: ${topic}`,
      category: topic,
      color,
      cards: editableCards,
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl relative border border-slate-100 max-h-[92vh] overflow-y-auto space-y-5">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-lg">
                Tạo Bộ Flashcards Bằng Lão Sư AI
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Nhập chủ đề bất kỳ, AI sẽ tự động biên soạn trọn bộ từ vựng chuẩn HSK kèm Pinyin, Hán Việt và câu ví dụ
            </p>
          </div>
        </div>

        {/* Setup Form */}
        <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Chủ đề bộ từ vựng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Gọi món lẩu Tứ Xuyên, Đàm phán giá cả..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Cấp độ HSK mục tiêu
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as HSKLevel)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-semibold text-purple-900"
              >
                <option value="HSK 1">HSK 1 (Cơ bản)</option>
                <option value="HSK 2">HSK 2 (Sơ cấp)</option>
                <option value="HSK 3">HSK 3 (Trung cấp 1)</option>
                <option value="HSK 4">HSK 4 (Trung cấp 2)</option>
                <option value="HSK 5">HSK 5 (Cao cấp)</option>
              </select>
            </div>
          </div>

          {/* Quick topics chips */}
          <div>
            <span className="text-[11px] font-semibold text-purple-900 flex items-center gap-1 mb-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Gợi ý chủ đề thông dụng:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    topic === t
                      ? 'bg-purple-600 text-white border-purple-600 font-bold'
                      : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-100/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">Số lượng từ:</span>
              <div className="flex gap-1">
                {[6, 8, 10, 12].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCount(n)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer ${
                      count === n
                        ? 'bg-purple-700 text-white'
                        : 'bg-white text-slate-600 hover:bg-purple-100 border border-purple-200'
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Lão Sư AI đang biên soạn...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bắt đầu tạo bộ Flashcard</span>
                </>
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PREVIEW & EDIT SECTION */}
        {generatedDeck && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
                  Đã tạo xong ({editableCards.length} thẻ flashcards)
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm">
                  {generatedDeck.title}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {generatedDeck.description}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveDeck}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu vào Hệ Thống</span>
              </button>
            </div>

            {/* List of generated cards */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {editableCards.map((card, idx) => (
                <div
                  key={card.id || idx}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => speakChinese(card.word)}
                        className="p-1 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteCard(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Xóa thẻ này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        Chữ Hán
                      </label>
                      <input
                        type="text"
                        value={card.word}
                        onChange={(e) => handleCardChange(idx, 'word', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-900 font-serif"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        Pinyin
                      </label>
                      <input
                        type="text"
                        value={card.pinyin}
                        onChange={(e) => handleCardChange(idx, 'pinyin', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-purple-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        Hán Việt
                      </label>
                      <input
                        type="text"
                        value={card.sinoVietnamese || ''}
                        onChange={(e) => handleCardChange(idx, 'sinoVietnamese', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        Nghĩa tiếng Việt
                      </label>
                      <input
                        type="text"
                        value={card.meaning}
                        onChange={(e) => handleCardChange(idx, 'meaning', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-rose-700"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">Ví dụ:</span>
                      <input
                        type="text"
                        value={card.exampleSentence || ''}
                        onChange={(e) => handleCardChange(idx, 'exampleSentence', e.target.value)}
                        className="w-full px-2 py-1 rounded-md border border-slate-200 bg-white font-serif text-slate-800"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">Dịch:</span>
                      <input
                        type="text"
                        value={card.exampleMeaning || ''}
                        onChange={(e) => handleCardChange(idx, 'exampleMeaning', e.target.value)}
                        className="w-full px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-600 italic"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveDeck}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Hoàn tất & Lưu bộ Flashcard này</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

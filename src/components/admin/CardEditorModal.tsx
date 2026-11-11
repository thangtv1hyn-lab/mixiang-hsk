import React, { useState, useEffect } from 'react';
import { X, Volume2, Save, CreditCard, Sparkles } from 'lucide-react';
import { VocabItem, HSKLevel } from '../../types/hsk';
import { speakChinese } from '../../utils/audioSpeech';

interface CardEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: VocabItem) => void;
  initialCard?: VocabItem | null;
  deckLevel: HSKLevel;
  deckCategory?: string;
}

export const CardEditorModal: React.FC<CardEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCard,
  deckLevel,
  deckCategory,
}) => {
  const isEditing = Boolean(initialCard);

  const [word, setWord] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [sinoVietnamese, setSinoVietnamese] = useState('');
  const [meaning, setMeaning] = useState('');
  const [exampleSentence, setExampleSentence] = useState('');
  const [examplePinyin, setExamplePinyin] = useState('');
  const [exampleMeaning, setExampleMeaning] = useState('');
  const [radical, setRadical] = useState('');
  const [strokeCount, setStrokeCount] = useState(6);

  useEffect(() => {
    if (initialCard) {
      setWord(initialCard.word);
      setPinyin(initialCard.pinyin);
      setSinoVietnamese(initialCard.sinoVietnamese || '');
      setMeaning(initialCard.meaning);
      setExampleSentence(initialCard.exampleSentence || '');
      setExamplePinyin(initialCard.examplePinyin || '');
      setExampleMeaning(initialCard.exampleMeaning || '');
      setRadical(initialCard.radical || '');
      setStrokeCount(initialCard.strokeCount || 6);
    } else {
      setWord('');
      setPinyin('');
      setSinoVietnamese('');
      setMeaning('');
      setExampleSentence('');
      setExamplePinyin('');
      setExampleMeaning('');
      setRadical('');
      setStrokeCount(6);
    }
  }, [initialCard, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !pinyin.trim() || !meaning.trim()) return;

    const savedCard: VocabItem = {
      id: initialCard ? initialCard.id : `v-card-${Date.now()}`,
      word: word.trim(),
      pinyin: pinyin.trim(),
      sinoVietnamese: sinoVietnamese.trim(),
      meaning: meaning.trim(),
      level: deckLevel,
      category: deckCategory || 'Tổng hợp',
      exampleSentence: exampleSentence.trim() || `${word.trim()}。`,
      examplePinyin: examplePinyin.trim(),
      exampleMeaning: exampleMeaning.trim(),
      radical: radical.trim(),
      strokeCount: Number(strokeCount) || 1,
    };

    onSave(savedCard);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              {isEditing ? 'Chỉnh Sửa Thẻ Flashcard' : 'Thêm Thẻ Flashcard Mới'}
            </h3>
            <p className="text-xs text-slate-500">
              Cấp độ: <span className="font-bold text-rose-600">{deckLevel}</span> | Nhập đầy đủ Hán tự, Pinyin và câu ví dụ
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Chữ Hán (Từ vựng) <span className="text-rose-500">*</span>
                </label>
                {word && (
                  <button
                    type="button"
                    onClick={() => speakChinese(word)}
                    className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    Nghe phát âm
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="Ví dụ: 预订"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-serif"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phiên âm Pinyin <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: yùdìng"
                value={pinyin}
                onChange={(e) => setPinyin(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Âm Hán Việt
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Dự đính"
                value={sinoVietnamese}
                onChange={(e) => setSinoVietnamese(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nghĩa tiếng Việt <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Đặt trước (vé, phòng)"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bộ thủ (Radical)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: 讠 (Ngôn)"
                value={radical}
                onChange={(e) => setRadical(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số nét viết
              </label>
              <input
                type="number"
                min={1}
                max={40}
                value={strokeCount}
                onChange={(e) => setStrokeCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              Câu ví dụ minh họa thực tế
            </span>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-medium text-slate-600">
                  Câu tiếng Trung
                </label>
                {exampleSentence && (
                  <button
                    type="button"
                    onClick={() => speakChinese(exampleSentence)}
                    className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    Nghe câu ví dụ
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="Ví dụ: 我想预订一张明天去北京的机票。"
                value={exampleSentence}
                onChange={(e) => setExampleSentence(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-serif"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Pinyin câu ví dụ
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Wǒ xiǎng yùdìng yī zhāng míngtiān qù Běijīng de jīpiào."
                value={examplePinyin}
                onChange={(e) => setExamplePinyin(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Dịch nghĩa câu ví dụ
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Tôi muốn đặt trước một vé máy bay đi Bắc Kinh vào ngày mai."
                value={exampleMeaning}
                onChange={(e) => setExampleMeaning(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Lưu thẻ' : 'Thêm vào bộ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

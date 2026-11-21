import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Volume2,
  Save,
  CreditCard,
  Sparkles,
  Upload,
  Trash2,
  Image as ImageIcon,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { VocabItem, HSKLevel } from '../../types/hsk';
import { speakChinese } from '../../utils/audioSpeech';
import {
  compressImageFile,
  compressSvgToWebp,
  estimateDataUrlKB,
} from '../../utils/imageCompression';
import { safeParseJson } from '../../utils/safeFetchJson';

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
  const [imageUrl, setImageUrl] = useState('');

  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [isCompressingImg, setIsCompressingImg] = useState(false);
  const [imgStatusMsg, setImgStatusMsg] = useState('');
  const [imgErrorMsg, setImgErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setImageUrl(initialCard.imageUrl || '');
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
      setImageUrl('');
    }
    setImgStatusMsg('');
    setImgErrorMsg('');
  }, [initialCard, isOpen]);

  if (!isOpen) return null;

  const handleManualImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgErrorMsg('');
    setImgStatusMsg('');
    setIsCompressingImg(true);
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 420,
        maxHeight: 315,
        quality: 0.74,
        targetMaxKB: 38,
      });
      setImageUrl(compressed.dataUrl);
      setImgStatusMsg(
        `Đã nén ảnh thủ công: ${compressed.originalKB} KB → ${compressed.compressedKB} KB (${compressed.format.toUpperCase()})`
      );
    } catch (err: any) {
      setImgErrorMsg(err?.message || 'Không thể nén hình ảnh này. Vui lòng chọn ảnh khác.');
    } finally {
      setIsCompressingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerateAiImage = async () => {
    if (!word.trim()) {
      setImgErrorMsg('Vui lòng nhập Chữ Hán (và Nghĩa tiếng Việt) trước khi tạo ảnh bằng AI.');
      return;
    }
    setImgErrorMsg('');
    setImgStatusMsg('');
    setIsGeneratingImg(true);
    try {
      const res = await fetch('/api/gemini/vocab-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: word.trim(),
          pinyin: pinyin.trim(),
          meaning: meaning.trim(),
          exampleSentence: exampleSentence.trim(),
        }),
      });
      const data = await safeParseJson<{ svg?: string; error?: string }>(
        res,
        'Không thể tạo ảnh minh họa AI lúc này.'
      );
      if (!res.ok || !data.svg) {
        throw new Error(data.error || 'Không thể tạo ảnh minh họa AI lúc này.');
      }
      const compressed = await compressSvgToWebp(data.svg, {
        maxWidth: 400,
        maxHeight: 300,
        quality: 0.78,
        targetMaxKB: 32,
      });
      setImageUrl(compressed.dataUrl);
      setImgStatusMsg(
        `AI đã vẽ & nén nhẹ: ${compressed.compressedKB} KB (${compressed.format.toUpperCase()})`
      );
    } catch (err: any) {
      setImgErrorMsg(err?.message || 'Lỗi kết nối AI tạo ảnh. Vui lòng thử lại.');
    } finally {
      setIsGeneratingImg(false);
    }
  };

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
      imageUrl: imageUrl.trim() || undefined,
    };

    onSave(savedCard);
    onClose();
  };

  const currentImageKB = imageUrl.startsWith('data:') ? estimateDataUrlKB(imageUrl) : 0;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative border border-[#EAE5DC] max-h-[92vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ"
          className="absolute top-5 right-5 w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-[#FAF7F0] flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 pr-10">
          <div className="w-10 h-10 rounded-xl bg-[#FCECE8] text-[#C85A43] flex items-center justify-center font-bold shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#1C1E21] text-[17px]">
              {isEditing ? 'Chỉnh Sửa Thẻ Flashcard' : 'Thêm Thẻ Flashcard Mới'}
            </h3>
            <p className="text-[12.5px] text-slate-500">
              Cấp độ: <span className="font-bold text-[#C85A43]">{deckLevel}</span> · Hỗ trợ ảnh minh họa AI &amp; tải ảnh thủ công tự nén nhẹ
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[12.5px] font-bold text-[#1C1E21]">
                  Chữ Hán (Từ vựng) <span className="text-red-600">*</span>
                </label>
                {word && (
                  <button
                    type="button"
                    onClick={() => speakChinese(word)}
                    className="text-[11.5px] text-[#C85A43] hover:text-[#B24A34] flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Nghe đọc</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="Ví dụ: 预订"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                className="w-full px-3.5 py-2.5 text-[15px] font-bold rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-[#C85A43] font-serif"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-bold text-[#1C1E21] mb-1">
                Phiên âm Pinyin <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: yùdìng"
                value={pinyin}
                onChange={(e) => setPinyin(e.target.value)}
                className="w-full px-3.5 py-2.5 text-[13.5px] rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-[#C85A43] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-bold text-[#1C1E21] mb-1">
                Âm Hán Việt
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Dự đính"
                value={sinoVietnamese}
                onChange={(e) => setSinoVietnamese(e.target.value)}
                className="w-full px-3.5 py-2.5 text-[13.5px] rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-[#C85A43]"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-bold text-[#1C1E21] mb-1">
                Nghĩa tiếng Việt <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Đặt trước (vé, phòng)"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                className="w-full px-3.5 py-2.5 text-[13.5px] rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-[#C85A43]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-bold text-[#1C1E21] mb-1">
                Bộ thủ (Radical)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: 讠 (Ngôn)"
                value={radical}
                onChange={(e) => setRadical(e.target.value)}
                className="w-full px-3.5 py-2 text-[13px] rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-[#C85A43]"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-bold text-[#1C1E21] mb-1">
                Số nét viết
              </label>
              <input
                type="number"
                min={1}
                max={40}
                value={strokeCount}
                onChange={(e) => setStrokeCount(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-[13px] rounded-xl border border-[#EAE5DC] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-[#C85A43] tabular-nums"
              />
            </div>
          </div>

          {/* Vocab Illustration Section (AI + Manual Upload + Compression) */}
          <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#EAE5DC] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#C85A43]" />
                <span className="text-[13px] font-bold text-[#1C1E21]">
                  Ảnh mô tả từ vựng (Tự động nén dung lượng thấp)
                </span>
              </div>
              {currentImageKB > 0 && (
                <span className="text-[11.5px] font-mono font-bold text-emerald-700 tabular-nums">
                  {currentImageKB} KB
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start">
              {/* Preview box */}
              <div className="w-full sm:w-40 aspect-[4/3] rounded-xl border border-[#EAE5DC] bg-white overflow-hidden relative shrink-0 flex items-center justify-center">
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt={meaning || word || 'Ảnh minh họa từ vựng'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setImgStatusMsg('');
                      }}
                      title="Xóa ảnh mô tả"
                      aria-label="Xóa ảnh mô tả"
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-black/65 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="text-center px-2 text-slate-400">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-60" />
                    <span className="text-[11px] font-medium block">Chưa có ảnh</span>
                  </div>
                )}
              </div>

              {/* Action buttons + URL input */}
              <div className="flex-1 w-full space-y-2.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateAiImage}
                    disabled={isGeneratingImg || isCompressingImg}
                    className="px-3.5 py-2 min-h-[38px] rounded-xl bg-[#1C1E21] hover:bg-black text-amber-300 text-[12.5px] font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isGeneratingImg ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{isGeneratingImg ? 'AI đang vẽ & nén...' : 'Tạo ảnh bằng AI'}</span>
                  </button>

                  <label className="px-3.5 py-2 min-h-[38px] rounded-xl bg-white hover:bg-[#FFF5F3] border border-[#EAE5DC] hover:border-[#C85A43] text-[#1C1E21] text-[12.5px] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#C85A43]" />
                    <span>{isCompressingImg ? 'Đang nén...' : 'Tải ảnh thủ công'}</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleManualImageUpload}
                      disabled={isCompressingImg || isGeneratingImg}
                      className="hidden"
                    />
                  </label>
                </div>

                <input
                  type="text"
                  placeholder="Hoặc dán đường dẫn ảnh (https://...)"
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImgStatusMsg('');
                  }}
                  className="w-full px-3 py-2 text-[12px] rounded-xl border border-[#EAE5DC] bg-white focus:outline-none focus:border-[#C85A43]"
                />

                {imgStatusMsg && (
                  <p className="text-[11.5px] font-semibold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{imgStatusMsg}</span>
                  </p>
                )}

                {imgErrorMsg && (
                  <p className="text-[11.5px] font-semibold text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{imgErrorMsg}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#EAE5DC] space-y-3">
            <span className="text-[13px] font-bold text-[#1C1E21] block">
              Câu ví dụ minh họa thực tế
            </span>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[12px] font-semibold text-slate-600">
                  Câu tiếng Trung
                </label>
                {exampleSentence && (
                  <button
                    type="button"
                    onClick={() => speakChinese(exampleSentence)}
                    className="text-[11.5px] text-[#C85A43] hover:text-[#B24A34] flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Nghe câu ví dụ</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="Ví dụ: 我想预订一张明天去北京的机票。"
                value={exampleSentence}
                onChange={(e) => setExampleSentence(e.target.value)}
                className="w-full px-3.5 py-2 text-[13.5px] rounded-xl border border-[#EAE5DC] bg-white focus:outline-none focus:border-[#C85A43] font-serif"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                Pinyin câu ví dụ
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Wǒ xiǎng yùdìng yī zhāng míngtiān qù Běijīng de jīpiào."
                value={examplePinyin}
                onChange={(e) => setExamplePinyin(e.target.value)}
                className="w-full px-3.5 py-2 text-[12.5px] rounded-xl border border-[#EAE5DC] bg-white focus:outline-none focus:border-[#C85A43] font-mono"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1">
                Dịch nghĩa câu ví dụ
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Tôi muốn đặt trước một vé máy bay đi Bắc Kinh vào ngày mai."
                value={exampleMeaning}
                onChange={(e) => setExampleMeaning(e.target.value)}
                className="w-full px-3.5 py-2 text-[13px] rounded-xl border border-[#EAE5DC] bg-white focus:outline-none focus:border-[#C85A43]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAE5DC]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 min-h-[42px] rounded-xl border border-[#EAE5DC] text-[13px] font-bold text-slate-600 hover:bg-[#FAF7F0] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 min-h-[42px] rounded-xl bg-[#C85A43] hover:bg-[#B24A34] text-white text-[13px] font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
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

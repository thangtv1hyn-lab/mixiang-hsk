import React, { useState, useEffect } from 'react';
import { X, Layers, Save, BookOpen } from 'lucide-react';
import { VocabDeck, HSKLevel } from '../../types/hsk';

interface DeckEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deck: VocabDeck) => void;
  initialDeck?: VocabDeck | null;
  defaultLevel?: HSKLevel;
}

const BOYA_CATEGORY_PRESETS = [
  {
    category: 'Giáo trình Boya - Sơ cấp 1',
    level: 'HSK 1' as HSKLevel,
    suggestedTitle: 'Giáo trình Boya Sơ Cấp 1 (博雅汉语·初级起步篇 I)',
  },
  {
    category: 'Giáo trình Boya - Sơ cấp 2',
    level: 'HSK 2' as HSKLevel,
    suggestedTitle: 'Giáo trình Boya Sơ Cấp 2 (博雅汉语·初级起步篇 II)',
  },
  {
    category: 'Giáo trình Boya - Trung cấp 1',
    level: 'HSK 4' as HSKLevel,
    suggestedTitle: 'Giáo trình Boya Trung Cấp 1 (博雅汉语·准中级加速篇 I)',
  },
  {
    category: 'Giáo trình Boya - Trung cấp 2',
    level: 'HSK 5' as HSKLevel,
    suggestedTitle: 'Giáo trình Boya Trung Cấp 2 (博雅汉语·中级冲刺篇)',
  },
];

export const DeckEditorModal: React.FC<DeckEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDeck,
  defaultLevel = 'HSK 1',
}) => {
  const isEditing = Boolean(initialDeck);

  const [title, setTitle] = useState('');
  const [vietnameseTitle, setVietnameseTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<HSKLevel>(defaultLevel);
  const [category, setCategory] = useState('Giao tiếp hàng ngày');
  const [color, setColor] = useState('rose');

  useEffect(() => {
    if (initialDeck) {
      setTitle(initialDeck.title);
      setVietnameseTitle(initialDeck.vietnameseTitle || '');
      setDescription(initialDeck.description);
      setLevel(initialDeck.level);
      setCategory(initialDeck.category);
      setColor(initialDeck.color || 'rose');
    } else {
      setTitle('');
      setVietnameseTitle('');
      setDescription('');
      setLevel(defaultLevel);
      setCategory('Giao tiếp hàng ngày');
      setColor('rose');
    }
  }, [initialDeck, defaultLevel, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const savedDeck: VocabDeck = {
      id: initialDeck ? initialDeck.id : `deck-${Date.now()}`,
      title: title.trim(),
      vietnameseTitle: vietnameseTitle.trim() || title.trim(),
      description: description.trim() || `Bộ từ vựng chuyên đề ${category}`,
      level,
      category: category.trim(),
      color,
      createdAt: initialDeck ? initialDeck.createdAt : new Date().toISOString().split('T')[0],
      createdBy: initialDeck ? initialDeck.createdBy : 'admin',
      cards: initialDeck ? initialDeck.cards : [],
      cardCount: initialDeck ? initialDeck.cards.length : 0,
    };

    onSave(savedDeck);
    onClose();
  };

  const COLOR_OPTIONS = [
    { id: 'rose', name: 'Đỏ son', bg: 'bg-red-600' },
    { id: 'amber', name: 'Vàng ấm', bg: 'bg-amber-500' },
    { id: 'emerald', name: 'Xanh ngọc', bg: 'bg-emerald-600' },
    { id: 'blue', name: 'Xanh lam', bg: 'bg-blue-600' },
    { id: 'purple', name: 'Tím than', bg: 'bg-purple-600' },
    { id: 'indigo', name: 'Đen tuyền', bg: 'bg-zinc-900' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF7F0] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border-2 border-[#E6DEC8] max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ"
          className="absolute top-5 right-5 w-11 h-11 rounded-2xl bg-white border border-[#E6DEC8] text-[#18181B] hover:bg-red-50 hover:text-red-700 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-4 mb-6 pr-12">
          <div className="w-12 h-12 rounded-2xl bg-red-700 text-white flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif font-black text-[#18181B] text-[19px] sm:text-[22px]">
              {isEditing ? 'Chỉnh Sửa Bộ Từ Vựng Flashcard' : 'Tạo Bộ Từ Vựng Flashcard Mới'}
            </h3>
            <p className="text-[14px] text-slate-600">
              Chọn cấp độ HSK hoặc Giáo trình Boya và đặt tên bộ thẻ
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-3xl border border-[#E6DEC8]">
          {/* Quick select Boya Curriculum Presets */}
          <div className="space-y-2">
            <span className="text-[14px] font-black text-[#18181B] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-700" />
              <span>Chọn nhanh theo Giáo trình Boya (博雅汉语):</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {BOYA_CATEGORY_PRESETS.map((preset) => (
                <button
                  key={preset.category}
                  type="button"
                  onClick={() => {
                    setCategory(preset.category);
                    setLevel(preset.level);
                    setColor('emerald');
                    if (!title.trim()) {
                      setTitle(preset.suggestedTitle);
                    }
                  }}
                  className={`px-3.5 py-2 rounded-xl text-[13px] font-bold border transition-colors cursor-pointer ${
                    category === preset.category
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-[#EAF7F0] text-emerald-900 border-emerald-300 hover:border-emerald-600'
                  }`}
                >
                  {preset.category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-black text-[#18181B] mb-1.5">
                Cấp độ HSK tương ứng <span className="text-red-700">*</span>
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as HSKLevel)}
                className="w-full px-4 py-3 text-[14px] font-bold rounded-2xl border border-[#E6DEC8] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-red-700 text-[#18181B]"
              >
                <option value="HSK 1">HSK 1 (Hoặc Boya Sơ cấp 1)</option>
                <option value="HSK 2">HSK 2 (Hoặc Boya Sơ cấp 2)</option>
                <option value="HSK 3">HSK 3 (Trung cấp 1)</option>
                <option value="HSK 4">HSK 4 (Hoặc Boya Trung cấp 1)</option>
                <option value="HSK 5">HSK 5 (Hoặc Boya Trung cấp 2)</option>
              </select>
            </div>

            <div>
              <label className="block text-[14px] font-black text-[#18181B] mb-1.5">
                Giáo trình / Danh mục <span className="text-red-700">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Giáo trình Boya - Sơ cấp 1"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 text-[14px] font-bold rounded-2xl border border-[#E6DEC8] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-red-700 text-[#18181B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[14px] font-black text-[#18181B] mb-1.5">
              Tên bộ từ vựng (Tiêu đề chính) <span className="text-red-700">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Giáo trình Boya Sơ Cấp 1: Bài 1 - Bài 5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-[14px] font-bold rounded-2xl border border-[#E6DEC8] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-red-700 text-[#18181B]"
            />
          </div>

          <div>
            <label className="block text-[14px] font-black text-[#18181B] mb-1.5">
              Phụ đề / Tiêu đề tiếng Việt
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Du học sinh, Ký túc xá, Thư viện & Giảng đường"
              value={vietnameseTitle}
              onChange={(e) => setVietnameseTitle(e.target.value)}
              className="w-full px-4 py-3 text-[14px] font-medium rounded-2xl border border-[#E6DEC8] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-red-700 text-[#18181B]"
            />
          </div>

          <div>
            <label className="block text-[14px] font-black text-[#18181B] mb-1.5">
              Mô tả chi tiết bộ từ vựng
            </label>
            <textarea
              rows={3}
              placeholder="Mô tả mục tiêu của bộ thẻ flashcards này..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 text-[14px] rounded-2xl border border-[#E6DEC8] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-red-700 resize-none text-[#18181B]"
            />
          </div>

          <div>
            <label className="block text-[14px] font-black text-[#18181B] mb-2">
              Màu sắc nhận diện của thẻ
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    color === c.id
                      ? 'border-red-700 bg-[#FFF9F5] shadow-xs'
                      : 'border-[#E6DEC8] bg-[#FAF7F0] hover:border-red-300'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full ${c.bg}`} />
                  <span className="text-[12px] font-bold text-[#18181B] truncate w-full text-center">
                    {c.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6DEC8]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border border-[#E6DEC8] text-[14px] font-bold text-[#18181B] hover:bg-slate-100 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-red-700 hover:bg-red-800 text-white text-[14px] font-black flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Save className="w-5 h-5" />
              <span>{isEditing ? 'Lưu thay đổi' : 'Tạo bộ từ vựng'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

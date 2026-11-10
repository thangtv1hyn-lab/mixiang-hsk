import React, { useState, useEffect } from 'react';
import { X, Layers, Save, Sparkles, BookOpen } from 'lucide-react';
import { VocabDeck, HSKLevel } from '../../types/hsk';

interface DeckEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deck: VocabDeck) => void;
  initialDeck?: VocabDeck | null;
  defaultLevel?: HSKLevel;
}

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
      description: description.trim() || `Bộ từ vựng HSK chuyên đề ${category}`,
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
    { id: 'rose', name: 'Đỏ son / Hoa hồng', bg: 'bg-rose-500' },
    { id: 'amber', name: 'Vàng hổ phách', bg: 'bg-amber-500' },
    { id: 'emerald', name: 'Xanh lục bảo', bg: 'bg-emerald-500' },
    { id: 'blue', name: 'Xanh dương', bg: 'bg-blue-500' },
    { id: 'purple', name: 'Tím hoàng gia', bg: 'bg-purple-500' },
    { id: 'indigo', name: 'Xanh chàm', bg: 'bg-indigo-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              {isEditing ? 'Chỉnh Sửa Bộ Từ Vựng Flashcard' : 'Tạo Bộ Từ Vựng Flashcard Mới'}
            </h3>
            <p className="text-xs text-slate-500">
              Quản lý danh mục, cấp độ HSK và màu sắc nhận diện cho bộ thẻ
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cấp độ HSK <span className="text-rose-500">*</span>
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as HSKLevel)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="HSK 1">HSK 1</option>
                <option value="HSK 2">HSK 2</option>
                <option value="HSK 3">HSK 3</option>
                <option value="HSK 4">HSK 4</option>
                <option value="HSK 5">HSK 5</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chủ đề / Danh mục <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Đời sống & Mua sắm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên bộ từ vựng (Tiếng Trung / Tiêu đề chính) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: HSK 2: Sinh Hoạt Hàng Ngày, Mua Sắm & Ẩm Thực"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Phụ đề / Tiêu đề tiếng Việt
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Hỏi đường, Đi chợ, Đồ uống & Thời gian"
              value={vietnameseTitle}
              onChange={(e) => setVietnameseTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mô tả chi tiết bộ từ vựng
            </label>
            <textarea
              rows={3}
              placeholder="Mô tả mục tiêu của bộ thẻ flashcards này, đối tượng phù hợp..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Màu sắc chủ đạo của thẻ
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    color === c.id
                      ? 'border-purple-600 bg-purple-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full ${c.bg}`} />
                  <span className="text-[10px] font-medium text-slate-700 truncate w-full text-center">
                    {c.id}
                  </span>
                </button>
              ))}
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
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Lưu thay đổi' : 'Tạo bộ từ vựng'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

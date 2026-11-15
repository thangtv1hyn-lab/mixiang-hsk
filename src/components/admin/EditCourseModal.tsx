import React, { useState, useEffect } from 'react';
import { X, BookOpen, Save } from 'lucide-react';
import { Course, HSKLevel } from '../../types/hsk';

interface EditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onSave: (updatedCourse: Course) => void;
}

export const EditCourseModal: React.FC<EditCourseModalProps> = ({
  isOpen,
  onClose,
  course,
  onSave,
}) => {
  const [level, setLevel] = useState<HSKLevel>('HSK 3');
  const [title, setTitle] = useState('');
  const [vietnameseTitle, setVietnameseTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetVocabCount, setTargetVocabCount] = useState(300);
  const [grammarPointsCount, setGrammarPointsCount] = useState(50);

  useEffect(() => {
    if (course) {
      setLevel(course.level);
      setTitle(course.title);
      setVietnameseTitle(course.vietnameseTitle || course.title);
      setDescription(course.description || '');
      setTargetVocabCount(course.targetVocabCount || 300);
      setGrammarPointsCount(course.grammarPointsCount || 50);
    }
  }, [course]);

  if (!isOpen || !course) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updatedCourse: Course = {
      ...course,
      level,
      title: title.trim(),
      vietnameseTitle: vietnameseTitle.trim() || title.trim(),
      description: description.trim(),
      targetVocabCount: Number(targetVocabCount),
      grammarPointsCount: Number(grammarPointsCount),
    };

    onSave(updatedCourse);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FDFBF6] rounded-3xl w-[96vw] max-w-4xl max-h-[94vh] overflow-y-auto shadow-2xl border-2 border-[#E8DFCE] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-red-600 via-red-700 to-[#18181B] text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 text-amber-300 flex items-center justify-center border border-white/25 shrink-0">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-serif text-[21px] sm:text-[24px] font-black text-white leading-tight">
                Chỉnh Sửa Khóa Học {course.level}
              </h3>
              <p className="text-[16px] text-rose-100">
                Cập nhật tên, mục tiêu và mô tả chương trình học
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-2.5 rounded-2xl bg-white/10 text-white hover:bg-red-600 transition-colors cursor-pointer"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                Cấp độ HSK:
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as HSKLevel)}
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-white text-[18px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
              >
                <option value="HSK 1">HSK 1 (Sơ cấp 1)</option>
                <option value="HSK 2">HSK 2 (Sơ cấp 2)</option>
                <option value="HSK 3">HSK 3 (Trung cấp 1)</option>
                <option value="HSK 4">HSK 4 (Trung cấp 2)</option>
                <option value="HSK 5">HSK 5 (Cao cấp 1)</option>
              </select>
            </div>

            <div>
              <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                Số từ vựng mục tiêu:
              </label>
              <input
                type="number"
                min={50}
                max={5000}
                value={targetVocabCount}
                onChange={(e) => setTargetVocabCount(Number(e.target.value))}
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-white font-mono text-[18px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
              Tên khóa học (Tiếng Trung) *:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: HSK 3 级标准教程"
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-white font-serif text-[21px] font-black text-[#18181B] focus:border-red-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
              Tên tiếng Việt hiển thị *:
            </label>
            <input
              type="text"
              required
              value={vietnameseTitle}
              onChange={(e) => setVietnameseTitle(e.target.value)}
              placeholder="Ví dụ: Giáo trình chuẩn HSK 3 Toàn diện"
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-white text-[18px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
              Mô tả chi tiết khóa học:
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả mục tiêu đầu ra, ngữ cảnh giao tiếp..."
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-white text-[18px] text-[#18181B] leading-relaxed focus:border-red-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                Số điểm ngữ pháp:
              </label>
              <input
                type="number"
                min={5}
                max={200}
                value={grammarPointsCount}
                onChange={(e) => setGrammarPointsCount(Number(e.target.value))}
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-white font-mono text-[18px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                Số bài học hiện có:
              </label>
              <div className="px-4 py-3.5 rounded-2xl bg-[#FAF7F0] border-2 border-[#E8DFCE] text-[#18181B] font-mono text-[18px] font-bold">
                {course.lessons.length} bài học
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DFCE]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl bg-white border border-[#E8DFCE] text-[#18181B] hover:bg-[#F5EFEB] font-bold text-[16px] cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-7 py-3 rounded-2xl bg-red-600 text-white font-black text-[16px] hover:bg-red-700 flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Save className="w-6 h-6" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

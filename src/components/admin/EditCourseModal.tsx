import React, { useState, useEffect } from 'react';
import { X, BookOpen, Save, Sparkles } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-6 relative border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Chỉnh Sửa Khóa Học {course.level}
            </h3>
            <p className="text-xs text-slate-500">
              Cập nhật tên, mục tiêu và mô tả chương trình học
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Cấp độ HSK:
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as HSKLevel)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
              >
                <option value="HSK 1">HSK 1 (Sơ cấp 1)</option>
                <option value="HSK 2">HSK 2 (Sơ cấp 2)</option>
                <option value="HSK 3">HSK 3 (Trung cấp 1)</option>
                <option value="HSK 4">HSK 4 (Trung cấp 2)</option>
                <option value="HSK 5">HSK 5 (Cao cấp 1)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Số từ vựng mục tiêu:
              </label>
              <input
                type="number"
                min={50}
                max={5000}
                value={targetVocabCount}
                onChange={(e) => setTargetVocabCount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Tên khóa học (Tiếng Trung):
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: HSK 3 级标准教程"
              className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-slate-900"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Tên tiếng Việt hiển thị:
            </label>
            <input
              type="text"
              required
              value={vietnameseTitle}
              onChange={(e) => setVietnameseTitle(e.target.value)}
              placeholder="Ví dụ: Giáo trình chuẩn HSK 3 Toàn diện"
              className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-slate-900"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Mô tả chi tiết khóa học:
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả mục tiêu đầu ra, ngữ cảnh giao tiếp..."
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Số điểm ngữ pháp:
              </label>
              <input
                type="number"
                min={5}
                max={200}
                value={grammarPointsCount}
                onChange={(e) => setGrammarPointsCount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Số bài học hiện có:
              </label>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-bold">
                {course.lessons.length} bài học
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

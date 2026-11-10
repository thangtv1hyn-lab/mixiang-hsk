import React, { useState, useEffect } from 'react';
import { X, UserPlus, Shield, UserCheck, Lock, Mail, User, Save, GraduationCap } from 'lucide-react';
import { AppUser, UserRole, UserStatus, HSKLevel } from '../../types/hsk';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<AppUser>) => Promise<{ success: boolean; message?: string }>;
  initialUser?: AppUser | null;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialUser,
}) => {
  const isEditing = Boolean(initialUser);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [status, setStatus] = useState<UserStatus>('active');
  const [level, setLevel] = useState<HSKLevel>('HSK 3');
  const [note, setNote] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialUser) {
      setName(initialUser.name);
      setEmail(initialUser.email);
      setPassword('');
      setRole(initialUser.role);
      setStatus(initialUser.status);
      setLevel(initialUser.level);
      setNote(initialUser.note || '');
    } else {
      setName('');
      setEmail('');
      setPassword('123456');
      setRole('student');
      setStatus('active');
      setLevel('HSK 3');
      setNote('');
    }
    setErrorMessage('');
  }, [initialUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMessage('Họ tên và email không được để trống.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const payload: Partial<AppUser> = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      status,
      level,
      note: note.trim(),
    };

    if (password.trim()) {
      payload.password = password.trim();
    }

    const res = await onSave(payload);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    }
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
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            {isEditing ? <Shield className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              {isEditing ? 'Chỉnh Sửa & Phân Quyền Tài Khoản' : 'Thêm Tài Khoản Mới Vào Hệ Thống'}
            </h3>
            <p className="text-xs text-slate-500">
              Quản lý vai trò (Admin / Giáo viên / Học viên), cấp độ HSK và trạng thái tài khoản
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Ví dụ: Trần Văn Nam"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email đăng nhập <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isEditing ? 'Đặt lại mật khẩu mới (bỏ trống nếu giữ nguyên)' : 'Mật khẩu khởi tạo'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                placeholder={isEditing ? 'Nhập mật khẩu mới nếu muốn đổi' : 'Mật khẩu mặc định: 123456'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Phân quyền Vai trò */}
          <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-100 space-y-2.5">
            <label className="block text-xs font-bold text-purple-950">
              Phân quyền vai trò hệ thống <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  role === 'student'
                    ? 'border-purple-600 bg-white shadow-xs ring-1 ring-purple-600'
                    : 'border-purple-200/80 bg-white/70 hover:bg-white'
                }`}
              >
                <span className="text-xs font-bold text-slate-900 block">🎓 Học viên</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Học tập, luyện thi</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  role === 'teacher'
                    ? 'border-blue-600 bg-white shadow-xs ring-1 ring-blue-600'
                    : 'border-purple-200/80 bg-white/70 hover:bg-white'
                }`}
              >
                <span className="text-xs font-bold text-slate-900 block">👩‍🏫 Giáo viên</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Soạn bài, giải đáp</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  role === 'admin'
                    ? 'border-rose-600 bg-white shadow-xs ring-1 ring-rose-600'
                    : 'border-purple-200/80 bg-white/70 hover:bg-white'
                }`}
              >
                <span className="text-xs font-bold text-slate-900 block">👑 Quản trị viên</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Toàn quyền hệ thống</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cấp độ HSK mục tiêu
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
                Trạng thái tài khoản
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="active">🟢 Đang hoạt động</option>
                <option value="suspended">🔴 Đã khóa / Tạm dừng</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ghi chú quản trị
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Học viên khóa K14, Giảng viên chuyên ngành..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
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
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Cập nhật tài khoản' : 'Tạo tài khoản'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Clock,
  Award,
  Play,
  PlusCircle,
  GraduationCap,
} from 'lucide-react';
import { useHSK } from '../context/HSKContext';
import { Exam, HSKLevel } from '../types/hsk';

interface ExamsViewProps {
  onStartExam: (exam: Exam) => void;
  onViewResult: () => void;
}

export const ExamsView: React.FC<ExamsViewProps> = ({ onStartExam, onViewResult }) => {
  const { exams, studentProfile, userRole, setActiveTab, lastExamResult } = useHSK();
  const [selectedLevel, setSelectedLevel] = useState<HSKLevel | 'ALL'>('ALL');

  const filteredExams = exams.filter(
    (e) => selectedLevel === 'ALL' || e.level === selectedLevel
  );

  const highestOverall =
    studentProfile.examHistory.length > 0
      ? Math.max(...studentProfile.examHistory.map((h) => h.totalScore))
      : null;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner (Màu đỏ pastel chủ đạo) */}
      <div className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 border border-red-400/70 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[14px] font-bold text-amber-200">
              <Award className="w-5 h-5 shrink-0" />
              <span>Hệ thống Đề thi thử HSK Chuẩn Quốc Tế</span>
            </div>

            <h1 className="font-sans text-[24px] sm:text-[30px] font-bold tracking-tight leading-tight text-balance">
              Phòng Thi Thử & Chấm Điểm Tự Động
            </h1>

            <p className="text-[15.5px] sm:text-[16.5px] text-rose-50 leading-relaxed">
              Mô phỏng 100% cấu trúc đề thi HSK với đồng hồ bấm giờ, các phần Nghe – Đọc – Viết và phân tích điểm chi tiết ngay khi nộp bài.
            </p>
          </div>

          {/* Right: Quick exam stats + HSK Mascot Illustration */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 shrink-0">
            <div className="bg-white/10 rounded-2xl p-5 border border-white/15 w-full sm:w-auto sm:min-w-[240px] space-y-3">
              <div className="flex justify-between items-center gap-4 text-[14px]">
                <span className="text-stone-200">Đã hoàn thành:</span>
                <span className="font-black text-[18px] text-white tabular-nums">
                  {studentProfile.examHistory.length} bài
                </span>
              </div>
              <div className="flex justify-between items-center gap-4 text-[14px]">
                <span className="text-stone-200">Điểm cao nhất:</span>
                <span className="font-black text-[18px] text-amber-300 tabular-nums">
                  {highestOverall !== null ? `${highestOverall} đ` : 'Chưa có'}
                </span>
              </div>
              {lastExamResult && (
                <button
                  type="button"
                  onClick={onViewResult}
                  className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-600 text-white font-bold text-[14px] rounded-xl text-center transition-colors cursor-pointer"
                >
                  Xem kết quả bài vừa thi
                </button>
              )}
            </div>

            <img
              src="/assets/aistudio/icon2_d1d361e7.png"
              alt="Luyện thi HSK MiXiangg"
              className="h-36 sm:h-40 w-auto object-contain drop-shadow-md select-none shrink-0"
            />
          </div>
        </div>
      </div>

      {/* Level Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#F5EFEB] rounded-2xl border border-[#E6DEC8]">
          {(['ALL', 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedLevel(lvl)}
              className={`px-4 py-2 rounded-xl text-[14px] sm:text-[16px] font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                selectedLevel === lvl
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'text-[#18181B] hover:bg-white hover:text-red-700'
              }`}
            >
              {lvl === 'ALL' ? 'Tất cả cấp độ' : lvl}
            </button>
          ))}
        </div>

        {userRole !== 'student' && (
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#18181B] text-white text-[14px] font-bold hover:bg-red-800 transition-colors cursor-pointer shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Quản lý đề thi</span>
          </button>
        )}
      </div>

      {/* Exams Vertical List (Danh sách từ trên xuống dưới) */}
      {filteredExams.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-[#D6CBB3] p-12 text-center space-y-2">
          <GraduationCap className="w-12 h-12 text-slate-400 mx-auto" />
          <p className="text-[19px] font-bold text-[#18181B]">
            Chưa có đề thi nào cho cấp độ này.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredExams.map((exam) => {
            const pastAttempts = studentProfile.examHistory.filter(
              (h) => h.examId === exam.id
            );
            const highestScore =
              pastAttempts.length > 0
                ? Math.max(...pastAttempts.map((h) => h.totalScore))
                : null;

            return (
              <div
                key={exam.id}
                className="bg-white hover:bg-[#FFF9F6] rounded-3xl border-2 border-[#E8DFCE] hover:border-amber-500/70 p-6 sm:p-7 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 ease-out"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[14px] font-bold">
                    <span className="text-red-600 font-black">{exam.level}</span>
                    <span className="flex items-center gap-1.5 text-slate-600 tabular-nums">
                      <Clock className="w-5 h-5 text-amber-600" />
                      <span>{exam.timeLimitMinutes} phút</span>
                    </span>
                  </div>

                  <h2 className="font-sans font-bold not-italic text-[21px] sm:text-[22px] text-[#18181B] leading-snug">
                    {exam.title}
                  </h2>

                  {/* Exam Breakdown */}
                  <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                    <div className="bg-[#FAF7F0] p-3 rounded-2xl border border-[#E8DFCE]">
                      <span className="block text-slate-600 text-[14px] font-semibold">Số câu</span>
                      <span className="font-mono font-black text-[18px] text-[#18181B] tabular-nums">
                        {exam.questions.length} câu
                      </span>
                    </div>
                    <div className="bg-[#FAF7F0] p-3 rounded-2xl border border-[#E8DFCE]">
                      <span className="block text-slate-600 text-[14px] font-semibold">Điểm đạt</span>
                      <span className="font-mono font-black text-[18px] text-red-600 tabular-nums">
                        {exam.passScore}/{exam.totalPoints}
                      </span>
                    </div>
                    <div className="bg-[#FAF7F0] p-3 rounded-2xl border border-[#E8DFCE]">
                      <span className="block text-slate-600 text-[14px] font-semibold">Đã thi</span>
                      <span className="font-mono font-black text-[18px] text-[#18181B] tabular-nums">
                        {pastAttempts.length} lần
                      </span>
                    </div>
                  </div>

                  {highestScore !== null && (
                    <div className="flex items-center justify-between text-[14px] p-3.5 rounded-2xl bg-[#FFF5F3] text-[#18181B] border border-red-200 font-bold">
                      <span>Điểm cao nhất của bạn:</span>
                      <span className="text-red-600 font-mono font-black text-[16px] tabular-nums">
                        {highestScore} / {exam.totalPoints} điểm
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-6 mt-5 border-t border-[#F5EFEB]">
                  <button
                    type="button"
                    onClick={() => onStartExam(exam)}
                    className="w-full py-3.5 px-5 rounded-2xl bg-red-700 hover:bg-red-800 text-white font-black text-[16px] sm:text-[18px] flex items-center justify-center gap-2.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    <span>Bắt đầu làm bài thi</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

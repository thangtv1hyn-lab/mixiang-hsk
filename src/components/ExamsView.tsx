import React, { useState } from 'react';
import {
  GraduationCap,
  Clock,
  Award,
  CheckCircle2,
  Play,
  FileCheck2,
  PlusCircle,
  HelpCircle,
  AlertTriangle,
  History,
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

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Hệ thống Đề thi thử HSK Chuẩn Quốc Tế</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Phòng Thi Thử & Chấm Điểm Tự Động
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Mô phỏng 100% cấu trúc đề thi HSK thật với đồng hồ bấm giờ, các phần Nghe - Đọc - Viết, và bảng phân tích điểm chi tiết từng kỹ năng ngay sau khi nộp bài.
            </p>
          </div>

          {/* Quick exam stats */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 min-w-[200px] text-xs space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>Đã hoàn thành:</span>
              <span className="font-bold text-white">
                {studentProfile.examHistory.length} bài thi
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Điểm cao nhất:</span>
              <span className="font-bold text-amber-300">
                {studentProfile.examHistory.length > 0
                  ? `${Math.max(...studentProfile.examHistory.map((h) => h.totalScore))} điểm`
                  : 'Chưa có'}
              </span>
            </div>
            {lastExamResult && (
              <button
                onClick={onViewResult}
                className="w-full mt-2 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-center transition-colors block"
              >
                Xem kết quả bài vừa thi ➔
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Level Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {(['ALL', 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                selectedLevel === lvl
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lvl === 'ALL' ? 'Tất cả cấp độ' : lvl}
            </button>
          ))}
        </div>

        {userRole !== 'student' && (
          <button
            onClick={() => setActiveTab('admin')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs sm:text-sm font-semibold hover:bg-indigo-700 shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tạo & Quản lý đề thi</span>
          </button>
        )}
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExams.map((exam) => {
          // Check if student took this exam
          const pastAttempts = studentProfile.examHistory.filter(
            (h) => h.examId === exam.id
          );
          const highestScore = pastAttempts.length > 0
            ? Math.max(...pastAttempts.map((h) => h.totalScore))
            : null;

          return (
            <div
              key={exam.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-200"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {exam.level}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {exam.timeLimitMinutes} phút
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 line-clamp-1">
                  {exam.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {exam.subtitle}
                </p>

                {/* Exam Breakdown Badges */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px] font-medium text-slate-600">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="block text-slate-400 text-[10px]">Số câu</span>
                    <span className="font-bold text-slate-800">{exam.questions.length} câu</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="block text-slate-400 text-[10px]">Điểm đạt</span>
                    <span className="font-bold text-indigo-700">{exam.passScore}/{exam.totalPoints}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="block text-slate-400 text-[10px]">Đã thi</span>
                    <span className="font-bold text-slate-800">{pastAttempts.length} lần</span>
                  </div>
                </div>

                {highestScore !== null && (
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                    <span>Điểm cao nhất của bạn:</span>
                    <span className="font-bold">{highestScore} / {exam.totalPoints} điểm</span>
                  </div>
                )}
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100">
                <button
                  onClick={() => onStartExam(exam)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Bắt đầu làm bài thi</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BarChart3,
  Volume2,
  Check,
  X,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExamResult, Exam } from '../types/hsk';
import { useHSK } from '../context/HSKContext';
import { speakChinese } from '../utils/audioSpeech';

interface ExamResultViewProps {
  result: ExamResult;
  onRetake: () => void;
  onGoToReports: () => void;
  onGoToExamsList: () => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  result,
  onRetake,
  onGoToReports,
  onGoToExamsList,
}) => {
  const { exams, showPinyin } = useHSK();
  const exam = exams.find((e) => e.id === result.examId);

  // Trigger celebration if passed
  React.useEffect(() => {
    if (result.passed) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    }
  }, [result.passed]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Score Certificate Card */}
      <div
        className={`rounded-3xl p-8 sm:p-10 border text-center shadow-lg relative overflow-hidden ${
          result.passed
            ? 'bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white border-emerald-500/30'
            : 'bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 text-white border-rose-500/30'
        }`}
      >
        <div className="relative z-10 max-w-xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Kết Quả Thi Thử HSK Tự Động</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {result.examTitle}
          </h2>

          {/* Big Score Display */}
          <div className="py-4">
            <div className="inline-block p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
              <span className="text-6xl sm:text-7xl font-black tracking-tight text-amber-300">
                {result.totalScore}
              </span>
              <span className="text-xl text-slate-300 font-bold ml-2">
                / {result.maxScore}
              </span>
            </div>
          </div>

          {/* Pass/Fail Status */}
          <div>
            {result.passed ? (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-sm font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>CHÚC MỪNG! BẠN ĐÃ ĐẠT CHUẨN (合格 - PASS)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 text-sm font-bold">
                <XCircle className="w-5 h-5 text-rose-400" />
                <span>CHƯA ĐẠT (不合格) - CẦN CỐ GẮNG THÊM</span>
              </div>
            )}
            <p className="text-xs text-slate-300 mt-2">
              Điểm đạt yêu cầu: {exam?.passScore || 120} điểm | Thời gian làm bài: {Math.round(result.timeSpentSeconds / 60)} phút
            </p>
          </div>

          {/* Skill Breakdown */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/10 text-xs">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-slate-300 block text-[11px]">Nghe hiểu</span>
              <span className="font-bold text-base text-white">{result.listeningScore} đ</span>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-slate-300 block text-[11px]">Đọc hiểu</span>
              <span className="font-bold text-base text-white">{result.readingScore} đ</span>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-slate-300 block text-[11px]">Viết & Cấu trúc</span>
              <span className="font-bold text-base text-white">{result.writingScore} đ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onGoToExamsList}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-colors"
        >
          ← Danh sách đề thi
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onRetake}
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs sm:text-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Làm lại đề thi</span>
          </button>

          <button
            onClick={onGoToReports}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs sm:text-sm hover:bg-indigo-700 transition-colors shadow-xs flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Xem Báo Cáo Học Tập Tuần/Tháng ➔</span>
          </button>
        </div>
      </div>

      {/* Detailed Question Review */}
      {exam && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Chi tiết bài làm và đáp án giải thích
            </h3>
            <p className="text-xs text-slate-500">
              Xem lại từng câu hỏi để nắm rõ lý do chọn đúng hoặc sai
            </p>
          </div>

          <div className="space-y-6">
            {exam.questions.map((q, idx) => {
              const userChoice = result.userAnswers[q.id];
              const qType = q.questionType || (q.options && q.options.length > 0 ? 'choice' : 'fill_blank');

              const cleanStr = (s: any) =>
                String(s || '')
                  .trim()
                  .toLowerCase()
                  .replace(/[,.?!，。？！]/g, '')
                  .replace(/\s+/g, '');

              let isCorrect = false;
              if (qType === 'choice') {
                isCorrect = Number(userChoice) === q.correctAnswer;
              } else if (qType === 'fill_blank' || qType === 'writing') {
                const uClean = cleanStr(userChoice);
                const targetClean = cleanStr(q.correctText);
                isCorrect = uClean.length > 0 && (uClean === targetClean || targetClean.includes(uClean));
              } else if (qType === 'speaking') {
                const uClean = cleanStr(userChoice);
                const targetClean = cleanStr(q.correctText);
                isCorrect = uClean.length > 0 && (uClean === targetClean || targetClean.includes(uClean) || uClean.length >= targetClean.length * 0.7);
              }

              return (
                <div
                  key={q.id}
                  className={`p-6 rounded-2xl border space-y-4 ${
                    isCorrect
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-red-200 bg-red-50/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-600 px-2.5 py-0.5 rounded-md bg-white border border-slate-200">
                        Câu {idx + 1}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase">
                        {q.section === 'listening' ? 'Nghe hiểu' : q.section === 'reading' ? 'Đọc hiểu' : q.section === 'writing' ? 'Viết' : 'Nói & Phát âm'}
                      </span>
                    </div>

                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3.5 h-3.5" />
                        Đúng
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-200">
                        <X className="w-3.5 h-3.5" />
                        Sai
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-slate-900">{q.question}</h5>
                    {q.pinyin && showPinyin && (
                      <p className="text-xs text-rose-600 font-mono italic">{q.pinyin}</p>
                    )}
                  </div>

                  {q.audioPrompt && (
                    <div className="flex items-center gap-2 text-xs bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-500">File nghe:</span>
                      <span className="font-serif font-bold text-slate-900">{q.audioPrompt}</span>
                      <button
                        onClick={() => speakChinese(q.audioPrompt!)}
                        className="ml-auto text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Nghe lại</span>
                      </button>
                    </div>
                  )}

                  {/* Options review for multiple choice */}
                  {qType === 'choice' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                      {q.options.map((opt, optIdx) => {
                        const isThisSelected = Number(userChoice) === optIdx;
                        const isThisCorrect = optIdx === q.correctAnswer;

                        let style = 'border-slate-200 bg-white text-slate-600';
                        if (isThisCorrect) {
                          style = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                        } else if (isThisSelected && !isThisCorrect) {
                          style = 'border-red-500 bg-red-50 text-red-900 line-through';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border flex items-center justify-between ${style}`}
                          >
                            <span>{opt}</span>
                            {isThisCorrect && (
                              <span className="text-[11px] font-bold text-emerald-700">Đáp án đúng</span>
                            )}
                            {isThisSelected && !isThisCorrect && (
                              <span className="text-[11px] font-bold text-red-600">Bạn đã chọn</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Text review for fill_blank, writing, speaking */}
                  {qType !== 'choice' && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Câu trả lời của bạn:</span>
                        <span className={`font-bold ${isCorrect ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {userChoice !== undefined && userChoice !== '' ? String(userChoice) : '(Chưa điền / chưa nói)'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
                        <span className="text-slate-500">Đáp án chuẩn:</span>
                        <span className="font-bold text-slate-900">{q.correctText}</span>
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold text-slate-900 block mb-1">Giải thích chi tiết:</span>
                    {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

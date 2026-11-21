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
import { CompletionSealStamp } from './CompletionSealStamp';

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
  const [isCardThumping, setIsCardThumping] = React.useState(false);

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

  const handleStampImpact = React.useCallback(() => {
    setIsCardThumping(true);
    window.setTimeout(() => setIsCardThumping(false), 680);
  }, []);

  return (
    <div className="w-full space-y-8 pb-16">
      {/* Score Certificate Card */}
      <div
        className={`rounded-3xl p-8 sm:p-10 border text-center shadow-lg relative overflow-hidden ${
          isCardThumping ? 'animate-card-thump' : ''
        } ${
          result.passed
            ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white border-red-400/70'
            : 'bg-gradient-to-br from-red-700 via-red-800 to-red-900 text-white border-red-600/70'
        }`}
      >
        {/* Desktop Floating Red Seal Stamp (top-right corner) */}
        <div className="hidden lg:block absolute top-6 right-7 z-20">
          <CompletionSealStamp
            label={result.passed ? 'ĐÃ ĐẠT · HOÀN THÀNH' : 'ĐÃ HOÀN THÀNH'}
            subLabel={result.date}
            surface="dark"
            autoStamp
            onImpact={handleStampImpact}
          />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[14px] font-bold bg-white/10 backdrop-blur-md border border-white/20">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>Kết Quả Thi Thử HSK Tự Động</span>
          </div>

          <h2 className="font-sans text-[22px] sm:text-[27px] font-bold not-italic tracking-tight">
            {result.examTitle}
          </h2>

          {/* Big Score Display */}
          <div className="py-4 flex flex-col sm:flex-row items-center justify-center gap-5">
            <div className="inline-block p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
              <span className="font-mono text-6xl sm:text-7xl font-black tracking-tight text-amber-300 tabular-nums">
                {result.totalScore}
              </span>
              <span className="font-mono text-[21px] text-rose-100 font-bold ml-2 tabular-nums">
                / {result.maxScore}
              </span>
            </div>

            {/* Mobile & Tablet Inline Red Seal Stamp */}
            <div className="lg:hidden">
              <CompletionSealStamp
                label={result.passed ? 'ĐÃ ĐẠT · HOÀN THÀNH' : 'ĐÃ HOÀN THÀNH'}
                subLabel={result.date}
                surface="dark"
                autoStamp
                compact
                onImpact={handleStampImpact}
              />
            </div>
          </div>

          {/* Pass/Fail Status */}
          <div className="space-y-3">
            {result.passed ? (
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-300/20 text-amber-200 border border-amber-300/50 text-[16px] font-bold">
                <CheckCircle2 className="w-6 h-6 text-amber-300" />
                <span>CHÚC MỪNG! BẠN ĐÃ ĐẠT CHUẨN (合格 - PASS)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-rose-500/20 text-rose-200 border border-rose-400/40 text-[16px] font-bold">
                <XCircle className="w-6 h-6 text-rose-300" />
                <span>CHƯA ĐẠT (不合格) - CẦN CỐ GẮNG THÊM</span>
              </div>
            )}
            <p className="text-[15.5px] sm:text-[16.5px] text-rose-50">
              Điểm đạt yêu cầu: {exam?.passScore || 120} điểm · Thời gian làm bài: {Math.round(result.timeSpentSeconds / 60)} phút
            </p>
          </div>

          {/* Skill Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/15">
            <div className="bg-white/10 p-4 rounded-2xl border border-white/15">
              <span className="text-rose-100 block text-[14px]">Nghe hiểu</span>
              <span className="font-mono font-black text-[19px] text-white tabular-nums">{result.listeningScore} đ</span>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/15">
              <span className="text-rose-100 block text-[14px]">Đọc hiểu</span>
              <span className="font-mono font-black text-[19px] text-white tabular-nums">{result.readingScore} đ</span>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/15">
              <span className="text-rose-100 block text-[14px]">Viết & Cấu trúc</span>
              <span className="font-mono font-black text-[19px] text-white tabular-nums">{result.writingScore} đ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onGoToExamsList}
          className="px-5 py-3 rounded-2xl border-2 border-[#E8DFCE] bg-white text-[#18181B] font-bold text-[14px] sm:text-[16px] hover:border-red-500 hover:bg-[#FFF5F3] transition-colors cursor-pointer"
        >
          ← Danh sách đề thi
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRetake}
            className="px-5 py-3 rounded-2xl bg-[#18181B] text-white font-bold text-[14px] sm:text-[16px] hover:bg-black transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Làm lại đề thi</span>
          </button>

          <button
            type="button"
            onClick={onGoToReports}
            className="px-5 py-3 rounded-2xl bg-red-600 text-white font-bold text-[14px] sm:text-[16px] hover:bg-red-700 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Xem Báo Cáo Học Tập ➔</span>
          </button>
        </div>
      </div>

      {/* Detailed Question Review */}
      {exam && (
        <div className="bg-white rounded-3xl border border-[#E8DFCE] p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="space-y-1">
            <h3 className="font-sans text-[20px] sm:text-[23px] font-extrabold text-[#18181B]">
              Chi tiết bài làm và đáp án giải thích
            </h3>
            <p className="text-[15px] sm:text-[16px] text-slate-600">
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
                  className={`p-6 rounded-3xl border-2 space-y-4 ${
                    isCorrect
                      ? 'border-emerald-300 bg-[#ECFDF5]'
                      : 'border-red-300 bg-[#FFF5F3]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-[14px] text-[#18181B] px-3 py-1 rounded-xl bg-white border border-[#E8DFCE]">
                        Câu {idx + 1}
                      </span>
                      <span className="text-[14px] font-bold text-slate-600">
                        {q.section === 'listening' ? 'Nghe hiểu' : q.section === 'reading' ? 'Đọc hiểu' : q.section === 'writing' ? 'Viết' : 'Nói & Phát âm'}
                      </span>
                    </div>

                    {isCorrect ? (
                      <span className="flex items-center gap-1.5 text-[14px] font-bold text-emerald-800 bg-emerald-100 px-3.5 py-1 rounded-full border border-emerald-300">
                        <Check className="w-5 h-5" />
                        Đúng
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[14px] font-bold text-red-700 bg-red-100 px-3.5 py-1 rounded-full border border-red-300">
                        <X className="w-5 h-5" />
                        Sai
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="font-serif font-bold text-[19px] text-[#18181B]">{q.question}</h5>
                    {q.pinyin && showPinyin && (
                      <p className="text-[16px] text-red-600 font-mono font-semibold">{q.pinyin}</p>
                    )}
                  </div>

                  {q.audioPrompt && (
                    <div className="flex flex-wrap items-center gap-3 text-[16px] bg-white p-4 rounded-2xl border border-[#E8DFCE]">
                      <span className="text-slate-600 font-semibold">File nghe:</span>
                      <span className="font-serif font-bold text-[19px] text-[#18181B]">{q.audioPrompt}</span>
                      <button
                        type="button"
                        onClick={() => speakChinese(q.audioPrompt!)}
                        className="ml-auto px-4 py-2 rounded-xl bg-[#FFF5F3] text-red-700 hover:bg-red-600 hover:text-white font-bold text-[14px] flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Volume2 className="w-5 h-5" />
                        <span>Nghe lại</span>
                      </button>
                    </div>
                  )}

                  {/* Options review for multiple choice */}
                  {qType === 'choice' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[16px]">
                      {q.options.map((opt, optIdx) => {
                        const isThisSelected = Number(userChoice) === optIdx;
                        const isThisCorrect = optIdx === q.correctAnswer;

                        let style = 'border-[#E8DFCE] bg-white text-[#18181B]';
                        if (isThisCorrect) {
                          style = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                        } else if (isThisSelected && !isThisCorrect) {
                          style = 'border-red-500 bg-red-50 text-red-900 line-through';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-2 ${style}`}
                          >
                            <span>{opt}</span>
                            {isThisCorrect && (
                              <span className="text-[13px] font-bold text-emerald-700 shrink-0">Đáp án đúng</span>
                            )}
                            {isThisSelected && !isThisCorrect && (
                              <span className="text-[13px] font-bold text-red-600 shrink-0">Bạn đã chọn</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Text review for fill_blank, writing, speaking */}
                  {qType !== 'choice' && (
                    <div className="p-4 bg-white rounded-2xl border border-[#E8DFCE] space-y-2 text-[16px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-600">Câu trả lời của bạn:</span>
                        <span className={`font-bold ${isCorrect ? 'text-emerald-700' : 'text-red-600'}`}>
                          {userChoice !== undefined && userChoice !== '' ? String(userChoice) : '(Chưa điền / chưa nói)'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t border-[#F2ECE0] pt-2">
                        <span className="text-slate-600">Đáp án chuẩn:</span>
                        <span className="font-bold text-[#18181B]">{q.correctText}</span>
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E8DFCE] text-[15px] sm:text-[16px] text-slate-700 leading-relaxed">
                    <span className="font-bold text-[#18181B] block mb-1">Giải thích chi tiết:</span>
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

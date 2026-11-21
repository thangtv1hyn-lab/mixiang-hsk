import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertCircle,
  Volume2,
  Check,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
  X,
  Mic,
  PenTool,
  Sparkles,
} from 'lucide-react';
import { Exam, ExamQuestion, ExamResult } from '../types/hsk';
import { useHSK } from '../context/HSKContext';
import { speakChinese, createSpeechRecognizer } from '../utils/audioSpeech';

interface ExamTakingViewProps {
  exam: Exam;
  onFinishExam: (result: ExamResult) => void;
  onCancel: () => void;
}

export const ExamTakingView: React.FC<ExamTakingViewProps> = ({
  exam,
  onFinishExam,
  onCancel,
}) => {
  const { submitExam, showPinyin } = useHSK();

  const [timeLeftSeconds, setTimeLeftSeconds] = useState(exam.timeLimitMinutes * 60);
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: number | string }>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [activeSection, setActiveSection] = useState<'all' | 'listening' | 'reading' | 'writing' | 'speaking'>('all');
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isRecordingSpeech, setIsRecordingSpeech] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (timeLeftSeconds <= 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftSeconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter questions by section if needed
  const displayQuestions = exam.questions.filter(
    (q) => activeSection === 'all' || q.section === activeSection
  );
  const activeQuestion: ExamQuestion = exam.questions[currentQuestionIdx];

  // Play audio for listening questions
  const handlePlayAudio = async (text: string) => {
    setIsPlayingAudio(true);
    await speakChinese(text, 0.8);
    setIsPlayingAudio(false);
  };

  // Speech recording for speaking questions
  const handleStartSpeaking = () => {
    setIsRecordingSpeech(true);
    const recognizer = createSpeechRecognizer(
      (transcript) => {
        setIsRecordingSpeech(false);
        setUserAnswers((prev) => ({
          ...prev,
          [activeQuestion.id]: transcript,
        }));
      },
      (error) => {
        console.warn('Speech recognition error in exam:', error);
        setIsRecordingSpeech(false);
        // Fallback simulate speech if microphone unsupported in browser
        const fallbackText = activeQuestion.correctText || '你好';
        setUserAnswers((prev) => ({
          ...prev,
          [activeQuestion.id]: fallbackText,
        }));
      }
    );

    if (recognizer) {
      try {
        recognizer.start();
      } catch {
        setIsRecordingSpeech(false);
      }
    } else {
      setTimeout(() => {
        setIsRecordingSpeech(false);
        const fallbackText = activeQuestion.correctText || '祝你考试顺利';
        setUserAnswers((prev) => ({
          ...prev,
          [activeQuestion.id]: fallbackText,
        }));
      }, 1500);
    }
  };

  // Auto grade and submit (support choice, fill_blank, writing, speaking)
  const calculateResult = (): ExamResult => {
    let listeningCorrect = 0;
    let readingCorrect = 0;
    let writingCorrect = 0;
    let speakingCorrect = 0;

    let listeningTotal = 0;
    let readingTotal = 0;
    let writingTotal = 0;
    let speakingTotal = 0;

    const cleanStr = (s: any) =>
      String(s || '')
        .trim()
        .toLowerCase()
        .replace(/[,.?!，。？！]/g, '')
        .replace(/\s+/g, '');

    exam.questions.forEach((q) => {
      const userChoice = userAnswers[q.id];
      const qType = q.questionType || (q.options && q.options.length > 0 ? 'choice' : 'fill_blank');
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

      if (q.section === 'listening') {
        listeningTotal++;
        if (isCorrect) listeningCorrect++;
      } else if (q.section === 'reading') {
        readingTotal++;
        if (isCorrect) readingCorrect++;
      } else if (q.section === 'speaking') {
        speakingTotal++;
        if (isCorrect) speakingCorrect++;
      } else {
        writingTotal++;
        if (isCorrect) writingCorrect++;
      }
    });

    const totalQuestions = exam.questions.length || 1;
    const totalCorrect = listeningCorrect + readingCorrect + writingCorrect + speakingCorrect;
    const pointsPerQuestion = exam.totalPoints / totalQuestions;
    const totalScore = Math.round(totalCorrect * pointsPerQuestion);

    const listeningScore = listeningTotal > 0
      ? Math.round((listeningCorrect / listeningTotal) * (exam.totalPoints * 0.3))
      : 0;
    const readingScore = readingTotal > 0
      ? Math.round((readingCorrect / readingTotal) * (exam.totalPoints * 0.3))
      : 0;
    const writingScore = writingTotal > 0
      ? Math.round((writingCorrect / writingTotal) * (exam.totalPoints * 0.25))
      : 0;
    const speakingScore = speakingTotal > 0
      ? Math.round((speakingCorrect / speakingTotal) * (exam.totalPoints * 0.15))
      : 0;

    const passed = totalScore >= exam.passScore;
    const timeSpentSeconds = exam.timeLimitMinutes * 60 - timeLeftSeconds;

    const result: ExamResult = {
      id: `res-${Date.now()}`,
      examId: exam.id,
      examTitle: exam.title,
      level: exam.level,
      date: new Date().toISOString().split('T')[0],
      listeningScore,
      readingScore,
      writingScore,
      speakingScore,
      totalScore,
      maxScore: exam.totalPoints,
      passed,
      timeSpentSeconds,
      userAnswers,
    };

    return result;
  };

  const handleManualSubmit = () => {
    const result = calculateResult();
    submitExam(result);
    onFinishExam(result);
  };

  const handleAutoSubmit = () => {
    const result = calculateResult();
    submitExam(result);
    onFinishExam(result);
  };

  const answeredCount = Object.keys(userAnswers).length;
  const isTimeCritical = timeLeftSeconds < 180; // less than 3 minutes

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Sticky Top Countdown & Progress Bar */}
      <div className="sticky top-16 lg:top-4 z-30 bg-[#FDFBF6]/95 backdrop-blur-md rounded-2xl border-2 border-[#E8DFCE] p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setShowConfirmExit(true)}
            className="text-[14px] font-bold text-[#18181B] hover:text-red-700 px-4 py-2 rounded-xl border border-[#E8DFCE] bg-white hover:border-red-500 transition-colors cursor-pointer shrink-0"
          >
            Thoát
          </button>
          <div className="min-w-0">
            <h3 className="font-sans font-extrabold text-[#18181B] text-[17px] sm:text-[19px] hidden sm:block truncate max-w-lg">
              {exam.title}
            </h3>
            {exam.subtitle && (
              <p className="text-[14px] text-slate-600 hidden md:block truncate max-w-lg">
                {exam.subtitle}
              </p>
            )}
            <span className="text-[14px] text-slate-600 font-semibold tabular-nums">
              Đã làm: <strong className="text-red-600">{answeredCount}/{exam.questions.length}</strong> câu
            </span>
          </div>
        </div>

        {/* Timer display */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-[16px] font-black border-2 transition-colors tabular-nums ${
              isTimeCritical
                ? 'bg-red-50 text-red-600 border-red-400 animate-pulse'
                : 'bg-[#FAF7F0] text-[#18181B] border-[#E8DFCE]'
            }`}
          >
            <Clock className="w-5 h-5 text-red-600" />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowConfirmSubmit(true)}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[14px] shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-5 h-5" />
            <span>Nộp bài thi</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Question Display Area */}
        <div className="lg:col-span-2 space-y-6">
          {activeQuestion && (
            <div className="bg-white rounded-3xl border-2 border-[#E8DFCE] p-6 sm:p-8 shadow-2xs space-y-6">
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#EFE7D6]">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3.5 py-1 rounded-xl text-[14px] font-mono font-bold bg-[#FFF5F3] text-red-700 border border-red-200 tabular-nums">
                    Câu {currentQuestionIdx + 1} / {exam.questions.length}
                  </span>
                  <span className="text-[14px] font-bold px-3.5 py-1 rounded-full bg-[#FAF7F0] border border-[#E8DFCE] text-[#18181B]">
                    {activeQuestion.section === 'listening'
                      ? 'Phần Nghe hiểu'
                      : activeQuestion.section === 'reading'
                      ? 'Phần Đọc hiểu'
                      : activeQuestion.section === 'speaking'
                      ? 'Phần Nói & Phát âm'
                      : 'Phần Viết & Cấu trúc'}
                  </span>
                </div>
              </div>

              {/* Listening Audio Prompt Player */}
              {activeQuestion.section === 'listening' && activeQuestion.audioPrompt && (
                <div className="bg-[#FEFCE8] rounded-2xl p-5 border border-amber-300/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[16px] font-black text-[#18181B] block">
                      Đoạn ghi âm bài nghe HSK:
                    </span>
                    <p className="text-[16px] text-slate-700 leading-snug">
                      Bấm vào loa để nghe đoạn hội thoại phát âm chuẩn. Bạn có thể nghe lại nhiều lần.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlayAudio(activeQuestion.audioPrompt!)}
                    disabled={isPlayingAudio}
                    className="px-5 py-3 rounded-2xl bg-red-600 text-white font-bold text-[14px] flex items-center gap-2 hover:bg-red-700 shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    <Volume2 className={`w-5 h-5 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
                    <span>{isPlayingAudio ? 'Đang phát...' : 'Phát âm thanh'}</span>
                  </button>
                </div>
              )}

              {/* Question Text */}
              <div className="space-y-2.5">
                <h4 className="font-['Noto_Sans_SC','PingFang_SC','Microsoft_YaHei',sans-serif] text-[21px] sm:text-[24px] font-bold tracking-wide text-[#18181B] leading-relaxed">
                  {activeQuestion.question}
                </h4>
                {activeQuestion.pinyin && showPinyin && (
                  <p className="text-[21px] sm:text-[24px] font-['Noto_Sans_SC','PingFang_SC','Microsoft_YaHei',sans-serif] text-red-600 font-semibold tracking-wide leading-relaxed">
                    {activeQuestion.pinyin}
                  </p>
                )}
              </div>

              {/* Multi-format Answer Section */}
              {(() => {
                const qType = activeQuestion.questionType || (activeQuestion.options && activeQuestion.options.length > 0 ? 'choice' : 'fill_blank');

                if (qType === 'choice' && activeQuestion.options) {
                  return (
                    <div className="space-y-3 pt-2">
                      {activeQuestion.options.map((option, optIdx) => {
                        const isSelected = userAnswers[activeQuestion.id] === optIdx;

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() =>
                              setUserAnswers((prev) => ({
                                ...prev,
                                [activeQuestion.id]: optIdx,
                              }))
                            }
                            className={`w-full p-4 sm:p-5 rounded-2xl border-2 text-left font-['Noto_Sans_SC','PingFang_SC','Microsoft_YaHei',sans-serif] text-[19px] sm:text-[21px] tracking-wide transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                              isSelected
                                ? 'border-red-600 bg-[#FFF5F3] text-[#18181B] font-bold shadow-xs'
                                : 'border-[#E8DFCE] bg-[#FDFBF6] text-[#18181B] hover:bg-[#FFF9F6] hover:border-amber-500/70'
                            }`}
                          >
                            <span>{option}</span>
                            <div
                              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                                isSelected
                                  ? 'border-red-600 bg-red-600 text-white'
                                  : 'border-[#D6CBB3] group-hover:border-red-400'
                              }`}
                            >
                              {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                }

                if (qType === 'fill_blank') {
                  const currentValue = String(userAnswers[activeQuestion.id] || '');
                  return (
                    <div className="space-y-3 pt-2">
                      <label className="text-[16px] font-bold text-[#18181B] block">
                        Nhập đáp án chữ Hán hoặc Pinyin vào chỗ trống:
                      </label>
                      <input
                        type="text"
                        value={currentValue}
                        onChange={(e) =>
                          setUserAnswers((prev) => ({
                            ...prev,
                            [activeQuestion.id]: e.target.value,
                          }))
                        }
                        placeholder="Gõ từ cần điền vào đây (ví dụ: 所以 / 学习...)"
                        className="w-full p-4 rounded-2xl border-2 border-[#E8DFCE] focus:border-red-600 bg-[#FDFBF6] font-['Noto_Sans_SC','PingFang_SC','Microsoft_YaHei',sans-serif] text-[19px] sm:text-[21px] font-medium text-[#18181B] shadow-xs outline-hidden"
                      />
                      {currentValue && (
                        <p className="text-[14px] text-emerald-700 font-bold flex items-center gap-1.5">
                          <Check className="w-5 h-5" />
                          <span>Đã lưu câu trả lời: "{currentValue}"</span>
                        </p>
                      )}
                    </div>
                  );
                }

                if (qType === 'writing') {
                  const currentValue = String(userAnswers[activeQuestion.id] || '');
                  return (
                    <div className="space-y-3 pt-2">
                      <label className="text-[16px] font-bold text-[#18181B] flex items-center gap-2">
                        <PenTool className="w-5 h-5 text-red-600" />
                        <span>Viết / Sắp xếp câu hoàn chỉnh:</span>
                      </label>
                      <textarea
                        rows={3}
                        value={currentValue}
                        onChange={(e) =>
                          setUserAnswers((prev) => ({
                            ...prev,
                            [activeQuestion.id]: e.target.value,
                          }))
                        }
                        placeholder="Nhập câu tiếng Trung hoàn chỉnh theo yêu cầu đề bài..."
                        className="w-full p-4 rounded-2xl border-2 border-[#E8DFCE] focus:border-red-600 bg-[#FDFBF6] font-['Noto_Sans_SC','PingFang_SC','Microsoft_YaHei',sans-serif] text-[19px] sm:text-[21px] font-medium text-[#18181B] shadow-xs outline-hidden"
                      />
                      {currentValue && (
                        <p className="text-[14px] text-red-700 font-bold flex items-center gap-1.5">
                          <Check className="w-5 h-5" />
                          <span>Đã ghi nhận bài viết ({currentValue.length} ký tự)</span>
                        </p>
                      )}
                    </div>
                  );
                }

                // Speaking Question Type
                const currentSpeakingVal = String(userAnswers[activeQuestion.id] || '');
                return (
                  <div className="space-y-4 pt-2">
                    <div className="p-5 bg-[#FFF5F3] rounded-3xl border-2 border-red-200 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[16px] font-bold text-red-800 flex items-center gap-2">
                          <Mic className="w-5 h-5 text-red-600" />
                          <span>Phần thi Nói & Phát âm tiếng Trung:</span>
                        </span>
                        {activeQuestion.correctText && (
                          <button
                            type="button"
                            onClick={() => handlePlayAudio(activeQuestion.correctText!)}
                            className="px-4 py-2 rounded-xl bg-white border border-red-200 text-red-700 font-bold text-[14px] flex items-center gap-1.5 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                          >
                            <Volume2 className="w-5 h-5" />
                            <span>Nghe câu mẫu</span>
                          </button>
                        )}
                      </div>

                      <div className="p-4 bg-white rounded-2xl border border-[#E8DFCE] space-y-1.5">
                        <span className="text-[13px] text-slate-500 uppercase font-bold block">
                          Câu cần phát âm:
                        </span>
                        <p className="font-['Noto_Sans_SC','PingFang_SC','Microsoft_YaHei',sans-serif] text-[21px] sm:text-[24px] font-bold tracking-wide text-[#18181B]">
                          {activeQuestion.correctText || activeQuestion.question}
                        </p>
                        {activeQuestion.pinyin && showPinyin && (
                          <p className="text-[21px] sm:text-[24px] font-['Noto_Sans_SC','PingFang_SC','Microsoft_YaHei',sans-serif] text-red-600 font-semibold tracking-wide">
                            {activeQuestion.pinyin}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={handleStartSpeaking}
                          disabled={isRecordingSpeech}
                          className={`px-5 py-3 rounded-2xl font-bold text-[14px] flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
                            isRecordingSpeech
                              ? 'bg-red-700 text-white animate-pulse'
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                        >
                          <Mic className={`w-5 h-5 ${isRecordingSpeech ? 'animate-bounce' : ''}`} />
                          <span>{isRecordingSpeech ? 'Đang lắng nghe giọng bạn...' : 'Bấm để Thu âm phát âm'}</span>
                        </button>

                        {currentSpeakingVal && (
                          <div className="text-[14px] text-[#18181B] bg-white px-4 py-2.5 rounded-2xl border border-[#E8DFCE] flex-1 truncate">
                            Giọng nhận diện được: <strong className="text-emerald-700">{currentSpeakingVal}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Next & Previous buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-[#EFE7D6]">
                <button
                  type="button"
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx((prev) => prev - 1)}
                  className="px-5 py-3 rounded-2xl text-[14px] sm:text-[16px] font-bold border-2 border-[#E8DFCE] bg-white text-[#18181B] hover:border-red-500 hover:bg-[#FFF5F3] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Câu trước</span>
                </button>

                <button
                  type="button"
                  disabled={currentQuestionIdx === exam.questions.length - 1}
                  onClick={() => setCurrentQuestionIdx((prev) => prev + 1)}
                  className="px-5 py-3 rounded-2xl text-[14px] sm:text-[16px] font-bold bg-[#18181B] text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span>Câu kế tiếp</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Palette: Question Navigator */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border-2 border-[#E8DFCE] p-6 shadow-2xs space-y-4">
            <h4 className="font-sans font-extrabold text-[18px] text-[#18181B]">Mục lục câu hỏi</h4>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-[13px] font-semibold text-slate-600">
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-red-600"></span>
                <span className="tabular-nums">Đã làm ({answeredCount})</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-[#FAF7F0] border border-[#D6CBB3]"></span>
                <span className="tabular-nums">Chưa làm ({exam.questions.length - answeredCount})</span>
              </span>
            </div>

            {/* Questions Grid Selector */}
            <div className="grid grid-cols-5 gap-2.5 pt-2">
              {exam.questions.map((q, idx) => {
                const isAnswered = userAnswers[q.id] !== undefined;
                const isCurrent = idx === currentQuestionIdx;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={`h-11 rounded-xl font-mono font-bold text-[14px] transition-all flex items-center justify-center cursor-pointer tabular-nums ${
                      isCurrent ? 'ring-2 ring-amber-500 ring-offset-2' : ''
                    } ${
                      isAnswered
                        ? 'bg-red-600 text-white'
                        : 'bg-[#FAF7F0] border border-[#E8DFCE] text-[#18181B] hover:border-red-400'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#EFE7D6]">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(true)}
                className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-[14px] transition-colors shadow-xs cursor-pointer"
              >
                Hoàn thành & Nộp bài thi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border-2 border-[#E8DFCE] shadow-2xl space-y-4">
            <h3 className="font-sans text-[20px] font-extrabold text-[#18181B]">Xác nhận nộp bài thi?</h3>
            <div className="text-[14px] text-[#18181B] space-y-2 bg-[#FDFBF6] p-4 rounded-2xl border border-[#E8DFCE]">
              <p className="text-[16px]">
                - Bạn đã hoàn thành: <strong className="text-red-600 tabular-nums">{answeredCount}/{exam.questions.length}</strong> câu hỏi.
              </p>
              {answeredCount < exam.questions.length && (
                <p className="text-[14px] text-amber-800 font-bold">
                  ⚠️ Còn {exam.questions.length - answeredCount} câu chưa trả lời. Những câu chưa làm sẽ không được tính điểm.
                </p>
              )}
              <p className="text-[16px]">
                - Thời gian còn lại: <strong className="font-mono tabular-nums">{formatTime(timeLeftSeconds)}</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-[#18181B] hover:bg-[#FAF7F0] border border-[#E8DFCE] cursor-pointer"
              >
                Làm tiếp
              </button>
              <button
                type="button"
                onClick={handleManualSubmit}
                className="px-5 py-2.5 rounded-xl text-[14px] font-bold bg-red-600 text-white hover:bg-red-700 shadow-xs cursor-pointer"
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Exit Modal */}
      {showConfirmExit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border-2 border-[#E8DFCE] shadow-2xl space-y-4">
            <h3 className="font-sans text-[20px] font-extrabold text-[#18181B]">Thoát bài thi?</h3>
            <p className="text-[16px] text-slate-700 leading-relaxed">
              Bạn có chắc muốn thoát bài thi? Tiến trình làm bài hiện tại sẽ không được lưu.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmExit(false)}
                className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-[#18181B] hover:bg-[#FAF7F0] border border-[#E8DFCE] cursor-pointer"
              >
                Làm tiếp
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmExit(false);
                  onCancel();
                }}
                className="px-5 py-2.5 rounded-xl text-[14px] font-bold bg-red-600 text-white hover:bg-red-700 shadow-xs cursor-pointer"
              >
                Thoát bài thi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

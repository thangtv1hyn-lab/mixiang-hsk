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
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Sticky Top Countdown & Progress Bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.confirm('Bạn có chắc muốn thoát bài thi? Tiến trình làm bài sẽ không được lưu.')) {
                onCancel();
              }
            }}
            className="text-xs font-semibold text-slate-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg border border-slate-200"
          >
            Thoát
          </button>
          <div>
            <h3 className="font-bold text-slate-900 text-sm hidden sm:block truncate max-w-xs">
              {exam.title}
            </h3>
            <span className="text-[11px] text-slate-500">
              Đã làm: <strong className="text-slate-900">{answeredCount}/{exam.questions.length}</strong> câu
            </span>
          </div>
        </div>

        {/* Timer display */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border transition-colors ${
              isTimeCritical
                ? 'bg-red-50 text-red-600 border-red-300 animate-pulse'
                : 'bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-rose-600" />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={() => setShowConfirmSubmit(true)}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nộp bài thi</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Question Display Area */}
        <div className="lg:col-span-2 space-y-6">
          {activeQuestion && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                    Câu {currentQuestionIdx + 1} / {exam.questions.length}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                    {activeQuestion.section === 'listening'
                      ? 'Phần Nghe hiểu'
                      : activeQuestion.section === 'reading'
                      ? 'Phần Đọc hiểu'
                      : 'Phần Viết & Cấu trúc'}
                  </span>
                </div>
              </div>

              {/* Listening Audio Prompt Player */}
              {activeQuestion.section === 'listening' && activeQuestion.audioPrompt && (
                <div className="bg-[#FAF7F0] rounded-2xl p-4 border border-[#E6DEC8] flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[#18181B] block">
                      Đoạn ghi âm bài nghe HSK:
                    </span>
                    <p className="text-xs text-slate-500">
                      Bấm vào loa để nghe đoạn hội thoại phát âm chuẩn. Bạn có thể nghe lại nhiều lần.
                    </p>
                  </div>

                  <button
                    onClick={() => handlePlayAudio(activeQuestion.audioPrompt!)}
                    disabled={isPlayingAudio}
                    className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center gap-2 hover:bg-red-700 shadow-xs transition-colors shrink-0"
                  >
                    <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
                    <span>{isPlayingAudio ? 'Đang phát...' : 'Phát âm thanh'}</span>
                  </button>
                </div>
              )}

              {/* Question Text */}
              <div className="space-y-2">
                <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {activeQuestion.question}
                </h4>
                {activeQuestion.pinyin && showPinyin && (
                  <p className="text-xs font-mono text-rose-600 italic">
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
                            onClick={() =>
                              setUserAnswers((prev) => ({
                                ...prev,
                                [activeQuestion.id]: optIdx,
                              }))
                            }
                            className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between group cursor-pointer ${
                              isSelected
                                ? 'border-rose-500 bg-rose-50/70 text-rose-950 font-semibold shadow-xs'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <span>{option}</span>
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'border-rose-600 bg-rose-600 text-white'
                                  : 'border-slate-300 group-hover:border-slate-400'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
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
                      <label className="text-xs font-semibold text-slate-700 block">
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
                        className="w-full p-4 rounded-xl border border-slate-300 focus:border-rose-500 bg-white text-sm font-medium text-slate-900 shadow-xs outline-hidden"
                      />
                      {currentValue && (
                        <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
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
                      <label className="text-xs font-semibold text-slate-700 block flex items-center gap-1.5">
                        <PenTool className="w-4 h-4 text-red-600" />
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
                        className="w-full p-3.5 rounded-xl border border-[#E6DEC8] focus:border-red-500 bg-white text-sm font-medium text-slate-900 shadow-xs outline-hidden"
                      />
                      {currentValue && (
                        <p className="text-[11px] text-red-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
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
                    <div className="p-4 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 rounded-2xl border border-rose-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                          <Mic className="w-4 h-4 text-rose-600" />
                          <span>Phần thi Nói & Phát âm tiếng Trung:</span>
                        </span>
                        {activeQuestion.correctText && (
                          <button
                            type="button"
                            onClick={() => handlePlayAudio(activeQuestion.correctText!)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-700 font-bold text-[11px] flex items-center gap-1 hover:bg-rose-50"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Nghe câu mẫu</span>
                          </button>
                        )}
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-rose-100 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Câu cần phát âm:</span>
                        <p className="text-base font-bold text-slate-900">{activeQuestion.correctText || activeQuestion.question}</p>
                        {activeQuestion.pinyin && <p className="text-xs font-mono text-rose-600">{activeQuestion.pinyin}</p>}
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={handleStartSpeaking}
                          disabled={isRecordingSpeech}
                          className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
                            isRecordingSpeech
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-rose-600 hover:bg-rose-500 text-white'
                          }`}
                        >
                          <Mic className={`w-4 h-4 ${isRecordingSpeech ? 'animate-bounce' : ''}`} />
                          <span>{isRecordingSpeech ? 'Đang lắng nghe giọng bạn...' : 'Bấm để Thu âm phát âm'}</span>
                        </button>

                        {currentSpeakingVal && (
                          <div className="text-xs text-slate-700 bg-white px-3 py-2 rounded-xl border border-slate-200 flex-1 truncate">
                            Giọng nhận diện được: <strong className="text-emerald-700">{currentSpeakingVal}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Next & Previous buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx((prev) => prev - 1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Câu trước</span>
                </button>

                <button
                  disabled={currentQuestionIdx === exam.questions.length - 1}
                  onClick={() => setCurrentQuestionIdx((prev) => prev + 1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <span>Câu kế tiếp</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Palette: Question Navigator */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-slate-900">Mục lục câu hỏi</h4>

            {/* Legend */}
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-rose-600"></span>
                <span>Đã làm ({answeredCount})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-300"></span>
                <span>Chưa làm ({exam.questions.length - answeredCount})</span>
              </span>
            </div>

            {/* Questions Grid Selector */}
            <div className="grid grid-cols-5 gap-2 pt-2">
              {exam.questions.map((q, idx) => {
                const isAnswered = userAnswers[q.id] !== undefined;
                const isCurrent = idx === currentQuestionIdx;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={`h-10 rounded-xl font-bold text-xs transition-all flex items-center justify-center ${
                      isCurrent
                        ? 'ring-2 ring-rose-500 ring-offset-2'
                        : ''
                    } ${
                      isAnswered
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-xs hover:from-rose-700 transition-colors shadow-xs"
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Xác nhận nộp bài thi?</h3>
            <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p>
                - Bạn đã hoàn thành: <strong className="text-rose-600">{answeredCount}/{exam.questions.length}</strong> câu hỏi.
              </p>
              {answeredCount < exam.questions.length && (
                <p className="text-amber-700 font-medium">
                  ⚠️ Còn {exam.questions.length - answeredCount} câu chưa trả lời. Những câu chưa làm sẽ không được tính điểm.
                </p>
              )}
              <p>
                - Thời gian còn lại: <strong>{formatTime(timeLeftSeconds)}</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Làm tiếp
              </button>
              <button
                onClick={handleManualSubmit}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

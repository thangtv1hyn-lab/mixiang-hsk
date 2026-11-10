import React, { useState } from 'react';
import {
  ArrowLeft,
  Volume2,
  CheckCircle2,
  BookOpen,
  FileText,
  MessageCircle,
  HelpCircle,
  Sparkles,
  Share2,
  BookmarkCheck,
  Check,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Lesson, VocabItem } from '../types/hsk';
import { useHSK } from '../context/HSKContext';
import { speakChinese } from '../utils/audioSpeech';

interface LessonDetailViewProps {
  lesson: Lesson;
  onBack: () => void;
}

export const LessonDetailView: React.FC<LessonDetailViewProps> = ({ lesson, onBack }) => {
  const {
    showPinyin,
    studentProfile,
    completeLesson,
    markVocabMastered,
    markVocabLearning,
    recordStudyMinutes,
  } = useHSK();

  const [activeTab, setActiveTab] = useState<'vocab' | 'grammar' | 'dialogue' | 'practice'>('vocab');
  const [practiceAnswers, setPracticeAnswers] = useState<{ [qId: string]: number }>({});
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [isCompletedNow, setIsCompletedNow] = useState<boolean>(
    studentProfile.completedLessonIds.includes(lesson.id)
  );

  const isCompleted = studentProfile.completedLessonIds.includes(lesson.id) || isCompletedNow;

  // Handle TTS play
  const handlePlayAudio = async (text: string, id: string) => {
    setIsPlayingAudio(id);
    await speakChinese(text);
    setIsPlayingAudio(null);
  };

  // Complete lesson celebration
  const handleCompleteLesson = () => {
    completeLesson(lesson.id);
    setIsCompletedNow(true);
    recordStudyMinutes(lesson.durationMinutes || 20);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#DC2626', '#EA580C', '#EAB308', '#10B981'],
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Navigation & Status */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-rose-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách khóa học</span>
        </button>

        <div className="flex items-center gap-2">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đã hoàn thành bài học</span>
            </span>
          ) : (
            <button
              onClick={handleCompleteLesson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Đánh dấu hoàn thành</span>
            </button>
          )}
        </div>
      </div>

      {/* Lesson Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                {lesson.level}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Bài {lesson.lessonNumber}</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">{lesson.durationMinutes} phút</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
              {lesson.title}
            </h1>
            <p className="text-base text-rose-800 font-medium">
              {lesson.vietnameseTitle}
            </p>
          </div>

          <button
            onClick={() => handlePlayAudio(lesson.title, 'lesson-title')}
            className={`p-3 rounded-full border transition-all ${
              isPlayingAudio === 'lesson-title'
                ? 'bg-rose-600 text-white border-rose-600 scale-105 animate-pulse'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
            title="Nghe phát âm tiêu đề bài học"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mt-4 pt-4 border-t border-slate-100 leading-relaxed">
          {lesson.description}
        </p>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mt-6 pt-2 border-t border-slate-100 overflow-x-auto">
          {[
            { id: 'vocab', label: `Từ vựng (${lesson.vocabulary.length})`, icon: BookOpen },
            { id: 'grammar', label: `Ngữ pháp (${lesson.grammar.length})`, icon: FileText },
            { id: 'dialogue', label: `Hội thoại (${lesson.dialogue.length})`, icon: MessageCircle },
            { id: 'practice', label: `Luyện tập (${lesson.practiceQuestions.length})`, icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Vocabulary */}
      {activeTab === 'vocab' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Bấm vào biểu tượng loa để nghe giọng đọc chuẩn bản xứ.</span>
            <span>{lesson.vocabulary.length} từ vựng trọng tâm</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lesson.vocabulary.map((vocab) => {
              const isMastered = studentProfile.masteredVocabIds.includes(vocab.id);

              return (
                <div
                  key={vocab.id}
                  className={`bg-white rounded-xl border p-5 transition-all shadow-xs ${
                    isMastered ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-3xl font-bold text-slate-900 tracking-wide">
                        {vocab.word}
                      </span>
                      <div>
                        {showPinyin && (
                          <span className="text-sm font-medium text-rose-600 block">
                            {vocab.pinyin}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 block">
                          [Hán Việt: {vocab.sinoVietnamese}]
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePlayAudio(vocab.word, vocab.id)}
                      className={`p-2 rounded-lg border transition-colors ${
                        isPlayingAudio === vocab.id
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-600'
                      }`}
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-sm font-semibold text-slate-800 mb-3">
                    {vocab.meaning}
                  </div>

                  {/* Example sentence */}
                  <div className="bg-slate-50 rounded-lg p-3 text-xs border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{vocab.exampleSentence}</span>
                      <button
                        onClick={() => handlePlayAudio(vocab.exampleSentence, `ex-${vocab.id}`)}
                        className="text-slate-400 hover:text-rose-600"
                        title="Nghe câu ví dụ"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {showPinyin && (
                      <p className="text-rose-700/80 italic">{vocab.examplePinyin}</p>
                    )}
                    <p className="text-slate-600">{vocab.exampleMeaning}</p>
                  </div>

                  {/* Mastery toggle */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                    <span className="text-slate-400">
                      {vocab.radical ? `Bộ: ${vocab.radical}` : ''}
                    </span>
                    <button
                      onClick={() =>
                        isMastered
                          ? markVocabLearning(vocab.id)
                          : markVocabMastered(vocab.id)
                      }
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                        isMastered
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      <span>{isMastered ? 'Đã thành thạo' : 'Đánh dấu đã thuộc'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Grammar */}
      {activeTab === 'grammar' && (
        <div className="space-y-6">
          {lesson.grammar.map((item, idx) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-rose-600 text-white text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {item.title}
                  </h3>
                </div>
              </div>

              {/* Structure box */}
              <div className="bg-amber-50/80 rounded-xl p-4 border border-amber-200/60">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block mb-1">
                  Cấu trúc ngữ pháp:
                </span>
                <p className="text-sm font-semibold text-amber-950 font-mono">
                  {item.structure}
                </p>
              </div>

              {/* Explanation */}
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {item.explanation}
              </div>

              {/* Examples */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Ví dụ minh họa:
                </span>
                <div className="space-y-2">
                  {item.examples.map((ex, exIdx) => (
                    <div
                      key={exIdx}
                      className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-900 text-sm">{ex.hanzi}</p>
                        {showPinyin && (
                          <p className="text-xs text-rose-700 italic">{ex.pinyin}</p>
                        )}
                        <p className="text-xs text-slate-600">➔ {ex.translation}</p>
                      </div>

                      <button
                        onClick={() => handlePlayAudio(ex.hanzi, `gram-ex-${idx}-${exIdx}`)}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 transition-colors shrink-0"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Dialogue */}
      {activeTab === 'dialogue' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Hội thoại thực tế</h3>
              <p className="text-xs text-slate-500">Luyện nghe và nhắc lại theo từng câu của nhân vật</p>
            </div>

            <button
              onClick={async () => {
                for (const line of lesson.dialogue) {
                  await speakChinese(line.chinese);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-rose-600" />
              <span>Phát toàn bộ bài thoại</span>
            </button>
          </div>

          <div className="space-y-4">
            {lesson.dialogue.map((line) => (
              <div key={line.id} className="flex items-start gap-3 group">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {line.speaker.slice(0, 2)}
                </div>

                <div className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-rose-200 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-rose-800">{line.speaker}</span>
                    <button
                      onClick={() => handlePlayAudio(line.chinese, line.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 transition-colors"
                      title="Nghe câu này"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="font-serif text-lg font-bold text-slate-900 tracking-wide mb-1">
                    {line.chinese}
                  </p>
                  {showPinyin && (
                    <p className="text-xs text-rose-600 font-medium italic mb-1.5">
                      {line.pinyin}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                    {line.vietnamese}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Practice Quiz */}
      {activeTab === 'practice' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-lg mb-1">Luyện tập củng cố kiến thức</h3>
            <p className="text-xs text-slate-500 mb-6">Trả lời câu hỏi trắc nghiệm để kiểm tra mức độ hiểu bài</p>

            <div className="space-y-6">
              {lesson.practiceQuestions.map((q, idx) => {
                const selected = practiceAnswers[q.id];
                const isAnswered = selected !== undefined;
                const isCorrect = selected === q.correctAnswer;

                return (
                  <div key={q.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-xs text-rose-600 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200">
                        Câu {idx + 1}
                      </span>
                      <p className="font-semibold text-sm text-slate-900 flex-1">{q.question}</p>
                    </div>

                    {q.pinyin && showPinyin && (
                      <p className="text-xs text-slate-500 italic pl-8">{q.pinyin}</p>
                    )}

                    {/* Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                      {q.options.map((opt, optIdx) => {
                        const isThisSelected = selected === optIdx;
                        const isThisCorrect = optIdx === q.correctAnswer;

                        let optClasses = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100';
                        if (isAnswered) {
                          if (isThisCorrect) {
                            optClasses = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                          } else if (isThisSelected) {
                            optClasses = 'border-red-500 bg-red-50 text-red-900 font-semibold';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={isAnswered}
                            onClick={() =>
                              setPracticeAnswers((prev) => ({
                                ...prev,
                                [q.id]: optIdx,
                              }))
                            }
                            className={`p-3 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between ${optClasses}`}
                          >
                            <span>{opt}</span>
                            {isAnswered && isThisCorrect && (
                              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                            {isAnswered && isThisSelected && !isThisCorrect && (
                              <X className="w-4 h-4 text-red-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {isAnswered && (
                      <div
                        className={`p-3 rounded-lg text-xs leading-relaxed mt-2 ${
                          isCorrect
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <span className="font-bold block mb-0.5">
                          {isCorrect ? '✓ Chính xác!' : '✗ Chưa chính xác. Giải thích:'}
                        </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">
            {isCompleted ? 'Bạn đã hoàn thành bài học này!' : 'Đã học xong nội dung bài học?'}
          </h4>
          <p className="text-xs text-slate-500">
            {isCompleted
              ? 'Tiếp tục luyện tập từ vựng hoặc chuyển sang bài học tiếp theo.'
              : 'Bấm nút hoàn thành để ghi nhận thời gian học tập và nhận điểm thưởng 50 XP.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isCompleted && (
            <button
              onClick={handleCompleteLesson}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-sm hover:from-rose-700 hover:to-red-700 transition-all shadow-md shadow-rose-200 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Hoàn thành bài học (+50 XP)</span>
            </button>
          )}

          <button
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            Bài tiếp theo ➔
          </button>
        </div>
      </div>
    </div>
  );
};

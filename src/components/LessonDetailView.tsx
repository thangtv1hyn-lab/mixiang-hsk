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
  Pause,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Lesson, VocabItem } from '../types/hsk';
import { useHSK } from '../context/HSKContext';
import { speakChinese, stopSpeaking } from '../utils/audioSpeech';

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
  const [activeDialogueIndex, setActiveDialogueIndex] = useState<number | null>(null);
  const [isAutoPlayingDialogue, setIsAutoPlayingDialogue] = useState<boolean>(false);
  const [dialogueSpeed, setDialogueSpeed] = useState<number>(0.85);
  const [isCompletedNow, setIsCompletedNow] = useState<boolean>(
    studentProfile.completedLessonIds.includes(lesson.id)
  );

  const isCompleted = studentProfile.completedLessonIds.includes(lesson.id) || isCompletedNow;

  // Handle TTS play
  const handlePlayAudio = async (text: string, id: string) => {
    setIsPlayingAudio(id);
    await speakChinese(text, dialogueSpeed);
    setIsPlayingAudio(null);
  };

  // Play full dialogue step by step with speech bubble highlight
  const handlePlayAllDialogue = async () => {
    if (isAutoPlayingDialogue) {
      stopSpeaking();
      setIsAutoPlayingDialogue(false);
      setActiveDialogueIndex(null);
      return;
    }

    setIsAutoPlayingDialogue(true);
    for (let i = 0; i < lesson.dialogue.length; i++) {
      setActiveDialogueIndex(i);
      await speakChinese(lesson.dialogue[i].chinese, dialogueSpeed);
      // Small natural pause between conversation turns
      await new Promise((r) => setTimeout(r, 650));
    }
    setActiveDialogueIndex(null);
    setIsAutoPlayingDialogue(false);
  };

  const handlePlaySingleDialogue = async (text: string, index: number) => {
    if (isAutoPlayingDialogue) {
      stopSpeaking();
      setIsAutoPlayingDialogue(false);
    }
    setActiveDialogueIndex(index);
    await speakChinese(text, dialogueSpeed);
    setActiveDialogueIndex(null);
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
          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 px-1">
            <span className="font-medium">Bấm vào biểu tượng loa để nghe giọng đọc chuẩn bản xứ tiếng Trung.</span>
            <span className="font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              {lesson.vocabulary.length} từ vựng trọng tâm
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lesson.vocabulary.map((vocab, idx) => {
              const isMastered = studentProfile.masteredVocabIds.includes(vocab.id);

              return (
                <div
                  key={vocab.id}
                  className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all shadow-xs hover:shadow-md ${
                    isMastered ? 'border-emerald-300 bg-emerald-50/15' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white font-mono text-xs font-bold shadow-xs">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          Hán Việt: {vocab.sinoVietnamese || '-'}
                        </span>
                        {vocab.radical && (
                          <span className="text-xs text-slate-400 font-medium">
                            Bộ: {vocab.radical}
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-3 flex-wrap">
                        <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-wide">
                          {vocab.word}
                        </h2>
                        {showPinyin && (
                          <span className="text-lg sm:text-xl font-bold font-mono text-rose-600">
                            {vocab.pinyin}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handlePlayAudio(vocab.word, vocab.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isPlayingAudio === vocab.id
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-105 animate-pulse'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                      }`}
                      title="Nghe phát âm chuẩn từ này"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="text-base sm:text-lg font-bold text-slate-900 mb-3.5 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/50">
                    <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block mb-0.5">
                      Nghĩa tiếng Việt:
                    </span>
                    {vocab.meaning}
                  </div>

                  {/* Example sentence */}
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm sm:text-base text-slate-900">{vocab.exampleSentence}</span>
                      <button
                        onClick={() => handlePlayAudio(vocab.exampleSentence, `ex-${vocab.id}`)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer shrink-0"
                        title="Nghe câu ví dụ"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    {showPinyin && (
                      <p className="text-xs sm:text-sm font-mono text-rose-700 font-semibold">{vocab.examplePinyin}</p>
                    )}
                    <p className="text-xs sm:text-sm text-slate-700 font-medium">{vocab.exampleMeaning}</p>
                  </div>

                  {/* Mastery toggle */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400">
                      HSK {lesson.level}
                    </span>
                    <button
                      onClick={() =>
                        isMastered
                          ? markVocabLearning(vocab.id)
                          : markVocabMastered(vocab.id)
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        isMastered
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <BookmarkCheck className="w-4 h-4 text-emerald-600" />
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

      {/* Tab 3: Interactive Dialogue Stage */}
      {activeTab === 'dialogue' && (
        <div className="space-y-6">
          {/* Sân Khấu Minh Họa 2 Nhân Vật Giao Tiếp */}
          <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-700 shadow-xl relative overflow-hidden">
            {/* Background ambient lighting */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Nhân vật A (Tiểu Minh - Học viên) */}
              <div className="flex items-center md:items-start gap-4">
                <div className="relative">
                  <div
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-zinc-800 to-zinc-950 flex items-center justify-center text-3xl sm:text-4xl shadow-lg border-2 transition-all duration-300 ${
                      activeDialogueIndex !== null &&
                      (lesson.dialogue[activeDialogueIndex]?.speaker?.toUpperCase().includes('A') || activeDialogueIndex % 2 === 0)
                        ? 'border-red-500 ring-4 ring-red-500/50 scale-105 animate-pulse'
                        : 'border-white/20'
                    }`}
                  >
                    👦
                  </div>
                  {activeDialogueIndex !== null &&
                    (lesson.dialogue[activeDialogueIndex]?.speaker?.toUpperCase().includes('A') || activeDialogueIndex % 2 === 0) && (
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white shadow-xs whitespace-nowrap animate-bounce">
                        Đang nói 🔊
                      </span>
                    )}
                </div>
                <div className="text-left">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-950/60 text-red-200 border border-red-600/40 uppercase tracking-wider">
                    Nhân vật A
                  </span>
                  <h4 className="text-lg font-bold text-white mt-1">Tiểu Minh</h4>
                  <p className="text-xs text-slate-300">Học viên tiếng Trung HSK</p>
                </div>
              </div>

              {/* Bộ Điều Khiển Trung Tâm */}
              <div className="flex flex-col items-center gap-3 text-center px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="text-xs font-semibold text-slate-300">
                  {isAutoPlayingDialogue
                    ? `Đang phát câu ${activeDialogueIndex !== null ? activeDialogueIndex + 1 : 1} / ${lesson.dialogue.length}`
                    : 'Luyện nghe & phản xạ hội thoại thực tế'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePlayAllDialogue}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                      isAutoPlayingDialogue
                        ? 'bg-rose-500 hover:bg-rose-600 text-white ring-2 ring-rose-300 animate-pulse'
                        : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white'
                    }`}
                  >
                    {isAutoPlayingDialogue ? (
                      <>
                        <Pause className="w-4 h-4 fill-white" />
                        <span>Tạm dừng</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>Phát toàn bộ bài thoại</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/10 text-xs">
                    <button
                      onClick={() => setDialogueSpeed(0.85)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                        dialogueSpeed === 0.85 ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Tốc độ 0.85x chuẩn sư phạm để nghe rõ âm điệu"
                    >
                      0.85x
                    </button>
                    <button
                      onClick={() => setDialogueSpeed(1.0)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                        dialogueSpeed === 1.0 ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Tốc độ 1.0x tự nhiên bản xứ"
                    >
                      1.0x
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Bấm vào từng bong bóng thoại bên dưới để nghe riêng từng câu
                </p>
              </div>

              {/* Nhân vật B (Cô Mỹ Linh - Giảng viên) */}
              <div className="flex items-center md:items-start gap-4 flex-row-reverse md:flex-row">
                <div className="text-right md:text-right">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                    Nhân vật B
                  </span>
                  <h4 className="text-lg font-bold text-white mt-1">Cô Mỹ Linh</h4>
                  <p className="text-xs text-amber-200/80">Giảng viên / Lão Sư</p>
                </div>
                <div className="relative">
                  <div
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-3xl sm:text-4xl shadow-lg border-2 transition-all duration-300 ${
                      activeDialogueIndex !== null &&
                      (!lesson.dialogue[activeDialogueIndex]?.speaker?.toUpperCase().includes('A') && activeDialogueIndex % 2 !== 0)
                        ? 'border-amber-300 ring-4 ring-amber-400/50 scale-105 animate-pulse'
                        : 'border-white/20'
                    }`}
                  >
                    👩‍🏫
                  </div>
                  {activeDialogueIndex !== null &&
                    (!lesson.dialogue[activeDialogueIndex]?.speaker?.toUpperCase().includes('A') && activeDialogueIndex % 2 !== 0) && (
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-xs whitespace-nowrap animate-bounce">
                        Đang nói 🔊
                      </span>
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* Dòng Bong Bóng Hội Thoại (Comic Speech Bubbles) */}
          <div className="space-y-6 pt-2">
            {lesson.dialogue.map((line, idx) => {
              const isSpeakerA =
                line.speaker.toUpperCase().includes('A') ||
                line.speaker.toLowerCase().includes('minh') ||
                idx % 2 === 0;
              const isCurrentActive = activeDialogueIndex === idx;

              return (
                <div
                  key={line.id}
                  className={`flex items-start gap-3 sm:gap-4 transition-all duration-300 ${
                    isSpeakerA ? 'justify-start' : 'justify-end flex-row-reverse'
                  }`}
                >
                  {/* Avatar Mini Icon */}
                  <div
                    className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center text-xl sm:text-2xl shrink-0 shadow-md transition-all duration-300 ${
                      isSpeakerA
                        ? 'bg-gradient-to-tr from-zinc-800 to-zinc-950 text-white border border-[#E6DEC8]'
                        : 'bg-gradient-to-tr from-amber-600 to-red-600 text-white'
                    } ${isCurrentActive ? 'ring-4 ring-red-500 scale-110 animate-bounce' : 'opacity-90'}`}
                  >
                    {isSpeakerA ? '👦' : '👩‍🏫'}
                  </div>

                  {/* Speech Bubble Container */}
                  <div
                    onClick={() => handlePlaySingleDialogue(line.chinese, idx)}
                    className={`relative max-w-xl sm:max-w-2xl p-5 sm:p-6 rounded-3xl transition-all duration-300 cursor-pointer shadow-xs hover:shadow-lg ${
                      isSpeakerA
                        ? 'bg-white border-2 border-[#E6DEC8] rounded-tl-xs text-left'
                        : 'bg-[#FAF7F0] border-2 border-red-200/80 rounded-tr-xs text-left'
                    } ${
                      isCurrentActive
                        ? isSpeakerA
                          ? 'border-red-600 ring-4 ring-red-200 bg-[#FAF7F0] shadow-xl scale-[1.015]'
                          : 'border-amber-600 ring-4 ring-amber-200 bg-[#F5EFEB] shadow-xl scale-[1.015]'
                        : 'hover:border-red-400'
                    }`}
                  >
                    {/* Header: Speaker & Controls */}
                    <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isSpeakerA
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          Lượt #{idx + 1} • {line.speaker}
                        </span>
                        {isCurrentActive && (
                          <span className="flex items-center gap-1 text-[11px] font-extrabold text-rose-600 animate-pulse">
                            <span>●</span> Đang phát âm thanh
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlaySingleDialogue(line.chinese, idx);
                        }}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          isCurrentActive
                            ? 'bg-rose-600 text-white shadow-sm scale-105'
                            : 'bg-slate-100 text-slate-700 hover:bg-rose-100 hover:text-rose-700'
                        }`}
                        title="Bấm để nghe phát âm câu này"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Chinese Text (Cỡ chữ to rõ 25-40%) */}
                    <p className="font-serif text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-wide mb-2 leading-relaxed">
                      {line.chinese}
                    </p>

                    {/* Pīnyīn */}
                    {showPinyin && (
                      <p
                        className={`text-base sm:text-lg font-mono font-bold mb-2.5 ${
                          isSpeakerA ? 'text-sky-700' : 'text-amber-800'
                        }`}
                      >
                        {line.pinyin}
                      </p>
                    )}

                    {/* Vietnamese Translation */}
                    <p className="text-sm sm:text-base font-semibold text-slate-700 pt-2 border-t border-slate-200/60 leading-relaxed">
                      {line.vietnamese}
                    </p>
                  </div>
                </div>
              );
            })}
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

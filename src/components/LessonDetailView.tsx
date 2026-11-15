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
    <div className="w-full space-y-6 pb-16">
      {/* Top Navigation & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-[#E8DFCE] text-[14px] sm:text-[16px] font-bold text-[#18181B] hover:border-red-500 hover:text-red-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại danh sách khóa học</span>
        </button>

        <div className="flex items-center gap-2">
          {isCompleted ? (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[14px] font-bold bg-[#ECFDF5] text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Đã hoàn thành bài học</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleCompleteLesson}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[14px] font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
            >
              <Check className="w-5 h-5" />
              <span>Đánh dấu hoàn thành</span>
            </button>
          )}
        </div>
      </div>

      {/* Lesson Header Card (Đồng bộ Đỏ - Be - Đen) */}
      <div className="bg-gradient-to-br from-red-600 via-red-700 to-[#18181B] border border-red-500/70 text-white rounded-3xl p-6 sm:p-8 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2.5 text-[14px] font-bold text-amber-200">
              <span className="px-3 py-0.5 rounded-xl bg-black/30 border border-white/20 text-white">
                {lesson.level}
              </span>
              <span aria-hidden="true">·</span>
              <span>Bài {lesson.lessonNumber}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{lesson.durationMinutes} phút</span>
            </div>
            <h1 className="font-serif text-[24px] sm:text-[30px] font-black text-white leading-tight">
              {lesson.title}
            </h1>
            <p className="text-[19px] text-amber-200 font-bold leading-snug">
              {lesson.vietnameseTitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handlePlayAudio(lesson.title, 'lesson-title')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer shrink-0 ${
              isPlayingAudio === 'lesson-title'
                ? 'bg-amber-300 text-[#18181B] border-amber-200 scale-105 animate-pulse'
                : 'bg-white/15 text-white border-white/30 hover:bg-white/25'
            }`}
            title="Nghe phát âm tiêu đề bài học"
            aria-label="Nghe phát âm tiêu đề bài học"
          >
            <Volume2 className="w-7 h-7" />
          </button>
        </div>

        <p className="text-[19px] text-rose-50 pt-4 border-t border-white/20 leading-relaxed">
          {lesson.description}
        </p>
      </div>

      {/* Tab switcher (Nền Be #F5EFEB đồng bộ Khóa học / Đề thi) */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#F5EFEB] rounded-2xl border border-[#E8DFCE]">
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
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] sm:text-[16px] font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'text-[#18181B] hover:bg-white hover:text-red-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Vocabulary */}
      {activeTab === 'vocab' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-[19px] font-medium text-slate-700">
              Bấm vào biểu tượng loa để nghe giọng đọc chuẩn bản xứ tiếng Trung.
            </p>
            <span className="font-bold text-[14px] text-red-700 bg-[#FFF5F3] px-4 py-1.5 rounded-2xl border border-red-200 tabular-nums">
              {lesson.vocabulary.length} từ vựng trọng tâm
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {lesson.vocabulary.map((vocab, idx) => {
              const isMastered = studentProfile.masteredVocabIds.includes(vocab.id);

              return (
                <div
                  key={vocab.id}
                  className={`rounded-3xl border-2 p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg ${
                    isMastered
                      ? 'border-emerald-400 bg-[#ECFDF5]'
                      : 'bg-white border-[#E8DFCE] hover:border-amber-500/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-xl bg-[#18181B] text-amber-300 font-mono text-[13px] font-bold">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[14px] font-bold text-[#18181B] bg-[#FAF7F0] border border-[#E8DFCE] px-3 py-0.5 rounded-xl">
                          Hán Việt: {vocab.sinoVietnamese || '-'}
                        </span>
                        {vocab.radical && (
                          <span className="text-[14px] text-slate-600 font-semibold">
                            Bộ: {vocab.radical}
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-3 flex-wrap pt-1">
                        <h2 className="font-serif text-[37px] sm:text-[43px] font-black text-[#18181B] tracking-wide leading-none">
                          {vocab.word}
                        </h2>
                        {showPinyin && (
                          <span className="text-[19px] sm:text-[21px] font-bold font-mono text-red-600">
                            {vocab.pinyin}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePlayAudio(vocab.word, vocab.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer shrink-0 ${
                        isPlayingAudio === vocab.id
                          ? 'bg-red-600 text-white border-red-600 shadow-md scale-105 animate-pulse'
                          : 'bg-[#FFF5F3] text-red-700 border-red-200 hover:bg-red-600 hover:text-white'
                      }`}
                      title="Nghe phát âm chuẩn từ này"
                      aria-label={`Nghe phát âm ${vocab.word}`}
                    >
                      <Volume2 className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="text-[19px] font-extrabold text-[#18181B] mb-4 bg-[#FEFCE8] p-4 rounded-2xl border border-amber-200/80">
                    <span className="text-[13px] font-bold text-amber-800 uppercase tracking-wider block mb-0.5">
                      Nghĩa tiếng Việt
                    </span>
                    {vocab.meaning}
                  </div>

                  {/* Example sentence */}
                  <div className="bg-[#FDFBF6] rounded-2xl p-4 border border-[#E8DFCE] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-serif font-bold text-[19px] text-[#18181B]">
                        {vocab.exampleSentence}
                      </span>
                      <button
                        type="button"
                        onClick={() => handlePlayAudio(vocab.exampleSentence, `ex-${vocab.id}`)}
                        className="text-red-600 hover:bg-[#FFF5F3] p-2 rounded-xl transition-colors cursor-pointer shrink-0"
                        title="Nghe câu ví dụ"
                        aria-label="Nghe câu ví dụ"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>
                    {showPinyin && (
                      <p className="text-[16px] font-mono text-red-700 font-semibold">
                        {vocab.examplePinyin}
                      </p>
                    )}
                    <p className="text-[19px] text-slate-700 font-medium">{vocab.exampleMeaning}</p>
                  </div>

                  {/* Mastery toggle */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#EFE7D6]">
                    <span className="text-[14px] font-bold text-slate-500">{lesson.level}</span>
                    <button
                      type="button"
                      onClick={() =>
                        isMastered
                          ? markVocabLearning(vocab.id)
                          : markVocabMastered(vocab.id)
                      }
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[14px] font-bold transition-colors cursor-pointer ${
                        isMastered
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-[#FAF7F0] text-[#18181B] border border-[#E8DFCE] hover:border-red-500 hover:bg-[#FFF5F3]'
                      }`}
                    >
                      <BookmarkCheck className="w-5 h-5 text-emerald-600" />
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
            <div key={item.id} className="bg-white rounded-3xl border-2 border-[#E8DFCE] p-6 sm:p-8 shadow-2xs space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-red-600 text-white text-[16px] font-black flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <h3 className="font-serif text-[21px] sm:text-[22px] font-black text-[#18181B]">
                  {item.title}
                </h3>
              </div>

              {/* Structure box */}
              <div className="bg-[#FEFCE8] rounded-2xl p-5 border border-amber-300/70 space-y-1">
                <span className="text-[14px] font-bold uppercase tracking-wider text-amber-900 block">
                  Cấu trúc ngữ pháp
                </span>
                <p className="text-[19px] font-bold text-[#18181B] font-mono">
                  {item.structure}
                </p>
              </div>

              {/* Explanation */}
              <p className="text-[19px] text-slate-700 leading-relaxed whitespace-pre-line">
                {item.explanation}
              </p>

              {/* Examples */}
              <div className="space-y-3 pt-2">
                <span className="text-[14px] font-bold text-red-700 uppercase tracking-wider block">
                  Ví dụ minh họa
                </span>
                <div className="space-y-3">
                  {item.examples.map((ex, exIdx) => (
                    <div
                      key={exIdx}
                      className="bg-[#FDFBF6] rounded-2xl p-4 sm:p-5 border border-[#E8DFCE] flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <p className="font-serif font-bold text-[#18181B] text-[21px]">{ex.hanzi}</p>
                        {showPinyin && (
                          <p className="text-[16px] font-mono text-red-700 font-semibold">{ex.pinyin}</p>
                        )}
                        <p className="text-[19px] text-slate-700">➔ {ex.translation}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePlayAudio(ex.hanzi, `gram-ex-${idx}-${exIdx}`)}
                        className="p-3 rounded-xl bg-white border border-[#E8DFCE] text-red-600 hover:bg-red-600 hover:text-white transition-colors shrink-0 cursor-pointer"
                        title="Nghe phát âm"
                        aria-label="Nghe ví dụ ngữ pháp"
                      >
                        <Volume2 className="w-6 h-6" />
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
          <div className="bg-gradient-to-br from-[#18181B] via-red-950 to-[#18181B] rounded-3xl p-6 sm:p-8 text-white border border-red-800/60 shadow-xl relative overflow-hidden">
            {/* Background ambient lighting */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-red-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Nhân vật A */}
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
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[13px] font-extrabold bg-red-600 text-white shadow-xs whitespace-nowrap animate-bounce">
                        Đang nói 🔊
                      </span>
                    )}
                </div>
                <div className="text-left">
                  <span className="px-2.5 py-0.5 rounded-md text-[12px] font-bold bg-red-950/80 text-red-200 border border-red-600/40 uppercase tracking-wider">
                    Nhân vật A
                  </span>
                  <h4 className="font-serif text-[18px] font-bold text-white mt-1">Tiểu Minh</h4>
                  <p className="text-[14px] text-stone-300">Học viên tiếng Trung</p>
                </div>
              </div>

              {/* Bộ Điều Khiển Trung Tâm */}
              <div className="flex flex-col items-center gap-3 text-center px-5 py-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
                <span className="text-[14px] font-bold text-amber-200">
                  {isAutoPlayingDialogue
                    ? `Đang phát câu ${activeDialogueIndex !== null ? activeDialogueIndex + 1 : 1} / ${lesson.dialogue.length}`
                    : 'Luyện nghe & phản xạ hội thoại'}
                </span>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handlePlayAllDialogue}
                    className={`px-5 py-3 rounded-xl font-bold text-[14px] flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                      isAutoPlayingDialogue
                        ? 'bg-red-500 hover:bg-red-600 text-white ring-2 ring-amber-300 animate-pulse'
                        : 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white'
                    }`}
                  >
                    {isAutoPlayingDialogue ? (
                      <>
                        <Pause className="w-5 h-5 fill-white" />
                        <span>Tạm dừng</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-white" />
                        <span>Phát toàn bộ bài thoại</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/15 text-[13px]">
                    <button
                      type="button"
                      onClick={() => setDialogueSpeed(0.85)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                        dialogueSpeed === 0.85 ? 'bg-red-600 text-white' : 'text-stone-300 hover:text-white'
                      }`}
                      title="Tốc độ 0.85x chuẩn sư phạm để nghe rõ âm điệu"
                    >
                      0.85x
                    </button>
                    <button
                      type="button"
                      onClick={() => setDialogueSpeed(1.0)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                        dialogueSpeed === 1.0 ? 'bg-red-600 text-white' : 'text-stone-300 hover:text-white'
                      }`}
                      title="Tốc độ 1.0x tự nhiên bản xứ"
                    >
                      1.0x
                    </button>
                  </div>
                </div>
              </div>

              {/* Nhân vật B */}
              <div className="flex items-center md:items-start gap-4 flex-row-reverse md:flex-row">
                <div className="text-right">
                  <span className="px-2.5 py-0.5 rounded-md text-[12px] font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30 uppercase tracking-wider">
                    Nhân vật B
                  </span>
                  <h4 className="font-serif text-[18px] font-bold text-white mt-1">Cô Mỹ Linh</h4>
                  <p className="text-[14px] text-amber-200/90">Giảng viên / Lão Sư</p>
                </div>
                <div className="relative">
                  <div
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-3xl sm:text-4xl shadow-lg border-2 transition-all duration-300 ${
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
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[13px] font-extrabold bg-amber-500 text-[#18181B] shadow-xs whitespace-nowrap animate-bounce">
                        Đang nói 🔊
                      </span>
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* Dòng Bong Bóng Hội Thoại */}
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
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0 shadow-md transition-all duration-300 ${
                      isSpeakerA
                        ? 'bg-gradient-to-tr from-zinc-800 to-zinc-950 text-white border border-[#E8DFCE]'
                        : 'bg-gradient-to-tr from-amber-600 to-red-600 text-white'
                    } ${isCurrentActive ? 'ring-4 ring-red-500 scale-110 animate-bounce' : 'opacity-95'}`}
                  >
                    {isSpeakerA ? '👦' : '👩‍🏫'}
                  </div>

                  <div
                    onClick={() => handlePlaySingleDialogue(line.chinese, idx)}
                    className={`relative max-w-2xl p-6 rounded-3xl transition-all duration-300 cursor-pointer shadow-xs hover:shadow-lg ${
                      isSpeakerA
                        ? 'bg-white border-2 border-[#E8DFCE] rounded-tl-xs text-left'
                        : 'bg-[#FAF7F0] border-2 border-red-200/80 rounded-tr-xs text-left'
                    } ${
                      isCurrentActive
                        ? isSpeakerA
                          ? 'border-red-600 ring-4 ring-red-200 bg-[#FFF5F3] shadow-xl scale-[1.015]'
                          : 'border-amber-600 ring-4 ring-amber-200 bg-[#FEFCE8] shadow-xl scale-[1.015]'
                        : 'hover:border-amber-500/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-[#EFE7D6]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[13px] font-bold ${
                            isSpeakerA
                              ? 'bg-[#FFF5F3] text-red-700 border border-red-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}
                        >
                          Lượt #{idx + 1} · {line.speaker}
                        </span>
                        {isCurrentActive && (
                          <span className="flex items-center gap-1 text-[13px] font-extrabold text-red-600 animate-pulse">
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
                        className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                          isCurrentActive
                            ? 'bg-red-600 text-white shadow-sm scale-105'
                            : 'bg-[#FAF7F0] text-[#18181B] hover:bg-red-600 hover:text-white'
                        }`}
                        title="Bấm để nghe phát âm câu này"
                        aria-label="Nghe câu thoại"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="font-serif text-[22px] sm:text-[26px] font-black text-[#18181B] tracking-wide mb-2 leading-relaxed">
                      {line.chinese}
                    </p>

                    {showPinyin && (
                      <p
                        className={`text-[16px] sm:text-[18px] font-mono font-bold mb-2.5 ${
                          isSpeakerA ? 'text-red-600' : 'text-amber-800'
                        }`}
                      >
                        {line.pinyin}
                      </p>
                    )}

                    <p className="text-[19px] font-semibold text-slate-700 pt-2.5 border-t border-[#EFE7D6] leading-relaxed">
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
          <div className="bg-white rounded-3xl border-2 border-[#E8DFCE] p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif font-black text-[#18181B] text-[21px] sm:text-[24px]">
                Luyện tập củng cố kiến thức
              </h3>
              <p className="text-[19px] text-slate-600">
                Trả lời câu hỏi trắc nghiệm để kiểm tra mức độ hiểu bài
              </p>
            </div>

            <div className="space-y-6">
              {lesson.practiceQuestions.map((q, idx) => {
                const selected = practiceAnswers[q.id];
                const isAnswered = selected !== undefined;
                const isCorrect = selected === q.correctAnswer;

                return (
                  <div key={q.id} className="p-6 rounded-3xl border border-[#E8DFCE] bg-[#FDFBF6] space-y-4">
                    <div className="flex flex-wrap items-start gap-3">
                      <span className="font-bold text-[14px] text-red-700 px-3 py-1 rounded-xl bg-[#FFF5F3] border border-red-200 shrink-0">
                        Câu {idx + 1}
                      </span>
                      <p className="font-serif font-bold text-[19px] sm:text-[21px] text-[#18181B] flex-1 leading-snug">
                        {q.question}
                      </p>
                    </div>

                    {q.pinyin && showPinyin && (
                      <p className="text-[16px] font-mono text-red-600 font-semibold">{q.pinyin}</p>
                    )}

                    {/* Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt, optIdx) => {
                        const isThisSelected = selected === optIdx;
                        const isThisCorrect = optIdx === q.correctAnswer;

                        let optClasses =
                          'border-[#E8DFCE] bg-white text-[#18181B] hover:bg-[#FFF9F6] hover:border-amber-500/70';
                        if (isAnswered) {
                          if (isThisCorrect) {
                            optClasses = 'border-emerald-500 bg-[#ECFDF5] text-emerald-900 font-bold';
                          } else if (isThisSelected) {
                            optClasses = 'border-red-500 bg-[#FFF5F3] text-red-900 font-bold';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={isAnswered}
                            onClick={() =>
                              setPracticeAnswers((prev) => ({
                                ...prev,
                                [q.id]: optIdx,
                              }))
                            }
                            className={`p-4 rounded-2xl border-2 text-left text-[16px] sm:text-[18px] font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer disabled:cursor-default ${optClasses}`}
                          >
                            <span>{opt}</span>
                            {isAnswered && isThisCorrect && (
                              <Check className="w-6 h-6 text-emerald-600 shrink-0" />
                            )}
                            {isAnswered && isThisSelected && !isThisCorrect && (
                              <X className="w-6 h-6 text-red-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {isAnswered && (
                      <div
                        className={`p-4 rounded-2xl text-[18px] sm:text-[19px] leading-relaxed border ${
                          isCorrect
                            ? 'bg-[#ECFDF5] text-emerald-900 border-emerald-300'
                            : 'bg-[#FEFCE8] text-amber-950 border-amber-300'
                        }`}
                      >
                        <span className="font-bold block mb-1">
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
      <div className="bg-[#FFF5F3] rounded-3xl border-2 border-red-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <h4 className="font-serif font-black text-[#18181B] text-[21px]">
            {isCompleted ? 'Bạn đã hoàn thành bài học này!' : 'Đã học xong nội dung bài học?'}
          </h4>
          <p className="text-[19px] text-slate-700 leading-relaxed">
            {isCompleted
              ? 'Tiếp tục luyện tập từ vựng hoặc chuyển sang bài học tiếp theo.'
              : 'Bấm nút hoàn thành để ghi nhận thời gian học tập và nhận điểm thưởng 50 XP.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {!isCompleted && (
            <button
              type="button"
              onClick={handleCompleteLesson}
              className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-[14px] sm:text-[16px] transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Hoàn thành bài học (+50 XP)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onBack}
            className="px-5 py-3 rounded-2xl border-2 border-[#E8DFCE] bg-white text-[#18181B] font-bold text-[14px] sm:text-[16px] hover:border-red-500 transition-colors cursor-pointer"
          >
            Bài tiếp theo ➔
          </button>
        </div>
      </div>
    </div>
  );
};

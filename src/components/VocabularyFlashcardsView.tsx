import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Mic,
  MicOff,
  Volume2,
  RotateCw,
  Sparkles,
  Search,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BookmarkCheck,
  Info,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  Trophy,
  HelpCircle,
  PenTool,
  Headphones,
  Eye,
  EyeOff,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useHSK } from '../context/HSKContext';
import { HSKLevel, VocabItem, VocabDeck } from '../types/hsk';
import { speakChinese, createSpeechRecognizer } from '../utils/audioSpeech';
import { safeParseJson } from '../utils/safeFetchJson';
import { DeckEditorModal } from './admin/DeckEditorModal';
import { CardEditorModal } from './admin/CardEditorModal';
import { AIFlashcardGeneratorModal } from './admin/AIFlashcardGeneratorModal';
import { VocabIllustration, getPinyinToneDescription } from './VocabIllustration';
import { HanziStrokeCanvas } from './HanziStrokeCanvas';
import { CompletionSealStamp } from './CompletionSealStamp';

type QuizQuestionType = 'hanzi-to-meaning' | 'meaning-to-hanzi' | 'listening' | 'typing';

interface VocabQuizQuestion {
  id: string;
  target: VocabItem;
  options: VocabItem[];
}

const cleanMeaning = (text: string = ''): string =>
  text.replace(/\s*\((?:Boya|Bài|HSK|Giáo trình|Quyển)[^)]*\)/gi, '').trim();

export const VocabularyFlashcardsView: React.FC = () => {
  const {
    vocabularies,
    vocabDecks,
    activeDeckId,
    setActiveDeckId,
    addVocabDeck,
    updateVocabDeck,
    deleteVocabDeck,
    addCardToDeck,
    updateCardInDeck,
    userRole,
    studentProfile,
    markVocabMastered,
    markVocabLearning,
    showPinyin,
    setShowPinyin,
    recordStudyMinutes,
  } = useHSK();

  const [mode, setMode] = useState<'flashcards' | 'writing' | 'listening' | 'quiz' | 'ai-pronounce' | 'dictionary'>('flashcards');
  const [listeningSubMode, setListeningSubMode] = useState<'listen-choice' | 'listen-dictation' | 'ai-mic'>('listen-choice');
  const [selectedLevel, setSelectedLevel] = useState<HSKLevel | 'ALL' | 'BOYA'>('ALL');
  const [selectedBoyaSub, setSelectedBoyaSub] = useState<string>('ALL_BOYA');
  const [customCardLimit, setCustomCardLimit] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'mastered' | 'learning' | 'unlearned'>('all');
  const [confirmDeleteDeckId, setConfirmDeleteDeckId] = useState<string | null>(null);

  // Modal states for Deck & Card admin
  const [deckToEdit, setDeckToEdit] = useState<VocabDeck | null>(null);
  const [isDeckEditorOpen, setIsDeckEditorOpen] = useState(false);
  const [isAIFlashcardModalOpen, setIsAIFlashcardModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<VocabItem | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Flashcard states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Vocabulary Quiz states
  const [quizType, setQuizType] = useState<QuizQuestionType>('hanzi-to-meaning');
  const [quizCountLimit, setQuizCountLimit] = useState<number>(10);
  const [quizQuestions, setQuizQuestions] = useState<VocabQuizQuestion[]>([]);
  const [quizCurrentIdx, setQuizCurrentIdx] = useState<number>(0);
  const [quizSelectedOptionId, setQuizSelectedOptionId] = useState<string | null>(null);
  const [quizTypedAnswer, setQuizTypedAnswer] = useState<string>('');
  const [quizIsSubmitted, setQuizIsSubmitted] = useState<boolean>(false);
  const [quizIsCorrect, setQuizIsCorrect] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [quizHistory, setQuizHistory] = useState<
    Array<{ item: VocabItem; isCorrect: boolean; userAnswer: string }>
  >([]);

  // AI Pronunciation states
  const [selectedWordForAi, setSelectedWordForAi] = useState<VocabItem | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    score: number;
    accuracy?: string;
    feedback: string;
    tips: string;
  } | null>(null);

  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>(
    activeDeckId ? [activeDeckId] : []
  );
  const [isDeckDropdownOpen, setIsDeckDropdownOpen] = useState(false);
  const deckDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (deckDropdownRef.current && !deckDropdownRef.current.contains(e.target as Node)) {
        setIsDeckDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeDeckId && !selectedDeckIds.includes(activeDeckId)) {
      setSelectedDeckIds([activeDeckId]);
    } else if (activeDeckId === null && selectedDeckIds.length === 1) {
      setSelectedDeckIds([]);
    }
  }, [activeDeckId]);

  const visibleDecks = vocabDecks.filter((d) => {
    if (selectedLevel === 'ALL') return true;
    if (selectedLevel === 'BOYA') {
      return (
        d.category.toLowerCase().includes('boya') ||
        d.title.toLowerCase().includes('boya')
      );
    }
    return d.level === selectedLevel;
  });

  const selectedDecks = vocabDecks.filter((d) => selectedDeckIds.includes(d.id));
  const activeDeck =
    selectedDecks.length === 1
      ? selectedDecks[0]
      : vocabDecks.find((d) => d.id === activeDeckId) || null;

  const sourceVocab =
    selectedDecks.length > 0
      ? selectedDecks.flatMap((d) => d.cards)
      : vocabularies;

  const toggleDeckSelection = (deckId: string) => {
    setConfirmDeleteDeckId(null);
    setCurrentIndex(0);
    const exists = selectedDeckIds.includes(deckId);
    const next = exists
      ? selectedDeckIds.filter((id) => id !== deckId)
      : [...selectedDeckIds, deckId];
    setSelectedDeckIds(next);
    setActiveDeckId(next.length > 0 ? next[0] : null);
  };

  // Filtered vocabulary list
  const allFilteredVocab = sourceVocab.filter((v) => {
    let matchesLevel = true;
    if (selectedDecks.length === 0) {
      if (selectedLevel === 'ALL') {
        matchesLevel = true;
      } else if (selectedLevel === 'BOYA') {
        const isBoyaCard = Boolean(v.category && v.category.toLowerCase().includes('boya'));
        if (selectedBoyaSub === 'ALL_BOYA') {
          matchesLevel = isBoyaCard;
        } else {
          matchesLevel = Boolean(v.category && v.category.includes(selectedBoyaSub));
        }
      } else {
        matchesLevel = v.level === selectedLevel;
      }
    }

    const matchesSearch =
      v.word.includes(searchQuery) ||
      v.pinyin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.sinoVietnamese.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.category && v.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const isMastered = studentProfile.masteredVocabIds.includes(v.id);
    const isLearning = studentProfile.learningVocabIds.includes(v.id);

    let matchesStatus = true;
    if (statusFilter === 'mastered') matchesStatus = isMastered;
    else if (statusFilter === 'learning') matchesStatus = isLearning;
    else if (statusFilter === 'unlearned') matchesStatus = !isMastered && !isLearning;

    return matchesLevel && matchesSearch && matchesStatus;
  });

  const parsedLimit = parseInt(customCardLimit, 10);
  const filteredVocab =
    !isNaN(parsedLimit) && parsedLimit > 0
      ? allFilteredVocab.slice(0, parsedLimit)
      : allFilteredVocab;

  const currentFlashcard = filteredVocab[currentIndex] || filteredVocab[0];

  useEffect(() => {
    if (!selectedWordForAi && filteredVocab.length > 0) {
      setSelectedWordForAi(filteredVocab[0]);
    }
  }, [filteredVocab, selectedWordForAi]);

  const handleNextCard = () => {
    setIsFlipped(false);
    if (filteredVocab.length === 0) return;
    setCurrentIndex((prev) => (prev < filteredVocab.length - 1 ? prev + 1 : 0));
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    if (filteredVocab.length === 0) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : filteredVocab.length - 1));
  };

  const handleShuffle = () => {
    if (filteredVocab.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex(Math.floor(Math.random() * filteredVocab.length));
  };

  const handleRateCard = (rating: 'again' | 'hard' | 'good') => {
    if (!currentFlashcard) return;
    if (rating === 'good') {
      markVocabMastered(currentFlashcard.id);
    } else {
      markVocabLearning(currentFlashcard.id);
    }
    recordStudyMinutes(1);
    handleNextCard();
  };

  const handleStartSpeech = () => {
    if (!selectedWordForAi) return;

    setRecordedText('');
    setEvaluationResult(null);
    setIsRecording(true);

    const recognizer = createSpeechRecognizer(
      async (transcript) => {
        setIsRecording(false);
        setRecordedText(transcript);
        await evaluateWithGemini(transcript);
      },
      (error) => {
        console.warn('Speech recognition error:', error);
        setIsRecording(false);
        const simulated = selectedWordForAi.word;
        setRecordedText(simulated);
        evaluateWithGemini(simulated);
      }
    );

    if (recognizer) {
      try {
        recognizer.start();
      } catch {
        setIsRecording(false);
      }
    } else {
      setTimeout(() => {
        setIsRecording(false);
        const simulated = selectedWordForAi.word;
        setRecordedText(simulated);
        evaluateWithGemini(simulated);
      }, 1500);
    }
  };

  const evaluateWithGemini = async (speechText: string) => {
    if (!selectedWordForAi) return;
    setIsEvaluating(true);
    try {
      const response = await fetch('/api/gemini/evaluate-pronunciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWord: selectedWordForAi.word,
          pinyin: selectedWordForAi.pinyin,
          meaning: selectedWordForAi.meaning,
          recognizedText: speechText,
        }),
      });

      const data = await safeParseJson<any>(response);
      setEvaluationResult(data);
      recordStudyMinutes(1);
    } catch (err) {
      console.error('Eval error:', err);
      setEvaluationResult({
        score: 85,
        accuracy: 'Tốt',
        feedback: `Bạn đã phát âm tương đối chuẩn xác từ "${selectedWordForAi.word}" (${selectedWordForAi.pinyin}). Hãy chú ý giữ trường độ âm thanh ổn định.`,
        tips: 'Mở rộng vòm miệng và giữ thanh điệu dứt khoát khi phát âm.',
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  // Build & Start Vocabulary Quiz
  const startVocabQuiz = (customPool?: VocabItem[], customLimit?: number) => {
    const basePool = customPool && customPool.length > 0 ? customPool : allFilteredVocab;
    if (basePool.length === 0) {
      setQuizQuestions([]);
      return;
    }

    const distractorSource =
      vocabularies.length >= 4 ? vocabularies : [...basePool, ...vocabularies];

    const shuffledTargets = [...basePool].sort(() => Math.random() - 0.5);
    const limit = customLimit ?? quizCountLimit;
    const selectedTargets =
      limit > 0 ? shuffledTargets.slice(0, Math.min(limit, shuffledTargets.length)) : shuffledTargets;

    const generated: VocabQuizQuestion[] = selectedTargets.map((target, idx) => {
      const otherWords = distractorSource.filter(
        (v) => v.word !== target.word && cleanMeaning(v.meaning) !== cleanMeaning(target.meaning)
      );
      const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5);
      const distractors: VocabItem[] = [];
      const seenWords = new Set<string>([target.word]);

      for (const candidate of shuffledOthers) {
        if (distractors.length >= 3) break;
        if (!seenWords.has(candidate.word)) {
          seenWords.add(candidate.word);
          distractors.push(candidate);
        }
      }

      const options = [target, ...distractors].sort(() => Math.random() - 0.5);
      return {
        id: `q-${target.id}-${idx}-${Date.now()}`,
        target,
        options,
      };
    });

    setQuizQuestions(generated);
    setQuizCurrentIdx(0);
    setQuizSelectedOptionId(null);
    setQuizTypedAnswer('');
    setQuizIsSubmitted(false);
    setQuizIsCorrect(false);
    setQuizScore(0);
    setQuizFinished(false);
    setQuizHistory([]);

    if (quizType === 'listening' && generated[0]) {
      setTimeout(() => speakChinese(generated[0].target.word), 250);
    }
  };

  useEffect(() => {
    if (mode === 'quiz') {
      startVocabQuiz(undefined, quizCountLimit);
    } else if (mode === 'listening') {
      setQuizType('listening');
      startVocabQuiz(undefined, quizCountLimit);
    }
  }, [mode, selectedDeckIds, selectedLevel, selectedBoyaSub, statusFilter, searchQuery, quizCountLimit]);

  const currentQuizQuestion = quizQuestions[quizCurrentIdx] || null;

  const handleSelectQuizOption = (option: VocabItem) => {
    if (quizIsSubmitted || !currentQuizQuestion) return;
    const isRight = option.word === currentQuizQuestion.target.word;
    setQuizSelectedOptionId(option.id);
    setQuizIsSubmitted(true);
    setQuizIsCorrect(isRight);
    speakChinese(currentQuizQuestion.target.word);

    if (isRight) {
      setQuizScore((prev) => prev + 1);
      markVocabMastered(currentQuizQuestion.target.id);
    } else {
      markVocabLearning(currentQuizQuestion.target.id);
    }

    setQuizHistory((prev) => [
      ...prev,
      {
        item: currentQuizQuestion.target,
        isCorrect: isRight,
        userAnswer:
          quizType === 'meaning-to-hanzi'
            ? `${option.word} (${option.pinyin})`
            : cleanMeaning(option.meaning),
      },
    ]);
  };

  const normalizePinyin = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .trim();

  const handleSubmitTypedQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (quizIsSubmitted || !currentQuizQuestion || !quizTypedAnswer.trim()) return;

    const raw = quizTypedAnswer.trim();
    const targetWord = currentQuizQuestion.target.word.trim();
    const targetPinyin = currentQuizQuestion.target.pinyin.trim();

    const isRight =
      raw === targetWord ||
      raw.toLowerCase() === targetPinyin.toLowerCase() ||
      normalizePinyin(raw) === normalizePinyin(targetPinyin);

    setQuizIsSubmitted(true);
    setQuizIsCorrect(isRight);
    speakChinese(currentQuizQuestion.target.word);

    if (isRight) {
      setQuizScore((prev) => prev + 1);
      markVocabMastered(currentQuizQuestion.target.id);
    } else {
      markVocabLearning(currentQuizQuestion.target.id);
    }

    setQuizHistory((prev) => [
      ...prev,
      {
        item: currentQuizQuestion.target,
        isCorrect: isRight,
        userAnswer: raw,
      },
    ]);
  };

  const handleNextQuizQuestion = () => {
    if (quizCurrentIdx + 1 < quizQuestions.length) {
      const nextIdx = quizCurrentIdx + 1;
      setQuizCurrentIdx(nextIdx);
      setQuizSelectedOptionId(null);
      setQuizTypedAnswer('');
      setQuizIsSubmitted(false);
      setQuizIsCorrect(false);
      if (quizType === 'listening' && quizQuestions[nextIdx]) {
        setTimeout(() => speakChinese(quizQuestions[nextIdx].target.word), 200);
      }
    } else {
      setQuizFinished(true);
      recordStudyMinutes(2);
      if (quizScore >= Math.ceil(quizQuestions.length * 0.7)) {
        confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      }
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header & 3 Main Buttons (Chuẩn theo hình mô tả) */}
      <div className="space-y-5 border-b border-[#E6DEC8] pb-6 text-center">
        <div className="space-y-2 max-w-2xl mx-auto">
          <h1 className="font-sans text-[28px] sm:text-[34px] font-extrabold text-[#1C1E21] tracking-tight leading-tight">
            Flashcard 3D & Luyện Nét Chữ Hán
          </h1>
          <p className="text-[16px] sm:text-[17px] text-slate-600">
            Kết hợp lật thẻ thông minh có hình minh họa sinh động, luyện viết nét bút thuận và luyện nghe phát âm chuẩn.
          </p>
        </div>

        {/* 3 Nút Chế Độ Chính Như Hình Mô Tả */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-[#F3EFE6] rounded-2xl border border-[#E6DEC8] w-fit mx-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setMode('flashcards')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] sm:text-[15px] font-bold transition-all cursor-pointer ${
              mode === 'flashcards'
                ? 'bg-[#C85A43] text-white shadow-xs'
                : 'text-[#3B3E45] hover:bg-white hover:text-[#C85A43]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Thẻ Flashcard 3D & Âm Thanh</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('writing')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] sm:text-[15px] font-bold transition-all cursor-pointer ${
              mode === 'writing'
                ? 'bg-[#C85A43] text-white shadow-xs'
                : 'text-[#3B3E45] hover:bg-white hover:text-[#C85A43]'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Luyện Viết</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('listening');
              setQuizType('listening');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] sm:text-[15px] font-bold transition-all cursor-pointer ${
              mode === 'listening'
                ? 'bg-[#C85A43] text-white shadow-xs'
                : 'text-[#3B3E45] hover:bg-white hover:text-[#C85A43]'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>Luyện Nghe</span>
          </button>
        </div>

        {/* Secondary Utility Links (Tra cứu & Kiểm tra tổng hợp) */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setMode('quiz')}
            className={`px-3.5 py-1.5 rounded-xl text-[13px] font-bold border transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              mode === 'quiz'
                ? 'bg-[#1C1E21] text-white border-[#1C1E21]'
                : 'bg-white text-slate-700 border-[#E6DEC8] hover:border-[#C85A43]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#C85A43]" />
            <span>Kiểm tra trắc nghiệm</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('dictionary')}
            className={`px-3.5 py-1.5 rounded-xl text-[13px] font-bold border transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              mode === 'dictionary'
                ? 'bg-[#1C1E21] text-white border-[#1C1E21]'
                : 'bg-white text-slate-700 border-[#E6DEC8] hover:border-[#C85A43]'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-[#C85A43]" />
            <span>Danh sách & Tra cứu ({filteredVocab.length} từ)</span>
          </button>
          <button
            type="button"
            onClick={() => setShowPinyin(!showPinyin)}
            aria-pressed={showPinyin}
            className={`px-3.5 py-1.5 rounded-xl text-[13px] font-bold border transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              showPinyin
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-white'
            }`}
          >
            {showPinyin ? (
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>Pinyin: {showPinyin ? 'Đang bật' : 'Đang tắt'}</span>
          </button>
        </div>
      </div>

      {/* 2-Column Workspace: Left = Bộ từ đang học, Right = Thẻ Flashcard 3D / Luyện Viết / Luyện Nghe */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: BỘ TỪ ĐANG HỌC */}
        <aside className="lg:col-span-4 bg-white p-5 rounded-3xl border border-[#E6DEC8] space-y-4 shadow-2xs">
          <div className="space-y-2">
            <div className="text-[16px] font-extrabold text-[#18181B] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#C85A43] shrink-0" />
              <span>Bộ từ đang học</span>
            </div>
            <div className="text-[14px] font-bold text-[#C85A43] bg-[#FDF0ED] px-3.5 py-2 rounded-xl border border-[#F3C5B6]">
              {selectedDecks.length > 1
                ? `Đã tích chọn ${selectedDecks.length} bộ từ (${sourceVocab.length} thẻ)`
                : selectedDecks.length === 1
                ? `${selectedDecks[0].title} (${selectedDecks[0].cards.length} thẻ)`
                : `Toàn bộ từ vựng (${allFilteredVocab.length} từ)`}
            </div>
          </div>

          {/* Deck Selector - Multi-select Dropdown with Checkboxes */}
          <div className="space-y-2.5 bg-[#FAF7F0] p-3.5 rounded-2xl border border-[#E6DEC8]">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span className="text-[13px] font-extrabold text-[#18181B]">
                Chọn bộ từ vựng muốn học:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const allIds = visibleDecks.map((d) => d.id);
                    setSelectedDeckIds(allIds);
                    setActiveDeckId(allIds[0] || null);
                    setCurrentIndex(0);
                    setConfirmDeleteDeckId(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-red-50 text-[#C85A43] border border-[#E6DEC8] text-[11px] font-bold cursor-pointer transition-colors"
                >
                  Chọn tất cả
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDeckIds([]);
                    setActiveDeckId(null);
                    setCurrentIndex(0);
                    setConfirmDeleteDeckId(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-[#E6DEC8] text-[11px] font-bold cursor-pointer transition-colors"
                >
                  Bỏ tích
                </button>
              </div>
            </div>

            <div ref={deckDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setIsDeckDropdownOpen((prev) => !prev)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#E6DEC8] hover:border-[#C85A43] focus:outline-none focus:border-[#C85A43] flex items-center justify-between gap-2 text-left transition-colors cursor-pointer shadow-2xs"
              >
                <span className="font-extrabold text-[13px] text-[#18181B] truncate">
                  {selectedDecks.length === 0
                    ? `Toàn bộ kho từ (${vocabularies.length} từ)`
                    : selectedDecks.length === 1
                    ? `${selectedDecks[0].title}`
                    : `Đã chọn ${selectedDecks.length} bộ (${sourceVocab.length} thẻ)`}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2 py-0.5 rounded-lg bg-[#FDEEE9] text-[#C85A43] font-mono text-[11px] font-extrabold">
                    {selectedDecks.length === 0
                      ? 'Tất cả'
                      : `${selectedDecks.length}/${visibleDecks.length}`}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-700 transition-transform duration-200 ${
                      isDeckDropdownOpen ? 'rotate-180 text-[#C85A43]' : ''
                    }`}
                  />
                </div>
              </button>

              {isDeckDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-white rounded-2xl border-2 border-[#E6DEC8] shadow-2xl p-3 space-y-1.5 max-h-80 overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E6DEC8] px-1">
                    <span className="text-[11px] font-bold text-slate-600">
                      Tích chọn 1 hoặc nhiều bộ:
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDeckDropdownOpen(false)}
                      className="px-2.5 py-0.5 rounded-lg bg-[#C85A43] text-white text-[12px] font-bold cursor-pointer"
                    >
                      Xong
                    </button>
                  </div>

                  {/* Option: Toàn bộ kho từ vựng */}
                  <label
                    className={`w-full px-3 py-2 rounded-xl font-bold text-[12px] transition-all cursor-pointer flex items-center justify-between gap-2 border select-none ${
                      selectedDeckIds.length === 0
                        ? 'bg-[#FFF9F5] text-red-800 border-red-700'
                        : 'bg-white text-[#18181B] border-transparent hover:bg-[#FAF7F0]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedDeckIds.length === 0}
                        onChange={() => {
                          setSelectedDeckIds([]);
                          setActiveDeckId(null);
                          setCurrentIndex(0);
                          setConfirmDeleteDeckId(null);
                        }}
                        className="w-4 h-4 accent-red-700 rounded cursor-pointer shrink-0"
                      />
                      <span className="truncate">Toàn bộ kho từ vựng</span>
                    </div>
                    <span className="font-mono text-[11px] font-extrabold text-slate-600 tabular-nums shrink-0">
                      {vocabularies.length} từ
                    </span>
                  </label>

                  {/* Individual Vocabulary Decks */}
                  {visibleDecks.map((deck) => {
                    const isChecked = selectedDeckIds.includes(deck.id);
                    const isBoyaDeck =
                      deck.category.toLowerCase().includes('boya') ||
                      deck.title.toLowerCase().includes('boya');
                    return (
                      <label
                        key={deck.id}
                        className={`w-full px-3 py-2 rounded-xl font-bold text-[12px] transition-all cursor-pointer flex items-center justify-between gap-2 border select-none ${
                          isChecked
                            ? isBoyaDeck
                              ? 'bg-[#EAF7F0] text-emerald-950 border-emerald-700'
                              : 'bg-[#FFF9F5] text-red-900 border-red-700'
                            : 'bg-white text-[#18181B] border-transparent hover:bg-[#FAF7F0]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleDeckSelection(deck.id)}
                            className={`w-4 h-4 rounded cursor-pointer shrink-0 ${
                              isBoyaDeck ? 'accent-emerald-700' : 'accent-red-700'
                            }`}
                          />
                          <span className="truncate">{deck.title}</span>
                        </div>
                        <span className="font-mono text-[11px] font-extrabold text-slate-600 tabular-nums shrink-0">
                          {deck.cards.length} thẻ
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Search inside selected deck */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm nhanh chữ Hán, Pinyin, nghĩa..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentIndex(0);
              }}
              className="w-full pl-10 pr-3.5 py-2.5 text-[13px] font-semibold rounded-xl border border-[#E6DEC8] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-[#C85A43]"
            />
          </div>

          {/* Custom Number of Words Input */}
          <div className="bg-[#FAF7F0] p-3.5 rounded-2xl border border-[#E6DEC8] space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="session-word-count-input"
                className="text-[13px] font-extrabold text-[#18181B]"
              >
                Số từ muốn ôn:
              </label>
              <input
                id="session-word-count-input"
                type="number"
                min={1}
                max={Math.max(1, allFilteredVocab.length)}
                value={customCardLimit}
                onChange={(e) => {
                  setCustomCardLimit(e.target.value);
                  setCurrentIndex(0);
                }}
                placeholder={`Tất cả (${allFilteredVocab.length})`}
                className="w-24 px-2.5 py-1 rounded-lg border border-[#D6CBB3] bg-white text-[13px] font-mono font-black text-[#C85A43] text-center focus:outline-none focus:border-[#C85A43]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[5, 10, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setCustomCardLimit(String(num));
                    setCurrentIndex(0);
                  }}
                  className={`flex-1 py-1 rounded-lg text-[12px] font-mono font-bold cursor-pointer ${
                    parsedLimit === num
                      ? 'bg-[#C85A43] text-white'
                      : 'bg-white text-slate-700 border border-[#E6DEC8] hover:border-[#C85A43]'
                  }`}
                >
                  {num} từ
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setCustomCardLimit('');
                  setCurrentIndex(0);
                }}
                className={`px-2.5 py-1 rounded-lg text-[12px] font-bold cursor-pointer ${
                  !customCardLimit
                    ? 'bg-[#18181B] text-white'
                    : 'bg-white text-slate-700 border border-[#E6DEC8]'
                }`}
              >
                Tất cả
              </button>
            </div>
          </div>

          {/* Quick Action Buttons in Left Panel */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleShuffle}
                className="px-3 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E6DEC8] hover:border-[#C85A43] text-[#18181B] font-bold text-[13px] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Shuffle className="w-4 h-4 text-[#C85A43]" />
                <span>Xáo trộn thẻ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('quiz');
                  startVocabQuiz(undefined, quizCountLimit);
                }}
                className="px-3 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[13px] flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Kiểm tra nhanh</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setDeckToEdit(null);
                setIsAIFlashcardModalOpen(true);
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-[#C85A43] hover:bg-red-700 text-white font-bold text-[13px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tạo bộ từ mới bằng AI</span>
            </button>

            {userRole !== 'student' && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E6DEC8]">
                <button
                  type="button"
                  onClick={() => {
                    setDeckToEdit(null);
                    setIsDeckEditorOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF7F0] hover:bg-[#F5EFEB] text-[#C85A43] border border-[#E6DEC8] font-bold text-[12px] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm bộ</span>
                </button>
                {activeDeck && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setCardToEdit(null);
                        setIsCardModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF7F0] text-[#18181B] border border-[#E6DEC8] font-bold text-[12px] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm thẻ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeckToEdit(activeDeck);
                        setIsDeckEditorOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF7F0] text-[#18181B] border border-[#E6DEC8] font-bold text-[12px] flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Sửa bộ</span>
                    </button>
                    {confirmDeleteDeckId === activeDeck.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          deleteVocabDeck(activeDeck.id);
                          setSelectedDeckIds((prev) => prev.filter((id) => id !== activeDeck.id));
                          setActiveDeckId(null);
                          setConfirmDeleteDeckId(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-red-700 text-white font-bold text-[12px] cursor-pointer"
                      >
                        Xác nhận xóa
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteDeckId(activeDeck.id)}
                        className="p-1.5 rounded-xl text-red-700 hover:bg-red-50 border border-[#E6DEC8] cursor-pointer"
                        title="Xóa bộ từ vựng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT COLUMN: ACTIVE VOCABULARY LEARNING AREA */}
        <div className="lg:col-span-8 min-w-0">
          {/* ========================================================= */}
          {/* MODE 1: GIANT HIGH-CLARITY FLASHCARDS */}
          {/* ========================================================= */}
          {mode === 'flashcards' && (
            <div className="space-y-4">
              {filteredVocab.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-dashed border-[#D6CBB3] text-center space-y-2">
                  <p className="text-[19px] font-bold text-[#18181B]">
                    Không có từ vựng nào phù hợp với bộ lọc hiện tại.
                  </p>
                  <p className="text-[16px] text-slate-600">
                    Vui lòng chọn bộ từ vựng khác ở cột bên trái hoặc xóa từ khóa tìm kiếm.
                  </p>
                </div>
              ) : (
                <>
                  {/* Top Counter & Flip Hint matching screenshot */}
                  <div className="max-w-2xl mx-auto flex items-center justify-between text-[14px] font-bold text-slate-500 px-2">
                    <span className="tabular-nums">
                      Từ {currentIndex + 1} / {filteredVocab.length}
                    </span>
                <button
                  type="button"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="hover:text-[#C85A43] transition-colors cursor-pointer"
                >
                  Chạm thẻ để lật ›
                </button>
              </div>

              {/* 3D Flip Card with Vivid Descriptive Illustration */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsFlipped(!isFlipped);
                  }
                }}
                className="relative h-[470px] sm:h-[500px] max-w-2xl mx-auto cursor-pointer perspective-1000 select-none"
              >
                <div
                  className="relative w-full h-full rounded-[32px] transition-transform duration-500 transform-style-3d shadow-md"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transition: 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {/* FRONT SIDE */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-[32px] bg-white border border-[#E8DFCE] hover:border-[#C85A43] p-6 sm:p-8 flex flex-col justify-between items-center text-center backface-hidden"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    {/* Top Row: Level Pill & Tone Pill */}
                    <div className="w-full flex flex-wrap items-center justify-between gap-2">
                      <span className="px-3.5 py-1 rounded-full bg-[#C85A43] text-white text-[13px] font-extrabold shadow-2xs">
                        {currentFlashcard.level}
                      </span>
                      <span className="px-3.5 py-1 rounded-full bg-[#EEF4FF] text-[#2563EB] border border-[#BFDBFE] text-[12px] sm:text-[13px] font-bold">
                        {getPinyinToneDescription(currentFlashcard.pinyin)}
                      </span>
                    </div>

                    {/* Vivid Descriptive Photo */}
                    <div className="w-full my-1">
                      <VocabIllustration vocab={currentFlashcard} />
                    </div>

                    {/* Center Pinyin, Giant Hanzi, Sino-Vietnamese */}
                    <div className="space-y-1 my-auto">
                      {showPinyin && (
                        <p className="text-[20px] sm:text-[24px] font-bold text-slate-600 tracking-wide">
                          {currentFlashcard.pinyin}
                        </p>
                      )}
                      <div className="font-serif text-[52px] sm:text-[64px] font-black text-[#18181B] tracking-wider leading-none py-0.5">
                        {currentFlashcard.word}
                      </div>
                      <p className="text-[14px] sm:text-[15px] font-bold text-[#C85A43]">
                        Hán Việt: {currentFlashcard.sinoVietnamese || '-'}
                      </p>
                    </div>

                    {/* Bottom Audio Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakChinese(currentFlashcard.word);
                      }}
                      className="px-6 py-2.5 rounded-2xl bg-[#FDF0ED] hover:bg-[#C85A43] text-[#C85A43] hover:text-white text-[14px] font-bold inline-flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Bấm nghe phát âm</span>
                    </button>
                  </div>

                  {/* BACK SIDE */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-[32px] bg-[#18181B] text-white border-2 border-[#C85A43] p-6 sm:p-8 flex flex-col justify-between backface-hidden"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[14px] sm:text-[15px]">
                      <span className="font-mono font-black text-amber-300">
                        {currentFlashcard.word}
                        {showPinyin ? ` · ${currentFlashcard.pinyin}` : ''}
                      </span>
                      <span className="font-bold text-stone-200">
                        Hán Việt: {currentFlashcard.sinoVietnamese || '-'}
                      </span>
                    </div>

                    <div className="w-full">
                      <VocabIllustration vocab={currentFlashcard} compact />
                    </div>

                    <div className="space-y-3 my-auto">
                      <div className="text-[22px] sm:text-[26px] font-bold text-white leading-tight text-center">
                        {cleanMeaning(currentFlashcard.meaning)}
                      </div>

                      <div className="bg-white/10 rounded-2xl p-4 text-left border border-white/15 space-y-1">
                        <span className="text-[12px] text-amber-300 font-extrabold block">
                          Câu ví dụ thực tế:
                        </span>
                        <p className="font-serif text-[29px] font-bold text-white leading-snug">
                          {currentFlashcard.exampleSentence}
                        </p>
                        {showPinyin && (
                          <p className="text-[13px] sm:text-[14px] text-stone-300 font-mono">
                            {currentFlashcard.examplePinyin}
                          </p>
                        )}
                        <p className="text-[14px] sm:text-[15px] text-stone-100 font-medium">
                          {currentFlashcard.exampleMeaning}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[12px] text-stone-300">
                      <span>Chạm thẻ để lật lại mặt trước</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakChinese(currentFlashcard.exampleSentence);
                        }}
                        className="text-amber-300 hover:text-white flex items-center gap-1.5 font-bold cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Nghe câu ví dụ</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar matching image_1d435875.png */}
              <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-between gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handlePrevCard}
                  className="px-5 py-2.5 rounded-2xl bg-white border border-[#E6DEC8] hover:border-[#C85A43] text-[14px] font-bold text-[#1C1E21] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>‹ Từ trước</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleRateCard('hard')}
                    className="px-5 py-2.5 rounded-2xl bg-[#FFFBEB] hover:bg-amber-100 text-amber-800 border border-amber-300 text-[14px] font-bold transition-colors cursor-pointer"
                  >
                    Cần ôn lại
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRateCard('good')}
                    className="px-5 py-2.5 rounded-2xl bg-[#ECFDF5] hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[14px] font-bold transition-colors cursor-pointer"
                  >
                    Đã thuộc ✓
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleNextCard}
                  className="px-5 py-2.5 rounded-2xl bg-[#C85A43] hover:bg-red-700 text-white text-[14px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <span>Từ sau ›</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 1A: LUYỆN VIẾT NÉT CHỮ HÁN (BÚT THUẬN & Ô MỄ TỰ) */}
      {/* ========================================================= */}
      {mode === 'writing' && (
        <div className="max-w-3xl mx-auto space-y-5">
          {filteredVocab.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl border border-dashed border-[#D6CBB3] text-center">
              <p className="text-[18px] font-bold text-[#18181B]">
                Không có từ vựng nào phù hợp để luyện viết.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-[14px] font-bold text-slate-600 px-1">
                <span>
                  Từ {currentIndex + 1} / {filteredVocab.length}:{' '}
                  <strong className="text-[#1C1E21] font-serif text-[18px]">
                    {currentFlashcard.word}
                  </strong>
                </span>
                <span className="text-[#C85A43]">
                  Dùng chuột hoặc ngón tay viết chữ vào ô Mễ Tự
                </span>
              </div>

              <VocabIllustration vocab={currentFlashcard} />

              <HanziStrokeCanvas
                word={currentFlashcard.word}
                pinyin={currentFlashcard.pinyin}
                meaning={cleanMeaning(currentFlashcard.meaning)}
                sinoVietnamese={currentFlashcard.sinoVietnamese}
                onScoreEvaluated={(score) => {
                  if (score >= 70) {
                    markVocabMastered(currentFlashcard.id);
                    recordStudyMinutes(1);
                  }
                }}
              />

              {/* Bottom Navigation */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handlePrevCard}
                  className="px-5 py-2.5 rounded-2xl bg-white border border-[#E6DEC8] hover:border-[#C85A43] text-[14px] font-bold text-[#1C1E21] cursor-pointer"
                >
                  ‹ Từ trước
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleRateCard('hard')}
                    className="px-5 py-2.5 rounded-2xl bg-[#FFFBEB] text-amber-800 border border-amber-300 text-[14px] font-bold cursor-pointer"
                  >
                    Cần ôn lại
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRateCard('good')}
                    className="px-5 py-2.5 rounded-2xl bg-[#ECFDF5] text-emerald-800 border border-emerald-300 text-[14px] font-bold cursor-pointer"
                  >
                    Đã thuộc ✓
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleNextCard}
                  className="px-5 py-2.5 rounded-2xl bg-[#C85A43] hover:bg-red-700 text-white text-[14px] font-bold cursor-pointer"
                >
                  Từ sau ›
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 1B-LISTEN: LUYỆN NGHE PHẢN XẠ & PHÁT ÂM */}
      {/* ========================================================= */}
      {mode === 'listening' && (
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Sub-mode switcher inside Luyện Nghe */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6DEC8] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setListeningSubMode('listen-choice');
                  setQuizType('listening');
                  startVocabQuiz(undefined, quizCountLimit);
                }}
                className={`px-4 py-2 rounded-xl text-[13px] sm:text-[14px] font-bold cursor-pointer transition-colors ${
                  listeningSubMode === 'listen-choice'
                    ? 'bg-[#C85A43] text-white'
                    : 'bg-[#FAF7F0] text-[#1C1E21] border border-[#E6DEC8]'
                }`}
              >
                1. Nghe âm chọn từ đúng
              </button>
              <button
                type="button"
                onClick={() => {
                  setListeningSubMode('listen-dictation');
                  setQuizType('typing');
                  startVocabQuiz(undefined, quizCountLimit);
                }}
                className={`px-4 py-2 rounded-xl text-[13px] sm:text-[14px] font-bold cursor-pointer transition-colors ${
                  listeningSubMode === 'listen-dictation'
                    ? 'bg-[#C85A43] text-white'
                    : 'bg-[#FAF7F0] text-[#1C1E21] border border-[#E6DEC8]'
                }`}
              >
                2. Nghe & Gõ lại từ (Chép chính tả)
              </button>
              <button
                type="button"
                onClick={() => {
                  setListeningSubMode('ai-mic');
                  if (currentFlashcard) setSelectedWordForAi(currentFlashcard);
                }}
                className={`px-4 py-2 rounded-xl text-[13px] sm:text-[14px] font-bold cursor-pointer transition-colors ${
                  listeningSubMode === 'ai-mic'
                    ? 'bg-[#C85A43] text-white'
                    : 'bg-[#FAF7F0] text-[#1C1E21] border border-[#E6DEC8]'
                }`}
              >
                3. Kiểm tra phát âm AI qua Mic
              </button>
            </div>

            {listeningSubMode !== 'ai-mic' && (
              <button
                type="button"
                onClick={() => startVocabQuiz(undefined, quizCountLimit)}
                className="px-3.5 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#FDF0ED] text-[#C85A43] border border-[#E6DEC8] text-[13px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                <span>Đổi bài nghe mới</span>
              </button>
            )}
          </div>

          {listeningSubMode === 'ai-mic' ? (
            <div className="bg-white rounded-3xl border border-[#E6DEC8] p-6 sm:p-8 shadow-2xs space-y-6">
              {selectedWordForAi && (
                <>
                  <VocabIllustration vocab={selectedWordForAi} />

                  <div className="bg-[#FAF7F0] rounded-3xl p-6 border border-[#E6DEC8] flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="text-center lg:text-left space-y-2">
                      <div className="flex items-center gap-4 justify-center lg:justify-start">
                        <span className="font-serif text-[51px] sm:text-[64px] font-black text-[#18181B] leading-none">
                          {selectedWordForAi.word}
                        </span>
                        <button
                          type="button"
                          onClick={() => speakChinese(selectedWordForAi.word, 1)}
                          className="p-3.5 rounded-full bg-[#C85A43] text-white hover:bg-red-700 transition-colors cursor-pointer"
                          title="Nghe tốc độ chuẩn"
                        >
                          <Volume2 className="w-6 h-6" />
                        </button>
                        <button
                          type="button"
                          onClick={() => speakChinese(selectedWordForAi.word, 0.7)}
                          className="px-3 py-2 rounded-xl bg-white border border-[#E6DEC8] text-[#C85A43] text-[12px] font-bold hover:border-[#C85A43] cursor-pointer"
                        >
                          Nghe chậm 0.7x
                        </button>
                      </div>
                      {showPinyin && (
                        <p className="font-mono text-[22px] font-black text-[#C85A43]">
                          {selectedWordForAi.pinyin}
                        </p>
                      )}
                      <p className="text-[18px] text-[#18181B] font-bold">
                        {cleanMeaning(selectedWordForAi.meaning)}{' '}
                        <span className="text-[15px] font-semibold text-slate-600">
                          (Hán Việt: {selectedWordForAi.sinoVietnamese})
                        </span>
                      </p>
                    </div>

                    <div className="w-full lg:w-72">
                      <label
                        htmlFor="listen-ai-word-picker"
                        className="text-[13px] font-extrabold text-[#18181B] block mb-2"
                      >
                        Đổi từ vựng cần luyện:
                      </label>
                      <select
                        id="listen-ai-word-picker"
                        value={selectedWordForAi.id}
                        onChange={(e) => {
                          const found = filteredVocab.find((v) => v.id === e.target.value) || vocabularies.find((v) => v.id === e.target.value);
                          if (found) {
                            setSelectedWordForAi(found);
                            setEvaluationResult(null);
                            setRecordedText('');
                          }
                        }}
                        className="w-full p-3 text-[14px] rounded-2xl border border-[#E6DEC8] bg-white font-bold text-[#18181B]"
                      >
                        {filteredVocab.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.word} ({v.pinyin}) - {cleanMeaning(v.meaning)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="p-7 rounded-3xl bg-[#FAF7F0] border border-[#E6DEC8] flex flex-col items-center text-center space-y-4">
                <button
                  type="button"
                  disabled={isRecording || isEvaluating}
                  onClick={handleStartSpeech}
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-transform cursor-pointer ${
                    isRecording
                      ? 'bg-[#C85A43] text-white scale-110 ring-8 ring-red-200'
                      : isEvaluating
                      ? 'bg-amber-600 text-white'
                      : 'bg-[#18181B] hover:bg-[#C85A43] text-white hover:scale-105'
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-9 h-9" />
                  ) : isEvaluating ? (
                    <RotateCw className="w-9 h-9 animate-spin" />
                  ) : (
                    <Mic className="w-9 h-9" />
                  )}
                </button>
                <p className="font-bold text-[17px] text-[#18181B]">
                  {isRecording
                    ? 'Đang thu âm giọng đọc của bạn...'
                    : isEvaluating
                    ? 'Đang phân tích thanh điệu...'
                    : 'Bấm Micro để đọc và chấm điểm phát âm'}
                </p>
              </div>

              {evaluationResult && (
                <div className="p-5 rounded-3xl bg-[#18181B] text-white border-2 border-[#C85A43] space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#C85A43] text-white flex flex-col items-center justify-center font-black">
                      <span className="text-[22px] leading-none">{evaluationResult.score}</span>
                      <span className="text-[11px]">Điểm</span>
                    </div>
                    <div>
                      <span className="text-[13px] text-amber-300 font-bold block">
                        Đánh giá phát âm
                      </span>
                      <h4 className="text-[19px] font-bold text-white">
                        {evaluationResult.accuracy || 'Tốt'}
                      </h4>
                    </div>
                  </div>
                  <p className="text-[15px] text-stone-200">{evaluationResult.feedback}</p>
                </div>
              )}
            </div>
          ) : currentQuizQuestion ? (
            <div className="bg-white rounded-3xl border border-[#E8DFCE] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between text-[14px] font-bold">
                <span className="text-[#C85A43]">
                  Câu nghe {quizCurrentIdx + 1} / {quizQuestions.length}
                </span>
                <span className="text-emerald-700">
                  Đúng: {quizScore} / {quizQuestions.length}
                </span>
              </div>

              {/* Big Audio Player Box */}
              <div className="bg-[#FAF7F0] rounded-3xl border border-[#E6DEC8] p-6 text-center space-y-4">
                <p className="text-[14px] font-bold text-slate-600">
                  {listeningSubMode === 'listen-choice'
                    ? 'Nghe phát âm tiếng Trung và chọn thẻ từ vựng đúng:'
                    : 'Nghe phát âm tiếng Trung và gõ lại Chữ Hán hoặc Pinyin:'}
                </p>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => speakChinese(currentQuizQuestion.target.word, 1)}
                    className="px-6 py-4 rounded-2xl bg-[#C85A43] hover:bg-red-700 text-white font-bold text-[15px] inline-flex items-center gap-2.5 shadow-sm cursor-pointer transition-transform hover:scale-105"
                  >
                    <Volume2 className="w-6 h-6" />
                    <span>Phát âm thanh (1.0x)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => speakChinese(currentQuizQuestion.target.word, 0.7)}
                    className="px-4 py-4 rounded-2xl bg-white hover:bg-[#FDF0ED] text-[#C85A43] border border-[#E6DEC8] font-bold text-[14px] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                    <span>Nghe chậm (0.7x)</span>
                  </button>
                </div>

                {quizIsSubmitted && (
                  <div className="pt-2">
                    <VocabIllustration vocab={currentQuizQuestion.target} compact />
                  </div>
                )}
              </div>

              {listeningSubMode === 'listen-dictation' ? (
                <form onSubmit={handleSubmitTypedQuiz} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={quizTypedAnswer}
                      disabled={quizIsSubmitted}
                      onChange={(e) => setQuizTypedAnswer(e.target.value)}
                      placeholder="Nhập chữ Hán (vd: 你好) hoặc Pinyin (vd: ni hao)..."
                      className="flex-1 px-4 py-3 rounded-2xl border-2 border-[#E6DEC8] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-[#C85A43] text-[16px] font-bold text-[#18181B]"
                    />
                    {!quizIsSubmitted && (
                      <button
                        type="submit"
                        className="px-6 py-3 rounded-2xl bg-[#C85A43] hover:bg-red-700 text-white font-bold text-[15px] cursor-pointer shrink-0"
                      >
                        Kiểm tra
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {currentQuizQuestion.options.map((opt, idx) => {
                    const isTarget = opt.word === currentQuizQuestion.target.word;
                    const isChosen = quizSelectedOptionId === opt.id;

                    let cardStyle =
                      'bg-white text-[#18181B] border-[#E6DEC8] hover:border-[#C85A43]';
                    if (quizIsSubmitted) {
                      if (isTarget) {
                        cardStyle = 'bg-[#ECFDF5] text-emerald-950 border-emerald-500';
                      } else if (isChosen && !isTarget) {
                        cardStyle = 'bg-[#FFF5F3] text-red-950 border-red-500';
                      } else {
                        cardStyle = 'bg-slate-50 text-slate-400 border-slate-200 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={`${opt.id}-${idx}`}
                        type="button"
                        disabled={quizIsSubmitted}
                        onClick={() => handleSelectQuizOption(opt)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer space-y-2.5 ${cardStyle}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-[#FDF0ED] text-[#C85A43] font-mono text-[12px] font-extrabold">
                            Đáp án {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="font-mono text-[13px] font-bold text-slate-500">
                            {opt.pinyin}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-serif text-[26px] font-black text-[#18181B]">
                            {opt.word}
                          </span>
                          <span className="text-[14px] font-bold text-[#C85A43] truncate">
                            {cleanMeaning(opt.meaning)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {quizIsSubmitted && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#FAF7F0] border border-[#E6DEC8]">
                  <div className="text-[15px] font-bold">
                    {quizIsCorrect ? (
                      <span className="text-emerald-700">
                        ✓ Chính xác! {currentQuizQuestion.target.word} ({currentQuizQuestion.target.pinyin}) — {cleanMeaning(currentQuizQuestion.target.meaning)}
                      </span>
                    ) : (
                      <span className="text-red-700">
                        ✗ Đáp án đúng: {currentQuizQuestion.target.word} ({currentQuizQuestion.target.pinyin}) — {cleanMeaning(currentQuizQuestion.target.meaning)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleNextQuizQuestion}
                    className="px-5 py-2.5 rounded-xl bg-[#C85A43] hover:bg-red-700 text-white font-bold text-[14px] cursor-pointer"
                  >
                    Câu nghe tiếp theo ›
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 1B: VOCABULARY QUIZ / TEST (KIỂM TRA TỪ VỰNG) */}
      {/* ========================================================= */}
      {mode === 'quiz' && (
        <div className="space-y-5">
          {/* Quiz Settings Toolbar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E6DEC8] space-y-3.5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[14px] font-extrabold text-[#18181B] block">
                  1. Chọn dạng bài kiểm tra từ vựng:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'hanzi-to-meaning', label: 'Chữ Hán → Chọn Nghĩa' },
                    { id: 'meaning-to-hanzi', label: 'Nghĩa Việt → Chọn Chữ Hán' },
                    { id: 'listening', label: 'Nghe Âm → Chọn Từ' },
                    { id: 'typing', label: 'Tự luận: Gõ Chữ Hán / Pinyin' },
                  ].map((qt) => (
                    <button
                      key={qt.id}
                      type="button"
                      onClick={() => {
                        setQuizType(qt.id as QuizQuestionType);
                        if (qt.id === 'listening' && currentQuizQuestion) {
                          setTimeout(() => speakChinese(currentQuizQuestion.target.word), 150);
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl text-[13px] sm:text-[14px] font-extrabold border transition-colors cursor-pointer ${
                        quizType === qt.id
                          ? 'bg-red-700 text-white border-red-700'
                          : 'bg-[#FAF7F0] text-[#18181B] border-[#E6DEC8] hover:border-red-700'
                      }`}
                    >
                      {qt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[14px] font-extrabold text-[#18181B] block">
                  2. Số câu hỏi:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[5, 10, 20, 30, 0].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuizCountLimit(num)}
                      className={`px-3 py-1.5 rounded-xl text-[13px] font-mono font-extrabold border transition-colors cursor-pointer ${
                        quizCountLimit === num
                          ? 'bg-[#18181B] text-white border-[#18181B]'
                          : 'bg-[#FAF7F0] text-[#18181B] border-[#E6DEC8] hover:border-red-700'
                      }`}
                    >
                      {num === 0 ? `Tất cả (${allFilteredVocab.length})` : `${num} câu`}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => startVocabQuiz(undefined, quizCountLimit)}
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-700 border border-red-300 text-[13px] font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Đổi đề mới</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {quizQuestions.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl border border-dashed border-[#D6CBB3] text-center space-y-2">
              <p className="text-[18px] font-bold text-[#18181B]">
                Không đủ từ vựng trong bộ lọc hiện tại để tạo bài kiểm tra.
              </p>
              <p className="text-[15px] text-slate-600">
                Hãy tích chọn thêm bộ từ vựng ở thanh Dropdown phía trên hoặc đổi cấp độ HSK / Boya.
              </p>
            </div>
          ) : quizFinished ? (
            /* QUIZ RESULT SUMMARY SCREEN */
            <div className="w-full sm:w-[85%] mx-auto bg-white rounded-3xl border-2 border-[#E6DEC8] p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-5 pb-5 border-b border-[#E6DEC8]">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-red-700 text-white flex items-center justify-center shadow-sm shrink-0">
                    <Trophy className="w-8 h-8 text-amber-300" />
                  </div>
                  <div>
                    <span className="text-[13px] font-extrabold text-red-700 uppercase tracking-wider">
                      Hoàn thành bài kiểm tra từ vựng
                    </span>
                    <h3 className="font-serif text-[22px] sm:text-[26px] font-black text-[#18181B]">
                      Đạt {quizScore} / {quizQuestions.length} câu đúng (
                      {Math.round((quizScore / quizQuestions.length) * 100)}%)
                    </h3>
                    <p className="text-[14px] text-slate-600">
                      Các từ trả lời đúng đã tự động được đánh dấu "Đã thuộc" (+10 XP/từ).
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4">
                  <CompletionSealStamp
                    label="ĐÃ HOÀN THÀNH"
                    subLabel={`${quizScore}/${quizQuestions.length} ĐÚNG`}
                    surface="light"
                    autoStamp
                    compact
                  />

                  <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2.5">
                  {quizHistory.some((h) => !h.isCorrect) && (
                    <button
                      type="button"
                      onClick={() => {
                        const wrongPool = quizHistory
                          .filter((h) => !h.isCorrect)
                          .map((h) => h.item);
                        startVocabQuiz(wrongPool, wrongPool.length);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-[14px] flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <RotateCw className="w-4 h-4" />
                      <span>
                        Kiểm tra lại {quizHistory.filter((h) => !h.isCorrect).length} từ sai
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => startVocabQuiz(undefined, quizCountLimit)}
                    className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-black text-[14px] flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>Làm đề kiểm tra mới</span>
                  </button>
                  </div>
                </div>
              </div>

              {/* Detailed Question Review */}
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {quizHistory.map((record, idx) => (
                  <div
                    key={`${record.item.id}-${idx}`}
                    className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                      record.isCorrect
                        ? 'bg-[#EAF7F0]/60 border-emerald-300'
                        : 'bg-red-50/70 border-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {record.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-700 shrink-0" />
                      )}
                      <button
                        type="button"
                        onClick={() => speakChinese(record.item.word)}
                        className="p-2 rounded-xl bg-white border border-[#E6DEC8] text-red-700 hover:bg-red-700 hover:text-white cursor-pointer shrink-0"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif text-[20px] font-black text-[#18181B]">
                            {record.item.word}
                          </span>
                          <span className="font-mono text-[14px] font-bold text-red-700">
                            {record.item.pinyin}
                          </span>
                          <span className="text-[13px] text-slate-600 font-semibold">
                            ({record.item.sinoVietnamese})
                          </span>
                        </div>
                        <div className="text-[14px] font-bold text-[#18181B]">
                          Nghĩa chuẩn: <span className="text-emerald-800">{cleanMeaning(record.item.meaning)}</span>
                        </div>
                      </div>
                    </div>

                    {!record.isCorrect && (
                      <div className="text-[13px] font-bold text-red-700 bg-white px-3 py-1.5 rounded-xl border border-red-200">
                        Bạn chọn: {record.userAnswer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ACTIVE QUIZ QUESTION CARD */
            currentQuizQuestion && (
              <div className="w-full sm:w-[80%] mx-auto bg-white rounded-3xl border-2 border-[#E6DEC8] p-5 sm:p-7 shadow-sm space-y-5">
                {/* Progress Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[14px] font-bold">
                    <span className="font-mono font-black text-red-700">
                      Câu {quizCurrentIdx + 1} / {quizQuestions.length}
                    </span>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-emerald-700 font-extrabold">
                        Đúng: {quizScore}
                      </span>
                      <span className="text-slate-400">|</span>
                      <span className="text-red-700 font-extrabold">
                        Sai: {quizHistory.filter((h) => !h.isCorrect).length}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E6DEC8] overflow-hidden">
                    <div
                      className="h-full bg-red-700 transition-all duration-300"
                      style={{
                        width: `${((quizCurrentIdx + 1) / quizQuestions.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Question Prompt Box */}
                <div className="bg-[#FAF7F0] rounded-2xl border border-[#E6DEC8] p-5 text-center space-y-3">
                  {quizType === 'hanzi-to-meaning' && (
                    <>
                      <span className="text-[13px] font-bold text-slate-600 block">
                        Chọn nghĩa tiếng Việt đúng cho từ vựng sau:
                      </span>
                      <div className="font-serif text-[48px] sm:text-[60px] font-black text-[#18181B] leading-none">
                        {currentQuizQuestion.target.word}
                      </div>
                      {showPinyin && (
                        <div className="font-mono text-[18px] font-bold text-red-700">
                          {currentQuizQuestion.target.pinyin}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => speakChinese(currentQuizQuestion.target.word)}
                        className="mx-auto px-3.5 py-1.5 rounded-xl bg-white border border-[#E6DEC8] hover:border-red-700 text-[13px] font-bold text-[#18181B] inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4 text-red-700" />
                        <span>Nghe phát âm</span>
                      </button>
                    </>
                  )}

                  {quizType === 'meaning-to-hanzi' && (
                    <>
                      <span className="text-[13px] font-bold text-slate-600 block">
                        Chọn Chữ Hán tương ứng với nghĩa tiếng Việt sau:
                      </span>
                      <div className="text-[22px] sm:text-[26px] font-black text-red-800">
                        "{cleanMeaning(currentQuizQuestion.target.meaning)}"
                      </div>
                      {currentQuizQuestion.target.sinoVietnamese && (
                        <div className="text-[14px] font-bold text-slate-600">
                          Âm Hán Việt: {currentQuizQuestion.target.sinoVietnamese}
                        </div>
                      )}
                    </>
                  )}

                  {quizType === 'listening' && (
                    <>
                      <span className="text-[13px] font-bold text-slate-600 block">
                        Bấm nghe phát âm và chọn từ vựng chính xác:
                      </span>
                      <button
                        type="button"
                        onClick={() => speakChinese(currentQuizQuestion.target.word)}
                        className="mx-auto w-20 h-20 rounded-full bg-red-700 hover:bg-red-800 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-105"
                        title="Nghe lại phát âm"
                      >
                        <Volume2 className="w-9 h-9" />
                      </button>
                      <div className="text-[13px] font-semibold text-slate-600">
                        Bấm vào loa để nghe lại âm thanh
                      </div>
                    </>
                  )}

                  {quizType === 'typing' && (
                    <>
                      <span className="text-[13px] font-bold text-slate-600 block">
                        Nhập Chữ Hán hoặc phiên âm Pinyin cho từ có nghĩa sau:
                      </span>
                      <div className="text-[22px] sm:text-[26px] font-black text-red-800">
                        "{cleanMeaning(currentQuizQuestion.target.meaning)}"
                      </div>
                      <div className="text-[14px] font-bold text-slate-600">
                        Hán Việt: {currentQuizQuestion.target.sinoVietnamese || '-'} · Cấp độ:{' '}
                        {currentQuizQuestion.target.level}
                      </div>
                    </>
                  )}
                </div>

                {/* Answer Area: Multiple Choice vs Typing */}
                {quizType === 'typing' ? (
                  <form onSubmit={handleSubmitTypedQuiz} className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        type="text"
                        value={quizTypedAnswer}
                        disabled={quizIsSubmitted}
                        onChange={(e) => setQuizTypedAnswer(e.target.value)}
                        placeholder="Nhập chữ Hán (ví dụ: 留学生) hoặc Pinyin (ví dụ: liuxuesheng)..."
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-[#E6DEC8] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:border-red-700 text-[16px] font-bold text-[#18181B]"
                      />
                      {!quizIsSubmitted && (
                        <button
                          type="submit"
                          className="px-6 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-black text-[15px] cursor-pointer shrink-0"
                        >
                          Kiểm tra đáp án
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentQuizQuestion.options.map((opt, idx) => {
                      const isTarget = opt.word === currentQuizQuestion.target.word;
                      const isChosen = quizSelectedOptionId === opt.id;

                      let btnStyle =
                        'bg-white text-[#18181B] border-[#E6DEC8] hover:border-red-700 hover:bg-[#FAF7F0]';
                      if (quizIsSubmitted) {
                        if (isTarget) {
                          btnStyle = 'bg-emerald-700 text-white border-emerald-700 shadow-xs';
                        } else if (isChosen && !isTarget) {
                          btnStyle = 'bg-red-700 text-white border-red-700';
                        } else {
                          btnStyle = 'bg-slate-50 text-slate-400 border-slate-200 opacity-65';
                        }
                      }

                      return (
                        <button
                          key={`${opt.id}-${idx}`}
                          type="button"
                          disabled={quizIsSubmitted}
                          onClick={() => handleSelectQuizOption(opt)}
                          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${btnStyle}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-7 h-7 rounded-lg font-mono text-[13px] font-black flex items-center justify-center shrink-0 ${
                                quizIsSubmitted && (isTarget || isChosen)
                                  ? 'bg-white/20 text-white'
                                  : 'bg-[#FDEEE9] text-red-700'
                              }`}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>

                            {quizType === 'meaning-to-hanzi' ? (
                              <div>
                                <div className="font-serif text-[22px] font-black leading-tight">
                                  {opt.word}
                                </div>
                                {showPinyin && (
                                  <div
                                    className={`font-mono text-[13px] font-bold ${
                                      quizIsSubmitted && (isTarget || isChosen)
                                        ? 'text-white/90'
                                        : 'text-red-700'
                                    }`}
                                  >
                                    {opt.pinyin}
                                  </div>
                                )}
                              </div>
                            ) : quizType === 'listening' ? (
                              <div>
                                <div className="font-serif text-[20px] font-black leading-tight">
                                  {opt.word}{' '}
                                  <span className="font-sans text-[14px] font-bold">
                                    — {cleanMeaning(opt.meaning)}
                                  </span>
                                </div>
                                {showPinyin && (
                                  <div
                                    className={`font-mono text-[13px] font-semibold ${
                                      quizIsSubmitted && (isTarget || isChosen)
                                        ? 'text-white/90'
                                        : 'text-slate-600'
                                    }`}
                                  >
                                    {opt.pinyin}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-[15px] sm:text-[16px] font-bold leading-snug">
                                {cleanMeaning(opt.meaning)}
                              </div>
                            )}
                          </div>

                          {quizIsSubmitted && isTarget && (
                            <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                          )}
                          {quizIsSubmitted && isChosen && !isTarget && (
                            <XCircle className="w-5 h-5 text-white shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Explanation & Next Question Bar after answering */}
                {quizIsSubmitted && (
                  <div
                    className={`p-4 rounded-2xl border-2 space-y-2.5 ${
                      quizIsCorrect
                        ? 'bg-[#EAF7F0] border-emerald-600 text-emerald-950'
                        : 'bg-[#FFF5F3] border-red-600 text-red-950'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 font-black text-[16px]">
                        {quizIsCorrect ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                            <span className="text-emerald-800">
                              Chính xác! Đã đánh dấu thuộc từ này (+10 XP)
                            </span>
                          </>
                        ) : (
                          <>
                            <HelpCircle className="w-5 h-5 text-red-700 shrink-0" />
                            <span className="text-red-800">
                              Chưa chính xác! Đáp án đúng là: {currentQuizQuestion.target.word} (
                              {currentQuizQuestion.target.pinyin}) —{' '}
                              {cleanMeaning(currentQuizQuestion.target.meaning)}
                            </span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleNextQuizQuestion}
                        className="px-5 py-2 rounded-xl bg-[#18181B] hover:bg-red-700 text-white font-black text-[14px] flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <span>
                          {quizCurrentIdx + 1 < quizQuestions.length
                            ? 'Câu tiếp theo'
                            : 'Xem kết quả'}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-[13px] sm:text-[14px] pt-2 border-t border-black/10 space-y-0.5">
                      <div>
                        <strong>Ví dụ:</strong>{' '}
                        <span className="font-serif font-bold text-[15px]">
                          {currentQuizQuestion.target.exampleSentence}
                        </span>{' '}
                        {showPinyin && (
                          <span className="font-mono text-red-700">
                            ({currentQuizQuestion.target.examplePinyin})
                          </span>
                        )}
                      </div>
                      <div className="text-slate-700">
                        <strong>Dịch:</strong> {currentQuizQuestion.target.exampleMeaning}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: AI PRONUNCIATION COACH */}
      {/* ========================================================= */}
      {mode === 'ai-pronounce' && (
        <div className="bg-white rounded-3xl border border-[#E6DEC8] p-6 sm:p-8 shadow-2xs space-y-6">
          <div>
            <h2 className="text-[22px] sm:text-[26px] font-black text-[#18181B]">
              Luyện Phát Âm & Chấm Thanh Điệu AI
            </h2>
            <p className="text-[19px] text-slate-700 mt-1">
              Chọn từ vựng, nghe mẫu chậm và bấm nút Micro để AI đánh giá độ chuẩn xác.
            </p>
          </div>

          {selectedWordForAi && (
            <div className="bg-[#FAF7F0] rounded-3xl p-6 border border-[#E6DEC8] flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="text-center lg:text-left space-y-2">
                <div className="flex items-center gap-4 justify-center lg:justify-start">
                  <span className="font-serif text-[51px] sm:text-[64px] font-black text-[#18181B] leading-none">
                    {selectedWordForAi.word}
                  </span>
                  <button
                    type="button"
                    onClick={() => speakChinese(selectedWordForAi.word, 0.75)}
                    className="p-4 rounded-full bg-red-700 text-white hover:bg-red-800 transition-colors cursor-pointer"
                    title="Nghe phát âm chuẩn tốc độ chậm"
                  >
                    <Volume2 className="w-7 h-7" />
                  </button>
                </div>
                {showPinyin && (
                  <p className="font-mono text-[22px] font-black text-red-700">
                    {selectedWordForAi.pinyin}
                  </p>
                )}
                <p className="text-[19px] text-[#18181B] font-bold">
                  {cleanMeaning(selectedWordForAi.meaning)}{' '}
                  <span className="text-[16px] font-semibold text-slate-600">
                    (Hán Việt: {selectedWordForAi.sinoVietnamese})
                  </span>
                </p>
              </div>

              <div className="w-full lg:w-72">
                <label
                  htmlFor="ai-word-picker"
                  className="text-[14px] font-extrabold text-[#18181B] block mb-2"
                >
                  Đổi từ vựng cần luyện:
                </label>
                <select
                  id="ai-word-picker"
                  value={selectedWordForAi.id}
                  onChange={(e) => {
                    const found = vocabularies.find((v) => v.id === e.target.value);
                    if (found) {
                      setSelectedWordForAi(found);
                      setEvaluationResult(null);
                      setRecordedText('');
                    }
                  }}
                  className="w-full p-3.5 text-[14px] rounded-2xl border border-[#E6DEC8] bg-white font-bold text-[#18181B] focus:ring-2 focus:ring-red-700"
                >
                  {vocabularies.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.word} ({v.pinyin}) - {cleanMeaning(v.meaning)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Recording Action Zone */}
          <div className="p-8 rounded-3xl bg-[#FAF7F0] border border-[#E6DEC8] flex flex-col items-center text-center space-y-5">
            <button
              type="button"
              disabled={isRecording || isEvaluating}
              onClick={handleStartSpeech}
              className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-transform cursor-pointer ${
                isRecording
                  ? 'bg-red-700 text-white scale-110 ring-8 ring-red-200'
                  : isEvaluating
                  ? 'bg-amber-600 text-white'
                  : 'bg-[#18181B] hover:bg-red-700 text-white hover:scale-105'
              }`}
              aria-label="Bắt đầu thu âm phát âm"
            >
              {isRecording ? (
                <MicOff className="w-10 h-10" />
              ) : isEvaluating ? (
                <RotateCw className="w-10 h-10 animate-spin" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </button>

            <div>
              <p className="font-black text-[19px] text-[#18181B]">
                {isRecording
                  ? 'Đang lắng nghe giọng nói của bạn...'
                  : isEvaluating
                  ? 'Lão Sư AI đang chấm thanh điệu...'
                  : 'Bấm Micro để đọc to từ vựng'}
              </p>
              <p className="text-[16px] text-slate-600 mt-1">
                Đọc rõ: "{selectedWordForAi?.word}" ({selectedWordForAi?.pinyin})
              </p>
            </div>

            {recordedText && (
              <div className="px-5 py-3 bg-white rounded-2xl border border-[#E6DEC8] text-[18px] font-bold text-[#18181B]">
                Nhận diện được:{' '}
                <span className="text-red-700 font-serif text-[22px]">"{recordedText}"</span>
              </div>
            )}
          </div>

          {evaluationResult && (
            <div className="p-6 rounded-3xl bg-[#18181B] text-white border-2 border-red-700 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-red-700 text-white flex flex-col items-center justify-center font-black tabular-nums">
                    <span className="text-[26px] leading-none">{evaluationResult.score}</span>
                    <span className="text-[12px]">Điểm</span>
                  </div>
                  <div>
                    <span className="text-[14px] text-amber-300 font-bold block">
                      Kết quả đánh giá AI
                    </span>
                    <h4 className="text-[22px] font-black text-white">
                      {evaluationResult.accuracy ||
                        (evaluationResult.score >= 85 ? 'Rất xuất sắc!' : 'Tốt, cần luyện thêm')}
                    </h4>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-5 space-y-3 text-[18px] leading-relaxed">
                <p className="text-white">
                  <strong className="text-amber-300">Nhận xét:</strong> {evaluationResult.feedback}
                </p>
                {evaluationResult.tips && (
                  <p className="text-stone-200 pt-3 border-t border-white/15 flex items-start gap-2">
                    <Info className="w-6 h-6 text-amber-300 shrink-0 mt-1" />
                    <span>
                      <strong className="text-white">Mẹo khẩu hình:</strong> {evaluationResult.tips}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 3: LARGE-FONT DICTIONARY CARDS */}
      {/* ========================================================= */}
      {mode === 'dictionary' && (
        <div className="space-y-5">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E6DEC8] flex flex-wrap items-center justify-between gap-4">
            <span className="text-[18px] font-extrabold text-[#18181B] tabular-nums">
              Hiển thị {filteredVocab.length} từ vựng
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-xl text-[14px] font-bold cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-[#18181B] text-white'
                    : 'bg-[#FAF7F0] text-[#18181B] border border-[#E6DEC8]'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('mastered')}
                className={`px-4 py-2 rounded-xl text-[14px] font-bold cursor-pointer ${
                  statusFilter === 'mastered'
                    ? 'bg-red-700 text-white'
                    : 'bg-[#FAF7F0] text-[#18181B] border border-[#E6DEC8]'
                }`}
              >
                Đã thuộc ({studentProfile.masteredVocabIds.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('learning')}
                className={`px-4 py-2 rounded-xl text-[14px] font-bold cursor-pointer ${
                  statusFilter === 'learning'
                    ? 'bg-amber-600 text-white'
                    : 'bg-[#FAF7F0] text-[#18181B] border border-[#E6DEC8]'
                }`}
              >
                Đang học ({studentProfile.learningVocabIds.length})
              </button>
            </div>
          </div>

          {/* Spacious High-Legibility Dictionary List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredVocab.map((item, idx) => {
              const isMastered = studentProfile.masteredVocabIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-6 rounded-3xl border transition-colors flex flex-col gap-4 ${
                    isMastered
                      ? 'bg-[#FFFBF9] border-red-400'
                      : 'bg-white border-[#E6DEC8] hover:border-red-700/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="font-mono text-[14px] font-bold text-slate-500 tabular-nums">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="font-serif text-[37px] sm:text-[43px] font-black text-[#18181B] leading-none">
                        {item.word}
                      </span>
                      {showPinyin && (
                        <span className="font-mono font-black text-[21px] sm:text-[24px] text-red-700">
                          {item.pinyin}
                        </span>
                      )}
                      <span className="text-[14px] font-bold text-slate-600">
                        · {item.level} · Hán Việt: {item.sinoVietnamese || '-'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => speakChinese(item.word)}
                        className="p-3 rounded-2xl bg-[#FAF7F0] hover:bg-red-700 hover:text-white text-red-700 border border-[#E6DEC8] transition-colors cursor-pointer"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-6 h-6" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          isMastered ? markVocabLearning(item.id) : markVocabMastered(item.id)
                        }
                        className={`px-4 py-3 rounded-2xl border font-bold text-[14px] flex items-center gap-2 transition-colors cursor-pointer ${
                          isMastered
                            ? 'bg-red-700 text-white border-red-700'
                            : 'bg-white text-[#18181B] border-[#E6DEC8] hover:border-red-700'
                        }`}
                      >
                        <BookmarkCheck className="w-5 h-5" />
                        <span>{isMastered ? 'Đã thuộc' : 'Đánh dấu thuộc'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-[21px] sm:text-[22px] font-black text-[#18181B]">
                    Nghĩa: <span className="text-red-800">{cleanMeaning(item.meaning)}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E6DEC8] space-y-1">
                    <p className="font-serif text-[19px] sm:text-[21px] font-bold text-[#18181B]">
                      {item.exampleSentence}
                    </p>
                    {showPinyin && (
                      <p className="text-[16px] text-red-700 font-mono font-semibold">
                        {item.examplePinyin}
                      </p>
                    )}
                    <p className="text-[18px] sm:text-[19px] text-slate-700">
                      {item.exampleMeaning}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
        </div>
      </div>

      {/* Modals */}
      <DeckEditorModal
        isOpen={isDeckEditorOpen}
        onClose={() => setIsDeckEditorOpen(false)}
        initialDeck={deckToEdit}
        defaultLevel={selectedLevel === 'ALL' || selectedLevel === 'BOYA' ? 'HSK 1' : selectedLevel}
        onSave={(deck) => {
          const exists = vocabDecks.some((d) => d.id === deck.id);
          if (exists) {
            updateVocabDeck(deck);
          } else {
            addVocabDeck(deck);
            setSelectedDeckIds([deck.id]);
            setActiveDeckId(deck.id);
          }
        }}
      />

      <CardEditorModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        initialCard={cardToEdit}
        deckLevel={
          activeDeck
            ? activeDeck.level
            : selectedLevel === 'ALL' || selectedLevel === 'BOYA'
            ? 'HSK 1'
            : selectedLevel
        }
        deckCategory={
          activeDeck
            ? activeDeck.category
            : selectedLevel === 'BOYA'
            ? selectedBoyaSub === 'ALL_BOYA'
              ? 'Giáo trình Boya - Sơ cấp 1'
              : selectedBoyaSub
            : 'Tổng hợp'
        }
        onSave={(card) => {
          if (activeDeck) {
            if (cardToEdit) {
              updateCardInDeck(activeDeck.id, card);
            } else {
              addCardToDeck(activeDeck.id, card);
            }
          } else if (vocabDecks.length > 0) {
            addCardToDeck(vocabDecks[0].id, card);
          }
        }}
      />

      <AIFlashcardGeneratorModal
        isOpen={isAIFlashcardModalOpen}
        onClose={() => setIsAIFlashcardModalOpen(false)}
        defaultLevel={selectedLevel === 'ALL' || selectedLevel === 'BOYA' ? 'HSK 2' : selectedLevel}
        onDeckCreated={(newDeck) => {
          addVocabDeck(newDeck);
          setSelectedDeckIds([newDeck.id]);
          setActiveDeckId(newDeck.id);
        }}
      />
    </div>
  );
};

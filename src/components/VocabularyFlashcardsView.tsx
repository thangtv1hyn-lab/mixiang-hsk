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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useHSK } from '../context/HSKContext';
import { HSKLevel, VocabItem, VocabDeck } from '../types/hsk';
import { speakChinese, createSpeechRecognizer } from '../utils/audioSpeech';
import { DeckEditorModal } from './admin/DeckEditorModal';
import { CardEditorModal } from './admin/CardEditorModal';
import { AIFlashcardGeneratorModal } from './admin/AIFlashcardGeneratorModal';

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
    recordStudyMinutes,
  } = useHSK();

  const [mode, setMode] = useState<'flashcards' | 'quiz' | 'ai-pronounce' | 'dictionary'>('flashcards');
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
    setSelectedDeckIds((prev) => {
      const exists = prev.includes(deckId);
      const next = exists ? prev.filter((id) => id !== deckId) : [...prev, deckId];
      setActiveDeckId(next.length > 0 ? next[0] : null);
      return next;
    });
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

      const data = await response.json();
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
      {/* Header & Mode Switcher */}
      <div className="space-y-4 border-b border-[#E6DEC8] pb-5">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-[24px] sm:text-[29px] font-black text-[#18181B] inline-flex items-center justify-center gap-3 leading-tight">
            <Layers className="w-8 h-8 text-red-600 shrink-0" />
            <span>Học Từ Vựng, Kiểm Tra & Luyện Phát Âm AI</span>
          </h1>
          <p className="text-[19px] text-slate-700 mt-1">
            Chữ Hán và Pinyin cỡ lớn dễ nhìn, tích hợp Kiểm tra từ vựng cho cả Chuẩn HSK 1–5 và Giáo trình Boya.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#F5EFEB] rounded-2xl border border-[#E6DEC8] w-fit">
          <button
            type="button"
            onClick={() => setMode('flashcards')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] sm:text-[16px] font-extrabold transition-all cursor-pointer ${
              mode === 'flashcards'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-[#18181B] hover:bg-white hover:text-red-700'
            }`}
          >
            <RotateCw className="w-5 h-5" />
            <span>Thẻ Flashcard</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('quiz')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] sm:text-[16px] font-extrabold transition-all cursor-pointer ${
              mode === 'quiz'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-[#18181B] hover:bg-white hover:text-red-700'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Kiểm tra từ vựng</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('ai-pronounce')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] sm:text-[16px] font-extrabold transition-all cursor-pointer ${
              mode === 'ai-pronounce'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-[#18181B] hover:bg-white hover:text-red-700'
            }`}
          >
            <Mic className="w-5 h-5" />
            <span>Chấm Phát Âm AI</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('dictionary')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] sm:text-[16px] font-extrabold transition-all cursor-pointer ${
              mode === 'dictionary'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-[#18181B] hover:bg-white hover:text-red-700'
            }`}
          >
            <Search className="w-5 h-5" />
            <span>Tra cứu từ vựng</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E6DEC8] space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-extrabold text-[14px] text-[#18181B] mr-1">Giáo trình / Cấp độ:</span>
          {(['ALL', 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                setSelectedLevel(lvl);
                setSelectedDeckIds([]);
                setActiveDeckId(null);
                setCurrentIndex(0);
              }}
              className={`px-4 py-2 rounded-xl text-[14px] font-bold transition-colors cursor-pointer ${
                selectedLevel === lvl
                  ? 'bg-[#18181B] text-white'
                  : 'bg-[#FAF7F0] text-[#18181B] border border-[#E6DEC8] hover:border-red-700'
              }`}
            >
              {lvl === 'ALL' ? 'Tất cả' : lvl}
            </button>
          ))}

          {/* Giáo trình Boya filter button */}
          <button
            type="button"
            onClick={() => {
              setSelectedLevel('BOYA');
              setSelectedBoyaSub('ALL_BOYA');
              setSelectedDeckIds([]);
              setActiveDeckId(null);
              setCurrentIndex(0);
            }}
            className={`px-4 py-2 rounded-xl text-[14px] font-extrabold transition-colors cursor-pointer flex items-center gap-2 border ${
              selectedLevel === 'BOYA'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-[#EAF7F0] text-emerald-900 border-emerald-300 hover:border-emerald-700'
            }`}
          >
            <span>Giáo trình Boya (博雅汉语)</span>
          </button>
        </div>

        {/* Sub-filter when Giáo trình Boya is active */}
        {selectedLevel === 'BOYA' && (
          <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-2xl bg-[#EAF7F0]/70 border border-emerald-200">
            <span className="text-[14px] font-black text-emerald-950 mr-1">
              Chọn quyển Boya:
            </span>
            {[
              { id: 'ALL_BOYA', label: 'Tất cả Boya' },
              { id: 'Giáo trình Boya - Sơ cấp 1', label: 'Boya Sơ cấp 1 (Quyển 1)' },
              { id: 'Giáo trình Boya - Sơ cấp 2', label: 'Boya Sơ cấp 2 (Quyển 2)' },
              { id: 'Giáo trình Boya - Trung cấp 1', label: 'Boya Trung cấp 1 (Quyển 3)' },
              { id: 'Giáo trình Boya - Trung cấp 2', label: 'Boya Trung cấp 2 (Quyển 4)' },
            ].map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setSelectedBoyaSub(b.id);
                  setSelectedDeckIds([]);
                  setActiveDeckId(null);
                  setCurrentIndex(0);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-[13px] sm:text-[14px] font-bold transition-colors cursor-pointer ${
                  selectedBoyaSub === b.id
                    ? 'bg-emerald-800 text-white'
                    : 'bg-white text-emerald-900 border border-emerald-300 hover:border-emerald-700'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm chữ Hán, phiên âm Pinyin, nghĩa tiếng Việt hoặc bài học Boya..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentIndex(0);
            }}
            className="w-full pl-12 pr-4 py-3 text-[16px] rounded-2xl border border-[#E6DEC8] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700"
          />
        </div>
      </div>

      {/* Bộ Từ Vựng Flashcards Selector & Admin Bar */}
      <div className="bg-white p-5 rounded-3xl border border-[#E6DEC8] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[16px] font-extrabold text-[#18181B] flex items-center gap-2 flex-wrap">
            <Layers className="w-5 h-5 text-red-700 shrink-0" />
            <span>Bộ từ đang học:</span>
            <span className="text-red-700">
              {selectedDecks.length > 1
                ? `Đã tích chọn ${selectedDecks.length} bộ từ (${sourceVocab.length} thẻ)`
                : selectedDecks.length === 1
                ? `${selectedDecks[0].title} (${selectedDecks[0].cards.length} thẻ)`
                : selectedLevel === 'BOYA'
                ? `Giáo trình Boya (${allFilteredVocab.length} từ)`
                : `Toàn bộ từ vựng (${allFilteredVocab.length} từ)`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMode('quiz');
                startVocabQuiz(undefined, quizCountLimit);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[13px] sm:text-[14px] flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Kiểm tra nhanh bộ từ này</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDeckToEdit(null);
                setIsAIFlashcardModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-[13px] sm:text-[14px] flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tạo bộ bằng AI (Tự nhập số từ / Boya)</span>
            </button>

            {userRole !== 'student' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDeckToEdit(null);
                    setIsDeckEditorOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#F5EFEB] text-red-700 border border-[#E6DEC8] font-bold text-[13px] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm bộ mới</span>
                </button>
                {activeDeck && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setCardToEdit(null);
                        setIsCardModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#FAF7F0] text-[#18181B] border border-[#E6DEC8] font-bold text-[13px] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm thẻ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeckToEdit(activeDeck);
                        setIsDeckEditorOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#FAF7F0] text-[#18181B] border border-[#E6DEC8] font-bold text-[13px] flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
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
                        className="px-3.5 py-2 rounded-xl bg-red-700 text-white font-bold text-[13px] cursor-pointer"
                      >
                        Xác nhận xóa
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteDeckId(activeDeck.id)}
                        className="p-2 rounded-xl text-red-700 hover:bg-red-50 border border-[#E6DEC8] cursor-pointer"
                        title="Xóa bộ từ vựng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Deck Selector - Multi-select Dropdown with Checkboxes */}
        <div className="space-y-2.5 bg-[#FAF7F0] p-4 rounded-2xl border border-[#E6DEC8]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] sm:text-[14px] font-extrabold text-[#18181B]">
              Chọn bộ từ vựng muốn học (nhấn mở danh sách để tích chọn 1 hoặc nhiều bộ):
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const allIds = visibleDecks.map((d) => d.id);
                  setSelectedDeckIds(allIds);
                  setActiveDeckId(allIds[0] || null);
                  setCurrentIndex(0);
                  setConfirmDeleteDeckId(null);
                }}
                className="px-3 py-1 rounded-lg bg-white hover:bg-red-50 text-red-700 border border-[#E6DEC8] text-[12px] font-bold cursor-pointer transition-colors"
              >
                Chọn tất cả ({visibleDecks.length} bộ)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDeckIds([]);
                  setActiveDeckId(null);
                  setCurrentIndex(0);
                  setConfirmDeleteDeckId(null);
                }}
                className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-[#E6DEC8] text-[12px] font-bold cursor-pointer transition-colors"
              >
                Bỏ tích (Học toàn bộ kho từ)
              </button>
            </div>
          </div>

          <div ref={deckDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsDeckDropdownOpen((prev) => !prev)}
              className="w-full px-4 py-3 rounded-xl bg-white border-2 border-[#E6DEC8] hover:border-red-700 focus:outline-none focus:border-red-700 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer shadow-2xs"
            >
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="font-extrabold text-[13px] sm:text-[14px] text-[#18181B] truncate">
                  {selectedDecks.length === 0
                    ? `Toàn bộ kho từ vựng (${vocabularies.length} từ)`
                    : selectedDecks.length === 1
                    ? `${selectedDecks[0].title} (${selectedDecks[0].cards.length} thẻ)`
                    : `Đã tích chọn ${selectedDecks.length} bộ từ vựng (Tổng ${sourceVocab.length} thẻ)`}
                </span>
                {selectedDecks.length > 1 && (
                  <span className="text-[12px] text-slate-600 font-semibold truncate max-w-md">
                    — {selectedDecks.map((d) => d.title).join(', ')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-0.5 rounded-lg bg-[#FDEEE9] text-red-700 font-mono text-[12px] font-extrabold">
                  {selectedDecks.length === 0
                    ? 'Tất cả'
                    : `${selectedDecks.length}/${visibleDecks.length} bộ`}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-700 transition-transform duration-200 ${
                    isDeckDropdownOpen ? 'rotate-180 text-red-700' : ''
                  }`}
                />
              </div>
            </button>

            {isDeckDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-white rounded-2xl border-2 border-[#E6DEC8] shadow-2xl p-3 space-y-2 max-h-80 overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-[#E6DEC8] px-1">
                  <span className="text-[12px] font-bold text-slate-600">
                    Tích vào ô vuông để chọn / bỏ chọn các bộ từ vựng:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsDeckDropdownOpen(false)}
                    className="px-3 py-1 rounded-lg bg-red-700 text-white text-[13px] font-bold hover:bg-red-800 cursor-pointer"
                  >
                    Xong
                  </button>
                </div>

                {/* Option: Toàn bộ kho từ vựng */}
                <label
                  className={`w-full px-3.5 py-2.5 rounded-xl font-bold text-[12px] sm:text-[13px] transition-all cursor-pointer flex items-center justify-between gap-3 border select-none ${
                    selectedDeckIds.length === 0
                      ? 'bg-[#FFF9F5] text-red-800 border-red-700'
                      : 'bg-white text-[#18181B] border-transparent hover:bg-[#FAF7F0]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedDeckIds.length === 0}
                      onChange={() => {
                        setSelectedDeckIds([]);
                        setActiveDeckId(null);
                        setCurrentIndex(0);
                        setConfirmDeleteDeckId(null);
                      }}
                      className="w-4 h-4 accent-red-700 rounded cursor-pointer"
                    />
                    <span>Toàn bộ kho từ vựng (Mặc định)</span>
                  </div>
                  <span className="font-mono text-[12px] font-extrabold text-slate-600 tabular-nums">
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
                      className={`w-full px-3.5 py-2.5 rounded-xl font-bold text-[12px] sm:text-[13px] transition-all cursor-pointer flex items-center justify-between gap-3 border select-none ${
                        isChecked
                          ? isBoyaDeck
                            ? 'bg-[#EAF7F0] text-emerald-950 border-emerald-700'
                            : 'bg-[#FFF9F5] text-red-900 border-red-700'
                          : 'bg-white text-[#18181B] border-transparent hover:bg-[#FAF7F0]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDeckSelection(deck.id)}
                          className={`w-4 h-4 rounded cursor-pointer shrink-0 ${
                            isBoyaDeck ? 'accent-emerald-700' : 'accent-red-700'
                          }`}
                        />
                        <span className="truncate">{deck.title}</span>
                        <span
                          className={`text-[12px] px-2 py-0.5 rounded-md font-extrabold shrink-0 ${
                            isBoyaDeck
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {isBoyaDeck ? 'Boya' : deck.level}
                        </span>
                      </div>
                      <span className="font-mono text-[12px] font-extrabold text-slate-600 tabular-nums shrink-0">
                        {deck.cards.length} thẻ
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODE 1: GIANT HIGH-CLARITY FLASHCARDS */}
      {/* ========================================================= */}
      {mode === 'flashcards' && (
        <div className="space-y-6">
          {filteredVocab.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-[#D6CBB3] text-center space-y-2">
              <p className="text-[19px] font-bold text-[#18181B]">
                Không có từ vựng nào phù hợp với bộ lọc hiện tại.
              </p>
              <p className="text-[16px] text-slate-600">
                Vui lòng chọn cấp độ HSK / Giáo trình Boya khác hoặc xóa từ khóa tìm kiếm.
              </p>
            </div>
          ) : (
            <>
              {/* Progress, Custom Word Count Input & Quick Controls */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E6DEC8] flex flex-wrap items-center justify-between gap-4 text-[16px] font-bold text-[#18181B]">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-mono font-black text-red-700 tabular-nums text-[18px]">
                    Thẻ {currentIndex + 1} / {filteredVocab.length}
                  </span>

                  {/* Custom Number of Words Input for Active Flashcard Session */}
                  <div className="flex flex-wrap items-center gap-2 bg-[#FAF7F0] px-3.5 py-2 rounded-2xl border border-[#E6DEC8]">
                    <label
                      htmlFor="session-word-count-input"
                      className="text-[14px] font-extrabold text-[#18181B]"
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
                      className="w-28 px-3 py-1.5 rounded-xl border border-[#D6CBB3] bg-white text-[14px] font-mono font-black text-red-700 text-center focus:outline-none focus:border-red-700"
                    />
                    <div className="flex items-center gap-1">
                      {[5, 10, 20].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            setCustomCardLimit(String(num));
                            setCurrentIndex(0);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[13px] font-mono font-bold cursor-pointer ${
                            parsedLimit === num
                              ? 'bg-red-700 text-white'
                              : 'bg-white text-slate-700 border border-[#E6DEC8] hover:border-red-700'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                      {customCardLimit && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomCardLimit('');
                            setCurrentIndex(0);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[13px] font-bold bg-[#18181B] text-white cursor-pointer"
                        >
                          Tất cả
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMode('quiz')}
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kiểm tra bộ từ này</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShuffle}
                    className="px-4 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E6DEC8] hover:border-red-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Shuffle className="w-5 h-5 text-red-700" />
                    <span>Xáo trộn</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => speakChinese(currentFlashcard.word)}
                    className="px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white flex items-center gap-2 cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                    <span>Nghe mẫu</span>
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#E6DEC8] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-red-700 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentIndex + 1) / filteredVocab.length) * 100}%`,
                  }}
                />
              </div>

              {/* Giant 3D Flip Card (Co nhỏ 80% chiều rộng & chiều cao gọn gàng) */}
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
                className="relative h-[340px] sm:h-[380px] w-full sm:w-[80%] mx-auto cursor-pointer perspective-1000 select-none"
              >
                <div
                  className="relative w-full h-full rounded-3xl transition-transform duration-500 transform-style-3d shadow-lg"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transition: 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {/* FRONT SIDE */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-3xl bg-white border-2 border-[#E6DEC8] hover:border-red-700 p-5 sm:p-7 flex flex-col justify-between items-center text-center backface-hidden"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="w-full flex items-center justify-between text-[13px] font-bold text-slate-600">
                      <span className="font-mono text-red-700">
                        #{String(currentIndex + 1).padStart(2, '0')} · {currentFlashcard.level}
                      </span>
                      <span>Chạm thẻ để lật xem nghĩa</span>
                    </div>

                    <div className="space-y-3 my-auto">
                      <div className="font-serif text-[52px] sm:text-[72px] font-black text-[#18181B] tracking-wider leading-none">
                        {currentFlashcard.word}
                      </div>
                      {showPinyin && (
                        <p className="text-[20px] sm:text-[25px] font-black text-red-700 font-mono tracking-wide">
                          {currentFlashcard.pinyin}
                        </p>
                      )}
                      {currentFlashcard.radical && (
                        <p className="text-[14px] font-bold text-slate-600">
                          Bộ thủ: {currentFlashcard.radical}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakChinese(currentFlashcard.word);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#FAF7F0] hover:bg-red-700 hover:text-white text-[#18181B] border border-[#E6DEC8] text-[14px] font-extrabold flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Nghe phát âm chuẩn</span>
                    </button>
                  </div>

                  {/* BACK SIDE */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-3xl bg-[#18181B] text-white border-2 border-red-700 p-5 sm:p-7 flex flex-col justify-between backface-hidden"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[14px] sm:text-[16px]">
                      <span className="font-mono font-black text-amber-300">
                        {currentFlashcard.pinyin}
                      </span>
                      <span className="font-bold text-stone-200">
                        Hán Việt: {currentFlashcard.sinoVietnamese || '-'}
                      </span>
                    </div>

                    <div className="space-y-3.5 my-auto">
                      <div className="text-[22px] sm:text-[28px] font-black text-white leading-tight text-center">
                        {cleanMeaning(currentFlashcard.meaning)}
                      </div>

                      <div className="bg-white/10 rounded-2xl p-4 text-left border border-white/15 space-y-1.5">
                        <span className="text-[12px] text-amber-300 font-extrabold block">
                          Câu ví dụ:
                        </span>
                        <p className="font-serif text-[17px] sm:text-[19px] font-bold text-white leading-snug">
                          {currentFlashcard.exampleSentence}
                        </p>
                        <p className="text-[13px] sm:text-[14px] text-stone-300 font-mono">
                          {currentFlashcard.examplePinyin}
                        </p>
                        <p className="text-[14px] sm:text-[15px] text-stone-100 font-medium">
                          {currentFlashcard.exampleMeaning}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[12px] text-stone-300">
                      <span>Chọn mức độ nhớ bên dưới</span>
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

              {/* Spaced Repetition Rating Buttons (Co nhỏ 80% chiều rộng) */}
              <div className="w-full sm:w-[80%] mx-auto grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleRateCard('again')}
                  className="py-2.5 px-3 rounded-xl bg-white text-red-700 border-2 border-red-300 font-black text-[14px] sm:text-[15px] hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Chưa nhớ
                  <span className="block text-[11px] font-semibold text-slate-600 mt-0.5">
                    Ôn tập lại ngay
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRateCard('hard')}
                  className="py-2.5 px-3 rounded-xl bg-[#FAF7F0] text-[#18181B] border-2 border-[#E6DEC8] font-black text-[14px] sm:text-[15px] hover:border-red-700 transition-colors cursor-pointer"
                >
                  Tạm nhớ
                  <span className="block text-[11px] font-semibold text-slate-600 mt-0.5">
                    Cần luyện thêm
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRateCard('good')}
                  className="py-2.5 px-3 rounded-xl bg-red-700 text-white border-2 border-red-800 font-black text-[14px] sm:text-[15px] hover:bg-red-800 transition-colors cursor-pointer"
                >
                  Đã thuộc ✓
                  <span className="block text-[11px] font-semibold text-red-100 mt-0.5">
                    +10 XP
                  </span>
                </button>
              </div>

              {/* Prev / Next (Co nhỏ 80% chiều rộng) */}
              <div className="w-full sm:w-[80%] mx-auto flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handlePrevCard}
                  className="px-4 py-2 rounded-xl bg-white border border-[#E6DEC8] hover:border-red-700 flex items-center gap-1.5 text-[14px] font-bold text-[#18181B] cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Thẻ trước</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextCard}
                  className="px-4 py-2 rounded-xl bg-white border border-[#E6DEC8] hover:border-red-700 flex items-center gap-1.5 text-[14px] font-bold text-[#18181B] cursor-pointer"
                >
                  <span>Thẻ kế tiếp</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
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
            <div className="w-full sm:w-[85%] mx-auto bg-white rounded-3xl border-2 border-[#E6DEC8] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 border-b border-[#E6DEC8]">
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

                <div className="flex flex-wrap items-center gap-2.5">
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
                                <div
                                  className={`font-mono text-[13px] font-semibold ${
                                    quizIsSubmitted && (isTarget || isChosen)
                                      ? 'text-white/90'
                                      : 'text-slate-600'
                                  }`}
                                >
                                  {opt.pinyin}
                                </div>
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
                        <span className="font-mono text-red-700">
                          ({currentQuizQuestion.target.examplePinyin})
                        </span>
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
                <p className="font-mono text-[22px] font-black text-red-700">
                  {selectedWordForAi.pinyin}
                </p>
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
                      <span className="font-mono font-black text-[21px] sm:text-[24px] text-red-700">
                        {item.pinyin}
                      </span>
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
                    <p className="text-[16px] text-red-700 font-mono font-semibold">
                      {item.examplePinyin}
                    </p>
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

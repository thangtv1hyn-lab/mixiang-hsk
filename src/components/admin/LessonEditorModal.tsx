import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  Layers,
  FileQuestion,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  Volume2,
} from 'lucide-react';
import {
  Course,
  Lesson,
  VocabItem,
  GrammarPoint,
  PracticeQuestion,
  DialogueLine,
} from '../../types/hsk';
import { speakChinese } from '../../utils/audioSpeech';

interface LessonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  initialLesson?: Lesson | null; // null when creating new lesson manually
  onSaveLesson: (lesson: Lesson) => void;
}

export const LessonEditorModal: React.FC<LessonEditorModalProps> = ({
  isOpen,
  onClose,
  course,
  initialLesson,
  onSaveLesson,
}) => {
  const isEditing = !!initialLesson;

  const [activeTab, setActiveTab] = useState<
    'info' | 'vocab' | 'grammar' | 'practice' | 'dialogue'
  >('info');

  // Basic Info
  const [lessonNumber, setLessonNumber] = useState<number>(course.lessons.length + 1);
  const [title, setTitle] = useState('');
  const [vietnameseTitle, setVietnameseTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [description, setDescription] = useState('');

  // Collections
  const [vocabulary, setVocabulary] = useState<VocabItem[]>([]);
  const [grammar, setGrammar] = useState<GrammarPoint[]>([]);
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [dialogue, setDialogue] = useState<DialogueLine[]>([]);

  // 1. Vocab form state
  const [vocabWord, setVocabWord] = useState('');
  const [vocabPinyin, setVocabPinyin] = useState('');
  const [vocabSino, setVocabSino] = useState('');
  const [vocabMeaning, setVocabMeaning] = useState('');
  const [vocabExample, setVocabExample] = useState('');
  const [vocabExamplePinyin, setVocabExamplePinyin] = useState('');
  const [vocabExampleMeaning, setVocabExampleMeaning] = useState('');
  const [editingVocabId, setEditingVocabId] = useState<string | null>(null);

  // 2. Grammar form state
  const [grammarTitle, setGrammarTitle] = useState('');
  const [grammarStructure, setGrammarStructure] = useState('');
  const [grammarExplanation, setGrammarExplanation] = useState('');
  const [grammarExampleHanzi, setGrammarExampleHanzi] = useState('');
  const [grammarExamplePinyin, setGrammarExamplePinyin] = useState('');
  const [grammarExampleTrans, setGrammarExampleTrans] = useState('');
  const [editingGrammarId, setEditingGrammarId] = useState<string | null>(null);

  // 3. Practice question form state
  const [qType, setQType] = useState<'single_choice' | 'sentence_reorder' | 'fill_blank'>(
    'single_choice'
  );
  const [qQuestion, setQQuestion] = useState('');
  const [qPinyin, setQPinyin] = useState('');
  const [qOptA, setQOptA] = useState('');
  const [qOptB, setQOptB] = useState('');
  const [qOptC, setQOptC] = useState('');
  const [qOptD, setQOptD] = useState('');
  const [qCorrect, setQCorrect] = useState(0);
  const [qExplanation, setQExplanation] = useState('');
  const [editingQId, setEditingQId] = useState<string | null>(null);

  // 4. Dialogue form state
  const [dlgSpeaker, setDlgSpeaker] = useState('A');
  const [dlgChinese, setDlgChinese] = useState('');
  const [dlgPinyin, setDlgPinyin] = useState('');
  const [dlgVietnamese, setDlgVietnamese] = useState('');
  const [editingDlgId, setEditingDlgId] = useState<string | null>(null);

  // AI Assistant state
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [aiPromptTopic, setAiPromptTopic] = useState('Đi ăn nhà hàng và gọi món');

  useEffect(() => {
    if (initialLesson) {
      setLessonNumber(initialLesson.lessonNumber);
      setTitle(initialLesson.title);
      setVietnameseTitle(initialLesson.vietnameseTitle || initialLesson.title);
      setDurationMinutes(initialLesson.durationMinutes || 30);
      setDescription(initialLesson.description || '');
      setVocabulary(initialLesson.vocabulary ? [...initialLesson.vocabulary] : []);
      setGrammar(initialLesson.grammar ? [...initialLesson.grammar] : []);
      setPracticeQuestions(
        initialLesson.practiceQuestions ? [...initialLesson.practiceQuestions] : []
      );
      setDialogue(initialLesson.dialogue ? [...initialLesson.dialogue] : []);
    } else {
      setLessonNumber(course.lessons.length + 1);
      setTitle(`第${course.lessons.length + 1}课：`);
      setVietnameseTitle(`Bài ${course.lessons.length + 1}: `);
      setDurationMinutes(30);
      setDescription('');
      setVocabulary([]);
      setGrammar([]);
      setPracticeQuestions([]);
      setDialogue([]);
    }
    setActiveTab('info');
  }, [initialLesson, course, isOpen]);

  if (!isOpen) return null;

  // VOCABULARY CRUD
  const handleSaveVocab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vocabWord.trim() || !vocabMeaning.trim()) return;

    if (editingVocabId) {
      setVocabulary((prev) =>
        prev.map((v) =>
          v.id === editingVocabId
            ? {
                ...v,
                word: vocabWord.trim(),
                pinyin: vocabPinyin.trim(),
                sinoVietnamese: vocabSino.trim(),
                meaning: vocabMeaning.trim(),
                exampleSentence: vocabExample.trim() || `${vocabWord.trim()}。`,
                examplePinyin: vocabExamplePinyin.trim(),
                exampleMeaning: vocabExampleMeaning.trim(),
              }
            : v
        )
      );
      setEditingVocabId(null);
    } else {
      const newV: VocabItem = {
        id: `v-${Date.now()}`,
        word: vocabWord.trim(),
        pinyin: vocabPinyin.trim(),
        sinoVietnamese: vocabSino.trim(),
        meaning: vocabMeaning.trim(),
        level: course.level,
        exampleSentence: vocabExample.trim() || `${vocabWord.trim()}。`,
        examplePinyin: vocabExamplePinyin.trim(),
        exampleMeaning: vocabExampleMeaning.trim(),
      };
      setVocabulary((prev) => [...prev, newV]);
    }

    setVocabWord('');
    setVocabPinyin('');
    setVocabSino('');
    setVocabMeaning('');
    setVocabExample('');
    setVocabExamplePinyin('');
    setVocabExampleMeaning('');
  };

  const handleEditVocab = (v: VocabItem) => {
    setEditingVocabId(v.id);
    setVocabWord(v.word);
    setVocabPinyin(v.pinyin);
    setVocabSino(v.sinoVietnamese || '');
    setVocabMeaning(v.meaning);
    setVocabExample(v.exampleSentence || '');
    setVocabExamplePinyin(v.examplePinyin || '');
    setVocabExampleMeaning(v.exampleMeaning || '');
  };

  const handleDeleteVocab = (id: string) => {
    setVocabulary((prev) => prev.filter((v) => v.id !== id));
  };

  // GRAMMAR CRUD
  const handleSaveGrammar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grammarTitle.trim()) return;

    const examples = grammarExampleHanzi.trim()
      ? [
          {
            hanzi: grammarExampleHanzi.trim(),
            pinyin: grammarExamplePinyin.trim(),
            translation: grammarExampleTrans.trim(),
          },
        ]
      : [];

    if (editingGrammarId) {
      setGrammar((prev) =>
        prev.map((g) =>
          g.id === editingGrammarId
            ? {
                ...g,
                title: grammarTitle.trim(),
                structure: grammarStructure.trim(),
                explanation: grammarExplanation.trim(),
                examples: examples.length > 0 ? examples : g.examples,
              }
            : g
        )
      );
      setEditingGrammarId(null);
    } else {
      const newG: GrammarPoint = {
        id: `g-${Date.now()}`,
        title: grammarTitle.trim(),
        structure: grammarStructure.trim(),
        explanation: grammarExplanation.trim(),
        examples,
      };
      setGrammar((prev) => [...prev, newG]);
    }

    setGrammarTitle('');
    setGrammarStructure('');
    setGrammarExplanation('');
    setGrammarExampleHanzi('');
    setGrammarExamplePinyin('');
    setGrammarExampleTrans('');
  };

  const handleEditGrammar = (g: GrammarPoint) => {
    setEditingGrammarId(g.id);
    setGrammarTitle(g.title);
    setGrammarStructure(g.structure);
    setGrammarExplanation(g.explanation);
    if (g.examples && g.examples.length > 0) {
      setGrammarExampleHanzi(g.examples[0].hanzi);
      setGrammarExamplePinyin(g.examples[0].pinyin);
      setGrammarExampleTrans(g.examples[0].translation);
    }
  };

  const handleDeleteGrammar = (id: string) => {
    setGrammar((prev) => prev.filter((g) => g.id !== id));
  };

  // PRACTICE CRUD
  const handleSavePractice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qQuestion.trim()) return;

    const options = [qOptA.trim(), qOptB.trim(), qOptC.trim(), qOptD.trim()].filter(Boolean);

    if (editingQId) {
      setPracticeQuestions((prev) =>
        prev.map((q) =>
          q.id === editingQId
            ? {
                ...q,
                type: qType,
                question: qQuestion.trim(),
                pinyin: qPinyin.trim(),
                options: options.length > 0 ? options : q.options,
                correctAnswer: Number(qCorrect),
                explanation: qExplanation.trim(),
              }
            : q
        )
      );
      setEditingQId(null);
    } else {
      const newQ: PracticeQuestion = {
        id: `pq-${Date.now()}`,
        type: qType,
        question: qQuestion.trim(),
        pinyin: qPinyin.trim(),
        options: options.length >= 2 ? options : ['A. Đúng', 'B. Sai'],
        correctAnswer: Number(qCorrect),
        explanation: qExplanation.trim(),
      };
      setPracticeQuestions((prev) => [...prev, newQ]);
    }

    setQQuestion('');
    setQPinyin('');
    setQOptA('');
    setQOptB('');
    setQOptC('');
    setQOptD('');
    setQCorrect(0);
    setQExplanation('');
  };

  const handleEditPractice = (q: PracticeQuestion) => {
    setEditingQId(q.id);
    setQType(q.type);
    setQQuestion(q.question);
    setQPinyin(q.pinyin || '');
    setQOptA(q.options[0] || '');
    setQOptB(q.options[1] || '');
    setQOptC(q.options[2] || '');
    setQOptD(q.options[3] || '');
    setQCorrect(q.correctAnswer);
    setQExplanation(q.explanation || '');
  };

  const handleDeletePractice = (id: string) => {
    setPracticeQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  // DIALOGUE CRUD
  const handleSaveDialogue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dlgChinese.trim()) return;

    if (editingDlgId) {
      setDialogue((prev) =>
        prev.map((d) =>
          d.id === editingDlgId
            ? {
                ...d,
                speaker: dlgSpeaker.trim(),
                chinese: dlgChinese.trim(),
                pinyin: dlgPinyin.trim(),
                vietnamese: dlgVietnamese.trim(),
              }
            : d
        )
      );
      setEditingDlgId(null);
    } else {
      const newD: DialogueLine = {
        id: `dl-${Date.now()}`,
        speaker: dlgSpeaker.trim(),
        chinese: dlgChinese.trim(),
        pinyin: dlgPinyin.trim(),
        vietnamese: dlgVietnamese.trim(),
      };
      setDialogue((prev) => [...prev, newD]);
    }

    setDlgChinese('');
    setDlgPinyin('');
    setDlgVietnamese('');
  };

  const handleEditDialogue = (d: DialogueLine) => {
    setEditingDlgId(d.id);
    setDlgSpeaker(d.speaker);
    setDlgChinese(d.chinese);
    setDlgPinyin(d.pinyin);
    setDlgVietnamese(d.vietnamese);
  };

  const handleDeleteDialogue = (id: string) => {
    setDialogue((prev) => prev.filter((d) => d.id !== id));
  };

  // AI Auto-Drafting Assistant
  const handleAiDraftLesson = async () => {
    setIsAiDrafting(true);
    try {
      const res = await fetch('/api/gemini/admin-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lesson',
          topic: aiPromptTopic,
          level: course.level,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
        if (Array.isArray(data.vocabulary) && data.vocabulary.length > 0) {
          const formattedVocab: VocabItem[] = data.vocabulary.map((v: any, idx: number) => ({
            id: `v-ai-${Date.now()}-${idx}`,
            word: v.word || '',
            pinyin: v.pinyin || '',
            sinoVietnamese: v.sino || '',
            meaning: v.meaning || '',
            level: course.level,
            exampleSentence: v.example || '',
            examplePinyin: v.examplePinyin || '',
            exampleMeaning: v.exampleMeaning || '',
          }));
          setVocabulary((prev) => [...prev, ...formattedVocab]);
        }
        if (Array.isArray(data.grammar) && data.grammar.length > 0) {
          const formattedGrammar: GrammarPoint[] = data.grammar.map((g: any, idx: number) => ({
            id: `g-ai-${Date.now()}-${idx}`,
            title: g.title || '',
            structure: g.structure || '',
            explanation: g.explanation || '',
            examples: (g.examples || []).map((ex: any) =>
              typeof ex === 'string'
                ? { hanzi: ex, pinyin: '', translation: '' }
                : {
                    hanzi: ex.hanzi || '',
                    pinyin: ex.pinyin || '',
                    translation: ex.translation || '',
                  }
            ),
          }));
          setGrammar((prev) => [...prev, ...formattedGrammar]);
        }
        if (Array.isArray(data.dialogue) && data.dialogue.length > 0) {
          const formattedDialogue: DialogueLine[] = data.dialogue.map((d: any, idx: number) => ({
            id: `dl-ai-${Date.now()}-${idx}`,
            speaker: d.speaker || 'A',
            chinese: d.chinese || '',
            pinyin: d.pinyin || '',
            vietnamese: d.vietnamese || '',
          }));
          setDialogue((prev) => [...prev, ...formattedDialogue]);
        }
      }
    } catch (err) {
      console.error('AI draft error:', err);
    } finally {
      setIsAiDrafting(false);
    }
  };

  // FINAL SAVE LESSON
  const handleSaveWholeLesson = () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề bài học!');
      setActiveTab('info');
      return;
    }

    const lessonToSave: Lesson = {
      id: initialLesson ? initialLesson.id : `l-${Date.now()}`,
      courseId: course.id,
      level: course.level,
      lessonNumber: Number(lessonNumber),
      title: title.trim(),
      vietnameseTitle: vietnameseTitle.trim() || title.trim(),
      durationMinutes: Number(durationMinutes),
      description: description.trim(),
      vocabulary,
      grammar,
      practiceQuestions,
      dialogue,
    };

    onSaveLesson(lessonToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-1.5 sm:p-3 animate-in fade-in duration-200">
      <div className="bg-[#FDFBF6] rounded-3xl w-[98vw] max-w-[1720px] h-[95vh] max-h-[95vh] flex flex-col shadow-2xl overflow-hidden border-2 border-[#E8DFCE]">
        {/* Modal Top Bar (Red - Black Brand Gradient) */}
        <div className="px-6 py-5 bg-gradient-to-r from-red-600 via-red-700 to-[#18181B] text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-white/15 text-amber-300 flex items-center justify-center border border-white/25 shrink-0">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-serif text-[21px] sm:text-[26px] font-black text-white leading-tight truncate">
                  {isEditing ? `Chỉnh Sửa Bài Học: ${title}` : `Soạn Bài Học Mới (Thủ công)`}
                </h2>
                <span className="font-mono text-[14px] font-bold px-3.5 py-1 rounded-xl bg-black/35 text-amber-300 border border-amber-300/40 shrink-0">
                  {course.level}
                </span>
              </div>
              <p className="text-[16px] sm:text-[18px] text-rose-100 truncate mt-0.5">
                Khóa học: {course.vietnameseTitle} · Tự do thêm, sửa, xóa từ vựng, ngữ pháp, hội thoại và bài tập
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="p-2.5 rounded-2xl bg-white/10 text-white hover:bg-red-600 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* AI Quick Assistant Bar */}
        <div className="bg-[#FEFCE8] px-6 py-3.5 border-b border-[#E8DFCE] flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex flex-wrap items-center gap-3 text-[#18181B] flex-1 min-w-[280px]">
            <Sparkles className="w-6 h-6 text-amber-600 shrink-0" />
            <span className="text-[16px] font-extrabold">Hỗ trợ soạn nhanh bằng AI:</span>
            <input
              type="text"
              value={aiPromptTopic}
              onChange={(e) => setAiPromptTopic(e.target.value)}
              placeholder="Nhập chủ đề (vd: Mua sắm, Đặt phòng khách sạn...)"
              className="flex-1 min-w-[240px] max-w-xl px-4 py-2 rounded-xl border-2 border-amber-300 bg-white text-[#18181B] text-[16px] font-semibold focus:outline-none focus:border-red-600"
            />
          </div>
          <button
            type="button"
            onClick={handleAiDraftLesson}
            disabled={isAiDrafting}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-[15px] flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5" />
            <span>{isAiDrafting ? 'Đang tạo nội dung...' : 'AI Điền Mẫu Bài Học'}</span>
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 bg-[#F5EFEB] border-b border-[#E8DFCE] overflow-x-auto shrink-0">
          {[
            { id: 'info', label: '1. Thông tin chung', icon: Layers, count: null },
            { id: 'vocab', label: '2. Từ vựng', icon: BookOpen, count: vocabulary.length },
            { id: 'grammar', label: '3. Ngữ pháp', icon: HelpCircle, count: grammar.length },
            {
              id: 'practice',
              label: '4. Luyện tập & Câu hỏi',
              icon: FileQuestion,
              count: practiceQuestions.length,
            },
            { id: 'dialogue', label: '5. Hội thoại', icon: MessageSquare, count: dialogue.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[15px] sm:text-[16px] font-black transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-red-700 text-white shadow-sm'
                    : 'bg-white text-[#18181B] border border-[#E8DFCE] hover:border-red-400 hover:bg-[#FFF5F3]'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`ml-1 px-2.5 py-0.5 rounded-lg font-mono text-[14px] font-black tabular-nums ${
                      isActive ? 'bg-black/25 text-amber-300' : 'bg-[#F5EFEB] text-red-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body (Full-Width Workspace) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          {/* TAB 1: GENERAL INFO */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              <div className="xl:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-[#E8DFCE] space-y-6 shadow-xs">
                <h3 className="font-serif text-[22px] font-black text-[#18181B]">
                  Thông tin cơ bản của bài học
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                      Thứ tự bài học (Bài số):
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={lessonNumber}
                      onChange={(e) => setLessonNumber(Number(e.target.value))}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-mono text-[18px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                      Thời lượng ước tính (phút):
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-mono text-[18px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                    Tiêu đề bài học (Tiếng Trung) *:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 第一课：九月去北京旅游最好"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-serif text-[21px] font-black text-[#18181B] focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                    Tiêu đề bài học (Tiếng Việt):
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Bài 1: Tháng chín đi Bắc Kinh du lịch là tốt nhất"
                    value={vietnameseTitle}
                    onChange={(e) => setVietnameseTitle(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] text-[18px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                    Mô tả & Mục tiêu bài học:
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Nắm vững các mẫu câu biểu đạt ý kiến, từ vựng về thời tiết và du lịch..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] text-[18px] text-[#18181B] leading-relaxed focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Right Summary Column */}
              <div className="xl:col-span-4 bg-white p-6 sm:p-8 rounded-3xl border border-[#E8DFCE] space-y-5 shadow-xs">
                <h3 className="font-serif text-[21px] font-black text-[#18181B]">
                  Thống kê nội dung bài học
                </h3>
                <p className="text-[18px] text-slate-600 leading-snug">
                  Bấm vào từng thẻ bên dưới để chuyển nhanh sang mục chỉnh sửa chi tiết:
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('vocab')}
                    className="p-5 rounded-2xl bg-[#FFF5F3] border border-red-200 hover:border-red-500 text-left transition-all cursor-pointer space-y-1"
                  >
                    <span className="font-mono text-[26px] font-black text-red-600 block tabular-nums">
                      {vocabulary.length}
                    </span>
                    <span className="text-[16px] font-extrabold text-[#18181B] block">
                      Từ vựng
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('grammar')}
                    className="p-5 rounded-2xl bg-[#FEFCE8] border border-amber-200 hover:border-amber-500 text-left transition-all cursor-pointer space-y-1"
                  >
                    <span className="font-mono text-[26px] font-black text-amber-700 block tabular-nums">
                      {grammar.length}
                    </span>
                    <span className="text-[16px] font-extrabold text-[#18181B] block">
                      Ngữ pháp
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('practice')}
                    className="p-5 rounded-2xl bg-[#ECFDF5] border border-emerald-200 hover:border-emerald-500 text-left transition-all cursor-pointer space-y-1"
                  >
                    <span className="font-mono text-[26px] font-black text-emerald-700 block tabular-nums">
                      {practiceQuestions.length}
                    </span>
                    <span className="text-[16px] font-extrabold text-[#18181B] block">
                      Câu bài tập
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('dialogue')}
                    className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#E8DFCE] hover:border-red-500 text-left transition-all cursor-pointer space-y-1"
                  >
                    <span className="font-mono text-[26px] font-black text-[#18181B] block tabular-nums">
                      {dialogue.length}
                    </span>
                    <span className="text-[16px] font-extrabold text-[#18181B] block">
                      Lượt thoại
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VOCABULARY CRUD */}
          {activeTab === 'vocab' && (
            <div className="space-y-8">
              {/* Form Add / Edit Vocab */}
              <form
                onSubmit={handleSaveVocab}
                className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8DFCE] space-y-5 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-serif text-[21px] sm:text-[22px] font-black text-[#18181B] flex items-center gap-2.5">
                    <Plus className="w-7 h-7 text-red-600" />
                    <span>
                      {editingVocabId ? 'Chỉnh sửa từ vựng' : 'Thêm từ vựng mới vào bài học'}
                    </span>
                  </h3>
                  {editingVocabId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingVocabId(null);
                        setVocabWord('');
                        setVocabPinyin('');
                        setVocabSino('');
                        setVocabMeaning('');
                        setVocabExample('');
                        setVocabExamplePinyin('');
                        setVocabExampleMeaning('');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#FAF7F0] border border-[#E8DFCE] text-[#18181B] hover:bg-red-50 font-bold text-[14px] cursor-pointer"
                    >
                      Hủy sửa
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[15px] font-extrabold text-[#18181B]">
                        Chữ Hán *
                      </label>
                      {vocabWord && (
                        <button
                          type="button"
                          onClick={() => speakChinese(vocabWord)}
                          className="text-[14px] text-red-600 hover:text-red-700 flex items-center gap-1 font-bold cursor-pointer"
                          title="Nghe thử phát âm chữ Hán"
                        >
                          <Volume2 className="w-5 h-5" />
                          <span>Nghe đọc</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: 旅游"
                      value={vocabWord}
                      onChange={(e) => setVocabWord(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-serif font-black text-[21px] text-[#18181B] focus:border-red-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[15px] font-extrabold text-[#18181B] block mb-1.5">
                      Pīnyīn *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="lǚyóu"
                      value={vocabPinyin}
                      onChange={(e) => setVocabPinyin(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-mono text-[18px] font-bold text-red-700 focus:border-red-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[15px] font-extrabold text-[#18181B] block mb-1.5">
                      Âm Hán Việt
                    </label>
                    <input
                      type="text"
                      placeholder="Lữ du"
                      value={vocabSino}
                      onChange={(e) => setVocabSino(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] text-[18px] font-semibold text-[#18181B] focus:border-red-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[15px] font-extrabold text-[#18181B] block mb-1.5">
                      Nghĩa tiếng Việt *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Đi du lịch"
                      value={vocabMeaning}
                      onChange={(e) => setVocabMeaning(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] text-[18px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[15px] font-extrabold text-[#18181B]">
                        Câu ví dụ (Chữ Hán)
                      </label>
                      {vocabExample && (
                        <button
                          type="button"
                          onClick={() => speakChinese(vocabExample)}
                          className="text-[14px] text-red-600 hover:text-red-700 flex items-center gap-1 font-bold cursor-pointer"
                          title="Nghe phát âm câu ví dụ"
                        >
                          <Volume2 className="w-5 h-5" />
                          <span>Nghe ví dụ</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="我想去北京旅游。"
                      value={vocabExample}
                      onChange={(e) => setVocabExample(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-serif text-[19px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[15px] font-extrabold text-[#18181B] block mb-1.5">
                      Pinyin ví dụ
                    </label>
                    <input
                      type="text"
                      placeholder="Wǒ xiǎng qù Běijīng lǚyóu."
                      value={vocabExamplePinyin}
                      onChange={(e) => setVocabExamplePinyin(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-mono text-[16px] text-[#18181B] focus:border-red-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[15px] font-extrabold text-[#18181B] block mb-1.5">
                      Dịch câu ví dụ
                    </label>
                    <input
                      type="text"
                      placeholder="Tôi muốn đi du lịch Bắc Kinh."
                      value={vocabExampleMeaning}
                      onChange={(e) => setVocabExampleMeaning(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] text-[18px] text-[#18181B] focus:border-red-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-2xl bg-red-600 text-white font-black text-[16px] hover:bg-red-700 flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-6 h-6" />
                    <span>{editingVocabId ? 'Cập nhật từ vựng' : 'Lưu từ vựng vào bài'}</span>
                  </button>
                </div>
              </form>

              {/* Vocab Table */}
              <div className="space-y-4">
                <h3 className="font-serif text-[21px] font-black text-[#18181B]">
                  Danh sách từ vựng trong bài ({vocabulary.length} từ)
                </h3>

                {vocabulary.length === 0 ? (
                  <div className="p-10 text-center text-slate-600 bg-white rounded-3xl border-2 border-dashed border-[#E8DFCE] text-[18px] font-semibold">
                    Chưa có từ vựng nào trong bài. Hãy dùng biểu mẫu phía trên hoặc bấm nút AI Điền Mẫu để thêm từ mới!
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-3xl border border-[#E8DFCE] bg-white shadow-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F5EFEB] border-b border-[#E8DFCE] text-[#18181B] font-extrabold text-[15px]">
                          <th className="p-4 w-16 text-center">STT</th>
                          <th className="p-4">Chữ Hán</th>
                          <th className="p-4">Pīnyīn</th>
                          <th className="p-4">Hán Việt</th>
                          <th className="p-4">Nghĩa tiếng Việt</th>
                          <th className="p-4">Ví dụ</th>
                          <th className="p-4 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFE7D6] text-[16px]">
                        {vocabulary.map((item, idx) => (
                          <tr
                            key={item.id}
                            className="hover:bg-[#FFF5F3]/60 transition-colors"
                          >
                            <td className="p-4 text-center font-mono font-bold text-slate-500 text-[14px] tabular-nums">
                              #{String(idx + 1).padStart(2, '0')}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2.5">
                                <span className="font-serif font-black text-[#18181B] text-[22px]">
                                  {item.word}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => speakChinese(item.word)}
                                  className="p-2 rounded-xl text-red-600 hover:bg-red-100 cursor-pointer"
                                  title="Phát âm từ này"
                                >
                                  <Volume2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                            <td className="p-4 font-mono text-red-700 font-bold text-[18px]">
                              {item.pinyin}
                            </td>
                            <td className="p-4 text-slate-600 font-semibold">
                              {item.sinoVietnamese || '-'}
                            </td>
                            <td className="p-4 font-bold text-[#18181B] text-[18px]">
                              {item.meaning}
                            </td>
                            <td className="p-4 text-slate-700 max-w-md">
                              <div className="font-serif text-[18px] font-semibold text-[#18181B]">
                                {item.exampleSentence}
                              </div>
                              {item.exampleMeaning && (
                                <div className="text-[14px] text-slate-500">
                                  {item.exampleMeaning}
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-right space-x-2 shrink-0 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleEditVocab(item)}
                                className="px-3.5 py-2 rounded-xl bg-[#FAF7F0] border border-[#E8DFCE] text-[#18181B] hover:border-red-500 font-bold text-[14px] inline-flex items-center gap-1.5 cursor-pointer"
                                title="Sửa từ vựng"
                              >
                                <Edit3 className="w-5 h-5 text-red-600" />
                                <span>Sửa</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVocab(item.id)}
                                className="p-2.5 rounded-xl bg-[#FFF5F3] border border-red-200 text-red-600 hover:bg-red-600 hover:text-white cursor-pointer"
                                title="Xóa từ vựng"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: GRAMMAR CRUD */}
          {activeTab === 'grammar' && (
            <div className="space-y-8">
              <form
                onSubmit={handleSaveGrammar}
                className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8DFCE] space-y-5 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-serif text-[21px] sm:text-[22px] font-black text-[#18181B] flex items-center gap-2.5">
                    <Plus className="w-7 h-7 text-red-600" />
                    <span>
                      {editingGrammarId ? 'Chỉnh sửa điểm ngữ pháp' : 'Thêm điểm ngữ pháp mới'}
                    </span>
                  </h3>
                  {editingGrammarId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGrammarId(null);
                        setGrammarTitle('');
                        setGrammarStructure('');
                        setGrammarExplanation('');
                        setGrammarExampleHanzi('');
                        setGrammarExamplePinyin('');
                        setGrammarExampleTrans('');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#FAF7F0] border border-[#E8DFCE] text-[#18181B] font-bold text-[14px] cursor-pointer"
                    >
                      Hủy sửa
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[15px] font-extrabold text-[#18181B] block mb-1.5">
                      Tên điểm ngữ pháp *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Cấu trúc câu vị ngữ động từ"
                      value={grammarTitle}
                      onChange={(e) => setGrammarTitle(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] text-[18px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[15px] font-extrabold text-[#18181B] block mb-1.5">
                      Công thức cấu trúc
                    </label>
                    <input
                      type="text"
                      placeholder="Chủ ngữ + Động từ + Tân ngữ"
                      value={grammarStructure}
                      onChange={(e) => setGrammarStructure(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-mono text-[18px] font-bold text-red-700 focus:border-red-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[15px] font-extrabold text-[#18181B] block mb-1.5">
                    Giải thích chi tiết
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Dùng để diễn đạt hành động tác động lên đối tượng cụ thể..."
                    value={grammarExplanation}
                    onChange={(e) => setGrammarExplanation(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] text-[18px] text-[#18181B] leading-relaxed focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[15px] font-extrabold text-[#18181B] block mb-1.5">
                      Ví dụ chữ Hán
                    </label>
                    <input
                      type="text"
                      placeholder="我学汉语。"
                      value={grammarExampleHanzi}
                      onChange={(e) => setGrammarExampleHanzi(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-serif text-[19px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[15px] font-extrabold text-[#18181B] block mb-1.5">
                      Pinyin ví dụ
                    </label>
                    <input
                      type="text"
                      placeholder="Wǒ xué Hànyǔ."
                      value={grammarExamplePinyin}
                      onChange={(e) => setGrammarExamplePinyin(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-mono text-[16px] text-[#18181B] focus:border-red-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[15px] font-extrabold text-[#18181B] block mb-1.5">
                      Dịch ví dụ
                    </label>
                    <input
                      type="text"
                      placeholder="Tôi học tiếng Trung."
                      value={grammarExampleTrans}
                      onChange={(e) => setGrammarExampleTrans(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] text-[18px] text-[#18181B] focus:border-red-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-2xl bg-red-600 text-white font-black text-[16px] hover:bg-red-700 flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-6 h-6" />
                    <span>{editingGrammarId ? 'Cập nhật ngữ pháp' : 'Lưu điểm ngữ pháp'}</span>
                  </button>
                </div>
              </form>

              {/* Grammar List */}
              <div className="space-y-4">
                <h3 className="font-serif text-[21px] font-black text-[#18181B]">
                  Các điểm ngữ pháp ({grammar.length} mục)
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {grammar.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-6 rounded-3xl border border-[#E8DFCE] bg-white space-y-4 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-xl bg-[#18181B] text-amber-300 font-mono font-black text-[16px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h4 className="font-serif font-black text-[#18181B] text-[21px] leading-snug">
                            {item.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditGrammar(item)}
                            className="px-3.5 py-2 rounded-xl bg-[#FAF7F0] border border-[#E8DFCE] text-[#18181B] hover:border-red-500 font-bold text-[14px] inline-flex items-center gap-1.5 cursor-pointer"
                            title="Sửa ngữ pháp"
                          >
                            <Edit3 className="w-5 h-5 text-red-600" />
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGrammar(item.id)}
                            className="p-2.5 rounded-xl bg-[#FFF5F3] border border-red-200 text-red-600 hover:bg-red-600 hover:text-white cursor-pointer"
                            title="Xóa ngữ pháp"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {item.structure && (
                        <div className="p-4 bg-[#FEFCE8] border border-amber-200 rounded-2xl text-[#18181B] font-bold text-[18px]">
                          <span className="text-red-700 font-extrabold">Cấu trúc: </span>
                          <span>{item.structure}</span>
                        </div>
                      )}
                      <p className="text-[18px] text-slate-700 leading-relaxed">
                        {item.explanation}
                      </p>

                      {item.examples && item.examples.length > 0 && (
                        <div className="border-t border-[#EFE7D6] pt-3 space-y-2">
                          <span className="text-[14px] font-extrabold text-slate-600 block">
                            Ví dụ minh họa:
                          </span>
                          {item.examples.map((ex, exIdx) => (
                            <div
                              key={exIdx}
                              className="p-3.5 rounded-2xl bg-[#FDFBF6] border border-[#E8DFCE] text-[18px] space-y-0.5"
                            >
                              <div className="font-serif font-black text-[19px] text-[#18181B]">
                                {ex.hanzi}{' '}
                                {ex.pinyin && (
                                  <span className="font-mono text-[16px] text-red-600 font-bold">
                                    ({ex.pinyin})
                                  </span>
                                )}
                              </div>
                              <div className="text-[16px] text-slate-700">{ex.translation}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRACTICE QUESTIONS CRUD */}
          {activeTab === 'practice' && (
            <div className="space-y-8">
              <form
                onSubmit={handleSavePractice}
                className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8DFCE] space-y-5 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-serif text-[21px] sm:text-[22px] font-black text-[#18181B] flex items-center gap-2.5">
                    <Plus className="w-7 h-7 text-red-600" />
                    <span>
                      {editingQId ? 'Chỉnh sửa câu hỏi luyện tập' : 'Thêm câu hỏi luyện tập mới'}
                    </span>
                  </h3>
                  {editingQId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQId(null);
                        setQQuestion('');
                        setQPinyin('');
                        setQOptA('');
                        setQOptB('');
                        setQOptC('');
                        setQOptD('');
                        setQCorrect(0);
                        setQExplanation('');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#FAF7F0] border border-[#E8DFCE] text-[#18181B] font-bold text-[14px] cursor-pointer"
                    >
                      Hủy sửa
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div>
                    <label className="text-[15px] font-extrabold text-[#18181B] block mb-1.5">
                      Loại câu hỏi
                    </label>
                    <select
                      value={qType}
                      onChange={(e) => setQType(e.target.value as any)}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] text-[17px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
                    >
                      <option value="single_choice">Trắc nghiệm lựa chọn (Choice)</option>
                      <option value="fill_blank">Điền từ vào chỗ trống (Fill blank)</option>
                      <option value="sentence_reorder">Sắp xếp câu (Sentence reorder)</option>
                    </select>
                  </div>

                  <div className="lg:col-span-2">
                    <label className="text-[15px] font-extrabold text-[#18181B] block mb-1.5">
                      Nội dung câu hỏi *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Điền từ thích hợp: '我每天都____汉语。'"
                      value={qQuestion}
                      onChange={(e) => setQQuestion(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-serif text-[19px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[15px] font-extrabold text-[#18181B] block mb-1.5">
                    Pinyin hoặc gợi ý dịch câu hỏi
                  </label>
                  <input
                    type="text"
                    placeholder="Wǒ měitiān dōu ____ Hànyǔ."
                    value={qPinyin}
                    onChange={(e) => setQPinyin(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-mono text-[16px] text-[#18181B] focus:border-red-600 focus:outline-none"
                  />
                </div>

                {/* 4 Options */}
                <div className="space-y-3">
                  <span className="text-[15px] font-extrabold text-[#18181B] block">
                    Các lựa chọn đáp án (Tích chọn ô tròn ở đáp án đúng):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { idx: 0, val: qOptA, setVal: setQOptA, ph: 'A. 学习 (xuéxí)' },
                      { idx: 1, val: qOptB, setVal: setQOptB, ph: 'B. 吃饭 (chīfàn)' },
                      { idx: 2, val: qOptC, setVal: setQOptC, ph: 'C. 睡觉 (shuìjiào)' },
                      { idx: 3, val: qOptD, setVal: setQOptD, ph: 'D. 跑步 (pǎobù)' },
                    ].map((opt) => (
                      <div
                        key={opt.idx}
                        className={`flex items-center gap-3 p-2.5 rounded-2xl border-2 ${
                          qCorrect === opt.idx
                            ? 'bg-[#ECFDF5] border-emerald-500'
                            : 'bg-[#FDFBF6] border-[#E8DFCE]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="correctOpt"
                          checked={qCorrect === opt.idx}
                          onChange={() => setQCorrect(opt.idx)}
                          title="Đánh dấu đáp án đúng"
                          className="w-6 h-6 accent-emerald-600 ml-2 cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          placeholder={opt.ph}
                          value={opt.val}
                          onChange={(e) => opt.setVal(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8DFCE] text-[18px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[15px] font-extrabold text-[#18181B] block mb-1.5">
                    Giải thích đáp án
                  </label>
                  <input
                    type="text"
                    placeholder="学习汉语 nghĩa là học tiếng Trung, phù hợp ngữ cảnh nhất."
                    value={qExplanation}
                    onChange={(e) => setQExplanation(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] text-[18px] text-[#18181B] focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-2xl bg-red-600 text-white font-black text-[16px] hover:bg-red-700 flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-6 h-6" />
                    <span>{editingQId ? 'Cập nhật câu bài tập' : 'Lưu câu bài tập'}</span>
                  </button>
                </div>
              </form>

              {/* Questions List */}
              <div className="space-y-4">
                <h3 className="font-serif text-[21px] font-black text-[#18181B]">
                  Câu hỏi luyện tập ({practiceQuestions.length} câu)
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {practiceQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-6 rounded-3xl border border-[#E8DFCE] bg-white space-y-4 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="inline-block px-3 py-1 rounded-xl text-[14px] font-black bg-[#ECFDF5] text-emerald-800 border border-emerald-200">
                            Câu {idx + 1}
                          </span>
                          <h4 className="font-serif font-black text-[#18181B] text-[20px] leading-snug pt-1">
                            {q.question}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditPractice(q)}
                            className="px-3.5 py-2 rounded-xl bg-[#FAF7F0] border border-[#E8DFCE] text-[#18181B] hover:border-red-500 font-bold text-[14px] inline-flex items-center gap-1.5 cursor-pointer"
                            title="Sửa câu hỏi"
                          >
                            <Edit3 className="w-5 h-5 text-red-600" />
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePractice(q.id)}
                            className="p-2.5 rounded-xl bg-[#FFF5F3] border border-red-200 text-red-600 hover:bg-red-600 hover:text-white cursor-pointer"
                            title="Xóa câu hỏi"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {q.pinyin && (
                        <p className="font-mono text-red-700 text-[16px] font-semibold">
                          {q.pinyin}
                        </p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`p-3.5 rounded-2xl border text-[16px] ${
                              optIdx === q.correctAnswer
                                ? 'bg-[#ECFDF5] border-emerald-400 text-emerald-950 font-black'
                                : 'bg-[#FDFBF6] border-[#E8DFCE] text-slate-700 font-semibold'
                            }`}
                          >
                            {opt} {optIdx === q.correctAnswer && '✓ (Đúng)'}
                          </div>
                        ))}
                      </div>

                      {q.explanation && (
                        <p className="text-slate-700 text-[16px] pt-1">
                          <strong className="text-[#18181B]">Giải thích:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DIALOGUE CRUD */}
          {activeTab === 'dialogue' && (
            <div className="space-y-8">
              <form
                onSubmit={handleSaveDialogue}
                className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8DFCE] space-y-5 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-serif text-[21px] sm:text-[22px] font-black text-[#18181B] flex items-center gap-2.5">
                    <Plus className="w-7 h-7 text-red-600" />
                    <span>{editingDlgId ? 'Chỉnh sửa lượt thoại' : 'Thêm câu thoại mới'}</span>
                  </h3>
                  {editingDlgId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDlgId(null);
                        setDlgChinese('');
                        setDlgPinyin('');
                        setDlgVietnamese('');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#FAF7F0] border border-[#E8DFCE] text-[#18181B] font-bold text-[14px] cursor-pointer"
                    >
                      Hủy sửa
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[15px] font-extrabold text-[#18181B] block mb-1.5">
                      Nhân vật / Người nói
                    </label>
                    <input
                      type="text"
                      placeholder="A / B / Lý Minh / Vương Hoa"
                      value={dlgSpeaker}
                      onChange={(e) => setDlgSpeaker(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] text-[18px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[15px] font-extrabold text-[#18181B]">
                        Câu tiếng Trung *
                      </label>
                      {dlgChinese && (
                        <button
                          type="button"
                          onClick={() => speakChinese(dlgChinese)}
                          className="text-[14px] text-red-600 hover:text-red-700 flex items-center gap-1 font-bold cursor-pointer"
                          title="Nghe thử phát âm câu thoại"
                        >
                          <Volume2 className="w-5 h-5" />
                          <span>Nghe phát âm</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="我要去北京旅游，你觉得什么时候去最好？"
                      value={dlgChinese}
                      onChange={(e) => setDlgChinese(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-serif font-black text-[21px] text-[#18181B] focus:border-red-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[15px] font-extrabold text-[#18181B] block mb-1.5">
                      Pīnyīn
                    </label>
                    <input
                      type="text"
                      placeholder="Wǒ yào qù Běijīng lǚyóu, nǐ juéde shénme shíhou qù zuì hǎo?"
                      value={dlgPinyin}
                      onChange={(e) => setDlgPinyin(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-mono text-[16px] text-red-700 font-bold focus:border-red-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[15px] font-extrabold text-[#18181B] block mb-1.5">
                      Dịch nghĩa tiếng Việt
                    </label>
                    <input
                      type="text"
                      placeholder="Tôi muốn đi Bắc Kinh du lịch, bạn thấy đi khi nào là tốt nhất?"
                      value={dlgVietnamese}
                      onChange={(e) => setDlgVietnamese(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] text-[18px] text-[#18181B] focus:border-red-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-2xl bg-red-600 text-white font-black text-[16px] hover:bg-red-700 flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-6 h-6" />
                    <span>{editingDlgId ? 'Cập nhật câu thoại' : 'Lưu câu thoại'}</span>
                  </button>
                </div>
              </form>

              {/* Dialogue Lines List */}
              <div className="space-y-4">
                <h3 className="font-serif text-[21px] font-black text-[#18181B]">
                  Đoạn hội thoại ({dialogue.length} lượt thoại)
                </h3>

                <div className="space-y-3.5">
                  {dialogue.map((d, idx) => (
                    <div
                      key={d.id}
                      className="p-5 sm:p-6 rounded-3xl border border-[#E8DFCE] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <span className="px-3.5 py-1 rounded-xl text-[14px] font-black bg-[#FEFCE8] text-amber-900 border border-amber-200">
                            #{idx + 1} · {d.speaker}
                          </span>
                          <button
                            type="button"
                            onClick={() => speakChinese(d.chinese)}
                            className="px-3 py-1 rounded-xl bg-[#FFF5F3] text-red-600 hover:bg-red-600 hover:text-white cursor-pointer flex items-center gap-1.5 text-[14px] font-bold transition-colors"
                            title="Phát âm câu thoại này"
                          >
                            <Volume2 className="w-5 h-5" />
                            <span>Nghe</span>
                          </button>
                        </div>
                        <p className="font-serif font-black text-[#18181B] text-[22px] leading-snug pt-1">
                          {d.chinese}
                        </p>
                        {d.pinyin && (
                          <p className="text-red-600 text-[16px] font-mono font-bold">
                            {d.pinyin}
                          </p>
                        )}
                        <p className="text-slate-700 text-[18px] font-medium">{d.vietnamese}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditDialogue(d)}
                          className="px-4 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E8DFCE] text-[#18181B] hover:border-red-500 font-bold text-[14px] inline-flex items-center gap-1.5 cursor-pointer"
                          title="Sửa câu thoại"
                        >
                          <Edit3 className="w-5 h-5 text-red-600" />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDialogue(d.id)}
                          className="p-2.5 rounded-xl bg-[#FFF5F3] border border-red-200 text-red-600 hover:bg-red-600 hover:text-white cursor-pointer"
                          title="Xóa câu thoại"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-6 py-4 bg-[#FAF7F0] border-t border-[#E8DFCE] flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="text-[15px] sm:text-[16px] text-[#18181B] font-semibold">
            Tổng cộng: <strong className="text-red-600 font-mono">{vocabulary.length}</strong> từ ·{' '}
            <strong className="text-amber-700 font-mono">{grammar.length}</strong> ngữ pháp ·{' '}
            <strong className="text-emerald-700 font-mono">{practiceQuestions.length}</strong> bài tập ·{' '}
            <strong className="text-[#18181B] font-mono">{dialogue.length}</strong> câu thoại
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl bg-white border border-[#E8DFCE] text-[#18181B] hover:bg-[#F5EFEB] font-bold text-[16px] cursor-pointer"
            >
              Đóng / Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveWholeLesson}
              className="px-7 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-[16px] flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span>{isEditing ? 'Lưu cập nhật bài học' : 'Lưu bài học mới'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

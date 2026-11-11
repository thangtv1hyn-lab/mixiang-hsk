import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Save,
  Sparkles,
  Layers,
  FileQuestion,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  Volume2,
} from 'lucide-react';
import { Course, Lesson, VocabItem, GrammarPoint, PracticeQuestion, DialogueLine, HSKLevel } from '../../types/hsk';
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

  const [activeTab, setActiveTab] = useState<'info' | 'vocab' | 'grammar' | 'practice' | 'dialogue'>('info');

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

  // Modals / sub-forms for adding/editing items
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
  const [qType, setQType] = useState<'single_choice' | 'sentence_reorder' | 'fill_blank'>('single_choice');
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
      setPracticeQuestions(initialLesson.practiceQuestions ? [...initialLesson.practiceQuestions] : []);
      setDialogue(initialLesson.dialogue ? [...initialLesson.dialogue] : []);
    } else {
      // New lesson defaults
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

    // Reset form
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
                : { hanzi: ex.hanzi || '', pinyin: ex.pinyin || '', translation: ex.translation || '' }
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
        {/* Modal Top Bar */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center border border-rose-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  {isEditing ? `Chỉnh Sửa Bài Học: ${title}` : `Soạn Bài Học Mới (Thủ công)`}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {course.level}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Khóa học: {course.vietnameseTitle} • Tự do thêm, sửa, xóa từ vựng, ngữ pháp và bài tập
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Quick Assistant Bar */}
        <div className="bg-amber-50/80 px-6 py-2.5 border-b border-amber-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold">Hỗ trợ soạn nhanh bằng AI:</span>
            <input
              type="text"
              value={aiPromptTopic}
              onChange={(e) => setAiPromptTopic(e.target.value)}
              placeholder="Nhập chủ đề (vd: Mua sắm, Đặt phòng khách sạn...)"
              className="px-2.5 py-1 rounded-lg border border-amber-300 bg-white text-slate-800 w-52 sm:w-64 text-xs"
            />
          </div>
          <button
            type="button"
            onClick={handleAiDraftLesson}
            disabled={isAiDrafting}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAiDrafting ? 'Đang tạo nội dung...' : 'AI Điền Mẫu Bài Học'}</span>
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-slate-50 border-b border-slate-200 overflow-x-auto text-xs font-semibold shrink-0">
          {[
            { id: 'info', label: '1. Thông tin chung', icon: Layers, count: null },
            { id: 'vocab', label: '2. Từ vựng', icon: BookOpen, count: vocabulary.length },
            { id: 'grammar', label: '3. Ngữ pháp', icon: HelpCircle, count: grammar.length },
            { id: 'practice', label: '4. Luyện tập & Câu hỏi', icon: FileQuestion, count: practiceQuestions.length },
            { id: 'dialogue', label: '5. Hội thoại', icon: MessageSquare, count: dialogue.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-rose-600 text-rose-700 font-bold bg-white rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          {/* TAB 1: GENERAL INFO */}
          {activeTab === 'info' && (
            <div className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Thứ tự bài học (Lesson #):
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={lessonNumber}
                    onChange={(e) => setLessonNumber(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Thời lượng ước tính (phút):
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tiêu đề bài học (Tiếng Trung):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 第一课：九月去北京旅游最好"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tiêu đề bài học (Tiếng Việt):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bài 1: Tháng chín đi Bắc Kinh du lịch là tốt nhất"
                  value={vietnameseTitle}
                  onChange={(e) => setVietnameseTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Mô tả & Mục tiêu bài học:
                </label>
                <textarea
                  rows={4}
                  placeholder="Nắm vững các mẫu câu biểu đạt ý kiến, từ vựng về thời tiết và du lịch..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-800 block">Thống kê nội dung hiện có:</span>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-base font-bold text-rose-600 block">{vocabulary.length}</span>
                    <span className="text-[10px] text-slate-500">Từ vựng</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-base font-bold text-indigo-600 block">{grammar.length}</span>
                    <span className="text-[10px] text-slate-500">Ngữ pháp</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-base font-bold text-emerald-600 block">{practiceQuestions.length}</span>
                    <span className="text-[10px] text-slate-500">Câu bài tập</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-base font-bold text-amber-600 block">{dialogue.length}</span>
                    <span className="text-[10px] text-slate-500">Lượt thoại</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VOCABULARY CRUD */}
          {activeTab === 'vocab' && (
            <div className="space-y-6">
              {/* Form Add / Edit Vocab */}
              <form onSubmit={handleSaveVocab} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-rose-600" />
                    <span>{editingVocabId ? 'Chỉnh sửa từ vựng' : 'Thêm từ vựng mới vào bài'}</span>
                  </span>
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
                      className="text-slate-500 hover:text-slate-800 text-[11px]"
                    >
                      Hủy sửa
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[11px] font-semibold text-slate-600">Chữ Hán *</label>
                      {vocabWord && (
                        <button
                          type="button"
                          onClick={() => speakChinese(vocabWord)}
                          className="text-[10px] text-rose-600 hover:text-rose-700 flex items-center gap-0.5 font-bold cursor-pointer"
                          title="Nghe thử phát âm chữ Hán"
                        >
                          <Volume2 className="w-3 h-3" />
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
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Pīnyīn *</label>
                    <input
                      type="text"
                      required
                      placeholder="lǚyóu"
                      value={vocabPinyin}
                      onChange={(e) => setVocabPinyin(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Âm Hán Việt</label>
                    <input
                      type="text"
                      placeholder="Lữ du"
                      value={vocabSino}
                      onChange={(e) => setVocabSino(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Nghĩa tiếng Việt *</label>
                    <input
                      type="text"
                      required
                      placeholder="Đi du lịch"
                      value={vocabMeaning}
                      onChange={(e) => setVocabMeaning(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[11px] font-semibold text-slate-600">Câu ví dụ (Chữ Hán)</label>
                      {vocabExample && (
                        <button
                          type="button"
                          onClick={() => speakChinese(vocabExample)}
                          className="text-[10px] text-rose-600 hover:text-rose-700 flex items-center gap-0.5 font-bold cursor-pointer"
                          title="Nghe phát âm câu ví dụ"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Nghe ví dụ</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="我想去北京旅游。"
                      value={vocabExample}
                      onChange={(e) => setVocabExample(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Pinyin ví dụ</label>
                    <input
                      type="text"
                      placeholder="Wǒ xiǎng qù Běijīng lǚyóu."
                      value={vocabExamplePinyin}
                      onChange={(e) => setVocabExamplePinyin(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Dịch câu ví dụ</label>
                    <input
                      type="text"
                      placeholder="Tôi muốn đi du lịch Bắc Kinh."
                      value={vocabExampleMeaning}
                      onChange={(e) => setVocabExampleMeaning(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 flex items-center gap-1 shadow-xs cursor-pointer text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{editingVocabId ? 'Cập nhật từ vựng' : 'Lưu từ vựng'}</span>
                  </button>
                </div>
              </form>

              {/* Vocab Table */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  Danh sách từ vựng trong bài ({vocabulary.length} từ):
                </span>

                {vocabulary.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs">
                    Chưa có từ vựng nào trong bài. Hãy dùng form phía trên hoặc bấm nút AI Điền Mẫu để thêm từ mới!
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                          <th className="p-2.5 w-12 text-center">STT</th>
                          <th className="p-2.5">Chữ Hán</th>
                          <th className="p-2.5">Pīnyīn</th>
                          <th className="p-2.5">Hán Việt</th>
                          <th className="p-2.5">Nghĩa tiếng Việt</th>
                          <th className="p-2.5">Ví dụ</th>
                          <th className="p-2.5 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {vocabulary.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-2.5 text-center font-bold text-slate-400 text-[11px]">
                              #{String(idx + 1).padStart(2, '0')}
                            </td>
                            <td className="p-2.5 font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{item.word}</span>
                              <button
                                type="button"
                                onClick={() => speakChinese(item.word)}
                                className="p-1 rounded-full text-rose-500 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                                title="Phát âm từ này"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                            <td className="p-2.5 font-mono text-rose-700 font-medium">{item.pinyin}</td>
                            <td className="p-2.5 text-slate-500">{item.sinoVietnamese || '-'}</td>
                            <td className="p-2.5 font-medium text-slate-800">{item.meaning}</td>
                            <td className="p-2.5 text-slate-600 truncate max-w-xs">{item.exampleSentence}</td>
                            <td className="p-2.5 text-right space-x-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEditVocab(item)}
                                className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                                title="Sửa từ vựng"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVocab(item.id)}
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                title="Xóa từ vựng"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
            <div className="space-y-6">
              {/* Form Add / Edit Grammar */}
              <form onSubmit={handleSaveGrammar} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{editingGrammarId ? 'Chỉnh sửa điểm ngữ pháp' : 'Thêm điểm ngữ pháp mới'}</span>
                  </span>
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
                      className="text-slate-500 hover:text-slate-800 text-[11px]"
                    >
                      Hủy sửa
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Tên điểm ngữ pháp *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Cấu trúc câu vị ngữ động từ"
                      value={grammarTitle}
                      onChange={(e) => setGrammarTitle(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Công thức cấu trúc</label>
                    <input
                      type="text"
                      placeholder="Chủ ngữ + Động từ + Tân ngữ"
                      value={grammarStructure}
                      onChange={(e) => setGrammarStructure(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Giải thích chi tiết</label>
                  <textarea
                    rows={2}
                    placeholder="Dùng để diễn đạt hành động tác động lên đối tượng cụ thể..."
                    value={grammarExplanation}
                    onChange={(e) => setGrammarExplanation(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Ví dụ chữ Hán</label>
                    <input
                      type="text"
                      placeholder="我学汉语。"
                      value={grammarExampleHanzi}
                      onChange={(e) => setGrammarExampleHanzi(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Pinyin ví dụ</label>
                    <input
                      type="text"
                      placeholder="Wǒ xué Hànyǔ."
                      value={grammarExamplePinyin}
                      onChange={(e) => setGrammarExamplePinyin(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Dịch ví dụ</label>
                    <input
                      type="text"
                      placeholder="Tôi học tiếng Trung."
                      value={grammarExampleTrans}
                      onChange={(e) => setGrammarExampleTrans(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{editingGrammarId ? 'Cập nhật ngữ pháp' : 'Lưu điểm ngữ pháp'}</span>
                  </button>
                </div>
              </form>

              {/* Grammar List */}
              <div className="space-y-3">
                <span className="font-bold text-slate-800 block">
                  Các điểm ngữ pháp ({grammar.length} mục):
                </span>

                {grammar.map((item, idx) => (
                  <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditGrammar(item)}
                          className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                          title="Sửa ngữ pháp"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGrammar(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Xóa ngữ pháp"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {item.structure && (
                      <div className="p-2 bg-indigo-50/50 rounded-lg text-indigo-900 font-medium">
                        Cấu trúc: {item.structure}
                      </div>
                    )}
                    <p className="text-slate-600">{item.explanation}</p>

                    {item.examples && item.examples.length > 0 && (
                      <div className="border-t border-slate-100 pt-2 space-y-1">
                        <span className="text-[11px] font-semibold text-slate-500">Ví dụ:</span>
                        {item.examples.map((ex, exIdx) => (
                          <div key={exIdx} className="text-slate-700 pl-2 border-l-2 border-indigo-300">
                            <span className="font-bold text-slate-900">{ex.hanzi}</span>{' '}
                            <span className="text-rose-600">({ex.pinyin})</span> ➔ {ex.translation}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PRACTICE QUESTIONS CRUD */}
          {activeTab === 'practice' && (
            <div className="space-y-6">
              {/* Form Add / Edit Practice */}
              <form onSubmit={handleSavePractice} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{editingQId ? 'Chỉnh sửa câu hỏi luyện tập' : 'Thêm câu hỏi luyện tập mới'}</span>
                  </span>
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
                      className="text-slate-500 hover:text-slate-800 text-[11px]"
                    >
                      Hủy sửa
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Loại câu hỏi</label>
                    <select
                      value={qType}
                      onChange={(e) => setQType(e.target.value as any)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="single_choice">Trắc nghiệm lựa chọn (Choice)</option>
                      <option value="fill_blank">Điền từ vào chỗ trống (Fill blank)</option>
                      <option value="sentence_reorder">Sắp xếp câu (Sentence reorder)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Nội dung câu hỏi *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Điền từ thích hợp: '我每天都____汉语。'"
                      value={qQuestion}
                      onChange={(e) => setQQuestion(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Pinyin hoặc dịch câu hỏi</label>
                  <input
                    type="text"
                    placeholder="Wǒ měitiān dōu ____ Hànyǔ."
                    value={qPinyin}
                    onChange={(e) => setQPinyin(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                {/* 4 Options */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-600 block">Các lựa chọn đáp án:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={qCorrect === 0}
                        onChange={() => setQCorrect(0)}
                        title="Đánh dấu đáp án đúng"
                      />
                      <input
                        type="text"
                        placeholder="A. 学习 (xuéxí)"
                        value={qOptA}
                        onChange={(e) => setQOptA(e.target.value)}
                        className="w-full p-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={qCorrect === 1}
                        onChange={() => setQCorrect(1)}
                        title="Đánh dấu đáp án đúng"
                      />
                      <input
                        type="text"
                        placeholder="B. 吃饭 (chīfàn)"
                        value={qOptB}
                        onChange={(e) => setQOptB(e.target.value)}
                        className="w-full p-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={qCorrect === 2}
                        onChange={() => setQCorrect(2)}
                        title="Đánh dấu đáp án đúng"
                      />
                      <input
                        type="text"
                        placeholder="C. 睡觉 (shuìjiào)"
                        value={qOptC}
                        onChange={(e) => setQOptC(e.target.value)}
                        className="w-full p-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={qCorrect === 3}
                        onChange={() => setQCorrect(3)}
                        title="Đánh dấu đáp án đúng"
                      />
                      <input
                        type="text"
                        placeholder="D. 跑步 (pǎobù)"
                        value={qOptD}
                        onChange={(e) => setQOptD(e.target.value)}
                        className="w-full p-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Giải thích đáp án</label>
                  <input
                    type="text"
                    placeholder="学习汉语 nghĩa là học tiếng Trung, phù hợp ngữ cảnh nhất."
                    value={qExplanation}
                    onChange={(e) => setQExplanation(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{editingQId ? 'Cập nhật bài tập' : 'Lưu câu bài tập'}</span>
                  </button>
                </div>
              </form>

              {/* Questions List */}
              <div className="space-y-3">
                <span className="font-bold text-slate-800 block">
                  Câu hỏi luyện tập ({practiceQuestions.length} câu):
                </span>

                {practiceQuestions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Câu {idx + 1}
                        </span>
                        <h4 className="font-bold text-slate-900">{q.question}</h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditPractice(q)}
                          className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                          title="Sửa câu hỏi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePractice(q.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Xóa câu hỏi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {q.pinyin && <p className="text-slate-500 italic text-[11px]">{q.pinyin}</p>}

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-2 rounded-lg border text-xs ${
                            optIdx === q.correctAnswer
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          {opt} {optIdx === q.correctAnswer && '✓ (Đúng)'}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <p className="text-slate-500 text-[11px] pt-1">
                        <strong>Giải thích:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: DIALOGUE CRUD */}
          {activeTab === 'dialogue' && (
            <div className="space-y-6">
              {/* Form Add / Edit Dialogue */}
              <form onSubmit={handleSaveDialogue} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-amber-600" />
                    <span>{editingDlgId ? 'Chỉnh sửa lượt thoại' : 'Thêm câu thoại mới'}</span>
                  </span>
                  {editingDlgId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDlgId(null);
                        setDlgChinese('');
                        setDlgPinyin('');
                        setDlgVietnamese('');
                      }}
                      className="text-slate-500 hover:text-slate-800 text-[11px]"
                    >
                      Hủy sửa
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Người nói</label>
                    <input
                      type="text"
                      placeholder="A / B / Lý Minh / Vương Hoa"
                      value={dlgSpeaker}
                      onChange={(e) => setDlgSpeaker(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[11px] font-semibold text-slate-600">Câu tiếng Trung *</label>
                      {dlgChinese && (
                        <button
                          type="button"
                          onClick={() => speakChinese(dlgChinese)}
                          className="text-[10px] text-amber-700 hover:text-amber-800 flex items-center gap-0.5 font-bold cursor-pointer"
                          title="Tạo & nghe thử phát âm câu thoại"
                        >
                          <Volume2 className="w-3 h-3" />
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
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Pīnyīn</label>
                    <input
                      type="text"
                      placeholder="Wǒ yào qù Běijīng lǚyóu, nǐ juéde shénme shíhou qù zuì hǎo?"
                      value={dlgPinyin}
                      onChange={(e) => setDlgPinyin(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Dịch nghĩa tiếng Việt</label>
                    <input
                      type="text"
                      placeholder="Tôi muốn đi Bắc Kinh du lịch, bạn thấy đi khi nào là tốt nhất?"
                      value={dlgVietnamese}
                      onChange={(e) => setDlgVietnamese(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 flex items-center gap-1 shadow-xs cursor-pointer text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{editingDlgId ? 'Cập nhật câu thoại' : 'Lưu câu thoại'}</span>
                  </button>
                </div>
              </form>

              {/* Dialogue Lines List */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  Đoạn hội thoại ({dialogue.length} lượt thoại):
                </span>

                {dialogue.map((d, idx) => (
                  <div key={d.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          #{idx + 1} {d.speaker}:
                        </span>
                        <button
                          type="button"
                          onClick={() => speakChinese(d.chinese)}
                          className="p-1 rounded-full text-amber-700 hover:bg-amber-100 cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                          title="Phát âm câu thoại này"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Nghe</span>
                        </button>
                      </div>
                      <p className="font-bold text-slate-900 text-base">{d.chinese}</p>
                      {d.pinyin && <p className="text-rose-600 text-xs font-mono font-medium">{d.pinyin}</p>}
                      <p className="text-slate-600 text-xs">{d.vietnamese}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditDialogue(d)}
                        className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                        title="Sửa câu thoại"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDialogue(d.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Xóa câu thoại"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Tổng cộng: <strong>{vocabulary.length}</strong> từ • <strong>{grammar.length}</strong> ngữ pháp •{' '}
            <strong>{practiceQuestions.length}</strong> bài tập • <strong>{dialogue.length}</strong> câu thoại
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold text-xs"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveWholeLesson}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'Lưu cập nhật bài học' : 'Lưu bài học mới'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

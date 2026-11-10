import React, { useState, useEffect } from 'react';
import {
  X,
  GraduationCap,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  Volume2,
  Mic,
  PenTool,
  HelpCircle,
  FileText,
  Save,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Exam, ExamQuestion, ExamQuestionType, HSKLevel } from '../../types/hsk';

interface ExamEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam | null; // null if creating a new exam from scratch
  onSaveExam: (exam: Exam) => void;
}

export const ExamEditorModal: React.FC<ExamEditorModalProps> = ({
  isOpen,
  onClose,
  exam,
  onSaveExam,
}) => {
  const isEditing = !!exam;

  const [activeTab, setActiveTab] = useState<'info' | 'questions' | 'add_question' | 'excel_import' | 'ai_generate'>('questions');

  // Exam Meta
  const [level, setLevel] = useState<HSKLevel>('HSK 3');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(35);
  const [passScore, setPassScore] = useState(120);
  const [totalPoints, setTotalPoints] = useState(200);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);

  // Manual Question Form State
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [qSection, setQSection] = useState<'listening' | 'reading' | 'writing' | 'speaking'>('reading');
  const [qType, setQType] = useState<ExamQuestionType>('choice');
  const [qContent, setQContent] = useState('');
  const [qPinyin, setQPinyin] = useState('');
  const [qAudio, setQAudio] = useState('');
  const [qOptA, setQOptA] = useState('');
  const [qOptB, setQOptB] = useState('');
  const [qOptC, setQOptC] = useState('');
  const [qOptD, setQOptD] = useState('');
  const [qCorrectIndex, setQCorrectIndex] = useState(0);
  const [qCorrectText, setQCorrectText] = useState('');
  const [qExplanation, setQExplanation] = useState('');

  // Excel / CSV Import State
  const [excelText, setExcelText] = useState('');
  const [parsedPreviewQuestions, setParsedPreviewQuestions] = useState<ExamQuestion[]>([]);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // AI Exam Generator State
  const [aiTopic, setAiTopic] = useState('Đời sống, công việc và mua sắm');
  const [aiQuestionCount, setAiQuestionCount] = useState(6);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  useEffect(() => {
    if (exam) {
      setLevel(exam.level);
      setTitle(exam.title);
      setSubtitle(exam.subtitle || '');
      setTimeLimitMinutes(exam.timeLimitMinutes || 30);
      setPassScore(exam.passScore || 120);
      setTotalPoints(exam.totalPoints || 200);
      setQuestions(exam.questions ? [...exam.questions] : []);
    } else {
      setLevel('HSK 3');
      setTitle('Đề thi thử HSK 3 Chuẩn Quốc Tế');
      setSubtitle('Đề thi thử nghiệm định kỳ kiểm tra năng lực');
      setTimeLimitMinutes(35);
      setPassScore(120);
      setTotalPoints(200);
      setQuestions([]);
    }
    setActiveTab(exam ? 'questions' : 'info');
    setEditingQuestionId(null);
  }, [exam, isOpen]);

  if (!isOpen) return null;

  // Reset question form
  const resetQuestionForm = () => {
    setEditingQuestionId(null);
    setQSection('reading');
    setQType('choice');
    setQContent('');
    setQPinyin('');
    setQAudio('');
    setQOptA('');
    setQOptB('');
    setQOptC('');
    setQOptD('');
    setQCorrectIndex(0);
    setQCorrectText('');
    setQExplanation('');
  };

  // Populate form for editing
  const handleEditQuestion = (q: ExamQuestion) => {
    setEditingQuestionId(q.id);
    setQSection(q.section);
    setQType(q.questionType || (q.options?.length ? 'choice' : 'fill_blank'));
    setQContent(q.question);
    setQPinyin(q.pinyin || '');
    setQAudio(q.audioPrompt || '');
    setQOptA(q.options?.[0] || '');
    setQOptB(q.options?.[1] || '');
    setQOptC(q.options?.[2] || '');
    setQOptD(q.options?.[3] || '');
    setQCorrectIndex(q.correctAnswer ?? 0);
    setQCorrectText(q.correctText || '');
    setQExplanation(q.explanation || '');
    setActiveTab('add_question');
  };

  // Delete question
  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  // Save / Update question
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qContent.trim()) return;

    const options = [qOptA.trim(), qOptB.trim(), qOptC.trim(), qOptD.trim()].filter(Boolean);

    const questionObj: ExamQuestion = {
      id: editingQuestionId || `q-${Date.now()}`,
      section: qSection,
      questionType: qType,
      question: qContent.trim(),
      pinyin: qPinyin.trim() || undefined,
      audioPrompt: qAudio.trim() || (qSection === 'listening' ? qContent.trim() : undefined),
      options: qType === 'choice' ? (options.length >= 2 ? options : ['A. Đúng', 'B. Sai']) : undefined,
      correctAnswer: qType === 'choice' ? Number(qCorrectIndex) : undefined,
      correctText: qType !== 'choice' ? qCorrectText.trim() : undefined,
      explanation: qExplanation.trim(),
    };

    if (editingQuestionId) {
      setQuestions((prev) => prev.map((q) => (q.id === editingQuestionId ? questionObj : q)));
    } else {
      setQuestions((prev) => [...prev, questionObj]);
    }

    resetQuestionForm();
    setActiveTab('questions');
  };

  // EXCEL / CSV PARSER
  // Parse tab-separated or comma-separated lines
  const handleParseExcel = () => {
    if (!excelText.trim()) {
      setImportNotice('Vui lòng dán dữ liệu bảng từ Excel vào ô bên dưới!');
      return;
    }

    try {
      const lines = excelText.trim().split(/\r?\n/);
      const parsed: ExamQuestion[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Skip header if it starts with 'phần' or 'section'
        if (i === 0 && (line.toLowerCase().includes('phần') || line.toLowerCase().includes('section') || line.toLowerCase().includes('câu hỏi'))) {
          continue;
        }

        // Split by Tab (if copied from Excel) or Comma
        const delimiter = line.includes('\t') ? '\t' : ',';
        const cols = line.split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());

        if (cols.length < 3) continue;

        // Format expected:
        // Col 0: Section (nghe/doc/viet/noi or listening/reading/writing/speaking)
        // Col 1: Type (choice/fill_blank/writing/speaking)
        // Col 2: Question
        // Col 3: Pinyin/Audio
        // Col 4: Opt A
        // Col 5: Opt B
        // Col 6: Opt C
        // Col 7: Opt D
        // Col 8: Correct Answer (0, 1, 2, 3 or A, B, C, D or target text)
        // Col 9: Explanation

        const rawSec = cols[0]?.toLowerCase() || 'reading';
        let section: 'listening' | 'reading' | 'writing' | 'speaking' = 'reading';
        if (rawSec.includes('nghe') || rawSec.includes('listen')) section = 'listening';
        else if (rawSec.includes('viết') || rawSec.includes('write')) section = 'writing';
        else if (rawSec.includes('nói') || rawSec.includes('speak')) section = 'speaking';

        const rawType = cols[1]?.toLowerCase() || 'choice';
        let questionType: ExamQuestionType = 'choice';
        if (rawType.includes('điền') || rawType.includes('blank')) questionType = 'fill_blank';
        else if (rawType.includes('viết') || rawType.includes('writing')) questionType = 'writing';
        else if (rawType.includes('nói') || rawType.includes('speaking')) questionType = 'speaking';

        const question = cols[2] || 'Câu hỏi';
        const pinyinAudio = cols[3] || '';
        const optA = cols[4] || '';
        const optB = cols[5] || '';
        const optC = cols[6] || '';
        const optD = cols[7] || '';
        const rawAns = cols[8] || '0';
        const explanation = cols[9] || '';

        const options = [optA, optB, optC, optD].filter(Boolean);

        let correctAnswer = 0;
        let correctText = rawAns;

        if (rawAns.toUpperCase() === 'A' || rawAns === '0') correctAnswer = 0;
        else if (rawAns.toUpperCase() === 'B' || rawAns === '1') correctAnswer = 1;
        else if (rawAns.toUpperCase() === 'C' || rawAns === '2') correctAnswer = 2;
        else if (rawAns.toUpperCase() === 'D' || rawAns === '3') correctAnswer = 3;

        parsed.push({
          id: `q-ex-${Date.now()}-${i}`,
          section,
          questionType,
          question,
          pinyin: pinyinAudio,
          audioPrompt: section === 'listening' ? pinyinAudio || question : undefined,
          options: questionType === 'choice' && options.length >= 2 ? options : ['A. Đúng', 'B. Sai'],
          correctAnswer: questionType === 'choice' ? correctAnswer : undefined,
          correctText: questionType !== 'choice' ? correctText : undefined,
          explanation: explanation || 'Đáp án chính xác theo đề thi.',
        });
      }

      setParsedPreviewQuestions(parsed);
      setImportNotice(`Đã phân tích thành công ${parsed.length} câu hỏi từ bảng Excel!`);
    } catch (err: any) {
      setImportNotice(`Lỗi phân tích: ${err.message}`);
    }
  };

  // Confirm import parsed questions into exam
  const handleConfirmExcelImport = () => {
    if (parsedPreviewQuestions.length === 0) return;
    setQuestions((prev) => [...prev, ...parsedPreviewQuestions]);
    setParsedPreviewQuestions([]);
    setExcelText('');
    setImportNotice(null);
    setActiveTab('questions');
  };

  // Download Excel template
  const handleDownloadTemplate = () => {
    let csv = '\uFEFF';
    csv += 'Phần thi\tLoại câu hỏi\tNội dung câu hỏi\tPinyin/Audio\tĐáp án A\tĐáp án B\tĐáp án C\tĐáp án D\tĐáp án đúng\tGiải thích\n';
    csv += 'nghe\tchoice\tNghe đoạn băng và chọn đáp án đúng:\t我想去北京旅游。\tĐi Bắc Kinh\tĐi Thượng Hải\tỞ nhà\tĐi công tác\tA\t"去北京旅游" là đi du lịch Bắc Kinh.\n';
    csv += 'doc\tfill_blank\tĐiền từ thích hợp: 他每天____汉语。\tTā měitiān ____ Hànyǔ.\t\t\t\t\t学习\t学习汉语 nghĩa là học tiếng Trung.\n';
    csv += 'viet\twriting\tSắp xếp thành câu: 汉语 / 他 / 努力 / 学习\t\t\t\t\t\t他努力学习汉语。\tTrật tự chuẩn: Chủ ngữ + trạng từ + vị ngữ + tân ngữ.\n';
    csv += 'noi\tspeaking\tPhát âm câu sau bằng tiếng Trung:\t祝你考试顺利！\t\t\t\t\t祝你考试顺利！\tChú ý phát âm rõ thanh 4.\n';

    const blob = new Blob([csv], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Mau_Nhap_Cau_Hoi_HSK.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // AI EXAM GENERATOR
  const handleAiGenerateExam = async () => {
    setIsAiGenerating(true);
    try {
      const res = await fetch('/api/exams/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          topic: aiTopic,
          count: aiQuestionCount,
        }),
      });

      if (res.ok) {
        const generated = await res.json();
        if (generated.title) setTitle(generated.title);
        if (generated.subtitle) setSubtitle(generated.subtitle);
        if (Array.isArray(generated.questions) && generated.questions.length > 0) {
          setQuestions((prev) => [...prev, ...generated.questions]);
          setActiveTab('questions');
        }
      }
    } catch (err) {
      console.error('AI generate exam error:', err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // SAVE WHOLE EXAM
  const handleSaveWholeExam = () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề đề thi!');
      setActiveTab('info');
      return;
    }

    const examToSave: Exam = {
      id: exam ? exam.id : `exam-${Date.now()}`,
      level,
      title: title.trim(),
      subtitle: subtitle.trim() || `Đề thi thử HSK cấp độ ${level}`,
      timeLimitMinutes: Number(timeLimitMinutes),
      passScore: Number(passScore),
      totalPoints: Number(totalPoints),
      questions,
    };

    onSaveExam(examToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  {isEditing ? `Chỉnh Sửa Đề Thi: ${title}` : `Tạo Đề Thi Mới`}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {level}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Thêm câu hỏi trắc nghiệm, điền từ, viết, phát âm hoặc nhập hàng loạt từ Excel
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

        {/* Action Tabs Bar */}
        <div className="flex items-center gap-1.5 px-6 pt-3 bg-slate-50 border-b border-slate-200 overflow-x-auto text-xs font-semibold shrink-0">
          {[
            { id: 'questions', label: `1. Danh sách câu hỏi (${questions.length})`, icon: HelpCircle },
            { id: 'add_question', label: editingQuestionId ? '2. Sửa câu hỏi' : '2. Thêm câu hỏi thủ công', icon: Plus },
            { id: 'excel_import', label: '3. Thêm câu hỏi bằng Excel / Bảng', icon: FileSpreadsheet },
            { id: 'ai_generate', label: '4. Tạo đề thi bằng AI', icon: Sparkles },
            { id: 'info', label: '5. Cài đặt kỳ thi', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-600 text-indigo-700 font-bold bg-white rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          {/* TAB 1: QUESTIONS LIST */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Bộ câu hỏi trong đề thi ({questions.length} câu)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Bao gồm các phần: Nghe hiểu, Đọc hiểu, Viết và Luyện nói
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetQuestionForm();
                      setActiveTab('add_question');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm câu hỏi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('excel_import')}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Nhập từ Excel</span>
                  </button>
                </div>
              </div>

              {questions.length === 0 ? (
                <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs">Chưa có câu hỏi nào trong đề thi này.</p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      onClick={() => setActiveTab('add_question')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold"
                    >
                      Thêm câu hỏi đầu tiên
                    </button>
                    <button
                      onClick={() => setActiveTab('ai_generate')}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold"
                    >
                      Dùng AI tạo tự động
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, idx) => {
                    const qType = q.questionType || (q.options?.length ? 'choice' : 'fill_blank');
                    return (
                      <div
                        key={q.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2 hover:border-indigo-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                              {idx + 1}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                q.section === 'listening'
                                  ? 'bg-blue-100 text-blue-800'
                                  : q.section === 'reading'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : q.section === 'writing'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              Phần {q.section === 'listening' ? 'Nghe' : q.section === 'reading' ? 'Đọc' : q.section === 'writing' ? 'Viết' : 'Nói'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {qType === 'choice'
                                ? 'Trắc nghiệm (4 đáp án)'
                                : qType === 'fill_blank'
                                ? 'Điền đáp án'
                                : qType === 'writing'
                                ? 'Viết câu'
                                : 'Luyện phát âm'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEditQuestion(q)}
                              className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                              title="Sửa câu hỏi"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Xóa câu hỏi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="font-bold text-slate-900 text-sm">{q.question}</p>
                        {q.pinyin && <p className="text-slate-500 italic text-[11px]">{q.pinyin}</p>}

                        {/* Rendering choices or expected text */}
                        {qType === 'choice' && q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
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
                        )}

                        {qType !== 'choice' && (
                          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900">
                            <span className="font-bold">Đáp án chuẩn: </span>
                            <span className="font-mono">{q.correctText}</span>
                          </div>
                        )}

                        {q.explanation && (
                          <p className="text-slate-500 text-[11px] pt-0.5">
                            <strong>Giải thích:</strong> {q.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADD / EDIT QUESTION FORM */}
          {activeTab === 'add_question' && (
            <form onSubmit={handleSaveQuestion} className="space-y-4 max-w-2xl bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span>{editingQuestionId ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}</span>
                </h4>
                {editingQuestionId && (
                  <button
                    type="button"
                    onClick={resetQuestionForm}
                    className="text-slate-500 hover:text-slate-800 text-[11px]"
                  >
                    Hủy sửa
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phần thi (Section):</label>
                  <select
                    value={qSection}
                    onChange={(e) => setQSection(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="listening">Nghe hiểu (Listening)</option>
                    <option value="reading">Đọc hiểu (Reading)</option>
                    <option value="writing">Viết (Writing)</option>
                    <option value="speaking">Nói & Phát âm (Speaking)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hình thức trả lời:</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as ExamQuestionType)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-indigo-700"
                  >
                    <option value="choice">Chọn đáp án (Trắc nghiệm A, B, C, D)</option>
                    <option value="fill_blank">Điền đáp án (Vào ô trống ____)</option>
                    <option value="writing">Viết (Sắp xếp từ / Viết câu hoàn chỉnh)</option>
                    <option value="speaking">Nói (Ghi âm & Phát âm chuẩn)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nội dung câu hỏi *:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ví dụ: Nghe đoạn băng và chọn đáp án đúng / Điền từ thích hợp vào chỗ trống..."
                  value={qContent}
                  onChange={(e) => setQContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Pīnyīn (nếu có):</label>
                  <input
                    type="text"
                    placeholder="Qǐng tīng..."
                    value={qPinyin}
                    onChange={(e) => setQPinyin(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nội dung audio TTS đọc:</label>
                  <input
                    type="text"
                    placeholder="我想去北京旅游。"
                    value={qAudio}
                    onChange={(e) => setQAudio(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* Multiple Choice Options */}
              {qType === 'choice' && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-700 block">4 Lựa chọn & Đáp án đúng:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-slate-200">
                      <input
                        type="radio"
                        name="examCorrect"
                        checked={qCorrectIndex === 0}
                        onChange={() => setQCorrectIndex(0)}
                        title="Đánh dấu đáp án đúng"
                        className="ml-2"
                      />
                      <input
                        type="text"
                        placeholder="A. Lựa chọn 1"
                        value={qOptA}
                        onChange={(e) => setQOptA(e.target.value)}
                        className="w-full p-1.5 border-none outline-hidden text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-slate-200">
                      <input
                        type="radio"
                        name="examCorrect"
                        checked={qCorrectIndex === 1}
                        onChange={() => setQCorrectIndex(1)}
                        title="Đánh dấu đáp án đúng"
                        className="ml-2"
                      />
                      <input
                        type="text"
                        placeholder="B. Lựa chọn 2"
                        value={qOptB}
                        onChange={(e) => setQOptB(e.target.value)}
                        className="w-full p-1.5 border-none outline-hidden text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-slate-200">
                      <input
                        type="radio"
                        name="examCorrect"
                        checked={qCorrectIndex === 2}
                        onChange={() => setQCorrectIndex(2)}
                        title="Đánh dấu đáp án đúng"
                        className="ml-2"
                      />
                      <input
                        type="text"
                        placeholder="C. Lựa chọn 3"
                        value={qOptC}
                        onChange={(e) => setQOptC(e.target.value)}
                        className="w-full p-1.5 border-none outline-hidden text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-slate-200">
                      <input
                        type="radio"
                        name="examCorrect"
                        checked={qCorrectIndex === 3}
                        onChange={() => setQCorrectIndex(3)}
                        title="Đánh dấu đáp án đúng"
                        className="ml-2"
                      />
                      <input
                        type="text"
                        placeholder="D. Lựa chọn 4"
                        value={qOptD}
                        onChange={(e) => setQOptD(e.target.value)}
                        className="w-full p-1.5 border-none outline-hidden text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Fill Blank / Writing / Speaking Expected Text */}
              {qType !== 'choice' && (
                <div className="space-y-1 pt-2 border-t border-slate-200">
                  <label className="font-semibold text-slate-700 block">
                    {qType === 'fill_blank'
                      ? 'Từ/Cụm từ cần điền vào chỗ trống *:'
                      : qType === 'writing'
                      ? 'Câu viết chuẩn hoàn chỉnh *:'
                      : 'Câu chữ Hán học viên cần phát âm *:'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 所以 / 他每天努力学习汉语。 / 祝你考试顺利！"
                    value={qCorrectText}
                    onChange={(e) => setQCorrectText(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-indigo-900"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Giải thích chi tiết:</label>
                <input
                  type="text"
                  placeholder="Giải thích ngữ pháp, từ vựng và lý do chọn đáp án này..."
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('questions')}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingQuestionId ? 'Lưu cập nhật câu hỏi' : 'Lưu câu hỏi vào đề'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: EXCEL / CSV IMPORT */}
          {activeTab === 'excel_import' && (
            <div className="space-y-4 max-w-3xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <div>
                  <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <span>Thêm câu hỏi hàng loạt bằng Excel</span>
                  </h4>
                  <p className="text-xs text-emerald-800">
                    Bạn có thể copy bảng từ Microsoft Excel hoặc Google Sheets rồi dán trực tiếp vào ô bên dưới.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold hover:bg-emerald-100/60 flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tải file Excel mẫu (.xls)</span>
                </button>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Dán nội dung bảng tính Excel vào đây (Copy từ Excel và Paste):
                </label>
                <textarea
                  rows={6}
                  value={excelText}
                  onChange={(e) => setExcelText(e.target.value)}
                  placeholder={`Phần thi\tLoại câu\tNội dung câu hỏi\tPinyin\tĐáp án A\tĐáp án B\tĐáp án C\tĐáp án D\tĐáp án đúng\tGiải thích\nnghe\tchoice\tNghe đoạn băng và chọn đáp án:\tWǒ xiǎng...\tĐi Bắc Kinh\tĐi Thượng Hải\tỞ nhà\tĐi xa\tA\tGiải thích...`}
                  className="w-full p-3 rounded-2xl border border-slate-200 bg-white font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Hỗ trợ cả 4 loại câu: <code>choice</code> (trắc nghiệm), <code>fill_blank</code> (điền từ), <code>writing</code> (viết), <code>speaking</code> (nói)
                </span>
                <button
                  type="button"
                  onClick={handleParseExcel}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Phân tích dữ liệu bảng
                </button>
              </div>

              {importNotice && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-medium">
                  {importNotice}
                </div>
              )}

              {/* Preview parsed questions */}
              {parsedPreviewQuestions.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      Xem trước ({parsedPreviewQuestions.length} câu hỏi hợp lệ):
                    </span>
                    <button
                      type="button"
                      onClick={handleConfirmExcelImport}
                      className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Xác nhận nhập {parsedPreviewQuestions.length} câu vào đề thi</span>
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
                    {parsedPreviewQuestions.map((q, idx) => (
                      <div key={idx} className="p-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">Câu {idx + 1}:</span>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {q.section} • {q.questionType}
                          </span>
                          <span className="font-semibold text-slate-900 truncate">{q.question}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Đáp án đúng: <strong>{q.questionType === 'choice' ? `Đáp án ${['A', 'B', 'C', 'D'][q.correctAnswer ?? 0]}` : q.correctText}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AI EXAM GENERATOR */}
          {activeTab === 'ai_generate' && (
            <div className="space-y-4 max-w-xl bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-5 rounded-2xl border border-amber-200/80">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Trình sinh Đề thi HSK tự động bằng AI (Gemini)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hệ thống AI sẽ tự động biên soạn đề thi chuẩn hóa có đầy đủ 4 dạng câu hỏi (trắc nghiệm, điền khuyết, viết và nói) theo đúng cấp độ {level} và chủ đề bạn chỉ định.
              </p>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Chủ đề đề thi:</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Ví dụ: Giao tiếp văn phòng, Du lịch Bắc Kinh, Mua sắm siêu thị..."
                  className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Cấp độ HSK:</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as HSKLevel)}
                    className="w-full p-2.5 rounded-xl border border-amber-300 bg-white"
                  >
                    <option value="HSK 1">HSK 1</option>
                    <option value="HSK 2">HSK 2</option>
                    <option value="HSK 3">HSK 3</option>
                    <option value="HSK 4">HSK 4</option>
                    <option value="HSK 5">HSK 5</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Số lượng câu hỏi:</label>
                  <input
                    type="number"
                    min={4}
                    max={20}
                    value={aiQuestionCount}
                    onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-amber-300 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAiGenerateExam}
                  disabled={isAiGenerating}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAiGenerating ? 'AI đang biên soạn đề thi...' : 'Bắt đầu AI Tạo Đề Thi'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: EXAM GENERAL SETTINGS */}
          {activeTab === 'info' && (
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Cấp độ HSK:</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as HSKLevel)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="HSK 1">HSK 1</option>
                  <option value="HSK 2">HSK 2</option>
                  <option value="HSK 3">HSK 3</option>
                  <option value="HSK 4">HSK 4</option>
                  <option value="HSK 5">HSK 5</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tên đề thi *:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đề thi thử HSK 3 Chuẩn Quốc Tế - Đề số 01"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mô tả phụ đề:</label>
                <input
                  type="text"
                  placeholder="Đề thi thử nghiệm định kỳ kiểm tra năng lực HSK 3"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Thời gian (phút):</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Điểm đạt chuẩn:</label>
                  <input
                    type="number"
                    min={60}
                    max={300}
                    value={passScore}
                    onChange={(e) => setPassScore(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tổng điểm tối đa:</label>
                  <input
                    type="number"
                    min={100}
                    max={300}
                    value={totalPoints}
                    onChange={(e) => setTotalPoints(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Hiện có <strong>{questions.length}</strong> câu hỏi • Thời gian <strong>{timeLimitMinutes}</strong> phút • Điểm đạt <strong>{passScore}/{totalPoints}</strong>
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
              onClick={handleSaveWholeExam}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'Lưu cập nhật đề thi' : 'Lưu đề thi mới'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

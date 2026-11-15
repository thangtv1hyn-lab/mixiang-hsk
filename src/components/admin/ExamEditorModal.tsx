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
  CheckCircle2,
  HelpCircle,
  FileText,
  Save,
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

  const [activeTab, setActiveTab] = useState<
    'info' | 'questions' | 'add_question' | 'excel_import' | 'ai_generate'
  >('questions');

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
  const [qSection, setQSection] = useState<'listening' | 'reading' | 'writing' | 'speaking'>(
    'reading'
  );
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

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

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
      options:
        qType === 'choice'
          ? options.length >= 2
            ? options
            : ['A. Đúng', 'B. Sai']
          : undefined,
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

        if (
          i === 0 &&
          (line.toLowerCase().includes('phần') ||
            line.toLowerCase().includes('section') ||
            line.toLowerCase().includes('câu hỏi'))
        ) {
          continue;
        }

        const delimiter = line.includes('\t') ? '\t' : ',';
        const cols = line.split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());

        if (cols.length < 3) continue;

        const rawSec = cols[0]?.toLowerCase() || 'reading';
        let section: 'listening' | 'reading' | 'writing' | 'speaking' = 'reading';
        if (rawSec.includes('nghe') || rawSec.includes('listen')) section = 'listening';
        else if (rawSec.includes('viết') || rawSec.includes('write')) section = 'writing';
        else if (rawSec.includes('nói') || rawSec.includes('speak')) section = 'speaking';

        const rawType = cols[1]?.toLowerCase() || 'choice';
        let questionType: ExamQuestionType = 'choice';
        if (rawType.includes('điền') || rawType.includes('blank')) questionType = 'fill_blank';
        else if (rawType.includes('viết') || rawType.includes('writing')) questionType = 'writing';
        else if (rawType.includes('nói') || rawType.includes('speaking'))
          questionType = 'speaking';

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
        const correctText = rawAns;

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
          options:
            questionType === 'choice' && options.length >= 2
              ? options
              : ['A. Đúng', 'B. Sai'],
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

  const handleConfirmExcelImport = () => {
    if (parsedPreviewQuestions.length === 0) return;
    setQuestions((prev) => [...prev, ...parsedPreviewQuestions]);
    setParsedPreviewQuestions([]);
    setExcelText('');
    setImportNotice(null);
    setActiveTab('questions');
  };

  const handleDownloadTemplate = () => {
    let csv = '\uFEFF';
    csv +=
      'Phần thi\tLoại câu hỏi\tNội dung câu hỏi\tPinyin/Audio\tĐáp án A\tĐáp án B\tĐáp án C\tĐáp án D\tĐáp án đúng\tGiải thích\n';
    csv +=
      'nghe\tchoice\tNghe đoạn băng và chọn đáp án đúng:\t我想去北京旅游。\tĐi Bắc Kinh\tĐi Thượng Hải\tỞ nhà\tĐi công tác\tA\t"去北京旅游" là đi du lịch Bắc Kinh.\n';
    csv +=
      'doc\tfill_blank\tĐiền từ thích hợp: 他每天____汉语。\tTā měitiān ____ Hànyǔ.\t\t\t\t\t学习\t学习汉语 nghĩa là học tiếng Trung.\n';
    csv +=
      'viet\twriting\tSắp xếp thành câu: 汉语 / 他 / 努力 / 学习\t\t\t\t\t\t他努力学习汉语。\tTrật tự chuẩn: Chủ ngữ + trạng từ + vị ngữ + tân ngữ.\n';
    csv +=
      'noi\tspeaking\tPhát âm câu sau bằng tiếng Trung:\t祝你考试顺利！\t\t\t\t\t祝你考试顺利！\tChú ý phát âm rõ thanh 4.\n';

    const blob = new Blob([csv], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Mau_Nhap_Cau_Hoi_HSK.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-1.5 sm:p-3 animate-in fade-in duration-200">
      <div className="bg-[#FDFBF6] rounded-3xl w-[98vw] max-w-[1720px] h-[95vh] max-h-[95vh] flex flex-col shadow-2xl overflow-hidden border-2 border-[#E8DFCE]">
        {/* Top Header (Red - Black Brand Gradient) */}
        <div className="px-6 py-5 bg-gradient-to-r from-red-600 via-red-700 to-[#18181B] text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-white/15 text-amber-300 flex items-center justify-center border border-white/25 shrink-0">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-serif text-[21px] sm:text-[26px] font-black text-white leading-tight truncate">
                  {isEditing ? `Chỉnh Sửa Đề Thi: ${title}` : `Tạo Đề Thi Mới`}
                </h2>
                <span className="font-mono text-[14px] font-bold px-3.5 py-1 rounded-xl bg-black/35 text-amber-300 border border-amber-300/40 shrink-0">
                  {level}
                </span>
              </div>
              <p className="text-[16px] sm:text-[18px] text-rose-100 truncate mt-0.5">
                Thêm câu hỏi trắc nghiệm, điền từ, viết, phát âm hoặc nhập hàng loạt từ bảng Excel
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

        {/* Action Tabs Bar */}
        <div className="flex items-center gap-2 px-6 py-3 bg-[#F5EFEB] border-b border-[#E8DFCE] overflow-x-auto shrink-0">
          {[
            {
              id: 'questions',
              label: `1. Danh sách câu hỏi (${questions.length})`,
              icon: HelpCircle,
            },
            {
              id: 'add_question',
              label: editingQuestionId ? '2. Sửa câu hỏi' : '2. Thêm câu hỏi thủ công',
              icon: Plus,
            },
            {
              id: 'excel_import',
              label: '3. Thêm bằng Excel / Bảng',
              icon: FileSpreadsheet,
            },
            { id: 'ai_generate', label: '4. Tạo đề thi bằng AI', icon: Sparkles },
            { id: 'info', label: '5. Cài đặt kỳ thi', icon: FileText },
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
              </button>
            );
          })}
        </div>

        {/* Content Body (Full-Width Workspace) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          {/* TAB 1: QUESTIONS LIST */}
          {activeTab === 'questions' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E8DFCE] shadow-2xs">
                <div>
                  <h3 className="font-serif text-[21px] sm:text-[22px] font-black text-[#18181B]">
                    Bộ câu hỏi trong đề thi ({questions.length} câu)
                  </h3>
                  <p className="text-[18px] text-slate-600">
                    Bao gồm các phần: Nghe hiểu, Đọc hiểu, Viết và Luyện nói
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetQuestionForm();
                      setActiveTab('add_question');
                    }}
                    className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-[16px] flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-6 h-6" />
                    <span>Thêm câu hỏi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('excel_import')}
                    className="px-5 py-3 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] hover:bg-white text-[#18181B] font-bold text-[16px] flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
                    <span>Nhập từ Excel</span>
                  </button>
                </div>
              </div>

              {questions.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-[#E8DFCE] space-y-5">
                  <GraduationCap className="w-14 h-14 text-red-600 mx-auto" />
                  <p className="text-[19px] font-bold text-[#18181B]">
                    Chưa có câu hỏi nào trong đề thi này.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('add_question')}
                      className="px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-[16px] cursor-pointer"
                    >
                      Thêm câu hỏi đầu tiên
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('ai_generate')}
                      className="px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-[16px] cursor-pointer"
                    >
                      Dùng AI tạo tự động
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {questions.map((q, idx) => {
                    const qItemType =
                      q.questionType || (q.options?.length ? 'choice' : 'fill_blank');
                    return (
                      <div
                        key={q.id}
                        className="p-6 rounded-3xl border border-[#E8DFCE] bg-white shadow-xs space-y-4 hover:border-red-400 transition-colors flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="w-10 h-10 rounded-xl bg-[#18181B] text-amber-300 font-mono font-black flex items-center justify-center text-[15px] tabular-nums">
                                {idx + 1}
                              </span>
                              <span
                                className={`px-3.5 py-1 rounded-xl text-[14px] font-black border ${
                                  q.section === 'listening'
                                    ? 'bg-[#FEFCE8] text-amber-900 border-amber-200'
                                    : q.section === 'reading'
                                    ? 'bg-[#ECFDF5] text-emerald-900 border-emerald-200'
                                    : q.section === 'writing'
                                    ? 'bg-[#FAF7F0] text-[#18181B] border-[#E8DFCE]'
                                    : 'bg-[#FFF5F3] text-red-800 border-red-200'
                                }`}
                              >
                                Phần{' '}
                                {q.section === 'listening'
                                  ? 'Nghe'
                                  : q.section === 'reading'
                                  ? 'Đọc'
                                  : q.section === 'writing'
                                  ? 'Viết'
                                  : 'Nói'}
                              </span>
                              <span className="text-[14px] font-bold text-slate-600">
                                ·{' '}
                                {qItemType === 'choice'
                                  ? 'Trắc nghiệm (4 đáp án)'
                                  : qItemType === 'fill_blank'
                                  ? 'Điền đáp án'
                                  : qItemType === 'writing'
                                  ? 'Viết câu'
                                  : 'Luyện phát âm'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEditQuestion(q)}
                                className="px-3.5 py-2 rounded-xl bg-[#FAF7F0] border border-[#E8DFCE] text-[#18181B] hover:border-red-500 font-bold text-[14px] inline-flex items-center gap-1.5 cursor-pointer"
                                title="Sửa câu hỏi"
                              >
                                <Edit3 className="w-5 h-5 text-red-600" />
                                <span>Sửa</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="p-2.5 rounded-xl bg-[#FFF5F3] border border-red-200 text-red-600 hover:bg-red-600 hover:text-white cursor-pointer"
                                title="Xóa câu hỏi"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          <p className="font-serif font-black text-[#18181B] text-[21px] leading-snug">
                            {q.question}
                          </p>
                          {q.pinyin && (
                            <p className="font-mono text-red-700 font-bold text-[16px]">
                              {q.pinyin}
                            </p>
                          )}

                          {/* Rendering choices or expected text */}
                          {qItemType === 'choice' && q.options && (
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
                          )}

                          {qItemType !== 'choice' && (
                            <div className="p-4 rounded-2xl bg-[#FEFCE8] border border-amber-200 text-[#18181B] text-[18px]">
                              <span className="font-extrabold text-amber-900">Đáp án chuẩn: </span>
                              <span className="font-serif font-black text-[19px]">
                                {q.correctText}
                              </span>
                            </div>
                          )}
                        </div>

                        {q.explanation && (
                          <p className="text-slate-700 text-[16px] pt-3 border-t border-[#EFE7D6]">
                            <strong className="text-[#18181B]">Giải thích:</strong> {q.explanation}
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
            <form
              onSubmit={handleSaveQuestion}
              className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-[#E8DFCE] shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EFE7D6]">
                <h3 className="font-serif font-black text-[#18181B] text-[21px] sm:text-[22px] flex items-center gap-2.5">
                  <Plus className="w-7 h-7 text-red-600" />
                  <span>{editingQuestionId ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới vào đề thi'}</span>
                </h3>
                {editingQuestionId && (
                  <button
                    type="button"
                    onClick={resetQuestionForm}
                    className="px-4 py-2 rounded-xl bg-[#FAF7F0] border border-[#E8DFCE] text-[#18181B] font-bold text-[14px] cursor-pointer"
                  >
                    Hủy sửa
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                    Phần thi (Kỹ năng):
                  </label>
                  <select
                    value={qSection}
                    onChange={(e) => setQSection(e.target.value as any)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] text-[17px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
                  >
                    <option value="listening">Nghe hiểu (Listening)</option>
                    <option value="reading">Đọc hiểu (Reading)</option>
                    <option value="writing">Viết (Writing)</option>
                    <option value="speaking">Nói & Phát âm (Speaking)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                    Hình thức trả lời:
                  </label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as ExamQuestionType)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-bold text-[17px] text-red-700 focus:border-red-600 focus:outline-none"
                  >
                    <option value="choice">Chọn đáp án (Trắc nghiệm A, B, C, D)</option>
                    <option value="fill_blank">Điền đáp án (Vào ô trống ____)</option>
                    <option value="writing">Viết (Sắp xếp từ / Viết câu hoàn chỉnh)</option>
                    <option value="speaking">Nói (Ghi âm & Phát âm chuẩn)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                  Nội dung câu hỏi *:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ví dụ: Nghe đoạn băng và chọn đáp án đúng / Điền từ thích hợp vào chỗ trống..."
                  value={qContent}
                  onChange={(e) => setQContent(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-serif text-[19px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                    Pīnyīn (nếu có):
                  </label>
                  <input
                    type="text"
                    placeholder="Qǐng tīng..."
                    value={qPinyin}
                    onChange={(e) => setQPinyin(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-mono text-[17px] text-red-700 font-bold focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                    Nội dung audio đọc (cho phần Nghe):
                  </label>
                  <input
                    type="text"
                    placeholder="我想去北京旅游。"
                    value={qAudio}
                    onChange={(e) => setQAudio(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-serif text-[19px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Multiple Choice Options */}
              {qType === 'choice' && (
                <div className="space-y-3 pt-3 border-t border-[#EFE7D6]">
                  <span className="text-[16px] font-extrabold text-[#18181B] block">
                    4 Lựa chọn & Đáp án đúng (Tích chọn ô tròn ở đáp án đúng):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { idx: 0, val: qOptA, setVal: setQOptA, ph: 'A. Lựa chọn 1' },
                      { idx: 1, val: qOptB, setVal: setQOptB, ph: 'B. Lựa chọn 2' },
                      { idx: 2, val: qOptC, setVal: setQOptC, ph: 'C. Lựa chọn 3' },
                      { idx: 3, val: qOptD, setVal: setQOptD, ph: 'D. Lựa chọn 4' },
                    ].map((opt) => (
                      <div
                        key={opt.idx}
                        className={`flex items-center gap-3 p-2.5 rounded-2xl border-2 ${
                          qCorrectIndex === opt.idx
                            ? 'bg-[#ECFDF5] border-emerald-500'
                            : 'bg-[#FDFBF6] border-[#E8DFCE]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="examCorrect"
                          checked={qCorrectIndex === opt.idx}
                          onChange={() => setQCorrectIndex(opt.idx)}
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
              )}

              {/* Fill Blank / Writing / Speaking Expected Text */}
              {qType !== 'choice' && (
                <div className="space-y-2 pt-3 border-t border-[#EFE7D6]">
                  <label className="text-[16px] font-extrabold text-[#18181B] block">
                    {qType === 'fill_blank'
                      ? 'Từ / Cụm từ cần điền vào chỗ trống *:'
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
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-serif text-[21px] font-black text-red-700 focus:border-red-600 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                  Giải thích chi tiết:
                </label>
                <input
                  type="text"
                  placeholder="Giải thích ngữ pháp, từ vựng và lý do chọn đáp án này..."
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] text-[18px] text-[#18181B] focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('questions')}
                  className="px-6 py-3 rounded-2xl bg-[#FAF7F0] border border-[#E8DFCE] text-[#18181B] font-bold text-[16px] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 rounded-2xl bg-red-600 text-white font-black text-[16px] hover:bg-red-700 flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Save className="w-6 h-6" />
                  <span>{editingQuestionId ? 'Lưu cập nhật câu hỏi' : 'Lưu câu hỏi vào đề'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: EXCEL / CSV IMPORT */}
          {activeTab === 'excel_import' && (
            <div className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-[#E8DFCE] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-[#ECFDF5] rounded-3xl border border-emerald-200">
                <div className="space-y-1">
                  <h3 className="font-serif font-black text-emerald-950 text-[21px] flex items-center gap-2.5">
                    <FileSpreadsheet className="w-7 h-7 text-emerald-700" />
                    <span>Thêm câu hỏi hàng loạt bằng Excel</span>
                  </h3>
                  <p className="text-[18px] text-emerald-900">
                    Sao chép bảng từ Microsoft Excel hoặc Google Sheets rồi dán trực tiếp vào ô bên dưới.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-5 py-3 rounded-2xl bg-white border-2 border-emerald-300 text-emerald-900 font-black text-[15px] hover:bg-emerald-100/60 flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <Download className="w-5 h-5 text-emerald-700" />
                  <span>Tải file Excel mẫu (.xls)</span>
                </button>
              </div>

              <div>
                <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                  Dán nội dung bảng tính Excel vào đây (Copy từ Excel và Paste):
                </label>
                <textarea
                  rows={8}
                  value={excelText}
                  onChange={(e) => setExcelText(e.target.value)}
                  placeholder={`Phần thi\tLoại câu\tNội dung câu hỏi\tPinyin\tĐáp án A\tĐáp án B\tĐáp án C\tĐáp án D\tĐáp án đúng\tGiải thích\nnghe\tchoice\tNghe đoạn băng và chọn đáp án:\tWǒ xiǎng...\tĐi Bắc Kinh\tĐi Thượng Hải\tỞ nhà\tĐi xa\tA\tGiải thích...`}
                  className="w-full p-4 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-mono text-[14px] text-[#18181B] focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[15px] text-slate-600 font-semibold">
                  Hỗ trợ 4 loại câu: <code className="font-mono font-bold text-red-600">choice</code> (trắc nghiệm),{' '}
                  <code className="font-mono font-bold text-red-600">fill_blank</code> (điền từ),{' '}
                  <code className="font-mono font-bold text-red-600">writing</code> (viết),{' '}
                  <code className="font-mono font-bold text-red-600">speaking</code> (nói)
                </span>
                <button
                  type="button"
                  onClick={handleParseExcel}
                  className="px-6 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[16px] shadow-xs cursor-pointer"
                >
                  Phân tích dữ liệu bảng
                </button>
              </div>

              {importNotice && (
                <div className="p-4 bg-[#FEFCE8] border border-amber-300 rounded-2xl text-amber-950 font-bold text-[16px]">
                  {importNotice}
                </div>
              )}

              {/* Preview parsed questions */}
              {parsedPreviewQuestions.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-[#EFE7D6]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-serif font-black text-[#18181B] text-[21px]">
                      Xem trước ({parsedPreviewQuestions.length} câu hỏi hợp lệ):
                    </span>
                    <button
                      type="button"
                      onClick={handleConfirmExcelImport}
                      className="px-6 py-3.5 rounded-2xl bg-red-600 text-white font-black text-[16px] hover:bg-red-700 flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-6 h-6" />
                      <span>Xác nhận nhập {parsedPreviewQuestions.length} câu vào đề thi</span>
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto rounded-2xl border border-[#E8DFCE] divide-y divide-[#EFE7D6] bg-[#FDFBF6]">
                    {parsedPreviewQuestions.map((q, idx) => (
                      <div key={idx} className="p-4 space-y-1">
                        <div className="flex flex-wrap items-center gap-2.5 text-[16px]">
                          <span className="font-black text-red-600">Câu {idx + 1}:</span>
                          <span className="px-3 py-0.5 rounded-lg text-[14px] font-bold bg-white border border-[#E8DFCE] text-[#18181B]">
                            {q.section} · {q.questionType}
                          </span>
                          <span className="font-serif font-bold text-[#18181B] text-[18px]">
                            {q.question}
                          </span>
                        </div>
                        <div className="text-[15px] text-slate-600">
                          Đáp án đúng:{' '}
                          <strong className="text-emerald-800">
                            {q.questionType === 'choice'
                              ? `Đáp án ${['A', 'B', 'C', 'D'][q.correctAnswer ?? 0]}`
                              : q.correctText}
                          </strong>
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
            <div className="max-w-3xl bg-[#FEFCE8] p-6 sm:p-8 rounded-3xl border-2 border-amber-300 space-y-6">
              <div className="flex items-center gap-3 text-amber-950 font-serif font-black text-[22px]">
                <Sparkles className="w-7 h-7 text-amber-600 shrink-0" />
                <span>Trình sinh Đề thi HSK tự động bằng AI</span>
              </div>
              <p className="text-[18px] text-slate-700 leading-relaxed">
                Hệ thống sẽ tự động biên soạn đề thi chuẩn hóa có đầy đủ 4 dạng câu hỏi (trắc nghiệm, điền khuyết, viết và nói) theo đúng cấp độ {level} và chủ đề bạn chỉ định.
              </p>

              <div>
                <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                  Chủ đề đề thi:
                </label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Ví dụ: Giao tiếp văn phòng, Du lịch Bắc Kinh, Mua sắm siêu thị..."
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-amber-300 bg-white text-[#18181B] text-[18px] font-bold focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                    Cấp độ HSK:
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as HSKLevel)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-amber-300 bg-white text-[18px] font-bold text-[#18181B]"
                  >
                    <option value="HSK 1">HSK 1</option>
                    <option value="HSK 2">HSK 2</option>
                    <option value="HSK 3">HSK 3</option>
                    <option value="HSK 4">HSK 4</option>
                    <option value="HSK 5">HSK 5</option>
                  </select>
                </div>
                <div>
                  <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                    Số lượng câu hỏi:
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={20}
                    value={aiQuestionCount}
                    onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-amber-300 bg-white font-mono text-[18px] font-bold text-[#18181B]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAiGenerateExam}
                  disabled={isAiGenerating}
                  className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-[18px] flex items-center justify-center gap-2.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-6 h-6" />
                  <span>
                    {isAiGenerating ? 'Đang biên soạn đề thi...' : 'Bắt đầu Tạo Đề Thi Tự Động'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: EXAM GENERAL SETTINGS */}
          {activeTab === 'info' && (
            <div className="max-w-3xl bg-white p-6 sm:p-8 rounded-3xl border border-[#E8DFCE] space-y-6 shadow-xs">
              <h3 className="font-serif text-[22px] font-black text-[#18181B]">
                Cài đặt thông số kỳ thi
              </h3>

              <div>
                <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                  Cấp độ HSK:
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as HSKLevel)}
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] text-[18px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
                >
                  <option value="HSK 1">HSK 1</option>
                  <option value="HSK 2">HSK 2</option>
                  <option value="HSK 3">HSK 3</option>
                  <option value="HSK 4">HSK 4</option>
                  <option value="HSK 5">HSK 5</option>
                </select>
              </div>

              <div>
                <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                  Tên đề thi *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đề thi thử HSK 3 Chuẩn Quốc Tế - Đề số 01"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-serif text-[19px] font-black text-[#18181B] focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                  Mô tả phụ đề:
                </label>
                <input
                  type="text"
                  placeholder="Đề thi thử nghiệm định kỳ kiểm tra năng lực HSK 3"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] text-[18px] text-[#18181B] focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                    Thời gian (phút):
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-mono text-[18px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                    Điểm đạt chuẩn:
                  </label>
                  <input
                    type="number"
                    min={60}
                    max={300}
                    value={passScore}
                    onChange={(e) => setPassScore(Number(e.target.value))}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-mono text-[18px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[16px] font-extrabold text-[#18181B] block mb-2">
                    Tổng điểm tối đa:
                  </label>
                  <input
                    type="number"
                    min={100}
                    max={300}
                    value={totalPoints}
                    onChange={(e) => setTotalPoints(Number(e.target.value))}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-mono text-[18px] font-bold text-[#18181B] focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-6 py-4 bg-[#FAF7F0] border-t border-[#E8DFCE] flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="text-[15px] sm:text-[16px] text-[#18181B] font-semibold">
            Hiện có <strong className="text-red-600 font-mono">{questions.length}</strong> câu hỏi ·
            Thời gian <strong className="text-amber-700 font-mono">{timeLimitMinutes}</strong> phút ·
            Điểm đạt{' '}
            <strong className="text-emerald-700 font-mono">
              {passScore}/{totalPoints}
            </strong>
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
              onClick={handleSaveWholeExam}
              className="px-7 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-[16px] flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span>{isEditing ? 'Lưu cập nhật đề thi' : 'Lưu đề thi mới'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

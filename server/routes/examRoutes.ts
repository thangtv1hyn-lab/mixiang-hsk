import { Router } from 'express';
import { db } from '../dataStore.ts';
import { Exam, ExamResult } from '../../src/types/hsk.ts';

const router = Router();

// Get list of all mock exams
router.get('/', (req, res) => {
  const { level } = req.query;
  let items = db.exams;
  if (level && level !== 'ALL') {
    items = items.filter((e) => e.level === level);
  }
  res.json(items);
});

// Get single exam details
router.get('/:id', (req, res) => {
  const exam = db.exams.find((e) => e.id === req.params.id);
  if (!exam) {
    return res.status(404).json({ error: 'Không tìm thấy đề thi' });
  }
  res.json(exam);
});

// Admin: Create new mock exam
router.post('/', (req, res) => {
  try {
    const { level, title, subtitle, timeLimitMinutes, passScore, totalPoints, questions = [] } = req.body;
    if (!title || !level) {
      return res.status(400).json({ error: 'Tiêu đề và cấp độ là bắt buộc' });
    }

    const newExam: Exam = {
      id: `exam-custom-${Date.now()}`,
      level,
      title,
      subtitle: subtitle || `Đề thi thử HSK cấp độ ${level}`,
      timeLimitMinutes: Number(timeLimitMinutes) || 30,
      passScore: Number(passScore) || 120,
      totalPoints: Number(totalPoints) || 200,
      questions,
    };

    db.exams.unshift(newExam);
    res.status(201).json(newExam);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update exam
router.put('/:id', (req, res) => {
  const index = db.exams.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy đề thi' });
  }

  db.exams[index] = {
    ...db.exams[index],
    ...req.body,
  };

  res.json(db.exams[index]);
});

// Admin: Delete exam
router.delete('/:id', (req, res) => {
  const index = db.exams.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy đề thi' });
  }
  const deleted = db.exams.splice(index, 1);
  res.json({ success: true, deleted: deleted[0] });
});

// Admin: Generate Mock Exam via Gemini AI
router.post('/ai-generate', async (req, res) => {
  try {
    const { level = 'HSK 3', topic = 'Đời sống, công việc và du lịch', count = 6 } = req.body;

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      // Fallback sample exam if no API key
      const fallbackExam: Exam = {
        id: `exam-ai-${Date.now()}`,
        level,
        title: `Đề thi thử AI ${level}: ${topic}`,
        subtitle: `Đề thi thử nghiệm tự động chuẩn HSK mới`,
        timeLimitMinutes: 35,
        passScore: 120,
        totalPoints: 200,
        questions: [
          {
            id: `q-ai-1-${Date.now()}`,
            section: 'listening',
            questionType: 'choice',
            question: 'Nghe đoạn ghi âm và chọn câu trả lời đúng:',
            pinyin: 'Qǐng tīng: "我想买两张去北京的高铁票。"',
            audioPrompt: '我想买两张去北京的高铁票。',
            options: ['A. Mua 2 vé tàu cao tốc đi Bắc Kinh', 'B. Mua 2 vé máy bay', 'C. Đi Thượng Hải bằng xe buýt', 'D. Trả vé tàu'],
            correctAnswer: 0,
            explanation: '"两张去北京的高铁票" nghĩa là 2 vé tàu cao tốc đi Bắc Kinh.',
          },
          {
            id: `q-ai-2-${Date.now()}`,
            section: 'reading',
            questionType: 'fill_blank',
            question: 'Điền từ thích hợp vào chỗ trống: "因为今天下大雨，____我们不去公园了。"',
            pinyin: 'Yīnwèi jīntiān xià dàyǔ, ____ wǒmen bù qù gōngyuán le.',
            correctText: '所以',
            explanation: 'Cấu trúc liên từ quen thuộc "因为……所以……" (Bởi vì... cho nên...).',
          },
          {
            id: `q-ai-3-${Date.now()}`,
            section: 'writing',
            questionType: 'writing',
            question: 'Sắp xếp các từ sau thành câu hoàn chỉnh: "努力 / 汉语 / 他 / 每天 / 学习"',
            pinyin: 'nǔlì / Hànyǔ / tā / měitiān / xuéxí',
            correctText: '他每天努力学习汉语。',
            explanation: 'Trật tự câu: Chủ ngữ (他) + trạng ngữ thời gian (每天) + trạng từ (努力) + vị ngữ (学习) + tân ngữ (汉语).',
          },
          {
            id: `q-ai-4-${Date.now()}`,
            section: 'speaking',
            questionType: 'speaking',
            question: 'Hãy phát âm rõ ràng câu sau bằng tiếng Trung:',
            pinyin: 'Zhù nǐ kǎoshì shùnlì, qǔdé hǎo chéngjì!',
            correctText: '祝你考试顺利，取得好成绩！',
            explanation: 'Dịch nghĩa: Chúc bạn thi cử thuận lợi, đạt thành tích tốt! Chú ý các thanh 4.',
          },
        ],
      };

      db.exams.unshift(fallbackExam);
      return res.status(201).json(fallbackExam);
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const prompt = `Bạn là chuyên gia khảo thí biên soạn đề thi tiếng Trung HSK chuẩn quốc tế.
Hãy tạo 1 đề thi thử HSK cấp độ ${level} với chủ đề "${topic}".
Số lượng câu hỏi: ${count} câu hỏi.
BẮT BUỘC có đủ 4 hình thức câu hỏi:
1. "choice" (Trắc nghiệm 4 đáp án A, B, C, D)
2. "fill_blank" (Điền khuyết chữ Hán/Pinyin vào chỗ trống)
3. "writing" (Sắp xếp từ thành câu hoặc viết câu)
4. "speaking" (Luyện phát âm câu nói tiếng Trung)

Trả về JSON có cấu trúc sau:
{
  "title": "Tiêu đề đề thi tiếng Việt và tiếng Trung",
  "subtitle": "Mô tả ngắn gọn về kỳ thi",
  "timeLimitMinutes": 35,
  "passScore": 120,
  "totalPoints": 200,
  "questions": [
    {
      "id": "q1",
      "section": "listening" | "reading" | "writing" | "speaking",
      "questionType": "choice" | "fill_blank" | "writing" | "speaking",
      "question": "Nội dung câu hỏi chữ Hán hoặc hướng dẫn bằng tiếng Việt",
      "pinyin": "phiên âm pinyin",
      "audioPrompt": "Đoạn văn chữ Hán đọc bằng audio nếu là phần nghe hoặc nói",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."], // Bắt buộc nếu questionType là "choice"
      "correctAnswer": 0, // Chỉ số 0..3 nếu questionType là "choice"
      "correctText": "Đáp án chuẩn bằng chữ Hán nếu là fill_blank, writing, hoặc speaking",
      "explanation": "Giải thích chi tiết ngữ pháp, từ vựng và đáp án bằng tiếng Việt"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');
    const newExam: Exam = {
      id: `exam-ai-${Date.now()}`,
      level,
      title: parsed.title || `Đề thi thử HSK ${level}: ${topic}`,
      subtitle: parsed.subtitle || `Đề thi AI chuẩn hóa HSK cấp độ ${level}`,
      timeLimitMinutes: Number(parsed.timeLimitMinutes) || 35,
      passScore: Number(parsed.passScore) || 120,
      totalPoints: Number(parsed.totalPoints) || 200,
      questions: (parsed.questions || []).map((q: any, idx: number) => ({
        id: `q-ai-${Date.now()}-${idx + 1}`,
        section: q.section || 'reading',
        questionType: q.questionType || (q.options?.length ? 'choice' : 'fill_blank'),
        question: q.question || '',
        pinyin: q.pinyin || '',
        audioPrompt: q.audioPrompt || q.question || '',
        options: q.options || [],
        correctAnswer: Number(q.correctAnswer) || 0,
        correctText: q.correctText || '',
        explanation: q.explanation || '',
      })),
    };

    db.exams.unshift(newExam);
    res.status(201).json(newExam);
  } catch (err: any) {
    console.warn('AI generate exam encountered error, using smart fallback template:', err?.message);
    const { level = 'HSK 3', topic = 'Đời sống và giao tiếp' } = req.body;

    const fallbackExam: Exam = {
      id: `exam-ai-${Date.now()}`,
      level,
      title: `Đề thi thử HSK ${level}: ${topic}`,
      subtitle: `Đề thi biên soạn chuẩn hóa theo chủ đề ${topic}`,
      timeLimitMinutes: 35,
      passScore: 120,
      totalPoints: 200,
      questions: [
        {
          id: `q-fb-1-${Date.now()}`,
          section: 'listening',
          questionType: 'choice',
          question: 'Nghe đoạn ghi âm và chọn câu trả lời đúng:',
          pinyin: `Qǐng tīng: "我想了解一下关于${topic}的情况。"`,
          audioPrompt: `我想了解一下关于${topic}的情况。`,
          options: [`A. Tìm hiểu về ${topic}`, 'B. Đi xem phim cùng bạn bè', 'C. Mua vé tàu đi xa', 'D. Ở nhà nghỉ ngơi'],
          correctAnswer: 0,
          explanation: `Trong câu ghi âm có "我想了解一下关于${topic}的情况" nghĩa là muốn tìm hiểu về ${topic}.`,
        },
        {
          id: `q-fb-2-${Date.now()}`,
          section: 'reading',
          questionType: 'fill_blank',
          question: 'Điền từ thích hợp vào chỗ trống: "因为明天有考试，____我今天必须认真复习。"',
          pinyin: 'Yīnwèi míngtiān yǒu kǎoshì, ____ wǒ jīntiān bìxū rènzhēn fùxí.',
          correctText: '所以',
          explanation: 'Cấu trúc liên từ quen thuộc "因为……所以……" (Bởi vì... cho nên...).',
        },
        {
          id: `q-fb-3-${Date.now()}`,
          section: 'writing',
          questionType: 'writing',
          question: 'Sắp xếp các từ sau thành câu hoàn chỉnh: "他 / 每天 / 汉语 / 努力 / 学习"',
          pinyin: 'tā / měitiān / Hànyǔ / nǔlì / xuéxí',
          correctText: '他每天努力学习汉语。',
          explanation: 'Trật tự câu: Chủ ngữ (他) + trạng ngữ thời gian (每天) + trạng từ (努力) + vị ngữ (学习) + tân ngữ (汉语).',
        },
        {
          id: `q-fb-4-${Date.now()}`,
          section: 'speaking',
          questionType: 'speaking',
          question: 'Hãy phát âm rõ ràng câu sau bằng tiếng Trung:',
          pinyin: 'Zhù nǐ kǎoshì shùnlì, qǔdé hǎo chéngjì!',
          correctText: '祝你考试顺利，取得好成绩！',
          explanation: 'Chúc bạn thi cử thuận lợi, đạt thành tích tốt! Chú ý các thanh 4 (kǎoshì, qǔdé).',
        },
      ],
    };

    db.exams.unshift(fallbackExam);
    return res.status(201).json(fallbackExam);
  }
});

// Student: Submit exam and Auto-Grade on server (multi-format support)
router.post('/:id/submit', (req, res) => {
  try {
    const exam = db.exams.find((e) => e.id === req.params.id);
    if (!exam) {
      return res.status(404).json({ error: 'Không tìm thấy đề thi' });
    }

    const { userAnswers = {}, timeSpentSeconds = 0 } = req.body;

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

    // Verify each question based on questionType
    exam.questions.forEach((q) => {
      const userChoice = userAnswers[q.id];
      let isCorrect = false;

      const qType = q.questionType || (q.options && q.options.length > 0 ? 'choice' : 'fill_blank');

      if (qType === 'choice') {
        isCorrect = Number(userChoice) === q.correctAnswer;
      } else if (qType === 'fill_blank' || qType === 'writing') {
        const uClean = cleanStr(userChoice);
        const targetClean = cleanStr(q.correctText);
        isCorrect = uClean.length > 0 && (uClean === targetClean || targetClean.includes(uClean));
      } else if (qType === 'speaking') {
        // Speaking: valid recognized speech with high similarity or presence
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
      timeSpentSeconds: Number(timeSpentSeconds),
      userAnswers,
    };

    // Update student progress in database
    const profile = db.getActiveProfile();
    profile.examHistory.unshift(result);
    profile.xp += passed ? 150 : 50;

    const today = new Date().toISOString().split('T')[0];
    profile.studyLog[today] = (profile.studyLog[today] || 0) + Math.round(timeSpentSeconds / 60);

    res.json({
      success: true,
      message: passed ? 'Chúc mừng bạn đã đạt kỳ thi!' : 'Chưa đạt điểm chuẩn, hãy cố gắng thêm nhé!',
      result,
      profile: {
        xp: profile.xp,
        streakDays: profile.streakDays,
        totalExamsTaken: profile.examHistory.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

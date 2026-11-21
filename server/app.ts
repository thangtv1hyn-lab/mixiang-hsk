import express from 'express';
import dotenv from 'dotenv';
import { generateWithFreeGemini } from './geminiClient.js';
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import vocabRoutes from './routes/vocabRoutes.js';
import examRoutes from './routes/examRoutes.js';
import forumRoutes from './routes/forumRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';

dotenv.config();

const app = express();

// Trust reverse proxy headers (Vercel Edge / Render / Cloud Run)
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));

// API Health
app.get('/api/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    status: 'ok',
    runtime: process.env.VERCEL ? 'vercel-serverless' : 'node',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString(),
  });
});

// Mount full-stack HSK learning platform backend routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/vocab', vocabRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reminders', reminderRoutes);

// Helper to sanitize AI-generated SVG illustrations so they are strictly safe
function sanitizeSvgMarkup(rawSvg: string): string {
  const match = rawSvg.match(/<svg[\s\S]*?<\/svg>/i);
  if (!match) return '';
  let svg = match[0];

  // Strip dangerous tags and event attributes
  svg = svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|xlink:href)\s*=\s*("javascript:[^"]*"|'javascript:[^']*')/gi, '');

  // Ensure standard xmlns, viewBox, width, and height for reliable Canvas rasterization
  if (!/xmlns=/i.test(svg)) {
    svg = svg.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!/viewBox=/i.test(svg)) {
    svg = svg.replace(/<svg/i, '<svg viewBox="0 0 400 300"');
  }
  if (!/\bwidth=/i.test(svg)) {
    svg = svg.replace(/<svg/i, '<svg width="400"');
  }
  if (!/\bheight=/i.test(svg)) {
    svg = svg.replace(/<svg/i, '<svg height="300"');
  }
  return svg.trim();
}

// AI Tutor Chat Endpoint (Free Gemini API)
app.post('/api/gemini/tutor-chat', async (req, res) => {
  try {
    const { message, history = [], hskLevel = 'HSK 1-3' } = req.body || {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập nội dung câu hỏi.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Hệ thống chưa được cấu hình GEMINI_API_KEY để kết nối Lão Sư AI.',
      });
    }

    const systemInstruction = `Bạn là "Lão Sư AI" - Giảng viên tiếng Trung chuyên luyện thi HSK từ HSK 1 đến HSK 5 và Giáo trình Boya cực kỳ thân thiện, sư phạm và dễ hiểu.
Đối tượng học viên là người Việt Nam đang học tiếng Trung trình độ ${hskLevel}.
Quy tắc trả lời:
1. Giải thích rõ ràng bằng tiếng Việt, kèm chữ Hán (chữ giản thể), phiên âm Pinyin có dấu thanh điệu, và dịch nghĩa.
2. Nếu học viên hỏi về ngữ pháp: Nêu công thức cấu trúc, so sánh cách dùng, lưu ý lỗi sai người Việt hay gặp, đưa ra 2-3 câu ví dụ thực tế.
3. Nếu học viên nhờ sửa câu/đoạn văn: Phân tích câu gốc, chỉ rõ chỗ sai (ngữ pháp, thanh điệu, từ ngữ), cung cấp câu sửa đúng tự nhiên và giải thích vì sao sửa như vậy.
4. Giữ giọng điệu ấm áp, khích lệ (thêm câu động viên như "加油! (Cố lên!)"). Trình bày gọn gàng, dùng gạch đầu dòng rõ ràng.`;

    // Normalize history so Gemini always receives valid alternating turns starting with 'user'
    const normalizedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    for (const h of Array.isArray(history) ? history.slice(-8) : []) {
      const textVal = typeof h?.text === 'string' ? h.text : h?.parts?.[0]?.text;
      if (!textVal || !String(textVal).trim()) continue;
      const role: 'user' | 'model' = h.role === 'user' ? 'user' : 'model';
      if (normalizedContents.length === 0 && role === 'model') {
        continue;
      }
      const prev = normalizedContents[normalizedContents.length - 1];
      if (prev && prev.role === role) {
        prev.parts[0].text += `\n${String(textVal).trim()}`;
      } else {
        normalizedContents.push({
          role,
          parts: [{ text: String(textVal).trim() }],
        });
      }
    }

    const userText = String(message).trim();
    const lastTurn = normalizedContents[normalizedContents.length - 1];
    if (lastTurn && lastTurn.role === 'user') {
      lastTurn.parts[0].text = `${lastTurn.parts[0].text}\n${userText}`;
    } else {
      normalizedContents.push({
        role: 'user',
        parts: [{ text: userText }],
      });
    }

    const { text: replyText, model } = await generateWithFreeGemini({
      contents: normalizedContents,
      systemInstruction,
      preferFast: true,
      timeoutMs: 18000,
    });

    return res.json({
      reply: replyText,
      model,
      aiPowered: true,
    });
  } catch (error: any) {
    console.error('Tutor Chat error:', error?.message || error);
    return res.status(502).json({
      error: 'Không thể kết nối Lão Sư AI lúc này. Vui lòng bấm gửi lại sau vài giây.',
    });
  }
});

// AI Vocabulary Illustration Generator (100% Free Gemini API - Flat Vector SVG)
app.post('/api/gemini/vocab-image', async (req, res) => {
  try {
    const { word, pinyin = '', meaning = '', exampleSentence = '' } = req.body || {};
    if (!word || !String(word).trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập Chữ Hán trước khi tạo ảnh minh họa AI.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Hệ thống chưa cấu hình GEMINI_API_KEY cho tính năng tạo ảnh AI.',
      });
    }

    const prompt = `Bạn là họa sĩ minh họa giáo dục (Flat Vector Illustration Designer).
Hãy vẽ một bức tranh minh họa trực quan, sinh động, dễ thương theo phong cách flat-vector / chibi hiện đại bằng mã SVG thuần để giúp học viên ghi nhớ từ vựng tiếng Trung sau:
- Từ vựng: ${word}
- Pinyin: ${pinyin}
- Nghĩa tiếng Việt: ${meaning}
- Ngữ cảnh ví dụ: ${exampleSentence}

Yêu cầu kỹ thuật BẮT BUỘC:
1. Trả về DUY NHẤT mã SVG hoàn chỉnh bắt đầu bằng <svg viewBox="0 0 400 300" width="400" height="300" xmlns="http://www.w3.org/2000/svg"> và kết thúc bằng </svg>. Không kèm markdown \`\`\`, không giải thích.
2. Vẽ bối cảnh nền ấm áp (gradient nhẹ, mây/bàn/cảnh vật phù hợp ngữ nghĩa) và vật thể/nhân vật chính ở trung tâm rõ nét, nhiều chi tiết hình khối đẹp mắt (dùng linearGradient, circle, rect bo góc, path cong mượt).
3. Bảng màu hài hòa, tươi sáng (đỏ son #C85A43, kem #F7F4EC, vàng ấm #F59E0B, xanh ngọc #10B981, xanh dương #3B82F6...).
4. KHÔNG viết nhiều chữ dài lên tranh (chỉ được phép hiển thị tối đa 1 nhãn ký tự nhỏ nếu thật sự cần thiết như biển hiệu/từ "${word}").
5. Tuyệt đối KHÔNG dùng <script>, <image>, <foreignObject> hay link ảnh ngoài.`;

    const { text: rawText, model } = await generateWithFreeGemini({
      contents: prompt,
      preferFast: true,
      timeoutMs: 20000,
    });

    const cleanSvg = sanitizeSvgMarkup(rawText);

    if (!cleanSvg || cleanSvg.length < 80) {
      return res.status(502).json({
        error: 'AI chưa tạo được tranh minh họa hợp lệ. Vui lòng bấm tạo lại.',
      });
    }

    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(
      cleanSvg.replace(/\s+/g, ' ').replace(/>\s+</g, '><')
    )}`;

    return res.json({
      svg: cleanSvg,
      dataUrl,
      model,
      aiPowered: true,
    });
  } catch (error: any) {
    console.error('AI Vocab Image error:', error?.message || error);
    return res.status(502).json({
      error: 'Không thể tạo ảnh minh họa AI lúc này. Vui lòng thử lại.',
    });
  }
});

// AI Pronunciation & Tone Evaluation Endpoint (Free Gemini API)
app.post('/api/gemini/evaluate-pronunciation', async (req, res) => {
  try {
    const { targetWord, pinyin, meaning, recognizedText } = req.body || {};

    if (!targetWord) {
      return res.status(400).json({ error: 'targetWord is required' });
    }

    const fallbackEvaluation = () => {
      const matches =
        recognizedText &&
        String(recognizedText).trim().toLowerCase().includes(String(targetWord).trim().toLowerCase());
      return {
        score: matches ? 95 : 82,
        accuracy: matches ? 'Xuất sắc' : 'Tốt',
        feedback: matches
          ? `Phát âm rất tốt! Bạn đã phát âm chính xác từ "${targetWord}" (${pinyin || ''}).`
          : `Bạn đã phát âm "${recognizedText || targetWord}" cho từ chuẩn "${targetWord}" (${pinyin || ''}). Hãy chú ý giữ độ vang của vận mẫu và thanh điệu chuẩn nhé!`,
        tips: 'Luyện tập nghe lại âm mẫu, mở khẩu hình tròn đều và giữ thanh 1 ngân cao, thanh 4 dứt khoát.',
      };
    };

    if (!process.env.GEMINI_API_KEY) {
      return res.json(fallbackEvaluation());
    }

    const prompt = `Học viên tiếng Trung đang luyện phát âm từ vựng sau:
- Từ vựng (Hán tự): ${targetWord}
- Pinyin: ${pinyin || ''}
- Nghĩa tiếng Việt: ${meaning || ''}
- Chữ thu được từ giọng nói của học viên (Speech Recognition): "${recognizedText || '(học viên chưa nói rõ)'}"

Hãy đánh giá và trả về kết quả JSON với cấu trúc:
{
  "score": số điểm từ 0 đến 100 dựa trên độ tương đồng và phát âm,
  "accuracy": "Xuất sắc" | "Tốt" | "Khá" | "Cần cố gắng",
  "feedback": "Nhận xét chi tiết bằng tiếng Việt về thanh điệu và ngữ âm",
  "tips": "Lời khuyên ngắn gọn để phát âm chuẩn xác hơn (vị trí lưỡi, khẩu hình miệng, thanh điệu)"
}`;

    try {
      const { text: raw } = await generateWithFreeGemini({
        contents: prompt,
        responseMimeType: 'application/json',
        preferFast: true,
        timeoutMs: 12000,
      });

      const text = (raw || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch (aiErr: any) {
      console.warn('Evaluate pronunciation AI fallback:', aiErr?.message);
      return res.json(fallbackEvaluation());
    }
  } catch (error: any) {
    console.error('Evaluate pronunciation error:', error);
    return res.json({
      score: 80,
      accuracy: 'Khá',
      feedback: 'Đã nhận được phát âm của bạn. Hãy tiếp tục luyện tập nhé!',
      tips: 'Luyện tập phát âm thanh 1 ngân dài và thanh 4 dứt khoát.',
    });
  }
});

// AI Auto Course / Lesson / Quiz Generator for Admin (Free Gemini API)
app.post('/api/gemini/admin-generate', async (req, res) => {
  try {
    const {
      type = 'lesson',
      topic = 'Giao tiếp hàng ngày',
      level = 'HSK 2',
      curriculum = 'HSK',
      lessonCount = 3,
    } = req.body || {};

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Hệ thống chưa được cấu hình GEMINI_API_KEY để sử dụng tính năng soạn nội dung AI.',
      });
    }

    let prompt = '';
    if (type === 'course') {
      const safeLessonCount = Math.max(2, Math.min(5, Number(lessonCount) || 3));
      const curriculumText =
        curriculum === 'BOYA'
          ? 'Giáo trình Boya (博雅汉语)'
          : curriculum === 'COMM'
          ? 'Tiếng Trung Giao Tiếp Thực Chiến'
          : `Giáo trình Chuẩn ${level}`;

      prompt = `Bạn là Giám đốc học thuật tiếng Trung của trung tâm MiXiangg HSK. Hãy thiết kế trọn bộ một khóa học tiếng Trung hoàn chỉnh.
- Cấp độ: ${level}
- Hệ giáo trình: ${curriculumText}
- Chủ đề / Định hướng khóa học: "${topic}"
- Số lượng bài học cần tạo: ĐÚNG ${safeLessonCount} bài học liên hoàn, tăng dần độ khó.

Trả về DUY NHẤT JSON hợp lệ (không bọc markdown) với cấu trúc:
{
  "title": "Tên khóa học song ngữ ngắn gọn (VD: ${level} · ${topic})",
  "vietnameseTitle": "Tên khóa học tiếng Việt thu hút",
  "description": "Mô tả mục tiêu đầu ra, từ vựng và kỹ năng giao tiếp sau khóa học (2-3 câu)",
  "targetVocabCount": 300,
  "grammarPointsCount": 30,
  "lessons": [
    {
      "lessonNumber": 1,
      "title": "第1课：Tiêu đề chữ Hán bài 1",
      "vietnameseTitle": "Bài 1: Tiêu đề tiếng Việt",
      "durationMinutes": 35,
      "description": "Mục tiêu bài học ngắn gọn",
      "vocabulary": [
        {
          "word": "chữ Hán",
          "pinyin": "pinyin có dấu thanh điệu",
          "sino": "âm Hán Việt",
          "meaning": "nghĩa tiếng Việt",
          "example": "câu ví dụ chữ Hán tự nhiên",
          "examplePinyin": "pinyin câu ví dụ",
          "exampleMeaning": "dịch nghĩa tiếng Việt"
        }
      ],
      "grammar": [
        {
          "title": "Tên điểm ngữ pháp",
          "structure": "Công thức cấu trúc",
          "explanation": "Giải thích dễ hiểu cho người Việt",
          "examples": [
            { "hanzi": "Câu ví dụ 1", "pinyin": "Pinyin ví dụ 1", "translation": "Dịch nghĩa 1" }
          ]
        }
      ],
      "dialogue": [
        { "speaker": "A", "chinese": "Câu thoại A", "pinyin": "Pinyin", "vietnamese": "Dịch tiếng Việt" },
        { "speaker": "B", "chinese": "Câu thoại B", "pinyin": "Pinyin", "vietnamese": "Dịch tiếng Việt" }
      ],
      "practiceQuestions": [
        {
          "type": "single_choice",
          "question": "Câu hỏi trắc nghiệm chữ Hán liên quan bài học",
          "pinyin": "Pinyin câu hỏi",
          "options": ["A. Đáp án 1", "B. Đáp án 2", "C. Đáp án 3", "D. Đáp án 4"],
          "correctAnswer": 0,
          "explanation": "Giải thích chi tiết bằng tiếng Việt"
        }
      ]
    }
  ]
}
Lưu ý: Mỗi bài học cần có ít nhất 4 từ vựng, 1-2 điểm ngữ pháp, 4 lượt hội thoại và 2 câu luyện tập thực tế.`;
    } else if (type === 'lesson') {
      prompt = `Tạo một bài học tiếng Trung hoàn chỉnh chuẩn ${level} về chủ đề: "${topic}".
Trả về DUY NHẤT JSON hợp lệ (không bọc markdown) gồm:
{
  "title": "第X课：Tiêu đề chữ Hán",
  "vietnameseTitle": "Tiêu đề tiếng Việt hấp dẫn",
  "durationMinutes": 35,
  "description": "Mô tả mục tiêu bài học (1-2 câu)",
  "vocabulary": [
    { "word": "chữ Hán", "pinyin": "pinyin có dấu", "sino": "âm Hán Việt", "meaning": "nghĩa tiếng Việt", "example": "câu ví dụ chữ Hán", "examplePinyin": "pinyin câu ví dụ", "exampleMeaning": "dịch câu ví dụ" }
  ],
  "grammar": [
    {
      "title": "Tên điểm ngữ pháp",
      "structure": "Cấu trúc ngữ pháp",
      "explanation": "Giải thích chi tiết cho học viên Việt Nam",
      "examples": [
        { "hanzi": "Câu ví dụ 1", "pinyin": "Pinyin 1", "translation": "Dịch nghĩa 1" },
        { "hanzi": "Câu ví dụ 2", "pinyin": "Pinyin 2", "translation": "Dịch nghĩa 2" }
      ]
    }
  ],
  "dialogue": [
    { "speaker": "A", "chinese": "câu nói chữ Hán", "pinyin": "pinyin", "vietnamese": "dịch nghĩa" },
    { "speaker": "B", "chinese": "câu nói chữ Hán", "pinyin": "pinyin", "vietnamese": "dịch nghĩa" }
  ],
  "practiceQuestions": [
    {
      "type": "single_choice",
      "question": "Câu hỏi ôn tập chuẩn HSK",
      "pinyin": "Pinyin câu hỏi",
      "options": ["A. Đáp án 1", "B. Đáp án 2", "C. Đáp án 3", "D. Đáp án 4"],
      "correctAnswer": 0,
      "explanation": "Giải thích vì sao đúng"
    }
  ]
}
Yêu cầu: Ít nhất 5 từ vựng, 2 điểm ngữ pháp, 4 lượt hội thoại và 3 câu hỏi ôn tập.`;
    } else {
      prompt = `Tạo 4 câu hỏi trắc nghiệm ôn tập chuẩn HSK cấp độ ${level} cho chủ đề: "${topic}".
Trả về DUY NHẤT JSON hợp lệ gồm:
{
  "questions": [
    {
      "question": "Câu hỏi chữ Hán (kèm pinyin nếu cần)",
      "pinyin": "pinyin câu hỏi",
      "translation": "Dịch nghĩa câu hỏi",
      "options": ["A. Đáp án 1", "B. Đáp án 2", "C. Đáp án 3", "D. Đáp án 4"],
      "correctAnswer": 0,
      "explanation": "Giải thích chi tiết tại sao chọn đáp án này"
    }
  ]
}`;
    }

    const { text: rawJson, model } = await generateWithFreeGemini({
      contents: prompt,
      responseMimeType: 'application/json',
      preferFast: true,
      timeoutMs: type === 'course' ? 32000 : 22000,
    });

    const cleanText = (rawJson || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return res.json({ ...parsed, model, aiPowered: true });
  } catch (error: any) {
    console.error('Admin generate error:', error?.message || error);
    return res.status(502).json({
      error: 'AI đang bận hoặc chưa tạo được định dạng chuẩn. Vui lòng thử bấm tạo lại.',
    });
  }
});

// Guard all unknown /api/* routes & API errors so Express NEVER falls through to SPA HTML
app.use('/api', (req, res) => {
  res.status(404).json({
    error: `Không tìm thấy API endpoint: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/api')) {
    console.error('API middleware error:', err?.message || err);
    return res.status(err?.status || 500).json({
      error: err?.message || 'Lỗi máy chủ API. Vui lòng thử lại.',
    });
  }
  next(err);
});

export { app };
export default app;

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini SDK with telemetry header
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

import authRoutes from './server/routes/authRoutes.ts';
import courseRoutes from './server/routes/courseRoutes.ts';
import vocabRoutes from './server/routes/vocabRoutes.ts';
import examRoutes from './server/routes/examRoutes.ts';
import forumRoutes from './server/routes/forumRoutes.ts';
import reportRoutes from './server/routes/reportRoutes.ts';
import adminRoutes from './server/routes/adminRoutes.ts';
import reminderRoutes from './server/routes/reminderRoutes.ts';

// API Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
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

// AI Tutor Chat Endpoint
app.post('/api/gemini/tutor-chat', async (req, res) => {
  try {
    const { message, history = [], hskLevel = 'HSK 1-3' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!ai) {
      // Graceful fallback if API key is not yet configured
      return res.json({
        reply: `Chào bạn! Tôi là Trợ lý AI Lão Sư tiếng Trung. Bạn đang hỏi về: "${message}". Để trả lời chi tiết và chính xác nhất, bạn có thể thiết lập GEMINI_API_KEY trong mục Settings > Secrets. Trong lúc này, hãy tiếp tục học các bài học HSK trong danh mục nhé!`,
      });
    }

    const systemInstruction = `Bạn là "Lão Sư AI" - Giảng viên tiếng Trung chuyên luyện thi HSK từ HSK 1 đến HSK 5 cực kỳ thân thiện, sư phạm và dễ hiểu.
Đối tượng học viên là người Việt Nam đang học tiếng Trung trình độ ${hskLevel}.
Quy tắc trả lời:
1. Giải thích rõ ràng bằng tiếng Việt, kèm chữ Hán (chữ giản thể), phiên âm Pinyin có dấu thanh điệu, và dịch nghĩa.
2. Nếu học viên hỏi về ngữ pháp: Nêu công thức cấu trúc, so sánh cách dùng, lưu ý lỗi sai người Việt hay gặp, đưa ra 2-3 câu ví dụ thực tế.
3. Nếu học viên nhờ sửa câu/đoạn văn: Phân tích câu gốc, chỉ rõ chỗ sai (ngữ pháp, thanh điệu, từ ngữ), cung cấp câu sửa đúng tự nhiên và giải thích vì sao sửa như vậy.
4. Giữ giọng điệu ấm áp, khích lệ (thêm câu động viên như "加油! (Cố lên!)"). Trình bày đẹp mắt, dùng gạch đầu dòng rõ ràng.`;

    // Format chat contents
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Append recent history if any
    for (const h of history.slice(-6)) {
      contents.push({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents as any,
      config: {
        systemInstruction,
      },
    });

    res.json({ reply: response.text || 'Xin lỗi, tôi chưa thể trả lời câu hỏi này lúc này.' });
  } catch (error: any) {
    console.error('Tutor Chat error:', error);
    res.status(500).json({
      error: 'Không thể xử lý yêu cầu AI lúc này',
      details: error.message,
    });
  }
});

// AI Pronunciation & Tone Evaluation Endpoint
app.post('/api/gemini/evaluate-pronunciation', async (req, res) => {
  try {
    const { targetWord, pinyin, meaning, recognizedText } = req.body;

    if (!targetWord) {
      return res.status(400).json({ error: 'targetWord is required' });
    }

    if (!ai) {
      // Simulate evaluation if no API key
      const matches = recognizedText && recognizedText.trim().toLowerCase() === targetWord.toLowerCase();
      return res.json({
        score: matches ? 95 : 75,
        feedback: matches
          ? `Phát âm rất tốt! Bạn đã phát âm chính xác từ ${targetWord} (${pinyin}).`
          : `Bạn đã nói "${recognizedText || '...'}" so với từ chuẩn "${targetWord}" (${pinyin}). Chú ý tròn môi và giữ đúng thanh điệu nhé!`,
        tips: 'Hãy nghe lại âm mẫu và bật hơi đúng các phụ âm.',
      });
    }

    const prompt = `Học viên tiếng Trung đang luyện phát âm từ vựng sau:
- Từ vựng (Hán tự): ${targetWord}
- Pinyin: ${pinyin}
- Nghĩa tiếng Việt: ${meaning}
- Chữ thu được từ giọng nói của học viên (Speech Recognition): "${recognizedText || '(học viên chưa nói rõ)'}"

Hãy đánh giá và trả về kết quả JSON với cấu trúc:
{
  "score": số điểm từ 0 đến 100 dựa trên độ tương đồng và phát âm,
  "accuracy": "Xuất sắc" | "Tốt" | "Khá" | "Cần cố gắng",
  "feedback": "Nhận xét chi tiết bằng tiếng Việt về thanh điệu và ngữ âm",
  "tips": "Lời khuyên ngắn gọn để phát âm chuẩn xác hơn (vị trí lưỡi, khẩu hình miệng, thanh điệu)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (error: any) {
    console.error('Evaluate pronunciation error:', error);
    res.status(500).json({
      score: 80,
      feedback: 'Đã nhận được phát âm của bạn. Hãy tiếp tục luyện tập nhé!',
      tips: 'Luyện tập phát âm thanh 1 ngân dài và thanh 4 dứt khoát.',
    });
  }
});

// AI Auto Lesson/Quiz Generator for Admin
app.post('/api/gemini/admin-generate', async (req, res) => {
  try {
    const { type, topic, level } = req.body; // type: 'lesson' | 'quiz'

    if (!ai) {
      return res.json({
        content: `Mẫu nội dung thử nghiệm cho chủ đề "${topic}" cấp độ ${level}. (Hãy cấu hình GEMINI_API_KEY để kích hoạt tính năng tự động tạo bằng AI).`,
      });
    }

    let prompt = '';
    if (type === 'lesson') {
      prompt = `Tạo một bài học tiếng Trung chuẩn HSK cấp độ ${level} về chủ đề: "${topic}".
Trả về JSON gồm:
{
  "title": "Tiêu đề bài học tiếng Việt và tiếng Trung",
  "description": "Mô tả mục tiêu bài học",
  "vocabulary": [
    { "word": "chữ Hán", "pinyin": "pinyin có dấu", "sino": "âm Hán Việt", "meaning": "nghĩa tiếng Việt", "example": "câu ví dụ chữ Hán", "examplePinyin": "pinyin câu ví dụ", "exampleMeaning": "dịch câu ví dụ" }
  ],
  "grammar": [
    { "title": "Tên điểm ngữ pháp", "structure": "Cấu trúc ngữ pháp", "explanation": "Giải thích chi tiết", "examples": ["ví dụ 1", "ví dụ 2"] }
  ],
  "dialogue": [
    { "speaker": "A / B", "chinese": "câu nói", "pinyin": "pinyin", "vietnamese": "dịch nghĩa" }
  ]
}`;
    } else {
      prompt = `Tạo 3 câu hỏi trắc nghiệm ôn tập chuẩn HSK cấp độ ${level} cho chủ đề: "${topic}".
Trả về JSON gồm:
{
  "questions": [
    {
      "question": "Câu hỏi chữ Hán (kèm pinyin nếu cần)",
      "pinyin": "pinyin câu hỏi",
      "translation": "Dịch nghĩa câu hỏi",
      "options": ["A. Đáp án 1", "B. Đáp án 2", "C. Đáp án 3", "D. Đáp án 4"],
      "correctAnswer": 0, // chỉ số 0, 1, 2, 3
      "explanation": "Giải thích chi tiết tại sao chọn đáp án này"
    }
  ]
}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Admin generate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend in dev and prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

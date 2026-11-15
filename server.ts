import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to create Gemini client with telemetry header
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) return null;
  return new GoogleGenAI({
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

    const ai = getGenAIClient();
    if (!ai) {
      return res.json({
        reply: `Chào bạn! Tôi là Lão Sư AI tiếng Trung (${hskLevel}). Bạn đang hỏi về: "${message}". Hãy chú ý ghi nhớ chữ Hán, thanh điệu Pinyin và đặt câu ví dụ thường xuyên nhé! 加油 (Jiāyóu - Cố lên)!`,
      });
    }

    const systemInstruction = `Bạn là "Lão Sư AI" - Giảng viên tiếng Trung chuyên luyện thi HSK từ HSK 1 đến HSK 5 và Giáo trình Boya cực kỳ thân thiện, sư phạm và dễ hiểu.
Đối tượng học viên là người Việt Nam đang học tiếng Trung trình độ ${hskLevel}.
Quy tắc trả lời:
1. Giải thích rõ ràng bằng tiếng Việt, kèm chữ Hán (chữ giản thể), phiên âm Pinyin có dấu thanh điệu, và dịch nghĩa.
2. Nếu học viên hỏi về ngữ pháp: Nêu công thức cấu trúc, so sánh cách dùng, lưu ý lỗi sai người Việt hay gặp, đưa ra 2-3 câu ví dụ thực tế.
3. Nếu học viên nhờ sửa câu/đoạn văn: Phân tích câu gốc, chỉ rõ chỗ sai (ngữ pháp, thanh điệu, từ ngữ), cung cấp câu sửa đúng tự nhiên và giải thích vì sao sửa như vậy.
4. Giữ giọng điệu ấm áp, khích lệ (thêm câu động viên như "加油! (Cố lên!)"). Trình bày đẹp mắt, dùng gạch đầu dòng rõ ràng.`;

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    for (const h of history.slice(-6)) {
      if (h && h.text) {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: String(h.text) }],
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: String(message) }],
    });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: contents as any,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      return res.json({
        reply: response.text || 'Xin lỗi, tôi chưa thể trả lời câu hỏi này lúc này.',
      });
    } catch (aiErr: any) {
      console.warn('Tutor Chat AI fallback:', aiErr?.message);
      return res.json({
        reply: `Chào bạn! Với câu hỏi "${message}" ở trình độ ${hskLevel}, Lão Sư gợi ý bạn lưu ý cấu trúc Chủ ngữ + Trạng ngữ thời gian/địa điểm + Động từ + Tân ngữ trong tiếng Trung nhé. Ví dụ: 我每天都在家学习汉语 (Wǒ měitiān dōu zài jiā xuéxí Hànyǔ). 加油!`,
      });
    }
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

    const ai = getGenAIClient();
    if (!ai) {
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
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const text = (response.text || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch (aiErr: any) {
      console.warn('Evaluate pronunciation AI fallback:', aiErr?.message);
      return res.json(fallbackEvaluation());
    }
  } catch (error: any) {
    console.error('Evaluate pronunciation error:', error);
    res.json({
      score: 80,
      accuracy: 'Khá',
      feedback: 'Đã nhận được phát âm của bạn. Hãy tiếp tục luyện tập nhé!',
      tips: 'Luyện tập phát âm thanh 1 ngân dài và thanh 4 dứt khoát.',
    });
  }
});

// AI Auto Lesson/Quiz Generator for Admin
app.post('/api/gemini/admin-generate', async (req, res) => {
  try {
    const { type = 'lesson', topic = 'Giao tiếp hàng ngày', level = 'HSK 2' } = req.body;

    const buildFallbackContent = () => {
      if (type === 'lesson') {
        return {
          title: `Bài học ${level}: ${topic}`,
          description: `Bài học chuẩn ${level} giúp học viên nắm vững từ vựng, ngữ pháp và hội thoại chủ đề "${topic}".`,
          vocabulary: [
            {
              word: '准备',
              pinyin: 'zhǔnbèi',
              sino: 'Chuẩn bị',
              meaning: 'Chuẩn bị, sẵn sàng',
              example: '我已经准备好参加明天的汉语考试了。',
              examplePinyin: 'Wǒ yǐjīng zhǔnbèi hǎo cānjiā míngtiān de Hànyǔ kǎoshì le.',
              exampleMeaning: 'Tôi đã chuẩn bị sẵn sàng tham gia kỳ thi tiếng Trung ngày mai.',
            },
            {
              word: '交流',
              pinyin: 'jiāoliú',
              sino: 'Giao lưu',
              meaning: 'Giao lưu, trao đổi',
              example: '我们经常用汉语交流学习经验。',
              examplePinyin: 'Wǒmen jīngcháng yòng Hànyǔ jiāoliú xuéxí jīngyàn.',
              exampleMeaning: 'Chúng tôi thường xuyên dùng tiếng Trung trao đổi kinh nghiệm học tập.',
            },
          ],
          grammar: [
            {
              title: 'Cấu trúc nhấn mạnh với 已经……了 (Đã... rồi)',
              structure: 'Chủ ngữ + 已经 + Động từ / Tính từ + 了',
              explanation: 'Biểu thị hành động hoặc trạng thái đã hoàn thành hoặc thay đổi tính đến thời điểm nói.',
              examples: [
                '他已经去北京留学了。(Anh ấy đã đi Bắc Kinh du học rồi.)',
                '天已经黑了，我们回家吧。(Trời đã tối rồi, chúng ta về nhà thôi.)',
              ],
            },
          ],
          dialogue: [
            {
              speaker: 'A',
              chinese: `你好！今天我们一起复习关于“${topic}”的生词吧。`,
              pinyin: `Nǐ hǎo! Jīntiān wǒmen yìqǐ fùxí guānyú "${topic}" de shēngcí ba.`,
              vietnamese: `Chào bạn! Hôm nay chúng ta cùng ôn tập từ mới về chủ đề "${topic}" nhé.`,
            },
            {
              speaker: 'B',
              chinese: '太好了！我已经准备好了。',
              pinyin: 'Tài hǎo le! Wǒ yǐjīng zhǔnbèi hǎo le.',
              vietnamese: 'Tuyệt quá! Mình đã chuẩn bị sẵn sàng rồi.',
            },
          ],
        };
      }

      return {
        questions: [
          {
            question: 'Chọn từ điền vào chỗ trống: "他每天都____复习汉语。"',
            pinyin: 'Tā měitiān dōu ____ fùxí Hànyǔ.',
            translation: 'Anh ấy mỗi ngày đều chăm chỉ ôn tập tiếng Trung.',
            options: ['A. 认真 (rènzhēn)', 'B. 忽然 (hūrán)', 'C. 顺便 (shùnbiàn)', 'D. 尽管 (jǐnguǎn)'],
            correctAnswer: 0,
            explanation: '"认真" (chăm chỉ, nghiêm túc) đứng trước động từ làm trạng ngữ chỉ thái độ học tập.',
          },
        ],
      };
    };

    const ai = getGenAIClient();
    if (!ai) {
      return res.json(buildFallbackContent());
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
      "correctAnswer": 0,
      "explanation": "Giải thích chi tiết tại sao chọn đáp án này"
    }
  ]
}`;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const cleanText = (response.text || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      return res.json(parsed);
    } catch (aiErr: any) {
      console.warn('Admin generate AI fallback:', aiErr?.message);
      return res.json(buildFallbackContent());
    }
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

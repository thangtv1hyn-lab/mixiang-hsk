import { Router } from 'express';
import { db } from '../dataStore.ts';
import { VocabItem, VocabDeck, HSKLevel } from '../../src/types/hsk.ts';

const router = Router();

// ======================= VOCABULARY DECKS CRUD ======================= //

// Get all vocabulary decks
router.get('/decks', (req, res) => {
  const { level, q } = req.query;
  let decks = db.vocabDecks;

  if (level && level !== 'ALL') {
    decks = decks.filter((d) => d.level === level);
  }

  if (q && typeof q === 'string') {
    const query = q.toLowerCase();
    decks = decks.filter(
      (d) =>
        d.title.toLowerCase().includes(query) ||
        (d.vietnameseTitle && d.vietnameseTitle.toLowerCase().includes(query)) ||
        d.category.toLowerCase().includes(query) ||
        d.description.toLowerCase().includes(query)
    );
  }

  res.json(decks);
});

// Get single deck with cards
router.get('/decks/:id', (req, res) => {
  const deck = db.vocabDecks.find((d) => d.id === req.params.id);
  if (!deck) {
    return res.status(404).json({ error: 'Không tìm thấy bộ từ vựng' });
  }
  res.json(deck);
});

// Admin: Create new vocabulary deck
router.post('/decks', (req, res) => {
  try {
    const { title, vietnameseTitle, description, level = 'HSK 1', category = 'Giao tiếp hàng ngày', color = 'rose', cards = [] } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Tiêu đề bộ từ vựng là bắt buộc' });
    }

    const newDeck: VocabDeck = {
      id: `deck-${Date.now()}`,
      title: title.trim(),
      vietnameseTitle: vietnameseTitle ? vietnameseTitle.trim() : title.trim(),
      description: description || 'Bộ từ vựng luyện thi HSK tiêu chuẩn',
      level: (level as HSKLevel) || 'HSK 1',
      category: category.trim(),
      color,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: 'admin',
      cards,
      cardCount: cards.length,
    };

    db.vocabDecks.unshift(newDeck);
    res.status(201).json(newDeck);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update vocabulary deck
router.put('/decks/:id', (req, res) => {
  const { id } = req.params;
  const deckIndex = db.vocabDecks.findIndex((d) => d.id === id);
  if (deckIndex === -1) {
    return res.status(404).json({ error: 'Không tìm thấy bộ từ vựng' });
  }

  const { title, vietnameseTitle, description, level, category, color, cards } = req.body;
  const deck = db.vocabDecks[deckIndex];

  if (title) deck.title = title;
  if (vietnameseTitle) deck.vietnameseTitle = vietnameseTitle;
  if (description) deck.description = description;
  if (level) deck.level = level;
  if (category) deck.category = category;
  if (color) deck.color = color;
  if (Array.isArray(cards)) {
    deck.cards = cards;
    deck.cardCount = cards.length;
  }

  res.json({ success: true, deck });
});

// Admin: Delete vocabulary deck
router.delete('/decks/:id', (req, res) => {
  const { id } = req.params;
  const index = db.vocabDecks.findIndex((d) => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy bộ từ vựng' });
  }

  db.vocabDecks.splice(index, 1);
  res.json({ success: true, message: 'Đã xóa bộ từ vựng' });
});

// ======================= FLASHCARDS INSIDE DECK CRUD ======================= //

// Admin: Add flashcard to deck
router.post('/decks/:id/cards', (req, res) => {
  try {
    const { id } = req.params;
    const deck = db.vocabDecks.find((d) => d.id === id);
    if (!deck) {
      return res.status(404).json({ error: 'Không tìm thấy bộ từ vựng' });
    }

    const {
      word,
      pinyin,
      sinoVietnamese,
      meaning,
      exampleSentence,
      examplePinyin,
      exampleMeaning,
      radical,
      strokeCount,
      category,
    } = req.body;

    if (!word || !pinyin || !meaning) {
      return res.status(400).json({ error: 'Chữ Hán, Pinyin và Nghĩa tiếng Việt là bắt buộc' });
    }

    const newCard: VocabItem = {
      id: `v-card-${Date.now()}`,
      word: word.trim(),
      pinyin: pinyin.trim(),
      sinoVietnamese: sinoVietnamese ? sinoVietnamese.trim() : '',
      meaning: meaning.trim(),
      level: deck.level,
      category: category || deck.category,
      exampleSentence: exampleSentence || `${word}。`,
      examplePinyin: examplePinyin || '',
      exampleMeaning: exampleMeaning || '',
      radical: radical || '',
      strokeCount: Number(strokeCount) || 1,
    };

    deck.cards.push(newCard);
    deck.cardCount = deck.cards.length;

    // Also add to global vocabularies if not already present
    if (!db.vocabularies.some((v) => v.word === newCard.word)) {
      db.vocabularies.push(newCard);
    }

    res.status(201).json(newCard);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update flashcard in deck
router.put('/decks/:id/cards/:cardId', (req, res) => {
  const { id, cardId } = req.params;
  const deck = db.vocabDecks.find((d) => d.id === id);
  if (!deck) {
    return res.status(404).json({ error: 'Không tìm thấy bộ từ vựng' });
  }

  const cardIndex = deck.cards.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) {
    return res.status(404).json({ error: 'Không tìm thấy thẻ flashcard' });
  }

  const {
    word,
    pinyin,
    sinoVietnamese,
    meaning,
    exampleSentence,
    examplePinyin,
    exampleMeaning,
    radical,
    strokeCount,
    category,
  } = req.body;

  const card = deck.cards[cardIndex];
  if (word) card.word = word;
  if (pinyin) card.pinyin = pinyin;
  if (sinoVietnamese !== undefined) card.sinoVietnamese = sinoVietnamese;
  if (meaning) card.meaning = meaning;
  if (exampleSentence) card.exampleSentence = exampleSentence;
  if (examplePinyin !== undefined) card.examplePinyin = examplePinyin;
  if (exampleMeaning !== undefined) card.exampleMeaning = exampleMeaning;
  if (radical !== undefined) card.radical = radical;
  if (strokeCount !== undefined) card.strokeCount = Number(strokeCount);
  if (category) card.category = category;

  res.json({ success: true, card });
});

// Admin: Delete flashcard from deck
router.delete('/decks/:id/cards/:cardId', (req, res) => {
  const { id, cardId } = req.params;
  const deck = db.vocabDecks.find((d) => d.id === id);
  if (!deck) {
    return res.status(404).json({ error: 'Không tìm thấy bộ từ vựng' });
  }

  const index = deck.cards.findIndex((c) => c.id === cardId);
  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy thẻ flashcard' });
  }

  deck.cards.splice(index, 1);
  deck.cardCount = deck.cards.length;

  res.json({ success: true, message: 'Đã xóa thẻ flashcard khỏi bộ từ' });
});

// ======================= AI FLASHCARD DECK GENERATOR ======================= //

// Admin: Generate entire Flashcard Deck using Gemini AI
router.post('/ai-generate-deck', async (req, res) => {
  try {
    const { topic = 'Giao tiếp đời sống', level = 'HSK 2', count = 10, saveImmediately = true } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Fallback deck generator in case Gemini API is busy or unconfigured
    const generateFallbackDeck = (topicName: string, hskLevel: HSKLevel): VocabDeck => {
      const fallbackCards: VocabItem[] = [
        {
          id: `card-ai-1-${Date.now()}`,
          word: '预订',
          pinyin: 'yùdìng',
          sinoVietnamese: 'Dự đính',
          meaning: 'Đặt trước (vé, phòng, chỗ)',
          level: hskLevel,
          category: topicName,
          radical: '讠 (Ngôn)',
          strokeCount: 8,
          exampleSentence: '我想预订一张明天去北京的机票。',
          examplePinyin: 'Wǒ xiǎng yùdìng yī zhāng míngtiān qù Běijīng de jīpiào.',
          exampleMeaning: 'Tôi muốn đặt trước một vé máy bay đi Bắc Kinh vào ngày mai.',
        },
        {
          id: `card-ai-2-${Date.now()}`,
          word: '特色',
          pinyin: 'tèsè',
          sinoVietnamese: 'Đặc sắc',
          meaning: 'Đặc sắc, nét đặc trưng',
          level: hskLevel,
          category: topicName,
          radical: '牛 (Ngưu)',
          strokeCount: 10,
          exampleSentence: '这里的烤鸭是很有特色的中国菜。',
          examplePinyin: 'Zhèlǐ de kǎoyā shì hěn yǒu tèsè de zhōngguócài.',
          exampleMeaning: 'Vịt quay ở đây là món ăn Trung Quốc rất đặc sắc.',
        },
        {
          id: `card-ai-3-${Date.now()}`,
          word: '交流',
          pinyin: 'jiāoliú',
          sinoVietnamese: 'Giao lưu',
          meaning: 'Giao lưu, trao đổi',
          level: hskLevel,
          category: topicName,
          radical: '亠 (Đầu)',
          strokeCount: 16,
          exampleSentence: '多和当地人交流能提高口语水平。',
          examplePinyin: 'Duō hé dāngdì rén jiāoliú néng tígāo kǒuyǔ shuǐpíng.',
          exampleMeaning: 'Giao lưu nhiều với người bản xứ giúp nâng cao trình độ khẩu ngữ.',
        },
        {
          id: `card-ai-4-${Date.now()}`,
          word: '考虑',
          pinyin: 'kǎolǜ',
          sinoVietnamese: 'Khảo lự',
          meaning: 'Cân nhắc, suy nghĩ kỹ',
          level: hskLevel,
          category: topicName,
          radical: '耂 (Lão)',
          strokeCount: 17,
          exampleSentence: '这个问题我需要再仔细考虑一下。',
          examplePinyin: 'Zhèige wèntí wǒ xūyào zài zǐxì kǎolǜ yíxià.',
          exampleMeaning: 'Vấn đề này tôi cần phải cân nhắc kỹ thêm một chút.',
        },
        {
          id: `card-ai-5-${Date.now()}`,
          word: '满意',
          pinyin: 'mǎnyì',
          sinoVietnamese: 'Mãn ý',
          meaning: 'Hài lòng, vừa ý',
          level: hskLevel,
          category: topicName,
          radical: '氵 (Thủy)',
          strokeCount: 13,
          exampleSentence: '客户对我们的服务非常满意。',
          examplePinyin: 'Kèhù duì wǒmen de fúwù fēicháng mǎnyì.',
          exampleMeaning: 'Khách hàng vô cùng hài lòng với dịch vụ của chúng tôi.',
        },
        {
          id: `card-ai-6-${Date.now()}`,
          word: '环境',
          pinyin: 'huánjìng',
          sinoVietnamese: 'Hoàn cảnh',
          meaning: 'Môi trường, hoàn cảnh xung quanh',
          level: hskLevel,
          category: topicName,
          radical: '王 (Ngọc)',
          strokeCount: 16,
          exampleSentence: '这里的学习环境很安静，非常适合读书。',
          examplePinyin: 'Zhèlǐ de xuéxí huánjìng hěn ānjìng, fēicháng shìhé dúshū.',
          exampleMeaning: 'Môi trường học tập ở đây rất yên tĩnh, rất phù hợp để đọc sách.',
        },
      ];

      return {
        id: `deck-ai-${Date.now()}`,
        title: `${hskLevel}: Chủ đề ${topicName}`,
        vietnameseTitle: `Bộ từ vựng AI: ${topicName}`,
        description: `Bộ thẻ flashcard được tạo tự động bởi Lão Sư AI cho cấp độ ${hskLevel} với chủ đề "${topicName}". Tích hợp phát âm và câu ví dụ sinh động.`,
        level: hskLevel,
        category: topicName,
        color: 'purple',
        createdAt: new Date().toISOString().split('T')[0],
        createdBy: 'ai',
        cards: fallbackCards,
        cardCount: fallbackCards.length,
      };
    };

    if (!apiKey) {
      const fallbackDeck = generateFallbackDeck(topic, level);
      if (saveImmediately) {
        db.vocabDecks.unshift(fallbackDeck);
      }
      return res.status(201).json(fallbackDeck);
    }

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const prompt = `Bạn là Lão Sư dạy tiếng Trung HSK chuyên nghiệp. Hãy biên soạn một bộ flashcard từ vựng chất lượng cao.
Chủ đề: "${topic}"
Cấp độ HSK: "${level}"
Số lượng từ vựng: ${Number(count) || 8} từ.

Yêu cầu nghiêm ngặt:
1. Từ vựng phải chuẩn xác, đúng cấp độ ${level} và bám sát chủ đề "${topic}".
2. Có đầy đủ Chữ Hán, Phiên âm Pinyin có thanh điệu chuẩn (ví dụ: nǐ hǎo, xièxie, yùdìng), Âm Hán Việt, và Nghĩa tiếng Việt ngắn gọn, chính xác.
3. Câu ví dụ tiếng Trung phải tự nhiên, có phiên âm Pinyin của cả câu và bản dịch tiếng Việt hoàn chỉnh.
4. Trả về DUY NHẤT một chuỗi JSON hợp lệ không có markdown bọc ngoài, cấu trúc chính xác như sau:
{
  "title": "Tên bộ từ vựng (ví dụ: HSK 3: Từ Vựng Mua Sắm & Ẩm Thực)",
  "vietnameseTitle": "Tiêu đề tiếng Việt ngắn gọn",
  "description": "Mô tả hấp dẫn về ứng dụng thực tế của bộ từ",
  "category": "${topic}",
  "color": "purple",
  "cards": [
    {
      "word": "chữ Hán",
      "pinyin": "pinyin có dấu",
      "sinoVietnamese": "âm Hán Việt",
      "meaning": "nghĩa tiếng Việt",
      "radical": "bộ thủ",
      "strokeCount": 8,
      "exampleSentence": "câu ví dụ tiếng Trung",
      "examplePinyin": "pinyin của câu ví dụ",
      "exampleMeaning": "dịch nghĩa câu ví dụ"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const responseText = response.text || '';
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const generatedDeck: VocabDeck = {
        id: `deck-ai-${Date.now()}`,
        title: parsed.title || `${level}: ${topic}`,
        vietnameseTitle: parsed.vietnameseTitle || `Bộ thẻ: ${topic}`,
        description: parsed.description || `Bộ từ vựng HSK do Lão Sư AI tạo theo chủ đề ${topic}.`,
        level: (level as HSKLevel) || 'HSK 2',
        category: parsed.category || topic,
        color: parsed.color || 'purple',
        createdAt: new Date().toISOString().split('T')[0],
        createdBy: 'ai',
        cards: (parsed.cards || []).map((c: any, idx: number) => ({
          id: `card-ai-${idx}-${Date.now()}`,
          word: c.word || '',
          pinyin: c.pinyin || '',
          sinoVietnamese: c.sinoVietnamese || '',
          meaning: c.meaning || '',
          level: (level as HSKLevel) || 'HSK 2',
          category: parsed.category || topic,
          radical: c.radical || '',
          strokeCount: Number(c.strokeCount) || 8,
          exampleSentence: c.exampleSentence || `${c.word}。`,
          examplePinyin: c.examplePinyin || '',
          exampleMeaning: c.exampleMeaning || '',
        })),
      };

      generatedDeck.cardCount = generatedDeck.cards.length;

      if (saveImmediately) {
        db.vocabDecks.unshift(generatedDeck);
        // Also sync cards to general vocabulary list
        generatedDeck.cards.forEach((c) => {
          if (!db.vocabularies.some((v) => v.word === c.word)) {
            db.vocabularies.push(c);
          }
        });
      }

      return res.status(201).json(generatedDeck);
    } catch (aiErr: any) {
      console.warn('Gemini Flashcard Generation fallback:', aiErr?.message);
      const fallbackDeck = generateFallbackDeck(topic, level);
      if (saveImmediately) {
        db.vocabDecks.unshift(fallbackDeck);
      }
      return res.status(201).json(fallbackDeck);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ======================= LEGACY / SEARCH VOCABULARY ======================= //

// Get vocabulary list with filters (level, search query)
router.get('/', (req, res) => {
  const { level, q } = req.query;
  let items = db.vocabularies;

  if (level && level !== 'ALL') {
    items = items.filter((v) => v.level === level);
  }

  if (q && typeof q === 'string') {
    const query = q.toLowerCase();
    items = items.filter(
      (v) =>
        v.word.includes(query) ||
        v.pinyin.toLowerCase().includes(query) ||
        v.meaning.toLowerCase().includes(query) ||
        v.sinoVietnamese.toLowerCase().includes(query)
    );
  }

  res.json({
    total: items.length,
    items,
  });
});

// Admin: Add custom vocabulary
router.post('/', (req, res) => {
  try {
    const { word, pinyin, sinoVietnamese, meaning, level, exampleSentence, exampleMeaning, radical, strokeCount } = req.body;
    if (!word || !pinyin || !meaning) {
      return res.status(400).json({ error: 'Chữ Hán, Pinyin và Nghĩa là bắt buộc' });
    }

    const newVocab: VocabItem = {
      id: `v-custom-${Date.now()}`,
      word,
      pinyin,
      sinoVietnamese: sinoVietnamese || '',
      meaning,
      level: level || 'HSK 1',
      exampleSentence: exampleSentence || `${word}。`,
      examplePinyin: '',
      exampleMeaning: exampleMeaning || '',
      radical: radical || '',
      strokeCount: Number(strokeCount) || 1,
    };

    db.vocabularies.unshift(newVocab);
    res.status(201).json(newVocab);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Student: Toggle vocabulary mastery (mastered / learning)
router.post('/:id/master', (req, res) => {
  const vocabId = req.params.id;
  const { status } = req.body; // 'mastered' | 'learning'
  const profile = db.getActiveProfile();

  if (status === 'mastered') {
    if (!profile.masteredVocabIds.includes(vocabId)) {
      profile.masteredVocabIds.push(vocabId);
      profile.xp += 10;
    }
    profile.learningVocabIds = profile.learningVocabIds.filter((id) => id !== vocabId);
  } else {
    profile.masteredVocabIds = profile.masteredVocabIds.filter((id) => id !== vocabId);
    if (!profile.learningVocabIds.includes(vocabId)) {
      profile.learningVocabIds.push(vocabId);
    }
  }

  res.json({
    success: true,
    masteredVocabIds: profile.masteredVocabIds,
    learningVocabIds: profile.learningVocabIds,
    xp: profile.xp,
  });
});

export default router;

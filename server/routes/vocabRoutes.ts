import { Router } from 'express';
import { db } from '../dataStore.ts';
import { VocabItem, VocabDeck, HSKLevel } from '../../src/types/hsk.ts';
import { generateWithFreeGemini } from '../geminiClient.ts';

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

// Admin: Create new vocabulary deck (preserve client ID if provided)
router.post('/decks', (req, res) => {
  try {
    const {
      id,
      title,
      vietnameseTitle,
      description,
      level = 'HSK 1',
      category = 'Giao tiếp hàng ngày',
      color = 'rose',
      createdAt,
      createdBy,
      cards = [],
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Tiêu đề bộ từ vựng là bắt buộc' });
    }

    const safeCards: VocabItem[] = Array.isArray(cards) ? cards : [];
    const newDeck: VocabDeck = {
      id: id || `deck-${Date.now()}`,
      title: String(title).trim(),
      vietnameseTitle: vietnameseTitle ? String(vietnameseTitle).trim() : String(title).trim(),
      description: description || 'Bộ từ vựng luyện thi HSK tiêu chuẩn',
      level: (level as HSKLevel) || 'HSK 1',
      category: String(category).trim(),
      color,
      createdAt: createdAt || new Date().toISOString().split('T')[0],
      createdBy: createdBy || 'admin',
      cards: safeCards,
      cardCount: safeCards.length,
    };

    const existingIdx = db.vocabDecks.findIndex((d) => d.id === newDeck.id);
    if (existingIdx !== -1) {
      db.vocabDecks[existingIdx] = newDeck;
    } else {
      db.vocabDecks.unshift(newDeck);
    }

    safeCards.forEach((c) => {
      if (c && c.word && !db.vocabularies.some((v) => v.word === c.word)) {
        db.vocabularies.unshift(c);
      }
    });
    db.save();

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

  if (title !== undefined) deck.title = title;
  if (vietnameseTitle !== undefined) deck.vietnameseTitle = vietnameseTitle;
  if (description !== undefined) deck.description = description;
  if (level !== undefined) deck.level = level;
  if (category !== undefined) deck.category = category;
  if (color !== undefined) deck.color = color;
  if (Array.isArray(cards)) {
    deck.cards = cards;
    deck.cardCount = cards.length;
  }
  db.save();

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
  db.save();
  res.json({ success: true, message: 'Đã xóa bộ từ vựng' });
});

// ======================= FLASHCARDS INSIDE DECK CRUD ======================= //

// Admin: Add flashcard to deck (preserve client ID if provided)
router.post('/decks/:id/cards', (req, res) => {
  try {
    const { id } = req.params;
    const deck = db.vocabDecks.find((d) => d.id === id);
    if (!deck) {
      return res.status(404).json({ error: 'Không tìm thấy bộ từ vựng' });
    }

    const {
      id: cardId,
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
      imageUrl,
    } = req.body;

    if (!word || !pinyin || !meaning) {
      return res.status(400).json({ error: 'Chữ Hán, Pinyin và Nghĩa tiếng Việt là bắt buộc' });
    }

    const newCard: VocabItem = {
      id: cardId || `v-card-${Date.now()}`,
      word: String(word).trim(),
      pinyin: String(pinyin).trim(),
      sinoVietnamese: sinoVietnamese ? String(sinoVietnamese).trim() : '',
      meaning: String(meaning).trim(),
      level: deck.level,
      category: category || deck.category,
      exampleSentence: exampleSentence || `${word}。`,
      examplePinyin: examplePinyin || '',
      exampleMeaning: exampleMeaning || '',
      radical: radical || '',
      strokeCount: Number(strokeCount) || 1,
      imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
    };

    const existingCardIdx = deck.cards.findIndex((c) => c.id === newCard.id);
    if (existingCardIdx !== -1) {
      deck.cards[existingCardIdx] = newCard;
    } else {
      deck.cards.push(newCard);
    }
    deck.cardCount = deck.cards.length;

    if (!db.vocabularies.some((v) => v.word === newCard.word)) {
      db.vocabularies.unshift(newCard);
    }
    db.save();

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
    imageUrl,
  } = req.body;

  const card = deck.cards[cardIndex];
  if (word) card.word = word;
  if (pinyin) card.pinyin = pinyin;
  if (sinoVietnamese !== undefined) card.sinoVietnamese = sinoVietnamese;
  if (meaning) card.meaning = meaning;
  if (exampleSentence !== undefined) card.exampleSentence = exampleSentence;
  if (examplePinyin !== undefined) card.examplePinyin = examplePinyin;
  if (exampleMeaning !== undefined) card.exampleMeaning = exampleMeaning;
  if (radical !== undefined) card.radical = radical;
  if (strokeCount !== undefined) card.strokeCount = Number(strokeCount);
  if (category) card.category = category;
  if (imageUrl !== undefined) card.imageUrl = imageUrl ? String(imageUrl).trim() : undefined;

  const globalVocabIdx = db.vocabularies.findIndex((v) => v.id === cardId);
  if (globalVocabIdx !== -1) {
    db.vocabularies[globalVocabIdx] = { ...db.vocabularies[globalVocabIdx], ...card };
  }
  db.save();

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
  db.save();

  res.json({ success: true, message: 'Đã xóa thẻ flashcard khỏi bộ từ' });
});

// ======================= AI FLASHCARD DECK GENERATOR ======================= //

// Admin / Student: Generate entire Flashcard Deck using Gemini AI
router.post('/ai-generate-deck', async (req, res) => {
  try {
    const {
      topic = 'Giao tiếp đời sống',
      level = 'HSK 2',
      curriculum = 'HSK',
      boyaBook = '',
      count = 10,
      saveImmediately = true,
    } = req.body;
    const requestedCount = Math.max(1, Math.min(500, Number(count) || 10));
    const isBoya = curriculum === 'BOYA' || Boolean(boyaBook) || String(topic).toLowerCase().includes('boya');
    const curriculumLabel = isBoya
      ? boyaBook || 'Giáo trình Boya (博雅汉语)'
      : `Chuẩn ${level}`;
    const apiKey = process.env.GEMINI_API_KEY;

    const seedPool: Array<Omit<VocabItem, 'id' | 'level' | 'category'>> = [
      {
        word: '留学生',
        pinyin: 'liúxuéshēng',
        sinoVietnamese: 'Lưu học sinh',
        meaning: 'Du học sinh',
        radical: '田 (Điền)',
        strokeCount: 23,
        exampleSentence: '玛丽和麦克都是北京大学的留学生。',
        examplePinyin: 'Mǎlì hé Màikè dōu shì Běijīng Dàxué de liúxuéshēng.',
        exampleMeaning: 'Mary và Mike đều là du học sinh của Đại học Bắc Kinh.',
      },
      {
        word: '宿舍',
        pinyin: 'sùshè',
        sinoVietnamese: 'Túc xá',
        meaning: 'Ký túc xá sinh viên',
        radical: '宀 (Miên)',
        strokeCount: 19,
        exampleSentence: '我们的留学生宿舍离图书馆很近。',
        examplePinyin: 'Wǒmen de liúxuéshēng sùshè lí túshūguǎn hěn jìn.',
        exampleMeaning: 'Ký túc xá du học sinh của chúng tôi cách thư viện rất gần.',
      },
      {
        word: '图书馆',
        pinyin: 'túshūguǎn',
        sinoVietnamese: 'Đồ thư quán',
        meaning: 'Thư viện trường học',
        radical: '囗 (Vi)',
        strokeCount: 23,
        exampleSentence: '周末我常去图书馆看中文杂志。',
        examplePinyin: 'Zhōumò wǒ cháng qù túshūguǎn kàn Zhōngwén zázhì.',
        exampleMeaning: 'Cuối tuần tôi thường đến thư viện đọc tạp chí tiếng Trung.',
      },
      {
        word: '食堂',
        pinyin: 'shítáng',
        sinoVietnamese: 'Thực đường',
        meaning: 'Nhà ăn, căng tin',
        radical: '食 (Thực)',
        strokeCount: 20,
        exampleSentence: '学校食堂的包子又好吃又便宜。',
        examplePinyin: 'Xuéxiào shítáng de bāozi yòu hǎochī yòu piányi.',
        exampleMeaning: 'Bánh bao ở nhà ăn trường học vừa ngon lại vừa rẻ.',
      },
      {
        word: '预订',
        pinyin: 'yùdìng',
        sinoVietnamese: 'Dự đính',
        meaning: 'Đặt trước (vé, phòng, chỗ)',
        radical: '讠 (Ngôn)',
        strokeCount: 8,
        exampleSentence: '我想预订一张明天去北京的机票。',
        examplePinyin: 'Wǒ xiǎng yùdìng yī zhāng míngtiān qù Běijīng de jīpiào.',
        exampleMeaning: 'Tôi muốn đặt trước một vé máy bay đi Bắc Kinh vào ngày mai.',
      },
      {
        word: '特色',
        pinyin: 'tèsè',
        sinoVietnamese: 'Đặc sắc',
        meaning: 'Đặc sắc, nét đặc trưng',
        radical: '牛 (Ngưu)',
        strokeCount: 10,
        exampleSentence: '这里的烤鸭是很有特色的中国菜。',
        examplePinyin: 'Zhèlǐ de kǎoyā shì hěn yǒu tèsè de zhōngguócài.',
        exampleMeaning: 'Vịt quay ở đây là món ăn Trung Quốc rất đặc sắc.',
      },
      {
        word: '顺便',
        pinyin: 'shùnbiàn',
        sinoVietnamese: 'Thuận tiện',
        meaning: 'Nhân tiện, tiện thể',
        radical: '页 (Hiệt)',
        strokeCount: 18,
        exampleSentence: '你去超市的时候，顺便帮我买一瓶牛奶吧。',
        examplePinyin: 'Nǐ qù chāoshì de shíhou, shùnbiàn bāng wǒ mǎi yì píng niúnǎi ba.',
        exampleMeaning: 'Lúc bạn đi siêu thị, tiện thể mua giúp tôi một chai sữa nhé.',
      },
      {
        word: '房东',
        pinyin: 'fángdōng',
        sinoVietnamese: 'Phòng đông',
        meaning: 'Chủ nhà cho thuê',
        radical: '户 (Hộ)',
        strokeCount: 13,
        exampleSentence: '我的房东是一位非常热情的北京老太太。',
        examplePinyin: 'Wǒ de fángdōng shì yí wèi fēicháng rèqíng de Běijīng lǎotàitai.',
        exampleMeaning: 'Chủ nhà của tôi là một cụ bà Bắc Kinh vô cùng nhiệt tình.',
      },
      {
        word: '交流',
        pinyin: 'jiāoliú',
        sinoVietnamese: 'Giao lưu',
        meaning: 'Giao lưu, trao đổi',
        radical: '亠 (Đầu)',
        strokeCount: 16,
        exampleSentence: '多和当地人交流能提高口语水平。',
        examplePinyin: 'Duō hé dāngdì rén jiāoliú néng tígāo kǒuyǔ shuǐpíng.',
        exampleMeaning: 'Giao lưu nhiều với người bản xứ giúp nâng cao trình độ khẩu ngữ.',
      },
      {
        word: '考虑',
        pinyin: 'kǎolǜ',
        sinoVietnamese: 'Khảo lự',
        meaning: 'Cân nhắc, suy nghĩ kỹ',
        radical: '耂 (Lão)',
        strokeCount: 17,
        exampleSentence: '这个问题我需要再仔细考虑一下。',
        examplePinyin: 'Zhèige wèntí wǒ xūyào zài zǐxì kǎolǜ yíxià.',
        exampleMeaning: 'Vấn đề này tôi cần phải cân nhắc kỹ thêm một chút.',
      },
      {
        word: '满意',
        pinyin: 'mǎnyì',
        sinoVietnamese: 'Mãn ý',
        meaning: 'Hài lòng, vừa ý',
        radical: '氵 (Thủy)',
        strokeCount: 13,
        exampleSentence: '客户对我们的服务非常满意。',
        examplePinyin: 'Kèhù duì wǒmen de fúwù fēicháng mǎnyì.',
        exampleMeaning: 'Khách hàng vô cùng hài lòng với dịch vụ của chúng tôi.',
      },
      {
        word: '环境',
        pinyin: 'huánjìng',
        sinoVietnamese: 'Hoàn cảnh',
        meaning: 'Môi trường, hoàn cảnh xung quanh',
        radical: '王 (Ngọc)',
        strokeCount: 16,
        exampleSentence: '这里的学习环境很安静，非常适合读书。',
        examplePinyin: 'Zhèlǐ de xuéxí huánjìng hěn ānjìng, fēicháng shìhé dúshū.',
        exampleMeaning: 'Môi trường học tập ở đây rất yên tĩnh, rất phù hợp để đọc sách.',
      },
      {
        word: '入乡随俗',
        pinyin: 'rù xiāng suí sú',
        sinoVietnamese: 'Nhập hương tùy tục',
        meaning: 'Nhập gia tùy tục',
        radical: '人 (Nhân)',
        strokeCount: 25,
        exampleSentence: '到了一个新的国家生活，我们要学会入乡随俗。',
        examplePinyin: 'Dào le yí gè xīn de guójiā shēnghuó, wǒmen yào xuéhuì rù xiāng suí sú.',
        exampleMeaning: 'Đến sống ở một đất nước mới, chúng ta cần học cách nhập gia tùy tục.',
      },
      {
        word: '潜移默化',
        pinyin: 'qián yí mò huà',
        sinoVietnamese: 'Tiềm di mặc hóa',
        meaning: 'Mưa dầm thấm lâu, tác động ngầm',
        radical: '氵 (Thủy)',
        strokeCount: 46,
        exampleSentence: '良好的家庭环境会对孩子产生潜移默化的影响。',
        examplePinyin: 'Liánghǎo de jiātíng huánjìng huì duì háizi chǎnshēng qián yí mò huà de yǐngxiǎng.',
        exampleMeaning: 'Môi trường gia đình tốt đẹp sẽ tạo ra ảnh hưởng mưa dầm thấm lâu đối với trẻ.',
      },
    ];

    // Helper to build a combined candidate pool from db.vocabularies + seedPool
    const buildSupplementalCards = (
      existingCards: VocabItem[],
      topicName: string,
      hskLevel: HSKLevel,
      targetCount: number
    ): VocabItem[] => {
      const result: VocabItem[] = [...existingCards];
      if (result.length >= targetCount) {
        return result.slice(0, targetCount);
      }

      const categoryLabel = isBoya ? `${curriculumLabel} · ${topicName}` : topicName;
      const usedWords = new Set(result.map((c) => c.word));

      // Prefer matching level/curriculum from db.vocabularies first, then all vocabularies, then seedPool
      const matchingDbVocab = db.vocabularies.filter((v) =>
        isBoya
          ? v.category?.toLowerCase().includes('boya') || v.level === hskLevel
          : v.level === hskLevel
      );
      const allCandidates: Array<Omit<VocabItem, 'id' | 'level' | 'category'>> = [
        ...matchingDbVocab,
        ...db.vocabularies,
        ...seedPool,
      ];

      for (const item of allCandidates) {
        if (result.length >= targetCount) break;
        if (!usedWords.has(item.word)) {
          usedWords.add(item.word);
          result.push({
            word: item.word,
            pinyin: item.pinyin,
            sinoVietnamese: item.sinoVietnamese,
            meaning: item.meaning,
            radical: item.radical || '口 (Khẩu)',
            strokeCount: item.strokeCount || 8,
            exampleSentence: item.exampleSentence || `${item.word}。`,
            examplePinyin: item.examplePinyin || item.pinyin,
            exampleMeaning: item.exampleMeaning || item.meaning,
            id: `card-ai-${result.length + 1}-${Date.now()}`,
            level: hskLevel,
            category: categoryLabel,
          });
        }
      }

      // If targetCount is still larger than unique items in DB, cycle through allCandidates
      let cycleIdx = 0;
      while (result.length < targetCount && allCandidates.length > 0) {
        const template = allCandidates[cycleIdx % allCandidates.length];
        cycleIdx++;
        result.push({
          word: template.word,
          pinyin: template.pinyin,
          sinoVietnamese: template.sinoVietnamese,
          meaning: template.meaning,
          radical: template.radical || '口 (Khẩu)',
          strokeCount: template.strokeCount || 8,
          exampleSentence: template.exampleSentence || `${template.word}。`,
          examplePinyin: template.examplePinyin || template.pinyin,
          exampleMeaning: template.exampleMeaning || template.meaning,
          id: `card-ai-${result.length + 1}-${Date.now()}-${cycleIdx}`,
          level: hskLevel,
          category: categoryLabel,
        });
      }

      return result;
    };

    // Fallback deck generator in case Gemini API is busy or unconfigured
    const generateFallbackDeck = (topicName: string, hskLevel: HSKLevel, targetCount: number): VocabDeck => {
      const fallbackCards = buildSupplementalCards([], topicName, hskLevel, targetCount);

      return {
        id: `deck-ai-${Date.now()}`,
        title: isBoya ? `${curriculumLabel}: ${topicName}` : `${hskLevel}: Chủ đề ${topicName}`,
        vietnameseTitle: `Bộ từ vựng (${targetCount} từ): ${topicName}`,
        description: `Bộ thẻ flashcard (${targetCount} từ) được biên soạn theo ${curriculumLabel} với chủ đề "${topicName}". Tích hợp phát âm và câu ví dụ sinh động.`,
        level: hskLevel,
        category: isBoya ? `${curriculumLabel} - ${topicName}` : topicName,
        color: isBoya ? 'emerald' : 'rose',
        createdAt: new Date().toISOString().split('T')[0],
        createdBy: 'ai',
        cards: fallbackCards,
        cardCount: fallbackCards.length,
      };
    };

    if (!apiKey) {
      const fallbackDeck = generateFallbackDeck(topic, level, requestedCount);
      if (saveImmediately) {
        db.vocabDecks.unshift(fallbackDeck);
        db.save();
      }
      return res.status(201).json(fallbackDeck);
    }

    try {
      const aiBatchCount = Math.min(requestedCount, 40);
      const prompt = `Bạn là Lão Sư dạy tiếng Trung HSK và Giáo trình Boya (博雅汉语) chuyên nghiệp. Hãy biên soạn một bộ flashcard từ vựng chất lượng cao.
Giáo trình / Cấp độ: "${curriculumLabel}" (Tương đương cấp độ ${level})
Chủ đề / Bài học: "${topic}"
Số lượng từ vựng cần tạo: ĐÚNG ${aiBatchCount} từ.

Yêu cầu nghiêm ngặt:
1. Từ vựng phải chuẩn xác, bám sát hệ giáo trình "${curriculumLabel}" (${level}) và chủ đề "${topic}", đủ ${aiBatchCount} từ.
2. Có đầy đủ Chữ Hán, Phiên âm Pinyin có thanh điệu chuẩn (ví dụ: nǐ hǎo, liúxuéshēng, yùdìng), Âm Hán Việt, và Nghĩa tiếng Việt ngắn gọn, chính xác.
3. Câu ví dụ tiếng Trung phải tự nhiên, có phiên âm Pinyin của cả câu và bản dịch tiếng Việt hoàn chỉnh.
4. Trả về DUY NHẤT một chuỗi JSON hợp lệ không có markdown bọc ngoài, cấu trúc chính xác như sau:
{
  "title": "Tên bộ từ vựng (ví dụ: ${isBoya ? `${curriculumLabel}: ${topic}` : `${level}: ${topic}`})",
  "vietnameseTitle": "Tiêu đề tiếng Việt ngắn gọn",
  "description": "Mô tả hấp dẫn về ứng dụng thực tế của bộ từ",
  "category": "${isBoya ? `${curriculumLabel} - ${topic}` : topic}",
  "color": "${isBoya ? 'emerald' : 'rose'}",
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

      const { text: responseText } = await generateWithFreeGemini({
        contents: prompt,
        responseMimeType: 'application/json',
        preferFast: true,
        timeoutMs: 25000,
      });

      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const initialAiCards: VocabItem[] = (parsed.cards || []).map((c: any, idx: number) => ({
        id: `card-ai-${idx}-${Date.now()}`,
        word: c.word || '',
        pinyin: c.pinyin || '',
        sinoVietnamese: c.sinoVietnamese || '',
        meaning: c.meaning || '',
        level: (level as HSKLevel) || 'HSK 2',
        category: parsed.category || (isBoya ? `${curriculumLabel} - ${topic}` : topic),
        radical: c.radical || '',
        strokeCount: Number(c.strokeCount) || 8,
        exampleSentence: c.exampleSentence || `${c.word}。`,
        examplePinyin: c.examplePinyin || '',
        exampleMeaning: c.exampleMeaning || '',
      }));

      const completeCards = buildSupplementalCards(
        initialAiCards,
        topic,
        (level as HSKLevel) || 'HSK 2',
        requestedCount
      );

      const generatedDeck: VocabDeck = {
        id: `deck-ai-${Date.now()}`,
        title: parsed.title || `${curriculumLabel}: ${topic}`,
        vietnameseTitle: parsed.vietnameseTitle || `Bộ thẻ (${requestedCount} từ): ${topic}`,
        description: parsed.description || `Bộ từ vựng ${curriculumLabel} (${requestedCount} từ) do Lão Sư AI tạo theo chủ đề ${topic}.`,
        level: (level as HSKLevel) || 'HSK 2',
        category: parsed.category || (isBoya ? `${curriculumLabel} - ${topic}` : topic),
        color: parsed.color || (isBoya ? 'emerald' : 'rose'),
        createdAt: new Date().toISOString().split('T')[0],
        createdBy: 'ai',
        cards: completeCards,
        cardCount: completeCards.length,
      };

      if (saveImmediately) {
        db.vocabDecks.unshift(generatedDeck);
        generatedDeck.cards.forEach((c) => {
          if (!db.vocabularies.some((v) => v.word === c.word)) {
            db.vocabularies.push(c);
          }
        });
        db.save();
      }

      return res.status(201).json({ ...generatedDeck, aiPowered: true });
    } catch (aiErr: any) {
      console.warn('Gemini Flashcard Generation fallback:', aiErr?.message);
      const fallbackDeck = generateFallbackDeck(topic, level, requestedCount);
      if (saveImmediately) {
        db.vocabDecks.unshift(fallbackDeck);
        db.save();
      }
      return res.status(201).json({ ...fallbackDeck, aiPowered: false, aiNotice: 'AI đang bận, hệ thống tạm dùng bộ từ chuẩn giáo trình.' });
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

// Admin: Add custom vocabulary (preserve client ID if provided)
router.post('/', (req, res) => {
  try {
    const {
      id,
      word,
      pinyin,
      sinoVietnamese,
      meaning,
      level,
      category,
      exampleSentence,
      examplePinyin,
      exampleMeaning,
      radical,
      strokeCount,
      imageUrl,
    } = req.body;
    if (!word || !pinyin || !meaning) {
      return res.status(400).json({ error: 'Chữ Hán, Pinyin và Nghĩa là bắt buộc' });
    }

    const newVocab: VocabItem = {
      id: id || `v-custom-${Date.now()}`,
      word: String(word).trim(),
      pinyin: String(pinyin).trim(),
      sinoVietnamese: sinoVietnamese || '',
      meaning: String(meaning).trim(),
      level: level || 'HSK 1',
      category: category || undefined,
      exampleSentence: exampleSentence || `${word}。`,
      examplePinyin: examplePinyin || '',
      exampleMeaning: exampleMeaning || '',
      radical: radical || '',
      strokeCount: Number(strokeCount) || 1,
      imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
    };

    const existingIdx = db.vocabularies.findIndex((v) => v.id === newVocab.id);
    if (existingIdx !== -1) {
      db.vocabularies[existingIdx] = newVocab;
    } else {
      db.vocabularies.unshift(newVocab);
    }
    db.save();

    res.status(201).json(newVocab);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Student: Toggle vocabulary mastery (mastered / learning)
router.post('/:id/master', (req, res) => {
  const vocabId = req.params.id;
  const { status } = req.body; // 'mastered' | 'learning'
  const profile = db.getActiveProfile(req);

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

  db.syncProfileToAppUser(profile);

  res.json({
    success: true,
    masteredVocabIds: profile.masteredVocabIds,
    learningVocabIds: profile.learningVocabIds,
    xp: profile.xp,
  });
});

export default router;

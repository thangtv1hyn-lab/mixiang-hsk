import { Router } from 'express';
import { db } from '../dataStore.ts';
import { ForumPost, ForumReply } from '../../src/types/hsk.ts';
import { GoogleGenAI } from '@google/genai';

const router = Router();

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

// Get all forum posts
router.get('/', (req, res) => {
  const { category, level, q } = req.query;
  let posts = db.forumPosts;

  if (category && category !== 'Tất cả') {
    posts = posts.filter((p) => p.category === category);
  }

  if (level && level !== 'Toàn bộ') {
    posts = posts.filter((p) => p.level === level);
  }

  if (q && typeof q === 'string') {
    const query = q.toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query)
    );
  }

  res.json(posts);
});

// Get single post with replies
router.get('/:id', (req, res) => {
  const post = db.forumPosts.find((p) => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Không tìm thấy bài viết' });
  }
  res.json(post);
});

// Create new forum post
router.post('/', (req, res) => {
  try {
    const { title, content, level, category, tags = [] } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Tiêu đề và nội dung là bắt buộc' });
    }

    const user = db.users[0];
    const newPost: ForumPost = {
      id: `fp-${Date.now()}`,
      authorName: user?.name || 'Học viên',
      authorAvatar: user?.avatar || '',
      role: 'student',
      title: title.trim(),
      content: content.trim(),
      level: level || 'HSK 3',
      category: category || 'Ngữ pháp',
      tags: Array.isArray(tags) ? tags : [tags],
      likes: 1,
      repliesCount: 0,
      createdAt: new Date().toISOString(),
      isPinned: false,
      isSolved: false,
      replies: [],
    };

    db.forumPosts.unshift(newPost);
    res.status(201).json(newPost);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add reply to post
router.post('/:id/replies', (req, res) => {
  try {
    const post = db.forumPosts.find((p) => p.id === req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    const { content, role = 'student' } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Nội dung câu trả lời là bắt buộc' });
    }

    const user = db.users[0];
    const newReply: ForumReply = {
      id: `fr-${Date.now()}`,
      authorName: role === 'admin' ? 'Quản trị viên / Giáo viên' : user?.name || 'Học viên',
      authorAvatar: role === 'admin' ? '' : user?.avatar || '',
      role: role as any,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    post.replies.push(newReply);
    post.repliesCount = post.replies.length;

    res.status(201).json(newReply);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger AI Tutor automated answer inside the forum thread
router.post('/:id/ai-solve', async (req, res) => {
  try {
    const post = db.forumPosts.find((p) => p.id === req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    let aiContent = '';
    if (ai) {
      const prompt = `Bạn là Lão Sư AI giảng viên tiếng Trung chuyên luyện thi HSK 1 - 5.
Hãy giải đáp câu hỏi của học viên sau trên diễn đàn một cách chi tiết, sư phạm, có chữ Hán, Pinyin và ví dụ cụ thể:
Tiêu đề: ${post.title}
Nội dung: ${post.content}
Cấp độ: ${post.level}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      aiContent = response.text || 'Lão Sư đã tiếp nhận câu hỏi của bạn. Hãy kiên trì học tập nhé!';
    } else {
      aiContent = `Chào bạn! Lão Sư AI xin phân tích điểm ngữ pháp trong câu hỏi "${post.title}":
1. Cấu trúc ngữ pháp chuẩn HSK và vị trí các từ.
2. Ví dụ thực tế: 我每天都努力学习汉语 (Mỗi ngày tôi đều nỗ lực học tiếng Trung).
加油！Cố lên bạn nhé!`;
    }

    const aiReply: ForumReply = {
      id: `fr-ai-${Date.now()}`,
      authorName: 'Lão Sư AI (Trợ lý Giáo viên)',
      authorAvatar: '',
      role: 'ai',
      content: aiContent,
      createdAt: new Date().toISOString(),
      likes: 3,
    };

    post.replies.push(aiReply);
    post.repliesCount = post.replies.length;
    post.isSolved = true;

    res.status(201).json({ success: true, reply: aiReply, post });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Like post
router.post('/:id/like', (req, res) => {
  const post = db.forumPosts.find((p) => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Không tìm thấy bài viết' });
  }
  post.likes += 1;
  res.json({ success: true, likes: post.likes });
});

// Toggle solved
router.post('/:id/toggle-solved', (req, res) => {
  const post = db.forumPosts.find((p) => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Không tìm thấy bài viết' });
  }
  post.isSolved = !post.isSolved;
  res.json({ success: true, isSolved: post.isSolved });
});

// Admin: Toggle pin
router.post('/:id/toggle-pin', (req, res) => {
  const post = db.forumPosts.find((p) => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Không tìm thấy bài viết' });
  }
  post.isPinned = !post.isPinned;
  res.json({ success: true, isPinned: post.isPinned });
});

export default router;

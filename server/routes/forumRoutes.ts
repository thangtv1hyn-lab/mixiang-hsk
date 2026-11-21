import { Router } from 'express';
import { db } from '../dataStore.js';
import { ForumPost, ForumReply } from '../../src/types/hsk.js';
import { generateWithFreeGemini } from '../geminiClient.js';

const router = Router();

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

// Create new forum post (preserve client ID and author info if provided)
router.post('/', (req, res) => {
  try {
    const {
      id,
      title,
      content,
      level,
      category,
      tags = [],
      authorName,
      authorAvatar,
      role,
      isPinned = false,
      isSolved = false,
    } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Tiêu đề và nội dung là bắt buộc' });
    }

    const activeProfile = db.getActiveProfile(req);
    const newPost: ForumPost = {
      id: id || `fp-${Date.now()}`,
      authorName: authorName || activeProfile?.name || 'Học viên',
      authorAvatar: authorAvatar !== undefined ? authorAvatar : activeProfile?.avatar || '',
      role: role || activeProfile?.role || 'student',
      title: String(title).trim(),
      content: String(content).trim(),
      level: level || 'HSK 3',
      category: category || 'Ngữ pháp',
      tags: Array.isArray(tags) ? tags : [tags],
      likes: 1,
      repliesCount: 0,
      createdAt: new Date().toISOString(),
      isPinned: Boolean(isPinned),
      isSolved: Boolean(isSolved),
      replies: [],
    };

    const existingIdx = db.forumPosts.findIndex((p) => p.id === newPost.id);
    if (existingIdx !== -1) {
      db.forumPosts[existingIdx] = newPost;
    } else {
      db.forumPosts.unshift(newPost);
    }
    db.save();

    res.status(201).json(newPost);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete forum post (Admin)
router.delete('/:id', (req, res) => {
  const index = db.forumPosts.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Không tìm thấy bài viết' });
  }
  const deleted = db.forumPosts.splice(index, 1)[0];
  db.save();
  res.json({ success: true, deleted });
});

// Add reply to post
router.post('/:id/replies', (req, res) => {
  try {
    const post = db.forumPosts.find((p) => p.id === req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    const { id: replyId, content, role = 'student', authorName, authorAvatar } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Nội dung câu trả lời là bắt buộc' });
    }

    const activeProfile = db.getActiveProfile(req);
    const newReply: ForumReply = {
      id: replyId || `fr-${Date.now()}`,
      authorName:
        authorName ||
        (role === 'admin' ? 'Quản trị viên / Giáo viên' : activeProfile?.name || 'Học viên'),
      authorAvatar:
        authorAvatar !== undefined
          ? authorAvatar
          : role === 'admin'
            ? ''
            : activeProfile?.avatar || '',
      role: role as any,
      content: String(content).trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    post.replies.push(newReply);
    post.repliesCount = post.replies.length;
    if (role === 'ai') {
      post.isSolved = true;
    }
    db.save();

    res.status(201).json(newReply);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger AI Tutor automated answer inside the forum thread (Free Gemini API)
router.post('/:id/ai-solve', async (req, res) => {
  try {
    const post = db.forumPosts.find((p) => p.id === req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return res.status(503).json({
        error: 'Hệ thống chưa cấu hình GEMINI_API_KEY cho Lão Sư AI.',
      });
    }

    const prompt = `Bạn là Lão Sư AI giảng viên tiếng Trung chuyên luyện thi HSK 1 - 5 và Giáo trình Boya.
Hãy giải đáp câu hỏi của học viên sau trên diễn đàn một cách chi tiết, sư phạm, dễ hiểu cho người Việt, có chữ Hán, Pinyin có dấu thanh điệu và 2-3 ví dụ cụ thể:
Tiêu đề: ${post.title}
Nội dung: ${post.content}
Cấp độ: ${post.level}`;

    const { text: aiContent } = await generateWithFreeGemini({
      contents: prompt,
      preferFast: true,
      timeoutMs: 18000,
    });

    const aiReply: ForumReply = {
      id: `fr-ai-${Date.now()}`,
      authorName: 'Lão Sư AI (Trợ lý Giáo viên)',
      authorAvatar: '',
      role: 'ai',
      content: aiContent,
      createdAt: new Date().toISOString(),
      likes: 1,
    };

    post.replies.push(aiReply);
    post.repliesCount = post.replies.length;
    post.isSolved = true;
    db.save();

    res.status(201).json({ success: true, aiPowered: true, reply: aiReply, post });
  } catch (err: any) {
    console.error('Forum AI solve error:', err?.message || err);
    res.status(502).json({
      error: 'Không thể kết nối Lão Sư AI giải đáp lúc này. Vui lòng thử lại sau giây lát.',
      details: err?.message,
    });
  }
});

// Like post
router.post('/:id/like', (req, res) => {
  const post = db.forumPosts.find((p) => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Không tìm thấy bài viết' });
  }
  post.likes += 1;
  db.save();
  res.json({ success: true, likes: post.likes });
});

// Toggle solved
router.post('/:id/toggle-solved', (req, res) => {
  const post = db.forumPosts.find((p) => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Không tìm thấy bài viết' });
  }
  post.isSolved = !post.isSolved;
  db.save();
  res.json({ success: true, isSolved: post.isSolved });
});

// Admin: Toggle pin
router.post('/:id/toggle-pin', (req, res) => {
  const post = db.forumPosts.find((p) => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Không tìm thấy bài viết' });
  }
  post.isPinned = !post.isPinned;
  db.save();
  res.json({ success: true, isPinned: post.isPinned });
});

export default router;

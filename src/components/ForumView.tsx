import React, { useState } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  MessageCircle,
  Pin,
  CheckCircle2,
  PlusCircle,
  Sparkles,
  Search,
  Filter,
  Send,
  User,
  ArrowLeft,
  Tag,
  ShieldCheck,
  Bot,
} from 'lucide-react';
import { useHSK } from '../context/HSKContext';
import { ForumPost, HSKLevel } from '../types/hsk';

export const ForumView: React.FC = () => {
  const {
    forumPosts,
    addForumPost,
    addForumReply,
    likeForumPost,
    togglePinPost,
    toggleSolvedPost,
    userRole,
    studentProfile,
  } = useHSK();

  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');
  const [activeLevel, setActiveLevel] = useState<string>('Toàn bộ');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);

  // New post modal state
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'Ngữ pháp' | 'Từ vựng' | 'Kinh nghiệm thi' | 'Chữa bài' | 'Hỏi đáp chung'>('Ngữ pháp');
  const [newLevel, setNewLevel] = useState<HSKLevel | 'Toàn bộ'>('HSK 3');
  const [newTags, setNewTags] = useState('Ngữ pháp, Thảo luận');

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [isAiAnswering, setIsAiAnswering] = useState(false);

  const categories = ['Tất cả', 'Ngữ pháp', 'Từ vựng', 'Kinh nghiệm thi', 'Chữa bài', 'Hỏi đáp chung'];

  const filteredPosts = forumPosts.filter((post) => {
    const matchesCat = activeCategory === 'Tất cả' || post.category === activeCategory;
    const matchesLvl = activeLevel === 'Toàn bộ' || post.level === activeLevel;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesLvl && matchesSearch;
  });

  // Handle post creation
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    addForumPost({
      authorName: userRole === 'admin' ? 'Quản trị viên / Giáo viên' : studentProfile.name,
      authorAvatar: userRole === 'admin' ? '' : studentProfile.avatar,
      role: userRole === 'admin' ? 'admin' : 'student',
      title: newTitle.trim(),
      content: newContent.trim(),
      level: newLevel,
      category: newCategory,
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
    });

    setNewTitle('');
    setNewContent('');
    setIsNewPostOpen(false);
  };

  // Handle user reply
  const handleSendReply = () => {
    if (!replyText.trim() || !selectedPost) return;
    addForumReply(
      selectedPost.id,
      replyText.trim(),
      userRole === 'admin' ? 'admin' : 'student'
    );
    setReplyText('');

    // Update selected post state locally
    setSelectedPost((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        repliesCount: prev.repliesCount + 1,
        replies: [
          ...prev.replies,
          {
            id: `fr-${Date.now()}`,
            authorName: userRole === 'admin' ? 'Quản trị viên / Giáo viên' : studentProfile.name,
            authorAvatar: userRole === 'admin' ? '' : studentProfile.avatar,
            role: userRole === 'admin' ? 'admin' : 'student',
            content: replyText.trim(),
            createdAt: new Date().toISOString(),
            likes: 0,
          },
        ],
      };
    });
  };

  // Request AI Tutor response right into the thread!
  const handleRequestAiReply = async () => {
    if (!selectedPost || isAiAnswering) return;
    setIsAiAnswering(true);

    try {
      const response = await fetch('/api/gemini/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Học viên hỏi trong diễn đàn:\nTiêu đề: ${selectedPost.title}\nNội dung: ${selectedPost.content}\nTrình độ: ${selectedPost.level}`,
          hskLevel: selectedPost.level,
        }),
      });

      const data = await response.json();
      const aiReplyContent = data.reply || 'Lão Sư đã tiếp nhận câu hỏi của bạn và sẽ phân tích sớm nhất!';

      // Add to forum context
      addForumReply(selectedPost.id, aiReplyContent, 'teacher');

      setSelectedPost((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          repliesCount: prev.repliesCount + 1,
          isSolved: true,
          replies: [
            ...prev.replies,
            {
              id: `fr-ai-${Date.now()}`,
              authorName: 'Lão Sư AI (Trợ lý Giáo viên)',
              authorAvatar: '',
              role: 'ai',
              content: aiReplyContent,
              createdAt: new Date().toISOString(),
              likes: 1,
            },
          ],
        };
      });
    } catch (err) {
      console.error('AI answer error:', err);
    } finally {
      setIsAiAnswering(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Thread Detail View */}
      {selectedPost ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <button
            onClick={() => setSelectedPost(null)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách câu hỏi</span>
          </button>

          {/* Main Post Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-bold flex items-center justify-center overflow-hidden">
                  {selectedPost.authorAvatar ? (
                    <img
                      src={selectedPost.authorAvatar}
                      alt={selectedPost.authorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{selectedPost.authorName.slice(0, 2)}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {selectedPost.authorName}
                    </span>
                    {selectedPost.role === 'admin' && (
                      <span className="px-1.5 py-0.2 rounded-md bg-[#18181B] text-white text-[10px] font-bold">
                        Quản trị
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(selectedPost.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {selectedPost.level}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  {selectedPost.category}
                </span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {selectedPost.title}
            </h1>

            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line py-2">
              {selectedPost.content}
            </div>

            {/* Tags & Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedPost.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => likeForumPost(selectedPost.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{selectedPost.likes} Thích</span>
                </button>

                {/* AI Tutor Assistant Trigger */}
                <button
                  onClick={handleRequestAiReply}
                  disabled={isAiAnswering}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all shadow-xs disabled:opacity-50"
                  title="Nhờ Lão Sư AI phân tích và giải đáp ngay"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAiAnswering ? 'AI đang soạn bài...' : 'Nhờ Lão Sư AI giải đáp'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Replies Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-base text-[#18181B] flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-red-600" />
              <span>Các câu trả lời ({selectedPost.replies.length})</span>
            </h3>

            {selectedPost.replies.map((reply) => {
              const isAi = reply.role === 'ai' || reply.authorName.includes('AI');

              return (
                <div
                  key={reply.id}
                  className={`rounded-2xl border p-5 shadow-xs space-y-3 ${
                    isAi
                      ? 'bg-amber-50/40 border-amber-200 ring-1 ring-amber-300/40'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isAi
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isAi ? <Bot className="w-4 h-4" /> : reply.authorName.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {reply.authorName}
                          </span>
                          {isAi && (
                            <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                              AI Tutor 24/7
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(reply.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line pl-10">
                    {reply.content}
                  </div>
                </div>
              );
            })}

            {/* Reply Input Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-700 block">
                Viết câu trả lời / chia sẻ của bạn:
              </span>
              <textarea
                rows={3}
                placeholder="Nhập câu trả lời, chia sẻ kinh nghiệm hoặc thảo luận..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              ></textarea>
              <div className="flex justify-end">
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi câu trả lời</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Forum Posts List */
        <div className="space-y-6">
          {/* Top Forum Banner & Ask Button */}
          <div className="bg-gradient-to-r from-rose-900 via-red-900 to-amber-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-white/10 text-rose-200 border border-white/20 mb-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Cộng đồng Học viên & Giảng viên HSK</span>
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Diễn Đàn Trao Đổi & Hỏi Đáp Trực Tuyến
                </h1>
                <p className="text-xs sm:text-sm text-rose-100 max-w-xl mt-1 leading-relaxed">
                  Đặt câu hỏi về ngữ pháp, nhờ sửa bài viết, chia sẻ bí quyết thi HSK và nhận giải đáp từ bạn bè cùng Lão Sư AI 24/7.
                </p>
              </div>

              <button
                onClick={() => setIsNewPostOpen(true)}
                className="px-5 py-3 rounded-xl bg-white text-rose-900 hover:bg-rose-50 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-rose-700" />
                <span>Đặt câu hỏi mới</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80">
            {/* Category tabs */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs font-medium">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? 'bg-rose-600 text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm chủ đề, ngữ pháp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className={`bg-white rounded-2xl border p-5 transition-all duration-200 hover:shadow-md cursor-pointer ${
                  post.isPinned ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200 hover:border-rose-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {post.isPinned && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                        <Pin className="w-3 h-3 fill-amber-700" />
                        Ghim
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      {post.level}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {post.category}
                    </span>
                  </div>

                  {post.isSolved && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                      <CheckCircle2 className="w-3 h-3 text-red-600" />
                      Đã giải đáp
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base text-slate-900 group-hover:text-rose-600 transition-colors mb-1">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                  {post.content}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">{post.authorName}</span>
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>

                  <div className="flex items-center gap-4 text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {post.repliesCount} trả lời
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Post Modal */}
      {isNewPostOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Đặt câu hỏi mới lên Diễn đàn</h3>
            <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tiêu đề câu hỏi / Vấn đề cần trao đổi:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phân biệt cách dùng giữa '刚' và '刚才' trong HSK 3..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Chuyên mục:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  >
                    <option value="Ngữ pháp">Ngữ pháp</option>
                    <option value="Từ vựng">Từ vựng</option>
                    <option value="Kinh nghiệm thi">Kinh nghiệm thi</option>
                    <option value="Chữa bài">Chữa bài viết</option>
                    <option value="Hỏi đáp chung">Hỏi đáp chung</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Trình độ HSK:</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  >
                    <option value="Toàn bộ">Toàn bộ</option>
                    <option value="HSK 1">HSK 1</option>
                    <option value="HSK 2">HSK 2</option>
                    <option value="HSK 3">HSK 3</option>
                    <option value="HSK 4">HSK 4</option>
                    <option value="HSK 5">HSK 5</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nội dung chi tiết:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Mô tả cụ thể câu hỏi, cấu trúc câu bạn chưa hiểu hoặc bài tập cần chữa..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-rose-500"
                ></textarea>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tags (cách nhau bởi dấu phẩy):</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewPostOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs"
                >
                  Đăng câu hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

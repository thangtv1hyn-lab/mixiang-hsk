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
  Send,
  ArrowLeft,
  Bot,
  X,
} from 'lucide-react';
import { useHSK } from '../context/HSKContext';
import { ForumPost, HSKLevel } from '../types/hsk';
import { safeParseJson } from '../utils/safeFetchJson';

export const ForumView: React.FC = () => {
  const {
    forumPosts,
    addForumPost,
    addForumReply,
    likeForumPost,
    userRole,
    studentProfile,
  } = useHSK();

  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);

  // New post modal state
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<
    'Ngữ pháp' | 'Từ vựng' | 'Kinh nghiệm thi' | 'Chữa bài' | 'Hỏi đáp chung'
  >('Ngữ pháp');
  const [newLevel, setNewLevel] = useState<HSKLevel | 'Toàn bộ'>('HSK 3');
  const [newTags, setNewTags] = useState('Ngữ pháp, Thảo luận');

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [isAiAnswering, setIsAiAnswering] = useState(false);
  const [aiError, setAiError] = useState('');

  const categories = ['Tất cả', 'Ngữ pháp', 'Từ vựng', 'Kinh nghiệm thi', 'Chữa bài', 'Hỏi đáp chung'];

  const filteredPosts = forumPosts.filter((post) => {
    const matchesCat = activeCategory === 'Tất cả' || post.category === activeCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

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

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedPost) return;
    addForumReply(
      selectedPost.id,
      replyText.trim(),
      userRole === 'admin' ? 'admin' : 'student'
    );

    const content = replyText.trim();
    setReplyText('');

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
            content,
            createdAt: new Date().toISOString(),
            likes: 0,
          },
        ],
      };
    });
  };

  const handleRequestAiReply = async () => {
    if (!selectedPost || isAiAnswering) return;
    setIsAiAnswering(true);
    setAiError('');

    try {
      const response = await fetch('/api/gemini/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Học viên hỏi trong diễn đàn:\nTiêu đề: ${selectedPost.title}\nNội dung: ${selectedPost.content}\nTrình độ: ${selectedPost.level}\nHãy giải đáp chi tiết, sư phạm, kèm chữ Hán, Pinyin và ví dụ.`,
          hskLevel: selectedPost.level,
        }),
      });

      const data = await safeParseJson<{ reply?: string; error?: string }>(
        response,
        'Lão Sư AI đang bận, vui lòng thử lại sau giây lát.'
      );
      if (!response.ok || !data.reply) {
        throw new Error(data.error || 'Lão Sư AI đang bận, vui lòng thử lại sau giây lát.');
      }

      addForumReply(selectedPost.id, data.reply, 'ai');
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
              content: data.reply,
              createdAt: new Date().toISOString(),
              likes: 1,
            },
          ],
        };
      });
    } catch (err: any) {
      console.error('AI answer error:', err);
      setAiError(err?.message || 'Không thể kết nối Lão Sư AI lúc này. Vui lòng thử lại.');
    } finally {
      setIsAiAnswering(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {selectedPost ? (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => setSelectedPost(null)}
            className="flex items-center gap-2 text-[16px] font-bold text-[#18181B] hover:text-red-700 cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
            <span>Quay lại danh sách câu hỏi</span>
          </button>

          {/* Main Post Card */}
          <div className="bg-white rounded-3xl border border-[#E6DEC8] p-6 sm:p-8 shadow-2xs space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-700 text-white font-black text-[14px] flex items-center justify-center overflow-hidden shrink-0">
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
                  <div className="flex items-center gap-2 text-[16px] font-black text-[#18181B]">
                    <span>{selectedPost.authorName}</span>
                    {selectedPost.role === 'admin' && (
                      <span className="text-[13px] text-red-700 font-bold">· Quản trị</span>
                    )}
                  </div>
                  <span className="text-[13px] text-slate-500">
                    {new Date(selectedPost.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              <div className="text-[14px] font-bold text-red-700">
                {selectedPost.level} · {selectedPost.category}
              </div>
            </div>

            <h1 className="font-sans text-[22px] sm:text-[26px] font-extrabold text-[#18181B] leading-snug">
              {selectedPost.title}
            </h1>

            <p className="text-[15.5px] sm:text-[16.5px] text-slate-800 leading-relaxed whitespace-pre-line">
              {selectedPost.content}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-[#F5EFEB]">
              <div className="flex flex-wrap items-center gap-3 text-[14px] text-slate-600 font-semibold">
                {selectedPost.tags.map((tag, idx) => (
                  <span key={idx}>#{tag}</span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => likeForumPost(selectedPost.id)}
                  className="flex items-center gap-2 text-[14px] font-bold px-4 py-2.5 rounded-xl border border-[#E6DEC8] text-[#18181B] hover:border-red-700 hover:text-red-700 transition-colors cursor-pointer"
                >
                  <ThumbsUp className="w-5 h-5" />
                  <span className="tabular-nums">{selectedPost.likes} Thích</span>
                </button>

                <button
                  type="button"
                  onClick={handleRequestAiReply}
                  disabled={isAiAnswering}
                  className="flex items-center gap-2 text-[14px] font-bold px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>{isAiAnswering ? 'AI đang soạn bài...' : 'Nhờ Lão Sư AI giải đáp'}</span>
                </button>
              </div>
            </div>
            {aiError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13.5px] font-semibold flex items-center justify-between gap-3">
                <span>{aiError}</span>
                <button
                  type="button"
                  onClick={handleRequestAiReply}
                  className="px-3 py-1 rounded-lg bg-red-700 text-white text-[12.5px] font-bold hover:bg-red-800 shrink-0 cursor-pointer"
                >
                  Thử lại
                </button>
              </div>
            )}
          </div>

          {/* Replies Section */}
          <div className="space-y-4">
            <h2 className="font-black text-[21px] text-[#18181B] flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-red-700" />
              <span>Các câu trả lời ({selectedPost.replies.length})</span>
            </h2>

            {selectedPost.replies.map((reply) => {
              const isAi = reply.role === 'ai' || reply.authorName.includes('AI');

              return (
                <div
                  key={reply.id}
                  className={`rounded-3xl border p-6 space-y-3 ${
                    isAi
                      ? 'bg-[#FFFBF2] border-amber-400'
                      : 'bg-white border-[#E6DEC8]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 ${
                        isAi ? 'bg-[#18181B] text-amber-300' : 'bg-red-700 text-white'
                      }`}
                    >
                      {isAi ? <Bot className="w-5 h-5" /> : reply.authorName.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-black text-[16px] text-[#18181B]">
                        {reply.authorName}
                        {isAi && <span className="text-red-700 text-[13px] ml-2">· Trợ lý AI 24/7</span>}
                      </div>
                      <span className="text-[12px] text-slate-500">
                        {new Date(reply.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  <p className="text-[15.5px] sm:text-[16px] text-[#18181B] leading-relaxed whitespace-pre-line">
                    {reply.content}
                  </p>
                </div>
              );
            })}

            {/* Reply Input Box */}
            <div className="bg-white rounded-3xl border border-[#E6DEC8] p-6 space-y-4">
              <label htmlFor="forum-reply-box" className="text-[18px] font-black text-[#18181B] block">
                Viết câu trả lời của bạn:
              </label>
              <textarea
                id="forum-reply-box"
                rows={3}
                placeholder="Nhập câu trả lời, chia sẻ kinh nghiệm hoặc thảo luận..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full p-4 text-[16px] rounded-2xl border border-[#E6DEC8] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  className="px-6 py-3 rounded-2xl bg-[#18181B] hover:bg-red-700 text-white font-bold text-[16px] flex items-center gap-2 disabled:opacity-40 cursor-pointer transition-colors"
                >
                  <Send className="w-5 h-5" />
                  <span>Gửi câu trả lời</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Forum Banner */}
          <div className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-red-400/70">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-[14px] font-bold text-amber-200">
                  <MessageSquare className="w-5 h-5" />
                  <span>Cộng đồng Học viên & Giảng viên HSK</span>
                </div>
                <h1 className="font-sans text-[24px] sm:text-[30px] font-extrabold tracking-tight leading-tight">
                  Diễn Đàn Trao Đổi &amp; Hỏi Đáp Trực Tuyến
                </h1>
                <p className="text-[15.5px] sm:text-[16.5px] text-rose-50 max-w-2xl leading-relaxed">
                  Đặt câu hỏi ngữ pháp, nhờ sửa bài viết và nhận giải đáp từ bạn bè cùng Lão Sư AI 24/7.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNewPostOpen(true)}
                className="px-6 py-3.5 min-h-[48px] rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#18181B] font-extrabold text-[15px] shadow-md transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Đặt câu hỏi mới</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-[#E6DEC8] space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-[14px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-red-700 text-white'
                      : 'bg-[#FAF7F0] text-[#18181B] border border-[#E6DEC8] hover:border-red-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm chủ đề, ngữ pháp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-[16px] rounded-2xl border border-[#E6DEC8] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700"
              />
            </div>
          </div>

          {/* Posts List */}
          {filteredPosts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-[#D6CBB3] p-10 sm:p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF7F0] border border-[#E8DFCE] text-[#C85A43] flex items-center justify-center mx-auto">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="font-sans text-[18px] font-bold text-[#18181B]">
                  Không tìm thấy bài viết phù hợp
                </h3>
                <p className="text-[14.5px] text-slate-600 leading-relaxed">
                  Thử xóa bộ lọc tìm kiếm hoặc đặt câu hỏi đầu tiên cho chủ đề này để cộng đồng và Lão Sư AI hỗ trợ bạn.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                {(searchQuery || activeCategory !== 'Tất cả') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('Tất cả');
                    }}
                    className="px-4 py-2.5 min-h-[44px] rounded-xl border border-[#E8DFCE] bg-[#FAF7F0] hover:bg-white text-[#18181B] font-bold text-[14px] cursor-pointer transition-colors"
                  >
                    Xem tất cả bài viết
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsNewPostOpen(true)}
                  className="px-5 py-2.5 min-h-[44px] rounded-xl bg-[#C85A43] hover:bg-[#B24A34] text-white font-bold text-[14px] inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Đặt câu hỏi mới</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setSelectedPost(post)}
                  className={`w-full text-left bg-white rounded-3xl border p-5 sm:p-6 transition-all hover:shadow-md cursor-pointer block space-y-3 ${
                    post.isPinned
                      ? 'border-amber-500 bg-[#FFFDF8]'
                      : 'border-[#E6DEC8] hover:border-red-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[13.5px] font-bold">
                    <div className="flex items-center gap-2 text-slate-600">
                      {post.isPinned && (
                        <span className="inline-flex items-center gap-1 text-amber-800">
                          <Pin className="w-4 h-4 fill-amber-700" />
                          <span>Ghim ·</span>
                        </span>
                      )}
                      <span className="text-red-700 font-black">{post.level}</span>
                      <span aria-hidden="true">·</span>
                      <span>{post.category}</span>
                    </div>

                    {post.isSolved && (
                      <span className="flex items-center gap-1.5 text-emerald-700 font-extrabold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã giải đáp</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-sans font-extrabold text-[19px] sm:text-[20px] text-[#18181B] leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-[15px] sm:text-[15.5px] text-slate-700 line-clamp-2 leading-relaxed">
                    {post.content}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-[13.5px] text-slate-600 pt-3 border-t border-[#F5EFEB]">
                    <div className="flex items-center gap-2 font-bold">
                      <span className="text-[#18181B]">{post.authorName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>

                    <div className="flex items-center gap-5 font-bold tabular-nums">
                      <span className="flex items-center gap-1.5">
                        <ThumbsUp className="w-4 h-4 text-red-700" />
                        <span>{post.likes}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-red-700" />
                        <span>{post.repliesCount} trả lời</span>
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Post Modal */}
      {isNewPostOpen && (
        <div
          onClick={() => setIsNewPostOpen(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 border-2 border-[#E6DEC8] max-h-[90vh] overflow-y-auto relative"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-sans text-[20px] font-extrabold text-[#18181B]">
                Đặt câu hỏi mới lên Diễn đàn
              </h3>
              <button
                type="button"
                onClick={() => setIsNewPostOpen(false)}
                aria-label="Đóng cửa sổ đặt câu hỏi"
                className="w-9 h-9 rounded-full text-slate-500 hover:text-red-700 hover:bg-[#FAF7F0] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePost} className="space-y-4 text-[14px]">
              <div>
                <label className="font-bold text-[#18181B] block mb-1.5">
                  Tiêu đề câu hỏi:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phân biệt '刚' và '刚才' trong HSK 3..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E6DEC8] bg-[#FAF7F0] font-medium focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#18181B] block mb-1.5">Chuyên mục:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-3 rounded-xl border border-[#E6DEC8] bg-[#FAF7F0]"
                  >
                    <option value="Ngữ pháp">Ngữ pháp</option>
                    <option value="Từ vựng">Từ vựng</option>
                    <option value="Kinh nghiệm thi">Kinh nghiệm thi</option>
                    <option value="Chữa bài">Chữa bài viết</option>
                    <option value="Hỏi đáp chung">Hỏi đáp chung</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#18181B] block mb-1.5">Trình độ HSK:</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value as any)}
                    className="w-full p-3 rounded-xl border border-[#E6DEC8] bg-[#FAF7F0]"
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
                <label className="font-bold text-[#18181B] block mb-1.5">Nội dung chi tiết:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Mô tả cụ thể câu hỏi hoặc bài tập cần chữa..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E6DEC8] bg-[#FAF7F0] font-medium focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-[#18181B] block mb-1.5">Từ khóa (cách nhau bởi dấu phẩy):</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E6DEC8] bg-[#FAF7F0]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewPostOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-[#18181B] hover:bg-[#FAF7F0] font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold cursor-pointer"
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

import React, { useState } from 'react';
import {
  Smartphone,
  X,
  Volume2,
  CheckCircle2,
  BookOpen,
  Layers,
  GraduationCap,
  MessageCircle,
  Flame,
  Award,
  Bell,
  Sparkles,
  QrCode,
  Share2,
  Maximize2,
  RotateCw,
  Send,
} from 'lucide-react';
import { useHSK } from '../context/HSKContext';
import { speakChinese } from '../utils/audioSpeech';

export const MobileAppCompanion: React.FC = () => {
  const {
    isMobileCompanionOpen,
    setIsMobileCompanionOpen,
    studentProfile,
    vocabularies,
    courses,
    exams,
    showPinyin,
  } = useHSK();

  const [mobileTab, setMobileTab] = useState<'home' | 'vocab' | 'quiz' | 'ai' | 'profile'>('home');
  const [mobileVocabIdx, setMobileVocabIdx] = useState(0);
  const [mobileAiMessages, setMobileAiMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([
    {
      role: 'model',
      text: '你好！我是你的中文AI老师。今天想问什么问题呢？(Xin chào! Tôi là Lão Sư AI của bạn. Hôm nay bạn muốn hỏi điều gì?)',
    },
  ]);
  const [mobileAiInput, setMobileAiInput] = useState('');
  const [isAiReplying, setIsAiReplying] = useState(false);

  if (!isMobileCompanionOpen) return null;

  const currentMobileVocab = vocabularies[mobileVocabIdx] || vocabularies[0];

  const handleSendMobileAi = async () => {
    if (!mobileAiInput.trim() || isAiReplying) return;
    const userMsg = mobileAiInput.trim();
    setMobileAiMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setMobileAiInput('');
    setIsAiReplying(true);

    try {
      const res = await fetch('/api/gemini/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMobileAiMessages((prev) => [
        ...prev,
        { role: 'model', text: data.reply || '加油！Cố lên bạn nhé!' },
      ]);
    } catch {
      setMobileAiMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Chào bạn! Hãy tiếp tục luyện nghe và đọc nhé. 加油！' },
      ]);
    } finally {
      setIsAiReplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 max-h-[95vh] overflow-y-auto">
        {/* Left Side: Mobile App Description & QR code */}
        <div className="text-white space-y-4 max-w-md hidden md:block">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <Smartphone className="w-3.5 h-3.5 text-rose-400" />
            <span>Ứng Dụng Di Động Đi Kèm (Mobile Companion)</span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight">
            MiXiang HSK App Trên Điện Thoại
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed">
            Học viên có thể học mọi lúc mọi nơi trên điện thoại thông minh: lướt flashcard, nghe phát âm thanh điệu, thi trắc nghiệm nhanh 5 phút trên xe bus, và trò chuyện trực tiếp với Lão Sư AI.
          </p>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl p-1.5 flex items-center justify-center shrink-0">
                <QrCode className="w-full h-full text-slate-900" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-white block">Quét mã QR để mở trên điện thoại</span>
                <span className="text-slate-400 text-[11px]">Tương thích iOS Safari & Android Chrome</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-700">
              💡 Ứng dụng hỗ trợ PWA cài đặt trực tiếp vào màn hình chính điện thoại (Add to Home Screen).
            </div>
          </div>
        </div>

        {/* Right Side: Simulated Phone Device */}
        <div className="relative w-[340px] sm:w-[360px] h-[640px] bg-slate-950 rounded-[48px] p-3.5 shadow-2xl border-4 border-slate-700 ring-1 ring-white/20 flex flex-col shrink-0">
          {/* Dynamic Island / Speaker Notch */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-30 flex items-center justify-end pr-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700"></div>
          </div>

          {/* Phone Screen Container */}
          <div className="relative w-full h-full bg-slate-50 rounded-[38px] overflow-hidden flex flex-col text-slate-800">
            {/* Phone Status Bar */}
            <div className="h-9 px-6 flex items-center justify-between text-[11px] font-bold text-slate-700 pt-1 shrink-0">
              <span>09:41</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]">5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* Phone Screen Content Area */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
              {/* Home Subtab */}
              {mobileTab === 'home' && (
                <div className="space-y-3">
                  {/* Greeting & Streak */}
                  <div className="bg-gradient-to-r from-rose-600 to-red-500 rounded-2xl p-4 text-white shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-rose-100">Chào bạn,</span>
                        <h4 className="font-bold text-sm">{studentProfile.name}</h4>
                      </div>
                      <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                        <Flame className="w-3.5 h-3.5 text-amber-300" />
                        <span>{studentProfile.streakDays} ngày</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-rose-400/40 flex items-center justify-between text-[11px]">
                      <span>Mục tiêu: {studentProfile.targetLevel}</span>
                      <span>⭐ {studentProfile.xp} XP</span>
                    </div>
                  </div>

                  {/* Daily Flashcard Mini Widget */}
                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Từ vựng hôm nay</span>
                      <button
                        onClick={() => speakChinese(currentMobileVocab.word)}
                        className="text-rose-600 hover:text-rose-700"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-center py-2 bg-slate-50 rounded-xl">
                      <span className="font-serif text-3xl font-black text-slate-900 block">
                        {currentMobileVocab.word}
                      </span>
                      <span className="text-xs font-bold text-rose-600 font-mono block">
                        {currentMobileVocab.pinyin}
                      </span>
                      <span className="text-xs text-slate-600 block mt-0.5">
                        {currentMobileVocab.meaning}
                      </span>
                    </div>

                    <button
                      onClick={() => setMobileTab('vocab')}
                      className="w-full py-1.5 text-center text-[11px] font-bold text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
                    >
                      Mở thẻ Flashcard ➔
                    </button>
                  </div>

                  {/* Quick Lesson list */}
                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2">
                    <span className="text-xs font-bold text-slate-900 block">Bài học tiếp theo</span>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                      <span className="font-bold text-slate-800 block">Bài 1: 你好！(Xin chào)</span>
                      <span className="text-[11px] text-slate-500 block">HSK 1 • 25 phút</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Vocab Subtab */}
              {mobileTab === 'vocab' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Thẻ {mobileVocabIdx + 1} / {vocabularies.length}</span>
                    <button
                      onClick={() =>
                        setMobileVocabIdx((prev) =>
                          prev < vocabularies.length - 1 ? prev + 1 : 0
                        )
                      }
                      className="text-rose-600"
                    >
                      Từ tiếp ➔
                    </button>
                  </div>

                  {/* Card */}
                  <div className="bg-white rounded-3xl p-6 border-2 border-rose-100 shadow-sm text-center space-y-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      {currentMobileVocab.level}
                    </span>

                    <h2 className="font-serif text-5xl font-black text-slate-900 py-3">
                      {currentMobileVocab.word}
                    </h2>

                    <p className="font-mono text-sm font-bold text-rose-600">
                      {currentMobileVocab.pinyin}
                    </p>

                    <p className="text-xs font-bold text-slate-800">
                      {currentMobileVocab.meaning}
                    </p>

                    <div className="pt-2">
                      <button
                        onClick={() => speakChinese(currentMobileVocab.word)}
                        className="p-2.5 rounded-full bg-rose-600 text-white shadow-xs"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-100 p-3 rounded-xl text-xs text-slate-600">
                    <span className="font-bold block text-[11px] text-slate-800">Ví dụ:</span>
                    <p className="font-medium">{currentMobileVocab.exampleSentence}</p>
                    <p className="text-[11px] text-slate-500">{currentMobileVocab.exampleMeaning}</p>
                  </div>
                </div>
              )}

              {/* AI Chat Subtab */}
              {mobileTab === 'ai' && (
                <div className="flex flex-col h-[460px] space-y-2">
                  <div className="flex-1 overflow-y-auto space-y-2 p-1 text-xs">
                    {mobileAiMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                          msg.role === 'user'
                            ? 'ml-auto bg-rose-600 text-white rounded-br-none'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-2xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    ))}
                    {isAiReplying && (
                      <div className="p-2 rounded-xl bg-white border text-[11px] text-slate-400 animate-pulse">
                        Lão Sư đang trả lời...
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200">
                    <input
                      type="text"
                      placeholder="Hỏi Lão Sư AI..."
                      value={mobileAiInput}
                      onChange={(e) => setMobileAiInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMobileAi()}
                      className="flex-1 p-2 text-xs rounded-xl border border-slate-200 bg-white"
                    />
                    <button
                      onClick={handleSendMobileAi}
                      className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Profile Subtab */}
              {mobileTab === 'profile' && (
                <div className="space-y-3 text-xs">
                  <div className="bg-white p-4 rounded-2xl border text-center space-y-2">
                    <img
                      src={studentProfile.avatar}
                      alt={studentProfile.name}
                      className="w-14 h-14 rounded-full mx-auto object-cover border-2 border-rose-500"
                    />
                    <h4 className="font-bold text-sm text-slate-900">{studentProfile.name}</h4>
                    <p className="text-slate-400 text-[11px]">{studentProfile.email}</p>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                      Mục tiêu {studentProfile.targetLevel}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Chuỗi ngày học:</span>
                      <span className="font-bold text-orange-600">{studentProfile.streakDays} ngày</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Điểm tích lũy:</span>
                      <span className="font-bold text-amber-600">{studentProfile.xp} XP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bài hoàn thành:</span>
                      <span className="font-bold text-slate-800">{studentProfile.completedLessonIds.length} bài</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Mobile Navigation Bar */}
            <div className="h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 shrink-0">
              <button
                onClick={() => setMobileTab('home')}
                className={`flex flex-col items-center text-[10px] font-bold ${
                  mobileTab === 'home' ? 'text-rose-600' : 'text-slate-400'
                }`}
              >
                <BookOpen className="w-4 h-4 mb-0.5" />
                <span>Học tập</span>
              </button>

              <button
                onClick={() => setMobileTab('vocab')}
                className={`flex flex-col items-center text-[10px] font-bold ${
                  mobileTab === 'vocab' ? 'text-rose-600' : 'text-slate-400'
                }`}
              >
                <Layers className="w-4 h-4 mb-0.5" />
                <span>Từ vựng</span>
              </button>

              <button
                onClick={() => setMobileTab('ai')}
                className={`flex flex-col items-center text-[10px] font-bold ${
                  mobileTab === 'ai' ? 'text-rose-600' : 'text-slate-400'
                }`}
              >
                <Sparkles className="w-4 h-4 mb-0.5 text-amber-500" />
                <span>Lão Sư AI</span>
              </button>

              <button
                onClick={() => setMobileTab('profile')}
                className={`flex flex-col items-center text-[10px] font-bold ${
                  mobileTab === 'profile' ? 'text-rose-600' : 'text-slate-400'
                }`}
              >
                <Award className="w-4 h-4 mb-0.5" />
                <span>Cá nhân</span>
              </button>
            </div>
          </div>
        </div>

        {/* Close Button Top Right */}
        <button
          onClick={() => setIsMobileCompanionOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          title="Đóng giả lập di động"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

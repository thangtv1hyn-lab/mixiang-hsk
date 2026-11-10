import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Volume2,
  Bot,
  User,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Minimize2,
} from 'lucide-react';
import { useHSK } from '../context/HSKContext';
import { speakChinese } from '../utils/audioSpeech';

interface AITutorFloatingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AITutorFloatingDrawer: React.FC<AITutorFloatingDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { studentProfile } = useHSK();

  const [messages, setMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([
    {
      role: 'model',
      text: `你好！我是你的中文AI老师 (Lão Sư AI) 🏮
Rất vui được hỗ trợ bạn học tiếng Trung! Tôi có thể:
1. Giải thích cặn kẽ các điểm ngữ pháp HSK 1 đến HSK 5
2. Sửa lỗi ngữ pháp, dùng từ và thanh điệu trong câu của bạn
3. Cung cấp ví dụ thực tế và giải đáp đề thi thử HSK.
Bạn có câu hỏi nào cần giải đáp ngay không?`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'Giải thích cấu trúc câu chữ "把" trong HSK 3 - 4',
    'Phân biệt cách dùng giữa "能" (néng) và "可以" (kěyǐ)',
    'Sửa giúp tôi câu này: 我昨天买两本书了',
    'Tổng hợp 5 mẫu câu chào hỏi lịch sự cho HSK 1 - 2',
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMessage = text.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
          hskLevel: studentProfile.targetLevel,
        }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: data.reply || 'Xin lỗi, Lão Sư chưa phản hồi được câu hỏi này. Bạn hãy thử lại nhé!',
        },
      ]);
    } catch (err) {
      console.error('Tutor chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: 'Rất tiếc, đã có lỗi kết nối tới máy chủ. Vui lòng thử lại sau giây lát!',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[440px] h-[580px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-900 via-red-800 to-amber-900 text-white p-4 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-amber-300 shadow-xs">
            <span className="font-serif text-lg">师</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm">Lão Sư AI (Trợ Lý Tiếng Trung)</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-[11px] text-rose-200">Giải đáp ngữ pháp & luyện thi HSK 1 - 5</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          title="Thu nhỏ"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] font-medium shrink-0">
        <span className="text-slate-400 shrink-0 ml-1">Gợi ý:</span>
        {suggestedPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 whitespace-nowrap transition-colors shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={index}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${
                  isUser
                    ? 'bg-rose-600 text-white'
                    : 'bg-amber-500 text-white shadow-xs'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                  isUser
                    ? 'bg-rose-600 text-white rounded-tr-none'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none shadow-2xs whitespace-pre-line'
                }`}
              >
                {msg.text}

                {!isUser && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-end">
                    <button
                      onClick={() => {
                        // Extract Chinese text from message to speak
                        const chineseMatch = msg.text.match(/[\u4e00-\u9fa5]+/g);
                        if (chineseMatch) {
                          speakChinese(chineseMatch.join(' '));
                        }
                      }}
                      className="text-[11px] text-slate-500 hover:text-rose-600 flex items-center gap-1 font-medium"
                      title="Nghe phát âm các từ tiếng Trung trong câu"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Nghe mẫu tiếng Hán</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic p-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>Lão Sư AI đang soạn câu trả lời chi tiết...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Hỏi Lão Sư về ngữ pháp, sửa câu tiếng Trung..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 text-white disabled:opacity-40 shadow-xs transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

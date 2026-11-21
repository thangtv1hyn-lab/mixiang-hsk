import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Volume2, Bot, User, RefreshCw, AlertCircle } from 'lucide-react';
import { useHSK } from '../context/HSKContext';
import { speakChinese } from '../utils/audioSpeech';
import { safeParseJson } from '../utils/safeFetchJson';

interface AITutorFloatingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  retryPrompt?: string;
}

// Lightweight safe renderer for bold (**text**) and headings (###) without dangerouslySetInnerHTML
function renderFormattedLine(line: string, lineIdx: number) {
  const trimmed = line.trim();
  if (trimmed.startsWith('### ')) {
    return (
      <div key={lineIdx} className="font-extrabold text-[#1C1E21] mt-2 mb-1">
        {trimmed.slice(4)}
      </div>
    );
  }
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return (
    <div key={lineIdx} className={trimmed === '' ? 'h-2' : ''}>
      {parts.map((part, idx) =>
        part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
          <strong key={idx} className="font-bold text-[#1C1E21]">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <React.Fragment key={idx}>{part}</React.Fragment>
        )
      )}
    </div>
  );
}

export const AITutorFloatingDrawer: React.FC<AITutorFloatingDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { studentProfile } = useHSK();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: `你好！我是你的中文AI老师 (Lão Sư AI)
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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string, isRetry = false) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMessage = text.trim();
    const cleanHistory = messages
      .filter((m) => !m.isError)
      .map((m) => ({ role: m.role, text: m.text }));

    if (isRetry) {
      setMessages((prev) => prev.filter((m) => !m.isError));
    } else {
      setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
      if (!textToSend) setInputText('');
    }
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: cleanHistory,
          hskLevel: studentProfile.targetLevel,
        }),
      });

      const data = await safeParseJson<{ reply?: string; error?: string }>(
        response,
        'Không thể kết nối Lão Sư AI lúc này. Vui lòng bấm gửi lại sau vài giây.'
      );
      if (!response.ok || !data.reply) {
        throw new Error(data.error || 'Lão Sư AI chưa thể phản hồi lúc này.');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: data.reply,
        },
      ]);
    } catch (err: any) {
      console.error('Tutor chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text:
            err?.message ||
            'Rất tiếc, đã có lỗi kết nối tới Lão Sư AI. Bạn hãy bấm Thử lại nhé!',
          isError: true,
          retryPrompt: userMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Trò chuyện với Lão Sư AI"
      className="fixed inset-x-3 bottom-20 lg:inset-x-auto lg:bottom-6 lg:right-6 z-50 lg:w-[440px] h-[min(580px,calc(100vh-7.5rem))] bg-white rounded-3xl shadow-2xl border border-[#EAE5DC] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#C85A43] via-red-600 to-red-700 text-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center font-bold text-amber-200 shrink-0">
            <span className="font-serif text-[20px]">师</span>
          </div>
          <div className="min-w-0">
            <h3 className="font-sans font-bold text-[15px] leading-tight truncate">
              Lão Sư AI · Trợ Lý Tiếng Trung
            </h3>
            <p className="text-[12px] text-rose-100 truncate">
              Giải đáp ngữ pháp &amp; luyện thi HSK 1 – 5
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng khung chat Lão Sư AI"
          className="w-9 h-9 rounded-full hover:bg-white/15 text-white/90 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-2.5 bg-[#FAF7F0] border-b border-[#EAE5DC] flex items-center gap-2 overflow-x-auto text-[12px] font-semibold shrink-0">
        <span className="text-[#686B72] shrink-0 ml-1">Gợi ý:</span>
        {suggestedPrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => handleSendMessage(p)}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#EAE5DC] text-[#1C1E21] hover:border-[#C85A43] hover:text-[#C85A43] hover:bg-[#FFF5F3] whitespace-nowrap transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[13.5px] sm:text-[14px] bg-[#FDFBF7]">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={index}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold ${
                  isUser
                    ? 'bg-[#C85A43] text-white'
                    : msg.isError
                    ? 'bg-red-100 text-red-600'
                    : 'bg-[#1C1E21] text-amber-300 shadow-2xs'
                }`}
              >
                {isUser ? (
                  <User className="w-4 h-4" />
                ) : msg.isError ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div
                className={`p-3.5 rounded-2xl max-w-[84%] leading-relaxed break-words ${
                  isUser
                    ? 'bg-[#C85A43] text-white rounded-tr-xs'
                    : msg.isError
                    ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-xs'
                    : 'bg-white border border-[#EAE5DC] text-[#1C1E21] rounded-tl-xs shadow-2xs'
                }`}
              >
                {isUser ? (
                  <div className="whitespace-pre-line">{msg.text}</div>
                ) : (
                  <div className="space-y-0.5">
                    {msg.text.split('\n').map((line, lIdx) => renderFormattedLine(line, lIdx))}
                  </div>
                )}

                {msg.isError && msg.retryPrompt && (
                  <div className="mt-2.5 pt-2 border-t border-red-200 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSendMessage(msg.retryPrompt, true)}
                      className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Thử gửi lại</span>
                    </button>
                  </div>
                )}

                {!isUser && !msg.isError && /[\u4e00-\u9fa5]/.test(msg.text) && (
                  <div className="mt-2.5 pt-2 border-t border-[#EFE7D6] flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const chineseMatch = msg.text.match(/[\u4e00-\u9fa5]+/g);
                        if (chineseMatch) {
                          speakChinese(chineseMatch.join(' '));
                        }
                      }}
                      className="text-[12px] text-[#686B72] hover:text-[#C85A43] flex items-center gap-1.5 font-bold cursor-pointer transition-colors"
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
          <div className="flex items-center gap-2.5 text-[#686B72] text-[13px] font-medium p-2">
            <span className="w-2 h-2 rounded-full bg-[#C85A43] animate-bounce" />
            <span>Lão Sư AI đang soạn câu trả lời chi tiết...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white border-t border-[#EAE5DC] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            aria-label="Nhập câu hỏi cho Lão Sư AI"
            placeholder="Hỏi Lão Sư về ngữ pháp, sửa câu tiếng Trung..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-3.5 py-2.5 min-h-[44px] text-[14px] rounded-2xl border border-[#EAE5DC] bg-[#FAF7F0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C85A43]/20 focus:border-[#C85A43] text-[#1C1E21]"
          />
          <button
            type="submit"
            aria-label="Gửi câu hỏi"
            disabled={!inputText.trim() || isLoading}
            className="w-11 h-11 rounded-2xl bg-[#C85A43] hover:bg-[#B24A34] text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors flex items-center justify-center cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

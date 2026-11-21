import React, { useState, useEffect } from 'react';
import { Bell, X, Clock, Target, Sparkles, Check } from 'lucide-react';
import { useHSK } from '../context/HSKContext';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose }) => {
  const { studentProfile, updateReminderSettings } = useHSK();

  const [enabled, setEnabled] = useState(studentProfile.reminderEnabled);
  const [time, setTime] = useState(studentProfile.reminderTime || '20:30');
  const [dailyGoal, setDailyGoal] = useState(studentProfile.dailyGoalMinutes || 30);
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [dailyProverb, setDailyProverb] = useState<{
    chinese: string;
    pinyin: string;
    vietnamese: string;
  }>({
    chinese: '千里之行，始于足下。',
    pinyin: 'Qiān lǐ zhī xíng, shǐ yú zú xià.',
    vietnamese: 'Hành trình vạn dặm bắt đầu từ một bước chân. (Lão Tử)',
  });

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/reminders/daily')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.proverb) {
          setDailyProverb(data.proverb);
        }
      })
      .catch(() => {});

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateReminderSettings(enabled, time, dailyGoal);
    onClose();
  };

  const handleTriggerTestNotification = () => {
    setTestNotificationSent(true);

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('MiXiangg HSK: Đã đến giờ học!', {
          body: `Đừng quên duy trì chuỗi học ${studentProfile.streakDays} ngày của bạn hôm nay nhé! Mục tiêu: ${dailyGoal} phút.`,
          icon: '/favicon.ico',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('MiXiangg HSK: Đã đến giờ học!', {
              body: `Đừng quên duy trì chuỗi học ${studentProfile.streakDays} ngày của bạn hôm nay nhé!`,
            });
          }
        });
      }
    }

    setTimeout(() => setTestNotificationSent(false), 4000);
  };

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Nhắc nhở học tập hàng ngày"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#E8DFCE] max-h-[92vh] overflow-y-auto space-y-5 relative"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ nhắc nhở"
          className="absolute top-5 right-5 w-9 h-9 rounded-full text-[#686B72] hover:text-[#1C1E21] hover:bg-[#FAF7F0] flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-[#FFF5F3] text-[#C85A43] flex items-center justify-center border border-[#F5DDD6] shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans text-[18px] font-extrabold text-[#1C1E21] leading-snug">
              Nhắc Nhở Học Tập Hàng Ngày
            </h3>
            <p className="text-[13px] text-[#686B72]">
              Duy trì thói quen học tiếng Trung đều đặn mỗi ngày
            </p>
          </div>
        </div>

        {/* Motivational Chinese Quote Card */}
        <div className="bg-[#FAF7F0] rounded-2xl p-4 border border-[#E8DFCE] space-y-1.5">
          <span className="font-bold text-[#C85A43] flex items-center gap-1.5 text-[11.5px] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Danh ngôn tiếng Trung hôm nay</span>
          </span>
          <p className="font-serif text-[18px] font-bold text-[#1C1E21] pt-0.5">
            {dailyProverb.chinese}
          </p>
          <p className="text-[#C85A43] font-mono text-[12.5px] font-semibold">
            {dailyProverb.pinyin}
          </p>
          <p className="text-[13.5px] text-[#3B3E45] leading-relaxed">
            ➔ {dailyProverb.vietnamese}
          </p>
        </div>

        {/* Settings Form */}
        <div className="space-y-4">
          {/* Toggle Enable */}
          <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-[#E8DFCE] bg-[#FDFBF7]">
            <div>
              <span className="text-[14px] font-bold text-[#1C1E21] block">
                Bật thông báo nhắc nhở
              </span>
              <span className="text-[#686B72] text-[12.5px]">
                Gửi thông báo đẩy về máy vào giờ hẹn
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label="Bật hoặc tắt thông báo nhắc nhở"
              onClick={() => setEnabled(!enabled)}
              className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                enabled ? 'bg-[#C85A43] justify-end' : 'bg-[#D6CBB3] justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
            </button>
          </div>

          {/* Time Picker */}
          <div>
            <label
              htmlFor="reminder-time-input"
              className="text-[13.5px] font-bold text-[#1C1E21] mb-1.5 flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4 text-[#C85A43]" />
              <span>Thời gian nhắc nhở mỗi ngày</span>
            </label>
            <input
              id="reminder-time-input"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[44px] rounded-2xl border border-[#E8DFCE] bg-[#FAF7F0] focus:bg-white font-mono font-bold text-[#1C1E21] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#C85A43]/20 focus:border-[#C85A43]"
            />
          </div>

          {/* Daily Goal minutes */}
          <div>
            <span className="text-[13.5px] font-bold text-[#1C1E21] mb-2 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-[#C85A43]" />
              <span>Mục tiêu thời gian học mỗi ngày</span>
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDailyGoal(mins)}
                  className={`py-2.5 min-h-[44px] rounded-xl text-[13.5px] font-bold border transition-all cursor-pointer tabular-nums ${
                    dailyGoal === mins
                      ? 'bg-[#C85A43] text-white border-[#C85A43] shadow-xs'
                      : 'bg-[#FAF7F0] text-[#1C1E21] border-[#E8DFCE] hover:border-[#C85A43]/60 hover:bg-white'
                  }`}
                >
                  {mins}p
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Test Notification Banner */}
        {testNotificationSent && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-[13px] font-medium text-emerald-900 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Đã kích hoạt thông báo! Chuỗi ngày học của bạn là{' '}
              <strong className="tabular-nums">{studentProfile.streakDays} ngày</strong>.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EFE7D6]">
          <button
            type="button"
            onClick={handleTriggerTestNotification}
            className="text-[13px] font-bold text-[#C85A43] hover:underline cursor-pointer"
          >
            Thử gửi thông báo ➔
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 min-h-[44px] rounded-xl text-[13.5px] font-bold text-[#3B3E45] hover:bg-[#FAF7F0] border border-[#E8DFCE] cursor-pointer transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 min-h-[44px] rounded-xl text-[13.5px] font-bold bg-[#C85A43] text-white hover:bg-[#B24A34] shadow-xs cursor-pointer transition-colors"
            >
              Lưu cài đặt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

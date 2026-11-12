import React, { useState } from 'react';
import {
  Bell,
  X,
  Clock,
  Target,
  Sparkles,
  Check,
  Flame,
  Volume2,
} from 'lucide-react';
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
  const [dailyProverb, setDailyProverb] = useState<{ chinese: string; pinyin: string; vietnamese: string }>({
    chinese: '千里之行，始于足下。',
    pinyin: 'Qiān lǐ zhī xíng, shǐ yú zú xià.',
    vietnamese: 'Hành trình vạn dặm bắt đầu từ một bước chân. (Lão Tử)',
  });

  React.useEffect(() => {
    if (isOpen) {
      fetch('/api/reminders/daily')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.proverb) {
            setDailyProverb(data.proverb);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateReminderSettings(enabled, time, dailyGoal);
    onClose();
  };

  const handleTriggerTestNotification = () => {
    setTestNotificationSent(true);

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('🔔 MiXiangg HSK: Đã đến giờ học!', {
          body: `Đừng quên duy trì chuỗi học ${studentProfile.streakDays} ngày của bạn hôm nay nhé! Mục tiêu: ${dailyGoal} phút.`,
          icon: '/favicon.ico',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('🔔 MiXiangg HSK: Đã đến giờ học!', {
              body: `Đừng quên duy trì chuỗi học ${studentProfile.streakDays} ngày của bạn hôm nay nhé!`,
            });
          }
        });
      }
    }

    setTimeout(() => setTestNotificationSent(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Nhắc Nhở Học Tập Hàng Ngày
            </h3>
            <p className="text-xs text-slate-500">
              Duy trì thói quen học tiếng Trung đều đặn mỗi ngày
            </p>
          </div>
        </div>

        {/* Motivational Chinese Quote Card */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200/80 text-xs space-y-1">
          <span className="font-bold text-amber-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Danh ngôn tiếng Trung hôm nay:</span>
          </span>
          <p className="font-serif text-base font-bold text-slate-900 pt-1">
            {dailyProverb.chinese}
          </p>
          <p className="text-amber-800 font-mono text-[11px] italic">
            {dailyProverb.pinyin}
          </p>
          <p className="text-slate-600 pt-0.5">
            ➔ {dailyProverb.vietnamese}
          </p>
        </div>

        {/* Settings Form */}
        <div className="space-y-4 text-xs">
          {/* Toggle Enable */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50">
            <div>
              <span className="font-bold text-slate-900 block">Bật thông báo nhắc nhở</span>
              <span className="text-slate-500 text-[11px]">Gửi thông báo đẩy về máy vào giờ hẹn</span>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                enabled ? 'bg-rose-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs"></div>
            </button>
          </div>

          {/* Time Picker */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Thời gian nhắc nhở mỗi ngày:</span>
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 text-sm focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Daily Goal minutes */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-slate-400" />
              <span>Mục tiêu thời gian học mỗi ngày:</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDailyGoal(mins)}
                  className={`py-2 rounded-xl font-bold border transition-all ${
                    dailyGoal === mins
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {mins} phút
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Test Notification Banner */}
        {testNotificationSent && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              Đã kích hoạt thông báo! Chuỗi ngày học của bạn là {studentProfile.streakDays} ngày.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleTriggerTestNotification}
            className="text-xs font-bold text-red-700 hover:text-red-800"
          >
            Thử gửi thông báo ➔
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
            >
              Lưu cài đặt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

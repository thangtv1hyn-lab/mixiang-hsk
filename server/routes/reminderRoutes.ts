import { Router } from 'express';
import { db } from '../dataStore.ts';

const router = Router();

// Proverb pool for daily inspiration
const DAILY_PROVERBS = [
  {
    chinese: '学而时习之，不亦说乎？',
    pinyin: 'Xué ér shí xí zhī, bù yì yuè hū?',
    vietnamese: 'Học mà thường xuyên ôn tập, chẳng phải vui lắm sao? (Khổng Tử)',
  },
  {
    chinese: '千里之行，始于足下。',
    pinyin: 'Qiān lǐ zhī xíng, shǐ yú zú xià.',
    vietnamese: 'Hành trình vạn dặm bắt đầu từ một bước chân. (Lão Tử)',
  },
  {
    chinese: '世上无难事，只怕有心人。',
    pinyin: 'Shì shàng wú nán shì, zhǐ pà yǒu xīn rén.',
    vietnamese: 'Trên đời không có việc gì khó, chỉ sợ lòng không bền.',
  },
  {
    chinese: '熟能生巧。',
    pinyin: 'Shú néng shēng qiǎo.',
    vietnamese: 'Trăm hay không bằng tay quen / Luyện tập nhiều ắt thành thạo.',
  },
  {
    chinese: '一寸光阴一寸金，寸金难买寸光阴。',
    pinyin: 'Yī cùn guāng yīn yī cùn jīn, cùn jīn nán mǎi cùn guāng yīn.',
    vietnamese: 'Một tấc thời gian một tấc vàng, tấc vàng khó mua được tấc thời gian.',
  },
];

// GET /api/reminders/daily
router.get('/daily', (req, res) => {
  const profile = db.getActiveProfile();
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const proverb = DAILY_PROVERBS[dayOfYear % DAILY_PROVERBS.length];

  const today = new Date().toISOString().split('T')[0];
  const todayMinutes = profile.studyLog[today] || 0;
  const goalMinutes = profile.dailyGoalMinutes || 30;
  const progressPercent = Math.min(100, Math.round((todayMinutes / goalMinutes) * 100));

  res.json({
    proverb,
    streakDays: profile.streakDays,
    reminderTime: profile.reminderTime,
    reminderEnabled: profile.reminderEnabled,
    todayMinutes,
    dailyGoalMinutes: goalMinutes,
    progressPercent,
    goalCompleted: todayMinutes >= goalMinutes,
  });
});

// POST /api/reminders/settings
router.post('/settings', (req, res) => {
  const { enabled, time, dailyGoal } = req.body;
  const profile = db.getActiveProfile();

  if (typeof enabled === 'boolean') profile.reminderEnabled = enabled;
  if (time) profile.reminderTime = time;
  if (dailyGoal) profile.dailyGoalMinutes = Number(dailyGoal);

  res.json({
    success: true,
    message: 'Đã cập nhật cài đặt nhắc nhở học tập',
    reminderEnabled: profile.reminderEnabled,
    reminderTime: profile.reminderTime,
    dailyGoalMinutes: profile.dailyGoalMinutes,
  });
});

export default router;

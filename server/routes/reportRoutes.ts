import { Router } from 'express';
import { db } from '../dataStore.ts';

const router = Router();

// Get learning progress analytics summary
router.get('/summary', (req, res) => {
  const profile = db.getActiveProfile();
  const totalExams = profile.examHistory.length;
  const passedExams = profile.examHistory.filter((e) => e.passed).length;
  const avgExamScore = totalExams > 0
    ? Math.round(profile.examHistory.reduce((acc, curr) => acc + curr.totalScore, 0) / totalExams)
    : 0;

  // Total study minutes from log
  const totalMinutes = Object.values(profile.studyLog).reduce((a, b) => a + b, 0);

  res.json({
    studentName: profile.name,
    email: profile.email,
    targetLevel: profile.targetLevel,
    streakDays: profile.streakDays,
    totalMinutes,
    completedLessonsCount: profile.completedLessonIds.length,
    masteredVocabCount: profile.masteredVocabIds.length,
    learningVocabCount: profile.learningVocabIds.length,
    totalExams,
    passedExams,
    avgExamScore,
    passRate: totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0,
    studyLog: profile.studyLog,
    examHistory: profile.examHistory,
  });
});

// Log study minutes
router.post('/log-time', (req, res) => {
  const { minutes = 15 } = req.body;
  const profile = db.getActiveProfile();
  const today = new Date().toISOString().split('T')[0];

  profile.studyLog[today] = (profile.studyLog[today] || 0) + Number(minutes);
  profile.xp += Number(minutes) * 2;

  res.json({
    success: true,
    todayMinutes: profile.studyLog[today],
    totalXP: profile.xp,
  });
});

// Export study report as CSV file
router.get('/export-csv', (req, res) => {
  const profile = db.getActiveProfile();
  const today = new Date().toISOString().split('T')[0];

  let csv = '\uFEFF'; // UTF-8 BOM
  csv += 'BAO CAO KET QUA HOC TAP TIENG TRUNG HSK - HANYU MASTER\n';
  csv += `Hoc vien: ${profile.name}\n`;
  csv += `Email: ${profile.email}\n`;
  csv += `Trinh do muc tieu: ${profile.targetLevel}\n`;
  csv += `Chuoi ngay hoc: ${profile.streakDays} ngay\n`;
  csv += `Diem tich luy (XP): ${profile.xp} XP\n`;
  csv += `Thoi gian xuat: ${new Date().toLocaleString('vi-VN')}\n\n`;

  csv += '1. KET QUA THI THU HSK:\n';
  csv += 'Ngay thi,Ten de thi,Cap do,Diem dat,Diem toi da,Ket qua,Thoi gian (phut)\n';
  profile.examHistory.forEach((e) => {
    csv += `"${e.date}","${e.examTitle}","${e.level}",${e.totalScore},${e.maxScore},"${e.passed ? 'DAT' : 'CHUA DAT'}",${Math.round(e.timeSpentSeconds / 60)}\n`;
  });

  csv += '\n2. NHAT KY THOI GIAN HOC TAP:\n';
  csv += 'Ngay,So phut hoc\n';
  Object.entries(profile.studyLog).forEach(([date, mins]) => {
    csv += `"${date}",${mins}\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="Bao_cao_HSK_${today}.csv"`);
  res.send(csv);
});

// Export study report as printable HTML
router.get('/export-html', (req, res) => {
  const profile = db.getActiveProfile();
  const today = new Date().toLocaleDateString('vi-VN');
  const totalExams = profile.examHistory.length;
  const passedExams = profile.examHistory.filter((e) => e.passed).length;
  const avgScore = totalExams > 0 ? Math.round(profile.examHistory.reduce((a, b) => a + b.totalScore, 0) / totalExams) : 0;
  const totalMins = Object.values(profile.studyLog).reduce((a, b) => a + b, 0);

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Báo cáo Kết quả Học tập HSK - ${profile.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { border-bottom: 2px solid #e11d48; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 24px; font-weight: 800; color: #9f1239; margin: 0; }
    .meta { font-size: 13px; color: #64748b; }
    .card { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; text-align: center; }
    .stat-value { font-size: 22px; font-weight: 700; color: #be123c; }
    .stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; color: #334155; }
    .badge-pass { background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 9999px; font-weight: 700; }
    .badge-fail { background: #fee2e2; color: #b91c1c; padding: 2px 8px; border-radius: 9999px; font-weight: 700; }
    @media print { body { padding: 0; } button { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">BÁO CÁO KẾT QUẢ HỌC TẬP HSK</h1>
      <div class="meta">Hệ thống Luyện thi Tiếng Trung Chuẩn hóa MiXiang HSK</div>
    </div>
    <div style="text-align: right;">
      <button onclick="window.print()" style="background: #e11d48; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">In / Lưu PDF</button>
      <div class="meta" style="margin-top: 6px;">Ngày xuất: ${today}</div>
    </div>
  </div>

  <div class="card">
    <div style="font-weight: 700; font-size: 16px; color: #881337; margin-bottom: 6px;">Học viên: ${profile.name}</div>
    <div style="font-size: 13px; color: #4c0519;">Email: ${profile.email} | Mục tiêu: <strong>${profile.targetLevel}</strong> | Chuỗi ngày học: <strong>${profile.streakDays} ngày liên tiếp</strong></div>
  </div>

  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-value">${profile.xp}</div>
      <div class="stat-label">Điểm tích lũy (XP)</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${totalMins}</div>
      <div class="stat-label">Tổng phút học</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${totalExams}</div>
      <div class="stat-label">Đề thi đã làm</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${avgScore}/200</div>
      <div class="stat-label">Điểm thi trung bình</div>
    </div>
  </div>

  <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 10px;">Lịch sử thi thử HSK</h3>
  <table>
    <thead>
      <tr>
        <th>Ngày thi</th>
        <th>Tên đề thi</th>
        <th>Cấp độ</th>
        <th>Nghe</th>
        <th>Đọc</th>
        <th>Tổng điểm</th>
        <th>Kết quả</th>
      </tr>
    </thead>
    <tbody>
      ${profile.examHistory.map((e) => `
        <tr>
          <td>${e.date}</td>
          <td><strong>${e.examTitle}</strong></td>
          <td>${e.level}</td>
          <td>${e.listeningScore}</td>
          <td>${e.readingScore}</td>
          <td><strong>${e.totalScore} / ${e.maxScore}</strong></td>
          <td><span class="${e.passed ? 'badge-pass' : 'badge-fail'}">${e.passed ? 'ĐẠT' : 'CHƯA ĐẠT'}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px;">
    Báo cáo này được tạo tự động bởi MiXiang HSK Platform. Chúc bạn luôn giữ vững tinh thần "加油!"
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

export default router;

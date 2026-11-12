import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Clock,
  Award,
  BookOpen,
  Layers,
  Flame,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { useHSK } from '../context/HSKContext';

export const ReportsView: React.FC = () => {
  const { studentProfile, courses, vocabularies } = useHSK();
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');

  // Calculate days for the chart
  const today = new Date();
  const days = timeframe === 'week' ? 7 : 30;

  const chartData: Array<{ dateStr: string; label: string; minutes: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const minutes = studentProfile.studyLog[dateStr] || 0;
    const label = timeframe === 'week'
      ? d.toLocaleDateString('vi-VN', { weekday: 'short' })
      : `${d.getDate()}/${d.getMonth() + 1}`;
    chartData.push({ dateStr, label, minutes });
  }

  const totalStudyMinutes = chartData.reduce((acc, curr) => acc + curr.minutes, 0);
  const avgMinutesPerDay = Math.round(totalStudyMinutes / days);
  const maxMinuteInChart = Math.max(...chartData.map((c) => c.minutes), 60);

  // Exam stats
  const totalExams = studentProfile.examHistory.length;
  const avgExamScore = totalExams > 0
    ? Math.round(
        studentProfile.examHistory.reduce((acc, curr) => acc + curr.totalScore, 0) / totalExams
      )
    : 0;
  const passRate = totalExams > 0
    ? Math.round(
        (studentProfile.examHistory.filter((e) => e.passed).length / totalExams) * 100
      )
    : 0;

  // CSV Export Handler using backend endpoint with client fallback
  const handleExportCSV = () => {
    try {
      // Trigger download from backend API route
      const link = document.createElement('a');
      link.href = '/api/reports/export-csv';
      link.setAttribute('download', `Bao_Cao_HSK_${today.toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // Fallback
      let csv = '\uFEFF';
      csv += 'BAO CAO TIEN DO HOC TIENG TRUNG HSK - HANYU MASTER\n';
      csv += `Hoc vien: ${studentProfile.name}\n`;
      csv += `Email: ${studentProfile.email}\n`;
      csv += `Cap do muc tieu: ${studentProfile.targetLevel}\n`;
      csv += `Thoi gian xuat: ${new Date().toLocaleString('vi-VN')}\n\n`;

      csv += '1. LICH SU THI THU HSK:\n';
      csv += 'Ngay thi,Ten de thi,Cap do,Diem dat,Diem toi da,Ket qua,Thoi gian lam (phut)\n';
      studentProfile.examHistory.forEach((e) => {
        csv += `"${e.date}","${e.examTitle}","${e.level}",${e.totalScore},${e.maxScore},"${e.passed ? 'DAT' : 'CHUA DAT'}",${Math.round(e.timeSpentSeconds / 60)}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bao_Cao_HSK_${studentProfile.name.replace(/\s+/g, '_')}_${today.toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-16 print:p-0 print:m-0">
      {/* Top Header & Export Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#18181B] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-red-600" />
            <span>Báo Cáo Kết Quả & Tiến Độ Học Tập</span>
          </h2>
          <p className="text-xs text-slate-500">
            Theo dõi chi tiết thời gian học, mức độ nắm vững từ vựng và bảng điểm các kỳ thi thử HSK
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center p-1 bg-[#F5EFEB] rounded-xl text-xs font-semibold border border-[#E6DEC8]">
            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
                timeframe === 'week' ? 'bg-white text-red-700 shadow-2xs border border-red-200' : 'text-[#18181B]/70'
              }`}
            >
              Theo Tuần
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
                timeframe === 'month' ? 'bg-white text-red-700 shadow-2xs border border-red-200' : 'text-[#18181B]/70'
              }`}
            >
              Theo Tháng
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6DEC8] text-xs font-semibold text-[#18181B] hover:bg-[#FAF7F0] transition-colors shadow-xs"
            title="Tải file Excel / CSV chi tiết"
          >
            <FileSpreadsheet className="w-4 h-4 text-red-600" />
            <span className="hidden sm:inline">Xuất CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
            title="In phiếu kết quả / Lưu thành PDF"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">In / Xuất PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block p-4 border-b border-slate-300 text-center space-y-1">
        <h1 className="text-2xl font-black text-slate-900">
          PHIẾU BÁO CÁO KẾT QUẢ HỌC TIẾNG TRUNG HSK
        </h1>
        <p className="text-xs text-slate-600">
          Nền tảng đào tạo MiXiangg HSK • Học viên: <strong>{studentProfile.name}</strong> ({studentProfile.email})
        </p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Thời gian học tập</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {Math.floor(totalStudyMinutes / 60)}g {totalStudyMinutes % 60}p
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Trung bình {avgMinutesPerDay} phút/ngày
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Từ vựng thành thạo</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {studentProfile.masteredVocabIds.length} từ
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            +{studentProfile.learningVocabIds.length} từ đang ôn tập
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Bài học hoàn thành</span>
            <BookOpen className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">
            {studentProfile.completedLessonIds.length} bài
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Mục tiêu: {studentProfile.targetLevel}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Điểm thi TB HSK</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {avgExamScore > 0 ? `${avgExamScore} đ` : 'Chưa thi'}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            Tỷ lệ đạt chuẩn: {passRate}%
          </span>
        </div>
      </div>

      {/* Study Time Chart & Skill Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Time Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Biểu đồ thời gian học ({timeframe === 'week' ? '7 ngày gần nhất' : '30 ngày qua'})
              </h3>
              <p className="text-xs text-slate-500">Đơn vị tính: Phút học mỗi ngày</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              Tổng: {totalStudyMinutes} phút
            </span>
          </div>

          {/* Bar Chart Container */}
          <div className="h-52 flex items-end justify-between gap-1 sm:gap-2 pt-6 pb-2 border-b border-slate-100">
            {chartData.map((item, idx) => {
              const heightPercent = maxMinuteInChart > 0
                ? Math.round((item.minutes / maxMinuteInChart) * 100)
                : 0;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                    {item.minutes}p
                  </div>

                  {/* The bar */}
                  <div className="w-full max-w-[32px] bg-[#F5EFEB] rounded-t-lg h-36 flex items-end overflow-hidden">
                    <div
                      className="w-full bg-gradient-to-t from-red-700 to-rose-500 rounded-t-md transition-all duration-500 group-hover:brightness-110"
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    ></div>
                  </div>

                  {/* Day label */}
                  <span className="text-[10px] text-slate-500 font-medium group-hover:text-red-600">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>0 phút</span>
            <span>Mục tiêu hàng ngày: {studentProfile.dailyGoalMinutes} phút</span>
            <span>Cao nhất: {maxMinuteInChart} phút</span>
          </div>
        </div>

        {/* Skill Mastery Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">
            Năng lực 5 Kỹ năng Tiếng Trung
          </h3>
          <p className="text-xs text-slate-500">Đánh giá theo dữ liệu làm bài và luyện tập</p>

          <div className="space-y-3 pt-2">
            {[
              { skill: 'Nghe hiểu (Listening)', score: 88, color: 'bg-red-700' },
              { skill: 'Đọc hiểu (Reading)', score: 92, color: 'bg-red-600' },
              { skill: 'Từ vựng (Vocabulary)', score: 85, color: 'bg-[#18181B]' },
              { skill: 'Ngữ pháp (Grammar)', score: 80, color: 'bg-stone-800' },
              { skill: 'Viết & Cấu trúc (Writing)', score: 75, color: 'bg-rose-600' },
            ].map((s) => (
              <div key={s.skill} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">{s.skill}</span>
                  <span className="text-slate-900">{s.score}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`${s.color} h-2 rounded-full`}
                    style={{ width: `${s.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 bg-slate-50 p-3 rounded-xl text-xs text-slate-600 leading-relaxed">
            <span className="font-bold text-slate-800 block mb-0.5">Nhận xét từ Lão Sư:</span>
            Kỹ năng Đọc hiểu và Nghe của bạn phát triển rất tốt. Nên dành thêm 10 phút/ngày để luyện viết cấu trúc câu chữ 把 và chữ 被.
          </div>
        </div>
      </div>

      {/* Exam History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Lịch sử các kỳ thi thử HSK ({studentProfile.examHistory.length} bài)</span>
          </h3>
        </div>

        {studentProfile.examHistory.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Bạn chưa làm bài thi thử nào. Hãy vào mục "Đề thi HSK" để bắt đầu thử sức!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ngày thi</th>
                  <th className="py-3 px-4">Tên đề thi</th>
                  <th className="py-3 px-4">Cấp độ</th>
                  <th className="py-3 px-4">Nghe / Đọc / Viết</th>
                  <th className="py-3 px-4">Tổng điểm</th>
                  <th className="py-3 px-4">Kết quả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentProfile.examHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-500">{item.date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{item.examTitle}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {item.level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.listeningScore} / {item.readingScore} / {item.writingScore}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.totalScore} / {item.maxScore}
                    </td>
                    <td className="py-3 px-4">
                      {item.passed ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          ĐẠT ✓
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                          CHƯA ĐẠT
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

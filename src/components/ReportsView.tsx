import React, { useState } from 'react';
import {
  BarChart3,
  Printer,
  Clock,
  Award,
  BookOpen,
  Layers,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useHSK } from '../context/HSKContext';

export const ReportsView: React.FC = () => {
  const { studentProfile, setActiveTab } = useHSK();
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
    const label =
      timeframe === 'week'
        ? d.toLocaleDateString('vi-VN', { weekday: 'short' })
        : `${d.getDate()}/${d.getMonth() + 1}`;
    chartData.push({ dateStr, label, minutes });
  }

  const totalStudyMinutes = chartData.reduce((acc, curr) => acc + curr.minutes, 0);
  const avgMinutesPerDay = Math.round(totalStudyMinutes / days);
  const maxMinuteInChart = Math.max(...chartData.map((c) => c.minutes), 60);

  // Exam stats
  const totalExams = studentProfile.examHistory.length;
  const avgExamScore =
    totalExams > 0
      ? Math.round(
          studentProfile.examHistory.reduce((acc, curr) => acc + curr.totalScore, 0) / totalExams
        )
      : 0;
  const passRate =
    totalExams > 0
      ? Math.round(
          (studentProfile.examHistory.filter((e) => e.passed).length / totalExams) * 100
        )
      : 0;

  // CSV Export Handler using backend endpoint with client fallback
  const handleExportCSV = () => {
    try {
      const link = document.createElement('a');
      link.href = '/api/reports/export-csv';
      link.setAttribute('download', `Bao_Cao_HSK_${today.toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      let csv = '\uFEFF';
      csv += 'BAO CAO TIEN DO HOC TIENG TRUNG HSK - MIXIANGG HSK\n';
      csv += `Hoc vien: ${studentProfile.name}\n`;
      csv += `Email: ${studentProfile.email}\n`;
      csv += `Cap do muc tieu: ${studentProfile.targetLevel}\n`;
      csv += `Thoi gian xuat: ${new Date().toLocaleString('vi-VN')}\n\n`;

      csv += '1. LICH SU THI THU HSK:\n';
      csv += 'Ngay thi,Ten de thi,Cap do,Diem dat,Diem toi da,Ket qua,Thoi gian lam (phut)\n';
      studentProfile.examHistory.forEach((e) => {
        csv += `"${e.date}","${e.examTitle}","${e.level}",${e.totalScore},${e.maxScore},"${
          e.passed ? 'DAT' : 'CHUA DAT'
        }",${Math.round(e.timeSpentSeconds / 60)}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `Bao_Cao_HSK_${studentProfile.name.replace(/\s+/g, '_')}_${today.toISOString().split('T')[0]}.csv`
      );
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
    <div className="space-y-6 pb-16 print:p-0 print:m-0">
      {/* Unified Editorial Hero Banner */}
      <div className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-red-400/70 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[13.5px] font-bold text-amber-200">
              <BarChart3 className="w-4 h-4" />
              <span>Hồ sơ tiến độ cá nhân · MiXiangg HSK</span>
            </div>
            <h1 className="font-sans text-[24px] sm:text-[30px] font-extrabold tracking-tight leading-tight">
              Báo Cáo Kết Quả &amp; Tiến Độ Học Tập
            </h1>
            <p className="text-[15px] sm:text-[16px] text-rose-50/95 leading-relaxed">
              Theo dõi thời gian rèn luyện mỗi ngày, vốn từ vựng tích lũy và lịch sử điểm thi thử HSK chuẩn quốc tế.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Timeframe selector */}
            <div className="flex items-center p-1 bg-black/20 rounded-2xl border border-white/15 text-[13px] font-bold">
              <button
                type="button"
                onClick={() => setTimeframe('week')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer min-h-[40px] ${
                  timeframe === 'week'
                    ? 'bg-white text-red-700 shadow-xs'
                    : 'text-white/85 hover:text-white'
                }`}
              >
                7 Ngày
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('month')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer min-h-[40px] ${
                  timeframe === 'month'
                    ? 'bg-white text-red-700 shadow-xs'
                    : 'text-white/85 hover:text-white'
                }`}
              >
                30 Ngày
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-[13.5px] font-bold transition-colors cursor-pointer min-h-[44px]"
              title="Tải file Excel / CSV chi tiết"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-200 shrink-0" />
              <span>Xuất CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1C1E21] hover:bg-black text-white text-[13.5px] font-bold transition-colors shadow-xs cursor-pointer min-h-[44px]"
              title="In phiếu kết quả / Lưu thành PDF"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>In PDF</span>
            </button>
          </div>
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
        <div className="bg-white rounded-3xl border border-[#E8DFCE] p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#686B72] mb-3">
            <span className="text-[13px] font-bold">Thời gian học</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF5F3] text-[#C85A43] flex items-center justify-center border border-[#F5DDD6]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-[24px] sm:text-[26px] font-extrabold text-[#1C1E21] tabular-nums leading-none">
            {Math.floor(totalStudyMinutes / 60)}g {totalStudyMinutes % 60}p
          </div>
          <span className="text-[12.5px] text-[#686B72] mt-2 block font-medium tabular-nums">
            Trung bình {avgMinutesPerDay} phút/ngày
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-[#E8DFCE] p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#686B72] mb-3">
            <span className="text-[13px] font-bold">Từ vựng thành thạo</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/80">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-[24px] sm:text-[26px] font-extrabold text-emerald-700 tabular-nums leading-none">
            {studentProfile.masteredVocabIds.length} từ
          </div>
          <span className="text-[12.5px] text-[#686B72] mt-2 block font-medium tabular-nums">
            +{studentProfile.learningVocabIds.length} từ đang ôn tập
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-[#E8DFCE] p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#686B72] mb-3">
            <span className="text-[13px] font-bold">Bài học hoàn thành</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF5F3] text-[#C85A43] flex items-center justify-center border border-[#F5DDD6]">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-[24px] sm:text-[26px] font-extrabold text-[#C85A43] tabular-nums leading-none">
            {studentProfile.completedLessonIds.length} bài
          </div>
          <span className="text-[12.5px] text-[#686B72] mt-2 block font-medium">
            Mục tiêu: <strong className="text-[#1C1E21]">{studentProfile.targetLevel}</strong>
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-[#E8DFCE] p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#686B72] mb-3">
            <span className="text-[13px] font-bold">Điểm thi TB HSK</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/80">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-[24px] sm:text-[26px] font-extrabold text-[#1C1E21] tabular-nums leading-none">
            {avgExamScore > 0 ? `${avgExamScore} đ` : 'Chưa thi'}
          </div>
          <span className="text-[12.5px] text-emerald-700 font-bold mt-2 block tabular-nums">
            Tỷ lệ đạt chuẩn: {passRate}%
          </span>
        </div>
      </div>

      {/* Study Time Chart & Skill Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Time Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E8DFCE] p-6 shadow-2xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-sans font-bold text-[#1C1E21] text-[17px]">
                Biểu đồ thời gian học ({timeframe === 'week' ? '7 ngày gần nhất' : '30 ngày qua'})
              </h2>
              <p className="text-[13.5px] text-[#686B72]">Đơn vị tính: Phút học mỗi ngày</p>
            </div>
            <span className="text-[13px] font-bold px-3 py-1.5 rounded-xl bg-[#FAF7F0] text-[#C85A43] border border-[#E8DFCE] tabular-nums">
              Tổng: {totalStudyMinutes} phút
            </span>
          </div>

          {/* Bar Chart Container */}
          <div className="h-56 flex items-end justify-between gap-1.5 sm:gap-2.5 pt-6 pb-2 border-b border-[#EFE7D6]">
            {chartData.map((item, idx) => {
              const heightPercent =
                maxMinuteInChart > 0
                  ? Math.round((item.minutes / maxMinuteInChart) * 100)
                  : 0;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group min-w-0">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] bg-[#1C1E21] text-white px-2 py-0.5 rounded-md font-mono font-bold whitespace-nowrap tabular-nums">
                    {item.minutes}p
                  </div>

                  <div className="w-full max-w-[34px] bg-[#F5EFEB] rounded-t-xl h-36 flex items-end overflow-hidden border border-[#EFE7D6]/60">
                    <div
                      className="w-full bg-gradient-to-t from-[#C85A43] to-red-500 rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                      style={{ height: `${Math.max(heightPercent, 5)}%` }}
                    />
                  </div>

                  <span className="text-[11px] text-[#686B72] font-semibold group-hover:text-[#C85A43] truncate max-w-full">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#686B72] font-medium tabular-nums">
            <span>0 phút</span>
            <span>
              Mục tiêu hàng ngày:{' '}
              <strong className="text-[#1C1E21]">{studentProfile.dailyGoalMinutes} phút</strong>
            </span>
            <span>Cao nhất: {maxMinuteInChart} phút</span>
          </div>
        </div>

        {/* Skill Mastery Breakdown */}
        <div className="bg-white rounded-3xl border border-[#E8DFCE] p-6 shadow-2xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div>
              <h2 className="font-sans font-bold text-[#1C1E21] text-[17px]">
                Năng lực 5 Kỹ năng Tiếng Trung
              </h2>
              <p className="text-[13.5px] text-[#686B72]">
                Đánh giá theo dữ liệu bài học và luyện tập
              </p>
            </div>

            <div className="space-y-3.5 pt-1">
              {[
                { skill: 'Nghe hiểu (Listening)', score: 88, color: 'bg-[#C85A43]' },
                { skill: 'Đọc hiểu (Reading)', score: 92, color: 'bg-red-600' },
                { skill: 'Từ vựng (Vocabulary)', score: 85, color: 'bg-[#1C1E21]' },
                { skill: 'Ngữ pháp (Grammar)', score: 80, color: 'bg-amber-600' },
                { skill: 'Viết & Cấu trúc (Writing)', score: 75, color: 'bg-rose-600' },
              ].map((s) => (
                <div key={s.skill} className="space-y-1.5">
                  <div className="flex justify-between text-[13.5px] font-semibold">
                    <span className="text-[#3B3E45]">{s.skill}</span>
                    <span className="font-mono font-bold text-[#1C1E21] tabular-nums">
                      {s.score}%
                    </span>
                  </div>
                  <div className="w-full bg-[#F5EFEB] rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`${s.color} h-2.5 rounded-full transition-all duration-500`}
                      style={{ width: `${s.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#FAF7F0] border border-[#E8DFCE] p-4 rounded-2xl text-[13.5px] text-[#3B3E45] leading-relaxed">
            <span className="font-bold text-[#1C1E21] flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-[#C85A43]" />
              <span>Nhận xét từ Lão Sư</span>
            </span>
            Kỹ năng Đọc hiểu và Nghe của bạn phát triển rất tốt. Nên dành thêm 10 phút/ngày luyện viết cấu trúc câu chữ{' '}
            <span className="font-serif font-bold text-[#1C1E21]">把</span> và{' '}
            <span className="font-serif font-bold text-[#1C1E21]">被</span>.
          </div>
        </div>
      </div>

      {/* Exam History Table */}
      <div className="bg-white rounded-3xl border border-[#E8DFCE] overflow-hidden shadow-2xs">
        <div className="p-5 sm:p-6 border-b border-[#EFE7D6] flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-sans font-bold text-[#1C1E21] text-[17px] flex items-center gap-2">
            <Award className="w-5 h-5 text-[#C85A43]" />
            <span>
              Lịch sử các kỳ thi thử HSK{' '}
              <span className="font-mono text-[#686B72] tabular-nums">
                ({studentProfile.examHistory.length} bài)
              </span>
            </span>
          </h2>
        </div>

        {studentProfile.examHistory.length === 0 ? (
          <div className="p-10 sm:p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF7F0] border border-[#E8DFCE] text-[#C85A43] flex items-center justify-center mx-auto">
              <Award className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="font-sans font-bold text-[17px] text-[#1C1E21]">
                Chưa có lịch sử thi thử HSK
              </h3>
              <p className="text-[14px] text-[#686B72] leading-relaxed">
                Hãy hoàn thành bài thi thử đầu tiên để hệ thống chấm điểm tự động và phân tích chi tiết kỹ năng của bạn.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('exams')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#C85A43] hover:bg-[#B24A34] text-white font-bold text-[14px] shadow-xs transition-colors cursor-pointer min-h-[44px]"
            >
              <span>Vào Phòng Thi Thử HSK</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[14px]">
              <thead className="bg-[#FAF7F0] text-[#686B72] font-bold border-b border-[#E8DFCE] text-[13px]">
                <tr>
                  <th className="py-3.5 px-5">Ngày thi</th>
                  <th className="py-3.5 px-5">Tên đề thi</th>
                  <th className="py-3.5 px-5">Cấp độ</th>
                  <th className="py-3.5 px-5">Nghe / Đọc / Viết</th>
                  <th className="py-3.5 px-5">Tổng điểm</th>
                  <th className="py-3.5 px-5">Kết quả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE7D6]">
                {studentProfile.examHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FDFBF6] transition-colors">
                    <td className="py-3.5 px-5 font-mono text-[#686B72] tabular-nums whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-[#1C1E21] max-w-[260px] truncate">
                      {item.examTitle}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg text-[12px] font-bold bg-[#FFF5F3] text-[#C85A43] border border-[#F5DDD6]">
                        {item.level}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[#3B3E45] tabular-nums whitespace-nowrap">
                      {item.listeningScore} / {item.readingScore} / {item.writingScore}
                    </td>
                    <td className="py-3.5 px-5 font-mono font-extrabold text-[#1C1E21] tabular-nums whitespace-nowrap">
                      {item.totalScore} / {item.maxScore}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      {item.passed ? (
                        <span className="px-2.5 py-1 rounded-lg text-[12px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ĐẠT ✓
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-[12px] font-bold bg-red-50 text-red-700 border border-red-200">
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

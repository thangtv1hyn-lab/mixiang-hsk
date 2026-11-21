import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Volume2,
  PenTool,
} from 'lucide-react';
import { speakChinese } from '../utils/audioSpeech';

interface Point {
  x: number;
  y: number;
}

interface HanziStrokeCanvasProps {
  word: string;
  pinyin?: string;
  meaning?: string;
  sinoVietnamese?: string;
  showGuideByDefault?: boolean;
  onScoreEvaluated?: (score: number, char: string) => void;
  compact?: boolean;
}

export const HanziStrokeCanvas: React.FC<HanziStrokeCanvasProps> = ({
  word,
  pinyin,
  meaning,
  sinoVietnamese,
  showGuideByDefault = true,
  onScoreEvaluated,
  compact = false,
}) => {
  const chars = Array.from(word.trim()).filter((c) => c.trim().length > 0);
  const [selectedCharIdx, setSelectedCharIdx] = useState(0);
  const activeChar = chars[selectedCharIdx] || chars[0] || '好';

  const [showGuide, setShowGuide] = useState(showGuideByDefault);
  const [inkColor, setInkColor] = useState<'#1C1E21' | '#C85A43' | '#0F766E'>('#1C1E21');
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isAnimatingDemo, setIsAnimatingDemo] = useState(false);
  const [demoProgress, setDemoProgress] = useState(100);
  const [evaluation, setEvaluation] = useState<{
    score: number;
    comment: string;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setSelectedCharIdx(0);
    setStrokes([]);
    setCurrentStroke([]);
    setEvaluation(null);
    setShowGuide(showGuideByDefault);
  }, [word, showGuideByDefault]);

  useEffect(() => {
    setStrokes([]);
    setCurrentStroke([]);
    setEvaluation(null);
  }, [selectedCharIdx]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    // 1. Paper Background
    ctx.fillStyle = '#FFFDF9';
    ctx.fillRect(0, 0, size, size);

    // 2. Traditional MiZiGe (Ô Mễ Tự 米字格) Grid Lines
    ctx.save();
    ctx.strokeStyle = '#F2C6BC';
    ctx.lineWidth = 1.5;

    // Outer frame
    ctx.strokeRect(4, 4, size - 8, size - 8);

    // Dashed diagonals & center cross
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    // Horizontal center
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    // Vertical center
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    // Diagonal 1
    ctx.moveTo(0, 0);
    ctx.lineTo(size, size);
    // Diagonal 2
    ctx.moveTo(size, 0);
    ctx.lineTo(0, size);
    ctx.stroke();
    ctx.restore();

    // 3. Faint Guide Character (Watermark) or Demo Animation
    if (showGuide || isAnimatingDemo) {
      ctx.save();
      ctx.font = `700 ${Math.round(size * 0.72)}px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (isAnimatingDemo) {
        // Clip from top-left to bottom-right based on demoProgress
        ctx.beginPath();
        ctx.rect(0, 0, size, (size * demoProgress) / 100);
        ctx.clip();
        ctx.fillStyle = 'rgba(200, 90, 67, 0.55)';
      } else {
        ctx.fillStyle = 'rgba(200, 90, 67, 0.17)';
      }

      ctx.fillText(activeChar, size / 2, size / 2 + size * 0.03);
      ctx.restore();
    }

    // 4. Render User Brush Strokes
    const allStrokes = currentStroke.length > 0 ? [...strokes, currentStroke] : strokes;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = Math.max(10, Math.round(size * 0.048));

    for (const stroke of allStrokes) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      if (stroke.length === 1) {
        ctx.arc(stroke[0].x, stroke[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = inkColor;
        ctx.fill();
      } else {
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length - 1; i++) {
          const midX = (stroke[i].x + stroke[i + 1].x) / 2;
          const midY = (stroke[i].y + stroke[i + 1].y) / 2;
          ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, midX, midY);
        }
        const last = stroke[stroke.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }, [activeChar, showGuide, isAnimatingDemo, demoProgress, strokes, currentStroke, inkColor]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = getCanvasPoint(e);
    setIsDrawing(true);
    setCurrentStroke([pt]);
    setEvaluation(null);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pt = getCanvasPoint(e);
    setCurrentStroke((prev) => [...prev, pt]);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
    if (currentStroke.length > 0) {
      setStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke([]);
    }
  };

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1));
    setEvaluation(null);
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
    setEvaluation(null);
  };

  const handleAnimateDemo = () => {
    if (isAnimatingDemo) return;
    setIsAnimatingDemo(true);
    setDemoProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      if (progress >= 100) {
        setDemoProgress(100);
        clearInterval(interval);
        setTimeout(() => setIsAnimatingDemo(false), 450);
      } else {
        setDemoProgress(progress);
      }
    }, 40);
  };

  const evaluateDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas || strokes.length === 0) return;

    const size = canvas.width;
    // Reference canvas with target glyph
    const refCanvas = document.createElement('canvas');
    refCanvas.width = size;
    refCanvas.height = size;
    const refCtx = refCanvas.getContext('2d')!;
    refCtx.font = `700 ${Math.round(size * 0.72)}px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
    refCtx.textAlign = 'center';
    refCtx.textBaseline = 'middle';
    refCtx.fillStyle = '#000000';
    refCtx.fillText(activeChar, size / 2, size / 2 + size * 0.03);

    // User strokes only canvas (slightly dilated for friendly tolerance)
    const userCanvas = document.createElement('canvas');
    userCanvas.width = size;
    userCanvas.height = size;
    const userCtx = userCanvas.getContext('2d')!;
    userCtx.lineCap = 'round';
    userCtx.lineJoin = 'round';
    userCtx.strokeStyle = '#000000';
    userCtx.lineWidth = Math.max(16, Math.round(size * 0.075));

    for (const stroke of strokes) {
      if (stroke.length === 0) continue;
      userCtx.beginPath();
      if (stroke.length === 1) {
        userCtx.arc(stroke[0].x, stroke[0].y, userCtx.lineWidth / 2, 0, Math.PI * 2);
        userCtx.fill();
      } else {
        userCtx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
          userCtx.lineTo(stroke[i].x, stroke[i].y);
        }
        userCtx.stroke();
      }
    }

    const refData = refCtx.getImageData(0, 0, size, size).data;
    const userData = userCtx.getImageData(0, 0, size, size).data;

    let refPixels = 0;
    let userPixels = 0;
    let overlapPixels = 0;

    for (let i = 3; i < refData.length; i += 4) {
      const rAlpha = refData[i] > 40;
      const uAlpha = userData[i] > 40;
      if (rAlpha) refPixels++;
      if (uAlpha) userPixels++;
      if (rAlpha && uAlpha) overlapPixels++;
    }

    if (refPixels === 0 || userPixels === 0) return;

    const recall = overlapPixels / refPixels; // How much of the character was covered
    const precision = overlapPixels / userPixels; // How much of user ink stayed near character
    const f1 = (2 * recall * precision) / (recall + precision + 0.0001);

    // Friendly curve so reasonable handwriting gets 75-98%
    const rawScore = Math.min(99, Math.round(Math.pow(f1, 0.55) * 108));
    const finalScore = Math.max(25, rawScore);

    let comment = 'Nét bút rất chuẩn xác và cân đối trong ô Mễ Tự!';
    if (finalScore >= 85) {
      comment = 'Xuất sắc! Bố cục chữ Hán cân đối, nét bút chuẩn xác.';
    } else if (finalScore >= 65) {
      comment = 'Khá tốt! Chữ đã rõ hình dáng, chú ý căn giữa tâm ô Mễ Tự hơn nhé.';
    } else {
      comment = 'Hãy bật "Hiện nét mẫu" để luyện lại tỷ lệ và vị trí các nét nhé!';
    }

    setEvaluation({ score: finalScore, comment });
    speakChinese(activeChar);
    if (onScoreEvaluated) {
      onScoreEvaluated(finalScore, activeChar);
    }
  };

  return (
    <div className="bg-white rounded-[28px] border border-[#E8DFCE] p-5 sm:p-7 shadow-sm space-y-5">
      {/* Top Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EFE7D6]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-[#C85A43] text-white text-[12px] font-extrabold">
              Luyện Viết Bút Thuận (米字格)
            </span>
            {pinyin && (
              <span className="font-mono text-[16px] font-bold text-[#C85A43]">
                {pinyin}
              </span>
            )}
            {sinoVietnamese && (
              <span className="text-[13px] font-bold text-slate-600">
                · Hán Việt: {sinoVietnamese}
              </span>
            )}
          </div>
          {meaning && (
            <p className="text-[16px] font-bold text-[#1C1E21]">
              Nghĩa: <span className="text-[#C85A43]">{meaning}</span>
            </p>
          )}
        </div>

        {/* Character Selector if word has multiple characters */}
        <div className="flex items-center gap-2">
          {chars.length > 1 && (
            <div className="flex items-center gap-1.5 bg-[#F7F4EC] p-1.5 rounded-2xl border border-[#E6DEC8]">
              <span className="text-[12px] font-bold text-slate-600 px-2">Chọn chữ:</span>
              {chars.map((ch, idx) => (
                <button
                  key={`${ch}-${idx}`}
                  type="button"
                  onClick={() => setSelectedCharIdx(idx)}
                  className={`w-10 h-10 rounded-xl font-serif text-[20px] font-black transition-all cursor-pointer ${
                    selectedCharIdx === idx
                      ? 'bg-[#C85A43] text-white shadow-2xs'
                      : 'bg-white text-[#1C1E21] hover:border-[#C85A43] border border-[#E6DEC8]'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => speakChinese(word)}
            className="p-2.5 rounded-xl bg-[#FDF0ED] text-[#C85A43] hover:bg-[#C85A43] hover:text-white transition-colors cursor-pointer"
            title="Nghe phát âm"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Canvas on Left/Center, Controls & Rules on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* MiZiGe Canvas */}
        <div className="md:col-span-6 flex flex-col items-center space-y-3">
          <div className="relative p-2.5 rounded-3xl bg-[#F7F4EC] border-2 border-[#E6DEC8] shadow-inner">
            <canvas
              ref={canvasRef}
              width={280}
              height={280}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`${
                compact ? 'w-[230px] h-[230px]' : 'w-[250px] h-[250px] sm:w-[280px] sm:h-[280px]'
              } rounded-2xl cursor-crosshair touch-none select-none`}
            />
            <span className="absolute top-4 left-5 text-[11px] font-bold text-[#C85A43]/70 pointer-events-none">
              Ô Mễ Tự · Nét đã viết: {strokes.length}
            </span>
          </div>

          {/* Quick Canvas Toolbar */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setShowGuide((g) => !g)}
              className={`px-3.5 py-2 rounded-xl text-[13px] font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                showGuide
                  ? 'bg-[#FDF0ED] text-[#C85A43] border-[#F3C5B6]'
                  : 'bg-[#FAF7F0] text-slate-700 border-[#E6DEC8]'
              }`}
            >
              {showGuide ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>{showGuide ? 'Đang hiện chữ mẫu' : 'Đã ẩn chữ mẫu'}</span>
            </button>

            <button
              type="button"
              onClick={handleAnimateDemo}
              className="px-3.5 py-2 rounded-xl text-[13px] font-bold bg-[#FAF7F0] hover:bg-[#FDF0ED] text-[#1C1E21] border border-[#E6DEC8] flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#C85A43]" />
              <span>Xem hướng dẫn nét</span>
            </button>

            <button
              type="button"
              onClick={handleUndo}
              disabled={strokes.length === 0}
              className="px-3 py-2 rounded-xl text-[13px] font-bold bg-white border border-[#E6DEC8] text-slate-700 hover:border-[#C85A43] disabled:opacity-40 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Lùi nét</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={strokes.length === 0}
              className="px-3 py-2 rounded-xl text-[13px] font-bold bg-white border border-[#E6DEC8] text-red-600 hover:bg-red-50 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa</span>
            </button>
          </div>
        </div>

        {/* Right Column: Brush Settings, Stroke Order Rules & Score Button */}
        <div className="md:col-span-6 space-y-4">
          {/* Ink Color Picker */}
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E6DEC8] space-y-2.5">
            <span className="text-[13px] font-extrabold text-[#1C1E21] block">
              Màu mực luyện chữ:
            </span>
            <div className="flex items-center gap-2.5">
              {[
                { color: '#1C1E21' as const, label: 'Đen Mặc Tàu' },
                { color: '#C85A43' as const, label: 'Đỏ Chu Sa' },
                { color: '#0F766E' as const, label: 'Xanh Ngọc' },
              ].map((ink) => (
                <button
                  key={ink.color}
                  type="button"
                  onClick={() => setInkColor(ink.color)}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                    inkColor === ink.color
                      ? 'bg-white border-[#1C1E21] shadow-2xs font-extrabold'
                      : 'bg-transparent border-transparent text-slate-600'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: ink.color }}
                  />
                  <span>{ink.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5 Golden Stroke Order Rules */}
          <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E6DEC8] space-y-2">
            <div className="flex items-center gap-2 text-[13px] font-extrabold text-[#C85A43]">
              <PenTool className="w-4 h-4" />
              <span>Quy tắc Bút Thuận chuẩn chữ Hán “{activeChar}”</span>
            </div>
            <ul className="text-[13px] text-slate-700 space-y-1 leading-snug">
              <li>• <strong>Ngang trước sổ sau</strong> (先横后竖) · <strong>Phẩy trước mác sau</strong> (先撇后捺)</li>
              <li>• <strong>Từ trên xuống dưới</strong> (从上到下) · <strong>Từ trái sang phải</strong> (从左到右)</li>
              <li>• <strong>Ngoài trước trong sau</strong>, vào nhà trước đóng cửa sau.</li>
            </ul>
          </div>

          {/* Evaluate Action Button */}
          <button
            type="button"
            disabled={strokes.length === 0}
            onClick={evaluateDrawing}
            className="w-full py-3 px-5 rounded-2xl bg-[#C85A43] hover:bg-red-700 disabled:opacity-45 text-white font-bold text-[15px] shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Chấm Điểm Nét Chữ “{activeChar}”</span>
          </button>

          {/* Evaluation Result Box */}
          {evaluation && (
            <div
              className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 ${
                evaluation.score >= 70
                  ? 'bg-[#ECFDF5] border-emerald-400 text-emerald-950'
                  : 'bg-[#FFFBEB] border-amber-300 text-amber-950'
              }`}
            >
              <div className="space-y-0.5">
                <div className="text-[15px] font-extrabold">
                  Độ chính xác nét chữ: {evaluation.score}%
                </div>
                <p className="text-[13px] leading-snug">{evaluation.comment}</p>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white font-mono text-[20px] font-black text-[#C85A43] border border-black/10 shrink-0">
                {evaluation.score}đ
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';

interface CompletionSealStampProps {
  /** Primary Vietnamese stamp ribbon text */
  label?: string;
  /** Subtitle (e.g., date or pass/complete badge) */
  subLabel?: string;
  /** Optional tone when displayed on dark/red hero cards vs light paper cards */
  surface?: 'dark' | 'light';
  /** Auto-trigger stamp slam on mount */
  autoStamp?: boolean;
  /** Optional callback triggered at moment of impact */
  onImpact?: () => void;
  /** Compact size for smaller quiz cards */
  compact?: boolean;
}

const SEAL_IMAGE_SRC = '/assets/aistudio/logo-removebg-preview_c8bd0ad2.png';

/**
 * Synthesizes a short, weighty wooden-seal "THUMP!" sound via Web Audio API.
 * Safe no-op if browser blocks autoplay before user interaction.
 */
function playStampThumpSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Low woody thud body
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.13);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);

    // Crisp paper slap transient
    const bufferSize = Math.floor(ctx.sampleRate * 0.045);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
  } catch {
    // Ignore audio context errors silently
  }
}

export const CompletionSealStamp: React.FC<CompletionSealStampProps> = ({
  label = 'ĐÃ HOÀN THÀNH',
  subLabel,
  surface = 'dark',
  autoStamp = true,
  onImpact,
  compact = false,
}) => {
  const [stampKey, setStampKey] = useState(0);
  const [hasStamped, setHasStamped] = useState(!autoStamp);

  const triggerStamp = useCallback(() => {
    setHasStamped(false);
    // Small frame delay so CSS animation reliably restarts
    requestAnimationFrame(() => {
      setStampKey((k) => k + 1);
      setHasStamped(true);
    });
  }, []);

  useEffect(() => {
    if (!autoStamp) return;
    const startTimer = window.setTimeout(() => {
      setStampKey((k) => k + 1);
      setHasStamped(true);
    }, 280);

    return () => window.clearTimeout(startTimer);
  }, [autoStamp]);

  // Fire sound & impact callback right when the seal hits (~310ms into animation)
  useEffect(() => {
    if (!hasStamped || stampKey === 0) return;
    const impactTimer = window.setTimeout(() => {
      playStampThumpSound();
      onImpact?.();
    }, 300);

    return () => window.clearTimeout(impactTimer);
  }, [hasStamped, stampKey, onImpact]);

  const dateText =
    subLabel ||
    new Date().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  return (
    <div className="relative inline-flex flex-col items-center select-none">
      {/* Stamp Visual Wrapper */}
      <button
        type="button"
        onClick={triggerStamp}
        title="Bấm để đóng dấu lại"
        aria-label="Hiệu ứng đóng dấu hoàn thành bài kiểm tra - bấm để đóng dấu lại"
        className="group relative cursor-pointer focus:outline-none rounded-2xl"
      >
        {/* Expanding Crimson Shockwave Ring */}
        {hasStamped && (
          <span
            key={`wave-${stampKey}`}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full border-4 border-red-500/80 animate-stamp-shockwave"
          />
        )}

        {/* Main Stamped Seal */}
        {hasStamped ? (
          <div
            key={`stamp-${stampKey}`}
            className={`animate-stamp-slam relative flex flex-col items-center justify-center rounded-2xl border-[3px] border-dashed ${
              surface === 'dark'
                ? 'bg-[#FDFBF5]/95 border-[#D62828] shadow-[0_10px_28px_rgba(0,0,0,0.32)]'
                : 'bg-[#FFFDF9]/95 border-[#C8232C] shadow-[0_8px_22px_rgba(200,35,44,0.18)]'
            } ${compact ? 'px-3 py-2.5' : 'px-4 py-3 sm:px-5 sm:py-3.5'}`}
          >
            {/* Outer double-ink frame line */}
            <div className="pointer-events-none absolute inset-1 rounded-xl border border-[#D62828]/45" />

            {/* User's Red Seal Image */}
            <img
              src={SEAL_IMAGE_SRC}
              alt="Con dấu MiXiangg HSK đã hoàn thành"
              referrerPolicy="no-referrer"
              className={`object-contain drop-shadow-[0_1px_1px_rgba(185,28,28,0.25)] ${
                compact ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-20 h-20 sm:w-24 sm:h-24'
              }`}
            />

            {/* "ĐÃ HOÀN THÀNH" Ink Ribbon */}
            <div className="mt-1 px-2.5 py-0.5 rounded-md bg-[#D62828] text-white font-extrabold tracking-widest uppercase text-[10px] sm:text-[11px] leading-tight shadow-2xs">
              {label}
            </div>

            <span className="mt-0.5 font-mono text-[10px] font-extrabold text-[#B91C1C] tracking-wider tabular-nums">
              {dateText}
            </span>
          </div>
        ) : (
          <div
            className={`opacity-0 ${
              compact ? 'w-24 h-24' : 'w-28 h-28 sm:w-32 sm:h-32'
            }`}
          />
        )}

        {/* Subtle Replay Hint on Hover */}
        <span
          className={`mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-opacity ${
            surface === 'dark'
              ? 'bg-black/30 text-amber-200 hover:bg-black/45 border border-white/15'
              : 'bg-[#FAF5EB] text-[#9A3412] hover:bg-[#F3E7D4] border border-[#E6D6BC]'
          }`}
        >
          <RotateCcw className="w-3 h-3" />
          <span>Đóng dấu lại</span>
        </span>
      </button>
    </div>
  );
};

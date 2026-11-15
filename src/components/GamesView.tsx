import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Gamepad2,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Heart,
  Trophy,
  Flame,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Keyboard,
  MousePointerClick,
  Layers,
  Award,
  ArrowLeft,
  Grid2X2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useHSK } from '../context/HSKContext';
import { HSKLevel, VocabItem } from '../types/hsk';
import { speakChinese } from '../utils/audioSpeech';

type ActiveGameType = 'rain' | 'match';
type RainControlMode = 'choice' | 'pinyin';
type RainSpeed = 'slow' | 'normal' | 'fast';
type GamePhase = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

interface RainDrop {
  uid: string;
  vocab: VocabItem;
  xPercent: number; // 10..86
  yPercent: number; // 0..100
  speedPerSec: number; // % height per second
  spawnedAt: number;
}

interface MatchTile {
  uid: string;
  vocabId: string;
  type: 'hanzi' | 'meaning';
  text: string;
  subText?: string;
  vocab: VocabItem;
  matched: boolean;
}

interface HighScores {
  rainChoice: number;
  rainPinyin: number;
  matchBestScore: number;
  matchBestTimeSec: number | null;
}

const HIGH_SCORE_STORAGE_KEY = 'mixiang_hsk_game_highscores_v1';

// Chuẩn hóa Pinyin để hỗ trợ gõ không dấu, có dấu hoặc gõ chữ thường liền nhau
function normalizePinyin(input: string, uAsV = false): string {
  const map: Record<string, string> = {
    ā: 'a', á: 'a', ǎ: 'a', à: 'a',
    ē: 'e', é: 'e', ě: 'e', è: 'e',
    ī: 'i', í: 'i', ǐ: 'i', ì: 'i',
    ō: 'o', ó: 'o', ǒ: 'o', ò: 'o',
    ū: 'u', ú: 'u', ǔ: 'u', ù: 'u',
    ǖ: uAsV ? 'v' : 'u',
    ǘ: uAsV ? 'v' : 'u',
    ǚ: uAsV ? 'v' : 'u',
    ǜ: uAsV ? 'v' : 'u',
    ü: uAsV ? 'v' : 'u',
  };
  return input
    .toLowerCase()
    .trim()
    .split('')
    .map((ch) => map[ch] || ch)
    .join('')
    .replace(/[1-5\s.,!?'"\-_/]/g, '');
}

function isPinyinMatch(typed: string, targetPinyin: string): boolean {
  const normTyped = normalizePinyin(typed);
  if (!normTyped) return false;
  return (
    normTyped === normalizePinyin(targetPinyin, false) ||
    normTyped === normalizePinyin(targetPinyin, true)
  );
}

// Web Audio API synthesized sound FX (0 KB external audio assets)
function playGameTone(type: 'hit' | 'miss' | 'combo' | 'gameover' | 'win') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playNote = (freq: number, start: number, duration: number, wave: OscillatorType = 'sine', gainVal = 0.08) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(gainVal, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration);
    };

    if (type === 'hit') {
      playNote(587.33, 0, 0.09, 'triangle', 0.09);
      playNote(880, 0.06, 0.14, 'sine', 0.08);
    } else if (type === 'combo') {
      playNote(523.25, 0, 0.08, 'triangle', 0.08);
      playNote(659.25, 0.06, 0.08, 'triangle', 0.08);
      playNote(783.99, 0.12, 0.12, 'triangle', 0.09);
      playNote(1046.5, 0.18, 0.18, 'sine', 0.09);
    } else if (type === 'miss') {
      playNote(240, 0, 0.12, 'sawtooth', 0.06);
      playNote(180, 0.1, 0.18, 'sawtooth', 0.05);
    } else if (type === 'gameover') {
      playNote(392, 0, 0.14, 'triangle', 0.07);
      playNote(349.23, 0.14, 0.14, 'triangle', 0.07);
      playNote(293.66, 0.28, 0.28, 'triangle', 0.07);
    } else if (type === 'win') {
      playNote(523.25, 0, 0.1, 'triangle', 0.09);
      playNote(659.25, 0.09, 0.1, 'triangle', 0.09);
      playNote(783.99, 0.18, 0.1, 'triangle', 0.09);
      playNote(1046.5, 0.27, 0.28, 'sine', 0.1);
    }

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 800);
  } catch {
    // Ignore audio context restriction errors
  }
}

export const GamesView: React.FC = () => {
  const {
    vocabularies,
    vocabDecks,
    studentProfile,
    markVocabMastered,
    markVocabLearning,
    recordStudyMinutes,
  } = useHSK();

  // High scores from localStorage
  const [highScores, setHighScores] = useState<HighScores>(() => {
    try {
      const raw = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return {
      rainChoice: 0,
      rainPinyin: 0,
      matchBestScore: 0,
      matchBestTimeSec: null,
    };
  });

  const saveHighScores = useCallback((next: HighScores) => {
    setHighScores(next);
    try {
      localStorage.setItem(HIGH_SCORE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  // Game Selection & Config
  const [activeGame, setActiveGame] = useState<ActiveGameType>('rain');
  const [selectedSource, setSelectedSource] = useState<string>('ALL'); // 'ALL', HSKLevel, or 'deck:<id>'
  const [rainControlMode, setRainControlMode] = useState<RainControlMode>('choice');
  const [rainSpeed, setRainSpeed] = useState<RainSpeed>('normal');
  const [showRainPinyin, setShowRainPinyin] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [autoSpeakOnHit, setAutoSpeakOnHit] = useState<boolean>(true);
  const [autoSyncProgress, setAutoSyncProgress] = useState<boolean>(true);

  // Shared Game Phase
  const [phase, setPhase] = useState<GamePhase>('TITLE_MENU');

  // Build Vocab Pool
  const vocabPool = useMemo<VocabItem[]>(() => {
    if (selectedSource === 'ALL') return vocabularies;
    if (selectedSource.startsWith('deck:')) {
      const deckId = selectedSource.replace('deck:', '');
      const deck = vocabDecks.find((d) => d.id === deckId);
      return deck && deck.cards.length > 0 ? deck.cards : vocabularies;
    }
    const levelFiltered = vocabularies.filter((v) => v.level === (selectedSource as HSKLevel));
    return levelFiltered.length >= 4 ? levelFiltered : vocabularies;
  }, [selectedSource, vocabularies, vocabDecks]);

  // =========================================================================
  // GAME 1: MƯA TỪ VỰNG 2D (VOCABULARY RAIN)
  // =========================================================================
  const [drops, setDrops] = useState<RainDrop[]>([]);
  const [selectedDropUid, setSelectedDropUid] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lives, setLives] = useState(5);
  const [correctWords, setCorrectWords] = useState<VocabItem[]>([]);
  const [missedWords, setMissedWords] = useState<VocabItem[]>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [pinyinInput, setPinyinInput] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState<{
    text: string;
    tone: 'hit' | 'miss';
  } | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [progressSyncedForRound, setProgressSyncedForRound] = useState(false);

  const dropsRef = useRef<RainDrop[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(5);
  const comboRef = useRef(0);
  const elapsedRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  const lastSpawnRef = useRef<number>(0);
  const pinyinInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    dropsRef.current = drops;
  }, [drops]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);

  // Cấp độ mưa (tăng dần theo số từ trả lời đúng và thời gian chơi)
  const rainWaveLevel = useMemo(() => {
    const byWords = Math.floor(correctWords.length / 5);
    const byTime = Math.floor(elapsedSec / 35);
    return Math.min(6, 1 + Math.max(byWords, byTime));
  }, [correctWords.length, elapsedSec]);

  // Số từ tối đa xuất hiện cùng lúc tăng dần theo cấp độ mưa (bắt đầu chỉ 2 từ để dễ làm quen)
  const maxConcurrentDrops = useMemo(() => {
    if (rainWaveLevel === 1) return 2;
    if (rainWaveLevel === 2) return 3;
    if (rainWaveLevel === 3) return 4;
    if (rainWaveLevel === 4) return 5;
    return 6;
  }, [rainWaveLevel]);

  // Tốc độ rơi (% chiều cao khung / giây) — Đã giảm chậm lại đáng kể cho mức Thong thả và tăng dần mượt mà
  const speedMultiplier = useMemo(() => {
    const base = rainSpeed === 'slow' ? 4.2 : rainSpeed === 'normal' ? 6.2 : 8.8;
    const ramp = (rainWaveLevel - 1) * (rainSpeed === 'slow' ? 0.45 : 0.65);
    return base + ramp;
  }, [rainSpeed, rainWaveLevel]);

  // Khoảng cách thời gian xuất hiện từ mới (ms) — Chậm hơn ~2 giây lúc khởi đầu và rút ngắn dần khi lên cấp
  const spawnIntervalMs = useMemo(() => {
    const base = rainSpeed === 'slow' ? 4800 : rainSpeed === 'normal' ? 4100 : 3400;
    const minInterval = rainSpeed === 'slow' ? 2400 : rainSpeed === 'normal' ? 1800 : 1300;
    const reduction = (rainWaveLevel - 1) * 420 + Math.min(600, correctWords.length * 35);
    return Math.max(minInterval, base - reduction);
  }, [rainSpeed, rainWaveLevel, correctWords.length]);

  const spawnOneDrop = useCallback((): RainDrop | null => {
    if (vocabPool.length === 0) return null;
    const activeIds = new Set(dropsRef.current.map((d) => d.vocab.id));
    const candidates = vocabPool.filter((v) => !activeIds.has(v.id));
    const source = candidates.length > 0 ? candidates : vocabPool;
    const picked = source[Math.floor(Math.random() * source.length)];

    // Spread horizontally so drops don't overlap directly
    const lanePositions = [14, 30, 46, 62, 78];
    const usedNearTop = dropsRef.current
      .filter((d) => d.yPercent < 25)
      .map((d) => d.xPercent);
    const openLanes = lanePositions.filter(
      (x) => !usedNearTop.some((ux) => Math.abs(ux - x) < 12)
    );
    const chosenX =
      openLanes.length > 0
        ? openLanes[Math.floor(Math.random() * openLanes.length)]
        : lanePositions[Math.floor(Math.random() * lanePositions.length)];

    return {
      uid: `drop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      vocab: picked,
      xPercent: chosenX + (Math.random() * 6 - 3),
      yPercent: 2,
      speedPerSec: speedMultiplier * (0.9 + Math.random() * 0.25),
      spawnedAt: Date.now(),
    };
  }, [vocabPool, speedMultiplier]);

  const finishRainGame = useCallback(
    (finalScore: number, finalElapsedSec: number) => {
      setPhase('GAME_OVER');
      if (soundEnabled) playGameTone('gameover');

      // Check & persist High Score
      const modeKey = rainControlMode === 'choice' ? 'rainChoice' : 'rainPinyin';
      if (finalScore > highScores[modeKey]) {
        setIsNewRecord(true);
        saveHighScores({
          ...highScores,
          [modeKey]: finalScore,
        });
      }

      // Record study minutes (minimum 1 min if played >= 20s or answered >= 3 words)
      const mins = Math.max(1, Math.round(finalElapsedSec / 60));
      if (finalElapsedSec >= 15 || finalScore > 0) {
        recordStudyMinutes(mins);
      }
    },
    [highScores, rainControlMode, recordStudyMinutes, saveHighScores, soundEnabled]
  );

  const startRainGame = () => {
    if (vocabPool.length < 4) return;
    const firstDrop = spawnOneDrop();
    const initialDrops = firstDrop ? [firstDrop] : [];
    dropsRef.current = initialDrops;
    setDrops(initialDrops);
    setSelectedDropUid(firstDrop?.uid || null);
    setScore(0);
    scoreRef.current = 0;
    setCombo(0);
    comboRef.current = 0;
    setMaxCombo(0);
    setLives(5);
    livesRef.current = 5;
    setCorrectWords([]);
    setMissedWords([]);
    setElapsedSec(0);
    elapsedRef.current = 0;
    setPinyinInput('');
    setFeedbackBanner(null);
    setIsNewRecord(false);
    setProgressSyncedForRound(false);
    lastSpawnRef.current = performance.now();
    lastFrameRef.current = null;
    setPhase('PLAYING');

    if (rainControlMode === 'pinyin') {
      setTimeout(() => pinyinInputRef.current?.focus(), 60);
    }
  };

  // Timer tick (1s) when PLAYING
  useEffect(() => {
    if (phase !== 'PLAYING') return;
    const timer = window.setInterval(() => {
      elapsedRef.current += 1;
      setElapsedSec(elapsedRef.current);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  // Rain 2D Animation Loop (requestAnimationFrame)
  useEffect(() => {
    if (activeGame !== 'rain' || phase !== 'PLAYING') {
      lastFrameRef.current = null;
      return;
    }

    let rafId = 0;

    const tick = (now: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = now;
      }
      const dt = Math.min(0.08, (now - lastFrameRef.current) / 1000);
      lastFrameRef.current = now;

      let nextDrops = dropsRef.current.map((d) => ({
        ...d,
        yPercent: d.yPercent + d.speedPerSec * dt,
      }));

      // Check bottom collision (y >= 89% in viewport-fitted arena)
      const escaped = nextDrops.filter((d) => d.yPercent >= 89);
      if (escaped.length > 0) {
        nextDrops = nextDrops.filter((d) => d.yPercent < 89);
        const newLives = Math.max(0, livesRef.current - escaped.length);
        livesRef.current = newLives;
        setLives(newLives);
        comboRef.current = 0;
        setCombo(0);
        setMissedWords((prev) => {
          const existing = new Set(prev.map((w) => w.id));
          const additions = escaped.map((e) => e.vocab).filter((v) => !existing.has(v.id));
          return [...prev, ...additions];
        });
        if (autoSyncProgress) {
          escaped.forEach((e) => markVocabLearning(e.vocab.id));
        }
        setFeedbackBanner({
          text: `Rơi mất: ${escaped.map((e) => `${e.vocab.word} (${e.vocab.meaning})`).join(', ')}`,
          tone: 'miss',
        });
        if (soundEnabled && newLives > 0) playGameTone('miss');

        if (newLives <= 0) {
          dropsRef.current = [];
          setDrops([]);
          finishRainGame(scoreRef.current, elapsedRef.current);
          return;
        }
      }

      // Spawn new drop on interval or if arena is empty (up to progressive maxConcurrentDrops)
      if (
        (nextDrops.length === 0 || now - lastSpawnRef.current >= spawnIntervalMs) &&
        nextDrops.length < maxConcurrentDrops
      ) {
        lastSpawnRef.current = now;
        // Temporarily sync dropsRef for duplicate check
        dropsRef.current = nextDrops;
        const fresh = spawnOneDrop();
        if (fresh) {
          nextDrops = [...nextDrops, fresh];
        }
      }

      dropsRef.current = nextDrops;
      setDrops(nextDrops);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [
    activeGame,
    phase,
    spawnIntervalMs,
    maxConcurrentDrops,
    spawnOneDrop,
    soundEnabled,
    autoSyncProgress,
    markVocabLearning,
    finishRainGame,
  ]);

  // Active Target Drop (either user-selected or the lowest falling drop)
  const targetDrop = useMemo<RainDrop | null>(() => {
    if (drops.length === 0) return null;
    if (selectedDropUid) {
      const found = drops.find((d) => d.uid === selectedDropUid);
      if (found) return found;
    }
    return [...drops].sort((a, b) => b.yPercent - a.yPercent)[0];
  }, [drops, selectedDropUid]);

  // 4 Deterministic-looking Shuffled Choices for targetDrop
  const targetChoices = useMemo<VocabItem[]>(() => {
    if (!targetDrop) return [];
    const others = vocabPool.filter((v) => v.id !== targetDrop.vocab.id);
    const pickedOthers: VocabItem[] = [];
    // Use targetDrop.uid hash-like deterministic shuffle so options don't jump every animation frame!
    let seed = targetDrop.uid
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

    const poolCopy = [...others];
    while (pickedOthers.length < 3 && poolCopy.length > 0) {
      seed = (seed * 9301 + 49297) % 233280;
      const idx = seed % poolCopy.length;
      pickedOthers.push(poolCopy.splice(idx, 1)[0]);
    }

    const all = [targetDrop.vocab, ...pickedOthers];
    // Deterministic position shuffle based on uid
    for (let i = all.length - 1; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      const j = seed % (i + 1);
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
  }, [targetDrop, vocabPool]);

  const handleHitDrop = useCallback(
    (drop: RainDrop) => {
      const nextDrops = dropsRef.current.filter((d) => d.uid !== drop.uid);
      dropsRef.current = nextDrops;
      setDrops(nextDrops);
      if (selectedDropUid === drop.uid) {
        setSelectedDropUid(null);
      }

      const nextCombo = comboRef.current + 1;
      comboRef.current = nextCombo;
      setCombo(nextCombo);
      setMaxCombo((prev) => Math.max(prev, nextCombo));

      const pointsEarned = 10 + Math.min(25, (nextCombo - 1) * 3);
      const nextScore = scoreRef.current + pointsEarned;
      scoreRef.current = nextScore;
      setScore(nextScore);

      setCorrectWords((prev) => {
        if (prev.some((w) => w.id === drop.vocab.id)) return prev;
        return [...prev, drop.vocab];
      });

      if (autoSyncProgress) {
        markVocabMastered(drop.vocab.id);
      }

      setFeedbackBanner({
        text: `+${pointsEarned}đ · ${drop.vocab.word} (${drop.vocab.pinyin}): ${drop.vocab.meaning}`,
        tone: 'hit',
      });

      if (soundEnabled) {
        playGameTone(nextCombo > 0 && nextCombo % 5 === 0 ? 'combo' : 'hit');
      }
      if (autoSpeakOnHit) {
        speakChinese(drop.vocab.word);
      }
      if (nextCombo > 0 && nextCombo % 10 === 0) {
        confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
      }
    },
    [autoSpeakOnHit, autoSyncProgress, markVocabMastered, selectedDropUid, soundEnabled]
  );

  const handleChoiceSelect = (chosen: VocabItem) => {
    if (phase !== 'PLAYING' || !targetDrop) return;
    if (chosen.id === targetDrop.vocab.id) {
      handleHitDrop(targetDrop);
    } else {
      comboRef.current = 0;
      setCombo(0);
      const nextLives = Math.max(0, livesRef.current - 1);
      livesRef.current = nextLives;
      setLives(nextLives);
      setMissedWords((prev) =>
        prev.some((w) => w.id === targetDrop.vocab.id) ? prev : [...prev, targetDrop.vocab]
      );
      if (autoSyncProgress) {
        markVocabLearning(targetDrop.vocab.id);
      }
      setFeedbackBanner({
        text: `Chưa đúng! ${targetDrop.vocab.word} nghĩa là "${targetDrop.vocab.meaning}"`,
        tone: 'miss',
      });
      if (soundEnabled && nextLives > 0) playGameTone('miss');

      if (nextLives <= 0) {
        dropsRef.current = [];
        setDrops([]);
        finishRainGame(scoreRef.current, elapsedRef.current);
      }
    }
  };

  const handlePinyinChange = (rawVal: string) => {
    setPinyinInput(rawVal);
    if (phase !== 'PLAYING') return;
    if (!rawVal.trim()) return;

    // Match lowest drop first if multiple have same normalized pinyin
    const sorted = [...dropsRef.current].sort((a, b) => b.yPercent - a.yPercent);
    const matchedDrop = sorted.find((d) => isPinyinMatch(rawVal, d.vocab.pinyin));
    if (matchedDrop) {
      setPinyinInput('');
      handleHitDrop(matchedDrop);
    }
  };

  const handlePinyinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phase !== 'PLAYING' || !pinyinInput.trim()) return;
    const sorted = [...dropsRef.current].sort((a, b) => b.yPercent - a.yPercent);
    const matchedDrop = sorted.find((d) => isPinyinMatch(pinyinInput, d.vocab.pinyin));
    if (matchedDrop) {
      setPinyinInput('');
      handleHitDrop(matchedDrop);
    } else {
      comboRef.current = 0;
      setCombo(0);
      setPinyinInput('');
      setFeedbackBanner({
        text: `Không có hạt mưa khớp với "${rawTrim(pinyinInput)}" — thử gõ lại nhé!`,
        tone: 'miss',
      });
      if (soundEnabled) playGameTone('miss');
    }
  };

  // Keyboard shortcuts 1-4 for 4-choice Rain mode
  useEffect(() => {
    if (activeGame !== 'rain' || rainControlMode !== 'choice' || phase !== 'PLAYING') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        if (targetChoices[idx]) {
          e.preventDefault();
          handleChoiceSelect(targetChoices[idx]);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const handleEndEarly = () => {
    if (activeGame === 'rain') {
      dropsRef.current = [];
      setDrops([]);
      finishRainGame(score, elapsedSec);
    } else {
      setPhase('GAME_OVER');
      if (elapsedSec >= 15 || score > 0) {
        recordStudyMinutes(Math.max(1, Math.round(elapsedSec / 60)));
      }
    }
  };

  function rawTrim(s: string) {
    return s.trim();
  }

  // =========================================================================
  // GAME 2: GHÉP CẶP HÁN – VIỆT TÍNH GIỜ (PAIR MATCHING)
  // =========================================================================
  const [matchTiles, setMatchTiles] = useState<MatchTile[]>([]);
  const [selectedTileUid, setSelectedTileUid] = useState<string | null>(null);
  const [matchErrorUids, setMatchErrorUids] = useState<string[]>([]);
  const [matchRound, setMatchRound] = useState(1);
  const [matchMistakes, setMatchMistakes] = useState(0);

  const setupMatchBoard = useCallback(
    (roundNum: number, resetStats: boolean) => {
      const shuffledPool = [...vocabPool].sort(() => Math.random() - 0.5);
      const picked = shuffledPool.slice(0, Math.min(6, shuffledPool.length));

      const hanziTiles: MatchTile[] = picked.map((v) => ({
        uid: `h-${v.id}-${roundNum}`,
        vocabId: v.id,
        type: 'hanzi',
        text: v.word,
        subText: showRainPinyin ? v.pinyin : undefined,
        vocab: v,
        matched: false,
      }));

      const meaningTiles: MatchTile[] = picked.map((v) => ({
        uid: `m-${v.id}-${roundNum}`,
        vocabId: v.id,
        type: 'meaning',
        text: v.meaning,
        vocab: v,
        matched: false,
      }));

      const combined = [...hanziTiles, ...meaningTiles].sort(() => Math.random() - 0.5);
      setMatchTiles(combined);
      setSelectedTileUid(null);
      setMatchErrorUids([]);
      setMatchRound(roundNum);

      if (resetStats) {
        setScore(0);
        scoreRef.current = 0;
        setCombo(0);
        comboRef.current = 0;
        setMaxCombo(0);
        setElapsedSec(0);
        elapsedRef.current = 0;
        setMatchMistakes(0);
        setCorrectWords([]);
        setMissedWords([]);
        setIsNewRecord(false);
        setProgressSyncedForRound(false);
      }
      setPhase('PLAYING');
    },
    [showRainPinyin, vocabPool]
  );

  const handleTileClick = (tile: MatchTile) => {
    if (phase !== 'PLAYING' || tile.matched || matchErrorUids.includes(tile.uid)) return;

    if (tile.type === 'hanzi' && autoSpeakOnHit) {
      speakChinese(tile.vocab.word);
    }

    if (!selectedTileUid) {
      setSelectedTileUid(tile.uid);
      return;
    }

    if (selectedTileUid === tile.uid) {
      setSelectedTileUid(null);
      return;
    }

    const firstTile = matchTiles.find((t) => t.uid === selectedTileUid);
    if (!firstTile) {
      setSelectedTileUid(tile.uid);
      return;
    }

    // Same type -> switch selection smoothly
    if (firstTile.type === tile.type) {
      setSelectedTileUid(tile.uid);
      return;
    }

    // Check match!
    if (firstTile.vocabId === tile.vocabId) {
      const updated = matchTiles.map((t) =>
        t.vocabId === tile.vocabId ? { ...t, matched: true } : t
      );
      setMatchTiles(updated);
      setSelectedTileUid(null);

      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setMaxCombo((prev) => Math.max(prev, nextCombo));
      const gained = 20 + Math.min(30, (nextCombo - 1) * 5);
      const nextScore = score + gained;
      setScore(nextScore);
      scoreRef.current = nextScore;

      setCorrectWords((prev) =>
        prev.some((w) => w.id === tile.vocab.id) ? prev : [...prev, tile.vocab]
      );
      if (autoSyncProgress) {
        markVocabMastered(tile.vocab.id);
      }
      if (soundEnabled) playGameTone(nextCombo % 4 === 0 ? 'combo' : 'hit');

      // Check board clear
      if (updated.every((t) => t.matched)) {
        if (matchRound < 2 && vocabPool.length >= 6) {
          if (soundEnabled) playGameTone('win');
          setTimeout(() => {
            setupMatchBoard(matchRound + 1, false);
          }, 550);
        } else {
          // Completed 2 boards -> Victory!
          if (soundEnabled) playGameTone('win');
          confetti({ particleCount: 70, spread: 75, origin: { y: 0.65 } });
          setPhase('GAME_OVER');

          const nextHigh = { ...highScores };
          let recordHit = false;
          if (nextScore > highScores.matchBestScore) {
            nextHigh.matchBestScore = nextScore;
            recordHit = true;
          }
          if (
            highScores.matchBestTimeSec === null ||
            elapsedRef.current < highScores.matchBestTimeSec
          ) {
            nextHigh.matchBestTimeSec = elapsedRef.current;
            recordHit = true;
          }
          if (recordHit) {
            setIsNewRecord(true);
            saveHighScores(nextHigh);
          }

          const mins = Math.max(1, Math.round(elapsedRef.current / 60));
          recordStudyMinutes(mins);
        }
      }
    } else {
      // Mismatch
      setCombo(0);
      setMatchMistakes((prev) => prev + 1);
      setScore((prev) => Math.max(0, prev - 5));
      setMatchErrorUids([firstTile.uid, tile.uid]);
      setSelectedTileUid(null);

      const wrongVocab = firstTile.type === 'hanzi' ? firstTile.vocab : tile.vocab;
      setMissedWords((prev) =>
        prev.some((w) => w.id === wrongVocab.id) ? prev : [...prev, wrongVocab]
      );
      if (autoSyncProgress) {
        markVocabLearning(wrongVocab.id);
      }
      if (soundEnabled) playGameTone('miss');

      setTimeout(() => {
        setMatchErrorUids([]);
      }, 500);
    }
  };

  // Manual sync button in summary (if autoSyncProgress was off)
  const handleManualSyncVocab = () => {
    correctWords.forEach((v) => markVocabMastered(v.id));
    missedWords.forEach((v) => markVocabLearning(v.id));
    setProgressSyncedForRound(true);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-3.5 pb-4">
      {/* Header Banner - Only shown on Menu or Game Over so Active Play fits 100% in viewport */}
      {phase !== 'PLAYING' && phase !== 'PAUSED' && (
        <div className="rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-[#18181B] text-white px-5 py-4 border border-red-500/70 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-amber-200">
              <Gamepad2 className="w-4 h-4 text-amber-300" />
              <span>Trò chơi 2D luyện trí nhớ · 趣味汉字游戏</span>
            </div>
            <h1 className="font-serif text-[20px] sm:text-[23px] font-black text-white leading-tight">
              Chơi Game Ôn Từ Vựng HSK
            </h1>
            <p className="text-[13px] sm:text-[14px] text-rose-50 leading-snug">
              Luyện phản xạ mặt chữ Hán, Pinyin và nghĩa tiếng Việt cực nhẹ – kết nối thẳng vào tiến độ học của bạn.
            </p>
          </div>

          {/* High Score Summary Box */}
          <div className="grid grid-cols-3 gap-2 shrink-0">
            <div className="px-3 py-2 rounded-xl bg-black/30 border border-white/15">
              <div className="text-[11px] text-amber-200 font-bold">Mưa (4 đáp án)</div>
              <div className="font-mono text-[15px] font-black text-white tabular-nums">
                {highScores.rainChoice}đ
              </div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-black/30 border border-white/15">
              <div className="text-[11px] text-amber-200 font-bold">Mưa (Gõ Pinyin)</div>
              <div className="font-mono text-[15px] font-black text-white tabular-nums">
                {highScores.rainPinyin}đ
              </div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-black/30 border border-white/15">
              <div className="text-[11px] text-amber-200 font-bold">Ghép cặp</div>
              <div className="font-mono text-[15px] font-black text-white tabular-nums">
                {highScores.matchBestScore}đ
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Switcher Tabs (Only visible on Menu) */}
      {phase === 'TITLE_MENU' && (
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#F5EFEB] border border-[#E8DFCE]">
          <button
            type="button"
            onClick={() => setActiveGame('rain')}
            className={`flex-1 min-w-[180px] px-4 py-2 rounded-xl font-black text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeGame === 'rain'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-[#18181B] hover:bg-white'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Mưa Từ Vựng 2D (汉字雨)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveGame('match')}
            className={`flex-1 min-w-[180px] px-4 py-2 rounded-xl font-black text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeGame === 'match'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-[#18181B] hover:bg-white'
            }`}
          >
            <Grid2X2 className="w-4 h-4 shrink-0" />
            <span>Ghép Cặp Hán – Việt</span>
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* STATE 1: TITLE_MENU (CHỌN CHẾ ĐỘ & CẤU HÌNH TRƯỚC KHI CHƠI) */}
      {/* =================================================================== */}
      {phase === 'TITLE_MENU' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Left: Game Setup */}
          <div className="xl:col-span-8 bg-white rounded-2xl border border-[#E8DFCE] p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EFE7D6] pb-3">
              <div>
                <h2 className="font-serif text-[18px] sm:text-[20px] font-black text-[#18181B]">
                  {activeGame === 'rain'
                    ? 'Cài đặt ván Mưa Từ Vựng 2D'
                    : 'Cài đặt ván Ghép Cặp Hán – Việt'}
                </h2>
                <p className="text-[13px] text-slate-600">
                  {activeGame === 'rain'
                    ? 'Chọn kho từ vựng và cách điều khiển trước khi bắt đầu.'
                    : 'Ghép 2 vòng (12 cặp Hán – Việt) nhanh nhất để ghi điểm kỷ lục.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (activeGame === 'rain') startRainGame();
                  else setupMatchBoard(1, true);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[14px] shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Chơi ngay</span>
              </button>
            </div>

            {/* 1. Chọn nguồn từ vựng */}
            <div className="space-y-1.5">
              <label
                htmlFor="game-vocab-source"
                className="block text-[13px] font-extrabold text-[#18181B]"
              >
                1. Kho từ vựng luyện tập ({vocabPool.length} từ khả dụng)
              </label>
              <select
                id="game-vocab-source"
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border-2 border-[#E8DFCE] bg-[#FDFBF6] text-[#18181B] font-bold text-[13px] sm:text-[14px] focus:outline-none focus:border-red-600 cursor-pointer"
              >
                <option value="ALL">Tất cả từ vựng HSK 1 – 5 ({vocabularies.length} từ)</option>
                {(['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5'] as HSKLevel[]).map((lvl) => {
                  const count = vocabularies.filter((v) => v.level === lvl).length;
                  return (
                    <option key={lvl} value={lvl}>
                      Cấp độ {lvl} ({count} từ)
                    </option>
                  );
                })}
                {vocabDecks.map((deck) => (
                  <option key={deck.id} value={`deck:${deck.id}`}>
                    Bộ thẻ: {deck.title} ({deck.cards.length} thẻ)
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Chế độ điều khiển (chỉ cho Mưa từ vựng) */}
            {activeGame === 'rain' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                <div className="lg:col-span-7 space-y-1.5">
                  <div className="text-[13px] font-extrabold text-[#18181B]">
                    2. Chế độ điều khiển
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRainControlMode('choice')}
                      className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer space-y-1 ${
                        rainControlMode === 'choice'
                          ? 'bg-[#FFF5F3] border-red-600 shadow-2xs'
                          : 'bg-[#FDFBF6] border-[#E8DFCE] hover:border-red-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <MousePointerClick className="w-4 h-4 text-red-600" />
                        <span className="text-[11px] font-black text-red-700">4 đáp án</span>
                      </div>
                      <div className="font-serif text-[14px] font-black text-[#18181B]">
                        Bấm chọn nghĩa
                      </div>
                      <p className="text-[12px] text-slate-600 leading-tight">
                        Chạm đúng nghĩa Tiếng Việt trong 4 nút bên dưới.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRainControlMode('pinyin')}
                      className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer space-y-1 ${
                        rainControlMode === 'pinyin'
                          ? 'bg-[#FEFCE8] border-amber-600 shadow-2xs'
                          : 'bg-[#FDFBF6] border-[#E8DFCE] hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <Keyboard className="w-4 h-4 text-amber-700" />
                        <span className="text-[11px] font-black text-amber-800">Gõ phím</span>
                      </div>
                      <div className="font-serif text-[14px] font-black text-[#18181B]">
                        Gõ Pinyin phá từ
                      </div>
                      <p className="text-[12px] text-slate-600 leading-tight">
                        Gõ Pinyin không dấu (vd: nihao) để bắn rụng từ.
                      </p>
                    </button>
                  </div>
                </div>

                {/* 3. Tốc độ rơi */}
                <div className="lg:col-span-5 space-y-1.5">
                  <div className="text-[13px] font-extrabold text-[#18181B]">
                    3. Tốc độ hạt mưa rơi
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'slow', label: 'Thong thả', sub: 'Chậm' },
                        { id: 'normal', label: 'Tiêu chuẩn', sub: 'Vừa' },
                        { id: 'fast', label: 'Thử thách', sub: 'Nhanh' },
                      ] as const
                    ).map((spd) => (
                      <button
                        key={spd.id}
                        type="button"
                        onClick={() => setRainSpeed(spd.id)}
                        className={`p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                          rainSpeed === spd.id
                            ? 'bg-[#18181B] text-white border-[#18181B]'
                            : 'bg-[#FDFBF6] text-[#18181B] border-[#E8DFCE] hover:border-red-400'
                        }`}
                      >
                        <div className="text-[13px] font-black">{spd.label}</div>
                        <div
                          className={`text-[11px] ${
                            rainSpeed === spd.id ? 'text-amber-300' : 'text-slate-500'
                          }`}
                        >
                          {spd.sub}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tùy chọn hỗ trợ */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#EFE7D6]">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FDFBF6] border border-[#E8DFCE] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRainPinyin}
                  onChange={(e) => setShowRainPinyin(e.target.checked)}
                  className="w-4 h-4 accent-red-600 cursor-pointer"
                />
                <span className="text-[12px] sm:text-[13px] font-bold text-[#18181B]">
                  Hiện gợi ý Pinyin dưới chữ Hán
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FDFBF6] border border-[#E8DFCE] cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSpeakOnHit}
                  onChange={(e) => setAutoSpeakOnHit(e.target.checked)}
                  className="w-4 h-4 accent-red-600 cursor-pointer"
                />
                <span className="text-[12px] sm:text-[13px] font-bold text-[#18181B]">
                  Phát âm tiếng Trung khi chọn
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FDFBF6] border border-[#E8DFCE] cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-4 h-4 accent-red-600 cursor-pointer"
                />
                <span className="text-[12px] sm:text-[13px] font-bold text-[#18181B]">
                  Bật âm thanh hiệu ứng game
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#ECFDF5] border border-emerald-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSyncProgress}
                  onChange={(e) => setAutoSyncProgress(e.target.checked)}
                  className="w-4 h-4 accent-emerald-700 cursor-pointer"
                />
                <span className="text-[12px] sm:text-[13px] font-bold text-[#18181B]">
                  Tự cập nhật từ "Đã thuộc / Cần ôn"
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                if (activeGame === 'rain') startRainGame();
                else setupMatchBoard(1, true);
              }}
              className="w-full py-3 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[15px] shadow-sm transition-transform active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>
                {activeGame === 'rain' ? 'Bắt đầu Mưa Từ Vựng' : 'Bắt đầu Ghép Cặp Hán – Việt'}
              </span>
            </button>
          </div>

          {/* Right: Rules & Progress Link */}
          <div className="xl:col-span-4 space-y-3.5">
            <div className="rounded-2xl bg-[#FFF5F3] border border-red-200 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-red-700 font-black text-[15px]">
                <Layers className="w-5 h-5 shrink-0" />
                <span>Luật chơi & Tính điểm</span>
              </div>

              {activeGame === 'rain' ? (
                <ul className="space-y-2 text-[13px] text-[#18181B] leading-snug">
                  <li>
                    <strong className="text-red-700">Mục tiêu:</strong> Giải nghĩa các chữ Hán đang rơi trước khi chạm đáy sân chơi.
                  </li>
                  <li>
                    <strong className="text-red-700">Combo:</strong> Trả lời đúng liên tiếp để nhân điểm thưởng (tối đa +35đ/từ).
                  </li>
                  <li>
                    <strong className="text-red-700">5 Mạng (Tim):</strong> Để chữ rơi xuống đáy hoặc chọn sai sẽ mất 1 tim.
                  </li>
                  <li>
                    <strong className="text-red-700">Chuyển mục tiêu:</strong> Bấm trực tiếp vào bất kỳ hạt mưa nào để ưu tiên giải từ đó.
                  </li>
                </ul>
              ) : (
                <ul className="space-y-2 text-[13px] text-[#18181B] leading-snug">
                  <li>
                    <strong className="text-red-700">Mục tiêu:</strong> Chạm 1 thẻ chữ Hán và 1 thẻ nghĩa Tiếng Việt tương ứng để xóa cặp.
                  </li>
                  <li>
                    <strong className="text-red-700">2 Vòng liên tiếp:</strong> Tổng cộng 12 cặp từ ngẫu nhiên từ kho HSK bạn chọn.
                  </li>
                  <li>
                    <strong className="text-red-700">Kỷ lục:</strong> Tính cả điểm cao nhất và thời gian hoàn thành nhanh nhất.
                  </li>
                </ul>
              )}
            </div>

            <div className="rounded-2xl bg-[#FEFCE8] border border-amber-200 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-black text-[14px]">
                <Award className="w-5 h-5 shrink-0" />
                <span>Kết nối hồ sơ học viên</span>
              </div>
              <p className="text-[13px] text-slate-700 leading-snug">
                Sau mỗi ván, thời gian chơi được cộng thẳng vào <strong>phút học hôm nay</strong> và giúp bạn lọc ra các từ hay sai để ôn tập lại ngay.
              </p>
              <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-[13px] font-bold text-[#18181B] tabular-nums">
                <span>Đã thuộc hiện tại:</span>
                <span className="text-emerald-700 font-mono">
                  {studentProfile.masteredVocabIds.length} từ
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STATE 2: ACTIVE PLAY VIEW & PAUSED (COMPACT TO FIT 100% IN VIEWPORT) */}
      {/* =================================================================== */}
      {(phase === 'PLAYING' || phase === 'PAUSED') && (
        <div className="space-y-2.5">
          {/* Compact Top HUD */}
          <div className="rounded-2xl bg-white border-2 border-[#E8DFCE] px-3.5 py-2 sm:px-5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3 sm:gap-5">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-[13px] font-bold text-slate-600">Điểm:</span>
                <span className="font-mono text-[16px] font-black text-[#18181B] tabular-nums">
                  {score}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Flame className={`w-4 h-4 ${combo >= 3 ? 'text-red-600' : 'text-amber-500'}`} />
                <span className="text-[13px] font-bold text-slate-600">Combo:</span>
                <span className="font-mono text-[15px] font-black text-red-600 tabular-nums">
                  x{combo}
                </span>
              </div>

              {activeGame === 'rain' ? (
                <>
                  <div className="flex items-center gap-1" aria-label={`Còn ${lives} trên 5 mạng`}>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Heart
                          key={i}
                          className={`w-4 h-4 transition-transform ${
                            i < lives ? 'text-red-600 fill-red-600' : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-[12px] font-bold text-[#18181B] tabular-nums ml-1">
                      {lives}/5
                    </span>
                  </div>

                  <div className="text-[12px] font-bold text-amber-800 font-mono tabular-nums hidden md:block">
                    Cấp {rainWaveLevel}/6 (tối đa {maxConcurrentDrops} từ)
                  </div>
                </>
              ) : (
                <div className="text-[13px] font-bold text-[#18181B] font-mono tabular-nums">
                  Vòng {matchRound}/2
                </div>
              )}

              <div className="flex items-center gap-1 font-mono text-[14px] font-bold text-slate-700 tabular-nums">
                <Clock className="w-4 h-4 text-red-600" />
                <span>{formatDuration(elapsedSec)}</span>
              </div>
            </div>

            {/* HUD Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSoundEnabled((s) => !s)}
                aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
                className="p-1.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF6] hover:border-red-500 text-[#18181B] cursor-pointer"
                title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-red-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>

              {activeGame === 'rain' && (
                <button
                  type="button"
                  onClick={() => setPhase(phase === 'PLAYING' ? 'PAUSED' : 'PLAYING')}
                  className="px-3 py-1.5 rounded-xl border border-[#E8DFCE] bg-[#FDFBF6] hover:border-red-500 font-bold text-[12px] sm:text-[13px] text-[#18181B] flex items-center gap-1 cursor-pointer"
                >
                  {phase === 'PLAYING' ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Tạm dừng</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-red-600" />
                      <span>Tiếp tục</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleEndEarly}
                className="px-3 py-1.5 rounded-xl bg-[#18181B] hover:bg-red-700 text-white font-bold text-[12px] sm:text-[13px] cursor-pointer transition-colors"
              >
                Kết thúc
              </button>
            </div>
          </div>

          {/* -------------------- MƯA TỪ VỰNG 2D ARENA (KÉO DÀI VỪA KHÍT ĐÁY MÀN HÌNH) -------------------- */}
          {activeGame === 'rain' && (
            <div className="space-y-3">
              {/* Sky / Playfield — Stretches to fill remaining viewport height (~520px-640px, 2/3 of original 920px) */}
              <div
                className={`relative w-full ${
                  rainControlMode === 'choice'
                    ? 'h-[calc(100vh-250px)] min-h-[460px] max-h-[620px]'
                    : 'h-[calc(100vh-205px)] min-h-[500px] max-h-[660px]'
                } rounded-2xl overflow-hidden border-2 border-[#18181B] bg-gradient-to-b from-[#18181B] via-[#2B161B] to-[#3B1117] shadow-md select-none`}
              >
                {/* Subtle ambient grid lines */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 20% 20%, rgba(251, 191, 36, 0.35), transparent 40%), radial-gradient(circle at 80% 30%, rgba(220, 38, 38, 0.4), transparent 45%)',
                  }}
                />

                {/* Floating Feedback Pill inside top of Arena so layout never shifts */}
                {feedbackBanner && (
                  <div
                    className={`absolute top-2.5 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1 rounded-full border font-bold text-[12px] flex items-center gap-1.5 shadow-sm max-w-[92%] truncate pointer-events-none ${
                      feedbackBanner.tone === 'hit'
                        ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
                        : 'bg-red-950/90 border-red-400 text-rose-200'
                    }`}
                  >
                    {feedbackBanner.tone === 'hit' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <span className="truncate">{feedbackBanner.text}</span>
                  </div>
                )}

                {/* Danger Bottom Line */}
                <div className="absolute bottom-0 inset-x-0 h-9 bg-gradient-to-t from-red-950/95 via-red-900/50 to-transparent border-t border-dashed border-amber-300/45 flex items-end justify-center pb-1.5 pointer-events-none">
                  <span className="text-[11px] font-bold text-amber-200/85 tracking-wide">
                    Vạch giới hạn — Giải nghĩa trước khi chữ Hán chạm đáy
                  </span>
                </div>

                {/* Falling Word Raindrops */}
                {drops.map((drop) => {
                  const isTarget = targetDrop?.uid === drop.uid;
                  const nearBottom = drop.yPercent > 62;

                  return (
                    <button
                      key={drop.uid}
                      type="button"
                      onClick={() => {
                        setSelectedDropUid(drop.uid);
                        if (autoSpeakOnHit) speakChinese(drop.vocab.word);
                      }}
                      style={{
                        left: `${drop.xPercent}%`,
                        top: `${drop.yPercent}%`,
                        transform: 'translate(-50%, 0)',
                      }}
                      className={`absolute px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex flex-col items-center text-center shadow-md ${
                        isTarget
                          ? 'bg-[#FDFBF6] text-[#18181B] border-2 border-amber-400 ring-3 ring-amber-300/35 z-20'
                          : nearBottom
                          ? 'bg-[#FFF5F3] text-red-900 border-2 border-red-400 z-10'
                          : 'bg-white/95 text-[#18181B] border border-[#E8DFCE] hover:border-amber-400 z-10'
                      }`}
                    >
                      <span className="font-serif text-[21px] sm:text-[24px] font-black leading-none tracking-wide">
                        {drop.vocab.word}
                      </span>
                      {showRainPinyin && (
                        <span className="font-mono text-[11px] font-bold text-red-600 mt-0.5">
                          {drop.vocab.pinyin}
                        </span>
                      )}
                      {isTarget && rainControlMode === 'choice' && (
                        <span className="text-[10px] font-extrabold text-amber-700">
                          Đang chọn
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Paused Overlay */}
                {phase === 'PAUSED' && (
                  <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-4 text-center">
                    <h3 className="font-serif text-[22px] font-black text-white">
                      Trò chơi đang tạm dừng
                    </h3>
                    <button
                      type="button"
                      onClick={() => setPhase('PLAYING')}
                      className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[15px] flex items-center gap-2 cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-white" />
                      <span>Tiếp tục chơi</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Compact Controls Below Sky */}
              {rainControlMode === 'choice' ? (
                <div className="bg-white rounded-2xl border-2 border-[#E8DFCE] p-3.5 space-y-2.5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[14px] font-bold text-[#18181B]">
                      <span>Chọn nghĩa đúng cho từ:</span>
                      {targetDrop ? (
                        <button
                          type="button"
                          onClick={() => speakChinese(targetDrop.vocab.word)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#FFF5F3] border border-red-200 text-red-700 font-serif text-[18px] font-black cursor-pointer hover:bg-red-100"
                          title="Nghe phát âm"
                        >
                          <span>{targetDrop.vocab.word}</span>
                          <Volume2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-slate-500">Đang thả từ tiếp theo...</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowRainPinyin((p) => !p)}
                      className="text-[12px] font-bold text-red-700 hover:underline cursor-pointer"
                    >
                      {showRainPinyin ? 'Ẩn Pinyin' : 'Hiện Pinyin'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {targetChoices.map((choice, idx) => (
                      <button
                        key={choice.id}
                        type="button"
                        disabled={phase !== 'PLAYING' || !targetDrop}
                        onClick={() => handleChoiceSelect(choice)}
                        className="px-3.5 py-2.5 rounded-xl bg-[#FDFBF6] hover:bg-[#FFF5F3] border-2 border-[#E8DFCE] hover:border-red-600 text-left transition-all active:scale-[0.99] cursor-pointer flex items-center gap-2.5 disabled:opacity-50"
                      >
                        <span className="w-7 h-7 rounded-lg bg-[#18181B] text-amber-300 font-mono font-black text-[13px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-[14px] sm:text-[15px] font-bold text-[#18181B] leading-snug">
                          {choice.meaning}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handlePinyinSubmit}
                  className="bg-white rounded-2xl border-2 border-[#E8DFCE] p-3.5 space-y-2 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                    <label htmlFor="rain-pinyin-input" className="font-extrabold text-[#18181B]">
                      Gõ Pinyin của chữ Hán đang rơi (tự động khớp khi gõ đúng):
                    </label>
                    <span className="text-[12px] font-semibold text-slate-500">
                      Ví dụ: <code className="font-mono text-red-600 font-bold">ni hao</code> hoặc{' '}
                      <code className="font-mono text-red-600 font-bold">nihao</code>
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      ref={pinyinInputRef}
                      id="rain-pinyin-input"
                      type="text"
                      value={pinyinInput}
                      onChange={(e) => handlePinyinChange(e.target.value)}
                      disabled={phase !== 'PLAYING'}
                      placeholder="Nhập Pinyin tại đây..."
                      autoComplete="off"
                      className="flex-1 px-4 py-2.5 rounded-xl border-2 border-[#E8DFCE] bg-[#FDFBF6] font-mono text-[15px] font-bold text-[#18181B] focus:outline-none focus:border-red-600"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[14px] cursor-pointer shrink-0"
                    >
                      Bắn từ (Enter)
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* -------------------- GHÉP CẶP HÁN - VIỆT ARENA (THU GỌN VỪA MÀN HÌNH) -------------------- */}
          {activeGame === 'match' && (
            <div className="bg-white rounded-2xl border-2 border-[#E8DFCE] p-4 sm:p-5 space-y-3.5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[14px] sm:text-[15px] font-bold text-[#18181B]">
                  Chạm chọn 1 thẻ <span className="text-red-600">Chữ Hán</span> và 1 thẻ{' '}
                  <span className="text-teal-700">Nghĩa Tiếng Việt</span> tương ứng:
                </p>
                <span className="font-mono text-[13px] font-bold text-slate-600 tabular-nums">
                  Lỗi sai: {matchMistakes}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {matchTiles.map((tile) => {
                  const isSelected = selectedTileUid === tile.uid;
                  const isError = matchErrorUids.includes(tile.uid);

                  return (
                    <button
                      key={tile.uid}
                      type="button"
                      disabled={tile.matched}
                      onClick={() => handleTileClick(tile)}
                      className={`p-4 rounded-2xl border-2 min-h-[105px] sm:min-h-[120px] flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer select-none ${
                        tile.matched
                          ? 'bg-[#ECFDF5] border-emerald-300 opacity-35 scale-95 cursor-default'
                          : isError
                          ? 'bg-red-100 border-red-600 text-red-800 scale-95'
                          : isSelected
                          ? 'bg-[#FFF5F3] border-red-600 ring-3 ring-red-200 -translate-y-0.5 shadow-sm'
                          : tile.type === 'hanzi'
                          ? 'bg-[#FDFBF6] border-[#E8DFCE] hover:border-red-500 hover:-translate-y-0.5'
                          : 'bg-[#F0FDF9] border-teal-200 hover:border-teal-600 hover:-translate-y-0.5'
                      }`}
                    >
                      {tile.type === 'hanzi' ? (
                        <>
                          <span className="font-serif text-[22px] sm:text-[26px] font-black text-[#18181B] leading-tight">
                            {tile.text}
                          </span>
                          {tile.subText && (
                            <span className="font-mono text-[11px] font-bold text-red-600 mt-0.5">
                              {tile.subText}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[14px] font-extrabold text-[#18181B] leading-snug">
                          {tile.text}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* STATE 3: GAME_OVER / SUMMARY + ÔN LẠI TỪ SAI */}
      {/* =================================================================== */}
      {phase === 'GAME_OVER' && (
        <div className="bg-white rounded-3xl border-2 border-[#E8DFCE] p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            {isNewRecord && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-black text-[14px]">
                <Trophy className="w-5 h-5 text-amber-600" />
                <span>Chúc mừng! Kỷ lục cá nhân mới!</span>
              </div>
            )}
            <h2 className="font-serif text-[26px] sm:text-[30px] font-black text-[#18181B]">
              {activeGame === 'rain' ? 'Tổng kết Mưa Từ Vựng 2D' : 'Hoàn thành Ghép Cặp Hán – Việt'}
            </h2>
            <p className="text-[19px] text-slate-600">
              Hệ thống đã ghi nhận thêm thời gian học hôm nay vào hồ sơ của bạn.
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#FFF5F3] border border-red-200 text-center space-y-1">
              <div className="text-[14px] font-bold text-red-700">Tổng điểm</div>
              <div className="font-mono text-[26px] font-black text-[#18181B] tabular-nums">
                {score}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-[#FEFCE8] border border-amber-200 text-center space-y-1">
              <div className="text-[14px] font-bold text-amber-800">Combo cao nhất</div>
              <div className="font-mono text-[26px] font-black text-[#18181B] tabular-nums">
                x{maxCombo}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-[#ECFDF5] border border-emerald-200 text-center space-y-1">
              <div className="text-[14px] font-bold text-emerald-800">Từ trả lời đúng</div>
              <div className="font-mono text-[26px] font-black text-[#18181B] tabular-nums">
                {correctWords.length}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#E8DFCE] text-center space-y-1">
              <div className="text-[14px] font-bold text-slate-700">Thời gian chơi</div>
              <div className="font-mono text-[26px] font-black text-[#18181B] tabular-nums">
                {formatDuration(elapsedSec)}
              </div>
            </div>
          </div>

          {/* Sync Status & Wrong Words Review */}
          {!autoSyncProgress && !progressSyncedForRound && (correctWords.length > 0 || missedWords.length > 0) && (
            <div className="p-4 rounded-2xl bg-[#FEFCE8] border border-amber-200 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[16px] font-bold text-[#18181B]">
                Lưu {correctWords.length} từ đúng vào "Đã thuộc" và {missedWords.length} từ sai vào "Cần ôn"?
              </span>
              <button
                type="button"
                onClick={handleManualSyncVocab}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[14px] cursor-pointer"
              >
                Lưu vào hồ sơ ngay
              </button>
            </div>
          )}

          {missedWords.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-serif text-[21px] font-black text-[#18181B]">
                Từ cần ôn lại ({missedWords.length} từ)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {missedWords.map((w) => (
                  <div
                    key={w.id}
                    className="p-4 rounded-2xl bg-[#FFF5F3] border border-red-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-baseline gap-2.5">
                        <span className="font-serif text-[24px] font-black text-[#18181B]">
                          {w.word}
                        </span>
                        <span className="font-mono text-[16px] font-bold text-red-600">
                          {w.pinyin}
                        </span>
                      </div>
                      <div className="text-[16px] font-semibold text-slate-700">{w.meaning}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => speakChinese(w.word)}
                      aria-label={`Nghe phát âm ${w.word}`}
                      className="p-3 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white cursor-pointer transition-colors shrink-0"
                    >
                      <Volume2 className="w-6 h-6" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-[#EFE7D6]">
            <button
              type="button"
              onClick={() => {
                if (activeGame === 'rain') startRainGame();
                else setupMatchBoard(1, true);
              }}
              className="px-7 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-[16px] flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Chơi lại ngay</span>
            </button>

            <button
              type="button"
              onClick={() => setPhase('TITLE_MENU')}
              className="px-7 py-3.5 rounded-2xl bg-[#FAF7F0] hover:bg-[#EFE7D6] border border-[#E8DFCE] text-[#18181B] font-bold text-[16px] flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Đổi chế độ / Kho từ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

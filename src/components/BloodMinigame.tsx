import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BloodMinigameProps {
  onComplete: (bloodBonus: number) => void;
}

type Phase = 'intro' | 'biting' | 'result';

const MAX_BLOOD = 300;
const BITE_WINDOW_MS = 800; // perfect zone duration
const TOTAL_PULSES = 3;

export const BloodMinigame: React.FC<BloodMinigameProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>('biting');
  const [pulseIndex, setPulseIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [lastHitLabel, setLastHitLabel] = useState<string | null>(null);
  const [indicator, setIndicator] = useState(0); // 0–100 sliding indicator position
  const [direction, setDirection] = useState(1);
  const [biteActive, setBiteActive] = useState(false);
  const [showBlood, setShowBlood] = useState(false);
  const [resultScore, setResultScore] = useState(0);
  const indicatorRef = useRef(0);
  const dirRef = useRef(1);
  const rafRef = useRef<number>(0);
  const speedRef = useRef(1.2); // Faster initial speed
  const doneRef = useRef(false);

  // Zones on the indicator (0–100): sweet spot centered, danger zones outer
  // Perfect: 40–60, Good: 25–75, Miss: outside
  const getZone = (pos: number) => {
    if (pos >= 42 && pos <= 58) return { label: 'PERFECT BITE', score: 100, color: '#dc2626' };
    if (pos >= 28 && pos <= 72) return { label: 'GOOD', score: 60, color: '#f97316' };
    if (pos >= 15 && pos <= 85) return { label: 'WEAK', score: 25, color: '#ca8a04' };
    return { label: 'MISS!', score: 0, color: '#6b7280' };
  };

  const startBiting = useCallback(() => {
    setPhase('biting');
    setPulseIndex(0);
    setScores([]);
    speedRef.current = 1.2;
    doneRef.current = false;
  }, []);

  // Animate indicator
  useEffect(() => {
    if (phase !== 'biting') return;

    const animate = () => {
      indicatorRef.current += dirRef.current * speedRef.current;
      if (indicatorRef.current >= 100) { indicatorRef.current = 100; dirRef.current = -1; }
      if (indicatorRef.current <= 0) { indicatorRef.current = 0; dirRef.current = 1; }
      setIndicator(indicatorRef.current);
      setDirection(dirRef.current);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  const handleBite = useCallback(() => {
    if (phase !== 'biting' || biteActive || doneRef.current) return;

    const pos = indicatorRef.current;
    const zone = getZone(pos);

    setBiteActive(true);
    setLastHitLabel(zone.label);
    setShowBlood(zone.score > 0);

    // Flash blood drops briefly
    setTimeout(() => {
      setShowBlood(false);
      setBiteActive(false);

      const newScores = [...scores, zone.score];
      setScores(newScores);

      if (newScores.length >= TOTAL_PULSES) {
        doneRef.current = true;
        const total = newScores.reduce((a, b) => a + b, 0);
        // Scale to MAX_BLOOD
        const bloodBonus = Math.round((total / (TOTAL_PULSES * 100)) * MAX_BLOOD);
        setResultScore(bloodBonus);
        setPhase('result');
        cancelAnimationFrame(rafRef.current);

        // Gamer friendly auto-advance: Finish after 1.5s
        setTimeout(() => {
          onComplete(bloodBonus);
        }, 1500);
      } else {
        // Next pulse — faster
        speedRef.current = Math.min(2.5, speedRef.current + 0.4);
        setPulseIndex(newScores.length);
        setLastHitLabel(null);
      }
    }, 250);
  }, [phase, biteActive, scores]);

  // Keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'KeyZ' || e.code === 'Enter') {
        e.preventDefault();
        if (phase === 'biting') {
          handleBite();
        } else if (phase === 'result') {
          onComplete(resultScore);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleBite, phase, onComplete, resultScore]);

  const getRating = (bonus: number) => {
    if (bonus >= 270) return { label: 'SATED', color: '#dc2626', sub: 'Pure crimson ecstasy' };
    if (bonus >= 180) return { label: 'BLOODTHIRSTY', color: '#f97316', sub: 'A fine vintage' };
    if (bonus >= 90)  return { label: 'HUNGRY', color: '#ca8a04', sub: 'Enough to carry on' };
    return { label: 'STARVING', color: '#6b7280', sub: 'The maiden fought back' };
  };

  return (
    <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-none">
      {/* Blood drip atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute top-0 w-[2px] rounded-b-full"
            style={{
              left: `${8 + i * 12}%`,
              height: `${20 + (i % 4) * 15}%`,
              background: 'linear-gradient(to bottom, #7f1d1d, #991b1b)',
              opacity: 0.4 + (i % 3) * 0.15,
              animationDelay: `${i * 0.3}s`
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* BITING PHASE */}
        {phase === 'biting' && (
          <motion.div
            key="biting"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-black/60 border border-red-900/30 backdrop-blur-md shadow-2xl pointer-events-auto w-48"
          >
            {/* Pulse counter */}
            <div className="flex gap-1">
              {[...Array(TOTAL_PULSES)].map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border flex items-center justify-center text-[8px] font-bold transition-all ${
                    i < scores.length
                      ? 'bg-red-700 border-red-500 text-white'
                      : i === pulseIndex
                      ? 'border-red-400 bg-red-900/40 animate-pulse'
                      : 'border-zinc-700 bg-zinc-900'
                  }`}
                >
                  {i < scores.length ? (scores[i] >= 100 ? '✓' : scores[i] >= 60 ? '·' : '×') : i === pulseIndex ? '♥' : ''}
                </div>
              ))}
            </div>

            {/* Neck target - tiny */}
            <div
              className="relative cursor-pointer select-none"
              onClick={handleBite}
            >
              <svg width="80" height="60" viewBox="0 0 200 150" style={{ filter: showBlood ? 'drop-shadow(0 0 16px #dc2626)' : 'none', transition: 'filter 0.2s' }}>
                {/* Neck */}
                <rect x="70" y="20" width="60" height="110" rx="14" fill="#c8a07a" />
                {/* Shoulder hint */}
                <ellipse cx="100" cy="140" rx="60" ry="20" fill="#9b6b45" />
                {/* Collar */}
                <path d="M60 120 Q100 105 140 120 L148 150 L52 150 Z" fill="#d4c0e8" />

                {/* Heartbeat line */}
                <polyline
                  points={`70,75 80,75 85,55 90,95 95,75 110,75 115,60 120,90 125,75 130,75`}
                  fill="none"
                  stroke="#7f1d1d"
                  strokeWidth="2"
                  opacity={biteActive ? 0.2 : 0.6}
                  style={{ transition: 'opacity 0.2s' }}
                />

                {/* Blood drip if hit */}
                {showBlood && (
                  <>
                    <circle cx="88" cy="75" r="5" fill="#dc2626" opacity="0.9" />
                    <circle cx="112" cy="75" r="5" fill="#dc2626" opacity="0.9" />
                    <path d="M88 80 Q86 96 88 104" stroke="#dc2626" strokeWidth="3" fill="none" strokeLinecap="round" />
                    <path d="M112 80 Q114 96 112 104" stroke="#dc2626" strokeWidth="3" fill="none" strokeLinecap="round" />
                  </>
                )}

                {/* Fang marks */}
                {scores.length > 0 && (
                  <>
                    {scores.map((_, i) => (
                      <g key={i} opacity={0.4 + (scores[i] / 100) * 0.4}>
                        <circle cx={88 + (i % 3) * 4} cy={75 + Math.floor(i / 3) * 6} r={1.5} fill="#7f1d1d" />
                        <circle cx={112 + (i % 3) * 4} cy={75 + Math.floor(i / 3) * 6} r={1.5} fill="#7f1d1d" />
                      </g>
                    ))}
                  </>
                )}
              </svg>

              {/* Hit label */}
              <AnimatePresence>
                {lastHitLabel && (
                  <motion.div
                    key={lastHitLabel + pulseIndex}
                    initial={{ y: 0, opacity: 1, scale: 1 }}
                    animate={{ y: -15, opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest pointer-events-none"
                    style={{ color: getZone(indicatorRef.current).color }}
                  >
                    {lastHitLabel}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sliding indicator */}
            <div className="w-full space-y-1">
              <div className="relative h-4 bg-zinc-900/80 rounded-full overflow-hidden border border-zinc-700">
                {/* Zone colors */}
                <div className="absolute inset-y-0 left-[15%] right-[15%] bg-yellow-900/30 rounded" />
                <div className="absolute inset-y-0 left-[28%] right-[28%] bg-orange-900/40 rounded" />
                <div className="absolute inset-y-0 left-[42%] right-[42%] bg-red-700/50 rounded" />
                {/* Zone labels */}
                <div className="absolute inset-0 flex items-center justify-center text-[7px] text-red-400 font-bold uppercase tracking-wider pointer-events-none z-10">
                  ♥ Perfect ♥
                </div>

                {/* Moving indicator */}
                <motion.div
                  className="absolute top-0.5 bottom-0.5 w-2 rounded-full bg-white shadow-lg"
                  style={{ left: `calc(${indicator}% - 4px)` }}
                />
              </div>

              {/* Score preview */}
              <div className="flex justify-between text-[8px] text-zinc-600 uppercase tracking-widest">
                <span>Miss</span>
                <span className="text-yellow-600">Weak</span>
                <span className="text-orange-500">Good</span>
                <span className="text-red-500">Perfect</span>
                <span className="text-orange-500">Good</span>
                <span className="text-yellow-600">Weak</span>
                <span>Miss</span>
              </div>
            </div>

            <p className="text-zinc-500 text-[8px] uppercase tracking-widest font-bold">
              Space / Tap
            </p>
          </motion.div>
        )}

        {/* RESULT */}
        {phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2 text-center p-4 rounded-xl bg-black/60 border border-red-900/30 backdrop-blur-md shadow-2xl pointer-events-auto"
          >
            {/* Blood pool */}
            <div className="relative">
              <svg width="120" height="80" viewBox="0 0 120 80">
                <ellipse cx="60" cy="60" rx="55" ry="18" fill="#7f1d1d" opacity="0.8" />
                <ellipse cx="60" cy="58" rx="42" ry="13" fill="#991b1b" />
                <ellipse cx="60" cy="56" rx="28" ry="8" fill="#dc2626" opacity="0.6" />
                {/* Droplets */}
                <circle cx="30" cy="45" r="6" fill="#991b1b" />
                <circle cx="90" cy="42" r="4" fill="#991b1b" />
                <circle cx="60" cy="30" r="8" fill="#dc2626" opacity="0.8" />
                <path d="M60 10 Q55 20 60 30 Q65 20 60 10 Z" fill="#dc2626" />
              </svg>
            </div>

            <div className="space-y-0">
              <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Blood Harvested</p>
              <div className="text-3xl font-bold tracking-tighter" style={{ color: getRating(resultScore).color }}>
                +{resultScore}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: getRating(resultScore).color }}>
                {getRating(resultScore).label}
              </p>
              <p className="text-xs text-zinc-500 italic">{getRating(resultScore).sub}</p>
            </div>

            {/* Per-bite breakdown */}
            <div className="flex gap-3">
              {scores.map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border"
                    style={{
                      background: s >= 100 ? '#7f1d1d' : s >= 60 ? '#78350f' : s >= 25 ? '#713f12' : '#27272a',
                      borderColor: s >= 100 ? '#dc2626' : s >= 60 ? '#f97316' : s >= 25 ? '#ca8a04' : '#52525b',
                      color: '#fff'
                    }}
                  >
                    {s}
                  </div>
                  <span className="text-[9px] text-zinc-600 uppercase">bite {i + 1}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onComplete(resultScore)}
              className="px-6 py-2 bg-red-900 hover:bg-red-800 text-white font-bold text-[10px] uppercase tracking-widest rounded-full transition-all border border-red-700 shadow-lg"
            >
              Continue
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

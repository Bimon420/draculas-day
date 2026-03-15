import React from 'react';
import { Player, GameState } from '../game/types';
import { MOONLIGHT_MAX } from '../game/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Moon, Trophy, Play, RefreshCw, Skull, LogIn, Zap, Volume2, Sun } from 'lucide-react';
import { DASH_COOLDOWN, SCREECH_COOLDOWN, SCREECH_COST, DASH_COST } from '../game/constants';

interface GameUIProps {
  player: Player;
  gameState: GameState;
  score: number;
  highScores: any[];
  nightTimer: number;
  isAuthenticated: boolean;
  onStart: () => void;
  onReset: () => void;
  onLogin: () => void;
}

export const GameUI: React.FC<GameUIProps> = ({ 
  player, gameState, score, highScores, nightTimer,
  isAuthenticated, onStart, onReset, onLogin 
}) => {
  const dashReady = Date.now() - player.lastDash > DASH_COOLDOWN;
  const screechReady = Date.now() - player.lastScreech > SCREECH_COOLDOWN;
  const canScreech = player.bloodStorage >= SCREECH_COST || player.moonlight >= 20;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col p-6 z-20">
      {/* HUD Top */}
      <div className="flex justify-between items-start">
        <div className="space-y-4">
          {/* Dawn Timer */}
          <div className="flex flex-col gap-1">
            <div className={`flex items-center gap-2 font-display font-bold ${nightTimer < 15 ? 'text-orange-500 animate-pulse' : 'text-yellow-200/80'}`}>
              <Sun size={18} />
              <span>DAWN IS COMING: {formatTime(nightTimer)}</span>
            </div>
            <div className="w-48 h-1 bg-secondary rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-yellow-500"
                animate={{ width: `${(nightTimer / 60) * 100}%` }}
              />
            </div>
          </div>

          {/* Moonlight Essence */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-primary font-display font-bold">
              <Moon size={18} />
              <span>MOONLIGHT ESSENCE</span>
            </div>
            <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden border border-white/5 shadow-inner">
              <motion.div 
                className="h-full bg-primary crimson-glow"
                initial={{ width: '100%' }}
                animate={{ width: `${(player.moonlight / MOONLIGHT_MAX) * 100}%` }}
              />
            </div>
          </div>

          {/* Health */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-foreground/80 font-display font-bold">
              <Heart size={18} />
              <span>BLOOD RESERVE</span>
            </div>
            <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden border border-white/5 shadow-inner">
              <motion.div 
                className="h-full bg-foreground/60"
                initial={{ width: '100%' }}
                animate={{ width: `${player.health}%` }}
              />
            </div>
          </div>

          {/* Blood Storage */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-primary font-display font-bold">
              <Skull size={18} className="text-primary" />
              <span>BLOOD STORAGE</span>
            </div>
            <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden border border-white/5 shadow-inner">
              <motion.div 
                className="h-full bg-red-600 shadow-[0_0_10px_#dc2626]"
                animate={{ width: `${(player.bloodStorage / player.maxBloodStorage) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-display font-bold uppercase tracking-widest">
              Deliver to Castle to prolong the Night
            </span>
          </div>
        </div>

        {/* Score & Abilities */}
        <div className="flex flex-col items-end gap-4">
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-foreground font-display font-bold text-2xl tracking-widest">
              <Trophy className="text-primary" size={24} />
              <span>{score.toString().padStart(6, '0')}</span>
            </div>
            <span className="text-xs text-muted-foreground font-display font-bold uppercase tracking-widest">Score</span>
          </div>

          {/* Abilities */}
          <div className="flex gap-2">
            <div className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${dashReady ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-black/40 border-white/5 text-muted-foreground'}`}>
              <Zap size={16} />
              <span className="text-[8px] font-bold">SPACE</span>
              <div className="w-8 h-0.5 bg-secondary overflow-hidden">
                {!dashReady && <motion.div className="h-full bg-primary" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: DASH_COOLDOWN/1000 }} />}
              </div>
            </div>
            <div className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${screechReady && canScreech ? 'bg-red-900/20 border-red-500/40 text-red-500' : 'bg-black/40 border-white/5 text-muted-foreground'}`}>
              <Volume2 size={16} />
              <span className="text-[8px] font-bold">SHIFT</span>
              <div className="w-8 h-0.5 bg-secondary overflow-hidden">
                {!screechReady && <motion.div className="h-full bg-red-500" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: SCREECH_COOLDOWN/1000 }} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center Messages */}
      <AnimatePresence>
        {gameState === 'start' && (
          <motion.div 
            className="flex-1 flex flex-col items-center justify-center gap-8 pointer-events-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
          >
            <div className="text-center space-y-2">
              <h1 className="text-7xl font-bold tracking-tighter text-primary crimson-glow uppercase italic">
                Vampire Hunt
              </h1>
              <p className="text-muted-foreground uppercase tracking-[0.4em] font-display font-bold text-xs">
                Haunt the Maidens • Evade the Mob
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <button 
                onClick={onStart}
                className="group flex items-center gap-4 px-10 py-4 bg-primary text-white rounded-full font-display font-bold text-xl uppercase tracking-widest hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-xl"
              >
                <Play fill="white" size={20} />
                Start The Night
              </button>

              {!isAuthenticated && (
                <button 
                  onClick={onLogin}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors uppercase font-display font-bold tracking-widest"
                >
                  <LogIn size={14} />
                  Login to Save Scores
                </button>
              )}
            </div>

            {/* High Scores */}
            {highScores.length > 0 && (
              <div className="mt-4 w-64 bg-secondary/30 backdrop-blur-sm p-4 rounded-xl border border-white/5 space-y-2">
                <h3 className="text-xs font-display font-bold text-primary uppercase tracking-[0.2em] text-center">
                  Legendary Haunts
                </h3>
                <div className="space-y-1">
                  {highScores.map((s, i) => (
                    <div key={s.id} className="flex justify-between text-[10px] font-display font-bold uppercase">
                      <span className="text-muted-foreground">{i + 1}. {s.playerName}</span>
                      <span className="text-foreground">{s.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="max-w-md text-center text-[10px] text-muted-foreground/60 leading-relaxed font-display font-bold uppercase tracking-wider space-y-2">
              <p>WASD / Arrow keys to fly through the night</p>
              <p>SPACE: Shadow Dash • SHIFT / Q: Blood Screech (Stuns mobs)</p>
              <p>Lure maidens out from balconies • Feed before the sun rises</p>
              <p>ESC during feeding: Abort and return to bat form</p>
              <p>Return to Castle to bank blood and rejuvenate the night</p>
            </div>
          </motion.div>
        )}

        {/* Gameover */}
        {gameState === 'gameover' && (
          <motion.div 
            className="flex-1 flex flex-col items-center justify-center gap-8 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center space-y-2">
              {nightTimer <= 0 ? (
                <Sun className="mx-auto text-orange-500 animate-bounce" size={64} />
              ) : (
                <Skull className="mx-auto text-primary animate-pulse" size={64} />
              )}
              <h2 className="text-5xl font-bold tracking-tighter text-foreground uppercase">
                {nightTimer <= 0 ? 'Dawn Has Risen' : 'Night Consumed'}
              </h2>
              <p className="text-primary font-display font-bold uppercase tracking-widest text-2xl">
                SCORE: {score}
              </p>
            </div>
            
            <button 
              onClick={onReset}
              className="flex items-center gap-3 px-8 py-3 bg-secondary border border-white/10 text-white rounded-full font-display font-bold text-lg uppercase tracking-widest hover:bg-secondary/80 transition-all hover:scale-105 active:scale-95"
            >
              <RefreshCw size={20} />
              Rise Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status HUD Bottom */}
      <div className="mt-auto flex justify-center">
        <AnimatePresence>
          {player.form === 'vampire' && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-primary px-6 py-3 rounded-full font-display font-bold uppercase tracking-widest text-sm shadow-2xl flex flex-col items-center gap-1 border border-white/20"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span>TRANSFORMED — FEASTING IN PROGRESS</span>
              </div>
              <span className="text-[10px] text-white/60">PRESS ESC TO ABORT</span>
            </motion.div>
          )}
          {gameState === 'playing' && !player.carryingMaiden && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] text-muted-foreground/40 font-display font-bold uppercase tracking-widest"
            >
              Hover near a house balcony to lure the maiden out
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { useGame } from './game/engine';
import { GameCanvas } from './components/GameCanvas';
import { GameUI } from './components/GameUI';
import { BloodMinigame } from './components/BloodMinigame';
import { TouchControls } from './components/TouchControls';
import { useAuth } from './hooks/useAuth';
import { useAudio } from './hooks/useAudio';

const App: React.FC = () => {
  const { user, isAuthenticated, isLoading, login } = useAuth();

  const { 
    gameState, setGameState,
    player, maidens, villagers, projectiles, effects,
    camera, score, highScores, nightTimer,
    resetGame, onBloodMinigameComplete,
    keysRef
  } = useGame(user, isLoading);

  // Detect touch device for showing on-screen controls
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    const check = () => setIsTouchDevice(
      window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
    );
    check();
  }, []);

  // Scale the game canvas to fit the viewport
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const resize = () => {
      const W = 800;
      const H = 600;
      const pad = isTouchDevice ? 0 : 32;
      const scaleX = (window.innerWidth - pad) / W;
      const scaleY = (window.innerHeight - pad) / H;
      setScale(Math.min(scaleX, scaleY, 1));
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [isTouchDevice]);

  // Prevent iOS rubber-band scroll / bounce while playing
  useEffect(() => {
    const prevent = (e: TouchEvent) => e.preventDefault();
    document.addEventListener('touchmove', prevent, { passive: false });
    return () => document.removeEventListener('touchmove', prevent);
  }, []);

  // Music: title track on start/gameover, gameplay track during play
  const activeTrack =
    (gameState === 'playing' || gameState === 'bloodminigame') ? 'gameplay' :
    (gameState === 'start' || gameState === 'gameover') ? 'title' : 'none';
  useAudio(activeTrack);

  const handleStart = () => resetGame();
  const handleReset = () => resetGame();
  const handleLogin = () => login();

  return (
    <div
      className="flex h-screen w-full items-center justify-center bg-[#020202] overflow-hidden relative font-sans"
      style={{ padding: isTouchDevice ? 0 : '1rem' }}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(153,27,27,0.05),transparent_70%)] pointer-events-none" />

      {/* Scalable game wrapper */}
      <div
        ref={containerRef}
        className="relative overflow-hidden shadow-[0_0_100px_rgba(153,27,27,0.2)] border border-white/5 bg-black"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          width: 800,
          height: 600,
          flexShrink: 0,
          borderRadius: isTouchDevice ? 0 : '0.75rem',
        }}
      >
        {/* Game Canvas — always rendered */}
        <GameCanvas
          player={player}
          maidens={maidens}
          villagers={villagers}
          projectiles={projectiles}
          effects={effects}
          camera={camera}
        />

        {/* HUD & Overlays */}
        <GameUI
          player={player}
          gameState={gameState}
          score={score}
          highScores={highScores}
          nightTimer={nightTimer}
          isAuthenticated={isAuthenticated}
          onStart={handleStart}
          onReset={handleReset}
          onLogin={handleLogin}
        />

        {/* Blood Minigame — shown when maiden delivered to castle */}
        {gameState === 'bloodminigame' && (
          <BloodMinigame onComplete={onBloodMinigameComplete} />
        )}

        {/* Touch controls overlay — only on touch devices */}
        {isTouchDevice && (
          <TouchControls keysRef={keysRef} gameState={gameState} />
        )}

        {/* Atmospheric vignette */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] z-10" />
      </div>

      {/* Decorative ambient glows (desktop only) */}
      {!isTouchDevice && (
        <>
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-red-900/5 rounded-full blur-[80px]" />
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/3 rounded-full blur-[80px]" />
        </>
      )}
    </div>
  );
};

export default App;

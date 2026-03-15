import React from 'react';
import { useGame } from './game/engine';
import { GameCanvas } from './components/GameCanvas';
import { GameUI } from './components/GameUI';
import { BloodMinigame } from './components/BloodMinigame';
import { useAuth } from './hooks/useAuth';
import { useAudio } from './hooks/useAudio';

const App: React.FC = () => {
  const { user, isAuthenticated, isLoading, login } = useAuth();

  const { 
    gameState, setGameState,
    player, maidens, villagers, projectiles, effects,
    camera, score, highScores, nightTimer,
    resetGame, onBloodMinigameComplete
  } = useGame(user, isLoading);

  // Music: title track on start/gameover, gameplay track during play
  const activeTrack =
    (gameState === 'playing' || gameState === 'bloodminigame') ? 'gameplay' :
    (gameState === 'start' || gameState === 'gameover') ? 'title' : 'none';
  useAudio(activeTrack);

  const handleStart = () => resetGame();
  const handleReset = () => resetGame();
  const handleLogin = () => login();

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#020202] overflow-hidden p-4 relative font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(153,27,27,0.05),transparent_70%)] pointer-events-none" />
      
      <div className="relative rounded-xl overflow-hidden shadow-[0_0_100px_rgba(153,27,27,0.2)] border border-white/5 bg-black">
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

        {/* Atmospheric vignette */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] z-10" />
      </div>

      {/* Decorative ambient glows */}
      <div className="absolute bottom-10 left-10 w-32 h-32 bg-red-900/5 rounded-full blur-[80px]" />
      <div className="absolute top-10 right-10 w-32 h-32 bg-white/3 rounded-full blur-[80px]" />
    </div>
  );
};

export default App;
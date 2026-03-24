import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  GAME_WIDTH, GAME_HEIGHT, WORLD_WIDTH, 
  GRAVITY, FRICTION, THRUST, 
  MAX_SPEED, MOONLIGHT_MAX, MOONLIGHT_DECAY,
  MAIDEN_SPAWN_COUNT, HOUSE_POSITIONS, LURE_DISTANCE,
  SCORE_MAIDEN_DELIVERED,
  ARCHER_RANGE, SPEAR_RANGE, ATTACK_COOLDOWN,
  ARROW_SPEED, SPEAR_SPEED, PROJECTILE_DAMAGE, VILLAGER_SPEED,
  INITIAL_NIGHT_TIMER, DASH_COOLDOWN, DASH_COST, DASH_STRENGTH,
  SCREECH_COOLDOWN, SCREECH_COST, SCREECH_RADIUS, BLOOD_TO_TIME_RATIO,
  BALCONY_Y, HOUSE_WIDTH, HOUSE_HEIGHT
} from './constants';
import { Player, Maiden, Villager, Projectile, GameState, Camera, VillagerType, Effect } from './types';
import { blink } from '../blink/client';
import type { BlinkUser } from '@blinkdotnew/sdk';

const INITIAL_PLAYER: Player = {
  id: 'player',
  pos: { x: 100, y: 400 },
  vel: { x: 0, y: 0 },
  width: 32,
  height: 24,
  rotation: 0,
  moonlight: MOONLIGHT_MAX,
  health: 100,
  carryingMaiden: false,
  score: 0,
  lastScreech: 0,
  type: 'player',
  form: 'bat',
  transformationTimer: 0,
  bloodStorage: 0,
  maxBloodStorage: 1000,
  lastDash: 0
};

const INITIAL_CAMERA: Camera = { x: 0, y: 0, zoom: 1 };

function buildMaidens(): Maiden[] {
  return HOUSE_POSITIONS.map((houseX, i) => ({
    id: `maiden-${i}`,
    pos: { x: houseX + 40, y: BALCONY_Y - 16 }, // On the balcony floor
    vel: { x: 0, y: 0 },
    width: 24,
    height: 32,
    isCaptured: false,
    isInside: true,
    houseX,
    spawnPoint: { x: houseX + 40, y: BALCONY_Y - 16 },
    type: 'maiden'
  }));
}

function buildVillagers(): Villager[] {
  const types: VillagerType[] = ['peasant', 'archer', 'spearman'];
  return Array.from({ length: 12 }, (_, i) => {
    const x = 800 + i * 350;
    const vType = i === 0 ? 'peasant' : types[Math.floor(Math.random() * types.length)];
    return {
      id: `villager-${i}`,
      villagerType: vType,
      pos: { x, y: GAME_HEIGHT - 92 },
      vel: { x: 0, y: 0 },
      width: 28,
      height: 32,
      patrolRange: 200 + Math.random() * 200,
      direction: (i % 2 === 0 ? 1 : -1) as 1 | -1,
      lastAttack: 0,
      isStunned: false,
      stunTimer: 0,
      spawnPoint: { x, y: GAME_HEIGHT - 92 },
      type: 'villager'
    };
  });
}

export const useGame = (user: BlinkUser | null, authLoading = false) => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [player, setPlayer] = useState<Player>(INITIAL_PLAYER);
  const [maidens, setMaidens] = useState<Maiden[]>([]);
  const [villagers, setVillagers] = useState<Villager[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [camera, setCamera] = useState<Camera>(INITIAL_CAMERA);
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState<any[]>([]);
  const [effects, setEffects] = useState<Effect[]>([]);
  const [nightTimer, setNightTimer] = useState(INITIAL_NIGHT_TIMER);
  const nightTimerRef = useRef(INITIAL_NIGHT_TIMER);
  // Pending blood score from minigame
  const [pendingBloodScore, setPendingBloodScore] = useState(0);

  const cameraRef = useRef<Camera>(INITIAL_CAMERA);
  const requestRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  // Ref to track if gameover already triggered this session
  const gameoverFiredRef = useRef(false);
  // Pending stun from screech — applied in the villager update loop


  const fetchHighScores = useCallback(async () => {
    if (!user || authLoading) return;
    try {
      // Ensure we have a valid token before querying
      const token = await blink.auth.getValidToken();
      if (!token) return;
      const scores = await blink.db.highScores.list({
        orderBy: { score: 'desc' },
        limit: 5
      });
      setHighScores(scores);
    } catch (_) {
      // Silently ignore auth/network errors for high scores
    }
  }, [user, authLoading]);

  const saveScore = useCallback(async (finalScore: number) => {
    if (!user || finalScore === 0) return;
    try {
      const token = await blink.auth.getValidToken();
      if (!token) return;
      await blink.db.highScores.create({
        userId: user.id,
        score: finalScore,
        playerName: user.displayName || 'Anonymous Vampire'
      });
      fetchHighScores();
    } catch (_) {
      // Silently ignore auth/network errors for score saving
    }
  }, [fetchHighScores, user]);

  // Initialization
  const resetGame = useCallback(() => {
    gameoverFiredRef.current = false;
    setPlayer(INITIAL_PLAYER);
    setScore(0);
    setGameState('playing');
    setProjectiles([]);
    setEffects([]);
    setNightTimer(INITIAL_NIGHT_TIMER);
    nightTimerRef.current = INITIAL_NIGHT_TIMER;
    setCamera(INITIAL_CAMERA);
    cameraRef.current = INITIAL_CAMERA;
    setPendingBloodScore(0);
    setMaidens(buildMaidens());
    setVillagers(buildVillagers());
  }, []);

  // Called when blood minigame completes — apply blood to storage
  const onBloodMinigameComplete = useCallback((bloodBonus: number) => {
    const totalCollected = SCORE_MAIDEN_DELIVERED + bloodBonus;
    
    // Transform back to bat and reward
    setPlayer(p => ({ 
      ...p, 
      bloodStorage: Math.min(p.maxBloodStorage, p.bloodStorage + totalCollected),
      moonlight: Math.min(MOONLIGHT_MAX, p.moonlight + 30),
      health: Math.min(100, p.health + 20),
      form: 'bat',
      carryingMaiden: false,
      transformationTimer: 30 // Shorter smoke effect duration
    }));
    setGameState('playing');
  }, []);

  // Update logic — all state reads via refs for stable callback
  const playerRef = useRef<Player>(INITIAL_PLAYER);
  const scoreRef = useRef(0);
  const gameStateRef = useRef<GameState>('start');
  const lastTimeRef = useRef<number>(0);
  const villagersRef = useRef<Villager[]>([]);

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { cameraRef.current = camera; }, [camera]);
  useEffect(() => { villagersRef.current = villagers; }, [villagers]);

  const update = useCallback((time: number) => {
    if (gameStateRef.current !== 'playing' && gameStateRef.current !== 'bloodminigame') return;

    if (!lastTimeRef.current) {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(update);
      return;
    }
    const deltaTime = Math.min(time - lastTimeRef.current, 50); // cap at 50ms to avoid timer skip
    lastTimeRef.current = time;

    const keys = keysRef.current;
    const prev = playerRef.current;
    const next = {
      ...prev,
      pos: { ...prev.pos },
      vel: { ...prev.vel }
    };

    const isLocked = gameStateRef.current === 'bloodminigame' || next.transformationTimer > 0;

    // ESC to cancel feeding
    if (gameStateRef.current === 'bloodminigame' && keys.has('Escape')) {
      setGameState('playing');
      setPlayer(p => ({
        ...p,
        form: 'bat',
        carryingMaiden: false,
        transformationTimer: 15 // Snappier escape
      }));
      return;
    }

    // Transformation freeze (smoke effect)
    if (next.transformationTimer > 0) {
      next.transformationTimer -= 1;
      next.vel.x = 0;
      next.vel.y = 0;
    } else if (gameStateRef.current === 'bloodminigame') {
      // While sucking, vampire is stationary
      next.vel.x = 0;
      next.vel.y = 0;
    } else {
      // Controls
      const onGround = next.pos.y >= GAME_HEIGHT - 62;
      if (keys.has('ArrowUp') || keys.has('w')) {
        if (onGround) {
          // Launch boost from ground — guaranteed takeoff
          next.vel.y = -4;
        } else {
          next.vel.y -= THRUST;
        }
        next.moonlight -= MOONLIGHT_DECAY;
      }
      if (keys.has('ArrowDown') || keys.has('s')) next.vel.y += THRUST * 0.5;
      if (keys.has('ArrowLeft') || keys.has('a')) next.vel.x -= THRUST;
      if (keys.has('ArrowRight') || keys.has('d')) next.vel.x += THRUST;
    }

    // Physics - only apply when not feeding or transforming
    if (!isLocked) {
      next.vel.y += GRAVITY;
      next.vel.x *= FRICTION;
      next.vel.y *= FRICTION;

      // Speed limits
      next.vel.x = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, next.vel.x));
      next.vel.y = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, next.vel.y));

      next.pos.x += next.vel.x;
      next.pos.y += next.vel.y;
    }

    // Boundaries
    if (next.pos.x < 0) next.pos.x = 0;
    if (next.pos.x > WORLD_WIDTH) next.pos.x = WORLD_WIDTH;
    // Ceiling: clamp, force downward velocity and consume up-keys so bat can't stick
    if (next.pos.y < 20) {
      next.pos.y = 20;
      next.vel.y = 2; // Always push back down, unconditionally
      keys.delete('ArrowUp');
      keys.delete('w');
      keys.delete('W');
    }
    // Ground: land, stop and consume down-keys so bat can't stick
    if (next.pos.y > GAME_HEIGHT - 60) {
      next.pos.y = GAME_HEIGHT - 60;
      next.vel.y = 0;
      keys.delete('ArrowDown');
      keys.delete('s');
      keys.delete('S');
    }

    // Moonlight passive decay
    next.moonlight -= MOONLIGHT_DECAY * 0.15;

    // Night Timer Decay
    const newNightTimer = Math.max(0, nightTimerRef.current - deltaTime / 1000);
    nightTimerRef.current = newNightTimer;
    setNightTimer(newNightTimer);

    // Gameover check
    if ((next.moonlight <= 0 || next.health <= 0 || newNightTimer <= 0) && !gameoverFiredRef.current) {
      gameoverFiredRef.current = true;
      next.moonlight = 0;
      setPlayer(next);
      setGameState('gameover');
      saveScore(scoreRef.current);
      return;
    }

    // Abilities (Only in Bat form and not locked)
    let screechOrigin: { x: number; y: number } | null = null;
    if (gameStateRef.current === 'playing' && next.form === 'bat' && next.transformationTimer <= 0) {
      const now = Date.now();
      
      // Shadow Dash (Space) — single press only
      if (keys.has(' ') && now - next.lastDash > DASH_COOLDOWN && next.moonlight > DASH_COST) {
        keys.delete(' '); // Consume key — prevents firing every frame while held
        next.lastDash = now;
        next.moonlight -= DASH_COST;
        const dashDir = Math.sign(next.vel.x) || (next.pos.x < WORLD_WIDTH / 2 ? 1 : -1);
        next.vel.x = dashDir * DASH_STRENGTH;
        next.vel.y = -2; // Slight upward boost so dash feels airborne
        
        setEffects(prev => [...prev, {
          id: `dash-${now}`,
          type: 'dash',
          pos: { ...next.pos },
          timer: 300,
          maxTimer: 300
        }]);
      }

      // Blood Screech (Shift, Q or F)
      const screechPressed = keys.has('Shift') || keys.has('q') || keys.has('Q') || keys.has('f') || keys.has('F');
      const hasEnoughResource = next.bloodStorage >= SCREECH_COST || next.moonlight >= 20;
      if (screechPressed && now - next.lastScreech > SCREECH_COOLDOWN && hasEnoughResource) {
        // Consume keys to prevent repeat firing
        keys.delete('q'); keys.delete('Q'); keys.delete('f'); keys.delete('F');
        keys.delete('Shift'); keys.delete('ShiftLeft'); keys.delete('ShiftRight');
        next.lastScreech = now;
        // Prefer blood, fall back to moonlight
        if (next.bloodStorage >= SCREECH_COST) {
          next.bloodStorage -= SCREECH_COST;
        } else {
          next.moonlight -= 20;
        }
        
        setEffects(prev => [...prev, {
          id: `screech-${now}`,
          type: 'screech',
          pos: { ...next.pos },
          timer: 500,
          maxTimer: 500,
          radius: SCREECH_RADIUS
        }]);

        // Mark screech position — stun applied in villager update below
        screechOrigin = { x: next.pos.x, y: next.pos.y };
      }
    }

    // Castle — moonlight recharge safely AND deposit blood
    if (next.pos.x < 200) {
      next.moonlight = Math.min(MOONLIGHT_MAX, next.moonlight + 0.5);
      
      if (next.bloodStorage > 0) {
        const depositAmount = Math.min(next.bloodStorage, 10);
        next.bloodStorage -= depositAmount;
        setScore(s => s + depositAmount);
        // Extend the night!
        nightTimerRef.current += depositAmount * BLOOD_TO_TIME_RATIO;
        setNightTimer(nightTimerRef.current);
      }
    }

    setPlayer(next);

    // Camera follow with zoom
    const targetZoom = isLocked ? 2.5 : 1.0;
    const newZoom = cameraRef.current.zoom + (targetZoom - cameraRef.current.zoom) * 0.05;
    
    // Smooth camera centering
    const targetX = next.pos.x - (GAME_WIDTH / 2) / newZoom;
    const targetY = next.pos.y - (GAME_HEIGHT / 2) / newZoom;
    
    setCamera({
      x: Math.max(0, Math.min(WORLD_WIDTH - GAME_WIDTH / newZoom, targetX)),
      y: Math.max(-GAME_HEIGHT / newZoom, Math.min(GAME_HEIGHT - GAME_HEIGHT / newZoom, targetY)),
      zoom: newZoom
    });

    // Lure maidens out of houses
    if (gameStateRef.current === 'playing') {
      setMaidens(prevMaidens => prevMaidens.map(m => {
        if (!m || !m.pos || m.isCaptured) return m;
        // If inside, check if vampire is near the balcony
        if (m.isInside) {
          const doorX = m.houseX + 40;
          const doorY = BALCONY_Y - 16;
          const dx = next.pos.x - doorX;
          const dy = next.pos.y - doorY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LURE_DISTANCE) {
            // Lured out — move to doorstep on balcony
            return { ...m, isInside: false, pos: { x: doorX, y: BALCONY_Y - 16 } };
          }
          return m;
        }
        // Outside on balcony: check capture
        if (!next.carryingMaiden) {
          const dx = m.pos.x - next.pos.x;
          const dy = m.pos.y - next.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 45) {
            setPlayer(p => ({ 
              ...p, 
              pos: { x: m.pos.x, y: m.pos.y }, // Snap to maiden position
              form: 'vampire', 
              transformationTimer: 20, // Faster pause for smoke effect
              carryingMaiden: true 
            }));
            setGameState('bloodminigame');
            return { ...m, isCaptured: true };
          }
        }
        return m;
      }));
    }

    // Update Villagers
    const now = Date.now();
    const newProjectiles: Projectile[] = [];
    // Apply pending stun from screech
    // Slow villagers during bloodminigame (feeding)
    const isFeeding = gameStateRef.current === 'bloodminigame';
    const speedMult = isFeeding ? 0.2 : 1.0;

    const updatedVillagers = villagersRef.current.map(v => {
      if (!v || !v.pos) return v;

      // Apply screech stun (inline so it can't be overwritten by a later setState)
      if (screechOrigin) {
        const sdx = v.pos.x - screechOrigin.x;
        const sdy = v.pos.y - screechOrigin.y;
        if (Math.sqrt(sdx * sdx + sdy * sdy) < SCREECH_RADIUS) {
          return { ...v, isStunned: true, stunTimer: 4000 };
        }
      }

      if (v.isStunned) {
        const newTimer = v.stunTimer - deltaTime;
        return { ...v, stunTimer: newTimer, isStunned: newTimer > 0 };
      }

      // Behavior: Hunt the bat
      const dxToPlayer = next.pos.x - v.pos.x;
      const dyToPlayer = next.pos.y - v.pos.y;
      const distToPlayer = Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer);
      const absDx = Math.abs(dxToPlayer);

      let updatedV = { ...v };

      // Attack if in range and cooldown passed (slower during feeding)
      if (now - v.lastAttack > ATTACK_COOLDOWN / speedMult) {
        let shouldAttack = false;
        let pSpeed = 0;
        let pDamage = PROJECTILE_DAMAGE;
        let pType = '';

        if (v.villagerType === 'archer' && distToPlayer < ARCHER_RANGE) {
          shouldAttack = true;
          pSpeed = ARROW_SPEED;
          pType = 'arrow';
        } else if (v.villagerType === 'spearman' && distToPlayer < SPEAR_RANGE) {
          shouldAttack = true;
          pSpeed = SPEAR_SPEED;
          pType = 'spear';
        } else if (v.villagerType === 'peasant' && distToPlayer < 200) {
          // Peasants throw rocks!
          shouldAttack = true;
          pSpeed = 4;
          pType = 'rock';
        }

        if (shouldAttack) {
          const angle = Math.atan2(dyToPlayer, dxToPlayer);
          newProjectiles.push({
            id: `p-${v.id}-${now}-${newProjectiles.length}`,
            pos: { x: v.pos.x, y: v.pos.y - 10 },
            vel: { x: Math.cos(angle) * pSpeed, y: Math.sin(angle) * pSpeed },
            width: pType === 'arrow' ? 10 : 20,
            height: 4,
            damage: pDamage,
            ownerId: v.id,
            rotation: angle,
            type: pType
          });
          updatedV.lastAttack = now;
        }
      }

      // Movement
      const newX = v.pos.x + v.direction * VILLAGER_SPEED;
      const spawnX = v.spawnPoint?.x ?? v.pos.x;
      const distFromSpawn = newX - spawnX;
      let newDir = v.direction;
      
      if (Math.abs(distFromSpawn) > v.patrolRange) {
        newDir = (v.direction * -1) as 1 | -1;
      }
      
      // Face the player if close
      if (absDx < 400) {
        updatedV.direction = dxToPlayer > 0 ? 1 : -1;
      } else {
        updatedV.direction = newDir;
      }

      // Only walk if not too close horizontally; scale speed during feeding
      const finalX = absDx < 100 ? v.pos.x : v.pos.x + updatedV.direction * VILLAGER_SPEED * speedMult;
      return { ...updatedV, pos: { ...v.pos, x: finalX } };
    });

    setVillagers(updatedVillagers);

    // Update Projectiles
    setProjectiles(prev => {
      const all = [...prev, ...newProjectiles];
      return all.map(p => {
        const nextP = {
          ...p,
          pos: { x: p.pos.x + p.vel.x, y: p.pos.y + p.vel.y }
        };

        // Collision with player
        const distDx = nextP.pos.x - next.pos.x;
        const distDy = nextP.pos.y - next.pos.y;
        const distToPlayer = Math.sqrt(distDx * distDx + distDy * distDy);

        if (distToPlayer < 25) {
          setPlayer(pState => ({ ...pState, health: Math.max(0, pState.health - p.damage) }));
          return null; // Remove on hit
        }

        // Remove if out of bounds
        if (nextP.pos.x < 0 || nextP.pos.x > WORLD_WIDTH || nextP.pos.y < 0 || nextP.pos.y > GAME_HEIGHT) {
          return null;
        }

        return nextP;
      }).filter((p): p is Projectile => p !== null);
    });

    // Update Effects
    setEffects(prev => prev.map(e => ({
      ...e,
      timer: e.timer - deltaTime
    })).filter(e => e.timer > 0));

    requestRef.current = requestAnimationFrame(update);
  }, [saveScore]);

  useEffect(() => {
    fetchHighScores();
    const handleKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key);
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    if (gameState === 'playing' || gameState === 'bloodminigame') {
      lastTimeRef.current = 0;
      requestRef.current = requestAnimationFrame(update);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(requestRef.current);
    };
  }, [update, fetchHighScores, gameState]);

  return {
    gameState,
    setGameState,
    player,
    maidens,
    villagers,
    projectiles,
    camera,
    score,
    highScores,
    effects,
    nightTimer,
    pendingBloodScore,
    resetGame,
    fetchHighScores,
    onBloodMinigameComplete
  };
};
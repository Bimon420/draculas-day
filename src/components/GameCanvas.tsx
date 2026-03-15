import React, { useRef, useEffect } from 'react';
import { Player, Maiden, Villager, Camera, Projectile, Effect } from '../game/types';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, WORLD_WIDTH, BALCONY_Y, HOUSE_WIDTH, HOUSE_HEIGHT } from '../game/constants';

interface GameCanvasProps {
  player: Player;
  maidens: Maiden[];
  villagers: Villager[];
  projectiles: Projectile[];
  effects: Effect[];
  camera: Camera;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ player, maidens, villagers, projectiles, effects, camera }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawBat = (ctx: CanvasRenderingContext2D, p: Player) => {
    ctx.save();
    ctx.translate(p.pos.x, p.pos.y);

    if (p.form === 'vampire') {
      // Vampire form (Standing)
      ctx.fillStyle = COLORS.MIDNIGHT;
      
      // Cape (behind body)
      ctx.beginPath();
      ctx.moveTo(-15, 16);
      ctx.lineTo(-20, -10);
      ctx.lineTo(0, -22);
      ctx.lineTo(20, -10);
      ctx.lineTo(15, 16);
      ctx.fill();

      // Legs/Pants
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(-6, 0, 5, 16);
      ctx.fillRect(1, 0, 5, 16);

      // Torso
      ctx.fillStyle = COLORS.MIDNIGHT;
      ctx.fillRect(-8, -15, 16, 15);

      // Head
      ctx.fillStyle = '#f5d0b0';
      ctx.beginPath();
      ctx.arc(0, -20, 7, 0, Math.PI * 2);
      ctx.fill();

      // Hair (Widow's peak)
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(0, -22, 7, Math.PI, 0);
      ctx.lineTo(0, -18);
      ctx.fill();

      // Eyes
      ctx.fillStyle = COLORS.CRIMSON;
      ctx.fillRect(-3, -21, 2, 2);
      ctx.fillRect(1, -21, 2, 2);

      // Arms (holding position)
      ctx.strokeStyle = '#f5d0b0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (p.carryingMaiden) {
        // Draw the maiden in his arms
        ctx.save();
        ctx.translate(5, -5);
        ctx.rotate(0.2);
        // Dress
        ctx.fillStyle = '#f5e0d0';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-8, 10);
        ctx.lineTo(8, 10);
        ctx.closePath();
        ctx.fill();
        // Head
        ctx.fillStyle = '#f5d0b0';
        ctx.beginPath();
        ctx.arc(0, -12, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Holding arms
        ctx.moveTo(-8, -10);
        ctx.lineTo(-18, -5);
        ctx.moveTo(8, -10);
        ctx.lineTo(18, -5);
      } else {
        ctx.moveTo(-8, -10);
        ctx.lineTo(-12, 5);
        ctx.moveTo(8, -10);
        ctx.lineTo(12, 5);
      }
      ctx.stroke();
    } else {
      // Bat form
      ctx.fillStyle = COLORS.MIDNIGHT;
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wings
      const flap = Math.sin(Date.now() / 100) * 10;
      ctx.fillStyle = '#5a2040';
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.quadraticCurveTo(-22, -15 - flap, -32, -5);
      ctx.lineTo(-20, 5);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.quadraticCurveTo(22, -15 - flap, 32, -5);
      ctx.lineTo(20, 5);
      ctx.fill();

      // Eyes
      ctx.fillStyle = COLORS.CRIMSON;
      ctx.beginPath();
      ctx.arc(-3, -2, 2, 0, Math.PI * 2);
      ctx.arc(3, -2, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Transformation smoke effect
    if (p.transformationTimer > 0) {
      const alpha = p.transformationTimer / 30; // Matches shorter timer
      ctx.fillStyle = `rgba(100, 100, 100, ${alpha * 0.8})`;
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + Date.now() / 200;
        const dist = 15 + Math.sin(Date.now() / 100 + i) * 10;
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * dist, Math.sin(ang) * dist - 10, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  };

  const drawMaiden = (ctx: CanvasRenderingContext2D, m: Maiden) => {
    if (m.isCaptured) return; // Don't draw captured maidens in the world loop (they are with the vampire)
    ctx.save();

    if (m.isInside) {
      // Draw through window — faint glow inside house at balcony level
      const wx = m.houseX + 16;
      const wy = BALCONY_Y - 40;
      // Window candle flicker
      const flicker = 0.6 + Math.sin(Date.now() / 300 + m.houseX) * 0.2;
      ctx.fillStyle = `rgba(255, 200, 80, ${flicker * 0.3})`;
      ctx.fillRect(wx - 2, wy - 2, 28, 24);

      // Silhouette in window
      ctx.translate(wx + 14, wy + 14);
      ctx.fillStyle = `rgba(255, 230, 200, 0.5)`;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(-5, 8);
      ctx.lineTo(5, 8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -10, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Outside — full bright maiden
      ctx.translate(m.pos.x, m.pos.y);

      // Dress
      ctx.fillStyle = '#f5e0d0';
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(-10, 16);
      ctx.lineTo(10, 16);
      ctx.closePath();
      ctx.fill();

      // Apron
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(-6, 14);
      ctx.lineTo(6, 14);
      ctx.closePath();
      ctx.fill();

      // Head
      ctx.fillStyle = '#f5d0b0';
      ctx.beginPath();
      ctx.arc(0, -19, 5, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.arc(0, -22, 5, Math.PI, 0);
      ctx.fill();

      // Eyes — scared
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-2, -19, 1, 0, Math.PI * 2);
      ctx.arc(2, -19, 1, 0, Math.PI * 2);
      ctx.fill();

      // Panic arms
      const wave = Math.sin(Date.now() / 150) * 5;
      ctx.strokeStyle = '#f5d0b0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-7, -8);
      ctx.lineTo(-14, -14 - wave);
      ctx.moveTo(7, -8);
      ctx.lineTo(14, -14 + wave);
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawVillager = (ctx: CanvasRenderingContext2D, v: Villager) => {
    ctx.save();
    ctx.translate(v.pos.x, v.pos.y);

    // Body
    ctx.fillStyle = v.isStunned ? '#777' : (v.villagerType === 'peasant' ? '#5a4020' : (v.villagerType === 'archer' ? '#2a5a1a' : '#5a2030'));
    ctx.fillRect(-8, -16, 16, 32);

    // Head
    ctx.fillStyle = '#c8a880';
    ctx.beginPath();
    ctx.arc(0, -22, 7, 0, Math.PI * 2);
    ctx.fill();

    // Hat
    ctx.fillStyle = '#1a0a00';
    if (v.villagerType === 'archer') {
      // Archer hood
      ctx.beginPath();
      ctx.arc(0, -22, 9, Math.PI, 0);
      ctx.fill();
    } else {
      ctx.fillRect(-12, -30, 24, 4);
      ctx.fillRect(-6, -42, 12, 12);
    }

    // Weapons
    ctx.strokeStyle = v.isStunned ? '#666' : '#5a3010';
    ctx.lineWidth = 2;
    if (v.villagerType === 'archer') {
      // Bow
      ctx.beginPath();
      const bowX = v.direction > 0 ? 10 : -10;
      ctx.arc(bowX, -10, 15, -Math.PI/2, Math.PI/2);
      ctx.stroke();
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bowX, -25);
      ctx.lineTo(bowX, 5);
      ctx.stroke();
    } else if (v.villagerType === 'spearman') {
      // Spear
      ctx.beginPath();
      const spearX = v.direction > 0 ? 12 : -12;
      ctx.moveTo(spearX, -30);
      ctx.lineTo(spearX, 20);
      ctx.stroke();
      ctx.fillStyle = '#999';
      ctx.beginPath();
      ctx.moveTo(spearX - 4, -30);
      ctx.lineTo(spearX + 4, -30);
      ctx.lineTo(spearX, -40);
      ctx.fill();
    } else {
      // Pitchfork
      ctx.beginPath();
      const px = v.direction > 0 ? 10 : -10;
      ctx.moveTo(px, -12);
      ctx.lineTo(px, 20);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - 3, -12);
      ctx.lineTo(px - 3, -20);
      ctx.moveTo(px, -12);
      ctx.lineTo(px, -22);
      ctx.moveTo(px + 3, -12);
      ctx.lineTo(px + 3, -20);
      ctx.stroke();
    }

    // Stunned stars
    if (v.isStunned) {
      const t = Date.now() / 200;
      for (let s = 0; s < 3; s++) {
        const angle = t + (s * Math.PI * 2) / 3;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * 12, -32 + Math.sin(angle) * 4, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  };

  const drawProjectile = (ctx: CanvasRenderingContext2D, p: Projectile) => {
    ctx.save();
    ctx.translate(p.pos.x, p.pos.y);
    ctx.rotate(p.rotation);

    if (p.type === 'arrow') {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(10, 0);
      ctx.stroke();
      // Fletching
      ctx.fillStyle = '#ddd';
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(-15, -4);
      ctx.lineTo(-15, 4);
      ctx.fill();
    } else if (p.type === 'spear') {
      // Spear
      ctx.strokeStyle = '#5a3010';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.lineTo(15, 0);
      ctx.stroke();
      // Tip
      ctx.fillStyle = '#999';
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(10, -5);
      ctx.lineTo(10, 5);
      ctx.fill();
    } else if (p.type === 'rock') {
      // Rock
      ctx.fillStyle = '#666';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      // Texture
      ctx.fillStyle = '#444';
      ctx.fillRect(-2, -2, 2, 2);
    }

    ctx.restore();
  };

  const drawEffect = (ctx: CanvasRenderingContext2D, e: Effect) => {
    ctx.save();
    ctx.translate(e.pos.x, e.pos.y);
    const alpha = e.timer / e.maxTimer;

    if (e.type === 'dash') {
      ctx.fillStyle = `rgba(153, 27, 27, ${alpha * 0.4})`;
      for (let i = 0; i < 5; i++) {
        const x = (Math.random() - 0.5) * 40;
        const y = (Math.random() - 0.5) * 20;
        ctx.beginPath();
        ctx.arc(x, y, 10 * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (e.type === 'screech') {
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
      ctx.lineWidth = 4 * alpha;
      ctx.beginPath();
      ctx.arc(0, 0, (e.radius || 100) * (1 - alpha), 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.strokeStyle = `rgba(153, 27, 27, ${alpha * 0.4})`;
      ctx.lineWidth = 8 * alpha;
      ctx.beginPath();
      ctx.arc(0, 0, (e.radius || 100) * (1 - alpha) * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // Night sky gradient - bright moonlit night
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT - 60);
    skyGrad.addColorStop(0, '#0c1445');
    skyGrad.addColorStop(0.5, '#1a1250');
    skyGrad.addColorStop(1, '#2a1b55');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars — parallax layer
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 80; i++) {
      const x = ((i * 167) % WORLD_WIDTH) - camera.x * 0.3;
      const y = (i * 97) % (GAME_HEIGHT * 0.6);
      const size = i % 5 === 0 ? 2 : 1;
      const twinkle = 0.5 + Math.sin(Date.now() / 500 + i) * 0.3;
      ctx.globalAlpha = twinkle;
      ctx.fillRect(x % GAME_WIDTH, y, size, size);
    }
    ctx.globalAlpha = 1;

    // Moon
    ctx.fillStyle = '#fffbe8';
    ctx.shadowBlur = 30;
    ctx.shadowColor = 'rgba(255,251,200,0.5)';
    ctx.beginPath();
    ctx.arc(700 - camera.x * 0.05, 90, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Moon craters
    ctx.fillStyle = 'rgba(200,190,150,0.3)';
    ctx.beginPath();
    ctx.arc(690 - camera.x * 0.05, 85, 8, 0, Math.PI * 2);
    ctx.arc(715 - camera.x * 0.05, 100, 5, 0, Math.PI * 2);
    ctx.fill();

    // Faint ground fog for depth/visibility
    const fogGrad = ctx.createLinearGradient(0, GAME_HEIGHT - 150, 0, GAME_HEIGHT - 60);
    fogGrad.addColorStop(0, 'rgba(30, 20, 50, 0)');
    fogGrad.addColorStop(1, 'rgba(60, 40, 90, 0.2)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, GAME_HEIGHT - 150, GAME_WIDTH, 90);
  };

  const drawTorch = (ctx: CanvasRenderingContext2D, tx: number, ty: number) => {
    ctx.save();
    ctx.translate(tx, ty);
    
    // Torch stick
    ctx.fillStyle = '#3e2a14';
    ctx.fillRect(-2, 0, 4, 15);
    
    // Flame core
    const flicker = 0.5 + Math.sin(Date.now() / 80) * 0.2;
    const flickerX = Math.sin(Date.now() / 150) * 2;
    
    // Outer glow
    const grad = ctx.createRadialGradient(0, -5, 2, 0, -5, 20);
    grad.addColorStop(0, 'rgba(255, 100, 0, 0.4)');
    grad.addColorStop(1, 'rgba(255, 100, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, -5, 20, 0, Math.PI * 2);
    ctx.fill();

    // Flame
    ctx.fillStyle = `rgba(255, 180, 50, ${flicker + 0.3})`;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.quadraticCurveTo(flickerX, -15 - flicker * 5, 4, 0);
    ctx.closePath();
    ctx.fill();

    // Inner flame
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(-2, -2);
    ctx.quadraticCurveTo(flickerX * 0.5, -8, 2, -2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  const drawHouse = (ctx: CanvasRenderingContext2D, hx: number, maiden: Maiden | null | undefined) => {
    const hy = GAME_HEIGHT - HOUSE_HEIGHT - 60;
    const hasLight = maiden && !maiden.isCaptured;

    // House body (Tall) - Brightened
    ctx.fillStyle = '#3d2818';
    ctx.fillRect(hx, hy, HOUSE_WIDTH, HOUSE_HEIGHT);

    // Balcony
    ctx.fillStyle = '#2a1c10';
    ctx.fillRect(hx - 5, BALCONY_Y, HOUSE_WIDTH + 10, 10);
    // Balcony railing
    ctx.strokeStyle = '#3e2a14';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hx - 5, BALCONY_Y - 15);
    ctx.lineTo(hx + HOUSE_WIDTH + 5, BALCONY_Y - 15);
    ctx.stroke();
    for (let i = 0; i <= 5; i++) {
      const rx = hx - 5 + i * (HOUSE_WIDTH + 10) / 5;
      ctx.beginPath();
      ctx.moveTo(rx, BALCONY_Y);
      ctx.lineTo(rx, BALCONY_Y - 15);
      ctx.stroke();
    }

    // Door to balcony
    ctx.fillStyle = '#1a1008';
    ctx.fillRect(hx + 35, BALCONY_Y - 45, 25, 45);

    // Ground floor door
    ctx.fillStyle = '#221408';
    ctx.fillRect(hx + 35, GAME_HEIGHT - 100, 30, 40);

    // Window on balcony level
    const wx = hx + 10;
    const wy = BALCONY_Y - 40;
    if (hasLight && maiden!.isInside) {
      const flicker = 0.5 + Math.sin(Date.now() / 280 + hx) * 0.25;
      ctx.fillStyle = `rgba(255, 210, 100, ${flicker * 0.6})`;
      ctx.fillRect(wx, wy, 26, 22);
      // Maiden silhouette in window
      ctx.fillStyle = `rgba(220,160,100,${flicker * 0.8})`;
      ctx.beginPath();
      ctx.moveTo(wx + 13, wy + 5);
      ctx.lineTo(wx + 7, wy + 20);
      ctx.lineTo(wx + 19, wy + 20);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(wx + 13, wy + 3, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Dark window
      ctx.fillStyle = '#150a0a';
      ctx.fillRect(wx, wy, 26, 22);
    }
    // Window bars
    ctx.strokeStyle = '#3e2a14';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(wx, wy, 26, 22);
    ctx.beginPath();
    ctx.moveTo(wx + 13, wy);
    ctx.lineTo(wx + 13, wy + 22);
    ctx.moveTo(wx, wy + 11);
    ctx.lineTo(wx + 26, wy + 11);
    ctx.stroke();

    // Roof
    ctx.fillStyle = '#221810';
    ctx.beginPath();
    ctx.moveTo(hx - 15, hy);
    ctx.lineTo(hx + HOUSE_WIDTH + 15, hy);
    ctx.lineTo(hx + HOUSE_WIDTH / 2, hy - 60);
    ctx.closePath();
    ctx.fill();

    // Torches
    drawTorch(ctx, hx + 10, GAME_HEIGHT - 100);
    drawTorch(ctx, hx + HOUSE_WIDTH - 10, GAME_HEIGHT - 100);
    drawTorch(ctx, hx + 20, BALCONY_Y - 30);
    drawTorch(ctx, hx + HOUSE_WIDTH - 20, BALCONY_Y - 30);

    // Chimney
    ctx.fillStyle = '#120c06';
    ctx.fillRect(hx + HOUSE_WIDTH - 30, hy - 40, 15, 30);

    // Lure zone indicator — subtle red glow around balcony if maiden is inside
    if (hasLight && maiden!.isInside) {
      ctx.strokeStyle = 'rgba(180,20,20,0.2)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(hx + HOUSE_WIDTH / 2, BALCONY_Y - 20, 80, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // 1. STATIC BACKGROUND (Sky, Stars, Moon)
    drawBackground(ctx);
    
    // 2. WORLD OBJECTS (Scaled & Translated)
    ctx.save();
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
    
    // Castle
    ctx.fillStyle = '#1e1828';
    ctx.fillRect(20, GAME_HEIGHT - 280, 180, 280);
    // Battlements
    for (let b = 0; b < 6; b++) {
      ctx.fillRect(20 + b * 30, GAME_HEIGHT - 290, 20, 16);
    }
    ctx.fillStyle = '#161020';
    ctx.fillRect(55, GAME_HEIGHT - 380, 45, 100);
    ctx.fillRect(110, GAME_HEIGHT - 340, 45, 60);
    // Castle gate
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(110, GAME_HEIGHT - 110, 22, Math.PI, 0);
    ctx.fillRect(88, GAME_HEIGHT - 110, 44, 40);
    ctx.fill();
    // Castle windows — glowing red
    ctx.fillStyle = 'rgba(153,27,27,0.6)';
    ctx.fillRect(40, GAME_HEIGHT - 220, 18, 24);
    ctx.fillRect(80, GAME_HEIGHT - 220, 18, 24);
    ctx.fillRect(140, GAME_HEIGHT - 220, 18, 24);
    // Deliver zone glow
    ctx.strokeStyle = 'rgba(153,27,27,0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(5, GAME_HEIGHT - 280, 195, 280);
    ctx.setLineDash([]);

    // Houses
    for (let i = 0; i < 15; i++) {
      const hx = 800 + i * 400;
      // Simple culling
      if (hx < camera.x - 100 || hx > camera.x + GAME_WIDTH / camera.zoom + 100) continue;
      drawHouse(ctx, hx, i < 10 ? maidens.find(m => m.houseX === 800 + i * 400) : null);
    }

    // Ground & Texture
    ctx.fillStyle = '#1a1520';
    ctx.fillRect(camera.x - 100, GAME_HEIGHT - 60, GAME_WIDTH / camera.zoom + 200, 100);
    // Dirt path highlights
    ctx.fillStyle = '#2a2030';
    for (let g = 0; g < 60; g++) {
      const gx = ((g * 137) % WORLD_WIDTH);
      if (gx < camera.x - 100 || gx > camera.x + GAME_WIDTH / camera.zoom + 100) continue;
      ctx.fillRect(gx, GAME_HEIGHT - 58, 40 + (g % 3) * 15, 3);
    }
    ctx.fillStyle = 'rgba(50,30,20,0.6)';
    for (let g = 0; g < 40; g++) {
      const gx = ((g * 197) % WORLD_WIDTH);
      if (gx < camera.x - 100 || gx > camera.x + GAME_WIDTH / camera.zoom + 100) continue;
      ctx.fillRect(gx, GAME_HEIGHT - 55, 60 + (g % 4) * 20, 4);
    }

    // Entities
    maidens.forEach(m => { if (m?.pos && !m.isInside) drawMaiden(ctx, m); });
    villagers.forEach(v => { if (v?.pos) drawVillager(ctx, v); });
    projectiles.forEach(p => { if (p?.pos) drawProjectile(ctx, p); });
    effects.forEach(e => drawEffect(ctx, e));
    drawBat(ctx, player);
    
    ctx.restore();
  };

  useEffect(() => {
    const interval = setInterval(render, 16);
    return () => clearInterval(interval);
  }, [player, maidens, villagers, projectiles, effects, camera]);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="block bg-black"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

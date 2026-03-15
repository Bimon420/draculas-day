export interface Vector {
  x: number;
  y: number;
}

export type GameState = 'start' | 'playing' | 'bloodminigame' | 'gameover' | 'victory';

export interface GameObject {
  id: string;
  pos: Vector;
  vel: Vector;
  width: number;
  height: number;
  type: string;
}

export interface Player extends GameObject {
  rotation: number;
  moonlight: number;
  health: number;
  carryingMaiden: boolean;
  score: number;
  lastScreech: number;
  lastDash: number;
  form: 'bat' | 'vampire';
  transformationTimer: number; // For smoke effect/pause during transformation
  bloodStorage: number;
  maxBloodStorage: number;
}

export interface Effect {
  id: string;
  type: 'dash' | 'screech';
  pos: Vector;
  timer: number;
  maxTimer: number;
  radius?: number;
}

export interface Maiden extends GameObject {
  isCaptured: boolean;
  isInside: boolean;   // true = inside house, false = lured out
  spawnPoint: Vector;
  houseX: number;      // x position of her house
}

export type VillagerType = 'peasant' | 'archer' | 'spearman';

export interface Villager extends GameObject {
  villagerType: VillagerType;
  patrolRange: number;
  direction: 1 | -1;
  lastAttack: number;
  isStunned: boolean;
  stunTimer: number;
  spawnPoint: Vector;
}

export interface Projectile extends GameObject {
  ownerId: string;
  damage: number;
  rotation: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const WORLD_WIDTH = 4000; // Large side-scrolling world

export const GRAVITY = 0.12;
export const FRICTION = 0.98;
export const THRUST = 0.7;
export const ROTATION_SPEED = 0.08;

export const MAX_SPEED = 8;
export const MAX_VERTICAL_SPEED = 6;

export const VILLAGER_SPAWN_INTERVAL = 3000;
export const MAIDEN_SPAWN_COUNT = 10;

export const MOONLIGHT_MAX = 100;
export const MOONLIGHT_DECAY = 0.02;

export const SCORE_MAIDEN_DELIVERED = 500;
export const SCORE_VILLAGER_STUNNED = 50;

// Villager Combat
export const ARCHER_RANGE = 550;
export const SPEAR_RANGE = 450;
export const ATTACK_COOLDOWN = 2000;
export const ARROW_SPEED = 5.5;
export const SPEAR_SPEED = 4.5;
export const PROJECTILE_DAMAGE = 15;
export const VILLAGER_SPEED = 1.4;

// Vampire Powers
export const DASH_COST = 10;
export const DASH_COOLDOWN = 1000;
export const DASH_STRENGTH = 15;
export const SCREECH_COST = 50; // Blood storage cost (lowered to be usable earlier)
export const SCREECH_COOLDOWN = 3000;
export const SCREECH_RADIUS = 300;

// Dawn Timer
export const INITIAL_NIGHT_TIMER = 60; // 60 seconds
export const BLOOD_TO_TIME_RATIO = 0.07; // Less extension per blood

// Houses: x positions of 10 houses in the village (15 total drawn, maidens in first 10)
export const HOUSE_POSITIONS: number[] = Array.from({ length: 10 }, (_, i) => 800 + i * 400);
// Maiden lure distance — vampire must be this close to house door/balcony to lure her out
export const LURE_DISTANCE = 100;

export const BALCONY_Y = GAME_HEIGHT - 200; // Higher up for maidens
export const HOUSE_WIDTH = 100;
export const HOUSE_HEIGHT = 180;

export const COLORS = {
  CRIMSON: '#EF4444', // Bright red — visible against dark
  MIDNIGHT: '#4A3B6B', // Purple-ish — visible bat body
  BONE: '#F3F4F6',
  SHADOW: '#3D3556', // Lighter shadow
  MOON: '#FFFBEB',
};

export type SpriteSheetKey = 'gameplay' | 'mainMenu' | 'setup' | 'pause' | 'splashMockup';

export interface SpriteSheetMeta {
  src: string;
  width: number;
  height: number;
}

export interface SpriteRect {
  sheet: SpriteSheetKey;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type SpriteKey =
  | 'avatarP1Human'
  | 'avatarP2Visor'
  | 'avatarAiRobot'
  | 'dotGlow'
  | 'redSparkBurst'
  | 'cyanSparkBurst'
  | 'laserVerticalRed'
  | 'laserVerticalCyan'
  | 'laserHorizontalCyan'
  | 'capturedBoxB1'
  | 'capturedBoxB2'
  | 'turnArrow'
  | 'fxCyanSplash'
  | 'fxRedSparks'
  | 'menuRedExplosion'
  | 'menuCyanExplosion';

export interface GridPreset {
  size: 4 | 6 | 8 | 10 | 12 | 14;
  labelFa: string;
  subtitleFa: string;
  tier: 'amber' | 'cyan' | 'violet';
  boxes: number;
}

export interface NeonTheme {
  id: string;
  nameFa: string;
  descFa: string;
  p1: string;
  p1Soft: string;
  p1Glow: string;
  p2: string;
  p2Soft: string;
  p2Glow: string;
  dotCore: string;
  dotGlow: string;
}

export declare const SPRITE_SHEETS: Record<SpriteSheetKey, SpriteSheetMeta>;
export declare const SPRITES: Record<SpriteKey, SpriteRect>;
export declare const GRID_PRESETS: GridPreset[];
export declare const NEON_THEMES: NeonTheme[];

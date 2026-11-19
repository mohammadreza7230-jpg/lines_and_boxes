/**
 * Sprite Sheet & Visual Asset Configuration for "نقطه بازی - نبرد سایبری"
 * All sprite sheets are 1536 x 2752 on pure #000000 backgrounds, rendered using
 * `mix-blend-mode: screen` (DOM) or `globalCompositeOperation = 'lighter'` (Canvas)
 * with automatic programmatic Canvas/CSS neon fallbacks.
 */

export const SPRITE_SHEETS = {
  gameplay: {
    src: '/assets/aistudio/1795114007880_8873a44a.jpg',
    width: 1536,
    height: 2752,
  },
  mainMenu: {
    src: '/assets/aistudio/1795098916068_15d6ed12.jpg',
    width: 1536,
    height: 2752,
  },
  setup: {
    src: '/assets/aistudio/1795113241608_3418e2f4.jpg',
    width: 1536,
    height: 2752,
  },
  pause: {
    src: '/assets/aistudio/1795113842753_2d7b9410.jpg',
    width: 1536,
    height: 2752,
  },
  splashMockup: {
    src: '/assets/aistudio/1795098839188_63d7ca97.jpg',
    width: 1536,
    height: 2752,
  },
};

export const SPRITES = {
  // Gameplay HUD Avatars (from gameplay sprite sheet)
  avatarP1Human: {
    sheet: 'gameplay',
    x: 606,
    y: 1644,
    w: 166,
    h: 166,
  },
  avatarP2Visor: {
    sheet: 'gameplay',
    x: 822,
    y: 1642,
    w: 162,
    h: 168,
  },
  avatarAiRobot: {
    sheet: 'gameplay',
    x: 1030,
    y: 1642,
    w: 166,
    h: 168,
  },

  // Gameplay Canvas Elements (pure black bg -> additive 'lighter' blend)
  dotGlow: {
    sheet: 'gameplay',
    x: 164,
    y: 434,
    w: 100,
    h: 100,
  },
  redSparkBurst: {
    sheet: 'gameplay',
    x: 928,
    y: 1196,
    w: 232,
    h: 232,
  },
  cyanSparkBurst: {
    sheet: 'gameplay',
    x: 1184,
    y: 1196,
    w: 236,
    h: 232,
  },
  laserVerticalRed: {
    sheet: 'gameplay',
    x: 1086,
    y: 454,
    w: 72,
    h: 604,
  },
  laserVerticalCyan: {
    sheet: 'gameplay',
    x: 1348,
    y: 454,
    w: 72,
    h: 604,
  },
  laserHorizontalCyan: {
    sheet: 'gameplay',
    x: 116,
    y: 882,
    w: 704,
    h: 80,
  },
  capturedBoxB1: {
    sheet: 'gameplay',
    x: 128,
    y: 1204,
    w: 216,
    h: 216,
  },
  capturedBoxB2: {
    sheet: 'gameplay',
    x: 394,
    y: 1204,
    w: 216,
    h: 216,
  },
  turnArrow: {
    sheet: 'gameplay',
    x: 1128,
    y: 1872,
    w: 280,
    h: 164,
  },

  // Pause & FX Sprites
  fxCyanSplash: {
    sheet: 'pause',
    x: 68,
    y: 2450,
    w: 248,
    h: 175,
  },
  fxRedSparks: {
    sheet: 'pause',
    x: 560,
    y: 2450,
    w: 170,
    h: 175,
  },

  // Main Menu Decorative Logo & Sparks
  menuRedExplosion: {
    sheet: 'mainMenu',
    x: 785,
    y: 1730,
    w: 365,
    h: 350,
  },
  menuCyanExplosion: {
    sheet: 'mainMenu',
    x: 1165,
    y: 1730,
    w: 310,
    h: 280,
  },
};

export const GRID_PRESETS = [
  {
    size: 4,
    labelFa: '۴ × ۴',
    subtitleFa: '(برق‌آسا)',
    tier: 'amber',
    boxes: 9,
  },
  {
    size: 6,
    labelFa: '۶ × ۶',
    subtitleFa: '(آسان)',
    tier: 'amber',
    boxes: 25,
  },
  {
    size: 8,
    labelFa: '۸ × ۸',
    subtitleFa: '(استاندارد)',
    tier: 'cyan',
    boxes: 49,
  },
  {
    size: 10,
    labelFa: '۱۰ × ۱۰',
    subtitleFa: '(تاکتیکی)',
    tier: 'cyan',
    boxes: 81,
  },
  {
    size: 12,
    labelFa: '۱۲ × ۱۲',
    subtitleFa: '(حرفه‌ای)',
    tier: 'violet',
    boxes: 121,
  },
  {
    size: 14,
    labelFa: '۱۴ × ۱۴',
    subtitleFa: '(ماراتن)',
    tier: 'violet',
    boxes: 169,
  },
];

export const NEON_THEMES = [
  {
    id: 'cyber-classic',
    nameFa: 'نبرد کلاسیک سایبری',
    descFa: 'قرمز کریمسون در برابر آبی الکتریک (پالت اصلی)',
    p1: '#FF1E42',
    p1Soft: 'rgba(255, 30, 66, 0.24)',
    p1Glow: 'rgba(255, 30, 66, 0.85)',
    p2: '#00F0FF',
    p2Soft: 'rgba(0, 240, 255, 0.24)',
    p2Glow: 'rgba(0, 240, 255, 0.85)',
    dotCore: '#FFFFFF',
    dotGlow: '#00F0FF',
  },
  {
    id: 'plasma-pulse',
    nameFa: 'پلاسمای خورشیدی',
    descFa: 'نارنجی آتشین در برابر بنفش کوانتومی',
    p1: '#FF5E1A',
    p1Soft: 'rgba(255, 94, 26, 0.24)',
    p1Glow: 'rgba(255, 94, 26, 0.85)',
    p2: '#A855F7',
    p2Soft: 'rgba(168, 85, 247, 0.24)',
    p2Glow: 'rgba(168, 85, 247, 0.85)',
    dotCore: '#FFF8F0',
    dotGlow: '#C084FC',
  },
  {
    id: 'matrix-venom',
    nameFa: 'ماتریکس نئونی',
    descFa: 'سرخابی برقی در برابر سبز زمردی',
    p1: '#FF008C',
    p1Soft: 'rgba(255, 0, 140, 0.24)',
    p1Glow: 'rgba(255, 0, 140, 0.85)',
    p2: '#00FF94',
    p2Soft: 'rgba(0, 255, 148, 0.24)',
    p2Glow: 'rgba(0, 255, 148, 0.85)',
    dotCore: '#F0FFF8',
    dotGlow: '#00FF94',
  },
  {
    id: 'hyper-gold',
    nameFa: 'طلای فضایی',
    descFa: 'طلایی درخشان در برابر آبی یخی',
    p1: '#FFB800',
    p1Soft: 'rgba(255, 184, 0, 0.24)',
    p1Glow: 'rgba(255, 184, 0, 0.85)',
    p2: '#38BDF8',
    p2Soft: 'rgba(56, 189, 248, 0.24)',
    p2Glow: 'rgba(56, 189, 248, 0.85)',
    dotCore: '#FFFFFF',
    dotGlow: '#38BDF8',
  },
];

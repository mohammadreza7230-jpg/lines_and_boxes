const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: number | string): string {
  return String(input).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

export function formatDurationPersian(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return toPersianDigits(formatted);
}

export interface GameSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  turnTimerEnabled: boolean;
  turnTimerSeconds: number;
  highGlow: boolean;
  themeId: string;
}

export interface MatchRecord {
  id: string;
  dateIso: string;
  mode: 'local' | 'ai';
  difficulty: 'easy' | 'medium' | 'hard';
  gridSize: number;
  p1Score: number;
  p2Score: number;
  winner: 0 | 1 | 2;
  maxChain: number;
  durationSeconds: number;
}

export interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  bestChain: number;
  totalBoxesCaptured: number;
  recentMatches: MatchRecord[];
}

const SETTINGS_KEY = 'cyber_dots_settings_v1';
const STATS_KEY = 'cyber_dots_stats_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  hapticEnabled: true,
  turnTimerEnabled: true,
  turnTimerSeconds: 15,
  highGlow: true,
  themeId: 'cyber-classic',
};

export const DEFAULT_STATS: PlayerStats = {
  totalMatches: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  bestChain: 0,
  totalBoxesCaptured: 0,
  recentMatches: [],
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage quota errors
  }
}

export function loadStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATS;
  }
}

export function recordMatchStats(record: Omit<MatchRecord, 'id' | 'dateIso'>): PlayerStats {
  const prev = loadStats();
  const entry: MatchRecord = {
    ...record,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    dateIso: new Date().toISOString(),
  };

  const next: PlayerStats = {
    totalMatches: prev.totalMatches + 1,
    wins: prev.wins + (record.winner === 1 ? 1 : 0),
    losses: prev.losses + (record.winner === 2 ? 1 : 0),
    draws: prev.draws + (record.winner === 0 ? 1 : 0),
    bestChain: Math.max(prev.bestChain, record.maxChain),
    totalBoxesCaptured: prev.totalBoxesCaptured + record.p1Score,
    recentMatches: [entry, ...prev.recentMatches].slice(0, 12),
  };

  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(next));
  } catch {
    // ignore storage quota errors
  }
  return next;
}

export function clearStats(): PlayerStats {
  try {
    localStorage.removeItem(STATS_KEY);
  } catch {
    // ignore
  }
  return DEFAULT_STATS;
}

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { GRID_PRESETS, NeonTheme } from '../config/assetsConfig';
import { AiDifficulty } from '../engine/aiOpponent';
import { CyberBackground } from '../components/CyberBackground';
import { CyberGlassPanel } from '../components/CyberControls';
import { soundEngine } from '../audio/soundEngine';

interface SetupScreenProps {
  theme: NeonTheme;
  mode: 'local' | 'ai';
  gridSize: number;
  difficulty: AiDifficulty;
  onSelectGridSize: (size: number) => void;
  onSelectDifficulty: (diff: AiDifficulty) => void;
  onBack: () => void;
  onStartMatch: () => void;
}

const TIER_COLORS: Record<'amber' | 'cyan' | 'violet', { border: string; bg: string; glow: string }> = {
  amber: {
    border: '#FF5A1F',
    bg: 'rgba(255, 90, 31, 0.14)',
    glow: 'rgba(255, 90, 31, 0.65)',
  },
  cyan: {
    border: '#00F0FF',
    bg: 'rgba(0, 240, 255, 0.14)',
    glow: 'rgba(0, 240, 255, 0.7)',
  },
  violet: {
    border: '#7C5CFF',
    bg: 'rgba(124, 92, 255, 0.16)',
    glow: 'rgba(124, 92, 255, 0.65)',
  },
};

export const SetupScreen: React.FC<SetupScreenProps> = ({
  theme,
  mode,
  gridSize,
  difficulty,
  onSelectGridSize,
  onSelectDifficulty,
  onBack,
  onStartMatch,
}) => {
  const difficulties: { id: AiDifficulty; label: string; color: string }[] = [
    { id: 'easy', label: 'آسان', color: '#4ade80' },
    { id: 'medium', label: 'متوسط', color: theme.p2 },
    { id: 'hard', label: 'سخت', color: theme.p1 },
  ];

  return (
    <div className="relative flex h-full w-full flex-col justify-between px-5 pt-4 pb-5 overflow-y-auto cyber-scroll">
      <CyberBackground theme={theme} showFloorGrid showBeams />

      {/* Top Cyber Header Bar */}
      <div className="relative z-10 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-cyan-200/70">صفحه آماده‌سازی نبرد</span>
          <button
            type="button"
            onClick={() => {
              soundEngine.playBackClick();
              onBack();
            }}
            className="flex items-center gap-1 rounded-full border border-cyan-400/40 bg-black/50 px-3 py-1.5 text-sm font-bold text-cyan-300 transition-all hover:border-cyan-300 active:scale-95 cursor-pointer"
            style={{ boxShadow: `0 0 12px ${theme.p2}44` }}
          >
            <span>بازگشت</span>
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <h1 className="text-center text-3xl font-black neon-text-cyan tracking-tight mt-0.5">
          آماده‌سازی نبرد
        </h1>
      </div>

      {/* Grid Size Selector (2-Column Glowing Chamfered Cards — NO board preview icons inside) */}
      <div className="relative z-10 flex flex-col gap-2.5 mt-3">
        <div className="flex items-center gap-2">
          <span
            className="h-4 w-1.5 rounded-full"
            style={{ backgroundColor: theme.p2, boxShadow: `0 0 8px ${theme.p2}` }}
          />
          <h2 className="text-sm font-bold text-slate-100">انتخاب سایز زمین</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {GRID_PRESETS.map((preset) => {
            const isSelected = gridSize === preset.size;
            const tc = TIER_COLORS[preset.tier];

            return (
              <button
                key={preset.size}
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  onSelectGridSize(preset.size);
                }}
                className="relative group transition-transform duration-150 active:scale-[0.97] hover:scale-[1.02] cursor-pointer"
              >
                {/* Selected outer targeting corner brackets matching mockup */}
                {isSelected && (
                  <>
                    <span
                      className="pointer-events-none absolute -top-1 -right-1 h-3.5 w-3.5 border-t-2 border-r-2 z-20"
                      style={{ borderColor: tc.border }}
                    />
                    <span
                      className="pointer-events-none absolute -bottom-1 -left-1 h-3.5 w-3.5 border-b-2 border-l-2 z-20"
                      style={{ borderColor: tc.border }}
                    />
                  </>
                )}

                <CyberGlassPanel
                  colorStart={isSelected ? '#ffffff' : tc.border}
                  colorEnd={tc.border}
                  doubleFrame={false}
                  chamferPx={12}
                  innerClassName="relative flex flex-col items-center justify-center py-3.5 px-2"
                  tintBg={
                    isSelected
                      ? `linear-gradient(180deg, ${tc.border}32 0%, rgba(4,12,24,0.28) 100%)`
                      : `linear-gradient(180deg, ${tc.bg} 0%, rgba(4,10,20,0.24) 100%)`
                  }
                >
                  {isSelected && (
                    <span
                      className="absolute top-0 left-3 rounded-b-md px-2 py-0.5 text-[10px] font-extrabold text-slate-950"
                      style={{ backgroundColor: tc.border }}
                    >
                      انتخاب شده
                    </span>
                  )}

                  <span
                    className="text-xl font-black tracking-wide text-white tabular-nums"
                    dir="ltr"
                    style={{
                      textShadow: isSelected ? `0 0 12px ${tc.border}` : `0 0 6px ${tc.border}88`,
                    }}
                  >
                    {preset.labelFa}
                  </span>
                  <span className="mt-0.5 text-xs font-semibold text-slate-100/95">
                    {preset.subtitleFa}
                  </span>
                </CyberGlassPanel>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Difficulty Selector (shown only when VS AI mode is active) */}
      {mode === 'ai' ? (
        <div className="relative z-10 flex flex-col gap-2.5 mt-3">
          <div className="flex items-center gap-2">
            <span
              className="h-4 w-1.5 rounded-full"
              style={{ backgroundColor: theme.p2, boxShadow: `0 0 8px ${theme.p2}` }}
            />
            <h2 className="text-sm font-bold text-slate-100">سطح دشواری (هوش مصنوعی)</h2>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {difficulties.map((d) => {
              const isSelected = difficulty === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    onSelectDifficulty(d.id);
                  }}
                  className="relative flex flex-col items-center cursor-pointer transition-transform duration-150 active:scale-95"
                >
                  <div
                    className="w-full rounded-full border-2 py-2.5 text-center text-sm font-extrabold transition-colors"
                    style={{
                      borderColor: isSelected ? d.color : `${d.color}66`,
                      background: isSelected
                        ? `linear-gradient(180deg, ${d.color}32 0%, rgba(6,12,24,0.42) 100%)`
                        : 'rgba(6, 12, 24, 0.34)',
                      color: isSelected ? '#ffffff' : 'rgba(226, 232, 240, 0.85)',
                      boxShadow: isSelected
                        ? `0 0 14px ${d.color}99, inset 0 0 10px ${d.color}40`
                        : `0 0 6px ${d.color}22`,
                    }}
                  >
                    {d.label}
                  </div>
                  {isSelected && (
                    <span
                      className="mt-1 rounded-sm px-2 py-[1px] text-[9px] font-black text-slate-950"
                      style={{ backgroundColor: d.color }}
                    >
                      انتخاب شده
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="relative z-10 mt-3 rounded-2xl border border-cyan-400/25 bg-black/32 px-4 py-3 text-center">
          <p className="text-xs font-semibold text-cyan-200/95">
            دو بازیکن به‌صورت نوبتی روی یک دستگاه با یکدیگر رقابت می‌کنند.
          </p>
        </div>
      )}

      {/* Pulsing Primary CTA Button: شروع نبرد */}
      <div className="relative z-10 flex flex-col items-center gap-2.5 mt-4">
        <button
          type="button"
          onClick={() => {
            soundEngine.playUiClick();
            onStartMatch();
          }}
          className="neon-ring-border animate-pulse-cta relative flex w-full max-w-[310px] items-center justify-center gap-3 rounded-full py-3.5 px-6 cursor-pointer transition-transform active:scale-95"
          style={
            {
              '--ring-gradient': `linear-gradient(90deg, ${theme.p2}, ${theme.p1}, ${theme.p2})`,
              '--ring-width': '2.2px',
              background: `linear-gradient(180deg, ${theme.p1}30 0%, rgba(16, 4, 14, 0.42) 100%)`,
            } as React.CSSProperties
          }
        >
          <span
            className="text-2xl font-black tracking-wide"
            style={{
              color: '#fff5f7',
              textShadow: `0 0 12px ${theme.p1}, 0 0 26px ${theme.p1}`,
            }}
          >
            شروع نبرد
          </span>
          <span
            className="text-2xl font-black leading-none"
            style={{ color: theme.p2, textShadow: `0 0 10px ${theme.p2}` }}
          >
            «
          </span>
        </button>

        <p className="text-xs font-medium text-slate-300/85">
          حالت بازی: {mode === 'ai' ? 'نبرد با هوش مصنوعی' : 'نبرد محلی (دو نفره)'}
        </p>
      </div>
    </div>
  );
};

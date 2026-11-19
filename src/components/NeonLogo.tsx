import React from 'react';
import { NeonTheme } from '../config/assetsConfig';

interface NeonLogoProps {
  theme: NeonTheme;
  compact?: boolean;
}

export const NeonLogo: React.FC<NeonLogoProps> = React.memo(({ theme, compact = false }) => {
  return (
    <div className={`relative flex flex-col items-center select-none ${compact ? 'gap-1' : 'gap-2'}`}>
      {/* Ambient radial flare behind logo (zero blur filter pass!) */}
      <div
        className="pointer-events-none absolute -inset-x-10 -inset-y-6 opacity-50"
        style={{
          background: `radial-gradient(ellipse at 68% 42%, ${theme.p2}55 0%, transparent 52%), radial-gradient(ellipse at 32% 48%, ${theme.p1}55 0%, transparent 52%)`,
        }}
      />

      <h1
        className={`relative flex items-center justify-center gap-3 font-black tracking-tight ${
          compact ? 'text-[2.45rem]' : 'text-[3.1rem] sm:text-[3.35rem]'
        } leading-none`}
      >
        {/* "نقطه" in Electric Cyan hollow-neon style */}
        <span
          className="relative"
          style={{
            color: '#e8ffff',
            WebkitTextStroke: `1.5px ${theme.p2}`,
            textShadow: `0 0 8px ${theme.p2}, 0 0 22px ${theme.p2}, 0 0 42px ${theme.p2}99`,
          }}
        >
          نقطه
          {/* Corner flare */}
          <span
            className="pointer-events-none absolute -top-1 -left-1 h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: '#ffffff', boxShadow: `0 0 12px 3px ${theme.p2}` }}
          />
        </span>

        {/* "بازی" in Crimson Red hollow-neon style */}
        <span
          className="relative"
          style={{
            color: '#ffecef',
            WebkitTextStroke: `1.5px ${theme.p1}`,
            textShadow: `0 0 8px ${theme.p1}, 0 0 22px ${theme.p1}, 0 0 42px ${theme.p1}99`,
          }}
        >
          بازی
        </span>
      </h1>

      <p
        className={`relative font-extrabold tracking-wide ${
          compact ? 'text-lg' : 'text-2xl'
        }`}
        style={{
          color: '#f0ffff',
          textShadow: `0 0 10px ${theme.p2}cc, 0 0 24px ${theme.p2}66`,
        }}
      >
        نبرد سایبری
      </p>
    </div>
  );
});

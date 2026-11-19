import React from 'react';
import { NeonTheme } from '../config/assetsConfig';

interface NeonLogoProps {
  theme: NeonTheme;
  compact?: boolean;
}

export const NeonLogo: React.FC<NeonLogoProps> = ({ theme, compact = false }) => {
  return (
    <div className={`relative flex flex-col items-center select-none ${compact ? 'gap-1' : 'gap-2'}`}>
      {/* Ambient flare behind logo */}
      <div
        className="pointer-events-none absolute -inset-x-8 -inset-y-4 blur-2xl opacity-45"
        style={{
          background: `radial-gradient(circle at 65% 40%, ${theme.p2}88 0%, transparent 48%), radial-gradient(circle at 35% 50%, ${theme.p1}88 0%, transparent 48%)`,
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
            className="pointer-events-none absolute -top-1 -left-1 h-2.5 w-2.5 rounded-full blur-[2px]"
            style={{ backgroundColor: '#ffffff', boxShadow: `0 0 14px 4px ${theme.p2}` }}
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
};

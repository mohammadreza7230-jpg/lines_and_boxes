import React from 'react';
import { NeonTheme } from '../config/assetsConfig';

interface CyberBackgroundProps {
  theme: NeonTheme;
  showFloorGrid?: boolean;
  showBeams?: boolean;
  dimmed?: boolean;
}

export const CyberBackground: React.FC<CyberBackgroundProps> = React.memo(
  ({ theme, showFloorGrid = true, showBeams = true, dimmed = false }) => {
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden bg-[#02050d]"
        style={{ contain: 'strict' }}
      >
        {/* Deep ambient radial cyber glow */}
        <div
          className="absolute inset-0"
          style={{
            opacity: dimmed ? 0.55 : 0.92,
            background: `
              radial-gradient(circle at 22% 14%, ${theme.p1Soft} 0%, transparent 45%),
              radial-gradient(circle at 82% 24%, ${theme.p2Soft} 0%, transparent 48%),
              radial-gradient(circle at 50% 72%, rgba(0, 240, 255, 0.14) 0%, transparent 55%)
            `,
          }}
        />

        {/* Diagonal Beat Saber laser beams from top corners */}
        {showBeams && (
          <>
            <div
              className="absolute -top-10 left-[18%] h-[42%] w-[2px] origin-top -rotate-[22deg] opacity-75"
              style={{
                background: `linear-gradient(to bottom, ${theme.p1}, transparent)`,
                boxShadow: `0 0 12px ${theme.p1}`,
              }}
            />
            <div
              className="absolute -top-10 right-[22%] h-[42%] w-[2px] origin-top rotate-[24deg] opacity-70"
              style={{
                background: `linear-gradient(to bottom, ${theme.p1}, transparent)`,
                boxShadow: `0 0 12px ${theme.p1}`,
              }}
            />
            <div
              className="absolute top-[22%] -left-8 h-[2px] w-[35%] rotate-[-48deg] opacity-80"
              style={{
                background: `linear-gradient(to right, ${theme.p2}, transparent)`,
                boxShadow: `0 0 12px ${theme.p2}`,
              }}
            />
            <div
              className="absolute bottom-[28%] -right-8 h-[2px] w-[38%] rotate-[40deg] opacity-75"
              style={{
                background: `linear-gradient(to left, ${theme.p1}, transparent)`,
                boxShadow: `0 0 12px ${theme.p1}`,
              }}
            />
          </>
        )}

        {/* Horizon glow + GPU-composited Perspective Floor Grid (NO mask-image, NO blur-xl!) */}
        {showFloorGrid && (
          <div className="absolute inset-x-0 bottom-0 h-[40%] overflow-hidden">
            {/* Soft horizon radial glow (zero filter blur pass) */}
            <div
              className="absolute inset-x-0 -top-8 h-24"
              style={{
                background: `radial-gradient(ellipse at 50% 60%, ${theme.p2}66 0%, transparent 70%)`,
              }}
            />
            <div
              className="absolute inset-x-0 top-0 h-[2px]"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${theme.p2} 50%, transparent 100%)`,
                boxShadow: `0 0 16px ${theme.p2}`,
              }}
            />
            {/* Static perspective frame with GPU-translated inner grid */}
            <div className="cyber-floor-perspective absolute -inset-x-[45%] top-0 h-[200%] overflow-hidden">
              <div
                className="cyber-floor-grid absolute inset-x-0 -top-[44px] bottom-0 opacity-90"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 0 0, #ffffffcc 0, ${theme.p2}99 2px, transparent 4.5px),
                    linear-gradient(to right, ${theme.p2}99 1px, transparent 1px),
                    linear-gradient(to bottom, ${theme.p2}99 1px, transparent 1px)
                  `,
                }}
              />
            </div>
            {/* Lightweight bottom depth fade (replaces expensive CSS mask-image) */}
            <div
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(circle at 95% 40%, ${theme.p1}38 0%, transparent 48%),
                  linear-gradient(to bottom, transparent 0%, rgba(2,5,13,0.12) 65%, rgba(2,5,13,0.68) 100%)
                `,
              }}
            />
          </div>
        )}

        {/* Subtle outer cyberpunk chassis frame lines */}
        <svg
          className="absolute inset-2 h-[calc(100%-16px)] w-[calc(100%-16px)] opacity-30"
          viewBox="0 0 390 820"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M 18 2 L 130 2 L 146 14 L 244 14 L 260 2 L 372 2 L 388 18 L 388 802 L 372 818 L 250 818 L 236 808 L 154 808 L 140 818 L 18 818 L 2 802 L 2 18 Z"
            stroke="url(#cyberFrameGrad)"
            strokeWidth="1.5"
          />
          <defs>
            <linearGradient id="cyberFrameGrad" x1="0" y1="0" x2="390" y2="820" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={theme.p1} />
              <stop offset="50%" stopColor={theme.p2} />
              <stop offset="100%" stopColor={theme.p1} />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }
);

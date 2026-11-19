import React, { useId } from 'react';
import { Bot, User } from 'lucide-react';
import { NeonTheme } from '../config/assetsConfig';
import { SpriteSlice } from './SpriteView';

export type CapsuleVariant = 'dual' | 'cyan' | 'crimson' | 'violet' | 'glass';

interface CyberCapsuleButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: CapsuleVariant;
  theme: NeonTheme;
  active?: boolean;
  showChevrons?: boolean;
  className?: string;
}

export const CyberCapsuleButton: React.FC<CyberCapsuleButtonProps> = React.memo(
  ({
    children,
    onClick,
    variant = 'cyan',
    theme,
    active = false,
    showChevrons = false,
    className = '',
  }) => {
    const styles: Record<
      CapsuleVariant,
      { border: string; bg: string; glow: string; innerArc: string }
    > = {
      dual: {
        border: `linear-gradient(90deg, ${theme.p2}, rgba(255,255,255,0.75) 50%, ${theme.p1})`,
        bg: `linear-gradient(90deg, ${theme.p2}1f 0%, rgba(4,10,22,0.34) 50%, ${theme.p1}24 100%)`,
        glow: `0 0 14px ${theme.p2}55, 0 0 14px ${theme.p1}44, inset 0 0 14px rgba(255,255,255,0.06)`,
        innerArc: theme.p2,
      },
      cyan: {
        border: `linear-gradient(90deg, ${theme.p2}, #b2fcff 50%, ${theme.p2})`,
        bg: `linear-gradient(180deg, ${theme.p2}22 0%, rgba(4,16,28,0.34) 100%)`,
        glow: `0 0 16px ${theme.p2}70, inset 0 0 14px ${theme.p2}26`,
        innerArc: theme.p2,
      },
      crimson: {
        border: `linear-gradient(90deg, ${theme.p1}, #ff8599 50%, ${theme.p1})`,
        bg: `linear-gradient(180deg, ${theme.p1}22 0%, rgba(28,6,14,0.36) 100%)`,
        glow: `0 0 16px ${theme.p1}70, inset 0 0 14px ${theme.p1}26`,
        innerArc: theme.p1,
      },
      violet: {
        border: 'linear-gradient(90deg, #7C5CFF, #c4b5fd 50%, #7C5CFF)',
        bg: 'linear-gradient(180deg, rgba(124,92,255,0.22) 0%, rgba(14,10,34,0.36) 100%)',
        glow: '0 0 16px rgba(124,92,255,0.65), inset 0 0 14px rgba(124,92,255,0.22)',
        innerArc: '#a78bfa',
      },
      glass: {
        border: `linear-gradient(90deg, ${theme.p2}aa, rgba(255,255,255,0.45) 50%, ${theme.p1}aa)`,
        bg: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(6,12,24,0.28) 100%)',
        glow: `0 0 12px rgba(0,240,255,0.26), inset 0 0 10px rgba(255,255,255,0.05)`,
        innerArc: theme.p2,
      },
    };

    const s = styles[variant];

    return (
      <button
        type="button"
        onClick={onClick}
        className={`neon-ring-border group relative flex w-full min-h-[54px] items-center justify-center rounded-full px-6 py-3 overflow-hidden transition-transform duration-150 active:scale-[0.97] hover:scale-[1.015] focus-visible:outline-2 focus-visible:outline-cyan-400 cursor-pointer ${className}`}
        style={
          {
            '--ring-gradient': s.border,
            '--ring-width': '1.75px',
            background: s.bg,
            boxShadow: active ? `${s.glow}, 0 0 22px ${theme.p2}75` : s.glow,
          } as React.CSSProperties
        }
      >
        {/* Subtle top glass specular highlight */}
        <span className="pointer-events-none absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/45 to-transparent" />

        {/* Inner double-ring end arcs matching Beat Saber mockup */}
        <span
          className="pointer-events-none absolute right-2 top-1.5 bottom-1.5 w-4 rounded-r-full border-r-2 border-y border-transparent opacity-80"
          style={{ borderRightColor: variant === 'dual' ? theme.p1 : s.innerArc }}
        />
        <span
          className="pointer-events-none absolute left-2 top-1.5 bottom-1.5 w-4 rounded-l-full border-l-2 border-y border-transparent opacity-80"
          style={{ borderLeftColor: s.innerArc }}
        />

        {/* Decorative neon chevrons matching Main Menu primary buttons */}
        {showChevrons && (
          <>
            <span
              className="pointer-events-none absolute right-5 flex items-center text-sm font-black tracking-tighter opacity-95"
              style={{ color: theme.p1, textShadow: `0 0 8px ${theme.p1}` }}
            >
              ‹‹
            </span>
            <span
              className="pointer-events-none absolute left-5 flex items-center text-sm font-black tracking-tighter opacity-95"
              style={{ color: theme.p2, textShadow: `0 0 8px ${theme.p2}` }}
            >
              ››
            </span>
          </>
        )}

        <span className="relative z-10 whitespace-nowrap text-[17px] font-bold tracking-wide text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.95)]">
          {children}
        </span>
      </button>
    );
  }
);

interface CyberGlassPanelProps {
  children: React.ReactNode;
  colorStart: string;
  colorEnd: string;
  colorMid?: string;
  className?: string;
  innerClassName?: string;
  tintBg?: string;
  doubleFrame?: boolean;
  chamferPx?: number;
}

/**
 * GPU-friendly true-transparent chamfered glass panel with hollow SVG neon frame.
 * Zero expensive CSS `filter: drop-shadow(...)` or stacked per-card `backdrop-filter: blur(...)`
 * so Android WebView renders 6+ cards at locked 60-120fps!
 */
export const CyberGlassPanel: React.FC<CyberGlassPanelProps> = ({
  children,
  colorStart,
  colorEnd,
  colorMid,
  className = '',
  innerClassName = '',
  tintBg = 'rgba(5, 10, 22, 0.42)',
  doubleFrame = true,
  chamferPx = 14,
}) => {
  const gradId = useId().replace(/:/g, '');
  const clipPoly = `polygon(${chamferPx}px 0%, calc(100% - ${chamferPx}px) 0%, 100% ${chamferPx}px, 100% calc(100% - ${chamferPx}px), calc(100% - ${chamferPx}px) 100%, ${chamferPx}px 100%, 0% calc(100% - ${chamferPx}px), 0% ${chamferPx}px)`;

  return (
    <div className={`relative ${className}`}>
      {/* Translucent glass body */}
      <div
        className={`relative h-full w-full overflow-hidden ${innerClassName}`}
        style={{
          clipPath: clipPoly,
          background: tintBg,
        }}
      >
        {children}
      </div>

      {/* Crisp SVG neon gradient chamfered frame with lightweight outer glow stroke (zero filter pass!) */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id={`grad-${gradId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorStart} />
            {colorMid && <stop offset="50%" stopColor={colorMid} />}
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>
        </defs>
        {/* Soft neon outer halo stroke */}
        <polygon
          points="5,0.5 95,0.5 99.5,3.5 99.5,96.5 95,99.5 5,99.5 0.5,96.5 0.5,3.5"
          stroke={`url(#grad-${gradId})`}
          strokeWidth="6"
          strokeOpacity="0.22"
          vectorEffect="non-scaling-stroke"
        />
        {/* Sharp bright neon edge */}
        <polygon
          points="5,0.5 95,0.5 99.5,3.5 99.5,96.5 95,99.5 5,99.5 0.5,96.5 0.5,3.5"
          stroke={`url(#grad-${gradId})`}
          strokeWidth="2.2"
          vectorEffect="non-scaling-stroke"
        />
        {doubleFrame && (
          <polygon
            points="6.5,1.8 93.5,1.8 97.8,4.6 97.8,95.4 93.5,98.2 6.5,98.2 2.2,95.4 2.2,4.6"
            stroke={`url(#grad-${gradId})`}
            strokeWidth="1"
            strokeOpacity="0.45"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    </div>
  );
};

interface CyberAvatarProps {
  kind: 'p1' | 'p2' | 'ai';
  theme: NeonTheme;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
}

export const CyberAvatar: React.FC<CyberAvatarProps> = React.memo(
  ({ kind, theme, size = 'md', active = false }) => {
    const color = kind === 'p1' ? theme.p1 : theme.p2;
    const spriteKey =
      kind === 'p1' ? 'avatarP1Human' : kind === 'ai' ? 'avatarAiRobot' : 'avatarP2Visor';

    const dims =
      size === 'sm' ? 'h-10 w-10' : size === 'lg' ? 'h-16 w-16' : 'h-12 w-12';

    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-xl border transition-colors duration-200 bg-black/50 ${dims}`}
        style={{
          borderColor: active ? color : `${color}88`,
          boxShadow: active ? `0 0 12px ${color}` : `0 0 6px ${color}44`,
        }}
      >
        <SpriteSlice
          sprite={spriteKey}
          blendScreen={false}
          className="h-full w-full"
          alt={kind === 'p1' ? 'آواتار بازیکن ۱' : kind === 'ai' ? 'آواتار هوش مصنوعی' : 'آواتار بازیکن ۲'}
          fallback={
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                background: `radial-gradient(circle at 50% 35%, ${color}44, #050814)`,
              }}
            >
              {kind === 'ai' ? (
                <Bot className="h-6 w-6" style={{ color }} />
              ) : (
                <User className="h-6 w-6" style={{ color }} />
              )}
            </div>
          }
        />
      </div>
    );
  }
);

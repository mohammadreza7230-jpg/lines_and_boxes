import React from 'react';
import { Crown } from 'lucide-react';
import { NeonTheme } from '../config/assetsConfig';
import { BoardState } from '../engine/dotsAndBoxes';
import { CyberAvatar, CyberCapsuleButton, CyberGlassPanel } from './CyberControls';
import { soundEngine } from '../audio/soundEngine';
import { formatDurationPersian, toPersianDigits } from '../utils/persian';

interface GameOverModalProps {
  theme: NeonTheme;
  board: BoardState;
  mode: 'local' | 'ai';
  elapsedSeconds: number;
  onRematch: () => void;
  onChangeGrid: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  theme,
  board,
  mode,
  elapsedSeconds,
  onRematch,
  onChangeGrid,
  onMainMenu,
}) => {
  const isVictory = board.winner === 1 || (mode === 'local' && board.winner !== 0);
  const isDraw = board.winner === 0;

  let headerText = 'تساوی!';
  let subLine1 = 'نبرد کاملاً برابر به پایان رسید';
  let subLine2 = 'امتیاز هر دو طرف یکسان شد!';
  let headerGlow = theme.p2;

  if (mode === 'ai') {
    if (board.winner === 1) {
      headerText = 'پیروزی!';
      subLine1 = 'هوش مصنوعی شکست خورد';
      subLine2 = 'شما برنده شدید!!';
      headerGlow = theme.p2;
    } else if (board.winner === 2) {
      headerText = 'شکست!';
      subLine1 = 'هوش مصنوعی کنترل ماتریس را گرفت';
      subLine2 = 'دوباره تلاش کنید!';
      headerGlow = theme.p1;
    }
  } else {
    if (board.winner === 1) {
      headerText = 'پیروزی!';
      subLine1 = 'بازیکن ۱ فاتح میدان شد';
      subLine2 = 'بازیکن ۱ برنده شد!!';
      headerGlow = theme.p1;
    } else if (board.winner === 2) {
      headerText = 'پیروزی!';
      subLine1 = 'بازیکن ۲ فاتح میدان شد';
      subLine2 = 'بازیکن ۲ برنده شد!!';
      headerGlow = theme.p2;
    }
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/32 px-4 py-5 backdrop-blur-[3.5px] overflow-y-auto cyber-scroll">
      <CyberGlassPanel
        colorStart={theme.p1}
        colorMid={theme.p2}
        colorEnd={theme.p1}
        className="w-full max-w-[352px]"
        innerClassName="flex flex-col items-center px-5 py-6"
        tintBg={`linear-gradient(155deg, ${theme.p1}1a 0%, rgba(4, 9, 20, 0.38) 52%, ${theme.p2}1c 100%)`}
        doubleFrame
      >
          {/* Dynamic Header + Neon Crown */}
          <div className="relative flex flex-col items-center text-center">
            <Crown
              className="pointer-events-none absolute top-7 h-20 w-20 opacity-40"
              style={{
                color: isVictory ? theme.p2 : isDraw ? '#a78bfa' : theme.p1,
                filter: `drop-shadow(0 0 18px ${headerGlow})`,
              }}
            />

            <h2
              className="relative z-10 text-4xl font-black tracking-tight text-white"
              style={{
                textShadow: `0 0 14px ${headerGlow}, 0 0 32px ${headerGlow}`,
              }}
            >
              {headerText}
            </h2>
            <p className="relative z-10 mt-2 text-sm font-bold text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
              {subLine1}
            </p>
            <p
              className="relative z-10 mt-0.5 text-sm font-black"
              style={{
                color: board.winner === 2 && mode === 'ai' ? '#fca5a5' : '#ff5575',
                textShadow: `0 0 12px ${theme.p1}cc`,
              }}
            >
              {subLine2}
            </p>
          </div>

          {/* Final Score Comparison Cards (Translucent neon glass matching mockup) */}
          <div className="mt-5 grid w-full grid-cols-2 gap-3">
            {/* P2 / AI Card */}
            <div
              className="flex flex-col items-center rounded-2xl border-2 px-3 py-3.5 backdrop-blur-[5px]"
              style={{
                borderColor: theme.p2,
                background: `linear-gradient(180deg, ${theme.p2}22 0%, rgba(5,16,28,0.34) 100%)`,
                boxShadow: `0 0 18px ${theme.p2}66, inset 0 0 14px ${theme.p2}24`,
              }}
            >
              <CyberAvatar kind={mode === 'ai' ? 'ai' : 'p2'} theme={theme} size="md" active />
              <span className="mt-2 text-xs font-bold text-slate-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                {mode === 'ai' ? 'هوش مصنوعی' : 'بازیکن ۲'}
              </span>
              <span
                className="mt-0.5 text-3xl font-black tabular-nums"
                style={{ color: '#d6ffff', textShadow: `0 0 16px ${theme.p2}` }}
              >
                {toPersianDigits(board.scores.p2)}
              </span>
            </div>

            {/* P1 Card */}
            <div
              className="flex flex-col items-center rounded-2xl border-2 px-3 py-3.5 backdrop-blur-[5px]"
              style={{
                borderColor: theme.p1,
                background: `linear-gradient(180deg, ${theme.p1}24 0%, rgba(24,6,14,0.36) 100%)`,
                boxShadow: `0 0 18px ${theme.p1}66, inset 0 0 14px ${theme.p1}24`,
              }}
            >
              <CyberAvatar kind="p1" theme={theme} size="md" active />
              <span className="mt-2 text-xs font-bold text-slate-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                بازیکن ۱
              </span>
              <span
                className="mt-0.5 text-3xl font-black tabular-nums"
                style={{ color: '#ffe0e7', textShadow: `0 0 16px ${theme.p1}` }}
              >
                {toPersianDigits(board.scores.p1)}
              </span>
            </div>
          </div>

          {/* Match Stats Summary — clean translucent overlay matching mockup */}
          <div className="mt-4 w-full divide-y divide-white/12 px-2 py-1">
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="font-bold text-slate-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                بزرگترین زنجیره
              </span>
              <span className="font-black text-cyan-200 tabular-nums drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">
                {toPersianDigits(board.maxChain)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="font-bold text-slate-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                مدت زمان
              </span>
              <span
                className="font-black text-cyan-200 tabular-nums drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]"
                dir="ltr"
              >
                {formatDurationPersian(elapsedSeconds)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="font-bold text-slate-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                تعداد کل حرکات
              </span>
              <span className="font-black text-cyan-200 tabular-nums drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">
                {toPersianDigits(board.totalMoves)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex w-full flex-col gap-2.5">
            <CyberCapsuleButton
              theme={theme}
              variant="cyan"
              onClick={() => {
                soundEngine.playUiClick();
                onRematch();
              }}
            >
              بازی مجدد
            </CyberCapsuleButton>

            <CyberCapsuleButton
              theme={theme}
              variant="violet"
              onClick={() => {
                soundEngine.playUiClick();
                onChangeGrid();
              }}
            >
              تغییر سایز زمین
            </CyberCapsuleButton>

            <CyberCapsuleButton
              theme={theme}
              variant="dual"
              onClick={() => {
                soundEngine.playBackClick();
                onMainMenu();
              }}
            >
              منوی اصلی
            </CyberCapsuleButton>
          </div>
      </CyberGlassPanel>
    </div>
  );
};

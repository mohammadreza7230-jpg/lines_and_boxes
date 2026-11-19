import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, RotateCcw, Sparkles } from 'lucide-react';
import { NeonTheme } from '../config/assetsConfig';
import {
  BoardState,
  CapturedBoxCoord,
  EdgeMove,
  PlayerId,
  applyMove,
  createInitialBoard,
  getAllAvailableMoves,
} from '../engine/dotsAndBoxes';
import { AiDifficulty, chooseAiMove } from '../engine/aiOpponent';
import { CyberBackground } from '../components/CyberBackground';
import { CyberAvatar } from '../components/CyberControls';
import { GameBoardCanvas } from '../components/GameBoardCanvas';
import { SpriteSlice } from '../components/SpriteView';
import { soundEngine } from '../audio/soundEngine';
import { GameSettings, toPersianDigits } from '../utils/persian';

interface GameplayScreenProps {
  theme: NeonTheme;
  settings: GameSettings;
  mode: 'local' | 'ai';
  gridSize: number;
  difficulty: AiDifficulty;
  isPaused: boolean;
  isModalOpen: boolean;
  board: BoardState;
  onUpdateBoard: (next: BoardState) => void;
  onPause: () => void;
  onRestart: () => void;
  onOpenCoach: () => void;
  onMatchFinished: (finalBoard: BoardState, elapsedSeconds: number) => void;
}

interface ComboToast {
  id: number;
  text: string;
  player: PlayerId;
}

export const GameplayScreen: React.FC<GameplayScreenProps> = ({
  theme,
  settings,
  mode,
  gridSize,
  difficulty,
  isPaused,
  isModalOpen,
  board,
  onUpdateBoard,
  onPause,
  onRestart,
  onOpenCoach,
  onMatchFinished,
}) => {
  const [timeLeft, setTimeLeft] = useState(settings.turnTimerSeconds);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [comboToast, setComboToast] = useState<ComboToast | null>(null);
  const [fxTrigger, setFxTrigger] = useState<{
    id: number;
    move: EdgeMove | null;
    player: PlayerId;
    capturedBoxes: CapturedBoxCoord[];
  } | null>(null);

  const fxCounterRef = useRef(0);
  const matchReportedRef = useRef(false);
  const boardRef = useRef(board);
  boardRef.current = board;
  const elapsedRef = useRef(elapsedSeconds);
  elapsedRef.current = elapsedSeconds;

  // Reset timers whenever a fresh match starts (totalMoves === 0)
  useEffect(() => {
    if (board.totalMoves === 0) {
      setTimeLeft(settings.turnTimerSeconds);
      setElapsedSeconds(0);
      setComboToast(null);
      matchReportedRef.current = false;
    }
  }, [board.totalMoves, gridSize, settings.turnTimerSeconds]);

  // Execute a move cleanly (used by human click, AI move, or timeout auto-move)
  const commitMove = useCallback(
    (move: EdgeMove) => {
      const current = boardRef.current;
      const res = applyMove(current, move);
      if (!res) return;

      const movingPlayer = current.currentPlayer;
      fxCounterRef.current += 1;
      setFxTrigger({
        id: fxCounterRef.current,
        move,
        player: movingPlayer,
        capturedBoxes: res.capturedBoxes,
      });

      if (res.capturedBoxes.length > 0) {
        soundEngine.playBoxCapture(res.comboCount, movingPlayer);
        if (res.comboCount >= 2) {
          const prefix = res.comboCount >= 4 ? 'فوق‌العاده! ' : '';
          setComboToast({
            id: fxCounterRef.current,
            text: `${prefix}توالی +${toPersianDigits(res.comboCount)}`,
            player: movingPlayer,
          });
        }
      } else {
        soundEngine.playLaserDraw(movingPlayer);
      }

      setTimeLeft(settings.turnTimerSeconds);
      onUpdateBoard(res.nextState);

      if (res.nextState.isGameOver && !matchReportedRef.current) {
        matchReportedRef.current = true;
        setTimeout(() => {
          if (res.nextState.winner === 1) soundEngine.playVictory();
          else if (res.nextState.winner === 2) {
            if (mode === 'ai') soundEngine.playDefeat();
            else soundEngine.playVictory();
          } else {
            soundEngine.playDraw();
          }
          onMatchFinished(res.nextState, elapsedRef.current);
        }, 420);
      }
    },
    [mode, onMatchFinished, onUpdateBoard, settings.turnTimerSeconds]
  );

  // Elapsed match duration clock
  useEffect(() => {
    if (isPaused || isModalOpen || board.isGameOver) return;
    const id = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [isPaused, isModalOpen, board.isGameOver]);

  // Turn countdown timer (15s default)
  useEffect(() => {
    if (!settings.turnTimerEnabled || isPaused || isModalOpen || board.isGameOver) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-play a move when timer expires so gameplay never stalls
          const current = boardRef.current;
          if (!current.isGameOver) {
            const autoMove =
              chooseAiMove(current, 'medium') ?? getAllAvailableMoves(current)[0];
            if (autoMove) {
              setTimeout(() => commitMove(autoMove), 0);
            }
          }
          return settings.turnTimerSeconds;
        }
        if (prev <= 4 && prev > 1) {
          soundEngine.playTimerWarning();
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [
    settings.turnTimerEnabled,
    settings.turnTimerSeconds,
    isPaused,
    isModalOpen,
    board.isGameOver,
    commitMove,
  ]);

  // AI Turn Orchestrator (realistic pacing + smooth chain-capture stepping)
  useEffect(() => {
    if (
      mode !== 'ai' ||
      board.currentPlayer !== 2 ||
      board.isGameOver ||
      isPaused ||
      isModalOpen
    ) {
      return;
    }

    const delay = board.currentChain > 0 ? 320 : 520;
    const timer = setTimeout(() => {
      const current = boardRef.current;
      if (current.currentPlayer !== 2 || current.isGameOver) return;
      const aiMove = chooseAiMove(current, difficulty);
      if (aiMove) {
        commitMove(aiMove);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [
    mode,
    board.currentPlayer,
    board.totalMoves,
    board.currentChain,
    board.isGameOver,
    difficulty,
    isPaused,
    isModalOpen,
    commitMove,
  ]);

  const isHumanTurn =
    !board.isGameOver &&
    !isPaused &&
    !isModalOpen &&
    (mode === 'local' || board.currentPlayer === 1);

  const p2Label = mode === 'ai' ? 'هوش مصنوعی' : 'بازیکن ۲';
  const activeTurnLabel = board.isGameOver
    ? 'پایان نبرد'
    : board.currentPlayer === 1
      ? 'نوبت بازیکن ۱'
      : mode === 'ai'
        ? 'نوبت هوش مصنوعی'
        : 'نوبت بازیکن ۲';

  const timerRatio = settings.turnTimerEnabled
    ? Math.max(0, Math.min(1, timeLeft / settings.turnTimerSeconds))
    : 1;
  const timerCircumference = 2 * Math.PI * 24;
  const timerOffset = timerCircumference * (1 - timerRatio);
  const timerColor =
    timeLeft <= 4 && settings.turnTimerEnabled
      ? theme.p1
      : board.currentPlayer === 1
        ? theme.p1
        : theme.p2;

  return (
    <div className="relative flex h-full w-full flex-col justify-between px-3.5 pt-3.5 pb-4 overflow-hidden">
      <CyberBackground theme={theme} showFloorGrid={false} showBeams={false} dimmed />

      {/* TOP HUD: Player 1 Card | Radial Turn Timer & Arrow | Player 2/AI Card */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        {/* Player 2 / AI Card (Right side in RTL -> wait: in mockup P1 is top-left, P2/AI is top-right!) */}
        {/* In dir="rtl", first flex child is RIGHT, last flex child is LEFT. Let's match the mockup exact positions: AI/P2 on right, P1 on left! */}
        <div
          className="flex flex-1 items-center justify-between gap-2 rounded-2xl border-2 px-2.5 py-2 transition-colors duration-200"
          style={{
            borderColor: board.currentPlayer === 2 ? theme.p2 : `${theme.p2}55`,
            background:
              board.currentPlayer === 2
                ? `linear-gradient(135deg, ${theme.p2}22 0%, rgba(5,16,28,0.42) 100%)`
                : 'rgba(6, 14, 24, 0.32)',
            boxShadow:
              board.currentPlayer === 2
                ? `0 0 14px ${theme.p2}77, inset 0 0 10px ${theme.p2}28`
                : `0 0 6px ${theme.p2}22`,
          }}
        >
          <CyberAvatar
            kind={mode === 'ai' ? 'ai' : 'p2'}
            theme={theme}
            size="md"
            active={board.currentPlayer === 2}
          />
          <div className="flex flex-col items-center flex-1 min-w-0">
            <span className="text-[11px] font-bold text-slate-200 truncate">{p2Label}</span>
            <span
              className="text-2xl font-black leading-tight tabular-nums"
              style={{
                color: '#d8ffff',
                textShadow: `0 0 10px ${theme.p2}`,
              }}
            >
              {toPersianDigits(board.scores.p2)}
            </span>
          </div>
        </div>

        {/* Center 15s Circular Countdown Timer + Directional Turn Arrow */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="rgba(4, 10, 22, 0.4)"
                stroke="rgba(255, 255, 255, 0.14)"
                strokeWidth="3.5"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke={timerColor}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={timerCircumference}
                strokeDashoffset={timerOffset}
                style={{
                  transition: 'stroke-dashoffset 0.35s linear',
                }}
              />
            </svg>
            <span
              className="absolute text-lg font-black tabular-nums"
              style={{
                color: '#ffffff',
                textShadow: `0 0 8px ${timerColor}`,
              }}
            >
              {settings.turnTimerEnabled ? toPersianDigits(timeLeft) : '∞'}
            </span>
          </div>

          {/* Glowing Turn Indicator Arrow pointing toward active player */}
          <div
            className="mt-0.5 flex h-4 w-11 items-center justify-center transition-transform duration-300"
            style={{
              transform: board.currentPlayer === 1 ? 'scaleX(-1)' : 'scaleX(1)',
            }}
          >
            <SpriteSlice
              sprite="turnArrow"
              blendScreen
              className="h-4 w-10"
              fallback={
                <span
                  className="text-xs font-black"
                  style={{ color: timerColor, textShadow: `0 0 8px ${timerColor}` }}
                >
                  »
                </span>
              }
            />
          </div>
        </div>

        {/* Player 1 Card (Left side in RTL, matching mockup) */}
        <div
          className="flex flex-1 items-center justify-between gap-2 rounded-2xl border-2 px-2.5 py-2 transition-colors duration-200"
          style={{
            borderColor: board.currentPlayer === 1 ? theme.p1 : `${theme.p1}55`,
            background:
              board.currentPlayer === 1
                ? `linear-gradient(135deg, ${theme.p1}24 0%, rgba(24,6,14,0.44) 100%)`
                : 'rgba(18, 6, 14, 0.32)',
            boxShadow:
              board.currentPlayer === 1
                ? `0 0 14px ${theme.p1}77, inset 0 0 10px ${theme.p1}28`
                : `0 0 6px ${theme.p1}22`,
          }}
        >
          <div className="flex flex-col items-center flex-1 min-w-0">
            <span className="text-[11px] font-bold text-slate-200 truncate">بازیکن ۱</span>
            <span
              className="text-2xl font-black leading-tight tabular-nums"
              style={{
                color: '#ffe4ea',
                textShadow: `0 0 12px ${theme.p1}`,
              }}
            >
              {toPersianDigits(board.scores.p1)}
            </span>
          </div>
          <CyberAvatar
            kind="p1"
            theme={theme}
            size="md"
            active={board.currentPlayer === 1}
          />
        </div>
      </div>

      {/* CENTER BOARD CANVAS */}
      <div className="relative z-10 flex flex-1 items-center justify-center my-2 min-h-0">
        <GameBoardCanvas
          board={board}
          theme={theme}
          highGlow={settings.highGlow}
          interactive={isHumanTurn}
          onSelectEdge={commitMove}
          fxTrigger={fxTrigger}
        />

        {/* Floating Combo Callout (e.g., توالی +۳) */}
        {comboToast && (
          <div
            key={comboToast.id}
            onAnimationEnd={() => setComboToast(null)}
            className="animate-combo-float pointer-events-none absolute top-4 left-1/2 z-30 whitespace-nowrap rounded-full border px-4 py-1.5 text-base font-black"
            style={{
              borderColor: comboToast.player === 1 ? theme.p1 : theme.p2,
              backgroundColor: 'rgba(4, 8, 18, 0.9)',
              color: '#ffffff',
              boxShadow: `0 0 22px ${comboToast.player === 1 ? theme.p1 : theme.p2}`,
              textShadow: `0 0 10px ${comboToast.player === 1 ? theme.p1 : theme.p2}`,
            }}
          >
            {comboToast.text}
          </div>
        )}
      </div>

      {/* BOTTOM CONTROL BAR: Restart (Right in RTL) | Turn Status + Coach | Pause (Left in RTL) */}
      {/* In mockup: Pause ("توقف") on bottom-left, Turn status center, Restart ("تلاش مجدد") on bottom-right! */}
      <div className="relative z-10 flex items-end justify-between gap-2.5 pt-1">
        {/* Restart Button (Bottom-Right in RTL -> matches mockup!) */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playUiClick();
            onRestart();
          }}
          className="flex flex-col items-center gap-1 cursor-pointer transition-transform active:scale-90"
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl border-2 bg-black/32"
            style={{
              borderColor: theme.p2,
              color: theme.p2,
              boxShadow: `0 0 12px ${theme.p2}70, inset 0 0 8px ${theme.p2}22`,
            }}
          >
            <RotateCcw className="h-5 w-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-200 whitespace-nowrap">
            تلاش مجدد
          </span>
        </button>

        {/* Center Active Turn Status Bar + AI Tactical Coach Button */}
        <div className="flex flex-1 items-center gap-2 mb-1">
          <div
            className="flex h-12 flex-1 items-center justify-center rounded-2xl border px-3 transition-colors duration-200"
            style={{
              borderColor:
                board.currentPlayer === 1 ? `${theme.p1}99` : `${theme.p2}99`,
              background: 'rgba(14, 20, 36, 0.44)',
              boxShadow: `0 0 12px ${
                board.currentPlayer === 1 ? theme.p1 : theme.p2
              }33`,
            }}
          >
            <span
              className="text-sm sm:text-base font-extrabold whitespace-nowrap truncate"
              style={{
                color: board.currentPlayer === 1 ? '#ffd6de' : '#d6ffff',
                textShadow: `0 0 8px ${
                  board.currentPlayer === 1 ? theme.p1 : theme.p2
                }99`,
              }}
            >
              {activeTurnLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onOpenCoach();
            }}
            aria-label="مربی تاکتیکی هوشمند"
            title="تحلیل حرکت با مربی هوشمند"
            className="flex h-12 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-400/70 bg-violet-950/35 text-violet-200 transition-transform active:scale-90 hover:border-violet-300 cursor-pointer"
            style={{ boxShadow: '0 0 10px rgba(139, 92, 246, 0.45)' }}
          >
            <Sparkles className="h-5 w-5" />
          </button>
        </div>

        {/* Pause Button (Bottom-Left in RTL -> matches mockup!) */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playUiClick();
            onPause();
          }}
          className="flex flex-col items-center gap-1 cursor-pointer transition-transform active:scale-90"
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl border-2 bg-black/32"
            style={{
              borderColor: theme.p1,
              color: theme.p1,
              boxShadow: `0 0 12px ${theme.p1}70, inset 0 0 8px ${theme.p1}22`,
            }}
          >
            <Pause className="h-5 w-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-200 whitespace-nowrap">
            توقف
          </span>
        </button>
      </div>
    </div>
  );
};

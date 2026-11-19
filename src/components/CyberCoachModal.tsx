import React, { useEffect, useRef, useState } from 'react';
import { Brain, Loader2, Send, Sparkles, X } from 'lucide-react';
import { NeonTheme } from '../config/assetsConfig';
import { BoardState, analyzeBoardForCoach } from '../engine/dotsAndBoxes';
import { AiDifficulty } from '../engine/aiOpponent';
import { CyberGlassPanel } from './CyberControls';
import { soundEngine } from '../audio/soundEngine';
import { toPersianDigits } from '../utils/persian';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  highThinking?: boolean;
  isError?: boolean;
}

interface CyberCoachModalProps {
  theme: NeonTheme;
  activeBoard: BoardState | null;
  mode: 'local' | 'ai';
  difficulty: AiDifficulty;
  onClose: () => void;
}

const INITIAL_WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'model',
  text: 'سلام فرمانده! من مربی تاکتیکی سایبری هستم. می‌توانم وضعیت فعلی زمین نبرد را تحلیل کنم، استراتژی زنجیره‌سازی و تکنیک قربانی دوگانه (Double-Cross) را آموزش دهم و بهترین مسیر پیروزی را به تو نشان دهم.',
};

export const CyberCoachModal: React.FC<CyberCoachModalProps> = ({
  theme,
  activeBoard,
  mode,
  difficulty,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME]);
  const [input, setInput] = useState('');
  const [highThinking, setHighThinking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendPrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || isLoading) return;

    soundEngine.playUiClick();

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const historyForApi = messages
      .filter((m) => m.id !== 'welcome' && !m.isError)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const boardContext = activeBoard
        ? analyzeBoardForCoach(activeBoard, mode, difficulty)
        : null;

      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historyForApi,
          highThinking,
          boardContext,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'خطا در دریافت پاسخ از مربی هوشمند');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          role: 'model',
          text: data.reply,
          highThinking: Boolean(data.highThinking),
        },
      ]);
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error
          ? err.message
          : 'ارتباط با سرور مربی هوشمند برقرار نشد.';
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'model',
          text: errMsg,
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = activeBoard
    ? [
        'صفحه فعلی رو تحلیل کن و بگو الان چی کار کنم؟',
        'تکنیک قربانی دوگانه (Double-Cross) چطور کار می‌کنه؟',
        'چطور از ساختن زنجیره برای حریف جلوگیری کنم؟',
      ]
    : [
        'چطور هوش مصنوعی سطح سخت رو شکست بدم؟',
        'تکنیک قربانی دوگانه (Double-Cross) چیه؟',
        'بهترین استراتژی برای زمین ۸×۸ چیه؟',
      ];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-3.5 py-5 backdrop-blur-[4px]">
      <CyberGlassPanel
        colorStart={theme.p2}
        colorMid="#7C5CFF"
        colorEnd={theme.p1}
        className="h-[88%] w-full max-w-[375px]"
        innerClassName="flex h-full w-full flex-col"
        tintBg={`linear-gradient(160deg, ${theme.p2}14 0%, rgba(5, 10, 22, 0.58) 52%, ${theme.p1}14 100%)`}
        doubleFrame={false}
      >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/50 bg-cyan-950/40"
                style={{ boxShadow: `0 0 12px ${theme.p2}44` }}
              >
                <Sparkles className="h-4.5 w-4.5 text-cyan-300" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-sm font-extrabold text-white">مربی تاکتیکی سایبری</h2>
                <span className="text-[10px] text-cyan-300/80">
                  {activeBoard
                    ? `متصل به زمین ${toPersianDigits(activeBoard.gridSize)}×${toPersianDigits(activeBoard.gridSize)}`
                    : 'مشاور هوشمند نقطه بازی'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playBackClick();
                onClose();
              }}
              aria-label="بستن مربی هوشمند"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* High Thinking Mode Toggle Bar */}
          <div className="flex items-center justify-between border-b border-white/10 bg-violet-950/25 px-4 py-2">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-violet-300" />
              <span className="text-xs font-bold text-violet-100">
                حالت تفکر عمیق (High Thinking)
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={highThinking}
              onClick={() => {
                soundEngine.playUiClick();
                setHighThinking((prev) => !prev);
              }}
              className="relative h-6 w-11 rounded-full border transition-colors cursor-pointer"
              style={{
                borderColor: highThinking ? '#a78bfa' : 'rgba(255,255,255,0.2)',
                backgroundColor: highThinking
                  ? 'rgba(139, 92, 246, 0.35)'
                  : 'rgba(15, 23, 42, 0.85)',
              }}
            >
              <span
                className="absolute top-0.5 h-4.5 w-4.5 rounded-full transition-all"
                style={{
                  backgroundColor: highThinking ? '#c4b5fd' : '#64748b',
                  left: highThinking ? '3px' : 'calc(100% - 21px)',
                  boxShadow: highThinking ? '0 0 8px #a78bfa' : 'none',
                }}
              />
            </button>
          </div>

          {/* Scrollable Message Thread */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto cyber-scroll px-3.5 py-3 flex flex-col gap-2.5"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[88%] ${
                  msg.role === 'user' ? 'self-start' : 'self-end'
                }`}
              >
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.isError
                      ? 'border border-rose-500/50 bg-rose-950/40 text-rose-200'
                      : msg.role === 'user'
                        ? 'border border-rose-400/35 bg-rose-950/30 text-white'
                        : 'border border-cyan-400/30 bg-slate-900/90 text-slate-100'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.role === 'model' && msg.highThinking && !msg.isError && (
                  <span className="mt-1 self-end text-[10px] font-medium text-violet-300/80">
                    تحلیل‌شده با تفکر عمیق
                  </span>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="self-end flex items-center gap-2 rounded-2xl border border-cyan-400/25 bg-slate-900/80 px-3.5 py-2.5 text-xs text-cyan-200">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>
                  {highThinking
                    ? 'در حال تحلیل تاکتیکی عمیق...'
                    : 'در حال آماده‌سازی پاسخ...'}
                </span>
              </div>
            )}
          </div>

          {/* Quick Prompt Buttons */}
          <div className="flex gap-1.5 overflow-x-auto border-t border-white/10 px-3 py-2">
            {quickPrompts.map((qp) => (
              <button
                key={qp}
                type="button"
                disabled={isLoading}
                onClick={() => sendPrompt(qp)}
                className="shrink-0 rounded-lg border border-cyan-400/30 bg-cyan-950/30 px-2.5 py-1 text-[11px] font-semibold text-cyan-200 transition-colors hover:border-cyan-300 hover:bg-cyan-900/40 disabled:opacity-50 cursor-pointer"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendPrompt(input);
            }}
            className="flex items-center gap-2 border-t border-white/10 bg-black/50 p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="سوال تاکتیکی خود را بپرسید..."
              className="flex-1 rounded-xl border border-white/15 bg-slate-900/85 px-3 py-2.5 text-xs text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="ارسال پیام"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/70 bg-cyan-500/20 text-cyan-200 transition-all hover:bg-cyan-500/35 active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
      </CyberGlassPanel>
    </div>
  );
};

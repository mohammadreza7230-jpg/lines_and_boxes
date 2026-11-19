import React from 'react';
import { Check, HelpCircle, Palette, Settings, Trash2, Trophy, X } from 'lucide-react';
import { NEON_THEMES, NeonTheme } from '../config/assetsConfig';
import { CyberGlassPanel } from './CyberControls';
import { soundEngine } from '../audio/soundEngine';
import {
  GameSettings,
  PlayerStats,
  formatDurationPersian,
  toPersianDigits,
} from '../utils/persian';

interface ModalShellProps {
  title: string;
  icon: React.ReactNode;
  theme: NeonTheme;
  onClose: () => void;
  children: React.ReactNode;
}

const CyberModalShell: React.FC<ModalShellProps> = ({
  title,
  icon,
  theme,
  onClose,
  children,
}) => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#020612]/72 px-4 py-6">
    <CyberGlassPanel
      colorStart={theme.p2}
      colorEnd={theme.p1}
      className="w-full max-w-[360px] max-h-[86%]"
      innerClassName="flex max-h-full flex-col"
      tintBg={`linear-gradient(155deg, ${theme.p2}14 0%, rgba(5, 10, 22, 0.72) 50%, ${theme.p1}14 100%)`}
      doubleFrame={false}
    >
      <div className="flex items-center justify-between border-b border-white/12 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span style={{ color: theme.p2 }}>{icon}</span>
          <h2 className="text-lg font-extrabold text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            soundEngine.playBackClick();
            onClose();
          }}
          aria-label="بستن"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/30 text-slate-200 transition-colors hover:border-cyan-400 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto cyber-scroll px-5 py-4">{children}</div>
    </CyberGlassPanel>
  </div>
);

/* --- 1. Neon Vault (شخصی‌سازی نئون) --- */
interface NeonVaultModalProps {
  currentTheme: NeonTheme;
  onSelectTheme: (themeId: string) => void;
  onClose: () => void;
}

export const NeonVaultModal: React.FC<NeonVaultModalProps> = ({
  currentTheme,
  onSelectTheme,
  onClose,
}) => (
  <CyberModalShell
    title="شخصی‌سازی نئون"
    icon={<Palette className="h-5 w-5" />}
    theme={currentTheme}
    onClose={onClose}
  >
    <p className="text-xs text-slate-300/90 mb-3.5 leading-relaxed">
      پالت نوری و لیزرهای میدان نبرد را انتخاب کنید. تغییرات بلافاصله در کل بازی اعمال می‌شوند.
    </p>
    <div className="flex flex-col gap-3">
      {NEON_THEMES.map((t) => {
        const active = t.id === currentTheme.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onSelectTheme(t.id);
            }}
            className="relative flex flex-col gap-2 rounded-2xl border-2 p-3.5 text-right transition-all cursor-pointer active:scale-[0.98]"
            style={{
              borderColor: active ? t.p2 : 'rgba(255,255,255,0.12)',
              background: active
                ? `linear-gradient(135deg, ${t.p1}22, rgba(8,14,26,0.9), ${t.p2}22)`
                : 'rgba(10, 16, 28, 0.7)',
              boxShadow: active ? `0 0 18px ${t.p2}55` : 'none',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-white">{t.nameFa}</span>
              {active && (
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-slate-950"
                  style={{ backgroundColor: t.p2 }}
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300/85">{t.descFa}</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="h-2.5 flex-1 rounded-full"
                style={{ backgroundColor: t.p1, boxShadow: `0 0 10px ${t.p1}` }}
              />
              <span
                className="h-2.5 flex-1 rounded-full"
                style={{ backgroundColor: t.p2, boxShadow: `0 0 10px ${t.p2}` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  </CyberModalShell>
);

/* --- 2. Settings Modal (تنظیمات) --- */
interface SettingsModalProps {
  theme: NeonTheme;
  settings: GameSettings;
  onChange: (next: Partial<GameSettings>) => void;
  onClose: () => void;
}

const ToggleRow: React.FC<{
  label: string;
  desc: string;
  checked: boolean;
  accent: string;
  onToggle: () => void;
}> = ({ label, desc, checked, accent, onToggle }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 px-3.5 py-3">
    <div className="flex flex-col">
      <span className="text-sm font-bold text-white">{label}</span>
      <span className="text-[11px] text-slate-400">{desc}</span>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className="relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-200 cursor-pointer"
      style={{
        borderColor: checked ? accent : 'rgba(255,255,255,0.2)',
        backgroundColor: checked ? `${accent}33` : 'rgba(15,23,42,0.8)',
        boxShadow: checked ? `0 0 12px ${accent}66` : 'none',
      }}
    >
      <span
        className="absolute top-0.5 h-5.5 w-5.5 rounded-full transition-all duration-200"
        style={{
          backgroundColor: checked ? accent : '#64748b',
          left: checked ? '3px' : 'calc(100% - 25px)',
          boxShadow: checked ? `0 0 8px ${accent}` : 'none',
        }}
      />
    </button>
  </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({
  theme,
  settings,
  onChange,
  onClose,
}) => {
  const timerOptions = [10, 15, 20, 30];

  return (
    <CyberModalShell
      title="تنظیمات"
      icon={<Settings className="h-5 w-5" />}
      theme={theme}
      onClose={onClose}
    >
      <div className="flex flex-col gap-3">
        <ToggleRow
          label="افکت‌های صوتی سایبری"
          desc="صدای لیزر، تصاحب خانه و موزیک پیروزی"
          checked={settings.soundEnabled}
          accent={theme.p2}
          onToggle={() => {
            onChange({ soundEnabled: !settings.soundEnabled });
          }}
        />

        <ToggleRow
          label="لرزش لمسی (Haptic)"
          desc="بازخورد ویبره موبایل هنگام کشیدن خط و امتیاز"
          checked={settings.hapticEnabled}
          accent={theme.p1}
          onToggle={() => {
            soundEngine.playUiClick();
            onChange({ hapticEnabled: !settings.hapticEnabled });
          }}
        />

        <ToggleRow
          label="تایمر محدودیت نوبت"
          desc="شمارش معکوس برای هر حرکت در نبرد"
          checked={settings.turnTimerEnabled}
          accent={theme.p2}
          onToggle={() => {
            soundEngine.playUiClick();
            onChange({ turnTimerEnabled: !settings.turnTimerEnabled });
          }}
        />

        {settings.turnTimerEnabled && (
          <div className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-3">
            <span className="text-xs font-bold text-slate-200 block mb-2.5">
              مدت زمان هر نوبت (ثانیه)
            </span>
            <div className="grid grid-cols-4 gap-2">
              {timerOptions.map((sec) => {
                const selected = settings.turnTimerSeconds === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      soundEngine.playUiClick();
                      onChange({ turnTimerSeconds: sec });
                    }}
                    className="rounded-lg border py-1.5 text-sm font-extrabold tabular-nums transition-all cursor-pointer"
                    style={{
                      borderColor: selected ? theme.p2 : 'rgba(255,255,255,0.14)',
                      backgroundColor: selected ? `${theme.p2}28` : 'rgba(15,23,42,0.6)',
                      color: selected ? '#ffffff' : '#94a3b8',
                    }}
                  >
                    {toPersianDigits(sec)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <ToggleRow
          label="درخشش نئونی حداکثری"
          desc="افکت هاله نور شدید برای خطوط و جرقه‌ها"
          checked={settings.highGlow}
          accent="#a78bfa"
          onToggle={() => {
            soundEngine.playUiClick();
            onChange({ highGlow: !settings.highGlow });
          }}
        />
      </div>
    </CyberModalShell>
  );
};

/* --- 3. Help / Rules Modal (قوانین بازی) --- */
interface HelpModalProps {
  theme: NeonTheme;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ theme, onClose }) => (
  <CyberModalShell
    title="راهنما و قوانین بازی"
    icon={<HelpCircle className="h-5 w-5" />}
    theme={theme}
    onClose={onClose}
  >
    <div className="flex flex-col gap-3.5 text-sm leading-relaxed text-slate-200">
      <div className="rounded-xl border border-cyan-400/25 bg-cyan-950/20 p-3.5">
        <h3 className="font-extrabold text-cyan-300 mb-1">۱. فقط خطوط افقی و عمودی</h3>
        <p className="text-xs text-slate-300">
          در هر نوبت، با لمس فضای بین دو نقطه مجاور، یک خط لیزری افقی یا عمودی رسم کنید. خطوط مورب (قطری) مجاز نیستند.
        </p>
      </div>

      <div className="rounded-xl border border-rose-400/25 bg-rose-950/20 p-3.5">
        <h3 className="font-extrabold text-rose-300 mb-1">۲. تصاحب خانه و نوبت اضافه</h3>
        <p className="text-xs text-slate-300">
          هر زمان ضلع چهارم یک مربع ۱×۱ را تکمیل کنید، آن خانه با نشان شما (<span dir="ltr">B1</span> یا <span dir="ltr">B2</span>) ثبت می‌شود، ۱ امتیاز می‌گیرید و بلافاصله یک نوبت اضافه به دست می‌آورید!
        </p>
      </div>

      <div className="rounded-xl border border-violet-400/25 bg-violet-950/20 p-3.5">
        <h3 className="font-extrabold text-violet-300 mb-1">۳. زنجیره‌سازی و پیروزی</h3>
        <p className="text-xs text-slate-300">
          از ساختن ضلع سوم خانه‌ها خودداری کنید تا حریف نتواند زنجیره طولانی تصاحب کند. در پایان وقتی تمام خانه‌ها پر شدند، بازیکنی که بیشترین خانه را تصاحب کرده برنده است.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/45 p-3 text-xs text-slate-300">
        نکته حرفه‌ای: می‌توانید در حین بازی روی آیکون درخشش (مربی تاکتیکی هوشمند) کلیک کنید تا هوش مصنوعی وضعیت فعلی صفحه را تحلیل کند.
      </div>
    </div>
  </CyberModalShell>
);

/* --- 4. Stats & Leaderboard Modal (آمار و افتخارات) --- */
interface StatsModalProps {
  theme: NeonTheme;
  stats: PlayerStats;
  onResetStats: () => void;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  theme,
  stats,
  onResetStats,
  onClose,
}) => {
  const winRate =
    stats.totalMatches > 0
      ? Math.round((stats.wins / stats.totalMatches) * 100)
      : 0;

  return (
    <CyberModalShell
      title="آمار و افتخارات"
      icon={<Trophy className="h-5 w-5" />}
      theme={theme}
      onClose={onClose}
    >
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-950/20 p-3 text-center">
          <span className="text-[11px] text-slate-300 block">پیروزی‌ها</span>
          <span className="text-2xl font-black text-cyan-300 tabular-nums">
            {toPersianDigits(stats.wins)}
          </span>
        </div>
        <div className="rounded-xl border border-rose-400/30 bg-rose-950/20 p-3 text-center">
          <span className="text-[11px] text-slate-300 block">نرخ برد</span>
          <span className="text-2xl font-black text-rose-300 tabular-nums">
            {toPersianDigits(winRate)}٪
          </span>
        </div>
        <div className="rounded-xl border border-violet-400/30 bg-violet-950/20 p-3 text-center">
          <span className="text-[11px] text-slate-300 block">بزرگترین زنجیره</span>
          <span className="text-2xl font-black text-violet-300 tabular-nums">
            {toPersianDigits(stats.bestChain)}
          </span>
        </div>
        <div className="rounded-xl border border-white/15 bg-black/45 p-3 text-center">
          <span className="text-[11px] text-slate-300 block">کل خانه‌های تصاحب‌شده</span>
          <span className="text-2xl font-black text-white tabular-nums">
            {toPersianDigits(stats.totalBoxesCaptured)}
          </span>
        </div>
      </div>

      <h3 className="text-xs font-bold text-slate-300 mb-2">آخرین نبردها</h3>
      {stats.recentMatches.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-black/40 p-5 text-center text-xs text-slate-400">
          هنوز نبردی ثبت نشده است. اولین نبرد خود را شروع کنید!
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {stats.recentMatches.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-xs"
            >
              <div className="flex flex-col">
                <span className="font-bold text-white">
                  {m.mode === 'ai' ? 'در برابر هوش مصنوعی' : 'نبرد محلی'} ·{' '}
                  <span dir="ltr">{toPersianDigits(`${m.gridSize}×${m.gridSize}`)}</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  مدت: {formatDurationPersian(m.durationSeconds)} · بیشترین زنجیره:{' '}
                  {toPersianDigits(m.maxChain)}
                </span>
              </div>
              <div className="flex items-center gap-2 font-black tabular-nums">
                <span style={{ color: theme.p1 }}>{toPersianDigits(m.p1Score)}</span>
                <span className="text-slate-500">-</span>
                <span style={{ color: theme.p2 }}>{toPersianDigits(m.p2Score)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {stats.totalMatches > 0 && (
        <button
          type="button"
          onClick={() => {
            soundEngine.playBackClick();
            onResetStats();
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/25 py-2.5 text-xs font-bold text-rose-300 transition-colors hover:bg-rose-950/45 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>پاک‌سازی تاریخچه آمار</span>
        </button>
      )}
    </CyberModalShell>
  );
};

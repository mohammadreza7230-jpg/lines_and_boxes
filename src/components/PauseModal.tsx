import React from 'react';
import { Smartphone, Volume2, VolumeX } from 'lucide-react';
import { NeonTheme } from '../config/assetsConfig';
import { CyberCapsuleButton, CyberGlassPanel } from './CyberControls';
import { soundEngine } from '../audio/soundEngine';

interface PauseModalProps {
  theme: NeonTheme;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onExitMenu: () => void;
  onToggleSound: () => void;
  onToggleHaptic: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  theme,
  soundEnabled,
  hapticEnabled,
  onResume,
  onRestart,
  onOpenSettings,
  onExitMenu,
  onToggleSound,
  onToggleHaptic,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/28 px-5 py-6 backdrop-blur-[3.5px]">
      {/* Main Dual-Tone Chamfered True-Glass Panel matching Pause mockup */}
      <CyberGlassPanel
        colorStart={theme.p1}
        colorMid={theme.p2}
        colorEnd={theme.p1}
        className="w-full max-w-[342px]"
        innerClassName="flex flex-col items-center px-6 py-7"
        tintBg={`linear-gradient(145deg, ${theme.p1}18 0%, rgba(4, 9, 20, 0.34) 50%, ${theme.p2}18 100%)`}
        doubleFrame
      >
          <h2
            className="relative z-10 text-3xl font-black tracking-tight text-white"
            style={{ textShadow: `0 0 14px ${theme.p1}, 0 0 30px ${theme.p1}99` }}
          >
            بازی متوقف شد
          </h2>
          <p className="relative z-10 mt-1.5 text-sm font-semibold text-slate-200 drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
            عملیات متوقف شده است
          </p>

          {/* Signature Glowing Crimson Pause Bars */}
          <div className="relative z-10 my-5 flex items-center justify-center gap-3">
            <span
              className="h-11 w-3.5 rounded-sm border-2 backdrop-blur-[2px]"
              style={{
                borderColor: theme.p1,
                backgroundColor: `${theme.p1}18`,
                boxShadow: `0 0 18px ${theme.p1}, inset 0 0 8px ${theme.p1}66`,
              }}
            />
            <span
              className="h-11 w-3.5 rounded-sm border-2 backdrop-blur-[2px]"
              style={{
                borderColor: theme.p1,
                backgroundColor: `${theme.p1}18`,
                boxShadow: `0 0 18px ${theme.p1}, inset 0 0 8px ${theme.p1}66`,
              }}
            />
          </div>

          {/* 4 Glowing Translucent Capsule Actions */}
          <div className="relative z-10 flex w-full flex-col gap-3">
            <CyberCapsuleButton
              theme={theme}
              variant="cyan"
              onClick={() => {
                soundEngine.playUiClick();
                onResume();
              }}
            >
              ادامه بازی
            </CyberCapsuleButton>

            <CyberCapsuleButton
              theme={theme}
              variant="crimson"
              onClick={() => {
                soundEngine.playUiClick();
                onRestart();
              }}
            >
              تلاش مجدد
            </CyberCapsuleButton>

            <CyberCapsuleButton
              theme={theme}
              variant="violet"
              onClick={() => {
                soundEngine.playUiClick();
                onOpenSettings();
              }}
            >
              تنظیمات
            </CyberCapsuleButton>

            <CyberCapsuleButton
              theme={theme}
              variant="dual"
              onClick={() => {
                soundEngine.playBackClick();
                onExitMenu();
              }}
            >
              خروج به منو
            </CyberCapsuleButton>
          </div>

          {/* Quick Sound & Haptic Vibration Toggles */}
          <div className="relative z-10 mt-6 flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'قطع صدا' : 'وصل صدا'}
              className="flex h-13 w-13 items-center justify-center rounded-full border-2 bg-black/25 backdrop-blur-[4px] transition-transform active:scale-90 cursor-pointer"
              style={{
                borderColor: soundEnabled ? theme.p2 : '#64748b',
                color: soundEnabled ? theme.p2 : '#94a3b8',
                boxShadow: soundEnabled ? `0 0 18px ${theme.p2}99, inset 0 0 10px ${theme.p2}33` : 'none',
              }}
            >
              {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            </button>

            <button
              type="button"
              onClick={onToggleHaptic}
              aria-label={hapticEnabled ? 'غیرفعال کردن لرزش' : 'فعال کردن لرزش'}
              className="flex h-13 w-13 items-center justify-center rounded-full border-2 bg-black/25 backdrop-blur-[4px] transition-transform active:scale-90 cursor-pointer"
              style={{
                borderColor: hapticEnabled ? theme.p1 : '#64748b',
                color: hapticEnabled ? theme.p1 : '#94a3b8',
                boxShadow: hapticEnabled ? `0 0 18px ${theme.p1}99, inset 0 0 10px ${theme.p1}33` : 'none',
              }}
            >
              <Smartphone className="h-6 w-6" />
            </button>
          </div>
      </CyberGlassPanel>

      {/* Bottom brand footnote matching mockup */}
      <div className="mt-3.5 rounded-xl border border-white/10 bg-black/35 px-4 py-1.5 text-center backdrop-blur-[4px]">
        <p className="text-xs font-semibold text-cyan-100/90">بازی نقطه و خط - نبرد سایبری</p>
        <p className="text-[11px] text-slate-300/80">نسخه ۱.۰</p>
      </div>
    </div>
  );
};

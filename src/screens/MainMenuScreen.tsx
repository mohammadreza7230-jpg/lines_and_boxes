import React from 'react';
import { HelpCircle, Sparkles, Trophy, Volume2, VolumeX } from 'lucide-react';
import { NeonTheme } from '../config/assetsConfig';
import { CyberBackground } from '../components/CyberBackground';
import { NeonLogo } from '../components/NeonLogo';
import { CyberCapsuleButton } from '../components/CyberControls';
import { SpriteSlice } from '../components/SpriteView';
import { soundEngine } from '../audio/soundEngine';

interface MainMenuScreenProps {
  theme: NeonTheme;
  soundEnabled: boolean;
  onSelectMode: (mode: 'local' | 'ai') => void;
  onOpenVault: () => void;
  onOpenSettings: () => void;
  onToggleSound: () => void;
  onOpenHelp: () => void;
  onOpenStats: () => void;
  onOpenCoach: () => void;
}

export const MainMenuScreen: React.FC<MainMenuScreenProps> = ({
  theme,
  soundEnabled,
  onSelectMode,
  onOpenVault,
  onOpenSettings,
  onToggleSound,
  onOpenHelp,
  onOpenStats,
  onOpenCoach,
}) => {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-between px-6 pt-12 pb-6 overflow-hidden">
      <CyberBackground theme={theme} showFloorGrid showBeams />

      {/* Subtle ambient sprite spark accents using screen blend */}
      <SpriteSlice
        sprite="menuRedExplosion"
        className="pointer-events-none absolute -right-12 top-[28%] h-40 w-40 opacity-50"
      />
      <SpriteSlice
        sprite="menuCyanExplosion"
        className="pointer-events-none absolute -left-10 top-[20%] h-36 w-36 opacity-45"
      />

      {/* Top Logo */}
      <div className="relative z-10 mt-2">
        <NeonLogo theme={theme} />
      </div>

      {/* Primary Capsule Navigation Stack */}
      <div className="relative z-10 flex w-full max-w-[300px] flex-col gap-3.5 my-auto">
        <CyberCapsuleButton
          theme={theme}
          variant="dual"
          showChevrons
          onClick={() => {
            soundEngine.playUiClick();
            onSelectMode('local');
          }}
        >
          نبرد محلی
        </CyberCapsuleButton>

        <CyberCapsuleButton
          theme={theme}
          variant="cyan"
          active
          onClick={() => {
            soundEngine.playUiClick();
            onSelectMode('ai');
          }}
        >
          نبرد با هوش مصنوعی
        </CyberCapsuleButton>

        <CyberCapsuleButton
          theme={theme}
          variant="violet"
          onClick={() => {
            soundEngine.playUiClick();
            onOpenVault();
          }}
        >
          شخصی‌سازی نئون
        </CyberCapsuleButton>

        <CyberCapsuleButton
          theme={theme}
          variant="glass"
          onClick={() => {
            soundEngine.playUiClick();
            onOpenSettings();
          }}
        >
          تنظیمات
        </CyberCapsuleButton>
      </div>

      {/* Bottom Circular Neon Utility Icons */}
      <div className="relative z-10 flex w-full flex-col items-center gap-3 pb-1">
        <div className="flex items-center justify-center gap-5">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              onToggleSound();
            }}
            aria-label={soundEnabled ? 'قطع صدا' : 'وصل صدا'}
            title={soundEnabled ? 'صدا روشن' : 'صدا خاموش'}
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 bg-black/25 transition-transform duration-150 active:scale-90 hover:scale-105 cursor-pointer"
            style={{
              borderColor: soundEnabled ? theme.p2 : theme.p1,
              color: soundEnabled ? theme.p2 : theme.p1,
              boxShadow: `0 0 14px ${soundEnabled ? theme.p2 : theme.p1}88, inset 0 0 10px ${
                soundEnabled ? theme.p2 : theme.p1
              }33`,
            }}
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>

          {/* Help / Rules Modal */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onOpenHelp();
            }}
            aria-label="راهنمای بازی"
            title="قوانین بازی"
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 bg-black/25 transition-transform duration-150 active:scale-90 hover:scale-105 cursor-pointer"
            style={{
              borderColor: theme.p2,
              color: theme.p2,
              boxShadow: `0 0 14px ${theme.p2}88, inset 0 0 10px ${theme.p2}33`,
            }}
          >
            <HelpCircle className="h-5 w-5" />
          </button>

          {/* Leaderboard / Stats */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onOpenStats();
            }}
            aria-label="آمار و افتخارات"
            title="آمار و رکوردها"
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 bg-black/25 transition-transform duration-150 active:scale-90 hover:scale-105 cursor-pointer"
            style={{
              borderColor: theme.p2,
              color: theme.p2,
              boxShadow: `0 0 14px ${theme.p2}88, inset 0 0 10px ${theme.p2}33`,
            }}
          >
            <Trophy className="h-5 w-5" />
          </button>

          {/* AI Tactical Coach Chatbot */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onOpenCoach();
            }}
            aria-label="مربی هوشمند تاکتیکی"
            title="مربی هوشمند تاکتیکی"
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 bg-black/25 transition-transform duration-150 active:scale-90 hover:scale-105 cursor-pointer"
            style={{
              borderColor: theme.p1,
              color: '#ff90a6',
              boxShadow: `0 0 14px ${theme.p1}88, inset 0 0 10px ${theme.p1}33`,
            }}
          >
            <Sparkles className="h-5 w-5" />
          </button>
        </div>

        {/* Version footnote matching mockup */}
        <div className="flex w-full items-center justify-end px-1">
          <span className="text-[11px] font-medium text-slate-400/75">نسخه ۱.۰</span>
        </div>
      </div>
    </div>
  );
};

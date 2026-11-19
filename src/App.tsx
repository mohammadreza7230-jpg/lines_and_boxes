import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { NEON_THEMES, NeonTheme } from './config/assetsConfig';
import { BoardState, createInitialBoard } from './engine/dotsAndBoxes';
import { AiDifficulty } from './engine/aiOpponent';
import { soundEngine } from './audio/soundEngine';
import {
  GameSettings,
  PlayerStats,
  clearStats,
  loadSettings,
  loadStats,
  recordMatchStats,
  saveSettings,
} from './utils/persian';
import { SplashScreen } from './screens/SplashScreen';
import { MainMenuScreen } from './screens/MainMenuScreen';
import { SetupScreen } from './screens/SetupScreen';
import { GameplayScreen } from './screens/GameplayScreen';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import {
  HelpModal,
  NeonVaultModal,
  SettingsModal,
  StatsModal,
} from './components/UtilityModals';
import { CyberCoachModal } from './components/CyberCoachModal';

type AppScreen = 'splash' | 'menu' | 'setup' | 'gameplay';
type ActiveModal = null | 'vault' | 'settings' | 'help' | 'stats' | 'coach';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('splash');
  const [mode, setMode] = useState<'local' | 'ai'>('ai');
  const [gridSize, setGridSize] = useState<number>(8);
  const [difficulty, setDifficulty] = useState<AiDifficulty>('medium');

  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [stats, setStats] = useState<PlayerStats>(() => loadStats());

  const [board, setBoard] = useState<BoardState>(() => createInitialBoard(8));
  const [isPaused, setIsPaused] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [lastElapsedSeconds, setLastElapsedSeconds] = useState(0);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const currentTheme: NeonTheme = useMemo(
    () => NEON_THEMES.find((t) => t.id === settings.themeId) ?? NEON_THEMES[0],
    [settings.themeId]
  );

  // Sync audio & haptics configuration whenever settings update
  useEffect(() => {
    soundEngine.configure(settings.soundEnabled, settings.hapticEnabled);
    saveSettings(settings);
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleToggleSound = useCallback(() => {
    setSettings((prev) => {
      const nextSound = !prev.soundEnabled;
      soundEngine.configure(nextSound, prev.hapticEnabled);
      if (nextSound) soundEngine.playUiClick();
      return { ...prev, soundEnabled: nextSound };
    });
  }, []);

  const handleToggleHaptic = useCallback(() => {
    setSettings((prev) => {
      const nextHaptic = !prev.hapticEnabled;
      soundEngine.configure(prev.soundEnabled, nextHaptic);
      soundEngine.playUiClick();
      return { ...prev, hapticEnabled: nextHaptic };
    });
  }, []);

  const handleStartMatch = useCallback(() => {
    setBoard(createInitialBoard(gridSize));
    setIsPaused(false);
    setShowGameOver(false);
    setLastElapsedSeconds(0);
    setScreen('gameplay');
  }, [gridSize]);

  const handleRestartMatch = useCallback(() => {
    setBoard(createInitialBoard(gridSize));
    setIsPaused(false);
    setShowGameOver(false);
    setLastElapsedSeconds(0);
  }, [gridSize]);

  const handleMatchFinished = useCallback(
    (finalBoard: BoardState, elapsedSeconds: number) => {
      setLastElapsedSeconds(elapsedSeconds);
      setShowGameOver(true);
      const updated = recordMatchStats({
        mode,
        difficulty,
        gridSize: finalBoard.gridSize,
        p1Score: finalBoard.scores.p1,
        p2Score: finalBoard.scores.p2,
        winner: finalBoard.winner,
        maxChain: finalBoard.maxChain,
        durationSeconds: elapsedSeconds,
      });
      setStats(updated);
    },
    [difficulty, mode]
  );

  return (
    <div
      dir="rtl"
      className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#010308]"
    >
      {/* Subtle ambient cyber aura outside the 9:16 frame on wide desktop screens */}
      <div
        className="pointer-events-none hidden sm:block absolute inset-0 opacity-40"
        style={{
          background: `
            radial-gradient(circle at 25% 30%, ${currentTheme.p1}30 0%, transparent 45%),
            radial-gradient(circle at 75% 70%, ${currentTheme.p2}30 0%, transparent 45%)
          `,
        }}
      />

      {/* Mobile-First 9:16 Portrait Viewport Shell */}
      <main
        className="relative h-full w-full sm:h-[min(95dvh,860px)] sm:w-auto sm:aspect-[9/16] sm:max-w-[440px] sm:rounded-[32px] sm:border sm:border-white/15 overflow-hidden bg-[#02050d] shadow-[0_0_60px_rgba(0,240,255,0.16)]"
      >
        <AnimatePresence mode="wait">
          {screen === 'splash' && (
            <motion.div
              key="splash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.03 }}
              transition={{ duration: 0.35 }}
              className="h-full w-full"
            >
              <SplashScreen
                theme={currentTheme}
                onComplete={() => setScreen('menu')}
              />
            </motion.div>
          )}

          {screen === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="h-full w-full"
            >
              <MainMenuScreen
                theme={currentTheme}
                soundEnabled={settings.soundEnabled}
                onSelectMode={(selectedMode) => {
                  setMode(selectedMode);
                  setScreen('setup');
                }}
                onOpenVault={() => setActiveModal('vault')}
                onOpenSettings={() => setActiveModal('settings')}
                onToggleSound={handleToggleSound}
                onOpenHelp={() => setActiveModal('help')}
                onOpenStats={() => setActiveModal('stats')}
                onOpenCoach={() => setActiveModal('coach')}
              />
            </motion.div>
          )}

          {screen === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.22 }}
              className="h-full w-full"
            >
              <SetupScreen
                theme={currentTheme}
                mode={mode}
                gridSize={gridSize}
                difficulty={difficulty}
                onSelectGridSize={setGridSize}
                onSelectDifficulty={setDifficulty}
                onBack={() => setScreen('menu')}
                onStartMatch={handleStartMatch}
              />
            </motion.div>
          )}

          {screen === 'gameplay' && (
            <motion.div
              key="gameplay"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className="relative h-full w-full"
            >
              <GameplayScreen
                theme={currentTheme}
                settings={settings}
                mode={mode}
                gridSize={gridSize}
                difficulty={difficulty}
                isPaused={isPaused}
                isModalOpen={activeModal !== null || showGameOver}
                board={board}
                onUpdateBoard={setBoard}
                onPause={() => setIsPaused(true)}
                onRestart={handleRestartMatch}
                onOpenCoach={() => setActiveModal('coach')}
                onMatchFinished={handleMatchFinished}
              />

              {/* Screen 5: Pause Modal */}
              {isPaused && !showGameOver && (
                <PauseModal
                  theme={currentTheme}
                  soundEnabled={settings.soundEnabled}
                  hapticEnabled={settings.hapticEnabled}
                  onResume={() => setIsPaused(false)}
                  onRestart={handleRestartMatch}
                  onOpenSettings={() => setActiveModal('settings')}
                  onExitMenu={() => {
                    setIsPaused(false);
                    setScreen('menu');
                  }}
                  onToggleSound={handleToggleSound}
                  onToggleHaptic={handleToggleHaptic}
                />
              )}

              {/* Screen 6: Game Over Modal */}
              {showGameOver && (
                <GameOverModal
                  theme={currentTheme}
                  board={board}
                  mode={mode}
                  elapsedSeconds={lastElapsedSeconds}
                  onRematch={handleRestartMatch}
                  onChangeGrid={() => {
                    setShowGameOver(false);
                    setScreen('setup');
                  }}
                  onMainMenu={() => {
                    setShowGameOver(false);
                    setScreen('menu');
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Overlay Modals (Neon Vault, Settings, Help, Stats, AI Coach) */}
        {activeModal === 'vault' && (
          <NeonVaultModal
            currentTheme={currentTheme}
            onSelectTheme={(themeId) => updateSettings({ themeId })}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'settings' && (
          <SettingsModal
            theme={currentTheme}
            settings={settings}
            onChange={updateSettings}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'help' && (
          <HelpModal
            theme={currentTheme}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'stats' && (
          <StatsModal
            theme={currentTheme}
            stats={stats}
            onResetStats={() => setStats(clearStats())}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === 'coach' && (
          <CyberCoachModal
            theme={currentTheme}
            activeBoard={screen === 'gameplay' ? board : null}
            mode={mode}
            difficulty={difficulty}
            onClose={() => setActiveModal(null)}
          />
        )}
      </main>
    </div>
  );
}

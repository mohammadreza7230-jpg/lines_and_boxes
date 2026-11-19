/**
 * Beat Saber / Cyberpunk Procedural Web Audio API Sound & Haptics Engine
 * Zero external MP3 dependencies — pure crisp Web Audio synthesis.
 */

class CyberSoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled = true;
  private hapticEnabled = true;

  public configure(soundEnabled: boolean, hapticEnabled: boolean) {
    this.soundEnabled = soundEnabled;
    this.hapticEnabled = hapticEnabled;
  }

  private getContext(): AudioContext | null {
    if (!this.soundEnabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public vibrate(pattern: number | number[]) {
    if (!this.hapticEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore unsupported environments
    }
  }

  public playUiClick() {
    const ctx = this.getContext();
    this.vibrate(8);
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(1180, now + 0.045);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playBackClick() {
    const ctx = this.getContext();
    this.vibrate(8);
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.06);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  public playLaserDraw(player: 1 | 2) {
    const ctx = this.getContext();
    this.vibrate(14);
    if (!ctx) return;

    const now = ctx.currentTime;

    // Laser saber zap: sawtooth + resonant lowpass sweep
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    sub.type = 'sine';

    const startFreq = player === 1 ? 620 : 780;
    const endFreq = player === 1 ? 165 : 220;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.13);

    sub.frequency.setValueAtTime(startFreq * 0.5, now);
    sub.frequency.exponentialRampToValueAtTime(endFreq * 0.5, now + 0.13);

    filter.type = 'bandpass';
    filter.Q.setValueAtTime(4.5, now);
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(420, now + 0.13);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(filter);
    sub.connect(gain);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    sub.start(now);
    osc.stop(now + 0.16);
    sub.stop(now + 0.16);
  }

  public playBoxCapture(comboCount: number, player: 1 | 2) {
    const ctx = this.getContext();
    this.vibrate(comboCount > 1 ? [18, 25, 28] : [22]);
    if (!ctx) return;

    const now = ctx.currentTime;
    // Semitone pitch escalation with combo streak (capped at +12 semitones)
    const semitones = Math.min(12, Math.max(0, comboCount - 1) * 2);
    const baseRoot = player === 1 ? 392 : 440; // G4 vs A4
    const pitchMult = Math.pow(2, semitones / 12);

    const chord = [1, 1.25, 1.5, 2]; // Major triad + octave synth chime
    chord.forEach((ratio, idx) => {
      const t = now + idx * 0.032;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(baseRoot * ratio * pitchMult, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.11 / (1 + idx * 0.15), t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  public playTimerWarning() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  public playVictory() {
    const ctx = this.getContext();
    this.vibrate([30, 40, 30, 40, 60]);
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const t = now + i * 0.095;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, t);

      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.11, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.48);
    });
  }

  public playDefeat() {
    const ctx = this.getContext();
    this.vibrate([50, 40, 80]);
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [392, 349.23, 311.13, 261.63]; // G4 F4 Eb4 C4
    notes.forEach((freq, i) => {
      const t = now + i * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.96, t + 0.35);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  public playDraw() {
    const ctx = this.getContext();
    this.vibrate([25, 30, 25]);
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [440, 554.37, 440];
    notes.forEach((freq, i) => {
      const t = now + i * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }
}

export const soundEngine = new CyberSoundEngine();

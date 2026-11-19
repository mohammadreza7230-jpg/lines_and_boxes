import React, { useEffect, useRef, useState } from 'react';
import { NeonTheme } from '../config/assetsConfig';
import { CyberBackground } from '../components/CyberBackground';
import { NeonLogo } from '../components/NeonLogo';
import { toPersianDigits } from '../utils/persian';

interface SplashScreenProps {
  theme: NeonTheme;
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ theme, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const completedRef = useRef(false);

  // Smooth loading progress to 100% then auto-transition
  useEffect(() => {
    const start = performance.now();
    const duration = 2300;
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const ratio = Math.min(1, elapsed / duration);
      // Eased loading curve for authentic cyberpunk boot feel
      const eased = ratio < 0.7 ? (ratio / 0.7) * 78 : 78 + ((ratio - 0.7) / 0.3) * 22;
      setProgress(Math.round(eased));

      if (ratio < 1) {
        rafId = requestAnimationFrame(tick);
      } else if (!completedRef.current) {
        completedRef.current = true;
        setTimeout(() => onComplete(), 220);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [onComplete]);

  // Animated 3D Neon Wireframe Cube (Beat Saber centerpiece)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 240;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    // Cube vertices
    const outerVerts = [
      [-1, -1, -1],
      [1, -1, -1],
      [1, 1, -1],
      [-1, 1, -1],
      [-1, -1, 1],
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1],
    ];

    const edges: [number, number][] = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ];

    // Cross-face crimson diagonals matching the mockup cube
    const diagonals: [number, number][] = [
      [0, 2], [1, 3], [4, 6], [5, 7],
      [0, 5], [1, 4], [2, 7], [3, 6],
    ];

    const sparks = Array.from({ length: 42 }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 48 + Math.random() * 62,
      speed: (Math.random() - 0.5) * 0.025,
      yOff: (Math.random() - 0.5) * 120,
      size: 1.2 + Math.random() * 2.2,
      isRed: Math.random() > 0.55,
    }));

    let rafId = 0;
    let t = 0;

    const project = (v: number[], scale: number, rotY: number, rotX: number) => {
      const [x0, y0, z0] = v;
      // Rotate Y
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = x0 * cosY - z0 * sinY;
      const z1 = x0 * sinY + z0 * cosY;
      // Rotate X
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y2 = y0 * cosX - z1 * sinX;
      const z2 = y0 * sinX + z1 * cosX;

      const dist = 4.2;
      const factor = scale / (dist - z2);
      return {
        x: size / 2 + x1 * factor,
        y: size / 2 + y2 * factor,
        z: z2,
      };
    };

    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, size, size);

      const rotY = t * 0.75 + 0.78;
      const rotX = 0.58 + Math.sin(t * 0.6) * 0.14;

      // Volumetric core haze
      const radGrad = ctx.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, 108);
      radGrad.addColorStop(0, 'rgba(255, 30, 66, 0.25)');
      radGrad.addColorStop(0.45, 'rgba(0, 240, 255, 0.14)');
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, size, size);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // Orbiting neon particles (zero shadowBlur!)
      for (const sp of sparks) {
        sp.angle += sp.speed;
        const sx = size / 2 + Math.cos(sp.angle) * sp.radius;
        const sy = size / 2 + sp.yOff * 0.75 + Math.sin(sp.angle * 1.4) * 18;
        ctx.fillStyle = sp.isRed ? theme.p1 : theme.p2;
        ctx.fillRect(sx - sp.size, sy - sp.size, sp.size * 2, sp.size * 2);
      }

      const outerPts = outerVerts.map((v) => project(v, 185, rotY, rotX));
      const innerPts = outerVerts.map((v) => project(v, 118, rotY, rotX));

      const drawBatchedEdges = (
        pts: { x: number; y: number }[],
        pairs: [number, number][],
        color: string,
        width: number,
        alpha: number
      ) => {
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        for (const [a, b] of pairs) {
          ctx.moveTo(pts[a].x, pts[a].y);
          ctx.lineTo(pts[b].x, pts[b].y);
        }
        ctx.stroke();
      };

      // Crimson cross-diagonals (halo + crisp core)
      drawBatchedEdges(outerPts, diagonals, theme.p1, 4.5, 0.28);
      drawBatchedEdges(outerPts, diagonals, theme.p1, 1.6, 0.95);

      // Inner nested cyan cube
      drawBatchedEdges(innerPts, edges, theme.p2, 4, 0.25);
      drawBatchedEdges(innerPts, edges, theme.p2, 1.4, 0.9);

      // Outer bright cyan wireframe cube
      drawBatchedEdges(outerPts, edges, theme.p2, 7, 0.25);
      drawBatchedEdges(outerPts, edges, '#d8ffff', 2.2, 1);

      // Glowing vertex nodes
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      for (const pt of outerPts) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [theme]);

  const handleSkip = () => {
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  return (
    <div
      onClick={handleSkip}
      className="relative flex h-full w-full flex-col items-center justify-between px-6 pt-14 pb-8 cursor-pointer overflow-hidden"
    >
      <CyberBackground theme={theme} showFloorGrid showBeams />

      {/* Top Neon Logo */}
      <div className="relative z-10 mt-2">
        <NeonLogo theme={theme} />
      </div>

      {/* Center 3D Wireframe Cube */}
      <div className="relative z-10 flex items-center justify-center my-auto">
        <canvas
          ref={canvasRef}
          className="h-[230px] w-[230px] sm:h-[245px] sm:w-[245px]"
          aria-label="مکعب سه‌بعدی نئونی"
        />
      </div>

      {/* Bottom Laser Loading Bar */}
      <div className="relative z-10 w-full max-w-[330px] flex flex-col items-center gap-3 pb-2">
        <p
          className="text-sm font-bold tracking-wide tabular-nums"
          style={{
            color: '#d9ffff',
            textShadow: `0 0 10px ${theme.p2}`,
          }}
        >
          در حال بارگذاری ماتریس نئونی... {toPersianDigits(progress)}٪
        </p>

        {/* Glowing laser track */}
        <div
          className="relative h-3.5 w-full rounded-full border p-[2px] bg-black/75 overflow-visible"
          style={{
            borderColor: `${theme.p2}bb`,
            boxShadow: `0 0 12px ${theme.p2}66, inset 0 0 8px ${theme.p2}33`,
          }}
        >
          <div
            className="relative h-full rounded-full transition-all duration-75"
            style={{
              width: `${Math.max(4, progress)}%`,
              background: `linear-gradient(90deg, ${theme.p2}, #ffffff)`,
              boxShadow: `0 0 14px ${theme.p2}, 0 0 26px ${theme.p2}`,
            }}
          >
            {/* Leading spark flare */}
            <span
              className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white"
              style={{
                boxShadow: `0 0 12px 4px ${theme.p2}, 0 0 20px 6px ${theme.p1}`,
              }}
            />
          </div>
        </div>

        <p className="text-xs font-medium text-slate-400/90 mt-1">
          در حال راه‌اندازی سیستم
        </p>
      </div>
    </div>
  );
};

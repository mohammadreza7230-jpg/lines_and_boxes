import React, { useCallback, useEffect, useRef } from 'react';
import { NeonTheme, SPRITES } from '../config/assetsConfig';
import { BoardState, CapturedBoxCoord, EdgeMove, PlayerId } from '../engine/dotsAndBoxes';
import { useSpriteImages } from './SpriteView';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface BurstEffect {
  x: number;
  y: number;
  player: PlayerId;
  age: number;
  duration: number;
  radius: number;
}

interface BoxPopAnim {
  r: number;
  c: number;
  age: number;
  duration: number;
}

interface EdgeFlashAnim {
  move: EdgeMove;
  player: PlayerId;
  age: number;
  duration: number;
}

interface GameBoardCanvasProps {
  board: BoardState;
  theme: NeonTheme;
  highGlow: boolean;
  interactive: boolean;
  onSelectEdge: (move: EdgeMove) => void;
  fxTrigger: {
    id: number;
    move: EdgeMove | null;
    player: PlayerId;
    capturedBoxes: CapturedBoxCoord[];
  } | null;
}

export const GameBoardCanvas: React.FC<GameBoardCanvasProps> = ({
  board,
  theme,
  highGlow,
  interactive,
  onSelectEdge,
  fxTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spriteImages = useSpriteImages();
  const spriteImagesRef = useRef(spriteImages);
  spriteImagesRef.current = spriteImages;

  const boardRef = useRef(board);
  boardRef.current = board;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const highGlowRef = useRef(highGlow);
  highGlowRef.current = highGlow;
  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;

  const hoverEdgeRef = useRef<EdgeMove | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const burstsRef = useRef<BurstEffect[]>([]);
  const boxPopsRef = useRef<BoxPopAnim[]>([]);
  const edgeFlashesRef = useRef<EdgeFlashAnim[]>([]);
  const layoutRef = useRef({ width: 340, height: 340, pad: 22, spacing: 40 });
  const isTouchPointerRef = useRef(false);

  // Ambient floating stardust sparks
  const ambientRef = useRef(
    Array.from({ length: 34 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0005,
      vy: (Math.random() - 0.5) * 0.0005,
      size: 1 + Math.random() * 1.8,
      isP1: Math.random() > 0.55,
      alpha: 0.25 + Math.random() * 0.45,
    }))
  );

  // Spawn neon particle sparks & bursts when a move/capture happens
  useEffect(() => {
    if (!fxTrigger || !fxTrigger.move) return;
    const { pad, spacing } = layoutRef.current;
    const { move, player, capturedBoxes } = fxTrigger;
    const color = player === 1 ? themeRef.current.p1 : themeRef.current.p2;

    // Edge midpoint
    const mx =
      move.type === 'h'
        ? pad + (move.c + 0.5) * spacing
        : pad + move.c * spacing;
    const my =
      move.type === 'h'
        ? pad + move.r * spacing
        : pad + (move.r + 0.5) * spacing;

    edgeFlashesRef.current.push({
      move,
      player,
      age: 0,
      duration: 0.34,
    });

    burstsRef.current.push({
      x: mx,
      y: my,
      player,
      age: 0,
      duration: 0.32,
      radius: Math.max(22, spacing * 0.8),
    });

    const edgeSparks = 14;
    for (let i = 0; i < edgeSparks; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 45 + Math.random() * 130;
      particlesRef.current.push({
        x: mx,
        y: my,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0,
        maxLife: 0.32 + Math.random() * 0.25,
        size: 1.5 + Math.random() * 2.2,
        color,
      });
    }

    for (const box of capturedBoxes) {
      boxPopsRef.current.push({
        r: box.r,
        c: box.c,
        age: 0,
        duration: 0.35,
      });

      const bx = pad + (box.c + 0.5) * spacing;
      const by = pad + (box.r + 0.5) * spacing;
      burstsRef.current.push({
        x: bx,
        y: by,
        player,
        age: 0,
        duration: 0.45,
        radius: Math.max(30, spacing * 1.15),
      });

      const boxSparks = 22;
      for (let i = 0; i < boxSparks; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 55 + Math.random() * 165;
        particlesRef.current.push({
          x: bx,
          y: by,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0,
          maxLife: 0.4 + Math.random() * 0.32,
          size: 1.6 + Math.random() * 2.6,
          color: i % 4 === 0 ? '#ffffff' : color,
        });
      }
    }
  }, [fxTrigger]);

  // Helper: map client coordinates to nearest valid orthogonal edge with generous hitbox
  const findNearestEdge = useCallback((clientX: number, clientY: number): EdgeMove | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const { pad, spacing } = layoutRef.current;
    const state = boardRef.current;
    const n = state.gridSize;

    // Generous hitbox scaled cleanly from 4x4 up to 14x14 so mobile taps never miss
    const maxDist = Math.max(spacing * 0.46, 17);
    let bestMove: EdgeMove | null = null;
    let bestDist = maxDist;

    // Check horizontal segments
    for (let r = 0; r < n; r++) {
      const ey = pad + r * spacing;
      if (Math.abs(y - ey) > bestDist) continue;
      for (let c = 0; c < n - 1; c++) {
        if (state.hEdges[r][c] !== 0) continue;
        const x1 = pad + c * spacing;
        const x2 = x1 + spacing;
        // Distance to segment [x1, x2] excluding small deadzone right on dots when ambiguous
        const clampedX = Math.max(x1 + spacing * 0.12, Math.min(x2 - spacing * 0.12, x));
        const d = Math.hypot(x - clampedX, y - ey);
        if (d < bestDist) {
          bestDist = d;
          bestMove = { type: 'h', r, c };
        }
      }
    }

    // Check vertical segments
    for (let r = 0; r < n - 1; r++) {
      const y1 = pad + r * spacing;
      const y2 = y1 + spacing;
      if (y < y1 - bestDist || y > y2 + bestDist) continue;
      for (let c = 0; c < n; c++) {
        if (state.vEdges[r][c] !== 0) continue;
        const ex = pad + c * spacing;
        if (Math.abs(x - ex) > bestDist) continue;
        const clampedY = Math.max(y1 + spacing * 0.12, Math.min(y2 - spacing * 0.12, y));
        const d = Math.hypot(x - ex, y - clampedY);
        if (d < bestDist) {
          bestDist = d;
          bestMove = { type: 'v', r, c };
        }
      }
    }

    return bestMove;
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactiveRef.current) {
      hoverEdgeRef.current = null;
      return;
    }
    hoverEdgeRef.current = findNearestEdge(e.clientX, e.clientY);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactiveRef.current) return;
    isTouchPointerRef.current = e.pointerType === 'touch';
    const edge = findNearestEdge(e.clientX, e.clientY);
    hoverEdgeRef.current = edge;
    if (!isTouchPointerRef.current && edge) {
      // Desktop mouse click commits immediately
      hoverEdgeRef.current = null;
      onSelectEdge(edge);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactiveRef.current) return;
    if (isTouchPointerRef.current) {
      const edge = findNearestEdge(e.clientX, e.clientY) ?? hoverEdgeRef.current;
      hoverEdgeRef.current = null;
      if (edge) {
        onSelectEdge(edge);
      }
    }
  };

  const handlePointerLeave = () => {
    hoverEdgeRef.current = null;
  };

  // Responsive ResizeObserver + 60fps Canvas Render Loop
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const side = Math.max(220, Math.floor(Math.min(rect.width, rect.height)));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = side * dpr;
      canvas.height = side * dpr;
      canvas.style.width = `${side}px`;
      canvas.style.height = `${side}px`;

      const n = boardRef.current.gridSize;
      const pad = n >= 12 ? 14 : n >= 8 ? 18 : 24;
      const spacing = (side - pad * 2) / (n - 1);
      layoutRef.current = { width: side, height: side, pad, spacing };
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);

    let rafId = 0;
    let lastTime = performance.now();

    const drawRoundedRect = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) => {
      const rad = Math.min(r, w / 2, h / 2);
      c.beginPath();
      c.moveTo(x + rad, y);
      c.lineTo(x + w - rad, y);
      c.quadraticCurveTo(x + w, y, x + w, y + rad);
      c.lineTo(x + w, y + h - rad);
      c.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
      c.lineTo(x + rad, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - rad);
      c.lineTo(x, y + rad);
      c.quadraticCurveTo(x, y, x + rad, y);
      c.closePath();
    };

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const state = boardRef.current;
      const t = themeRef.current;
      const glowMult = highGlowRef.current ? 1 : 0.45;
      const n = state.gridSize;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Recompute spacing in case gridSize changed
      const side = layoutRef.current.width;
      const pad = n >= 12 ? 14 : n >= 8 ? 18 : 24;
      const spacing = (side - pad * 2) / (n - 1);
      layoutRef.current.pad = pad;
      layoutRef.current.spacing = spacing;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, side, side);

      // 1. Subtle ambient cyber stardust
      for (const sp of ambientRef.current) {
        sp.x = (sp.x + sp.vx + 1) % 1;
        sp.y = (sp.y + sp.vy + 1) % 1;
        ctx.fillStyle = sp.isP1 ? t.p1 : t.p2;
        ctx.globalAlpha = sp.alpha * 0.55;
        ctx.beginPath();
        ctx.arc(sp.x * side, sp.y * side, sp.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const lineW = n >= 12 ? 2.4 : n >= 8 ? 3.2 : 4.2;
      const dotR = n >= 12 ? 3.6 : n >= 10 ? 4.4 : n >= 8 ? 5.2 : 6.8;

      // 2. Subtle dashed orthogonal guide slots for empty edges
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.24)';
      ctx.lineWidth = n >= 12 ? 1 : 1.5;
      ctx.setLineDash([Math.max(3, spacing * 0.14), Math.max(4, spacing * 0.16)]);

      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n - 1; c++) {
          if (state.hEdges[r][c] === 0) {
            const x1 = pad + c * spacing + dotR + 3;
            const x2 = pad + (c + 1) * spacing - dotR - 3;
            const y = pad + r * spacing;
            if (x2 > x1) {
              ctx.beginPath();
              ctx.moveTo(x1, y);
              ctx.lineTo(x2, y);
              ctx.stroke();
            }
          }
        }
      }
      for (let r = 0; r < n - 1; r++) {
        for (let c = 0; c < n; c++) {
          if (state.vEdges[r][c] === 0) {
            const x = pad + c * spacing;
            const y1 = pad + r * spacing + dotR + 3;
            const y2 = pad + (r + 1) * spacing - dotR - 3;
            if (y2 > y1) {
              ctx.beginPath();
              ctx.moveTo(x, y1);
              ctx.lineTo(x, y2);
              ctx.stroke();
            }
          }
        }
      }
      ctx.restore();

      // 3. Captured 1x1 Neon Glass Boxes with B1 / B2 stamps
      // Update pop animations
      boxPopsRef.current = boxPopsRef.current.filter((p) => {
        p.age += dt;
        return p.age < p.duration;
      });

      const boxInset = Math.max(3, spacing * 0.14);
      const boxSize = spacing - boxInset * 2;

      for (let r = 0; r < n - 1; r++) {
        for (let c = 0; c < n - 1; c++) {
          const owner = state.boxes[r][c];
          if (owner === 0) continue;

          const pop = boxPopsRef.current.find((p) => p.r === r && p.c === c);
          const scale = pop
            ? 0.55 + 0.45 * Math.sin(Math.min(1, pop.age / pop.duration) * (Math.PI / 2)) * (1 + 0.12 * Math.sin(Math.min(1, pop.age / pop.duration) * Math.PI))
            : 1;

          const cx = pad + (c + 0.5) * spacing;
          const cy = pad + (r + 0.5) * spacing;
          const drawSize = boxSize * scale;
          const bx = cx - drawSize / 2;
          const by = cy - drawSize / 2;

          const color = owner === 1 ? t.p1 : t.p2;
          const softFill = owner === 1 ? t.p1Soft : t.p2Soft;

          ctx.save();
          // Translucent neon glass fill
          ctx.fillStyle = softFill;
          ctx.shadowColor = color;
          ctx.shadowBlur = 12 * glowMult;
          drawRoundedRect(ctx, bx, by, drawSize, drawSize, Math.max(3, drawSize * 0.14));
          ctx.fill();

          // Crisp glowing inner frame
          ctx.strokeStyle = color;
          ctx.lineWidth = n >= 12 ? 1.2 : 1.8;
          ctx.stroke();

          // Stamp label B1 / B2 (cleanly scaled to fit even 14x14!)
          if (drawSize >= 14) {
            const fontSize = Math.max(8, Math.floor(drawSize * 0.36));
            ctx.shadowBlur = 6 * glowMult;
            ctx.fillStyle = owner === 1 ? '#ffd8df' : '#d6ffff';
            ctx.font = `700 ${fontSize}px Vazirmatn, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(owner === 1 ? 'B1' : 'B2', cx, cy + 0.5);
          }
          ctx.restore();
        }
      }

      // 4. 50% Opacity Hover / Touch Preview Edge
      const hovered = hoverEdgeRef.current;
      if (hovered && interactiveRef.current) {
        const pColor = state.currentPlayer === 1 ? t.p1 : t.p2;
        const x1 = pad + hovered.c * spacing;
        const y1 = pad + hovered.r * spacing;
        const x2 = hovered.type === 'h' ? x1 + spacing : x1;
        const y2 = hovered.type === 'v' ? y1 + spacing : y1;

        ctx.save();
        ctx.globalAlpha = 0.52;
        ctx.strokeStyle = pColor;
        ctx.shadowColor = pColor;
        ctx.shadowBlur = 16 * glowMult;
        ctx.lineCap = 'round';
        ctx.lineWidth = lineW + 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1.2, lineW * 0.4);
        ctx.stroke();
        ctx.restore();
      }

      // 5. Placed Laser Lines (Multi-pass Beat Saber neon bloom + hot white core)
      edgeFlashesRef.current = edgeFlashesRef.current.filter((f) => {
        f.age += dt;
        return f.age < f.duration;
      });

      const drawLaserSegment = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        owner: PlayerId,
        isLast: boolean,
        flashBoost: number
      ) => {
        const color = owner === 1 ? t.p1 : t.p2;
        ctx.save();
        ctx.lineCap = 'round';

        // Outer neon bloom
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = (isLast ? 20 : 13) * glowMult + flashBoost * 16;
        ctx.lineWidth = lineW + 1.5 + flashBoost * 2.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Bright incandescent inner core
        ctx.shadowBlur = 4 * glowMult;
        ctx.strokeStyle = owner === 1 ? '#ffdce3' : '#dcffff';
        ctx.lineWidth = Math.max(1.2, lineW * 0.45);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
      };

      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n - 1; c++) {
          const owner = state.hEdges[r][c];
          if (owner !== 0) {
            const isLast =
              state.lastMove?.type === 'h' &&
              state.lastMove.r === r &&
              state.lastMove.c === c;
            const flash = edgeFlashesRef.current.find(
              (f) => f.move.type === 'h' && f.move.r === r && f.move.c === c
            );
            const boost = flash ? 1 - flash.age / flash.duration : 0;
            drawLaserSegment(
              pad + c * spacing,
              pad + r * spacing,
              pad + (c + 1) * spacing,
              pad + r * spacing,
              owner,
              isLast,
              boost
            );
          }
        }
      }

      for (let r = 0; r < n - 1; r++) {
        for (let c = 0; c < n; c++) {
          const owner = state.vEdges[r][c];
          if (owner !== 0) {
            const isLast =
              state.lastMove?.type === 'v' &&
              state.lastMove.r === r &&
              state.lastMove.c === c;
            const flash = edgeFlashesRef.current.find(
              (f) => f.move.type === 'v' && f.move.r === r && f.move.c === c
            );
            const boost = flash ? 1 - flash.age / flash.duration : 0;
            drawLaserSegment(
              pad + c * spacing,
              pad + r * spacing,
              pad + c * spacing,
              pad + (r + 1) * spacing,
              owner,
              isLast,
              boost
            );
          }
        }
      }

      // 6. Glowing Orthogonal Dots (Additive sprite texture + crisp programmatic core)
      const gameplayImg = spriteImagesRef.current.gameplay;
      const dotSprite = SPRITES.dotGlow;

      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const dx = pad + c * spacing;
          const dy = pad + r * spacing;

          if (gameplayImg && t.id === 'cyber-classic') {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const spriteDraw = dotR * 3.1;
            ctx.drawImage(
              gameplayImg,
              dotSprite.x,
              dotSprite.y,
              dotSprite.w,
              dotSprite.h,
              dx - spriteDraw / 2,
              dy - spriteDraw / 2,
              spriteDraw,
              spriteDraw
            );
            ctx.restore();
          }

          // Crisp programmatic dot core (ensures sharpness at every DPI and every Neon Vault theme)
          ctx.save();
          ctx.fillStyle = t.dotCore;
          ctx.shadowColor = t.dotGlow;
          ctx.shadowBlur = 12 * glowMult;
          ctx.beginPath();
          ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 7. Additive Sprite Sheet Spark Bursts ('lighter' composite)
      burstsRef.current = burstsRef.current.filter((b) => {
        b.age += dt;
        return b.age < b.duration;
      });

      if (burstsRef.current.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const b of burstsRef.current) {
          const progress = b.age / b.duration;
          const alpha = Math.max(0, 1 - progress);
          const rad = b.radius * (0.45 + 0.85 * progress);

          if (gameplayImg && t.id === 'cyber-classic') {
            const spr = b.player === 1 ? SPRITES.redSparkBurst : SPRITES.cyanSparkBurst;
            ctx.globalAlpha = alpha * 0.95;
            ctx.drawImage(
              gameplayImg,
              spr.x,
              spr.y,
              spr.w,
              spr.h,
              b.x - rad,
              b.y - rad,
              rad * 2,
              rad * 2
            );
          } else {
            const color = b.player === 1 ? t.p1 : t.p2;
            const grad = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, rad);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.35, color);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.globalAlpha = alpha * 0.85;
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(b.x, b.y, rad, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // 8. Dynamic Neon Spark Particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.92;
        p.vy *= 0.92;
        return p.life < p.maxLife;
      });

      if (particlesRef.current.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const p of particlesRef.current) {
          const alpha = Math.max(0, 1 - p.life / p.maxLife);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8 * glowMult;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * alpha), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center touch-none select-none"
    >
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className={`block ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
        aria-label="صفحه بازی نقطه و خط"
      />
    </div>
  );
};

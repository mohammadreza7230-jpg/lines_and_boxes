import React, { useCallback, useEffect, useRef } from 'react';
import { NeonTheme } from '../config/assetsConfig';
import { BoardState, CapturedBoxCoord, EdgeMove, PlayerId } from '../engine/dotsAndBoxes';
import { useCroppedCanvasSprites } from './SpriteView';

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
  player: PlayerId;
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

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

/**
 * Zero-shadowBlur multi-pass vector neon laser beam.
 * Runs ~20x faster than ctx.shadowBlur on Android WebView / mobile GPUs while
 * delivering crisp Beat Saber laser bloom + hot white core.
 */
function drawNeonLaser(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  coreColor: string,
  lineW: number,
  highGlow: boolean,
  alphaScale = 1,
  boost = 0
) {
  ctx.lineCap = 'round';

  if (highGlow) {
    // Wide outer neon bloom
    ctx.globalAlpha = 0.2 * alphaScale;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineW + 9 + boost * 6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Mid tight glow halo
  ctx.globalAlpha = 0.55 * alphaScale;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineW + 3.5 + boost * 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Solid laser tube
  ctx.globalAlpha = 0.95 * alphaScale;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineW + 0.6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Incandescent white-tinted filament core
  ctx.globalAlpha = alphaScale;
  ctx.strokeStyle = coreColor;
  ctx.lineWidth = Math.max(1.2, lineW * 0.42);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

function drawCapturedBox(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  drawSize: number,
  owner: PlayerId,
  theme: NeonTheme,
  gridSize: number,
  highGlow: boolean
) {
  const bx = cx - drawSize / 2;
  const by = cy - drawSize / 2;
  const radius = Math.max(3, drawSize * 0.14);
  const color = owner === 1 ? theme.p1 : theme.p2;
  const softFill = owner === 1 ? theme.p1Soft : theme.p2Soft;

  // Outer soft halo (zero shadowBlur!)
  if (highGlow) {
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = color;
    ctx.lineWidth = gridSize >= 12 ? 3.5 : 5;
    drawRoundedRectPath(ctx, bx, by, drawSize, drawSize, radius);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Translucent neon glass fill
  ctx.fillStyle = softFill;
  drawRoundedRectPath(ctx, bx, by, drawSize, drawSize, radius);
  ctx.fill();

  // Crisp glowing border
  ctx.strokeStyle = color;
  ctx.lineWidth = gridSize >= 12 ? 1.25 : 1.75;
  ctx.stroke();

  // Stamp label B1 / B2
  if (drawSize >= 14) {
    const fontSize = Math.max(8, Math.floor(drawSize * 0.36));
    ctx.fillStyle = owner === 1 ? '#ffd8df' : '#d6ffff';
    ctx.font = `700 ${fontSize}px Vazirmatn, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(owner === 1 ? 'B1' : 'B2', cx, cy + 0.5);
  }
}

/**
 * Pre-renders a single crisp glowing dot sprite onto a tiny offscreen canvas.
 * Blitting this tiny sprite for all 16..196 dots takes <0.1ms with zero shadowBlur.
 */
function buildDotSprite(dotR: number, theme: NeonTheme, highGlow: boolean, dpr: number): HTMLCanvasElement {
  const haloR = highGlow ? dotR * 2.6 : dotR * 1.8;
  const logicalSize = Math.ceil(haloR * 2 + 2);
  const c = document.createElement('canvas');
  c.width = Math.ceil(logicalSize * dpr);
  c.height = Math.ceil(logicalSize * dpr);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const mid = logicalSize / 2;

  // Radial neon glow halo
  const grad = ctx.createRadialGradient(mid, mid, dotR * 0.4, mid, mid, haloR);
  grad.addColorStop(0, theme.dotCore);
  grad.addColorStop(0.38, theme.dotGlow);
  grad.addColorStop(0.7, `${theme.dotGlow}44`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(mid, mid, haloR, 0, Math.PI * 2);
  ctx.fill();

  // Crisp white core
  ctx.fillStyle = theme.dotCore;
  ctx.beginPath();
  ctx.arc(mid, mid, dotR, 0, Math.PI * 2);
  ctx.fill();

  return c;
}

export const GameBoardCanvas: React.FC<GameBoardCanvasProps> = React.memo(
  ({ board, theme, highGlow, interactive, onSelectEdge, fxTrigger }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const dotSpriteRef = useRef<{ key: string; canvas: HTMLCanvasElement; halfSize: number } | null>(
      null
    );

    const croppedSprites = useCroppedCanvasSprites();
    const croppedSpritesRef = useRef(croppedSprites);
    croppedSpritesRef.current = croppedSprites;

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
    const layoutRef = useRef({ side: 340, pad: 22, spacing: 40, dpr: 1 });
    const isTouchPointerRef = useRef(false);

    const rafIdRef = useRef<number>(0);
    const lastFrameRef = useRef<number>(0);

    // Rebuild the cached static board canvas (called ONLY when board/theme/size/glow changes!)
    const rebuildStaticLayer = useCallback(() => {
      const { side, dpr } = layoutRef.current;
      const state = boardRef.current;
      const t = themeRef.current;
      const glow = highGlowRef.current;
      const n = state.gridSize;

      const pad = n >= 12 ? 14 : n >= 8 ? 18 : 24;
      const spacing = (side - pad * 2) / (n - 1);
      layoutRef.current.pad = pad;
      layoutRef.current.spacing = spacing;

      if (!staticCanvasRef.current) {
        staticCanvasRef.current = document.createElement('canvas');
      }
      const sCanvas = staticCanvasRef.current;
      const pxSize = Math.ceil(side * dpr);
      if (sCanvas.width !== pxSize || sCanvas.height !== pxSize) {
        sCanvas.width = pxSize;
        sCanvas.height = pxSize;
      }

      const ctx = sCanvas.getContext('2d');
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, side, side);

      const lineW = n >= 12 ? 2.4 : n >= 8 ? 3.2 : 4.2;
      const dotR = n >= 12 ? 3.5 : n >= 10 ? 4.3 : n >= 8 ? 5.1 : 6.6;

      // 1. Subtle dashed orthogonal guide slots (batched into single path!)
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.24)';
      ctx.lineWidth = n >= 12 ? 1 : 1.5;
      ctx.setLineDash([Math.max(3, spacing * 0.14), Math.max(4, spacing * 0.16)]);
      ctx.beginPath();
      for (let r = 0; r < n; r++) {
        const y = pad + r * spacing;
        for (let c = 0; c < n - 1; c++) {
          if (state.hEdges[r][c] === 0) {
            const x1 = pad + c * spacing + dotR + 3;
            const x2 = pad + (c + 1) * spacing - dotR - 3;
            if (x2 > x1) {
              ctx.moveTo(x1, y);
              ctx.lineTo(x2, y);
            }
          }
        }
      }
      for (let r = 0; r < n - 1; r++) {
        const y1 = pad + r * spacing + dotR + 3;
        const y2 = pad + (r + 1) * spacing - dotR - 3;
        if (y2 <= y1) continue;
        for (let c = 0; c < n; c++) {
          if (state.vEdges[r][c] === 0) {
            const x = pad + c * spacing;
            ctx.moveTo(x, y1);
            ctx.lineTo(x, y2);
          }
        }
      }
      ctx.stroke();
      ctx.restore();

      // 2. Captured 1x1 Neon Glass Boxes
      const boxInset = Math.max(3, spacing * 0.14);
      const boxSize = spacing - boxInset * 2;
      for (let r = 0; r < n - 1; r++) {
        for (let c = 0; c < n - 1; c++) {
          const owner = state.boxes[r][c];
          if (owner === 0) continue;
          drawCapturedBox(
            ctx,
            pad + (c + 0.5) * spacing,
            pad + (r + 0.5) * spacing,
            boxSize,
            owner,
            t,
            n,
            glow
          );
        }
      }

      // 3. Placed Laser Lines (Zero shadowBlur!)
      for (let r = 0; r < n; r++) {
        const y = pad + r * spacing;
        for (let c = 0; c < n - 1; c++) {
          const owner = state.hEdges[r][c];
          if (owner !== 0) {
            const isLast =
              state.lastMove?.type === 'h' &&
              state.lastMove.r === r &&
              state.lastMove.c === c;
            drawNeonLaser(
              ctx,
              pad + c * spacing,
              y,
              pad + (c + 1) * spacing,
              y,
              owner === 1 ? t.p1 : t.p2,
              owner === 1 ? '#ffdce3' : '#dcffff',
              lineW,
              glow,
              1,
              isLast ? 0.35 : 0
            );
          }
        }
      }

      for (let r = 0; r < n - 1; r++) {
        const y1 = pad + r * spacing;
        const y2 = pad + (r + 1) * spacing;
        for (let c = 0; c < n; c++) {
          const owner = state.vEdges[r][c];
          if (owner !== 0) {
            const isLast =
              state.lastMove?.type === 'v' &&
              state.lastMove.r === r &&
              state.lastMove.c === c;
            const x = pad + c * spacing;
            drawNeonLaser(
              ctx,
              x,
              y1,
              x,
              y2,
              owner === 1 ? t.p1 : t.p2,
              owner === 1 ? '#ffdce3' : '#dcffff',
              lineW,
              glow,
              1,
              isLast ? 0.35 : 0
            );
          }
        }
      }

      // 4. Pre-rendered Glowing Dots (instantaneous offscreen blit!)
      const dotKey = `${t.id}-${dotR}-${glow}-${dpr}`;
      if (!dotSpriteRef.current || dotSpriteRef.current.key !== dotKey) {
        const dc = buildDotSprite(dotR, t, glow, dpr);
        dotSpriteRef.current = {
          key: dotKey,
          canvas: dc,
          halfSize: dc.width / dpr / 2,
        };
      }
      const { canvas: dotCanvas, halfSize } = dotSpriteRef.current;
      const drawDim = halfSize * 2;
      for (let r = 0; r < n; r++) {
        const dy = pad + r * spacing - halfSize;
        for (let c = 0; c < n; c++) {
          ctx.drawImage(dotCanvas, pad + c * spacing - halfSize, dy, drawDim, drawDim);
        }
      }
    }, []);

    // Composite static layer + active FX/hover; stops automatically when idle (0% idle CPU/GPU!)
    const renderFrame = useCallback((now: number) => {
      rafIdRef.current = 0;
      const canvas = canvasRef.current;
      const sCanvas = staticCanvasRef.current;
      if (!canvas || !sCanvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dt = lastFrameRef.current ? Math.min(0.05, (now - lastFrameRef.current) / 1000) : 0.016;
      lastFrameRef.current = now;

      const { pad, spacing, dpr } = layoutRef.current;
      const state = boardRef.current;
      const t = themeRef.current;
      const glow = highGlowRef.current;
      const n = state.gridSize;
      const lineW = n >= 12 ? 2.4 : n >= 8 ? 3.2 : 4.2;

      // Blit cached static board in 1 ultra-fast drawImage call
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(sCanvas, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 1. 50% Opacity Hover / Touch Preview Edge
      const hovered = hoverEdgeRef.current;
      if (hovered && interactiveRef.current) {
        const isP1 = state.currentPlayer === 1;
        const x1 = pad + hovered.c * spacing;
        const y1 = pad + hovered.r * spacing;
        const x2 = hovered.type === 'h' ? x1 + spacing : x1;
        const y2 = hovered.type === 'v' ? y1 + spacing : y1;
        drawNeonLaser(
          ctx,
          x1,
          y1,
          x2,
          y2,
          isP1 ? t.p1 : t.p2,
          '#ffffff',
          lineW + 1,
          glow,
          0.52,
          0.2
        );
      }

      // 2. Active Edge Flash Pulse
      if (edgeFlashesRef.current.length > 0) {
        edgeFlashesRef.current = edgeFlashesRef.current.filter((f) => {
          f.age += dt;
          return f.age < f.duration;
        });
        for (const f of edgeFlashesRef.current) {
          const boost = 1 - f.age / f.duration;
          const x1 = pad + f.move.c * spacing;
          const y1 = pad + f.move.r * spacing;
          const x2 = f.move.type === 'h' ? x1 + spacing : x1;
          const y2 = f.move.type === 'v' ? y1 + spacing : y1;
          drawNeonLaser(
            ctx,
            x1,
            y1,
            x2,
            y2,
            f.player === 1 ? t.p1 : t.p2,
            '#ffffff',
            lineW,
            glow,
            boost,
            boost * 1.4
          );
        }
      }

      // 3. Active Box Capture Pop Pulse (lightweight expanding neon ring)
      if (boxPopsRef.current.length > 0) {
        const boxInset = Math.max(3, spacing * 0.14);
        const boxSize = spacing - boxInset * 2;
        boxPopsRef.current = boxPopsRef.current.filter((p) => {
          p.age += dt;
          return p.age < p.duration;
        });
        for (const p of boxPopsRef.current) {
          const prog = p.age / p.duration;
          const cx = pad + (p.c + 0.5) * spacing;
          const cy = pad + (p.r + 0.5) * spacing;
          const sz = boxSize * (0.9 + prog * 0.35);
          ctx.globalAlpha = (1 - prog) * 0.75;
          ctx.strokeStyle = p.player === 1 ? t.p1 : t.p2;
          ctx.lineWidth = 2.5 * (1 - prog * 0.5);
          drawRoundedRectPath(ctx, cx - sz / 2, cy - sz / 2, sz, sz, Math.max(3, sz * 0.14));
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // 4. Pre-cropped Additive Spark Bursts (112x112 tiny offscreen canvas, NEVER 1536x2752!)
      if (burstsRef.current.length > 0) {
        burstsRef.current = burstsRef.current.filter((b) => {
          b.age += dt;
          return b.age < b.duration;
        });
        const { redSpark, cyanSpark } = croppedSpritesRef.current;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const b of burstsRef.current) {
          const progress = b.age / b.duration;
          const alpha = Math.max(0, 1 - progress);
          const rad = b.radius * (0.45 + 0.75 * progress);
          const spr = b.player === 1 ? redSpark : cyanSpark;

          if (spr && t.id === 'cyber-classic') {
            ctx.globalAlpha = alpha * 0.9;
            ctx.drawImage(spr, b.x - rad, b.y - rad, rad * 2, rad * 2);
          } else {
            const color = b.player === 1 ? t.p1 : t.p2;
            const grad = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, rad);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.35, color);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.globalAlpha = alpha * 0.8;
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(b.x, b.y, rad, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // 5. Lightweight Spark Particles (zero shadowBlur!)
      if (particlesRef.current.length > 0) {
        particlesRef.current = particlesRef.current.filter((p) => {
          p.life += dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.91;
          p.vy *= 0.91;
          return p.life < p.maxLife;
        });

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const p of particlesRef.current) {
          const alpha = Math.max(0, 1 - p.life / p.maxLife);
          const sz = p.size * (0.5 + 0.5 * alpha);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - sz, p.y - sz, sz * 2, sz * 2);
        }
        ctx.restore();
      }

      // Continue rAF ONLY while dynamic animations are active; sleep at 0% CPU when idle!
      const hasActiveFx =
        edgeFlashesRef.current.length > 0 ||
        boxPopsRef.current.length > 0 ||
        burstsRef.current.length > 0 ||
        particlesRef.current.length > 0;

      if (hasActiveFx) {
        rafIdRef.current = requestAnimationFrame(renderFrame);
      } else {
        lastFrameRef.current = 0;
      }
    }, []);

    const scheduleRender = useCallback(() => {
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(renderFrame);
      }
    }, [renderFrame]);

    // Rebuild static board layer whenever board state, theme, or glow changes
    useEffect(() => {
      rebuildStaticLayer();
      scheduleRender();
    }, [board, theme, highGlow, rebuildStaticLayer, scheduleRender]);

    // Spawn lightweight spark FX when a move/capture happens
    useEffect(() => {
      if (!fxTrigger || !fxTrigger.move) return;
      const { pad, spacing } = layoutRef.current;
      const { move, player, capturedBoxes } = fxTrigger;
      const color = player === 1 ? themeRef.current.p1 : themeRef.current.p2;

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
        duration: 0.28,
      });

      burstsRef.current.push({
        x: mx,
        y: my,
        player,
        age: 0,
        duration: 0.28,
        radius: Math.max(20, spacing * 0.72),
      });

      // Keep total particles capped for locked 60-120fps on mobile
      if (particlesRef.current.length < 48) {
        for (let i = 0; i < 10; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 45 + Math.random() * 120;
          particlesRef.current.push({
            x: mx,
            y: my,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            life: 0,
            maxLife: 0.28 + Math.random() * 0.2,
            size: 1.4 + Math.random() * 1.8,
            color,
          });
        }
      }

      for (const box of capturedBoxes) {
        boxPopsRef.current.push({
          r: box.r,
          c: box.c,
          player,
          age: 0,
          duration: 0.32,
        });

        const bx = pad + (box.c + 0.5) * spacing;
        const by = pad + (box.r + 0.5) * spacing;
        burstsRef.current.push({
          x: bx,
          y: by,
          player,
          age: 0,
          duration: 0.38,
          radius: Math.max(28, spacing * 1.05),
        });

        if (particlesRef.current.length < 64) {
          for (let i = 0; i < 14; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 55 + Math.random() * 145;
            particlesRef.current.push({
              x: bx,
              y: by,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              life: 0,
              maxLife: 0.34 + Math.random() * 0.24,
              size: 1.5 + Math.random() * 2.2,
              color: i % 4 === 0 ? '#ffffff' : color,
            });
          }
        }
      }

      scheduleRender();
    }, [fxTrigger, scheduleRender]);

    // Responsive ResizeObserver (cap DPR at 2 for razor-sharp visuals without overdraw)
    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const updateSize = () => {
        const w = container.clientWidth || container.getBoundingClientRect().width;
        const h = container.clientHeight || container.getBoundingClientRect().height;
        const side = Math.max(220, Math.floor(Math.min(w, h)));
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const px = Math.ceil(side * dpr);
        if (canvas.width !== px || canvas.height !== px) {
          canvas.width = px;
          canvas.height = px;
          canvas.style.width = `${side}px`;
          canvas.style.height = `${side}px`;
        }
        layoutRef.current.side = side;
        layoutRef.current.dpr = dpr;
        rebuildStaticLayer();
        scheduleRender();
      };

      updateSize();
      const ro = new ResizeObserver(updateSize);
      ro.observe(container);

      return () => {
        ro.disconnect();
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = 0;
        }
      };
    }, [rebuildStaticLayer, scheduleRender]);

    // Orthogonal edge hit detection with generous mobile touch hitbox
    const findNearestEdge = useCallback((clientX: number, clientY: number): EdgeMove | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const { pad, spacing } = layoutRef.current;
      const state = boardRef.current;
      const n = state.gridSize;

      const maxDist = Math.max(spacing * 0.46, 17);
      let bestMove: EdgeMove | null = null;
      let bestDist = maxDist;

      for (let r = 0; r < n; r++) {
        const ey = pad + r * spacing;
        if (Math.abs(y - ey) > bestDist) continue;
        for (let c = 0; c < n - 1; c++) {
          if (state.hEdges[r][c] !== 0) continue;
          const x1 = pad + c * spacing;
          const x2 = x1 + spacing;
          const clampedX = Math.max(x1 + spacing * 0.12, Math.min(x2 - spacing * 0.12, x));
          const d = Math.hypot(x - clampedX, y - ey);
          if (d < bestDist) {
            bestDist = d;
            bestMove = { type: 'h', r, c };
          }
        }
      }

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

    const isSameEdge = (a: EdgeMove | null, b: EdgeMove | null) =>
      a === b || (a !== null && b !== null && a.type === b.type && a.r === b.r && a.c === b.c);

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!interactiveRef.current) {
        if (hoverEdgeRef.current !== null) {
          hoverEdgeRef.current = null;
          scheduleRender();
        }
        return;
      }
      const nextEdge = findNearestEdge(e.clientX, e.clientY);
      if (!isSameEdge(hoverEdgeRef.current, nextEdge)) {
        hoverEdgeRef.current = nextEdge;
        scheduleRender();
      }
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!interactiveRef.current) return;
      isTouchPointerRef.current = e.pointerType === 'touch';
      const edge = findNearestEdge(e.clientX, e.clientY);
      if (!isTouchPointerRef.current && edge) {
        hoverEdgeRef.current = null;
        onSelectEdge(edge);
      } else {
        hoverEdgeRef.current = edge;
        scheduleRender();
      }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!interactiveRef.current) return;
      if (isTouchPointerRef.current) {
        const edge = findNearestEdge(e.clientX, e.clientY) ?? hoverEdgeRef.current;
        hoverEdgeRef.current = null;
        scheduleRender();
        if (edge) {
          onSelectEdge(edge);
        }
      }
    };

    const handlePointerLeave = () => {
      if (hoverEdgeRef.current !== null) {
        hoverEdgeRef.current = null;
        scheduleRender();
      }
    };

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
  }
);

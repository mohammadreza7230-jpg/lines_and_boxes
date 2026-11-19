import React, { useEffect, useState } from 'react';
import { SPRITES, SPRITE_SHEETS, SpriteKey, SpriteSheetKey } from '../config/assetsConfig';

/**
 * High-performance client-side Sprite Sheet Slicer & Cache.
 * Instead of forcing Android WebView to decode & composite massive 1536x2752 (16MB RGBA)
 * bitmaps inside every DOM element or Canvas draw call, we load each sheet ONCE,
 * crop out tiny crisp sprites onto small offscreen canvases (e.g. 128x128), and cache
 * both the offscreen HTMLCanvasElement (for instant Canvas blitting) and a tiny data URL
 * (for lightweight DOM <img> rendering).
 */

const sheetPromises: Partial<Record<SpriteSheetKey, Promise<HTMLImageElement | null>>> = {};
const croppedCanvasCache: Partial<Record<SpriteKey, HTMLCanvasElement>> = {};
const croppedUrlCache: Partial<Record<SpriteKey, string>> = {};

function loadSheetOnce(sheetKey: SpriteSheetKey): Promise<HTMLImageElement | null> {
  if (!sheetPromises[sheetKey]) {
    sheetPromises[sheetKey] = new Promise((resolve) => {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = SPRITE_SHEETS[sheetKey].src;
    });
  }
  return sheetPromises[sheetKey]!;
}

async function getCroppedSpriteCanvas(spriteKey: SpriteKey, maxDim = 160): Promise<HTMLCanvasElement | null> {
  if (croppedCanvasCache[spriteKey]) {
    return croppedCanvasCache[spriteKey]!;
  }
  const rect = SPRITES[spriteKey];
  const img = await loadSheetOnce(rect.sheet);
  if (!img) return null;

  const scale = Math.min(1, maxDim / Math.max(rect.w, rect.h));
  const outW = Math.max(1, Math.round(rect.w * scale));
  const outH = Math.max(1, Math.round(rect.h * scale));

  const c = document.createElement('canvas');
  c.width = outW;
  c.height = outH;
  const ctx = c.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, outW, outH);
  croppedCanvasCache[spriteKey] = c;
  return c;
}

async function getCroppedSpriteUrl(spriteKey: SpriteKey): Promise<string | null> {
  if (croppedUrlCache[spriteKey]) {
    return croppedUrlCache[spriteKey]!;
  }
  const c = await getCroppedSpriteCanvas(spriteKey, 160);
  if (!c) return null;
  try {
    const url = c.toDataURL('image/jpeg', 0.88);
    croppedUrlCache[spriteKey] = url;
    return url;
  } catch {
    return null;
  }
}

/**
 * Preloads tiny pre-cropped offscreen canvases for Canvas gameplay bursts (redSparkBurst, cyanSparkBurst).
 * Zero 1536x2752 sampling during gameplay frames!
 */
export function useCroppedCanvasSprites(): {
  redSpark: HTMLCanvasElement | null;
  cyanSpark: HTMLCanvasElement | null;
} {
  const [sprites, setSprites] = useState<{
    redSpark: HTMLCanvasElement | null;
    cyanSpark: HTMLCanvasElement | null;
  }>({
    redSpark: croppedCanvasCache.redSparkBurst ?? null,
    cyanSpark: croppedCanvasCache.cyanSparkBurst ?? null,
  });

  useEffect(() => {
    let active = true;
    Promise.all([
      getCroppedSpriteCanvas('redSparkBurst', 112),
      getCroppedSpriteCanvas('cyanSparkBurst', 112),
    ]).then(([redSpark, cyanSpark]) => {
      if (!active) return;
      setSprites({ redSpark, cyanSpark });
    });
    return () => {
      active = false;
    };
  }, []);

  return sprites;
}

interface SpriteSliceProps {
  sprite: SpriteKey;
  className?: string;
  blendScreen?: boolean;
  alt?: string;
  fallback?: React.ReactNode;
}

/**
 * Renders a pre-cropped, lightweight sprite (~15KB instead of a 16MB full sheet)
 * with optional `mix-blend-mode: screen` and instant programmatic fallback.
 */
export const SpriteSlice: React.FC<SpriteSliceProps> = React.memo(
  ({ sprite, className = '', blendScreen = true, alt = '', fallback }) => {
    const [srcUrl, setSrcUrl] = useState<string | null>(croppedUrlCache[sprite] ?? null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
      let active = true;
      if (croppedUrlCache[sprite]) {
        setSrcUrl(croppedUrlCache[sprite]!);
        return;
      }
      getCroppedSpriteUrl(sprite).then((url) => {
        if (!active) return;
        if (url) setSrcUrl(url);
        else setFailed(true);
      });
      return () => {
        active = false;
      };
    }, [sprite]);

    if (failed || !srcUrl) {
      return fallback ? <>{fallback}</> : null;
    }

    return (
      <img
        src={srcUrl}
        alt={alt}
        referrerPolicy="no-referrer"
        draggable={false}
        onError={() => setFailed(true)}
        className={`select-none pointer-events-none object-cover ${
          blendScreen ? 'mix-blend-screen' : ''
        } ${className}`}
      />
    );
  }
);

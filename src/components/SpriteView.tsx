import React, { useEffect, useState } from 'react';
import { SPRITES, SPRITE_SHEETS, SpriteKey, SpriteSheetKey } from '../config/assetsConfig';

/**
 * Preloads sprite sheets as HTMLImageElements for Canvas additive ('lighter') rendering,
 * cleanly falling back to programmatic neon canvas drawing if an image fails to load.
 */
export function useSpriteImages(): Partial<Record<SpriteSheetKey, HTMLImageElement>> {
  const [images, setImages] = useState<Partial<Record<SpriteSheetKey, HTMLImageElement>>>({});

  useEffect(() => {
    let active = true;
    const keys: SpriteSheetKey[] = ['gameplay', 'mainMenu', 'setup', 'pause'];

    keys.forEach((key) => {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.onload = () => {
        if (!active) return;
        setImages((prev) => ({ ...prev, [key]: img }));
      };
      img.onerror = () => {
        // Fallback handled automatically by canvas renderer
      };
      img.src = SPRITE_SHEETS[key].src;
    });

    return () => {
      active = false;
    };
  }, []);

  return images;
}

interface SpriteSliceProps {
  sprite: SpriteKey;
  className?: string;
  blendScreen?: boolean;
  alt?: string;
  fallback?: React.ReactNode;
}

/**
 * Renders a cropped sprite directly from the pure-black Sprite Sheets using CSS object scaling
 * and `mix-blend-mode: screen` so black backgrounds vanish cleanly into the neon UI.
 * Automatically renders the crisp programmatic fallback if the sprite sheet fails to load.
 */
export const SpriteSlice: React.FC<SpriteSliceProps> = ({
  sprite,
  className = '',
  blendScreen = true,
  alt = '',
  fallback,
}) => {
  const [failed, setFailed] = useState(false);
  const rect = SPRITES[sprite];
  const sheet = SPRITE_SHEETS[rect.sheet];

  if (failed && fallback) {
    return <>{fallback}</>;
  }

  const widthPct = (sheet.width / rect.w) * 100;
  const heightPct = (sheet.height / rect.h) * 100;
  const leftPct = -(rect.x / rect.w) * 100;
  const topPct = -(rect.y / rect.h) * 100;

  return (
    <div
      className={`relative overflow-hidden select-none pointer-events-none ${
        blendScreen ? 'mix-blend-screen' : ''
      } ${className}`}
      aria-label={alt || undefined}
      role={alt ? 'img' : undefined}
    >
      <img
        src={sheet.src}
        alt={alt}
        referrerPolicy="no-referrer"
        draggable={false}
        onError={() => setFailed(true)}
        style={{
          position: 'absolute',
          width: `${widthPct}%`,
          height: `${heightPct}%`,
          maxWidth: 'none',
          left: `${leftPct}%`,
          top: `${topPct}%`,
        }}
      />
    </div>
  );
};

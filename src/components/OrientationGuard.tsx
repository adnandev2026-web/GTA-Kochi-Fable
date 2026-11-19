import React, { useEffect, useState } from 'react';
import { RotateCw, Maximize2 } from 'lucide-react';

interface Props {
  enabled: boolean;
}

export const OrientationGuard: React.FC<Props> = ({ enabled }) => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsPortrait(false);
      return;
    }

    const check = () => {
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 960;
      setIsPortrait(portrait);
    };

    const tryLockLandscape = async () => {
      try {
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (mode: string) => Promise<void>;
        };
        if (orientation?.lock) {
          await orientation.lock('landscape');
        }
      } catch {
        // Screen orientation lock requires fullscreen or user gesture on some mobile browsers
      }
    };

    check();
    tryLockLandscape();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, [enabled]);

  if (!enabled || !isPortrait) return null;

  const requestLandscapeFullscreen = async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (mode: string) => Promise<void>;
      };
      if (orientation?.lock) {
        await orientation.lock('landscape');
      }
    } catch {
      // Fallback overlay stays visible until rotated
    }
  };

  return (
    <div className="orientation-guard" role="alertdialog" aria-live="assertive">
      <div className="orientation-card">
        <div className="orientation-icon">
          <RotateCw size={44} />
        </div>
        <h2>Landscape Mode Required</h2>
        <p>
          Rotate your phone or tablet horizontally to unlock dual-joystick movement, 360° aiming, and full-screen driving.
        </p>
        <button type="button" className="primary-btn" onClick={requestLandscapeFullscreen}>
          <Maximize2 size={16} />
          <span>Lock Landscape Fullscreen</span>
        </button>
      </div>
    </div>
  );
};

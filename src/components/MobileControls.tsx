import React, { useEffect, useRef, useState } from 'react';
import { Crosshair, Mic, MicOff, ZoomIn } from 'lucide-react';
import type { WeaponId } from './WeaponWheel';

interface Props {
  onAxes: (mx: number, my: number, sprint: boolean) => void;
  onLookDelta: (dx: number, dy: number) => void;
  onCombatButtons: (state: { fire?: boolean; aim?: boolean }) => void;
  onKey: (code: string, down: boolean) => void;
  onInteract: () => void;
  onToggleMap: () => void;
  onOpenWeaponWheel: () => void;
  onCycleZoom: () => void;
  onToggleMic?: () => void;
  currentWeapon: WeaponId;
  sniperZoom: number;
  voiceMuted?: boolean;
}

export const MobileControls: React.FC<Props> = ({
  onAxes,
  onLookDelta,
  onCombatButtons,
  onKey,
  onInteract,
  onToggleMap,
  onOpenWeaponWheel,
  onCycleZoom,
  onToggleMic,
  currentWeapon,
  sniperZoom,
  voiceMuted = true,
}) => {
  const leftPadRef = useRef<HTMLDivElement | null>(null);
  const rightPadRef = useRef<HTMLDivElement | null>(null);
  const [leftKnob, setLeftKnob] = useState({ x: 0, y: 0 });
  const [rightKnob, setRightKnob] = useState({ x: 0, y: 0 });
  const [aimLocked, setAimLocked] = useState(false);

  const leftTouchId = useRef<number | null>(null);
  const rightTouchId = useRef<number | null>(null);
  const lookAxesRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Continuous smooth 360-degree aim/camera rotation while holding right joystick
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const { x, y } = lookAxesRef.current;
      if (Math.abs(x) > 0.05 || Math.abs(y) > 0.05) {
        const speed = currentWeapon === 'sniper' && aimLocked ? 3.5 : 8.5;
        onLookDelta(x * speed, y * speed);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onLookDelta, currentWeapon, aimLocked]);

  useEffect(() => {
    if (currentWeapon === 'unarmed' && aimLocked) {
      setAimLocked(false);
      onCombatButtons({ aim: false });
    }
  }, [currentWeapon, aimLocked, onCombatButtons]);

  const updateLeftStick = (clientX: number, clientY: number) => {
    const el = leftPadRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.38;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setLeftKnob({ x: dx, y: dy });
    const nx = dx / maxR;
    const ny = -dy / maxR;
    const sprint = dist > maxR * 0.85;
    onAxes(nx, ny, sprint);
  };

  const resetLeftStick = () => {
    leftTouchId.current = null;
    setLeftKnob({ x: 0, y: 0 });
    onAxes(0, 0, false);
  };

  const updateRightStick = (clientX: number, clientY: number) => {
    const el = rightPadRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.38;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setRightKnob({ x: dx, y: dy });
    lookAxesRef.current = { x: dx / maxR, y: dy / maxR };
  };

  const resetRightStick = () => {
    rightTouchId.current = null;
    setRightKnob({ x: 0, y: 0 });
    lookAxesRef.current = { x: 0, y: 0 };
  };

  const toggleAim = () => {
    if (currentWeapon === 'unarmed') {
      onOpenWeaponWheel();
      return;
    }
    const next = !aimLocked;
    setAimLocked(next);
    onCombatButtons({ aim: next });
  };

  return (
    <div className="mobile-controls" aria-label="Touch Controls">
      {/* Left Virtual Movement / Steering Joystick */}
      <div
        ref={leftPadRef}
        className="joystick-pad joystick-left"
        onTouchStart={(e) => {
          const t = e.changedTouches[0];
          if (!t) return;
          leftTouchId.current = t.identifier;
          updateLeftStick(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          for (const t of Array.from(e.changedTouches)) {
            if (t.identifier === leftTouchId.current) {
              updateLeftStick(t.clientX, t.clientY);
            }
          }
        }}
        onTouchEnd={(e) => {
          for (const t of Array.from(e.changedTouches)) {
            if (t.identifier === leftTouchId.current) resetLeftStick();
          }
        }}
        onTouchCancel={resetLeftStick}
      >
        <span className="joystick-tag">MOVE</span>
        <div
          className="joystick-knob"
          style={{ transform: `translate(${leftKnob.x}px, ${leftKnob.y}px)` }}
        />
      </div>

      {/* Right Virtual 360° Aim & Look Joystick */}
      <div
        ref={rightPadRef}
        className="joystick-pad joystick-right"
        onTouchStart={(e) => {
          const t = e.changedTouches[0];
          if (!t) return;
          rightTouchId.current = t.identifier;
          updateRightStick(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          for (const t of Array.from(e.changedTouches)) {
            if (t.identifier === rightTouchId.current) {
              updateRightStick(t.clientX, t.clientY);
            }
          }
        }}
        onTouchEnd={(e) => {
          for (const t of Array.from(e.changedTouches)) {
            if (t.identifier === rightTouchId.current) resetRightStick();
          }
        }}
        onTouchCancel={resetRightStick}
      >
        <span className="joystick-tag">360° AIM</span>
        <div
          className="joystick-knob joystick-knob-aim"
          style={{ transform: `translate(${rightKnob.x}px, ${rightKnob.y}px)` }}
        />
      </div>

      {/* Top-Left / Mid Quick Combat & Utility Strip */}
      <div className="mobile-left-actions">
        <button type="button" className="m-btn" onClick={onOpenWeaponWheel}>
          GUNS ({currentWeapon.toUpperCase()})
        </button>
        {onToggleMic && (
          <button
            type="button"
            className={`m-btn ${!voiceMuted ? 'm-btn-green' : ''}`}
            onClick={onToggleMic}
          >
            {voiceMuted ? <MicOff size={13} /> : <Mic size={13} />}
            <span>{voiceMuted ? 'MIC OFF' : 'LIVE'}</span>
          </button>
        )}
        <button type="button" className="m-btn" onClick={onToggleMap}>
          MAP
        </button>
      </div>

      {/* Right Combat + Vehicle Action Cluster */}
      <div className="mobile-action-cluster">
        <button
          type="button"
          className="m-btn m-btn-fire"
          onTouchStart={() => onCombatButtons({ fire: true })}
          onTouchEnd={() => onCombatButtons({ fire: false })}
          onTouchCancel={() => onCombatButtons({ fire: false })}
          onMouseDown={() => onCombatButtons({ fire: true })}
          onMouseUp={() => onCombatButtons({ fire: false })}
        >
          <Crosshair size={15} /> FIRE
        </button>

        <button
          type="button"
          className={`m-btn ${aimLocked ? 'm-btn-primary' : ''}`}
          onClick={toggleAim}
        >
          {aimLocked ? 'SCOPE ON' : 'AIM / SCOPE'}
        </button>

        {currentWeapon === 'sniper' && (
          <button type="button" className="m-btn m-btn-primary" onClick={onCycleZoom}>
            <ZoomIn size={14} /> {sniperZoom.toFixed(0)}X
          </button>
        )}

        <button
          type="button"
          className="m-btn m-btn-primary"
          onClick={() => onInteract()}
        >
          ENTER / EXIT
        </button>

        <button
          type="button"
          className="m-btn"
          onTouchStart={() => onKey('Space', true)}
          onTouchEnd={() => onKey('Space', false)}
          onMouseDown={() => onKey('Space', true)}
          onMouseUp={() => onKey('Space', false)}
        >
          JUMP / BRAKE
        </button>

        <button
          type="button"
          className="m-btn"
          onTouchStart={() => onKey('KeyH', true)}
          onTouchEnd={() => onKey('KeyH', false)}
          onMouseDown={() => onKey('KeyH', true)}
          onMouseUp={() => onKey('KeyH', false)}
        >
          HORN
        </button>
      </div>
    </div>
  );
};

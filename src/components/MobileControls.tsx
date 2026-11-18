import React, { useRef, useState } from 'react';

interface Props {
  onAxes: (mx: number, my: number, sprint: boolean) => void;
  onKey: (code: string, down: boolean) => void;
  onInteract: () => void;
  onToggleMap: () => void;
}

export const MobileControls: React.FC<Props> = ({ onAxes, onKey, onInteract, onToggleMap }) => {
  const padRef = useRef<HTMLDivElement | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  const updateStick = (clientX: number, clientY: number) => {
    const el = padRef.current;
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
    setKnob({ x: dx, y: dy });
    const nx = dx / maxR;
    const ny = -dy / maxR;
    const sprint = dist > maxR * 0.85;
    onAxes(nx, ny, sprint);
  };

  const resetStick = () => {
    touchIdRef.current = null;
    setKnob({ x: 0, y: 0 });
    onAxes(0, 0, false);
  };

  return (
    <div className="mobile-controls" aria-label="Touch Controls">
      <div
        ref={padRef}
        className="joystick-pad"
        onTouchStart={(e) => {
          const t = e.changedTouches[0];
          if (!t) return;
          touchIdRef.current = t.identifier;
          updateStick(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          for (const t of Array.from(e.changedTouches)) {
            if (t.identifier === touchIdRef.current) {
              updateStick(t.clientX, t.clientY);
            }
          }
        }}
        onTouchEnd={(e) => {
          for (const t of Array.from(e.changedTouches)) {
            if (t.identifier === touchIdRef.current) resetStick();
          }
        }}
        onTouchCancel={resetStick}
      >
        <div
          className="joystick-knob"
          style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
        />
      </div>

      <div className="mobile-action-cluster">
        <button
          type="button"
          className="m-btn m-btn-primary"
          onTouchStart={() => onInteract()}
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
        <button
          type="button"
          className="m-btn"
          onClick={() => onToggleMap()}
        >
          MAP
        </button>
      </div>
    </div>
  );
};

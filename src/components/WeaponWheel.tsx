import React from 'react';
import { Crosshair, Hand, Shield, Target, X } from 'lucide-react';

export type WeaponId = 'unarmed' | 'pistol' | 'rifle' | 'sniper';

interface WeaponSlot {
  id: WeaponId;
  keyHint: string;
  name: string;
  subtitle: string;
  stats: string;
  icon: React.ComponentType<{ size?: number }>;
}

const SLOTS: WeaponSlot[] = [
  {
    id: 'unarmed',
    keyHint: '1',
    name: 'Unarmed / Fists',
    subtitle: 'Melee Strike · Sprint Free',
    stats: 'Close-range knockout blow',
    icon: Hand,
  },
  {
    id: 'pistol',
    keyHint: '2',
    name: '9mm Tactical Pistol',
    subtitle: 'Semi-Auto Sidearm · 360° Aim',
    stats: 'High mobility · Fast draw',
    icon: Target,
  },
  {
    id: 'rifle',
    keyHint: '3',
    name: 'M4 Assault Rifle',
    subtitle: 'Full-Auto Carbine · Medium/Long',
    stats: 'High fire rate · Full-auto',
    icon: Shield,
  },
  {
    id: 'sniper',
    keyHint: '4',
    name: 'Precision Sniper Rifle',
    subtitle: '2x / 4x / 8x Adjustable Scope',
    stats: '1-shot lethal ballistic round',
    icon: Crosshair,
  },
];

interface Props {
  isOpen: boolean;
  currentWeapon: WeaponId;
  sniperZoom: number;
  onSelect: (weaponId: WeaponId) => void;
  onCycleZoom: () => void;
  onClose: () => void;
}

export const WeaponWheel: React.FC<Props> = ({
  isOpen,
  currentWeapon,
  sniperZoom,
  onSelect,
  onCycleZoom,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="weapon-wheel-overlay" role="dialog" aria-label="Weapon Wheel" onClick={onClose}>
      <div className="weapon-wheel-card" onClick={(e) => e.stopPropagation()}>
        <div className="weapon-wheel-head">
          <div>
            <div className="muted-tag">TACTICAL ARSENAL · PRESS 1–4 OR CLICK</div>
            <h3>Select Active Weapon</h3>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close weapon wheel">
            <X size={16} />
          </button>
        </div>

        <div className="weapon-wheel-grid">
          {SLOTS.map((slot) => {
            const Icon = slot.icon;
            const active = currentWeapon === slot.id;
            return (
              <button
                key={slot.id}
                type="button"
                className={`weapon-slot-btn ${active ? 'active' : ''}`}
                onClick={() => {
                  onSelect(slot.id);
                  onClose();
                }}
              >
                <div className="weapon-slot-top">
                  <span className="weapon-slot-icon">
                    <Icon size={20} />
                  </span>
                  <kbd>{slot.keyHint}</kbd>
                </div>
                <div className="weapon-slot-name">{slot.name}</div>
                <div className="weapon-slot-sub">{slot.subtitle}</div>
                <div className="weapon-slot-stats">{slot.stats}</div>
              </button>
            );
          })}
        </div>

        <div className="weapon-wheel-foot">
          <span>Hold Right Mouse / AIM to 360° aim · Left Click / FIRE to shoot</span>
          {currentWeapon === 'sniper' && (
            <button type="button" className="chip-btn active" onClick={onCycleZoom}>
              Scope Zoom: {sniperZoom.toFixed(1)}x (Press V)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

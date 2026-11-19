// Procedural models for the traffic you actually see on Kochi roads.
// Local frame: +Z forward, +X left, +Y up. Origin on the ground under the centre.

import * as THREE from 'three';
import { loftBody } from './carBody.js';
import { SURF, box, roundBox, cyl, sphere, capsule, torus, tube, decal, merge, part, xf } from './parts.js';

const HALF_PI = Math.PI / 2;

// ------------------------------------------------------------------------------ wheel
/** Unit wheel: radius 1, width 1, axle along X, outer face toward +X. */
export function buildWheel() {
  const pts = [
    [0.6, -0.5],
    [0.84, -0.5],
    [0.965, -0.4],
    [1.0, -0.2],
    [1.0, 0.2],
    [0.965, 0.4],
    [0.84, 0.5],
    [0.6, 0.5],
  ].map((p) => new THREE.Vector2(p[0], p[1]));
  const tire = part(new THREE.LatheGeometry(pts, 14), 'rubber', xf(0, 0, 0, 0, 0, -HALF_PI));
  const parts = [tire];
  parts.push(cyl(0.61, 0.61, 0.72, 10, 'black', xf(0, 0, 0, 0, 0, -HALF_PI)));
  // Rim lip and dish.
  parts.push(torus(0.6, 0.035, 'alloy', xf(0.4, 0, 0, 0, HALF_PI, 0), Math.PI * 2, 4, 14));
  parts.push(cyl(0.57, 0.5, 0.06, 12, 'steel', xf(0.33, 0, 0, 0, 0, -HALF_PI)));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    parts.push(box(0.07, 0.5, 0.13, 'alloy', xf(0.4, Math.cos(a) * 0.3, Math.sin(a) * 0.3, a, 0, 0)));
  }
  parts.push(cyl(0.15, 0.13, 0.1, 8, 'alloy', xf(0.43, 0, 0, 0, 0, -HALF_PI)));
  const g = merge(parts);
  g.userData.unit = true;
  return g;
}

// -------------------------------------------------------------------------------- cars
function carDetails(parts, shape, f, o, rects, plate) {
  const zF = shape.top[shape.top.length - 1][0];
  const zR = shape.top[0][0];
  const hoodY = f.top(zF - 0.17);
  const wF = f.width(zF - 0.17) * 0.86;
  const wR = f.width(zR + 0.17) * 0.86;
  const beltA = f.belt(shape.zones.windshield[1]);

  // Headlights wrap the front corners.
  const zh = zF - 0.17;
  const wH = f.width(zh) * 0.98;
  for (const s of [1, -1]) {
    parts.push(roundBox(o.headW ?? 0.34, o.headH ?? 0.1, 0.1, 0.03, 'head', xf(s * (wH - (o.headW ?? 0.34) / 2 - 0.04), hoodY - 0.1, zh + 0.04, 0, s * 0.42, 0)));
    parts.push(box(0.1, 0.05, 0.05, 'indicator', xf(s * (wH - 0.1), hoodY - 0.19, zh + 0.03, 0, s * 0.6, 0)));
    // Fog lamps.
    parts.push(cyl(0.05, 0.05, 0.05, 8, 'head', xf(s * (wF - 0.2), f.under(zF) + 0.14, zF - 0.03, HALF_PI, 0, 0)));
  }
  // Bumper lips front and rear.
  parts.push(roundBox(wF * 2 + 0.04, 0.15, 0.24, 0.05, 'black', xf(0, f.under(zF - 0.17) + 0.1, zF - 0.09)));
  parts.push(roundBox(wR * 2 + 0.04, 0.15, 0.24, 0.05, 'black', xf(0, f.under(zR + 0.17) + 0.1, zR + 0.09)));
  // Grille, lower intake, badge.
  parts.push(roundBox(o.grilleW ?? 0.78, o.grilleH ?? 0.13, 0.06, 0.03, 'black', xf(0, hoodY - 0.07, zF - 0.005)));
  parts.push(box((o.grilleW ?? 0.78) * 0.96, 0.018, 0.02, 'chrome', xf(0, hoodY - 0.005, zF + 0.02)));
  parts.push(roundBox(0.95, 0.15, 0.06, 0.03, 'black', xf(0, f.under(zF) + 0.13, zF - 0.01)));
  parts.push(cyl(0.045, 0.045, 0.02, 12, 'chrome', xf(0, hoodY - 0.07, zF + 0.03, HALF_PI, 0, 0)));
  // Plates.
  parts.push(decal(0.46, 0.115, plate, xf(0, f.under(zF) + 0.29, zF + 0.036)));
  parts.push(decal(0.46, 0.115, plate, xf(0, o.rearPlateY ?? 0.62, zR - 0.036, 0, Math.PI, 0)));
  // Tail lamps sit flush in the rear corners.
  const zt = zR + 0.17;
  const wT = f.width(zt) * 0.98;
  for (const s of [1, -1]) {
    parts.push(roundBox(o.tailW ?? 0.2, o.tailH ?? 0.26, 0.1, 0.03, 'tail', xf(s * (wT - (o.tailW ?? 0.2) / 2 - 0.04), o.tailY ?? 0.9, zt - 0.04, 0, -s * 0.4, 0)));
    parts.push(box(0.1, 0.06, 0.05, 'indicator', xf(s * (wT - 0.14), (o.tailY ?? 0.9) - (o.tailH ?? 0.26) / 2 - 0.05, zt - 0.05, 0, -s * 0.4, 0)));
    // Reflectors low in the bumper.
    parts.push(box(0.14, 0.035, 0.02, 'tail', xf(s * (wR - 0.25), f.under(zR) + 0.12, zR - 0.02)));
  }
  parts.push(box(0.9, 0.03, 0.02, 'chrome', xf(0, (o.rearPlateY ?? 0.62) + 0.1, zR - 0.03)));
  // Mirrors and door handles.
  const zm = shape.zones.windshield[1] - 0.14;
  const wm = f.width(zm);
  for (const s of [1, -1]) {
    parts.push(roundBox(0.1, 0.11, 0.17, 0.035, 'paint', xf(s * (wm + 0.085), beltA + 0.07, zm, 0, s * 0.15, 0)));
    parts.push(box(0.1, 0.03, 0.04, 'black', xf(s * (wm + 0.02), beltA + 0.04, zm)));
    for (const hz of o.handles) parts.push(roundBox(0.025, 0.035, 0.15, 0.01, 'chrome', xf(s * (f.width(hz) * 0.988 + 0.004), f.belt(hz) - 0.11, hz)));
    // Door seams as thin dark strips.
    for (const dz of o.seams) {
      const w = f.width(dz);
      parts.push(box(0.012, f.belt(dz) - f.under(dz) - 0.2, 0.014, 'black', xf(s * (w * 0.992 + 0.001), (f.belt(dz) + f.under(dz)) / 2 + 0.04, dz)));
    }
    // Wheel arch trims.
    for (const wz of o.axles) {
      parts.push(torus(o.wheelR + 0.06, 0.032, 'black', xf(s * (f.width(wz) - 0.012), o.wheelR - 0.01, wz, 0, HALF_PI, 0), Math.PI, 4, 10));
    }
  }
  // Exhaust tip and antenna.
  parts.push(cyl(0.028, 0.028, 0.14, 8, 'chrome', xf(-wR * 0.55, f.under(zR) + 0.03, zR + 0.03, HALF_PI, 0, 0)));
  parts.push(tube([0, f.top(-0.9) + 0.02, -0.95], [0, f.top(-0.9) + 0.2, -1.15], 0.008, 'black', 5));
  if (o.roofRails) {
    for (const s of [1, -1]) {
      parts.push(tube([s * 0.58, f.top(-1.2) + 0.06, -1.35], [s * 0.58, f.top(0) + 0.06, 0.15], 0.02, 'steel', 6));
      for (const z of [-1.3, -0.6, 0.1]) parts.push(tube([s * 0.58, f.top(z) - 0.01, z], [s * 0.58, f.top(z) + 0.06, z], 0.016, 'steel', 5));
    }
  }
  if (o.spoiler) {
    const sy = hoodY > 0 ? f.top(zR + 0.15) : 0.96;
    for (const s of [1, -1]) parts.push(box(0.05, 0.18, 0.14, 'black', xf(s * 0.54, sy + 0.08, zR + 0.16)));
    parts.push(roundBox(1.52, 0.04, 0.24, 0.015, o.spoilerSurf || 'paint', xf(0, sy + 0.17, zR + 0.14, -0.1, 0, 0)));
  }
  if (o.taxiSign && rects.taxiSign) {
    const ty = f.top(-0.15) + 0.09;
    parts.push(roundBox(0.56, 0.16, 0.22, 0.03, o.taxiHousing || 'taxiSign', xf(0, ty, -0.15)));
    parts.push(decal(0.48, 0.13, rects.taxiSign, xf(0, ty, -0.035)));
    parts.push(decal(0.48, 0.13, rects.taxiSign, xf(0, ty, -0.265, 0, Math.PI, 0)));
  }
  if (o.rtaRoof) {
    const ry = f.top(-0.2) + 0.01;
    parts.push(roundBox(1.26, 0.04, 1.55, 0.015, 'rtaRed', xf(0, ry, -0.2)));
  }
  if (o.jpStripe) {
    for (const s of [1, -1]) {
      parts.push(box(0.016, 0.08, 3.3, 'yellow', xf(s * (f.width(0) * 0.99 + 0.008), f.belt(0) - 0.14, 0)));
    }
  }
  if (o.racingStripes) {
    for (const sx of [-0.16, 0.16]) {
      parts.push(box(0.11, 0.02, 1.15, 'white', xf(sx, hoodY + 0.02, zF - 0.7)));
    }
    parts.push(roundBox(0.56, 0.08, 0.62, 0.02, 'black', xf(0, hoodY + 0.03, zF - 0.85)));
  }
  if (o.bullbar) {
    parts.push(tube([-0.68, f.under(zF) + 0.26, zF + 0.06], [0.68, f.under(zF) + 0.26, zF + 0.06], 0.032, 'chrome', 6));
    for (const s of [1, -1]) {
      parts.push(tube([s * 0.5, f.under(zF) + 0.08, zF + 0.06], [s * 0.5, f.under(zF) + 0.42, zF + 0.06], 0.03, 'chrome', 6));
    }
  }
}

function carWheels(f, o) {
  const wheels = [];
  for (const [i, z] of o.axles.entries()) {
    for (const s of [1, -1]) {
      wheels.push({ x: s * (f.width(z) - o.wheelW / 2 + 0.035), y: o.wheelR, z, r: o.wheelR, w: o.wheelW, side: s, steer: i === 0 });
    }
  }
  return wheels;
}

const SHAPES = {
  hatchback: {
    shape: {
      top: [[-1.92, 0.98], [-1.8, 1.0], [-1.74, 1.04], [-1.3, 1.49], [-0.55, 1.525], [0.12, 1.5], [0.95, 1.0], [1.45, 0.93], [1.76, 0.86], [1.92, 0.84]],
      belt: [[-1.92, 0.93], [-1.2, 0.99], [0.95, 0.94], [1.92, 0.8]],
      width: [[-1.92, 0.8], [-1.6, 0.835], [-0.6, 0.85], [0.9, 0.85], [1.5, 0.84], [1.92, 0.8]],
      roofWidth: [[-1.92, 0.72], [-1.74, 0.72], [-1.3, 0.63], [0.12, 0.61], [0.95, 0.73], [1.92, 0.7]],
      under: [[-1.92, 0.3], [-1.5, 0.22], [-0.9, 0.19], [0.9, 0.19], [1.5, 0.22], [1.92, 0.29]],
      zones: { windshield: [0.14, 0.93], rear: [-1.72, -1.32], side: [-1.24, 0.66], pillars: [-0.36], pillarWidth: 0.1 },
    },
    o: { axles: [1.22, -1.23], wheelR: 0.292, wheelW: 0.2, handles: [0.0, -0.78], seams: [0.62, -0.36, -1.12], tailY: 0.9, tailH: 0.24, tailW: 0.15, rearPlateY: 0.78 },
    size: { length: 3.84, width: 1.7, height: 1.52 },
    seat: { x: -0.36, y: 0.55, z: 0.05 },
  },
  sedan: {
    shape: {
      top: [[-2.2, 0.97], [-1.5, 1.03], [-1.3, 1.06], [-0.72, 1.45], [-0.2, 1.485], [0.36, 1.455], [1.16, 0.99], [1.7, 0.92], [2.04, 0.85], [2.2, 0.83]],
      belt: [[-2.2, 0.92], [-1.3, 0.98], [1.16, 0.93], [2.2, 0.8]],
      width: [[-2.2, 0.8], [-1.8, 0.84], [-0.6, 0.86], [1.1, 0.86], [1.7, 0.85], [2.2, 0.8]],
      roofWidth: [[-2.2, 0.72], [-1.3, 0.72], [-0.72, 0.62], [0.36, 0.61], [1.16, 0.74], [2.2, 0.7]],
      under: [[-2.2, 0.3], [-1.7, 0.21], [-1.0, 0.18], [1.1, 0.18], [1.7, 0.21], [2.2, 0.29]],
      zones: { windshield: [0.38, 1.14], rear: [-1.28, -0.74], side: [-0.98, 0.88], pillars: [-0.06], pillarWidth: 0.1 },
    },
    o: { axles: [1.4, -1.28], wheelR: 0.3, wheelW: 0.205, handles: [0.3, -0.5], seams: [0.86, -0.06, -0.96], tailY: 0.9, tailH: 0.14, tailW: 0.3, rearPlateY: 0.7, grilleW: 0.86 },
    size: { length: 4.4, width: 1.72, height: 1.49 },
    seat: { x: -0.37, y: 0.52, z: 0.2 },
  },
  suv: {
    shape: {
      top: [[-2.2, 1.14], [-2.03, 1.2], [-1.7, 1.665], [-0.6, 1.72], [0.36, 1.68], [1.1, 1.18], [1.7, 1.1], [2.04, 1.04], [2.2, 1.02]],
      belt: [[-2.2, 1.08], [-1.6, 1.13], [1.1, 1.1], [2.2, 0.98]],
      width: [[-2.2, 0.86], [-1.8, 0.895], [-0.6, 0.91], [1.1, 0.91], [1.7, 0.895], [2.2, 0.86]],
      roofWidth: [[-2.2, 0.8], [-2.03, 0.8], [-1.7, 0.7], [0.36, 0.68], [1.1, 0.8], [2.2, 0.76]],
      under: [[-2.2, 0.4], [-1.7, 0.3], [-1.0, 0.26], [1.1, 0.26], [1.7, 0.3], [2.2, 0.4]],
      zones: { windshield: [0.38, 1.08], rear: [-2.01, -1.72], side: [-1.62, 0.8], pillars: [-0.12, -1.02], pillarWidth: 0.1 },
      crown: 0.02,
    },
    o: { axles: [1.36, -1.34], wheelR: 0.355, wheelW: 0.235, handles: [0.25, -0.62], seams: [0.78, -0.12, -1.05], tailY: 1.12, tailH: 0.3, tailW: 0.15, rearPlateY: 0.95, grilleW: 0.98, grilleH: 0.2, headH: 0.15, roofRails: true },
    size: { length: 4.4, width: 1.82, height: 1.74 },
    seat: { x: -0.39, y: 0.72, z: 0.2 },
  },
  kei_car: {
    shape: {
      top: [[-1.65, 1.04], [-1.52, 1.62], [-0.4, 1.66], [0.4, 1.64], [0.85, 1.02], [1.4, 0.95], [1.65, 0.88]],
      belt: [[-1.65, 0.96], [-0.9, 1.0], [0.85, 0.95], [1.65, 0.84]],
      width: [[-1.65, 0.71], [-1.0, 0.74], [0.8, 0.74], [1.65, 0.71]],
      roofWidth: [[-1.65, 0.66], [-1.52, 0.66], [0.4, 0.64], [0.85, 0.68], [1.65, 0.66]],
      under: [[-1.65, 0.28], [-1.0, 0.2], [1.0, 0.2], [1.65, 0.28]],
      zones: { windshield: [0.42, 0.84], rear: [-1.58, -1.52], side: [-1.42, 0.64], pillars: [-0.45], pillarWidth: 0.08 },
    },
    o: { axles: [1.08, -1.08], wheelR: 0.26, wheelW: 0.17, handles: [0.1, -0.68], seams: [0.64, -0.45], tailY: 0.86, tailH: 0.34, tailW: 0.14, rearPlateY: 0.56, grilleW: 0.72 },
    size: { length: 3.3, width: 1.48, height: 1.66 },
    seat: { x: 0.3, y: 0.62, z: 0.12 },
  },
  jdm_sedan: {
    shape: {
      top: [[-2.25, 0.95], [-1.55, 0.99], [-1.35, 1.03], [-0.72, 1.38], [-0.15, 1.41], [0.42, 1.38], [1.2, 0.95], [1.75, 0.88], [2.1, 0.81], [2.25, 0.78]],
      belt: [[-2.25, 0.89], [-1.35, 0.94], [1.2, 0.89], [2.25, 0.76]],
      width: [[-2.25, 0.82], [-1.6, 0.87], [1.1, 0.87], [1.75, 0.85], [2.25, 0.81]],
      roofWidth: [[-2.25, 0.72], [-1.35, 0.72], [-0.72, 0.62], [0.42, 0.61], [1.2, 0.73], [2.25, 0.7]],
      under: [[-2.25, 0.26], [-1.7, 0.17], [1.1, 0.17], [1.75, 0.18], [2.25, 0.25]],
      zones: { windshield: [0.44, 1.18], rear: [-1.33, -0.74], side: [-0.95, 0.92], pillars: [-0.04], pillarWidth: 0.09 },
    },
    o: { axles: [1.42, -1.3], wheelR: 0.31, wheelW: 0.22, handles: [0.3, -0.5], seams: [0.88, -0.04, -0.96], tailY: 0.86, tailH: 0.14, tailW: 0.32, rearPlateY: 0.64, grilleW: 0.9, spoiler: true },
    size: { length: 4.5, width: 1.74, height: 1.44 },
    seat: { x: 0.38, y: 0.48, z: 0.18 },
  },
  jp_taxi: {
    shape: {
      top: [[-2.25, 0.98], [-1.52, 1.04], [-1.3, 1.07], [-0.72, 1.49], [-0.15, 1.52], [0.4, 1.49], [1.18, 1.0], [1.75, 0.93], [2.25, 0.84]],
      belt: [[-2.25, 0.93], [-1.3, 0.99], [1.18, 0.94], [2.25, 0.8]],
      width: [[-2.25, 0.8], [-0.8, 0.85], [1.1, 0.85], [2.25, 0.8]],
      roofWidth: [[-2.25, 0.72], [-1.3, 0.72], [-0.72, 0.63], [0.4, 0.62], [1.18, 0.74], [2.25, 0.7]],
      under: [[-2.25, 0.29], [-1.6, 0.2], [1.1, 0.2], [2.25, 0.28]],
      zones: { windshield: [0.42, 1.16], rear: [-1.28, -0.74], side: [-0.96, 0.9], pillars: [-0.04], pillarWidth: 0.1 },
    },
    o: { axles: [1.4, -1.28], wheelR: 0.295, wheelW: 0.205, handles: [0.3, -0.5], seams: [0.86, -0.04, -0.96], tailY: 0.9, tailH: 0.16, tailW: 0.28, rearPlateY: 0.68, taxiSign: true, jpStripe: true },
    size: { length: 4.5, width: 1.7, height: 1.54 },
    seat: { x: 0.37, y: 0.53, z: 0.2 },
  },
  commuter_van: {
    shape: {
      top: [[-2.35, 1.08], [-2.2, 1.94], [-0.5, 1.98], [1.35, 1.94], [1.98, 1.18], [2.25, 1.04], [2.35, 0.96]],
      belt: [[-2.35, 1.06], [1.45, 1.08], [2.35, 0.92]],
      width: [[-2.35, 0.86], [-1.5, 0.9], [1.6, 0.9], [2.35, 0.84]],
      roofWidth: [[-2.35, 0.82], [-2.2, 0.82], [1.35, 0.8], [1.98, 0.82], [2.35, 0.76]],
      under: [[-2.35, 0.34], [-1.7, 0.26], [1.6, 0.26], [2.35, 0.34]],
      zones: { windshield: [1.38, 1.95], rear: [-2.28, -2.18], side: [-2.05, 1.25], pillars: [-0.95, 0.2], pillarWidth: 0.1 },
    },
    o: { axles: [1.55, -1.45], wheelR: 0.33, wheelW: 0.22, handles: [0.7, -0.35], seams: [1.15, 0.2, -0.95], tailY: 0.98, tailH: 0.42, tailW: 0.14, rearPlateY: 0.68, grilleW: 0.95 },
    size: { length: 4.7, width: 1.8, height: 1.98 },
    seat: { x: -0.42, y: 0.85, z: 1.05 },
  },
  black_cab: {
    shape: {
      top: [[-2.2, 1.04], [-1.9, 1.14], [-1.62, 1.72], [-0.45, 1.76], [0.42, 1.74], [1.05, 1.16], [1.72, 1.06], [2.1, 0.98], [2.2, 0.94]],
      belt: [[-2.2, 0.98], [-1.5, 1.04], [1.05, 1.04], [2.2, 0.9]],
      width: [[-2.2, 0.82], [-1.4, 0.87], [1.1, 0.87], [2.2, 0.81]],
      roofWidth: [[-2.2, 0.72], [-1.62, 0.7], [0.42, 0.68], [1.05, 0.74], [2.2, 0.7]],
      under: [[-2.2, 0.34], [-1.6, 0.23], [1.2, 0.23], [2.2, 0.32]],
      zones: { windshield: [0.44, 1.03], rear: [-1.88, -1.64], side: [-1.5, 0.85], pillars: [-0.45], pillarWidth: 0.1 },
      crown: 0.04,
      lowerSurface: 'black',
      capSurface: 'black',
    },
    o: { axles: [1.42, -1.32], wheelR: 0.32, wheelW: 0.21, handles: [0.22, -0.58], seams: [0.85, -0.45], tailY: 0.96, tailH: 0.3, tailW: 0.16, rearPlateY: 0.74, grilleW: 0.72, grilleH: 0.24, taxiSign: true },
    size: { length: 4.4, width: 1.74, height: 1.78 },
    seat: { x: 0.36, y: 0.68, z: 0.22 },
  },
  eu_hatchback: {
    shape: {
      top: [[-1.98, 0.95], [-1.84, 0.98], [-1.74, 1.04], [-1.25, 1.45], [-0.5, 1.48], [0.22, 1.45], [1.02, 0.98], [1.55, 0.9], [1.84, 0.84], [1.98, 0.82]],
      belt: [[-1.98, 0.9], [-1.2, 0.96], [1.02, 0.91], [1.98, 0.78]],
      width: [[-1.98, 0.82], [-1.4, 0.87], [1.0, 0.87], [1.98, 0.81]],
      roofWidth: [[-1.98, 0.72], [-1.74, 0.72], [-1.25, 0.63], [0.22, 0.61], [1.02, 0.73], [1.98, 0.7]],
      under: [[-1.98, 0.27], [-1.4, 0.18], [1.0, 0.18], [1.98, 0.26]],
      zones: { windshield: [0.24, 1.0], rear: [-1.72, -1.27], side: [-1.2, 0.75], pillars: [-0.32], pillarWidth: 0.1 },
    },
    o: { axles: [1.28, -1.26], wheelR: 0.3, wheelW: 0.215, handles: [0.05, -0.72], seams: [0.68, -0.32, -1.08], tailY: 0.88, tailH: 0.2, tailW: 0.22, rearPlateY: 0.7, grilleW: 0.86, spoiler: true },
    size: { length: 3.96, width: 1.74, height: 1.48 },
    seat: { x: 0.36, y: 0.52, z: 0.08 },
  },
  nyc_taxi: {
    shape: {
      top: [[-2.35, 0.98], [-1.58, 1.03], [-1.36, 1.06], [-0.74, 1.47], [-0.15, 1.5], [0.42, 1.47], [1.24, 1.0], [1.85, 0.92], [2.35, 0.84]],
      belt: [[-2.35, 0.93], [-1.36, 0.98], [1.24, 0.93], [2.35, 0.8]],
      width: [[-2.35, 0.84], [-1.2, 0.89], [1.2, 0.89], [2.35, 0.83]],
      roofWidth: [[-2.35, 0.74], [-1.36, 0.74], [-0.74, 0.64], [0.42, 0.63], [1.24, 0.75], [2.35, 0.72]],
      under: [[-2.35, 0.29], [-1.7, 0.2], [1.2, 0.2], [2.35, 0.28]],
      zones: { windshield: [0.44, 1.22], rear: [-1.34, -0.76], side: [-1.02, 0.94], pillars: [-0.04], pillarWidth: 0.1 },
      lowerSurface: 'taxiYellow',
      roofSurface: 'taxiYellow',
      capSurface: 'taxiYellow',
    },
    o: { axles: [1.46, -1.34], wheelR: 0.31, wheelW: 0.215, handles: [0.32, -0.52], seams: [0.9, -0.04, -1.0], tailY: 0.9, tailH: 0.16, tailW: 0.32, rearPlateY: 0.68, grilleW: 0.92, taxiSign: true },
    size: { length: 4.7, width: 1.78, height: 1.52 },
    seat: { x: -0.38, y: 0.54, z: 0.22 },
  },
  muscle_car: {
    shape: {
      top: [[-2.3, 0.96], [-1.62, 1.01], [-1.42, 1.05], [-0.82, 1.35], [-0.15, 1.38], [0.32, 1.35], [1.08, 0.96], [1.85, 0.9], [2.3, 0.8]],
      belt: [[-2.3, 0.92], [-1.4, 0.96], [1.08, 0.91], [2.3, 0.78]],
      width: [[-2.3, 0.87], [-1.4, 0.94], [1.1, 0.92], [1.85, 0.91], [2.3, 0.85]],
      roofWidth: [[-2.3, 0.76], [-1.42, 0.75], [-0.82, 0.65], [0.32, 0.64], [1.08, 0.76], [2.3, 0.72]],
      under: [[-2.3, 0.26], [-1.6, 0.17], [1.2, 0.17], [2.3, 0.25]],
      zones: { windshield: [0.34, 1.06], rear: [-1.4, -0.84], side: [-0.92, 0.78], pillars: [-0.24], pillarWidth: 0.1 },
    },
    o: { axles: [1.42, -1.36], wheelR: 0.325, wheelW: 0.25, handles: [0.18], seams: [0.78, -0.8], tailY: 0.86, tailH: 0.14, tailW: 0.34, rearPlateY: 0.64, grilleW: 1.02, spoiler: true, spoilerSurf: 'black', racingStripes: true },
    size: { length: 4.6, width: 1.88, height: 1.38 },
    seat: { x: -0.39, y: 0.45, z: 0.08 },
  },
  supercar: {
    shape: {
      top: [[-2.25, 0.86], [-1.75, 0.92], [-1.35, 0.96], [-0.65, 1.15], [0.1, 1.16], [0.95, 0.86], [1.75, 0.72], [2.25, 0.56]],
      belt: [[-2.25, 0.82], [-1.35, 0.87], [0.95, 0.82], [2.25, 0.54]],
      width: [[-2.25, 0.9], [-1.4, 0.98], [0.95, 0.96], [1.85, 0.93], [2.25, 0.84]],
      roofWidth: [[-2.25, 0.78], [-1.35, 0.76], [-0.65, 0.66], [0.1, 0.65], [0.95, 0.76], [2.25, 0.7]],
      under: [[-2.25, 0.22], [-1.4, 0.13], [1.2, 0.13], [2.25, 0.2]],
      zones: { windshield: [0.12, 0.93], rear: [-1.33, -0.67], side: [-0.6, 0.66], pillars: [-0.15], pillarWidth: 0.08 },
    },
    o: { axles: [1.38, -1.32], wheelR: 0.33, wheelW: 0.26, handles: [0.14], seams: [0.68, -0.68], tailY: 0.78, tailH: 0.11, tailW: 0.36, rearPlateY: 0.54, grilleW: 1.1, grilleH: 0.14, headH: 0.08, spoiler: true, spoilerSurf: 'black' },
    size: { length: 4.5, width: 1.96, height: 1.16 },
    seat: { x: -0.38, y: 0.36, z: 0.02 },
  },
  rta_taxi: {
    shape: {
      top: [[-2.25, 0.98], [-1.52, 1.04], [-1.32, 1.07], [-0.72, 1.47], [-0.18, 1.5], [0.38, 1.47], [1.2, 1.0], [1.75, 0.92], [2.25, 0.84]],
      belt: [[-2.25, 0.93], [-1.32, 0.99], [1.2, 0.94], [2.25, 0.8]],
      width: [[-2.25, 0.82], [-1.2, 0.87], [1.1, 0.87], [2.25, 0.81]],
      roofWidth: [[-2.25, 0.72], [-1.32, 0.72], [-0.72, 0.63], [0.38, 0.62], [1.2, 0.74], [2.25, 0.7]],
      under: [[-2.25, 0.29], [-1.6, 0.2], [1.1, 0.2], [2.25, 0.28]],
      zones: { windshield: [0.4, 1.18], rear: [-1.3, -0.74], side: [-0.98, 0.9], pillars: [-0.04], pillarWidth: 0.1 },
      lowerSurface: 'dubaiCream',
      roofSurface: 'rtaRed',
      capSurface: 'dubaiCream',
    },
    o: { axles: [1.42, -1.3], wheelR: 0.3, wheelW: 0.21, handles: [0.3, -0.5], seams: [0.88, -0.04, -0.98], tailY: 0.9, tailH: 0.15, tailW: 0.3, rearPlateY: 0.68, grilleW: 0.9, taxiSign: true, rtaRoof: true },
    size: { length: 4.5, width: 1.74, height: 1.52 },
    seat: { x: -0.38, y: 0.53, z: 0.2 },
  },
  desert_4x4: {
    shape: {
      top: [[-2.4, 1.24], [-2.22, 1.3], [-1.85, 1.84], [-0.5, 1.88], [0.48, 1.84], [1.18, 1.28], [1.85, 1.2], [2.25, 1.14], [2.4, 1.1]],
      belt: [[-2.4, 1.18], [-1.8, 1.22], [1.18, 1.2], [2.4, 1.06]],
      width: [[-2.4, 0.91], [-1.5, 0.96], [1.2, 0.96], [2.4, 0.9]],
      roofWidth: [[-2.4, 0.84], [-2.22, 0.84], [-1.85, 0.75], [0.48, 0.73], [1.18, 0.84], [2.4, 0.78]],
      under: [[-2.4, 0.48], [-1.7, 0.35], [1.3, 0.35], [2.4, 0.48]],
      zones: { windshield: [0.5, 1.16], rear: [-2.2, -1.87], side: [-1.76, 0.9], pillars: [-0.15, -1.1], pillarWidth: 0.11 },
      crown: 0.02,
    },
    o: { axles: [1.46, -1.42], wheelR: 0.4, wheelW: 0.26, handles: [0.3, -0.65], seams: [0.85, -0.15, -1.12], tailY: 1.22, tailH: 0.34, tailW: 0.16, rearPlateY: 1.02, grilleW: 1.08, grilleH: 0.24, headH: 0.16, roofRails: true, bullbar: true },
    size: { length: 4.8, width: 1.92, height: 1.9 },
    seat: { x: -0.42, y: 0.84, z: 0.24 },
  },
};

function buildCar(kind, rects, plateIndex) {
  const def = SHAPES[kind];
  const body = loftBody(def.shape);
  const f = body.userData.fn;
  const parts = [body];
  carDetails(parts, def.shape, f, def.o, rects, rects.plates[plateIndex % rects.plates.length]);
  return { geometry: merge(parts), wheels: carWheels(f, def.o), size: def.size, seat: def.seat };
}

// ------------------------------------------------------------------------ Kerala 4x4 Jeep
function buildJeep(rects, plateIndex) {
  const parts = [];
  const zF = 1.95;
  const zR = -1.95;
  // Lower boxy body & flared fenders
  parts.push(roundBox(1.56, 0.62, 3.7, 0.06, 'paint', xf(0, 0.78, 0)));
  parts.push(roundBox(1.42, 0.38, 1.25, 0.05, 'paint', xf(0, 1.12, 1.1)));
  // Upright grille + iconic round headlamps
  parts.push(roundBox(1.38, 0.46, 0.1, 0.03, 'black', xf(0, 0.98, 1.84)));
  for (const s of [1, -1]) {
    parts.push(cyl(0.11, 0.11, 0.05, 12, 'head', xf(s * 0.48, 0.98, 1.89, HALF_PI, 0, 0)));
    parts.push(box(0.16, 0.22, 0.05, 'tail', xf(s * 0.64, 0.86, zR + 0.08)));
    parts.push(roundBox(0.22, 0.08, 2.8, 0.02, 'black', xf(s * 0.82, 0.72, 0)));
  }
  // Windshield & canvas soft-top / rollbar
  parts.push(roundBox(1.38, 0.56, 0.08, 0.02, 'glass', xf(0, 1.48, 0.44, -0.22, 0, 0)));
  parts.push(roundBox(1.44, 0.09, 2.25, 0.03, 'black', xf(0, 1.78, -0.72)));
  for (const s of [1, -1]) {
    for (const z of [0.35, -0.7, -1.72]) parts.push(tube([s * 0.68, 1.1, z], [s * 0.66, 1.76, z], 0.032, 'black', 6));
  }
  // Rear mounted spare tyre
  parts.push(cyl(0.36, 0.36, 0.24, 14, 'rubber', xf(0, 1.0, zR - 0.02, HALF_PI, 0, 0)));
  // Bumpers & plates
  parts.push(roundBox(1.72, 0.18, 0.22, 0.04, 'black', xf(0, 0.5, zF - 0.04)));
  parts.push(roundBox(1.72, 0.18, 0.22, 0.04, 'black', xf(0, 0.5, zR + 0.04)));
  const plate = rects.plates[plateIndex % rects.plates.length];
  parts.push(decal(0.46, 0.115, plate, xf(0, 0.52, zF + 0.08)));
  parts.push(decal(0.46, 0.115, plate, xf(-0.48, 0.62, zR - 0.06, 0, Math.PI, 0)));
  const wheels = [
    { x: 0.78, y: 0.39, z: 1.26, r: 0.39, w: 0.25, side: 1, steer: true },
    { x: -0.78, y: 0.39, z: 1.26, r: 0.39, w: 0.25, side: -1, steer: true },
    { x: 0.78, y: 0.39, z: -1.24, r: 0.39, w: 0.25, side: 1, steer: false },
    { x: -0.78, y: 0.39, z: -1.24, r: 0.39, w: 0.25, side: -1, steer: false },
  ];
  return { geometry: merge(parts), wheels, size: { length: 3.9, width: 1.76, height: 1.82 }, seat: { x: -0.35, y: 0.82, z: -0.05 } };
}

// ------------------------------------------------------------------------ Delivery Box Truck
function buildDeliveryTruck(rects, plateIndex) {
  const parts = [];
  // Cab
  parts.push(roundBox(1.96, 1.55, 1.65, 0.08, 'paint', xf(0, 1.38, 1.85)));
  parts.push(roundBox(1.78, 0.66, 0.08, 0.03, 'glass', xf(0, 1.62, 2.66, -0.1, 0, 0)));
  parts.push(roundBox(1.2, 0.22, 0.08, 0.02, 'black', xf(0, 0.96, 2.66)));
  // Tall refrigerated cargo box
  parts.push(roundBox(2.14, 2.15, 3.9, 0.06, 'white', xf(0, 1.75, -0.98)));
  for (const s of [1, -1]) {
    parts.push(decal(3.5, 0.95, rects.deliverySide, xf(s * 1.08, 1.85, -0.98, 0, s * HALF_PI, 0)));
    parts.push(roundBox(0.28, 0.16, 0.08, 0.03, 'head', xf(s * 0.72, 0.85, 2.66)));
    parts.push(box(0.16, 0.32, 0.06, 'tail', xf(s * 0.82, 0.82, -2.94)));
  }
  // Chassis & bumpers
  parts.push(box(1.9, 0.26, 5.4, 'darkGrey', xf(0, 0.52, -0.1)));
  const plate = rects.platesYellow[plateIndex % rects.platesYellow.length];
  parts.push(decal(0.5, 0.125, plate, xf(0, 0.62, 2.68)));
  parts.push(decal(0.5, 0.125, plate, xf(0, 0.62, -2.95, 0, Math.PI, 0)));
  const wheels = [
    { x: 0.92, y: 0.44, z: 1.85, r: 0.44, w: 0.26, side: 1, steer: true },
    { x: -0.92, y: 0.44, z: 1.85, r: 0.44, w: 0.26, side: -1, steer: true },
    { x: 0.92, y: 0.44, z: -1.75, r: 0.44, w: 0.28, side: 1, steer: false },
    { x: -0.92, y: 0.44, z: -1.75, r: 0.44, w: 0.28, side: -1, steer: false },
  ];
  return { geometry: merge(parts), wheels, size: { length: 5.65, width: 2.18, height: 2.85 }, seat: { x: -0.5, y: 1.35, z: 1.85 } };
}

// ------------------------------------------------------------------------ London Red Double-Decker Bus
function buildDoubleDecker(rects, index) {
  const L = 10.2;
  const zF = L / 2;
  const zR = -L / 2;
  const parts = [];
  // Iconic London red lower & upper decks
  parts.push(roundBox(2.48, 1.85, L, 0.08, 'londonRed', xf(0, 1.35, 0)));
  parts.push(roundBox(2.44, 1.95, L - 0.12, 0.1, 'londonRed', xf(0, 3.25, -0.04)));
  // Glazed window bands lower + upper
  for (const s of [1, -1]) {
    parts.push(box(0.03, 0.82, L - 0.9, 'glass', xf(s * 1.24, 1.65, 0)));
    parts.push(box(0.03, 0.86, L - 0.9, 'glass', xf(s * 1.22, 3.45, -0.04)));
    parts.push(decal(3.6, 0.48, rects.ksrtcSide, xf(s * 1.26, 2.38, 0.4, 0, s * HALF_PI, 0)));
    parts.push(roundBox(0.32, 0.18, 0.08, 0.03, 'head', xf(s * 0.84, 0.82, zF - 0.01)));
    parts.push(box(0.16, 0.36, 0.06, 'tail', xf(s * 0.96, 1.18, zR + 0.01)));
  }
  // Front windshields & route destination board
  parts.push(roundBox(2.15, 1.05, 0.06, 0.04, 'glass', xf(0, 1.68, zF - 0.01)));
  parts.push(roundBox(2.1, 0.92, 0.06, 0.04, 'glass', xf(0, 3.46, zF - 0.07)));
  const board = rects.boards[index % rects.boards.length];
  parts.push(decal(1.9, 0.28, board, xf(0, 2.58, zF + 0.02)));
  parts.push(roundBox(2.52, 0.24, 0.2, 0.04, 'darkGrey', xf(0, 0.56, zF - 0.06)));
  parts.push(roundBox(2.52, 0.24, 0.2, 0.04, 'darkGrey', xf(0, 0.56, zR + 0.06)));
  const plate = rects.platesYellow[index % rects.platesYellow.length];
  parts.push(decal(0.56, 0.14, plate, xf(0, 0.56, zF + 0.05)));
  parts.push(decal(0.56, 0.14, plate, xf(0, 0.88, zR - 0.03, 0, Math.PI, 0)));
  const axles = [zF - 2.0, zR + 2.7];
  const wheels = [];
  for (const [i, z] of axles.entries()) for (const s of [1, -1]) wheels.push({ x: s * 1.1, y: 0.5, z, r: 0.5, w: 0.3, side: s, steer: i === 0 });
  return { geometry: merge(parts), wheels, size: { length: L, width: 2.52, height: 4.3 }, seat: { x: 0.72, y: 1.4, z: zF - 1.1 } };
}

// ------------------------------------------------------------------------ auto rickshaw
function buildAuto(rects, plateIndex) {
  const shape = {
    top: [[-1.3, 1.6], [-1.2, 1.64], [-0.95, 1.73], [0.35, 1.72], [0.6, 1.66], [0.93, 1.04], [1.12, 0.98], [1.34, 0.92]],
    belt: [[-1.3, 0.98], [0.93, 0.99], [1.34, 0.86]],
    width: [[-1.3, 0.65], [0.2, 0.66], [0.6, 0.6], [0.95, 0.46], [1.2, 0.32], [1.34, 0.26]],
    roofWidth: [[-1.3, 0.6], [0.35, 0.6], [0.93, 0.44], [1.34, 0.24]],
    under: [[-1.3, 0.3], [-1.0, 0.27], [0.7, 0.27], [1.1, 0.36], [1.34, 0.46]],
    zones: { windshield: [0.62, 0.92], rear: [-1.19, -1.0], side: [-0.98, 0.6], pillars: [-0.18, 0.56], pillarWidth: 0.07 },
    roofSurface: 'canvasYellow',
    lowerSurface: 'black',
    openSides: true,
    pillarSurface: 'black',
    edgeDrop: 0.1,
    roofInset: 0.8,
    bumper: 0.1,
    crown: 0.05,
    nose: 0.1,
    capSurface: 'black',
  };
  const body = loftBody(shape);
  const parts = [body];
  // Yellow waist band - the Kerala auto look.
  for (const s of [1, -1]) {
    parts.push(box(0.012, 0.09, 1.9, 'yellow', xf(s * 0.662, 0.86, -0.25)));
  }
  parts.push(box(1.1, 0.09, 0.012, 'yellow', xf(0, 0.86, -1.268)));
  // Single headlamp, indicators, front mudguard.
  parts.push(cyl(0.1, 0.1, 0.1, 14, 'chrome', xf(0, 0.82, 1.28, HALF_PI, 0, 0)));
  parts.push(cyl(0.085, 0.085, 0.02, 14, 'head', xf(0, 0.82, 1.335, HALF_PI, 0, 0)));
  for (const s of [1, -1]) {
    parts.push(sphere(0.04, 'indicator', xf(s * 0.3, 0.86, 1.14)));
    parts.push(box(0.12, 0.1, 0.04, 'tail', xf(s * 0.5, 0.7, -1.31)));
    parts.push(box(0.08, 0.06, 0.04, 'indicator', xf(s * 0.5, 0.6, -1.31)));
    parts.push(tube([s * 0.55, 1.12, 1.0], [s * 0.74, 1.2, 0.98], 0.012, 'black', 5));
    parts.push(roundBox(0.03, 0.14, 0.1, 0.012, 'black', xf(s * 0.76, 1.22, 0.98)));
  }
  parts.push(torus(0.26, 0.05, 'black', xf(0, 0.22, 0.98, 0, HALF_PI, 0), Math.PI, 4, 10));
  // Passenger bench and driver seat visible through the open sides.
  parts.push(roundBox(1.1, 0.14, 0.42, 0.04, 'seat', xf(0, 0.62, -0.72)));
  parts.push(roundBox(1.1, 0.5, 0.1, 0.04, 'seat', xf(0, 0.9, -0.95, -0.15, 0, 0)));
  parts.push(roundBox(0.5, 0.12, 0.36, 0.04, 'seat', xf(0, 0.64, 0.12)));
  parts.push(tube([0, 0.95, 0.62], [0, 0.66, 0.85], 0.02, 'black', 6));
  parts.push(tube([-0.24, 0.97, 0.6], [0.24, 0.97, 0.6], 0.018, 'black', 6));
  // Flat rear panel: black body below, yellow hood above.
  parts.push(roundBox(1.26, 0.62, 0.06, 0.03, 'black', xf(0, 0.7, -1.27)));
  parts.push(roundBox(1.2, 0.72, 0.06, 0.03, 'canvasYellow', xf(0, 1.32, -1.24, 0.08, 0, 0)));
  parts.push(box(0.62, 0.22, 0.02, 'glass', xf(0, 1.5, -1.275, 0.08, 0, 0)));
  // Rear panel artwork and commercial (yellow) plates.
  parts.push(decal(0.62, 0.3, rects.autoRear, xf(0, 1.18, -1.285, -0.08, Math.PI, 0)));
  const plate = rects.platesYellow[plateIndex % rects.platesYellow.length];
  parts.push(decal(0.4, 0.1, plate, xf(0, 0.62, -1.31, 0, Math.PI, 0)));
  parts.push(decal(0.34, 0.085, plate, xf(0, 0.62, 1.2, -0.25, 0, 0)));
  const wheels = [
    { x: 0, y: 0.2, z: 0.98, r: 0.2, w: 0.11, side: 1, steer: true },
    { x: 0.6, y: 0.2, z: -0.86, r: 0.2, w: 0.12, side: 1, steer: false },
    { x: -0.6, y: 0.2, z: -0.86, r: 0.2, w: 0.12, side: -1, steer: false },
  ];
  return { geometry: merge(parts), wheels, size: { length: 2.65, width: 1.34, height: 1.76 }, seat: { x: 0, y: 0.7, z: 0.12 } };
}

// ---------------------------------------------------------------------------------- bus
function buildBus(rects, livery, index) {
  const L = 10.4;
  const zF = L / 2;
  const zR = -L / 2;
  const ksrtc = livery === 'ksrtc';
  const nyc = livery === 'nyc_bus';
  const shape = {
    top: [[zR, 3.08], [zR + 0.7, 3.14], [zF - 0.7, 3.14], [zF, 3.08]],
    belt: [[zR, 1.42], [zF, 1.42]],
    width: [[zR, 1.25], [zF, 1.25]],
    roofWidth: [[zR, 1.2], [zF, 1.2]],
    under: [[zR, 0.5], [zR + 1.2, 0.4], [zF - 1.2, 0.4], [zF, 0.5]],
    zones: {
      side: [zR + 0.5, zF - 0.55],
      pillars: [],
      pillarWidth: 0.12,
    },
    nose: 0.22,
    capSurface: ksrtc ? 'ksrtcRed' : nyc ? 'white' : 'paint',
    edgeDrop: 0.52,
    roofInset: 0.9,
    sill: 0.06,
    crown: 0.06,
    bumper: 0.12,
    roofSurface: ksrtc ? 'cream' : nyc ? 'white' : null,
    lowerSurface: ksrtc ? 'ksrtcRed' : nyc ? 'nycBlue' : null,
    stripe: ksrtc ? 'ksrtcRed' : nyc ? 'nycBlue' : null,
    pillarSurface: ksrtc ? 'ksrtcRed' : nyc ? 'white' : 'paint',
  };
  for (let z = zR + 1.1; z < zF - 0.9; z += 1.12) shape.zones.pillars.push(z);
  const body = loftBody(shape);
  const parts = [body];
  const sideY = 1.12;
  if (ksrtc || nyc) {
    // Cream / MTA stripe band under the windows with transit authority branding.
    for (const s of [1, -1]) {
      parts.push(box(0.014, 0.2, L - 1.2, nyc ? 'white' : 'cream', xf(s * 1.254, 1.27, 0)));
      parts.push(decal(3.4, 0.5, rects.ksrtcSide, xf(s * 1.262, sideY - 0.28, 0.6, 0, s * HALF_PI, 0)));
      parts.push(decal(2.4, 0.36, rects.ksrtcType, xf(s * 1.262, sideY - 0.28, -2.9, 0, s * HALF_PI, 0)));
    }
  } else {
    const name = rects.privateNames[index % rects.privateNames.length];
    for (const s of [1, -1]) {
      parts.push(decal(L - 2.6, 0.62, name, xf(s * 1.262, sideY - 0.26, -0.1, 0, s * HALF_PI, 0)));
      parts.push(box(0.014, 0.1, L - 1.2, 'chrome', xf(s * 1.256, 1.36, 0)));
    }
  }
  // Flat glazed front and rear with the destination board above the windscreen.
  parts.push(roundBox(2.2, 1.35, 0.06, 0.05, 'glass', xf(0, 1.98, zF - 0.02)));
  parts.push(roundBox(2.2, 0.36, 0.06, 0.03, 'black', xf(0, 2.86, zF - 0.015)));
  parts.push(roundBox(2.1, 0.95, 0.06, 0.05, 'glass', xf(0, 2.1, zR + 0.02)));
  const board = rects.boards[index % rects.boards.length];
  parts.push(decal(1.95, 0.27, board, xf(0, 2.73, zF + 0.02)));
  parts.push(decal(1.5, 0.2, board, xf(0, 2.72, zR - 0.02, 0, Math.PI, 0)));
  // Lamps, grille, bumpers, plates.
  for (const s of [1, -1]) {
    parts.push(roundBox(0.34, 0.2, 0.1, 0.05, 'head', xf(s * 0.82, 0.98, zF - 0.02)));
    parts.push(box(0.14, 0.12, 0.06, 'indicator', xf(s * 1.06, 0.98, zF - 0.05, 0, s * 0.4, 0)));
    parts.push(box(0.16, 0.36, 0.06, 'tail', xf(s * 0.98, 1.3, zR + 0.0)));
    parts.push(box(0.16, 0.14, 0.06, 'indicator', xf(s * 0.98, 1.04, zR + 0.0)));
    // Big mirrors on stalks.
    parts.push(tube([s * 1.2, 2.3, zF - 0.4], [s * 1.5, 2.1, zF - 0.18], 0.02, 'black', 6));
    parts.push(roundBox(0.06, 0.42, 0.22, 0.03, 'black', xf(s * 1.52, 1.95, zF - 0.16)));
    // Entry door outline on the left, as in every Kerala bus.
    parts.push(box(0.016, 1.9, 0.03, 'black', xf(s * 1.256, 1.4, zF - 1.3)));
  }
  parts.push(roundBox(1.2, 0.34, 0.06, 0.04, 'black', xf(0, 0.98, zF - 0.0)));
  parts.push(roundBox(2.5, 0.24, 0.2, 0.05, 'darkGrey', xf(0, 0.6, zF - 0.06)));
  parts.push(roundBox(2.5, 0.24, 0.2, 0.05, 'darkGrey', xf(0, 0.62, zR + 0.06)));
  const plate = rects.platesYellow[index % rects.platesYellow.length];
  parts.push(decal(0.6, 0.15, plate, xf(0, 0.62, zF + 0.05)));
  parts.push(decal(0.6, 0.15, plate, xf(0, 0.95, zR - 0.03, 0, Math.PI, 0)));
  // Roof luggage rail and vents.
  for (const s of [1, -1]) parts.push(tube([s * 0.95, 3.26, zR + 1.2], [s * 0.95, 3.26, zF - 2.2], 0.02, 'steel', 5));
  for (const z of [-3, 0, 3]) parts.push(roundBox(0.7, 0.1, 0.9, 0.04, 'darkGrey', xf(0, 3.22, z)));
  // Wheel arches.
  const axles = [zF - 2.0, zR + 2.7];
  for (const s of [1, -1]) for (const z of axles) parts.push(torus(0.56, 0.05, 'black', xf(s * 1.245, 0.48, z, 0, HALF_PI, 0), Math.PI, 4, 10));
  const wheels = [];
  for (const [i, z] of axles.entries()) for (const s of [1, -1]) wheels.push({ x: s * 1.1, y: 0.5, z, r: 0.5, w: 0.3, side: s, steer: i === 0 });
  return { geometry: merge(parts), wheels, size: { length: L, width: 2.5, height: 3.2 }, seat: { x: -0.7, y: 1.4, z: zF - 1.0 } };
}

// ------------------------------------------------------------------------------- rider
function rider(parts, o) {
  const { hipY, hipZ, handY, handZ, handX, footY, footZ, footX, shirt = 'cloth' } = o;
  const hip = [0, hipY, hipZ];
  const shoulderY = hipY + 0.5;
  const shoulderZ = hipZ + 0.14;
  // Torso, leaning into the bars.
  parts.push(capsule(0.15, 0.34, shirt, xf(0, hipY + 0.27, hipZ + 0.07, 0.26, 0, 0, 1.18, 1, 0.82)));
  parts.push(sphere(0.105, 'skin', xf(0, shoulderY + 0.2, shoulderZ + 0.06)));
  parts.push(sphere(0.135, 'helmet', xf(0, shoulderY + 0.24, shoulderZ + 0.05, 0, 0, 0, 1, 1.02, 1.12), 10, 8));
  parts.push(box(0.2, 0.07, 0.02, 'glass', xf(0, shoulderY + 0.23, shoulderZ + 0.195)));
  for (const s of [1, -1]) {
    const sh = [s * 0.2, shoulderY, shoulderZ];
    const el = [s * (handX + 0.06), (shoulderY + handY) / 2 - 0.04, (shoulderZ + handZ) / 2 - 0.02];
    const hand = [s * handX, handY, handZ];
    parts.push(tube(sh, el, 0.052, shirt, 7, 0.045));
    parts.push(tube(el, hand, 0.042, 'skin', 7, 0.036));
    parts.push(sphere(0.045, 'skin', xf(hand[0], hand[1], hand[2])));
    const knee = [s * (footX + 0.02), hipY - 0.02, (hipZ + footZ) / 2 + 0.22];
    const foot = [s * footX, footY, footZ];
    parts.push(tube([s * 0.1, hip[1], hip[2]], knee, 0.085, 'trouser', 8, 0.068));
    parts.push(tube(knee, [foot[0], foot[1] + 0.08, foot[2]], 0.064, 'trouser', 8, 0.05));
    parts.push(roundBox(0.09, 0.08, 0.25, 0.03, 'black', xf(foot[0], foot[1] + 0.03, foot[2] + 0.06)));
  }
}

// -------------------------------------------------------------------------- motorcycle
function buildMotorcycle(rects, plateIndex, withRider) {
  const parts = [];
  const R = 0.31;
  const zf = 0.7;
  const zr = -0.66;
  // Engine, frame and tank.
  parts.push(roundBox(0.26, 0.3, 0.38, 0.05, 'darkGrey', xf(0, 0.43, 0.06)));
  parts.push(cyl(0.11, 0.1, 0.22, 10, 'steel', xf(0, 0.6, 0.12, 0.35, 0, 0)));
  parts.push(tube([0, 0.88, 0.46], [0, 0.34, 0.34], 0.025, 'black', 6));
  parts.push(tube([0, 0.62, -0.18], [0, 0.34, 0.34], 0.022, 'black', 6));
  parts.push(tube([0, 0.78, -0.2], [0, 0.72, -0.78], 0.025, 'black', 6));
  parts.push(sphere(0.2, 'paint', xf(0, 0.84, 0.2, 0, 0, 0, 0.8, 0.66, 1.5), 12, 8));
  parts.push(roundBox(0.27, 0.09, 0.64, 0.04, 'seat', xf(0, 0.82, -0.36, 0.04, 0, 0)));
  for (const s of [1, -1]) {
    parts.push(roundBox(0.03, 0.2, 0.36, 0.015, 'paint', xf(s * 0.13, 0.66, -0.3)));
    // Swing arm and rear shock.
    parts.push(tube([s * 0.08, 0.36, -0.12], [s * 0.08, R, zr], 0.022, 'steel', 6));
    parts.push(tube([s * 0.11, 0.72, -0.5], [s * 0.1, R + 0.03, zr + 0.05], 0.022, 'chrome', 6));
    // Fork legs.
    parts.push(tube([s * 0.085, R, zf], [s * 0.085, 1.0, 0.44], 0.024, 'chrome', 6));
    parts.push(tube([s * 0.12, 0.3, -0.05], [s * 0.2, 0.3, -0.05], 0.014, 'black', 5));
    parts.push(tube([s * 0.3, 1.06, 0.4], [s * 0.34, 1.2, 0.36], 0.008, 'black', 4));
    parts.push(roundBox(0.11, 0.07, 0.02, 0.01, 'black', xf(s * 0.35, 1.23, 0.35)));
    parts.push(sphere(0.03, 'indicator', xf(s * 0.16, 0.94, 0.56)));
    parts.push(sphere(0.03, 'indicator', xf(s * 0.15, 0.78, -0.86)));
  }
  // Tail, fenders, exhaust.
  parts.push(roundBox(0.2, 0.12, 0.34, 0.04, 'paint', xf(0, 0.8, -0.8, 0.22, 0, 0)));
  parts.push(roundBox(0.12, 0.06, 0.04, 0.015, 'tail', xf(0, 0.8, -0.985)));
  parts.push(torus(R + 0.045, 0.04, 'paint', xf(0, R, zf, 0, HALF_PI, 0, 1, 1, 2.2), Math.PI * 0.62, 5, 12));
  parts.push(torus(R + 0.05, 0.04, 'black', xf(0, R, zr, 0, HALF_PI, 0, 1, 1, 2.4), Math.PI * 0.5, 5, 12));
  parts.push(tube([-0.13, 0.34, 0.2], [-0.16, 0.3, -0.3], 0.024, 'chrome', 6));
  parts.push(tube([-0.16, 0.3, -0.3], [-0.19, 0.42, -0.95], 0.042, 'chrome', 8, 0.05));
  // Handlebar, clocks, headlamp.
  parts.push(tube([-0.33, 1.06, 0.4], [0.33, 1.06, 0.4], 0.016, 'black', 6));
  for (const s of [1, -1]) parts.push(tube([s * 0.24, 1.06, 0.4], [s * 0.36, 1.06, 0.38], 0.022, 'rubber', 6));
  parts.push(roundBox(0.2, 0.2, 0.16, 0.06, 'paint', xf(0, 0.96, 0.58)));
  parts.push(cyl(0.08, 0.08, 0.04, 14, 'head', xf(0, 0.95, 0.665, HALF_PI, 0, 0)));
  parts.push(roundBox(0.16, 0.06, 0.08, 0.02, 'black', xf(0, 1.08, 0.5, -0.5, 0, 0)));
  parts.push(decal(0.2, 0.1, rects.plates[plateIndex % rects.plates.length], xf(0, 0.62, -1.0, 0.2, Math.PI, 0)));
  if (withRider) rider(parts, { hipY: 0.9, hipZ: -0.3, handY: 1.06, handZ: 0.39, handX: 0.3, footY: 0.3, footZ: -0.05, footX: 0.19 });
  const wheels = [
    { x: 0, y: R, z: zf, r: R, w: 0.1, side: 1, steer: true },
    { x: 0, y: R, z: zr, r: R, w: 0.12, side: 1, steer: false },
  ];
  return { geometry: merge(parts), wheels, size: { length: 2.05, width: 0.75, height: 1.25 }, seat: { x: 0, y: 0.86, z: -0.3 }, twoWheeler: true };
}

// ----------------------------------------------------------------------------- scooter
function buildScooter(rects, plateIndex, withRider) {
  const parts = [];
  const R = 0.225;
  const zf = 0.62;
  const zr = -0.6;
  // Front apron and floorboard.
  parts.push(roundBox(0.46, 0.62, 0.1, 0.05, 'paint', xf(0, 0.66, 0.42, -0.18, 0, 0)));
  parts.push(roundBox(0.4, 0.06, 0.5, 0.025, 'black', xf(0, 0.3, 0.1)));
  // Rear body shell.
  parts.push(sphere(0.3, 'paint', xf(0, 0.52, -0.5, 0, 0, 0, 0.8, 0.82, 1.5), 12, 8));
  parts.push(roundBox(0.36, 0.26, 0.3, 0.05, 'paint', xf(0, 0.48, -0.16)));
  parts.push(roundBox(0.32, 0.1, 0.74, 0.04, 'seat', xf(0, 0.79, -0.42)));
  parts.push(roundBox(0.14, 0.08, 0.04, 0.02, 'tail', xf(0, 0.64, -0.945)));
  parts.push(tube([-0.18, 0.76, -0.78], [0.18, 0.76, -0.78], 0.014, 'steel', 5));
  // Steering column, handlebar cowl with the headlamp.
  parts.push(tube([0, R, zf], [0, 1.0, 0.36], 0.03, 'black', 6));
  parts.push(roundBox(0.5, 0.14, 0.18, 0.05, 'paint', xf(0, 1.02, 0.36)));
  parts.push(roundBox(0.2, 0.09, 0.04, 0.02, 'head', xf(0, 0.98, 0.455)));
  parts.push(torus(R + 0.04, 0.045, 'paint', xf(0, R, zf, 0, HALF_PI, 0, 1, 1, 2.2), Math.PI * 0.7, 5, 12));
  for (const s of [1, -1]) {
    parts.push(tube([s * 0.22, 1.03, 0.35], [s * 0.34, 1.03, 0.33], 0.022, 'rubber', 6));
    parts.push(tube([s * 0.2, 1.08, 0.36], [s * 0.3, 1.22, 0.33], 0.008, 'black', 4));
    parts.push(roundBox(0.1, 0.07, 0.02, 0.01, 'black', xf(s * 0.31, 1.25, 0.32)));
    parts.push(sphere(0.028, 'indicator', xf(s * 0.2, 0.76, 0.475)));
    parts.push(sphere(0.028, 'indicator', xf(s * 0.17, 0.62, -0.9)));
  }
  parts.push(tube([-0.18, 0.3, -0.25], [-0.2, 0.32, -0.85], 0.04, 'steel', 8));
  parts.push(decal(0.2, 0.1, rects.plates[plateIndex % rects.plates.length], xf(0, 0.5, -0.96, 0.15, Math.PI, 0)));
  if (withRider) rider(parts, { hipY: 0.87, hipZ: -0.36, handY: 1.04, handZ: 0.34, handX: 0.29, footY: 0.33, footZ: 0.12, footX: 0.12 });
  const wheels = [
    { x: 0, y: R, z: zf, r: R, w: 0.1, side: 1, steer: true },
    { x: 0, y: R, z: zr, r: R, w: 0.11, side: 1, steer: false },
  ];
  return { geometry: merge(parts), wheels, size: { length: 1.85, width: 0.7, height: 1.15 }, seat: { x: 0, y: 0.84, z: -0.4 }, twoWheeler: true };
}

// --------------------------------------------------------------------------- catalogue
export function buildModel(type, rects, variant = 0) {
  if (SHAPES[type]) {
    return buildCar(type, rects, variant * 3 + (type.charCodeAt(0) % 5));
  }
  switch (type) {
    case 'jeep':
      return buildJeep(rects, variant + 1);
    case 'delivery_truck':
      return buildDeliveryTruck(rects, variant + 2);
    case 'double_decker':
      return buildDoubleDecker(rects, variant);
    case 'auto':
      return buildAuto(rects, variant);
    case 'ksrtc':
      return buildBus(rects, 'ksrtc', variant);
    case 'nyc_bus':
      return buildBus(rects, 'nyc_bus', variant + 1);
    case 'bus':
      return buildBus(rects, 'private', variant + 2);
    case 'motorcycle':
      return buildMotorcycle(rects, variant + 4, false);
    case 'motorcycle_r':
      return buildMotorcycle(rects, variant + 5, true);
    case 'scooter':
      return buildScooter(rects, variant + 6, false);
    case 'scooter_r':
      return buildScooter(rects, variant + 7, true);
    default:
      throw new Error(`unknown vehicle ${type}`);
  }
}

export { SURF };

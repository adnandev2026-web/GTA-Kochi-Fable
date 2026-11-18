// Animated humans with full modular appearance customization (skin, face/shades,
// hats, mustache, beard, shirt, overcoat, pants, shoes).

import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const CLIPS = ['idle', 'walk', 'run'];
const norm = (name) => name.replace(/^mixamorig:?/i, '').replace(/[^A-Za-z0-9]/g, '');

const cache = new Map();

function collectBones(root) {
  const map = new Map();
  const order = [];
  root.traverse((o) => {
    if (o.isBone) {
      map.set(norm(o.name), o);
      order.push(o);
    }
  });
  return { map, order };
}

function bindPose(root, boneMap) {
  const rot = new Map();
  const pos = new Map();
  const m = new THREE.Matrix4();
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  root.traverse((o) => {
    if (!o.isSkinnedMesh) return;
    const sk = o.skeleton;
    sk.bones.forEach((bone, i) => {
      const n = norm(bone.name);
      if (rot.has(n)) return;
      m.copy(sk.boneInverses[i]).invert().premultiply(o.bindMatrix);
      m.decompose(p, q, sc);
      rot.set(n, q.clone());
      pos.set(n, p.clone());
    });
  });
  for (const [n, b] of boneMap) {
    if (rot.has(n)) continue;
    rot.set(n, b.getWorldQuaternion(new THREE.Quaternion()));
    pos.set(n, b.getWorldPosition(new THREE.Vector3()));
  }
  return { rot, pos };
}

const PRIMARY_CHILD = {
  Hips: 'Spine',
  Spine: 'Spine1',
  Spine1: 'Spine2',
  Spine2: 'Neck',
  Neck: 'Head',
  Head: 'HeadTopEnd',
  LeftHand: 'LeftHandMiddle1',
  RightHand: 'RightHandMiddle1',
};

function alignRest(restT, restS, targetBones) {
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Quaternion();
  for (const [n, bone] of targetBones) {
    if (!restS.rot.has(n)) continue;
    let child = PRIMARY_CHILD[n];
    if (!child) {
      const kid = bone.children.find((k) => k.isBone && restS.pos.has(norm(k.name)));
      child = kid ? norm(kid.name) : null;
    }
    if (!child || !restS.pos.has(child) || !restT.pos.has(child)) continue;
    a.subVectors(restT.pos.get(child), restT.pos.get(n));
    b.subVectors(restS.pos.get(child), restS.pos.get(n));
    if (a.lengthSq() < 1e-8 || b.lengthSq() < 1e-8) continue;
    c.setFromUnitVectors(a.normalize(), b.normalize());
    restT.rot.set(n, c.clone().multiply(restT.rot.get(n)));
  }
}

function retarget(sourceGltf, targetScene, key) {
  if (cache.has(key)) return cache.get(key);
  const src = SkeletonUtils.clone(sourceGltf.scene);
  const tgt = SkeletonUtils.clone(targetScene);
  src.updateMatrixWorld(true);
  tgt.updateMatrixWorld(true);
  const S = collectBones(src);
  const T = collectBones(tgt);

  const restS = bindPose(src, S.map);
  const restT = bindPose(tgt, T.map);
  alignRest(restT, restS, T.map);
  const restLocalT = new Map();
  for (const [n, b] of T.map) restLocalT.set(n, b.quaternion.clone());
  const hipsS = S.map.get('Hips');
  const hipsT = T.map.get('Hips');
  const hipRestS = restS.pos.get('Hips');
  const hipRestT = restT.pos.get('Hips');
  const scale = hipRestT.y / hipRestS.y;
  const hipParentInv = new THREE.Matrix4().copy(hipsT.parent.matrixWorld).invert();

  const mixer = new THREE.AnimationMixer(src);
  const clips = {};
  const q = new THREE.Quaternion();
  const d = new THREE.Quaternion();
  const world = new Map();
  const v = new THREE.Vector3();

  for (const name of CLIPS) {
    const clip = sourceGltf.animations.find((c) => c.name.toLowerCase() === name);
    if (!clip) continue;
    mixer.stopAllAction();
    const action = mixer.clipAction(clip);
    action.reset().play();
    const fps = 30;
    const frames = Math.max(2, Math.round(clip.duration * fps));
    const times = new Float32Array(frames + 1);
    const tracks = new Map();
    for (const b of T.order) tracks.set(b, new Float32Array((frames + 1) * 4));
    const hipTrack = new Float32Array((frames + 1) * 3);

    for (let f = 0; f <= frames; f++) {
      const t = Math.min(clip.duration - 1e-4, (f / frames) * clip.duration);
      times[f] = (f / frames) * clip.duration;
      mixer.setTime(t);
      src.updateMatrixWorld(true);
      for (const b of T.order) {
        const n = norm(b.name);
        const parentWorld = b.parent && b.parent.isBone ? world.get(b.parent) : b.parent.getWorldQuaternion(new THREE.Quaternion());
        let target;
        const sb = S.map.get(n);
        if (sb) {
          sb.getWorldQuaternion(q);
          d.copy(q).multiply(restS.rot.get(n).clone().invert());
          target = d.clone().multiply(restT.rot.get(n));
        } else {
          target = parentWorld.clone().multiply(restLocalT.get(n));
        }
        world.set(b, target);
        const local = parentWorld.clone().invert().multiply(target);
        local.toArray(tracks.get(b), f * 4);
      }
      hipsS.getWorldPosition(v).sub(hipRestS).multiplyScalar(scale).add(hipRestT).applyMatrix4(hipParentInv);
      v.toArray(hipTrack, f * 3);
    }
    const hx0 = hipTrack[0];
    const hz0 = hipTrack[2];
    const hx1 = hipTrack[frames * 3];
    const hz1 = hipTrack[frames * 3 + 2];
    for (let f = 0; f <= frames; f++) {
      const u = f / frames;
      hipTrack[f * 3] -= (hx1 - hx0) * u + hx0 - hipsT.position.x;
      hipTrack[f * 3 + 2] -= (hz1 - hz0) * u + hz0 - hipsT.position.z;
    }
    const out = [];
    for (const [b, values] of tracks) out.push(new THREE.QuaternionKeyframeTrack(`${b.name}.quaternion`, times, values));
    out.push(new THREE.VectorKeyframeTrack(`${hipsT.name}.position`, times, hipTrack));
    clips[name] = new THREE.AnimationClip(name, clip.duration, out);
  }
  mixer.stopAllAction();

  const box = new THREE.Box3().setFromObject(tgt);
  const result = { clips, height: box.max.y - box.min.y, restT: restT.rot, boneNames: [...T.map.keys()] };
  cache.set(key, result);
  return result;
}

const POSES = {
  ride: {
    Hips: [8, 0, 0],
    Spine: [14, 0, 0],
    Spine1: [20, 0, 0],
    Spine2: [24, 0, 0],
    Neck: [6, 0, 0],
    Head: [-4, 0, 0],
    LeftUpLeg: [-72, 0, 14],
    RightUpLeg: [-72, 0, -14],
    LeftLeg: [18, 0, 8],
    RightLeg: [18, 0, -8],
    LeftFoot: [10, 0, 0],
    RightFoot: [10, 0, 0],
    LeftShoulder: [0, -12, 0],
    RightShoulder: [0, 12, 0],
    LeftArm: [0, -62, -34],
    RightArm: [0, 62, 34],
    LeftForeArm: [0, -92, -22],
    RightForeArm: [0, 92, 22],
    LeftHand: [0, -90, -20],
    RightHand: [0, 90, 20],
  },
};

const _e = new THREE.Euler();

export class Character {
  constructor(assets, kind = 'avatar', { tint = null, height = 1.74, appearance = null } = {}) {
    const gltf = assets.models[kind] || assets.models[kind.replace('Lite', '')] || assets.models.xbot;
    const data = kind === 'xbot' ? null : retarget(assets.models.xbot, gltf.scene, kind.replace('Lite', ''));
    this.kind = kind;
    this.root = new THREE.Group();
    this.model = SkeletonUtils.clone(gltf.scene);
    this.root.add(this.model);
    const nativeHeight = data ? data.height : new THREE.Box3().setFromObject(this.model).getSize(new THREE.Vector3()).y;
    const scaleFactor = height / nativeHeight;
    this.model.scale.setScalar(scaleFactor);
    this._invScale = 1 / scaleFactor;
    this.height = height;
    this.bones = new Map();
    this._parts = { top: [], bottom: [], skin: [], shoes: [], hair: [] };
    this._customAttachments = [];

    this.model.traverse((o) => {
      if (o.isBone) this.bones.set(norm(o.name), o);
      if (o.isMesh || o.isSkinnedMesh) {
        o.castShadow = true;
        o.receiveShadow = false;
        o.frustumCulled = false;
        if (kind.startsWith('avatar') && /headwear|hat/i.test(o.material?.name || '')) o.visible = false;
        if (o.material) {
          const cloned = o.material.clone();
          cloned.envMapIntensity = 0.7;
          o.material = cloned;
          const name = cloned.name || '';
          const meshName = o.name || '';
          if (/Outfit_Top|Ch03|Beta_Surface|HighLimbs/i.test(name) || /Top/i.test(meshName)) {
            this._parts.top.push({ mat: cloned, baseColor: cloned.color.clone() });
            if (tint && (tint.all || tint.top)) cloned.color.multiply(new THREE.Color(tint.top ?? 0xffffff));
          } else if (/Outfit_Bottom/i.test(name) || /Bottom/i.test(meshName)) {
            this._parts.bottom.push({ mat: cloned, baseColor: cloned.color.clone() });
            if (tint?.bottom) cloned.color.multiply(new THREE.Color(tint.bottom));
          } else if (/Outfit_Footwear|Shoe/i.test(name) || /Footwear/i.test(meshName)) {
            this._parts.shoes.push({ mat: cloned, baseColor: cloned.color.clone() });
          } else if (/Skin|Head|Body/i.test(name) || /Head|Body/i.test(meshName)) {
            if (!/Eye|Teeth|Hair/i.test(name + meshName)) {
              this._parts.skin.push({ mat: cloned, baseColor: cloned.color.clone() });
            }
          } else if (/Hair/i.test(name) || /Hair/i.test(meshName)) {
            this._parts.hair.push({ mat: cloned, baseColor: cloned.color.clone() });
          }
        }
      }
    });
    this.rest = data ? data.restT : null;

    this.mixer = new THREE.AnimationMixer(this.model);
    this.actions = {};
    const clips = data ? data.clips : Object.fromEntries(CLIPS.map((n) => [n, gltf.animations.find((c) => c.name === n)]));
    for (const name of CLIPS) {
      if (!clips[name]) continue;
      const a = this.mixer.clipAction(clips[name]);
      a.enabled = true;
      a.setEffectiveWeight(name === 'idle' ? 1 : 0);
      a.play();
      this.actions[name] = a;
    }
    this.weights = { idle: 1, walk: 0, run: 0 };
    this.walkRef = 1.55;
    this.runRef = 4.4;
    this.pose = null;
    this.air = 0;

    if (appearance) {
      this.applyAppearance(appearance);
    }
  }

  _clearAttachments() {
    for (const item of this._customAttachments) {
      item.parent?.remove(item);
      item.traverse?.((c) => {
        c.geometry?.dispose?.();
        c.material?.dispose?.();
      });
    }
    this._customAttachments = [];
  }

  applyAppearance(app) {
    if (!app) return;
    this._clearAttachments();

    // Base mesh tinting (skin, shirt, pants, shoes)
    const setColor = (list, hex, blendFactor = 1.0) => {
      if (!hex) return;
      const target = new THREE.Color(hex);
      for (const item of list) {
        if (blendFactor >= 0.99) {
          item.mat.color.copy(target);
        } else {
          item.mat.color.copy(item.baseColor).lerp(target, blendFactor);
        }
      }
    };

    setColor(this._parts.skin, app.skinTone, 0.72);
    setColor(this._parts.top, app.shirtColor, 0.85);
    setColor(this._parts.bottom, app.pantsColor, 0.88);
    setColor(this._parts.shoes, app.shoeColor, 0.88);
    setColor(this._parts.hair, app.facialHairColor, 0.85);

    const s = this._invScale;
    const head = this.bones.get('Head') || this.bones.get('Neck');
    const torso = this.bones.get('Spine2') || this.bones.get('Spine1') || this.bones.get('Spine');
    const hips = this.bones.get('Hips');

    // Head attachments: Hats, Face accessories, Mustache, Beard
    if (head) {
      const headGroup = new THREE.Group();
      headGroup.scale.setScalar(s);

      // Hats
      if (app.hat && app.hat !== 'none') {
        const hatMat = new THREE.MeshStandardMaterial({ color: app.hatColor || '#1f2937', roughness: 0.6, metalness: 0.08 });
        if (app.hat === 'cap') {
          const crown = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hatMat);
          crown.position.set(0, 0.105, -0.005);
          const brim = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.014, 0.11), hatMat);
          brim.position.set(0, 0.105, 0.10);
          brim.rotation.x = 0.08;
          headGroup.add(crown, brim);
        } else if (app.hat === 'beanie') {
          const dome = new THREE.Mesh(new THREE.SphereGeometry(0.118, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), hatMat);
          dome.position.set(0, 0.1, -0.008);
          const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.119, 0.119, 0.036, 16), hatMat);
          cuff.position.set(0, 0.095, -0.008);
          headGroup.add(dome, cuff);
        } else if (app.hat === 'fedora') {
          const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.012, 20), hatMat);
          brim.position.set(0, 0.118, 0);
          const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.112, 0.09, 16), hatMat);
          crown.position.set(0, 0.16, 0);
          const bandMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.5 });
          const band = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.113, 0.018, 16), bandMat);
          band.position.set(0, 0.132, 0);
          headGroup.add(brim, crown, band);
        } else if (app.hat === 'helmet') {
          const shell = new THREE.Mesh(new THREE.SphereGeometry(0.132, 18, 14), hatMat);
          shell.position.set(0, 0.085, 0);
          const visorMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.15, metalness: 0.8 });
          const visor = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.055, 0.07), visorMat);
          visor.position.set(0, 0.085, 0.105);
          headGroup.add(shell, visor);
        }
      }

      // Face styles (glasses / scar)
      if (app.faceStyle === 'sunglasses' || app.faceStyle === 'aviators') {
        const frameCol = app.faceStyle === 'aviators' ? '#d4af37' : '#111827';
        const lensCol = app.faceStyle === 'aviators' ? '#1e293b' : '#09090b';
        const frameMat = new THREE.MeshStandardMaterial({ color: frameCol, roughness: 0.3, metalness: 0.7 });
        const lensMat = new THREE.MeshStandardMaterial({ color: lensCol, roughness: 0.15, metalness: 0.5 });
        for (const lx of [-0.033, 0.033]) {
          const lens = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.028, 0.012), lensMat);
          lens.position.set(lx, 0.068, 0.105);
          headGroup.add(lens);
        }
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, 0.01), frameMat);
        bridge.position.set(0, 0.072, 0.106);
        headGroup.add(bridge);
      } else if (app.faceStyle === 'scarred') {
        const scarMat = new THREE.MeshStandardMaterial({ color: '#7f1d1d', roughness: 0.8 });
        const scar = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.045, 0.008), scarMat);
        scar.position.set(0.035, 0.065, 0.104);
        scar.rotation.z = 0.25;
        headGroup.add(scar);
      }

      // Mustache
      const fhMat = new THREE.MeshStandardMaterial({ color: app.facialHairColor || '#181512', roughness: 0.88 });
      if (app.mustache && app.mustache !== 'none') {
        if (app.mustache === 'thin') {
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.009, 0.014), fhMat);
          m.position.set(0, 0.026, 0.105);
          headGroup.add(m);
        } else if (app.mustache === 'chevron') {
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.016, 0.018), fhMat);
          m.position.set(0, 0.025, 0.106);
          headGroup.add(m);
        } else if (app.mustache === 'handlebar') {
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.014, 0.018), fhMat);
          m.position.set(0, 0.025, 0.106);
          headGroup.add(m);
          for (const sx of [-0.036, 0.036]) {
            const tip = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.026, 0.015), fhMat);
            tip.position.set(sx, 0.015, 0.102);
            tip.rotation.z = sx > 0 ? 0.22 : -0.22;
            headGroup.add(tip);
          }
        }
      }

      // Beard
      if (app.beard && app.beard !== 'none') {
        if (app.beard === 'stubble') {
          const jaw = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.056, 0.045, 12, 1, false, -Math.PI * 0.45, Math.PI * 0.9), fhMat);
          jaw.position.set(0, -0.002, 0.036);
          headGroup.add(jaw);
        } else if (app.beard === 'goatee') {
          const chin = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.042, 0.028), fhMat);
          chin.position.set(0, -0.008, 0.095);
          headGroup.add(chin);
        } else if (app.beard === 'full') {
          const beardBody = new THREE.Mesh(new THREE.SphereGeometry(0.088, 14, 10, 0, Math.PI * 2, Math.PI * 0.48, Math.PI * 0.52), fhMat);
          beardBody.position.set(0, 0.015, 0.035);
          beardBody.scale.set(0.95, 1.15, 0.92);
          headGroup.add(beardBody);
        }
      }

      head.add(headGroup);
      this._customAttachments.push(headGroup);
    }

    // Shirt detail (Hoodie hood / Kurta collar)
    if (torso && (app.shirtStyle === 'hoodie' || app.shirtStyle === 'polo' || app.shirtStyle === 'kurta')) {
      const shirtDetail = new THREE.Group();
      shirtDetail.scale.setScalar(s);
      const collarMat = new THREE.MeshStandardMaterial({ color: app.shirtColor || '#e6e8eb', roughness: 0.78 });
      if (app.shirtStyle === 'hoodie') {
        const hood = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.14), collarMat);
        hood.position.set(0, 0.14, -0.1);
        shirtDetail.add(hood);
      } else if (app.shirtStyle === 'kurta') {
        const tunic = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.195, 0.34, 14), collarMat);
        tunic.position.set(0, -0.18, 0);
        tunic.scale.set(1.05, 1, 0.72);
        shirtDetail.add(tunic);
      } else {
        const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.11, 0.045, 14), collarMat);
        collar.position.set(0, 0.13, 0);
        shirtDetail.add(collar);
      }
      torso.add(shirtDetail);
      this._customAttachments.push(shirtDetail);
    }

    // Overcoat (bomber, leather, trench, denim)
    if (torso && app.overcoat && app.overcoat !== 'none') {
      const coatGroup = new THREE.Group();
      coatGroup.scale.setScalar(s);
      const isLeather = app.overcoat === 'leather';
      const coatMat = new THREE.MeshStandardMaterial({
        color: app.overcoatColor || '#1e3a5f',
        roughness: isLeather ? 0.38 : 0.76,
        metalness: isLeather ? 0.18 : 0.04,
      });
      const chestH = app.overcoat === 'trench' ? 0.44 : 0.34;
      const chestY = app.overcoat === 'trench' ? -0.06 : -0.01;
      // Left & right open front panels + back panel so shirt remains visible in front
      for (const sx of [-0.095, 0.095]) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.135, chestH, 0.23), coatMat);
        panel.position.set(sx, chestY, 0.005);
        panel.castShadow = true;
        coatGroup.add(panel);
      }
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.32, chestH, 0.08), coatMat);
      back.position.set(0, chestY, -0.075);
      back.castShadow = true;
      coatGroup.add(back);

      // Collar lapels
      const collar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.065, 0.18), coatMat);
      collar.position.set(0, 0.145, -0.015);
      coatGroup.add(collar);

      torso.add(coatGroup);
      this._customAttachments.push(coatGroup);

      if (hips && app.overcoat === 'trench') {
        const skirtGroup = new THREE.Group();
        skirtGroup.scale.setScalar(s);
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.21, 0.32, 14, 1, true, Math.PI * 0.15, Math.PI * 1.7), coatMat);
        tail.position.set(0, -0.14, -0.01);
        tail.scale.set(1.05, 1, 0.75);
        skirtGroup.add(tail);
        hips.add(skirtGroup);
        this._customAttachments.push(skirtGroup);
      }
    }
  }

  locomotion(speed, dt, airborne = false) {
    const w = this.weights;
    let ti = 0;
    let tw = 0;
    let tr = 0;
    if (speed < 0.25) ti = 1;
    else if (speed < 3.2) {
      tw = 1;
    } else tr = 1;
    if (airborne) {
      ti = 0;
      tw = 0;
      tr = 1;
    }
    const k = 1 - Math.exp(-9 * dt);
    w.idle += (ti - w.idle) * k;
    w.walk += (tw - w.walk) * k;
    w.run += (tr - w.run) * k;
    const a = this.actions;
    a.idle?.setEffectiveWeight(w.idle);
    a.walk?.setEffectiveWeight(w.walk);
    a.run?.setEffectiveWeight(w.run);
    if (a.walk) a.walk.timeScale = THREE.MathUtils.clamp(speed / this.walkRef, 0.6, 1.9);
    if (a.run) a.run.timeScale = airborne ? 0.35 : THREE.MathUtils.clamp(speed / this.runRef, 0.8, 1.7);
  }

  setPose(name) {
    this.pose = name ? POSES[name] : null;
    for (const key in this.actions) this.actions[key].paused = !!name;
    if (this.pose) this.applyPose();
  }

  applyPose() {
    if (!this.rest) return;
    const world = new Map();
    const q = new THREE.Quaternion();
    const rootQ = this.model.getWorldQuaternion(new THREE.Quaternion());
    const rootInv = rootQ.clone().invert();
    this.model.traverse((b) => {
      if (!b.isBone) return;
      const n = norm(b.name);
      const parentWorld = b.parent.isBone ? world.get(b.parent) : rootInv.clone().multiply(b.parent.getWorldQuaternion(new THREE.Quaternion()));
      const rest = this.rest.get(n);
      const p = this.pose[n];
      let target;
      if (p && rest) {
        _e.set(THREE.MathUtils.degToRad(p[0]), THREE.MathUtils.degToRad(p[1]), THREE.MathUtils.degToRad(p[2]), 'XYZ');
        q.setFromEuler(_e);
        target = q.clone().multiply(rest);
      } else if (rest && b.parent.isBone) {
        const parentRest = this.rest.get(norm(b.parent.name));
        target = parentWorld.clone().multiply(parentRest.clone().invert().multiply(rest));
      } else {
        target = rest ? rest.clone() : parentWorld.clone().multiply(b.quaternion);
      }
      world.set(b, target);
      b.quaternion.copy(parentWorld.clone().invert().multiply(target));
    });
  }

  update(dt) {
    if (this.pose) return;
    this.mixer.update(dt);
  }

  setVisible(v) {
    this.root.visible = v;
  }

  dispose() {
    this._clearAttachments();
    this.mixer.stopAllAction();
  }
}

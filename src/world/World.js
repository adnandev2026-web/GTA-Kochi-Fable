// Assembles the static world in stages so the loading screen can report progress.

import { Terrain } from './Terrain.js';
import { SurfaceMap, SURF } from './SurfaceMap.js';
import { RoadNetwork } from './RoadNetwork.js';
import { RoadMeshBuilder } from './RoadMeshBuilder.js';
import { Ground } from './Ground.js';
import { Land } from './Land.js';
import { Environment } from './Environment.js';
import { Metro } from './Metro.js';
import { CityBuilder } from './CityBuilder.js';
import { CitySpecialBuildings } from './CitySpecialBuildings.js';
import { Vegetation } from './Vegetation.js';
import { Culler } from './Culler.js';
import { CollisionWorld } from '../core/Collision.js';
import { CITY_POIS, OPEN_AREAS, RESERVED, RESERVED_CIRCLES, SPAWN } from './layout.js';

export class World {
  constructor(scene, renderer, assets, quality, game) {
    this.game = game;
    this.scene = scene;
    this.renderer = renderer;
    this.assets = assets;
    this.quality = quality;
    this.updaters = [];
  }

  /** Yields [label, fn] build steps. */
  *steps() {
    const cityLabel = CITY_POIS.cityName || 'Kochi';
    yield [`Surveying ${cityLabel} terrain`, () => {
      this.terrain = new Terrain();
      this.surface = new SurfaceMap(this.terrain);
      this.colliders = new CollisionWorld();
      for (const r of RESERVED) this.surface.rect(r.c[0], r.c[1], r.hx, r.hz, r.rot, SURF.RESERVED);
      for (const c of RESERVED_CIRCLES) this.surface.circle(c.c[0], c.c[1], c.r, SURF.RESERVED);
      for (const poly of OPEN_AREAS) {
        for (let i = 1; i < poly.length - 1; i++) this.surface.tri(poly[0][0], poly[0][1], poly[i][0], poly[i][1], poly[i + 1][0], poly[i + 1][1], SURF.OPEN, [SURF.RESERVED]);
      }
    }];
    yield [`Laying out ${cityLabel} roads`, () => {
      this.roads = new RoadNetwork();
      this.ground = new Ground(this.surface, this.roads, this.terrain);
      this.metro = new Metro(this);
    }];
    yield ['Painting facades and signboards', () => {
      this.city = new CityBuilder(this);
      this.city.prepare();
    }];
    yield ['Pouring asphalt and avenues', () => {
      this.roadBuilder = new RoadMeshBuilder(this);
      this.scene.add(this.roadBuilder.build());
    }];
    yield [`Lighting ${cityLabel} sky`, () => {
      this.environment = new Environment(this.scene, this.renderer, this.assets, this.quality);
      this.land = new Land(this.scene, this.assets, this.terrain);
      this.updaters.push((dt) => this.land.update(dt));
    }];
    yield ['Raising transit corridors', () => {
      this.metro.reserve();
      this.scene.add(this.metro.build());
      this.updaters.push((dt, focus) => this.metro.update(dt, focus));
    }];
    yield ['Building landmarks, schools & stations', () => {
      this.city.landmarks.build();
      this.specials = new CitySpecialBuildings(this);
      this.scene.add(this.specials.build());
    }];
    yield ['Building city neighborhoods', () => {
      this.city._buildOsmBuildings();
      this.city._frontages();
      this.city._interior();
      this.city.props.build();
      this.scene.add(this.city.finish());
      this.time = 0;
      this.updaters.push((dt) => {
        this.time += dt;
        this.city.props.update(this.time);
        this.specials?.update(this.time);
      });
    }];
    yield ['Planting trees & street palms', () => {
      this.vegetation = new Vegetation(this);
      this.scene.add(this.vegetation.build());
      this.updaters.push((dt) => this.vegetation.update(dt));
    }];
    yield ['Finalizing city culler', () => {
      this.culler = new Culler(this);
      this.updaters.push((dt, focus, camera) => this.culler.update(dt, camera));
    }];
  }

  /** Extra setback for lots on a side of the road where the viaduct runs beside it. */
  metroClearance(edge, side, s) {
    const f = edge.at(s);
    const lat = side * (edge.half + edge.walk + 5);
    const t = this.surface.typeAt(f.x + f.nx * lat, f.z + f.nz * lat);
    return t === SURF.RESERVED ? 13.5 : 0;
  }

  /** Called once the vehicle systems exist: parked vehicles, starter fleet at player home. */
  async populate(game, selectedVehicle = 'hatchback', ownedVehicles = ['hatchback', 'scooter', 'auto']) {
    const vm = game.vehicleManager;
    const home = (CITY_POIS.homes || []).find((h) => h.id === CITY_POIS.selectedHomeId) || CITY_POIS.homes?.[0];
    const hx = home ? home.x : SPAWN.p[0];
    const hz = home ? home.z : SPAWN.p[1];
    const hh = home ? home.heading : SPAWN.heading;
    const rx = Math.cos(hh);
    const rz = -Math.sin(hh);

    // Park player's chosen primary vehicle + starter vehicles right outside their chosen Home!
    const primaryType = selectedVehicle || 'hatchback';
    vm.spawn(primaryType, hx + rx * 5.2, hz + rz * 5.2, hh, 0x9a1414);

    const secondaryPool = ownedVehicles.filter((v) => v !== primaryType);
    if (secondaryPool[0]) {
      vm.spawn(secondaryPool[0], hx - rx * 5.5, hz - rz * 5.5, hh, 0x16171a);
    } else {
      vm.spawn('scooter', hx - rx * 5.5, hz - rz * 5.5, hh, 0xc8a21a);
    }

    // If Kochi, also keep iconic vehicles outside Brototype
    if (CITY_POIS.cityId === 'kochi' && this.city.landmarks.brototypeFrame) {
      const fr = this.city.landmarks.brototypeFrame;
      const place = (type, lx, lz, turn, colour) => {
        const p = fr.P(lx, 0, lz);
        return vm.spawn(type, p[0], p[2], Math.atan2(fr.fx, fr.fz) + turn, colour);
      };
      place('hatchback', -6, 24.5, Math.PI / 2, 0x9a1414);
      place('motorcycle', 1.5, 22.5, Math.PI / 2, 0x16171a);
      place('auto', 9, 25, Math.PI / 2);
    }

    vm.setParking(this.city.parking, 0.42 * (this.quality.parked ?? 1));
  }

  roadNameAt(x, z) {
    const hit = this.roads.nearestEdge(x, z, 30);
    if (!hit) return '';
    if (Math.abs(hit.lateral) > hit.edge.half + hit.edge.walk + 4) return '';
    return hit.edge.name;
  }

  update(dt, focus, camera) {
    for (const u of this.updaters) u(dt, focus, camera);
    this.environment.update(focus);
  }

  dispose() {
    this.specials?.dispose();
  }
}

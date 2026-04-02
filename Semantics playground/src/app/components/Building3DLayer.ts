import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import mapboxgl from 'mapbox-gl';

// ─── Constants ────────────────────────────────────────────────────────────────
const MODEL_LNG = -122.4132;
const MODEL_LAT  = 37.8082;
const MODEL_ALTITUDE = 0;

const HOVER_COLOR     = 0x1a6fff;
const HOVER_INTENSITY = 0.45;
const SELECT_COLOR     = 0x1a6fff;
const SELECT_INTENSITY = 0.85;

const ROOF_KEYWORDS  = ['roof', 'ceiling', 'tetto', 'decke', 'plafond'];
const CHAIR_KEYWORDS = ['chair', 'seat', 'stool', 'chaise', 'stuhl'];
const DESK_KEYWORDS  = ['desk'];
const MONITOR_KEYWORDS = ['monitor'];

// ─── Types ────────────────────────────────────────────────────────────────────
type SelectableGroup = {
  root: THREE.Object3D;
  meshes: THREE.Mesh[];
  id: number;
  name: string;
  kind: 'chair' | 'desk' | 'monitor';
};

// ─── keep legacy alias so nothing else in this file breaks ───────────────────
type ChairGroup = SelectableGroup;

type MeasurementLine = {
  id: number;
  tube: THREE.Mesh;           // thick cylinder tube (replaces thin Line)
  markers: THREE.Mesh[];
  points: [THREE.Vector3, THREE.Vector3];
  distanceM: number;
};

// ─── Raycasting scratch objects ───────────────────────────────────────────────
const _raycaster = new THREE.Raycaster();
const _invProj   = new THREE.Matrix4();
const _nearVec   = new THREE.Vector4();
const _farVec    = new THREE.Vector4();
const _rayOrigin = new THREE.Vector3();
const _rayDir    = new THREE.Vector3();

// ═══════════════════════════════════════════════════════════════════════════════
//  GEOMETRY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
function mkBox(w: number, h: number, d: number, mat: THREE.Material, name: string): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.name = name;
  return m;
}

function mkCyl(rt: number, rb: number, h: number, segs: number, mat: THREE.Material, name: string): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs), mat);
  m.name = name;
  return m;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FURNITURE BUILDERS
// ═══════════════════════════════════════════════════════════════════════════════

function buildDesk(id: string, topMat: THREE.Material, metalMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  g.name = `desk_${id}`;

  // Surface
  const top = mkBox(1.55, 0.04, 0.72, topMat, `desk_top_${id}`);
  top.position.set(0, 0.74, 0);
  g.add(top);

  // Modesty panel (front face)
  const panel = mkBox(1.44, 0.5, 0.025, topMat, `desk_panel_${id}`);
  panel.position.set(0, 0.47, 0.35);
  g.add(panel);

  // 4 metal legs
  const lh = 0.72;
  ([ [-0.72, -0.33], [0.72, -0.33], [-0.72, 0.33], [0.72, 0.33] ] as [number,number][]).forEach(([lx, lz], i) => {
    const leg = mkBox(0.05, lh, 0.05, metalMat, `desk_leg_${id}_${i}`);
    leg.position.set(lx, lh / 2, lz);
    g.add(leg);
  });

  return g;
}

function buildChair(id: string, fabricMat: THREE.Material, metalMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  g.name = `chair_${id}`; // "chair" prefix → auto-detected for hover

  // Seat pan
  const seat = mkBox(0.52, 0.06, 0.5, fabricMat, `chair_seat_${id}`);
  seat.position.set(0, 0.46, 0);
  g.add(seat);

  // Backrest
  const back = mkBox(0.52, 0.56, 0.06, fabricMat, `chair_back_${id}`);
  back.position.set(0, 0.77, -0.22);
  g.add(back);

  // Lumbar bump
  const lumbar = mkBox(0.38, 0.09, 0.04, fabricMat, `chair_lumbar_${id}`);
  lumbar.position.set(0, 0.56, -0.25);
  g.add(lumbar);

  // Armrests
  ([-0.28, 0.28] as number[]).forEach((ax, i) => {
    const arm = mkBox(0.06, 0.04, 0.28, metalMat, `chair_arm_${id}_${i}`);
    arm.position.set(ax, 0.62, -0.04);
    g.add(arm);
  });

  // Pneumatic post
  const post = mkCyl(0.04, 0.04, 0.46, 8, metalMat, `chair_post_${id}`);
  post.position.set(0, 0.23, 0);
  g.add(post);

  // 5-star base arms
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2;
    const arm = mkBox(0.05, 0.035, 0.38, metalMat, `chair_star_${id}_${i}`);
    arm.position.set(Math.sin(ang) * 0.19, 0.017, Math.cos(ang) * 0.19);
    arm.rotation.y = -ang;
    g.add(arm);
  }

  // Caster wheels
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2;
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), metalMat);
    w.name = `chair_caster_${id}_${i}`;
    w.position.set(Math.sin(ang) * 0.38, 0.04, Math.cos(ang) * 0.38);
    g.add(w);
  }

  return g;
}

function buildMonitor(id: string, bodyMat: THREE.Material, screenMat: THREE.Material, metalMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  g.name = `monitor_${id}`;

  // Bezel / frame
  const frame = mkBox(0.74, 0.44, 0.032, bodyMat, `monitor_frame_${id}`);
  frame.position.set(0, 1.16, 0);
  g.add(frame);

  // Screen face
  const screen = mkBox(0.70, 0.40, 0.022, screenMat, `monitor_screen_${id}`);
  screen.position.set(0, 1.16, 0.007);
  g.add(screen);

  // Neck
  const neck = mkBox(0.04, 0.18, 0.04, metalMat, `monitor_neck_${id}`);
  neck.position.set(0, 0.88, 0);
  g.add(neck);

  // Base
  const base = mkBox(0.28, 0.022, 0.18, metalMat, `monitor_base_${id}`);
  base.position.set(0, 0.79, 0.02);
  g.add(base);

  return g;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PROCEDURAL OFFICE SCENE
// ═══════════════════════════════════════════════════════════════════════════════

export function buildProceduralOffice(): THREE.Group {
  const office = new THREE.Group();
  office.name = 'ProceduralOffice';

  // ── Materials ────────────────────────────────────────────────────────────────
  const floorMat   = new THREE.MeshStandardMaterial({ color: 0xd4cec4, roughness: 0.88 });
  const wallMat    = new THREE.MeshStandardMaterial({ color: 0xf0ece5, roughness: 0.95 });
  const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xf7f6f3 });
  const deskMat    = new THREE.MeshStandardMaterial({ color: 0xd8be98, roughness: 0.72 }); // light birch
  const darkDeskMat= new THREE.MeshStandardMaterial({ color: 0x8c7258, roughness: 0.68 }); // walnut
  const metalMat   = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.35, metalness: 0.78 });
  const fabricMat  = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.95 }); // charcoal
  const fabricMat2 = new THREE.MeshStandardMaterial({ color: 0x5a6e8a, roughness: 0.95 }); // blue-gray (conf chairs)
  const glassMat   = new THREE.MeshStandardMaterial({ color: 0x9dd4ee, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.08 });
  const screenMat  = new THREE.MeshStandardMaterial({ color: 0x2a50c8, roughness: 0.2, emissive: new THREE.Color(0x1020a0), emissiveIntensity: 0.35 });
  const monBodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1d26, roughness: 0.5 });
  const partMat    = new THREE.MeshStandardMaterial({ color: 0xe2ddd6, roughness: 0.9 });
  const accentMat  = new THREE.MeshStandardMaterial({ color: 0x2d5290, roughness: 0.55 }); // brand blue
  const lightMat   = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(0xfffce0), emissiveIntensity: 0.65 });
  const whiteMat   = new THREE.MeshStandardMaterial({ color: 0xfcfcfa, roughness: 0.88 });
  const potMat     = new THREE.MeshStandardMaterial({ color: 0x8a7862, roughness: 0.85 });
  const plantMat   = new THREE.MeshStandardMaterial({ color: 0x3a7a3a, roughness: 0.92 });
  const cabMat     = new THREE.MeshStandardMaterial({ color: 0xb0b8c4, roughness: 0.45, metalness: 0.55 });

  const W = 18, D = 14, H = 3.1;

  // ── Room shell ───────────────────────────────────────────────────────────────
  const floor = mkBox(W, 0.12, D, floorMat, 'floor');
  floor.position.y = -0.06;
  office.add(floor);

  // Ceiling — "ceiling" keyword → auto-hidden on load
  const ceiling = mkBox(W, 0.1, D, ceilingMat, 'ceiling');
  ceiling.position.y = H + 0.05;
  office.add(ceiling);

  // Walls
  const walls: [number,number,number,number,number,number,string][] = [
    [W, H, 0.14, 0, H/2, -D/2, 'wall_north'],
    [W, H, 0.14, 0, H/2,  D/2, 'wall_south'],
    [0.14, H, D, -W/2, H/2, 0, 'wall_west' ],
    [0.14, H, D,  W/2, H/2, 0, 'wall_east' ],
  ];
  walls.forEach(([bw,bh,bd,bx,by,bz,nm]) => {
    const w = mkBox(bw, bh, bd, wallMat, nm);
    w.position.set(bx, by, bz);
    office.add(w);
  });

  // Baseboards (brand-blue accent strip at floor level)
  const baseboards: [number,number,number,number,number,number][] = [
    [W, 0.09, 0.014, 0,    0.045, -D/2 + 0.08],
    [W, 0.09, 0.014, 0,    0.045,  D/2 - 0.08],
    [0.014, 0.09, D, -W/2 + 0.08, 0.045, 0  ],
    [0.014, 0.09, D,  W/2 - 0.08, 0.045, 0  ],
  ];
  baseboards.forEach(([bw,bh,bd,bx,by,bz], i) => {
    const b = mkBox(bw, bh, bd, accentMat, `baseboard_${i}`);
    b.position.set(bx, by, bz);
    office.add(b);
  });

  // ── Windows (north wall – 4 wide panes) ──────────────────────────────────────
  const winH = 1.9, winW = 2.6, winY = 1.6;
  [-6.5, -2.5, 1.5, 5.5].forEach((wx, i) => {
    // Glass
    const glass = mkBox(winW, winH, 0.05, glassMat, `window_glass_${i}`);
    glass.position.set(wx, winY, -D/2 + 0.06);
    office.add(glass);

    // Sill
    const sill = mkBox(winW + 0.16, 0.055, 0.2, wallMat, `window_sill_${i}`);
    sill.position.set(wx, winY - winH/2 - 0.03, -D/2 + 0.12);
    office.add(sill);

    // Top frame strip + side frames
    const ft = mkBox(winW + 0.06, 0.06, 0.06, metalMat, `win_frame_top_${i}`);
    ft.position.set(wx, winY + winH/2 + 0.03, -D/2 + 0.07);
    office.add(ft);

    ([-1, 1] as number[]).forEach((s, si) => {
      const fv = mkBox(0.055, winH + 0.06, 0.06, metalMat, `win_frame_side_${i}_${si}`);
      fv.position.set(wx + s * (winW/2 + 0.027), winY, -D/2 + 0.07);
      office.add(fv);
    });

    // Divider mullion in centre of each pane
    const div = mkBox(0.04, winH, 0.045, metalMat, `win_mullion_${i}`);
    div.position.set(wx, winY, -D/2 + 0.07);
    office.add(div);
  });

  // ── Ceiling light panels (3 × 3 grid) ────────────────────────────────────────
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const lx = -6 + col * 6;
      const lz = -4.5 + row * 4.5;
      const light = mkBox(0.68, 0.03, 0.24, lightMat, `ceiling_light_${row}_${col}`);
      light.position.set(lx, H - 0.02, lz);
      office.add(light);
    }
  }

  // ── Workstation Row A (back zone, facing north toward windows) ───────────────
  //    5 stations at z = -3.2; chairs pulled back at z = -2.35
  const rowA = [-7.2, -4.2, -1.2, 1.8, 4.8];
  rowA.forEach((x, i) => {
    const desk = buildDesk(`a${i}`, deskMat, metalMat);
    desk.position.set(x, 0, -3.2);
    office.add(desk);

    const mon = buildMonitor(`a${i}`, monBodyMat, screenMat, metalMat);
    mon.position.set(x, 0, -3.2);
    office.add(mon);

    const chair = buildChair(`a${i}`, fabricMat, metalMat);
    chair.position.set(x, 0, -2.35);
    office.add(chair);
  });

  // ── Workstation Row B (mid zone, facing south – back-to-back with row A) ─────
  //    5 stations at z = 0.8; chairs at z = 1.65; desks rotated 180°
  const rowB = [-7.2, -4.2, -1.2, 1.8, 4.8];
  rowB.forEach((x, i) => {
    const desk = buildDesk(`b${i}`, deskMat, metalMat);
    desk.position.set(x, 0, 0.8);
    desk.rotation.y = Math.PI;
    office.add(desk);

    const mon = buildMonitor(`b${i}`, monBodyMat, screenMat, metalMat);
    mon.position.set(x, 0, 0.8);
    mon.rotation.y = Math.PI;
    office.add(mon);

    const chair = buildChair(`b${i}`, fabricMat, metalMat);
    chair.position.set(x, 0, 1.65);
    chair.rotation.y = Math.PI;
    office.add(chair);
  });

  // Low partition between the two desk rows (with brand-colour cap rail)
  const part = mkBox(16, 0.36, 0.07, partMat, 'partition_desk_divider');
  part.position.set(-0.7, 0.18, -1.65);
  office.add(part);

  const partCap = mkBox(16.1, 0.045, 0.11, accentMat, 'partition_cap_rail');
  partCap.position.set(-0.7, 0.38, -1.65);
  office.add(partCap);

  // ── Conference / meeting table (south-east zone) ──────────────────────────────
  const ctX = 6.2, ctZ = 4.6;
  const confTable = mkBox(3.6, 0.07, 1.65, darkDeskMat, 'conference_table');
  confTable.position.set(ctX, 0.78, ctZ);
  office.add(confTable);

  // Trestle-style base (2 vertical slabs)
  ([-1.45, 1.45] as number[]).forEach((dx, i) => {
    const ped = mkBox(0.08, 0.78, 1.54, metalMat, `conf_ped_${i}`);
    ped.position.set(ctX + dx, 0.39, ctZ);
    office.add(ped);
  });

  // 6 chairs – 3 per long side (using blue-gray fabric for variety)
  [
    { dx: -1.25, dz: -1.05, ry: 0 },
    { dx:  0.00, dz: -1.05, ry: 0 },
    { dx:  1.25, dz: -1.05, ry: 0 },
    { dx: -1.25, dz:  1.05, ry: Math.PI },
    { dx:  0.00, dz:  1.05, ry: Math.PI },
    { dx:  1.25, dz:  1.05, ry: Math.PI },
  ].forEach((c, i) => {
    const ch = buildChair(`conf${i}`, fabricMat2, metalMat);
    ch.position.set(ctX + c.dx, 0, ctZ + c.dz);
    ch.rotation.y = c.ry;
    office.add(ch);
  });

  // ── Reception desk — wrap pieces in a named group for desk detection ─────
  const recX = -6.5, recZ = 5.4;
  const recGroup = new THREE.Group();
  recGroup.name = 'desk_reception';
  recGroup.position.set(recX, 0, recZ);

  const recBody = mkBox(2.7, 1.08, 0.62, deskMat, 'reception_desk_body');
  recBody.position.set(0, 0.54, 0);
  recGroup.add(recBody);

  const recFront = mkBox(2.7, 1.08, 0.04, deskMat, 'reception_desk_front');
  recFront.position.set(0, 0.54, 0.31);
  recGroup.add(recFront);

  // Brand accent strip on reception fascia
  const recStrip = mkBox(2.58, 0.11, 0.022, accentMat, 'reception_accent');
  recStrip.position.set(0, 0.72, 0.342);
  recGroup.add(recStrip);

  office.add(recGroup);

  // ── Whiteboard (north wall, west side) ────────────────────────────────────────
  const wbX = -1.8;
  const wb = mkBox(2.7, 1.35, 0.028, whiteMat, 'whiteboard');
  wb.position.set(wbX, 2.2, -D/2 + 0.11);
  office.add(wb);

  const wbFrame = mkBox(2.82, 1.47, 0.022, metalMat, 'whiteboard_frame');
  wbFrame.position.set(wbX, 2.2, -D/2 + 0.09);
  office.add(wbFrame);

  const wbTray = mkBox(2.7, 0.055, 0.09, metalMat, 'whiteboard_tray');
  wbTray.position.set(wbX, 1.54, -D/2 + 0.135);
  office.add(wbTray);

  // ── Filing cabinets (east wall) ───────────────────────────────────────────────
  [4.0, 5.3, 6.6].forEach((cz, i) => {
    const cab = mkBox(0.46, 1.05, 0.58, cabMat, `filing_cabinet_${i}`);
    cab.position.set(W/2 - 0.36, 0.525, cz);
    office.add(cab);

    // Drawer divider lines
    [0.28, 0.63, 0.98].forEach((dy, di) => {
      const line = mkBox(0.44, 0.018, 0.54, accentMat, `cabinet_drawer_${i}_${di}`);
      line.position.set(W/2 - 0.36, dy, cz);
      office.add(line);
    });

    // Drawer pull
    [0.14, 0.48, 0.82].forEach((dy, di) => {
      const pull = mkBox(0.1, 0.02, 0.015, metalMat, `cabinet_pull_${i}_${di}`);
      pull.position.set(W/2 - 0.36, dy, cz + 0.28);
      office.add(pull);
    });
  });

  // ── Potted plants (corners + by reception) ────────────────────────────────────
  ([
    [-8.2,  5.8],
    [ 7.8,  5.8],
    [-8.2, -5.4],
  ] as [number,number][]).forEach(([px, pz], i) => {
    const pot = mkCyl(0.22, 0.17, 0.38, 14, potMat, `plant_pot_${i}`);
    pot.position.set(px, 0.19, pz);
    office.add(pot);

    const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), plantMat);
    foliage.name = `plant_foliage_${i}`;
    foliage.scale.set(1, 1.45, 1);
    foliage.position.set(px, 0.82, pz);
    office.add(foliage);

    // Stem
    const stem = mkCyl(0.025, 0.025, 0.28, 6, plantMat, `plant_stem_${i}`);
    stem.position.set(px, 0.52, pz);
    office.add(stem);
  });

  // ── Ceiling HVAC/sprinkler details ────────────────────────────────────────────
  [[-5, -4.5], [0, -4.5], [5, -4.5], [-5, 0], [0, 0], [5, 0]].forEach(([vx, vz], i) => {
    const vent = mkBox(0.3, 0.025, 0.3, metalMat, `vent_${i}`);
    vent.position.set(vx, H - 0.012, vz);
    office.add(vent);
  });

  return office;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MODEL REGISTRATION — hides ceiling, builds selectable hover groups
//  Works for both the procedural office and loaded GLTFs.
// ═══════════════════════════════════════════════════════════════════════════════
function registerModelForInteraction(customLayer: any, model: THREE.Group) {
  // 1. Hide ceiling / roof
  const hidden: string[] = [];
  model.traverse((child) => {
    const n = child.name.toLowerCase();
    if (ROOF_KEYWORDS.some(kw => n.includes(kw))) {
      child.visible = false;
      hidden.push(child.name);
    }
  });
  if (hidden.length) console.log(`🏚️  Hidden ${hidden.length} ceiling/roof object(s):`, hidden);

  // 2. Helper — find root groups for a given keyword set + kind label
  function detectRoots(keywords: string[], kind: 'chair' | 'desk' | 'monitor'): SelectableGroup[] {
    const roots = new Set<THREE.Object3D>();
    model.traverse((child) => {
      const n = child.name.toLowerCase();
      if (!keywords.some(kw => n.includes(kw))) return;
      let root: THREE.Object3D = child;
      let node: THREE.Object3D | null = child.parent;
      while (node && node !== model) {
        if (keywords.some(kw => node!.name.toLowerCase().includes(kw))) root = node;
        node = node.parent;
      }
      roots.add(root);
    });

    const groups: SelectableGroup[] = [];
    roots.forEach((root) => {
      const meshes: THREE.Mesh[] = [];
      root.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        // Clone material so emissive changes stay isolated
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => {
            const c = (m as THREE.Material).clone() as THREE.MeshStandardMaterial;
            c.emissive = new THREE.Color(0x000000);
            c.emissiveIntensity = 0;
            return c;
          });
        } else {
          const c = (mesh.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
          c.emissive = new THREE.Color(0x000000);
          c.emissiveIntensity = 0;
          mesh.material = c;
        }
        meshes.push(mesh);
      });
      groups.push({ root, meshes, id: 0, name: root.name, kind });
    });
    return groups;
  }

  // 3. Detect both chairs and desks
  const chairGroups   = detectRoots(CHAIR_KEYWORDS,   'chair');
  const deskGroups    = detectRoots(DESK_KEYWORDS,    'desk');
  const monitorGroups = detectRoots(MONITOR_KEYWORDS, 'monitor');
  const allGroups     = [...chairGroups, ...deskGroups, ...monitorGroups];

  // Assign stable IDs
  allGroups.forEach((g, i) => { g.id = i; });

  const allSelectableMeshes: THREE.Mesh[] = [];
  const meshToGroup = new Map<THREE.Mesh, SelectableGroup>();
  allGroups.forEach((group) => {
    group.meshes.forEach((m) => {
      allSelectableMeshes.push(m);
      meshToGroup.set(m, group);
    });
  });

  customLayer.chairGroups    = allGroups;         // legacy name kept
  customLayer.allChairMeshes = allSelectableMeshes; // legacy name kept
  customLayer.meshToGroup    = meshToGroup;
  customLayer.hoveredGroup   = null;

  console.log(`✅ ${chairGroups.length} chair(s), ${deskGroups.length} desk(s), ${monitorGroups.length} monitor(s) — ${allSelectableMeshes.length} selectable mesh(es)`);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  createBuilding3DLayer
// ═══════════════════════════════════════════════════════════════════════════════
export function createBuilding3DLayer() {
  const originMerc = mapboxgl.MercatorCoordinate.fromLngLat(
    [MODEL_LNG, MODEL_LAT], MODEL_ALTITUDE
  );
  const metersToMercator = originMerc.meterInMercatorCoordinateUnits();

  const mt = {
    tx: originMerc.x,
    ty: originMerc.y,
    tz: originMerc.z ?? 0,
    s:  metersToMercator,
  };

  const layer: mapboxgl.CustomLayerInterface & {
    camera?:              THREE.Camera;
    scene?:               THREE.Scene;
    renderer?:            THREE.WebGLRenderer;
    map?:                 mapboxgl.Map;
    chairGroups?:         SelectableGroup[];
    hoveredGroup?:        SelectableGroup | null;
    selectedGroup?:       SelectableGroup | null;
    allChairMeshes?:      THREE.Mesh[];
    meshToGroup?:         Map<THREE.Mesh, SelectableGroup>;
    loadedModel?:         THREE.Group;
    setSelectMode?:       (mode: string) => void;
    hoverEnabled?:        boolean;
    // ── Measurement state ──────────────────────────────────────────────────────
    allSceneMeshes?:      THREE.Mesh[];
    measureActive?:       boolean;
    measureLines?:        MeasurementLine[];
    measureIdCounter?:    number;
    measurePendingPoint?: THREE.Vector3 | null;
    measurePendingMarker?:THREE.Mesh | null;
    // ── Snap-to-surface state ──────────────────────────────────────────────────
    snapPreviewGroup?:    THREE.Group;
    snapPreviewLine?:     THREE.Mesh;
    snapPreviewPoint?:    THREE.Vector3 | null;
    // ── Georeference state ────────────────────────────────────────────────────
    georefActive?:          boolean;
    committedRotation?:     number;
    committedOpacity?:      number;
    committedTx?:           number;
    committedTy?:           number;
    pendingRotation?:       number;
    pendingOpacity?:        number;
    materialOpacityMap?:    Map<THREE.Material, { transparent: boolean; opacity: number }>;
    georefBBoxHelper?:      THREE.Object3D;
    georefHandle?:          THREE.Mesh;
    georefHandlePost?:      THREE.Mesh;
    georefTranslateHitBox?: THREE.Mesh;
    georefDragging?:        boolean;
    georefDragMode?:        'rotate' | 'translate' | 'none';
    georefDragStartX?:      number;
    georefDragStartY?:      number;
    georefDragStartRot?:    number;
    georefStartTx?:         number;
    georefStartTy?:         number;
  } = {
    id: '3d-model',
    type: 'custom',
    renderingMode: '3d',

    onAdd(map, gl) {
      console.log('🏗️  3D layer: onAdd');
      this.map = map;

      this.camera   = new THREE.Camera();
      this.scene    = new THREE.Scene();
      this.renderer = new THREE.WebGLRenderer({
        canvas:    map.getCanvas(),
        context:   gl,
        antialias: true,
      });
      this.renderer.autoClear = false;

      // Lighting — bright ambient + two directional fills
      this.scene.add(new THREE.AmbientLight(0xffffff, 2.2));
      const d1 = new THREE.DirectionalLight(0xffffff, 2.0);
      d1.position.set(0, -70, 100).normalize();
      this.scene.add(d1);
      const d2 = new THREE.DirectionalLight(0xffffff, 1.0);
      d2.position.set(100, 50, -50).normalize();
      this.scene.add(d2);

      // Build and register procedural office
      const office = buildProceduralOffice();
      this.scene.add(office);
      this.loadedModel = office;
      registerModelForInteraction(this, office);

      // Collect ALL visible scene meshes for measurement raycasting (static snapshot)
      this.allSceneMeshes = [];
      office.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && child.visible) this.allSceneMeshes!.push(mesh);
      });

      // Measurement state
      this.measureLines      = [];
      this.measureIdCounter  = 0;
      this.measureActive     = false;
      this.measurePendingPoint  = null;
      this.measurePendingMarker = null;

      // ── Snap-to-surface preview objects ──────────────────────────────────────
      const snapGroup = new THREE.Group();

      // Inner solid dot
      const snapDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 14, 14),
        new THREE.MeshBasicMaterial({ color: 0xf97316, depthTest: false }),
      );
      snapDot.renderOrder = 1001;
      snapGroup.add(snapDot);

      // Outer glow sphere
      const snapGlow = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 14, 14),
        new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.18, depthTest: false }),
      );
      snapGlow.renderOrder = 1000;
      snapGroup.add(snapGlow);

      snapGroup.visible = false;
      this.scene.add(snapGroup);
      this.snapPreviewGroup = snapGroup;
      this.snapPreviewPoint = null;

      // ── Georeference state ─────────────────────────────────────────────────
      this.georefActive      = false;
      this.committedRotation = 0;
      this.committedOpacity  = 1;
      this.committedTx       = mt.tx;
      this.committedTy       = mt.ty;
      this.pendingRotation   = 0;
      this.pendingOpacity    = 1;
      this.georefDragging    = false;
      this.georefDragMode    = 'none';

      // Hover is off until the select tool is activated
      this.hoverEnabled = false;

      // Stub for select-mode integration
      this.setSelectMode = (_mode: string) => {};

      console.log('✅ Procedural office scene ready');
    },

    render(_gl, matrix) {
      if (!this.camera || !this.renderer || !this.scene) return;

      const rotX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0), Math.PI / 2
      );
      const l = new THREE.Matrix4()
        .makeTranslation(mt.tx, mt.ty, mt.tz)
        .scale(new THREE.Vector3(mt.s, -mt.s, mt.s))
        .multiply(rotX);

      this.camera.projectionMatrix = new THREE.Matrix4()
        .fromArray(matrix)
        .multiply(l);

      this.renderer.resetState();
      this.renderer.render(this.scene, this.camera);

      // ── Project measurement midpoints → DOM label positions ─────────────────
      if (labelPositionCb && this.measureLines?.length && this.camera) {
        const canvas = this.renderer.domElement;
        const cw = canvas.clientWidth  || canvas.width;
        const ch = canvas.clientHeight || canvas.height;
        const out: { id: number; x: number; y: number }[] = [];
        for (const m of this.measureLines) {
          const mid = m.points[0].clone().add(m.points[1]).multiplyScalar(0.5);
          const p = mid.clone().project(this.camera);
          if (p.z > 1 || p.z < -1) continue; // clipped
          out.push({ id: m.id, x: (p.x + 1) / 2 * cw, y: (1 - p.y) / 2 * ch });
        }
        if (out.length) labelPositionCb(out);
      }
    },
  };

  // ── Shared raycast helper ─────────────────────────────────────────────────
  function buildRay(map: mapboxgl.Map, event: MouseEvent) {
    const canvas = map.getCanvas();
    const rect   = canvas.getBoundingClientRect();
    const mx = ((event.clientX - rect.left) / rect.width)  *  2 - 1;
    const my = ((event.clientY - rect.top)  / rect.height) * -2 + 1;
    _invProj.copy(layer.camera!.projectionMatrix).invert();
    _nearVec.set(mx, my, -1, 1).applyMatrix4(_invProj); _nearVec.divideScalar(_nearVec.w);
    _farVec.set(mx, my,  1, 1).applyMatrix4(_invProj);  _farVec.divideScalar(_farVec.w);
    _rayOrigin.set(_nearVec.x, _nearVec.y, _nearVec.z);
    _rayDir.set(_farVec.x - _nearVec.x, _farVec.y - _nearVec.y, _farVec.z - _nearVec.z).normalize();
    _raycaster.ray.set(_rayOrigin, _rayDir);
  }

  // ── Ray from raw client coords (no MouseEvent needed) ────────────────────
  function buildRayFromCoords(clientX: number, clientY: number) {
    if (!layer.map || !layer.camera) return;
    const canvas = layer.map.getCanvas();
    const rect   = canvas.getBoundingClientRect();
    const mx = ((clientX - rect.left) / rect.width)  *  2 - 1;
    const my = ((clientY - rect.top)  / rect.height) * -2 + 1;
    _invProj.copy(layer.camera.projectionMatrix).invert();
    _nearVec.set(mx, my, -1, 1).applyMatrix4(_invProj); _nearVec.divideScalar(_nearVec.w);
    _farVec.set(mx, my,  1, 1).applyMatrix4(_invProj);  _farVec.divideScalar(_farVec.w);
    _rayOrigin.set(_nearVec.x, _nearVec.y, _nearVec.z);
    _rayDir.set(_farVec.x - _nearVec.x, _farVec.y - _nearVec.y, _farVec.z - _nearVec.z).normalize();
    _raycaster.ray.set(_rayOrigin, _rayDir);
  }

  // ── Snap preview line helper (rebuild each frame on mousemove) ────────────
  function updateSnapPreviewLine(p1: THREE.Vector3 | null, p2: THREE.Vector3 | null) {
    // Remove old preview line
    if (layer.snapPreviewLine) {
      layer.scene?.remove(layer.snapPreviewLine);
      (layer.snapPreviewLine.geometry as THREE.BufferGeometry).dispose();
      layer.snapPreviewLine = undefined;
    }
    if (!p1 || !p2 || p1.distanceTo(p2) < 0.01) return;

    const line = createTubeLine(p1, p2, 0.018);
    const mat = line.material as THREE.MeshBasicMaterial;
    mat.transparent = true;
    mat.opacity = 0.42;
    line.renderOrder = 997;
    layer.snapPreviewLine = line;
    layer.scene?.add(line);
  }

  // ── Georeference helpers ───────────────────────────────────────────────────
  function snapshotOpacities() {
    const map = new Map<THREE.Material, { transparent: boolean; opacity: number }>();
    layer.loadedModel?.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.material) return;          // skip non-material objects (Groups etc.)
      const mats: THREE.Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        const m = mat as THREE.MeshStandardMaterial;
        if (m && !map.has(m)) map.set(m, { transparent: m.transparent, opacity: m.opacity ?? 1 });
      }
    });
    layer.materialOpacityMap = map;
  }

  function applyModelOpacity(opacity: number) {
    if (!layer.loadedModel) return;
    // Lazily build snapshot if something went wrong during setGeorefActive
    if (!layer.materialOpacityMap || layer.materialOpacityMap.size === 0) snapshotOpacities();

    layer.loadedModel.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.material) return;
      const mats: THREE.Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        const m = mat as THREE.MeshStandardMaterial;
        if (!m) continue;
        const original = layer.materialOpacityMap?.get(m);
        const baseOpacity = original !== undefined ? original.opacity : 1.0;
        m.opacity     = baseOpacity * opacity;
        m.transparent = m.opacity < 1.0;
        m.needsUpdate = true;
      }
    });
  }

  function restoreOpacities() {
    layer.materialOpacityMap?.forEach((original, mat) => {
      const m = mat as THREE.MeshStandardMaterial;
      m.transparent = original.transparent;
      m.opacity     = original.opacity;
      m.needsUpdate = true;
    });
  }

  function applyModelRotation(angle: number) {
    if (!layer.loadedModel) return;
    layer.loadedModel.rotation.y = angle;
  }

  function showGeorefGizmo() {
    if (!layer.loadedModel || !layer.scene) return;

    // Compute local bbox at rotation = 0 (model-local space)
    const savedRot = layer.loadedModel.rotation.y;
    layer.loadedModel.rotation.y = 0;
    layer.loadedModel.updateMatrixWorld(true);
    const rawBox = new THREE.Box3().setFromObject(layer.loadedModel);
    layer.loadedModel.rotation.y = savedRot;
    layer.loadedModel.updateMatrixWorld(true);

    // Force SQUARE footprint (max of width / depth)
    const rawSize   = rawBox.getSize(new THREE.Vector3());
    const center    = rawBox.getCenter(new THREE.Vector3());
    const halfSide  = Math.max(rawSize.x, rawSize.z) / 2;
    const squareBox = new THREE.Box3(
      new THREE.Vector3(center.x - halfSide, rawBox.min.y, center.z - halfSide),
      new THREE.Vector3(center.x + halfSide, rawBox.max.y, center.z + halfSide),
    );

    // ── Thick-tube wireframe bbox (12 cylinder segments, same radius as measure lines) ──
    const bboxGroup = new THREE.Group();
    const { min, max } = squareBox;
    const corners = [
      new THREE.Vector3(min.x, min.y, min.z), // 0
      new THREE.Vector3(max.x, min.y, min.z), // 1
      new THREE.Vector3(max.x, min.y, max.z), // 2
      new THREE.Vector3(min.x, min.y, max.z), // 3
      new THREE.Vector3(min.x, max.y, min.z), // 4
      new THREE.Vector3(max.x, max.y, min.z), // 5
      new THREE.Vector3(max.x, max.y, max.z), // 6
      new THREE.Vector3(min.x, max.y, max.z), // 7
    ];
    const edges: [number, number][] = [
      [0,1],[1,2],[2,3],[3,0], // bottom face
      [4,5],[5,6],[6,7],[7,4], // top face
      [0,4],[1,5],[2,6],[3,7], // vertical pillars
    ];
    const BBOX_R  = 0.03; // matches createTubeLine default radius
    const tubeMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, depthTest: false });
    for (const [ai, bi] of edges) {
      const p1  = corners[ai];
      const p2  = corners[bi];
      const dir = new THREE.Vector3().subVectors(p2, p1);
      const len = dir.length();
      const ctr = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(BBOX_R, BBOX_R, len, 8, 1), tubeMat);
      seg.position.copy(ctr);
      seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      seg.renderOrder = 100;
      bboxGroup.add(seg);
    }
    layer.loadedModel.add(bboxGroup);
    layer.georefBBoxHelper = bboxGroup;

    // ── Transparent hit-box for translation detection ─────────────────────────
    const hitMat = new THREE.MeshBasicMaterial({
      transparent: true, opacity: 0.001, side: THREE.DoubleSide, depthWrite: false,
    });
    const hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(halfSide * 2, rawSize.y + 0.3, halfSide * 2),
      hitMat,
    );
    hitBox.position.copy(center);
    hitBox.renderOrder = 99;
    layer.loadedModel.add(hitBox);
    layer.georefTranslateHitBox = hitBox;

    // ── Rotation handle (post + sphere above top-centre of box) ───────────────
    const postH    = 1.2;
    const topY     = squareBox.max.y;
    const handleY  = topY + postH + 0.28; // centre of sphere

    // Post
    const postMat  = new THREE.MeshBasicMaterial({ color: 0x3b82f6, depthTest: false });
    const post     = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, postH, 8), postMat);
    post.position.set(center.x, topY + postH / 2, center.z);
    post.renderOrder = 103;
    layer.loadedModel.add(post);
    layer.georefHandlePost = post;

    // Handle sphere
    const handleMat  = new THREE.MeshBasicMaterial({ color: 0x3b82f6, depthTest: false });
    const handle     = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 20), handleMat);
    handle.position.set(center.x, handleY, center.z);
    handle.renderOrder = 105;
    layer.loadedModel.add(handle);
    layer.georefHandle = handle;

    // Rotation arc ring around handle (suggests rotate action)
    const arcMat = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: 0.9 });
    const arc    = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.05, 8, 48, Math.PI * 1.55), arcMat);
    arc.position.set(center.x, handleY, center.z);
    arc.rotation.x = Math.PI / 2; // lie flat (horizontal rotation indicator)
    arc.renderOrder = 106;
    layer.loadedModel.add(arc);
    handle.userData.arc = arc; // keep ref for cleanup

    // Small arrowhead at the open end of the arc
    const arrowMat  = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false });
    const arrow     = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 6), arrowMat);
    const arcEndAngle = Math.PI * 1.55;
    arrow.position.set(
      center.x + Math.cos(-arcEndAngle) * 0.46,
      handleY,
      center.z + Math.sin(-arcEndAngle) * 0.46,
    );
    arrow.rotation.x = Math.PI / 2;
    arrow.rotation.z = -arcEndAngle + Math.PI / 2;
    arrow.renderOrder = 107;
    layer.loadedModel.add(arrow);
    handle.userData.arrow = arrow;

    layer.map?.triggerRepaint();
  }

  function hideGeorefGizmo() {
    if (layer.georefBBoxHelper) {
      layer.loadedModel?.remove(layer.georefBBoxHelper);
      layer.georefBBoxHelper = undefined;
    }
    if (layer.georefTranslateHitBox) {
      layer.loadedModel?.remove(layer.georefTranslateHitBox);
      layer.georefTranslateHitBox = undefined;
    }
    if (layer.georefHandlePost) {
      layer.loadedModel?.remove(layer.georefHandlePost);
      layer.georefHandlePost = undefined;
    }
    if (layer.georefHandle) {
      const arc   = layer.georefHandle.userData.arc   as THREE.Mesh | undefined;
      const arrow = layer.georefHandle.userData.arrow as THREE.Mesh | undefined;
      if (arc)   layer.loadedModel?.remove(arc);
      if (arrow) layer.loadedModel?.remove(arrow);
      layer.loadedModel?.remove(layer.georefHandle);
      layer.georefHandle = undefined;
    }
  }

  function setGeorefActive(active: boolean) {
    if (layer.georefActive === active) return;
    layer.georefActive = active;
    if (active) {
      snapshotOpacities();
      layer.pendingRotation = layer.committedRotation ?? 0;
      layer.pendingOpacity  = layer.committedOpacity  ?? 1;
      applyModelRotation(layer.pendingRotation);
      applyModelOpacity(layer.pendingOpacity);
      showGeorefGizmo();
    } else {
      hideGeorefGizmo();
      layer.georefDragging = false;
      layer.georefDragMode = 'none';
      if (layer.map) layer.map.getCanvas().style.cursor = '';
    }
    layer.map?.triggerRepaint();
  }

  function setModelOpacity(opacity: number) {
    layer.pendingOpacity = opacity;
    applyModelOpacity(opacity);
    layer.map?.triggerRepaint();
  }

  function saveGeoref() {
    layer.committedRotation = layer.pendingRotation ?? 0;
    layer.committedOpacity  = layer.pendingOpacity  ?? 1;
    layer.committedTx       = mt.tx;
    layer.committedTy       = mt.ty;
    setGeorefActive(false);
  }

  function cancelGeoref() {
    applyModelRotation(layer.committedRotation ?? 0);
    restoreOpacities();
    if (layer.committedTx !== undefined) mt.tx = layer.committedTx;
    if (layer.committedTy !== undefined) mt.ty = layer.committedTy;
    layer.map?.triggerRepaint();
    setGeorefActive(false);
  }

  // Returns true if a drag was initiated on the handle or bbox (so App.tsx can preventDefault)
  function startGeorefDrag(clientX: number, clientY: number): boolean {
    if (!layer.camera || !layer.map) return false;
    buildRayFromCoords(clientX, clientY);

    // 1. Check rotation handle first
    if (layer.georefHandle) {
      const hh = _raycaster.intersectObject(layer.georefHandle, false);
      if (hh.length > 0) {
        layer.georefDragging     = true;
        layer.georefDragMode     = 'rotate';
        layer.georefDragStartX   = clientX;
        layer.georefDragStartRot = layer.pendingRotation ?? 0;
        return true;
      }
    }

    // 2. Check translation box
    if (layer.georefTranslateHitBox) {
      const bh = _raycaster.intersectObject(layer.georefTranslateHitBox, false);
      if (bh.length > 0) {
        layer.georefDragging   = true;
        layer.georefDragMode   = 'translate';
        layer.georefDragStartX = clientX;
        layer.georefDragStartY = clientY;
        layer.georefStartTx    = mt.tx;
        layer.georefStartTy    = mt.ty;
        return true;
      }
    }

    return false;
  }

  function updateGeorefDrag(clientX: number, clientY: number) {
    if (!layer.georefDragging || !layer.map) return;

    if (layer.georefDragMode === 'rotate') {
      const dx    = clientX - (layer.georefDragStartX ?? 0);
      const angle = (layer.georefDragStartRot ?? 0) + (dx / 500) * (2 * Math.PI);
      layer.pendingRotation = angle;
      applyModelRotation(angle);

    } else if (layer.georefDragMode === 'translate') {
      const canvas = layer.map.getCanvas();
      const rect   = canvas.getBoundingClientRect();
      const startPt: [number, number] = [
        (layer.georefDragStartX ?? 0) - rect.left,
        (layer.georefDragStartY ?? 0) - rect.top,
      ];
      const currPt: [number, number] = [clientX - rect.left, clientY - rect.top];
      const startLL  = layer.map.unproject(startPt);
      const currLL   = layer.map.unproject(currPt);
      const startM   = mapboxgl.MercatorCoordinate.fromLngLat(startLL);
      const currM    = mapboxgl.MercatorCoordinate.fromLngLat(currLL);
      mt.tx = (layer.georefStartTx ?? mt.tx) + (currM.x - startM.x);
      mt.ty = (layer.georefStartTy ?? mt.ty) + (currM.y - startM.y);
    }

    layer.map.triggerRepaint();
  }

  function endGeorefDrag() {
    layer.georefDragging = false;
    layer.georefDragMode = 'none';
  }

  // ── Mouse hover handler ──────────────────────────────────────────────────────
  function handleMouseMove(map: mapboxgl.Map, event: MouseEvent) {
    if (!layer.camera) return;
    const canvas = map.getCanvas();

    // ── Georeference hover: cursor + handle highlight ─────────────────────────
    if (layer.georefActive) {
      buildRay(map, event);

      // Test handle
      const overHandle = layer.georefHandle
        ? _raycaster.intersectObject(layer.georefHandle, false).length > 0
        : false;

      // Update handle colour for hover feedback
      if (layer.georefHandle) {
        const col = overHandle ? 0x93c5fd : 0x3b82f6;
        (layer.georefHandle.material as THREE.MeshBasicMaterial).color.setHex(col);
        if (layer.georefHandlePost)
          (layer.georefHandlePost.material as THREE.MeshBasicMaterial).color.setHex(col);
        if (overHandle !== !!(layer as any)._prevOverHandle) map.triggerRepaint();
        (layer as any)._prevOverHandle = overHandle;
      }

      if (overHandle) {
        canvas.style.cursor = 'grab';
        return;
      }

      // Test translate box
      const overBox = layer.georefTranslateHitBox
        ? _raycaster.intersectObject(layer.georefTranslateHitBox, false).length > 0
        : false;
      canvas.style.cursor = overBox ? 'move' : '';
      return;
    }

    // ── Snap-to-surface (measure mode) — runs before everything else ──────────
    if (layer.measureActive && layer.allSceneMeshes?.length) {
      buildRay(map, event);
      const hits = _raycaster.intersectObjects(layer.allSceneMeshes, false);
      if (hits.length) {
        const snapPt = hits[0].point;
        layer.snapPreviewPoint = snapPt;
        if (layer.snapPreviewGroup) {
          layer.snapPreviewGroup.position.copy(snapPt);
          layer.snapPreviewGroup.visible = true;
        }
        // Live preview line from first placed point → cursor
        updateSnapPreviewLine(layer.measurePendingPoint ?? null, snapPt);
        canvas.style.cursor = 'crosshair';
      } else {
        layer.snapPreviewPoint = null;
        if (layer.snapPreviewGroup) layer.snapPreviewGroup.visible = false;
        updateSnapPreviewLine(null, null);
        canvas.style.cursor = 'crosshair';
      }
      map.triggerRepaint();
      return; // don't process furniture hover in measure mode
    }

    // ── Furniture hover (select mode) ─────────────────────────────────────────
    if (!layer.allChairMeshes?.length || !layer.hoverEnabled) return;

    buildRay(map, event);
    const hits     = _raycaster.intersectObjects(layer.allChairMeshes, false);
    const hitMesh  = hits.length ? (hits[0].object as THREE.Mesh) : null;
    const hitGroup = hitMesh ? (layer.meshToGroup?.get(hitMesh) ?? null) : null;

    // Don't apply hover styling to the already-selected group
    const hoverTarget = hitGroup === layer.selectedGroup ? null : hitGroup;

    if (hoverTarget === layer.hoveredGroup) {
      canvas.style.cursor = hitGroup ? 'pointer' : (layer.measureActive ? 'crosshair' : '');
      return;
    }

    if (layer.hoveredGroup && layer.hoveredGroup !== layer.selectedGroup) {
      setGroupEmissive(layer.hoveredGroup.meshes, 0x000000, 0);
    }
    if (hoverTarget) setGroupEmissive(hoverTarget.meshes, HOVER_COLOR, HOVER_INTENSITY);

    canvas.style.cursor = hitGroup ? 'pointer' : (layer.measureActive ? 'crosshair' : '');
    layer.hoveredGroup = hoverTarget;
    map.triggerRepaint();
  }

  // ── Thick-line (cylinder tube) helper ────────────────────────────────────────
  function createTubeLine(p1: THREE.Vector3, p2: THREE.Vector3, radius = 0.03): THREE.Mesh {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    if (len < 0.001) len === 0; // guard zero-length
    const center = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const geo = new THREE.CylinderGeometry(radius, radius, len || 0.001, 8, 1);
    const mat = new THREE.MeshBasicMaterial({ color: 0xf97316, depthTest: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(center);
    // Align default Y-up cylinder along the line direction
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize().lengthSq() > 0 ? dir.clone().normalize() : new THREE.Vector3(0, 1, 0)
    );
    mesh.renderOrder = 998;
    return mesh;
  }

  // ── Measurement point handler (internal) ─────────────────────────────────────
  function placeMeasurePoint(hitPoint: THREE.Vector3) {
    if (!layer.scene) return;

    const dotGeo = new THREE.SphereGeometry(0.07, 10, 10);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xf97316, depthTest: false });

    if (!layer.measurePendingPoint) {
      // ── First click: drop a pending marker ──────────────────────────���───────
      layer.measurePendingPoint = hitPoint.clone();
      const marker = new THREE.Mesh(dotGeo, dotMat);
      marker.position.copy(hitPoint);
      marker.renderOrder = 999;
      layer.scene.add(marker);
      layer.measurePendingMarker = marker;
      // Clear any stale preview line (start fresh)
      updateSnapPreviewLine(null, null);
    } else {
      // ── Second click: complete the measurement ───────────────────────────────
      const p1 = layer.measurePendingPoint;
      const p2 = hitPoint.clone();

      // Remove the live preview line — the permanent tube replaces it
      updateSnapPreviewLine(null, null);

      // Thick tube line
      const tube = createTubeLine(p1, p2);
      layer.scene.add(tube);

      // Second endpoint marker
      const m2 = new THREE.Mesh(dotGeo.clone(), dotMat.clone());
      m2.position.copy(p2);
      m2.renderOrder = 999;
      layer.scene.add(m2);

      const id = ++(layer.measureIdCounter!);
      const distanceM = p1.distanceTo(p2);

      layer.measureLines!.push({
        id, tube,
        markers: [layer.measurePendingMarker!, m2],
        points:  [p1, p2],
        distanceM,
      });

      // Reset pending state
      layer.measurePendingPoint  = null;
      layer.measurePendingMarker = null;

      onMeasurementAddedCb?.(id, distanceM);
      layer.map?.triggerRepaint();
    }
  }

  // ── Mouse click handler ─────────────────────────────────────────────────────
  function handleClick(map: mapboxgl.Map, event: MouseEvent) {
    if (!layer.camera) return;

    // ── Measure mode ──────────────────────────────────────────────────────────
    if (layer.measureActive && layer.allSceneMeshes?.length) {
      // Use the pre-computed snap point from mousemove for accuracy & consistency
      const pt = layer.snapPreviewPoint;
      if (pt) {
        placeMeasurePoint(pt.clone());
      } else {
        // Fallback: raycast directly on click (e.g. if mouse didn't move first)
        buildRay(map, event);
        const hits = _raycaster.intersectObjects(layer.allSceneMeshes, false);
        if (hits.length) placeMeasurePoint(hits[0].point);
      }
      return;
    }

    // ── Select mode ──────────────────────────────────────────────────────────
    if (!layer.hoverEnabled || !layer.allChairMeshes?.length) return;

    buildRay(map, event);
    const hits     = _raycaster.intersectObjects(layer.allChairMeshes, false);
    const hitMesh  = hits.length ? (hits[0].object as THREE.Mesh) : null;
    const hitGroup = hitMesh ? (layer.meshToGroup?.get(hitMesh) ?? null) : null;

    if (layer.selectedGroup && layer.selectedGroup !== hitGroup) {
      setGroupEmissive(layer.selectedGroup.meshes, 0x000000, 0);
    }
    if (hitGroup) {
      if (layer.hoveredGroup === hitGroup) layer.hoveredGroup = null;
      layer.selectedGroup = hitGroup;
      setGroupEmissive(hitGroup.meshes, SELECT_COLOR, SELECT_INTENSITY);
      onChairSelectedCb?.(hitGroup.name, hitGroup.kind);
    } else {
      layer.selectedGroup = null;
      onChairSelectedCb?.(null);
    }
    map.triggerRepaint();
  }

  function deselectChair() {
    if (layer.selectedGroup) {
      setGroupEmissive(layer.selectedGroup.meshes, 0x000000, 0);
      layer.selectedGroup = null;
      layer.hoveredGroup  = null;
      if (layer.map) {
        const cv = layer.map.getCanvas();
        if (cv) cv.style.cursor = '';
        layer.map.triggerRepaint();
      }
    }
    onChairSelectedCb?.(null);
  }

  function highlightAllOfKind(kind: string): number {
    // Clear any single selection first
    if (layer.selectedGroup) {
      setGroupEmissive(layer.selectedGroup.meshes, 0x000000, 0);
      layer.selectedGroup = null;
    }
    if (layer.hoveredGroup) {
      layer.hoveredGroup = null;
    }
    // Light up every group of the requested kind
    const matching = layer.chairGroups?.filter(g => g.kind === kind) ?? [];
    matching.forEach(group => {
      setGroupEmissive(group.meshes, SELECT_COLOR, SELECT_INTENSITY);
    });
    layer.map?.triggerRepaint();
    return matching.length;
  }

  function clearAllHighlights() {
    layer.chairGroups?.forEach(group => {
      setGroupEmissive(group.meshes, 0x000000, 0);
    });
    layer.selectedGroup = null;
    layer.hoveredGroup  = null;
    if (layer.map) {
      const cv = layer.map.getCanvas();
      if (cv) cv.style.cursor = '';
      layer.map.triggerRepaint();
    }
  }

  // ── Boundary selection ────────────────────────────────────────────────────────
  function getGroupsInScreenRect(
    x1: number, y1: number, x2: number, y2: number
  ): Array<{ id: number; kind: string; name: string }> {
    if (!layer.camera || !layer.chairGroups?.length || !layer.renderer) return [];

    const canvas = layer.renderer.domElement;
    const cw = canvas.clientWidth  || canvas.width;
    const ch = canvas.clientHeight || canvas.height;
    if (!cw || !ch) return [];

    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    if (maxX - minX < 4 || maxY - minY < 4) return [];

    const proj  = layer.camera.projectionMatrix;
    const found: Array<{ id: number; kind: string; name: string }> = [];
    const wp    = new THREE.Vector3();

    for (const group of layer.chairGroups) {
      group.root.getWorldPosition(wp);
      const p = wp.clone().applyMatrix4(proj);
      const sx = (p.x + 1) / 2 * cw;
      const sy = (1 - p.y) / 2 * ch;
      if (sx >= minX && sx <= maxX && sy >= minY && sy <= maxY) {
        found.push({ id: group.id, kind: group.kind, name: group.name });
      }
    }
    return found;
  }

  function highlightBoundarySelection(ids: number[]) {
    if (layer.selectedGroup) {
      setGroupEmissive(layer.selectedGroup.meshes, 0x000000, 0);
      layer.selectedGroup = null;
    }
    if (layer.hoveredGroup) { layer.hoveredGroup = null; }
    const idSet = new Set(ids);
    layer.chairGroups?.forEach(group => {
      if (idSet.has(group.id)) {
        setGroupEmissive(group.meshes, SELECT_COLOR, SELECT_INTENSITY);
      } else {
        setGroupEmissive(group.meshes, 0x000000, 0);
      }
    });
    layer.map?.triggerRepaint();
  }

  // ── Measure controls ─────────────────────────────────────────────────────────
  function setMeasureActive(active: boolean) {
    layer.measureActive = active;
    if (layer.map) {
      const cv = layer.map.getCanvas();
      if (cv) cv.style.cursor = active ? 'crosshair' : '';
    }
    if (!active) {
      // Discard dangling first-point marker
      if (layer.measurePendingMarker) layer.scene?.remove(layer.measurePendingMarker);
      layer.measurePendingPoint  = null;
      layer.measurePendingMarker = null;
      // Clean up snap preview
      if (layer.snapPreviewGroup) layer.snapPreviewGroup.visible = false;
      updateSnapPreviewLine(null, null);
      layer.snapPreviewPoint = null;
      layer.map?.triggerRepaint();
    }
  }

  function deleteMeasurement(id: number) {
    const idx = layer.measureLines!.findIndex(m => m.id === id);
    if (idx === -1) return;
    const m = layer.measureLines![idx];
    layer.scene?.remove(m.tube);
    m.markers.forEach(mk => layer.scene?.remove(mk));
    layer.measureLines!.splice(idx, 1);
    onMeasurementDeletedCb?.(id);
    layer.map?.triggerRepaint();
  }

  function setMeasureLinesVisible(visible: boolean) {
    if (!layer.measureLines) return;
    for (const m of layer.measureLines) {
      m.tube.visible = visible;
      m.markers.forEach(mk => { mk.visible = visible; });
    }
    // Also hide/show any in-progress pending marker
    if (layer.measurePendingMarker) {
      layer.measurePendingMarker.visible = visible;
    }
    layer.map?.triggerRepaint();
  }

  function setSelectMode(mode: string) {
    layer.hoverEnabled = mode === 'click';
    if (!layer.hoverEnabled) {
      if (layer.hoveredGroup) {
        setGroupEmissive(layer.hoveredGroup.meshes, 0x000000, 0);
        layer.hoveredGroup = null;
      }
      if (layer.selectedGroup) {
        setGroupEmissive(layer.selectedGroup.meshes, 0x000000, 0);
        layer.selectedGroup = null;
        onChairSelectedCb?.(null);
      }
      if (layer.map) {
        const cv = layer.map.getCanvas();
        if (cv) cv.style.cursor = '';
        layer.map.triggerRepaint();
      }
    }
  }

  // ── Callbacks ───────────────────────────────────────────────────────────────
  let onChairSelectedCb: ((name: string | null, kind?: string) => void) | null = null;
  let onMeasurementAddedCb:   ((id: number, distanceM: number) => void) | null = null;
  let onMeasurementDeletedCb: ((id: number) => void) | null = null;
  let labelPositionCb:        ((data: { id: number; x: number; y: number }[]) => void) | null = null;

  function setChairSelectedCallback(cb: (name: string | null, kind?: string) => void) { onChairSelectedCb = cb; }
  function setMeasurementCallbacks(
    onAdded:   (id: number, distanceM: number) => void,
    onDeleted: (id: number) => void,
  ) {
    onMeasurementAddedCb   = onAdded;
    onMeasurementDeletedCb = onDeleted;
  }
  function setLabelPositionCallback(cb: typeof labelPositionCb) { labelPositionCb = cb; }

  // ── Midpoint → LngLat (for fly-to) ───────────────────────────────────────────
  function getMidpointLngLat(id: number): [number, number] | null {
    const m = layer.measureLines?.find(ml => ml.id === id);
    if (!m) return null;
    const mid = m.points[0].clone().add(m.points[1]).multiplyScalar(0.5);
    // Scene → Mercator (accounting for rotX + scale + translate in render):
    // mercX = mt.tx + scene.x * mt.s
    // mercY = mt.ty + scene.z * mt.s  (scene Z = N/S after rotX)
    const mercX = mt.tx + mid.x * mt.s;
    const mercY = mt.ty + mid.z * mt.s;
    const ll = new mapboxgl.MercatorCoordinate(mercX, mercY, 0).toLngLat();
    return [ll.lng, ll.lat];
  }

  return {
    layer,
    handleMouseMove,
    handleClick,
    deselectChair,
    highlightAllOfKind,
    clearAllHighlights,
    getGroupsInScreenRect,
    highlightBoundarySelection,
    setSelectMode,
    setMeasureActive,
    deleteMeasurement,
    setMeasureLinesVisible,
    getMidpointLngLat,
    setChairSelectedCallback,
    setMeasurementCallbacks,
    setLabelPositionCallback,
    // ── Georeference ──────────────────────────────────────────────────────────
    setGeorefActive,
    setModelOpacity,
    saveGeoref,
    cancelGeoref,
    startGeorefDrag,
    updateGeorefDrag,
    endGeorefDrag,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function setGroupEmissive(meshes: THREE.Mesh[], hex: number, intensity: number) {
  for (const mesh of meshes) {
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      const m = mat as THREE.MeshStandardMaterial;
      if (m.emissive) {
        m.emissive.setHex(hex);
        m.emissiveIntensity = intensity;
        m.needsUpdate = true;
      }
    }
  }
}

// ─── loadGLTFModel (file upload path – kept for future use) ──────────────────
export function loadGLTFModel(customLayer: any, file: File, onComplete?: () => void) {
  const loader  = new GLTFLoader();
  const reader  = new FileReader();
  reader.onload = (e) => {
    const buffer = e.target?.result as ArrayBuffer;
    loader.parse(buffer, '', (gltf) => {
      processGLTF(customLayer, gltf);
      onComplete?.();
    }, (err) => console.error('❌ GLTF parse error:', err));
  };
  reader.readAsArrayBuffer(file);
}

// ─── loadGLTFFromURL (URL path – swap MODEL_URL in App.tsx to use) ────────────
export function loadGLTFFromURL(
  customLayer: any,
  url: string,
  onProgress?: (pct: number) => void,
  onComplete?: () => void,
  onError?: (err: unknown) => void,
) {
  const loader = new GLTFLoader();
  loader.load(
    url,
    (gltf) => { processGLTF(customLayer, gltf); onComplete?.(); },
    (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    },
    (err) => { console.error('❌ Failed to load model from URL:', url, err); onError?.(err); },
  );
}

// ─── processGLTF — used when a real GLB is loaded to replace the procedural scene
function processGLTF(customLayer: any, gltf: { scene: THREE.Group }) {
  console.log('✅ GLTF parsed — replacing procedural scene');

  // Remove existing model
  if (customLayer.loadedModel) customLayer.scene?.remove(customLayer.loadedModel);

  const model = gltf.scene as THREE.Group;

  // Scale to ~50 m target size
  const box    = new THREE.Box3().setFromObject(model);
  const size   = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  model.position.set(-center.x, -center.y, -center.z);

  const container = new THREE.Group();
  container.add(model);
  container.scale.setScalar(50 / Math.max(size.x, size.y, size.z));
  container.position.set(0, 2, 0);

  customLayer.scene?.add(container);
  customLayer.loadedModel = container;

  registerModelForInteraction(customLayer, model);
  console.log('📐 GLB scaled to 50 m and placed at origin');
}

// ─── hideObjectByName (DevTools helper) ──────────────────────────────────────
export function hideObjectByName(customLayer: any, exactName: string) {
  const obj = customLayer.loadedModel?.getObjectByName(exactName);
  if (obj) { obj.visible = false; console.log(`🙈 Hidden: "${exactName}"`); }
  else       console.warn(`⚠️  Object "${exactName}" not found`);
}
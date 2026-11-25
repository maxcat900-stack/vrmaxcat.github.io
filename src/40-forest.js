/* ---------------- forest generation ---------------- */

const FOREST_R = 150, CLEAR_R = 6.5, FENCE_R = 70;
const worldRnd = mulberry32(SEED);

const NEDD = [0.088, 0.205, 0.075];
const LEAF_B = [0.30, 0.40, 0.16];
const LEAF_O = [0.21, 0.32, 0.13];

function pineGeo(r) {
  const g = [], bark = [0.25, 0.18, 0.13], bark2 = [0.30, 0.225, 0.16];
  tube(g, [0,0,0], [0,0.78,0], 0.021, 0.010, 6, bark, 0.006, 0, 2);
  tube(g, [0,0.78,0], [0.02,1.02,0], 0.010, 0.005, 5, bark2, 0.02, 0, 3);
  for (let i = 0; i < 3; i++) {
    const a = TAU*(i + r()*0.8)/3, y = 0.40 + r()*0.20, L = 0.10 + r()*0.06;
    const p0 = [Math.cos(a)*0.014, y, Math.sin(a)*0.014];
    const p1 = [Math.cos(a)*L, y + L*0.35, Math.sin(a)*L];
    tube(g, p0, p1, 0.009, 0.004, 4, bark2, 0.03, 0, 2);
    blob(g, [p1[0]*1.05, p1[1]+0.03, p1[2]*1.05], 0.085, 0.75, 0.4, 6, 3, NEDD, 0.05, 0.35, r);
  }
  for (let i = 0; i < 5; i++) {
    const t = i/4, y = 0.60 + t*0.32, rad = 0.185 - t*0.115, h = 0.21 - t*0.06;
    const k = 0.80 + t*0.55;
    coneUp(g, [0,y,0], rad, h, 9, [NEDD[0]*k, NEDD[1]*k, NEDD[2]*k], 0.014 + t*0.03, 0.25);
  }
  coneUp(g, [0,0.98,0], 0.05, 0.11, 7, [0.115,0.27,0.10], 0.05, 0.3);
  return g;
}

function birchGeo(r) {
  const g = [], white = [0.80, 0.78, 0.73], dark = [0.13, 0.125, 0.12];
  const A = [0,0,0], B = [0.025,0.54,0.012], C = [0.06,0.80,-0.02];
  tube(g, A, B, 0.013, 0.0092, 7, white, 0.008, 0, 0);
  tube(g, B, C, 0.0092, 0.0055, 6, white, 0.02, 0, 2);
  for (let i = 0; i < 5; i++) {
    const t = (0.10 + i*0.11 + r()*0.05)/0.54;
    const y = t*0.54, x = A[0] + (B[0]-A[0])*t, z = A[2] + (B[2]-A[2])*t;
    tube(g, [x, y, z], [x+0.005, y+0.022, z+0.002], 0.0138, 0.0128, 7, dark, 0.008, 0, 0);
  }
  for (let i = 0; i < 3; i++) {
    const a = TAU*(i + r()*0.7)/3, y = 0.55 + r()*0.15, L = 0.14 + r()*0.10;
    tube(g, [Math.cos(a)*0.01, y, Math.sin(a)*0.01],
            [Math.cos(a)*L, y + L*0.5, Math.sin(a)*L], 0.005, 0.0025, 4, white, 0.03, 0, 2);
  }
  blob(g, [0.04,0.88,0], 0.21, 1.0, 0.5, 8, 4, LEAF_B, 0.055, 0.5, r);
  blob(g, [0.21,0.74,-0.10], 0.15, 1.0, 0.5, 7, 4, [0.34,0.43,0.19], 0.065, 0.5, r);
  blob(g, [-0.16,0.78,0.13], 0.14, 1.0, 0.5, 7, 4, LEAF_B, 0.065, 0.5, r);
  blob(g, [0.02,1.05,0.07], 0.13, 0.9, 0.5, 7, 4, [0.38,0.46,0.21], 0.075, 0.5, r);
  return g;
}

function oakGeo(r) {
  const g = [], bark = [0.22, 0.185, 0.145];
  tube(g, [0,0,0], [0.015,0.42,0.015], 0.042, 0.024, 7, bark, 0.004, 0, 0);
  for (let i = 0; i < 5; i++) {
    const a = TAU*(i + r()*0.7)/5, y = 0.32 + r()*0.10, el = 0.30 + r()*0.22;
    const p0 = [Math.cos(a)*0.016, y, Math.sin(a)*0.016];
    const p1 = [Math.cos(a)*el, y + el*0.62, Math.sin(a)*el];
    tube(g, p0, p1, 0.014, 0.006, 5, bark, 0.014, 0, 2);
    const cr = 0.17 + r()*0.10;
    blob(g, [p1[0]*1.15, p1[1] + cr*0.45, p1[2]*1.15], cr, 0.85, 0.5, 8, 4, LEAF_O, 0.03, 0.4, r);
  }
  blob(g, [0,0.62,0], 0.25, 0.8, 0.5, 9, 4, [0.19,0.29,0.12], 0.025, 0.4, r);
  return g;
}

function bushGeo(r) {
  const g = [], twig = [0.26,0.24,0.15];
  for (let i = 0; i < 4; i++) {
    const a = TAU*r(), L = 0.25 + r()*0.2;
    tube(g, [0,0,0], [Math.cos(a)*L, L*1.4, Math.sin(a)*L], 0.012, 0.006, 4, twig, 0.03, 0, 2);
  }
  const cs = [[0,0.24,0],[0.26,0.20,0.08],[-0.20,0.21,-0.16],[0.05,0.42,-0.20]];
  for (let i = 0; i < cs.length; i++) {
    blob(g, cs[i], 0.26 + r()*0.06, 0.8, 0.55, 7, 4,
      [0.15 + r()*0.08, 0.26 + r()*0.10, 0.10 + r()*0.05], 0.30, 0.45, r);
  }
  return g;
}

function grassGeo(r) {
  const g = [];
  for (let i = 0; i < 4; i++) {
    const ang = TAU*i/4 + r()*0.7;
    const k = 0.75 + r()*0.6;
    blade(g, (r()-0.5)*0.12, (r()-0.5)*0.12, 0.55 + r()*0.45, 0.10,
      ang, 0.22 + r()*0.4, [0.16*k, 0.28*k, 0.11*k], 0.10);
  }
  return g;
}

function mushGeo(r, cap, stem, squat) {
  const g = [];
  tube(g, [0,0,0], [0,0.58,0], 0.105, 0.078, 7, stem, 0, 0, 0);
  tube(g, [0,0.20,0], [0,0.27,0], 0.15, 0.13, 7, [stem[0]*1.05+0.03, stem[1]*1.05+0.03, stem[2]*1.03+0.03], 0, 0, 3);
  blob(g, [0,0.60,0], 0.30, squat, 0.12, 9, 4, cap, 0, 0.05, r);
  blob(g, [0,0.56,0], 0.26, squat*0.5, 0.10, 8, 3, [cap[0]*0.55+0.20, cap[1]*0.55+0.22, cap[2]*0.5+0.20], 0, 0, r);
  return g;
}

function rockGeo(r) {
  const g = [];
  blob(g, [0,0.30,0], 0.42, 0.62, 0.75, 8, 4, [0.40,0.40,0.39], 0, 0, r);
  blob(g, [0.22,0.16,-0.14], 0.20, 0.7, 0.6, 6, 3, [0.34,0.34,0.33], 0, 0, r);
  return g;
}

function logGeo(r) {
  const g = [], bark = [0.27,0.20,0.14];
  tube(g, [0,0.07,0], [0.86,0.085,0], 0.075, 0.055, 8, bark, 0, 0, 3);
  blob(g, [0.90,0.085,0], 0.055, 1.0, 0.5, 6, 3, [0.45,0.36,0.24], 0, 0, r);
  for (let i = 0; i < 2; i++) {
    const t = 0.25 + i*0.35, a = TAU*r();
    tube(g, [t, 0.12, 0], [t + 0.06*Math.cos(a), 0.30, 0.06*Math.sin(a)], 0.02, 0.008, 4, bark, 0, 0);
  }
  return g;
}

/* instance kinds: geo (prototype), far (cull distance), pat (shader pattern) */
const KINDS = [];
function addKind(key, geo, far, pat, cap) {
  const k = { key, geo, far, pat, list: [], cap };
  KINDS.push(k);
  return k;
}

const TREE_DEFS = [
  { key: 'pine',  gap: 1.55, lo: 11, hi: 21, trunk: 0.021, w: 0.42, build: pineGeo,  cap: 1400, shadow: [2.4, 0.24] },
  { key: 'birch', gap: 1.80, lo: 8,  hi: 15, trunk: 0.013, w: 0.28, build: birchGeo, cap: 950, shadow: [1.9, 0.17] },
  { key: 'oak',   gap: 3.30, lo: 8,  hi: 14, trunk: 0.040, w: 0.10, build: oakGeo,   cap: 350, shadow: [3.1, 0.24] },
  { key: 'bush',  gap: 1.25, lo: 0.7, hi: 1.9, trunk: 0, w: 0.20, build: bushGeo,    cap: 850, shadow: [0.8, 0.10] }
];
const treeKinds = TREE_DEFS.map((d, i) => {
  const geo = d.build(mulberry32(SEED + 1000 + i*77));
  fitTop(geo, 1);
  return addKind(d.key, geo, 78, 0, d.cap);
});

const grassKind = addKind('grass', grassGeo(mulberry32(SEED + 41)), 17, 0, 22000);
const rockKind = addKind('rock', rockGeo(mulberry32(SEED + 42)), 78, 0, 280);
const logKind = addKind('log', logGeo(mulberry32(SEED + 43)), 78, 0, 70);
const mushDefs = [
  { key: 'mush_red',    cap: [0.68,0.12,0.10], stem: [0.88,0.85,0.78], squat: 0.62, pat: 1 },
  { key: 'mush_white',  cap: [0.34,0.23,0.15], stem: [0.85,0.82,0.74], squat: 0.55, pat: 0 },
  { key: 'mush_orange', cap: [0.72,0.40,0.14], stem: [0.80,0.62,0.34], squat: 0.42, pat: 0 }
];
const mushKinds = mushDefs.map((d, i) =>
  addKind(d.key, mushGeo(mulberry32(SEED + 50 + i), d.cap, d.stem, d.squat), 24, d.pat, 1500));

/* occupancy + collision grids */
const occ = new Map(), OCELL = 2.5, OOFF = 400;
const okey = (cx, cz) => (cx + OOFF)*1000 + (cz + OOFF);

function occFree(x, z, r) {
  const cx = Math.floor(x/OCELL), cz = Math.floor(z/OCELL), n = Math.ceil(r/OCELL);
  for (let i = cx-n; i <= cx+n; i++) {
    for (let j = cz-n; j <= cz+n; j++) {
      const cell = occ.get(okey(i, j));
      if (!cell) continue;
      for (const p of cell) if ((p[0]-x)*(p[0]-x) + (p[1]-z)*(p[1]-z) < r*r) return false;
    }
  }
  return true;
}
function occAdd(x, z) {
  const k = okey(Math.floor(x/OCELL), Math.floor(z/OCELL));
  let cell = occ.get(k);
  if (!cell) { cell = []; occ.set(k, cell); }
  cell.push([x, z]);
}

const COLLS = [];
const cgrid = new Map(), CCELL = 4;
function collAdd(x, z, r) {
  if (r <= 0) return;
  COLLS.push([x, z, r]);
  const k = okey(Math.floor(x/CCELL), Math.floor(z/CCELL));
  let cell = cgrid.get(k);
  if (!cell) { cell = []; cgrid.set(k, cell); }
  cell.push(COLLS.length - 1);
}
function collNear(x, z) {
  const cx = Math.floor(x/CCELL), cz = Math.floor(z/CCELL), out = [];
  for (let i = cx-1; i <= cx+1; i++) for (let j = cz-1; j <= cz+1; j++) {
    const cell = cgrid.get(okey(i, j));
    if (cell) for (const idx of cell) out.push(COLLS[idx]);
  };
  return out;
}

const densityAt = (x, z) => 0.5 + vnoise(x*0.055 + 131, z*0.055 - 47)*1.15;

function pickTree(R) {
  let s = R(), acc = 0;
  for (const d of TREE_DEFS) { acc += d.w; if (s <= acc) return d; }
  return TREE_DEFS[0];
}

function placeTrees() {
  const rnd = mulberry32(SEED + 7);
  const R = TREE_DEFS.map(() => 0), placed = [], byKey = {};
  treeKinds.forEach(k => byKey[k.key] = k);
  for (let t = 0; t < 300000; t++) {
    const d = pickTree(rnd);
    const di = TREE_DEFS.indexOf(d);
    if (R[di] >= d.cap) continue;
    const a = rnd()*TAU, rr = Math.sqrt(rnd())*FOREST_R;
    const x = Math.cos(a)*rr, z = Math.sin(a)*rr;
    if (rr < CLEAR_R + 0.4) continue;
    const dens = clamp(densityAt(x, z), 0.55, 1.8);
    const gap = d.gap/dens;
    if (!occFree(x, z, gap*0.5)) continue;
    occAdd(x, z);
    R[di]++;
    const h = d.lo + rnd()*(d.hi - d.lo);
    const inst = [x, -0.02, z, h, rnd()*TAU, rnd()*2-1, rnd()*TAU, 0];
    byKey[d.key].list.push(inst);
    collAdd(x, z, d.trunk*h);
    placed.push({ d, x, z, h });
    if (placed.length >= 3600) break;
  }
  return placed;
}

function placeUndergrowth(placed) {
  const rnd = mulberry32(SEED + 8);
  const shadows = [];
  const addShadow = (x, z, r, a) => shadows.push([x, z, r, a]);

  for (const p of placed) {
    const d = p.d;
    if (d.shadow) addShadow(p.x, p.z, clamp(d.shadow[0]*p.h/(d.hi*0.9), 0.35, 3.6), d.shadow[1]);
    if (d.trunk > 0) {
      const prob = d.key === 'pine' ? 0.52 : d.key === 'birch' ? 0.46 : 0.34;
      if (rnd() < prob) {
        const n = 2 + Math.floor(rnd()*5);
        for (let i = 0; i < n; i++) {
          const a = rnd()*TAU, rr = d.trunk*p.h + 0.25 + rnd()*2.2;
          const mx = p.x + Math.cos(a)*rr, mz = p.z + Math.sin(a)*rr;
          if (Math.hypot(mx, mz) > FOREST_R - 2) continue;
          const s = 0.09 + rnd()*0.18;
          const k = rnd();
          const kind = k < 0.4 ? mushKinds[0] : k < 0.75 ? mushKinds[1] : mushKinds[2];
          if (kind.list.length >= kind.cap) continue;
          kind.list.push([mx, 0, mz, s, rnd()*TAU, rnd()*2-1, 0, 0]);
        }
      }
    }
  }

  // грибы поляны у точки старта — чтобы были видны сразу
  for (let i = 0; i < 26; i++) {
    const a = rnd()*TAU, rr = 1.2 + rnd()*(CLEAR_R - 1.6);
    const mx = Math.cos(a)*rr, mz = Math.sin(a)*rr;
    const s = 0.11 + rnd()*0.19;
    const k = rnd();
    const kind = k < 0.35 ? mushKinds[0] : k < 0.7 ? mushKinds[1] : mushKinds[2];
    kind.list.push([mx, 0, mz, s, rnd()*TAU, rnd()*2-1, 0, 0]);
  }

  // трава
  const gocc = new Map();
  for (let t = 0; t < 300000 && grassKind.list.length < grassKind.cap; t++) {
    const a = rnd()*TAU, rr = Math.sqrt(rnd())*(FENCE_R + 7);
    const x = Math.cos(a)*rr, z = Math.sin(a)*rr;
    const key = okey(Math.floor(x/0.45), Math.floor(z/0.45));
    if (gocc.has(key)) continue;
    gocc.set(key, 1);
    const s = 0.12 + rnd()*0.30;
    grassKind.list.push([x, 0, z, s, rnd()*TAU, rnd()*2-1, rnd()*TAU, 0]);
  }

  // камни и валежник
  for (let t = 0; t < 9000 && rockKind.list.length < rockKind.cap; t++) {
    const a = rnd()*TAU, rr = CLEAR_R*0.5 + Math.sqrt(rnd())*FOREST_R*0.9;
    const x = Math.cos(a)*rr, z = Math.sin(a)*rr;
    if (!occFree(x, z, 2.2)) continue;
    occAdd(x, z);
    const s = 0.35 + rnd()*0.95;
    rockKind.list.push([x, -0.05, z, s, rnd()*TAU, rnd()*2-1, 0, 0]);
    collAdd(x, z, 0.30*s);
    addShadow(x, z, 0.75*s, 0.20);
  }
  for (let t = 0; t < 6000 && logKind.list.length < logKind.cap; t++) {
    const a = rnd()*TAU, rr = CLEAR_R + Math.sqrt(rnd())*(FENCE_R - 2);
    const x = Math.cos(a)*rr, z = Math.sin(a)*rr;
    if (!occFree(x, z, 3.2)) continue;
    occAdd(x, z);
    const len = 2.0 + rnd()*2.5;
    logKind.list.push([x, 0, z, len, rnd()*TAU, rnd()*2-1, 0, 0]);
    collAdd(x, z, 0.26);
    addShadow(x, z, 0.55*len, 0.22);
  }

  return shadows;
}

const placedTrees = placeTrees();
const shadowList = placeUndergrowth(placedTrees);

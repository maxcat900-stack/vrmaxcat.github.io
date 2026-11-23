/* ---------------- locomotion ---------------- */

const player = [0, 0, 7];
let turn = 0;
const EYE = [0, 1.62, 0];
const PR = 0.30;
const cam3 = { yaw: 0, pitch: -0.05 };
let lastT = performance.now();

function resolveCollisions(px, pz) {
  let x = px, z = pz;
  for (let it = 0; it < 3; it++) {
    let moved = false;
    for (const c of collNear(x, z)) {
      const dx = x - c[0], dz = z - c[1], rr = c[2] + PR;
      const d2 = dx*dx + dz*dz;
      if (d2 >= rr*rr) continue;
      if (d2 < 1e-8) { x += rr; moved = true; continue; }
      const k = (rr - Math.sqrt(d2))/d2;
      x += dx*k; z += dz*k; moved = true;
    }
    if (!moved) break;
  }
  return [x, z];
}

function clampFence(x, z) {
  const d = Math.hypot(x, z);
  return d > FENCE_R ? [x*FENCE_R/d, z*FENCE_R/d] : [x, z];
}

function tryMove(nx, nz) {
  let p = clampFence(nx, nz);
  p = resolveCollisions(p[0], p[1]);
  p = clampFence(p[0], p[1]);
  player[0] = p[0];
  player[2] = p[1];
}

function pointBlocked(x, z) {
  for (const c of collNear(x, z)) {
    const rr = c[2] + PR;
    if ((x-c[0])*(x-c[0]) + (z-c[1])*(z-c[1]) < rr*rr) return true;
  }
  return false;
}

function segBlocked(x0, z0, x1, z1) {
  const len = Math.hypot(x1-x0, z1-z0);
  const steps = Math.min(24, Math.max(1, Math.ceil(len/2)));
  for (let i = 1; i <= steps; i++) {
    const t = i/steps;
    const x = x0 + (x1-x0)*t, z = z0 + (z1-z0)*t;
    for (const c of collNear(x, z)) {
      const rr = c[2] + 0.10;
      if ((x-c[0])*(x-c[0]) + (z-c[1])*(z-c[1]) < rr*rr) return true;
    }
  }
  return false;
}

function floorHit(o, d) {
  if (d[1] > -1e-3) return null;
  const t = -o[1]/d[1];
  if (t < 0.2 || t > 14) return null;
  const px = o[0] + d[0]*t, pz = o[2] + d[2]*t;
  if (Math.hypot(px, pz) > FENCE_R - 0.6) return null;
  if (pointBlocked(px, pz) || segBlocked(o[0], o[2], px, pz)) return null;
  return [px, 0, pz];
}

let teleAnim = null;
function teleport(target) { teleAnim = { t: 0, hit: target, applied: false }; }

function updateTele(dt) {
  if (!teleAnim) return 0;
  teleAnim.t += dt;
  if (!teleAnim.applied && teleAnim.t >= 0.13) {
    player[0] = teleAnim.hit[0];
    player[2] = teleAnim.hit[2];
    teleAnim.applied = true;
  }
  let a;
  if (teleAnim.t < 0.13) a = teleAnim.t/0.13*0.8;
  else a = Math.max(0, 0.8*(1 - (teleAnim.t - 0.13)/0.30));
  if (teleAnim.t > 0.44) teleAnim = null;
  return a;
}

/* desktop */
const keys = new Set();

function walk(dt) {
  const spd = (keys.has('ShiftLeft') || keys.has('ShiftRight')) ? 3.4 : 1.8;
  let f = 0, s = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) f += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) f -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) s += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) s -= 1;
  if (!f && !s) return 0;
  const n = Math.hypot(f, s);
  const fx = Math.sin(cam3.yaw), fz = -Math.cos(cam3.yaw);
  const rx = Math.cos(cam3.yaw), rz = Math.sin(cam3.yaw);
  const dx = (fx*f + rx*s)/n, dz = (fz*f + rz*s)/n;
  tryMove(player[0] + dx*spd*dt, player[2] + dz*spd*dt);
  return Math.min(1, n);
}

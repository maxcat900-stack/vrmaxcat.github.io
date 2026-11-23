/* ---------------- math ---------------- */

const TAU = Math.PI * 2;
const clamp = (x, a, b) => x < a ? a : (x > b ? b : x);

const norm = v => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];

function mulberry32(a) {
  let t = a >>> 0;
  return function () {
    t = (t + 0x6D2B79F5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(x, y) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function vnoise(x, y) {
  const i = Math.floor(x), j = Math.floor(y);
  let fx = x - i, fy = y - j;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  const a = hash2(i, j), b = hash2(i + 1, j), c = hash2(i, j + 1), d = hash2(i + 1, j + 1);
  return (a + (b - a) * fx) + ((c + (d - c) * fx) - (a + (b - a) * fx)) * fy;
}

function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  return new Float32Array([
    f/aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far+near)*nf, -1,
    0, 0, 2*far*near*nf, 0
  ]);
}

// View matrix: eye at pos looking along yaw/pitch. Column-major.
function lookView(pos, yaw, pitch) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const r = [cy, 0, sy];
  const b = [-sy*cp, -sp, cy*cp];
  const u = [-sp*sy, cp, sp*cy];
  return new Float32Array([
    r[0], u[0], b[0], 0,
    r[1], u[1], b[1], 0,
    r[2], u[2], b[2], 0,
    -(r[0]*pos[0]+r[1]*pos[1]+r[2]*pos[2]),
    -(u[0]*pos[0]+u[1]*pos[1]+u[2]*pos[2]),
    -(b[0]*pos[0]+b[1]*pos[1]+b[2]*pos[2]),
    1
  ]);
}

const IDENT4 = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);

function mul4(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c*4+r] = a[r]*b[c*4] + a[4+r]*b[c*4+1] + a[8+r]*b[c*4+2] + a[12+r]*b[c*4+3];
    }
  }
  return o;
}

// Scene -> reference-space transform: rotate by `turn` about the anchor, then place
// the scene point `pl` (the viewer's feet) on top of the anchor point `hf`.
function locoMat(pl, hf, turn) {
  const c = Math.cos(turn), s = Math.sin(turn);
  return new Float32Array([
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    -(c*pl[0] + s*pl[2]) + hf[0],
    -pl[1] + hf[1],
    (s*pl[0] - c*pl[2]) + hf[2],
    1
  ]);
}

// Inverse of locoMat: reference space -> scene.
function locoInv(pl, hf, turn) {
  const c = Math.cos(turn), s = Math.sin(turn);
  return new Float32Array([
    c, 0, s, 0,
    0, 1, 0, 0,
    -s, 0, c, 0,
    pl[0] - (c*hf[0] - s*hf[2]),
    pl[1] - hf[1],
    pl[2] - (s*hf[0] + c*hf[2]),
    1
  ]);
}

const xformP = (m, p) => [
  m[0]*p[0] + m[4]*p[1] + m[8]*p[2] + m[12],
  m[1]*p[0] + m[5]*p[1] + m[9]*p[2] + m[13],
  m[2]*p[0] + m[6]*p[1] + m[10]*p[2] + m[14]
];
const xformD = (m, d) => norm([
  m[0]*d[0] + m[4]*d[1] + m[8]*d[2],
  m[1]*d[0] + m[5]*d[1] + m[9]*d[2],
  m[2]*d[0] + m[6]*d[1] + m[10]*d[2]
]);

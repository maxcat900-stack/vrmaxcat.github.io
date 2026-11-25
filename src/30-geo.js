/* ---------------- geometry builders (flat shaded, non-indexed) ----------------
   Vertex layout: pos(3) nrm(3) col(3) sway(1) trans(1) = 11 floats.
   Winding is irrelevant: faces are drawn without culling and the fragment
   shader flips the normal towards the viewer. */

const VSTR = 11;

function pv(g, p, n, col, sw, tr) {
  g.push(p[0], p[1], p[2], n[0], n[1], n[2], col[0], col[1], col[2], sw, tr);
}

function faceN(a, b, c) {
  return norm([
    (b[1]-a[1])*(c[2]-a[2]) - (b[2]-a[2])*(c[1]-a[1]),
    (b[2]-a[2])*(c[0]-a[0]) - (b[0]-a[2])*(c[2]-a[0]),
    (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0])
  ]);
}

function ftri(g, a, b, c, col, sw, tr) {
  const n = faceN(a, b, c);
  pv(g, a, n, col, sw, tr); pv(g, b, n, col, sw, tr); pv(g, c, n, col, sw, tr);
}

function fquad(g, a, b, c, d, col, sw, tr) { ftri(g, a, b, c, col, sw, tr); ftri(g, a, c, d, col, sw, tr); }

function tube(g, p0, p1, r0, r1, seg, col, sw, tr, caps) {
  const ax = norm([p1[0]-p0[0], p1[1]-p0[1], p1[2]-p0[2]]);
  const u = norm(cross(Math.abs(ax[1]) < 0.9 ? [0,1,0] : [1,0,0], ax));
  const v = cross(ax, u);
  const ring = (t, r, a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return [p0[0]+(p1[0]-p0[0])*t + (u[0]*c + v[0]*s)*r,
            p0[1]+(p1[1]-p0[1])*t + (u[1]*c + v[1]*s)*r,
            p0[2]+(p1[2]-p0[2])*t + (u[2]*c + v[2]*s)*r];
  };
  for (let j = 0; j < seg; j++) {
    const a0 = TAU*j/seg, a1 = TAU*(j+1)/seg;
    fquad(g, ring(0,r0,a0), ring(1,r1,a0), ring(1,r1,a1), ring(0,r0,a1), col, sw, tr);
  }
  // End caps: without them every tube is a hollow pipe and the opening reads as a
  // black hole (trunk tops, branch tips).
  if (caps) {
    const cap = (t, r, nrm) => {
      for (let j = 0; j < seg; j++) {
        pv(g, ring(t, r, TAU*j/seg), nrm, col, sw, tr);
        pv(g, ring(t, r, TAU*(j+1)/seg), nrm, col, sw, tr);
        pv(g, [p0[0]+(p1[0]-p0[0])*t, p0[1]+(p1[1]-p0[1])*t, p0[2]+(p1[2]-p0[2])*t], nrm, col, sw, tr);
      }
    };
    if (caps & 1) cap(0, r0, [-ax[0], -ax[1], -ax[2]]);
    if (caps & 2) cap(1, r1, ax);
  }
}

function coneUp(g, c, r, h, seg, col, sw, tr) {
  const apex = [c[0], c[1]+h, c[2]];
  const rp = j => { const a = TAU*j/seg; return [c[0]+r*Math.cos(a), c[1], c[2]+r*Math.sin(a)]; };
  for (let j = 0; j < seg; j++) ftri(g, rp(j), rp(j+1), apex, col, sw, tr);
  const under = [col[0]*0.62, col[1]*0.62, col[2]*0.62], dn = [0, -1, 0];
  for (let j = 0; j < seg; j++) {
    pv(g, c, dn, under, sw, tr);
    pv(g, rp(j+1), dn, under, sw, tr);
    pv(g, rp(j), dn, under, sw, tr);
  }
}

function blob(g, c, r, sy, jit, seg, rings, col, sw, tr, rnd) {
  const R = [];
  for (let i = 0; i <= rings; i++) {
    const row = [];
    for (let j = 0; j < seg; j++) row.push(1 + (rnd()-0.5)*jit);
    row.push(row[0]);
    for (const q of row) R.push(q);
  }
  const P = (i, j) => {
    const t = Math.PI*i/rings, p = TAU*j/seg, q = R[i*(seg+1)+j]*r;
    return [c[0] + q*Math.sin(t)*Math.cos(p), c[1] + q*Math.cos(t)*sy, c[2] + q*Math.sin(t)*Math.sin(p)];
  };
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < seg; j++) {
      const a = P(i,j), b = P(i+1,j), c2 = P(i+1,j+1), d = P(i,j+1);
      const h = hash2(Math.round((a[0]+c2[0])*49), Math.round((a[2]+c2[2])*49) + Math.round((a[1]+c2[1])*49)*37);
      const k = 0.86 + h*0.30;
      fquad(g, a, b, c2, d, [col[0]*k, col[1]*k, col[2]*k], sw, tr);
    }
  }
}

function blade(g, x, z, h, w, ang, lean, col, sw) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const dx = c*lean*h, dz = s*lean*h, nx = -s*w, nz = c*w;
  fquad(g,
    [x - nx, 0, z - nz], [x + nx, 0, z + nz],
    [x + dx + nx*0.12, h, z + dz + nz*0.12], [x + dx - nx*0.12, h, z + dz - nz*0.12],
    col, sw, 0.55);
}

function fitTop(g, target) {
  let mx = 1e-4;
  for (let i = 1; i < g.length; i += VSTR) if (g[i] > mx) mx = g[i];
  const s = target / mx;
  for (let i = 0; i < g.length; i += VSTR) { g[i] *= s; g[i+1] *= s; g[i+2] *= s; }
  return s;
}

/* position-only meshes (ground, sky dome) */
const PSTR = 3;
function ptri(g, a, b, c) { g.push(a[0],a[1],a[2], b[0],b[1],b[2], c[0],c[1],c[2]); }

function domeGeo(g, rad, seg, rings) {
  const P = (i, j) => {
    const t = Math.PI*i/rings, p = TAU*j/seg;
    return [rad*Math.sin(t)*Math.cos(p), rad*Math.cos(t), rad*Math.sin(t)*Math.sin(p)];
  };
  for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
    ptri(g, P(i,j), P(i+1,j), P(i+1,j+1));
    ptri(g, P(i,j), P(i+1,j+1), P(i,j+1));
  }
}

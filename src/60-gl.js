/* ---------------- programs, buffers, VAOs ---------------- */

function compile(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) fail('Шейдер: ' + gl.getShaderInfoLog(s));
  return s;
}

function program(vsSrc, fsSrc) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl.VERTEX_SHADER, vsSrc));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) fail('Линковка: ' + gl.getProgramInfoLog(p));
  const u = {};
  const count = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(p, i);
    u[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, info.name);
  }
  return { p, u };
}

const u1f = (u, n, v) => { if (u[n] != null) gl.uniform1f(u[n], v); };
const u2f = (u, n, a, b) => { if (u[n] != null) gl.uniform2f(u[n], a, b); };
const u3fv = (u, n, v) => { if (u[n] != null) gl.uniform3fv(u[n], v); };
const u4f = (u, n, a, b, c, d) => { if (u[n] != null) gl.uniform4f(u[n], a, b, c, d); };
const um4v = (u, n, v) => { if (u[n] != null) gl.uniformMatrix4fv(u[n], false, v); };

function makeBuf(data, usage) {
  const b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, data instanceof Float32Array ? data : new Float32Array(data), usage);
  return b;
}

function triStrip(data, comps) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  makeBuf(data, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, comps, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  return { vao, count: data.length/comps };
}

const pWorld = program(VS_WORLD, FS_WORLD);
const pGround = program(VS_SIMPLE, FS_GROUND);
const pSky = program(VS_SKY, FS_SKY);
const pShadow = program(VS_SHADOW, FS_SHADOW);
const pMarker = program(VS_MARKER, FS_MARKER);
const pBeam = program(VS_BEAM, FS_BEAM);
const pFull = program(VS_FULL, FS_FULL);

const GROUND_HALF = 300, SKY_R = 460;
const groundMesh = (() => {
  const g = [];
  const H = GROUND_HALF;
  ptri(g, [-H, 0, -H], [H, 0, -H], [H, 0, H]);
  ptri(g, [-H, 0, -H], [H, 0, H], [-H, 0, H]);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  makeBuf(g, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, PSTR, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  return { vao, count: g.length/PSTR };
})();

const skyMesh = (() => {
  const g = [];
  domeGeo(g, 1, 22, 12);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  makeBuf(g, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, PSTR, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  return { vao, count: g.length/PSTR };
})();

/* kinds: prototype mesh + instance buffers (culled per frame) */
const CONE_COS = 0.28, NEAR_KEEP = 9;
const drawKinds = [];
for (const k of KINDS) {
  const n = k.list.length;
  if (!n) continue;
  const inst = new Float32Array(n*8);
  for (let i = 0; i < n; i++) for (let j = 0; j < 8; j++) inst[i*8 + j] = k.list[i][j];
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  makeBuf(new Float32Array(k.geo), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, VSTR*4, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, VSTR*4, 12);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, VSTR*4, 24);
  gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 2, gl.FLOAT, false, VSTR*4, 36);
  const ib = makeBuf(new Float32Array(n*8), gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 32, 0); gl.vertexAttribDivisor(4, 1);
  gl.enableVertexAttribArray(5); gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 32, 16); gl.vertexAttribDivisor(5, 1);
  gl.bindVertexArray(null);
  drawKinds.push({
    key: k.key, pat: k.pat, far: k.far, vao, ib, n, vcount: k.geo.length/VSTR,
    tris: k.geo.length/VSTR/3, inst, pack: new Float32Array(n*8), visible: 0
  });
}

const shadowMesh = (() => {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  makeBuf([-1,-1, 1,-1, -1,1, 1,1], gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const inst = new Float32Array(shadowList.length*4);
  for (let i = 0; i < shadowList.length; i++) for (let j = 0; j < 4; j++) inst[i*4 + j] = shadowList[i][j];
  makeBuf(inst, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 16, 0); gl.vertexAttribDivisor(1, 1);
  gl.bindVertexArray(null);
  return { vao, count: 4, n: shadowList.length };
})();

const quadMesh = triStrip([-1,-1, 1,-1, -1,1, 1,1], 2);
const beamMesh = triStrip([0,-1, 1,-1, 0,1, 1,1], 2);

gl.disable(gl.CULL_FACE);
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LESS);

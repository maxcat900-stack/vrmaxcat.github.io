/* ---------------- WebXR ---------------- */

let xrSession = null, xrRefSpace = null, xrRaf = 0, deskRaf = 0;
let hf0 = null, floorY = 0;
let aimSrc = null, aimHit = null, aimActive = false;
const beams = [];
let smoothMove = 0;

async function enterVR() {
  if (!navigator.xr) return;
  try {
    const session = await navigator.xr.requestSession('immersive-vr', {
      optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
    });
    xrSession = session;
    await gl.makeXRCompatible();
    const layer = new XRWebGLLayer(session, gl, { antialias: true, alpha: false, depth: true });
    session.updateRenderState({ baseLayer: layer });
    if ('fixedFoveation' in layer) { try { layer.fixedFoveation = 0.75; } catch (e) {} }
    try {
      xrRefSpace = await session.requestReferenceSpace('local-floor');
      floorY = 0;
    } catch (e) {
      xrRefSpace = await session.requestReferenceSpace('local');
      floorY = -1.6;
    }
    session.addEventListener('selectstart', e => { aimSrc = e.inputSource; aimActive = true; });
    session.addEventListener('selectend', e => {
      if (e.inputSource !== aimSrc) return;
      aimActive = false;
      if (aimHit) teleport(aimHit);
      aimHit = null;
    });
    session.addEventListener('selectcancel', e => {
      if (e.inputSource === aimSrc) { aimActive = false; aimHit = null; }
    });
    session.addEventListener('end', () => {
      xrSession = null; xrRefSpace = null; hf0 = null;
      aimSrc = null; aimHit = null; aimActive = false;
      beams.length = 0; smoothMove = 0; turn = 0;
      document.body.classList.remove('inxr');
      vrBtn.textContent = 'Войти в VR';
      vrBtn.onclick = () => enterVR();
      note('VR-сессия завершена.');
      lastT = performance.now();
      deskRaf = requestAnimationFrame(desktopFrame);
    });
    document.body.classList.add('inxr');
    hf0 = null;
    vrBtn.textContent = 'Выйти из VR';
    vrBtn.onclick = () => xrSession && xrSession.end();
    note('VR активен.');
    xrSession.requestAnimationFrame(xrFrame);
  } catch (e) {
    note('Не удалось войти в VR: ' + e.message + ' — для WebXR нужен https или localhost, а в приватном окне VR недоступен.');
  }
}

function readInput(dt, fwdScene) {
  smoothMove = 0;
  for (const src of xrSession.inputSources) {
    const gp = src.gamepad;
    if (!gp || !gp.axes) continue;
    const ax = gp.axes;
    const usePair = ax.length >= 4 ? 2 : 0;
    let sx = ax[usePair] || 0, sy = ax[usePair + 1] || 0;
    const m = Math.hypot(sx, sy);
    if (m > 0.18) {
      const k = (m - 0.18)/0.82/m;
      sx *= k; sy *= k;
      const spd = 2.3;
      const fx = fwdScene[0], fz = fwdScene[2];
      const fl = Math.hypot(fx, fz) || 1;
      const hx = fx/fl, hz = fz/fl;
      const rx = -hz, rz = hx;
      const vx = (hx*-sy + rx*sx)*spd, vz = (hz*-sy + rz*sx)*spd;
      tryMove(player[0] + vx*dt, player[2] + vz*dt);
      smoothMove = Math.min(1, m);
    } else if (ax.length >= 4) {
      const tx = ax[0] || 0, ty = ax[1] || 0;
      if (Math.hypot(tx, ty) > 0.6) turn -= tx*dt*1.7;
    }
  }
}

function xrFrame(t, frame) {
  xrSession.requestAnimationFrame(xrFrame);
  const dt = Math.min((t - lastT)/1000, 0.1);
  lastT = t;
  clock += dt;
  frameTris = 0;
  frameInst = 0;
  const fade = updateTele(dt);

  const layer = xrSession.renderState.baseLayer;
  const pose = frame.getViewerPose(xrRefSpace);
  gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
  gl.clearColor(0.80, 0.86, 0.93, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  if (!pose) return;

  const hp = pose.transform.position;
  if (!hf0) hf0 = [hp.x, floorY, hp.z];

  const hm = pose.transform.matrix;
  const Minv = locoInv(player, hf0, turn);
  const fwdScene = xformD(Minv, [-hm[8], -hm[9], -hm[10]]);
  readInput(dt, fwdScene);

  beams.length = 0;
  aimHit = null;
  for (const src of xrSession.inputSources) {
    if (!src.targetRaySpace) continue;
    const cp = frame.getPose(src.targetRaySpace, xrRefSpace);
    if (!cp) continue;
    const m = cp.transform.matrix;
    const o = xformP(Minv, [m[12], m[13], m[14]]);
    const d = xformD(Minv, [-m[8], -m[9], -m[10]]);
    let len = 1.3, hit = null;
    if (src === aimSrc && aimActive) {
      hit = floorHit(o, d);
      if (hit) {
        aimHit = hit;
        len = Math.hypot(hit[0]-o[0], hit[1]-o[1], hit[2]-o[2]);
      }
    }
    beams.push({ o, d, len, aim: !!hit });
  }

  const M = locoMat(player, hf0, turn);
  const st = { aimHit, beams, fade, vig: smoothMove*0.30 };
  for (const view of pose.views) {
    const vp = layer.getViewport(view);
    const vpos = view.transform.position;
    drawView(view.projectionMatrix, mul4(view.transform.inverse.matrix, M),
      xformP(Minv, [vpos.x, vpos.y, vpos.z]), fwdScene,
      { x: vp.x, y: vp.y, w: vp.width, h: vp.height }, st);
  }
}

/* ---------------- desktop controls, frame loop, boot ---------------- */

let dragging = false, lastX = 0, lastY = 0;

canvas.addEventListener('pointerdown', e => {
  dragging = true; lastX = e.clientX; lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (!dragging) return;
  cam3.yaw -= (e.clientX - lastX)*0.005;
  cam3.pitch = clamp(cam3.pitch - (e.clientY - lastY)*0.005, -1.4, 1.4);
  lastX = e.clientX; lastY = e.clientY;
});
const endDrag = () => { dragging = false; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
window.addEventListener('keydown', e => {
  keys.add(e.code);
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', e => keys.delete(e.code));

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.floor(canvas.clientWidth*dpr));
  const h = Math.max(1, Math.floor(canvas.clientHeight*dpr));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
}

let perfAcc = 0, perfFrames = 0;

function desktopFrame(t) {
  if (xrSession) return;
  deskRaf = requestAnimationFrame(desktopFrame);
  const dt = Math.min((t - lastT)/1000, 0.1);
  lastT = t;
  clock += dt;
  frameTris = 0;
  frameInst = 0;
  const fade = updateTele(dt);
  walk(dt);
  resize();
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.clearColor(0.80, 0.86, 0.93, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  const proj = perspective(1.15, canvas.width/canvas.height, 0.05, 400);
  const M = locoMat(player, ZERO3, 0);
  const fwd = [Math.sin(cam3.yaw), 0, -Math.cos(cam3.yaw)];
  drawView(proj, mul4(lookView(EYE, cam3.yaw, cam3.pitch), M),
    [player[0] + EYE[0], player[1] + EYE[1], player[2] + EYE[2]], fwd,
    { x: 0, y: 0, w: canvas.width, h: canvas.height },
    { aimHit: null, beams: [], fade, vig: 0 });
  const err = gl.getError();
  if (err) fail('WebGL ошибка 0x' + err.toString(16));

  perfAcc += dt;
  perfFrames++;
  if (perfAcc >= 0.5) {
    perfEl.textContent = (perfFrames/perfAcc).toFixed(0) + ' fps · инстансов ' + frameInst +
      ' · треугольников ' + (frameTris/1000).toFixed(0) + 'k';
    perfAcc = 0;
    perfFrames = 0;
  }
}

/* ---------------- boot ---------------- */

const counts = {};
for (const k of KINDS) counts[k.key] = k.list.length;
const mushTotal = mushKinds.reduce((a, k) => a + k.list.length, 0);

if (!fatal) {
  note('Лес сгенерирован: сосны ' + counts.pine + ', берёзы ' + counts.birch + ', дубы ' + counts.oak +
    ', кусты ' + counts.bush + ', грибы ' + mushTotal + ', трава ' + counts.grass + '.');
}

if (navigator.xr && navigator.xr.isSessionSupported) {
  navigator.xr.isSessionSupported('immersive-vr').then(ok => {
    if (ok) {
      vrBtn.disabled = false;
      vrBtn.onclick = () => (xrSession ? xrSession.end() : enterVR());
      note('WebXR найден. Нажми «Войти в VR». Если шлема нет в списке — проверь, что рантайм VR запущен.');
    } else {
      vrBtn.disabled = true;
      note('WebXR VR-устройство не найдено. Работает режим обзора: мышь + WASD.');
    }
  }).catch(e => note('WebXR недоступен: ' + e.message));
} else {
  note('WebXR в этом браузере нет. Работает режим обзора: мышь + WASD.');
}

for (const p of [['yaw', v => cam3.yaw = v], ['pitch', v => cam3.pitch = clamp(v, -1.4, 1.4)]]) {
  const v = parseFloat(QS.get(p[0]));
  if (Number.isFinite(v)) p[1](v);
}
const px = parseFloat(QS.get('x')), pz = parseFloat(QS.get('z'));
if (Number.isFinite(px) && Number.isFinite(pz)) { player[0] = px; player[2] = pz; }

window.addEventListener('resize', resize);
resize();
lastT = performance.now();
deskRaf = requestAnimationFrame(desktopFrame);

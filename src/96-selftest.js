/* ---------------- selftest (?selftest=1) ----------------
   Инварианты перемещения: не проваливаться в стволы, не выходить за границу,
   телепорт только на свободные точки. */

if (QS.get('selftest')) {
  let bad = 0, rays = 0, raysHit = 0;
  player[0] = 0; player[1] = 0; player[2] = 7;
  for (let i = 0; i < 4000; i++) {
    const a = i*0.37;
    tryMove(player[0] + Math.cos(a)*0.9, player[2] + Math.sin(a)*0.9);
    if (Math.hypot(player[0], player[2]) > FENCE_R + 0.01) bad++;
    if (pointBlocked(player[0], player[2])) bad++;
  }
  for (let i = 0; i < 400; i++) {
    const a = i*0.0418;
    const o = [player[0] + Math.cos(a)*0.5, 1.3, player[2] + Math.sin(a)*0.5];
    const d = norm([Math.cos(a)*0.30, -0.95, Math.sin(a)*0.30]);
    rays++;
    const h = floorHit(o, d);
    if (!h) continue;
    raysHit++;
    if (pointBlocked(h[0], h[2])) bad++;
    if (Math.hypot(h[0], h[2]) > FENCE_R) bad++;
    teleport(h);
    for (let k = 0; k < 40; k++) updateTele(0.02);
    if (Math.abs(player[0] - h[0]) > 0.01 || Math.abs(player[2] - h[2]) > 0.01) bad++;
  }
  const proj = perspective(1.15, 1.6, 0.05, 400);
  drawView(proj, mul4(lookView(EYE, 0, 0), locoMat(player, ZERO3, 0)),
    [player[0], EYE[1], player[2]], [0, 0, -1],
    { x: 0, y: 0, w: Math.max(1, canvas.width), h: Math.max(1, canvas.height) },
    { aimHit: null, beams: [], fade: 0, vig: 0 });
  const glErr = gl.getError();
  if (glErr) bad++;

  let drawn = 0;
  for (const kd of drawKinds) drawn += kd.visible;
  perfEl.textContent = 'SELFTEST ' + (bad || fatal ? 'FAIL bad=' + bad : 'OK') +
    ' rays=' + raysHit + '/' + rays + ' kinds=' + drawKinds.length + ' drawn=' + drawn +
    ' tris=' + Math.round(frameTris/1000) + 'k glErr=' + glErr +
    ' trees=' + (counts.pine + counts.birch + counts.oak) + ' mush=' + mushTotal;
}

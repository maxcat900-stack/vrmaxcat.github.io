/* ---------------- rendering ---------------- */

const FOG_DENS = 0.026, WIND = 0.05;
const ZERO3 = new Float32Array([0, 0, 0]);
let clock = 0, frameTris = 0, frameInst = 0;

function drawInstances(kd, cx, cz, fx, fz) {
  const s = kd.inst, pack = kd.pack, far2 = kd.far*kd.far;
  let n = 0;
  for (let o = 0; o < s.length; o += 8) {
    const dx = s[o] - cx, dz = s[o+2] - cz;
    const d2 = dx*dx + dz*dz;
    if (d2 > far2) continue;
    if (d2 > NEAR_KEEP) {
      const inv = 1/Math.sqrt(d2);
      if ((dx*inv)*fx + (dz*inv)*fz < CONE_COS) continue;
    }
    pack[n]   = s[o];   pack[n+1] = s[o+1]; pack[n+2] = s[o+2]; pack[n+3] = s[o+3];
    pack[n+4] = s[o+4]; pack[n+5] = s[o+5]; pack[n+6] = s[o+6]; pack[n+7] = s[o+7];
    n += 8;
  }
  kd.visible = n/8;
  if (!n) return;
  gl.bindVertexArray(kd.vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, kd.ib);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, pack, 0, n);
  gl.drawArraysInstanced(gl.TRIANGLES, 0, kd.vcount, kd.visible);
  frameInst += kd.visible;
  frameTris += kd.visible*kd.tris;
}

function drawView(proj, viewMat, cam, fwd, vp, st) {
  gl.viewport(vp.x, vp.y, vp.w, vp.h);
  gl.enable(gl.DEPTH_TEST);
  gl.depthMask(true);
  gl.clear(gl.DEPTH_BUFFER_BIT);

  gl.disable(gl.DEPTH_TEST);
  gl.depthMask(false);
  // far plane of this view: m14/(m10+1). The dome must sit inside it or it is clipped.
  const far = Math.abs(proj[14]/(proj[10] + 1));
  const skyR = clamp(far > 1e-4 && Number.isFinite(far) ? far*0.85 : SKY_R, 30, SKY_R);
  gl.useProgram(pSky.p);
  um4v(pSky.u, 'uProj', proj); um4v(pSky.u, 'uView', viewMat);
  u3fv(pSky.u, 'uCam', cam); u3fv(pSky.u, 'uCenter', cam);
  u1f(pSky.u, 'uSkyR', skyR);
  u1f(pSky.u, 'uFogDens', FOG_DENS); u1f(pSky.u, 'uTime', clock);
  gl.bindVertexArray(skyMesh.vao);
  gl.drawArrays(gl.TRIANGLES, 0, skyMesh.count);
  frameTris += skyMesh.count/3;

  gl.enable(gl.DEPTH_TEST);
  gl.depthMask(true);
  gl.useProgram(pGround.p);
  um4v(pGround.u, 'uProj', proj); um4v(pGround.u, 'uView', viewMat);
  u3fv(pGround.u, 'uCam', cam); u3fv(pGround.u, 'uCenter', ZERO3);
  u1f(pGround.u, 'uFogDens', FOG_DENS); u1f(pGround.u, 'uTime', clock);
  gl.bindVertexArray(groundMesh.vao);
  gl.drawArrays(gl.TRIANGLES, 0, groundMesh.count);
  frameTris += 2;

  gl.useProgram(pWorld.p);
  um4v(pWorld.u, 'uProj', proj); um4v(pWorld.u, 'uView', viewMat);
  u3fv(pWorld.u, 'uCam', cam);
  u1f(pWorld.u, 'uTime', clock); u1f(pWorld.u, 'uWind', WIND); u1f(pWorld.u, 'uFogDens', FOG_DENS);
  for (const kd of drawKinds) {
    u1f(pWorld.u, 'uPat', kd.pat);
    drawInstances(kd, cam[0], cam[2], fwd[0], fwd[2]);
  }

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false);

  gl.useProgram(pShadow.p);
  um4v(pShadow.u, 'uProj', proj); um4v(pShadow.u, 'uView', viewMat);
  gl.bindVertexArray(shadowMesh.vao);
  gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, shadowMesh.n);
  frameTris += shadowMesh.n*2;

  if (st.aimHit) {
    gl.useProgram(pMarker.p);
    um4v(pMarker.u, 'uProj', proj); um4v(pMarker.u, 'uView', viewMat);
    u3fv(pMarker.u, 'uCenter', st.aimHit);
    u1f(pMarker.u, 'uSize', 0.85); u1f(pMarker.u, 'uTime', clock);
    gl.bindVertexArray(quadMesh.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  if (st.beams.length) {
    gl.useProgram(pBeam.p);
    um4v(pBeam.u, 'uProj', proj); um4v(pBeam.u, 'uView', viewMat);
    u3fv(pBeam.u, 'uCam', cam);
    for (const b of st.beams) {
      u3fv(pBeam.u, 'uO', b.o); u3fv(pBeam.u, 'uD', b.d); u1f(pBeam.u, 'uLen', b.len);
      u4f(pBeam.u, 'uCol', 0.25, 0.55, 0.95, b.aim ? 0.95 : 0.4);
      gl.bindVertexArray(beamMesh.vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  if (st.fade > 0.002 || st.vig > 0.002) {
    gl.useProgram(pFull.p);
    u4f(pFull.u, 'uCol', 0.02, 0.03, 0.03, st.fade);
    u1f(pFull.u, 'uVig', st.vig);
    u2f(pFull.u, 'uRes', vp.w, vp.h);
    gl.bindVertexArray(quadMesh.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  gl.depthMask(true);
  gl.disable(gl.BLEND);
  gl.bindVertexArray(null);
}

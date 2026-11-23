/* ---------------- shaders ---------------- */

const GL_HEAD = `const vec3 SUNDIR = vec3(0.496, 0.793, 0.353);
const vec3 SUNC = vec3(1.00, 0.955, 0.87);
const vec3 SKYAMB = vec3(0.40, 0.49, 0.60);
const vec3 AMBGRD = vec3(0.27, 0.25, 0.19);
uniform float uTime, uFogDens;
float hash21(vec2 p){ p = fract(p*vec2(127.31, 311.7)); p += dot(p, p + 34.5); return fract(p.x*p.y); }
float vn2(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0 - 2.0*f);
  float a = hash21(i), b = hash21(i + vec2(1,0)), c = hash21(i + vec2(0,1)), d = hash21(i + vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
vec3 skyAt(vec3 d){
  float t = clamp(d.y*0.5 + 0.5, 0.0, 1.0);
  vec3 c = mix(vec3(0.80,0.86,0.93), vec3(0.26,0.47,0.80), smoothstep(0.50, 0.94, t));
  c = mix(c, vec3(0.82,0.80,0.72), smoothstep(0.035, 0.0, abs(d.y)));
  float sd = max(dot(normalize(d), SUNDIR), 0.0);
  c += vec3(1.0,0.92,0.74)*(pow(sd, 320.0)*1.7 + pow(sd, 14.0)*0.20);
  return c;
}
float fogAmt(float d){ float f = d*uFogDens; return 1.0 - exp(-f*f); }
`;

const VS_WORLD = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNrm;
layout(location=2) in vec3 aCol;
layout(location=3) in vec2 aMisc;
layout(location=4) in vec4 aOff;
layout(location=5) in vec4 aRot;
uniform mat4 uProj, uView;
uniform float uWind;
out vec3 vW;
out vec3 vN;
out vec3 vC;
out vec3 vL;
out float vTr;
` + GL_HEAD + `
void main(){
  float sc = aOff.w;
  vec3 p = aPos*sc;
  float c = cos(aRot.x), s = sin(aRot.x);
  p = vec3(p.x*c + p.z*s, p.y, -p.x*s + p.z*c);
  float sw = aMisc.x;
  if (sw > 0.0) {
    float w = uTime*1.4 + aRot.z;
    p.x += sin(w + p.y*0.8)*sw*uWind*sc;
    p.z += cos(w*0.81 + p.y*0.6)*sw*uWind*0.85*sc;
  }
  vec3 wp = p + aOff.xyz;
  vW = wp;
  vL = aPos;
  vTr = aMisc.y;
  vN = vec3(aNrm.x*c + aNrm.z*s, aNrm.y, -aNrm.x*s + aNrm.z*c);
  vC = aCol*(1.0 + aRot.y*0.13);
  gl_Position = uProj*uView*vec4(wp, 1.0);
}`;

const FS_WORLD = `#version 300 es
precision highp float;
in vec3 vW;
in vec3 vN;
in vec3 vC;
in vec3 vL;
in float vTr;
uniform vec3 uCam;
uniform float uPat;
out vec4 fragColor;
` + GL_HEAD + `
void main(){
  vec3 n = normalize(vN);
  vec3 vd = vW - uCam;
  float dist = max(length(vd), 1e-4);
  vec3 v = vd/dist;
  if (dot(n, v) > 0.0) n = -n;
  vec3 alb = vC;
  if (uPat > 0.5 && vL.y > 0.56) {
    vec2 q = vec2(atan(vL.z, vL.x)*3.2, vL.y*13.0);
    vec2 cell = floor(q), f = fract(q);
    if (hash21(cell) > 0.60) {
      float r = length(f - 0.5);
      alb = mix(alb, vec3(0.93, 0.92, 0.87), clamp(0.95 - r*1.2, 0.0, 1.0));
    }
  }
  float ndl = dot(n, SUNDIR);
  float lam = max(ndl, 0.0);
  float wrap = clamp((ndl + 0.45)/1.45, 0.0, 1.0);
  vec3 hemi = mix(AMBGRD, SKYAMB, 0.5 + 0.5*n.y);
  vec3 tr = SUNC*vec3(0.45, 0.62, 0.30)*vTr*max(-ndl, 0.0)*0.9;
  vec3 col = alb*(hemi*(0.60 + 0.40*wrap) + SUNC*(0.62*lam + 0.30*wrap) + tr);
  col = mix(col, skyAt(v), fogAmt(dist));
  fragColor = vec4(min(col, vec3(1.0)), 1.0);
}`;

const VS_SIMPLE = `#version 300 es
layout(location=0) in vec3 aPos;
uniform mat4 uProj, uView;
uniform vec3 uCenter;
out vec3 vW;
void main(){
  vW = aPos + uCenter;
  gl_Position = uProj*uView*vec4(vW, 1.0);
}`;

const FS_GROUND = `#version 300 es
precision highp float;
in vec3 vW;
uniform vec3 uCam;
out vec4 fragColor;
` + GL_HEAD + `
void main(){
  vec2 p = vW.xz;
  vec3 eye = vW - uCam;
  float dist = max(length(eye), 1e-4);
  float aa = clamp(2.0/(2.0 + (fwidth(p.x) + fwidth(p.y))*2.2), 0.0, 1.0);
  float n1 = vn2(p*0.045 + 7.0);
  float n2 = vn2(p*0.5 + 21.0);
  float n3 = vn2(p*2.2 - 11.0);
  vec3 moss = vec3(0.140, 0.220, 0.105);
  vec3 dry  = vec3(0.29, 0.27, 0.155);
  vec3 dirt = vec3(0.205, 0.165, 0.115);
  vec3 alb = mix(moss, dry, smoothstep(0.40, 0.86, n2*0.5 + n1*0.5));
  alb = mix(alb, dirt, smoothstep(0.72, 0.92, vn2(p*0.09 + 53.0)));
  alb *= mix(1.0, mix(0.88, 1.18, n3), aa);
  float dap = vn2(p*0.40 + vec2(uTime*0.045, uTime*0.030));
  float shade = 0.86 + 0.32*dap;
  vec3 hemi = mix(AMBGRD, SKYAMB, 0.92);
  vec3 col = alb*shade*(hemi + SUNC*(0.55*SUNDIR.y + 0.22));
  col = mix(col, col*vec3(1.06, 0.99, 0.86), smoothstep(0.42, 0.82, n1));
  col = mix(col, skyAt(eye/dist), fogAmt(dist));
  fragColor = vec4(min(col, vec3(1.0)), 1.0);
}`;

const FS_SKY = `#version 300 es
precision highp float;
in vec3 vW;
uniform vec3 uCam;
out vec4 fragColor;
` + GL_HEAD + `
void main(){
  vec3 d = normalize(vW - uCam);
  fragColor = vec4(min(skyAt(d), vec3(1.0)), 1.0);
}`;

const VS_SHADOW = `#version 300 es
layout(location=0) in vec2 aCorner;
layout(location=1) in vec4 aSh;
uniform mat4 uProj, uView;
out vec2 vUv;
out float vA;
void main(){
  vUv = aCorner;
  vA = aSh.w;
  gl_Position = uProj*uView*vec4(aSh.x + aCorner.x*aSh.z, 0.02, aSh.y + aCorner.y*aSh.z, 1.0);
}`;

const FS_SHADOW = `#version 300 es
precision highp float;
in vec2 vUv;
in float vA;
out vec4 fragColor;
void main(){
  float r = length(vUv);
  fragColor = vec4(0.05, 0.07, 0.05, smoothstep(1.0, 0.12, r)*vA);
}`;

const VS_MARKER = `#version 300 es
layout(location=0) in vec2 aCorner;
uniform mat4 uProj, uView;
uniform vec3 uCenter;
uniform float uSize, uTime;
out vec2 vC;
void main(){
  vC = aCorner;
  gl_Position = uProj*uView*vec4(uCenter.x + aCorner.x*uSize, 0.015, uCenter.z + aCorner.y*uSize, 1.0);
}`;

const FS_MARKER = `#version 300 es
precision highp float;
in vec2 vC;
uniform float uSize, uTime;
out vec4 fragColor;
void main(){
  float r = length(vC)*uSize;
  float pulse = 0.02*sin(uTime*6.0);
  float ring = smoothstep(0.34 + pulse, 0.30 + pulse, r)*smoothstep(0.20, 0.24, r);
  float dotc = smoothstep(0.06, 0.03, r);
  float glow = exp(-r*r*9.0)*0.35;
  float a = clamp(ring*0.85 + dotc*0.80 + glow, 0.0, 1.0);
  vec3 c = mix(vec3(0.16, 0.44, 0.90), vec3(0.85, 0.95, 1.0), glow);
  fragColor = vec4(c, a*0.92);
}`;

const VS_BEAM = `#version 300 es
layout(location=0) in vec2 aTS;
uniform mat4 uProj, uView;
uniform vec3 uO, uD, uCam;
uniform float uLen;
out float vT;
void main(){
  float t = aTS.x*uLen;
  vec3 p = uO + uD*t;
  vec3 side = normalize(cross(uD, normalize(uCam - p)) + vec3(1e-4, 0.0, 0.0));
  p += side*aTS.y*0.008;
  vT = aTS.x;
  gl_Position = uProj*uView*vec4(p, 1.0);
}`;

const FS_BEAM = `#version 300 es
precision highp float;
in float vT;
uniform vec4 uCol;
out vec4 fragColor;
void main(){ fragColor = vec4(uCol.rgb, uCol.a*(1.0 - 0.45*vT)); }`;

const VS_FULL = `#version 300 es
layout(location=0) in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FS_FULL = `#version 300 es
precision highp float;
uniform vec4 uCol;
uniform float uVig;
uniform vec2 uRes;
out vec4 fragColor;
void main(){
  float r = length(gl_FragCoord.xy - 0.5*uRes)/max(uRes.x, uRes.y);
  fragColor = vec4(uCol.rgb, clamp(uCol.a + uVig*smoothstep(0.20, 0.72, r), 0.0, 1.0));
}`;

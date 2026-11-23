'use strict';

const QS = new URLSearchParams(location.search);
const SEED = (() => {
  const s = QS.get('seed');
  return s === null ? 20261123 : (Math.abs(Math.trunc(parseFloat(s) || 0)) || 1);
})();

const canvas = document.getElementById('c');
const statusEl = document.getElementById('status');
const perfEl = document.getElementById('perf');
const vrBtn = document.getElementById('vr');

let fatal = null;
const note = m => { if (!fatal) statusEl.textContent = m; };
const fail = m => { if (!fatal) { fatal = m; statusEl.textContent = m; vrBtn.disabled = true; } console.error(m); };

window.addEventListener('error', e => fail('Ошибка JS: ' + e.message + ' (строка ' + e.lineno + ')'));

const gl = canvas.getContext('webgl2', {
  antialias: true, alpha: false, depth: true, stencil: false,
  xrCompatible: true, powerPreference: 'high-performance'
});
if (!gl) fail('WebGL2 недоступен — открой в свежем Edge/Chrome.');

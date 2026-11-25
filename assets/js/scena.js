/* =========================================================
   SIMONE GATTI · la scena del percorso
   Scorrendo la pagina la camera cammina lungo il percorso oro tratteggiato,
   sulla sabbia, tra palme e verde. A ogni tappa (le <section class="tappa">)
   c'e' un segno sul percorso e, se la sezione ha data-photos, una foto vera
   di Libra sospesa accanto. In cima, prima di "Prenota", la vetta.
   Prestazioni: geometrie semplici e ripetute (instancing), foto da 760 px,
   densita' di pixel limitata, scena ferma quando non si vede.
   Impostazione ripresa dal 3D di Casa Libra (casa-libra/3d/scena.js).
   ========================================================= */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const html = document.documentElement;

const IMG = 'assets/img/';
const mobile = matchMedia('(max-width: 760px)').matches;
const CREAM = new THREE.Color('#F2EADB');
const SAND = new THREE.Color('#E7D8BC');
const GOLD = new THREE.Color('#D9A464');
const GREENS = ['#2F5A3F', '#3E6B47', '#4F7D4E', '#27493A', '#5E8A55'].map(c => new THREE.Color(c));

/* ---------- renderer, scena, camera ---------- */
const canvas = document.getElementById('gl');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance' }); }
catch (e) { html.classList.add('no-gl'); throw e; }
let dpr = Math.min(devicePixelRatio, mobile ? 1.5 : 2);
renderer.setPixelRatio(dpr);
renderer.setClearColor(CREAM, 1);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(CREAM, 9, 34);
const camera = new THREE.PerspectiveCamera(mobile ? 68 : 55, 1, 0.1, 80);

scene.add(new THREE.HemisphereLight('#FFF6E6', '#9C8A6A', 1.15));
const sun = new THREE.DirectionalLight('#FFE2B8', 1.3);
sun.position.set(-6, 10, 4);
scene.add(sun);

/* ---------- numeri casuali ma sempre uguali ---------- */
let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/* ---------- il percorso ---------- */
const tappe = [...document.querySelectorAll('.tappa')];
const N = tappe.length;
const STEP = 9;
const ctrl = [];
for (let k = -1; k <= N + 1; k++) ctrl.push(new THREE.Vector3(Math.sin(k * 1.25) * 2.4, 0, -k * STEP));
const curve = new THREE.CatmullRomCurve3(ctrl, false, 'catmullrom', 0.5);
const LEN = curve.getLength();
const uAtTappa = i => (STEP * (i + 1)) / (STEP * (N + 2));    // dove sta la tappa i lungo la curva (0..1)
const uEnd = uAtTappa(N);                                       // la vetta

/* sabbia: un piano ondulato come la sabbia mossa dal vento */
{
  const g = new THREE.PlaneGeometry(60, STEP * (N + 4), 90, 160);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, Math.sin(x * 1.7 + z * 0.35) * 0.035 + Math.sin(z * 0.9) * 0.05 + Math.max(0, Math.abs(x) - 7) * 0.08);
  }
  g.computeVertexNormals();
  const ground = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: SAND }));
  ground.position.z = -STEP * (N + 2) / 2;
  scene.add(ground);
}

/* il tratteggio oro, appoggiato sulla sabbia */
{
  const DASH = 0.42, GAP = 0.3;
  const count = Math.floor((LEN * uEnd) / (DASH + GAP));
  const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, 0.02, DASH), new THREE.MeshBasicMaterial({ color: GOLD }), count);
  const m = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const u = ((i * (DASH + GAP)) / LEN);
    const pt = curve.getPointAt(u), tg = curve.getTangentAt(u);
    m.position.set(pt.x, 0.08, pt.z);
    m.rotation.set(0, Math.atan2(tg.x, tg.z), 0);
    m.updateMatrix();
    dash.setMatrixAt(i, m.matrix);
  }
  scene.add(dash);
}

/* segni di tappa e vetta */
const ringGeo = new THREE.RingGeometry(0.32, 0.42, 40);
ringGeo.rotateX(-Math.PI / 2);
for (let i = 0; i < N; i++) {
  const pt = curve.getPointAt(uAtTappa(i));
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: GOLD, side: THREE.DoubleSide }));
  ring.position.set(pt.x, 0.1, pt.z);
  scene.add(ring);
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: GOLD }));
  dot.position.set(pt.x, 0.11, pt.z);
  scene.add(dot);
}
{
  const pt = curve.getPointAt(uEnd);
  const summit = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 3), new THREE.MeshLambertMaterial({ color: GOLD }));
  summit.position.set(pt.x, 0.55, pt.z);
  scene.add(summit);
}

/* ---------- il verde: palme e cespugli ai lati del percorso ---------- */
function sidePoint(minOff, maxOff) {
  const u = rnd() * (uEnd + 0.04);
  const pt = curve.getPointAt(Math.min(u, 1));
  const tg = curve.getTangentAt(Math.min(u, 1));
  const side = rnd() < 0.5 ? -1 : 1;
  const off = minOff + rnd() * (maxOff - minOff);
  return new THREE.Vector3(pt.x + tg.z * off * side, 0, pt.z - tg.x * off * side);
}
{
  const BUSH = mobile ? 160 : 300;
  const bush = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ flatShading: true }), BUSH);
  const m = new THREE.Object3D();
  for (let i = 0; i < BUSH; i++) {
    const p = sidePoint(4.6, 14);
    const s = 0.25 + rnd() * 0.65;
    m.position.set(p.x, s * 0.45, p.z);
    m.scale.set(s * (1 + rnd() * 0.5), s * (0.7 + rnd() * 0.5), s);
    m.rotation.set(rnd(), rnd() * 6, rnd());
    m.updateMatrix();
    bush.setMatrixAt(i, m.matrix);
    bush.setColorAt(i, GREENS[Math.floor(rnd() * GREENS.length)]);
  }
  scene.add(bush);

  const PALMS = mobile ? 26 : 46, LEAVES = 8;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.14, 1, 7), new THREE.MeshLambertMaterial({ color: '#8A6A4A' }), PALMS);
  const leafGeo = new THREE.ConeGeometry(0.55, 2.2, 4, 1);
  leafGeo.translate(0, 1.05, 0);
  leafGeo.scale(1, 1, 0.25);
  const leaf = new THREE.InstancedMesh(leafGeo, new THREE.MeshLambertMaterial({ flatShading: true, side: THREE.DoubleSide, emissive: '#1d3a28', emissiveIntensity: 0.35 }), PALMS * LEAVES);
  let li = 0;
  for (let i = 0; i < PALMS; i++) {
    const p = sidePoint(4, 12);
    const h = 2.4 + rnd() * 2.2;
    m.position.set(p.x, h / 2, p.z);
    m.rotation.set((rnd() - 0.5) * 0.18, 0, (rnd() - 0.5) * 0.18);
    m.scale.set(1, h, 1);
    m.updateMatrix();
    trunk.setMatrixAt(i, m.matrix);
    for (let k = 0; k < LEAVES; k++) {
      m.position.set(p.x, h, p.z);
      m.scale.set(1, 0.8 + rnd() * 0.4, 1);
      m.rotation.set(0, (k / LEAVES) * Math.PI * 2 + rnd() * 0.4, 0);
      m.rotateX(1.25 + rnd() * 0.5);
      m.updateMatrix();
      leaf.setMatrixAt(li, m.matrix);
      leaf.setColorAt(li, GREENS[Math.floor(rnd() * GREENS.length)]);
      li++;
    }
  }
  scene.add(trunk, leaf);
}

/* pulviscolo dorato nell'aria */
const motes = (() => {
  const C = mobile ? 140 : 280;
  const pos = new Float32Array(C * 3);
  for (let i = 0; i < C; i++) {
    const p = sidePoint(0, 9);
    pos.set([p.x, 0.4 + rnd() * 3.2, p.z], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: GOLD, size: mobile ? 0.05 : 0.04, transparent: true, opacity: 0.7 }));
  scene.add(pts);
  return pts;
})();

/* ---------- le foto di Libra, una per tappa ---------- */
const loader = new THREE.TextureLoader();
const bar = document.getElementById('loader');
const photos = [];
tappe.forEach((sec, i) => {
  if (!sec.dataset.photos) return;
  const name = sec.dataset.photos.split(',')[0];
  const u = Math.min(uAtTappa(i) + 0.012, 1);
  const pt = curve.getPointAt(u), tg = curve.getTangentAt(u);
  const side = i % 2 === 0 ? 1 : -1;                 // la foto sta dal lato opposto alla scheda di testo
  const off = mobile ? 1.6 : 3.1;
  const mat = new THREE.MeshBasicMaterial({ color: '#D8CDB8', transparent: true, opacity: 0, fog: true, side: THREE.DoubleSide });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  const h = mobile ? 1.5 : 2.1;
  plane.scale.set(h * 0.8, h, 1);
  // a destra del percorso (side = 1) quando si guarda avanti, ruotata verso il centro
  plane.position.set(pt.x - tg.z * off * side, 1.75, pt.z + tg.x * off * side - 1.2);
  plane.rotation.y = Math.atan2(tg.x, tg.z) + Math.PI - side * 0.32;
  scene.add(plane);
  photos.push({ plane, name, h });
});
let done = 0, started = false;
function start() { if (started) return; started = true; html.classList.add('gl-on'); bar.style.opacity = 0; }
photos.forEach(ph => {
  loader.load(IMG + ph.name + '-m.jpg', tex => {
    tex.colorSpace = THREE.SRGBColorSpace;
    const a = tex.image.width / tex.image.height;
    ph.plane.material.map = tex;
    ph.plane.material.color.set('#ffffff');
    ph.plane.material.needsUpdate = true;
    ph.plane.scale.set(ph.h * a, ph.h, 1);
    done++; bar.style.transform = `scaleX(${done / photos.length})`;
    if (done >= photos.length) start();
  }, undefined, () => { done++; if (done >= photos.length) start(); });
});
setTimeout(start, 3000);          // anche se una foto tarda, la scena compare comunque
if (!photos.length) start();

/* ---------- scroll: posizione lungo il percorso ---------- */
const endSec = document.getElementById('prenota');
let target = 0, u = 0, covered = false;
function readScroll() {
  const max = Math.max(1, endSec.offsetTop - innerHeight);
  const p = Math.min(1, Math.max(0, scrollY / max));
  target = p * (uEnd - 0.03);
  covered = endSec.getBoundingClientRect().top <= 0;
}
addEventListener('scroll', readScroll, { passive: true });

/* mouse: lo sguardo segue con ritardo */
let mx = 0, my = 0, cx = 0, cy = 0;
addEventListener('pointermove', e => { mx = (e.clientX / innerWidth) * 2 - 1; my = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  readScroll();
}
addEventListener('resize', resize);
resize();
u = target;

/* ---------- ciclo di disegno ---------- */
const clock = new THREE.Clock();
const look = new THREE.Vector3();
let frames = 0, tCheck = 0, checked = false;
function tick() {
  requestAnimationFrame(tick);
  if (document.hidden || covered) return;            // niente lavoro quando la scena non si vede
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  const k = 1 - Math.pow(0.002, dt);                  // smorzamento indipendente dai fotogrammi
  u += (target - u) * k;
  const back = Math.max(0, u - 0.025);
  const pos = curve.getPointAt(back);
  const ahead = curve.getPointAt(Math.min(1, u + 0.02));
  cx += (mx * 0.5 - cx) * k * 0.4;
  cy += (-my * 0.25 - cy) * k * 0.4;
  camera.position.set(pos.x + cx, 1.65 + cy + Math.sin(t * 0.8) * 0.02, pos.z + 2.2);
  look.set(ahead.x, 1.0, ahead.z);
  camera.lookAt(look);

  for (const ph of photos) {
    const d = camera.position.distanceTo(ph.plane.position);
    const target = ph.plane.material.map ? THREE.MathUtils.clamp((26 - d) / 10, 0, 1) * THREE.MathUtils.clamp((d - 3) / 2.5, 0, 1) : 0;
    ph.plane.material.opacity += (target - ph.plane.material.opacity) * k;
  }
  motes.rotation.y = Math.sin(t * 0.05) * 0.02;
  motes.position.y = Math.sin(t * 0.4) * 0.08;
  renderer.render(scene, camera);

  // se nei primi 2 secondi la scena non regge i 45 fotogrammi, abbassa la definizione
  if (!checked && started) { frames++; tCheck += dt; if (tCheck > 2) { checked = true; if (frames / tCheck < 45 && dpr > 1) { dpr = 1; renderer.setPixelRatio(1); resize(); } } }
}
tick();

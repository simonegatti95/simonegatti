/* Mappa del corpo in 3D: la figura ruota sul suo asse seguendo il cursore (destra/sinistra dello schermo)
   o il dito; dove tocchi compare una chiazza rossa
   e si apre la scheda della zona. Nessun dato salvato o inviato.
   Figura: base mesh maschile CC0 (orange-juice-games), in assets/modelli/corpo.glb. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const figura = document.querySelector('.figura');
const canvas = figura && figura.querySelector('.corpo3d');
const fermo = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MAX = 3;

function avvia() {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.95, 5.6);

  // rotazione sul proprio asse: solo con il cursore dentro il riquadro e fuori dal corpo
  const giro = { meta: 0, ora: 0 };
  const mouse = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const controlli = { update() {
    giro.ora += (giro.meta - giro.ora) * (fermo ? 1 : 0.07);
    perno.rotation.y = giro.ora;
  } };

  scena.add(new THREE.AmbientLight(0xffffff, 0.18));
  const luce = new THREE.DirectionalLight(0xffe2b8, 0.55); luce.position.set(2, 3, 3); scena.add(luce);

  // le chiazze rosse: posizioni nello spazio del manichino, passate allo shader
  const punti = []; // Vector3 locali
  const uPunti = { value: Array.from({ length: MAX }, () => new THREE.Vector3(0, -99, 0)) };
  const uN = { value: 0 };

  function vetroOro(mat) {
    const m = new THREE.MeshStandardMaterial({
      color: 0x0f1a13, emissive: 0xE3B074, emissiveIntensity: 0.10, roughness: 0.3, metalness: 0.2,
      transparent: true, opacity: 0.92
    });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uPunti = uPunti; sh.uniforms.uN = uN;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vMondo;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvMondo = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vMondo;\nuniform vec3 uPunti[' + MAX + '];\nuniform int uN;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          // bordo luminoso oro, come un ologramma
          float fr = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.2);
          totalEmissiveRadiance += vec3(0.89, 0.69, 0.45) * (fr * 2.6 + 0.04);
          // chiazze rosse sfumate dove hai toccato
          float rosso = 0.0;
          for (int i = 0; i < ${MAX}; i++) { if (i < uN) {
            float d = distance(vMondo, uPunti[i]);
            rosso = max(rosso, 1.0 - smoothstep(0.03, 0.13, d));
          } }
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.75, 0.12, 0.08), rosso * 0.85);
          totalEmissiveRadiance = mix(totalEmissiveRadiance, vec3(0.9, 0.18, 0.1), rosso * 0.75);`);
    };
    return m;
  }

  let modello = null, altezza = 1.8, mixer = null;
  const perno = new THREE.Group(); // gira su se stesso seguendo il cursore
  scena.add(perno);
  const orologio = new THREE.Clock();
  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
  const pos = (n) => modello.getObjectByName(n).getWorldPosition(new THREE.Vector3());

  // ruota un osso attorno a un asse del mondo, tenendo conto dei genitori
  function giraOsso(osso, asse, ang) {
    const qp = osso.parent.getWorldQuaternion(new THREE.Quaternion());
    const qw = new THREE.Quaternion().setFromAxisAngle(asse, ang);
    osso.quaternion.premultiply(qp.clone().invert().multiply(qw).multiply(qp));
    osso.updateMatrixWorld(true);
  }

  // Base mesh maschile CC0 (orange-juice-games, via BoQsc/Godot-3D-Male-Base-Mesh)
  new GLTFLoader().load('assets/modelli/corpo.glb', (g) => { try {
    modello = g.scene;
    modello.traverse((o) => { if (o.isMesh) { o.material = vetroOro(o.material); o.frustumCulled = false; } });
    perno.add(modello);
    modello.updateMatrixWorld(true);

    // la figura guarda verso di noi: punta del piede davanti al tallone
    const avanti = pos('toeL').sub(pos('heel02L')).setY(0).normalize();
    modello.rotation.y = Math.atan2(-avanti.x, avanti.z) + modello.rotation.y;
    modello.updateMatrixWorld(true);

    // dalla posa a T alle braccia lungo i fianchi
    for (const lato of ['L', 'R']) {
      const spalla = modello.getObjectByName('upper_arm' + lato);
      const dir = pos('forearm' + lato).sub(pos('upper_arm' + lato)).normalize();
      const giu = new THREE.Vector3(0, -1, 0);
      const asse = new THREE.Vector3().crossVectors(dir, giu).normalize();
      giraOsso(spalla, asse, dir.angleTo(giu) - 0.16);
    }

    // misuro con le ossa e appoggio i piedi a terra
    let ymin = Infinity, ymax = -Infinity;
    modello.traverse((o) => { if (o.isBone) { o.getWorldPosition(v1); ymin = Math.min(ymin, v1.y); ymax = Math.max(ymax, v1.y); } });
    altezza = (ymax - ymin) * 1.1;
    modello.position.y -= ymin - altezza * 0.01;
    modello.updateMatrixWorld(true);

    camera.position.set(0, altezza * 0.55, altezza * 2.3);
    camera.lookAt(0, altezza * 0.5, 0);
    figura.classList.add('tre');
  } catch (err) { console.error('corpo3d', err); } }, undefined, (err) => console.error('corpo3d', err)); // se non si carica resta l'immagine

  // dimensioni
  function misura() {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
  }
  new ResizeObserver(misura).observe(canvas); misura();

  // tocco: distinguo il trascinamento dal tocco
  const ray = new THREE.Raycaster(), p = new THREE.Vector2();
  let giu = null;
  let partenza = 0;
  // trascinare (mouse o dito) gira la figura ovunque nel riquadro, anche sopra il corpo
  canvas.addEventListener('pointerdown', (e) => {
    giu = [e.clientX, e.clientY]; partenza = giro.meta;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!giu) return;
    giro.meta = partenza - (e.clientX - giu[0]) / canvas.clientWidth * Math.PI * 2;
  });
  // pulsanti: di fronte, di fianco, di schiena (prende la strada più corta)
  document.querySelectorAll('.viste [data-vista]').forEach((b) => b.addEventListener('click', () => {
    const base = +b.dataset.vista * Math.PI / 180;
    giro.meta = base + Math.round((giro.meta - base) / (Math.PI * 2)) * Math.PI * 2;
  }));

  // mouse: sullo spazio vuoto la figura gira (cursore a destra -> corpo a sinistra), sopra il corpo si ferma
  let ultimoX = null;
  function sopraCorpo(e) {
    if (!modello) return false;
    const r = canvas.getBoundingClientRect();
    p.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(p, camera);
    modello.traverse((o) => { if (o.isSkinnedMesh) { o.computeBoundingSphere(); o.computeBoundingBox(); } });
    return ray.intersectObject(modello, true).length > 0;
  }
  if (mouse) {
    canvas.addEventListener('pointerenter', (e) => { ultimoX = e.clientX; });
    canvas.addEventListener('pointerleave', () => { ultimoX = null; canvas.classList.remove('sul-corpo', 'gira'); });
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || giu) return;
      const sopra = sopraCorpo(e);
      canvas.classList.toggle('sul-corpo', sopra);
      canvas.classList.toggle('gira', !sopra);
      if (!sopra && ultimoX !== null) giro.meta -= (e.clientX - ultimoX) / canvas.clientWidth * Math.PI;
      ultimoX = e.clientX;
    });
  }

  canvas.addEventListener('pointerup', (e) => {
    if (!giu || !modello) return;
    const mosso = Math.hypot(e.clientX - giu[0], e.clientY - giu[1]); giu = null;
    if (mosso > 6) return;
    const r = canvas.getBoundingClientRect();
    p.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(p, camera);
    // i modelli animati vanno rimisurati nella posa attuale prima di colpirli
    modello.traverse((o) => { if (o.isSkinnedMesh) { o.computeBoundingSphere(); o.computeBoundingBox(); } });
    const hit = ray.intersectObject(modello, true)[0];
    if (!hit) return;
    const loc = modello.worldToLocal(hit.point.clone());
    // tocco vicino a una chiazza esistente: la tolgo
    const vicino = punti.findIndex((q) => q.distanceTo(loc) < 0.08);
    if (vicino >= 0) { punti.splice(vicino, 1); }
    else { punti.push(loc); if (punti.length > MAX) punti.shift(); window.apriZona && window.apriZona(zona(perno.worldToLocal(hit.point.clone()))); }
    aggiornaPunti();
  });

  function aggiornaPunti() {
    uN.value = punti.length;
    punti.forEach((q, i) => uPunti.value[i].copy(modello.localToWorld(q.clone())));
  }

  // dalla posizione toccata alla zona della scheda
  function zona(q) {
    const h = q.y / altezza, lato = Math.abs(q.x);
    if (h > 0.70) return 'spalle';
    if (h > 0.58) return lato > 0.2 ? 'spalle' : 'schiena';
    if (h > 0.44) return lato > 0.22 ? 'spalle' : 'anche';
    if (h > 0.16) return 'ginocchia';
    return 'piedi';
  }

  // disegno solo quando la sezione è visibile
  let visibile = false;
  new IntersectionObserver((es) => { visibile = es[0].isIntersecting; }).observe(canvas);
  renderer.setAnimationLoop(() => {
    if (!visibile) return;
    controlli.update();
    if (mixer) mixer.update(orologio.getDelta());
    if (modello && punti.length) aggiornaPunti();
    renderer.render(scena, camera);
  });
}

// carico il 3D solo quando la mappa si avvicina allo schermo
if (canvas) {
  const io = new IntersectionObserver((es) => {
    if (es[0].isIntersecting) { io.disconnect(); avvia(); }
  }, { rootMargin: '400px' });
  io.observe(canvas);
}

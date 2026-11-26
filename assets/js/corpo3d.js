/* Mappa del corpo in 3D: la figura ruota sul suo asse seguendo il cursore (destra/sinistra dello schermo)
   o il dito; dove tocchi compare una chiazza rossa
   e si apre la scheda della zona. Nessun dato salvato o inviato.
   Manichino: Xbot dagli esempi ufficiali di three.js (licenza MIT), caricato dal CDN. */
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

  // rotazione sul proprio asse: segue il cursore da sinistra a destra dello schermo
  const giro = { meta: 0, ora: 0 };
  const mouse = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (mouse && !fermo) {
    addEventListener('pointermove', (e) => {
      giro.meta = (e.clientX / innerWidth - 0.5) * Math.PI * 1.05; // circa da -95° a +95°: guarda verso il cursore
    }, { passive: true });
  }
  const controlli = { update() {
    giro.ora += (giro.meta - giro.ora) * (fermo ? 1 : 0.07);
    if (modello) modello.rotation.y = giro.ora;
  } };

  scena.add(new THREE.AmbientLight(0xffffff, 0.6));
  const luce = new THREE.DirectionalLight(0xffe2b8, 1.4); luce.position.set(2, 3, 3); scena.add(luce);

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
  const orologio = new THREE.Clock();
  new GLTFLoader().load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/models/gltf/Xbot.glb', (g) => {
    modello = g.scene;
    modello.traverse((o) => { if (o.isMesh) { o.material = vetroOro(o.material); o.frustumCulled = false; } });
    // Xbot è alto circa 1,8 m con i piedi a terra (il riquadro dei modelli animati non è affidabile)
    altezza = 1.8;
    // inquadro tutta la figura
    camera.position.set(0, altezza * 0.55, altezza * 2.25);
    camera.lookAt(0, altezza * 0.5, 0);
    // posa a riposo: braccia lungo il corpo e un respiro leggero
    const idle = g.animations.find((a) => /idle/i.test(a.name));
    if (idle) {
      mixer = new THREE.AnimationMixer(modello);
      mixer.clipAction(idle).play();
      mixer.update(0.01);
      if (fermo) mixer.timeScale = 0;
    }
    scena.add(modello);
    figura.classList.add('tre');
  }, undefined, () => {}); // se non si carica resta l'immagine

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
  canvas.addEventListener('pointerdown', (e) => { giu = [e.clientX, e.clientY]; partenza = giro.meta; });
  canvas.addEventListener('pointermove', (e) => {
    if (!giu || e.pointerType === 'mouse') return;
    giro.meta = partenza + (e.clientX - giu[0]) / canvas.clientWidth * Math.PI * 2;
  });
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
    else { punti.push(loc); if (punti.length > MAX) punti.shift(); window.apriZona && window.apriZona(zona(loc)); }
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

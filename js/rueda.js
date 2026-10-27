/* =========================================================
   Agente Nano · la rueda en 3D (Three.js)
   Construye la rueda con piezas simples y expone los modos:
   vista general, transparencia, acercamiento, corte y despiece.
   ========================================================= */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* Tipos de pieza: nombre y descripción corta (se usan en la lista y en las etiquetas) */
export const PIEZAS = [
  { id: 'nucleo',     nombre: 'Núcleo cósmico',          desc: 'Centro de energía: aquí quedó guardada la esfera de luz.' },
  { id: 'soporte',    nombre: 'Soporte con logo',        desc: 'Sostiene la rueda a cada lado y lleva el logo de electricidad.' },
  { id: 'panel',      nombre: 'Panel transparente',      desc: 'Tapa lateral con constelaciones.' },
  { id: 'aro',        nombre: 'Aro de sujeción',         desc: 'Fija cada panel a la rueda.' },
  { id: 'superficie', nombre: 'Superficie de carrera',   desc: 'Pista antideslizante donde corre Nano.' },
  { id: 'estructura', nombre: 'Estructura interna',      desc: 'Radios con conductos que reparten la energía.' },
  { id: 'eje',        nombre: 'Eje de rotación',         desc: 'Une el núcleo con los soportes.' },
  { id: 'rodamiento', nombre: 'Rodamiento de precisión', desc: 'Deja que el eje gire sin fricción.' },
  { id: 'base',       nombre: 'Base con amortiguación',  desc: 'Une los soportes y absorbe la vibración.' }
];
const NOMBRE = Object.fromEntries(PIEZAS.map(p => [p.id, p.nombre]));
const DESC = Object.fromEntries(PIEZAS.map(p => [p.id, p.desc]));

/* Paleta del lenguaje gráfico (ver manual.html) */
const TINTA = 0x0A0518;   // contornos
const PAL = { noche: 0x0A0518, panel: 0x17123A, panel2: 0x211A4D, lavanda: 0xCFC6EF, violeta: 0x7A4DF0, azul: 0x49A6FF, dorado: 0xD2A63F, verde: 0x4DFF8F, rojo: 0xFF3C5F, metal: 0xAEB3C0 };
const C = { claro: 0xb9bdcc, medio: PAL.dorado, interno: PAL.violeta, oscuro: 0x4a4370, logo: PAL.panel, panel: PAL.lavanda, pista: 0x6f6b93 };
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/* Direcciones de cámara (desde el centro de la rueda hacia la cámara) */
const DIR = {
  inicial: V(-0.8, 0.35, 1),
  frente: V(0.02, 0.06, 1),
  lado: V(1, 0.12, 0.02),
  arriba: V(0.08, 1, 0.12),
  explotado: V(0.9, 0.55, 1),
  despiece: V(0.02, 0.8, 1),
  longitudinal: V(1, 0.4, 0.55),
  transversal: V(0.45, 0.4, 1)
};

function texturaRayado() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#211A4D';
  g.fillRect(0, 0, 64, 64);
  g.strokeStyle = '#49A6FF';
  g.lineWidth = 3;
  for (let i = -64; i < 128; i += 12) { g.beginPath(); g.moveTo(i, 64); g.lineTo(i + 64, 0); g.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 5);
  return t;
}

export function crearRueda(contenedor, op = {}) {
  /* ---------- escena ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.localClippingEnabled = true;
  renderer.setClearColor(PAL.noche, 1);
  renderer.domElement.className = 'principal';
  contenedor.prepend(renderer.domElement);

  const escena = new THREE.Scene();
  escena.background = new THREE.Color(PAL.noche);   // así el fondo conserva su color con el brillo activado
  const camara = new THREE.PerspectiveCamera(38, 1, 0.05, 200);
  const controles = new OrbitControls(camara, renderer.domElement);
  controles.enableDamping = true;
  controles.dampingFactor = 0.08;
  controles.minDistance = 0.5;
  controles.maxDistance = 30;

  escena.add(new THREE.HemisphereLight(0xe6e0ff, 0x2a2060, 1.0));
  const luz = new THREE.DirectionalLight(0xffffff, 1.0);
  luz.position.set(-3, 5, 4);
  escena.add(luz);
  const contraluz = new THREE.DirectionalLight(PAL.azul, 0.9);   // borde azul desde atrás
  contraluz.position.set(3, 2, -5);
  escena.add(contraluz);
  const luzNucleo = new THREE.PointLight(PAL.azul, 1.2, 3, 2);   // la energía del núcleo
  luzNucleo.position.set(0, 0, 0.2);
  escena.add(luzNucleo);

  const suelo = new THREE.GridHelper(18, 36, 0x3a3175, 0x1d1745);
  suelo.position.y = -1.32;
  escena.add(suelo);
  // resplandor violeta bajo la rueda
  const cResp = document.createElement('canvas');
  cResp.width = cResp.height = 128;
  const gr = cResp.getContext('2d');
  const grad = gr.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(122,77,240,0.55)'); grad.addColorStop(0.5, 'rgba(73,166,255,0.15)'); grad.addColorStop(1, 'rgba(10,5,24,0)');
  gr.fillStyle = grad; gr.fillRect(0, 0, 128, 128);
  const resplandor = new THREE.Mesh(new THREE.PlaneGeometry(7, 7).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cResp), transparent: true, depthWrite: false }));
  resplandor.position.y = -1.315;
  escena.add(resplandor);
  // estrellas
  let cielo = null;
  {
    const pos = [];
    for (let i = 0; i < 1400; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(35 + Math.random() * 40);
      if (v.y < -6) v.y = -v.y;   // que no queden bajo el piso
      pos.push(v.x, v.y, v.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    cielo = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.18, transparent: true, opacity: 0.85, depthWrite: false }));
    escena.add(cielo);
  }

  /* brillo (bloom): solo lo más luminoso brilla: núcleo, esfera de luz, ojos */
  const destino = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const compositor = new EffectComposer(renderer, destino);
  compositor.addPass(new RenderPass(escena, camara));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.4, 0.9);
  compositor.addPass(bloom);
  compositor.addPass(new OutputPass());

  /* plano de corte compartido por todos los materiales */
  const plano = new THREE.Plane(V(0, 0, -1), 1e5);
  const planos = [plano];
  const rayado = texturaRayado();

  const mallas = [];   // todas las mallas seleccionables
  const lineasExtra = []; // constelaciones y estrías (siguen la opacidad de su pieza)
  const partes = [];   // instancias (soporte izquierdo, soporte derecho, ...)
  const porClave = {};

  function malla(geo, color, o = {}) {
    const mat = new THREE.MeshPhongMaterial({
      color, transparent: true, opacity: o.opacidad ?? 1, clippingPlanes: planos,
      shininess: o.brillo ?? 55, specular: 0x6a6390,
      emissive: o.emisivo ?? 0x000000, emissiveIntensity: o.intensidad ?? 1,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1
    });
    mat.depthWrite = (o.opacidad ?? 1) > 0.95;
    const m = new THREE.Mesh(geo, mat);
    const bordes = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, o.umbral ?? 28),
      new THREE.LineBasicMaterial({ color: TINTA, transparent: true, clippingPlanes: planos })
    );
    m.add(bordes);
    const corteRayado = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: rayado, side: THREE.BackSide, clippingPlanes: planos }));
    corteRayado.visible = false;
    m.add(corteRayado);
    m.userData = { colorBase: color, opBase: o.opacidad ?? 1, bordes, corteRayado };
    return m;
  }
  function lineas(puntos, opacidad = 0.5, color = TINTA) {
    const g = new THREE.BufferGeometry().setFromPoints(puntos);
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: opacidad, clippingPlanes: planos }));
    l.userData.opBase = opacidad;
    return l;
  }
  function parte(tipo, clave, grupo, casa, explotado, etiqueta = true) {
    grupo.position.copy(casa);
    escena.add(grupo);
    const p = {
      tipo, clave, grupo, etiqueta,
      casa: casa.clone(), exp: explotado.clone(), grilla: casa.clone(), objetivo: casa.clone(), giro: 0,
      interno: ['estructura', 'nucleo', 'eje'].includes(tipo), lineas: []
    };
    grupo.traverse(o => {
      if (o.isMesh && o.userData.bordes) { o.userData.parte = p; mallas.push(o); }
      if (o.isLineSegments && o.userData.opBase !== undefined) { o.userData.parte = p; p.lineas.push(o); lineasExtra.push(o); }
    });
    partes.push(p);
    porClave[clave] = p;
    return p;
  }

  /* ---------- piezas ----------
     Rueda de hámster de frente: el eje de giro apunta hacia quien mira (eje Z).
     Adelante queda abierta (aro + panel en forma de anillo) para que Nano entre;
     atrás está el panel con constelaciones, los radios y el núcleo.
     Los dos soportes en A van de perfil a cada costado, con el logo hacia afuera,
     y tocan la rueda con un rodamiento a la altura del centro. */
  const R = 1.0;          // radio de la rueda
  const PROF = 0.35;      // media profundidad del tambor
  const XS = 1.1;         // distancia de cada soporte al centro
  const XB = 1.1, ZB = 0.85; // medidas de la base

  function soporte(lado) {
    const g = new THREE.Group();
    const dentro = new THREE.Group();          // se gira para quedar de perfil con el logo hacia afuera
    dentro.rotation.y = lado * Math.PI / 2;
    g.add(dentro);
    const s = new THREE.Shape();
    s.moveTo(-0.85, -1.22); s.lineTo(0.85, -1.22); s.lineTo(0.14, 0.14);
    s.quadraticCurveTo(0, 0.27, -0.14, 0.14); s.closePath();
    const ventana = new THREE.Path(); ventana.moveTo(0, -0.25); ventana.lineTo(0.55, -1.08); ventana.lineTo(-0.55, -1.08); ventana.closePath(); s.holes.push(ventana);
    const hueco = new THREE.Path(); hueco.absarc(0, 0, 0.06, 0, Math.PI * 2, true); s.holes.push(hueco);
    dentro.add(malla(new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: false, curveSegments: 20 }).translate(0, 0, -0.05), C.claro));
    const tri = new THREE.Shape();
    tri.moveTo(0, -0.27); tri.lineTo(0.54, -1.07); tri.lineTo(-0.54, -1.07); tri.closePath();
    dentro.add(malla(new THREE.ExtrudeGeometry(tri, { depth: 0.04, bevelEnabled: false }).translate(0, 0, -0.02), C.logo));
    const r = new THREE.Shape();
    [[0.06, -0.52], [-0.12, -0.78], [-0.02, -0.78], [-0.08, -0.98], [0.13, -0.69], [0.02, -0.69]].forEach(([a, b], i) => i ? r.lineTo(a, b) : r.moveTo(a, b));
    r.closePath();
    [1, -1].forEach(cara => {
      const rayo = malla(new THREE.ShapeGeometry(r).rotateY(cara < 0 ? Math.PI : 0), PAL.dorado, { emisivo: 0x5a3f0a });
      rayo.position.z = cara * 0.023;
      dentro.add(rayo);
    });
    return g;
  }
  function rodamiento() {
    // perno + rodamiento: une la punta del soporte con el costado de la rueda
    const g = new THREE.Group();
    g.add(malla(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 20).rotateZ(Math.PI / 2), C.oscuro));
    g.add(malla(new THREE.TorusGeometry(0.1, 0.035, 12, 32).rotateY(Math.PI / 2), C.medio));
    return g;
  }
  const ESTRELLAS = [[-0.6, 0.5], [-0.2, 0.72], [0.15, 0.45], [0.55, 0.6], [0.72, 0.15], [0.3, -0.05], [-0.1, 0.1], [-0.5, -0.1], [-0.7, -0.5], [-0.25, -0.55], [0.2, -0.6], [0.6, -0.45], [0, -0.86]];
  const UNIONES = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 2], [5, 6], [6, 7], [7, 0], [7, 8], [8, 9], [9, 6], [9, 10], [10, 11], [11, 4], [10, 5], [9, 12], [10, 12]];
  function panelTrasero() {
    const g = new THREE.Group();
    g.add(malla(new THREE.CylinderGeometry(R, R, 0.025, 72).rotateX(Math.PI / 2), C.panel, { opacidad: 0.3, brillo: 120 }));
    const pts = [];
    UNIONES.forEach(([a, b]) => {
      pts.push(V(ESTRELLAS[a][0] * 0.85, ESTRELLAS[a][1] * 0.85, 0.014));
      pts.push(V(ESTRELLAS[b][0] * 0.85, ESTRELLAS[b][1] * 0.85, 0.014));
    });
    g.add(lineas(pts, 0.9, PAL.azul));
    const estrellas = new THREE.Points(new THREE.BufferGeometry().setFromPoints(ESTRELLAS.map(([x, y]) => V(x * 0.85, y * 0.85, 0.016))),
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, clippingPlanes: planos }));
    g.add(estrellas);
    return g;
  }
  function panelDelantero() {
    // anillo transparente: deja el centro abierto para que Nano entre
    const g = new THREE.Group();
    const perfil = [new THREE.Vector2(0.64, -0.0125), new THREE.Vector2(R, -0.0125), new THREE.Vector2(R, 0.0125), new THREE.Vector2(0.64, 0.0125), new THREE.Vector2(0.64, -0.0125)];
    g.add(malla(new THREE.LatheGeometry(perfil, 72).rotateX(Math.PI / 2), C.panel, { opacidad: 0.3, brillo: 120 }));
    const pts = [];
    let prev = null;
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const rr = i % 2 ? 0.74 : 0.9;
      const p = V(Math.cos(a) * rr, Math.sin(a) * rr, 0.014);
      if (prev) pts.push(prev, p);
      prev = p;
    }
    g.add(lineas(pts, 0.9, PAL.azul));
    return g;
  }
  function aro() {
    const g = new THREE.Group();
    g.add(malla(new THREE.TorusGeometry(R - 0.01, 0.03, 10, 96), C.medio, { brillo: 90, emisivo: 0x2a1c00 }));
    return g;
  }
  function superficie() {
    const g = new THREE.Group();
    const perfil = [new THREE.Vector2(0.93, -PROF), new THREE.Vector2(0.97, -PROF), new THREE.Vector2(0.97, PROF), new THREE.Vector2(0.93, PROF), new THREE.Vector2(0.93, -PROF)];
    g.add(malla(new THREE.LatheGeometry(perfil, 72).rotateX(Math.PI / 2), C.pista));
    const pts = [];
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      pts.push(V(c * 0.973, s * 0.973, -PROF + 0.02), V(c * 0.973, s * 0.973, PROF - 0.02));   // estrías por fuera
      pts.push(V(c * 0.927, s * 0.927, -PROF + 0.02), V(c * 0.927, s * 0.927, PROF - 0.02));   // pista antideslizante por dentro
    }
    g.add(lineas(pts, 0.45));
    return g;
  }
  function estructura() {
    const g = new THREE.Group();
    const energia = { emisivo: 0x2b1670 };
    g.add(malla(new THREE.TorusGeometry(0.9, 0.025, 8, 72), C.interno, energia));
    g.add(malla(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 24).rotateX(Math.PI / 2), C.interno, energia));
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.BoxGeometry(0.05, 0.78, 0.04).translate(0, 0.5, 0).rotateZ(i * Math.PI / 4);
      g.add(malla(geo, C.interno, energia));
      // conducto de energía azul dentro de cada radio
      const conducto = malla(new THREE.BoxGeometry(0.014, 0.6, 0.044).translate(0, 0.52, 0).rotateZ(i * Math.PI / 4), PAL.azul, { emisivo: PAL.azul, intensidad: 0.6, umbral: 80 });
      g.add(conducto);
    }
    return g;
  }
  function nucleo() {
    const g = new THREE.Group();
    g.add(malla(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 40).rotateX(Math.PI / 2), PAL.panel2, { brillo: 100 }));
    const lente = malla(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 40).rotateX(Math.PI / 2), 0xdff0ff, { emisivo: 0x9fd0ff, intensidad: 0.9 });
    lente.position.z = 0.16;
    g.add(lente);
    const anillo = malla(new THREE.TorusGeometry(0.17, 0.02, 8, 40), C.medio, { brillo: 90 });
    anillo.position.z = 0.155;
    g.add(anillo);
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.BoxGeometry(0.07, 0.08, 0.06).translate(0, 0.225, 0).rotateZ(i * Math.PI / 4 + Math.PI / 8);
      g.add(malla(geo, C.interno, { emisivo: 0x2b1670 }));
    }
    return g;
  }
  function eje() {
    // eje corto: del núcleo al panel trasero
    const g = new THREE.Group();
    g.add(malla(new THREE.CylinderGeometry(0.045, 0.045, 0.42, 20).rotateX(Math.PI / 2), PAL.metal, { brillo: 100 }));
    return g;
  }
  function base() {
    const g = new THREE.Group();
    [-ZB, ZB].forEach(z => { const m = malla(new THREE.BoxGeometry(2 * XB + 0.08, 0.06, 0.08), C.claro); m.position.set(0, -1.25, z); g.add(m); });
    [-XB, XB].forEach(x => { const m = malla(new THREE.BoxGeometry(0.08, 0.06, 2 * ZB + 0.08), C.claro); m.position.set(x, -1.25, 0); g.add(m); });
    [-XB, XB].forEach(x => [-ZB, ZB].forEach(z => { const m = malla(new THREE.BoxGeometry(0.18, 0.05, 0.18), PAL.dorado); m.position.set(x, -1.3, z); g.add(m); }));
    return g;
  }

  // la rueda, de adelante hacia atrás
  parte('panel', 'panelF', panelDelantero(), V(0, 0, PROF + 0.02), V(0, 0, 2.8));
  parte('aro', 'aroF', aro(), V(0, 0, PROF + 0.005), V(0, 0, 2.2));
  parte('superficie', 'superficie', superficie(), V(0), V(0, 0, 1.3));
  parte('nucleo', 'nucleo', nucleo(), V(0, 0, -0.15), V(0, 0, 0.4));
  parte('estructura', 'estructura', estructura(), V(0, 0, -0.3), V(0, 0, -0.3));
  parte('aro', 'aroT', aro(), V(0, 0, -PROF - 0.005), V(0, 0, -0.9), false);
  parte('panel', 'panelT', panelTrasero(), V(0, 0, -PROF - 0.02), V(0, 0, -1.4), false);
  parte('eje', 'eje', eje(), V(0, 0, -0.2), V(0, 0, -1.95));
  // a los costados
  parte('rodamiento', 'rodamientoI', rodamiento(), V(-1.03, 0, 0), V(-2.3, 0, 0)).lado = -1;
  parte('rodamiento', 'rodamientoD', rodamiento(), V(1.03, 0, 0), V(2.3, 0, 0), false).lado = 1;
  parte('soporte', 'soporteI', soporte(-1), V(-XS, 0, 0), V(-3.3, 0, 0)).lado = -1;
  parte('soporte', 'soporteD', soporte(1), V(XS, 0, 0), V(3.3, 0, 0), false).lado = 1;
  parte('base', 'base', base(), V(0), V(0, -1.0, 0));

  /* posiciones del despiece ordenado (todas las piezas a la vista en una cuadrícula) */
  const ordenGrilla = ['soporteI', 'panelF', 'aroF', 'superficie', 'estructura', 'nucleo', 'eje', 'rodamientoI', 'rodamientoD', 'aroT', 'panelT', 'soporteD', 'base'];
  ordenGrilla.forEach((k, i) => {
    const col = i % 5, fila = Math.floor(i / 5);
    const p = porClave[k];
    p.grilla.set((col - 2) * 2.9, p.tipo === 'base' ? 0.6 : 0, (fila - 1) * 3.0);
  });

  /* caja de cada pieza en su posición armada (para encuadres y etiquetas) */
  partes.forEach(p => {
    p.caja = new THREE.Box3().setFromObject(p.grupo);
  });
  const cajaArmada = new THREE.Box3();
  partes.forEach(p => cajaArmada.union(p.caja));

  /* ---------- personajes de la historia (solo en la vista general) ----------
     Cada uno guarda un gráfico o un mapa; app.js decide qué se abre. */
  const historia = new THREE.Group();
  escena.add(historia);
  const personajes = {};
  const mallasHist = [];
  const PISO = -1.32;

  function forma(geo, color, o = {}) {
    const mat = o.luz ? new THREE.MeshBasicMaterial({ color, transparent: o.opacidad !== undefined, opacity: o.opacidad ?? 1 })
      : new THREE.MeshPhongMaterial({ color, flatShading: !!o.plano, shininess: o.brillo ?? 30, specular: 0x3a3158, emissive: o.emisivo ?? 0, transparent: o.opacidad !== undefined, opacity: o.opacidad ?? 1 });
    const m = new THREE.Mesh(geo, mat);
    if (o.contorno !== false) {
      const casco = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: TINTA, side: THREE.BackSide }));
      casco.scale.setScalar(o.grosor ?? 1.08);
      m.add(casco);
    }
    if (o.aristas) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, o.aristas), new THREE.LineBasicMaterial({ color: TINTA })));
    return m;
  }
  function en(m, x, y, z, s) {
    m.position.set(x, y, z);
    if (s) Array.isArray(s) ? m.scale.set(...s) : m.scale.setScalar(s);
    return m;
  }
  const esfera = (r = 1, seg = 24) => new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7));
  function trazo(puntos, opacidad = 1, color = TINTA) {
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(puntos), new THREE.LineBasicMaterial({ color, transparent: true, opacity: opacidad }));
    return l;
  }
  function ondita(alto = 0.4, ancho = 0.05, color = PAL.verde) {
    const pts = [];
    for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(V(Math.sin(t * Math.PI * 2.2) * ancho, t * alto, 0)); }
    return trazo(pts, 1, color);
  }

  function hacerNano() {
    const g = new THREE.Group();
    const pelo = 0xd99a5b, claro = 0xf5e3c3, oscuro = 0x1a1030, rosa = 0xef9c9c;
    g.add(en(forma(esfera(), pelo), 0, 0.21, 0, [0.25, 0.21, 0.3]));            // cuerpo
    g.add(en(forma(esfera(), claro, { contorno: false }), 0, 0.17, 0.12, [0.17, 0.14, 0.2])); // barriga
    const cabeza = new THREE.Group();
    cabeza.position.set(0, 0.31, 0.22);
    cabeza.add(forma(esfera(0.16), pelo));
    cabeza.add(en(forma(esfera(), claro, { contorno: false }), 0, -0.04, 0.09, [0.1, 0.08, 0.08]));   // hocico
    [-1, 1].forEach(l => {
      cabeza.add(en(forma(esfera(), pelo), l * 0.1, 0.13, -0.02, [0.06, 0.06, 0.03]));            // orejas
      cabeza.add(en(forma(esfera(0.026, 12), oscuro, { contorno: false }), l * 0.068, 0.04, 0.135)); // ojos
      cabeza.add(en(forma(esfera(0.009, 8), 0xffffff, { luz: true, contorno: false }), l * 0.068 + 0.008, 0.052, 0.157));
      cabeza.add(en(forma(esfera(), rosa, { contorno: false }), l * 0.1, -0.04, 0.09, [0.035, 0.025, 0.02])); // cachetes
    });
    cabeza.add(en(forma(esfera(0.02, 10), 0xd4677a, { contorno: false }), 0, -0.02, 0.17));        // nariz
    g.add(cabeza);
    [[-0.13, 0.17], [0.13, 0.17], [-0.14, -0.15], [0.14, -0.15]].forEach(([x, z]) =>
      g.add(en(forma(esfera(), 0xf2c9a6), x, 0.03, z, [0.06, 0.035, 0.07])));                    // patas
    // pañoleta de agente con el rayo
    g.add(en(forma(new THREE.TorusGeometry(0.15, 0.03, 8, 24), PAL.violeta, { contorno: false, emisivo: 0x1f0f50 }), 0, 0.27, 0.15, [1, 1, 1]).rotateX(Math.PI / 2.4));
    const placa = en(forma(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 16).rotateX(Math.PI / 2), PAL.dorado, { contorno: false, brillo: 90 }), 0, 0.2, 0.28);
    placa.rotation.x = -0.35;
    g.add(placa);   // insignia de agente
    g.userData = { cabeza };
    return g;
  }

  function hacerRata() {
    const g = new THREE.Group();
    const pelo = 0x3b3552, piel = 0xb48a9c;
    g.add(en(forma(esfera(), pelo), 0, 0.2, 0, [0.21, 0.18, 0.36]));                              // cuerpo
    const cabeza = new THREE.Group();
    cabeza.position.set(0, 0.25, 0.32);
    cabeza.add(en(forma(new THREE.ConeGeometry(0.14, 0.34, 20).rotateX(Math.PI / 2), pelo), 0, 0, 0.08));
    cabeza.add(en(forma(esfera(0.035, 10), 0x1c1b22), 0, 0, 0.26));                               // nariz
    [-1, 1].forEach(l => {
      const oreja = en(forma(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 24).rotateX(Math.PI / 2), piel), l * 0.1, 0.13, -0.04);
      oreja.rotation.y = l * 0.35;
      cabeza.add(oreja);
      cabeza.add(en(forma(esfera(0.032, 12), 0xff5a75, { luz: true }), l * 0.065, 0.06, 0.07));     // ojos rojizos que brillan
      const ceja = en(forma(new THREE.BoxGeometry(0.07, 0.016, 0.016), 0x1c1b22, { contorno: false }), l * 0.06, 0.105, 0.075);
      ceja.rotation.z = l * 0.5;                                                                  // cejas enojadas
      cabeza.add(ceja);
      [0.02, -0.01].forEach(dy => cabeza.add(trazo([V(l * 0.04, dy, 0.22), V(l * 0.2, dy + 0.03, 0.2)])));  // bigotes
    });
    const cicatriz = en(forma(new THREE.BoxGeometry(0.014, 0.12, 0.014), 0xe7d3dc, { contorno: false }), 0.065, 0.06, 0.1);
    cicatriz.rotation.z = 0.5;
    cabeza.add(cicatriz);
    g.add(cabeza);
    [[-0.13, 0.17], [0.13, 0.17], [-0.14, -0.17], [0.14, -0.17]].forEach(([x, z]) =>
      g.add(en(forma(esfera(), piel), x, 0.03, z, [0.05, 0.03, 0.07])));
    const cola = new THREE.Group();
    cola.position.set(0, 0.14, -0.33);
    const curva = new THREE.CatmullRomCurve3([V(0, 0, 0), V(0.05, 0.02, -0.2), V(-0.1, 0.12, -0.38), V(0.02, 0.3, -0.48)]);
    cola.add(forma(new THREE.TubeGeometry(curva, 24, 0.016, 6), piel, { contorno: false }));
    cola.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 24, 0.024, 6), new THREE.MeshBasicMaterial({ color: TINTA, side: THREE.BackSide })));
    g.add(cola);
    // frasco con el líquido tóxico
    const frasco = new THREE.Group();
    frasco.position.set(0.36, 0, 0.18);
    frasco.add(en(forma(new THREE.CylinderGeometry(0.075, 0.085, 0.11, 20), PAL.verde, { contorno: false, emisivo: 0x1c8f4a }), 0, 0.06, 0));
    frasco.add(en(forma(new THREE.CylinderGeometry(0.08, 0.09, 0.2, 20), PAL.lavanda, { opacidad: 0.35, brillo: 120 }), 0, 0.1, 0));
    frasco.add(en(forma(new THREE.CylinderGeometry(0.03, 0.035, 0.07, 12), PAL.lavanda, { opacidad: 0.5 }), 0, 0.23, 0));
    const vapor = [];
    [-0.04, 0.02, 0.06].forEach((x, i) => { const o = ondita(0.28, 0.03); o.position.set(x, 0.27, 0); frasco.add(o); vapor.push(o); });
    g.add(frasco);
    g.userData = { cola, vapor };
    return g;
  }

  function hacerTomate() {
    const g = new THREE.Group();
    g.add(en(forma(esfera(1, 28), 0xe5372f, { brillo: 80 }), 0, 0.17, 0, [0.21, 0.17, 0.21]));
    for (let i = 0; i < 5; i++) {
      const h = forma(new THREE.BoxGeometry(0.05, 0.015, 0.13).translate(0, 0, 0.06), 0x3fae5a, { contorno: false });
      h.position.y = 0.335; h.rotation.y = i * Math.PI * 2 / 5; h.rotation.x = -0.25;
      g.add(h);
    }
    g.add(en(forma(new THREE.CylinderGeometry(0.015, 0.02, 0.07, 8), 0x2f7d40, { contorno: false }), 0, 0.37, 0));
    // brillo
    g.add(en(forma(esfera(), 0xffd6d0, { contorno: false }), -0.09, 0.24, 0.13, [0.03, 0.05, 0.02]));
    const aroma = [];
    [-0.12, 0, 0.12].forEach(x => { const o = ondita(0.42, 0.045); o.position.set(x, 0.45, 0); g.add(o); aroma.push(o); });
    g.userData = { aroma };
    return g;
  }

  function hacerLuz() {
    const g = new THREE.Group();
    g.add(forma(esfera(0.17, 32), 0xffffff, { luz: true, grosor: 1.1 }));
    g.add(forma(esfera(0.24, 24), PAL.azul, { luz: true, contorno: false, opacidad: 0.22 }));   // halo
    const anillo = forma(new THREE.TorusGeometry(0.27, 0.014, 8, 64), PAL.dorado, { contorno: false, emisivo: 0x4a3508 });
    anillo.rotation.x = 1.2;
    g.add(anillo);
    const rayos = new THREE.Group();
    const pts = [];
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2, r1 = 0.33, r2 = i % 2 ? 0.43 : 0.5;
      pts.push(V(Math.cos(a) * r1, Math.sin(a) * r1, 0), V(Math.cos(a) * r2, Math.sin(a) * r2, 0));
    }
    rayos.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: PAL.azul })));
    g.add(rayos);
    g.userData = { rayos };
    return g;
  }

  function hacerArbol() {
    const g = new THREE.Group();
    g.add(en(forma(new THREE.CylinderGeometry(0.06, 0.1, 0.8, 10), 0x7a5236, { contorno: false, aristas: 40 }), 0, 0.4, 0));
    const copa = new THREE.Group();
    [[0, 1.0, 0, 0.42], [-0.22, 0.82, 0.1, 0.3], [0.24, 0.86, -0.05, 0.32], [0.05, 1.3, 0.02, 0.28]].forEach(([x, y, z, r]) =>
      copa.add(en(forma(new THREE.IcosahedronGeometry(r, 0), [0x3fae5a, 0x2f8f4a, 0x4cc06a, 0x37a052][Math.round(r * 100) % 4], { plano: true, contorno: false, aristas: 1 }), x, y, z)));
    g.add(copa);
    g.userData = { copa };
    return g;
  }

  function registrar(id, hacer, x, z, giro, alto, y = PISO, escala = 1) {
    const sosten = new THREE.Group();
    sosten.position.set(x, y, z);
    sosten.rotation.y = giro;
    const tam = new THREE.Group();
    tam.scale.setScalar(escala);
    const anim = hacer();
    tam.add(anim);
    sosten.add(tam);
    alto *= escala;
    historia.add(sosten);
    const pj = { id, sosten, anim, alto, hover: 0, toque: -10, partes: anim.userData };
    sosten.traverse(o => { if (o.isMesh) { o.userData.pj = pj; mallasHist.push(o); } });
    personajes[id] = pj;
  }
  registrar('nano', hacerNano, -1.55, 1.35, -0.35, 0.56, PISO, 1.1);
  registrar('rata', hacerRata, 2.55, -0.45, -0.8, 0.56, PISO, 1.3);
  registrar('tomate', hacerTomate, -0.05, 1.95, 0, 0.56);
  registrar('luz', hacerLuz, 0, 0.45, 0, 0.62, 1.55);
  registrar('arbol', hacerArbol, -2.75, -0.85, 0, 1.7);
  const cajaEscena = cajaArmada.clone().union(new THREE.Box3().setFromObject(historia));
  const cajaGeneral = () => (historia.visible ? cajaEscena : cajaArmada);

  function animarPersonajes(t) {
    for (const pj of Object.values(personajes)) {
      const meta = est.hoverPj === pj.id ? 1 : 0;
      pj.hover += (meta - pj.hover) * 0.15;
      pj.sosten.scale.setScalar(1 + 0.12 * pj.hover);
      const a = pj.anim, P = pj.partes;
      a.position.set(0, 0, 0); a.rotation.set(0, 0, 0); a.scale.set(1, 1, 1);
      const d = t - pj.toque;             // tiempo desde el clic
      const k = d >= 0 && d < 0.9 ? d / 0.9 : -1;
      switch (pj.id) {
        case 'nano':
          a.scale.y = 1 + 0.03 * Math.sin(t * 3);
          P.cabeza.rotation.y = 0.35 * Math.sin(t * 0.8);
          if (k >= 0) { a.position.y = Math.sin(Math.PI * Math.min(k / 0.7, 1)) * 0.4; a.rotation.y = Math.min(k / 0.7, 1) * Math.PI * 2; }
          break;
        case 'rata':
          P.cola.rotation.y = 0.45 * Math.sin(t * 2.2);
          a.rotation.y = 0.12 * Math.sin(t * 1.3);
          P.vapor.forEach((o, i) => { const f = (t * 0.35 + i / 3) % 1; o.position.y = 0.27 + f * 0.15; o.material.opacity = Math.sin(Math.PI * f); });
          if (k >= 0) {
            if (k < 0.25) { const q = Math.sin(Math.PI * k / 0.25 / 2); a.scale.set(1 + 0.45 * q, 1 - 0.6 * q, 1 + 0.3 * q); }
            else { const q = (k - 0.25) / 0.75; a.position.y = Math.sin(Math.PI * q) * 0.55; a.rotation.y = q * Math.PI * 4; a.rotation.z = Math.sin(Math.PI * q) * 0.6; }
          }
          break;
        case 'tomate': {
          const vel = k >= 0 ? 1.4 : 0.3;
          P.aroma.forEach((o, i) => { const f = (t * vel + i / 3) % 1; o.position.y = 0.4 + f * 0.25; o.material.opacity = Math.sin(Math.PI * f); o.scale.y = k >= 0 ? 1.4 : 1; });
          if (k >= 0) { a.position.y = Math.abs(Math.sin(k * Math.PI * 3)) * 0.22 * (1 - k); a.scale.set(1 + 0.08 * Math.sin(k * 20) * (1 - k), 1, 1); }
          break;
        }
        case 'luz':
          a.position.y = 0.07 * Math.sin(t * 1.6);
          a.rotation.y = t * 0.5;
          P.rayos.scale.setScalar(1 + 0.08 * Math.sin(t * 4));
          P.rayos.lookAt(camara.position);
          P.rayos.rotation.z = t * 0.4;
          if (k >= 0) { const q = Math.sin(Math.PI * k); a.scale.setScalar(1 + 0.7 * q); P.rayos.scale.setScalar(1 + 1.2 * q); }
          break;
        case 'arbol':
          a.rotation.z = 0.02 * Math.sin(t * 0.9);
          if (k >= 0) { a.rotation.z = 0.18 * Math.sin(k * 28) * (1 - k); P.copa.position.y = Math.abs(Math.sin(k * 20)) * 0.04 * (1 - k); }
          break;
      }
    }
  }
  const reloj = new THREE.Clock();
  const ancla = V();
  function proyectarPersonajes(w, h) {
    if (!op.alProyectar) return;
    if (!historia.visible) { op.alProyectar(null); return; }
    const lista = Object.values(personajes).map(pj => {
      ancla.copy(pj.sosten.position);
      ancla.y += pj.alto;   // el pin queda quieto aunque el personaje se mueva, para que sea fácil tocarlo
      ancla.project(camara);
      return { id: pj.id, x: (ancla.x + 1) / 2 * w, y: (1 - ancla.y) / 2 * h, visible: ancla.z < 1 };
    });
    op.alProyectar(lista);
  }

  /* plano visible del corte */
  const planoVista = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 2.9),
    new THREE.MeshBasicMaterial({ color: PAL.azul, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false })
  );
  planoVista.add(new THREE.LineSegments(new THREE.EdgesGeometry(planoVista.geometry), new THREE.LineBasicMaterial({ color: PAL.azul })));
  planoVista.visible = false;
  escena.add(planoVista);

  /* caja de resaltado para el acercamiento */
  const resalte = new THREE.BoxHelper(undefined, PAL.azul);
  resalte.visible = false;
  escena.add(resalte);

  /* ---------- estado ---------- */
  const est = {
    modo: 'general', transp: 65, resaltar: true, foco: 'nucleo', zoom: 3,
    corte: 'longitudinal', posCorte: 0.5, rayado: true,
    despiece: 'explotado', sep: 1, camMeta: null,
    verHistoria: true, hoverPj: null
  };
  const actualizarHistoria = () => { historia.visible = est.modo === 'general' && est.verHistoria; if (!historia.visible) est.hoverPj = null; };

  /* ---------- cámara ---------- */
  function encuadrar(caja, dir, margen = 1.15, inmediato = false) {
    const esfera = caja.getBoundingSphere(new THREE.Sphere());
    const fov = THREE.MathUtils.degToRad(camara.fov);
    let dist = esfera.radius / Math.sin(fov / 2) * margen;
    if (camara.aspect < 1) dist /= Math.max(camara.aspect, 0.45);
    const pos = esfera.center.clone().add(dir.clone().normalize().multiplyScalar(dist));
    if (inmediato) { camara.position.copy(pos); controles.target.copy(esfera.center); est.camMeta = null; }
    else est.camMeta = { pos, target: esfera.center.clone() };
  }
  function dirActual() { return camara.position.clone().sub(controles.target).normalize(); }
  controles.addEventListener('start', () => { est.camMeta = null; });

  function cajaObjetivo() {
    const b = new THREE.Box3();
    partes.forEach(p => {
      const d = p.objetivo.clone().sub(p.casa);
      b.union(p.caja.clone().translate(d));
    });
    return b;
  }

  /* ---------- apariencia según el modo ---------- */
  function aplicar() {
    const cortando = est.modo === 'corte';
    for (const m of mallas) {
      const p = m.userData.parte;
      let opac = m.userData.opBase;
      let color = m.userData.colorBase;
      if (est.modo === 'transparencia') {
        if (!p.interno) opac = Math.min(opac, Math.max(0.04, 1 - est.transp / 100));
        else if (est.resaltar) color = PAL.azul;
      }
      if (est.modo === 'acercamiento' && p.tipo !== est.foco) opac = Math.min(opac, 0.1);
      if (cortando && m.userData.opBase < 1) opac = 0.55;
      m.material.opacity = opac;
      m.material.depthWrite = opac > 0.95;
      m.material.color.setHex(color);
      m.userData.bordes.material.opacity = Math.max(opac, 0.12);
      m.userData.corteRayado.visible = cortando && est.rayado;
    }
    for (const l of lineasExtra) {
      const p = l.userData.parte;
      let opac = l.userData.opBase;
      if (est.modo === 'transparencia' && !p.interno) opac *= Math.max(0.15, 1 - est.transp / 100);
      if (est.modo === 'acercamiento' && p.tipo !== est.foco) opac = 0.05;
      l.material.opacity = opac;
    }
  }

  function aplicarCorte() {
    if (est.modo !== 'corte') { plano.constant = 1e5; planoVista.visible = false; return; }
    if (est.corte === 'longitudinal') {
      const c = THREE.MathUtils.lerp(-1.3, 1.3, est.posCorte);
      plano.normal.set(-1, 0, 0); plano.constant = c;
      planoVista.rotation.set(0, Math.PI / 2, 0); planoVista.position.set(c, -0.1, 0);
    } else {
      const c = THREE.MathUtils.lerp(-0.6, 0.6, est.posCorte);
      plano.normal.set(0, 0, -1); plano.constant = c;
      planoVista.rotation.set(0, 0, 0); planoVista.position.set(0, -0.1, c);
    }
    planoVista.visible = true;
  }

  function objetivosDespiece() {
    partes.forEach(p => {
      if (est.modo !== 'despiece') { p.objetivo.copy(p.casa); p.giro = 0; return; }
      const meta = est.despiece === 'explotado' ? p.exp : p.grilla;
      p.objetivo.copy(p.casa).lerp(meta, est.sep);
      p.giro = est.despiece === 'despiece' && p.lado ? -p.lado * Math.PI / 2 * est.sep : 0;
    });
  }

  function enfocar(inmediato = false) {
    const p = partes.find(x => x.tipo === est.foco);
    if (!p) return;
    const caja = new THREE.Box3().setFromObject(p.grupo);
    resalte.setFromObject(p.grupo);
    const factor = THREE.MathUtils.mapLinear(est.zoom, 1, 5, 2.4, 0.95);
    let dir = dirActual();
    if (p.tipo === 'panel' || p.tipo === 'nucleo' || p.tipo === 'estructura' || p.tipo === 'soporte') dir = V(0.45, 0.32, 1);
    if (p.tipo === 'soporte' || p.tipo === 'rodamiento') dir = V(-1, 0.35, 0.45);
    if (p.tipo === 'eje') dir = V(0.9, 0.5, 0.6);
    encuadrar(caja, dir, factor, inmediato);
  }

  /* ---------- etiquetas ---------- */
  const capa = op.etiquetas;
  const spans = new Map();
  partes.filter(p => p.etiqueta).forEach(p => {
    const s = document.createElement('span');
    s.textContent = NOMBRE[p.tipo];
    s.style.display = 'none';
    capa && capa.appendChild(s);
    spans.set(p, s);
  });
  const tmp = V();
  function actualizarEtiquetas(w, h) {
    const mostrar = est.modo === 'despiece' && est.sep > 0.55;
    let i = 0;
    spans.forEach((s, p) => {
      if (!mostrar) { s.style.display = 'none'; return; }
      const d = p.grupo.position.clone().sub(p.casa);
      const c = p.caja.getCenter(V()).add(d);
      const abajo = est.despiece === 'explotado' && (i++ % 2 === 1) && p.tipo !== 'base';
      tmp.set(c.x, (abajo ? p.caja.min.y - 0.08 : p.caja.max.y + 0.08) + d.y, c.z).project(camara);
      s.style.transform = abajo ? 'translate(-50%, 0)' : 'translate(-50%, -100%)';
      if (tmp.z > 1) { s.style.display = 'none'; return; }
      s.style.display = 'block';
      s.style.left = ((tmp.x + 1) / 2 * w) + 'px';
      s.style.top = ((1 - tmp.y) / 2 * h) + 'px';
    });
  }

  /* ---------- selección con el mouse ---------- */
  const ray = new THREE.Raycaster();
  const puntero = new THREE.Vector2();
  function piezaEn(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    puntero.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(puntero, camara);
    const visibles = mallas.filter(m => m.material.opacity > 0.2);
    const hits = ray.intersectObjects(visibles, false).filter(h => !(plano.constant < 1e4 && plano.distanceToPoint(h.point) < 0));
    return hits.length ? hits[0].object.userData.parte : null;
  }
  function personajeEn(ev) {
    if (!historia.visible) return null;
    const r = renderer.domElement.getBoundingClientRect();
    puntero.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(puntero, camara);
    const hits = ray.intersectObjects(mallasHist, false);
    return hits.length ? hits[0].object.userData.pj.id : null;
  }
  let abajo = null;
  renderer.domElement.addEventListener('pointerdown', e => { abajo = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener('pointerup', e => {
    if (!abajo) return;
    const movido = Math.hypot(e.clientX - abajo.x, e.clientY - abajo.y);
    abajo = null;
    if (movido > 5) return;
    const pj = personajeEn(e);
    if (pj) { op.alTocarPersonaje && op.alTocarPersonaje(pj); return; }
    const p = piezaEn(e);
    if (p && op.alElegir) op.alElegir(p.tipo);
  });
  renderer.domElement.addEventListener('pointermove', e => {
    if (e.buttons) { op.alPasar && op.alPasar(null); return; }
    const r = renderer.domElement.getBoundingClientRect();
    const pj = personajeEn(e);
    if (pj !== est.hoverPj || pj) op.alPasarPersonaje && op.alPasarPersonaje(pj);
    est.hoverPj = pj;
    if (pj) { op.alPasar && op.alPasar(null); renderer.domElement.style.cursor = 'pointer'; return; }
    const p = piezaEn(e);
    op.alPasar && op.alPasar(p ? { nombre: NOMBRE[p.tipo], desc: DESC[p.tipo] } : null, e.clientX - r.left, e.clientY - r.top);
    renderer.domElement.style.cursor = p ? 'pointer' : 'grab';
  });
  renderer.domElement.addEventListener('pointerleave', () => {
    op.alPasar && op.alPasar(null);
    if (est.hoverPj) { est.hoverPj = null; op.alPasarPersonaje && op.alPasarPersonaje(null); }
  });

  /* ---------- mini vista "Dónde estás" ---------- */
  let mini = null;
  if (op.miniCanvas) {
    const r2 = new THREE.WebGLRenderer({ canvas: op.miniCanvas, antialias: true });
    r2.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r2.setSize(190, 130, false);
    r2.setClearColor(PAL.panel, 1);
    r2.autoClear = false;
    const cam2 = new THREE.PerspectiveCamera(38, 190 / 130, 0.05, 100);
    const esf = cajaArmada.getBoundingSphere(new THREE.Sphere());
    cam2.position.copy(esf.center).add(DIR.inicial.clone().normalize().multiplyScalar(esf.radius / Math.sin(THREE.MathUtils.degToRad(19)) * 1.05));
    cam2.lookAt(esf.center);
    const gris = new THREE.MeshBasicMaterial({ color: 0x3a3175 });
    const escenaCaja = new THREE.Scene();
    const cajaMini = new THREE.BoxHelper(undefined, PAL.azul);
    escenaCaja.add(cajaMini);
    mini = { r2, cam2, gris, escenaCaja, cajaMini };
  }

  /* ---------- tamaño ---------- */
  function ajustar() {
    const w = contenedor.clientWidth, h = contenedor.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    compositor.setPixelRatio(renderer.getPixelRatio());
    compositor.setSize(w, h);
    const antes = camara.aspect;
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
    // si cambia mucho la forma del visor (girar el celular), volver a encuadrar la vista general
    if (listo && est.modo === 'general' && Math.abs(Math.log(camara.aspect / antes)) > 0.2) encuadrar(cajaGeneral(), dirActual(), 0.92, true);
  }
  let listo = false;
  new ResizeObserver(ajustar).observe(contenedor);
  ajustar();
  actualizarHistoria();
  encuadrar(cajaGeneral(), DIR.inicial, 0.92, true);
  listo = true;

  /* ---------- bucle ---------- */
  function cuadro() {
    requestAnimationFrame(cuadro);
    if (!contenedor.offsetParent) return; // pantalla oculta: no dibujar
    partes.forEach(p => { p.grupo.position.lerp(p.objetivo, 0.12); p.grupo.rotation.y += (p.giro - p.grupo.rotation.y) * 0.12; });
    if (est.camMeta) {
      camara.position.lerp(est.camMeta.pos, 0.12);
      controles.target.lerp(est.camMeta.target, 0.12);
      if (camara.position.distanceTo(est.camMeta.pos) < 0.002) est.camMeta = null;
    }
    controles.update();
    if (historia.visible) animarPersonajes(reloj.getElapsedTime());
    luzNucleo.intensity = 1.2 + 0.4 * Math.sin(reloj.getElapsedTime() * 2.2);   // el núcleo late
    compositor.render();
    actualizarEtiquetas(contenedor.clientWidth, contenedor.clientHeight);
    proyectarPersonajes(contenedor.clientWidth, contenedor.clientHeight);
    if (mini && est.modo === 'acercamiento') {
      mini.r2.clear();
      escena.overrideMaterial = mini.gris;
      const vis = [resalte.visible, planoVista.visible];
      resalte.visible = false; planoVista.visible = false; historia.visible = false;
      cielo.visible = false; resplandor.visible = false; suelo.visible = false;
      mini.r2.render(escena, mini.cam2);
      escena.overrideMaterial = null;
      [resalte.visible, planoVista.visible] = vis;
      cielo.visible = resplandor.visible = suelo.visible = true;
      actualizarHistoria();
      const p = partes.find(x => x.tipo === est.foco);
      if (p) mini.cajaMini.setFromObject(p.grupo);
      mini.r2.clearDepth();
      mini.r2.render(mini.escenaCaja, mini.cam2);
    }
  }
  cuadro();

  /* ---------- API ---------- */
  const api = {
    piezas: PIEZAS,
    modo(m) {
      const antes = est.modo;
      est.modo = m;
      actualizarHistoria();
      bloom.strength = m === 'acercamiento' ? 0.25 : m === 'corte' ? 0.45 : 0.6;   // de cerca, el núcleo no encandila
      resalte.visible = m === 'acercamiento';
      objetivosDespiece();
      aplicarCorte();
      aplicar();
      if (m === 'acercamiento') enfocar();
      else if (m === 'despiece') encuadrar(cajaObjetivo(), est.despiece === 'explotado' ? DIR.explotado : DIR.despiece, est.despiece === 'explotado' ? 0.82 : 0.95);
      else if (m === 'corte') encuadrar(cajaArmada, est.corte === 'transversal' ? DIR.transversal : DIR.longitudinal, 1.12);
      else if (m === 'general') { if (antes !== 'general') encuadrar(cajaGeneral(), DIR.inicial, 0.92); }
      else if (antes === 'acercamiento' || antes === 'despiece' || antes === 'corte') encuadrar(cajaArmada, DIR.inicial, 1.12);
      else if (antes === 'general' && est.verHistoria) encuadrar(cajaArmada, dirActual(), 1.12);   // sin personajes: acercarse a la rueda
    },
    vista(nombre) { encuadrar(est.modo === 'general' ? cajaGeneral() : cajaArmada, DIR[nombre] || DIR.inicial, est.modo === 'general' ? 0.92 : 1.12); },
    historia(b) { est.verHistoria = b; actualizarHistoria(); if (est.modo === 'general') encuadrar(cajaGeneral(), dirActual(), b ? 0.92 : 1.12); },
    tocar(id) { const pj = personajes[id]; if (pj) pj.toque = reloj.getElapsedTime(); },
    resaltarPersonaje(id) { est.hoverPj = id; },
    transparencia(v) { est.transp = v; aplicar(); },
    resaltarInternas(b) { est.resaltar = b; aplicar(); },
    foco(tipo) { est.foco = tipo; aplicar(); if (est.modo === 'acercamiento') enfocar(); },
    zoom(z) { est.zoom = z; if (est.modo === 'acercamiento') enfocar(); },
    corte(tipo, pos) {
      const cambio = tipo !== est.corte;
      est.corte = tipo; est.posCorte = pos; aplicarCorte();
      if (cambio && est.modo === 'corte') encuadrar(cajaArmada, tipo === 'transversal' ? DIR.transversal : DIR.longitudinal, 1.12);
    },
    rayado(b) { est.rayado = b; aplicar(); },
    despiece(tipo, sep) {
      const cambio = tipo !== est.despiece;
      est.despiece = tipo; est.sep = sep; objetivosDespiece();
      if (est.modo === 'despiece' && (cambio || sep === 1 || sep === 0)) encuadrar(cajaObjetivo(), tipo === 'explotado' ? DIR.explotado : DIR.despiece, tipo === 'explotado' ? 0.82 : 0.95);
    },
    estado: est
  };
  return api;
}

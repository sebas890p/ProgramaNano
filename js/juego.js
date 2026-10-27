/* =========================================================
   Agente Nano · minijuego "Recarga cósmica"
   Nano corre en su rueda: solo cuando va muy rápido la energía
   cósmica lo cura y le devuelve los poderes. A toda velocidad
   aparecen tornillos sueltos que hay que saltar.

   PC:      ← → (o A, D) para correr · Espacio (o ↑, W) para saltar
   Celular: botón Correr (o tocar la rueda) · botón ¡Saltar!
   ========================================================= */

const PAL = {
  noche: '#0A0518', panel: '#17123A', panel2: '#211A4D', lavanda: '#CFC6EF', violeta: '#7A4DF0',
  azul: '#49A6FF', dorado: '#D2A63F', verde: '#4DFF8F', rojo: '#FF3C5F', metal: '#AEB3C0'
};

/* Ajustes de dificultad */
const DURACION = 35;          // segundos hasta el amanecer
const IMPULSO = 0.11;         // velocidad que suma cada paso
const FRENADO = 0.9;          // qué tan rápido se frena Nano solo
const ZONA_CARGA = 0.5;       // desde aquí la energía sube
const ZONA_RAPIDO = 0.7;      // desde aquí aparecen tornillos
const CARGA_MAX = 0.11;       // energía por segundo a velocidad máxima
const AVISO_TORNILLO = 1.45;  // segundos desde que aparece el tornillo hasta que llega
const AIRE = 0.62;            // segundos que dura un salto

const HITOS = [
  { e: 0.4, txt: '¡Heridas curadas!' },
  { e: 0.6, txt: '👃 Súper olfato recargado' },
  { e: 0.8, txt: '⚡ Hipervelocidad recargada' },
  { e: 1.0, txt: '💪 Superfuerza recargada' }
];

const ESTRELLAS = [[-0.6, 0.5], [-0.2, 0.72], [0.15, 0.45], [0.55, 0.6], [0.72, 0.15], [0.3, -0.05], [-0.1, 0.1], [-0.5, -0.1], [-0.7, -0.5], [-0.25, -0.55], [0.2, -0.6], [0.6, -0.45]];

export function crearJuego(raiz, op = {}) {
  const $ = s => raiz.querySelector(s);
  const lienzo = $('.juego-lienzo');
  const ctx = lienzo.getContext('2d');
  const sonar = op.sonar || (() => {});
  const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w = 0, h = 0, dpr = 1;
  function ajustar() {
    const r = lienzo.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    lienzo.width = Math.max(1, Math.round(w * dpr));
    lienzo.height = Math.max(1, Math.round(h * dpr));
  }
  new ResizeObserver(ajustar).observe(lienzo);
  ajustar();

  /* ---------- récord (solo en este navegador) ---------- */
  const CLAVE = 'agente-nano-recarga-record';
  function leerRecord() { try { const v = Number(localStorage.getItem(CLAVE)); return v > 0 ? v : null; } catch (e) { return null; } }
  function guardarRecord(v) { try { localStorage.setItem(CLAVE, String(v)); } catch (e) { /* sin almacenamiento */ } }

  /* ---------- estado ---------- */
  let est;
  function reiniciar() {
    est = {
      fase: 'intro', v: 0, energia: 0, tiempo: DURACION, theta: 0, pata: 0,
      salto: 0, tropiezo: 0, obst: null, proxObst: 1.2, cuenta: 0, temblor: 0,
      hito: 0, pasos: 0, saltosOk: 0, tropiezos: 0, chispas: [], reloj: 0
    };
    pintarHUD();
  }

  /* ---------- acciones ---------- */
  function correr() {
    if (est.fase !== 'jugando' || est.tropiezo > 0) return;
    est.v = Math.min(1, est.v + IMPULSO * (1 - est.v * 0.25));
    est.pasos++;
    if (est.pasos % 2) sonar(260 + est.v * 420, 0.03, 'triangle');
    pulsar('#j-correr');
  }
  function saltar() {
    if (est.fase !== 'jugando' || est.salto > 0 || est.tropiezo > 0) return;
    est.salto = AIRE;
    sonar(620, 0.14, 'sine');
    pulsar('#j-saltar');
  }
  function pulsar(sel) {
    const b = $(sel);
    b.classList.remove('pulso'); void b.offsetWidth; b.classList.add('pulso');
  }

  function aviso(texto, tipo = '', dur = 1.1) {
    const el = $('#j-aviso');
    el.textContent = texto;
    el.className = 'juego-aviso ver ' + tipo;
    el.style.animationDuration = dur + 's';
    void el.offsetWidth;
  }

  function empezar() {
    reiniciar();
    $('#j-intro').hidden = true;
    $('#j-fin').hidden = true;
    est.fase = 'cuenta';
    est.cuenta = 3.6;
    lienzo.focus({ preventScroll: true });
  }

  function terminar(gano) {
    est.fase = 'fin';
    est.obst = null;
    $('#j-saltar').classList.remove('alerta');
    const usado = DURACION - est.tiempo;
    const fin = $('#j-fin');
    let recordTxt = '';
    if (gano) {
      sonar(523, 0.12, 'triangle'); setTimeout(() => sonar(659, 0.12, 'triangle'), 120); setTimeout(() => sonar(880, 0.25, 'triangle'), 240);
      const antes = leerRecord();
      const nuevo = !antes || usado < antes;
      if (nuevo) guardarRecord(usado);
      recordTxt = nuevo ? '<p class="record nuevo">★ ¡Nuevo récord!</p>' : `<p class="record">Tu récord: ${antes.toFixed(1)} s</p>`;
    } else {
      sonar(220, 0.3, 'sawtooth');
      const r = leerRecord();
      if (r) recordTxt = `<p class="record">Tu récord: ${r.toFixed(1)} s</p>`;
    }
    fin.querySelector('.tarjeta-juego').innerHTML = gano
      ? `<span class="sobre">MISIÓN CUMPLIDA</span>
         <h2>¡Nano está curado!</h2>
         <p>La energía cósmica cerró sus heridas y recargó sus tres poderes en <b>${usado.toFixed(1)} segundos</b>. Ya puede volver al parque a detener a la banda de ratones.</p>
         <div class="stats"><span><b>${est.saltosOk}</b> saltos</span><span><b>${est.tropiezos}</b> tropiezos</span><span><b>${est.pasos}</b> pasos</span></div>
         ${recordTxt}
         <div class="acciones"><button class="btn primary grande" type="button" data-accion="otra">Jugar otra vez</button><a class="btn" href="#/artefacto/general">Volver a la rueda</a></div>`
      : `<span class="sobre">SE ACABÓ LA NOCHE</span>
         <h2>Nano necesita más energía</h2>
         <p>Llegó a <b>${Math.round(est.energia * 100)}%</b>. La energía solo sube cuando Nano va en la <b>zona de carga</b>: ¡corre más rápido y no te tropieces!</p>
         <div class="stats"><span><b>${est.saltosOk}</b> saltos</span><span><b>${est.tropiezos}</b> tropiezos</span><span><b>${est.pasos}</b> pasos</span></div>
         ${recordTxt}
         <div class="acciones"><button class="btn primary grande" type="button" data-accion="otra">Intentar otra vez</button><a class="btn" href="#/artefacto/general">Volver a la rueda</a></div>`;
    fin.hidden = false;
    fin.querySelector('[data-accion="otra"]').addEventListener('click', empezar);
    fin.querySelector('[data-accion="otra"]').focus({ preventScroll: true });
  }

  /* ---------- lógica por cuadro ---------- */
  function actualizar(dt) {
    est.reloj += dt;
    if (est.fase === 'cuenta') {
      const antes = Math.ceil(est.cuenta - 0.6);
      est.cuenta -= dt;
      const ahora = Math.ceil(est.cuenta - 0.6);
      if (ahora !== antes) {
        if (ahora > 0) { aviso(String(ahora), 'cuenta', 0.6); sonar(440, 0.1, 'sine'); }
        else { aviso('¡Corre!', 'cuenta', 0.8); sonar(880, 0.18, 'sine'); }
      }
      if (est.cuenta <= 0) est.fase = 'jugando';
      return;
    }
    if (est.fase !== 'jugando') {
      est.v *= Math.exp(-2 * dt);
      est.theta += est.v * dt * 9;
      est.pata += est.v * dt * 26;
      return;
    }

    // velocidad
    est.v *= Math.exp(-FRENADO * dt);
    if (est.tropiezo > 0) { est.tropiezo -= dt; est.v = Math.min(est.v, 0.12); }
    est.theta += est.v * dt * 9;
    est.pata += (0.2 + est.v) * dt * 26;
    if (est.salto > 0) est.salto = Math.max(0, est.salto - dt);
    if (est.temblor > 0) est.temblor = Math.max(0, est.temblor - dt);

    // energía
    if (est.v >= ZONA_CARGA) est.energia += CARGA_MAX * (est.v - ZONA_CARGA) / (1 - ZONA_CARGA) * dt;
    else if (est.v < 0.3) est.energia -= 0.012 * dt;
    est.energia = Math.min(1, Math.max(0, est.energia));
    while (est.hito < HITOS.length && est.energia >= HITOS[est.hito].e - 1e-6) {
      aviso(HITOS[est.hito].txt, 'bueno', 1.4);
      sonar(780 + est.hito * 120, 0.16, 'triangle');
      for (let i = 0; i < 26; i++) chispa(PAL.dorado);
      est.hito++;
    }
    if (est.energia >= 1) { terminar(true); return; }

    // tornillos: solo aparecen cuando Nano va muy rápido
    if (!est.obst && est.v > ZONA_RAPIDO && est.tropiezo <= 0) {
      est.proxObst -= dt;
      if (est.proxObst <= 0) {
        est.obst = { t: 0, T: AVISO_TORNILLO };
        $('#j-saltar').classList.add('alerta');
        sonar(980, 0.08, 'square');
      }
    }
    if (est.obst) {
      est.obst.t += dt;
      if (est.obst.t >= est.obst.T) {
        if (est.salto > 0) {
          est.saltosOk++;
          est.energia = Math.min(1, est.energia + 0.03);
          aviso('¡Buen salto!', 'bueno', 0.9);
          for (let i = 0; i < 14; i++) chispa(PAL.azul);
        } else {
          est.tropiezos++;
          est.tropiezo = 0.9;
          est.v = 0.1;
          est.energia = Math.max(0, est.energia - 0.08);
          est.temblor = movimientoReducido ? 0 : 0.45;
          aviso('¡Nano se tropezó!', 'malo', 1.1);
          sonar(150, 0.25, 'sawtooth');
        }
        est.obst = null;
        est.proxObst = 1.6 + Math.random() * 2.4;
        $('#j-saltar').classList.remove('alerta');
      }
    }

    // tiempo
    est.tiempo -= dt;
    if (est.tiempo <= 0) { est.tiempo = 0; terminar(false); }
  }

  function chispa(color) {
    est.chispas.push({ a: Math.random() * Math.PI * 2, r: 0, vr: 0.6 + Math.random() * 1.2, vida: 1, color });
  }

  /* ---------- HUD ---------- */
  const hud = {
    salud: $('#j-salud'), vel: $('#j-vel'), tiempo: $('#j-tiempo'), noche: $('#j-noche'), pct: $('#j-pct'),
    poderes: [...raiz.querySelectorAll('.poder')]
  };
  function pintarHUD() {
    const e = est.energia;
    hud.salud.style.width = (Math.min(1, e / 0.4) * 100) + '%';
    hud.poderes.forEach((p, i) => {
      const desde = 0.4 + i * 0.2;
      const f = Math.min(1, Math.max(0, (e - desde) / 0.2));
      p.style.setProperty('--f', f);
      p.classList.toggle('on', f >= 1);
    });
    hud.pct.textContent = Math.round(e * 100) + '%';
    hud.vel.style.width = (est.v * 100) + '%';
    hud.vel.classList.toggle('carga', est.v >= ZONA_CARGA);
    const s = Math.ceil(est.tiempo);
    hud.tiempo.textContent = '0:' + String(s).padStart(2, '0');
    hud.tiempo.classList.toggle('urgente', est.tiempo < 8 && est.fase === 'jugando');
    hud.noche.style.width = ((1 - est.tiempo / DURACION) * 100) + '%';
  }

  /* ---------- dibujo ---------- */
  function dibujar() {
    const c = ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    const e = est.energia;

    // cielo: se aclara hacia el amanecer
    const amanecer = 1 - est.tiempo / DURACION;
    const cielo = c.createLinearGradient(0, 0, 0, h);
    cielo.addColorStop(0, PAL.noche);
    cielo.addColorStop(1, `rgb(${10 + 40 * amanecer}, ${5 + 12 * amanecer}, ${24 + 30 * amanecer})`);
    c.fillStyle = cielo;
    c.fillRect(0, 0, w, h);

    c.save();
    if (est.temblor > 0) c.translate((Math.random() - 0.5) * 14 * est.temblor, (Math.random() - 0.5) * 10 * est.temblor);

    // en pantallas angostas (celular) la rueda baja para no quedar bajo el marcador
    const angosta = w < 600;
    const R = Math.max(60, angosta ? Math.min(w * 0.4, h * 0.3) : Math.min(w * 0.36, h * 0.36));
    const cx = w / 2, cy = angosta ? h * 0.53 : h * 0.45;

    // estrellas del fondo
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 70; i++) {
      const x = (i * 137.5 % 1) * w + ((i * 73) % w);
      const y = ((i * 89) % 100) / 100 * h * 0.9;
      c.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(est.reloj * 0.8 + i));
      c.fillRect(x % w, y, i % 5 === 0 ? 2 : 1.2, i % 5 === 0 ? 2 : 1.2);
    }
    c.globalAlpha = 1;

    // resplandor de energía
    const brillo = c.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.7);
    brillo.addColorStop(0, `rgba(73,166,255,${0.12 + 0.35 * e})`);
    brillo.addColorStop(0.5, `rgba(122,77,240,${0.1 + 0.2 * e})`);
    brillo.addColorStop(1, 'rgba(10,5,24,0)');
    c.fillStyle = brillo;
    c.fillRect(0, 0, w, h);

    // líneas de velocidad de fondo
    if (est.v > 0.45) {
      c.strokeStyle = `rgba(207,198,239,${(est.v - 0.45) * 0.7})`;
      c.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const y = cy + R * 0.2 + ((i * 53 + est.reloj * 900 * est.v) % (R * 0.8));
        const x0 = ((i * 97) % (w * 0.3));
        c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + 40 + 80 * est.v, y); c.stroke();
      }
    }

    // soportes en A y base
    const base = cy + R * 1.28;
    [-1, 1].forEach(l => {
      const ax = cx + l * R * 1.08;
      const g = c.createLinearGradient(0, cy, 0, base);
      g.addColorStop(0, '#d9dce4'); g.addColorStop(1, '#8a8fa0');
      c.fillStyle = g; c.strokeStyle = PAL.noche; c.lineWidth = 3; c.lineJoin = 'round';
      tri(c, ax, cy - R * 0.02, R * 0.46, base); c.fill(); c.stroke();
      c.fillStyle = PAL.panel;
      tri(c, ax, cy + R * 0.3, R * 0.3, base - R * 0.08); c.fill();
      c.fillStyle = PAL.dorado;
      rayo(c, ax, (cy + base) / 2 + R * 0.12, R * 0.22);
      c.fillStyle = PAL.metal; c.beginPath(); c.arc(ax, cy, R * 0.05, 0, Math.PI * 2); c.fill(); c.stroke();
    });
    c.fillStyle = '#9aa0b0'; c.strokeStyle = PAL.noche; c.lineWidth = 3;
    redondo(c, cx - R * 1.65, base - 4, R * 3.3, R * 0.09, 6); c.fill(); c.stroke();

    // rueda
    c.fillStyle = PAL.panel2;
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
    c.save();
    c.translate(cx, cy); c.rotate(est.theta);
    // radios con energía
    for (let i = 0; i < 8; i++) {
      c.save(); c.rotate(i * Math.PI / 4);
      c.strokeStyle = PAL.violeta; c.lineWidth = R * 0.05; c.lineCap = 'round';
      c.beginPath(); c.moveTo(R * 0.2, 0); c.lineTo(R * 0.86, 0); c.stroke();
      c.strokeStyle = `rgba(73,166,255,${0.4 + 0.6 * e})`; c.lineWidth = R * 0.014;
      c.beginPath(); c.moveTo(R * 0.24, 0); c.lineTo(R * 0.8, 0); c.stroke();
      c.restore();
    }
    // constelación
    c.strokeStyle = 'rgba(73,166,255,.7)'; c.lineWidth = 1.5;
    c.beginPath();
    ESTRELLAS.forEach(([x, y], i) => i ? c.lineTo(x * R * 0.78, -y * R * 0.78) : c.moveTo(x * R * 0.78, -y * R * 0.78));
    c.stroke();
    c.fillStyle = '#fff';
    ESTRELLAS.forEach(([x, y]) => { c.beginPath(); c.arc(x * R * 0.78, -y * R * 0.78, 2.2, 0, Math.PI * 2); c.fill(); });
    // pista de carrera con estrías
    c.strokeStyle = '#6f6b93'; c.lineWidth = R * 0.12;
    c.beginPath(); c.arc(0, 0, R * 0.94, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = 'rgba(10,5,24,.55)'; c.lineWidth = 2;
    for (let i = 0; i < 36; i++) {
      const a = i * Math.PI / 18;
      c.beginPath(); c.moveTo(Math.cos(a) * R * 0.885, Math.sin(a) * R * 0.885); c.lineTo(Math.cos(a) * R * 0.995, Math.sin(a) * R * 0.995); c.stroke();
    }
    c.restore();
    // aro dorado
    const oro = c.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    oro.addColorStop(0, '#f3d27a'); oro.addColorStop(0.5, PAL.dorado); oro.addColorStop(1, '#9c7624');
    c.strokeStyle = oro; c.lineWidth = R * 0.07;
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = PAL.noche; c.lineWidth = 3;
    c.beginPath(); c.arc(cx, cy, R * 1.035, 0, Math.PI * 2); c.stroke();

    // núcleo: brilla más con la energía
    const pulso = 1 + 0.08 * Math.sin(est.reloj * (3 + est.v * 8));
    const rN = R * 0.13 * pulso;
    const halo = c.createRadialGradient(cx, cy, 0, cx, cy, rN * (2.5 + 2 * e));
    halo.addColorStop(0, `rgba(191,224,255,${0.5 + 0.5 * e})`); halo.addColorStop(1, 'rgba(73,166,255,0)');
    c.fillStyle = halo; c.beginPath(); c.arc(cx, cy, rN * (2.5 + 2 * e), 0, Math.PI * 2); c.fill();
    const nuc = c.createRadialGradient(cx, cy, 0, cx, cy, rN);
    nuc.addColorStop(0, '#fff'); nuc.addColorStop(0.4, '#bfe0ff'); nuc.addColorStop(0.8, PAL.azul); nuc.addColorStop(1, PAL.violeta);
    c.fillStyle = nuc; c.beginPath(); c.arc(cx, cy, rN, 0, Math.PI * 2); c.fill();
    c.strokeStyle = PAL.dorado; c.lineWidth = 3; c.stroke();

    // tornillo que se acerca por la pista
    if (est.obst) {
      const k = est.obst.t / est.obst.T;
      const a = Math.PI / 2 - (1 - k) * 1.35;
      const rr = R * 0.86;
      // camino marcado en rojo
      c.strokeStyle = 'rgba(255,60,95,.45)'; c.lineWidth = R * 0.03; c.setLineDash([6, 8]);
      c.beginPath(); c.arc(cx, cy, rr, a, Math.PI / 2); c.stroke(); c.setLineDash([]);
      const ox = cx + Math.cos(a) * rr, oy = cy + Math.sin(a) * rr;
      c.save(); c.translate(ox, oy); c.rotate(est.reloj * 8);
      c.fillStyle = PAL.dorado; c.strokeStyle = PAL.rojo; c.lineWidth = 3;
      c.beginPath();
      for (let i = 0; i < 6; i++) { const t = i * Math.PI / 3; c.lineTo(Math.cos(t) * R * 0.06, Math.sin(t) * R * 0.06); }
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = PAL.noche; c.beginPath(); c.arc(0, 0, R * 0.022, 0, Math.PI * 2); c.fill();
      c.restore();
      // signo de alerta parpadeante
      if (Math.floor(est.reloj * 8) % 2 === 0) {
        c.fillStyle = PAL.rojo; c.font = `${Math.round(R * 0.13)}px Bangers, Impact, sans-serif`; c.textAlign = 'center';
        c.fillText('!', ox, oy - R * 0.1);
      }
    }

    // Nano
    const sueloY = cy + R * 0.88;
    let alto = 0;
    if (est.salto > 0) alto = Math.sin(Math.PI * (1 - est.salto / AIRE)) * R * 0.32;
    let giro = 0;
    if (est.tropiezo > 0) giro = (1 - est.tropiezo / 0.9) * Math.PI * 2;
    dibujarNano(c, cx - R * 0.05, sueloY - alto, R * 0.0048, est.pata, giro, est.v);

    // chispas
    est.chispas = est.chispas.filter(p => p.vida > 0);
    est.chispas.forEach(p => {
      p.r += p.vr * 0.016 * R; p.vida -= 0.02;
      c.globalAlpha = Math.max(0, p.vida);
      c.fillStyle = p.color;
      c.beginPath(); c.arc(cx + Math.cos(p.a) * p.r, cy + Math.sin(p.a) * p.r, 3, 0, Math.PI * 2); c.fill();
    });
    c.globalAlpha = 1;
    c.restore();
  }

  function tri(c, x, yTop, medio, yBase) {
    c.beginPath(); c.moveTo(x, yTop); c.lineTo(x - medio, yBase); c.lineTo(x + medio, yBase); c.closePath();
  }
  function rayo(c, x, y, s) {
    const p = [[0.1, -0.5], [-0.25, 0.05], [-0.02, 0.05], [-0.15, 0.5], [0.25, -0.1], [0.03, -0.1]];
    c.beginPath(); p.forEach(([a, b], i) => i ? c.lineTo(x + a * s, y + b * s) : c.moveTo(x + a * s, y + b * s)); c.closePath(); c.fill();
  }
  function redondo(c, x, y, ww, hh, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + ww, y, x + ww, y + hh, r); c.arcTo(x + ww, y + hh, x, y + hh, r);
    c.arcTo(x, y + hh, x, y, r); c.arcTo(x, y, x + ww, y, r); c.closePath();
  }

  // Nano de lado, mirando a la derecha; s = escala, f = fase de las patas
  function dibujarNano(c, x, y, s, f, giro, v) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);   // Nano mide unas 90 unidades de largo
    if (giro) { c.translate(0, -20); c.rotate(giro); c.translate(0, 20); }
    const inclina = -0.12 * v;   // se inclina hacia adelante al correr
    c.rotate(inclina);
    c.lineWidth = 3.2; c.strokeStyle = PAL.noche; c.lineJoin = 'round';
    // patas (detrás)
    const pata = (dx, fase, color) => {
      const px = dx + Math.cos(fase) * 9, py = -2 + Math.min(0, Math.sin(fase)) * 7;
      c.fillStyle = color; c.beginPath(); c.ellipse(px, py, 7, 4.5, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    };
    pata(-14, f + Math.PI, '#e0b08f'); pata(14, f, '#e0b08f');
    // cola
    c.fillStyle = '#d99a5b'; c.beginPath(); c.ellipse(-33, -20, 5, 4, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    // cuerpo
    c.fillStyle = '#d99a5b';
    c.beginPath(); c.ellipse(0, -22, 34, 22, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = '#f5e3c3';
    c.beginPath(); c.ellipse(8, -14, 20, 11, 0, 0, Math.PI * 2); c.fill();
    // pañoleta violeta con insignia dorada
    c.fillStyle = PAL.violeta;
    c.beginPath(); c.ellipse(20, -30, 6, 15, 0.25, 0, Math.PI * 2); c.fill(); c.stroke();
    const ondea = Math.sin(f * 0.8) * 4;
    c.beginPath(); c.moveTo(16, -40); c.lineTo(2, -46 + ondea); c.lineTo(6, -36 + ondea); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = PAL.dorado; c.beginPath(); c.arc(23, -24, 3.5, 0, Math.PI * 2); c.fill();
    // cabeza
    c.fillStyle = '#d99a5b';
    c.beginPath(); c.ellipse(34, -34, 17, 15, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = '#f5e3c3'; c.beginPath(); c.ellipse(42, -29, 9, 7, 0, 0, Math.PI * 2); c.fill();
    // oreja
    c.fillStyle = '#d99a5b'; c.beginPath(); c.ellipse(27, -49, 6, 7, -0.3, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = '#ef9c9c'; c.beginPath(); c.ellipse(27, -48, 3, 4, -0.3, 0, Math.PI * 2); c.fill();
    // ojo, nariz, cachete
    c.fillStyle = '#1a1030'; c.beginPath(); c.arc(40, -38, 3.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(41.2, -39.3, 1.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#d4677a'; c.beginPath(); c.arc(50, -32, 2.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(239,156,156,.8)'; c.beginPath(); c.ellipse(36, -27, 4, 2.6, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  /* ---------- bucle ---------- */
  let ultimo = performance.now();
  function cuadro(ahora) {
    requestAnimationFrame(cuadro);
    const dt = Math.min(0.05, (ahora - ultimo) / 1000);
    ultimo = ahora;
    if (!raiz.offsetParent) return;   // pantalla oculta
    actualizar(dt);
    dibujar();
    pintarHUD();
  }
  requestAnimationFrame(cuadro);

  /* ---------- controles ---------- */
  const TECLAS_CORRER = new Set(['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD']);
  const TECLAS_SALTAR = new Set(['Space', 'ArrowUp', 'KeyW']);
  window.addEventListener('keydown', e => {
    if (!raiz.offsetParent) return;
    if (TECLAS_CORRER.has(e.code) || TECLAS_SALTAR.has(e.code)) e.preventDefault();
    if (e.repeat) return;   // mantener presionada no vale: hay que presionar rápido
    if (TECLAS_CORRER.has(e.code)) correr();
    else if (TECLAS_SALTAR.has(e.code)) saltar();
    else if (e.code === 'Enter' && est.fase === 'intro') empezar();
  });
  // botones táctiles: responden al tocar (sin esperar a soltar)
  function boton(sel, accion) {
    const b = $(sel);
    b.addEventListener('pointerdown', e => { e.preventDefault(); accion(); });
    b.addEventListener('click', e => { if (e.detail === 0) accion(); });   // teclado (Enter sobre el botón)
    b.addEventListener('contextmenu', e => e.preventDefault());
  }
  boton('#j-correr', correr);
  boton('#j-saltar', saltar);
  lienzo.addEventListener('pointerdown', e => { e.preventDefault(); correr(); });
  $('#j-empezar').addEventListener('click', empezar);

  reiniciar();
  const r0 = leerRecord();
  if (r0) $('#j-record').textContent = `Tu récord: ${r0.toFixed(1)} s`;

  return {
    entrar() {
      reiniciar();
      $('#j-fin').hidden = true;
      $('#j-intro').hidden = false;
      const r = leerRecord();
      $('#j-record').textContent = r ? `Tu récord: ${r.toFixed(1)} s` : '';
      $('#j-empezar').focus({ preventScroll: true });
    },
    salir() { if (est.fase !== 'fin') est.fase = 'intro'; },
    estado: () => est
  };
}

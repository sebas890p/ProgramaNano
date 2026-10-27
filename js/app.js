/* =========================================================
   Agente Nano · navegación y pantallas
   Rutas (en la URL después de #):
     #/inicio  #/elegir  #/artefacto/<modo>  #/datos  #/ver/<id>
   ========================================================= */

const GRAFICOS = [
  { id: 'bars',   n: 1, tipo: 'Barras',              titulo: 'Aromas que percibe Nano' },
  { id: 'pie',    n: 2, tipo: 'Torta',               titulo: 'Poderes de Nano' },
  { id: 'line',   n: 3, tipo: 'Líneas',              titulo: 'Evolución de la historia de Nano' },
  { id: 'radar',  n: 4, tipo: 'Radar',               titulo: 'Nivel de importancia de cada poder' },
  { id: 'donut',  n: 5, tipo: 'Dona',                titulo: 'Elementos del entorno de Nano' },
  { id: 'cmp',    n: 6, tipo: 'Barras comparativas', titulo: 'Antes y después de los poderes' }
];
const MAPAS = [
  { id: 'mapaolores',   n: 7, tipo: 'Ubicación',   titulo: 'Ubicaciones de los olores que detecta Nano' },
  { id: 'mapaenemigos', n: 8, tipo: 'Coroplético', titulo: 'Cantidad de enemigos por zona' }
];
const DATOS_URL = 'graficos-mapas/index.html';

/* Personajes de la historia: cada uno guarda uno o varios gráficos o mapas */
const HISTORIA = {
  rata: {
    nombre: 'Enemigo', simbolo: '!',
    titulo: '¡Cuidado! Es un enemigo de Nano',
    texto: 'La banda de ratones quiere contaminar el agua de Laureles. ¿Quieres ver dónde viven?',
    accion: '👊 Atácalo con un clic', golpe: '¡ZAS!', tono: 140,
    opciones: ['mapaenemigos']
  },
  nano: {
    nombre: 'Nano', simbolo: '?',
    titulo: 'Este es Nano',
    texto: 'Un hámster de Laureles que la esfera de luz eligió. ¿Qué quieres saber de él?',
    accion: 'Haz clic para hablarle', golpe: '¡Hola!', tono: 880,
    opciones: ['pie', 'radar', 'cmp'],
    textos: { pie: 'Sus poderes', radar: '¿Qué tan fuertes son?', cmp: 'Antes y después de la luz' },
    extra: { href: '#/juego', texto: '⚡ Ayúdalo a recargarse' }
  },
  tomate: {
    nombre: 'Tomates', simbolo: '?',
    titulo: 'Los tomates de la tienda',
    texto: 'Es el olor favorito de Nano, pero no el único que siente. ¿Qué quieres saber?',
    accion: 'Haz clic para olerlo', golpe: 'snif snif', tono: 520,
    opciones: ['bars', 'mapaolores'],
    textos: { bars: '¿Qué aromas percibe?', mapaolores: '¿Dónde están los olores?' }
  },
  luz: {
    nombre: 'Esfera de luz', simbolo: '?',
    titulo: 'La esfera de luz',
    texto: 'Entró por la ventana una noche y lo cambió todo. ¿Quieres ver cómo avanzó la historia?',
    accion: 'Haz clic para tocarla', golpe: '¡FLASH!', tono: 1200,
    opciones: ['line']
  },
  arbol: {
    nombre: 'Barrio', simbolo: '?',
    titulo: 'El barrio de Nano',
    texto: 'Árboles, pan, aves, personas y tiendas rodean su casa. ¿Quieres ver en qué proporción?',
    accion: 'Haz clic para sacudirlo', golpe: 'fruuu', tono: 300,
    opciones: ['donut']
  }
};
const TODOS = [...GRAFICOS, ...MAPAS];
const datoPorId = id => TODOS.find(x => x.id === id);
const descubiertos = new Set();
const TACTIL = window.matchMedia('(hover: none)').matches;

const MODOS = {
  general: 'La rueda de Nano',
  transparencia: 'Mirada de luz',
  acercamiento: 'Súper olfato',
  corte: 'Superfuerza',
  despiece: 'Hipervelocidad'
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- miniaturas de las tarjetas ---------- */
const MINI = {
  bars: '<path d="M20 88 L216 88" stroke="#3a3175" stroke-width="2"/><rect x="34" y="62" width="22" height="26" rx="4" fill="#4DFF8F"/><rect x="70" y="70" width="22" height="18" rx="4" fill="#49A6FF"/><rect x="106" y="20" width="22" height="68" rx="4" fill="#FF3C5F"/><rect x="142" y="44" width="22" height="44" rx="4" fill="#7A4DF0"/><rect x="178" y="76" width="22" height="12" rx="4" fill="#D2A63F"/>',
  pie: '<circle cx="116" cy="50" r="38" fill="#49A6FF"/><path d="M116 50 L116 12 A38 38 0 0 1 149 69 Z" fill="#FF3C5F"/><path d="M116 50 L149 69 A38 38 0 0 1 83 69 Z" fill="#4DFF8F"/><circle cx="116" cy="50" r="38" fill="none" stroke="#0A0518" stroke-width="2"/>',
  line: '<path d="M20 88 L216 88" stroke="#3a3175" stroke-width="2"/><path d="M30 78 L72 64 L114 50 L156 20 L200 20" fill="none" stroke="#7A4DF0" stroke-width="3.5" stroke-linecap="round"/><g stroke="#0A0518" stroke-width="2"><circle cx="30" cy="78" r="6" fill="#4DFF8F"/><circle cx="72" cy="64" r="6" fill="#D2A63F"/><circle cx="114" cy="50" r="6" fill="#ff9a3c"/><circle cx="156" cy="20" r="6" fill="#49A6FF"/><circle cx="200" cy="20" r="6" fill="#7A4DF0"/></g>',
  radar: '<path d="M116 8 L160 78 L72 78 Z M116 30 L141 70 L91 70 Z" fill="none" stroke="#3a3175" stroke-width="1.5"/><path d="M116 12 L156 76 L84 72 Z" fill="#7A4DF0" fill-opacity=".45" stroke="#9a76ff" stroke-width="2.5"/><g fill="#49A6FF"><circle cx="116" cy="12" r="4"/><circle cx="156" cy="76" r="4"/><circle cx="84" cy="72" r="4"/></g>',
  donut: '<g fill="none" stroke-width="16"><circle cx="116" cy="50" r="32" stroke="#4DFF8F" stroke-dasharray="60 141"/><circle cx="116" cy="50" r="32" stroke="#D2A63F" stroke-dasharray="50 151" stroke-dashoffset="-60"/><circle cx="116" cy="50" r="32" stroke="#49A6FF" stroke-dasharray="40 161" stroke-dashoffset="-110"/><circle cx="116" cy="50" r="32" stroke="#FF3C5F" stroke-dasharray="30 171" stroke-dashoffset="-150"/><circle cx="116" cy="50" r="32" stroke="#7A4DF0" stroke-dasharray="21 180" stroke-dashoffset="-180"/></g>',
  cmp: '<path d="M20 88 L216 88" stroke="#3a3175" stroke-width="2"/><rect x="40" y="66" width="18" height="22" rx="3" fill="#8F85B8"/><rect x="60" y="18" width="18" height="70" rx="3" fill="#49A6FF"/><rect x="104" y="72" width="18" height="16" rx="3" fill="#8F85B8"/><rect x="124" y="24" width="18" height="64" rx="3" fill="#4DFF8F"/><rect x="168" y="72" width="18" height="16" rx="3" fill="#8F85B8"/><rect x="188" y="24" width="18" height="64" rx="3" fill="#FF3C5F"/>',
  mapaolores: '<path d="M0 34 L312 24 M0 70 L312 76 M80 0 L70 100 M200 0 L214 100" fill="none" stroke="#211A4D" stroke-width="8"/><g fill="#4DFF8F"><path d="M120 14 C111 14 107 21 107 26 C107 36 120 48 120 48 C120 48 133 36 133 26 C133 21 129 14 120 14 Z"/><path d="M240 40 C231 40 227 47 227 52 C227 62 240 74 240 74 C240 74 253 62 253 52 C253 47 249 40 240 40 Z"/><path d="M44 46 C35 46 31 53 31 58 C31 68 44 80 44 80 C44 80 57 68 57 58 C57 53 53 46 44 46 Z"/></g><g fill="#0A0518"><circle cx="120" cy="26" r="4"/><circle cx="240" cy="52" r="4"/><circle cx="44" cy="58" r="4"/></g>',
  mapaenemigos: '<g stroke="#0A0518" stroke-width="2"><path d="M10 10 L120 6 L110 50 L14 56 Z" fill="#FF3C5F" fill-opacity=".55"/><path d="M120 6 L220 12 L230 48 L110 50 Z" fill="#FF3C5F" fill-opacity=".9"/><path d="M220 12 L302 8 L298 60 L230 48 Z" fill="#211A4D"/><path d="M14 56 L110 50 L118 92 L8 90 Z" fill="#211A4D"/><path d="M110 50 L230 48 L240 92 L118 92 Z" fill="#FF3C5F" fill-opacity=".3"/><path d="M230 48 L298 60 L304 90 L240 92 Z" fill="#FF3C5F" fill-opacity=".75"/></g>'
};

function tarjeta(item, ancho) {
  return `<a class="tarjeta-dato" href="#/ver/${item.id}">
    <span class="tipo">${item.n} · ${item.tipo}</span>
    <svg viewBox="0 0 ${ancho} 96" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${MINI[item.id]}</svg>
    <span class="nombre">${item.titulo}</span></a>`;
}
$('#grid-graficos').innerHTML = GRAFICOS.map(g => tarjeta(g, 232)).join('');
$('#grid-mapas').innerHTML = MAPAS.map(m => tarjeta(m, 312)).join('');

/* ---------- sonido (un clic suave al navegar) ---------- */
let sonido = true, audio = null;
function clic(frecuencia = 660, duracion = 0.08, forma = 'sine') {
  if (!sonido) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = forma; o.frequency.value = frecuencia; g.gain.value = 0.05;
    o.connect(g).connect(audio.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duracion); o.stop(audio.currentTime + duracion + 0.01);
  } catch (e) { /* sin audio */ }
}
$$('[data-sonido]').forEach(b => b.addEventListener('click', () => {
  sonido = !sonido;
  $$('[data-sonido]').forEach(x => {
    x.textContent = x.classList.contains('sonido') ? (sonido ? '🔊 Sonido: sí' : '🔇 Sonido: no') : (sonido ? '🔊' : '🔇');
    x.setAttribute('aria-label', sonido ? 'Sonido activado' : 'Sonido desactivado');
  });
}));
document.addEventListener('click', e => { if (e.target.closest('a.btn, a.tarjeta-grande, a.tarjeta-dato')) clic(); });
// (al tocar un personaje suena su propio tono)

/* ---------- artefacto 3D (se carga la primera vez que se entra) ---------- */
let rueda = null, cargando = null;
function cargarRueda() {
  if (rueda) return Promise.resolve(rueda);
  if (cargando) return cargando;
  cargando = import('./rueda.js').then(mod => {
    rueda = mod.crearRueda($('#visor'), {
      etiquetas: $('#visor-etiquetas'),
      miniCanvas: $('#mini-canvas'),
      alPasar: mostrarTooltip,
      alPasarPersonaje: id => { if (!globo.fijo) ponerGlobo(id, false); },
      alTocarPersonaje: tocarPersonaje,
      alProyectar: moverPines,
      alElegir: tipo => {
        if (rueda.estado.modo === 'corte') return;
        $('#pieza').value = tipo;
        rueda.foco(tipo);
        actualizarDescPieza();
        location.hash = '#/artefacto/acercamiento';
      }
    });
    $('#pieza').innerHTML = mod.PIEZAS.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
    actualizarDescPieza();
    $('#visor-cargando').remove();
    return rueda;
  }).catch(err => {
    $('#visor-cargando').textContent = 'No se pudo cargar la rueda 3D. Revisa tu conexión a internet.';
    console.error(err);
    cargando = null;
    throw err;
  });
  return cargando;
}

function mostrarTooltip(info, x, y) {
  const t = $('#visor-tooltip');
  if (!info) { t.hidden = true; return; }
  t.innerHTML = `${info.nombre}<small>${info.desc}</small>`;
  t.hidden = false;
  const visor = $('#visor');
  const maxX = visor.clientWidth - t.offsetWidth - 8;
  t.style.left = Math.min(x + 16, maxX) + 'px';
  t.style.top = Math.max(8, y - t.offsetHeight - 12) + 'px';
}

/* ---------- historia escondida ---------- */
const pines = {};
Object.entries(HISTORIA).forEach(([id, h]) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'pin';
  b.dataset.pj = id;
  b.innerHTML = `<span class="punto" aria-hidden="true">${h.simbolo}</span><span class="nombre">${h.nombre}</span>`;
  b.setAttribute('aria-label', h.titulo + '. ' + h.texto);
  b.style.display = 'none';
  b.addEventListener('mouseenter', () => { rueda && rueda.resaltarPersonaje(id); if (!globo.fijo) ponerGlobo(id, false); });
  b.addEventListener('mouseleave', () => { rueda && rueda.resaltarPersonaje(null); if (!globo.fijo) ponerGlobo(null); });
  b.addEventListener('click', () => tocarPersonaje(id));
  $('#visor-pines').appendChild(b);
  pines[id] = b;
});
const posPines = {};
const globo = { id: null, fijo: false };

function moverPines(lista) {
  if (!lista) { Object.values(pines).forEach(b => { b.style.display = 'none'; }); if (globo.id) ponerGlobo(null); return; }
  lista.forEach(p => {
    posPines[p.id] = p;
    const b = pines[p.id];
    b.style.display = p.visible ? '' : 'none';
    b.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
  });
  if (globo.id) colocarGlobo();
}

function ponerGlobo(id, fijo = false) {
  const el = $('#globo');
  Object.values(pines).forEach(b => b.classList.toggle('activo', b.dataset.pj === id));
  if (!id) { globo.id = null; globo.fijo = false; el.hidden = true; return; }
  const h = HISTORIA[id];
  globo.id = id; globo.fijo = fijo;
  el.dataset.pj = id;
  el.classList.toggle('fijo', fijo);
  if (fijo) {
    el.innerHTML = `<button class="btn cerrar-globo" type="button" aria-label="Cerrar">✕</button><b>${h.titulo}</b><p>${h.texto}</p>
      <div class="opciones-globo">${h.opciones.map(o => `<button class="btn" type="button" data-abrir="${o}">${h.textos[o]}<span class="visto">${descubiertos.has(o) ? '✓ visto' : '→'}</span></button>`).join('')}
      ${h.extra ? `<a class="btn primary" href="${h.extra.href}">${h.extra.texto}</a>` : ''}</div>`;
    el.querySelector('.cerrar-globo').addEventListener('click', () => ponerGlobo(null));
    el.querySelectorAll('[data-abrir]').forEach(b => b.addEventListener('click', ev => abrirEmergente(b.dataset.abrir, ev.clientX, ev.clientY, id)));
  } else {
    const yaVisto = h.opciones.every(o => descubiertos.has(o));
    el.innerHTML = `<b>${h.titulo}</b><p>${h.texto}</p><span class="accion">${h.accion}${yaVisto ? ' · ✓ ya lo viste' : ''}</span>`;
  }
  el.hidden = false;
  colocarGlobo();
  if (fijo) el.querySelector('[data-abrir]').focus({ preventScroll: true });
}

function colocarGlobo() {
  const el = $('#globo'), p = posPines[globo.id];
  if (!p) return;
  const visor = $('#visor');
  const W = visor.clientWidth, w = el.offsetWidth, h = el.offsetHeight;
  const izq = Math.min(Math.max(p.x - w / 2, 8), W - w - 8);
  let arriba = p.y - 64 - h - 14;
  const abajo = arriba < 8;
  if (abajo) arriba = p.y + 16;
  el.classList.toggle('abajo', abajo);
  el.style.left = izq + 'px';
  el.style.top = arriba + 'px';
  el.style.setProperty('--cola', Math.min(Math.max(p.x - izq, 20), w - 20) + 'px');
}

function tocarPersonaje(id) {
  const h = HISTORIA[id], p = posPines[id];
  if (!rueda || !h) return;
  rueda.tocar(id);
  clic(h.tono, 0.18, id === 'rata' ? 'square' : 'triangle');
  if (p) {
    const g = $('#golpe');
    g.textContent = h.golpe;
    g.style.left = p.x + 'px';
    g.style.top = (p.y + 30) + 'px';
    g.classList.remove('ver'); void g.offsetWidth; g.classList.add('ver');
  }
  if (h.opciones.length === 1) {
    ponerGlobo(null);
    const r = $('#visor').getBoundingClientRect();
    setTimeout(() => abrirEmergente(h.opciones[0], r.left + (p ? p.x : r.width / 2), r.top + (p ? p.y + 40 : r.height / 2), id), 650);
  } else {
    ponerGlobo(id, true);
  }
}

let volverA = null, scrollGuardado = 0;
function abrirEmergente(datoId, x, y, pj) {
  if ($('#emergente').hidden) scrollGuardado = window.scrollY;
  const item = datoPorId(datoId);
  if (!item) return;
  const esMapa = MAPAS.includes(item);
  descubiertos.add(datoId);
  pintarDescubiertos();
  ponerGlobo(null);
  volverA = pines[pj] || null;
  $('#emergente-tipo').textContent = (esMapa ? 'Mapa ' : 'Gráfico de ') + item.tipo.toLowerCase() + ' · ' + HISTORIA[pj].nombre;
  $('#emergente-titulo').textContent = item.titulo;
  $('#emergente-ir').href = '#/ver/' + item.id;
  const frame = $('#emergente-frame');
  const destino = DATOS_URL + '#' + item.id;
  let mismo = false;
  try { mismo = frame.contentWindow && frame.contentWindow.location.pathname.endsWith('index.html'); } catch (e) { /* otro origen */ }
  if (mismo) frame.contentWindow.location.hash = item.id; else frame.src = destino;
  const em = $('#emergente');
  em.hidden = false;
  const caja = $('#emergente-caja').getBoundingClientRect();
  em.style.setProperty('--ox', (x - caja.left) + 'px');
  em.style.setProperty('--oy', (y - caja.top) + 'px');
  $('#emergente-caja').style.setProperty('--ox', (x - caja.left) + 'px');
  $('#emergente-caja').style.setProperty('--oy', (y - caja.top) + 'px');
  em.classList.remove('abriendo'); void em.offsetWidth; em.classList.add('abriendo');
  $('#emergente-cerrar').focus({ preventScroll: true });
}
function cerrarEmergente() {
  const em = $('#emergente');
  if (em.hidden) return;
  em.hidden = true;
  window.scrollTo(0, scrollGuardado);   // el gráfico de adentro puede mover la página al cargarse
  if (volverA && volverA.style.display !== 'none') volverA.focus({ preventScroll: true });
}
$('#emergente-cerrar').addEventListener('click', cerrarEmergente);
// Escape también funciona cuando el foco está dentro del gráfico
$('#emergente-frame').addEventListener('load', () => {
  try { $('#emergente-frame').contentWindow.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarEmergente(); }); } catch (e) { /* otro origen */ }
});
$('#emergente').addEventListener('click', e => { if (e.target.id === 'emergente') cerrarEmergente(); });
$('#emergente-ir').addEventListener('click', () => { $('#emergente').hidden = true; });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!$('#emergente').hidden) cerrarEmergente();
  else if (globo.id) ponerGlobo(null);
});
document.addEventListener('pointerdown', e => {
  if (globo.fijo && !e.target.closest('#globo, .pin')) ponerGlobo(null);
});

function pintarDescubiertos() {
  const n = descubiertos.size, total = TODOS.length;
  $('#descubiertos').innerHTML = `<span>${n === total ? '¡Los encontraste todos!' : `Encontrados: ${n} de ${total}`}</span>
    <span class="cuadros">${TODOS.map(d => `<i class="${descubiertos.has(d.id) ? 'si' : ''}" title="${descubiertos.has(d.id) ? d.titulo : 'Sin descubrir'}"></i>`).join('')}</span>`;
  Object.entries(HISTORIA).forEach(([id, h]) => pines[id].classList.toggle('visto', h.opciones.every(o => descubiertos.has(o))));
}
pintarDescubiertos();
$('#ver-historia').addEventListener('change', e => {
  ponerGlobo(null);
  rueda && rueda.historia(e.target.checked);
  $('#visor-pista').textContent = e.target.checked ? (TACTIL ? 'Toca los personajes · arrastra para girar' : 'Pasa el cursor por los personajes · arrastra para girar') : 'Arrastra para girar · rueda del mouse para acercar';
});

function actualizarDescPieza() {
  const id = $('#pieza').value;
  const p = rueda && rueda.piezas.find(x => x.id === id);
  $('#pieza-desc').textContent = p ? p.desc : '';
}

function ponerModo(modo) {
  if (!MODOS[modo]) modo = 'general';
  if (modo !== 'general') ponerGlobo(null);
  $$('.opcion').forEach(a => a.toggleAttribute('aria-current', a.dataset.modo === modo));
  $$('.opcion[aria-current]').forEach(a => a.setAttribute('aria-current', 'page'));
  $$('.controles').forEach(c => c.classList.toggle('activa', c.dataset.controles === modo));
  $$('[data-modo-solo]').forEach(el => {
    el.style.display = el.dataset.modoSolo !== modo ? 'none' : (el.classList.contains('visor-zoom') ? 'flex' : 'block');
  });
  let etiqueta = MODOS[modo];
  if (modo === 'transparencia') etiqueta += Number($('#rango-transp').value) >= 90 ? ' · luz total' : ' · media luz';
  if (modo === 'corte') etiqueta = etiquetaCorte();
  if (modo === 'despiece') etiqueta = etiquetaDespiece();
  if (modo === 'acercamiento' && $('#pieza').selectedOptions[0]) etiqueta += ' · ' + $('#pieza').selectedOptions[0].textContent;
  $('#visor-etiqueta').textContent = etiqueta;
  $('#visor-pista').textContent = modo === 'despiece' ? 'Arrastra para girar · pasa el mouse por una pieza para ver su nombre'
    : modo === 'corte' ? 'Arrastra para girar · mueve el corte con el deslizador'
    : modo === 'general' && $('#ver-historia').checked ? (TACTIL ? 'Toca los personajes · arrastra para girar' : 'Pasa el cursor por los personajes · arrastra para girar')
    : 'Arrastra para girar · rueda del mouse para acercar';
  cargarRueda().then(r => {
    r.modo(modo);
    dibujarIndicadorCorte();
    if (modo === 'acercamiento') $('#visor-etiqueta').textContent = 'Súper olfato · ' + $('#pieza').selectedOptions[0].textContent;
  });
}

/* controles: vista general */
$$('[data-vista]').forEach(b => b.addEventListener('click', () => rueda && rueda.vista(b.dataset.vista)));

/* controles: transparencia */
$('#rango-transp').addEventListener('input', e => { rueda && rueda.transparencia(Number(e.target.value)); ponerEtiquetaTransp(); });
$$('[data-transp]').forEach(b => b.addEventListener('click', () => {
  $('#rango-transp').value = b.dataset.transp;
  rueda && rueda.transparencia(Number(b.dataset.transp));
  ponerEtiquetaTransp();
}));
function ponerEtiquetaTransp() {
  const v = Number($('#rango-transp').value);
  $$('[data-transp]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.transp) === v)));
  $('#visor-etiqueta').textContent = 'Mirada de luz · ' + (v >= 90 ? 'luz total' : 'media luz');
}
ponerEtiquetaTransp();
$('#resaltar').addEventListener('change', e => rueda && rueda.resaltarInternas(e.target.checked));

/* controles: acercamiento */
$('#pieza').addEventListener('change', e => {
  rueda && rueda.foco(e.target.value);
  actualizarDescPieza();
  $('#visor-etiqueta').textContent = 'Súper olfato · ' + e.target.selectedOptions[0].textContent;
});
$('#rango-zoom').addEventListener('input', e => rueda && rueda.zoom(Number(e.target.value)));
function pasoZoom(d) {
  const r = $('#rango-zoom');
  r.value = Math.min(5, Math.max(1, Number(r.value) + d));
  rueda && rueda.zoom(Number(r.value));
}
$('#zoom-mas').addEventListener('click', () => pasoZoom(0.5));
$('#zoom-menos').addEventListener('click', () => pasoZoom(-0.5));

/* controles: corte */
function aplicarCorte() {
  const tipo = $('[data-corte][aria-pressed="true"]').dataset.corte;
  rueda && rueda.corte(tipo, Number($('#rango-corte').value) / 100);
  $('#visor-etiqueta').textContent = etiquetaCorte();
  dibujarIndicadorCorte();
}
$$('[data-corte]').forEach(b => b.addEventListener('click', () => {
  $$('[data-corte]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  aplicarCorte();
}));
$('#rango-corte').addEventListener('input', aplicarCorte);
$('#rayado').addEventListener('change', e => rueda && rueda.rayado(e.target.checked));
function etiquetaCorte() {
  return 'Superfuerza · ' + ($('[data-corte][aria-pressed="true"]').dataset.corte === 'longitudinal' ? 'golpe de lado' : 'golpe de frente');
}
function etiquetaDespiece() {
  return 'Hipervelocidad · piezas ' + ($('[data-despiece][aria-pressed="true"]').dataset.despiece === 'explotado' ? 'volando sobre el eje' : 'en fila');
}
function dibujarIndicadorCorte() {
  const tipo = $('[data-corte][aria-pressed="true"]').dataset.corte;
  const p = Number($('#rango-corte').value) / 100;
  const svg = $('#corte-indicador');
  if (tipo === 'longitudinal') {
    // vista de frente: el plano corta de arriba abajo, de un costado al otro
    const x = 80 + (-1.3 + 2.6 * p) * 46;
    svg.innerHTML = `<path d="M8 112 L152 112" stroke="#CFC6EF" stroke-width="3"/>
      <path d="M29 60 L14 112 L44 112 Z M131 60 L116 112 L146 112 Z" fill="#211A4D" stroke="#CFC6EF" stroke-width="2"/>
      <circle cx="80" cy="60" r="46" fill="#17123A" stroke="#D2A63F" stroke-width="2.5"/>
      <circle cx="80" cy="60" r="30" fill="none" stroke="#7A4DF0" stroke-width="1.5"/>
      <circle cx="80" cy="60" r="8" fill="#211A4D" stroke="#CFC6EF" stroke-width="2"/>
      <path d="M${x} 2 L${x} 118" stroke="#49A6FF" stroke-width="3" stroke-dasharray="10 4 2 4"/>`;
  } else {
    // vista de lado: el plano corta de frente, a la profundidad elegida
    const x = 80 + (-0.6 + 1.2 * p) * 63;
    svg.innerHTML = `<path d="M8 112 L152 112" stroke="#CFC6EF" stroke-width="3"/>
      <rect x="58" y="14" width="44" height="92" fill="#17123A" stroke="#D2A63F" stroke-width="2.5"/>
      <path d="M80 56 L36 112 L124 112 Z M80 72 L54 106 L106 106 Z" fill="#211A4D" fill-rule="evenodd" stroke="#CFC6EF" stroke-width="2"/>
      <text x="108" y="22" font-size="11" fill="#8F85B8">frente →</text>
      <path d="M${x} 2 L${x} 118" stroke="#49A6FF" stroke-width="3" stroke-dasharray="10 4 2 4"/>`;
  }
}
dibujarIndicadorCorte();

/* controles: despiece */
function aplicarDespiece() {
  const tipo = $('[data-despiece][aria-pressed="true"]').dataset.despiece;
  rueda && rueda.despiece(tipo, Number($('#rango-sep').value) / 100);
  $('#visor-etiqueta').textContent = etiquetaDespiece();
}
$$('[data-despiece]').forEach(b => b.addEventListener('click', () => {
  $$('[data-despiece]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  $('#rango-sep').value = 100;
  aplicarDespiece();
}));
$('#rango-sep').addEventListener('input', aplicarDespiece);
$('#btn-armar').addEventListener('click', () => { $('#rango-sep').value = 0; aplicarDespiece(); });
$('#btn-explotar').addEventListener('click', () => { $('#rango-sep').value = 100; aplicarDespiece(); });

/* ---------- ver un gráfico o mapa ---------- */
function abrirDato(id) {
  const esMapa = MAPAS.some(m => m.id === id);
  const lista = esMapa ? MAPAS : GRAFICOS;
  const item = lista.find(x => x.id === id) || lista[0];
  $('#lista-titulo').textContent = esMapa ? 'Mapas' : 'Gráficos';
  $('#lista-items').innerHTML = lista.map(x =>
    `<a href="#/ver/${x.id}"${x.id === item.id ? ' aria-current="page"' : ''}>${x.n} · ${x.titulo}</a>`).join('');
  const otro = esMapa ? GRAFICOS[0] : MAPAS[0];
  $('#lista-cambiar').href = '#/ver/' + otro.id;
  $('#lista-cambiar').textContent = esMapa ? 'Ver gráficos →' : 'Ver mapas →';
  $('#ver-titulo').textContent = item.titulo;
  $('#ver-sub').textContent = esMapa
    ? 'Mapa ' + item.tipo.toLowerCase() + ' · toca los marcadores o zonas para ver más.'
    : 'Gráfico de ' + item.tipo.toLowerCase() + ' · usa el botón de animación y toca los elementos para ver más.';
  const frame = $('#ver-frame');
  const destino = DATOS_URL + '#' + item.id;
  if (!frame.src) frame.src = destino;
  else if (frame.contentWindow && frame.contentWindow.location.pathname.endsWith('index.html')) frame.contentWindow.location.hash = item.id;
  else frame.src = destino;
}

/* ---------- minijuego (se carga la primera vez que se entra) ---------- */
let juego = null;
function entrarJuego() {
  if (juego) { juego.entrar(); return; }
  import('./juego.js').then(mod => {
    juego = mod.crearJuego($('#juego').closest('.juego'), { sonar: clic });
    juego.entrar();
  }).catch(err => console.error(err));
}

/* ---------- enrutador ---------- */
function mostrar(id) {
  $$('.screen').forEach(s => s.classList.toggle('activa', s.id === id));
}
function ruta() {
  const [pantalla, param] = location.hash.replace(/^#\/?/, '').split('/');
  $('#emergente').hidden = true;
  ponerGlobo(null);
  if (juego && !location.hash.startsWith('#/juego')) juego.salir();
  switch (pantalla) {
    case 'elegir': mostrar('s-elegir'); break;
    case 'artefacto': mostrar('s-artefacto'); ponerModo(param || 'general'); break;
    case 'datos': mostrar('s-datos'); break;
    case 'ver': mostrar('s-ver'); abrirDato(param); break;
    case 'juego': mostrar('s-juego'); entrarJuego(); break;
    default: mostrar('s-inicio');
  }
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', ruta);
ruta();

// Descargas de los recursos de Rosina con cuenta gratis (correo, sin contraseña): así quedan en la base de contactos de Lana Rosa.
// Es una puerta de la página (no protege el archivo si alguien conoce su dirección): su fin es invitar a crear la cuenta.
// Se carga solo en recursos-rosina.html. Sin cuenta: se abre una ventana que lleva a /cuenta.html y, al volver, la descarga empieza sola.
import { haySesionGuardada, obtenerPerfil } from '/js/cuenta.js';

const VOLVER = 'recursos-rosina.html';
const CLAVE = 'lrDescargaPendiente';
const evento = (nombre, datos) => { try { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: nombre }, datos || {})); } catch (e) {} };

const estilo = document.createElement('style');
estilo.textContent = '.sus-fondo{position:fixed;inset:0;background:rgba(58,42,46,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px}'
  + '.sus-caja{background:#fff;border-radius:22px;max-width:440px;width:100%;padding:26px 22px;box-shadow:0 18px 50px rgba(0,0,0,.25);text-align:center}'
  + '.sus-caja h2{font-size:1.25rem;margin:0 0 8px;color:var(--rosa-texto,#B3175F)}'
  + '.sus-caja p{margin:0 0 14px;color:var(--tinta-suave,#5b5560);font-size:.95rem}'
  + '.sus-caja ul{list-style:none;padding:0;margin:0 0 16px;text-align:left;font-size:.92rem;color:var(--tinta,#3a2a2e)}'
  + '.sus-caja li{margin:0 0 6px}'
  + '.sus-acciones{display:flex;flex-direction:column;gap:10px}'
  + '.sus-boton{display:block;padding:13px 20px;border-radius:999px;font-family:inherit;font-size:1rem;font-weight:700;line-height:1.2;text-decoration:none;text-align:center;cursor:pointer;border:2px solid var(--rosa-boton,#E01E79);background:var(--rosa-boton,#E01E79);color:var(--sobre-principal,#fff)}'
  + '.sus-boton:hover,.sus-boton:focus-visible{background:var(--rosa-boton-hover,#B3175F);border-color:var(--rosa-boton-hover,#B3175F);outline:none}'
  + '.sus-boton.sus-2{background:#fff;color:var(--rosa-texto,#B3175F)}'
  + '.sus-boton.sus-2:hover,.sus-boton.sus-2:focus-visible{background:var(--rosa-suave,#FBE4EF);border-color:var(--rosa-boton,#E01E79)}'
  + '.sus-aviso{background:var(--rosa-suave,#FBE4EF);border-radius:16px;padding:12px 16px;margin:12px auto 0;max-width:760px;font-size:.93rem;text-align:center}'
  + '.sus-aviso a{font-weight:700;color:var(--rosa-texto,#B3175F)}'
  + '.sus-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#3a2a2e;color:#fff;padding:12px 18px;border-radius:14px;z-index:9999;max-width:90vw;font-size:.92rem}';
document.head.appendChild(estilo);

function descargar(a) {
  a.dataset.libre = '1';
  a.click();
  delete a.dataset.libre;
}

function dialogo(a) {
  try { localStorage.setItem(CLAVE, JSON.stringify({ href: a.getAttribute('href'), nombre: a.getAttribute('download') || '' })); } catch (e) {}
  evento('suscripcion_ventana', { archivo: (a.getAttribute('href') || '').split('/').pop().slice(0, 60) });
  const fondo = document.createElement('div'); fondo.className = 'sus-fondo';
  const caja = document.createElement('div'); caja.className = 'sus-caja'; caja.setAttribute('role', 'dialog'); caja.setAttribute('aria-modal', 'true'); caja.setAttribute('aria-labelledby', 'sus-titulo');
  const h = document.createElement('h2'); h.id = 'sus-titulo'; h.textContent = 'Descarga gratis con tu cuenta';
  const p = document.createElement('p'); p.textContent = 'Los recursos de Rosina son un regalo para quienes se suman a Lana Rosa. Crea tu cuenta gratis con tu correo (sin contraseña) y descarga todo lo que quieras.';
  const ul = document.createElement('ul');
  ['🌸 Stickers, fondos de pantalla e íconos de Rosina', '📦 Pedidos, favoritos y direcciones guardados', '💌 Novedades solo si tú lo autorizas'].forEach(function (t) { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
  const acc = document.createElement('div'); acc.className = 'sus-acciones';
  const crear = document.createElement('a'); crear.className = 'sus-boton'; crear.href = '/cuenta.html?volver=' + VOLVER; crear.textContent = 'Crear mi cuenta gratis';
  const entrar = document.createElement('a'); entrar.className = 'sus-boton sus-2'; entrar.href = '/cuenta.html?entrar=1&volver=' + VOLVER; entrar.textContent = 'Ya tengo cuenta: entrar';
  const luego = document.createElement('button'); luego.type = 'button'; luego.className = 'sus-boton sus-2'; luego.textContent = 'Ahora no';
  acc.append(crear, entrar, luego); caja.append(h, p, ul, acc); fondo.appendChild(caja); document.body.appendChild(fondo);
  const cerrar = () => { fondo.remove(); document.removeEventListener('keydown', tecla); a.focus(); };
  function tecla(ev) { if (ev.key === 'Escape') cerrar(); }
  document.addEventListener('keydown', tecla);
  luego.addEventListener('click', cerrar);
  fondo.addEventListener('click', function (ev) { if (ev.target === fondo) cerrar(); });
  crear.focus();
}

function aviso(texto) {
  const t = document.createElement('div'); t.className = 'sus-toast'; t.setAttribute('role', 'status'); t.textContent = texto;
  document.body.appendChild(t); setTimeout(function () { t.remove(); }, 6000);
}

document.querySelectorAll('a[download]').forEach(function (a) {
  a.setAttribute('data-puerta', '1');
  a.addEventListener('click', function (ev) {
    if (a.dataset.libre === '1') return;
    ev.preventDefault(); ev.stopPropagation();   // sin esto la medición contaría una descarga que todavía no ocurrió
    if (!haySesionGuardada()) return dialogo(a);
    obtenerPerfil().then(function (perfil) { if (perfil) descargar(a); else dialogo(a); }).catch(function () { dialogo(a); });
  }, true);
});

// Aviso fijo arriba de los recursos, solo para quien no tiene cuenta
const avisoFijo = document.getElementById('aviso-suscripcion');
if (avisoFijo && haySesionGuardada()) obtenerPerfil().then(function (perfil) { if (perfil) avisoFijo.hidden = true; }).catch(function () {});

// Al volver de crear la cuenta o entrar, la descarga que la persona había pedido empieza sola
if (haySesionGuardada()) {
  let pendiente = null;
  try { pendiente = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (e) {}
  if (pendiente && pendiente.href) {
    obtenerPerfil().then(function (perfil) {
      if (!perfil) return;
      try { localStorage.removeItem(CLAVE); } catch (e) {}
      const a = Array.prototype.find.call(document.querySelectorAll('a[download]'), function (x) { return x.getAttribute('href') === pendiente.href; });
      if (a) { aviso('¡Te damos la bienvenida! Tu descarga empezó. Si no la ves, toca el recurso otra vez.'); setTimeout(function () { descargar(a); }, 500); }
    }).catch(function () {});
  }
}

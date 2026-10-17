// Lista de espera de los talleres de Lana Rosa Academy: en vez de un mensaje suelto por WhatsApp, la persona deja sus datos (con autorización)
// y Sara los ve en Supabase (vista v_lista_espera_talleres). Los botones con data-lista-espera abren la ventana; sin JavaScript siguen yendo a WhatsApp.
import { obtenerCliente } from '/js/cuenta.js';

const estilo = document.createElement('style');
estilo.textContent = '.le-fondo{position:fixed;inset:0;background:rgba(58,42,46,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto}'
  + '.le-caja{background:#fff;border-radius:22px;max-width:460px;width:100%;padding:24px 22px;box-shadow:0 18px 50px rgba(0,0,0,.25);margin:auto}'
  + '.le-caja h2{font-size:1.25rem;margin:0 0 6px;color:var(--rosa-texto,#B3175F)}'
  + '.le-caja p{margin:0 0 12px;color:var(--tinta-suave,#5b5560);font-size:.93rem}'
  + '.le-caja label{display:block;font-weight:600;font-size:.9rem;margin:10px 0 4px;color:var(--tinta,#3a2a2e)}'
  + '.le-caja input[type=text],.le-caja input[type=tel],.le-caja input[type=email],.le-caja input[type=number],.le-caja select{width:100%;padding:11px 14px;border-radius:12px;border:1.5px solid var(--rosa-suave,#FBE4EF);font:inherit;box-sizing:border-box}'
  + '.le-caja select{background:#fff;color:inherit}'
  + '.le-caja input:focus,.le-caja select:focus{outline:none;border-color:var(--rosa-principal,#E74E96)}'
  + '.le-acepto{display:flex;gap:10px;align-items:flex-start;font-weight:400!important;font-size:.88rem!important;margin:14px 0 14px!important}'
  + '.le-acepto input{margin-top:3px;width:18px;height:18px;flex-shrink:0;accent-color:var(--rosa-principal,#E74E96)}'
  + '.le-acciones{display:flex;flex-direction:column;gap:10px;margin-top:6px}'
  + '.le-boton{display:block;padding:13px 20px;border-radius:999px;font-family:inherit;font-size:1rem;font-weight:700;line-height:1.2;text-align:center;cursor:pointer;border:2px solid var(--rosa-boton,#E01E79);background:var(--rosa-boton,#E01E79);color:var(--sobre-principal,#fff);text-decoration:none}'
  + '.le-boton:hover,.le-boton:focus-visible{background:var(--rosa-boton-hover,#B3175F);border-color:var(--rosa-boton-hover,#B3175F);outline:none}'
  + '.le-boton[disabled]{opacity:.6;cursor:default}'
  + '.le-boton.le-2{background:#fff;color:var(--rosa-texto,#B3175F)}'
  + '.le-aviso{margin:10px 0 0;font-size:.9rem;font-weight:600;color:#a12a2a}'
  + '.le-ok{text-align:center}.le-ok .le-grande{font-size:2.2rem;margin:0}'
  + '.le-trampa{position:absolute!important;left:-9999px;width:1px;height:1px;overflow:hidden}';
document.head.appendChild(estilo);

const evento = (nombre, datos) => { try { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: nombre }, datos || {})); } catch (e) {} };
const el = (tag, clase, texto) => { const n = document.createElement(tag); if (clase) n.className = clase; if (texto != null) n.textContent = texto; return n; };
const NIVELES = ['Nunca he tejido', 'Sé lo básico', 'Ya tejo y quiero avanzar', 'Tejo con soltura'];
const DISPONIBILIDADES = ['Entre semana', 'Sábados', 'Domingos', 'Cualquier día'];
const lista = (id, etiqueta, opciones) => {
  const l = el('label', null, etiqueta); l.htmlFor = id;
  const s = el('select'); s.id = id; s.append(new Option('Elige una opción', ''));
  opciones.forEach((o) => s.append(new Option(o, o)));
  return [l, s];
};
const campo = (id, etiqueta, tipo, extra) => {
  const l = el('label', null, etiqueta); l.htmlFor = id;
  const i = el('input'); i.type = tipo; i.id = id; Object.assign(i, extra || {});
  return [l, i];
};

function abrir(origen) {
  evento('lista_espera_ventana', { taller: 'Desconecta para Conectar' });
  const fondo = el('div', 'le-fondo');
  const caja = el('form', 'le-caja'); caja.setAttribute('role', 'dialog'); caja.setAttribute('aria-modal', 'true'); caja.setAttribute('aria-labelledby', 'le-titulo'); caja.noValidate = true;
  const h = el('h2', null, 'Lista de espera del taller'); h.id = 'le-titulo';
  const p = el('p', null, 'Déjanos tus datos y te escribimos por WhatsApp apenas confirmemos la próxima fecha de «Desconecta para Conectar». Sin compromiso.');
  const [lN, iN] = campo('le-nombre', 'Tu nombre*', 'text', { autocomplete: 'name', required: true });
  const [lT, iT] = campo('le-tel', 'WhatsApp*', 'tel', { autocomplete: 'tel', placeholder: 'Ej: 3001234567', required: true });
  const [lC, iC] = campo('le-correo', 'Correo (opcional)', 'email', { autocomplete: 'email' });
  const [lP, iP] = campo('le-personas', '¿Cuántas personas irían?', 'number', { min: 1, max: 20, value: 1 });
  const [lNv, iNv] = lista('le-nivel', 'Tu nivel de tejido (opcional)', NIVELES);
  const [lD, iD] = lista('le-disp', 'Cuándo te queda mejor (opcional)', DISPONIBILIDADES);
  const [lPy, iPy] = campo('le-proyecto', '¿Qué te gustaría tejer? (opcional)', 'text', { maxLength: 200, placeholder: 'Ej: un osito para mi hija' });
  const trampa = el('div', 'le-trampa'); const [lW, iW] = campo('le-web', 'No llenar este campo', 'text', { tabIndex: -1, autocomplete: 'off' }); trampa.append(lW, iW);
  const acepto = el('label', 'le-acepto'); const iA = el('input'); iA.type = 'checkbox'; iA.id = 'le-acepto';
  const sp = el('span'); sp.append('Acepto el tratamiento de mis datos personales según la ');
  const ap = el('a', null, 'política de tratamiento de datos'); ap.href = '/politicas.html#datos'; ap.target = '_blank'; ap.rel = 'noopener'; sp.append(ap, '. Solo los usaremos para avisarte de este taller y armar los grupos según el nivel y la disponibilidad.');
  acepto.append(iA, sp);
  const aviso = el('p', 'le-aviso'); aviso.setAttribute('role', 'alert'); aviso.hidden = true;
  const acc = el('div', 'le-acciones');
  const enviar = el('button', 'le-boton', 'Unirme a la lista'); enviar.type = 'submit';
  const wa = el('a', 'le-boton le-2', 'Prefiero escribir por WhatsApp'); wa.href = origen.getAttribute('href'); wa.target = '_blank'; wa.rel = 'noopener';
  const cerrarB = el('button', 'le-boton le-2', 'Cerrar'); cerrarB.type = 'button';
  acc.append(enviar, wa, cerrarB);
  caja.append(h, p, lN, iN, lT, iT, lC, iC, lP, iP, lNv, iNv, lD, iD, lPy, iPy, trampa, acepto, aviso, acc);
  fondo.appendChild(caja); document.body.appendChild(fondo);
  const cerrar = () => { fondo.remove(); document.removeEventListener('keydown', tecla); origen.focus(); };
  function tecla(ev) { if (ev.key === 'Escape') cerrar(); }
  document.addEventListener('keydown', tecla);
  cerrarB.addEventListener('click', cerrar);
  fondo.addEventListener('click', (ev) => { if (ev.target === fondo) cerrar(); });
  iN.focus();
  const mensaje = (t) => { aviso.textContent = t; aviso.hidden = !t; };

  caja.addEventListener('submit', async (ev) => {
    ev.preventDefault(); mensaje('');
    if (iW.value) return;  // trampa para programas automáticos
    const nombre = iN.value.trim(), tel = iT.value.trim(), correo = iC.value.trim();
    if (nombre.length < 2) return mensaje('Escribe tu nombre.');
    if (tel.replace(/\D/g, '').length < 7) return mensaje('Escribe un WhatsApp válido.');
    if (correo && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) return mensaje('Revisa el correo o déjalo vacío.');
    if (!iA.checked) return mensaje('Para unirte debes aceptar el tratamiento de datos personales.');
    enviar.disabled = true; enviar.textContent = 'Enviando…';
    try {
      const sb = await obtenerCliente();
      const { error } = await sb.rpc('unirme_lista_espera_taller_v2', { p_nombre: nombre, p_telefono: tel, p_correo: correo || null, p_personas: Math.max(1, Math.min(20, parseInt(iP.value, 10) || 1)), p_acepta_datos: true, p_taller: 'Desconecta para Conectar', p_nivel: iNv.value || null, p_disponibilidad: iD.value || null, p_proyecto: iPy.value.trim() || null });
      if (error) throw error;
      evento('lista_espera_enviada', { taller: 'Desconecta para Conectar' });
      caja.replaceChildren();
      const ok = el('div', 'le-ok'); ok.append(el('p', 'le-grande', '🌸'), el('h2', null, '¡Listo, estás en la lista!'), el('p', null, 'Te escribimos por WhatsApp apenas tengamos la próxima fecha.'));
      const c2 = el('button', 'le-boton', 'Cerrar'); c2.type = 'button'; c2.addEventListener('click', cerrar); ok.append(c2); caja.appendChild(ok); c2.focus();
    } catch (err) {
      mensaje('No pudimos guardar tus datos. Intenta de nuevo o escríbenos por WhatsApp.');
      enviar.disabled = false; enviar.textContent = 'Unirme a la lista';
    }
  });
}

document.querySelectorAll('a[data-lista-espera]').forEach((a) => {
  a.addEventListener('click', (ev) => { ev.preventDefault(); abrir(a); });
});

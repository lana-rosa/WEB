// «Avísame cuando abra» de la Mercería en línea: la persona deja su nombre y un WhatsApp o un correo (con autorización) y Sara los ve en Supabase
// (vista v_avisos_apertura_merceria). Los botones con data-aviso-merceria abren la ventana. Los datos solo sirven para avisar una vez cuando abra.
import { obtenerCliente } from '/js/cuenta.js';

const estilo = document.createElement('style');
estilo.textContent = '.am-fondo{position:fixed;inset:0;background:rgba(58,42,46,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto}'
  + '.am-caja{background:#fff;border-radius:22px;max-width:440px;width:100%;padding:24px 22px;box-shadow:0 18px 50px rgba(0,0,0,.25);margin:auto;text-align:left}'
  + '.am-caja h2{font-size:1.25rem;margin:0 0 6px;color:var(--rosa-texto,#B3175F)}'
  + '.am-caja p{margin:0 0 12px;color:var(--tinta-suave,#5b5560);font-size:.93rem}'
  + '.am-caja label{display:block;font-weight:600;font-size:.9rem;margin:10px 0 4px;color:var(--tinta,#3a2a2e)}'
  + '.am-caja input[type=text],.am-caja input[type=tel],.am-caja input[type=email]{width:100%;padding:11px 14px;border-radius:12px;border:1.5px solid var(--rosa-medio,#F28FC0);font-family:inherit;font-size:1rem;box-sizing:border-box}'
  + '.am-caja input:focus{outline:none;border-color:var(--rosa-principal,#E74E96)}'
  + '.am-acepto{display:flex;gap:10px;align-items:flex-start;font-weight:400!important;font-size:.88rem!important;margin:14px 0!important}'
  + '.am-acepto input{margin-top:3px;width:18px;height:18px;flex-shrink:0;accent-color:var(--rosa-principal,#E74E96)}'
  + '.am-acciones{display:flex;flex-direction:column;gap:10px;margin-top:6px}'
  + '.am-boton{display:block;padding:13px 20px;border-radius:999px;font-family:inherit;font-size:1rem;font-weight:700;line-height:1.2;text-align:center;cursor:pointer;border:2px solid var(--rosa-boton,#B3175F);background:var(--rosa-boton,#B3175F);color:var(--sobre-principal,#fff)}'
  + '.am-boton:hover,.am-boton:focus-visible{background:var(--rosa-boton-hover,#8f1049);border-color:var(--rosa-boton-hover,#8f1049);outline:none}'
  + '.am-boton[disabled]{opacity:.6;cursor:default}'
  + '.am-boton.am-2{background:#fff;color:var(--rosa-texto,#B3175F)}'
  + '.am-aviso{margin:10px 0 0;font-size:.9rem;font-weight:600;color:#a12a2a}'
  + '.am-ok{text-align:center}.am-ok .am-grande{font-size:2.2rem;margin:0}'
  + '.am-trampa{position:absolute!important;left:-9999px;width:1px;height:1px;overflow:hidden}';
document.head.appendChild(estilo);

const evento = (nombre, datos) => { try { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: nombre }, datos || {})); } catch (e) {} };
const el = (tag, clase, texto) => { const n = document.createElement(tag); if (clase) n.className = clase; if (texto != null) n.textContent = texto; return n; };
const campo = (id, etiqueta, tipo, extra) => {
  const l = el('label', null, etiqueta); l.htmlFor = id;
  const i = el('input'); i.type = tipo; i.id = id; Object.assign(i, extra || {});
  return [l, i];
};

function abrir(origen) {
  evento('aviso_merceria_ventana');
  const fondo = el('div', 'am-fondo');
  const caja = el('form', 'am-caja'); caja.setAttribute('role', 'dialog'); caja.setAttribute('aria-modal', 'true'); caja.setAttribute('aria-labelledby', 'am-titulo'); caja.noValidate = true;
  const h = el('h2', null, 'Avísame cuando abra'); h.id = 'am-titulo';
  const p = el('p', null, 'Déjanos tus datos y te avisamos una sola vez, apenas abra la Mercería en línea. Sin compromiso.');
  const [lN, iN] = campo('am-nombre', 'Tu nombre*', 'text', { autocomplete: 'name', required: true });
  const [lT, iT] = campo('am-tel', 'WhatsApp', 'tel', { autocomplete: 'tel', placeholder: 'Ej: 3001234567' });
  const [lC, iC] = campo('am-correo', 'Correo', 'email', { autocomplete: 'email', placeholder: 'tucorreo@gmail.com' });
  const nota = el('p', null, '* Escribe al menos uno de los dos: WhatsApp o correo.'); nota.style.cssText = 'font-size:.82rem;margin:6px 0 0';
  const trampa = el('div', 'am-trampa'); const [lW, iW] = campo('am-web', 'No llenar este campo', 'text', { tabIndex: -1, autocomplete: 'off' }); trampa.append(lW, iW);
  const acepto = el('label', 'am-acepto'); const iA = el('input'); iA.type = 'checkbox'; iA.id = 'am-acepto';
  const sp = el('span'); sp.append('Acepto el tratamiento de mis datos personales según la ');
  const ap = el('a', null, 'política de tratamiento de datos'); ap.href = '/politicas.html#datos'; ap.target = '_blank'; ap.rel = 'noopener';
  sp.append(ap, '. Solo los usaremos para avisarte cuando abra la Mercería en línea y después los eliminamos.');
  acepto.append(iA, sp);
  const aviso = el('p', 'am-aviso'); aviso.setAttribute('role', 'alert'); aviso.hidden = true;
  const acc = el('div', 'am-acciones');
  const enviar = el('button', 'am-boton', 'Avísame'); enviar.type = 'submit';
  const cerrarB = el('button', 'am-boton am-2', 'Cerrar'); cerrarB.type = 'button';
  acc.append(enviar, cerrarB);
  caja.append(h, p, lN, iN, lT, iT, lC, iC, nota, trampa, acepto, aviso, acc);
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
    if (!tel && !correo) return mensaje('Escribe tu WhatsApp o tu correo para poder avisarte.');
    if (tel && tel.replace(/\D/g, '').length < 7) return mensaje('Revisa el WhatsApp o déjalo vacío.');
    if (correo && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) return mensaje('Revisa el correo o déjalo vacío.');
    if (!iA.checked) return mensaje('Para que te avisemos debes aceptar el tratamiento de datos personales.');
    enviar.disabled = true; enviar.textContent = 'Enviando…';
    try {
      const sb = await obtenerCliente();
      const { error } = await sb.rpc('avisarme_apertura_merceria', { p_nombre: nombre, p_whatsapp: tel || null, p_correo: correo || null, p_acepta_datos: true });
      if (error) throw error;
      evento('aviso_merceria_enviado');
      caja.replaceChildren();
      const ok = el('div', 'am-ok'); ok.append(el('p', 'am-grande', '🌸'), el('h2', null, '¡Listo, te avisamos!'), el('p', null, 'Apenas abra la Mercería en línea te escribimos.'));
      const c2 = el('button', 'am-boton', 'Cerrar'); c2.type = 'button'; c2.addEventListener('click', cerrar); ok.append(c2); caja.appendChild(ok); c2.focus();
    } catch (err) {
      mensaje('No pudimos guardar tus datos. Intenta de nuevo en un momento.');
      enviar.disabled = false; enviar.textContent = 'Avísame';
    }
  });
}

document.querySelectorAll('[data-aviso-merceria]').forEach((b) => {
  b.addEventListener('click', (ev) => { ev.preventDefault(); abrir(b); });
});

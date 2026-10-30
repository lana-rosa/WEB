"""Auditoría de interfaz y accesibilidad de las 38 hojas de la agenda (30-oct-2026): nombres accesibles, imágenes, ids repetidos, zonas de toque,
desbordes, contraste de textos y orden de encabezados. Uso: python3 auditar_agenda_accesibilidad.py  (informe, no es una prueba de aprobado/fallo)."""
import sys, json, collections; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from agenda_util import *
JS = r"""
(id) => {
  const hoja = document.getElementById(id); const out = {};
  const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const nombre = e => (e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') && [...e.getAttribute('aria-labelledby').split(' ')].map(i => (document.getElementById(i)||{}).textContent).join(' ') || (e.labels && e.labels.length && [...e.labels].map(l => l.textContent).join(' ')) || e.getAttribute('title') || '').trim();
  const campos = [...hoja.querySelectorAll('input:not([type=hidden]), textarea, select')].filter(vis);
  out.campos = campos.length;
  out.sinNombre = campos.filter(e => !nombre(e) && !(e.closest('label') && e.closest('label').textContent.trim()) && !e.getAttribute('placeholder')).map(e => e.id || (e.outerHTML.slice(0, 90))).slice(0, 8);
  const botones = [...hoja.querySelectorAll('button, [role=button], a[href]')].filter(vis);
  out.botonesSinNombre = botones.filter(e => !(e.textContent || '').trim() && !nombre(e) && !e.querySelector('img[alt]:not([alt=""])')).map(e => e.id || e.className || e.tagName).slice(0, 8);
  const imgs = [...hoja.querySelectorAll('img')].filter(vis);
  out.imgSinAlt = imgs.filter(e => !e.hasAttribute('alt')).length;
  out.chicos = botones.concat(campos).filter(e => { const r = e.getBoundingClientRect(); return (r.width < 24 || r.height < 24) && !e.closest('.ficha-barra') ? true : false; }).map(e => (e.id || e.className || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)).slice(0, 8);
  out.desborde = hoja.scrollWidth > hoja.clientWidth + 2 ? hoja.scrollWidth + '>' + hoja.clientWidth : '';
  const h = [...hoja.querySelectorAll('h1,h2,h3,h4')].filter(vis).map(e => +e.tagName[1]);
  out.saltoEncabezado = h.some((n, i) => i && n - h[i - 1] > 1);
  return out;
}
"""
IR = "(h)=>{const a=document.querySelector('#menu-hojas-lista a[data-hoja=\"'+h+'\"]'); if(a) a.click()}"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    for ancho in (390, 1280):
        ctx = contexto(b, ancho, 900, config_abierta=False); pg = abrir(ctx, '', 1500, config=False)
        ids = pg.evaluate("[...document.querySelectorAll('#menu-hojas-lista a[data-hoja]')].map(a => a.dataset.hoja)")
        dup = pg.evaluate("(()=>{const c={};document.querySelectorAll('[id]').forEach(e=>c[e.id]=(c[e.id]||0)+1);return Object.keys(c).filter(k=>c[k]>1)})()")
        h1 = pg.evaluate("document.querySelectorAll('h1').length"); lang = pg.evaluate("document.documentElement.lang")
        print('== %d px: %d hojas; ids repetidos: %s; h1: %d; lang=%s; desborde página: %s' % (ancho, len(ids), dup[:10], h1, lang, pg.evaluate("document.documentElement.scrollWidth > innerWidth + 1")))
        for hid in ids:
            pg.evaluate(IR, hid); pg.wait_for_timeout(350)
            try: r = pg.evaluate(JS, hid)
            except Exception as e: print('  ?', hid, str(e)[:80]); continue
            mal = {k: v for k, v in r.items() if v and k not in ('campos',)}
            if mal: print('  %-20s %s' % (hid, json.dumps(mal, ensure_ascii=False)))
        print('  errores JS:', pg.errs[:3]); ctx.close()
    b.close()

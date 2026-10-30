"""Diagnóstico responsive de la agenda (30-oct-2026, solo lectura; no modifica nada en producción). Recorre las hojas en 14 anchos (y apaisado en celulares y tablets)
con datos de ejemplo inventados y guarda un JSON con lo medido: desborde horizontal, elementos que se salen, zonas de toque pequeñas, letra pequeña, tablas anchas y lienzos.
Uso: /usr/bin/python3 auditar_agenda_responsive.py salida.json [carpeta_capturas]"""
import sys, json, os
from agenda_util import *
SALIDA = sys.argv[1]; CAP = sys.argv[2] if len(sys.argv) > 2 else None
PANTALLAS = [(320, 640), (360, 740), (375, 812), (390, 844), (414, 896), (430, 932), (600, 960), (768, 1024), (800, 1280), (1024, 768), (1280, 800), (1440, 900), (1600, 900), (1920, 1080),
             (667, 375), (844, 390), (932, 430), (1024, 768), (1180, 820), (1366, 1024)]   # los últimos: apaisado de celulares y tablets
DATOS = {'ag-duena': 'Persona de Prueba'}
for i in range(1, 5):
    DATOS.update({f'ag-p{i}-cliente': f'Clienta {i}', f'ag-p{i}-pedido': 'Osito de ejemplo con nombre largo para probar', f'ag-p{i}-entrega': f'0{i}/11/2026', f'ag-p{i}-estado': 'En proceso', f'ag-p{i}-totalcompra': '$ 85.000', f'ag-p{i}-abono': '$ 40.000', f'ag-p{i}-telefono': '3000000000',
                  f'ag-vt{i}-fecha': f'0{i}/10/2026', f'ag-vt{i}-producto': 'Manta', f'ag-vt{i}-cliente': f'Clienta {i}', f'ag-vt{i}-precio': '$ 150.000', f'ag-vt{i}-costo': '$ 40.000',
                  f'ag-gs{i}-fecha': f'0{i}/10/2026', f'ag-gs{i}-detalle': 'Lana', f'ag-gs{i}-valor': '$ 60.000', f'ag-gs{i}-categoria': 'Materiales',
                  f'ag-f{i}-proyecto': f'Proyecto {i} con un nombre bastante largo', f'ag-f{i}-para': 'Alguien', f'ag-f{i}-estado': 'Tejiendo', f'ag-f{i}-fecha': f'1{i}/11/2026'})
MEDIR = """() => {
  const vw = innerWidth, out = {vw, vh: innerHeight, desborde: document.documentElement.scrollWidth - vw};
  const h = document.querySelector('#agenda .hoja-agenda.abierta') || document.getElementById('vista-seccion');
  if (!h) return Object.assign(out, {sinHoja: true});
  const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const enScroll = e => { let p = e.parentElement; while (p && p !== h) { const s = getComputedStyle(p); if (/(auto|scroll|hidden)/.test(s.overflowX) && p.scrollWidth > p.clientWidth + 1) return true; p = p.parentElement; } return false; };
  const nom = e => (e.id ? '#' + e.id : '') + '.' + String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className).split(' ').filter(Boolean).slice(0, 2).join('.') + ' <' + e.tagName.toLowerCase() + '>';
  const fuera = [], chicos = [], letraInput = [], letraChica = [], tablas = [], lienzos = [], solapes = [];
  h.querySelectorAll('*').forEach(e => {
    if (!vis(e)) return; const r = e.getBoundingClientRect();
    if (r.right > vw + 1 && !enScroll(e) && !e.closest('svg') && !/^(path|g|rect|circle|line|text|tspan)$/i.test(e.tagName)) fuera.push(nom(e) + ' +' + Math.round(r.right - vw));
    if (e.matches('button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [tabindex="0"]') && !e.closest('.ficha-cab-oculto')) {
      const t = Math.min(r.width, r.height); if (t < 44 && !(e.type === 'checkbox' || e.type === 'radio')) chicos.push(nom(e) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      else if ((e.type === 'checkbox' || e.type === 'radio') && t < 24) chicos.push(nom(e) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
    if (e.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]):not([type=hidden]), select, textarea') && parseFloat(getComputedStyle(e).fontSize) < 16) letraInput.push(nom(e) + ' ' + getComputedStyle(e).fontSize);
    if (e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim()) && parseFloat(getComputedStyle(e).fontSize) < 12) letraChica.push(nom(e) + ' ' + getComputedStyle(e).fontSize);
    if (e.tagName === 'TABLE' && r.width > h.getBoundingClientRect().width + 2) tablas.push(nom(e) + ' ' + Math.round(r.width) + ' > ' + Math.round(h.getBoundingClientRect().width));
    if (e.tagName === 'CANVAS') lienzos.push(nom(e) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' (contenedor ' + Math.round(e.parentElement.getBoundingClientRect().width) + ')');
  });
  const barra = document.querySelector('.pestanas-agenda'), fab = document.getElementById('af-boton');
  if (barra && fab) { const a = barra.getBoundingClientRect(), b = fab.getBoundingClientRect(); if (getComputedStyle(barra).position === 'fixed' && b.bottom > a.top && b.top < a.bottom) solapes.push('botón de ayuda sobre la barra'); }
  const hr = h.getBoundingClientRect();
  Object.assign(out, {ancho: Math.round(hr.width), altoHoja: Math.round(hr.height), fuera: fuera.slice(0, 8), nFuera: fuera.length, chicos: chicos.slice(0, 6), nChicos: chicos.length, letraInput: letraInput.slice(0, 4), nLetraInput: letraInput.length,
    letraChica: letraChica.slice(0, 4), nLetraChica: letraChica.length, tablas, lienzos, solapes});
  return out;
}"""
res = {}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    for (w, hgt) in PANTALLAS:
        clave = f'{w}x{hgt}'; ctx = contexto(b, w, hgt, datos=DATOS, config_abierta=False, has_touch=(w < 1100), is_mobile=False)
        pg = abrir(ctx, '', 2500, config=False)
        ids = pg.evaluate("[...document.querySelectorAll('#menu-hojas-lista a')].map(a => a.dataset.hoja)")
        res[clave] = {'errores': list(pg.errs), 'hojas': {}}
        res[clave]['hojas']['_panel_sin_hoja'] = pg.evaluate(MEDIR)
        for i in ids:
            pg.evaluate("i => window.lrIrAHoja(i)", i); pg.wait_for_timeout(260)
            res[clave]['hojas'][i] = pg.evaluate(MEDIR)
            if CAP and i in ('portada-agenda', 'tablero-agenda', 'control-pedidos', 'fin-resumen', 'calendario-anual', 'hoja-puntos', 'panel-agenda') and w in (320, 390, 768, 1024, 1280, 1920):
                os.makedirs(CAP, exist_ok=True); pg.evaluate("document.querySelector('#agenda').scrollIntoView()"); pg.screenshot(path=os.path.join(CAP, f'{i}-{w}x{hgt}.png'))
        for s in range(7):   # vista de sección
            pg.evaluate("n => document.querySelectorAll('.pestana')[n].click()", s); pg.wait_for_timeout(200)
            res[clave]['hojas'][f'_seccion{s}'] = pg.evaluate(MEDIR)
        ctx.close(); print(clave, 'listo', flush=True)
    b.close()
json.dump(res, open(SALIDA, 'w'), ensure_ascii=False)

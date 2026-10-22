#!/usr/bin/env python3
"""Segunda pasada de auditoría 360 (solo lectura): reflujo a 320 px, foco visible con teclado, enlace «saltar al contenido» y objetivos táctiles pequeños.

    python3 herramientas/auditoria-360/scripts/rastrear_teclado_reflujo.py <salida.json>
"""
import json, os, sys, glob
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
BASE = os.environ.get('AUD_BASE', 'http://localhost:8765')

def rutas():
    r = []
    for f in sorted(glob.glob(os.path.join(RAIZ, '**', '*.html'), recursive=True)):
        rel = os.path.relpath(f, RAIZ).replace(os.sep, '/')
        if rel.startswith(('herramientas/', 'node_modules/', '.github/', '.tmp/')): continue
        r.append('/' if rel == 'index.html' else ('/' + rel[:-10] if rel.endswith('/index.html') else '/' + rel))
    return r
REPRES = ['/', '/tienda.html', '/personaliza.html', '/merceria/', '/merceria/catalogo/', '/academy/', '/academy/talleres/', '/cuenta.html', '/agenda-rosina.html', '/aventuras-de-rosina/', '/contacto.html', '/preguntas-frecuentes.html', '/politicas.html']

def stub(route):
    h = urlsplit(route.request.url).hostname
    if h in ('localhost', '127.0.0.1'): return route.continue_()
    if h and h.endswith('supabase.co'): return route.fulfill(status=200, content_type='application/json', body='[]')
    return route.abort()

FOCO = r"""
(n) => {
  const res = []; const vistos = new Set();
  return new Promise(async (ok) => {
    for (let i = 0; i < n; i++) {
      await new Promise(r => setTimeout(r, 30));
      const e = document.activeElement; if (!e || e === document.body) { continue; }
      const id = e.tagName + '|' + (e.id || '') + '|' + (e.className || '').toString().slice(0, 40) + '|' + (e.textContent || '').trim().slice(0, 25);
      if (vistos.has(id)) continue; vistos.add(id);
      const s = getComputedStyle(e);
      const sombra = s.boxShadow && s.boxShadow !== 'none';
      const contorno = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
      const r = e.getBoundingClientRect();
      res.push({ el: id, visible: r.width > 0 && r.height > 0, indicador: contorno || sombra, contorno, sombra });
      window.__tab && window.__tab();
    }
    ok(res);
  });
}
"""

def main(sal):
    out = {'reflujo320': {}, 'foco': {}, 'saltar': {}, 'pequenos': {}}
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--no-sandbox'])
        for ruta in rutas():
            c = b.new_context(viewport={'width': 320, 'height': 640}); c.route('**/*', stub); pg = c.new_page()
            try:
                pg.goto(BASE + ruta, wait_until='domcontentloaded', timeout=20000); pg.wait_for_timeout(900)
                out['reflujo320'][ruta] = pg.evaluate("() => { const w = document.documentElement.scrollWidth; const m = []; document.querySelectorAll('body *').forEach(e => { const r = e.getBoundingClientRect(); if (r.right > window.innerWidth + 1 && r.width > 0 && getComputedStyle(e).position !== 'fixed' && !e.closest('[hidden]')) m.push((e.tagName + '.' + (e.className||'').toString().split(' ')[0]).slice(0,40)); }); return {scroll: w, inner: window.innerWidth, anchos: Array.from(new Set(m)).slice(0,5)}; }")
            except Exception as e:
                out['reflujo320'][ruta] = {'error': str(e)[:120]}
            c.close()
        for ruta in REPRES:
            c = b.new_context(viewport={'width': 1280, 'height': 800}); c.route('**/*', stub); pg = c.new_page()
            try:
                pg.goto(BASE + ruta, wait_until='domcontentloaded', timeout=20000); pg.wait_for_timeout(900)
                out['saltar'][ruta] = pg.evaluate("() => { const a = document.querySelector('a[href^=\"#\"][class*=\"salt\"], a.skip-link, a[href=\"#contenido\"], a[href=\"#main\"], a[href=\"#principal\"]'); return a ? a.textContent.trim().slice(0,40) : null; }")
                resultados = []
                for i in range(30):
                    pg.keyboard.press('Tab'); pg.wait_for_timeout(25)
                    r = pg.evaluate("() => { const e = document.activeElement; if (!e || e === document.body) return null; const s = getComputedStyle(e); const rc = e.getBoundingClientRect(); return { el: e.tagName + '|' + (e.id||'') + '|' + (e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,28), indicador: (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== 'none'), visible: rc.width > 0 && rc.height > 0, fueraDePantalla: rc.bottom < 0 || rc.top > innerHeight*3 }; }")
                    if r: resultados.append(r)
                out['foco'][ruta] = {'tabulados': len(resultados), 'sin_indicador': [x['el'] for x in resultados if not x['indicador'] and x['visible']][:8], 'invisibles_enfocados': [x['el'] for x in resultados if not x['visible']][:5]}
                out['pequenos'][ruta] = pg.evaluate("() => Array.from(document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button]')).filter(e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && (r.width < 24 || r.height < 24) && !(e.tagName === 'A' && getComputedStyle(e).display === 'inline' && e.closest('p,li,span,h1,h2,h3')); }).slice(0, 8).map(e => e.tagName.toLowerCase() + (e.type ? '[' + e.type + ']' : '') + '|' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height) + '|' + (e.getAttribute('aria-label') || e.textContent || e.id || e.name || '').trim().slice(0, 28))")
            except Exception as e:
                out['foco'][ruta] = {'error': str(e)[:120]}
            c.close()
        b.close()
    json.dump(out, open(sal, 'w'), ensure_ascii=False, indent=1)
main(sys.argv[1])

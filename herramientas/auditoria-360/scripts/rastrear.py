#!/usr/bin/env python3
"""Rastreo de auditoría 360 (solo lectura): abre cada ruta del sitio en Chromium a 390 y 1280 px contra un servidor LOCAL con los mismos archivos del repositorio.

    python3 herramientas/auditoria-360/scripts/rastrear.py <salida.json> [carpeta_capturas] [--sin-axe]

- Bloquea todo lo que no sea localhost (anota a qué hosts externos intentó llamar cada página).
- Las llamadas a Supabase se responden vacías (rpc -> [], auth -> {}) para ver los estados vacíos; NO toca la base real.
- Ejecuta axe-core (reglas WCAG 2.x A/AA y mejores prácticas) si se encuentra en AXE_JS (por defecto el de la carpeta de trabajo).
No hace compras, no envía formularios, no usa datos reales.
"""
import json, os, re, sys, glob, time
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
BASE = os.environ.get('AUD_BASE', 'http://localhost:8765')
AXE_JS = os.environ.get('AXE_JS', '')
SALIDA = sys.argv[1]
CAPT = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else None
USAR_AXE = '--sin-axe' not in sys.argv and AXE_JS and os.path.exists(AXE_JS)

def rutas():
    r = []
    for f in sorted(glob.glob(os.path.join(RAIZ, '**', '*.html'), recursive=True)):
        rel = os.path.relpath(f, RAIZ).replace(os.sep, '/')
        if rel.startswith(('herramientas/', 'node_modules/', '.github/', '.tmp/')): continue
        if rel == 'index.html': r.append('/')
        elif rel.endswith('/index.html'): r.append('/' + rel[:-10])
        else: r.append('/' + rel)
    extra = ['/ruta-que-no-existe-auditoria/', '/p/?i=00000000-0000-0000-0000-000000000000&o=etiqueta', '/universo-rosina.html?casa=merceria', '/tienda.html?producto=00000000-0000-0000-0000-000000000000',
             '/aventuras-de-rosina/#/mapa', '/aventuras-de-rosina/#/ayuda', '/aventuras-de-rosina/#/adultos', '/calculadoras-rosina.html#lana', '/personaliza.html?modo=guiado', '/cuenta.html?volver=recursos-rosina.html']
    return r + [e for e in extra if e not in r]

JS = r"""
() => {
  const q = (s, r=document) => Array.from(r.querySelectorAll(s));
  const meta = (n, a='name') => (document.querySelector(`meta[${a}="${n}"]`) || {}).content || null;
  const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const nombre = e => (e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') && (document.getElementById(e.getAttribute('aria-labelledby').split(' ')[0])||{}).textContent || e.textContent || e.getAttribute('title') || (e.querySelector('img[alt]')||{}).alt || e.value || '').trim();
  const jl = [];
  q('script[type="application/ld+json"]').forEach(s => { try { const j = JSON.parse(s.textContent); jl.push({ok:true, tipo: (j['@graph']||[j]).map(x=>x['@type']).flat().join(',')}); } catch(e) { jl.push({ok:false, error:String(e).slice(0,80)}); } });
  const imgs = q('img');
  const links = q('a[href]').map(a => ({href:a.getAttribute('href'), texto:(a.textContent||'').trim().slice(0,60), blank:a.target==='_blank', rel:a.rel||'', aria:a.getAttribute('aria-label')||''}));
  const campos = q('input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea').filter(vis);
  const sinEtiqueta = campos.filter(c => !(c.labels && c.labels.length) && !c.getAttribute('aria-label') && !c.getAttribute('aria-labelledby') && !c.closest('label'));
  const botones = q('button, [role=button], input[type=submit], input[type=button]').filter(vis);
  const botonesSinNombre = botones.filter(b => !nombre(b));
  const objetivos = q('a[href], button, input:not([type=hidden]), select, textarea, [role=button]').filter(vis).filter(e => { const r = e.getBoundingClientRect(); return r.width < 24 || r.height < 24; }).filter(e => !(e.tagName==='A' && e.closest('p,li,span') && getComputedStyle(e).display==='inline'));
  const heads = q('h1,h2,h3,h4,h5,h6').map(h => +h.tagName[1]);
  let saltos = 0; for (let i=1;i<heads.length;i++) if (heads[i] > heads[i-1]+1) saltos++;
  const ext = new Set(); links.forEach(l => { try { const u = new URL(l.href, location.href); if (u.origin !== location.origin) ext.add(u.hostname); } catch(e){} });
  return {
    titulo: document.title, descripcion: meta('description'), canonical: (document.querySelector('link[rel=canonical]')||{}).href || null, robots: meta('robots'),
    lang: document.documentElement.lang, viewport: meta('viewport'), og: {title:meta('og:title','property'), desc:meta('og:description','property'), img:meta('og:image','property'), url:meta('og:url','property')}, tw: meta('twitter:card'),
    h1: q('h1').map(h=>h.textContent.trim().slice(0,80)), niveles: heads.length, saltosDeNivel: saltos, jsonld: jl,
    imgs: imgs.length, imgsSinAlt: imgs.filter(i => !i.hasAttribute('alt')).length, imgsAltVacio: imgs.filter(i => i.getAttribute('alt')==='').length, imgsRotas: imgs.filter(i => i.complete && i.naturalWidth===0 && i.src && !i.src.startsWith('data:')).map(i=>i.getAttribute('src')).slice(0,5),
    enlaces: links.length, externos: Array.from(ext), blankSinNoopener: links.filter(l => l.blank && !/noopener|noreferrer/.test(l.rel)).length, enlacesVacios: links.filter(l => !l.texto && !l.aria).length, hrefVacio: links.filter(l=>l.href==='#'||l.href==='').length,
    formularios: q('form').length, camposSinEtiqueta: sinEtiqueta.length, botones: botones.length, botonesSinNombre: botonesSinNombre.length, objetivosPequenos: objetivos.length,
    iframes: q('iframe').map(f=>f.src).slice(0,5), scripts: q('script[src]').map(s=>s.getAttribute('src')), estilos: q('link[rel=stylesheet]').map(s=>s.getAttribute('href')),
    manejadoresEnLinea: q('*').filter(e => Array.from(e.attributes).some(a => a.name.startsWith('on'))).length, tabindexPositivo: q('[tabindex]').filter(e=>+e.getAttribute('tabindex')>0).length,
    ancho: {scroll: document.documentElement.scrollWidth, inner: window.innerWidth}, alto: document.documentElement.scrollHeight,
    texto: document.body.innerText.slice(0, 60000), enlacesLista: links.slice(0, 400),
    manifest: (document.querySelector('link[rel=manifest]')||{}).href || null, temaColor: meta('theme-color')
  };
}
"""

def stub(route):
    u = route.request.url
    h = urlsplit(u)
    if h.hostname in ('localhost', '127.0.0.1'):
        return route.continue_()
    if h.hostname and h.hostname.endswith('supabase.co'):
        p = h.path
        if '/auth/' in p: return route.fulfill(status=200, content_type='application/json', body='{}')
        if '/functions/' in p: return route.fulfill(status=200, content_type='application/json', body='{"ok":false}')
        return route.fulfill(status=200, content_type='application/json', body='[]')
    return route.abort()

def main():
    out = {}
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--no-sandbox'])
        for ruta in rutas():
            for ancho, alto in ((390, 844), (1280, 800)):
                ctx = b.new_context(viewport={'width': ancho, 'height': alto})
                ctx.route('**/*', stub)
                pg = ctx.new_page()
                errores, externos, malos = [], set(), []
                pg.on('pageerror', lambda e: errores.append(str(e)[:200]))
                pg.on('console', lambda m: errores.append('console: ' + m.text[:200]) if m.type == 'error' and 'Failed to load resource' not in m.text and 'net::ERR' not in m.text else None)
                pg.on('request', lambda r: externos.add(urlsplit(r.url).hostname) if urlsplit(r.url).hostname not in ('localhost', '127.0.0.1', None) else None)
                pg.on('response', lambda r: malos.append((r.status, r.url.replace(BASE, ''))) if r.status >= 400 and r.url.startswith(BASE) else None)
                t0 = time.time()
                try:
                    resp = pg.goto(BASE + ruta, wait_until='domcontentloaded', timeout=20000)
                    estado = resp.status if resp else None
                    pg.wait_for_timeout(1500)
                    d = pg.evaluate(JS)
                    if USAR_AXE:
                        pg.add_script_tag(path=AXE_JS)
                        ax = pg.evaluate("async () => { const r = await axe.run(document, {runOnly:{type:'tag', values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}}); return r.violations.map(v => ({id:v.id, impact:v.impact, n:v.nodes.length, ayuda:v.help, ejemplo:v.nodes.slice(0,2).map(n=>n.target.join(' ').slice(0,100))})); }")
                        d['axe'] = ax
                    d['estado'] = estado; d['externosIntentados'] = sorted(x for x in externos if x); d['erroresJs'] = errores[:8]; d['recursosMalos'] = malos[:10]; d['segundos'] = round(time.time() - t0, 1)
                    if CAPT:
                        os.makedirs(CAPT, exist_ok=True)
                        nombre = re.sub(r'[^a-z0-9]+', '_', (ruta.strip('/') or 'inicio').lower())[:70]
                        pg.screenshot(path=os.path.join(CAPT, f'{nombre}-{ancho}.jpg'), full_page=True, type='jpeg', quality=45)
                except Exception as e:
                    d = {'error': str(e)[:300], 'estado': None}
                out.setdefault(ruta, {})[str(ancho)] = d
                ctx.close()
            print('ok', ruta, out[ruta]['390'].get('estado'), flush=True)
        b.close()
    json.dump(out, open(SALIDA, 'w'), ensure_ascii=False)

main()

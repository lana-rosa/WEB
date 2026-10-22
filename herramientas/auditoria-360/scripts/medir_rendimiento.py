#!/usr/bin/env python3
"""Medición de laboratorio (local, solo lectura) del peso y la carga de las páginas clave (auditoría 360).

    python3 herramientas/auditoria-360/scripts/medir_rendimiento.py <salida.json>

Requiere el sitio en http://localhost:8765. Emula un celular (390 px) con red tipo «4G lenta» (1,6 Mb/s, 150 ms) y CPU 4x más lenta.
Los servicios externos (Google Tag Manager, Supabase) se sustituyen por respuestas vacías: NO mide la red real ni el CDN de producción,
y las páginas que dependen de datos de la base (tienda, catálogo) se miden sin productos. Sirve para comparar páginas entre sí y detectar pesos
anormales; no sustituye a PageSpeed Insights ni a Search Console. El peso «gzip» es una estimación (gzip de los recursos de texto).
"""
import gzip, json, sys, time
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:8765'
PAGINAS = ['/', '/tienda.html', '/personaliza.html', '/merceria/', '/merceria/catalogo/', '/academy/', '/academy/talleres/', '/universo-rosina.html',
           '/revista.html', '/revista/anillo-magico/', '/politicas.html', '/cuenta.html', '/agenda-rosina.html', '/recursos-rosina.html',
           '/calculadoras-rosina.html', '/glosario-rosina.html', '/aventuras-de-rosina/', '/contacto.html', '/preguntas-frecuentes.html']
TEXTO = ('text/', 'application/javascript', 'application/json', 'image/svg', 'application/xml', 'application/manifest')
JS_METRICAS = """() => new Promise(res => {
  const o = {lcp: 0, lcp_el: '', cls: 0, largas: 0, tbt: 0};
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) { o.lcp = e.startTime; o.lcp_el = (e.element && (e.element.tagName + (e.element.className ? '.' + String(e.element.className).split(' ')[0] : ''))) || ''; } }).observe({type: 'largest-contentful-paint', buffered: true}); } catch (e) {}
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) o.cls += e.value; }).observe({type: 'layout-shift', buffered: true}); } catch (e) {}
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) { o.largas++; if (e.duration > 50) o.tbt += e.duration - 50; } }).observe({type: 'longtask', buffered: true}); } catch (e) {}
  setTimeout(() => res(Object.assign(o, {nodos: document.getElementsByTagName('*').length, alto: document.documentElement.scrollHeight})), 1500);
})"""

out = {}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--no-sandbox'])
    for ruta in PAGINAS:
        c = b.new_context(viewport={'width': 390, 'height': 800}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = c.new_page(); recursos = []
        def stub(route):
            u = route.request.url; h = urlsplit(u).hostname
            if h in ('localhost', '127.0.0.1'): return route.continue_()
            return route.fulfill(status=200, content_type='application/json', headers={'access-control-allow-origin': '*'}, body='[]')
        c.route('**/*', stub)
        def al_responder(r):
            try:
                if urlsplit(r.url).hostname not in ('localhost', '127.0.0.1'): return
                ct = (r.headers.get('content-type') or '').lower(); body = r.body()
                recursos.append(dict(url=urlsplit(r.url).path, tipo=ct.split(';')[0], bytes=len(body), gzip=len(gzip.compress(body, 6)) if ct.startswith(TEXTO) else len(body), estado=r.status))
            except Exception: pass
        pg.on('response', al_responder)
        cdp = c.new_cdp_session(pg)
        cdp.send('Network.enable'); cdp.send('Network.emulateNetworkConditions', {'offline': False, 'latency': 150, 'downloadThroughput': int(1.6 * 1024 * 1024 / 8), 'uploadThroughput': int(750 * 1024 / 8)})
        cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
        t0 = time.time()
        try:
            pg.goto(BASE + ruta, wait_until='load', timeout=60000)
            try: pg.get_by_role('button', name='Rechazar').click(timeout=1500)
            except Exception: pass
            m = pg.evaluate(JS_METRICAS)
        except Exception as e:
            m = {'error': str(e)[:120]}
        recursos.sort(key=lambda r: -r['bytes'])
        porTipo = {}
        for r in recursos:
            k = 'imagen' if r['tipo'].startswith('image/') and 'svg' not in r['tipo'] else 'js' if 'javascript' in r['tipo'] else 'css' if 'css' in r['tipo'] else 'html' if 'html' in r['tipo'] else 'fuente' if 'font' in r['tipo'] else 'otro'
            porTipo[k] = porTipo.get(k, 0) + r['gzip']
        out[ruta] = dict(metricas=m, solicitudes=len(recursos), bytes_sin_comprimir=sum(r['bytes'] for r in recursos), bytes_gzip_estimado=sum(r['gzip'] for r in recursos),
                         por_tipo_gzip=porTipo, mayores=[(r['url'], r['bytes']) for r in recursos[:5]], segundos=round(time.time() - t0, 1))
        c.close()
        print(ruta, out[ruta]['solicitudes'], 'sol.', round(out[ruta]['bytes_gzip_estimado'] / 1024), 'KB gzip', {k: (round(v, 1) if isinstance(v, float) else v) for k, v in m.items() if k in ('lcp', 'cls', 'tbt')})
    b.close()
json.dump(out, open(sys.argv[1] if len(sys.argv) > 1 else 'rendimiento.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

"""Modo claro / oscuro de la agenda (E19, 5-nov-2026). Uso: python3 probar_agenda_modo_oscuro.py (con la web en el puerto 8765)."""
from agenda_util import *
import re
T = Prueba()
DATOS = {'ag-duena': 'Sara', 'ag-p1-cliente': 'Ana', 'ag-p1-estado': 'En proceso', 'ag-p1-totalcompra': '$ 80.000', 'ag-p1-abono': '$ 30.000'}
def lum(c):
    m = re.findall(r'[\d.]+', c)[:3]; f = [(float(v) / 255) for v in m]; f = [v / 12.92 if v <= .03928 else ((v + .055) / 1.055) ** 2.4 for v in f]
    return .2126 * f[0] + .7152 * f[1] + .0722 * f[2]
fondo = lambda pg: pg.evaluate("getComputedStyle(document.body).backgroundColor")
modo = lambda pg: pg.evaluate("document.documentElement.getAttribute('data-modo')")
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    # 1) por defecto: claro, con las tres opciones en Configuración
    ctx = contexto(b, 1280, 900, datos=DATOS, config_abierta=False); pg = abrir(ctx, '', 1800, config=True)
    T.v('por defecto la agenda sigue al celular (claro en un celular claro)', modo(pg) is None and lum(fondo(pg)) > .5, (modo(pg), fondo(pg)))
    pg.emulate_media(color_scheme='dark'); pg.reload(); pg.wait_for_timeout(1800)
    T.v('y con el celular en oscuro, oscura sin tocar nada', modo(pg) == 'oscuro' and lum(fondo(pg)) < .05, (modo(pg), fondo(pg))); pg.emulate_media(color_scheme='light'); pg.reload(); pg.wait_for_timeout(1800); pg.evaluate("window.lrAgendaConfig && window.lrAgendaConfig.abrir(true)")
    T.v('Configuración tiene Claro, Oscuro y Como el celular (este último elegido)', pg.locator('#modo-opciones input[name="agenda-modo"]').count() == 3 and pg.evaluate("document.querySelector('#modo-opciones input[value=auto]').checked"))
    # 2) elegir oscuro
    pg.evaluate("document.querySelector('#modo-opciones input[value=oscuro]').click()"); pg.wait_for_timeout(400)
    T.v('elegir Oscuro: la página se pone oscura y se recuerda', modo(pg) == 'oscuro' and lum(fondo(pg)) < .05 and pg.evaluate("localStorage.getItem('lrAgendaModo')") == 'oscuro', (modo(pg), fondo(pg)))
    T.v('el color de la barra del navegador también cambia', pg.evaluate("document.querySelector('meta[name=theme-color]').content") == '#16131A')
    T.v('los paneles de Configuración son oscuros (no quedan blancos)', lum(pg.evaluate("getComputedStyle(document.querySelector('.cfg-grupo')).backgroundColor")) < .1)
    # 3) al volver a abrir, ya sale oscuro antes de pintar (lo pone el <head>)
    pg2 = ctx.new_page(); pg2.add_init_script("document.addEventListener('readystatechange', () => { if (!window.__m) window.__m = document.documentElement.getAttribute('data-modo'); })")
    pg2.goto(BASE + '/agenda-rosina.html'); pg2.wait_for_timeout(1500)
    T.v('al abrir de nuevo sale oscura desde el primer instante', pg2.evaluate("window.__m") == 'oscuro' and modo(pg2) == 'oscuro', pg2.evaluate("window.__m"))
    pg2.close()
    # 4) impresión siempre en claro
    pg.emulate_media(media='print'); pg.wait_for_timeout(200)
    T.v('al imprimir, la agenda sale clara aunque esté en oscuro', lum(fondo(pg)) > .5, fondo(pg)); pg.emulate_media(media='screen')
    # 5) hoja de dibujo: el papel sigue claro
    pg.evaluate("window.lrIrAHoja('hoja-puntos')"); pg.wait_for_timeout(800)
    papel = pg.evaluate("(() => { const c = document.querySelector('#hoja-puntos .dib-canvas'); if (!c) return null; let e = c.parentElement; while (e) { const bg = getComputedStyle(e).backgroundColor; if (bg !== 'rgba(0, 0, 0, 0)') return bg; e = e.parentElement; } return null; })()")
    T.v('la hoja de dibujo conserva su papel claro', papel is not None and lum(papel) > .5, papel)
    # 6) Como el celular
    pg.evaluate("window.lrAgendaConfig.abrir(true)"); pg.evaluate("document.querySelector('#modo-opciones input[value=auto]').click()")
    pg.emulate_media(color_scheme='dark'); pg.wait_for_timeout(300)
    T.v('«Como el celular» con el celular en oscuro: oscura', modo(pg) == 'oscuro' and pg.evaluate("localStorage.getItem('lrAgendaModo')") == 'auto', modo(pg))
    pg.emulate_media(color_scheme='light'); pg.wait_for_timeout(300)
    T.v('y cuando el celular pasa a claro, la agenda cambia sola', modo(pg) is None and lum(fondo(pg)) > .5, (modo(pg), fondo(pg)))
    pg.evaluate("document.querySelector('#modo-opciones input[value=claro]').click()"); pg.emulate_media(color_scheme='dark'); pg.wait_for_timeout(300)
    T.v('«Claro» ignora el ajuste del celular', modo(pg) is None and pg.evaluate("localStorage.getItem('lrAgendaModo')") == 'claro', modo(pg))
    # 7) color elegido en oscuro: texto de color claro; al volver a claro, vuelve el oscuro del color
    pg.evaluate("localStorage.setItem('lrAgendaColor','#2F7DE1')"); pg.evaluate("document.documentElement.setAttribute('data-tema','libre')")
    pg.evaluate("document.querySelector('#modo-opciones input[value=oscuro]').click()"); pg.wait_for_timeout(300)
    t = pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--rosa-texto').trim()"); r, g, bb = [int(t[i:i + 2], 16) for i in (1, 3, 5)]
    T.v('con un color propio, el texto de color se aclara en oscuro', lum('%d %d %d' % (r, g, bb)) > .3, t)
    pg.evaluate("document.querySelector('#modo-opciones input[value=claro]').click()"); pg.wait_for_timeout(300)
    t2 = pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--rosa-texto').trim()"); r, g, bb = [int(t2[i:i + 2], 16) for i in (1, 3, 5)]
    T.v('y al volver a claro el texto de color vuelve a ser oscuro', lum('%d %d %d' % (r, g, bb)) < .2, t2)
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)
    ctx.close()
    # 8) contraste en oscuro: ningún texto de las secciones principales por debajo de 4,5:1
    ctx = contexto(b, 390, 844, datos=DATOS, config_abierta=False); ctx.add_init_script("localStorage.setItem('lrAgendaModo','oscuro')")
    pg = abrir(ctx, '', 2000, config=False)
    CON = open(os.path.join(os.path.dirname(__file__), '..', 'agenda-oscuro', 'fotos.py'), encoding='utf-8').read().split('CONTRASTE = r"""')[1].split('"""')[0]
    mal = []
    for i in range(6):
        pg.evaluate("document.querySelectorAll('.pestana')[%d].click()" % i); pg.wait_for_timeout(300)
        mal += [(i, x['t'], x['cr']) for x in pg.evaluate(CON)]
    for h in ('panel-agenda', 'control-pedidos', 'fin-resumen', 'inventario-lanas', 'planeador-dia', 'portada-agenda'):
        pg.evaluate("window.lrIrAHoja('%s')" % h); pg.wait_for_timeout(300); mal += [(h, x['t'], x['cr']) for x in pg.evaluate(CON)]
    T.v('en oscuro, todo texto de secciones y hojas principales llega a 4,5:1 (o 3:1 si es grande)', not mal, mal[:4])
    ctx.close(); b.close()
T.fin()

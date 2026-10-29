#!/usr/bin/env python3
"""Prueba (29-oct-2026) de la prueba gratis de 7 días y la membresía de la Agenda para tejedoras (js/agenda/membresia.js), con la base y Wompi simulados.
Uso: con un servidor local en el puerto 8765:  /usr/bin/python3 herramientas/pruebas/probar_agenda_membresia.py [carpeta_capturas]"""
import sys, os, json, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agenda_util import *
T = Prueba(); CAP = sys.argv[1] if len(sys.argv) > 1 else None
ahora = datetime.datetime.now(datetime.timezone.utc)
def iso(dias): return (ahora + datetime.timedelta(days=dias)).isoformat()
PAGAS = ['inventario-lanas', 'mis-agujas', 'lista-compras', 'control-pedidos', 'mis-clientas', 'ventas-mes', 'catalogo-precios', 'ferias-mercados', 'gastos-negocio', 'contactos', 'fin-negocio',
         'fin-resumen', 'fin-movimientos', 'fin-presupuesto', 'fin-fijos', 'fin-tcredito', 'fin-analisis', 'calendario-anual', 'fechas-especiales', 'diario-tejido', 'registro-pausas']
GRATIS = ['indice-agenda', 'planeador-dia', 'portada-agenda', 'aprende-compra', 'tablero-agenda', 'vision-anio', 'prioridades-mes', 'ficha-proyecto', 'semana-tejiendo', 'proyectos-fila', 'coleccion-patrones',
          'anio-tejiendo', 'lo-que-aprendi', 'mis-ideas', 'hoja-puntos', 'prendas-medida', 'disena-patron']

def pagina(b, estado, ancho=1280, pagos=None):
    ctx = contexto(b, ancho, 900, datos={'ag-duena': 'Sara'})
    ctx.route('**/rest/v1/rpc/mi_membresia', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(estado)))
    def pago(route):
        if route.request.method == 'OPTIONS': return route.fulfill(status=204, headers={'access-control-allow-origin': '*', 'access-control-allow-headers': '*'})
        if pagos is not None and (route.request.post_data_json or {}).get('accion') == 'membresia': pagos.append(route.request.post_data_json)
        route.fulfill(status=200, content_type='application/json', headers={'access-control-allow-origin': '*'}, body=json.dumps({'url': 'https://checkout.wompi.co/p/?prueba=1', 'membresia': True}))
    ctx.route('**/functions/v1/crear-pago-wompi', pago)
    ctx.route('https://checkout.wompi.co/**', lambda r: r.fulfill(status=200, content_type='text/html', body='<html>Wompi</html>'))
    return ctx, abrir(ctx, '', 1800)

def bloqueadas(pg): return pg.evaluate("[...document.querySelectorAll('.hoja-agenda.sin-membresia')].map(h => h.id)")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    # 1. prueba gratis: todo abierto y la tarjeta cuenta los días
    ctx, pg = pagina(b, {'activa': False, 'prueba_hasta': iso(4.5), 'en_prueba': True, 'dias_prueba': 7})
    T.v('en prueba: ninguna hoja bloqueada', bloqueadas(pg) == [], bloqueadas(pg))
    pg.evaluate("document.querySelector('#menu-hojas-lista a[data-hoja=\"indice-agenda\"]').click()"); pg.wait_for_timeout(300)
    t = pg.inner_text('#membresia-tarjeta')
    T.v('en prueba: la tarjeta dice «Prueba gratis», los días que quedan y el precio', 'Prueba gratis' in t and 'quedan 5 días' in t and '$5.000' in t, t)
    T.v('en prueba: sin 💎 en el menú', pg.locator('#menu-hojas-lista a.de-pago').count() == 0)
    T.v('en prueba: sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()

    # 2. prueba terminada: solo Inicio, Tablero y Proyectos
    ctx, pg = pagina(b, {'activa': False, 'prueba_hasta': iso(-1), 'en_prueba': False, 'dias_prueba': 7})
    bl = bloqueadas(pg)
    T.v('prueba terminada: se bloquean las 21 hojas de las otras 4 pestañas', sorted(bl) == sorted(PAGAS), sorted(set(PAGAS) ^ set(bl)))
    T.v('prueba terminada: las 17 hojas de Inicio, Tablero y Proyectos siguen libres', all(pg.evaluate("(i) => !document.getElementById(i).classList.contains('sin-membresia')", i) for i in GRATIS))
    T.v('prueba terminada: el menú marca las de pago con 💎', pg.locator('#menu-hojas-lista a.de-pago').count() == len(PAGAS))
    pg.evaluate("document.querySelector('#menu-hojas-lista a[data-hoja=\"control-pedidos\"]').click()"); pg.wait_for_timeout(400)
    T.v('una hoja de pago muestra el candado, el botón de planes y oculta sus casillas', pg.locator('#control-pedidos .candado-pago').is_visible() and 'desde $5.000 al mes' in pg.inner_text('#control-pedidos .candado-pago') and not pg.locator('#tabla-pedidos').is_visible())
    pg.evaluate("document.querySelector('#menu-hojas-lista a[data-hoja=\"ficha-proyecto\"]').click()"); pg.wait_for_timeout(400)
    T.v('una hoja gratis sigue funcionando', pg.locator('#ficha-proyecto .candado-pago').count() == 0 and pg.locator('#ag-nombre').is_visible())
    T.v('el candado y las tarjetas no se imprimen', pg.evaluate("document.querySelector('#control-pedidos .candado-pago').classList.contains('no-imprimir')"))
    pg.click('#agenda-config-btn'); pg.wait_for_timeout(300)
    T.v('Configuración también muestra el estado: «Tu prueba gratis terminó»', 'terminó' in pg.inner_text('#membresia-config'), pg.inner_text('#membresia-config'))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()

    # 3. ventana de planes y pago
    pagos = []
    ctx, pg = pagina(b, {'activa': False, 'prueba_hasta': iso(-1), 'en_prueba': False}, pagos=pagos)
    pg.evaluate("document.querySelector('#menu-hojas-lista a[data-hoja=\"fin-resumen\"]').click()"); pg.wait_for_timeout(300)
    pg.click('#fin-resumen [data-abrir-membresia]'); pg.wait_for_timeout(400)
    T.v('la ventana muestra $5.000 al mes y $45.000 al año', pg.locator('#modal-membresia').is_visible() and '$5.000' in pg.inner_text('#modal-membresia') and '$45.000' in pg.inner_text('#modal-membresia') and 'ahorras $15.000' in pg.inner_text('#modal-membresia'))
    T.v('dice qué siempre es gratis', 'Inicio, Mi tablero y Mis proyectos' in pg.inner_text('#modal-membresia'))
    pg.click('#mm-pagar'); pg.wait_for_timeout(400)
    T.v('sin las dos casillas no se paga', not pagos and 'dos casillas' in pg.inner_text('#mm-aviso'), pagos)
    pg.check('#mm-acepto-cond'); pg.check('#mm-acepto-inicio'); pg.check('input[name="mm-plan"][value="mensual"]', force=True)
    if CAP: os.makedirs(CAP, exist_ok=True); pg.screenshot(path=CAP + '/membresia-ventana.png')
    pg.click('#mm-pagar'); pg.wait_for_timeout(1200)
    T.v('con las casillas manda el plan, la aceptación y la versión de las condiciones, y abre Wompi', pagos and pagos[0].get('accion') == 'membresia' and pagos[0].get('plan') == 'mensual' and pagos[0]['acepta'] == {'condiciones': True, 'inicio_inmediato': True, 'version': '2026-10-29'} and pg.url.startswith('https://checkout.wompi.co/'), (pagos, pg.url))
    ctx.close()

    # 4. miembro
    ctx, pg = pagina(b, {'activa': True, 'plan': 'anual', 'vence': iso(200), 'prueba_hasta': iso(-30), 'en_prueba': False})
    T.v('miembro: ninguna hoja bloqueada y la tarjeta dice «membresía activa»', bloqueadas(pg) == [] and 'membresía está activa' in pg.inner_text('#membresia-tarjeta'), (bloqueadas(pg), pg.inner_text('#membresia-tarjeta')))
    T.v('miembro: el botón dice «Renovar»', pg.inner_text('#membresia-tarjeta button').strip() == 'Renovar'); ctx.close()

    # 5. sin saber el estado (error de red): no se bloquea nada
    ctx = contexto(b, 1280, 900, datos={'ag-duena': 'Sara'}); ctx.route('**/rest/v1/rpc/mi_membresia', lambda r: r.abort()); pg = abrir(ctx, '', 1800)
    T.v('sin conexión y sin recuerdo: no se bloquea nada ni se muestra la tarjeta', bloqueadas(pg) == [] and pg.locator('#membresia-tarjeta').is_hidden() or pg.locator('#membresia-tarjeta').count() == 0); ctx.close()
    # 6. celular
    ctx, pg = pagina(b, {'activa': False, 'prueba_hasta': iso(-1)}, ancho=390)
    pg.evaluate("document.querySelector('#menu-hojas-lista a[data-hoja=\"control-pedidos\"]').click()"); pg.wait_for_timeout(500)
    if CAP: pg.locator('#control-pedidos').screenshot(path=CAP + '/membresia-candado-cel.png')
    pg.evaluate("document.querySelector('#control-pedidos [data-abrir-membresia]').click()"); pg.wait_for_timeout(400)
    cab = pg.locator('#modal-membresia').bounding_box()
    T.v('celular: sin desplazamiento horizontal y la ventana cabe', pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1") and cab['width'] <= 390, cab)
    T.v('celular: sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    b.close()
T.fin()

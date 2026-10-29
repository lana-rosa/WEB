"""Prueba la tarjeta de Google Calendar de la Agenda para tejedoras (js/agenda/google-calendar.js) con la función `google-calendar` simulada.
Uso: /usr/bin/python3 herramientas/pruebas/probar_agenda_google_calendar.py   (con un servidor local en el puerto 8765)"""
import json, sys
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from agenda_util import *

DATOS = {'ag-p1-cliente': 'Ana', 'ag-p1-pedido': 'Oso de 15 cm', 'ag-p1-entrega': '15/12/2026'}
t = Prueba()


class Funcion:
    """Simula la función: guarda lo que le llegan y responde según `modo`."""
    def __init__(s, configurada=True, conectada=False, retenidos=0, vencido=False):
        s.configurada, s.conectada, s.retenidos, s.vencido, s.llamadas = configurada, conectada, retenidos, vencido, []
    def __call__(s, route):
        cuerpo = route.request.post_data_json or {}; accion = cuerpo.get('accion'); s.llamadas.append(cuerpo)
        def ok(o, status=200): route.fulfill(status=status, content_type='application/json', body=json.dumps(o))
        if not s.configurada: return ok({'configurado': False})
        if accion == 'estado': return ok({'configurado': True, 'conectado': s.conectada, 'correo': 'sara@gmail.com' if s.conectada else None, 'ultima': None})
        if accion == 'conectar': return ok({'url': 'https://accounts.google.com/o/oauth2/v2/auth?client_id=prueba'})
        if accion == 'desconectar': s.conectada = False; return ok({'ok': True})
        if accion == 'sincronizar':
            if s.vencido: return ok({'error': 'El permiso venció. Vuelve a conectar tu Google Calendar.', 'reconectar': True}, 401)
            ret = 0 if cuerpo.get('confirmarBorrado') else s.retenidos
            return ok({'ok': True, 'creados': len(cuerpo.get('eventos', [])), 'actualizados': 0, 'borrados': s.retenidos if cuerpo.get('confirmarBorrado') else 0, 'sinCambio': 0, 'fallos': 0, 'retenidos': ret})
        ok({'error': 'Acción no válida'}, 400)
    def sincs(s): return [c for c in s.llamadas if c.get('accion') == 'sincronizar']


def pagina(b, fn, datos=DATOS, ruta='', espera=1800, sesion=True, ancho=1280):
    ctx = contexto(b, ancho, 900, datos=datos)
    if not sesion: ctx.add_init_script("localStorage.removeItem('sb-ngjoognzvehwjtpqwrqe-auth-token');")
    ctx.route('**/functions/v1/google-calendar', fn)
    ctx.route('https://accounts.google.com/**', lambda r: r.fulfill(status=200, content_type='text/html', body='<html>Google</html>'))
    pg = abrir(ctx, '', 300)
    if ruta: pg.goto(BASE + '/agenda-rosina.html' + ruta)
    pg.wait_for_timeout(espera); return ctx, pg


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])

    # 1. función sin configurar: la tarjeta no aparece
    fn = Funcion(configurada=False); ctx, pg = pagina(b, fn)
    t.v('sin configurar: la tarjeta no aparece', pg.locator('#calendario-sync').is_hidden()); ctx.close()

    # 2. sin sesión: no se pregunta nada a la función
    fn = Funcion(); ctx, pg = pagina(b, fn, sesion=False)
    t.v('sin sesión: la tarjeta no aparece y no se llama a la función', pg.locator('#calendario-sync').is_hidden() and not fn.llamadas, fn.llamadas); ctx.close()

    # 3. configurada y sin conectar
    fn = Funcion(); ctx, pg = pagina(b, fn)
    t.v('configurada: la tarjeta aparece', pg.locator('#calendario-sync').is_visible())
    t.v('muestra «Conectar con Google Calendar» y nada más', pg.locator('#cs-conectar').is_visible() and pg.locator('#cs-sincronizar').is_hidden() and pg.locator('#cs-desconectar').is_hidden() and pg.locator('#cs-quitar').is_hidden())
    t.v('dice que es gratis y opcional y enlaza a la política', 'gratis y opcional' in pg.locator('#cs-texto').inner_text() and pg.locator('#calendario-sync a[href="/politicas.html#datos"]').count() == 1)
    t.v('avisa del mensaje «no verificada» antes de conectar', pg.locator('#cs-nota-verif').is_visible())
    t.v('no se imprime', 'no-imprimir' in pg.locator('#calendario-sync').get_attribute('class'))
    pg.locator('#cs-conectar').click(); pg.wait_for_timeout(1200)
    t.v('«Conectar» lleva a Google', pg.url.startswith('https://accounts.google.com/'), pg.url)
    t.v('sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()

    # 4. conectada: sincronizar a mano y sincronizar sola
    fn = Funcion(conectada=True); ctx, pg = pagina(b, fn)
    t.v('conectada: dice con qué correo y ofrece sincronizar y desconectar', 'sara@gmail.com' in pg.locator('#cs-texto').inner_text() and pg.locator('#cs-sincronizar').is_visible() and pg.locator('#cs-desconectar').is_visible() and pg.locator('#cs-conectar').is_hidden() and pg.locator('#cs-nota-verif').is_hidden())
    pg.locator('#cs-sincronizar').click(); pg.wait_for_timeout(900)
    s = fn.sincs(); ev = s[-1]['eventos'] if s else []
    t.v('«Sincronizar ahora» manda la entrega del pedido con su fecha', any(e['clave'] == 'pedido:1' and e['fecha'] == '2026-12-15' and 'Oso de 15 cm' in e['titulo'] for e in ev), ev)
    t.v('responde «¡Listo!»', '¡Listo!' in pg.locator('#cs-aviso').inner_text(), pg.locator('#cs-aviso').inner_text())
    antes = len(fn.sincs())
    pg.evaluate("() => { const i = document.getElementById('ag-p1-cliente'); i.value = 'Ana María'; i.dispatchEvent(new Event('input', {bubbles: true})); }")
    pg.wait_for_timeout(1500); t.v('no sincroniza enseguida (espera 4 s)', len(fn.sincs()) == antes)
    pg.wait_for_timeout(3800); t.v('4 segundos después de cambiar la agenda, sincroniza sola', len(fn.sincs()) == antes + 1 and not fn.sincs()[-1].get('confirmarBorrado'), len(fn.sincs()))
    t.v('sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()

    # 5. agenda sin fechas: no sincroniza sola; a mano, si la función retiene borrados, ofrece «Quitar esas fechas»
    fn = Funcion(conectada=True, retenidos=8); ctx, pg = pagina(b, fn, datos={'ag-duena': 'Sara'})
    pg.evaluate("() => { const i = document.getElementById('ag-duena'); i.value = 'Sara M'; i.dispatchEvent(new Event('input', {bubbles: true})); }")
    pg.wait_for_timeout(5200); t.v('con la agenda sin fechas no sincroniza sola', not fn.sincs(), fn.sincs())
    pg.locator('#cs-sincronizar').click(); pg.wait_for_timeout(900)
    t.v('a mano manda la lista vacía y la función retiene 8: no se quitó nada y lo dice', 'No quité nada' in pg.locator('#cs-aviso').inner_text() and '8 fechas' in pg.locator('#cs-texto').inner_text(), (pg.locator('#cs-aviso').inner_text(), pg.locator('#cs-texto').inner_text()))
    t.v('aparece «Quitar esas fechas»', pg.locator('#cs-quitar').is_visible())
    pg.locator('#cs-quitar').click(); pg.wait_for_timeout(900)
    t.v('al confirmar, se manda confirmarBorrado y el botón desaparece', fn.sincs()[-1].get('confirmarBorrado') is True and pg.locator('#cs-quitar').is_hidden(), fn.sincs()[-1].get('confirmarBorrado')); ctx.close()

    # 6. permiso vencido
    fn = Funcion(conectada=True, vencido=True); ctx, pg = pagina(b, fn)
    pg.locator('#cs-sincronizar').click(); pg.wait_for_timeout(900)
    t.v('permiso vencido: vuelve a ofrecer «Conectar» y lo explica', pg.locator('#cs-conectar').is_visible() and 'venció' in pg.locator('#cs-aviso').inner_text(), pg.locator('#cs-aviso').inner_text()); ctx.close()

    # 7. desconectar
    fn = Funcion(conectada=True); ctx, pg = pagina(b, fn)
    pg.locator('#cs-desconectar').click(); pg.wait_for_timeout(900)
    t.v('desconectar: llama a la función y vuelve a «Conectar»', any(c.get('accion') == 'desconectar' for c in fn.llamadas) and pg.locator('#cs-conectar').is_visible() and 'Desconectado' in pg.locator('#cs-aviso').inner_text()); ctx.close()

    # 8. vuelta de Google
    fn = Funcion(conectada=True); ctx, pg = pagina(b, fn, ruta='?calendario=conectado', espera=2500)
    t.v('al volver de Google sincroniza y limpia la dirección', bool(fn.sincs()) and 'calendario=' not in pg.url and '¡Listo!' in pg.locator('#cs-aviso').inner_text(), (pg.url, pg.locator('#cs-aviso').inner_text())); ctx.close()
    fn = Funcion(conectada=False); ctx, pg = pagina(b, fn, ruta='?calendario=cancelado', espera=2000)
    t.v('si cancela el permiso lo dice', 'cancelaste' in pg.locator('#cs-aviso').inner_text(), pg.locator('#cs-aviso').inner_text()); ctx.close()

    # 9. celular
    fn = Funcion(conectada=True); ctx, pg = pagina(b, fn, ancho=390)
    t.v('celular: sin desplazamiento horizontal y la tarjeta cabe', pg.evaluate("document.documentElement.scrollWidth") <= 390 and pg.locator('#calendario-sync').bounding_box()['width'] <= 390, pg.evaluate("document.documentElement.scrollWidth"))
    t.v('celular: sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()

t.fin()

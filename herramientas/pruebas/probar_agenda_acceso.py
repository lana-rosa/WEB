#!/usr/bin/env python3
"""Prueba (28-oct-2026) del acceso previo a la agenda completa por cuenta (tabla agenda_acceso_previo, migración 35), con la base simulada.
Uso: con un servidor local en el puerto 8765:  /usr/bin/python3 herramientas/pruebas/probar_agenda_acceso.py"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agenda_util import *
T = Prueba()
def cerrar(ctx):
    def r(ruta):
        resp = ruta.fetch(); ruta.fulfill(response=resp, body=resp.text().replace('var AGENDA_EN_VENTA = true', 'var AGENDA_EN_VENTA = false'))
    ctx.route('**/agenda-rosina.html*', r)
def contexto_cuenta(b, en_lista, con_sesion=True):
    ctx = b.new_context(viewport={'width': 390, 'height': 900}); cerrar(ctx)   # la puerta se prueba cerrada, que es cuando sirve el acceso previo
    if con_sesion: ctx.add_init_script("if (!localStorage.getItem('sb-ngjoognzvehwjtpqwrqe-auth-token')) localStorage.setItem('sb-ngjoognzvehwjtpqwrqe-auth-token', %s);" % json.dumps(SESION))
    ctx.add_init_script("localStorage.setItem('lrConsent', JSON.stringify({v:1,a:false,t:Date.now()}));")
    ctx.route('**/googletagmanager.com/**', lambda r: r.abort())
    ctx.state = {'en_lista': en_lista, 'consultas': 0}
    def rest(r):
        u = r.request.url
        if 'agenda_acceso_previo' in u:
            ctx.state['consultas'] += 1
            r.fulfill(status=200, content_type='application/json', body=json.dumps([{'email': 'x'}] if ctx.state['en_lista'] else []), headers={'access-control-allow-origin': '*'})
        else: r.fulfill(status=200, content_type='application/json', body='[]', headers={'access-control-allow-origin': '*'})
    ctx.route('**/rest/v1/**', rest)
    return ctx
def hojas(pg): return pg.evaluate("document.querySelectorAll('#menu-hojas-lista a').length")
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    # 1) cuenta en la lista: ve todo (la página se recarga sola una vez)
    ctx = contexto_cuenta(b, True); pg = ctx.new_page(); pg.errs = []; pg.on('pageerror', lambda e: pg.errs.append(str(e)))
    pg.goto(BASE + '/agenda-rosina.html'); pg.wait_for_timeout(3500)
    T.v('una cuenta de la lista ve la agenda completa (40 hojas) sin el aviso de construcción', hojas(pg) == 40 and not pg.is_visible('#agenda-aviso-completa'), hojas(pg))
    T.v('la base se consultó y la marca quedó en el dispositivo', ctx.state['consultas'] >= 1 and pg.evaluate("localStorage.getItem('lrAgendaAcceso')") == '1')
    pg.goto(BASE + '/agenda-rosina.html'); pg.wait_for_timeout(2500)
    T.v('al volver a entrar sigue viendo todo y no hay bucle de recargas', hojas(pg) == 40)
    # 2) la quitan de la lista: vuelve a lo gratis
    ctx.state['en_lista'] = False; pg.reload(); pg.wait_for_timeout(3500)
    T.v('si la quitan de la lista, vuelve a ver solo las hojas gratis', hojas(pg) == 7 and pg.evaluate("localStorage.getItem('lrAgendaAcceso')") is None, hojas(pg))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs[:2]); ctx.close()
    # 3) cuenta que no está en la lista: solo lo gratis
    ctx = contexto_cuenta(b, False); pg = ctx.new_page(); pg.goto(BASE + '/agenda-rosina.html'); pg.wait_for_timeout(2500)
    T.v('una cuenta que no está en la lista ve solo las 7 hojas gratis', hojas(pg) == 7 and pg.evaluate("localStorage.getItem('lrAgendaAcceso')") is None)
    ctx.close()
    # 4) sin sesión: nunca se abre aunque haya una marca vieja
    ctx = contexto_cuenta(b, True, con_sesion=False); ctx.add_init_script("localStorage.setItem('lrAgendaAcceso', '1')")
    pg = ctx.new_page(); pg.goto(BASE + '/agenda-rosina.html'); pg.wait_for_timeout(2500)
    T.v('sin sesión no se abre la agenda completa aunque haya una marca vieja, y la marca se borra', hojas(pg) == 7 and pg.evaluate("localStorage.getItem('lrAgendaAcceso')") is None)
    T.v('sin sesión no se consulta la base', ctx.state['consultas'] == 0)
    ctx.close()
    # 5) la base falla: se queda como estaba
    ctx = contexto_cuenta(b, True); ctx.unroute('**/rest/v1/**'); ctx.route('**/rest/v1/**', lambda r: r.fulfill(status=500, body='{}', content_type='application/json', headers={'access-control-allow-origin': '*'}))
    ctx.add_init_script("localStorage.setItem('lrAgendaAcceso', '1')")
    pg = ctx.new_page(); pg.errs = []; pg.on('pageerror', lambda e: pg.errs.append(str(e))); pg.goto(BASE + '/agenda-rosina.html'); pg.wait_for_timeout(3000)
    T.v('si la base no responde, conserva lo que tenía (con marca y sesión, completa) y sin errores', hojas(pg) == 40 and not pg.errs, pg.errs[:2])
    ctx.close(); b.close()
T.fin()

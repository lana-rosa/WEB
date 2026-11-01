#!/usr/bin/env python3
"""Prueba (27-oct-2026) de la copia de la Agenda para tejedoras en la cuenta y del recordatorio de copia, con una base simulada.
Uso: con un servidor local en el puerto 8765: python3 herramientas/pruebas/probar_agenda_nube.py"""
import json, os, sys, time, datetime
from playwright.sync_api import sync_playwright
CHROMIUM = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
BASE = 'http://localhost:8765'
bien = mal = 0
def v(n, ok, d=''):
    global bien, mal
    print(('  ok   ' if ok else '  FALLA ') + n + ('' if ok else '  → ' + str(d))); bien += bool(ok); mal += (not ok)
SESION = json.dumps({'access_token': 'x', 'refresh_token': 'x', 'expires_at': int(time.time()) + 36000, 'expires_in': 36000, 'token_type': 'bearer',
                     'user': {'id': '00000000-0000-0000-0000-000000000001', 'email': 'a@b.co', 'aud': 'authenticated'}})
LOCAL = {'ventas': 'Amigurumi de Luna', 'nombre-agenda': 'Ana'}
class Nube:
    def __init__(s, consent=False, datos=None): s.consent = consent; s.datos = datos; s.act = '2026-10-27T10:00:00+00:00' if datos is not None else None; s.llamadas = []
    def ruta(s, r):
        n = r.request.url.split('/rpc/')[1].split('?')[0]; body = r.request.post_data_json or {}; s.llamadas.append(n)
        if n == 'agenda_nube_leer': out = {'error': 'sin_consentimiento'} if not s.consent else ({'vacio': True} if s.datos is None else {'datos': s.datos, 'actualizado': s.act})
        elif n == 'agenda_nube_consentir': s.consent = True; out = {'ok': True}
        elif n == 'agenda_nube_guardar':
            if not s.consent: out = {'error': 'sin_consentimiento'}
            elif s.datos is not None and body.get('p_base') != s.act: out = {'conflicto': True, 'actualizado': s.act}
            else: s.datos = body['p_datos']; s.act = datetime.datetime.now(datetime.timezone.utc).isoformat(); out = {'ok': True, 'actualizado': s.act}
        elif n == 'agenda_nube_borrar': s.consent = False; s.datos = None; s.act = None; out = {'ok': True}
        else: out = None
        r.fulfill(status=200, content_type='application/json', body=json.dumps(out))
def contexto(b, nube=None, sesion=True):
    ctx = b.new_context(viewport={'width': 1280, 'height': 900}); ctx.add_init_script("window.addEventListener('load', () => setTimeout(() => window.lrAgendaConfig && window.lrAgendaConfig.abrir(true), 30));")
    if sesion: ctx.add_init_script("if (!localStorage.getItem('sb-ngjoognzvehwjtpqwrqe-auth-token')) localStorage.setItem('sb-ngjoognzvehwjtpqwrqe-auth-token', %s)" % json.dumps(SESION))
    if nube: ctx.route('**/rest/v1/rpc/agenda_nube_*', nube.ruta)
    ctx.route('**/rest/v1/rpc/mis_compras_*', lambda r: r.fulfill(status=200, content_type='application/json', body='[]'))
    return ctx
def listo(ctx, con_local=True):
    pg = ctx.new_page(); pg.on('dialog', lambda d: d.accept()); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE + '/agenda-rosina.html?avance=1'); pg.wait_for_timeout(1200)
    try: pg.click('button[data-ck=no]', timeout=1200)
    except Exception: pass
    if con_local:
        pg.evaluate("d => localStorage.setItem('rosinaAgenda', JSON.stringify(d))", LOCAL); pg.reload(); pg.wait_for_timeout(1500)
    return pg, errs
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    # 1) recordatorio sin cuenta
    ctx = contexto(b, sesion=False); pg, errs = listo(ctx)
    v('el aviso «Protege tu agenda» está apagado (30-oct-2026, pedido de Sara) aunque haya datos sin copia', not pg.locator('#agenda-recordatorio').is_visible())
    pg.evaluate("localStorage.removeItem('lrAgendaRecordatorio'); localStorage.setItem('rosinaAgendaCopia', new Date().toISOString().slice(0,10))"); pg.reload(); pg.wait_for_timeout(1000)
    v('con una copia de hoy no sale el recordatorio', not pg.locator('#agenda-recordatorio').is_visible())
    pg.evaluate("localStorage.removeItem('rosinaAgendaCopia'); localStorage.removeItem('rosinaAgenda')"); pg.reload(); pg.wait_for_timeout(1000)
    v('sin datos escritos no sale el recordatorio', not pg.locator('#agenda-recordatorio').is_visible())
    v('sin sesión no hay botón de la nube', pg.locator('#nube-activar').is_hidden()); v('sin errores de JavaScript', not errs, errs[:2]); ctx.close()
    # 2) con cuenta, sin autorizar: activar, subir, editar, borrar
    nube = Nube(); ctx = contexto(b, nube); pg, errs = listo(ctx)
    v('con cuenta y sin autorizar: aparece «Guardar mi agenda en mi cuenta»', pg.locator('#nube-activar').is_visible())
    v('y no se subió nada sin autorización', nube.datos is None)
    pg.click('#nube-activar'); pg.wait_for_timeout(300); v('se abre la ventana de autorización', pg.locator('#modal-nube').is_visible())
    pg.click('#mn-activar'); v('sin marcar la casilla no se activa', pg.locator('#mn-aviso').inner_text().startswith('Para activar') and not nube.consent)
    pg.check('#mn-acepto'); pg.click('#mn-activar'); pg.wait_for_timeout(1800)
    v('se registra la autorización', nube.consent)
    v('se sube la agenda local a la cuenta', nube.datos is not None and nube.datos.get('ventas') == LOCAL['ventas'], nube.datos)
    v('queda visible «Borrar mi copia» y desaparece el recordatorio', pg.locator('#nube-borrar').is_visible() and not pg.locator('#agenda-recordatorio').is_visible())
    pg.evaluate("localStorage.setItem('rosinaAgenda', JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('rosinaAgenda')), {ventas: 'Nuevo texto'}))); window.lrAgenda.alGuardar()"); pg.wait_for_timeout(3800)
    v('un cambio se guarda solo en la cuenta', nube.datos.get('ventas') == 'Nuevo texto', nube.datos)
    pg.click('#nube-borrar'); pg.wait_for_timeout(800)
    v('borrar la copia: la base queda vacía y sin autorización', nube.datos is None and not nube.consent)
    v('borrar la copia: la agenda del dispositivo sigue', json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')")).get('ventas') == 'Nuevo texto')
    v('sin errores de JavaScript', not errs, errs[:2]); ctx.close()
    # 3) recuperación: agenda vacía (datos del navegador borrados) y copia en la cuenta
    nube = Nube(consent=True, datos={'ventas': 'Guardado en la cuenta', 'notas': 'abc'}); ctx = contexto(b, nube); pg, errs = listo(ctx, con_local=False)
    pg.wait_for_timeout(1500)
    guardado = json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda') || '{}'"))
    v('tras borrar el historial, la agenda se recupera sola desde la cuenta', guardado.get('ventas') == 'Guardado en la cuenta' and guardado.get('notas') == 'abc', guardado)
    v('queda marcada como al día con la nube', pg.evaluate("localStorage.getItem('lrNubeBase')") == nube.act)
    v('sin errores de JavaScript', not errs, errs[:2]); ctx.close()
    # 4) sesión pero sin conexión con la nube: la agenda funciona igual
    ctx = contexto(b, None); ctx.route('**/rest/v1/rpc/agenda_nube_*', lambda r: r.abort()); pg, errs = listo(ctx)
    v('sin conexión: la agenda sigue abierta y con sus datos', json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')")).get('ventas') == LOCAL['ventas'])
    ctx.close()
    # 5) a 390 px sin desplazamiento horizontal y con el recordatorio
    ctx = contexto(b, sesion=False); ctx.new_page().close(); pg = ctx.new_page(); pg.set_viewport_size({'width': 390, 'height': 800}); pg.on('dialog', lambda d: d.accept())
    pg.goto(BASE + '/agenda-rosina.html?avance=1'); pg.wait_for_timeout(1000); pg.evaluate("d => localStorage.setItem('rosinaAgenda', JSON.stringify(d))", LOCAL); pg.reload(); pg.wait_for_timeout(1200)
    v('390 px: sin desplazamiento horizontal', pg.evaluate('document.documentElement.scrollWidth') <= 390 and True)
    ctx.close(); b.close()
print(f'\n{bien} comprobaciones correctas, {mal} con falla.'); sys.exit(1 if mal else 0)

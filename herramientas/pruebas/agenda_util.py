"""Ayudas comunes de las pruebas de la Agenda para tejedoras (sesión simulada, sin red hacia Supabase)."""
import json, os, time
from playwright.sync_api import sync_playwright
CHROMIUM = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
BASE = os.environ.get('LR_BASE', 'http://localhost:8765')
SESION = json.dumps({'access_token': 'x', 'refresh_token': 'x', 'expires_at': int(time.time()) + 36000, 'expires_in': 36000, 'token_type': 'bearer',
                     'user': {'id': '00000000-0000-0000-0000-000000000001', 'email': 'a@b.co', 'aud': 'authenticated'}})
class Prueba:
    def __init__(s): s.bien = s.mal = 0
    def v(s, n, ok, d=''):
        print(('  ok   ' if ok else '  FALLA ') + n + ('' if ok else '  → ' + str(d))); s.bien += bool(ok); s.mal += (not ok)
    def fin(s):
        print('\n%d comprobaciones correctas, %d con falla.' % (s.bien, s.mal)); raise SystemExit(1 if s.mal else 0)
def contexto(b, ancho=1280, alto=900, datos=None, **kw):
    ctx = b.new_context(viewport={'width': ancho, 'height': alto}, **kw)
    ctx.add_init_script("if (!localStorage.getItem('sb-ngjoognzvehwjtpqwrqe-auth-token')) localStorage.setItem('sb-ngjoognzvehwjtpqwrqe-auth-token', %s);"
                        "localStorage.setItem('lrAgendaAvance', '1');"
                        "if (!localStorage.getItem('lrConsent')) localStorage.setItem('lrConsent', JSON.stringify({v:1,a:false,t:Date.now()}));" % json.dumps(SESION))
    if datos is not None: ctx.add_init_script("if (!sessionStorage.getItem('lrPruebaInit')) { localStorage.setItem('rosinaAgenda', %s); sessionStorage.setItem('lrPruebaInit', '1'); }" % json.dumps(json.dumps(datos)))
    ctx.route('**/rest/v1/rpc/**', lambda r: r.fulfill(status=200, content_type='application/json', body='null' if 'agenda_nube' in r.request.url else '[]'))
    ctx.route('**/googletagmanager.com/**', lambda r: r.abort()); ctx.route('**/google.com/**', lambda r: r.abort())
    return ctx
def abrir(ctx, hoja='', espera=1500):
    pg = ctx.new_page(); pg.on('dialog', lambda d: d.accept()); pg.errs = []
    pg.on('pageerror', lambda e: pg.errs.append(str(e)))
    pg.goto(BASE + '/agenda-rosina.html' + ('#' + hoja if hoja else '')); pg.wait_for_timeout(espera)
    return pg

"""Etapa 7: sincronización de la agenda con el Google Drive de la usuaria (js/agenda/drive-sync.js) con la función `google-drive` y la API de Drive SIMULADAS.
Uso: /usr/bin/python3 herramientas/pruebas/probar_agenda_drive.py   (con un servidor local en el puerto 8765)"""
import json, re, sys
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from agenda_util import *
t = Prueba()


class Nube:
    """Un Google Drive simulado (la carpeta oculta de la app) y la función google-drive, compartidos por los dos «aparatos»."""
    def __init__(s, configurada=True, conectada=True):
        s.archivos, s.n, s.configurada, s.conectada, s.llamadas, s.tokens, s.escrituras = {}, 0, configurada, conectada, [], 0, 0
    def poner(s, nombre, datos, rev, extra=None):
        s.n += 1; fid = 'f%d' % s.n
        s.archivos[fid] = {'id': fid, 'name': nombre, 'createdTime': '2026-10-31T10:%02d:00Z' % s.n, 'modifiedTime': '2026-10-31T10:%02d:00Z' % s.n,
                           'appProperties': dict({'rev': rev}, **(extra or {})), 'contenido': {'v': 1, 'datos': datos}}
        return fid
    def principal(s):
        for a in s.archivos.values():
            if a['name'] == 'agenda.json': return a
    def datos(s):
        a = s.principal(); return a['contenido']['datos'] if a else None
    def anteriores(s): return [a for a in s.archivos.values() if a['name'].startswith('agenda-anterior-')]
    def funcion(s, route):
        c = route.request.post_data_json or {}; acc = c.get('accion'); s.llamadas.append(acc)
        def ok(o, st=200): route.fulfill(status=st, content_type='application/json', body=json.dumps(o))
        if not s.configurada: return ok({'configurado': False})
        if acc == 'estado': return ok({'configurado': True, 'conectado': s.conectada, 'correo': 'sara@gmail.com' if s.conectada else None, 'ultima': None})
        if acc == 'conectar': return ok({'url': 'https://accounts.google.com/o/oauth2/v2/auth?client_id=prueba'})
        if acc == 'token': s.tokens += 1; return ok({'access_token': 'tok%d' % s.tokens, 'expires_in': 3300})
        if acc == 'sincronizada': return ok({'ok': True})
        if acc == 'desconectar': s.conectada = False; return ok({'ok': True})
        ok({'error': 'Acción no válida'}, 400)
    def api(s, route):
        r = route.request; url = r.url; json_ = lambda o, st=200: route.fulfill(status=st, content_type='application/json', headers={'Access-Control-Allow-Origin': '*'}, body=json.dumps(o))
        if r.method == 'OPTIONS': return route.fulfill(status=204, headers={'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*'})
        if '/upload/' in url:
            tipo = r.headers.get('content-type', ''); b = re.search(r'boundary=(.+)$', tipo).group(1)
            partes = [p for p in (r.post_data or '').split('--' + b) if 'Content-Type' in p]
            s.escrituras += 1; meta = json.loads(partes[0].split('\r\n\r\n', 1)[1].strip()); cont = json.loads(partes[1].split('\r\n\r\n', 1)[1].strip())
            if r.method == 'POST':
                s.n += 1; fid = 'f%d' % s.n
                s.archivos[fid] = {'id': fid, 'name': meta.get('name'), 'createdTime': '2026-10-31T11:%02d:00Z' % s.n, 'modifiedTime': '2026-10-31T11:%02d:00Z' % s.n, 'appProperties': meta.get('appProperties', {}), 'contenido': cont}
                return json_({'id': fid})
            fid = re.search(r'/files/([^?]+)', url).group(1)
            if fid not in s.archivos: return json_({'error': 'no'}, 404)
            s.archivos[fid]['contenido'] = cont; s.archivos[fid]['appProperties'] = meta.get('appProperties', {}); return json_({'id': fid})
        m = re.search(r'/files/([^?/]+)', url)
        if m and r.method == 'DELETE': s.archivos.pop(m.group(1), None); return route.fulfill(status=204, headers={'Access-Control-Allow-Origin': '*'})
        if m and 'alt=media' in url:
            a = s.archivos.get(m.group(1)); return json_(a['contenido']) if a else json_({'error': 'no'}, 404)
        q = re.search(r'[?&]q=([^&]+)', url); q = __import__('urllib.parse').parse.unquote(q.group(1)) if q else ''
        lista = list(s.archivos.values())
        if "name = 'agenda.json'" in q: lista = [a for a in lista if a['name'] == 'agenda.json']
        elif "name contains 'agenda-anterior-'" in q: lista = [a for a in lista if a['name'].startswith('agenda-anterior-')]
        lista = sorted(lista, key=lambda a: a['createdTime'], reverse=True)
        return json_({'files': [{k: v for k, v in a.items() if k != 'contenido'} for a in lista]})


def aparato(b, nube, datos=None, base=None, rev=None, sesion=True, extra_js='', ancho=1280):
    """Un celular o computador: su propio navegador con lo escrito en él. base/rev = lo que recuerda de la última sincronización."""
    ctx = contexto(b, ancho, 900, datos=datos if datos is not None else {})
    if base is not None: ctx.add_init_script("if (!sessionStorage.getItem('lrPruebaInit2')) { localStorage.setItem('lrDriveBase', %s); localStorage.setItem('lrDriveRev', %s); localStorage.setItem('lrDriveUid', '00000000-0000-0000-0000-000000000001'); sessionStorage.setItem('lrPruebaInit2', '1'); }" % (json.dumps(json.dumps(base)), json.dumps(rev or '')))
    if not sesion: ctx.add_init_script("localStorage.removeItem('sb-ngjoognzvehwjtpqwrqe-auth-token');")
    if extra_js: ctx.add_init_script(extra_js)
    ctx.route('**/functions/v1/google-drive', nube.funcion)
    ctx.route('https://www.googleapis.com/**', nube.api)
    ctx.route('https://accounts.google.com/**', lambda r: r.fulfill(status=200, content_type='text/html', body='<html>Google</html>'))
    return ctx


def local(pg): return json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')") or '{}')
def clientes(d): return [d[k] for k in sorted([k for k in d if re.match(r'^ag-p\d+-cliente$', k)], key=lambda k: int(re.findall(r'\d+', k)[0])) if d[k]]


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])

    # ---- 1. sin configurar o sin sesión: la tarjeta no aparece ----
    n = Nube(configurada=False); ctx = aparato(b, n); pg = abrir(ctx, '', 1500)
    t.v('función sin configurar: la tarjeta no aparece', pg.locator('#drive-sync').is_hidden()); ctx.close()
    n = Nube(); ctx = aparato(b, n, sesion=False); pg = abrir(ctx, '', 1500)
    t.v('sin sesión: la tarjeta no aparece y no se llama a la función', pg.locator('#drive-sync').is_hidden() and not n.llamadas, n.llamadas); ctx.close()

    # ---- 2. configurada, sin conectar ----
    n = Nube(conectada=False); ctx = aparato(b, n); pg = abrir(ctx, '', 1800)
    tx = pg.locator('#drive-sync').inner_text()
    t.v('sin conectar: la tarjeta aparece con «Conectar con Google Drive» y nada más', pg.locator('#ds-conectar').is_visible() and pg.locator('#ds-sincronizar').is_hidden() and pg.locator('#ds-desconectar').is_hidden() and pg.locator('#ds-borrar').is_hidden())
    t.v('explica que es gratis, que va a SU Drive y que Lana Rosa no ve los datos', 'gratis y opcional' in tx and 'no pasan por Lana Rosa' in tx and 'nadie del equipo' in tx, tx)
    t.v('no se imprime', 'no-imprimir' in pg.locator('#drive-sync').get_attribute('class'))
    pg.click('#ds-conectar'); pg.wait_for_timeout(1200)
    t.v('«Conectar» lleva a Google', pg.url.startswith('https://accounts.google.com/'), pg.url)
    t.v('sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()

    # ---- 3. conectada, Drive vacío: se crea la copia con lo de este aparato ----
    A = {'ag-p1-cliente': 'Ana', 'ag-p1-pedido': 'Oso', '_filas': {'tabla-pedidos': 8}}
    n = Nube(); ctx = aparato(b, n, datos=A); pg = abrir(ctx, '', 3200)
    t.v('conectada: muestra el correo, «Sincronizar ahora», «Versiones anteriores» y los dos botones de salida', 'sara@gmail.com' in pg.inner_text('#ds-texto') and pg.locator('#ds-sincronizar').is_visible() and pg.locator('#ds-versiones').is_visible() and pg.locator('#ds-desconectar').is_visible() and pg.locator('#ds-borrar').is_visible())
    t.v('Drive vacío: se crea la agenda en la carpeta oculta con lo de este aparato', n.principal() is not None and n.datos().get('ag-p1-cliente') == 'Ana', n.datos())
    t.v('el archivo lleva una marca de versión (rev) para detectar cambios de otro aparato', bool(n.principal()['appProperties'].get('rev')))
    base1 = json.loads(pg.evaluate("localStorage.getItem('lrDriveBase')") or 'null')
    t.v('este aparato recuerda lo que sincronizó (base)', base1 and base1.get('ag-p1-cliente') == 'Ana')
    t.v('sin errores de JavaScript', not pg.errs, pg.errs)
    # escribir algo nuevo: se sube sola unos segundos después
    pg.evaluate("document.getElementById('ag-p2-cliente').value = 'Beto'; document.getElementById('ag-p2-cliente').dispatchEvent(new Event('input', {bubbles: true}))"); pg.wait_for_timeout(9000)
    t.v('un cambio nuevo se guarda solo en Drive (sin tocar nada)', n.datos().get('ag-p2-cliente') == 'Beto', n.datos())
    e0 = n.escrituras
    for _ in range(3): pg.evaluate("window.lrDrive.ciclo({})"); pg.wait_for_timeout(1200)
    t.v('si no hay cambios, sincronizar no escribe nada más en Drive (ni bucles)', n.escrituras == e0, [e0, n.escrituras])
    ctx.close()

    # ---- 4. segundo aparato vacío: recupera todo ----
    ctx = aparato(b, n, datos={}); pg = abrir(ctx, '', 4500)
    d = local(pg)
    t.v('un aparato vacío recibe la agenda de Drive (y la página se recarga con ella)', clientes(d) == ['Ana', 'Beto'], d)
    t.v('se ven las fichas en la página', pg.locator('#ag-p1-cliente').input_value() == 'Ana' and pg.locator('#ag-p2-cliente').input_value() == 'Beto')
    t.v('Drive no se dañó al bajar', clientes(n.datos()) == ['Ana', 'Beto'])
    ctx.close()

    # ---- 5. cada aparato agregó un pedido distinto: se juntan los dos ----
    BASE = {'ag-p1-cliente': 'Ana', '_filas': {'tabla-pedidos': 8}}
    n = Nube(); n.poner('agenda.json', dict(BASE, **{'ag-p2-cliente': 'Beto'}), 'revA')        # el celular ya subió a Beto
    ctx = aparato(b, n, datos=dict(BASE, **{'ag-p2-cliente': 'Cami'}), base=BASE, rev='rev0'); pg = abrir(ctx, '', 5000)   # el computador agregó a Cami y no sabía de Beto
    d = local(pg)
    t.v('celular y computador agregaron un pedido distinto: en el computador quedan Ana, Beto y Cami', sorted(clientes(d)) == ['Ana', 'Beto', 'Cami'], clientes(d))
    t.v('y en Drive también (nadie borró a nadie)', sorted(clientes(n.datos())) == ['Ana', 'Beto', 'Cami'], clientes(n.datos()))
    rev_final = n.principal()['appProperties']['rev']
    ctx.close()
    # el celular, que tenía solo Ana y Beto, recibe a Cami
    ctx = aparato(b, n, datos=dict(BASE, **{'ag-p2-cliente': 'Beto'}), base=dict(BASE, **{'ag-p2-cliente': 'Beto'}), rev='revA'); pg = abrir(ctx, '', 5000)
    t.v('el celular también recibe a Cami y conserva a Beto', sorted(clientes(local(pg))) == ['Ana', 'Beto', 'Cami'], clientes(local(pg)))
    ctx.close()

    # ---- 6. la misma casilla distinta en los dos: gana este aparato y queda una versión anterior ----
    BASE2 = {'ag-duena': 'Sara', 'ag-mes-1': 'Enero'}
    n = Nube(); n.poner('agenda.json', dict(BASE2, **{'ag-mes-1': 'Desde el computador'}), 'revB')
    ctx = aparato(b, n, datos=dict(BASE2, **{'ag-mes-1': 'Desde el celular'}), base=BASE2, rev='rev0'); pg = abrir(ctx, '', 5000)
    t.v('misma casilla escrita distinto: gana este aparato', n.datos().get('ag-mes-1') == 'Desde el celular' and local(pg).get('ag-mes-1') == 'Desde el celular', n.datos())
    ant = n.anteriores()
    t.v('lo que había en Drive queda guardado en «Versiones anteriores»', len(ant) == 1 and ant[0]['contenido']['datos'].get('ag-mes-1') == 'Desde el computador', ant)
    t.v('avisa cuántas casillas chocaron y que la otra quedó en versiones anteriores', '1 casilla' in pg.inner_text('#ds-aviso') and 'Versiones anteriores' in pg.inner_text('#ds-aviso'), pg.inner_text('#ds-aviso'))
    # ver y restaurar
    pg.click('#ds-versiones'); pg.wait_for_timeout(900)
    t.v('«Versiones anteriores» muestra la lista con «Restaurar»', pg.locator('#ds-lista li button').count() == 1, pg.inner_text('#ds-lista'))
    pg.click('#ds-lista li button'); pg.wait_for_timeout(3500)
    t.v('restaurar vuelve a esa versión y la sube a Drive', n.datos().get('ag-mes-1') == 'Desde el computador' and local(pg).get('ag-mes-1') == 'Desde el computador', [n.datos(), local(pg)])
    t.v('antes de restaurar se guardó lo que había (se puede volver)', any(a['contenido']['datos'].get('ag-mes-1') == 'Desde el celular' for a in n.anteriores()), [a['contenido']['datos'].get('ag-mes-1') for a in n.anteriores()])
    ctx.close()

    # ---- 7. mientras escribes no te interrumpe: aviso «Actualizar» ----
    n = Nube(); n.poner('agenda.json', dict(BASE, **{'ag-p2-cliente': 'Beto'}), 'revC')
    ctx = aparato(b, n, datos=dict(BASE, **{'ag-p3-cliente': 'Dani'}), base=BASE, rev='rev0')
    pg = ctx.new_page(); pg.on('dialog', lambda d: d.accept()); pg.errs = []; pg.goto(BASE_URL if False else (__import__('agenda_util').BASE + '/agenda-rosina.html#control-pedidos'))
    pg.wait_for_selector('#ag-p1-cliente', state='attached'); pg.evaluate("document.dispatchEvent(new Event('agenda-guardada'))"); pg.wait_for_timeout(3500)   # como si acabara de escribir
    t.v('si estás escribiendo, no recarga: sale el aviso «Hay cambios de otro aparato»', pg.locator('#drive-banner').count() == 1 and 'cambios de otro aparato' in pg.inner_text('#drive-banner'), pg.locator('#drive-banner').count())
    t.v('lo tuyo (Dani) ya quedó en Drive y no se pierde', 'Dani' in clientes(n.datos()), clientes(n.datos()))
    t.v('lo del otro aparato (Beto) todavía no se aplicó a tu pantalla', 'Beto' not in clientes(local(pg)), clientes(local(pg)))
    pg.click('#drive-banner button'); pg.wait_for_timeout(3500)
    t.v('al tocar «Actualizar» llegan los cambios y no se pierde nada', sorted(clientes(local(pg))) == ['Ana', 'Beto', 'Dani'] and sorted(clientes(n.datos())) == ['Ana', 'Beto', 'Dani'], [clientes(local(pg)), clientes(n.datos())])
    ctx.close()

    # ---- 8. desconectar y borrar ----
    n = Nube(); n.poner('agenda.json', BASE, 'revD'); n.poner('agenda-anterior-x.json', {'ag-duena': 'viejo'}, 'z')
    ctx = aparato(b, n, datos=BASE, base=BASE, rev='revD'); pg = abrir(ctx, '', 2500)
    pg.click('#ds-desconectar'); pg.wait_for_timeout(1200)
    t.v('«Desconectar» avisa a la función y deja de mostrar los botones de sincronía', 'desconectar' in n.llamadas and pg.locator('#ds-conectar').is_visible() and pg.locator('#ds-sincronizar').is_hidden())
    t.v('desconectar no borra la copia de Drive ni lo de este aparato', n.principal() is not None and local(pg).get('ag-p1-cliente') == 'Ana')
    t.v('desconectar olvida lo que recordaba de la sincronización', pg.evaluate("localStorage.getItem('lrDriveBase')") is None and pg.evaluate("localStorage.getItem('lrDriveRev')") is None)
    ctx.close()
    n = Nube(); n.poner('agenda.json', BASE, 'revD'); n.poner('agenda-anterior-x.json', {'ag-duena': 'viejo'}, 'z')
    ctx = aparato(b, n, datos=BASE, base=BASE, rev='revD'); pg = abrir(ctx, '', 2500)
    pg.click('#ds-borrar'); pg.wait_for_timeout(1500)
    t.v('«Borrar mi agenda de Drive» borra la copia y las versiones anteriores y desconecta', not n.archivos and 'desconectar' in n.llamadas, list(n.archivos))
    t.v('y lo de este aparato queda intacto', local(pg).get('ag-p1-cliente') == 'Ana')
    ctx.close()

    # ---- 9. otra cuenta en el mismo navegador: no sincroniza ----
    n = Nube(); n.poner('agenda.json', {'ag-duena': 'De otra cuenta'}, 'revE')
    ctx = aparato(b, n, datos={'ag-p1-cliente': 'Ana'}, extra_js="localStorage.setItem('lrAgendaDueno', '99999999-9999-9999-9999-999999999999');"); pg = abrir(ctx, '', 4000)
    t.v('si el navegador tenía la agenda de otra cuenta, no se sube ni se baja nada', n.datos() == {'ag-duena': 'De otra cuenta'} and local(pg).get('ag-p1-cliente') == 'Ana', [n.datos(), local(pg)])
    ctx.close()

    # ---- 10. el permiso venció ----
    class Vencida(Nube):
        def funcion(s, route):
            c = route.request.post_data_json or {}
            if c.get('accion') == 'token': return route.fulfill(status=401, content_type='application/json', body=json.dumps({'error': 'El permiso venció. Vuelve a conectar tu Google Drive.', 'reconectar': True}))
            return Nube.funcion(s, route)
    n = Vencida(); ctx = aparato(b, n, datos={'ag-p1-cliente': 'Ana'}); pg = abrir(ctx, '', 3000)
    t.v('si el permiso venció, pide volver a conectar y la agenda sigue funcionando', 'venció' in pg.inner_text('#ds-aviso') and pg.locator('#ds-conectar').is_visible() and local(pg).get('ag-p1-cliente') == 'Ana', pg.inner_text('#ds-aviso'))
    ctx.close()

    # ---- 11. celular: sin desplazamiento horizontal y la tarjeta cabe ----
    n = Nube(); ctx = aparato(b, n, datos=A, ancho=390); pg = abrir(ctx, '', 2500)
    t.v('celular: sin desplazamiento horizontal', not pg.evaluate("document.documentElement.scrollWidth>innerWidth"))
    ctx.close()

    # ---- 12. en inglés ----
    n = Nube(conectada=False); ctx = aparato(b, n, extra_js="localStorage.setItem('lrAgendaIdioma','en');"); pg = abrir(ctx, '', 2500)
    te = pg.locator('#drive-sync').inner_text()
    t.v('en inglés: la tarjeta sale traducida', 'Save to your Google Drive' in te and 'Connect to Google Drive' in te, te[:200])
    ctx.close()
    b.close()
t.fin()

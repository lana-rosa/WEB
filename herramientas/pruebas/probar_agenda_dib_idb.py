#!/usr/bin/env python3
"""Los dibujos de la agenda viven en IndexedDB (js/agenda/dib-store.js, 3-nov-2026). Esta prueba es sobre todo de PÉRDIDA DE DATOS: migración, guardado, recarga,
copias de seguridad, borrar, otra cuenta en el mismo navegador, copia en la cuenta, Google Drive y el caso en que el navegador no tiene IndexedDB.
Uso: /usr/bin/python3 herramientas/pruebas/probar_agenda_dib_idb.py   (servidor local en el puerto 8765)"""
import json, os, sys, tempfile, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'probar_agenda_drive.py'), encoding='utf-8').read()
exec(src.split('with sync_playwright() as p:')[0])   # Nube, aparato, local (Google Drive simulado)
T = t
IMG = 'data:image/jpeg;base64,' + 'A' * 50000
DIB = {'puntos:1': {'s': [[0, 1, 100, 100, 200, 200, 300, 150]], 'img': ''}, 'ficha-proyecto:k1': {'s': [[1, 1, 50, 50, 60, 60]], 'img': IMG}}
OTRA = '99999999-9999-9999-9999-999999999999'
HOY = datetime.date.today().isoformat()
LS = lambda pg: json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')") or '{}')
def mem(pg): return pg.evaluate("JSON.parse(JSON.stringify(window.lrAgendaNucleo.datos()._dib || {}))")
TRAZO = """([sel, pts]) => { const c = document.querySelector(sel); const r = c.getBoundingClientRect();
  const mk = (t, p) => new PointerEvent(t, { pointerType: 'mouse', pointerId: 9, isPrimary: true, bubbles: true, cancelable: true, clientX: r.left + p[0], clientY: r.top + p[1] });
  c.dispatchEvent(mk('pointerdown', pts[0])); pts.slice(1).forEach(p => c.dispatchEvent(mk('pointermove', p))); c.dispatchEvent(mk('pointerup', pts[pts.length - 1])); }"""
def trazo(pg, sel='#puntos-lienzo canvas'):
    pg.evaluate(TRAZO, [sel, [[40, 40], [120, 60], [200, 90], [260, 70]]]); pg.wait_for_timeout(200)
def reabrir_config(pg): pg.evaluate("window.lrAgendaConfig && window.lrAgendaConfig.abrir(true)"); pg.wait_for_timeout(300)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])

    # ---- 1. migración: lo que había en localStorage pasa a IndexedDB, con respaldo, y se quita de localStorage ----
    ctx = contexto(b, 1280, 900, datos={'ag-duena': 'Sara', '_dib': DIB}); pg = abrir(ctx, 'hoja-puntos', 1800)
    T.v('migración: los dibujos quedaron en IndexedDB idénticos a los que había', dib_idb(pg) == DIB, list(dib_idb(pg)))
    T.v('migración: localStorage ya no lleva los dibujos (libera espacio) pero conserva lo demás', '_dib' not in LS(pg) and LS(pg).get('ag-duena') == 'Sara', list(LS(pg)))
    T.v('migración: queda la marca y el contador', pg.evaluate("localStorage.getItem('lrDibIdb')") == '1' and pg.evaluate("localStorage.getItem('lrDibN')") == '2')
    resp = pg.evaluate("window.lrDibStore.respaldoAntes()")
    T.v('migración: se guardó un respaldo del texto original (con los dibujos) por si hay que volver atrás', resp and '_dib' in (resp.get('texto') or '') and 'puntos:1' in resp['texto'])
    T.v('los dibujos están en memoria para dibujar', mem(pg) == DIB and pg.evaluate("window.lrDibStore.activo") is True)

    # ---- 2. dibujar: se guarda en IndexedDB y no en localStorage; sobrevive a recargar ----
    trazo(pg); g = dib_idb(pg)
    T.v('un trazo nuevo se guarda en IndexedDB', len(g['puntos:1']['s']) == 2, str(g.get('puntos:1'))[:120])
    T.v('y localStorage sigue sin dibujos', '_dib' not in LS(pg))
    pg.reload(); pg.wait_for_timeout(1800); reabrir_config(pg)
    T.v('al recargar, los dibujos vuelven (se cargan antes de pintar)', len(mem(pg).get('puntos:1', {}).get('s', [])) == 2 and mem(pg).get('ficha-proyecto:k1', {}).get('img') == IMG)
    pg.reload(); pg.wait_for_timeout(1800); reabrir_config(pg)
    T.v('y lo dibujado sigue ahí después de recargar otra vez (no se pisó con un lienzo vacío)', len(dib_idb(pg)['puntos:1']['s']) == 2)
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)

    # ---- 3. copia de seguridad: el archivo lleva los dibujos ----
    with pg.expect_download(timeout=6000) as dl: pg.click('#agenda-descargar')
    copia = json.load(open(dl.value.path()))
    T.v('«Guardar una copia» incluye los dibujos', set(copia['datos'].get('_dib', {})) == {'puntos:1', 'ficha-proyecto:k1'} and len(copia['datos']['_dib']['puntos:1']['s']) == 2)

    # ---- 4. cargar una copia: reemplaza los dibujos (también los quita si la copia no trae) ----
    def cargar(contenido):
        f = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8'); json.dump(contenido, f); f.close()
        pg.set_input_files('#agenda-archivo', f.name); pg.wait_for_timeout(2500); reabrir_config(pg)
    cargar({'agendaRosina': 1, 'fecha': '2026-11-01', 'datos': {'ag-duena': 'Otra', '_dib': {'puntos:1': {'s': [[2, 1, 10, 10, 20, 20]], 'img': ''}}}})
    g = dib_idb(pg)
    T.v('cargar una copia con dibujos: quedan solo los de la copia', list(g) == ['puntos:1'] and g['puntos:1']['s'][0][0] == 2, list(g))
    T.v('y localStorage no los lleva', '_dib' not in LS(pg) and LS(pg).get('ag-duena') == 'Otra')
    T.v('y la página los muestra tras recargar', mem(pg).get('puntos:1', {}).get('s', [[None]])[0][0] == 2)
    cargar({'agendaRosina': 1, 'fecha': '2026-11-01', 'datos': {'ag-duena': 'Sin dibujos'}})
    T.v('cargar una copia SIN dibujos deja la agenda sin dibujos viejos', dib_idb(pg) == {} and mem(pg) == {}, list(dib_idb(pg)))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()

    # ---- 5. borrar lo escrito ----
    ctx = contexto(b, 1280, 900, datos={'ag-duena': 'Sara', '_dib': DIB}); ctx.add_init_script("localStorage.setItem('rosinaAgendaCopia', '%s')" % HOY); pg = abrir(ctx, 'hoja-puntos', 1800)
    pg.click('#agenda-borrar'); pg.wait_for_timeout(1500)
    T.v('«Borrar lo escrito» también borra los dibujos (IndexedDB y contador)', dib_idb(pg) == {} and pg.evaluate("localStorage.getItem('lrDibN')") is None, list(dib_idb(pg)))
    pg.reload(); pg.wait_for_timeout(1500)
    T.v('y no reaparecen al recargar', mem(pg) == {} and dib_idb(pg) == {}); ctx.close()

    # ---- 6. otra cuenta en el mismo navegador: los dibujos cuentan como «hojas escritas» y se borran con «empezar nueva» ----
    ctx = contexto(b, 1280, 900, datos={'_dib': DIB}, config_abierta=False); pg = abrir(ctx, '', 1800, config=False)
    pg.evaluate("localStorage.setItem('lrAgendaDueno', %s)" % json.dumps(OTRA)); pg.reload(); pg.wait_for_timeout(1200)
    T.v('otra cuenta y solo dibujos escritos: aparece el aviso (no se muestran sin preguntar)', pg.locator('.dueno-fondo').is_visible())
    with pg.expect_download(timeout=6000) as dl: pg.click('#dueno-nueva')
    T.v('«empezar nueva» baja una copia CON los dibujos', set(json.load(open(dl.value.path()))['datos'].get('_dib', {})) == set(DIB))
    pg.wait_for_timeout(3000)
    T.v('y después IndexedDB queda vacío (la otra cuenta no ve esos dibujos)', dib_idb(pg) == {} and mem(pg) == {}, list(dib_idb(pg))); ctx.close()

    # ---- 7. copia en la cuenta: lo que se sube lleva los dibujos ----
    subidos = []
    ctx = contexto(b, 1280, 900, datos={'ag-duena': 'Sara', '_dib': DIB}, config_abierta=False)
    def rpc(r):
        n = r.request.url.split('/rpc/')[1].split('?')[0]; cuerpo = r.request.post_data_json or {}
        if n == 'agenda_nube_guardar': subidos.append(cuerpo.get('p_datos') or {}); out = {'ok': True, 'actualizado': '2026-11-03T10:00:00+00:00'}
        elif n == 'agenda_nube_leer': out = {'vacio': True}
        else: out = None
        r.fulfill(status=200, content_type='application/json', body=json.dumps(out))
    ctx.route('**/rest/v1/rpc/agenda_nube_*', rpc); pg = abrir(ctx, '', 3500, config=False)
    T.v('copia en la cuenta: lo que se sube lleva los dibujos (no solo lo de localStorage)', bool(subidos) and set(subidos[-1].get('_dib', {})) == set(DIB), [list(x.get('_dib', {})) for x in subidos]); ctx.close()

    # ---- 8. Google Drive (simulado) ----
    n = Nube(); ctx = aparato(b, n, datos={'ag-p1-cliente': 'Ana', '_dib': DIB}); pg = abrir(ctx, '', 4000)
    T.v('Drive: la copia que se sube lleva los dibujos', n.datos() is not None and set(n.datos().get('_dib', {})) == set(DIB), n.datos() and list(n.datos()))
    T.v('Drive: la base de la mezcla no vuelve a llenar localStorage con dibujos', '_dib' not in json.loads(pg.evaluate("localStorage.getItem('lrDriveBase')") or '{}'))
    e0 = n.escrituras
    for _ in range(2): pg.evaluate("window.lrDrive.ciclo({})"); pg.wait_for_timeout(1500)
    T.v('Drive: sincronizar otra vez no borra los dibujos de Drive ni escribe de más', set(n.datos().get('_dib', {})) == set(DIB) and n.escrituras == e0, [e0, n.escrituras])
    ctx.close()
    n = Nube(); n.poner('agenda.json', {'ag-p1-cliente': 'Ana', '_dib': {'puntos:1': {'s': [[3, 1, 5, 5, 9, 9]], 'img': ''}}}, 'r1')
    ctx = aparato(b, n, datos={}); pg = abrir(ctx, '', 6500)
    T.v('Drive: una agenda con dibujos de otro aparato llega a IndexedDB (y no queda vacía)', list(dib_idb(pg)) == ['puntos:1'], list(dib_idb(pg)))
    T.v('Drive: y localStorage no los lleva', '_dib' not in LS(pg)); ctx.close()
    n = Nube(); n.poner('agenda.json', {'ag-p1-cliente': 'Ana', '_dib': {'puntos:2': {'s': [[3, 1, 5, 5, 9, 9]], 'img': ''}}}, 'r2')
    ctx = aparato(b, n, datos={'ag-p2-cliente': 'Beto', '_dib': {'puntos:1': DIB['puntos:1']}}); pg = abrir(ctx, '', 7000)
    T.v('Drive: dos aparatos con dibujos distintos quedan con los dos (en Drive y en IndexedDB)', set(n.datos().get('_dib', {})) == {'puntos:1', 'puntos:2'} and set(dib_idb(pg)) == {'puntos:1', 'puntos:2'}, [list(n.datos().get('_dib', {})), list(dib_idb(pg))]); ctx.close()

    # ---- 9. navegador sin IndexedDB: todo sigue como antes, sin perder nada ----
    ctx = contexto(b, 1280, 900, datos={'ag-duena': 'Sara', '_dib': DIB}); ctx.add_init_script("Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true });")
    pg = abrir(ctx, 'hoja-puntos', 1800)
    T.v('sin IndexedDB: no se migra y los dibujos siguen en localStorage (como antes)', pg.evaluate("window.lrDibStore.activo") is False and set(LS(pg).get('_dib', {})) == set(DIB) and pg.evaluate("localStorage.getItem('lrDibIdb')") is None)
    trazo(pg); pg.wait_for_timeout(500)
    T.v('sin IndexedDB: se puede dibujar y queda guardado en localStorage', len(LS(pg)['_dib']['puntos:1']['s']) == 2)
    T.v('sin IndexedDB: sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()

    # ---- 10. con IndexedDB caben fotos que antes no cabían (tope de 1,8 millones de letras) ----
    grande = {'ficha-proyecto:k1': {'s': [], 'img': 'data:image/jpeg;base64,' + 'B' * 3000000}}
    ctx = contexto(b, 1280, 900, datos={'ag-duena': 'Sara', '_dib': grande}); pg = abrir(ctx, 'hoja-puntos', 2500)
    T.v('una foto de 3 millones de letras (más que el tope antiguo) se guarda en IndexedDB y localStorage queda liviano',
        len(dib_idb(pg).get('ficha-proyecto:k1', {}).get('img', '')) > 3000000 and len(pg.evaluate("localStorage.getItem('rosinaAgenda')")) < 5000)
    T.v('y el tope nuevo es mayor', pg.evaluate("window.lrDibStore.limites().img") > 10000000); ctx.close()
T.fin()

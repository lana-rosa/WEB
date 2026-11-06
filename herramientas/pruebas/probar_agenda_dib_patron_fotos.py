#!/usr/bin/env python3
"""Revisión de las fotos de «Diseña tu patrón» (hasta 12 por patrón, claves `disena-patron:<ficha>:f<n>` con { s: [], img, t } dentro de datos._dib) frente a copias, copia en la cuenta,
Google Drive y borrado de la ficha. Se prueba con datos de ejemplo con esa forma (6-nov-2026); no depende de que la función de las fotos esté publicada.
Uso: /usr/bin/python3 herramientas/pruebas/probar_agenda_dib_patron_fotos.py   (servidor local en el puerto 8765)"""
import json, os, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'probar_agenda_drive.py'), encoding='utf-8').read()
exec(src.split('with sync_playwright() as p:')[0])   # Nube, aparato, local (Google Drive simulado)
T = t
def foto(c, tx): return {'s': [], 'img': 'data:image/jpeg;base64,' + c * 2000, 't': tx}
FOTOS = {'disena-patron:k1:f1': foto('A', 'Cuello'), 'disena-patron:k1:f2': foto('B', 'Manga'), 'disena-patron:k2:f1': foto('C', 'Otro patrón')}
def mem(pg): return pg.evaluate("JSON.parse(JSON.stringify(window.lrAgendaNucleo.datos()._dib || {}))")
LS = lambda pg: json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')") or '{}')

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])

    # 1. guardar, recargar y copia de seguridad
    ctx = contexto(b, 1280, 900, datos={'ag-duena': 'Sara', '_dib': FOTOS}); pg = abrir(ctx, '', 2500)
    g = dib_idb(pg)
    T.v('las fotos con su descripción están en IndexedDB y no en localStorage', set(g) == set(FOTOS) and g['disena-patron:k1:f2']['t'] == 'Manga' and '_dib' not in LS(pg), list(g))
    pg.reload(); pg.wait_for_timeout(2500)
    T.v('al recargar siguen ahí con foto y descripción', mem(pg)['disena-patron:k1:f1']['t'] == 'Cuello' and mem(pg)['disena-patron:k1:f1']['img'] == FOTOS['disena-patron:k1:f1']['img'])
    pg.evaluate("window.lrAgendaConfig.abrir(true)"); pg.wait_for_timeout(300)
    with pg.expect_download(timeout=6000) as dl: pg.click('#agenda-descargar')
    copia = json.load(open(dl.value.path()))['datos']['_dib']
    T.v('«Guardar una copia» lleva las fotos, sus descripciones y las imágenes completas', set(copia) == set(FOTOS) and all(copia[k]['t'] == FOTOS[k]['t'] and copia[k]['img'] == FOTOS[k]['img'] for k in FOTOS))
    f = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8'); json.dump({'agendaRosina': 1, 'fecha': '2026-11-06', 'datos': {'ag-duena': 'Copia', '_dib': {'disena-patron:k9:f1': foto('Z', 'Solo de la copia')}}}, f); f.close()
    pg.set_input_files('#agenda-archivo', f.name); pg.wait_for_timeout(2500)
    T.v('cargar una copia reemplaza las fotos por las de la copia (con su descripción)', list(dib_idb(pg)) == ['disena-patron:k9:f1'] and dib_idb(pg)['disena-patron:k9:f1']['t'] == 'Solo de la copia', list(dib_idb(pg)))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()

    # 2. copia en la cuenta: si no cabe (3 MB) se suben sin las imágenes pero CON la descripción
    GRANDE = {'disena-patron:k1:f1': {'s': [], 'img': 'data:image/jpeg;base64,' + 'C' * 3500000, 't': 'Cuello'}, 'disena-patron:k1:f2': {'s': [], 'img': 'data:image/jpeg;base64,' + 'D' * 1000, 't': 'Manga'}}
    subidos = []
    ctx = contexto(b, 1280, 900, datos={'ag-duena': 'Sara', '_dib': GRANDE}, config_abierta=False)
    def rpc(r):
        n = r.request.url.split('/rpc/')[1].split('?')[0]; cuerpo = r.request.post_data_json or {}
        if n == 'agenda_nube_guardar': subidos.append(cuerpo.get('p_datos') or {}); out = {'ok': True, 'actualizado': '2026-11-06T10:00:00+00:00'}
        elif n == 'agenda_nube_leer': out = {'vacio': True}
        else: out = None
        r.fulfill(status=200, content_type='application/json', body=json.dumps(out))
    ctx.route('**/rest/v1/rpc/agenda_nube_*', rpc); pg = abrir(ctx, '', 3500, config=False)
    u = subidos[-1] if subidos else {}; ud = u.get('_dib', {})
    T.v('copia en la cuenta con fotos muy grandes: sube sin las imágenes, lo marca y cabe en 3 MB', u.get('_dibSinFotos') == 1 and set(ud) == set(GRANDE) and all(not v.get('img') for v in ud.values()) and len(json.dumps(u)) < 2900000)
    T.v('y conserva la descripción de cada foto (no se pierde en la cuenta)', ud.get('disena-patron:k1:f1', {}).get('t') == 'Cuello' and ud.get('disena-patron:k1:f2', {}).get('t') == 'Manga', ud)
    T.v('las imágenes siguen intactas en este dispositivo', len(dib_idb(pg)['disena-patron:k1:f1']['img']) == 3500000 + len('data:image/jpeg;base64,')); ctx.close()

    # 3. Google Drive (simulado): se suben con descripción y dos aparatos con fotos distintas quedan con todas
    n = Nube(); ctx = aparato(b, n, datos={'ag-p1-cliente': 'Ana', '_dib': FOTOS}); pg = abrir(ctx, '', 4000)
    T.v('Drive: lo que se sube lleva las fotos con su descripción', n.datos() is not None and n.datos().get('_dib', {}).get('disena-patron:k1:f2', {}).get('t') == 'Manga' and set(n.datos()['_dib']) == set(FOTOS)); ctx.close()
    n = Nube(); n.poner('agenda.json', {'ag-p1-cliente': 'Ana', '_dib': {'disena-patron:k1:f3': foto('E', 'Desde el celular')}}, 'r1')
    ctx = aparato(b, n, datos={'ag-p2-cliente': 'Beto', '_dib': {'disena-patron:k1:f1': FOTOS['disena-patron:k1:f1']}}); pg = abrir(ctx, '', 7000)
    T.v('Drive: dos aparatos con fotos distintas del mismo patrón quedan con las dos (en Drive y en IndexedDB)', set(n.datos().get('_dib', {})) == {'disena-patron:k1:f1', 'disena-patron:k1:f3'} and set(dib_idb(pg)) == {'disena-patron:k1:f1', 'disena-patron:k1:f3'}, [list(n.datos().get('_dib', {})), list(dib_idb(pg))])
    T.v('Drive: cada foto conserva su descripción', dib_idb(pg)['disena-patron:k1:f3']['t'] == 'Desde el celular' and dib_idb(pg)['disena-patron:k1:f1']['t'] == 'Cuello'); ctx.close()

    # 4. borrar la ficha: se van todas sus fotos y solo las suyas
    ctx = contexto(b, 1280, 900, datos={'ag-duena': 'Sara'}); pg = abrir(ctx, 'disena-patron', 2500)
    actual = pg.evaluate("window.lrVersiones.actual('disena-patron')")
    pg.evaluate("""([a, o]) => { const d = window.lrAgendaNucleo.datos(); d._dib = d._dib || {};
      [1, 2, 3].forEach(i => d._dib['disena-patron:' + a + ':f' + i] = { s: [], img: 'data:image/jpeg;base64,AAAA', t: 'F' + i });
      d._dib['disena-patron:' + a + '0:f1'] = { s: [], img: 'data:image/jpeg;base64,BBBB', t: 'otra ficha parecida' };
      d._dib['disena-patron:' + o + ':f1'] = { s: [], img: 'data:image/jpeg;base64,CCCC', t: 'otro patrón' };
      d._dib['ficha-proyecto:' + a] = { s: [[1, 1, 2, 2, 3, 3]], img: '' }; window.lrAgendaNucleo.guardar(); }""", [actual, 'zz'])
    pg.wait_for_timeout(800)
    t_antes = len(dib_idb(pg))
    pg.click('#disena-patron .vers-nueva'); pg.wait_for_timeout(300)
    pg.evaluate("window.lrVersiones.actual('disena-patron')")
    # volver a la ficha con fotos y borrarla
    pg.evaluate("""(a) => { const item = document.querySelector('#disena-patron .vers-item[data-k="' + a + '"] .vers-cab'); item && item.click(); }""", actual); pg.wait_for_timeout(300)
    pg.click('#disena-patron .vers-borrar'); pg.wait_for_timeout(1200)
    g = dib_idb(pg); claves = set(g)
    T.v('al borrar la ficha se van todas sus fotos (f1, f2 y f3)', not any(k.startswith('disena-patron:' + actual + ':') for k in claves), sorted(claves))
    T.v('y no se borran las de otra ficha, aunque su número empiece igual ni otras hojas', 'disena-patron:' + actual + '0:f1' in claves and 'disena-patron:zz:f1' in claves and ('ficha-proyecto:' + actual) in claves, sorted(claves))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()
    b.close()
t.fin()

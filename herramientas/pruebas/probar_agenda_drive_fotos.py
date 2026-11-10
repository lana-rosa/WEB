#!/usr/bin/env python3
"""Fotos de los dibujos en ARCHIVOS PROPIOS de Drive (js/agenda/drive-sync.js, 6-nov-2026): agenda.json lleva `imgRef` en vez de la foto; cada foto es `foto-<huella>.json`.
Es sobre todo de PÉRDIDA DE DATOS. Google Drive simulado (Nube de probar_agenda_drive.py). Uso: /usr/bin/python3 herramientas/pruebas/probar_agenda_drive_fotos.py (servidor local en el puerto 8765)"""
import json, os, sys, hashlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'probar_agenda_drive.py'), encoding='utf-8').read()
exec(src.split('with sync_playwright() as p:')[0])   # Nube, aparato, local
T = t
def foto(c, tx=None, n=3000):
    e = {'s': [], 'img': 'data:image/jpeg;base64,' + c * n}
    if tx: e['t'] = tx
    return e
def h(e): return hashlib.sha256(e['img'].encode()).hexdigest()[:32]
F = {'disena-patron:k1:f1': foto('A', 'Cuello'), 'disena-patron:k1:f2': foto('B', 'Manga'), 'ficha-proyecto:k1': foto('C')}
def fotos(n): return {a['name']: a for a in n.archivos.values() if a['name'].startswith('foto-')}

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])

    # 1. subir: agenda.json sin fotos y una foto por archivo
    n = Nube(); ctx = aparato(b, n, datos={'ag-p1-cliente': 'Ana', '_dib': F}); pg = abrir(ctx, '', 4500)
    d = n.datos() or {}; dd = d.get('_dib', {}); fs = fotos(n)
    T.v('agenda.json no lleva las fotos: solo la huella de cada una', set(dd) == set(F) and all(not v.get('img') and v.get('imgRef') == h(F[k]) for k, v in dd.items()), {k: (len(v.get('img', '')), v.get('imgRef')) for k, v in dd.items()})
    T.v('cada foto está en su propio archivo foto-<huella>.json con la imagen completa', set(fs) == {'foto-' + h(e) + '.json' for e in F.values()} and all(fs['foto-' + h(e) + '.json']['contenido']['img'] == e['img'] for e in F.values()), list(fs))
    T.v('la descripción y los trazos siguen dentro de agenda.json', dd['disena-patron:k1:f1'].get('t') == 'Cuello' and dd['disena-patron:k1:f2'].get('t') == 'Manga')
    T.v('agenda.json quedó chico (no crece con las fotos)', len(json.dumps(d)) < 4000, len(json.dumps(d)))
    e0 = n.escrituras
    for _ in range(2): pg.evaluate("window.lrDrive.ciclo({})"); pg.wait_for_timeout(1500)
    T.v('sincronizar otra vez no sube nada de más (ni fotos repetidas)', n.escrituras == e0 and len(fotos(n)) == 3, [e0, n.escrituras, len(fotos(n))])
    T.v('lo local conserva las fotos completas (no quedan huellas en IndexedDB)', all(dib_idb(pg)[k]['img'] == F[k]['img'] and 'imgRef' not in dib_idb(pg)[k] for k in F)); 
    T.v('sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()

    # 2. otro aparato vacío: baja agenda.json y sus fotos
    ctx = aparato(b, n, datos={}); pg = abrir(ctx, '', 7000)
    g = dib_idb(pg)
    T.v('un aparato nuevo recibe las fotos completas y sus descripciones', set(g) == set(F) and all(g[k]['img'] == F[k]['img'] for k in F) and g['disena-patron:k1:f2']['t'] == 'Manga' and all('imgRef' not in v for v in g.values()), {k: len(v.get('img', '')) for k, v in g.items()})
    T.v('y no sube nada nuevo', len(fotos(n)) == 3); ctx.close()

    # 3. dos aparatos con fotos distintas: quedan todas
    n = Nube(); n.poner('agenda.json', {'ag-p1-cliente': 'Ana', '_dib': {'disena-patron:k1:f3': {'s': [], 'img': '', 'imgRef': h(foto('E')), 't': 'Del celular'}}}, 'r1')
    fid = n.poner('foto-' + h(foto('E')) + '.json', None, '', {'tipo': 'foto'}); n.archivos[fid]['contenido'] = {'img': foto('E')['img']}
    ctx = aparato(b, n, datos={'ag-p2-cliente': 'Beto', '_dib': {'disena-patron:k1:f1': foto('A', 'Cuello')}}); pg = abrir(ctx, '', 7500)
    g = dib_idb(pg); dd = n.datos().get('_dib', {})
    T.v('dos aparatos con fotos distintas del mismo patrón: quedan las dos en IndexedDB, con imagen', set(g) == {'disena-patron:k1:f1', 'disena-patron:k1:f3'} and g['disena-patron:k1:f3']['img'] == foto('E')['img'] and g['disena-patron:k1:f1']['img'] == foto('A')['img'], {k: len(v.get('img', '')) for k, v in g.items()})
    T.v('y en Drive quedan las dos citadas y con sus archivos', set(dd) == {'disena-patron:k1:f1', 'disena-patron:k1:f3'} and len(fotos(n)) == 2, [list(dd), list(fotos(n))]); ctx.close()

    # 4. un agenda.json VIEJO (fotos dentro) se entiende y se migra solo
    n = Nube(); n.poner('agenda.json', {'ag-p1-cliente': 'Ana', '_dib': {'disena-patron:k1:f1': foto('A', 'Vieja')}}, 'r0')
    ctx = aparato(b, n, datos={}); pg = abrir(ctx, '', 7500)
    dd = n.datos().get('_dib', {})
    T.v('agenda.json viejo (con fotos dentro): el aparato las recibe', dib_idb(pg).get('disena-patron:k1:f1', {}).get('img') == foto('A')['img'] and dib_idb(pg)['disena-patron:k1:f1']['t'] == 'Vieja', list(dib_idb(pg)))
    T.v('y Drive se migra: agenda.json sin la foto y su archivo propio', not dd['disena-patron:k1:f1'].get('img') and dd['disena-patron:k1:f1'].get('imgRef') == h(foto('A')) and len(fotos(n)) == 1, [dd, list(fotos(n))]); ctx.close()

    # 5. si falta el archivo de una foto: NO se pierde lo demás ni se bloquea
    n = Nube(); n.poner('agenda.json', {'ag-p1-cliente': 'Ana', 'ag-p2-cliente': 'Beto', '_dib': {'disena-patron:k1:f1': {'s': [], 'img': '', 'imgRef': 'f' * 32, 't': 'Perdida'}}}, 'r1')
    ctx = aparato(b, n, datos={}); pg = abrir(ctx, '', 7500)
    L = local(pg)
    T.v('si el archivo de una foto ya no existe, el resto de la agenda llega igual (esa foto queda sin imagen)', L.get('ag-p2-cliente') == 'Beto' and dib_idb(pg).get('disena-patron:k1:f1', {}).get('t') == 'Perdida' and not dib_idb(pg)['disena-patron:k1:f1'].get('img'), [L.get('ag-p2-cliente'), dib_idb(pg)])
    ctx.close()

    # 6. borrar una foto o una ficha: el archivo huérfano se limpia (solo si tiene más de un día) y NUNCA uno citado
    n = Nube(); ctx = aparato(b, n, datos={'ag-p1-cliente': 'Ana', '_dib': F}); pg = abrir(ctx, '', 4500)
    viejo = 'foto-' + 'a' * 32 + '.json'; fid = n.poner(viejo, {'img': 'data:image/jpeg;base64,ZZZ'}, '', {'tipo': 'foto'}); n.archivos[fid]['createdTime'] = '2026-01-01T00:00:00Z'
    nuevo = 'foto-' + 'b' * 32 + '.json'; fid2 = n.poner(nuevo, {'img': 'data:image/jpeg;base64,YYY'}, '', {'tipo': 'foto'}); n.archivos[fid2]['createdTime'] = '2099-01-01T00:00:00Z'
    pg.evaluate("localStorage.setItem('lrDriveSnap', '1')"); pg.evaluate("() => { const d = window.lrAgendaNucleo.datos(); d['ag-p1-cliente'] = 'Ana 2'; window.lrAgendaNucleo.guardar(); }"); pg.wait_for_timeout(9000)
    fs = fotos(n)
    T.v('la limpieza borra la foto huérfana vieja, deja la reciente (margen de un día) y nunca las citadas', viejo not in fs and nuevo in fs and len([k for k in fs if k.startswith('foto-') and k[5:-5] in {h(e) for e in F.values()}]) == 3, sorted(fs))
    ctx.close()

    # 7. «Borrar mi agenda de Drive» con más de 20 archivos
    n = Nube(); ctx = aparato(b, n, datos={'ag-p1-cliente': 'Ana'}); pg = abrir(ctx, '', 3500)
    for i in range(45): n.poner('foto-%032x.json' % i, {'img': 'data:image/jpeg;base64,AAA'}, '', {'tipo': 'foto'})
    pg.evaluate("window.lrAgendaConfig.abrir(true)"); pg.wait_for_timeout(300); pg.click('#ds-borrar'); pg.wait_for_timeout(5000)
    T.v('«Borrar mi agenda de Drive» borra todo aunque haya 45 fotos (la búsqueda trae de a 20)', not n.archivos, len(n.archivos)); ctx.close()

    # 8. restaurar una versión anterior con fotos en archivos propios
    A1, B1 = foto('A', 'Foto vieja'), foto('B', 'Foto nueva')
    n = Nube()
    def archivo_foto(e):
        fid = n.poner('foto-' + h(e) + '.json', None, '', {'tipo': 'foto'}); n.archivos[fid]['contenido'] = {'img': e['img']}
    archivo_foto(A1); archivo_foto(B1)
    ref = lambda e: {'s': [], 'img': '', 'imgRef': h(e), 't': e['t']}
    n.poner('agenda.json', {'ag-p1-cliente': 'Ana', '_dib': {'disena-patron:k1:f1': ref(B1)}}, 'r2')
    n.poner('agenda-anterior-2026-11-01T10-00-00-000Z.json', {'ag-p1-cliente': 'Ana', '_dib': {'disena-patron:k1:f1': ref(A1)}}, 'ant', {'tipo': 'anterior', 'motivo': 'conflicto'})
    ctx = aparato(b, n, datos={}); pg = abrir(ctx, '', 6500)
    T.v('antes de restaurar el aparato tiene la foto nueva', dib_idb(pg).get('disena-patron:k1:f1', {}).get('img') == B1['img'])
    pg.evaluate("window.lrAgendaConfig.abrir(true)"); pg.wait_for_timeout(300); pg.click('#ds-versiones'); pg.wait_for_timeout(1200)
    pg.locator('#ds-lista li', has_text='Antes de mezclar').locator('button').click(); pg.wait_for_timeout(4500)   # la versión sembrada (hay otras, creadas solas al arrancar)
    g = dib_idb(pg); dd = n.datos().get('_dib', {})
    T.v('restaurar vuelve a la foto de esa versión (completa y con su descripción)', g.get('disena-patron:k1:f1', {}).get('img') == A1['img'] and g['disena-patron:k1:f1']['t'] == 'Foto vieja', [{k: len(v.get('img', '')) for k, v in g.items()}, pg.inner_text('#ds-aviso'), pg.errs])
    T.v('y Drive queda con agenda.json citando esa foto y sus dos archivos intactos (la nueva sigue en una versión anterior)', dd.get('disena-patron:k1:f1', {}).get('imgRef') == h(A1) and len(fotos(n)) == 2 and any(h(B1) in json.dumps(a['contenido']) for a in n.anteriores()), [dd, list(fotos(n))])
    T.v('sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()
t.fin()

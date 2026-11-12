#!/usr/bin/env python3
"""Galerías de fotos por ficha (hasta 8 por «Ficha de proyecto», 12 por patrón): API `lrDibStore.fotos` (js/agenda/dib-store.js, 12-nov-2026) y cómo viajan por IndexedDB, copias,
copia en la cuenta, Google Drive y el borrado de la ficha. Es sobre todo de PÉRDIDA DE DATOS.
Uso: /usr/bin/python3 herramientas/pruebas/probar_agenda_fotos_galeria.py   (servidor local en el puerto 8765)"""
import base64, io, json, os, random, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'probar_agenda_drive.py'), encoding='utf-8').read()
exec(src.split('with sync_playwright() as p:')[0])   # Nube, aparato, local (Google Drive simulado)
T = t
from PIL import Image
def jpg(ancho, alto, ruido=True):
    random.seed(7); im = Image.frombytes('RGB', (ancho, alto), bytes(random.getrandbits(8) for _ in range(ancho * alto * 3))) if ruido else Image.new('RGB', (ancho, alto), (230, 120, 160))
    b = io.BytesIO(); im.save(b, 'JPEG', quality=92); return base64.b64encode(b.getvalue()).decode()
def foto(c, n=60000): return 'data:image/jpeg;base64,' + c * n
F = "window.lrDibStore.fotos"
def mem(pg): return pg.evaluate("JSON.parse(JSON.stringify(window.lrAgendaNucleo.datos()._dib || {}))")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    ctx = contexto(b, 1280, 900, datos={'ag-duena': 'Sara', '_dib': {'ficha-proyecto:k1': {'s': [[1, 1, 2, 2, 3, 3]], 'img': ''}}}); pg = abrir(ctx, '', 2500)

    # 1. máximos y claves
    T.v('el máximo es 8 por proyecto y 12 por patrón', pg.evaluate(F + ".maximo('ficha-proyecto')") == 8 and pg.evaluate(F + ".maximo('disena-patron')") == 12)
    r = [pg.evaluate("([h, a]) => " + F + ".agregar(h, 'k1', a, 'F')", ['ficha-proyecto', foto(c, 100)]) for c in 'ABCDEFGH']
    T.v('se agregan 8 fotos al proyecto con claves ficha-proyecto:k1:f1 … f8', all(x['ok'] for x in r) and [x['clave'] for x in r] == ['ficha-proyecto:k1:f%d' % i for i in range(1, 9)], r)
    r9 = pg.evaluate("([h, a]) => " + F + ".agregar(h, 'k1', a, '')", ['ficha-proyecto', foto('Z', 100)])
    T.v('la novena se rechaza con motivo «maximo» y no se guarda', not r9['ok'] and r9['motivo'] == 'maximo' and len(pg.evaluate(F + ".lista('ficha-proyecto', 'k1')")) == 8, r9)
    T.v('el dibujo del proyecto (ficha-proyecto:k1) NO cuenta como foto de la galería y sigue intacto', 'ficha-proyecto:k1' in mem(pg) and mem(pg)['ficha-proyecto:k1']['s'] == [[1, 1, 2, 2, 3, 3]] and all(x['clave'] != 'ficha-proyecto:k1' for x in pg.evaluate(F + ".lista('ficha-proyecto', 'k1')")))
    pg.evaluate("([h, a]) => " + F + ".agregar(h, 'k10', a, 'otra')", ['ficha-proyecto', foto('Y', 100)]); pg.evaluate("([h, a]) => " + F + ".agregar(h, 'k2', a, 'otra')", ['ficha-proyecto', foto('X', 100)])
    T.v('las galerías de otra ficha (k2, k10) y de otra hoja no se mezclan con la de k1', len(pg.evaluate(F + ".lista('ficha-proyecto', 'k1')")) == 8 and len(pg.evaluate(F + ".lista('ficha-proyecto', 'k10')")) == 1 and len(pg.evaluate(F + ".lista('ficha-proyecto', 'k2')")) == 1 and len(pg.evaluate(F + ".lista('disena-patron', 'k1')")) == 0)
    T.v('una imagen que no es dataURL se rechaza', pg.evaluate("() => " + F + ".agregar('ficha-proyecto', 'k3', 'hola', '')")['motivo'] == 'imagen')
    # etiquetar y quitar
    pg.evaluate("() => " + F + ".etiquetar('ficha-proyecto:k1:f2', 'Antes')"); pg.evaluate("() => " + F + ".quitar('ficha-proyecto:k1:f3')")
    l = pg.evaluate(F + ".lista('ficha-proyecto', 'k1')")
    T.v('etiquetar cambia la descripción y quitar borra solo esa foto', len(l) == 7 and [x for x in l if x['n'] == 2][0]['t'] == 'Antes' and all(x['n'] != 3 for x in l))
    n = pg.evaluate("() => " + F + ".agregar('ficha-proyecto', 'k1', 'data:image/jpeg;base64,QQ==', 'nueva')")
    T.v('al quitar una, la siguiente reutiliza el primer número libre (f3)', n['ok'] and n['clave'] == 'ficha-proyecto:k1:f3', n)
    # espacio
    pg.evaluate("() => { window.lrDibStore.limites = () => ({ img: 300000, puntos: 100 }); }")
    e = pg.evaluate("([h, a]) => " + F + ".agregar(h, 'k5', a, '')", ['ficha-proyecto', foto('W', 350000)])
    T.v('si el total de fotos pasa el tope de espacio se rechaza con «espacio»', not e['ok'] and e['motivo'] == 'espacio', e)
    pg.wait_for_timeout(1200); pg.reload(); pg.wait_for_timeout(2500)   # el guardado en IndexedDB espera 300 ms tras el último cambio

    # 2. persistencia: IndexedDB y recarga
    g = dib_idb(pg); l = pg.evaluate(F + ".lista('ficha-proyecto', 'k1')")
    T.v('las fotos están en IndexedDB y no en localStorage; al recargar siguen ahí con su descripción', 'ficha-proyecto:k1:f2' in g and g['ficha-proyecto:k1:f2']['t'] == 'Antes' and len(l) == 8 and '_dib' not in json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')") or '{}'))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()

    # 3. reducir: adaptativa
    ctx = contexto(b, 1280, 900, datos={'ag-duena': 'Sara'}); pg = abrir(ctx, '', 2500)
    grande = jpg(3000, 2000); chica = jpg(400, 300, ruido=False)
    res = pg.evaluate("""async ([g, c]) => { const mk = (b64) => new File([Uint8Array.from(atob(b64), x => x.charCodeAt(0))], 'f.jpg', { type: 'image/jpeg' });
      const a = await window.lrDibStore.fotos.reducir(mk(g)), b = await window.lrDibStore.fotos.reducir(mk(c));
      const dim = (u) => new Promise(r => { const i = new Image(); i.onload = () => r([i.width, i.height]); i.src = u; });
      return { a: a.length, b: b.length, da: await dim(a), db: await dim(b), tope: window.lrDibStore.fotos.TOPE_FOTO }; }""", [grande, chica])
    T.v('una foto de 3000×2000 con mucho detalle se reduce a ≤ 1600 px y pesa menos que el tope por foto', max(res['da']) <= 1600 and res['a'] <= res['tope'], res)
    T.v('una foto chica no se agranda ni se infla', res['db'] == [400, 300] and res['b'] < 60000, res); ctx.close()

    # 4. copia de seguridad grande (más de 5 MB) se puede volver a cargar
    ctx = contexto(b, 1280, 900, datos={'ag-duena': 'Sara'}); pg = abrir(ctx, '', 2500)
    pg.evaluate("([a]) => { const F = window.lrDibStore.fotos; for (let i = 0; i < 8; i++) F.agregar('ficha-proyecto', 'k1', a.replace('A', String(i)), 'Foto ' + i); }", ['data:image/jpeg;base64,' + 'A' * 850000])
    pg.wait_for_timeout(900); pg.evaluate("window.lrAgendaConfig.abrir(true)"); pg.wait_for_timeout(300)
    with pg.expect_download(timeout=20000) as dl: pg.click('#agenda-descargar')
    import shutil; ruta = os.path.join(tempfile.mkdtemp(), 'copia.json'); shutil.copy(dl.value.path(), ruta); tam = os.path.getsize(ruta); copia = json.load(open(ruta))['datos']['_dib']
    T.v('la copia de seguridad con 8 fotos pesa más de 5 MB y las lleva todas con su descripción', tam > 5 * 1024 * 1024 and len([k for k in copia if k.startswith('ficha-proyecto:k1:f')]) == 8 and copia['ficha-proyecto:k1:f4']['t'] == 'Foto 3', tam)
    ctx.close()
    ctx = contexto(b, 1280, 900, datos={'ag-duena': 'Otra'}); pg = abrir(ctx, '', 2500)
    pg.set_input_files('#agenda-archivo', ruta); pg.wait_for_timeout(5000)
    T.v('esa copia grande se puede CARGAR de nuevo (antes se rechazaba por pasar de 5 MB) y deja las 8 fotos', len([k for k in dib_idb(pg) if k.startswith('ficha-proyecto:k1:f')]) == 8, list(dib_idb(pg))[:3]); ctx.close()

    # 5. Drive: cada foto va en su archivo y agenda.json queda chico; otro aparato las recibe
    n = Nube(); ctx = aparato(b, n, datos={'ag-p1-cliente': 'Ana', '_dib': {'ficha-proyecto:k1:f%d' % i: {'s': [], 'img': foto(chr(65 + i), 30000), 't': 'F%d' % i} for i in range(1, 9)}}); pg = abrir(ctx, '', 5000)
    fs = [a for a in n.archivos.values() if a['name'].startswith('foto-')]; ag = n.datos() or {}
    T.v('Drive: 8 fotos de un proyecto = 8 archivos propios y agenda.json sin imágenes', len(fs) == 8 and all(not v.get('img') and v.get('imgRef') for v in ag.get('_dib', {}).values()) and len(json.dumps(ag)) < 6000, [len(fs), len(json.dumps(ag))]); ctx.close()
    ctx = aparato(b, n, datos={}); pg = abrir(ctx, '', 8000)
    g = dib_idb(pg)
    T.v('Drive: un aparato nuevo recibe las 8 fotos con imagen y descripción', len(g) == 8 and all(v.get('img') and 'imgRef' not in v for v in g.values()) and g['ficha-proyecto:k1:f5']['t'] == 'F5', {k: len(v.get('img', '')) for k, v in g.items()}); ctx.close()

    # 6. borrar la ficha borra sus fotos (y solo las suyas); vaciar el último proyecto también
    ctx = contexto(b, 1280, 900, datos={'ag-duena': 'Sara'}); pg = abrir(ctx, 'ficha-proyecto', 2500)
    k = pg.evaluate("window.lrVersiones.actual('ficha-proyecto')")
    pg.evaluate("([k]) => { const F = window.lrDibStore.fotos; for (let i = 0; i < 3; i++) F.agregar('ficha-proyecto', k, 'data:image/jpeg;base64,AAAA', 'f' + i); F.agregar('ficha-proyecto', 'otra', 'data:image/jpeg;base64,BBBB', 'ajena'); F.agregar('disena-patron', k, 'data:image/jpeg;base64,CCCC', 'patron'); window.lrAgendaNucleo.datos()._dib['ficha-proyecto:' + k] = { s: [[1, 1, 2, 2, 3, 3]], img: '' }; window.lrAgendaNucleo.guardar(); }", [k])
    pg.wait_for_timeout(800); pg.click('#ficha-proyecto .vers-borrar'); pg.wait_for_timeout(1200)
    claves = set(dib_idb(pg))
    T.v('borrar (vaciar) el proyecto borra su dibujo y sus fotos, y no toca las de otra ficha ni las del patrón', not any(c.startswith('ficha-proyecto:' + k) for c in claves) and 'ficha-proyecto:otra:f1' in claves and ('disena-patron:%s:f1' % k) in claves, sorted(claves))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs); ctx.close()
    b.close()
t.fin()

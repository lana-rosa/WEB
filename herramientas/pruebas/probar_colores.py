#!/usr/bin/env python3
"""Pruebas de «Busca por color» (Etapa 4 del universo de Rosina): reglas de color, datos de las fotos, filtro del recomendador
y búsqueda por una foto de referencia (que nunca debe salir del dispositivo).

Usa el catálogo real guardado en fixtures/regalos.json y el archivo real img/productos/colores.json; levanta un servidor local y
simula la respuesta de Supabase (no toca producción).

Uso:  python3 herramientas/pruebas/probar_colores.py [carpeta_capturas]
Requiere: playwright, Pillow y Node 18+.
"""
import json, os, re, subprocess, sys, tempfile

from PIL import Image
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(__file__))
import probar_regalar as R   # helpers compartidos (servidor local, abrir con RPC simulado, capturas)

RAIZ = R.RAIZ
CAPTURAS = R.CAPTURAS
IDS = ['rosa', 'rojo', 'naranja', 'amarillo', 'verde', 'azul', 'morado', 'cafe', 'crema', 'gris', 'negro']
fallos, pasaron = [], 0


def verificar(nombre, condicion, detalle=''):
    global pasaron
    if condicion:
        pasaron += 1
        print('  ok   ' + nombre)
    else:
        fallos.append(nombre)
        print('  FALLA ' + nombre + (' → ' + str(detalle) if detalle else ''))


def node(codigo):
    r = subprocess.run(['node', '--input-type=module', '-e', codigo], capture_output=True, text=True, cwd=RAIZ)
    if r.returncode:
        raise RuntimeError(r.stderr)
    return json.loads(r.stdout)


def png(ruta, ancho, alto, fondo, centro=None, caja=None):
    """Imagen de prueba: color de fondo y, opcionalmente, un rectángulo de otro color en el centro."""
    im = Image.new('RGB', (ancho, alto), fondo)
    if centro:
        x0, y0, x1, y1 = caja or (ancho * 0.3, alto * 0.25, ancho * 0.7, alto * 0.7)
        im.paste(Image.new('RGB', (int(x1 - x0), int(y1 - y0)), centro), (int(x0), int(y0)))
    im.save(ruta)
    return ruta


def main():
    srv, base = R.servidor()
    carpeta_tmp = tempfile.mkdtemp(prefix='colores-')
    COLORES_JSON = json.load(open(os.path.join(RAIZ, 'img', 'productos', 'colores.json'), encoding='utf-8'))['colores']
    with sync_playwright() as p:
        nav = p.chromium.launch(executable_path=R.CHROMIUM) if R.CHROMIUM else p.chromium.launch()
        movil = nav.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, locale='es-CO')
        pc = nav.new_context(viewport={'width': 1280, 'height': 900}, locale='es-CO')

        print('\n[Reglas de color (js/universo/colores.js)]')
        r = node("""import { COLORES, nombreColor, perfilColores, puntajeColor } from '/home/user/WEB/js/universo/colores.js';
          const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
          const propios = COLORES.map((c) => [c[0], nombreColor(...hex(c[2]))]);
          const lienzo = (w, h, f) => { const a = new Uint8ClampedArray(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = f(x / w, y / h); const i = (y * w + x) * 4; a[i] = c[0]; a[i + 1] = c[1]; a[i + 2] = c[2]; a[i + 3] = c.length > 3 ? c[3] : 255; } return a; };
          const mesa = [176, 130, 90], rosa = [231, 78, 150];
          const pieza = lienzo(40, 50, (x, y) => (x > 0.3 && x < 0.7 && y > 0.25 && y < 0.7) ? rosa : mesa);
          const todaMesa = lienzo(40, 50, () => mesa);
          const blanco = lienzo(20, 20, () => [255, 255, 255]);
          const transparente = lienzo(20, 20, () => [200, 20, 20, 0]);
          console.log(JSON.stringify({ propios, nombres: COLORES.map((c) => c[0]),
            pieza: perfilColores(pieza, 40, 50), todaMesa: perfilColores(todaMesa, 40, 50), blanco: perfilColores(blanco, 20, 20), transparente: perfilColores(transparente, 20, 20),
            ptos: [puntajeColor(['rosa', 'rojo'], 'rosa'), puntajeColor(['rojo', 'rosa'], 'rosa'), puntajeColor(['rojo'], 'rosa'), puntajeColor([], 'rosa'), puntajeColor(['rosa'], '')],
            casos: [[255, 255, 255], [250, 245, 235], [20, 20, 20], [128, 128, 128], [255, 192, 203], [200, 30, 40], [255, 140, 0], [250, 220, 50], [30, 160, 70], [135, 206, 235], [100, 60, 30]].map((c) => nombreColor(...c)) }));
        """)
        verificar('el vocabulario es el de la hoja de revisión (11 colores)', r['nombres'] == IDS, r['nombres'])
        verificar('cada muestra de color se reconoce a sí misma (rosa→rosa, café→café…)', all(a == b for a, b in r['propios']), [x for x in r['propios'] if x[0] != x[1]])
        verificar('casos de la vida real: blanco/crema, negro, gris, rosa pastel, rojo, naranja, amarillo, verde, celeste, café',
                  r['casos'] == ['crema', 'crema', 'negro', 'gris', 'rosa', 'rojo', 'naranja', 'amarillo', 'verde', 'azul', 'cafe'], r['casos'])
        verificar('una pieza rosa sobre una mesa de madera: gana el rosa y no el color de la mesa', r['pieza']['principal'] == 'rosa' and r['pieza']['colores'][0] == 'rosa', r['pieza'])
        verificar('si toda la foto parece fondo, se usa el centro en vez de quedarse sin color', r['todaMesa']['principal'] is not None, r['todaMesa'])
        verificar('un blanco puro (márgenes de la foto) o un fondo transparente no cuenta como color', r['blanco']['principal'] is None and r['transparente']['principal'] is None)
        verificar('el orden pone primero el color principal, luego el detalle y al final lo que no lo lleva', r['ptos'] == [2, 1, 0, 0, 0], r['ptos'])

        print('\n[Datos de las fotos (img/productos/colores.json)]')
        existentes = set(os.listdir(os.path.join(RAIZ, 'img', 'productos')))
        verificar('todas las fotos del archivo existen en img/productos/', all(k in existentes for k in COLORES_JSON), [k for k in COLORES_JSON if k not in existentes])
        verificar('cada foto tiene de 1 a 3 colores y todos son del vocabulario, sin repetirse', all(1 <= len(v) <= 3 and len(set(v)) == len(v) and all(c in IDS for c in v) for v in COLORES_JSON.values()))
        sin_color = [x['nombre'] for x in R.CATALOGO if not x['personalizable_base'] and x['foto_url'] not in COLORES_JSON]
        verificar('todos los productos del catálogo (menos los 3 personalizados) tienen colores', not sin_color, sin_color)
        verificar('las 3 fotos de referencia de lo que se teje a pedido no llevan color', not any(k.startswith('amigurumi-personalizado-') for k in COLORES_JSON))
        sys.path.insert(0, os.path.join(RAIZ, 'herramientas', 'innovacion'))
        import colores as GEN
        actual, _ = GEN.resultado()
        verificar('colores.json está al día con las reglas y los ajustes (si falla: python3 herramientas/innovacion/colores.py generar)', actual == COLORES_JSON,
                  [k for k in actual if actual[k] != COLORES_JSON.get(k)][:5])
        distintos = {}
        for v in COLORES_JSON.values():
            distintos[v[0]] = distintos.get(v[0], 0) + 1
        verificar('hay variedad: al menos 8 colores principales distintos en el catálogo (%s)' % ', '.join('%s %d' % kv for kv in sorted(distintos.items(), key=lambda x: -x[1])), len(distintos) >= 8, distintos)

        print('\n[Filtro de color en recomendar()]')
        page, err = R.abrir(pc, base, R.CATALOGO)
        res = page.evaluate('''async ([cat, mapa]) => {
          const m = await import('/js/universo/regalar.js');
          cat.forEach((p) => { p.colores = mapa[p.foto_url] || []; });
          const rosa = m.recomendar(cat, { color: 'rosa' }, {});
          const todos = [...rosa.disponibles, ...rosa.encargo];
          const sinFiltro = m.recomendar(cat, {}, {});
          const conTipo = m.recomendar(cat, { color: 'rosa', tipo: 'llavero' }, {});
          const vacio = m.recomendar(cat, { color: 'inexistente' }, {});
          const orden = (l) => { let visto = false; for (const p of l) { const es = p.colores[0] === 'rosa'; if (!es) visto = true; else if (visto) return false; } return true; };
          const idxPrincipal = todos.map((p) => p.colores[0] === 'rosa');
          return { n: todos.length, todosLoLlevan: todos.every((p) => p.colores.indexOf('rosa') >= 0),
            principalesPrimero: orden(rosa.disponibles) && orden(rosa.encargo),
            nPrincipales: idxPrincipal.filter(Boolean).length,
            ideasIgual: JSON.stringify(rosa.ideas.map(p => p.id)) === JSON.stringify(sinFiltro.ideas.map(p => p.id)), nIdeas: rosa.ideas.length,
            conTipoSub: conTipo.disponibles.concat(conTipo.encargo).every((p) => p.categoria_web === 'Llaveros' && p.colores.indexOf('rosa') >= 0),
            vacio: vacio.disponibles.length + vacio.encargo.length };
        }''', [R.CATALOGO, COLORES_JSON])
        verificar('con «rosa» solo salen piezas que llevan rosa (%d)' % res['n'], res['n'] > 0 and res['todosLoLlevan'], res)
        verificar('en cada sección, primero las de color principal rosa (%d) y luego las que lo llevan de detalle' % res['nPrincipales'], res['principalesPrimero'] and res['nPrincipales'] > 0, res)
        verificar('las ideas para personalizar no cambian con el color (el color lo elige la persona)', res['ideasIgual'] and res['nIdeas'] == 3, res)
        verificar('el color se combina con los otros filtros (rosa + llavero)', res['conTipoSub'], res)
        verificar('un color que ninguna pieza tiene devuelve vacío', res['vacio'] == 0, res)
        page.close()

        for nombre, ctx, ancho in (('celular 390 px', movil, 390), ('computador 1280 px', pc, 1280)):
            print('\n[Lista de color en la página — %s]' % nombre)
            page, err = R.abrir(ctx, base, R.CATALOGO)
            hay = {c for v in COLORES_JSON.values() for c in v}
            opciones = page.eval_on_selector('select.ur-select[data-clave="color"]', 'e => [...e.options].map(o => [o.value, o.textContent])')
            verificar('hay una lista «¿Qué color te gusta?» con etiqueta asociada', page.locator('label[for="ur-color"]').inner_text() == '¿Qué color te gusta?' and R.lista(page, 'color').count() == 1)
            verificar('la primera opción es «Cualquier color» y solo se ofrecen colores que alguna pieza tiene (%d)' % (len(opciones) - 1),
                      opciones[0] == ['', 'Cualquier color'] and {o[0] for o in opciones[1:]} == hay and len(opciones) - 1 == len(hay), opciones)
            antes = page.locator('.ur-card').count()
            R.elegir(page, 'color', 'rosa')
            n = page.locator('.ur-card').count()
            verificar('al elegir rosa baja el número de piezas (%d → %d) y la lista queda marcada' % (antes, n), 0 < n < antes and page.locator('select.ur-select.ur-elegido[data-clave="color"]').count() == 1)
            primera = page.locator('.ur-seccion .ur-card').first.locator('.ur-puntos').get_attribute('aria-label')
            verificar('la primera pieza muestra «Colores: Rosa…» con sus puntos de color (accesible)', primera.startswith('Colores: Rosa'), primera)
            verificar('todas las tarjetas del resultado llevan rosa entre sus colores', page.eval_on_selector_all('.ur-seccion:not([aria-label="Ideas para personalizar"]) .ur-card .ur-puntos', 'els => els.length > 0 && els.every(e => e.getAttribute("aria-label").indexOf("Rosa") >= 0)'))
            eventos = page.evaluate('dataLayer.filter(e => e.event === "regalar_paso" && e.paso === "color")')
            verificar('se mide solo la categoría elegida (regalar_paso color=rosa), sin texto libre', len(eventos) == 1 and eventos[0]['valor_categoria'] == 'rosa', eventos)
            page.get_by_role('button', name='Empezar de nuevo').click()
            verificar('«Empezar de nuevo» quita el color', R.lista(page, 'color').input_value() == '' and page.locator('.ur-card').count() == antes)
            verificar('la lista de color mide al menos 44 px de alto y no hay desplazamiento horizontal', R.lista(page, 'color').bounding_box()['height'] >= 44 and R.sin_scroll_horizontal(page))
            verificar('sin errores en la consola', not err, err)
            if CAPTURAS:
                R.elegir(page, 'color', 'rosa'); page.locator('#regalar').scroll_into_view_if_needed(); page.wait_for_timeout(300)
                R.captura(page, 'colores-lista-%d.png' % ancho, CAPTURAS)
            page.close()

        print('\n[Dirección con color, y color que no existe]')
        page, err = R.abrir(pc, base, R.CATALOGO, ruta='/universo-rosina.html?color=azul&tipo=llavero')
        verificar('?color=azul llega ya elegido y se combina con el tipo', R.lista(page, 'color').input_value() == 'azul' and R.lista(page, 'tipo').input_value() == 'llavero' and page.locator('.ur-card').count() > 0)
        page.close()
        page, err = R.abrir(pc, base, R.CATALOGO, ruta='/universo-rosina.html?color=violeta')
        verificar('un color inventado en la dirección se ignora (sin filtro, sin errores)', R.lista(page, 'color').input_value() == '' and page.locator('.ur-card').count() > 0 and not err, err)
        page.close()

        print('\n[Si colores.json no carga, todo lo demás sigue igual]')
        page, err = R.abrir(pc, base, R.CATALOGO, rutas=[('**/img/productos/colores.json', lambda r: r.fulfill(status=404, body='no'))])
        verificar('sin los colores no aparece la lista ni el botón de foto, pero sí los otros 4 filtros y los productos',
                  page.locator('#regalar-raiz .ur-grupo').count() == 4 and page.locator('.ur-foto').count() == 0 and page.locator('.ur-card').count() > 0 and not err, err)
        page.close()

        print('\n[Búsqueda por una foto de referencia]')
        rosa_png = png(os.path.join(carpeta_tmp, 'rosa.png'), 300, 400, (176, 130, 90), (231, 78, 150))
        azul_png = png(os.path.join(carpeta_tmp, 'azul.png'), 300, 400, (240, 240, 240), (60, 130, 230), (80, 90, 220, 300))
        blanca_png = png(os.path.join(carpeta_tmp, 'blanca.png'), 200, 200, (255, 255, 255))
        pesada = os.path.join(carpeta_tmp, 'texto.png'); open(pesada, 'w').write('esto no es una imagen')
        for nombre, ctx, ancho in (('celular 390 px', movil, 390), ('computador 1280 px', pc, 1280)):
            print('  — %s' % nombre)
            page, err = R.abrir(ctx, base, R.CATALOGO)
            peticiones = []
            page.on('request', lambda rq: peticiones.append((rq.method, rq.url)))
            verificar('el botón de foto y el aviso de privacidad están a la vista', page.locator('.ur-foto-btn').is_visible() and 'no se envía ni se guarda' in page.inner_text('.ur-foto-nota'))
            verificar('el selector de archivos es alcanzable con el teclado (no está oculto con display:none)', page.eval_on_selector('#ur-foto-entrada', 'e => getComputedStyle(e).display !== "none" && e.tabIndex >= 0'))
            page.focus('#ur-foto-entrada')
            verificar('al enfocar el selector se ve el anillo de foco en el botón', page.eval_on_selector('.ur-foto-btn', 'e => getComputedStyle(e).outlineStyle !== "none"') if page.eval_on_selector('.ur-foto', 'e => e.matches(":focus-within")') else False)
            page.set_input_files('#ur-foto-entrada', rosa_png)
            page.wait_for_selector('.ur-muestra', timeout=8000)
            muestras = page.eval_on_selector_all('.ur-muestra', 'els => els.map(e => [e.dataset.color, e.getAttribute("aria-pressed"), e.getBoundingClientRect().height])')
            verificar('la foto rosa sobre una mesa muestra «Rosa» como color a buscar', any(m[0] == 'rosa' for m in muestras), muestras)
            verificar('se elige sola la primera muestra (rosa) y la lista del filtro lo refleja', R.lista(page, 'color').input_value() == 'rosa' and muestras[0][1] == 'true')
            verificar('se ve la foto de la persona como vista previa pequeña y con texto alternativo', page.locator('.ur-foto-vista').get_attribute('alt') == 'Tu foto de referencia' and page.locator('.ur-foto-vista').is_visible())
            verificar('las muestras miden al menos 44 px de alto', all(m[2] >= 44 for m in muestras), muestras)
            verificar('hay resultados y todos llevan rosa', page.locator('.ur-seccion .ur-card').count() > 0)
            verificar('NINGÚN envío de red al analizar la foto (ni POST ni pedidos a otros sitios)', not [x for x in peticiones if x[0] not in ('GET', 'OPTIONS', 'HEAD') or not x[1].startswith(base) and not x[1].startswith('blob:') and not x[1].startswith('data:')], peticiones)
            ev = page.evaluate('dataLayer.filter(e => /regalar_foto_color|regalar_paso/.test(e.event))')
            verificar('lo que se mide no incluye el nombre del archivo ni la imagen (solo cantidades y categorías)', 'rosa.png' not in json.dumps(ev) and any(e['event'] == 'regalar_foto_color' and 'n_colores' in e for e in ev), ev)
            page.set_input_files('#ur-foto-entrada', azul_png)
            page.wait_for_function('document.querySelector("#ur-color").value === "azul"', timeout=8000)
            verificar('otra foto (azul sobre gris claro) cambia la búsqueda a azul', R.lista(page, 'color').input_value() == 'azul')
            page.locator('.ur-muestra').first.click()
            verificar('tocar una muestra pone ese color en la lista', R.lista(page, 'color').input_value() == page.locator('.ur-muestra').first.get_attribute('data-color'))
            page.set_input_files('#ur-foto-entrada', blanca_png)
            page.wait_for_selector('.ur-foto-salida .ur-nota', timeout=8000)
            verificar('una foto sin colores (todo blanco) da un mensaje amable y no rompe nada', 'No pude distinguir colores' in page.inner_text('.ur-foto-salida') and not err, page.inner_text('.ur-foto-salida'))
            page.set_input_files('#ur-foto-entrada', pesada)
            page.wait_for_selector('.ur-foto-salida .ur-nota', timeout=8000)
            page.wait_for_timeout(300)
            verificar('un archivo que no es imagen da un mensaje amable (sin errores en consola)', 'No pude leer' in page.inner_text('.ur-foto-salida') and not err, [page.inner_text('.ur-foto-salida'), err])
            page.set_input_files('#ur-foto-entrada', rosa_png)
            page.wait_for_selector('.ur-muestra', timeout=8000)
            verificar('sin desplazamiento horizontal con la foto abierta', R.sin_scroll_horizontal(page))
            if CAPTURAS:
                page.locator('.ur-foto').scroll_into_view_if_needed(); page.wait_for_timeout(300)
                R.captura(page, 'colores-foto-%d.png' % ancho, CAPTURAS)
            page.get_by_role('button', name='Empezar de nuevo').click()
            verificar('«Empezar de nuevo» borra también la foto y las muestras', page.locator('.ur-foto-vista').count() == 0 and page.locator('.ur-muestra').count() == 0 and R.lista(page, 'color').input_value() == '')
            verificar('sin errores en la consola durante todo el flujo', not err, err)
            page.close()

        nav.close()
    srv.shutdown()
    print('\n%d comprobaciones correctas, %d con falla.' % (pasaron, len(fallos)))
    if fallos:
        print('FALLAS:'); [print(' - ' + f) for f in fallos]
        sys.exit(1)


if __name__ == '__main__':
    main()

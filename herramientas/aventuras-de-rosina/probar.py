#!/usr/bin/env python3
"""Prueba de extremo a extremo de "Rosina y la gran aventura de la primera cadeneta" con un navegador real (Playwright + Chromium).

Uso (con un servidor estático en la raíz del repositorio):
    python3 -m http.server 8765 &
    python3 herramientas/aventuras-de-rosina/probar.py [--axe]

Qué comprueba: recorrido de las 3 misiones (historia, tutorial, práctica, juego con error y acierto, pasaporte, reflexión, fin),
botón de ayuda, progreso local (recargar la página), reinicio con confirmación, diploma, que no haya errores de consola ni
peticiones a otros dominios, que no haya desplazamiento horizontal en 390 y 1280 px, y movimiento reducido. Con --axe pasa axe-core.
Termina con código 1 si algo falla. Los resultados se imprimen; no se afirma nada que no se haya ejecutado aquí."""
import json, os, sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get('AVENTURA_URL', 'http://localhost:8765/aventuras-de-rosina/')
CHROMIUM = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')
fallos, ok = [], []
def comprobar(cond, texto):
    (ok if cond else fallos).append(texto)
    print(('  ✓ ' if cond else '  ✗ ') + texto)

def axe_js():
    try:
        import axe_playwright_python
        return open(os.path.join(os.path.dirname(axe_playwright_python.__file__), 'axe.min.js'), encoding='utf-8').read()
    except Exception:
        return None

def main():
    con_axe = '--axe' in sys.argv
    errores, externas, malas = [], [], []
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROMIUM)
        ctx = b.new_context(viewport={'width': 390, 'height': 800}, locale='es-CO')
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errores.append('pageerror: ' + str(e)))
        pg.on('console', lambda m: errores.append('console: ' + m.text) if m.type in ('error', 'warning') else None)
        def req(r):
            if not r.url.startswith('http://localhost') and not r.url.startswith('data:'): externas.append(r.url)
        pg.on('request', req)
        pg.on('response', lambda r: malas.append(f'{r.status} {r.url}') if r.status >= 400 else None)
        pg.on('dialog', lambda d: d.accept())
        pg.add_init_script("window.print = () => { window.__impreso = (window.__impreso || 0) + 1; };")

        def ir(h):
            pg.goto(BASE + '#/' + h); pg.wait_for_timeout(250)
        def texto(): return pg.inner_text('#app')
        def clic(nombre, exact=False):
            pg.get_by_role('button', name=nombre, exact=exact).first.click(); pg.wait_for_timeout(120)
        def enlace(nombre):
            pg.get_by_role('link', name=nombre).first.click(); pg.wait_for_timeout(180)
        def estado():
            return pg.evaluate("JSON.parse(localStorage.getItem('lrAventuraRosina') || 'null')")
        datos = None
        sin_h = []
        def revisar_ancho(etiqueta):
            for w in (390, 1280):
                pg.set_viewport_size({'width': w, 'height': 800}); pg.wait_for_timeout(80)
                if pg.evaluate('document.documentElement.scrollWidth') > w: sin_h.append(f'{etiqueta}@{w}')
            pg.set_viewport_size({'width': 390, 'height': 800})

        print('1. Inicio, acompañantes, preparación y mapa')
        pg.goto(BASE); pg.wait_for_timeout(400)
        comprobar('Rosina y la gran aventura de la primera cadeneta' in pg.inner_text('h1'), 'La bienvenida muestra el título')
        comprobar(pg.locator('img.heroe-rosina').get_attribute('src').startswith('/img/stickers/rosina-'), 'La bienvenida usa la imagen oficial de Rosina')
        revisar_ancho('bienvenida')
        clic('¡Comenzar aventura!')
        comprobar('Para quien acompaña' in pg.inner_text('h1'), 'Comenzar lleva a la orientación para adultos')
        clic('Entendido, continuar'); comprobar('Prepara tu aventura' in pg.inner_text('h1'), 'Sigue la preparación')
        clic('Ir al mapa'); comprobar(pg.locator('.misiones li').count() == 3, 'El mapa lista las 3 misiones del MVP')
        comprobar(pg.locator('.mapa a.nodo').count() == 3, 'El mapa dibuja 3 lugares tocables')
        comprobar('Por empezar' in texto(), 'El mapa muestra el estado "Por empezar"')
        comprobar('Muy pronto' in texto(), 'El mapa avisa de las misiones futuras sin botones falsos')
        revisar_ancho('mapa')
        datos = pg.evaluate("import('/aventuras-de-rosina/contenido/misiones.js').then(m => JSON.parse(JSON.stringify(m.MISIONES)))")

        def jugar_juego(m):
            """Responde el juego de la misión m correctamente leyendo los datos de contenido."""
            clic('¡Empezar!')
            for r in m['juego']['rondas']:
                if r['tipo'] == 'elegir':
                    pg.locator(f'.opcion[data-id="{r["correcta"]}"]').click()
                elif r['tipo'] == 'contar':
                    for _ in range(r['correcta']): pg.locator('[data-j="mas"]').click()
                    pg.get_by_role('button', name='Comprobar').click()
                elif r['tipo'] == 'ordenar':
                    for t in r['pasos']: pg.locator('.opcion-paso', has_text=t).first.click()
                    pg.get_by_role('button', name='Comprobar').click()
                elif r['tipo'] == 'colores':
                    for pr, col in zip(r['partes'], ['lila', 'cielo', 'sol']):
                        pg.locator(f'[data-j="parte"][data-id="{pr["id"]}"]').click()
                        pg.locator(f'[data-j="color"][data-id="{col}"]').click()
                    pg.get_by_role('button', name='¡Listo!').click()
                pg.wait_for_timeout(80)
                assert 'retro' in pg.locator('#retro').get_attribute('class') and pg.locator('#retro').inner_text().strip(), 'sin retroalimentación'
                pg.get_by_role('button', name='Seguir').click(); pg.wait_for_timeout(80)
            pg.get_by_role('button', name='Continuar').click(); pg.wait_for_timeout(150)

        def mision_completa(m, extra=None):
            ir(f'mision/{m["id"]}/historia/1')
            for _ in range(len(m['historia']) - 1): enlace('Siguiente →')
            enlace('¡A aprender!')
            comprobar('Vamos a aprender' in pg.inner_text('h1'), f'{m["id"]}: tras la historia se abre el tutorial')
            enlace('Empezar el paso 1')
            for k in range(len(m['tutorial']['pasos']) - 1):
                comprobar(pg.locator('.paso-dib svg').count() == 1, f'{m["id"]}: paso {k+1} muestra su dibujo') if k == 0 else None
                enlace('Siguiente paso')
            enlace('¡Vamos a practicar!')
            clic('Lo hice con mi lana')
            comprobar(pg.locator('#ir-juego').is_visible(), f'{m["id"]}: marcar la práctica habilita "Ir al juego"')
            enlace('Ir al juego')
            if extra: extra()
            jugar_juego(m)
            if m['id'] == 'm1':
                pg.fill('#apodo', 'Luz'); pg.locator('.radio', has_text='Tejedora').click()
                pg.locator('.muestra', has_text='Lila').click(); pg.locator('.amigo-op', has_text='Tito').click()
                clic('Guardar mi pasaporte')
            comprobar('Un momento para pensar' in pg.inner_text('h1'), f'{m["id"]}: llega a la reflexión')
            pg.locator('.opciones-reflexion .opcion').first.click(); enlace('Continuar')
            comprobar('Misión completada' in pg.inner_text('h1'), f'{m["id"]}: se completa la misión')

        print('2. Misión 1 (con prueba de error, ayuda y respuesta guiada)')
        m1, m2, m3 = datos
        def prueba_ayuda_y_errores():
            pass
        # tutorial: ayuda
        ir('mision/m1/tutorial/2')
        clic('Necesito ayuda')
        comprobar(pg.locator('#dlg-ayuda').evaluate('d => d.open'), 'El botón "Necesito ayuda" abre el panel')
        for t in ['Ver de nuevo', 'Dame una pista', 'Practicar algo más sencillo', 'Pedir ayuda a una persona adulta']:
            comprobar(pg.locator('#dlg-ayuda').get_by_role('button', name=t).count() == 1, f'La ayuda ofrece: {t}')
        pg.locator('#dlg-ayuda').get_by_role('button', name='Dame una pista').click()
        comprobar('Pista' in pg.inner_text('#ayuda-resp'), 'La pista muestra texto del paso')
        pg.locator('#dlg-ayuda').get_by_role('button', name='Pedir ayuda a una persona adulta').click()
        comprobar('Para quien acompaña' in pg.inner_text('#ayuda-resp'), 'Pedir ayuda a un adulto muestra el mensaje para el adulto')
        pg.locator('#dlg-ayuda').get_by_role('button', name='Practicar algo más sencillo').click()
        comprobar('sencillo' in pg.inner_text('#ayuda-resp').lower(), 'La ayuda ofrece una práctica más sencilla')
        revisar_ancho('tutorial')
        pg.locator('#dlg-ayuda').get_by_role('button', name='Listo, gracias').click()
        comprobar(not pg.locator('#dlg-ayuda').evaluate('d => d.open'), 'El panel de ayuda se cierra')
        comprobar('pide-ayuda' in estado()['logros'], 'Usar la ayuda otorga el logro "Valiente para pedir ayuda"')
        clic('Ver de nuevo'); comprobar(pg.locator('.paso-fig.repite').count() == 1, '"Ver de nuevo" repite la demostración del paso')
        enlace('Paso anterior'); comprobar('Paso 1 de' in texto(), 'El botón "Paso anterior" vuelve atrás')

        # juego m1: error → pista → respuesta → seguir (sin bloqueo)
        ir('mision/m1/juego/1'); clic('¡Empezar!')
        pg.locator('.opcion[data-id="b"]').click()
        comprobar('Probemos otra vez' in pg.locator('#retro').inner_text(), 'Una respuesta incorrecta recibe un mensaje amable')
        comprobar('💡' in pg.locator('#retro').inner_text(), 'Tras el primer error aparece una pista')
        pg.locator('.opcion[data-id="c"]').click()
        comprobar(pg.locator('#retro [data-j="respuesta"]').count() == 1, 'Tras dos errores se ofrece ver la respuesta')
        pg.locator('#retro [data-j="respuesta"]').click()
        comprobar(pg.locator('[data-j="seguir"]').is_visible(), 'Ver la respuesta permite seguir (el juego nunca bloquea)')
        comprobar(pg.locator('.opcion.es-correcta').count() == 1, 'Se marca cuál era la respuesta correcta')

        mision_completa(m1)
        e = estado()
        comprobar(e['misiones']['m1']['completada'] is True, 'El progreso guarda la misión 1 como completada')
        comprobar(e['apodo'] == 'Luz' and e['trato'] == 'tejedora' and e['amigo'] == 'tito' and e['color'] == 'lila', 'El pasaporte guarda nombre, trato, color y amigo')
        comprobar('explorador' in e['logros'] and 'pasaporte' in e['logros'], 'Se otorgan los logros de la misión 1')
        comprobar(set(e['colores']['m1'].keys()) == {'rio', 'flores', 'camino'}, 'El Laboratorio de colores guarda los colores elegidos')
        comprobar(all(' ' not in k for k in e.keys()) and 'cuenta' not in json.dumps(e).lower(), 'El progreso no guarda datos de contacto ni cuentas')
        enlace('Volver al mapa')
        comprobar('Completada' in texto(), 'El mapa muestra la misión 1 como completada')

        print('3. Misiones 2 y 3')
        mision_completa(m2)
        mision_completa(m3)
        e = estado()
        comprobar(all(e['misiones'][k]['completada'] for k in ('m1', 'm2', 'm3')), 'Las 3 misiones quedan completadas')
        comprobar('tejedor-bosque' in e['logros'], 'Completar las 3 misiones otorga el logro final')
        ir('mapa'); comprobar(pg.locator('.mision-completada').count() == 3, 'El mapa marca las 3 misiones completadas')
        revisar_ancho('mapa-completo')

        print('4. Progreso local, pasaporte y diploma')
        pg.reload(); pg.wait_for_timeout(300)
        comprobar(estado()['misiones']['m2']['completada'] is True, 'El progreso sobrevive a recargar la página')
        ir('pasaporte')
        comprobar('Luz' in texto() and 'Mis sellos' in texto(), 'El pasaporte muestra el nombre y los sellos')
        comprobar(pg.locator('.logro.ganado').count() >= 7, 'El pasaporte muestra los logros ganados')
        revisar_ancho('pasaporte')
        ir('diploma')
        comprobar(pg.locator('.diploma-nombre').inner_text() == 'Luz', 'El diploma muestra el nombre del niño')
        pg.get_by_role('button', name='Imprimir o guardar como PDF').click()
        comprobar(pg.evaluate('window.__impreso') == 1, 'El botón del diploma llama a imprimir')
        revisar_ancho('diploma')
        ir('adultos'); comprobar('Seguridad' in texto() and 'Privacidad' in texto(), 'La guía para adultos incluye seguridad y privacidad')
        revisar_ancho('adultos')

        print('5. Reinicio con confirmación')
        ir('pasaporte'); clic('Borrar mi progreso y empezar de nuevo')
        comprobar(pg.locator('#dlg-confirmar').evaluate('d => d.open'), 'Reiniciar pide confirmación')
        pg.locator('#dlg-confirmar').get_by_role('button', name='No, volver').click()
        comprobar(estado()['misiones']['m1']['completada'] is True, 'Decir "No" conserva el progreso')
        clic('Borrar mi progreso y empezar de nuevo')
        pg.locator('#dlg-confirmar').get_by_role('button', name='Sí, borrar mi progreso').click(); pg.wait_for_timeout(250)
        comprobar(estado() is None or not estado()['misiones'], 'Decir "Sí" borra el progreso')

        print('6. Diploma bloqueado y movimiento reducido')
        ir('diploma'); comprobar('Tu diploma te espera' in pg.inner_text('h1'), 'Sin las 3 misiones el diploma explica qué falta')
        ctx2 = b.new_context(viewport={'width': 390, 'height': 800}, reduced_motion='reduce')
        p2 = ctx2.new_page(); p2.goto(BASE + '#/mision/m2/tutorial/1'); p2.wait_for_timeout(300)
        nombre = p2.evaluate("getComputedStyle(document.querySelector('.paso-dib svg')).animationName")
        comprobar(nombre == 'none', 'Con movimiento reducido se apagan las animaciones')

        print('7. Teclado')
        pg.goto('about:blank'); pg.goto(BASE + '#/mision/m2/tutorial/1'); pg.wait_for_timeout(300); pg.keyboard.press('Tab')
        foco = pg.evaluate('document.activeElement && document.activeElement.className')
        comprobar(bool(foco) and 'saltar' in foco, 'El primer Tab llega al enlace "Saltar al contenido"')
        pg.focus('[data-accion="ayuda"]'); pg.keyboard.press('Enter'); pg.wait_for_timeout(150)
        comprobar(pg.locator('#dlg-ayuda').evaluate('d => d.open'), 'El botón de ayuda se activa con el teclado')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
        comprobar(not pg.locator('#dlg-ayuda').evaluate('d => d.open'), 'Escape cierra el panel de ayuda')

        if con_axe:
            print('8. Accesibilidad (axe-core)')
            js = axe_js()
            if not js: print('  (axe no está instalado: se omite)')
            else:
                total = 0
                for r in ['', 'mapa', 'mision/m1/historia/1', 'mision/m2/tutorial/3', 'mision/m1/historia/3', 'mision/m2/historia/2', 'mision/m1/pasaporte/1', 'mision/m3/practica/1', 'mision/m2/juego/1', 'pasaporte', 'adultos']:
                    ir(r); pg.add_script_tag(content=js)
                    res = pg.evaluate("axe.run(document, {runOnly:['wcag2a','wcag2aa','wcag21aa','wcag22aa','best-practice']})")
                    v = [(x['id'], x['impact'], len(x['nodes'])) for x in res['violations']]
                    total += len(v)
                    print(f'  {r or "inicio"}: {v if v else "sin violaciones"}')
                comprobar(total == 0, 'axe-core: sin violaciones en las pantallas revisadas')

        print('8b. Imágenes de personajes')
        faltan_img = pg.evaluate("""async () => {
          const m = await import('/aventuras-de-rosina/contenido/personajes.js');
          const rutas = Object.values(m.POSES_ROSINA);
          for (const [id, poses] of Object.entries(m.POSES_PLANO)) for (const k of Object.keys(poses)) rutas.push(`/img/aventuras/plano/${id}-${k}.webp`);
          const malas = [];
          for (const r of rutas) { const x = await fetch(r, { method: 'HEAD' }); if (!x.ok) malas.push(r); }
          return { total: rutas.length, malas };
        }""")
        comprobar(not faltan_img['malas'] and faltan_img['total'] >= 43, f'Existen los {faltan_img["total"]} archivos de poses (Rosina y amigos)' + (f' (faltan: {faltan_img["malas"][:3]})' if faltan_img['malas'] else ''))

        print('9. Política de privacidad de las familias')
        URL_PRIV = BASE + 'privacidad.html'
        ir('adultos')
        comprobar(pg.locator('a[href="/aventuras-de-rosina/privacidad.html"]').count() >= 2, 'El pie y la guía para adultos enlazan a la política de privacidad')
        pg.goto(URL_PRIV); pg.wait_for_timeout(200)
        comprobar('Privacidad de las familias' in pg.inner_text('h1'), 'La página de privacidad abre con su título')
        comprobar(pg.locator('main h2[id^="p"]').count() == 16, 'Tiene los 16 apartados numerados')
        comprobar(pg.locator('meta[name="robots"][content*="noindex"]').count() == 1, 'Sigue con noindex mientras la aventura no se publique')
        comprobar(pg.locator('script').count() == 0 and 'googletagmanager' not in pg.content(), 'No lleva scripts ni Tag Manager')
        comprobar('Rosina y la gran aventura de la primera cadeneta' in pg.inner_text('main') and 'sus amigos»' not in pg.inner_text('main') and 'Rosina y el Bosque Tejido' not in pg.inner_text('main'), 'Usa el título «Rosina y la gran aventura de la primera cadeneta» en todo el texto')
        comprobar(all(pg.locator(f'#{a}').count() == 1 for a in [h.split('#')[1] for h in pg.eval_on_selector_all('.indice-pol a', 'e => e.map(x => x.getAttribute("href"))')]), 'Todos los enlaces del contenido llevan a un apartado')
        revisar_ancho('privacidad')
        if con_axe and axe_js():
            pg.add_script_tag(content=axe_js())
            res = pg.evaluate("axe.run(document, {runOnly:['wcag2a','wcag2aa','wcag21aa','wcag22aa','best-practice']})")
            v = [(x['id'], x['impact'], len(x['nodes'])) for x in res['violations']]
            print(f'  privacidad: {v if v else "sin violaciones"}')
            comprobar(not v, 'axe-core: la política de privacidad no tiene violaciones')

        comprobar(not sin_h, 'Sin desplazamiento horizontal en 390 y 1280 px' + (f' (fallan: {sin_h})' if sin_h else ''))
        comprobar(not errores, 'Sin errores ni avisos de consola' + (f' ({errores[:3]})' if errores else ''))
        comprobar(not externas, 'Ninguna petición a otros dominios' + (f' ({externas[:3]})' if externas else ''))
        comprobar(not malas, 'Ninguna respuesta 4xx/5xx' + (f' ({malas[:3]})' if malas else ''))
        b.close()
    print(f'\nResultado: {len(ok)} comprobaciones correctas, {len(fallos)} fallidas.')
    for f in fallos: print('  FALLA:', f)
    return 1 if fallos else 0

if __name__ == '__main__':
    sys.exit(main())

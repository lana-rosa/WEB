#!/usr/bin/env python3
"""Pausa guiada (23-nov-2026). Uso: con servidor local en 8765:  /usr/bin/python3 herramientas/pruebas/probar_agenda_pausas_guiadas.py [carpeta_capturas]"""
import sys, json, os, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agenda_util import *
T = Prueba(); CAP = sys.argv[1] if len(sys.argv) > 1 else None
def guardado(pg): return json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda') || '{}'"))
hoy = datetime.date.today().day
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    pg = abrir(contexto(b, 390, 900, datos={'ag-duena': 'Sara'}, config_abierta=False), 'registro-pausas', 2200, config=False)
    T.v('la hoja tiene la tarjeta «Pausa guiada»', pg.locator('#registro-pausas .pg-tarjeta').count() == 1)
    pg.click('.pg-tarjeta button'); pg.wait_for_timeout(400)
    T.v('abre la ventana con el paso 1 (Respira)', pg.locator('.pg-caja[role=dialog]').count() == 1 and 'Respira' in pg.inner_text('.pg-t') and '1 / 6' in pg.inner_text('.pg-cont'))
    if CAP: os.makedirs(CAP, exist_ok=True); pg.screenshot(path=os.path.join(CAP, 'pausa-guiada-390.png'))
    T.v('el aviso de cuidado está a la vista', 'profesional de la salud' in pg.inner_text('.pg-aviso'))
    pg.wait_for_timeout(2200); T.v('la cuenta regresiva baja', pg.inner_text('.pg-reloj') in ('28 s', '27 s'), pg.inner_text('.pg-reloj'))
    pg.click('.pg-bot button:has-text("Siguiente")'); pg.wait_for_timeout(200)
    T.v('Siguiente pasa al paso 2 (Cuello)', 'Cuello' in pg.inner_text('.pg-t'))
    pg.click('.pg-bot button:has-text("Atrás")'); T.v('Atrás vuelve al 1', 'Respira' in pg.inner_text('.pg-t'))
    for i in range(6): pg.click('.pg-bot button.boton-primario'); pg.wait_for_timeout(120)
    T.v('al terminar felicita', 'Pausa terminada' in pg.inner_text('.pg-t'))
    T.v('marca el día de hoy en el registro', guardado(pg).get('ag-pa%d' % hoy) is True, guardado(pg).get('ag-pa%d' % hoy))
    pg.click('.pg-bot button'); pg.wait_for_timeout(200); T.v('se cierra', pg.locator('.pg-fondo').count() == 0)
    pg.click('.pg-tarjeta button'); pg.keyboard.press('Escape'); pg.wait_for_timeout(200); T.v('Esc cierra la ventana', pg.locator('.pg-fondo').count() == 0)
    T.v('sin desplazamiento horizontal', pg.evaluate('document.documentElement.scrollWidth <= innerWidth'))
    # desde el aviso de pausa de los ciclos
    pg.evaluate("(() => { const c = window.lrAgendaNucleo.datos(); c._ciclos = { on: true, trabajo: 25, pausa: 5, hechos: {}, pausaHasta: Date.now() + 300000, proy: 'x' }; })()"); pg.wait_for_timeout(1600)
    T.v('el aviso de pausa de los ciclos ofrece «Pausa guiada»', pg.locator('.ct-ciclo button:has-text("Pausa guiada")').count() == 1)
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)
    b.close()
T.fin()

"""Aviso antes de dictar (E31, 5-nov-2026): sale una vez, con el texto de la abogada, antes de activar el micrófono. Uso: python3 probar_agenda_aviso_voz.py"""
from agenda_util import *
T = Prueba()
TEXTO = 'La función «Hablar para escribir» utiliza el servicio de reconocimiento de voz disponible en su navegador o dispositivo. El audio puede ser procesado por el proveedor de dicho servicio, de acuerdo con sus propias condiciones y políticas de privacidad. Lana Rosa Crochet no recibe ni almacena directamente las grabaciones de audio. Puede utilizar esta función de manera opcional.'
FALSO_SR = "window.SpeechRecognition = window.webkitSpeechRecognition = function () { this.start = () => { window.__escuchando = (window.__escuchando || 0) + 1; }; this.stop = () => {}; this.abort = () => {}; };"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    ctx = contexto(b, 1280, 900, datos={'ag-duena': 'Sara'}, config_abierta=False); ctx.add_init_script(FALSO_SR)
    pg = abrir(ctx, 'mis-ideas', 1800, config=False)
    dictar = '#mis-ideas [data-voz="dictar"]'
    pg.evaluate("window.lrFichas && window.lrFichas.agregar('tabla-ideas')"); pg.wait_for_timeout(300)
    pg.click(dictar); pg.wait_for_timeout(300)
    T.v('al tocar «Dictar» por primera vez sale el aviso y el micrófono NO se activa', pg.locator('.voz-aviso').count() == 1 and not pg.evaluate("window.__escuchando"), pg.evaluate("window.__escuchando"))
    T.v('el aviso lleva exactamente el texto de la abogada', TEXTO in pg.inner_text('.voz-aviso'), pg.inner_text('.voz-aviso')[:120])
    T.v('es una ventana accesible con foco en «Continuar»', pg.evaluate("(() => { const d = document.querySelector('.voz-aviso'); return d.getAttribute('role') === 'dialog' && d.getAttribute('aria-modal') === 'true' && document.activeElement.textContent === 'Continuar'; })()"))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    T.v('«Ahora no» (o Esc) cierra el aviso, no activa el micrófono y no lo da por visto', pg.locator('.voz-aviso').count() == 0 and not pg.evaluate("window.__escuchando") and pg.evaluate("localStorage.getItem('lrVozAviso2')") is None)
    pg.click(dictar); pg.wait_for_timeout(300); pg.click('.voz-aviso .boton-primario'); pg.wait_for_timeout(400)
    T.v('«Continuar» activa el micrófono y recuerda que ya lo vio', pg.evaluate("window.__escuchando") == 1 and pg.evaluate("localStorage.getItem('lrVozAviso2')") == '1' and pg.locator('.voz-aviso').count() == 0, pg.evaluate("window.__escuchando"))
    pg.click(dictar); pg.wait_for_timeout(200)   # para
    pg.click(dictar); pg.wait_for_timeout(300)
    T.v('la segunda vez ya no sale el aviso', pg.locator('.voz-aviso').count() == 0 and pg.evaluate("window.__escuchando") == 2, pg.evaluate("window.__escuchando"))
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)
    ctx.close()
    # inglés: el aviso sale traducido
    ctx = contexto(b, 1280, 900, datos={'ag-duena': 'Sara'}, config_abierta=False); ctx.add_init_script(FALSO_SR); ctx.add_init_script("localStorage.setItem('lrAgendaIdioma','en')")
    pg = abrir(ctx, 'mis-ideas', 2200, config=False); pg.evaluate("window.lrFichas && window.lrFichas.agregar('tabla-ideas')"); pg.wait_for_timeout(300)
    pg.click('#mis-ideas [data-voz="dictar"]'); pg.wait_for_timeout(600)
    T.v('en inglés el aviso sale en inglés', 'Speak to write' in pg.inner_text('.voz-aviso') and 'Not now' in pg.inner_text('.voz-aviso'), pg.inner_text('.voz-aviso')[:80])
    ctx.close(); b.close()
T.fin()

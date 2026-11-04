"""Puntos de miles al escribir dinero (js/agenda/miles.js, 3-nov-2026)."""
from agenda_util import *
T = Prueba()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    pg = abrir(contexto(b, 390, 844, config_abierta=False), '', 2000, config=False)
    def hoja_con(sel):
        for h in pg.evaluate("[...document.querySelectorAll('.hoja-agenda')].map(h=>h.id)"):
            pg.evaluate("h=>window.lrIrAHoja(h)", h); pg.wait_for_timeout(200)
            if pg.evaluate("s=>{const e=document.querySelector(s);return !!e&&e.offsetParent!==null}", sel): return h
    h = hoja_con('#mv-meta'); pg.click('#mv-meta'); pg.keyboard.type('1500000', delay=15)
    T.v('meta del mes: 1500000 se ve 1.500.000', pg.input_value('#mv-meta') == '1.500.000', pg.input_value('#mv-meta'))
    pg.click('#mv-meta'); pg.keyboard.press('Home'); pg.keyboard.press('ArrowRight'); pg.keyboard.type('9')
    T.v('al escribir en medio, el cursor se queda en su sitio', pg.input_value('#mv-meta') == '19.500.000', pg.input_value('#mv-meta'))
    hoja_con('#fm-meta'); pg.click('#fm-meta'); pg.keyboard.type('2500000', delay=15); pg.click('#fm-n')
    T.v('meta de ahorro conserva el «$ »', pg.input_value('#fm-meta') == '$ 2.500.000', pg.input_value('#fm-meta'))
    hoja_con('#fin-cm'); pg.select_option('#fin-t', 'i'); pg.select_option('#fin-c', 'Ventas'); pg.click('#fin-cm'); pg.keyboard.type('45000', delay=15); pg.click('#fin-v'); pg.keyboard.type('120000', delay=15)
    T.v('«Ventas y gastos»: costo de materiales y valor con puntos', pg.input_value('#fin-cm') == '45.000' and pg.input_value('#fin-v') == '120.000', (pg.input_value('#fin-cm'), pg.input_value('#fin-v')))
    h = hoja_con('.hoja-agenda.abierta td[data-col=abono] textarea')
    sid = pg.evaluate("document.querySelector('.hoja-agenda.abierta td[data-col=abono] textarea').id")
    pg.evaluate("(()=>{const c=document.querySelector('.hoja-agenda.abierta tr.ficha .ficha-cab');if(c.getAttribute('aria-expanded')!=='true')c.click()})()"); pg.wait_for_timeout(300)
    pg.click('#' + sid); pg.keyboard.type('1234567', delay=15)
    T.v('columna «Abono» de una ficha con puntos', pg.input_value('#' + sid) == '1.234.567', pg.input_value('#' + sid))
    pg.reload(); pg.wait_for_timeout(1500); pg.evaluate("h=>window.lrIrAHoja(h)", h); pg.wait_for_timeout(400)
    T.v('lo guardado vuelve con puntos', pg.evaluate("id=>document.getElementById(id).value", sid) == '1.234.567')
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)
    b.close()
T.fin()

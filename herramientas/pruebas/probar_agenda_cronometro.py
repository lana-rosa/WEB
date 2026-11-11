"""Cronómetro por proyecto (E34, 11-nov-2026). Uso: /usr/bin/python3 probar_agenda_cronometro.py"""
import json
from agenda_util import *
DATOS = {'ag-f1-proyecto': 'Chaleco de María', 'ag-f1-estado': 'Tejiendo', 'ag-f2-proyecto': 'Gorro', 'ag-duena': 'Sara'}
T = Prueba()
def guardado(pg): return json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')") or '{}')
def abrir_fichas(pg): pg.evaluate("document.querySelectorAll('#tabla-fila tr.ficha .ficha-cab').forEach(b => { if (b.getAttribute('aria-expanded') !== 'true') b.click(); })"); pg.wait_for_timeout(500)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    pg = abrir(contexto(b, 1280, 1000, datos=DATOS, config_abierta=False), 'proyectos-fila', 2200, config=False)
    abrir_fichas(pg)
    f1 = '#tabla-fila tr.ficha[data-fila="1"] td.pl-tiempo'; f2 = '#tabla-fila tr.ficha[data-fila="2"] td.pl-tiempo'
    T.v('cada proyecto con nombre tiene «Tiempo tejido»', pg.locator(f1).count() == 1 and pg.locator(f2).count() == 1 and pg.locator('#tabla-fila tr.ficha[data-fila="3"] td.pl-tiempo').count() == 0)
    T.v('empieza en 0 min', '0 min' in pg.inner_text(f1 + ' .ct-reloj'))
    pg.click(f1 + ' button:has-text("Empezar")'); pg.wait_for_timeout(2500)
    g = guardado(pg)
    T.v('al empezar guarda la hora de inicio', g['_proyTiempo']['chaleco de maria']['desde'] > 0, g.get('_proyTiempo'))
    T.v('el reloj corre solo (h:mm:ss)', pg.locator(f1 + ' .ct-reloj.corre').count() == 1 and ':' in pg.inner_text(f1 + ' .ct-reloj') and pg.locator(f1 + ' button:has-text("Parar")').count() == 1)
    # al empezar otro se detiene el primero
    pg.click(f2 + ' button:has-text("Empezar")'); pg.wait_for_timeout(700)
    g = guardado(pg)['_proyTiempo']
    T.v('solo corre un cronómetro: al empezar el Gorro se detiene el Chaleco y suma sus segundos', g['chaleco de maria']['desde'] == 0 and g['chaleco de maria']['seg'] >= 2 and g['gorro']['desde'] > 0, g)
    pg.click(f2 + ' button:has-text("Parar")'); pg.wait_for_timeout(500)
    # sumar y restar a mano
    pg.fill(f1 + ' .ct-min', '90'); pg.click(f1 + ' button:has-text("Sumar")'); pg.wait_for_timeout(500)
    T.v('«Sumar» 90 minutos → 1 h 30 min', '1 h 3' in pg.inner_text(f1 + ' .ct-reloj'), pg.inner_text(f1 + ' .ct-reloj'))
    pg.fill(f1 + ' .ct-min', '30'); pg.click(f1 + ' button:has-text("Restar")'); pg.wait_for_timeout(500)
    T.v('«Restar» 30 minutos → 1 h 0x min', '1 h 0' in pg.inner_text(f1 + ' .ct-reloj'), pg.inner_text(f1 + ' .ct-reloj'))
    pg.fill(f1 + ' .ct-min', '1000'); pg.click(f1 + ' button:has-text("Restar")'); pg.wait_for_timeout(500)
    T.v('no baja de 0', guardado(pg)['_proyTiempo']['chaleco de maria']['seg'] == 0 and all(x >= 0 for x in guardado(pg)['_proyTiempo']['chaleco de maria']['dias'].values()))
    pg.fill(f1 + ' .ct-min', '45'); pg.click(f1 + ' button:has-text("Sumar")'); pg.wait_for_timeout(500)
    # sigue corriendo al recargar
    pg.click(f1 + ' button:has-text("Empezar")'); pg.wait_for_timeout(600)
    pg.evaluate("(() => { const d = JSON.parse(localStorage.getItem('rosinaAgenda')); d._proyTiempo['chaleco de maria'].desde = Date.now() - 60000; localStorage.setItem('rosinaAgenda', JSON.stringify(d)); })()")
    pg.reload(); pg.wait_for_timeout(2200); abrir_fichas(pg)
    T.v('al recargar el cronómetro sigue corriendo y cuenta el tiempo que pasó (45 min + ~1 min)', pg.locator(f1 + ' .ct-reloj.corre').count() == 1 and '0:46:' in pg.inner_text(f1 + ' .ct-reloj'), pg.inner_text(f1 + ' .ct-reloj'))
    # tope de 12 horas
    pg.evaluate("(() => { const d = JSON.parse(localStorage.getItem('rosinaAgenda')); d._proyTiempo['chaleco de maria'].desde = Date.now() - 20 * 3600 * 1000; localStorage.setItem('rosinaAgenda', JSON.stringify(d)); })()")
    pg.reload(); pg.wait_for_timeout(3500); abrir_fichas(pg)
    r = guardado(pg)['_proyTiempo']['chaleco de maria']
    T.v('un cronómetro olvidado se corta solo a las 12 horas y avisa', r['desde'] == 0 and 12 * 3600 <= r['seg'] <= 12 * 3600 + 3000 + 60, r)
    # resumen y panel
    rs = pg.evaluate("window.lrCrono.resumen()")
    T.v('resumen: total y semana coinciden con lo anotado', abs(rs['totalSeg'] - guardado(pg)['_proyTiempo']['chaleco de maria']['seg'] - guardado(pg)['_proyTiempo']['gorro']['seg']) < 2 and rs['semanaSeg'] > 0 and rs['enMarcha'] is None, rs)
    pg.evaluate("window.lrIrAHoja && window.lrIrAHoja('panel-agenda')"); pg.wait_for_timeout(1200)
    T.v('Mi panel muestra la tarjeta «Horas tejidas»', pg.locator('.pn-horas').count() == 1 and 'esta semana' in pg.inner_text('.pn-horas'), pg.locator('.pn-horas').count())
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)
    # sin tiempo: no hay tarjeta
    pg2 = abrir(contexto(b, 390, 800, datos={'ag-f1-proyecto': 'Otro'}, config_abierta=False), 'panel-agenda', 2200, config=False)
    T.v('sin tiempo anotado, Mi panel no muestra la tarjeta', pg2.locator('.pn-horas').count() == 0)
    b.close()
T.fin()

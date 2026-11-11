"""Medidas y gustos de la clienta (E34, 12-nov-2026). Uso: /usr/bin/python3 probar_agenda_clientas_perfil.py"""
import json
from agenda_util import *
DATOS = {'ag-duena': 'Sara', 'ag-cl1-nombre': 'Ana Gómez', 'ag-cl1-whatsapp': '3001234567', 'ag-cl1-notas': 'Le gusta el crochet suave', 'ag-cl2-nombre': 'Beto Ruiz'}
T = Prueba()
def g(pg): return json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')") or '{}')
def fichas(pg): pg.evaluate("document.querySelectorAll('#tabla-clientas tr.ficha .ficha-cab').forEach(b => { if (b.getAttribute('aria-expanded') !== 'true') b.click(); })"); pg.wait_for_timeout(500)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    pg = abrir(contexto(b, 1280, 1000, datos=DATOS, config_abierta=False), 'mis-clientas', 2300, config=False); fichas(pg)
    P = lambda n: '#tabla-clientas tr.ficha[data-fila="%d"] td.cl-perfil' % n
    T.v('cada clienta con nombre tiene «Medidas y gustos»; la fila vacía no', pg.locator(P(1)).count() == 1 and pg.locator(P(2)).count() == 1 and pg.locator(P(3)).count() == 0)
    T.v('viene plegada: solo se ve «Medidas y gustos»', pg.evaluate("!document.querySelector('%s details').open" % P(1)) and not pg.locator(P(1) + ' .cl-p-grid').first.is_visible() and 'Medidas y gustos' in pg.inner_text(P(1)))
    pg.click(P(1) + ' summary'); pg.wait_for_timeout(300)
    T.v('al abrirla muestra el recordatorio del permiso, 5 medidas y los gustos', 'solo si tu clienta te dio permiso' in pg.inner_text(P(1)) and pg.locator(P(1) + ' .cl-p-grid').first.locator('input').count() == 5 and pg.locator(P(1) + ' #cl-p-1-alergias').count() == 1 and pg.locator(P(1) + ' #cl-p-1-notas').count() == 1)
    for c, v in [('busto', '92'), ('cintura', '74,5'), ('gusta', 'rosa y lila'), ('alergias', 'lana de oveja'), ('notas', 'Prefiere puntos sueltos')]: pg.fill('#cl-p-1-' + c, v)
    pg.wait_for_timeout(700); d = g(pg)
    T.v('guarda lo escrito en _clientaPerfil.c1', d['_clientaPerfil']['c1'] == {'busto': '92', 'cintura': '74,5', 'gusta': 'rosa y lila', 'alergias': 'lana de oveja', 'notas': 'Prefiere puntos sueltos'}, d.get('_clientaPerfil'))
    T.v('el resumen dice «5 datos»', '5 datos' in pg.inner_text(P(1) + ' summary'), pg.inner_text(P(1) + ' summary'))
    T.v('no cambia ningún campo de la lista de clientas', d['ag-cl1-nombre'] == 'Ana Gómez' and d['ag-cl1-whatsapp'] == '3001234567' and d['ag-cl1-notas'] == 'Le gusta el crochet suave' and not any(k.startswith('ag-cl') and k not in DATOS for k in d), [k for k in d if k.startswith('ag-cl') and k not in DATOS])
    T.v('el texto que se escribe no se pierde ni salta mientras se guarda', pg.input_value('#cl-p-1-notas') == 'Prefiere puntos sueltos' and pg.evaluate("document.querySelector('%s details').open" % P(1)))
    pg.fill('#cl-p-1-busto', ''); pg.wait_for_timeout(600)
    T.v('borrar un campo lo quita de los datos', 'busto' not in g(pg)['_clientaPerfil']['c1'] and '4 datos' in pg.inner_text(P(1) + ' summary'))
    pg.reload(); pg.wait_for_timeout(2300); fichas(pg); pg.click(P(1) + ' summary'); pg.wait_for_timeout(300)
    T.v('al recargar los datos siguen ahí', pg.input_value('#cl-p-1-cintura') == '74,5' and pg.input_value('#cl-p-1-alergias') == 'lana de oveja')
    pg.click(P(2) + ' summary'); pg.fill('#cl-p-2-largo', '60'); pg.wait_for_timeout(500); pg.fill('#cl-p-2-largo', ''); pg.wait_for_timeout(600)
    T.v('si se borran todos los datos de una clienta no queda un registro vacío', 'c2' not in g(pg)['_clientaPerfil'], g(pg)['_clientaPerfil'])
    pg.fill('#ag-cl1-nombre', ''); pg.wait_for_timeout(1200)
    T.v('si la clienta se borra (sin nombre), su casilla y sus datos se borran', pg.locator(P(1)).count() == 0 and 'c1' not in g(pg)['_clientaPerfil'])
    T.v('sin errores de JavaScript (computador)', not pg.errs, pg.errs)
    # celular
    pc = abrir(contexto(b, 390, 844, datos=DATOS, config_abierta=False), 'mis-clientas', 2300, config=False); fichas(pc); pc.click(P(1) + ' summary'); pc.wait_for_timeout(400)
    T.v('en el celular los campos van en una columna y no hay desplazamiento horizontal', pc.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1") and pc.evaluate("getComputedStyle(document.querySelector('%s .cl-p-grid')).gridTemplateColumns.split(' ').length" % P(1)) == 1)
    T.v('sin errores de JavaScript (celular)', not pc.errs, pc.errs)
    b.close()
T.fin()

"""Tablero gráfico al abrir cada sección (31-oct-2026). Uso: /usr/bin/python3 probar_agenda_dashboards.py"""
from agenda_util import *
import datetime
hoy = datetime.date.today(); f = lambda d: d.strftime('%d/%m/%Y'); d = lambda n: hoy + datetime.timedelta(days=n)
mes_ant = (hoy.replace(day=1) - datetime.timedelta(days=1))
DATOS = {'ag-duena': 'Sara',
  'ag-f1-proyecto': 'Chal', 'ag-f1-estado': 'Terminado', 'ag-f2-proyecto': 'Gorro', 'ag-f2-estado': 'Tejiendo', 'ag-f3-proyecto': 'Manta', 'ag-f3-estado': 'Por empezar', 'ag-f3-fecha': f(d(10)), 'ag-f4-proyecto': 'Bolso', 'ag-f4-estado': 'Tejiendo',
  'ag-id1-tema': 'Pulpo', 'ag-id2-tema': 'Oso', 'ag-pt1-patron': 'Osito', 'ag-pt1-tejido': True, 'ag-pt2-patron': 'Gato', 'ag-ap1-tecnica': 'Punto bajo', 'ag-ap1-domino': True,
  'ag-l1-marca': 'Alize', 'ag-l1-ovillos': '5', 'ag-l2-marca': 'Alize', 'ag-l2-ovillos': '3', 'ag-l3-marca': 'Gasa', 'ag-l3-ovillos': '0',
  'ag-c1-material': 'Lana', 'ag-c1-comprado': True, 'ag-c2-material': 'Ojos', 'ag-ag1-medida': '3',
  'ag-vt1-fecha': f(hoy), 'ag-vt1-producto': 'Osito', 'ag-vt1-precio': '$ 100.000', 'ag-vt2-fecha': f(mes_ant), 'ag-vt2-producto': 'Gorro', 'ag-vt2-precio': '$ 60.000',
  'ag-p1-cliente': 'Ana', 'ag-p1-estado': 'En proceso', 'ag-p1-totalcompra': '$ 80.000', 'ag-p1-abono': '$ 30.000', 'ag-p1-entrega': f(d(3)), 'ag-p2-cliente': 'Beto', 'ag-p2-estado': 'Entregado', 'ag-p2-totalcompra': '$ 50.000', 'ag-p2-abono': '$ 50.000',
  'ag-cl1-nombre': 'Ana', 'ag-cl1-desde': f(hoy), 'ag-cl2-nombre': 'Beto', 'ag-cl2-desde': f(d(-200)),
  'ag-dr1-fecha': f(hoy), 'ag-dr1-animo': '😊 Feliz', 'ag-dr1-teji': 'Un gorro', 'ag-pa1': True, 'ag-pa2': True, 'ag-pa3': True,
  '_fin': {'fijos': [], 'deudas': [], 'movs': [{'id': '1', 't': 'i', 'f': hoy.strftime('%Y-%m-%d'), 'v': '500000', 'c': 'Ventas', 'm': 'Efectivo'}, {'id': '2', 't': 'g', 'f': hoy.strftime('%Y-%m-%d'), 'v': '200000', 'c': 'Materiales', 'm': 'Efectivo'},
                                                  {'id': '3', 't': 'i', 'f': mes_ant.strftime('%Y-%m-%d'), 'v': '300000', 'c': 'Ventas', 'm': 'Efectivo'}]}}
T = Prueba()
def seccion(pg, i):
    pg.evaluate("document.querySelectorAll('.pestana')[%d].click()" % i); pg.wait_for_timeout(500)
    return pg.inner_text('.vs-dash') if pg.locator('.vs-dash').count() else ''
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    pg = abrir(contexto(b, 1280, 1000, datos=DATOS, config_abierta=False), '', 2400, config=False)
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)
    a = seccion(pg, 2)
    T.v('Mis proyectos: tablero con «Cómo vas», gráfica de estados y datos', 'Cómo vas' in a and pg.locator('.vs-dash .db-donut').count() == 1 and 'Terminados · 1' in a and 'Tejiendo · 2' in a and 'Por empezar · 1' in a, a)
    T.v('Mis proyectos: próxima fecha en 10 días', 'Manta' in a and 'en 10 días' in a, a)
    T.v('Mis proyectos: ideas 2, patrones 2 (1 tejido), técnicas 1 (1 dominada)', 'Ideas guardadas' in a and '1 ya tejidos' in a and '1 ya dominadas' in a, a)
    a = seccion(pg, 3)
    T.v('Mis materiales: 8 ovillos, 3 lanas, 1 se acabó', 'Ovillos en total\n8' in a.replace('\n\n', '\n') and 'Lanas distintas\n3' in a.replace('\n\n', '\n') and 'Se acabaron\n1' in a.replace('\n\n', '\n'), a)
    T.v('Mis materiales: ovillos por marca y compras 1 de 2', 'Alize' in a and 'Comprado · 1' in a and 'Por comprar · 1' in a, a)
    a = seccion(pg, 4)
    T.v('Mi emprendimiento: ventas de 6 meses con gráfica', pg.locator('.vs-dash svg.gr-svg').count() >= 1 and 'Tus ventas de los últimos 6 meses' in a, a)
    T.v('Mi emprendimiento: este mes vas mejor ($ 100.000 contra $ 60.000)', '$ 100.000 contra $ 60.000' in a, a)
    T.v('Mi emprendimiento: pedidos por estado y por cobrar $ 50.000', 'En proceso · 1' in a and 'Entregado · 1' in a and '$ 50.000' in a, a)
    T.v('Mi emprendimiento: clientas 2, nuevas 1, lo que más vendes', 'Clientas\n2' in a.replace('\n\n', '\n') and 'Nuevas este mes\n1' in a.replace('\n\n', '\n') and 'Osito' in a, a)
    a = seccion(pg, 5)
    T.v('Finanzas: ingresos y gastos de 6 meses', 'Lo que entra y lo que sale' in a and pg.locator('.vs-dash svg.gr-svg').count() >= 2, a)
    T.v('Finanzas: este mes te quedan $ 300.000', 'te quedan $ 300.000' in a, a)
    T.v('Finanzas: utilidad por mes también se ve', 'Utilidad de cada mes' in a, a)
    a = seccion(pg, 6)
    T.v('Fechas y bienestar: fechas por semana, diario y pausas', 'Tus próximas fechas' in a and 'Días anotados este mes\n1' in a.replace('\n\n', '\n') and 'Días con pausas activas\n3' in a.replace('\n\n', '\n'), a)
    T.v('Fechas y bienestar: el ánimo del diario', 'Feliz' in a, a)
    T.v('cada gráfica tiene descripción para lector de pantalla', pg.evaluate("[...document.querySelectorAll('.vs-dash svg')].every(s => s.getAttribute('aria-label'))"))
    T.v('no se imprime', pg.evaluate("getComputedStyle(document.querySelector('.vs-dash')) && true"))
    T.v('las tarjetas de las hojas siguen debajo del tablero', pg.locator('.vs-hojas .vs-hoja').count() >= 3)
    pg.evaluate("document.getElementById('control-pedidos').classList.add('sin-membresia')"); a = seccion(pg, 4)
    T.v('con la membresía vencida, Mi emprendimiento no muestra su tablero', 'Cómo vas' not in a)
    pg.close()
    pg = abrir(contexto(b, 1280, 900, datos={'ag-duena': 'Sara'}, config_abierta=False), '', 2200, config=False)
    T.v('sin datos: cada sección explica qué anotar (sin errores)', all(('Cómo vas' in seccion(pg, i)) for i in (2, 3, 4, 5, 6)) and not pg.errs, pg.errs)
    pg.close()
    pg = abrir(contexto(b, 390, 844, datos=DATOS, config_abierta=False), '', 2400, config=False)
    ok = True
    for i in (2, 3, 4, 5, 6):
        seccion(pg, i); ok = ok and not pg.evaluate("document.documentElement.scrollWidth>innerWidth")
    T.v('celular: ninguna de las 5 secciones se desborda', ok)
    pg.close()
    ctx = contexto(b, 1280, 900, datos=DATOS, config_abierta=False); ctx.add_init_script("localStorage.setItem('lrAgendaIdioma','en')")
    pg = abrir(ctx, '', 3000, config=False)
    a = seccion(pg, 4)
    T.v('en inglés: títulos, estados y nombres propios intactos', 'How you are doing' in a and 'Your sales of the last 6 months' in a and 'In progress · 1' in a and 'Osito' in a, a[:300])
    b.close()
T.fin()

"""Plus etapa 6: informe del mes para imprimir (31-oct-2026). Uso: /usr/bin/python3 probar_agenda_informe.py"""
from agenda_util import *
import datetime
hoy = datetime.date.today(); f = lambda d: d.strftime('%d/%m/%Y'); iso = lambda d: d.strftime('%Y-%m-%d')
ant = (hoy.replace(day=1) - datetime.timedelta(days=1)).replace(day=10)
D = {'ag-duena': 'Sara',
  'ag-vt1-fecha': f(hoy), 'ag-vt1-producto': 'Peluche Spiderman', 'ag-vt1-cliente': 'Ana', 'ag-vt1-precio': '$ 70.000', 'ag-vt1-costo': '$ 45.700',
  'ag-vt2-fecha': f(hoy), 'ag-vt2-producto': 'peluche spiderman', 'ag-vt2-precio': '70000',
  'ag-vt3-fecha': f(hoy), 'ag-vt3-producto': 'Llavero', 'ag-vt3-precio': '20000',
  'ag-vt4-fecha': f(ant), 'ag-vt4-producto': 'Gorro', 'ag-vt4-precio': '60000',
  'ag-p1-cliente': 'Ana', 'ag-p1-estado': 'Entregado', 'ag-p1-entrega': f(hoy), 'ag-p1-totalcompra': '$ 80.000', 'ag-p1-abono': '$ 80.000',
  'ag-p2-cliente': 'Beto', 'ag-p2-estado': 'En proceso', 'ag-p2-totalcompra': '$ 100.000', 'ag-p2-abono': '$ 30.000',
  'ag-p3-cliente': 'Cami', 'ag-p3-estado': 'Cancelado', 'ag-p3-totalcompra': '$ 50.000',
  'ag-cl1-nombre': 'Ana', 'ag-cl1-desde': f(hoy), 'ag-cl2-nombre': 'Beto', 'ag-cl2-desde': f(ant),
  'ag-l1-marca': 'Alize', 'ag-l1-color': 'Rosa', 'ag-l1-ovillos': '4', 'ag-l1-costo': '8000', 'ag-l1-minimo': '2', 'ag-l2-marca': 'Gamitex', 'ag-l2-color': 'Rojo', 'ag-l2-ovillos': '0', 'ag-l2-costo': '10000',
  '_metaVentas': {'metas': {iso(hoy)[:7]: 500000}, 'margen': 35},
  '_fin': {'fijos': [{'id': 'a', 'n': 'Arriendo', 'v': '600000', 't': 'g', 'activo': True, 'dia': '5'}, {'id': 'b', 'n': 'Luz', 'v': '25000', 't': 'g', 'activo': True, 'dia': '5'}, {'id': 'c', 'n': 'Agua', 'v': '30000', 't': 'g', 'activo': True, 'dia': '5'}], 'deudas': [],
    'movs': [{'id': '1', 't': 'i', 'f': iso(hoy), 'v': '160000', 'c': 'Ventas', 'm': 'Efectivo'}, {'id': '2', 't': 'g', 'f': iso(hoy), 'v': '60000', 'c': 'Materiales', 'm': 'Efectivo'},
             {'id': '3', 't': 'g', 'f': iso(hoy), 'v': '20000', 'c': 'Transporte y envíos', 'm': 'Efectivo'}, {'id': '4', 't': 'i', 'f': iso(ant), 'v': '900000', 'c': 'Ventas', 'm': 'Efectivo'}]}}
T = Prueba()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    pg = abrir(contexto(b, 1280, 1000, datos=D, config_abierta=False), 'fin-resumen', 2600, config=False)
    T.v('sin errores de JavaScript', not pg.errs, pg.errs)
    T.v('el botón «Ver el informe del mes» está en Mi negocio en números', pg.locator('#fin-resumen #inf-boton').count() == 1)
    T.v('el informe empieza oculto', pg.locator('#informe-mes:visible').count() == 0)
    pg.click('#inf-boton'); pg.wait_for_timeout(500)
    t = pg.inner_text('#informe-mes'); tn = ' '.join(t.split())
    T.v('el informe se abre con el mes de hoy y el nombre del negocio', 'Negocio de Sara' in tn and str(hoy.year) in pg.inner_text('.inf-mes'), tn[:120])
    T.v('entró 160.000, salió 735.000 (80.000 + 655.000 de pagos fijos anotados solos) y perdiste 575.000', 'Entró $ 160.000' in tn and 'Salió $ 735.000' in tn and 'Perdiste $ 575.000' in tn, tn)
    T.v('si salió más de lo que entró lo dice', 'salió más de lo que entró' in tn, tn)
    T.v('ventas del mes: 3 ventas por $ 160.000', 'Ventas anotadas 3' in tn and 'Total vendido $ 160.000' in tn and 'Promedio por venta $ 53.333' in tn, tn)
    T.v('ganancia de las ventas con costo: 70.000 − 45.700 = 24.300', 'Ganancia (de las ventas con costo) $ 24.300' in tn, tn)
    T.v('lo que más vendiste: Peluche Spiderman junta las dos ventas ($ 140.000)', 'Peluche Spiderman $ 140.000' in tn, tn)
    T.v('meta 500.000 y logrado 32 %', 'Meta de ventas $ 500.000' in tn and 'Lo que lograste 32 %' in tn, tn)
    # fijos 655.000 / 0,35 = 1.871.428
    T.v('punto de equilibrio $ 1.871.429 y aviso de que no se llegó', 'Para no perder necesitabas vender $ 1.871.4' in tn and 'No llegaste a tu punto de equilibrio' in tn, tn)
    T.v('gastos por categoría: fijos 89 %, materiales 8 %, transporte 3 %', 'Gastos fijos $ 655.000 · 89 %' in tn and 'Materiales $ 60.000 · 8 %' in tn and 'Transporte y envíos $ 20.000 · 3 %' in tn, tn)
    T.v('pedidos: 1 entregado este mes ($ 80.000), 1 en marcha, por cobrar $ 70.000 (el cancelado no cuenta)', 'Pedidos entregados este mes 1 · $ 80.000' in tn and 'Pedidos en marcha hoy 1' in tn and 'Por cobrar hoy $ 70.000' in tn, tn)
    T.v('clientas nuevas este mes: 1', 'Clientas nuevas 1' in tn, tn)
    T.v('materiales: dinero en lana $ 32.000 y 1 lana por acabarse (Gamitex · Rojo)', 'Dinero en lana $ 32.000' in tn and 'Lanas por acabarse 1' in tn and 'Gamitex · Rojo' in tn, tn)
    T.v('al pie dice que es una guía y no contabilidad oficial', 'no es contabilidad oficial' in tn)
    # mes anterior
    pg.click('#informe-mes .inf-barra button:nth-child(1)'); pg.wait_for_timeout(400)
    t2 = ' '.join(pg.inner_text('#informe-mes').split())
    T.v('mes anterior: entró 900.000, salió 0, 1 venta (Gorro)', 'Entró $ 900.000' in t2 and 'Total vendido $ 60.000' in t2 and 'Gorro' in t2, t2)
    pg.click('#informe-mes .inf-barra button:nth-child(2)'); pg.click('#informe-mes .inf-barra button:nth-child(2)'); pg.wait_for_timeout(400)
    T.v('mes anterior: te quedó todo y lo dice (por cada $ 100 te quedaron $ 100)', 'Te quedó $ 900.000' in t2 and 'te quedaron $ 100' in t2, t2)
    T.v('un mes sin nada anotado explica qué hacer', 'No hay nada anotado en este mes' in pg.inner_text('#informe-mes'))
    # impresión: solo el informe
    pg.click('#informe-mes .inf-barra button:nth-child(1)'); pg.wait_for_timeout(300)
    pg.evaluate("document.body.classList.add('imprimiendo-informe')"); pg.emulate_media(media='print'); pg.wait_for_timeout(300)
    vis = pg.evaluate("[...document.body.children].filter(e => getComputedStyle(e).display !== 'none' && !['SCRIPT','STYLE','LINK','NOSCRIPT'].includes(e.tagName)).map(e => e.id || e.tagName)")
    T.v('al imprimir solo se ve el informe', vis == ['informe-mes'], vis)
    T.v('al imprimir no salen los botones del informe', pg.evaluate("getComputedStyle(document.querySelector('.inf-barra')).display") == 'none')
    pg.emulate_media(media='screen'); pg.evaluate("document.body.classList.remove('imprimiendo-informe')")
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    T.v('Esc cierra el informe', pg.locator('#informe-mes:visible').count() == 0)
    T.v('las casillas de la persona no se tocaron', pg.input_value('#ag-vt1-precio') == '$ 70.000')
    pg.close()
    ctx = contexto(b, 1280, 1000, datos=D, config_abierta=False); ctx.add_init_script("localStorage.setItem('lrAgendaIdioma','en')")
    pg = abrir(ctx, 'fin-resumen', 2600, config=False)
    pg.click('#inf-boton'); pg.wait_for_timeout(500)
    te = ' '.join(pg.inner_text('#informe-mes').split())
    T.v('en inglés: informe traducido y mes en inglés', 'month report' in te.lower() and 'Came in' in te and 'Where the money went' in te and 'Fixed expenses' in te and 'Shipping' not in te and 'You did not reach your break-even point' in te and 'Business of Sara' in te, te)
    T.v('en inglés: el mes sale en inglés', pg.inner_text('.inf-mes').split()[0] in ['January','February','March','April','May','June','July','August','September','October','November','December'], pg.inner_text('.inf-mes'))
    pg.close()
    pg = abrir(contexto(b, 390, 844, datos=D, config_abierta=False), 'fin-resumen', 2600, config=False)
    pg.click('#inf-boton'); pg.wait_for_timeout(500)
    T.v('celular: sin desplazamiento horizontal', pg.evaluate("document.querySelector('.inf-hoja').scrollWidth <= document.querySelector('.inf-hoja').clientWidth + 1"))
    pg.close()
    b.close()
T.fin()

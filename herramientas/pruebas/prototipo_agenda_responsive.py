"""Capturas del PROTOTIPO responsive (no toca la web): inyecta herramientas/agenda-auditoria/prototipo/prototipo.css y fotografía 4 hojas en 5 tamaños, con y sin el prototipo.
Uso: /usr/bin/python3 prototipo_agenda_responsive.py carpeta_salida"""
import sys, os
from agenda_util import *
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
CSS = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'agenda-auditoria', 'prototipo', 'prototipo.css'), encoding='utf-8').read()
DATOS = {'ag-duena': 'Persona de Prueba'}
import json
meses = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10']
movs = []
for i, m in enumerate(meses):
    movs += [{'f': m + '-05', 't': 'i', 'v': 900000 + 150000 * i, 'c': 'Ventas', 'n': 'Venta'}, {'f': m + '-12', 't': 'g', 'v': 280000 + 40000 * i, 'c': 'Materiales', 'n': 'Lana'}, {'f': m + '-18', 't': 'g', 'v': 90000, 'c': 'Empaques', 'n': 'Bolsas'}]
DATOS['_fin'] = {'movs': [dict(x, id=str(i), neg=True) for i, x in enumerate(movs)], 'pres': {'Materiales': 400000}, 'fijos': [], 'deudas': [], 'metas': [], 'tarjetas': []}
for i in range(1, 8):
    DATOS.update({f'ag-p{i}-cliente': f'Clienta {i}', f'ag-p{i}-pedido': ['Osito de apego', 'Manta bebé', 'Llavero oveja', 'Chaleco', 'Gorro y bufanda', 'Flor decorativa', 'Muñeca'][i - 1], f'ag-p{i}-entrega': f'{i + 1:02d}/11/2026',
                  f'ag-p{i}-estado': ['En proceso', 'Pedido confirmado', 'Cotizado', 'Terminado', 'En proceso', 'Despachado', 'En proceso'][i - 1], f'ag-p{i}-totalcompra': f'$ {45000 + i * 12000:,}'.replace(',', '.'), f'ag-p{i}-abono': '$ 40.000', f'ag-p{i}-telefono': '3000000000',
                  f'ag-vt{i}-fecha': f'{i:02d}/10/2026', f'ag-vt{i}-producto': 'Manta', f'ag-vt{i}-cliente': f'Clienta {i}', f'ag-vt{i}-precio': '$ 150.000', f'ag-vt{i}-costo': '$ 40.000',
                  f'ag-gs{i}-fecha': f'{i:02d}/10/2026', f'ag-gs{i}-detalle': 'Lana', f'ag-gs{i}-valor': '$ 60.000', f'ag-gs{i}-categoria': 'Materiales',
                  f'ag-f{i}-proyecto': f'Proyecto {i}', f'ag-f{i}-para': 'Alguien', f'ag-f{i}-estado': 'Tejiendo', f'ag-f{i}-fecha': f'1{i % 9}/11/2026'})
TAM = [('celular', 390, 844), ('celular-apaisado', 844, 390), ('tablet', 768, 1024), ('portatil', 1280, 800), ('monitor', 1920, 1080)]
HOJAS = ['portada-agenda', 'tablero-agenda', 'control-pedidos', 'fin-resumen']
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    for nombre, w, h in TAM:
        for modo in ('actual', 'prototipo'):
            ctx = contexto(b, w, h, datos=DATOS, config_abierta=False)
            pg = abrir(ctx, '', 2500, config=False)
            if modo == 'prototipo': pg.add_style_tag(content=CSS); pg.wait_for_timeout(800)
            for hoja in HOJAS:
                pg.evaluate("i => window.lrIrAHoja(i)", hoja); pg.wait_for_timeout(500)
                if hoja == 'control-pedidos': pg.evaluate("document.querySelectorAll('#tabla-pedidos tr.ficha').forEach((t, i) => { if (i === 0) t.querySelector('.ficha-cab') && t.querySelector('.ficha-cab').click(); })"); pg.wait_for_timeout(300)
                pg.evaluate("window.scrollTo(0, 0)"); pg.evaluate("document.querySelector('.agenda-layout').scrollIntoView()"); pg.wait_for_timeout(250)
                pg.screenshot(path=os.path.join(OUT, f'{hoja}-{nombre}-{modo}.png'), full_page=(nombre in ('monitor', 'portatil', 'tablet')), clip=None)
            ctx.close()
        print(nombre, 'listo', flush=True)
    b.close()

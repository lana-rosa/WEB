#!/usr/bin/env python3
"""Revisión de etiquetas de regalo de los productos (ocasión, para quién, estilo).

  python3 herramientas/innovacion/etiquetas.py hoja [salida.xlsx]
      Crea la hoja de Excel para que Sara corrija la PROPUESTA (parte de herramientas/pruebas/fixtures/regalos.json).
  python3 herramientas/innovacion/etiquetas.py cargar hoja_corregida.xlsx [salida.sql]
      Lee la hoja corregida y escribe el SQL que marca las etiquetas como revisadas (no lo aplica: se revisa y se corre aparte).

Los textos de las opciones son los mismos que ve la clienta (js/universo/config.js); los ids son los que se guardan.
"""
import json, os, re, sys
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.worksheet.datavalidation import DataValidation

AQUI = os.path.dirname(os.path.abspath(__file__))
OCASIONES = {'cumpleanos': 'Cumpleaños', 'amor_amistad': 'Amor y amistad', 'dia_madre': 'Día de la madre', 'dia_padre': 'Día del padre', 'graduacion': 'Graduación',
             'bebe': 'Llegada de un bebé', 'agradecimiento': 'Agradecimiento', 'detalle': 'Un detalle pequeño', 'decoracion': 'Para decorar'}
DESTINATARIOS = {'mama': 'Mamá', 'papa': 'Papá', 'pareja': 'Mi pareja', 'amiga_o': 'Una amiga o amigo', 'nina_nino': 'Una niña o niño', 'bebe': 'Un bebé',
                 'colega_profe': 'Una profe o colega', 'fan_personaje': 'Fan de un personaje', 'tu_mismo': 'Para mí'}
ESTILOS = {'tierno': 'Tierno', 'divertido': 'Divertido', 'coleccionable': 'Coleccionable', 'elegante': 'Elegante', 'naturaleza': 'De la naturaleza', 'colombiano': 'Colombiano'}
ESTADOS = ['Sí, está bien', 'Corregí', 'No sé']


def hoja(salida):
    datos = json.load(open(os.path.join(AQUI, '..', 'pruebas', 'fixtures', 'regalos.json'), encoding='utf-8'))
    datos = [p for p in datos if p['ocasiones'] or p['destinatarios'] or p['estilos']]
    wb = Workbook(); ws = wb.active; ws.title = 'Etiquetas'
    enc = ['Producto', 'Categoría', 'Precio', 'Medida (cm)', '¿Está bien la propuesta?', 'Ocasiones', 'Para quién', 'Estilo', 'id (no tocar)']
    ws.append(['Corrige solo lo que no te parezca. En «Ocasiones», «Para quién» y «Estilo» escribe las opciones separadas por coma (mira la hoja «Opciones»). '
               'Marca en la cuarta columna si está bien, si corregiste o si no sabes. Solo lo marcado «Sí» o «Corregí» se publica.'])
    ws.append(enc)
    for p in datos:
        ws.append([p['nombre'], p['categoria_web'], p['precio'], p['tamano_cm'], None,
                   ', '.join(OCASIONES[x] for x in p['ocasiones'] if x in OCASIONES), ', '.join(DESTINATARIOS[x] for x in p['destinatarios'] if x in DESTINATARIOS),
                   ', '.join(ESTILOS[x] for x in p['estilos'] if x in ESTILOS), p['id']])
    ws.merge_cells('A1:I1'); ws['A1'].alignment = Alignment(wrap_text=True, vertical='top'); ws.row_dimensions[1].height = 48
    for c in ws[2]:
        c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor='E74E96'); c.alignment = Alignment(wrap_text=True, vertical='center')
    for col, ancho in zip('ABCDEFGHI', (38, 18, 11, 10, 22, 42, 42, 28, 38)):
        ws.column_dimensions[col].width = ancho
    for fila in ws.iter_rows(min_row=3):
        for c in fila:
            c.alignment = Alignment(wrap_text=True, vertical='top')
        fila[2].number_format = '"$"#,##0'
    dv = DataValidation(type='list', formula1='"%s"' % ','.join(ESTADOS), allow_blank=True); ws.add_data_validation(dv); dv.add('E3:E%d' % (len(datos) + 2))
    ws.freeze_panes = 'B3'
    op = wb.create_sheet('Opciones')
    op.append(['Ocasiones', 'Para quién', 'Estilo'])
    for k in range(max(len(OCASIONES), len(DESTINATARIOS), len(ESTILOS))):
        op.append([list(OCASIONES.values())[k] if k < len(OCASIONES) else None, list(DESTINATARIOS.values())[k] if k < len(DESTINATARIOS) else None, list(ESTILOS.values())[k] if k < len(ESTILOS) else None])
    for c in op[1]:
        c.font = Font(bold=True)
    for col in 'ABC':
        op.column_dimensions[col].width = 26
    wb.save(salida); print(len(datos), 'productos →', salida)


def a_ids(texto, vocab, columna, producto, errores):
    inv = {v.lower(): k for k, v in vocab.items()}
    ids = []
    for parte in [t.strip() for t in re.split(r'[,;\n]', texto or '') if t.strip()]:
        if parte.lower() in inv: ids.append(inv[parte.lower()])
        else: errores.append('%s · %s: «%s» no está en la hoja «Opciones»' % (producto, columna, parte))
    return ids


def cargar(entrada, salida):
    ws = load_workbook(entrada, data_only=True)['Etiquetas']
    errores, sentencias, sin_marcar = [], [], 0
    for fila in ws.iter_rows(min_row=3, values_only=True):
        nombre, _cat, _pre, _med, estado, oc, de, es, item = (list(fila) + [None] * 9)[:9]
        if not item: continue
        if (estado or '').strip() not in ESTADOS[:2]:
            sin_marcar += 1; continue
        o, d, e = a_ids(oc, OCASIONES, 'Ocasiones', nombre, errores), a_ids(de, DESTINATARIOS, 'Para quién', nombre, errores), a_ids(es, ESTILOS, 'Estilo', nombre, errores)
        arr = lambda a: "'{" + ','.join(a) + "}'"
        sentencias.append("update public.producto_etiquetas set ocasiones = %s, destinatarios = %s, estilos = %s, revisado_por = 'Sara', revisado_en = now(), actualizado_en = now() where item_id = '%s'; -- %s"
                          % (arr(o), arr(d), arr(e), item, str(nombre).replace('\n', ' ')))
    if errores:
        print('NO se generó el SQL; corrige estos textos:\n - ' + '\n - '.join(errores)); sys.exit(1)
    open(salida, 'w', encoding='utf-8').write('-- Etiquetas revisadas por Sara (generado por herramientas/innovacion/etiquetas.py)\n' + '\n'.join(sentencias) + '\n')
    print('%d productos revisados, %d sin marcar (quedan como propuesta) →' % (len(sentencias), sin_marcar), salida)


if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['hoja']: hoja(a[1] if len(a) > 1 else os.path.join(AQUI, 'etiquetas-productos.xlsx'))
    elif a[:1] == ['cargar'] and len(a) >= 2: cargar(a[1], a[2] if len(a) > 2 else os.path.splitext(a[1])[0] + '.sql')
    else: print(__doc__)

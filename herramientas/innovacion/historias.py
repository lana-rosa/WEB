#!/usr/bin/env python3
"""Hoja para que el taller revise los cuidados y escriba la historia de cada pieza (Etapa 3: página /p/ con QR).

  python3 herramientas/innovacion/historias.py hoja datos.json [salida.xlsx]
      Crea la hoja de Excel. datos.json: [{"id","nombre","categoria_web","cuidados":[...]}], por ejemplo con
        select json_agg(json_build_object('id', id, 'nombre', nombre, 'categoria_web', categoria_web, 'cuidados', coalesce(cuidados_web, '[]'::jsonb)) order by categoria_web, nombre)
        from obtener_tienda_web();
      (hay una copia del 16-oct-2026 en herramientas/pruebas/fixtures/tienda-cuidados.json)
  python3 herramientas/innovacion/historias.py cargar hoja_corregida.xlsx [salida.sql]
      Lee la hoja y escribe el SQL que aprueba y publica las piezas marcadas «Sí» (no lo aplica: se revisa y se corre aparte).

Reglas: solo se publica lo marcado «Sí»; los cuidados de la columna D pasan a ser «revisados por el taller para esta pieza» (si el taller
los deja igual, los está confirmando); la historia y el material son opcionales; se rechazan textos demasiado largos y fechas que la marca no celebra.
"""
import json, os, re, sys, unicodedata
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.worksheet.datavalidation import DataValidation

MAX_HISTORIA, MAX_MATERIAL, MAX_LINEA, MAX_LINEAS = 1200, 300, 200, 10
PROHIBIDAS = re.compile(r'navidad|navide[ñn]|halloween|san\s+valent[ií]n', re.I)
ENCABEZADO = ['Producto', 'Categoría', 'Cuidados que dice hoy la web', 'Cuidados para ESTA pieza (confirma o corrige; una frase por línea)', 'Material (opcional)', 'Historia (opcional, 2 a 4 frases)', '¿Publicar? (Sí / No)', 'id (no tocar)']


def sin_tildes(t):
    return ''.join(c for c in unicodedata.normalize('NFD', str(t or '').strip().lower()) if unicodedata.category(c) != 'Mn')


def decision(valor):
    """True = publicar; False = no; None = no se entiende."""
    t = sin_tildes(valor)
    if not t or t.startswith('no'):
        return False
    if t.startswith('si') or t in ('ok', 'listo', 'publicar'):
        return True
    return None


def hoja(datos_json, salida):
    datos = json.load(open(datos_json, encoding='utf-8'))
    wb = Workbook(); ws = wb.active; ws.title = 'Piezas'
    ws.append(['Para cada pieza: confirma o corrige los cuidados (columna D), escribe si quieres su historia y marca «Sí» en la última columna para publicarla. '
               'Lo que no marques «Sí» no se publica. Los cuidados que dejes en D se muestran como «revisados por el taller».'])
    ws.append(ENCABEZADO)
    for p in datos:
        cu = [c for c in (p.get('cuidados') or []) if str(c).strip()]
        ws.append([p['nombre'], p.get('categoria_web'), '\n'.join(cu) or '(sin cuidados)', '\n'.join(cu), None, None, None, p['id']])
    ws.merge_cells('A1:H1'); ws['A1'].alignment = Alignment(wrap_text=True, vertical='top'); ws.row_dimensions[1].height = 48
    for c in ws[2]:
        c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor='E74E96'); c.alignment = Alignment(wrap_text=True, vertical='center')
    for col, ancho in zip('ABCDEFGH', (36, 16, 30, 46, 26, 54, 14, 36)):
        ws.column_dimensions[col].width = ancho
    for fila in ws.iter_rows(min_row=3):
        for c in fila:
            c.alignment = Alignment(wrap_text=True, vertical='top')
    dv = DataValidation(type='list', formula1='"Sí,No"', allow_blank=True); ws.add_data_validation(dv); dv.add('G3:G%d' % (len(datos) + 2))
    ws.freeze_panes = 'B3'
    wb.save(salida); print(len(datos), 'piezas →', salida)


def sql_texto(t):
    return "'" + str(t).replace("'", "''") + "'"


def cargar(entrada, salida):
    ws = load_workbook(entrada, data_only=True)['Piezas']
    errores, sentencias, sin_publicar = [], [], 0
    for fila in ws.iter_rows(min_row=3, values_only=True):
        nombre, _cat, _hoy, cuidados, material, historia, publicar, item = (list(fila) + [None] * 8)[:8]
        if not item:
            continue
        d = decision(publicar)
        if d is None:
            errores.append('%s · «¿Publicar?»: «%s» no se entiende (usa Sí o No)' % (nombre, publicar)); continue
        if not d:
            sin_publicar += 1; continue
        lineas = [l.strip() for l in re.split(r'\n', str(cuidados or '')) if l.strip()]
        historia = str(historia or '').strip(); material = str(material or '').strip()
        if len(historia) > MAX_HISTORIA: errores.append('%s · la historia mide %d caracteres (máximo %d)' % (nombre, len(historia), MAX_HISTORIA))
        if len(material) > MAX_MATERIAL: errores.append('%s · el material mide %d caracteres (máximo %d)' % (nombre, len(material), MAX_MATERIAL))
        if len(lineas) > MAX_LINEAS: errores.append('%s · tiene %d frases de cuidados (máximo %d)' % (nombre, len(lineas), MAX_LINEAS))
        for l in lineas:
            if len(l) > MAX_LINEA: errores.append('%s · una frase de cuidados mide %d caracteres (máximo %d)' % (nombre, len(l), MAX_LINEA))
        for t in [historia, material] + lineas:
            if PROHIBIDAS.search(t): errores.append('%s · el texto «%s…» menciona una fecha que la marca no celebra' % (nombre, t[:30]))
        cu_sql = sql_texto(json.dumps(lineas, ensure_ascii=False)) + '::jsonb' if lineas else 'null'
        sentencias.append("insert into public.producto_historia (item_id, historia, cuidados_validados, material_notas, publicado, revisado_por, revisado_en) values (%s, %s, %s, %s, true, 'Sara', now()) "
                          "on conflict (item_id) do update set historia = excluded.historia, cuidados_validados = excluded.cuidados_validados, material_notas = excluded.material_notas, publicado = true, revisado_por = excluded.revisado_por, revisado_en = excluded.revisado_en, actualizado_en = now(); -- %s"
                          % (sql_texto(item), sql_texto(historia) if historia else 'null', cu_sql, sql_texto(material) if material else 'null', str(nombre).replace('\n', ' ')))
    if errores:
        print('NO se generó el SQL; corrige:\n - ' + '\n - '.join(errores)); sys.exit(1)
    open(salida, 'w', encoding='utf-8').write('-- Piezas aprobadas por el taller para la página /p/ (generado por herramientas/innovacion/historias.py)\n' + '\n'.join(sentencias) + '\n')
    print('%d piezas aprobadas, %d sin publicar →' % (len(sentencias), sin_publicar), salida)


if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['hoja'] and len(a) >= 2: hoja(a[1], a[2] if len(a) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'historias-piezas.xlsx'))
    elif a[:1] == ['cargar'] and len(a) >= 2: cargar(a[1], a[2] if len(a) > 2 else os.path.splitext(a[1])[0] + '.sql')
    else: print(__doc__)

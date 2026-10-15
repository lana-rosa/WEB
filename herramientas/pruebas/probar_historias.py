#!/usr/bin/env python3
"""Pruebas de herramientas/innovacion/historias.py (hoja de cuidados e historias del taller → SQL de aprobación).
Uso: python3 herramientas/pruebas/probar_historias.py"""
import json, os, re, subprocess, sys, tempfile
from openpyxl import load_workbook

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
HERR = os.path.join(RAIZ, 'herramientas', 'innovacion', 'historias.py')
DATOS = os.path.join(os.path.dirname(__file__), 'fixtures', 'tienda-cuidados.json')
fallos, pasaron = [], 0


def verificar(nombre, ok, detalle=''):
    global pasaron
    if ok: pasaron += 1; print('  ok   ' + nombre)
    else: fallos.append(nombre); print('  FALLA ' + nombre + (' → ' + str(detalle)[:300] if detalle else ''))


def correr(*args):
    return subprocess.run([sys.executable, HERR] + list(args), capture_output=True, text=True)


with tempfile.TemporaryDirectory() as tmp:
    piezas = json.load(open(DATOS, encoding='utf-8'))
    hoja = os.path.join(tmp, 'hoja.xlsx')
    r = correr('hoja', DATOS, hoja)
    verificar('crea la hoja con las %d piezas de la tienda' % len(piezas), r.returncode == 0 and len(piezas) == 77, r.stderr)
    wb = load_workbook(hoja); ws = wb['Piezas']
    filas = [f for f in ws.iter_rows(min_row=3, values_only=True) if f[7]]
    verificar('la hoja trae nombre, categoría, los cuidados de hoy, los cuidados a confirmar (ya escritos), vacíos material e historia, y el id', len(filas) == 77 and all(f[0] and f[7] for f in filas) and filas[0][3] and filas[0][4] is None and filas[0][5] is None and filas[0][6] is None)
    verificar('nada se publica si no se marca: cargar una hoja sin marcar no genera ninguna sentencia', 'sin publicar' in correr('cargar', hoja, os.path.join(tmp, 'v.sql')).stdout and '0 piezas aprobadas' in correr('cargar', hoja, os.path.join(tmp, 'v.sql')).stdout)
    # el taller aprueba tres piezas: una confirma los cuidados tal cual, otra los corrige y escribe historia con comillas, otra solo la historia
    zaria = next(i for i, f in enumerate(ws.iter_rows(min_row=3, values_only=True)) if f[0] == 'Bolso ZARIA') + 3
    ws.cell(zaria, 7).value = 'Sí'
    ws.cell(zaria, 4).value = 'Lavar a mano con agua fría y jabón neutro\nSecar a la sombra, sobre una superficie plana'
    ws.cell(zaria, 5).value = "Lana de «Villamaría» y botón d'oro"
    ws.cell(zaria, 6).value = "Nació en el taller de Villamaría.\nCada puntada es a mano; el bolso de 'Zaria' se teje en dos días."
    ws.cell(3, 7).value = 'sí'
    ws.cell(4, 7).value = 'OK'; ws.cell(4, 4).value = None
    ws.cell(5, 7).value = 'No'
    ws.cell(5, 6).value = 'Esta historia NO debe publicarse'
    buena = os.path.join(tmp, 'buena.xlsx'); wb.save(buena)
    sql = os.path.join(tmp, 'buena.sql')
    r = correr('cargar', buena, sql)
    texto = open(sql, encoding='utf-8').read()
    verificar('aprueba solo las marcadas «Sí» (también «sí» y «OK»); «No» y vacío no se publican', r.returncode == 0 and texto.count('insert into public.producto_historia') == 3 and 'NO debe publicarse' not in texto and '3 piezas aprobadas' in r.stdout and '74 sin publicar' in r.stdout, r.stdout + r.stderr)
    verificar('el SQL no borra nada (sin DROP, DELETE ni TRUNCATE) y marca revisado_por y revisado_en', not re.search(r'\b(drop|delete|truncate)\b', texto, re.I) and texto.count("revisado_por") >= 3 and "'Sara', now()" in texto)
    verificar('las comillas del texto se escapan bien y los cuidados quedan como lista JSON', "botón d''oro" in texto and "''Zaria''" in texto and '["Lavar a mano con agua fría y jabón neutro", "Secar a la sombra, sobre una superficie plana"]' in texto)
    verificar('una pieza aprobada sin tocar la columna de cuidados los confirma tal cual; sin cuidados queda en null (se usan los de siempre)', '["No usar secadora"]' in texto and 'null' in texto)
    for caso, cambio, esperado in (
        ('historia de más de 1.200 caracteres', lambda w: w.cell(3, 6).__setattr__('value', 'a' * 1201), 'la historia mide 1201'),
        ('una frase de cuidados de más de 200 caracteres', lambda w: w.cell(3, 4).__setattr__('value', 'x' * 201), 'una frase de cuidados mide 201'),
        ('más de 10 frases de cuidados', lambda w: w.cell(3, 4).__setattr__('value', '\n'.join('frase %d' % i for i in range(11))), 'tiene 11 frases'),
        ('fecha que la marca no celebra en la historia', lambda w: w.cell(3, 6).__setattr__('value', 'Ideal para la Navidad'), 'no celebra'),
        ('Halloween en los cuidados', lambda w: w.cell(3, 4).__setattr__('value', 'Guardar después de Halloween'), 'no celebra'),
        ('respuesta que no se entiende en «¿Publicar?»', lambda w: w.cell(3, 7).__setattr__('value', 'quizás'), 'no se entiende'),
    ):
        wb2 = load_workbook(hoja); w = wb2['Piezas']; w.cell(3, 7).value = 'Sí'; cambio(w)
        malo = os.path.join(tmp, 'malo.xlsx'); wb2.save(malo)
        r = correr('cargar', malo, os.path.join(tmp, 'malo.sql'))
        verificar('rechaza: %s (no genera SQL)' % caso, r.returncode != 0 and esperado in r.stdout and not os.path.exists(os.path.join(tmp, 'malo.sql')), r.stdout)
print('\n%d comprobaciones correctas, %d con falla.' % (pasaron, len(fallos)))
if fallos:
    print('FALLAS:\n - ' + '\n - '.join(fallos)); sys.exit(1)

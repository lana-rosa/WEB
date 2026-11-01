#!/usr/bin/env python3
"""Datos del glosario y de las abreviaturas de Rosina para la hoja «Recursos de Rosina» de la agenda (1-nov-2026, pedido de Jennifer:
tener los recursos gratis dentro de la agenda). Lee glosario_datos.py y la tabla de abreviaturas de recursos-rosina.html y escribe js/agenda/recursos-datos.js.
Uso: python3 herramientas/generar_recursos_agenda.py   (volver a correrlo si cambia el glosario o la tabla)"""
import json, os, re, html
from html.parser import HTMLParser
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.join(AQUI, '..')
import sys; sys.path.insert(0, AQUI)
import glosario_datos as g

class Tabla(HTMLParser):
    def __init__(s): super().__init__(); s.dentro=False; s.fila=None; s.celda=None; s.filas=[]; s.cab=[]; s.cab_modo=False; s.prof=0
    def handle_starttag(s, t, a):
        a=dict(a)
        if t=='table' and a.get('id')=='tabla-abrev': s.dentro=True
        elif s.dentro and t=='thead': s.cab_modo=True
        elif s.dentro and t=='tr': s.fila=[]
        elif s.dentro and t in ('td','th'): s.celda={'b':'','s':'','cual':None}; s.celda['id']=a.get('data-idioma')
        elif s.dentro and s.celda is not None and t in ('b','small'): s.celda['cual']=t
    def handle_endtag(s, t):
        if t=='table' and s.dentro: s.dentro=False
        elif s.dentro and t=='thead': s.cab_modo=False
        elif s.dentro and t in ('td','th') and s.celda is not None:
            if s.cab_modo: s.cab.append((s.celda['id'] or 'es', (s.celda['b'] or s.celda['s']).strip()))
            else: s.fila.append([s.celda['b'].strip(), s.celda['s'].strip()])
            s.celda=None
        elif s.dentro and t=='tr' and s.fila and not s.cab_modo: s.filas.append(s.fila); s.fila=None
        elif s.dentro and t in ('b','small') and s.celda is not None: s.celda['cual']=None
    def handle_data(s, d):
        if s.dentro and s.celda is not None:
            if s.celda['cual']=='b': s.celda['b']+=d
            elif s.celda['cual']=='small': s.celda['s']+=d
            elif s.cab_modo: s.celda['b']+=d
t=Tabla(); t.feed(open(os.path.join(RAIZ,'recursos-rosina.html'),encoding='utf-8').read())
datos={
 'categorias':[{'id':i,'n':n} for i,n in g.CATEGORIAS],
 'glosario':[{k:(list(v) if isinstance(v,tuple) else v) for k,v in d.items()} for d in g.TERMINOS],
 'abrev':{'idiomas':[{'id':i,'n':n} for i,n in t.cab], 'filas':t.filas},
}
assert len(t.filas)>=15 and len(t.cab)>=9, (len(t.filas), len(t.cab))
salida=os.path.join(RAIZ,'js','agenda','recursos-datos.js')
open(salida,'w',encoding='utf-8').write('/* Generado por herramientas/generar_recursos_agenda.py: no editar a mano. */\nwindow.lrRecursosDatos = '+json.dumps(datos,ensure_ascii=False)+';\n')
print('listo:', len(datos['glosario']),'términos,',len(t.filas),'abreviaturas,',len(t.cab),'idiomas')

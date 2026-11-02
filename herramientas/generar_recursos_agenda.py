#!/usr/bin/env python3
"""Datos del glosario y de las abreviaturas de Rosina para la hoja «Recursos de Rosina» de la agenda (1-nov-2026, pedido de Jennifer:
tener los recursos gratis dentro de la agenda). Lee glosario_datos.py y la tabla de abreviaturas de recursos-rosina.html y escribe js/agenda/recursos-datos.js.
Uso: python3 herramientas/generar_recursos_agenda.py   (volver a correrlo si cambia el glosario o la tabla)"""
import json, os, re, html
from html.parser import HTMLParser
AQUI = os.path.dirname(os.path.abspath(__file__)); RAIZ = os.path.join(AQUI, '..')
import sys; sys.path.insert(0, AQUI)
import glosario_datos as g
import paletas_datos as pa

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
 'paletas':{'categorias':[{'id':i,'n':n} for i,n in pa.CATEGORIAS], 'lista':[{'id':x['id'],'cat':x['cat'],'nombre':x['nombre'],'colores':[list(c) for c in x['colores']],'uso':x.get('uso',''),'tip':x.get('tip','')} for x in pa.PALETAS]},
 'abrev':{'idiomas':[{'id':i,'n':n} for i,n in t.cab], 'filas':t.filas},
}

# ---- Checklist, stickers y temas del celular (2-nov-2026) ----
pag = open(os.path.join(RAIZ,'recursos-rosina.html'),encoding='utf-8').read()
def limpia(x): return re.sub(r'\s+',' ',x).strip()
sec = pag[pag.index('id="checklist"'):pag.index('id="abreviaturas"')]
grupos=[]
for m in re.finditer(r'<h4>(.*?)</h4>\s*<ul class="checklist">(.*?)</ul>', sec, re.S):
    items=[{'id':i,'html':limpia(h)} for i,h in re.findall(r'<li><label><input type="checkbox" id="([^"]+)" data-check><span>(.*?)</span></label></li>', m.group(2), re.S)]
    grupos.append({'titulo':limpia(m.group(1)),'items':items})
tip = re.search(r'<div class="aviso-rosina">.*?<p>(.*?)</p>', sec, re.S)
datos['checklist']={'grupos':grupos,'tip':limpia(re.sub(r'<[^>]+>','',tip.group(1))) if tip else ''}
sti = pag[pag.index('id="stickers"'):pag.index('id="fondos"')]
st=[]
for m in re.finditer(r'<h3 class="subtitulo-stickers">(.*?)</h3>\s*<div class="hoja-stickers">(.*?)</div>', sti, re.S):
    its=[{'href':h,'archivo':d,'img':i,'alt':html.unescape(a)} for h,d,i,a in re.findall(r'<a class="sticker-mini" href="([^"]+)" download="([^"]+)"[^>]*><img src="([^"]+)" alt="([^"]*)"', m.group(2))]
    st.append({'titulo':limpia(m.group(1)),'items':its})
datos['stickers']=st
fon = pag[pag.index('id="fondos"'):pag.index('¿Te gustó el material de Rosina?')]
temas=[]
for m in re.finditer(r'<article class="tema" data-fondo="([^"]+)" data-estacion="([^"]+)">(.*?)</article>', fon, re.S):
    b=m.group(3); imgs=re.findall(r'<img src="([^"]+)"', b)
    zipf=re.search(r'href="(/img/iconos-app/[^"]+\.zip)"', b)
    temas.append({'id':m.group(1),'estacion':m.group(2),'nombre':limpia(re.search(r'<h3>(.*?)</h3>',b,re.S).group(1)),'fondo':imgs[0],'inicio':imgs[1],'zip':zipf.group(1) if zipf else ''})
datos['temas']=temas
assert len(t.filas)>=15 and len(t.cab)>=9, (len(t.filas), len(t.cab))
salida=os.path.join(RAIZ,'js','agenda','recursos-datos.js')
open(salida,'w',encoding='utf-8').write('/* Generado por herramientas/generar_recursos_agenda.py: no editar a mano. */\nwindow.lrRecursosDatos = '+json.dumps(datos,ensure_ascii=False)+';\n')
print(len(grupos),'grupos de checklist,',sum(len(x['items']) for x in st),'stickers,',len(temas),'temas'); print('listo:', len(datos['paletas']['lista']),'paletas,', len(datos['glosario']),'términos,',len(t.filas),'abreviaturas,',len(t.cab),'idiomas')

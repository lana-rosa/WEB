#!/usr/bin/env python3
"""Genera cargar_mkt_historias.sql desde PLAN-HISTORIAS-LRC-19NOV-14DIC.md.
Inserta las historias de Crochet en public.mkt_piezas y actualiza las 2 que ya existían (22 y 29-nov).
No toca la base: solo escribe el .sql (se corre con el sí de Jennifer)."""
import os,re
d=os.path.dirname(os.path.abspath(__file__))
t=open(os.path.join(d,'PLAN-HISTORIAS-LRC-19NOV-14DIC.md'),encoding='utf-8').read()
rows=[l for l in t.split('\n') if l.startswith('| Crochet')]
MESES={'nov':11,'dic':12}
OBJ={'alcance':'alcance','confianza':'confianza','conversión':'conversion','conversion':'conversion','formación':'formacion','lista de espera':'lista_espera','comunidad':'comunidad'}
def fecha(s):
    m=re.search(r'(\d+)-(nov|dic)',s); return '2026-%02d-%02d'%(MESES[m.group(2)],int(m.group(1)))
def objs(s): return [OBJ[x.strip()] for x in s.split('/') if x.strip()]
def arr(a): return "array["+",".join("'%s'"%x for x in a)+"]::text[]"
def q(s): return '$g$'+s.replace('**','')+'$g$'
upd=[];ins=[]
for l in rows:
    c=[x.strip() for x in l.strip('|').split('|')]
    f=fecha(c[3]); o=objs(c[5]); b=re.search(r'(\d+-(nov|dic))',c[9]); b=fecha(b.group(1)) if b else None
    notas=c[10]+(' Plan: PLAN-HISTORIAS-LRC-19NOV-14DIC.md. Regla de Jennifer (19-nov): base diaria simple (foto de producto + pregunta) y algunos días elaborados.')
    if f in('2026-11-22','2026-11-29'):
        upd.append("update public.mkt_piezas set angulo=%s, objetivos=%s, guion=%s, copy=%s, estado='idea', bloque_grabacion=%s, notas=%s where marca='crochet' and tipo_publicacion='stories' and fecha='%s';"%(q(c[4]),arr(o),q(c[6]),q(c[7]),("'%s'"%b if b else 'null'),q(notas),f))
    else:
        ins.append("('crochet',array['instagram']::text[],'%s'::date,'stories',%s,%s,%s,%s,'idea',%s::date,%s)"%(f,q(c[4]),arr(o),q(c[6]),q(c[7]),("'%s'"%b if b else 'null'),q(notas)))
out=["-- Carga de las historias de Crochet (19-nov a 14-dic-2026) en public.mkt_piezas. Generado por generar_mkt_historias.py.",
"-- Actualiza las 2 filas de stories que ya existían (22 y 29-nov) e inserta el resto. No borra nada."]
out+=upd
out.append("insert into public.mkt_piezas (marca, plataformas, fecha, tipo_publicacion, angulo, objetivos, guion, copy, estado, bloque_grabacion, notas) values\n"+",\n".join(ins)+";")
open(os.path.join(d,'cargar_mkt_historias.sql'),'w',encoding='utf-8').write("\n".join(out)+"\n")
print(len(upd),'updates,',len(ins),'inserts')

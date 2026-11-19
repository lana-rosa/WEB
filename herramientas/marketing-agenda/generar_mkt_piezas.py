#!/usr/bin/env python3
"""Genera cargar_mkt_piezas.sql con las piezas del calendario (19-nov a 14-dic-2026).
Uso: python3 herramientas/marketing-agenda/generar_mkt_piezas.py
No toca la base: solo escribe el .sql (se corre con el sí de Jennifer)."""
import os
IG_FB_TT = ['instagram','facebook','tiktok']
IG_FB_PI = ['instagram','facebook','pinterest']
IG = ['instagram']
# (marca, fecha, plataformas, tipo, angulo, objetivos, estado, bloque, guion, copy, notas)
P = []
def add(*a): P.append(a)
G1='GUIONES-SEMANA-1-V2-AYUDANTES.md'; G1b='GUIONES-SEMANA-1-DOS-MARCAS.md'; G2='GUIONES-SEMANA-2-DOS-MARCAS.md'
# ---------- Semana 1 ----------
add('crochet','2026-11-19',IG_FB_TT,'reel','Tu idea, hecha amigurumi (Reel solo texto)',['alcance'],'aprobado','2026-11-21',
 'Pantallas de texto sobre tomas del taller: «Esa mascota.» «Ese personaje.» «Esa persona.» «Puede ser un amigurumi.» «No tienes que saber tejer para tenerlo.» «Tú cuentas la idea. Nosotras la tejemos.» «¿A quién le harías el tuyo?»',
 'Tu idea no necesita ser perfecta para empezar. Puede ser una foto o un dibujo: con eso trabajamos. Los personalizados tienen 8 días hábiles de elaboración y, antes de despacharlo, te enviamos una foto del amigurumi terminado para que lo apruebes. Escríbenos por WhatsApp al 573205072801 y cuéntanos qué quieres tejer.',
 'Guion: '+G1b+' y '+G1+'. Si no alcanza a grabarse hoy, moverlo.')
add('crochet','2026-11-20',IG_FB_PI,'carrusel','Tu foto de referencia importa más de lo que crees',['confianza'],'aprobado',None,
 'L1 Tu foto de referencia importa más de lo que crees. Y no tiene que ser perfecta. | L2 Luz natural, cerca de una ventana. | L3 Más de un ángulo: de frente y de lado. | L4 Los detalles que lo hacen único [foto real]. | L5 Dinos qué NO puede faltar. | L6 Se teje a mano: es tu referencia en lana, no una fotocopia. | L7 Tu foto es el inicio de la conversación; antes de despachar te enviamos foto del terminado para que lo apruebes. | L8 ¿Qué detalle no podría faltar en su versión tejida?',
 'Si tienes en el celular una foto de alguien o algo que quieres ver en amigurumi, ya tienes lo principal. Cuéntanos: ¿qué detalle no podría faltar en su versión tejida? Los personalizados se piden por WhatsApp con una foto de referencia, se elaboran en 8 días hábiles y antes de despachar te enviamos foto del terminado para que lo apruebes.',
 'Guion: '+G1+'. Falta: fotos reales para L4, L6 y L7; confirmar consejos de luz y ángulos con el taller.')
add('crochet','2026-11-21',IG_FB_PI,'carrusel','Un personalizado, de la foto a la pieza',['confianza','conversion'],'idea','2026-11-21',
 '8 láminas: portada con la pieza terminada; foto de referencia; tres momentos del tejido; detalles que lo hacen único [reales]; pieza en contexto; cierre «¿Qué te gustaría convertir en amigurumi?»',
 '[Quién lo pidió y para quién, con permiso]. Esto fue lo más especial del proceso: [dato real]. ¿Qué te gustaría que tejamos para ti?',
 'Necesita un pedido real con permiso; si no hay, se mueve. Guion: '+G1b)
add('crochet','2026-11-22',IG,'stories','Cuenta regresiva a la apertura + encuesta de personalizados',['comunidad','alcance'],'aprobado',None,
 'Anuncio de la tienda física; sticker de cuenta regresiva al 13-dic (sin hora hasta confirmarla); qué habrá [por confirmar]; encuesta «Mascota o Personaje», luego «¿O un regalo?» (la encuesta admite 2 opciones); pregunta abierta «¿Qué te gustaría encontrar en la tienda?»',
 '', 'Guion: '+G1)
add('crochet','2026-11-23',IG_FB_TT,'reel','Nace un amigurumi: del ovillo a la pieza',['alcance'],'aprobado','2026-11-21',
 'Gancho en pantalla «Del ovillo a un amigo, en 25 segundos.» Tomas: ovillo, primeras puntadas, cuerpo, ojos, pieza terminada. Cierre «Hecho a mano, puntada a puntada.»',
 'Empieza con un nudo y termina siendo alguien. Un amigurumi se va armando parte por parte. Si tienes un personaje que te gustaría ver nacer así, cuéntame en los comentarios cómo sería.',
 'Guion: '+G1b+' (R4).')
add('crochet','2026-11-24',IG_FB_TT,'reel','Lana Rosa vs IA: llavero de dinosaurio',['alcance'],'aprobado','2026-11-21',
 '0-3 «Uno de estos dinosaurios no se puede tocar.» | 3-6 «Mira de cerca.» | 6-10 macro de puntadas | 10-14 dedo que aprieta «Blandito: se hunde al apretarlo.» | 14-19 una puntada algo distinta (solo si se ve) | 19-23 llavero en llaves y bolso | 23-27 «Una imagen se mira. Un llavero se lleva.» | CTA «¿Con cuál te quedas? Escribe 1 o 2.» Etiqueta «imagen hecha con IA» visible.',
 'Dos llaveros de dinosaurio. Uno lo imaginó una IA. El otro lo tejimos a mano: se nota en lo que no cabe en una imagen, como la textura y las puntadas. No es una pelea: es mirar dos cosas y decidir. ¿Con cuál te quedas?',
 'Guion: '+G1+'. Confirmar que la imagen de IA se vea distinta.')
add('crochet','2026-11-25',IG_FB_PI,'carrusel','Amigurumis pequeños: muchos estilos',['confianza'],'aprobado','2026-11-21',
 'L1 Pequeños, muchos estilos. L2-L7 una pieza por lámina con su detalle real [nombre y rasgo]. L8 ¿Cuál es tu estilo?',
 'Pequeños de tamaño, enormes de personalidad. Guarda este carrusel para cuando necesites una idea de regalo y compártelo con esa persona a la que le tejerías uno.',
 'Guion: '+G1b+'. Ajustar a las fotos; sin precios.')
add('academy','2026-11-20',IG,'carrusel','Parte 2 del proyecto de Jennifer',['formacion'],'idea',None,
 'Publica Jennifer. [Proyecto, dónde está la parte 1 y formato por confirmar.]','',
 'Falta el nombre del proyecto. Stories de apoyo: aviso de la parte 2, «¿Ya hiciste la parte 1?», «Muéstrame tu avance».')
add('academy','2026-11-25',IG,'reel','Lo primero que se aprende al tejer',['formacion'],'aprobado','2026-11-21',
 'Gancho «Antes de cualquier muñeco, esto.» Tomas: nudo corredizo, cadeneta, cinco puntadas en fila. Texto: «Nudo, cadeneta, punto bajo.» Cierre: «Todo lo demás se construye sobre esto.»',
 'Tres cosas, y ya estás tejiendo: nudo corredizo, cadeneta y punto bajo. Equivocarse al principio es parte del camino. ¿Cuál de las tres te parece la más difícil?',
 'Guion: '+G1b+'. Sin vender insumos.')
# ---------- Semana 2 ----------
add('crochet','2026-11-26',IG_FB_TT,'reel','La Mercería llega pronto (Reel solo texto)',['alcance','lista_espera'],'aprobado','2026-11-21',
 '«Algo se está ordenando en el taller.» «Y no es un amigurumi.» «Lanas e hilos. Por ovillo.» «Para que tejas lo que imaginas.» «La Mercería de Lana Rosa llega pronto.» «Entra a la web y toca «Avísame cuando abra».»',
 'La Mercería de Lana Rosa llega pronto: lanas e hilos por ovillo. Si quieres que te avisemos, entra a lanarosacrochet.com y toca «Avísame cuando abra». ¿De qué color sería tu primer ovillo?',
 'Plan B: sin fecha de la Mercería. Confirmar que el botón «Avísame cuando abra» esté activo. Guion: '+G2)
add('crochet','2026-11-27',IG_FB_PI,'carrusel','La Mercería llega pronto: tres consejos para elegir tu primera lana',['confianza','lista_espera'],'aprobado','2026-11-28',
 'L1 La Mercería llega pronto: llevar solo lo que necesitas. L2 Lanas e hilos por ovillo. L3 Tres consejos. L4 Lana de grosor medio. L5 Color claro y liso. L6 Lee la etiqueta. L7 Elegir bien no es gastar más. L8 Toca «Avísame cuando abra». ¿Qué lana buscarías primero?',
 'La Mercería de Lana Rosa llega pronto: lanas e hilos por ovillo, para que lleves solo lo que necesitas. Guarda estos tres consejos para elegir tu primera lana: grosor medio, color claro y liso, y leer siempre la etiqueta. ¿Qué lana buscarías primero?',
 'Guion: '+G2+'. Sin fecha ni precios.')
add('academy','2026-11-27',IG,'carrusel','Tu primera cadeneta, paso a paso',['formacion'],'aprobado','2026-11-28',
 'L1 Tu primera cadeneta. L2 Qué necesitas: aguja y ovillo. L3 Haz un nudo corredizo. L4 Pasa la aguja por el nudo y ajusta sin apretar. L5 Toma la hebra con la aguja y pásala por el lazo. L6 Eso ya es una cadeneta: repite. L7 No aprietes: la aguja debe moverse con libertad. L8 Practica en el Rincón de Rosina.',
 'Todas las personas que tejen empezaron con una cadeneta. Es la base de casi todo lo que viene después. Guárdalo para tenerlo con la aguja en la mano y cuéntanos cómo te fue.',
 'Guion: '+G1b+'. Sin vender insumos.')
add('crochet','2026-11-28',IG_FB_PI,'carrusel','Muñeca grande con ropa intercambiable',['confianza'],'aprobado','2026-11-28',
 'L1 Una muñeca con tantos detalles que necesitas mirarla dos veces. L2 Su cara de cerca. L3 Su cabello [si aplica]. L4 Ropa que se quita y se pone. L5 Detalle de una prenda [real]. L6 Un mismo cuerpo, varios looks. L7 Un detalle tejido a mano se nota porque alguien se tomó el tiempo. L8 ¿Con qué prenda la vestirías primero?',
 'Una muñeca grande, tejida a mano, con muchos detalles y ropa que se cambia. Desliza para verla de cerca. Si quieres una a tu estilo, escríbenos por WhatsApp al 573205072801 con tu idea o una foto de referencia. ¿Con qué prenda la vestirías primero?',
 'Guion: '+G2+'. Sin precios ni medidas; confirmar si está en inventario o es por encargo.')
add('crochet','2026-11-29',IG,'stories','Faltan 2 semanas para la apertura',['comunidad','lista_espera'],'aprobado',None,
 'Cuenta regresiva al 13-dic; anuncio «El domingo 13 de diciembre abre nuestra tienda física»; qué habrá [solo lo confirmado]; lista de espera de la Mercería; gracias. No decir hora ni dirección hasta confirmarlas.','','Guion: '+G2)
add('crochet','2026-11-30',IG_FB_TT,'reel','Una tejedora, una historia',['alcance','comunidad'],'idea','2026-11-28',
 'Gancho «Ella empezó con [dato real].» → «Hoy teje [dato real].» → frase suya textual aprobada → lo que más le gusta de tejer → «Una tejedora. Una historia.» → «Cada pieza lleva la mano de alguien.»',
 'Una tejedora, una historia. [Nombre, con su permiso] nos contó [dato real]. ¿Quién te enseñó a ti a tejer?',
 'Solo con permiso escrito de la persona; alternativas en '+G2)
add('crochet','2026-12-01',IG_FB_TT,'reel','Lana Rosa vs IA: nuevo objeto (por aprobar)',['alcance'],'idea','2026-11-28',
 'Misma serie del 24-nov con otro objeto. Propuesta: llavero animal pequeño tejido; alternativas: flor tejida o accesorio pequeño. Solo se dice lo que se ve; etiqueta «imagen hecha con IA» visible.',
 'Dos [objeto]. Una imagen hecha con IA y un tejido hecho a mano. No es una pelea: es mirar dos cosas y decidir. ¿Con cuál te quedas?',
 'Concepto por aprobar. Guion: '+G2)
add('crochet','2026-12-02',IG_FB_PI,'carrusel','Piezas listas para llevar',['conversion'],'aprobado','2026-11-28',
 'L1 Amigurumis ya listos; salen el siguiente día hábil. L2 Tejidos a mano, ya terminados. L3 Disponibles en inventario. L4 Compras hoy, se despachan el siguiente día hábil. L5 Después, el tiempo de la transportadora. L6 Ideales cuando el regalo no puede esperar los 8 días hábiles de un personalizado. L7 Si lo necesitas único, se teje para ti. L8 ¿Cuál se iría contigo?',
 'Piezas tejidas a mano que ya están listas. Las que están en inventario se despachan el siguiente día hábil después de tu compra; después, depende de la transportadora. Si prefieres algo hecho a tu medida, los personalizados se elaboran en 8 días hábiles. ¿Para quién sería tu favorita?',
 'Verificar el inventario real el día de publicar. Guion: '+G2)
add('academy','2026-12-02',IG,'reel','Cómo leer una receta de tejido',['formacion'],'aprobado','2026-11-28',
 'Gancho «Esto parece otro idioma. Pero no lo es.» → «Son tres cosas.» → 1) las abreviaturas son atajos [confirmar cad, pb con el glosario] → 2) lo que va entre paréntesis se repite → 3) cuenta tus puntos al final de cada vuelta.',
 'Leer una receta de tejido es aprender tres cosas: abreviaturas, repeticiones entre paréntesis y contar puntos. ¿Qué abreviatura te confunde más? Escríbela y la explicamos.',
 'Confirmar abreviaturas con Academy. Guion: '+G2)
# ---------- Semanas 3 a 5 (solo calendario; guion por escribir) ----------
def idea(m,f,pl,t,a,o,n='Guion por escribir (semana aún sin aprobar).'):
    add(m,f,pl,t,a,o,'idea',None,'','',n)
idea('academy','2026-12-03',['youtube'],'video_youtube','Cómo empezar a tejer crochet desde cero: lo esencial',['formacion'],'Esquema en GUION-YOUTUBE-1-EMPEZAR-A-TEJER.md. Sin vender insumos.')
idea('crochet','2026-12-03',IG_FB_TT,'reel','«¿Cuánto te costó realmente ese amigurumi?» (agenda de Lana Rosa, solo texto)',['alcance'])
idea('crochet','2026-12-04',IG_FB_PI,'carrusel','Faltan 9 días: así será la inauguración',['confianza'],'Necesita dirección, hora y programa. Ver GUIONES-APERTURA-SEMANAS-3-Y-4.md.')
idea('academy','2026-12-04',IG,'carrusel','Errores comunes al empezar y cómo evitarlos',['formacion'])
idea('crochet','2026-12-05',IG_FB_PI,'carrusel','Los amigurumis de la tienda, uno por uno',['conversion'])
idea('crochet','2026-12-07',IG_FB_TT,'reel','Recorrido por la tienda lista',['alcance'],'Grabar cuando el local esté listo. Ver GUIONES-APERTURA-SEMANAS-3-Y-4.md.')
idea('crochet','2026-12-08',IG_FB_TT,'reel','Lana Rosa vs IA (concepto por definir)',['alcance'])
idea('crochet','2026-12-09',IG_FB_PI,'carrusel','Personalizados: ejemplos reales aprobados',['conversion'])
idea('academy','2026-12-09',IG,'reel','Así será una clase en la Academy [confirmar formato]',['formacion','lista_espera'])
idea('crochet','2026-12-10',IG_FB_TT,'reel','Faltan 3 días (solo texto)',['alcance'])
idea('crochet','2026-12-11',IG_FB_PI,'carrusel','Preguntas frecuentes de la apertura',['confianza'],'Ver GUIONES-APERTURA-SEMANAS-3-Y-4.md (C8).')
idea('academy','2026-12-11',IG,'carrusel','Talleres y lista de espera [confirmar cupos y fechas]',['lista_espera'])
idea('crochet','2026-12-12',IG_FB_PI,'carrusel','Mañana abrimos: dirección y hora',['conversion'],'Necesita dirección y hora confirmadas.')
idea('crochet','2026-12-13',IG_FB_TT,'reel','Hoy abrimos (Reel + stories en vivo)',['alcance','comunidad'])
idea('crochet','2026-12-14',IG_FB_TT,'reel','Ya estamos abiertos',['alcance'])

def q(s): return '$g$'+s+'$g$'
def arr(a): return "array["+",".join("'%s'"%x for x in a)+"]::text[]" if a else "'{}'::text[]"
out=['-- Carga de las piezas del calendario de contenido (19-nov a 14-dic-2026) en public.mkt_piezas.',
'-- Generado por generar_mkt_piezas.py. SOLO inserta filas; no borra ni cambia nada. Correr una sola vez.',
'insert into public.mkt_piezas (marca, plataformas, fecha, tipo_publicacion, angulo, objetivos, guion, copy, estado, bloque_grabacion, notas) values']
rows=[]
for m,f,pl,t,a,o,e,b,g,c,n in P:
    rows.append("('%s',%s,'%s','%s',%s,%s,%s,%s,'%s',%s,%s)"%(m,arr(pl),f,t,q(a),arr(o),q(g),q(c),e,("'%s'"%b if b else 'null'),q(n)))
out.append(",\n".join(rows)+";")
d=os.path.dirname(os.path.abspath(__file__))
open(os.path.join(d,'cargar_mkt_piezas.sql'),'w').write("\n".join(out)+"\n")
print(len(P),'piezas')

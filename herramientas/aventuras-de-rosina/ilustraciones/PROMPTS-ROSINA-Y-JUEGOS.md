# Prompts para mejorar las imágenes del cuento (ChatGPT / Gemini)

Dos pedidos: **(A)** Rosina en alta resolución, sin borrosidad; **(B)** imágenes de los juegos que se vean reales.
Antes de publicar cualquiera: verificar los términos de uso comercial de la herramienta y que la experta revise lo de crochet.

## Por qué se ven borrosas
Las poses de Rosina están en 512 × 512 px y en el celular se muestran a unos 380 px con pantalla de alta densidad (equivalente a 760 px). Hay que pedirlas **de 1024 × 1024 px o más**, una por imagen (o, como máximo, 4 por hoja en cuadrícula 2 × 2). Una hoja con 10 poses sale con cada pose muy chica y vuelve a verse borrosa.

---
## A. Rosina en alta resolución

### Reglas que repetir en todos los pedidos
> Adjunta como referencia la imagen oficial de Rosina. Mantén EXACTAMENTE su cara, el pelo ondulado café, el moño rosado, las orejas blancas con interior rosado y el vestido rosado con florecitas blancas. Estilo ilustración plana infantil, líneas suaves color café, colores pastel, sin sombras duras. **Fondo blanco liso (#FFFFFF), sin borde blanco de sticker, sin sombra en el piso, sin texto.** Cuerpo completo con las orejas, las manos y los pies completos dentro de la imagen y con margen alrededor (nada cortado). Imagen cuadrada de 1024 × 1024 px o más, nítida.

### Poses (una por imagen), en orden de prioridad
Son las que más se ven en el cuento. Cada una: «Rosina, [pose]».
1. **Saludo** — de pie, saluda con la patita derecha levantada, sonríe con los ojos abiertos. *(portada, bienvenida)*
2. **Feliz** — de pie, ojos cerrados de felicidad, las dos manitas arriba. *(fin de misión, juego correcto)*
3. **Corazón** — sentada abrazando un corazón rosado. 
4. **Abrazo con ovillo** — sentada abrazando un ovillo de lana en forma de corazón.
5. **Ovillo** — de pie sosteniendo un ovillo en forma de corazón con las dos manos.
6. **Idea** — de pie, con una bombilla amarilla dibujada sobre la cabeza.
7. **Leyendo** — sentada leyendo un libro rosado con un corazón en la portada.
8. **Pulgar arriba** — de pie, guiña un ojo y levanta el pulgar.
9. **Cartel** — asoma detrás de un cartel rosado en blanco (con espacio para escribir un nombre).
10. **Gorro** — sentada con un gorro de lana rosado con pompón, manos en las mejillas.
11. **Flor** — de pie sosteniendo una flor rosada.
12. **Señalando** — de pie, señala con la patita hacia un lado.

Las 10 poses que ya hizo Sara (tejiendo, gancho, contando, señalando, fuerza, sorpresa, consuelo, mapa, diploma, lupa) están bien y limpias; si se quieren más nítidas, repetirlas con las mismas reglas.

### Cómo las incorporo
Guardar cada imagen en `herramientas/aventuras-de-rosina/ilustraciones/rosina-hd/` con el nombre de la pose (`saludo.png`, `feliz.png`…). Un script las recorta sin borde, las lleva a 1024 px con fondo transparente y reemplaza las actuales en `img/aventuras/rosina-plana/` (el cuento ya sabe su nombre).

---
## B. Imágenes de los juegos «que se vean reales»

Ahora son dibujos esquemáticos hechos en código. Para que un niño reconozca el material real, se piden **fotografías o renders fotorrealistas**, todas con el mismo estilo.

### Estilo común (repetir en cada pedido)
> Fotografía macro realista de producto, luz suave de ventana, fondo liso blanco hueso (#FDFCFA) o madera clara muy desenfocada, sin manos, sin personas, sin texto, sin marcas. Enfoque nítido en el tejido, colores suaves. Formato horizontal 4:3, 1600 × 1200 px.

### Imágenes necesarias
**Laboratorio de colores: «¿Cuál lana es más fácil para empezar?»** (3 imágenes; el niño debe elegir la gruesa y clara)
1. **Lana gruesa, lisa y clara** — un ovillo de lana gruesa (tipo «chunky») rosada claro, hebra suelta al lado. Se ve cada vuelta del hilo.
2. **Lana fina y oscura** — un ovillo pequeño de hilo muy delgado de color morado oscuro casi negro, hebra suelta delgada.
3. **Lana peluda** — un ovillo de lana tipo pelo/«mohair» muy esponjosa, rosada, que casi esconde las vueltas del hilo.

**Detective de puntadas**
4. **Fila de cadenetas** — una sola fila de cadenetas de crochet (como una trenza de V) en lana gruesa rosada sobre fondo claro; que se cuenten ~6 puntadas nítidas. Sin gancho.
5. **Tejido de puntos bajos** — un cuadrado de tejido compacto de punto bajo con varias filas, mismo color; se ve la textura de «V» apiladas.
6. **Nudo enredado** — un trozo de hilo hecho un nudo enredado, mismo color.
7. **Fila de 7 puntos bajos** — una fila de exactamente **7 puntos bajos** sobre su fila de cadenetas de base (la base debajo, 8 cadenetas), en horizontal, nítida y contable. *(el niño cuenta: respuesta 7)*

**Tutorial**
8. **Ovillo con la cola** — un ovillo rosado con un trozo de hilo suelto («la cola»).
9. **Gancho de crochet real** — un gancho de aluminio de 5–6 mm con el mango (punta en forma de gancho, bien visible la curva).
10. **Tijeras pequeñas de bordar**, abiertas, sobre fondo claro.
11. **Aguja lanera** con hebra de lana enhebrada.
12. **Nudo corredizo inicial** en el gancho: el bucle ya puesto, con la cola. Foto cenital.

Los pasos de cómo hacer el nudo y el punto bajo se mejoran con la hoja de pasos o el video de `PROMPTS-NUDOS-Y-VIDEO.md`; aquí solo van los objetos.

### Cómo las incorporo
Guardar en `herramientas/aventuras-de-rosina/ilustraciones/juegos-reales/` con el número y el nombre (`01-lana-gruesa.jpg`…). Las paso a WebP liviano (≈ 800 px de ancho, lazy), las pongo en `img/aventuras/juegos/` y cambio las opciones de los juegos para que usen la foto (con el dibujo actual como respaldo si una falla). Cada foto lleva texto alternativo para lectores de pantalla.

### Ojo con la fidelidad
La IA suele inventar crochet imposible (cadenetas con vueltas de más, puntos bajos mal formados). Las imágenes 4, 5, 7 y 12 **deben ser correctas** porque el juego pregunta por ellas: cuéntelas, y que la experta las valide. Si salen mal, es mejor tejerlas y fotografiarlas con el celular.

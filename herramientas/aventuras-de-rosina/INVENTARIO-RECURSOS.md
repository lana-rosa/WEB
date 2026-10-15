# Inventario de recursos — Rosina y la gran aventura de la primera cadeneta

Estado: **Oficial** (de Lana Rosa, reutilizado) · **Provisional** (hecho en código, debe sustituirse o aprobarse) · **Pendiente** (no existe todavía).
Todas las rutas de "Oficial" se comprobaron el 12-oct-2026 con un script que busca cada `/img/…`, `/fonts/…` y `/css/…` usado por la aventura: **todas existen**.

## Imágenes oficiales reutilizadas (no se modificaron)
| Uso | Archivo | Peso |
|---|---|---|
| Rosina saludando (bienvenida, mapa, historia) | `/img/stickers/rosina-01-saludo.webp` | 30 KB |
| Rosina con corazón (reflexión) | `/img/stickers/rosina-02-corazon.webp` | 36 KB |
| Rosina con ovillo corazón (fin m3) | `/img/stickers/rosina-03-ovillo-corazon.webp` | 33 KB |
| Rosina con flor (reserva) | `/img/stickers/rosina-04-flor.webp` | 30 KB |
| Rosina sentada con ovillo (práctica) | `/img/stickers/rosina-05-ovillo-sentada.webp` | 36 KB |
| Rosina con idea (pistas) | `/img/stickers/rosina-06-idea.webp` | 33 KB |
| Rosina leyendo (preparación, historia) | `/img/stickers/rosina-07-leyendo.webp` | 34 KB |
| Rosina feliz (aciertos, fin m1) | `/img/stickers/rosina-08-feliz.webp` | 32 KB |
| Rosina con cartel (pasaporte) | `/img/stickers/rosina-09-cartel.webp` | 29 KB |
| Rosina pulgar arriba (fin juego, fin m2, diploma) | `/img/stickers/rosina-12-pulgar-arriba.webp` | 32 KB |
| Rosina abrazando ovillo (ayuda) | `/img/stickers/rosina-18-ovillo-abrazo.webp` | 39 KB |
| Rosina sentada saludando (historia m3) | `/img/stickers/rosina-20-sentada-saludo.webp` | 36 KB |
| Rosina con gorro (reserva) | `/img/stickers/rosina-17-gorro.webp` | 34 KB |
| Logo Lana Rosa Crochet (cabecera) | `/img/logo-lana-rosa-nuevo.webp` | 52 KB |
| Íconos de pestaña | `/img/favicon-256.png`, `/img/apple-touch-icon.png` | 9 KB, 7 KB |
| Fuentes DynaPuff y Hanken Grotesk | `/css/fuentes.css` + `/fonts/*.woff2` | ya autoalojadas |

## Estilo de las escenas: ilustración plana (decisión de Sara, 12-oct-2026; hojas de la 2.ª ronda)
Las escenas usan los **stickers oficiales de Rosina** y estas poses de los amigos, 5 por personaje, WebP transparente (de 8 a 13 KB cada una, ~250–310 px de ancho):
| Personaje | Poses (`img/aventuras/plano/<personaje>-<pose>.webp`) |
|---|---|
| Pipo | saludo, corazon, piensa, animo, ovillo |
| Tito | saludo, descansa, lee, piensa, celebra |
| Bruno | saludo, regalo, piensa, descansa, celebra |
| Luna | saludo, flor, piensa, descansa, celebra |
Salen de `herramientas/aventuras-de-rosina/preparar_estilo_plano.py` con dos hojas (Pipo+Tito y Bruno+Luna; `recortar_poses.py` quita el fondo blanco y separa cada pose). Si la historia pide una pose que el personaje no tiene, `personaje()` usa una parecida (feliz ≈ corazón o flor; ánimo ≈ celebra). **Los cuatro amigos se rediseñaron el 12-oct-2026 (3.ª ronda)** para tener rasgos propios y una prenda de lana cada uno: Bruno con gorro azul con pompón y sin corazón en la barriga; Luna lila, con orejas desiguales y bufanda lila, sin moño ni vestido rosado; Tito con lentes coral y caparazón tejido; Pipo con ponchito de rayas de colores (`preparar_estilo_plano.py <hoja-tito-pipo|-> <hoja-bruno-luna|->` reemplaza solo la hoja que se le dé). **Origen: creadas por Sara con ChatGPT** (informado el 12-oct-2026), a partir de la Rosina oficial como referencia. **Antes de publicar:** guardar (fuera del repositorio público) las hojas originales, los textos usados y una captura de las condiciones de uso de la herramienta con su fecha; verificar el uso comercial con los términos vigentes; y hacer la revisión de parecidos descrita en `PENDIENTES.md`. Las hojas originales no se guardan en el repositorio. Esta segunda ronda corrigió lo de la primera (poses pequeñas y orejas que se tocaban): los recortes salen limpios. El estilo amigurumi que se probó antes (retratos recortados de escenas, Rosina tejida y la escena de grupo) **se descartó y se borró** el 12-oct-2026; sigue en el historial de git. Pendiente opcional: una pose de «ánimo» (pulgar arriba) y más poses de Rosina plana para los juegos, si se quieren.

## Poses nuevas de Rosina (12-oct-2026; `img/aventuras/rosina/<pose>.webp`, 512×512, borde de sticker)
Sara las generó con ChatGPT usando los stickers oficiales como referencia (los colores medidos coinciden con los oficiales: pelo, vestido y cara) y `preparar_rosina_poses.py` les agrega el mismo borde de sticker. **No reemplazan ni modifican los stickers oficiales de `img/stickers/`**; son poses adicionales con el mismo origen y las mismas reservas legales que las de los amigos (ver el punto de revisión en `PENDIENTES.md`).
| Pose | Dónde se usa |
|---|---|
| `tejiendo` | Práctica (tejer la cadeneta y la muestra) |
| `gancho` | Pantalla «Prepara tu aventura» |
| `contando` | Inicio del juego de contar (misión 2) |
| `lupa` | Inicio del «Detective de puntadas» (misión 3) |
| `consuelo` | Primer error en un juego («¡Probemos otra vez!») |
| `fuerza` | Segundo error o más en un juego («¡tú puedes!») |
| `sorpresa` | Historia de la misión 2 (el puente desapareció) y página no encontrada |
| `mapa` | Historia de la misión 1 (mapa y mochila) y pantalla del mapa |
| `diploma` | Diploma |
| `senalando` | Reservada (todavía sin uso) |
Nota: en `contando` Rosina muestra dos dedos; si se prefiere otro número, volver a pedir esa pose.

## Provisionales (hechos en SVG dentro de `js/dibujos.js`)
| Recurso | Dónde se usa | Qué debe pasar |
|---|---|---|
| Escena del mapa y color recuperado (`mapaFondo()`) | Mapa | Sustituir por ilustración final con 3 zonas recoloreables, o conservar si se aprueba. |
| Diagramas de crochet: `lugar`, `ovillo`, `gancho`, `tijeras`, `nudo1`, `nudo2`, `manos`, `cadena1`, `cadenas`, `pbPartes`, `pb1`, `pb2`, `pb3`, `filaPB`, `tela`, `puente`, `muestraLana`, `nudoSolo` | Tutoriales y juegos | Reemplazar por fotos o video de las manos de una tejedora de Lana Rosa (sobre todo `manos`, `nudo1`, `nudo2`, `cadena1`, `pb1`–`pb3`). Cada paso muestra una etiqueta visible "Dibujo de ayuda (provisional)". |
| Mini bosque del Laboratorio de colores | Juego m1, pasaporte | Opcional: versión ilustrada. |

## Pendientes (no existen)
- **Video de demostración** de cada técnica (nudo inicial, cadeneta, punto bajo) **con subtítulos y transcripción**. El código ya los muestra cuando existan (`paso.video`), pero hoy no hay ningún video y no se simula.
- **Fotos reales** de la pieza terminada de cada misión (cadeneta de 11, primera fila de punto bajo) para que el niño compare.
- **Audio narrado** (opcional): hoy solo hay lectura con la voz local del dispositivo.
- **Imagen para compartir** (og:image) de la aventura, cuando se decida publicarla.
- **Tipografía de marca** (Celine / Montserrat Light) si se quiere usar en el título: no está en el repositorio.
- **Ilustraciones de los capítulos 4 a 8** (casa de los colores, jardín, regalo, desafío, fiesta).

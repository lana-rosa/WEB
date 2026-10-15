# 10 · Etapa 5: piloto de 3D y realidad aumentada (16-oct-2026)

**Estado:** la parte técnica está **construida, probada y publicada el 16-oct-2026** (Sara: «publícalo así»), incluida la página de prueba oculta `/3d-prueba.html`. **No hay todavía un modelo 3D de una pieza real**: sin fotos de calidad o sin un artista no se puede hacer uno fiel (hoy cada producto tiene una sola foto). Por eso esta etapa deja listo el visor con un **modelo de prueba** y todo lo necesario para que, cuando llegue el modelo de verdad, publicarlo sea agregar una línea y subir un archivo.

## Qué se construyó
- **Visor** (`js/universo/visor3d.js`, `css/visor3d.css`): muestra la foto de la pieza con un botón «🧊 Ver en 3D». Solo al tocarlo se descarga el visor (`model-viewer` 4.3.1 de Google, Apache-2.0, alojado en `js/vendor/`) y el modelo. Se puede girar con el dedo o el mouse, hacer zoom y, en teléfonos compatibles, tocar «👁️ Ver en tu espacio» para verla a su tamaño real sobre una mesa.
- **Datos** (`modelos3d/modelos.json`): cada modelo declara su archivo, su pieza (`item_id`), sus tres medidas reales en centímetros y quién lo aprobó. **Un modelo solo sale en la web si tiene `publicado: true`, `revisado_por`, `revisado_en` y su origen no es «prueba»** (igual que las etiquetas y las historias).
- **Dónde se ve:** en la página de la pieza (`/p/?i=…`, la del código QR) aparece «Míralo en 3D» únicamente si esa pieza tiene un modelo aprobado. **Hoy ninguna lo tiene, así que ninguna página pública cambia.** Para la ficha de la Tienda se deja para cuando el piloto funcione (la ficha es una pieza grande y delicada del sitio).
- **Interruptor:** `VISOR_3D_ACTIVO` en `js/universo/config.js`. Apagado, desaparece el visor aunque haya modelos.
- **Página de prueba** (`/3d-prueba.html`, `noindex`, sin menú, sin cookies ni medición, fuera del mapa del sitio): foto real del Llavero Corazón junto al modelo de prueba, con la lista de qué comprobar en el celular. **Sara puede abrirla en sus teléfonos**: https://lanarosacrochet.com/3d-prueba.html (enlace directo; no está en ningún menú).
- **Modelo de prueba** (`modelos3d/prueba/corazon-prueba.glb`, generado por `herramientas/modelos3d/generar_modelo_prueba.py`): un corazón «tejido» hecho con reglas (forma inflada, puntos en V, 5 cm de ancho). **No es un escaneo ni un trabajo de artista y no es la pieza real**; sirve para probar el visor, la escala y la realidad aumentada. 14 mil vértices, 28 mil triángulos, 680 KB.

## Lo que el visor hace para no engañar a nadie
- Si el modelo no carga, no hay WebGL o la librería falla: vuelve la foto con un mensaje amable.
- Si el tamaño del modelo no coincide (±8 %) con las medidas reales declaradas, **se quita la realidad aumentada** y no se afirma la medida (verla a otro tamaño engañaría).
- La nota dice siempre «Vista 3D aproximada: el color y los detalles pueden variar un poco respecto a la pieza tejida» y la medida real. Un modelo de prueba dice «MODELO DE PRUEBA… no es una pieza real» y nunca sale en las páginas públicas.
- Sin servicios externos: la librería y el modelo salen del propio sitio. La librería pediría un decodificador a `gstatic.com` si un modelo usa compresión Draco o KTX2; **los modelos se entregan sin esas compresiones** y la prueba verifica que no sale ningún pedido a terceros.
- No gira sola (respeta a quien no quiere movimiento); se puede enfocar con el teclado; el botón mide más de 48 px.

## Peso y rendimiento
| Archivo | Tamaño | Cuándo se descarga |
|---|---|---|
| `js/universo/visor3d.js` + `css/visor3d.css` | 7,9 KB + 1,8 KB (3,2 + 0,7 KB comprimidos) | Con la página de la pieza (`/p/`) |
| `js/vendor/model-viewer.min.js` | 1,07 MB (289 KB comprimidos) | **Solo al tocar «Ver en 3D»** |
| Modelo (`.glb`) | 680 KB el de prueba; objetivo ≤ 5 MB | **Solo al tocar «Ver en 3D»** |

La prueba comprueba que antes de tocar el botón no se descarga ni la librería ni el modelo.

## Pruebas (`python3 herramientas/pruebas/probar_visor3d.py`, 54 comprobaciones, con 3D por software en el navegador de pruebas)
Archivo del modelo (GLB válido, sin Draco/KTX2, menos de 100 mil triángulos, medidas declaradas) · reglas puras (solo sale el modelo aprobado; un modelo de prueba nunca sale; solo archivos `.glb` de `/modelos3d/` sin `..`; escala ±8 %) · celular y computador (carga diferida, teclado, ningún pedido externo, **escala real: el modelo cargado mide 5,0 × 1,8 × 4,5 cm y lo declarado es lo mismo**, sin errores) · fallos (modelo 404, librería caída, sin WebGL, medida que no coincide) · página `/p/` con y sin modelo aprobado y con el interruptor apagado.

**Lo que NO se pudo probar sin teléfonos reales** (matriz 3D3): la realidad aumentada en Android (Chrome o «Scene Viewer» de Google) y en iPhone (Quick Look de Apple), la velocidad en celulares de gama baja y cómo se ve con luz real. Según la documentación del componente el modo de iPhone genera el archivo que necesita al vuelo; hay que verlo. La lista para probar está en la página `/3d-prueba.html`.

## Cómo conseguir el modelo de UNA pieza real (decisión de Sara)
| Opción | Qué se necesita | Fidelidad | Riesgo / costo |
|---|---|---|---|
| **A. Fotogrametría con el celular** (apps como Polycam, RealityScan, Luma o Kiri Engine, o Meshroom en computador; **verificar términos, precio y si procesan las fotos en sus servidores**) | De 40 a 90 fotos de la pieza (ver guía) y 1 a 2 horas de proceso | Media a buena en piezas **mate y compactas**; mala en piezas muy peludas (chenille), con partes delgadas o muy oscuras | Tiempo del taller; algunas apps cobran o suben las fotos a su nube |
| **B. Artista 3D** | Fotos de la pieza por todos los lados, medidas y el pedido de la sección «Pedido al artista» | La más alta y la más controlable | Cotización **por pieza, sin valor verificado aquí**; hay que firmar cesión de derechos |
| **C. Modelo hecho con reglas** (como el de prueba) | Solo las medidas y la foto | Baja: se parece pero no es la pieza (relieve, forma exacta, color) | Barato; **riesgo comercial**: prometer fidelidad que no existe |
| **D. Giro de 360° con fotos** (sin 3D) | 24 a 36 fotos girando la pieza sobre un plato | **100 % fiel** (son fotos reales) | No tiene realidad aumentada ni zoom 3D; funciona en cualquier teléfono; se podría construir en la Etapa 5b |

**Recomendación:** (1) probar primero la opción **A** con **una** pieza; si el resultado no convence, **B** para esa misma pieza; (2) considerar **D** para varias piezas, porque es fiel y funciona en todos los teléfonos; (3) no usar **C** en páginas públicas.

### Pieza sugerida para el piloto (propuesta, la decide Sara)
| Pieza | Por qué sí | Por qué no |
|---|---|---|
| **Bolso ZARIA** ($317.000) — **recomendada** si tienen un bolso a mano para la sesión de fotos | Es la de mayor precio y el **tamaño es lo que más duda genera** al comprar un bolso; punto mate y forma sencilla; diseño propio | Hoy figura «por encargo» (hay que tener un ejemplar físico) |
| Maceta Margarita ($45.000) | En existencia; sirve la realidad aumentada para ver cómo queda en una repisa; diseño propio | Pétalos y tallo delgados: más difícil de capturar |
| Llavero Corazón ($18.000) | La forma más simple; sirve para aprender el proceso | A 5 cm la realidad aumentada aporta poco |
| Peluche Oso 21 cm ($65.000) | En existencia, muy pedido | Lana chenille peluda: la fotogrametría suele fallar |
Evitar para 3D público las piezas inspiradas en personajes con licencia.

## Guía para fotografiar la pieza (opción A)
1. **Luz:** junto a una ventana, luz del día suave, **sin sol directo y sin flash**. Sin sombras duras.
2. **Fondo y base:** una mesa o un plato giratorio con una **superficie con algo de dibujo** (un mantel con puntos, papel de periódico), no un fondo liso, para que el programa entienda cuánto giró. La pieza **no se mueve** mientras se fotografía (si la volteas, haz una segunda serie).
3. **Fotos:** teléfono a la altura de la pieza, 3 vueltas completas (de lado, desde un poco arriba y desde bastante arriba), una foto cada 10–15° (24 a 36 por vuelta), más unas fotos de la parte de arriba y de abajo. **Mínimo 40, ideal de 60 a 90.** Todas nítidas, con toda la pieza en el cuadro y el mismo zoom.
4. **Regla a la vista:** una foto con la regla al lado, y **anotar las tres medidas** con cinta métrica (ancho, fondo y alto, en cm). Se necesitan para `modelos.json`.
5. Entregar las fotos originales (sin filtros) a Claude, o el modelo exportado como **GLB**.

## Pedido al artista (opción B)
- **Entrega:** un archivo `.glb` (glTF 2.0 binario) de **hasta 5 MB** y **hasta 60 mil triángulos**; texturas de hasta 2048 px (2 como máximo); materiales PBR (color, normal y rugosidad); **sin compresión Draco ni KTX2**. Opcional: un `.usdz` para iPhone.
- **Escala y orientación:** en metros, con las medidas reales de la pieza; origen en el centro de la base; Y hacia arriba; el frente de la pieza hacia +Z. Malla cerrada, sin cámaras ni luces.
- **Parecido:** debe verse como el tejido (puntos, textura, color de las fotos). Se compara en 6 ángulos contra las fotos de la pieza antes de aceptarlo.
- **Aceptación:** el visor lo carga y la escala coincide (la prueba lo verifica); se ve bien en un Android y en un iPhone.
- **Derechos:** cesión por escrito del uso del modelo a Lana Rosa Crochet, sin material de terceros ni piezas con licencia.

## Para publicar el modelo de una pieza real (cuando exista)
1. Subir el archivo a `modelos3d/<nombre-de-la-pieza>/pieza.glb`.
2. Agregar su entrada en `modelos3d/modelos.json` con `item_id` (el de la pieza), `origen` (`escaneo` o `artista`), las tres medidas en cm, `publicado: true`, `revisado_por` y `revisado_en`.
3. Correr `python3 herramientas/pruebas/probar_visor3d.py` y probar la realidad aumentada en un Android y en un iPhone.
4. PR a `main`. Para quitarlo: `publicado: false` o apagar `VISOR_3D_ACTIVO`.

## Privacidad (borrador para la abogada; no está en `politicas.html`)
- El visor no usa la cámara ni guarda nada. En Android la realidad aumentada la abre el navegador (WebXR) o la app **Scene Viewer de Google**, y en iPhone **Quick Look de Apple**: son servicios del sistema del teléfono, que piden su propio permiso de cámara y reciben la dirección del modelo. Propuesta de frase: «Si usas la realidad aumentada, tu teléfono abre un visor del sistema (Google o Apple) que usa tu cámara para mostrar la pieza en tu espacio; Lana Rosa no recibe ni guarda esas imágenes.»
- La prueba técnica no usa cookies ni mide nada.

## Medición (GA4, solo categorías y cantidades)
`visor_3d` (`item_id`, `modo`: 3d / ar / foto, `ok`, `escala_ok`) y `visor_3d_error` (`item_id`, `razon`: sin_webgl / libreria / modelo / tiempo).

## Límites conocidos
- Mientras no haya un modelo real aprobado, la etapa no se ve en las páginas públicas.
- El texto de accesibilidad del visor lo completa la librería con una frase en inglés («Use mouse, touch or arrow keys to move»); no se puede cambiar sin modificar la librería.
- El relieve de los puntos del modelo de prueba es más grueso que el de la pieza real. Es justo lo que se espera de un modelo hecho con reglas (opción C): se ve «tejido», pero no es la pieza.

## Decisiones para Sara
1. ¿Qué pieza para el piloto? (Recomendada: Bolso ZARIA; alternativa: Maceta Margarita.)
2. ¿Opción A (fotos con el celular), B (artista, con cotización) o D (giro de 360° con fotos, más fiel y sin realidad aumentada)?
3. ¿Se publica la página de prueba `/3d-prueba.html` para que la abras en tus teléfonos? Es oculta, sin menú, sin cookies ni medición.
4. ¿Quién hace la sesión de fotos y cuándo?

# Rosina y la gran aventura de la primera cadeneta — guía del equipo

Aventura web interactiva para que niños de 6 a 8 años aprendan crochet con Rosina y sus amigos, acompañados por una persona adulta.
**Nombre (decidido por Sara el 12-oct-2026):** «Rosina y la gran aventura de la primera cadeneta». «Bosque Tejido» es el mundo donde ocurre (mapa, misiones, diploma) y puede dar nombre a una colección con más libros. En el texto de los niños se escribe «cadeneta» (igual que el glosario y Aprende), nunca «cadena».
**Estado: MVP (3 misiones) construido y probado en el repositorio; NO publicado en buscadores ni enlazado desde el sitio** (ver "Publicar de forma segura").

Ruta: `/aventuras-de-rosina/` (una sola página estática, navegación por `#/…`). Es una decisión de este repositorio, no una ruta confirmada: se puede cambiar moviendo la carpeta y actualizando las rutas absolutas del `index.html`.

## Cómo ejecutarlo y probarlo
```bash
cd <raíz del repositorio>
python3 -m http.server 8765 &                       # cualquier servidor estático sirve
# abrir http://localhost:8765/aventuras-de-rosina/
python3 herramientas/aventuras-de-rosina/probar.py --axe   # prueba de extremo a extremo con Chromium (Playwright) y axe-core
python3 herramientas/revisar_enlaces.py                    # 0 rotos y 0 rutas relativas (el aviso de canonical de merceria.html es conocido)
```
No hay compilación, ni npm, ni dependencias nuevas. Todo es HTML, CSS y JavaScript (módulos ES) que GitHub Pages sirve tal cual.

## Estructura
| Ruta | Para qué sirve |
|---|---|
| `aventuras-de-rosina/index.html` | Cabecera, pie, diálogos de ayuda y de confirmación. A propósito **sin** Tag Manager, aviso de cookies, cuentas ni scripts de terceros. |
| `aventuras-de-rosina/privacidad.html` | Política de privacidad de las familias (texto de Sara, 12-oct-2026). Página estática con el mismo estilo, `noindex`, sin scripts ni Tag Manager. Enlazada desde el pie y la guía para adultos. |
| `aventuras-de-rosina/aventura.css` | Todos los estilos (primero celular). |
| `aventuras-de-rosina/js/app.js` | Rutas, pantallas, ayuda, pasaporte, diploma, guía para adultos. |
| `aventuras-de-rosina/js/juegos.js` | Motor de juegos: `elegir`, `contar`, `ordenar`, `colores`. |
| `aventuras-de-rosina/js/dibujos.js` | Dibujos SVG provisionales (personajes secundarios, pasos de crochet, mapa). |
| `aventuras-de-rosina/js/estado.js` | Progreso local (`localStorage`, clave `lrAventuraRosina`). |
| `aventuras-de-rosina/js/voz.js` | Lectura en voz alta opcional con voces locales del dispositivo. |
| `aventuras-de-rosina/contenido/misiones.js` | **Todo el contenido de las misiones** (historia, pasos, práctica, juego, reflexión, logros). |
| `aventuras-de-rosina/contenido/personajes.js` | Poses oficiales de Rosina, personajes y paleta. |
| `herramientas/aventuras-de-rosina/` | Esta documentación y `probar.py`. |

## Imágenes de los personajes
Rosina usa los stickers oficiales de `img/stickers/` y, además, 10 poses nuevas con el mismo borde de sticker en `img/aventuras/rosina/` (tejiendo, gancho, contando, senalando, fuerza, sorpresa, consuelo, mapa, diploma, lupa; se crean con `herramientas/aventuras-de-rosina/preparar_rosina_poses.py <hoja>`), todas en `POSES_ROSINA` de `contenido/personajes.js` y sus amigos las poses de `img/aventuras/plano/` (`POSES_PLANO`, con el tamaño real de cada una). Para añadir poses nuevas: `python3 herramientas/aventuras-de-rosina/preparar_estilo_plano.py <hoja-pipo-tito> <hoja-bruno-luna>` (hojas de 10 poses, 2 filas de 5, fondo blanco liso, espacio entre poses), ajustar `PLAN` en ese script y poner los tamaños nuevos en `POSES_PLANO`. En los datos de la historia, `pose` de cada entrada elige la pose del personaje.

## Cambiar textos
Todo el texto que ve el niño está en `contenido/misiones.js` (y los de pantallas generales en `js/app.js`). Reglas: frases cortas, tuteo, nunca castigos; las respuestas incorrectas siempre empiezan con "¡Probemos otra vez!" y dan una pista. Después de editar corre `probar.py`.

## Cambiar dibujos por fotos o videos
- **Un dibujo de paso:** en `misiones.js` cada paso tiene `dibujo: { tipo, … }`. Para usar una foto, reemplaza en `app.js` la función `fig()` o añade al paso `foto: { src, alt }` y renderízala allí. Pon el archivo en `img/aventuras/` (WebP liviano) y usa ruta con `/` inicial.
- **Un video:** añade al paso `video: { src: '/img/aventuras/paso.mp4', poster: '/img/aventuras/paso.webp', subtitulos: '/img/aventuras/paso.vtt' }`. `vistaTutorial` ya lo muestra (`preload="none"`, con subtítulos) en lugar del dibujo. **Sin subtítulos y transcripción no se publica un video.** No se simula ningún video que no exista.
- **Personajes secundarios:** las poses están en `img/aventuras/plano/<personaje>-<pose>.webp` y se declaran en `POSES_PLANO`. Para cambiarlas, reemplaza el archivo y ajusta sus medidas.
- Cuando un dibujo ya sea definitivo, quita la etiqueta "Dibujo de ayuda (provisional)" (clase `.provisional` en `fig()`).

## Añadir un capítulo nuevo (4 a 8)
1. En `contenido/misiones.js`, copia una misión completa dentro de `MISIONES`, cambia `id` (`m4`), `numero`, textos y pon `publicada: true`. Quita ese capítulo de `FUTUROS`.
2. Define su `logros: { mision, juego }` y agrégalos a `LOGROS`.
3. Reutiliza los tipos de ronda existentes. Si necesitas uno nuevo, añádelo en `juegos.js` (cuerpo + comprobación) y descríbelo aquí.
4. Posición del lugar en el mapa: `pos` en `mapa()` de `app.js` (porcentajes) y el dibujo en `mapaFondo()` de `dibujos.js`.
5. Actualiza `todasHechas()`/diploma si el diploma debe cubrir más misiones (hoy: "Misiones 1 a 3").
6. Añade las comprobaciones al arreglo de misiones de `probar.py` (lee los datos solo) y corre las pruebas.
Ver `HOJA-DE-RUTA.md`.

## Ajustar actividades
Cada ronda de juego es un objeto en `juego.rondas`: `tipo`, `pregunta`, respuesta correcta, `bien`, `mal`, `pista`, `explicacion`. Para `contar` el dibujo admite `cadenas`, `filaPB` y `puente`. Los números de "Reto" y los puntos se calculan solos.

## Publicar de forma segura (lista)
- [ ] La experta en crochet revisa los pasos (tabla en `PRUEBAS.md`).
- [ ] Probar con niños y familias reales (en el navegador del celular que usen) y con lector de pantalla (VoiceOver/TalkBack/NVDA).
- [ ] Sustituir o aprobar los dibujos provisionales (`INVENTARIO-RECURSOS.md`).
- [ ] Revisión legal: la política de privacidad del libro ya existe (`privacidad.html`); falta que la abogada la revise (Ley 1581 de 2012) y, al lanzar, enlazarla desde `politicas.html`. Si cambia lo que el libro guarda (cuentas, fotos, métricas individuales, sincronización), actualizar primero la política (apartados 4.3, 5, 7, 12 y 13 y el resumen «Hoy») y pedir las autorizaciones de los adultos.
- [ ] Decidir si se añade medición agregada (ver `HOJA-DE-RUTA.md`); si se hace, con consentimiento y sin identificadores de niños.
- [x] Quitar `noindex` de `index.html` y `privacidad.html`, añadir la URL a `sitemap.xml` y `llms.txt` y enlazarla (hecho el 17-oct-2026: tarjeta en `universo-rosina.html` y enlace en `politicas.html#datos`; enlazada también desde Academy (inicio y pie) y el Rincón de Rosina).
- [ ] Publicar = PR a `main` y merge (GitHub Pages despliega solo), con la aprobación de Sara.

## Diagnóstico rápido
| Síntoma | Qué mirar |
|---|---|
| Pantalla en blanco | Consola del navegador. `app.js` es un módulo ES: hay que servir por http(s), no abrir el archivo con doble clic. |
| "El progreso no se guarda" | El navegador bloquea `localStorage` (modo privado, datos de sitios bloqueados). La página lo avisa; funciona sin guardar. |
| Imagen de Rosina rota | Las poses viven en `img/stickers/rosina-*.webp`; el mapa de poses está en `contenido/personajes.js`. |
| No aparece "Escuchar" | Solo se muestra si el dispositivo tiene una voz **local** en español. Es a propósito (privacidad). |
| El mapa no cambia de color | Los colores se recuperan al **completar** cada misión (m1 flores, m2 río, m3 camino). |
| Quiero borrar el progreso de prueba | Pasaporte → "Borrar mi progreso…", o `localStorage.removeItem('lrAventuraRosina')` en la consola. |

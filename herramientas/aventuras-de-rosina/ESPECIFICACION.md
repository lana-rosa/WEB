# Especificación — Rosina y la gran aventura de la primera cadeneta (MVP)

## Diagnóstico de la arquitectura existente (hallazgos reales, 12-oct-2026)
- Sitio **estático** (HTML + CSS + JS) en GitHub Pages desde `main`, dominio por `CNAME`; sin compilación, sin framework. Cada página lleva su propio CSS/JS en línea; hay JS compartido en `js/` y CSS en `css/`.
- Convenciones: **ningún `<base>`; todo enlace o recurso interno empieza con `/`**; menú y pie generados por `herramientas/sincronizar_encabezado.py`; fuentes propias en `css/fuentes.css` + `/fonts/*.woff2` (DynaPuff y Hanken Grotesk, sin Google Fonts).
- Privacidad existente: Tag Manager + modo de consentimiento (todo denegado) + `js/consentimiento.js` en cada página; cuentas (Supabase) y carrito en casi todas. **Decisión:** la aventura no carga nada de eso (producto infantil); solo usa fuentes e imágenes del propio sitio.
- Recursos oficiales de Rosina: 22 poses con fondo transparente en `img/stickers/rosina-*.webp` (512×512), más `img/rosina*.webp`, `img/mini/` y el ícono circular. Se reutilizaron las poses de stickers.
- Verificación: `herramientas/revisar_enlaces.py` (enlaces y recursos) y un flujo de GitHub Actions lo corre tras cada publicación. Restricciones de alojamiento: solo archivos estáticos (sin servidor propio); por eso el progreso es local.
- Tipografía de marca (Celine y Montserrat Light) **no está en el repositorio**: no se usó. La interfaz usa DynaPuff (títulos) y Hanken Grotesk (texto), ya autoalojadas.

## Mapa de navegación
```
#/                      Bienvenida  ──¡Comenzar aventura!──▶ #/acompanantes ──▶ #/preparacion ──▶ #/mapa
#/mapa                  Mapa (3 lugares + lista) ──▶ #/mision/<id>/…  · #/pasaporte · #/diploma
#/mision/<id>/historia/<n>   (2 a 4 partes)  ──▶ tutorial/0
              /tutorial/0    objetivo y materiales ──▶ tutorial/1 … tutorial/N (un paso por pantalla)
              /practica      reto con hilo real: "Lo hice" o "Lo intentaré después" ──▶ juego
              /juego         3 a 5 retos ──▶ (m1) pasaporte ──▶ reflexion
              /pasaporte     solo misión 1: nombre/apodo, trato, color, amigo
              /reflexion     una pregunta, sin respuestas malas ──▶ fin
              /fin           marca la misión como completada y entrega logros
#/pasaporte  sellos, logros, bosque de colores, dónde se guarda el progreso, preferencia de voz, borrar progreso
#/diploma    se desbloquea con las 3 misiones; imprimir o guardar como PDF
#/adultos    guía para adultos (acompañar, materiales, seguridad, privacidad, contenidos)
#/ayuda      cómo funciona + botón de ayuda
Siempre visibles: cabecera con Mapa · Pasaporte · Ayuda · Adultos y, en cada misión, la barra de etapas (se puede saltar entre etapas).
```
Las 13 pantallas mínimas del encargo: bienvenida, orientación a acompañantes, preparación, mapa, introducción narrativa (historia), tutorial, actividad práctica, juego, ayuda (panel y página), misión completada, pasaporte y logros, diploma y página para adultos.

## Estados de la experiencia
- **Misión:** `nueva` (sin etapas), `en curso` (alguna etapa marcada) y `completada` (pasó por `fin` con historia, tutorial, práctica y juego hechos). Ninguna misión se bloquea: el mapa solo recomienda la siguiente.
- **Etapa:** hecha cuando se llega al final de la historia o del tutorial, se marca la práctica (`hecho` o `despues`), se termina el juego o se guarda el pasaporte; la reflexión es opcional.
- **Botones:** normal, hover, foco visible (anillo azul de 4 px), activo (baja 2 px), deshabilitado (opacidad y sin sombra) y completado (marca ✓ y color verde menta).

## Modelo de datos de una misión (`contenido/misiones.js`)
`id, numero, publicada, titulo, resumen, lugar, personajes[], habilidad, objetivos[], logros{mision,juego}, historia[{quien,pose,texto}], tutorial{objetivo,materiales[],pasos[{titulo,texto,lista?,dibujo|video,alt,pista,simple,adulto}]}, practica{titulo,intro,lista[],reto,sinMateriales,adulto}, juego{nombre,tipo,intro,rondas[{tipo,pregunta,…}]}, reflexion{pregunta,opciones[],respuesta}, fin{texto,pose}`. Cada paso trae la información que alimenta el botón de ayuda (pista, práctica más sencilla, mensaje para el adulto).

## Almacenamiento local
Clave `lrAventuraRosina` (versión 1): `apodo`, `trato`, `color`, `amigo`, `ultima` (para "Continuar"), `misiones{id:{etapas,completada,fecha}}`, `logros[]`, `colores{m1}`, `reflexiones{}`, `prefs{voz,adultos}`. No guarda nombres completos, datos de contacto, fotos ni identificadores. Si el navegador bloquea `localStorage` se muestra un aviso y todo sigue funcionando en memoria. Reinicio: confirmación en un diálogo, borra la clave. Se explica en la pantalla del pasaporte y en la guía de adultos que el progreso puede perderse al borrar los datos del navegador o cambiar de dispositivo.

## Sistema de diseño
Colores: `#cc1786` (botones principales y títulos, 5,2:1 con blanco), `#ff66c4` (acentos y bordes), `#dc0593` (reserva), apoyos suaves rosa `#FBE4EF`, lila `#E6E7FD`, menta `#E6F7EE`, cielo `#EAF6FF`, amarillo `#FFF6DD`, texto `#3a2a2e`. Tipografía: DynaPuff (títulos y botones) y Hanken Grotesk (texto, 18–19 px). Botones de 56 a 64 px de alto; bordes punteados que evocan puntadas; sin degradados ni brillos; animaciones solo de aparición y latido del mapa, apagadas con movimiento reducido. Primero 390 px, luego tableta y computador.

## Pruebas de aceptación
Cada criterio de aceptación del encargo se comprueba con `probar.py` o está listado como pendiente en `PRUEBAS.md`.

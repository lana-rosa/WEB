# Agenda para tejedoras — Diagnóstico multidispositivo (30-oct-2026)

**Alcance:** solo lectura. No se modificó la web publicada. Medido sobre la versión de `main` del 30-oct-2026 (panel, menú lateral, íconos de línea).
**Datos:** inventados (sin datos de clientas reales). **Prueba:** `herramientas/pruebas/auditar_agenda_responsive.py`; medidas completas en `medidas-responsive-2026-10-30.json`; capturas en `m-*.png`.

## 1. Qué se midió
- **19 tamaños** (14 pedidos + apaisados): 320, 360, 375, 390, 414, 430, 600, 768, 800, 1024, 1280, 1440, 1600, 1920 px; apaisado de celular 667×375, 844×390, 932×430; apaisado de tablet 1024×768 y 1180×820; 1366×1024.
- **46 vistas por tamaño:** las 39 hojas + las 7 vistas de sección → ~870 mediciones.
- Por cada una: desborde horizontal, elementos que se salen de la pantalla, zonas de toque menores de 44 px, casillas con letra menor de 16 px (hacen zoom en iPhone), textos menores de 12 px, tablas más anchas que la hoja, tamaño de lienzos, solapes entre botones fijos.
- **Errores de JavaScript:** 0 en todos los tamaños.

## 2. Lo que ya está bien
- Sin desplazamiento horizontal de página en 18 de 19 tamaños (la excepción está en el punto 3.1).
- Ninguna tabla se sale de la hoja (las listas ya son fichas desplegables).
- Casillas con letra de 16 px o más en todas las hojas menos una (`semana-tejiendo`, 1 casilla).
- La navegación ya cambia sola: menú lateral desde 821 px y barra de abajo en celular y tablet vertical; el botón de ayuda no tapa la barra.
- Ningún solape entre el botón de ayuda y la barra fija.

## 3. Problemas encontrados (con cifras)
**3.1 Desborde en 600 px (tablet pequeña / celular grande apaisado):** 3 hojas se salen de la pantalla: `proyectos-fila` (19 px), `control-pedidos` (7 px) y `mis-clientas` (6 px). Causa: la barra de botones bajo cada lista de fichas («Agregar · Google · Borrar») no se parte en dos renglones.

**3.2 Zonas de toque pequeñas (el problema más extendido):** entre 260 y 280 elementos por pantalla miden menos de 44 px. Los más repetidos en celular: enlaces sueltos (100), botones chicos «Agregar/Google/Borrar» (52+22), «Ver todos/Ver calendario» del panel (36), pasos de «Diseña tu patrón» (36), días de la semana del planeador (24), «‹ ›» de los meses (24), «Nueva/Borrar versión» (36), botones de calendario por fila (12). Las hojas más afectadas: `ficha-proyecto` (33), `hoja-puntos` (25), `mis-agujas` (23), `disena-patron` (13), `coleccion-patrones` (10), `planeador-dia` (10).

**3.3 Letra demasiado pequeña (< 12 px):** chips y subtítulos del panel (15 textos), `registro-pausas` (32), `calendario-anual` (17), `fin-negocio` (17), `control-pedidos` (16), `fin-resumen` (13), `planeador-dia` (10), `proyectos-fila` (10), `ventas-mes` y `gastos-negocio` (10 c/u). Ejemplo: `.pn-chip` 11,5 px; `<small>` 10,9 px.

**3.4 Pantallas grandes desaprovechadas:** el contenido se queda en **854 px** desde 1280 hasta 1920 px. En un monitor de 1920 px la hoja usa menos de la mitad del ancho y el resto es margen; el panel y los gráficos podrían repartirse en 2–3 columnas. No hay ninguna distribución distinta entre 1280 y 1920.

**3.5 Tablets:** de 600 a 820 px (tablet vertical) se usa la misma distribución de una columna que en celular, con la barra de abajo; el ancho útil de la hoja es de 552 a 752 px y las tarjetas del panel solo usan 2 columnas. Apaisado (1024–1366 px) sí usa menú lateral, pero la hoja queda en 762–854 px.

**3.6 Celulares:** antes de ver la hoja hay ~250 px de herramientas (buscar, Dictar, Lápiz, color de letra) y el selector «Hojas de…»; en 320×640 casi no queda contenido en la primera pantalla. Los textos de la barra de abajo se cortan en 320–375 px («Materi…», «Empre…», «Finanz…», «Bienes…»).

**3.7 Celular apaisado (667×375, 844×390):** la barra fija de abajo (52 px) y el botón de ayuda consumen ~20 % de la altura; con 375 px de alto queda poco espacio útil.

**3.8 Hoja de dibujo:** el lienzo mide 282×338 px en un celular de 390 px (212×254 en 320 px): muy pequeño para dibujar; en escritorio llega a 794×953 px.

**3.9 Lienzo de lápiz (`tinta-canvas`):** hay uno por hoja, de hasta 4.400 px de alto en celular (ej. `indice-agenda` 340×4413). No falla, pero consume memoria; conviene revisar en iPhone/Android reales.

**3.10 Gráficos:** las gráficas de `fin-resumen`, `fin-negocio` y `tablero` se ven bien en 390 px pero con letras pequeñas (ejes ~8–9 px) y sin datos de ejemplo a la vista; hay que probarlas con datos reales de prueba (inventados) en 320 px.

## 4. Lo que NO pude verificar
- Dispositivos reales (iPhone, Samsung, iPad): solo Chromium; no Safari ni Firefox.
- Teclado virtual que tapa casillas; giro del celular en vivo; redimensionar la ventana arrastrándola; lápiz digital.
- Lector de pantalla; contraste en pantallas con poco brillo.
- Uso real con mouse y teclado completo (solo la auditoría automática).

## 5. Riesgos y protección de datos
- Todo lo propuesto es **presentación** (CSS y distribución de componentes). **No toca la forma de guardar** (`localStorage.rosinaAgenda`, mismos nombres de campo) ni la copia en la cuenta.
- Antes de cada ola: punto de restauración (commit conocido) + copia de seguridad del navegador de prueba; cada ola se publica sola para poder revertirla.
- Pruebas solo con datos inventados.
- Riesgo medio: la hoja de dibujo a pantalla completa y mover botones en fichas tocan JavaScript que hoy funciona; se prueban con las 31 pruebas existentes y pruebas nuevas.
- Riesgo de la serifa en títulos: cambia el aspecto aprobado el 30-oct (DynaPuff en títulos de hoja); requiere tu decisión.

## 6. Propuesta de distribución (ver `propuesta-distribucion.png`)
Cuatro «clases» de pantalla con distribución propia, no solo más pequeña:
1. **Celular (< 600 px):** una columna; herramientas plegadas en un botón; barra inferior de 5 secciones + «Más»; todo toque ≥ 44 px; fichas apiladas; hoja de dibujo a pantalla completa.
2. **Celular apaisado (< 500 px de alto):** barra de abajo → riel lateral delgado; dos columnas.
3. **Tablet vertical (600–1023 px):** dos columnas de tarjetas, formularios en 2 columnas, fichas en 2 columnas; barra inferior con nombres completos.
4. **Tablet apaisada y portátil (1024–1439 px):** menú lateral + contenido + columna de apoyo (acciones, consejo).
5. **Escritorio (≥ 1440 px):** contenido hasta ≈ 1360 px centrado en 2–3 columnas, sin estirar el texto.

## 7. Plan técnico por fases
| Fase | Qué se hace | Riesgo |
|---|---|---|
| 0 | Punto de restauración y líneas base de las pruebas | Bajo |
| 1 | **Arreglos de base (sin cambiar diseño):** barra de fichas que se parte (600 px), zonas de toque ≥ 44 px, letra mínima 12 px (chips y subtítulos), nombres de la barra de abajo | Bajo |
| 2 | **Sistema visual:** serifa en títulos (si la apruebas), escala de tamaños, espacios, crema/marfil + verde salvia en estados | Bajo-medio |
| 3 | **Prototipo** de Portada, Mi tablero, Control de pedidos y Mi negocio en números en los 5 tamaños, para tu aprobación | Medio |
| 4 | **Implementación por módulos:** Panel e Índice → listas de fichas (13 hojas iguales) → formularios por pasos → calendarios → gráficos → registros → hoja de dibujo; revisando cada hoja a mano (tabla `tabla-hojas.md`) | Medio |
| 5 | Pruebas funcionales, técnicas y de seguridad (las 31 suites + nuevas por tamaño) y pruebas en celulares reales | — |
| 6 | Pruebas con usuarias de ambos públicos (tejedoras y emprendedoras) y lanzamiento gradual | — |

## 8. Decisiones que necesito de Sara
1. ¿Serifa elegante para los títulos de hoja (y DynaPuff solo en el logo)?
2. ¿Ancho máximo en pantallas grandes de ≈ 1360 px con 2–3 columnas?
3. ¿Celular apaisado con riel lateral en lugar de barra inferior?
4. ¿Hoja de dibujo a pantalla completa en celular?
5. ¿Empezamos por la fase 1 (arreglos de base, poco visibles) y luego el prototipo?
6. ¿Quién puede probar en iPhone/Samsung/iPad reales y con qué usuarias de ambos públicos?

Detalle hoja por hoja: `tabla-hojas.md`.

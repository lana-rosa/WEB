# 05 · Etapa 1: «El universo de Rosina» y «Rosina te ayuda a regalar» (15-oct-2026)

**Estado: publicada el 15-oct-2026** (rama `claude/universo-etapa1` → `main`, a pedido de Sara). La página no tiene `noindex`, está en el sitemap y en `llms.txt`, y se enlaza desde el menú de todas las casas (escritorio y celular, 16-oct-2026) y desde el pie de todas las páginas. Desde el 16-oct-2026 también está destacada en el inicio (sección rosada justo debajo de la barra de confianza: dos listas —tipo y presupuesto— y el botón «Ver ideas de regalo», que lleva al recomendador con lo elegido ya aplicado, por ejemplo `/universo-rosina.html?tipo=peluche&presupuesto=p2#regalar`; el recomendador solo acepta valores que existen en sus listas).

## Qué es
- `universo-rosina.html`: portada del universo con los cuatro recorridos de Rosina (regalar, crear, inspirarte, aprender). Crear, inspirarte y aprender llevan a lo que ya existe (`/personaliza.html`, `/revista.html`, `/academy/`); no se duplica nada.
- «Rosina te ayuda a regalar» (`js/universo/regalar.js`): las preguntas son **listas desplegables** (`select` nativo, con su etiqueta; la primera opción es «sin filtro»): la persona elige tipo de regalo, presupuesto, tamaño y si lo necesita ya (y, cuando haya etiquetas revisadas, para quién y ocasión) y ve productos **reales** de la tienda en tres bloques: **Disponibles ya** (hay existencias), **Por encargo** (con el tiempo de elaboración que ya tiene cada producto en el ERP) e **Ideas para personalizar** (los tres «Amigurumi personalizado» de 13, 15 y 20 cm; las fotos son de referencia).
- Es un recomendador **por reglas**: no usa IA ni inventa productos, precios, existencias ni plazos. Cada tarjeta lleva a la ficha de la tienda (`/tienda.html?producto=<id>`), que ya sabe agregar al carrito, pagar con Wompi o pasar al formulario de personalizados.
- Mantiene fuentes y colores del sitio (DynaPuff, Hanken Grotesk, #E74E96), enlaces absolutos, sin Google Fonts.

## Datos
- Función pública `obtener_regalos_web()` (SECURITY DEFINER): id, nombre, precio, categoría, foto, tiempo de elaboración, **si hay existencia (sí/no, no cuántas unidades)**, medida en cm (se lee del nombre; 12 productos no la tienen y quedan fuera cuando se filtra por tamaño), si es base de personalizado, si es «personaje» y las etiquetas.
- Tabla `producto_etiquetas` (RLS sin políticas y sin acceso directo para `anon`/`authenticated`). Hay una **propuesta** para 71 productos, marcada como no revisada. Los filtros «¿Para quién?» y «¿Qué ocasión?» solo aparecen cuando hay al menos 20 productos con `revisado_en`. Con `?etiquetas=propuestas` en la dirección se ve la vista previa (con aviso). Las ocasiones no incluyen fechas que la marca no celebra.
- SQL: `migracion-universo-1.sql` (ya aplicado en Supabase el 15-oct). Revisión: `etiquetas-productos.xlsx` + `etiquetas.py`.

## Privacidad y medición
Sin cuentas, sin formularios, sin guardar nada de la persona: las elecciones viven solo en la página. Eventos de GA4 (solo si la persona aceptó analítica): `universo_inicio`, `regalar_paso`, `regalar_resultado` (con número de resultados y `sin_resultados`), `regalar_abre_ficha` y, desde el inicio, `regalar_desde_inicio` (solo tipo y presupuesto elegidos). `universo_inicio` lleva `con_filtros` (cuántas listas llegaron ya elegidas).

## Interruptor
`CONFIG.REGALAR_ACTIVO = false` en `js/universo/config.js` apaga el recomendador (la página sigue entera con el aviso «Muy pronto»). Para retirar toda la etapa: quitar el enlace del menú y del pie en `herramientas/sincronizar_encabezado.py`, sacar la página del sitemap y poner `noindex`.

## Pruebas (`python3 herramientas/pruebas/probar_regalar.py [carpeta_capturas]`)
64 comprobaciones con la respuesta real del catálogo (`herramientas/pruebas/fixtures/regalos.json`, 72 productos), con Supabase simulado (no toca producción) en celular (390 px) y computador (1280 px): sin resultados (R1), producto sin existencia solo en «Por encargo» (R2), producto sin etiqueta revisada excluido de los filtros de ocasión y destinatario (R3), precios idénticos al catálogo (R4), listas desplegables accesibles con teclado y lector de pantalla (R5), error de red y catálogo vacío, interruptor apagado, sin scroll horizontal y sin errores de JavaScript.

## Después de publicar
1. Revisar en GA4 cuántas búsquedas terminan sin resultados (`regalar_resultado` con `sin_resultados`) para decidir qué productos o etiquetas faltan.
2. Cuando Sara revise la hoja de etiquetas (`etiquetas-productos.xlsx`) y haya 20 productos revisados, aparecen solos los filtros «¿Para quién?» y «¿Qué ocasión?».
3. Mirar en GA4 cuántas personas pasan del inicio al recomendador (`regalar_desde_inicio`) y cuántas llegan a una ficha (`regalar_abre_ficha`).

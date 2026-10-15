# 05 · Etapa 1: «El universo de Rosina» y «Rosina te ayuda a regalar» (15-oct-2026)

**Estado:** construida y probada en la rama `claude/universo-etapa1`. **No está publicada:** la página tiene `noindex`, no está en el menú ni en el sitemap y no entra a `main` hasta que Sara la apruebe.

## Qué es
- `universo-rosina.html`: portada del universo con los cuatro recorridos de Rosina (regalar, crear, inspirarte, aprender). Crear, inspirarte y aprender llevan a lo que ya existe (`/personaliza.html`, `/revista.html`, `/academy/`); no se duplica nada.
- «Rosina te ayuda a regalar» (`js/universo/regalar.js`): el cliente elige tipo de regalo, presupuesto, tamaño y si lo necesita ya (y, cuando haya etiquetas revisadas, para quién y ocasión) y ve productos **reales** de la tienda en tres bloques: **Disponibles ya** (hay existencias), **Por encargo** (con el tiempo de elaboración que ya tiene cada producto en el ERP) e **Ideas para personalizar** (los tres «Amigurumi personalizado» de 13, 15 y 20 cm; las fotos son de referencia).
- Es un recomendador **por reglas**: no usa IA ni inventa productos, precios, existencias ni plazos. Cada tarjeta lleva a la ficha de la tienda (`/tienda.html?producto=<id>`), que ya sabe agregar al carrito, pagar con Wompi o pasar al formulario de personalizados.
- Mantiene fuentes y colores del sitio (DynaPuff, Hanken Grotesk, #E74E96), enlaces absolutos, sin Google Fonts.

## Datos
- Función pública `obtener_regalos_web()` (SECURITY DEFINER): id, nombre, precio, categoría, foto, tiempo de elaboración, **si hay existencia (sí/no, no cuántas unidades)**, medida en cm (se lee del nombre; 12 productos no la tienen y quedan fuera cuando se filtra por tamaño), si es base de personalizado, si es «personaje» y las etiquetas.
- Tabla `producto_etiquetas` (RLS sin políticas y sin acceso directo para `anon`/`authenticated`). Hay una **propuesta** para 71 productos, marcada como no revisada. Los filtros «¿Para quién?» y «¿Qué ocasión?» solo aparecen cuando hay al menos 20 productos con `revisado_en`. Con `?etiquetas=propuestas` en la dirección se ve la vista previa (con aviso). Las ocasiones no incluyen fechas que la marca no celebra.
- SQL: `migracion-universo-1.sql` (ya aplicado en Supabase el 15-oct). Revisión: `etiquetas-productos.xlsx` + `etiquetas.py`.

## Privacidad y medición
Sin cuentas, sin formularios, sin guardar nada de la persona: las elecciones viven solo en la página. Eventos de GA4 (solo si la persona aceptó analítica): `universo_inicio`, `regalar_paso`, `regalar_resultado` (con número de resultados y `sin_resultados`) y `regalar_abre_ficha`.

## Interruptor
`CONFIG.REGALAR_ACTIVO = false` en `js/universo/config.js` apaga el recomendador (la página sigue entera con el aviso «Muy pronto»). Para apagar toda la etapa basta no enlazar la página.

## Pruebas (`python3 herramientas/pruebas/probar_regalar.py [carpeta_capturas]`)
61 comprobaciones con la respuesta real del catálogo (`herramientas/pruebas/fixtures/regalos.json`, 72 productos), con Supabase simulado (no toca producción) en celular (390 px) y computador (1280 px): sin resultados (R1), producto sin existencia solo en «Por encargo» (R2), producto sin etiqueta revisada excluido de los filtros de ocasión y destinatario (R3), precios idénticos al catálogo (R4), teclado y lector de pantalla (R5), error de red y catálogo vacío, interruptor apagado, sin scroll horizontal y sin errores de JavaScript.

## Para publicar
1. Sara revisa la vista previa / capturas y revisa (o delega) las etiquetas.
2. Con su OK: PR a `main`; luego enlazar desde el menú (`herramientas/sincronizar_encabezado.py`), añadir al sitemap y quitar `noindex`.
3. Después de publicar: mirar en GA4 cuántas búsquedas terminan sin resultados (`regalar_resultado` con `sin_resultados`) para decidir qué productos o etiquetas faltan.

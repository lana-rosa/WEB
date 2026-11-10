# Estado actual (léelo primero en un chat nuevo)

> Actualizado: 3-nov-2026 (orquestador). **Cada chat reemplaza solo SU renglón de «Por chat»** (máx. 3 líneas, sin agregar renglones nuevos ni tocar los de otros). Lo general lo mantiene el orquestador. El detalle de cada tema está en su archivo (índice en `CLAUDE.md`); el plan hasta la apertura, en `encargos.md`.

**Publicar** = PR a `main` + squash con el visto bueno de Jennifer (la dueña; en archivos antiguos «Sara»); después, la rama de trabajo vuelve a `origin/main`. `rosina-web` desplegada: **v62 del repositorio** (Supabase la numera v61), idéntica al repositorio (3-nov).

**Fechas clave:** la tienda física abre el **domingo 13-dic-2026**; atención normal desde el lunes 14-dic (los textos cambian solos ese día, `js/apertura.js`). Contador 23-nov a 4-dic, conteo físico 7 a 9-dic, ensayo de caja 10 a 12-dic.

## Por chat (cada uno reemplaza solo el suyo)
- **1 · Agenda datos y Google:** publicado: auditoría, arreglos de Calendar, Conexiones etapas 1 y 2 y E30 (aviso antes de conectar Google, 5-nov; texto en borrador hasta la abogada). A medias: interruptor de fotos de Drive (no hecho a propósito: riesgo de perder dibujos); etapas 3 y 4. Falta que Jennifer pruebe Drive y Calendar reales.
- **2 · Agenda diseño y Plus:** PUBLICADO: «Mi cuenta» (#574), tarjetas B (#577), «Ventas y gastos» pasos 1 y 2 (#582, #591), «Mis números» y sin lista «Hojas de…» en la hoja principal (#607). E11: `FINANZAS-PROPUESTA.md` y `REVISION-HOJAS-PROPUESTA.md` (10 preguntas pendientes).
  PUBLICADO 5-nov (#612): modo oscuro Claro/Oscuro/Como el celular + contraste de tarjetas y letra gris (E19+E25+E26) + buscador con un solo recuadro; `css/agenda-oscuro.css` se genera con `herramientas/agenda-oscuro/generar_oscuro.py`. Sigue el paso 3 de dinero «Resumen del emprendimiento» y el grupo personal.
  PUBLICADO 10-nov (#640): agenda más simple (dibujo cerrado, tiras y compra plegadas, «Añadir parte», fotos en patrones, «Patrones que diseñé»); falta chat 3: textos EN/PT y `GUIA_AGENDA`.
  A medias: Jennifer revisa en su celular Plus, fichas, portada, dibujo, Rosina y «Abreviaturas»; chat 3: EN/PT de «Claro u oscuro», «Mis números» y `GUIA_AGENDA`.
- **3 · Agenda Rosina e idiomas:** E1 y E29 cerrados. 10-nov: `rosina-web` Supabase v76 = «v78» del repo (guía con dibujo cerrado, «Añadir parte», fotos, «Patrones que diseñé» y «Subir foto» vs «Subir fotos»); portugués con «receita». Hubo ~10 min con Rosina caída por subidas incompletas (ya arreglado). A medias: Jennifer prueba un chat real; falta la guía del aviso de Google (E30).
- **4 · Tienda y Mercería:** publicado (5-nov): tienda sin «Ver más», miniaturas livianas, «hipoalergénica» quitada y 3 avisos de personajes/personas en la ficha. Sin decidir: 31 piezas de personajes. Espera el Excel de la Mercería y las 34 fotos (bloque B).
- **5 · Base de datos y pagos:** E28 en curso: guías de envío privadas hechas (migración 44, enlaces de 10 min, borrado a 90 días); casillas del pago preparadas y apagadas en `herramientas/borradores/casillas-pago.patch`. A medias: el ERP debe usar enlaces firmados, probar con una guía real, el resto de E28 y la compra de prueba E4 (espera el número de pedido de Jennifer).
- **6 · Sitio, SEO y Revista:** paquete de la abogada listo (`herramientas/legal/PAQUETE-ABOGADA.md`; proveedora = Sara Loaiza Muñoz, casilla de patrones propuesta). E9 revisado: `apertura.js`, `activar_apertura.py` y el flujo coinciden (14-dic). Falta: fecha de cookies (espera sí de Jennifer), aviso de apertura en el inicio y recogida en taller.
- **7 · Universo de Rosina y Academy:** avisos de personajes publicados (#628); E33 borrador de términos de la Academy listo (faltan 4 detalles de Jennifer: mínimo del anticipo y fecha del saldo, plazo de devolución, datos del recibo, venta de lo tejido).
  E34 (10-nov): borrador «Método ROSA» + «Prueba de 3 a 5 piezas» en `herramientas/borradores/metodo-rosa/index.html`; Jennifer aprobó cómo se ve (10-nov); se publica después del 14-dic con su sí final.
  E35 (10-nov): borrador del «Pasaporte de calidad para amigurumis» (1 página) en `herramientas/borradores/pasaporte-calidad/index.html`; lo prueban Jennifer y las tejedoras; sin publicar hasta su sí.
  A medias: actualizar `plantilla-rincon.html` antes de regenerar glosario y paletas.
- **8 · Marketing y contenido:** Jennifer decidió (3-nov): tono inclusivo, nombre «CrochetLab» en pausa (10-nov): decir «la agenda de Lana Rosa»; carrito mixto = sí (a construir, chats 4 y 5). Guiones de la línea 1 listos (borrador). 10-nov: calendario, guiones de 2 semanas y borradores del Método ROSA listos para aprobar (E10).

## Pendiente de Jennifer
- Google Cloud en **Producción**; prueba real de Drive (dos aparatos) y Calendar; preguntas reales a Rosina.
- Excel de la Mercería, 34 fotos y decisiones del catálogo; roles para A4b; protección de contraseñas en Supabase.
- Revisar el paquete de la abogada y llevárselo; pago real de prueba.

**Reglas de oro:** desplegar `rosina-web` con `nucleo.ts` e `index.ts` COMPLETOS y comparar; todo lo que lea la agenda completa pasa por `lrDibStore`; pruebas de `herramientas/pruebas/` antes de publicar; nada se publica sin el visto bueno de Jennifer.

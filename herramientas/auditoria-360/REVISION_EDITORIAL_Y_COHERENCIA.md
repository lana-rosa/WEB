# Revisión editorial y de coherencia — auditoría 360 (22-oct-2026)

**Alcance honesto.** Se extrajo el texto fuente de las **60 páginas** del sitio (incluidas las preguntas frecuentes plegadas y los datos estructurados JSON-LD) y de `llms.txt`, y se hicieron comprobaciones **automáticas** en todas. **No se leyó cada artículo de principio a fin**: la lectura humana fue dirigida (donde las comprobaciones apuntaban). Si quieres una lectura editorial completa de los 19 artículos de la Revista, se hace aparte.

## 1. Comprobaciones y resultado

| Comprobación | Alcance | Resultado |
|---|---|---|
| Ortografía (cspell en español, con diccionario propio de marca) | Texto renderizado de 60 páginas | 227 palabras marcadas; revisadas una por una: son nombres propios y marcas, diminutivos a propósito (ositos, huequitos…), el glosario en inglés, portugués, francés, italiano, chino, ruso y turco, comentarios coloquiales de clientas («Ayyyy», «Omggg») y direcciones web. **No encontré errores ortográficos reales.** No detecta errores de gramática ni de puntuación |
| Valores de la marca (sin Navidad, santos, San Valentín ni Halloween) | 60 páginas renderizadas y 110 archivos de texto del sitio (HTML, JS, JSON, TXT, XML) | **0 coincidencias** |
| Vocabulario regional | 60 páginas | Sin giros de España (ordenador, vosotros, coger…). «Usted» aparece solo en `politicas.html` (registro formal habitual en documentos legales); el resto tutea |
| Títulos y descripciones | 51 páginas del mapa del sitio | 22 títulos de más de 60 caracteres (16 de más de 70) y 13 descripciones de más de 160 → SEO-01 |
| Encabezados | 70 rutas | 1 `<h1>` en cada una; 3 rutas con saltos de nivel → ACC-06 |
| Datos estructurados | 60 páginas | 100 % de los bloques JSON-LD se leen bien; 6 páginas con `FAQPage` |
| Enlaces de texto internos | 5.545 apariciones | 0 rotos dentro del repositorio (ver `INVENTARIO_ENLACES.csv`) |
| Precios, plazos, envíos, medios de pago, horarios, dirección, teléfono y correo | 60 páginas + `llms.txt` | Coherentes salvo los puntos de abajo; ver `COHERENCIA_COMERCIAL.md` |

## 2. Contradicciones o desactualizaciones confirmadas

| ID | Prioridad | Dónde | Qué pasa | Qué cambiaría (con tu OK) |
|---|---|---|---|---|
| CON-01 | P3 | `agenda-rosina.html` | El encabezado dice «llena tus hojas aquí mismo (se guardan en tu dispositivo)» pero a quien no tiene cuenta se las bloquea una puerta «gratis con tu cuenta» | Decir en el encabezado que requiere cuenta gratis |
| CON-02 | P3 | `preguntas-frecuentes.html`, `llms.txt` y la primera decisión de la sección 7 de `PENDIENTES.md` | Dicen que los personalizados se pagan por WhatsApp con comprobante; Personaliza, Precios, la tienda y el asistente dicen que los de 13, 15 y 20 cm también se pagan en línea con Wompi | Añadir «también se pueden pagar en línea» y cerrar la decisión de la lista |
| CON-03 | P3 | `politicas.html` y `merceria/como-comprar/` | Dicen que el 10 % de primera compra no aplica a patrones digitales ni a la membresía; el servidor también lo excluye en los **personalizados** y solo `llms.txt` lo dice | Añadir «ni a los amigurumis personalizados» |
| CON-05 | P3 | `index.html`, `tienda.html` | Reseñas sin nombre ni fecha («Ayyyy quedó precioso…»); decisión de Sara del 17-oct. Conviene guardar las capturas originales de cada una | Guardar el respaldo y, con permiso, mostrar nombre de pila |

## 3. Observaciones para la abogada (no son conclusiones jurídicas)

1. **Plazo de devolución del dinero:** `merceria/cambios-y-devoluciones/` dice «quince (15) días calendario» y lo presenta como el plazo máximo legal actual. No pude verificar la norma vigente desde aquí; si fuera más largo que el que promete la web, no hay problema (promete más rápido), pero hay que poder cumplirlo.
2. **Retracto de 5 días hábiles** (`politicas.html`) y **recomendación de reportar novedades en 7 días calendario**: coherentes entre sí; la abogada debe confirmarlos (ya está en `PENDIENTES.md`).
3. **Chat de Rosina:** lo que se escribe viaja a un proveedor de IA; ni el chat ni el apartado 9 de la política lo dicen (PRI-02).
4. **Casilla premarcada de «Crear mi cuenta»** en el pago (PRI-01).
5. **Copias de seguridad** en un servicio fuera de Colombia: el párrafo ya existe en la política; pendiente de su revisión (SEG-07).
6. **NIT de persona natural** publicado en varias páginas (PRI-04).

## 4. Lo que está bien editorialmente

- **Una sola regla de plazos** en 7 archivos: «la elaboración toma 8 días hábiles y se despacha el siguiente día hábil; después, la entrega depende de la transportadora». No quedan «15 días» ni «1 semana».
- **Una sola tarifa de envío** en 12 archivos: Villamaría $8.000, Manizales $13.000, resto $18.000; recoger en tienda, gratis.
- **Datos de contacto idénticos** en 55 a 56 archivos: calle 10 #5-37 Villamaría, WhatsApp +57 320 507 2801, `contacto@lanarosacrochet.com` y horario 7:30 a.m. a 6:15 p.m.
- **Fecha de apertura coherente:** domingo 15 de noviembre de 2026 (inauguración) y lunes 16 (atención normal); `js/apertura.js` y `activar-apertura.yml` cambian los textos solos.
- Las advertencias de «Muy pronto» de la Mercería, los avisos de bajo pedido y las condiciones de los personalizados se leen con el mismo lenguaje en todas las páginas.

## 5. Para una segunda pasada editorial (si quieres)

- Lectura completa de los 19 artículos (claridad, repeticiones y enlaces internos hacia Tienda y Personaliza).
- Revisión con tejedoras de las abreviaturas en chino y ruso y del orden del glosario (ya está en `PENDIENTES.md`).
- Alineación de tuteo y trato formal en las políticas.

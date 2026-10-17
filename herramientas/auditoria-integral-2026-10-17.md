# Auditoría integral — informe final (17-oct-2026)

Resumen de lo que se revisó, corrigió y quedó pendiente. Solo se afirma lo que se ejecutó; lo demás figura como pendiente.

## Correcciones realizadas

| ID | Problema | Archivos principales | Solución | Prueba ejecutada | Resultado |
|---|---|---|---|---|---|
| H1 | Plazos de entrega contradictorios (1 semana, 15 días, siguiente día hábil) | `politicas.html`, `tienda.html`, FAQ, `personaliza.html`, `llms.txt`, Revista | Una sola regla: disponible = despacho el siguiente día hábil; bajo pedido o personalizado = 8 días hábiles + despacho el siguiente día hábil | Búsqueda de los plazos en todo el sitio | Sin contradicciones |
| H2 | Correos de carrito abandonado sin consentimiento | `js/pago.js`, `politicas.html`, base (`carritos_abandonados.acepta_at`, `fn_enviar_carritos_abandonados`) | Casilla opcional y desmarcada; solo escribe a quien aceptó; baja y re-suscripción permitidas | Navegador a 390 px: sin casilla no hay petición; con casilla se guarda. Base: 9 carritos guardados, 0 con aceptación, ninguno recibe correos | Aprobado |
| H3 | GTM desde la primera visita | — | Sara comprobó en la vista previa de GTM que tras «Rechazar» no se envía nada a GA4 | `prueba_consentimiento.py` (15 comprobaciones) | Aprobado (la prueba de GTM la hizo Sara) |
| H4 | `diag-secretos` activa | — | Ya responde 410 y exige sesión: no se tocó | Lectura del código desplegado | Sin riesgo |
| H5 | Bucket `guias-envio` público | — | Decisión de Sara: queda público (hoy sin datos) | Estado del bucket | Pendiente si se suben guías con datos personales |
| H8 | PayPal con referencias en el código | `js/pago.js` | `PAYPAL_ACTIVO = false`; en la base ya estaba inactivo | Navegador: no aparece el selector de país | Aprobado |
| H7 | Código de `wompi-webhook` fuera del repo | `herramientas/cuentas-clientes/funciones/` | Copia guardada | — | Faltan copias de otras funciones |
| H9 | Encabezados de la Revista saltaban a h3; `politicas.html` sin Open Graph | Revista, `politicas.html` | h1 → h2; etiquetas OG | `revisar_enlaces.py`, revisión de títulos | Aprobado |
| — | Accesibilidad: 27 fallos de axe-core (contraste, selectores sin nombre, botón vacío) | CSS y páginas | Corregidos | axe-core en 16 páginas a 390 y 1280 px | 0 fallos |
| H10 | «(apertura: 15 de noviembre de 2026)» quedaba tras abrir, en 10 páginas | `herramientas/activar_apertura.py` | El script lo quita el 16-nov | Ejecución en una copia, repetida | Aprobado |
| — | Fotos de color de la Mercería sin aviso de que son aproximadas | `merceria/catalogo/index.html` | Nota en la ficha | Playwright con datos simulados a 390 y 1280 px | Aprobado |
| — | Rendimiento (inicio, tienda, Personaliza, universo, Mercería, Academy) | Varias | Fotos por tamaños, miniaturas, precargas, aviso de cookies al inicio del body, reserva de espacio (CLS) | Emulación local con red lenta y CPU 4x | Mejoró en local; PageSpeed varía mucho entre corridas |
| — | Ajustes de rendimiento que causaban «brinquitos» | PR 362 | Se revirtieron | Revisión de Sara | Resuelto |
| — | Ícono de carrito distinto en computador y celular | `tienda.html`, Mercería, cuenta | SVG propio | Revisión visual | Aprobado |
| — | Nombres de producto con medidas en cm | `tienda.html`, `regalar.js`, `rosina-chat.js` | Se quitan al mostrar (los 3 personalizados las conservan) | `probar_regalar` y `probar_rosina_chat` | Aprobado |

## Revisado sin necesidad de cambios

- Tarifas de envío en la base (Villamaría $8.000, Manizales $13.000, resto $18.000) = política, tienda, contacto y FAQ.
- Precios publicados coinciden entre páginas y `llms.txt`.
- Pedido con referencia única; botón de pagar se bloquea al primer clic; `gracias.html` lee el estado del servidor.
- Webhook de Wompi: verifica firma, vuelve a consultar a Wompi, compara el monto y no degrada pedidos pagados.
- RLS en todas las tablas de clientes; bucket de fotos de personalización privado, límite 8 MB y tipos validados en el servidor.
- Agenda de Rosina: 90 días de conservación y aviso 15 días antes coinciden con la política; membresía apagada y rechazada por el servidor.
- Mercería: producto agotado con botón deshabilitado. Rosina: sin coincidencias ofrece alternativas y el fallo del chat no bloquea.
- PWA: manifiestos, íconos y service worker; sin conexión muestra `/offline.html`.

## Pruebas (17-oct-2026, sobre `main` en `22e29f2`)

Aprobadas, 0 fallas: menús 151, regalar 114, crear 84, casas de Rosina 55, chat de Rosina 31, colores 73, ampliar 24, suscripción 13, lista de espera 24, QR 41, historias 13, visor 3D 54, cuento de Rosina 82, función de Rosina 43, consentimiento (15 filas, todas OK). Fallidas: ninguna.

Enlaces internos rotos: 0 antes (481 URLs) y 0 después (482 URLs); 0 rutas relativas.

## Pendiente o sin verificar

- **PageSpeed:** medir de nuevo en celular (inicio, tienda, Personaliza, Mercería, Academy, universo) tras los últimos despliegues, 3 veces cada una. Solo hay mediciones locales y las capturas de Sara anteriores a los últimos cambios (inicio móvil 75, tienda 67, Personaliza 88, universo 88, Academy 76, Mercería entre 97 y 75).
- **Lector de pantalla** (VoiceOver/TalkBack): no probado.
- **Pagos:** no se hizo ningún pago de prueba contra el sandbox de Wompi desde el entorno de revisión (sin acceso a la red del proveedor). Pendiente un pago real de prueba.
- **Indexación en Google:** sin evidencia de Search Console.
- **Supabase:** activar la protección contra contraseñas filtradas; 137 funciones del ERP sin `search_path` fijo y funciones `SECURITY DEFINER` ejecutables por anon (las RPC públicas son intencionales; las del ERP se revisan con calma). Los avisos siguen iguales que al inicio.
- **Decisiones de Sara:** aplazar o no GTM; campos de nivel y proyecto en la lista de espera de Academy; plazo de conservación de las fotos de referencia de Personaliza (Sara decidió el 17-oct que se pida una autorización expresa para obtenerlas y guardarlas; queda como siguiente fase).
- **Revisión jurídica:** retracto en el catálogo no personalizado, garantías, conservación de fotos, plazo de 90 días de la Agenda.

## Alcance

No se tocaron colores ni identidad de marca, no se hicieron pagos ni envíos reales, no se cambiaron credenciales ni precios dentro de la auditoría (los cambios de precios que pidió Sara fueron antes y aparte). Los cambios en la base de datos fueron la casilla de consentimiento del carrito abandonado (`acepta_at` y la función de envío).

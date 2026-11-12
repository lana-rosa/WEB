# Borradores para la aprobación escrita de la abogada — fase 1 (preparado el 10-nov-2026)

> **Para qué sirve:** la abogada pidió contrastar cada punto con lo que la web hace hoy y luego aprobar los textos definitivos por escrito. Aquí va, punto por punto: el texto publicado hoy, lo que la web hace en la práctica y **el texto propuesto**. **No es asesoría jurídica y nada de esto está publicado** (salvo lo que se indica «ya publicado»).
> **Cómo leerlo:** «Texto de la abogada» = copiado de su respuesta (`RESPUESTA-ABOGADA-2026-11.md`). «Borrador nuestro» = redacción del equipo para que ella la **apruebe, ajuste o rechace**. Los datos entre [corchetes] los confirma Jennifer o el chat de base de datos (inventario de proveedores).
> **Fuentes que ella pide entregar:** Ley 2439 de 2024 (reembolso por retracto en 15 días calendario); orientaciones de la SIC de 2026 (países con nivel adecuado; transmisiones y transferencias internacionales); SIC sobre el RNBD; Ley 1480 de 2011, Ley 1581 de 2012, Decreto 1074 de 2015, Ley 527 de 1999, Ley 23 de 1982, Decisión Andina 351 de 1993 y 486 de 2000, Ley 962 de 2005 (art. 28).

## Estado en una mirada

| # | Punto | Estado |
|---|---|---|
| 1 | Retracto | **Publicado el 5-nov (#618)** con el texto de la abogada y 15 días calendario |
| 2 | Titular y Mercería | Borrador abajo |
| 3 | Política de datos | Borrador abajo (necesita el inventario de proveedores del chat de base de datos) |
| 4 | Membresía | Borrador abajo |
| 5 | Patrones | Fase 2: no se publican patrones sin condiciones |
| 6 | Fotos de Personaliza y guías | Borrador abajo + cambio técnico de las guías (chat de base de datos) |
| 7 | Copias de seguridad | Borrador abajo |
| 8 | Google Calendar y Drive | Aviso previo **ya publicado** en la agenda; falta el texto en la política |
| 9 | Voz y lápiz | Aviso de la voz con su texto **ya publicado**; aviso del lápiz (texto nuestro) **ya publicado**: pide su visto bueno |
| 10 | Chat de Rosina | Borrador abajo |
| 11 | Cloudflare | Borrador abajo, sujeto a verificar |
| 12 | Google Fonts | Aprobado por ella; cambio listo, falta publicarlo con la fecha |
| 13 | Generales | Borrador abajo |

---

## 1. Retracto — publicado (referencia)
`politicas.html#cambios`, apartados 1, 2, 5 y 6 y `merceria/cambios-y-devoluciones/` apartado 4. Texto de la abogada, 15 días calendario, 7 días solo como recomendación, retracto solo para compras por internet, retracto distinto de garantía. **Pregunta pendiente:** ¿se aprueba la casilla recomendada para personalizados (información y prueba, sin presentarla como renuncia)? Hoy no existe; propuesta de texto: «Entiendo que este producto se elabora según las especificaciones que aprobé y que, por eso, no tiene derecho de retracto en los términos de la ley. Esto no afecta mi garantía legal.»

## 2. Titular y Mercería

**Hoy:** `#datos` apartado 1 dice «Responsable: Lana Rosa Crochet, NIT: 1055359694». Los términos de la Mercería dicen «Sara Loaiza Muñoz, NIT 1.055.359.694-4». El recibo de `cuenta.html` dice «Lana Rosa Crochet pertenece al Régimen Simple de Tributación».

**Texto de la abogada (identificación única, para datos, términos, cambios, membresía, proceso de compra y comprobantes):**
> Sara Loaiza Muñoz, identificada con NIT 1.055.359.694-4, quien desarrolla su actividad comercial bajo el nombre comercial Lana Rosa Crochet, con domicilio en Villamaría, Caldas.

**Texto de la abogada (pago del envío, Mercería):**
> El valor de los productos se paga directamente a Sara Loaiza Muñoz, bajo el nombre comercial Lana Rosa Crochet, mediante los medios de pago habilitados en la tienda. El costo del envío se paga contraentrega directamente a la empresa transportadora, cuando esta modalidad esté disponible. Por tanto, el pago contraentrega corresponde únicamente al servicio de transporte y no al valor de los productos.

**Borrador nuestro — retracto de insumos (apartado 4 de la política de cambios de la Mercería):**
> En los ovillos, madejas, conos y paquetes completos y sin usar, aplica el derecho de retracto en las compras por internet. Si el producto fue abierto, se analiza cada caso según su estado y las normas aplicables. Los productos que se cortan o preparan a la medida, según especificaciones individuales del consumidor, no tienen derecho de retracto en los términos de la ley. Los productos en promoción conservan la garantía legal.

**Qué cambia en la web:** la identificación en los 6 sitios (política de datos, términos, cambios, membresía, proceso de compra, recibo y comprobantes).
**Prueba de aceptación de los términos de la Mercería:** hoy hay una casilla en `js/pago.js` pero **no se guarda la versión aceptada** (solo para la política de datos y la membresía). Para guardarla se necesita un cambio en la base y la función de pago (chat de base de datos).
**Preguntas:** (a) ¿el recibo debe decir «Sara Loaiza Muñoz» o basta el nombre comercial con su NIT? (b) ¿se aprueba el borrador de insumos?
**Fase 2 (Academy):** términos propios antes de vender cupos (inscripción y pago, fechas, cancelaciones, inasistencia, reembolso, materiales, edad, datos e imágenes). Los preparamos con el chat de Academy.

## 3. Política de datos (prioridad alta)

**Hoy:** `#datos` (actualizada 12/10 y 29/10/2026) lista datos y finalidades de pedidos, personalizados, talleres, aviso de apertura, cuenta gratuita, recordatorio de carrito y comunicaciones comerciales; el apartado 9 habla de «terceros» sin nombrarlos.
**Lo que la web hace además:** cuentas con direcciones, favoritos y reseñas; bono de bienvenida del 10 % (casilla de política, una sola); correos de compra y de reseñas; Rosina (proveedor de IA); Wompi; Supabase en São Paulo (Brasil); copias en GitHub; Cloudflare; WhatsApp.

**Borrador nuestro — apartado 1 (responsable):**
> **Responsable del tratamiento:** Sara Loaiza Muñoz, identificada con NIT 1.055.359.694-4, quien desarrolla su actividad comercial bajo el nombre comercial Lana Rosa Crochet, con domicilio en Villamaría, Caldas. Dirección: Calle 10 #5-37, Centro. Correo: contacto@lanarosacrochet.com. Teléfono: 320 507 2801.

**Borrador nuestro — finalidades que se agregan:** crear y mantener la cuenta; guardar direcciones y favoritos; hacer seguimiento de los pedidos; publicar reseñas; gestionar bonos y promociones; enviar comprobantes y correos de la compra; recordar el carrito (solo con autorización); enviar publicidad (opcional, con casilla aparte); atender solicitudes de personalización; prestar los servicios digitales.

**Borrador nuestro — terceros por categoría (tabla para el apartado 9; la columna «país» la confirma el inventario del chat de base de datos):**

| Categoría | Proveedor | Qué hace con los datos | País |
|---|---|---|---|
| Base de datos y cuentas | Supabase | Cuentas, pedidos, solicitudes, almacenamiento de fotos | [Brasil (São Paulo)] |
| Pagos | Wompi | Procesa el pago; recibe correo, nombre y teléfono; los datos de la tarjeta se escriben solo en Wompi | [Colombia] |
| Acceso con Google, Calendar y Drive | Google | Inicio de sesión; calendario y copia en el Drive de la persona, solo si ella lo conecta | [EE. UU.] |
| Seguridad, entrega del sitio y medición básica | Cloudflare | Tráfico y dirección IP de las visitas | [EE. UU.] |
| Alojamiento y copias de seguridad | GitHub | Sitio y copias cifradas de la base | [EE. UU.] |
| Comunicación | WhatsApp (Meta) | Mensajes que la persona escribe | [EE. UU.] |
| Mensajes de Rosina | Anthropic | Procesa lo que se escribe en el chat | [EE. UU.] |
| Entrega | Transportadoras | Nombre, teléfono y dirección | Colombia |
| Correo | [proveedor por confirmar] | Envía comprobantes y avisos | [por confirmar] |

**Borrador nuestro — transmisión y transferencia internacional:**
> Algunos de estos proveedores procesan los datos fuera de Colombia, por cuenta de Lana Rosa Crochet (transmisión). Cuando esto ocurre, exigimos medidas de seguridad adecuadas y usamos solo los proveedores necesarios para prestar el servicio. [La abogada indica el mecanismo para Brasil (Supabase) y confirma los países con nivel adecuado.]

**Borrador nuestro — reseñas:** «Las reseñas se publican solo con tu nombre de pila o un seudónimo; nunca publicamos tu teléfono ni tu correo. Para publicar algo que te identifique, pediremos tu autorización específica.» (Hoy **por verificar** qué se muestra en cada reseña.)

**Borrador nuestro — bono de bienvenida:** separar en dos casillas: (1) política de datos, necesaria para entregar el bono; (2) novedades y publicidad, opcional. El código puede usarse también en la tienda física si las condiciones del bono lo dicen.

**Borrador nuestro — consultas y reclamos:** «Las consultas se responden en máximo diez (10) días hábiles, prorrogables por cinco (5) más; los reclamos, en máximo quince (15) días hábiles, prorrogables por ocho (8) más. Canal oficial: contacto@lanarosacrochet.com. Llevamos un registro interno para no dejar vencer los plazos.»

**Borrador nuestro — seguridad:** «Usamos conexión cifrada (HTTPS), control de accesos y permisos por rol, copias de seguridad cifradas, protección de las claves de servicio y almacenamiento privado para las fotos. Atendemos los incidentes que se presenten. Ningún sistema es totalmente seguro.»

**Borrador nuestro — conservación por categoría:** pedidos y contabilidad, el tiempo que exige la ley (libros y papeles del comerciante, 10 años, art. 28 de la Ley 962 de 2005, sin que esto obligue a guardar todos los datos personales ese tiempo); cuentas, mientras existan; fotos de Personaliza, 90 días desde su recepción; copias de seguridad, 90 días; lista de espera, hasta cumplir su fin; publicidad, hasta que se retire la autorización.

**Borrador nuestro — supresión:** verificar identidad, registrar la solicitud, eliminar, revisar copias y sistemas, confirmar a la persona y guardar la evidencia, explicando lo que se conserva por ley y por qué.

**Preguntas:** (a) ¿el mecanismo para Supabase en Brasil? (b) ¿se aprueba la tabla de terceros en esa forma? (c) ¿la política debe tener un apartado aparte para cookies por tipo (necesarias, funcionales, análisis y publicidad)?

## 4. Membresía de la agenda (antes de cobrar)

**Hoy:** `#membresia` (29/10/2026): dos casillas; apartado 5 dice que no se devuelve el periodo ya activado «en los casos previstos por la ley».
**Lo que la web hace:** la agenda (`js/agenda/membresia.js`) muestra una segunda casilla con redacción propia («Solicito que el servicio comience inmediatamente después de aprobarse mi pago y entiendo las consecuencias que esto puede tener sobre mi derecho de retracto, en los términos legalmente aplicables»), parecida pero **no igual** al texto de la abogada. Guarda versión, fecha y hora. La prueba gratis dura 7 días sin pedir medio de pago ni cobro automático.

**Texto de la abogada (segunda casilla):**
> Solicito expresamente que la prestación de la membresía comience inmediatamente después de confirmar mi pago. Reconozco que he sido informado sobre las consecuencias que el inicio de la prestación puede tener sobre mi derecho de retracto, en los términos permitidos por la legislación colombiana.

**Borrador nuestro — prueba gratis:** «La prueba gratis dura siete (7) días contados desde que creas tu cuenta (para las cuentas creadas antes del 30/10/2026, desde esa fecha). Incluye todas las hojas de la agenda. No pide medio de pago y no se convierte en pago por sí sola: no hay cobro automático. Al terminar, las hojas de la membresía se bloquean hasta que decidas pagarla, y lo que escribiste sigue guardado.»
**Borrador nuestro — apartado 5:** cambiar «no se devuelve el valor del periodo ya activado» por «no devolvemos el valor del periodo ya activado salvo en los casos que la ley exige, y siempre te corregiremos o reembolsaremos si el pago se cobró de más, no se activó el servicio o una falla nuestra impidió usarlo».
**Borrador nuestro — separar la copia gratuita:** en los apartados 1, 3, 4 y 5 decir siempre lo mismo: la cuenta gratuita incluye la copia de seguridad opcional y la conexión con Google (apartados 10 a 12 de la política de datos); la membresía de pago solo activa las hojas de la membresía; la copia gratuita no depende del vencimiento de la membresía.
**Preguntas:** (a) ¿se reemplaza la redacción de la segunda casilla por la suya, palabra por palabra? (si sí, hay que subir la versión de las condiciones en el código); (b) ¿la IP puede quedar sin guardarse?; (c) ¿se explican los 90 días de conservación solo para copias de membresías vencidas?

## 5. Patrones en PDF (fase 2)
No se publica ningún patrón hasta tener sus condiciones. Propuesta lista (no está en la web): casilla propia, sin marcar, obligatoria cuando el carrito lleve un patrón: «Acepto las condiciones de los patrones digitales y pido que se me entregue el archivo de inmediato; entiendo que, por ser un contenido digital que se entrega al instante, aplican las reglas de retracto y devolución de esas condiciones, en los términos legalmente aplicables.» **Nota:** la abogada pidió **no** afirmar que todo contenido digital queda sin retracto; el apartado 8 de `#membresia` hoy dice «no hay cambios ni devoluciones por gusto» y habrá que ajustarlo. Licencias: uso personal; uso comercial con crédito; uso comercial sin crédito; en todas, prohibido reproducir, distribuir o revender el PDF.

## 6. Fotos de Personaliza y guías de envío

**Hoy:** `#datos` apartado 4: fotos en almacenamiento privado, conservadas 90 días desde que se suben. Bucket `solicitudes-personalizadas` privado (verificado 3-nov). El bucket `guias-envio` es **público**.
**Borrador nuestro — declaración al adjuntar fotos de otras personas:** «Declaro que tengo autorización de las personas que aparecen en las fotos para compartirlas con Lana Rosa Crochet y que, si alguna es menor de edad, soy su representante legal.»
**Menores:** no aceptar fotos de menores sin un mecanismo para verificar la autorización del representante legal; propuesta: pedirla por WhatsApp o por escrito antes de iniciar el pedido.
**Galería «De la foto al amigurumi»:** autorización escrita individual por foto (web, redes, uso comercial, transformación en pieza tejida, plazo, identificación o anonimato). Formato pendiente de la abogada; hay 3 fotos que Jennifer quiere usar.
**Guías de envío:** pasar `guias-envio` a privado, enlaces firmados con vencimiento, acceso restringido y borrado cuando no se necesiten (cambio técnico prioritario, chat de base de datos).
**Preguntas:** (a) ¿el formato de autorización de la galería? (b) ¿cuánto tiempo se conservan las guías de envío?

## 7. Copias de seguridad

**Hoy:** `#datos` apartado 8: copia diaria cifrada en GitHub hasta 90 días; si alguien pide borrar sus datos, pueden permanecer cifrados en las copias hasta 90 días.
**Qué falta:** un **registro de solicitudes de supresión** para volver a aplicarlas si se restaura una copia vieja (hoy no existe como registro; el texto lo promete).
**Borrador nuestro:** agregar «Llevamos un registro de las solicitudes de supresión recibidas para volver a aplicarlas si fuera necesario restaurar una copia. Atendemos las solicitudes de supresión en los plazos del apartado de consultas y reclamos.»
**Pregunta:** ¿hace falta verificar con GitHub la región, el contrato y los subencargados antes de publicar el texto?

## 8. Google Calendar y Drive

**Ya publicado en la agenda (E30):** ventana propia antes de conectar cada servicio, aparte de la aceptación general, con seis filas (qué datos se consultan, qué se crea o guarda, para qué, qué permiso pide, cómo desconectar y qué pasa después) y una casilla de autorización. Incluye el **texto de la abogada** sobre el acceso del equipo:
> El acceso del equipo de Lana Rosa Crochet a la información sincronizada con Google está restringido. Esta información no se consulta para fines comerciales ni publicitarios. El acceso excepcional solo podrá producirse cuando sea necesario para atender una solicitud de soporte autorizada por el usuario o para cumplir una obligación legal, de acuerdo con las medidas de seguridad aplicables.

**Borrador nuestro:** poner ese mismo texto también en los apartados 10 y 12 de `#datos`, en lugar de «ninguna persona de nuestro equipo los lee, salvo que sea necesario para brindar soporte a petición suya o por una obligación legal», y unificar en la membresía que Google Calendar y la copia son gratuitos con la cuenta.
**Pregunta:** ¿los seis datos de la ventana cubren lo que pidió? Se le puede mostrar la ventana en foto.

## 9. Voz y lápiz

**Voz — ya publicado:** antes de activar el micrófono la agenda muestra la ventana «Antes de dictar» con el **texto de la abogada**:
> La función «Hablar para escribir» utiliza el servicio de reconocimiento de voz disponible en su navegador o dispositivo. El audio puede ser procesado por el proveedor de dicho servicio, de acuerdo con sus propias condiciones y políticas de privacidad. Lana Rosa Crochet no recibe ni almacena directamente las grabaciones de audio. Puede utilizar esta función de manera opcional.

**Lápiz — ya publicado (#642), la redacción es nuestra y pide su aprobación o ajuste.** La abogada solo pidió la idea («informar que los trazos son parte de la agenda y pueden sincronizarse si la persona lo habilita»). La primera vez que se activa «Lápiz» aparece la ventana «Sobre tus trazos»:
> Lo que escribas o dibujes con el lápiz es parte de tu agenda y se guarda en este aparato. Si activas la copia en tu cuenta o en Google Drive, tus trazos también viajan en esas copias. Tú decides si las activas.

**Pregunta:** ¿se aprueba ese texto o prefiere otra redacción? (está también en inglés y portugués en la agenda; si ella lo cambia, se ajustan los tres idiomas).

## 10. Chat de Rosina

**Hoy:** `#ia-chat` dice «un proveedor de inteligencia artificial (Anthropic)»; el aviso bajo el chat dice «Tu mensaje lo procesa un proveedor de inteligencia artificial. Más información». La casilla «Crear mi cuenta con este correo» va sin marcar. Rosina ya no afirma que un peluche sea seguro para bebés (E29, cerrado el 5-nov).
**Borrador nuestro — aviso bajo el chat:** «Tu mensaje lo procesa Anthropic, un proveedor externo de inteligencia artificial. No escribas datos personales. Rosina es informativa y no toma decisiones sobre ti. Más información.»
**Borrador nuestro — en `#ia-chat`:** agregar «Anthropic puede procesar estos mensajes fuera de Colombia. Rosina solo da información y recomendaciones de productos; no toma decisiones con efectos jurídicos sobre las personas.» **Pregunta:** ¿hay que revisar con Anthropic la retención y los subencargados antes de publicar?

## 11. Cloudflare Web Analytics

**Hoy:** `#cookies` lo declara como medición sin cookies. La abogada permite seguir **sujeto a verificar** con las solicitudes de red que no usa cookies ni datos personales (ojo con la IP).
**Pendiente:** hacer esa verificación (fase 2). Si no se confirma, se apaga en Cloudflare. **Pregunta:** ¿mientras tanto basta el párrafo actual?

## 12. «Google Fonts» en cookies — aprobado
**Hoy** (`#cookies`, apartado 3): «entre ellos Google (Google Analytics y Google Fonts)». **Cambio:** quitar «y Google Fonts» (las fuentes salen de `/fonts/`) y actualizar la fecha de la política. El chat de Universo/Academy ya lo tenía en un PR sin fusionar: lo publicamos aquí con el visto bueno de Jennifer. La fecha de cookies ya quedó unificada.

## 13. Generales
- **RNBD:** como persona natural comerciante no está obligada a inscribirse solo por eso; igual cumple la Ley 1581. **Borrador:** una frase en la política que lo diga.
- **Menores en talleres:** inscribe el representante; autorización de datos y otra aparte para fotos y videos; escuchar al menor según su madurez (se redacta con la Academy).
- **Cookies:** necesarias, funcionales, de análisis y publicitarias; rechazar tan fácil como aceptar (hoy el aviso tiene Aceptar, Rechazar y Configurar al mismo nivel).
- **Recibos:** revisar con la contadora qué documento se expide y qué datos se piden.
- **Personajes:** «inspirado, no oficial» no es una autorización; priorizar personajes propios, no usar nombres de franquicias como oficiales ni logotipos, revisar pieza por pieza (lo trabaja el chat de Tienda).
- **Realidad aumentada:** aviso propio verificado antes de publicar un modelo (chat de Universo).
- **Fechas y versiones:** al aprobar, actualizar la fecha de cada política, guardar copia de las versiones anteriores y, si cambian los textos de las casillas, subir las versiones en el código (chat de base de datos).

## 14. Registros ante la SIC: ® y textos de propiedad intelectual (propuesta de Jennifer, 10-nov-2026)

**Soportes que Jennifer envió:** (1) marca mixta «LR Lana Rosa Crochet», certificado n.º 804997, resolución 102668 del 4-dic-2025, vigente hasta el 21-ene-2036, clases 24, 25, 28 y 41, titular Sara Loaiza Muñoz. (2) Rosina: **diseño industrial «Personaje»** (no es marca), resolución 82895, vigente del 29-jul-2025 al 29-jul-2035.
**Decidido por Jennifer:** el ® va solo en el logo registrado «LR Lana Rosa Crochet», no en las variantes de Mercería, Academy ni en el logo animado, y nunca junto a Rosina. **Duda técnica abierta:** el logo que hoy tiene la web (ovejita con «Lana Rosa Crochet») no muestra las letras LR de la marca mixta; Jennifer debe confirmar si es el mismo.

**Borrador nuestro 1 — pie de todas las páginas (junto al ©):**
> © 2026 Lana Rosa Crochet®. Marca registrada. El diseño de Rosina está registrado ante la SIC.

(Decidido por Jennifer, 10-nov: esta es la versión final del pie, sin el nombre de la titular y sin «ante la SIC» después de «Marca registrada». En la sección de políticas la titular queda como recomendó la abogada.)

**Borrador nuestro 2 — sección nueva en las políticas «Propiedad intelectual y marcas registradas»:**
> **Marcas y diseños registrados.** La marca mixta «LR Lana Rosa Crochet» está registrada ante la Superintendencia de Industria y Comercio (SIC) a nombre de Sara Loaiza Muñoz: certificado n.º 804997, resolución 102668 del 4 de diciembre de 2025, vigente hasta el 21 de enero de 2036, en las clases 24, 25, 28 y 41. El diseño de Rosina está registrado ante la SIC como diseño industrial «Personaje»: resolución 82895, vigente del 29 de julio de 2025 al 29 de julio de 2035.
> **Uso no autorizado.** Rosina, sus amigos, los stickers, fondos de pantalla, patrones, textos y fotografías de este sitio son de Lana Rosa Crochet. Sin permiso previo y por escrito no se pueden copiar, reproducir, modificar, distribuir ni vender, ni usarse en productos o publicidad propios o de terceros.
> **Permisos y denuncias.** Para pedir un permiso o informar sobre una copia escribe a contacto@lanarosacrochet.com.

**Borrador nuestro 3 — nota pequeña en «Conoce a Rosina»:**
> Rosina es un diseño original de Lana Rosa Crochet, registrado ante la SIC.

**Preguntas para la abogada:** (a) ¿puede ponerse «®» junto al nombre escrito «Lana Rosa Crochet» en el pie, si lo registrado es una marca mixta (logo con LR y palabras)? (b) ¿«diseño registrado ante la SIC» es la forma correcta de decir el registro de Rosina, que es diseño industrial y no marca? (c) ¿las variantes de casa (Mercería, Academy, Agenda) pueden llevar ®? (d) registrar «Rosina» y el nombre de la agenda como marca (clases 9 y 41) y evaluar la clase 35 (venta de productos). (e) ¿puede el texto de «uso no autorizado» incluir el uso personal libre de los recursos gratuitos? No se ponen números de registro en cada página ni en cada producto.

## 15. Casillas del pago de los amigurumis personalizados (propuesta del chat de pagos, 11-nov-2026)

**Hoy en la web:** al pagar hay una casilla de política de datos y de envíos y cambios, otra para confirmar la dirección y la de cuenta (sin marcar). El chat de pagos tiene preparado, **apagado y sin publicar**, un cambio que las reúne (`herramientas/borradores/casillas-pago.patch`). No se publica hasta su respuesta.

**Propuesta A — del chat de pagos (una sola casilla con desplegable):**
> ☐ Acepto las condiciones de mi compra: la política de tratamiento de datos, la política de envíos y cambios, que mi amigurumi personalizado no tiene derecho de retracto y que mi dirección de envío es correcta.
> **Ver el texto completo:** (1) Acepto la política de tratamiento de datos y la política de envíos y cambios. (2) Entiendo que este producto se hace a mi medida y por eso no tiene derecho de retracto; conserva la garantía legal. (3) Confirmo que mi dirección de envío es correcta y, en caso de errores, asumiré los posibles costos de transporte adicionales. Se guarda con el pedido: fecha, hora y versión del texto. Sin marcarla no se puede pagar.

**Propuesta B — recomendación consultada por Jennifer (dos casillas), para que la abogada decida.** Esta redacción **no es de la abogada**: es una opinión que Jennifer recibió y que cita la Ley 1480 (arts. 47 y 50) y la Ley 1581; **no verificamos las citas**, la abogada debe confirmarlas.
> **Casilla 1 — datos:** ☐ Autorizo el tratamiento de mis datos personales conforme a la [Política de tratamiento de datos personales]. (Junto a ella, la información que exige la Ley 1581: finalidades, derechos de la titular, identificación y contacto del responsable; no basta con un enlace.)
> **Casilla 2 — condiciones de compra:** ☐ He leído y acepto las condiciones de mi compra, incluida la información sobre la excepción al derecho de retracto para mi amigurumi personalizado y la política de envíos y cambios. Confirmo que mi dirección de envío es correcta.
> **Ver el texto completo (condiciones de compra):** 1. He leído y acepto la política de envíos y cambios de Lana Rosa Crochet. 2. Entiendo que mi amigurumi se confeccionará conforme a mis especificaciones y que, por tratarse de un producto claramente personalizado, está comprendido en la excepción al derecho de retracto prevista en el numeral 3 del artículo 47 de la Ley 1480 de 2011. 3. Entiendo que esta excepción no afecta la garantía legal ni los demás derechos que me reconoce la legislación de protección al consumidor. 4. Confirmo que la dirección de envío proporcionada es correcta. Si suministro una dirección incorrecta y esto ocasiona un nuevo envío, los costos adicionales de transporte que correspondan podrán ser asumidos por mí, previa información.

**Diferencias entre A y B:** B separa los datos de las condiciones de compra (sigue siendo menos de tres casillas); dice «está comprendido en la excepción» en vez de «no tiene derecho de retracto» (información, no renuncia); limita los costos de transporte al error de dirección de la propia clienta; menciona la excepción también en la frase corta. Evitar expresiones como «renuncio al derecho de retracto», «acepto no tener derecho a reclamar» o «no podré solicitar devoluciones bajo ninguna circunstancia». Coincide con lo que la abogada ya dijo en su respuesta (punto 1: la casilla para personalizados es recomendada, como información y prueba, **sin presentarla como renuncia**; punto 6: casillas separadas para datos y fotos).

**Lo que se guardaría como prueba (propuesta, para que ella lo apruebe):** identificador del pedido, cuenta asociada, fecha y hora, estado de cada casilla (marcada o no), versión exacta de las condiciones, versión de la política de datos y las especificaciones del amigurumi del pedido; conservar las versiones anteriores de los textos. Hoy se guarda fecha, hora y versión; el resto lo implementa el chat de pagos.

**Preguntas para la abogada:**
1. ¿Dos casillas (datos y condiciones de compra) o una sola con desplegable? Si es una sola, ¿sirve como constancia de la autorización de datos?
2. ¿El texto del retracto queda como en B («está comprendido en la excepción…») o lo redacta ella?
3. ¿La frase corta junto a la casilla debe mencionar la excepción al retracto, o basta con el texto completo desplegable? (La opinión consultada dice que sí debe mencionarla.)
4. ¿El desplegable cumple con la información previa al pago (art. 50 de la Ley 1480)?
5. ¿Qué otros datos de la prueba de aceptación son necesarios?

## 16. Medidas del cuerpo y alergias de las clientas en la agenda (aviso del chat de la agenda, 11-nov-2026, PR #725)

**Qué hace la web hoy:** en la hoja de clientas, cada clienta tiene un desplegable «Medidas y gustos» donde la persona puede guardar medidas del cuerpo (busto, cintura, cadera, largo, cabeza), colores que le gustan o evita, fibras, **alergias o cuidados con los materiales** y notas. Esos datos viven en la agenda de la persona, y entran en las copias: el archivo de copia, la copia en la cuenta (Supabase) y la sincronización con Google Drive. **Hoy el único aviso** dentro del desplegable es: «Guarda estos datos solo si tu clienta te dio permiso.»

**Qué dice la política hoy** (`#datos`, apartado 11, «Qué guardamos»): la copia incluye «proyectos, materiales, pedidos, clientas, ventas, finanzas, tarjetas, deudas, metas, entre otros» y «si la persona escribe datos de terceras personas, como el nombre, el WhatsApp o el cumpleaños de sus clientas, es responsable de contar con la autorización para tenerlos». **No** menciona medidas del cuerpo ni alergias, ni que puedan ser datos delicados (de salud).

**Borrador nuestro — aviso en la agenda** (para que lo apruebe o ajuste; puede mostrarse una vez, como el aviso del lápiz):
> Las medidas del cuerpo y las alergias o cuidados de tu clienta son datos personales delicados. Guárdalos solo si ella te dio permiso, úsalos únicamente para hacer su pedido y bórralos cuando ya no los necesites. Tú eres quien responde por esos datos: Lana Rosa solo los guarda como parte de tu agenda.

**Borrador nuestro — para el apartado 11 de la política** (después de la frase de terceras personas):
> Si la persona guarda en su agenda datos delicados de otras personas, como medidas del cuerpo o alergias, debe contar con el permiso expreso de esa persona y usarlos solo para atender su pedido. La persona que los guarda es la responsable de esos datos; Lana Rosa Crochet los almacena únicamente como parte de la copia de la agenda de quien los escribió, no los usa para ninguna otra finalidad y no los comparte.

**Preguntas para la abogada:**
1. ¿Las medidas del cuerpo y las alergias o cuidados son «datos sensibles» según la Ley 1581 (art. 5)? ¿Qué exige guardarlos y qué se debe decir a quien los guarda?
2. ¿Quién es el responsable y quién el encargado? Nuestra lectura: la tejedora que usa la agenda es la responsable de los datos de sus clientas, y Lana Rosa Crochet solo presta el almacenamiento (copia en la cuenta) como encargada; en Google Drive los datos no pasan por nuestros servidores. ¿Es correcta?
3. ¿Basta el aviso dentro del desplegable, o debe haber una ventana o casilla la primera vez que se usa (como el aviso del lápiz)?
4. ¿La política debe decir expresamente que la agenda puede contener datos delicados de terceras personas, como en el borrador?
5. ¿Hay que ofrecer algo para el borrado de esos datos (por ejemplo, al borrar la clienta se borran sus medidas y alergias)? Hoy borrar el renglón de la clienta las borra con él; está por verificar que también salgan de las copias antiguas (ver punto 7, copias).

## Lo que necesito de la abogada (resumen)
1. Aprobación (o ajuste) de los textos marcados «borrador nuestro» de los puntos 2, 3, 4, 6, 7, 8, 10 y 13.
2. Mecanismo para Supabase en Brasil y países con nivel adecuado (inventario de proveedores).
3. Formato de autorización de fotos de la galería y de menores.
4. Visto bueno del aviso del lápiz (punto 9).
5. Confirmación de que se puede publicar «Google Fonts» fuera y la nueva fecha.

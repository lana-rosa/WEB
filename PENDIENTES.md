# Pendientes de la página web — Lana Rosa Crochet

Última revisión: 26 de septiembre de 2026 (actualizada con la auditoría).
Marca con `[x]` lo que ya esté hecho y agrega abajo lo nuevo.

---

## 🔴 Urgente (lo hace Sara)

- [x] **Cuentas de clientes activas (29-sep-2026).** Correo con código y enlace (SMTP de Resend, plantillas en español) y entrada con Google funcionando. Pasos y plantillas en `herramientas/cuentas-clientes/`.
  - [x] Verificación de marca de la app enviada en Google Auth Platform (Centro de verificación); Google avisa por correo cuando la apruebe.
  - [x] Clientes de prueba revisados (29-sep-2026): no quedó ninguno; la única cuenta es la de Jennifer, vinculada a su cliente ya existente.
- [ ] **Subir los productos de la mercería al ERP (Supabase) con sus existencias.**
  Hoy los 33 productos tienen existencias en 0. Mientras no haya ninguno disponible, la mercería muestra el aviso "Muy pronto" y oculta los productos agotados. Cuando haya al menos un producto con existencias, el aviso desaparece solo y el catálogo se muestra, sin cambiar código.
  - [ ] **Cuando la mercería ya tenga productos:** en `rosina.html` ("¿Qué hace Rosina?" → "En insumos"), cambiar el enlace "Ir a la tienda →" por "Ir a la mercería →" (`merceria.html`). Sara lo aprobó el 26-sep-2026.
- [ ] **Armar el "kit de principiante" con precio fijo.** El botón "Quiero el kit completo de principiante" (Rincón de Rosina → Checklist) hoy pregunta el precio por WhatsApp. Con el precio definido, se muestra en el botón.

## 🟡 Necesito algo de Sara para poder hacerlo

- [ ] **Autorización de 3 fotos para la galería "De la foto al amigurumi" del inicio:** vestido blanco con balaca, señor de canas con camisa blanca y señora saludando. Con la autorización se agregan (Sara tiene las fotos sin flores).
- [x] **Google Tag Manager instalado** en todas las páginas (contenedor `GTM-M3MQ7XZD`, 27-sep-2026). Los generadores del glosario y las paletas lo heredan de `rosina.html`.
- [x] **Google Analytics 4** conectado por Sara en Tag Manager (ID de medición `G-RSVSQV8Y9B`, 27-sep-2026). Para comprobarlo: Analytics → Informes → Tiempo real.
- [x] **Search Console:** el sitemap aparece "Correcto" (27-sep-2026) y Analytics ya registra visitas en Tiempo real. Si Google sigue mostrando 11 páginas descubiertas, reenviar `sitemap.xml` (ahora tiene 15). Search Console quedó vinculado con Analytics (27-sep-2026); los datos de búsqueda salen en Analytics → Informes → Search Console.
- [ ] **Conectar las paletas con las lanas reales.** Sara pasa la lista de colores que maneja o agrega el código de color (por ejemplo `#E74E96`) a cada lana en el inventario. Así cada paleta puede mostrar las lanas de la mercería que más se parecen, con foto, precio y carrito.
- [ ] **Mini-guía por correo "5 días para tejer tu primer amigurumi".** Sirve para armar lista de correos antes de vender Pattern AI o cursos. Sara elige y crea la cuenta en una herramienta de correo (MailerLite o Brevo, con plan gratis); Claude escribe los 5 correos y pone el formulario en la web.
- [ ] **Revisar las abreviaturas en chino y ruso** (Rincón → Abreviaturas) con una tejedora que hable esos idiomas.
- [ ] **Revisar el glosario** (`glosario-rosina.html`) para que coincida con cómo se enseña en los talleres. Por ejemplo, las cadenetas de giro: 1 para punto bajo, 2 para medio punto alto y 3 para punto alto.
- [ ] **Ilustraciones de Rosina en mayor tamaño.** Las poses de la hoja de stickers venían pequeñas, así que los fondos "Primero café", "Temporada de tejer", "Tejer es mi terapia" y "Rosina por todas partes" se ven un poco menos nítidos. Con las ilustraciones grandes se regeneran.
- [ ] **Ilustraciones nuevas (opcional):** Rosina haciendo cada punto, para el glosario, y versiones de Rosina solo con líneas, para el libro para colorear.
- [ ] **Decidir cómo cobrar productos digitales** (Hotmart, o Nequi por WhatsApp) antes de crear material de pago.

- [ ] **Prioridad 3 de la auditoría (marca), en pausa hasta tener la información** (Sara decidió saltarla el 27-sep-2026 y retomarla cuando la tenga):
  - Equipo ("Las mujeres detrás de cada puntada"): foto y frase corta de Sara, Jennifer, Camila y las tejedoras que quieran aparecer.
  - Proyectos especiales / empresas: qué se ofrece, cantidades mínimas, tiempos y fotos de trabajos anteriores. WhatsApp: "Hola Lana Rosa. Quiero consultar por un proyecto especial para mi empresa/evento."
  - Sostenibilidad ("Nuestro hilo también tiene una historia"): lo que hacen hoy y lo que están construyendo, solo con información real.

- [ ] **Pagos en línea dentro de la web (Wompi).** Ya está construido: botón en el carrito, formulario de envío, página de gracias, funciones de Supabase y registro automático en el ERP (pedido de Tienda virtual, pago y asiento en bancos). Falta que Sara cree/abra la cuenta de Wompi, guarde las tres llaves en Supabase (Edge Functions → Secrets), registre la URL de eventos en Wompi y luego Claude enciende `PAGOS_ACTIVOS` y se prueba con la tarjeta de pruebas. Pasos en `herramientas/cuentas-clientes/README.md`.
  - [ ] Revisar tarifas de envío en el ERP (`tarifas_envio_ciudad`): hoy "Otra ciudad" está en $15.000 y la web dice $18.000; también hay tarifas para Chinchiná, Neira y Palestina.
  - [ ] ERP → Bancos: crear la cuenta bancaria y asignar los medios de pago para que el dinero de la web no quede en "sin asignar".

- [x] **Inicio editorial publicado (27-sep-2026):** 14 secciones con fotos grandes, mascotas, historias reales, mensajes de clientas, Rosina tejida, feria y equipo.

- [x] **Categorías de la tienda y la mercería en vista propia (30-sep-2026).** Al elegir una categoría (tarjetas, enlaces `#peluches`, menú "Ir a categoría") se muestra solo esa categoría, con enlace "← Todas las categorías", sin desplazarse por las demás. Igual en la mercería (Lanas, Hilos).

- [x] **Dirección en la web:** Sara decidió dejarla como está (27-sep-2026), aunque en Google Maps el perfil quedó sin ubicación (solo envíos).
- [ ] **Perfil de Google (lo hace Sara):** revisar en 1 o 2 semanas que vuelva a salir al buscar "Lana Rosa Crochet" y que se reactiven las reseñas, después de corregir la fecha de apertura; agregar horario y áreas de servicio si faltan.
- [ ] **Foto de la feria en el Inicio:** confirmar si se ponen los nombres de las dos integrantes.

## 📝 Observaciones de Sara del 28-sep-2026

Hecho (28-sep-2026):
- [x] Inicio: nuevo orden (tienda primero), "¿Qué podemos tejer?" con fotos de producto (flores, peluche y otra foto de persona), sin "De la foto al amigurumi", menos espacio en "De una historia nace un tejido", 13 historias con su texto, del mismo tamaño y en el orden pedido, foto de Rosina más iluminada y "Lo que dicen nuestros clientes".
- [x] Tienda: fotos de productos más grandes y tarjetas uniformes.
- [x] Personaliza: textos nuevos de las respuestas rápidas, peluches desde $35.000, "De la foto al amigurumi" (Betty, los novios, la pareja) y "Otros personalizados" lado a lado con desplazamiento.
- [x] Mercería: un solo aviso "Muy pronto", sin "Pedir por WhatsApp"; el catálogo y "¿Cómo se paga?" aparecen solos cuando haya existencias.
- [x] Rincón: logo arriba y contacto abajo en todo lo que se imprime o se guarda en PDF (`herramientas/marca_impresion.py`); abreviaturas sin fila fija; contador de vueltas digital como primera calculadora.
- [x] Agenda: en celular cada renglón es una tarjeta (sin columna fija); "Agregar renglón" en todas las tablas; lista de compras con productos de la tienda; "Mi año tejiendo" con varios años; acceso al contador desde la ficha de proyecto.
- [x] Sobre nosotras: texto nuevo y espacios más compactos.
- [x] Menú: "Personaliza el tuyo" sin destacar, al lado de "Tienda".

Falta (necesito algo de Sara):
- [ ] **Enlaces de YouTube** para el glosario (por término) y para la Revista (por artículo). Sara los pasa.
- [ ] **Imágenes de la Revista:** Sara envía las imágenes de cada artículo.
- [ ] **Comentarios nuevos de clientes** para "Lo que dicen nuestros clientes" (capturas o textos reales, sin inventar).
- [ ] **Medios de pago Wompi, PayPal y Google Pay:** Sara abre las cuentas (Wompi con RUT y cuenta bancaria; PayPal empresarial). Las llaves secretas van solo en Supabase, nunca en el chat. Después se integran en el carrito.

## 🟢 Ideas aprobadas o propuestas que faltan por hacer (Claude)

### Agenda de Rosina pro (`agenda-rosina.html`), aprobada el 27-sep-2026, en este orden
Sara decidió (28-sep-2026): **toda la agenda es gratis**, con todas sus hojas. Desde el 30-sep-2026 la agenda es gratis **solo con cuenta**: quien no ha iniciado sesión ve una vista previa bloqueada (candado en `agenda-rosina.html`, solo en el navegador). El resto del Rincón de Rosina sigue abierto. Más adelante se puede hacer una mini app con este servicio.
- [x] 1. Inventario de lanas e hilos.
- [x] 2. Mis agujas (calibres de 2 a 10 mm).
- [x] 3. Lista de compras con envío por WhatsApp.
- [x] 4. Proyectos en fila (por empezar, tejiendo, terminado).
- [x] 5. Mi colección de patrones.
- [x] 6. Mi año tejiendo (una página por mes).
- [x] 7. Fechas especiales (sin Navidad, santos ni Halloween).
- [x] 8. Ficha de cliente.
- [x] 9. Mis ventas del mes (conectar con la calculadora de costos).
- [x] 10. Catálogo de precios.
- [x] 11. Ferias y mercados.
- [x] 12. Diario de tejido.
- [x] 13. Registro de pausas activas.
- [x] 14. Lo que aprendí.
- [x] Hojas plegables: se ve el título y se abre al tocarlo. Menú desplegable "Ir a una hoja".
- [x] Extras: portada con nombre, índice (menú "Ir a una hoja") y copia de seguridad (guardar y cargar una copia).
- [x] Imprimir hoja por hoja, llena o en blanco.

### Calculadoras de Rosina (`calculadoras-rosina.html`), página propia desde el 28-sep-2026
- [x] 1. Varios hilos en la calculadora de costos y compartir el resultado (copiar o WhatsApp).
- [x] 2. Contador con varias piezas, pantalla siempre encendida y botones más grandes.
- [x] 3. Esferas y cabezas: patrón vuelta por vuelta (por tamaño o por puntos, redonda o alargada), copiar y enviar al contador.
- [x] 4. Agujas y grosores: equivalencias mm, EE. UU. y Reino Unido, y qué aguja usar según el grosor (y para amigurumi).
- [x] 5. Se guarda lo que escriben en todas las calculadoras; botón para borrar los datos guardados.

### Material de Rosina
- [ ] Libro para colorear imprimible (necesita las ilustraciones solo con líneas).
- [ ] Cuaderno de práctica de puntos básicos, punto por punto con Rosina (freemium o de bajo costo).
- [ ] Mini app de la agenda (idea a futuro). La agenda en la web queda gratis (con cuenta) con todas sus hojas.
- [ ] **Botón "Invítale un café a Rosina": diseño listo y guardado, sin publicar** (27-sep-2026). Sara lo va a hablar con el equipo. Está en `herramientas/borradores/cafe-rosina.patch` (sección al final del Rincón con valores sugeridos de $3.000, $6.000 y $12.000, llave de Nequi/Bre-B para copiar y aviso por WhatsApp). Para publicarlo: `git apply herramientas/borradores/cafe-rosina.patch`.
- [ ] Opcional: poner también la imagen "Conoce a Rosina" al principio de `rosina.html` (se ofreció; Sara no ha respondido).

### Que la web aparezca más en Google (SEO)
- [x] Primeros 3 artículos de la Revista pensados para búsquedas (27-sep-2026): "Cómo empezar a tejer crochet desde cero", "Qué materiales necesitas para tu primer amigurumi" y "Cómo pedir un amigurumi personalizado a partir de una foto".
- [ ] **Un artículo por semana (rutina de los miércoles):** temas y reglas en `herramientas/revista/temas.md`.
- [ ] Patrones gratis (lo que más visitas trae en crochet).
- [x] Google Merchant Center: feed en vivo listo (27-sep-2026) con 40 diseños propios (sin personajes de marcas), GTIN de GS1 y enlace directo a cada producto (`tienda.html?producto=ID`). Ver `herramientas/google-merchant/README.md`.
- [x] **Merchant Center configurado por Sara** (27-sep-2026): cuenta 5859686234, fuente "PRODUCTS SOURCE 1" con el feed (40 productos, sin problemas), envío y devoluciones listos.
- [ ] Revisar en unos días que Google apruebe los productos. Si alguno sale "Rechazado" o "Requiere atención", corregirlo.
- [x] Títulos mejorados para Google en los 40 productos (27-sep-2026) y aviso "no es un producto oficial" en los 30 productos de personaje.
- [ ] **Revisión semanal (lunes):** clasificar productos nuevos de la tienda (diseño propio → Google Shopping; personaje → aviso). Ver `herramientas/google-merchant/README.md`.
- [x] Envío en Merchant Center: tarifa fija de $18.000 COP (27-sep-2026). La web dice lo mismo en Precios, Preguntas frecuentes, Políticas, Tienda, Mercería, Personaliza y `llms.txt`: $18.000 a otras ciudades, $13.000 a Manizales y $8.000 dentro de Villamaría.
- [x] Devoluciones en Merchant Center: solo productos defectuosos, sin cambios, con la URL `politicas.html#cambios` (27-sep-2026).
- [x] 7 pines para Pinterest listos en `herramientas/pinterest/` (27-sep-2026), con títulos, descripciones y enlaces. Sara los sube a su cuenta de Pinterest.

### Ingresos
- [ ] Productos digitales pagos: patrones PDF, agenda completa, packs extra de stickers.
- [ ] Patrocinio de una marca de hilos para "Aprobado por Rosina" (cuando haya visitas que mostrar; debe decir que es patrocinado).
- [ ] Google AdSense: **no por ahora.** Paga poco con pocas visitas, hace la página lenta y puede mostrar anuncios de la competencia. Retomarlo con decenas de miles de visitas al mes.

## 📋 Auditoría de la web (recibida el 26-sep-2026) — por implementar

El documento completo lo tiene Sara. Resumen del análisis de viabilidad: casi todo es viable sobre la web actual, sin cambiar la arquitectura. Orden acordado: Prioridad 1 (conversión) → 2 (ecosistema) → 3 (marca) → 4 (optimización). Se muestran capturas antes de publicar la Prioridad 1.

**Preguntas abiertas para Sara (responder antes de empezar la Prioridad 1):**
- [x] **Tiempo de entrega real.** Respuesta de Sara: "depende". Se unificó en Personaliza, Precios, Preguntas frecuentes y `llms.txt` con la frase de la auditoría. (La tienda mantiene su propio texto para productos del catálogo: "1 semana después de confirmar el pago, o envío inmediato según disponibilidad".) Antes decía: Hay una contradicción: Personaliza y Precios dicen "se envía 1 semana después de confirmado el pago", y las Preguntas frecuentes dicen "depende de la complejidad y de la fila de pedidos". La auditoría propone la segunda.
- [x] **Pop-up del 10 %.** Decisión de Sara (27-sep-2026): el bono aplica solo a la primera compra en la tienda o la mercería (no a personalizados ni talleres). Aparece a los 20 segundos o al bajar media página, y el botón de WhatsApp lleva el código escrito. Los 2 bonos entregados antes (14 y 24 de septiembre) se respetan con las condiciones originales: 10 % en cualquier primera compra.
- [x] ~~**Casilla de autorización en el formulario de Personaliza**~~ Respuesta de Sara: **no por ahora**; la autorización se sigue pidiendo por WhatsApp. Era: ("Autorizo compartir la historia y las fotos"). Toca el formulario y Supabase.
- [x] **Menú:** Decisión de Sara (27-sep-2026): mismo menú reordenado (Tienda · Mercería · Aprende · Revista · Rincón de Rosina · Sobre nosotras) con "Personaliza el tuyo" como botón rosado destacado. En celular, el panel se agrupa en Comprar / Aprender / Universo Lana Rosa / Ayuda.
- [ ] **Proyectos especiales:** qué se ofrece a empresas, cantidades mínimas, tiempos y fotos de trabajos anteriores.
- [ ] **Sostenibilidad y "las tejedoras":** solo con información real. Hoy la web no tiene datos de sostenibilidad ni fotos o información de las tejedoras.
- [x] **"Rosina te recuerda" (pausas activas):** hecho, está en el índice del Rincón. Ya existe el artículo de la Revista con la ilustración; se puede reutilizar en el Rincón.

**Notas del análisis:**
- "Foto → amigurumi" ya existe en el inicio ("Convierte cualquier foto…", con `img/triptico-testimonios.jpg`): mejorarlo, no duplicarlo.
- "Ideas que cobraron vida" ya tiene fotos de clientes (`img/testimonios/`): evolucionarla a "Historias que tejimos".
- "Tu personaje favorito": usar una redacción cuidadosa por derechos de autor, por ejemplo "Un personaje inspirado en lo que amas".
- El formulario ofrece amigurumis de 10 cm, pero Precios solo menciona 13, 15 y 20 cm: unificar.
- WhatsApp según la página: el mensaje "Ya envié mi solicitud" solo debe aparecer después de enviar el formulario de Personaliza.
- Evitar que el inicio quede demasiado largo: integrar secciones en vez de sumarlas.
- Analytics depende de que Sara cree las cuentas (ver arriba).

## ✅ Ya hecho (referencia)

- Rincón de Rosina (`recursos-rosina.html`) con banner nuevo con logo:
  - 26 stickers para WhatsApp y 9 fondos de pantalla en 4 tamaños.
  - Checklist del primer amigurumi.
  - Abreviaturas en 8 idiomas.
  - Calculadoras: aumentos, muestra explicada paso a paso, lana y contador.
  - Agenda imprimible.
- Glosario ilustrado (`glosario-rosina.html`) con 30 términos.
- Paletas de colores (`paletas-rosina.html`): 22 paletas (7 de tonos de un mismo color; sin la paleta Lana Rosa), creador "Arma tu paleta con Rosina" (elige un color y genera tonos, colores vecinos o contraste) y guardar como imagen.
- Pedidos por WhatsApp desde paletas, checklist y calculadora de lana. Los mensajes empiezan con "Vengo del Rincón de Rosina 🐑".
- "Rincón de Rosina" en el menú de todas las páginas; banner "Conoce a Rosina" en el inicio; sin la sección de video vacía.
- Imágenes optimizadas: las páginas pesan entre 40 % y 80 % menos al abrir.
- Secuencia de 7 historias de Instagram para anunciar el material (entregada en el chat).
- Revista: artículo "Pausas activas para tejedoras, con Rosina", con la ilustración numerada.
- Conoce a Rosina: enlaces a Aprende y a la Tienda en sus roles, y sticker en "Su personalidad".
- Abreviaturas: la columna de español queda fija al desplazar la tabla.
- Glosario: nuevo dibujo de la aguja de crochet.
- Mercería: aviso "Muy pronto" mientras no haya productos con existencias.
- Calculadora "💰 Calculadora de costos" (antes "Precio de tu tejido") en el Rincón de Rosina (materiales + tiempo + gastos del taller + ganancia + comisión opcional, con desglose y costo mínimo).
- Prioridad 1 de la auditoría (conversión), publicada el 27-sep-2026:
  - Inicio: "Personaliza el tuyo" como botón principal y "¿Qué podemos tejer para ti?" con 6 ideas.
  - Inicio: "De la foto al amigurumi" con 7 fotos autorizadas, "De una historia nace un tejido" (5 pasos) e "Historias que tejimos" con enlace a las reseñas de Google.
  - Personaliza: respuestas rápidas, proceso en 6 pasos, tamaños de referencia, preselección por `?idea=` y WhatsApp después de enviar el formulario.
  - Tiempo de entrega unificado ("depende") y mensajes de WhatsApp según la página.
- Prioridad 2 de la auditoría (conexión del ecosistema), publicada el 27-sep-2026:
  - Tienda: franja "¿Quieres uno hecho especialmente para ti?" y botón "Personalízalo" en cada producto (abre Personaliza con el diseño como inspiración). Se arregló el estilo del botón "Agregar al carrito" de la ficha.
  - Mercería: "Crea tu propio proyecto" (principiante, amigurumi, color, aprender, calcular) y enlaces a Revista y Rincón.
  - Academy: organizada en Aprende / Crea / Conecta, con enlaces a Mercería, Rincón, paletas y pausas activas.
  - Revista: filtro por 7 categorías (las vacías dicen "Muy pronto"). Para un artículo nuevo: agregar `data-categorias="..."` al `<article>`. Imagen de pausas activas más pequeña.
  - Rincón de Rosina: índice en 5 grupos (te enseña, te acompaña, te recuerda, recursos gratuitos, herramientas).
  - Conoce a Rosina: sección "¿Por qué Rosina nos acompaña?".
- Prioridad 4 de la auditoría (optimización), 27-sep-2026:
  - Precios, Preguntas frecuentes, Personaliza y `llms.txt` con los mismos tamaños (amigurumis de 10, 13, 15 y 20 cm; llaveros de 4 a 6 cm; peluches de 12 a 32 cm) y el mismo texto del taller.
  - Preguntas frecuentes nuevas: ubicación (Villamaría, junto a Manizales), medios de pago y talleres.
  - SEO: títulos y descripciones con "Manizales / Villamaría", datos estructurados (zona de servicio, lugar del taller, servicio de personalizados), `lastmod` en el sitemap y `noindex` en la página 404.
  - Velocidad: imágenes en WebP con tamaños para celular (el inicio pasó de 825 KB a unos 550 KB; Personaliza de 244 a 114 KB).
  - Celular: se quitó la sombra del carrito que se veía en el borde derecho.
- Menos texto en la web (27-sep-2026): Inicio (605 → 327 palabras), Personaliza, Aprende, Sobre nosotras y el Rincón de Rosina (secciones plegables con "Ver…", de 19 a unas 6 pantallas en celular).

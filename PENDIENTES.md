# Pendientes de la página web — Lana Rosa Crochet

Última revisión: 26 de septiembre de 2026 (actualizada con la auditoría).
Marca con `[x]` lo que ya esté hecho y agrega abajo lo nuevo.

---

## 🔴 Urgente (lo hace Sara)

- [ ] **Subir los productos de la mercería al ERP (Supabase) con sus existencias.**
  Hoy los 33 productos tienen existencias en 0. Mientras no haya ninguno disponible, la mercería muestra el aviso "Muy pronto" y oculta los productos agotados. Cuando haya al menos un producto con existencias, el aviso desaparece solo y el catálogo se muestra, sin cambiar código.
- [ ] **Armar el "kit de principiante" con precio fijo.** El botón "Quiero el kit completo de principiante" (Rincón de Rosina → Checklist) hoy pregunta el precio por WhatsApp. Con el precio definido, se muestra en el botón.

## 🟡 Necesito algo de Sara para poder hacerlo

- [ ] **Google Search Console y Google Analytics.** Hoy la web no tiene ninguna medición. Sara crea las cuentas y pasa el código de verificación y el ID de medición; Claude los instala en todas las páginas.
- [ ] **Conectar las paletas con las lanas reales.** Sara pasa la lista de colores que maneja o agrega el código de color (por ejemplo `#E74E96`) a cada lana en el inventario. Así cada paleta puede mostrar las lanas de la mercería que más se parecen, con foto, precio y carrito.
- [ ] **Mini-guía por correo "5 días para tejer tu primer amigurumi".** Sirve para armar lista de correos antes de vender Pattern AI o cursos. Sara elige y crea la cuenta en una herramienta de correo (MailerLite o Brevo, con plan gratis); Claude escribe los 5 correos y pone el formulario en la web.
- [ ] **Revisar las abreviaturas en chino y ruso** (Rincón → Abreviaturas) con una tejedora que hable esos idiomas.
- [ ] **Revisar el glosario** (`glosario-rosina.html`) para que coincida con cómo se enseña en los talleres. Por ejemplo, las cadenetas de giro: 1 para punto bajo, 2 para medio punto alto y 3 para punto alto.
- [ ] **Ilustraciones de Rosina en mayor tamaño.** Las poses de la hoja de stickers venían pequeñas, así que los fondos "Primero café", "Temporada de tejer", "Tejer es mi terapia" y "Rosina por todas partes" se ven un poco menos nítidos. Con las ilustraciones grandes se regeneran.
- [ ] **Ilustraciones nuevas (opcional):** Rosina haciendo cada punto, para el glosario, y versiones de Rosina solo con líneas, para el libro para colorear.
- [ ] **Decidir cómo cobrar productos digitales** (Hotmart, o Nequi por WhatsApp) antes de crear material de pago.

## 🟢 Ideas aprobadas o propuestas que faltan por hacer (Claude)

### Material de Rosina
- [ ] Libro para colorear imprimible (necesita las ilustraciones solo con líneas).
- [ ] Cuaderno de práctica de puntos básicos, punto por punto con Rosina (freemium o de bajo costo).
- [ ] Versión completa, de pago, de la plantilla de pedidos y clientas, con precios, costos y ganancias. La versión gratis ya está en la Agenda.
- [ ] Botón "Invítale un café a Rosina" (aporte voluntario con Nequi o Ko-fi).
- [ ] Opcional: poner también la imagen "Conoce a Rosina" al principio de `rosina.html` (se ofreció; Sara no ha respondido).

### Que la web aparezca más en Google (SEO)
- [ ] Escribir los primeros 3 artículos de la Revista pensados para búsquedas: aprender, materiales y comprar. Después, uno cada 1 o 2 semanas.
- [ ] Patrones gratis (lo que más visitas trae en crochet).
- [ ] Google Merchant Center: productos gratis en la pestaña "Shopping" (la tienda ya tiene los datos de producto).
- [ ] Imágenes pensadas para Pinterest (paletas, fondos, stickers) que enlacen a la web.

### Ingresos
- [ ] Productos digitales pagos: patrones PDF, agenda completa, packs extra de stickers.
- [ ] Patrocinio de una marca de hilos para "Aprobado por Rosina" (cuando haya visitas que mostrar; debe decir que es patrocinado).
- [ ] Google AdSense: **no por ahora.** Paga poco con pocas visitas, hace la página lenta y puede mostrar anuncios de la competencia. Retomarlo con decenas de miles de visitas al mes.

## 📋 Auditoría de la web (recibida el 26-sep-2026) — por implementar

El documento completo lo tiene Sara. Resumen del análisis de viabilidad: casi todo es viable sobre la web actual, sin cambiar la arquitectura. Orden acordado: Prioridad 1 (conversión) → 2 (ecosistema) → 3 (marca) → 4 (optimización). Se muestran capturas antes de publicar la Prioridad 1.

**Preguntas abiertas para Sara (responder antes de empezar la Prioridad 1):**
- [ ] **Tiempo de entrega real.** Hay una contradicción: Personaliza y Precios dicen "se envía 1 semana después de confirmado el pago", y las Preguntas frecuentes dicen "depende de la complejidad y de la fila de pedidos". La auditoría propone la segunda.
- [ ] **Pop-up del 10 %.** Hoy aplica a la primera compra de cualquier producto. Propuesta: 10 % solo en tienda y mercería; para personalizados, un beneficio que no toque el margen, como un pack exclusivo de Rosina o un mini llavero. La "tarjeta personalizada" no sirve como beneficio porque la FAQ dice que ya está incluida. Hay que respetar los bonos ya entregados.
- [ ] **Casilla de autorización en el formulario de Personaliza** ("Autorizo compartir la historia y las fotos"). Toca el formulario y Supabase.
- [ ] **Menú:** ¿desplegables por grupos (Comprar / Aprender / Universo Lana Rosa / Ayuda) o la propuesta ligera (mismo menú reordenado, "Personaliza el tuyo" como botón destacado y los grupos en el pie de página)?
- [ ] **Proyectos especiales:** qué se ofrece a empresas, cantidades mínimas, tiempos y fotos de trabajos anteriores.
- [ ] **Sostenibilidad y "las tejedoras":** solo con información real. Hoy la web no tiene datos de sostenibilidad ni fotos o información de las tejedoras.
- [ ] **"Rosina te recuerda" (pausas activas):** ya existe el artículo de la Revista con la ilustración; se puede reutilizar en el Rincón.

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

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

- [ ] **Colores pastel de Mercería y Academy (6-oct-2026):** propuesta lista en la rama `claude/colores-pastel` (lila `#9A7EDD` y azul `#5A98E2`, con fondos más suaves). Esperando que Sara la apruebe o pida ajustes. Ojo: el texto blanco sobre un color pastel pierde contraste (queda cerca de 3:1; el rosa de marca está en 3,6:1).
- [ ] **Análisis externo de la web (6-oct-2026), revisado sin cambios:** ya está hecho lo de las tres casas, Rosina transversal, historias, Wompi + WhatsApp, SEO base, pop-up y carga de productos. Pendiente de decidir con Sara: (1) que la franja "Inauguración prevista" de la Mercería cambie sola después del 15-nov; (2) mover "Conoce Lana Rosa" antes de la entrada a Mercería/Academy en el inicio; (3) atributos width/height en imágenes y revisión de contraste; (4) revisar enlaces con una herramienta externa (el análisis habla de /merceria/merceria/, que no existe en el código).

- [x] **Bases de los amigurumis (6-oct, regla de Sara):** las bases sirven para amigurumis de 10 a 20 cm (no para los de cuatro patas como Bulbasaur) y nunca van incluidas en el precio, ni las tejidas. Los 20 amigurumis de 10–20 cm muestran "Base de exhibición (opcional): si deseas incluirla, se agrega por $7.000. No está incluida en el precio del muñeco." aunque no salga en la foto. Solo para amigurumis (nunca peluches, llaveros, macetas ni otros). Al agregar un amigurumi nuevo de 10–20 cm, ponerle esa línea en especificaciones.

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

- [x] **Pagos en línea dentro de la web (Wompi): activos** (ya hay pedidos web pagados que entran solos al ERP). Ya está construido: botón en el carrito, formulario de envío, página de gracias, funciones de Supabase y registro automático en el ERP (pedido de Tienda virtual, pago y asiento en bancos). Falta que Sara cree/abra la cuenta de Wompi, guarde las tres llaves en Supabase (Edge Functions → Secrets), registre la URL de eventos en Wompi y luego Claude enciende `PAGOS_ACTIVOS` y se prueba con la tarjeta de pruebas. Pasos en `herramientas/cuentas-clientes/README.md`.
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
- [ ] **Medios de pago PayPal y Google Pay** (Wompi ya está activo): Sara abre las cuentas (Wompi con RUT y cuenta bancaria; PayPal empresarial). Las llaves secretas van solo en Supabase, nunca en el chat. Después se integran en el carrito.

## 🟢 Ideas aprobadas o propuestas que faltan por hacer (Claude)
- [ ] **Conectar CRM y ERP (fase 2):** la fase 1 (pedidos de la web → CRM) ya está hecha, falta probarla con un pago real de producción. Fase 2: el código corregido del Worker ya está en `herramientas/cuentas-clientes/worker/` (falta que Sara lo pegue en Cloudflare, instrucciones en el README de esa carpeta) para que no duplique clientes (busca solo por cédula) y normalice los medios de pago; después, pagos y estados en ambos sentidos. Ver `herramientas/cuentas-clientes/README.md`. **Fase 2b (cobros y estados entre ERP y CRM) ya está hecha y probada.** Falta solo probar el recorrido completo de la web con un pago real de producción.

### Un solo sistema para producción y envíos: el ERP (aprobado el 1-oct-2026)
- [x] **Paso a paso de producción en el ERP:** publicado el 1-oct-2026 (ERP PR #30). Está en "Órdenes de producción", con la tabla `produccion_fichas` y las fotos en el bucket `produccion-fotos`.
- [x] **Datos de envío en el ERP:** publicado el 1-oct-2026 (ERP PR #31). Está en Pedidos Web/Redes → "🚚 Registrar envío o entrega" (funciones `fn_pedidos_envio` y `fn_pedido_guardar_envio`, guías en el bucket `guias-envio`). El puente del CRM (`actualizar-pedido-desde-crm` v13) ya no borra estos datos.
- [x] **Trazabilidad del pedido en el ERP:** publicado el 1-oct-2026 (ERP PR #32). Está en Pedidos Web/Redes → "🧭 Trazabilidad de un pedido" y en el botón "🧭 Ver trazabilidad" (funciones `fn_pedido_trazabilidad` y `fn_buscar_pedidos_traza`). Las fechas de cada estado se guardan en `pedidos_canal_historial` desde el 1-oct-2026.
- [x] **Honorarios y mano de obra de tejedoras** (2-oct-2026, ERP PR #33). Se calculan con el paso a paso: horas de tejido + detalles × valor de la hora (SMLV + cargos, hoy $15.123). Sara, Jennifer y Manuela están en nómina: su valor es solo costo de mano de obra. A María Camila y Gloria Inés (externas) se les paga con el botón Pagar, como honorarios del Taller (5110), y en el cierre del mes pasa a costo de producción. Las 29 piezas del CRM ya estaban pagadas como honorarios y cuentan como mano de obra de cada pieza; Sara dio el tiempo de las 5 que no tenían tiempo registrado. Cada orden y la trazabilidad muestran mano de obra y costo total.
- [x] **Historial del CRM en el ERP** (2-oct-2026): las 29 fichas de `produccion_progreso` quedaron como órdenes de producción "Historial traído del CRM" (23 entregadas y 6 para inventario, con costo de material $0, así que no mueven la contabilidad), cada una con su paso a paso, tejedora, tiempos y foto. Las fotos se copiaron al bucket `produccion-fotos/crm/` con la función `copiar-fotos-crm`. La migración no duplica si se vuelve a correr: hay que repetirla antes de apagar el CRM si allá se llenan fichas nuevas.
- [x] **Formularios de producción y envíos quitados del CRM** (2-oct-2026, CRM PR #1). Si alguien abre esas secciones, ve un aviso que indica dónde quedaron en el ERP. Los puentes ERP↔CRM se dejan prendidos: los cambios de estado del ERP siguen llegando al CRM. Ese mismo día se cerraron como entregados los pedidos LR-2026-028 y LR-2026-031, que se entregaron a tiempo pero habían quedado "en producción".

### Lo que Sara debe hacer (anotado el 2-oct-2026)
- [ ] **ERP → Cotizador (⚙️ Valores del cotizador):** llenar la tabla de tamaño → peso, las horas de producción al mes del Taller y la tarifa del SIMPLE (la da el contador).
- [ ] **ERP → Pagos → Gastos del local:** registrar los servicios públicos del mes (luz, agua, internet, celular) y el arriendo, para que los costos fijos salgan de datos reales. Cada mes, el valor en pesos de Claude (US$20).
- [ ] **ERP → Inventario:** crear el insumo "Módulo de sonido" en el Taller y registrar su compra ($35.000 cada uno) para que las tejedoras lo puedan gastar en las piezas con audio.
- [ ] **ERP → Inventario:** escribir el alto y el ancho (cm) de cada producto de la Tienda; la ficha de la web los muestra sola.
- [ ] **Fondo Emprender:** subir cada mes el comprobante de pago de seguridad social y ARL (PILA) de Sara.
- [ ] **Contador:** confirmar el costo mensual de un empleado con salario mínimo ($2.715.498), la tarifa del SIMPLE y si Sara debe presentar cuenta de cobro.
- [ ] **Usuarios de las tejedoras externas:** crear los usuarios de María Camila y Gloria Inés (rol Taller) para vincularlas en el ERP y marcarlas "Solo producción".
- [ ] **PayPal:** avisar el resultado de la prueba real para configurar su comisión.
- [ ] **ERP → Contabilidad → 💲 Reglas de precios (⚙️ Valores de la regla):** escribir cuánta mercancía se espera vender al mes en la Mercería (a costo) y cuántas horas de clase se dictan al mes en la Academia. Sin esos datos no se reparten los costos fijos en los precios sugeridos.
- [ ] **Base para amigurumis de 10 a 20 cm ($7.000):** el producto "Base para amigurumi" (BASE-AMI) ya está en el inventario de la Tienda con 0 unidades y la descripción de los 19 amigurumis de 10 a 20 cm ya dice que la base no viene incluida. **Falta publicar la casilla en la web** ("Agregar la base de exhibición (+$7.000)" en la ficha del producto, que la agrega al carrito): está lista y probada en la rama `claude/sweet-hypatia-6sqpmv` (tienda.html), pendiente del OK de Sara. Sara debe registrar las existencias de la base en 📥 Entrada mercancía (o dejarla bajo pedido).
- [ ] **ERP → 📥 Entrada mercancía:** registrar la compra de las bolsas de papel y de tela (ya están en el inventario de la Tienda con precio $1.000 y $2.000, en 0 unidades) para poder cobrarlas en la venta.
- [x] **Google:** pasar el enlace para "ver reseñas" (hecho el 2-oct-2026: "Ver reseñas" usa el enlace compartido del perfil y "Dejar mi reseña" va solo en el correo de compra) desde el Perfil de Empresa en Google (Compartir perfil / Obtener más reseñas), para ponerlo en la web.

- [ ] **Correo de compra y promociones (3-oct-2026):** ya se envía el correo de gracias, pago confirmado y recibo desde contacto@lanarosacrochet.com, y el pago tiene la casilla para recibir promociones. Falta: (1) probarlo con la primera compra real o un pago de producción; (2) construir el envío de promociones y la baja (los correos de promoción deben llevar enlace para darse de baja); (3) decidir si se agregan a esa lista las clientas que ya compraron.

### Ecosistema Lana Rosa: tres casas en un solo dominio (decidido el 4-oct-2026)
Documento de la Fase 0 (auditoría y arquitectura): https://claude.ai/artifact/QWqgS14BrGbEqBokYkhxob
- **Decisiones de Sara:** opción A, una sola web con tres casas: Crochet (`lanarosacrochet.com`), Mercería (`/merceria/`) y Academy (`/academy/`). Una sola Revista con categorías. El pop-up del 10 % de primera compra sigue y aplica a las tres casas. Autorizó usar nombres en las historias (incluida la de Mario Mendoza). La tienda física queda en la misma dirección: calle 10 #5-37, barrio Centro, Villamaría, Caldas.
- **Orden:** Fase 1 sistema de diseño (CSS, menú y pie compartidos, franja de líneas) → Fase 2 Crochet → Fase 3 Mercería y tienda física (antes de noviembre) → Fase 4 apertura → Fase 5 Academy → Fase 6 medición.
- [ ] Sara pasa las fotos de "Una persona", "Un regalo especial" y Empresas (corregido el 4-oct-2026: son las tres), y la información de Empresas.
- [x] Horario y fecha de apertura de la tienda física (confirmados por Sara el 5-oct-2026): **apertura el 15 de noviembre de 2026**; horario **lunes a viernes 7:30 a.m. a 6:15 p.m., sábados 8:00 a.m. a 12:00 m.**. Dirección: calle 10 #5-37, barrio Centro, Villamaría, Caldas. Falta ponerlo en la web (Fase 3: Mercería y tienda física) y en el perfil de Google.
- [ ] Pregunta abierta: ¿el 10 % de primera compra aplica también a amigurumis personalizados y talleres? (el pop-up de hoy dice que no).

### Corte de apertura para la inauguración (estimada en noviembre de 2026)
Decisión de Sara (2-oct-2026): NO empezar el sistema desde cero. Se conserva la historia (ley, DIAN y Fondo Emprender) y se hace un corte limpio. No usar "🧹 Reinicio antes de producción": borra todas las ventas, pedidos, turnos, nómina y ejecución de Fondo Emprender, también los reales.
- [x] Sara confirma qué registros son de prueba (5-oct-2026: todo es real, no se anuló nada; el pago de Wompi se registró de nuevo con la comisión) (lista revisada el 2-oct-2026: casi todo es real; dudas: venta POS-2026-00015 del 26-ago por $335.000, pedido web LRW-2026-0005 / PED-2026-00531 por $15.200 y el turno de caja abierto desde el 28-jul). Claude anula o reversa solo esos (con asiento contrario, sin borrar).
- [x] Cerrar el turno de caja que sigue abierto desde el 28-jul-2026 (cerrado el 5-oct-2026 con $79.000).
- [ ] Unos días antes de abrir: conteo físico de todo el inventario de la Tienda y del Taller; Claude ajusta el Kardex a esas cantidades.
- [ ] Cierre del mes con el contador: caja, bancos, cartera y cuentas por pagar; saldos de apertura confirmados.
- [ ] Día de la inauguración: abrir el primer turno con el efectivo contado.
- [ ] Después de revisar que todo cuadra: Sara activa "🔒 Modo producción" (Configuración → 🛡️ Respaldo y auditoría → Reinicio antes de producción). Es permanente.

### Costos y precios en el ERP (decisiones de Sara, 2-oct-2026)
- [ ] **Módulo "Mi producción" para tejedoras** (publicado el 2-oct-2026, ERP PR #35). Sara, Jennifer y Manuela ya están unidas a su usuario. Falta crear los usuarios de María Camila y Gloria Inés (rol Taller) y marcarlas "Solo producción". La tejedora registra el material gastado (sale del inventario del Taller) y el peso de la pieza.
- [ ] **Ficha de costos y precios por producto:**
  - **Costo de producción:** mano de obra (horas × valor de la hora) + materia prima registrada por la tejedora + etiqueta ($1.000) + CIF.
  - **CIF:** arriendo y servicios públicos se reparten 1/3 a Mercería, 1/3 a Taller y 1/3 a Academia. La depreciación va a la línea que usa cada equipo (hay que registrar los activos fijos con su línea).
  - **Gastos variables de venta:** comisión de Wompi o PayPal, envío si lo asume la empresa, etc.
  - **Empaque o bolsa:** NO es costo; se le cobra al cliente si la quiere (papel $1.000, tela $2.000). Propuesta: crearlas como productos de la Tienda para el punto de venta y la web.
  - **Utilidad bruta:** 35 % del precio de venta (precio = costo ÷ 0,65).
  - **Gastos fijos ya cargados en Presupuesto empresa del ERP (2-oct-2026):**
    - arriendo $1.800.000 (1/3 por línea);
    - contador $600.000 (1/3 por línea);
    - software (Claude US$20) $80.000;
    - pauta en Meta $200.000.
  - **Impuestos:** régimen SIMPLE, no responsables de IVA. Las tarifas del SIMPLE no están configuradas en el ERP: el contador debe confirmar el grupo y la tarifa.
  - **Comisión de Wompi** (según el reporte de desembolsos): 2,65 % + $700 por transacción, + 19 % de IVA sobre la comisión. Guardada en la configuración del ERP.
  - **Costo de un empleado con salario mínimo 2026 (decidido el 2-oct-2026): $2.715.498 al mes.** Pagos directos $2.000.000 + prestaciones $426.213 + seguridad social y parafiscales $289.285. Es la base de la hora de trabajo ($15.086,10 = ÷ 180 h) y de los honorarios de Sara (repartidos 1/3 por línea; 50 % tejido y 50 % administración). La cifra de $2.692.192 de Fondo Emprender sale de una fórmula simplificada (salario × 1,5376, sin auxilio de transporte); Sara decidió dejar el cálculo preciso.
  - **Cotizador de amigurumis:** lleva alto y ancho, y una lista de "otros materiales que no están en la tienda" (ej. módulo de sonido de $35.000 en las piezas con audio). El ancho ya está en el paso a paso, el inventario y la ficha de la Tienda web (falta publicar la rama `claude/ancho-amigurumi` del ERP). Decidido por Sara: materiales como el módulo de sonido van como insumo del inventario del Taller, registrando primero la compra para que ingresen al inventario y la tejedora los pueda gastar en el paso a paso.
  - **Faltan datos de Sara:**
    - comprobante mensual de seguridad social y ARL (PILA) de Sara, que exige Fondo Emprender;
    - valores de los servicios públicos (luz, agua, internet, celular) registrados en el módulo de gastos del ERP;
    - tabla de tamaño → peso para el cotizador y horas de producción del Taller al mes;
    - comisión real de PayPal (con el primer pago).

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
- [x] **Pop-up del 10 % por casa (6-oct-2026):** ahora es un solo archivo (`js/bono.js`) que sale una vez por visitante en la casa por la que entra (inicio de la Tienda, de la Mercería o de Academy), con el mensaje y el color de esa casa. Mismas condiciones: primera compra en la tienda o la mercería, no aplica a personalizados ni talleres. Para cambiar textos: `TEXTOS` en `js/bono.js`.
- [x] Confirmado por Sara el 6-oct-2026: **recoger en la tienda es gratis** (ya lo dicen la tienda y Mercería → Cómo comprar) y **los talleres por ahora los dicta Sara** (agregado a Academy → Talleres y a sus preguntas frecuentes).

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
- Descuento de primera compra (10 %) en el pago en línea, aviso "te falta calificar" en la cuenta, hoja "Producto agregado" en el carrito y menú Tienda/Personaliza más oscuro (30-sep-2026): listos en rama, pendientes de la aprobación de Sara.
- [x] Correo que invita a calificar cuando se verifica el pago del pedido (ya no espera la entrega; también se puede reseñar desde ese momento) (solo clientas con cuenta, una vez por pedido; `fn_correo_calificar` + trigger en `pedidos_canal_venta`, por Resend). Sin probar con un pedido real: verificarlo la primera vez que se entregue uno.
- [ ] **PayPal (clientas de otros países):** código listo y apagado (3-oct-2026). Falta: Sara abre/verifica la cuenta empresarial de PayPal, crea la app en developer.paypal.com y guarda `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODO` en Supabase; define en el ERP la tasa y el envío por zona (US$); probar en `sandbox` con `?pagosprueba=1`; pasar a `live`. Ver `herramientas/cuentas-clientes/README.md`.

- [x] Fase 1b (publicada, PR #161): franja Crochet · Mercería · Academy, menú por casa y pie desde una sola fuente (`herramientas/sincronizar_encabezado.py`). Para cambiar menú/pie: editar el script y volver a correrlo.

- [x] Animaciones sutiles (publicadas, PR #162): `css/animaciones.css` + `js/animaciones.js`. Se apagan con "reducir movimiento".

- [x] Fase 2 Crochet, parte sin fotos (publicada, PR #163): Personaliza en 5 pasos y título de Sobre nosotras "Nacimos en familia. Hoy tejemos en equipo." (la Tienda ya muestra Disponible / Bajo pedido en cada tarjeta). Siguen con fotos: Inicio reordenado, "Una persona", "Un regalo especial" y página de Empresas.

- [x] Identidad por casa (publicada, PR #164): nombres Tienda de amigurumis · Mercería · Academy, color propio por casa (rosa / morado / azul), menú y pie de cada casa. Pendiente: decidir si el nombre "Lana Rosa Academy" dentro de los textos y títulos SEO pasa a "Academia de Crochet" (el canal de YouTube se llama Lana Rosa Academy); logos propios de Mercería y Academia (hoy el logo sigue rosa); fotos de portada por casa; menú de Crochet con Empresas cuando exista la página.

- [x] Fase 3 Mercería y tienda física, primera parte (publicada, PR #166): sección "Nuestra tienda física" en `merceria.html` (dirección, horario, Cómo llegar, WhatsApp; antes del 15-nov dice "Abrimos el 15 de noviembre de 2026" y desde esa fecha muestra solo "Abierto ahora" / "Cerrado ahora"), "Tienda física" en el menú y el pie de Mercería, datos estructurados Store con el horario. Hecho también: la Mercería vive en `/merceria/` (`merceria/index.html`; la dirección vieja `merceria.html` redirige). Falta: poner el horario en el perfil de Google, foto de la tienda y una portada propia de la Mercería.

### Fase 4: plan de apertura de la tienda física (15-nov-2026, escrito el 5-oct-2026)
El 15 de noviembre de 2026 cae **domingo**. Decisión de Sara (5-oct-2026): la inauguración puede ser ese domingo, **sujeta a cambios**; la atención normal (lunes a sábado) empieza el lunes 16. La web dice "Inauguración prevista: domingo 15 de noviembre de 2026" y desde el 16-nov muestra Abierto/Cerrado ahora.
- **Esta semana (hasta el 12-oct):**
  - [x] Sara confirma qué ventas son de prueba (5-oct-2026: son reales). En el turno abierto desde el 28-jul solo hay dos ventas: POS-2026-00014 (ya anulada) y POS-2026-00015 ($335.000, 10 artículos, efectivo $69.000 + Nequi $266.000, parece una venta real). Pedido web PED-2026-00531 ($15.200, pagado por Wompi/Nequi, entregado; cliente Jennifer Muñoz): Sara dice si es de prueba. Claude solo las anula con asiento contrario (no se borra nada).
  - [x] Turno de caja del 28-jul cerrado el 5-oct-2026 con $79.000 contados. El ERP esperaba $46.600, así que quedó un sobrante de $32.400 en el reporte del turno (el cálculo del cierre no cuenta bien los pagos de WhatsApp en efectivo registrados sin turno ni los pedidos viejos). Sara decidió NO registrar consignaciones: el efectivo de WhatsApp queda como efectivo de Lana Rosa, porque hasta ahora no ha habido cuenta bancaria exclusiva; las conciliaciones bancarias empiezan con las cuentas exclusivas al abrir la tienda. Ventas POS-2026-00015 y PED-2026-00531 confirmadas como reales (el pago de Wompi se reversó y se volvió a registrar con la comisión, asientos #77 y #78).
- **Hasta el 23-oct:** cargar la Mercería en el ERP (existencias y precios con la regla del 40 %), fotos de producto, compra de bolsas, base y módulo de sonido; datos de Sara pendientes (horas de Taller y Academia, mercancía vendida al mes, tabla tamaño-peso, tarifa SIMPLE, servicios públicos).
- **26-oct a 6-nov:** Sara pega las llaves de Wompi y se prueba un pago real de producción (`PAGOS_ACTIVOS`); reunión con el contador para saldos de apertura y cierre de mes; horario y fecha en el perfil de Google; foto de la tienda y portada de la Mercería.
- **9 a 11-nov:** conteo físico de todo el inventario (Tienda y Taller); Claude ajusta el Kardex a lo contado.
- **12 a 14-nov:** ensayo de caja con una venta real pequeña; revisar permisos de usuarias del POS; aviso de apertura en redes y en la web.
- **Día de apertura:** abrir el primer turno con el efectivo contado. Después de revisar que todo cuadra, Sara activa el "Modo producción" (permanente).

- [x] PayPal quitado de la web el 5-oct-2026 (Sara: no se ha podido probar con una compra real): se apagó `paypal_ajustes.activo` en Supabase y se quitaron los textos de la tienda y del pago. El código (`js/pago.js`, función `paypal-pagos`, página `gracias.html`) queda dormido. Para volver a activarlo: probar una compra real, poner `activo = true` en `paypal_ajustes` y volver a escribir la frase en `tienda.html`.

- [x] ERP: cálculo del cierre de turno corregido (5-oct-2026). La pantalla de arqueo y el cierre usan la misma función `fn_efectivo_turno`: solo cuenta el efectivo recibido en la caja durante el turno (ventas POS, pagos de pedidos marcados con el turno, cursos) y resta pagos a proveedores, devoluciones y consignaciones caja→banco del turno. El efectivo de pedidos registrados sin turno abierto no suma en la caja.
- [ ] Al abrir la tienda: abrir cuentas bancarias exclusivas de Lana Rosa y registrarlas en el ERP (Bancos); antes de eso las conciliaciones bancarias no van a cuadrar porque se usó una cuenta personal.

- [x] Mercería completa como casa independiente (publicada el 5-oct-2026, PR #173): inicio propio en `/merceria/`, catálogo en `/merceria/catalogo/`, tienda física en `/merceria/tienda-fisica/`, menú de arriba y menú del celular solo de la Mercería (con "Otras casas de Lana Rosa" al final), pie propio con horario, franja de casas discreta en todo el sitio. Falta: logo propio de la Mercería (hoy usa el logo rosa) y fotos para el inicio y la tienda física. Después: lo mismo para Academy y la tienda de amigurumis.

- [x] Academy como casa independiente (publicada el 5-oct-2026, PR #174): inicio propio en `/academy/` (talleres, tutoriales, recursos de Rosina, Conoce a Rosina, materiales en la Mercería), menú de arriba y del celular solo de Academy, pie propio con todas sus páginas; la franja y el logo llevan a `/academy/`. Las páginas de Academy conservan sus direcciones (`aprende.html`, `recursos-rosina.html`, `glosario-rosina.html`, etc.) para no perder lo que Google ya tiene indexado. Falta: logo propio de Academy.

- [x] Tienda de amigurumis como casa independiente (publicada el 5-oct-2026, PR #175): menú de arriba (Tienda, Personaliza el tuyo, Precios, Sobre nosotras), menú del celular y pie propios; en el inicio, las secciones de Academy se cambian por "Más de Lana Rosa" (tarjetas a la Mercería y a Academy); Rosina se queda en el inicio. Las páginas comunes (contacto, preguntas frecuentes, políticas, cuenta, Revista) usan un menú de marca con las tres casas. Falta: página de Empresas en el menú cuando exista, y fotos de la Fase 2.

- [x] Logos de la Mercería y de Academy (opción 2 elegida por Sara el 5-oct-2026): mismo dibujo de Rosina y "Lana Rosa", fondo del color de la casa y el nombre en un sello claro. Archivos `img/logo-merceria.webp/.jpg` y `img/logo-academy.webp/.jpg`; se usan en el encabezado, el pie y la imagen para compartir (Mercería). La palabra está en DynaPuff; si aparece el archivo original del logo, rehacerlos con la letra exacta.

- [ ] **Carga de la Mercería en el ERP (Fase 4):** Sara llena `herramientas/merceria-carga/plantilla_carga_merceria.xlsx` (lanas e hilos "por ovillo y por gramo": en la caja se vende el ovillo completo o gramos sueltos; lo demás por unidad; productos nuevos de agujas, herrajes, accesorios y relleno). Claude genera el SQL con `cargar_merceria.py`, muestra el resumen y lo carga (probado con datos de prueba el 5-oct-2026, sin dejar rastro). Después: precios con la regla del 40 % (falta el dato de mercancía vendida al mes para la carga de costos fijos) y el valor total al contador para el saldo de apertura.

- [x] Menús laterales y marca en el navegador (publicado el 6-oct-2026, PR #181): el menú de las tres rayitas de cada casa tiene solo lo de esa casa (más Mi cuenta, Revista y Ayuda); íconos de pestaña y color de la barra del celular propios (rosa / morado / azul); página 404 con el color y los enlaces de la casa. Siguen: preguntas frecuentes por casa, Revista por casa, páginas "Cómo comprar" (Mercería), "Calendario de talleres" y "Sobre Academy".

- [x] Preguntas frecuentes por casa (publicadas el 6-oct-2026, PR #182): `/merceria/preguntas-frecuentes/` y `/academy/preguntas-frecuentes/` (con datos estructurados FAQPage); la general sigue en `preguntas-frecuentes.html` y enlaza a las dos. Sara revisa que las respuestas sean correctas (sobre todo cupos y pagos de los talleres, y cómo se venden las lanas en la web). Siguen: Revista por casa y páginas "Cómo comprar" (Mercería), "Calendario de talleres" y "Sobre Academy".

- [x] Revista por casa (publicada el 6-oct-2026, PR #183): la Revista sigue siendo una sola (`revista.html`), con un filtro por casa (Tienda de amigurumis 5 artículos, Mercería 2, Academy 4) además de las categorías; el menú lateral de cada casa enlaza a `revista.html?casa=...` y la página toma el color de esa casa. Temas nuevos para Mercería y Academy en `herramientas/revista/temas.md`. Falta escribir más artículos de Mercería (ya hay 4 en la rama `claude/articulos-merceria`).

- [x] Páginas propias de cada casa (publicadas el 6-oct-2026, PR #184): Mercería `/merceria/como-comprar/` (pasos, formas de pago, envíos, primera compra); Academy `/academy/talleres/` (próximo taller con fecha por confirmar, cómo reservar, ediciones anteriores) y `/academy/sobre-academy/`. Sara confirma: (1) la fecha del próximo taller y cómo se reserva el cupo, (2) que la recogida en la tienda sea gratis, (3) quién dicta los talleres, para ponerlo en Sobre Academy.

- [x] Revisión del sitio (6-oct-2026): 28 páginas sin enlaces rotos reales, sin imágenes sin texto alternativo, títulos y descripciones únicos, un solo h1 por página. Contraste de los colores nuevos revisado: morado y azul pasan; se aclaró el morado medio del pie de la Mercería (de 4,0 a 4,7). Pendiente de diseño (anterior a las casas): el rosa de marca #E74E96 con texto blanco da 3,5:1 (cumple para texto grande, no para texto pequeño); si se quiere cumplir en todo, usar un rosa un poco más oscuro en botones.

- [x] Dos artículos nuevos de la Revista para la Mercería y Academy (publicados el 6-oct-2026, PR #186): "Cómo elegir el hilo para tu amigurumi: algodón, acrílico y chenille" y "Qué aguja de crochet usar con cada grosor de hilo". Sara revisa que el contenido coincida con cómo enseñan en los talleres (medidas de agujas, qué hilo recomiendan para empezar). Siguen en `herramientas/revista/temas.md`: cuántos ovillos para un amigurumi de 13 cm, colores que combinan, cómo guardar la lana.

- [x] ERP → Cuentas bancarias y conciliación → "🧾 Desembolsos de Wompi" (publicado el 6-oct-2026, ERP PR #44): se sube el reporte de desembolso de Wompi (.xlsx) y el sistema compara la comisión + IVA de cada pago con la registrada y hace el ajuste si cambia. Si el reporte trae retenciones (ReteICA, ReteIVA, retefuente), queda en "Revisar" para el contador. El desembolso del 1-oct (PED-2026-00531) quedó conciliado sin diferencia. Uso: cada vez que Wompi haga un desembolso, Sara o el contador suben el reporte.

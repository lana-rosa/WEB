# Pendientes de la página web — Lana Rosa Crochet

Última revisión: 9 de octubre de 2026 (reordenado y verificado contra el repositorio y la base de datos).
Marca con `[x]` lo que ya esté hecho y agrega abajo lo nuevo. El historial completo de lo hecho (y el texto anterior de este archivo) está en `herramientas/historial/PENDIENTES-hasta-2026-10-09.md`.

**Fechas clave:** inauguración de la tienda física el **domingo 15-nov-2026** (sujeta a cambios); atención normal desde el **lunes 16-nov** (L–V 7:30 a. m.–6:15 p. m., sáb 8:00–12:00). `js/apertura.js` y el flujo `activar-apertura.yml` cambian los textos solos el 16-nov; si la fecha se mueve, cambiar `2026-11-16` en `js/apertura.js`, el cron del flujo y `herramientas/activar_apertura.py`.

---

## 🔴 1. Urgente: lo que bloquea la Mercería y la apertura (meta: hasta el 23-oct)

- [ ] **Cargar la Mercería al ERP con existencias.** Hoy 36 ítems activos del centro Mercería (34 referencias en la web) tienen **0 existencias**, por eso el catálogo muestra «Muy pronto». Sara llena `herramientas/merceria-carga/plantilla_carga_merceria.xlsx` (lanas e hilos por ovillo y gramo; lo demás por unidad; agujas, herrajes, accesorios y relleno si se venden). Claude genera el SQL con `cargar_merceria.py`, muestra el resumen y lo carga. Al cargar, las 7 lanas con unidad «unidad» quedan en «gramo». Después: precios con la regla del 40 % (falta el dato de mercancía vendida al mes) y valor total al contador para el saldo de apertura. Cuando haya productos, el aviso desaparece solo.
- [ ] **Subir las 34 fotos de producto** (`lana-happy-chenille-dmc-*.jpg`, `lana-chelin-kusi-kusi-*.jpg`, `lana-ecological-cotton-papatya-*.jpg`, `lana-papatya-love-papatya-*.jpg`, `lana-polar-kusi-kusi-blanco-03.jpg`) a `img/productos/` (verificado el 9-oct: hay 0 `lana-*` subidas). Sin ellas las tarjetas muestran solo el nombre. Con ellas también se ponen fotos reales en el inicio de la Mercería y datos estructurados con imagen.
- [ ] **Probar un ovillo de punta a punta con Wompi** (apenas haya existencias): pedido en el ERP en gramos, observación «ENVÍO CONTRAENTREGA», correo de recibo, aviso a contacto@ y pedido en el CRM con casa Mercería. Detalle y pruebas ya hechas en `herramientas/cuentas-clientes/propuesta-cobro-merceria.md`. Hasta entonces el camino feliz del cobro de materiales no está probado.
- [ ] **Decisiones de Sara sobre el catálogo:** (1) ¿«Happy Chenille» DMC es lana? Hoy está en «Hilos»; (2) la web dice «Kusi Kusi, Papatya, Copito y muchas más» y la base no tiene Copito; (3) si se venden en línea Hilos, Agujas, Herrajes, Accesorios o Relleno (cargarlos con su categoría y se activan solos); (4) si «Aguja recomendada» se muestra por producto; (5) peso/dimensiones de envío si se quieren tarifas por peso.
- [ ] **Al tener productos en la Mercería:** en `rosina.html` ("¿Qué hace Rosina?" → "En insumos") cambiar «Ir a la tienda →» por «Ir a la mercería →» (aprobado por Sara el 26-sep; verificado el 9-oct: sigue sin cambiar).
- [ ] **ERP → 📥 Entrada mercancía:** registrar las bolsas de papel ($1.000) y de tela ($2.000), la Base para amigurumi ($7.000, BASE-AMI) — las tres están en 0 (verificado) — y el insumo «Módulo de sonido» ($35.000, aún no existe en el inventario del Taller).

## 🔴 2. Urgente: la membresía de la Agenda ya está encendida y cobrando ($7.000/mes o $57.000/año, desde el 9-oct)

- [ ] **Abogada:** revisar `politicas.html#membresia` (precios actualizados el 9-oct) y la sección 11 de datos (retracto/servicio digital, devoluciones, copia en la nube). Ya se está vendiendo.
- [ ] **Crear `agenda_nube_borrar()` en Supabase** (SQL Editor, primer bloque de `herramientas/cuentas-clientes/migracion-16-borrar-nube-ingresos-digitales.sql`). Verificado el 9-oct: la función **no existe** todavía; mientras tanto el botón «Borrar mi copia en la nube» no borra de verdad (deja la copia vacía como respaldo).
- [ ] **Sara: un pago real de prueba** con los precios nuevos, desde `agenda-rosina.html?membresia=ver` (cobra $7.000 o $57.000 de verdad): correo de bienvenida, mensaje en Mi cuenta, hojas desbloqueadas y fecha de vencimiento. Verificado el 9-oct: **no hay ningún pedido de membresía ni membresía registrada en la base**, así que no hay constancia de un pago completo.
- [ ] **Decisión de Sara:** ¿las copias en la nube de membresías vencidas se borran solas a los 12 meses o se conservan hasta que la persona las borre? (hoy se conservan).
- [ ] **Cada mes, contabilidad:** `select * from ingresos_digitales_web('AAAA-MM-01','AAAA-MM-31')` y registrar el ingreso (los pedidos de membresía y de patrones no pasan al ERP; la función existe, verificado).
- [ ] **Verificación de Google (Calendar):** activar la membresía a la cuenta de prueba (SQL en `herramientas/google-calendar/verificacion-google.md`, sección 0), grabar el video con la interfaz final y enviar la verificación (permiso sensible `calendar.events`: dominio verificado en Search Console, política y video; guion y textos listos en ese archivo). Mientras no se verifique, hay aviso «app no verificada» y límite de 100 personas. Cuando se apruebe, anunciar la función.
- [ ] **Avisar** a quienes ya usaban Finanzas gratis (sus datos siguen en su dispositivo) y anunciar la membresía en redes y en la Revista.

## 🔴 3. Urgente: legal y datos personales

- [ ] **Política de datos: agregar lo que la web ya hace** (verificado el 9-oct: `politicas.html` ya tiene Google Calendar, copia en la nube, cookies, herramientas de análisis e IA genérica, pero **no** estos puntos): cuenta de cliente (nombre, correo, teléfono, direcciones, favoritos, carrito, pedidos y reseñas); recordatorio de carrito (3 y 24 h, con enlace para no recibir más); bono de bienvenida; asistente Rosina (los mensajes se procesan con un proveedor de IA; no escribir datos sensibles); pagos con Wompi (Lana Rosa no guarda datos de tarjeta; nombrar Wompi en «Medios de pago»); correos de compra y promociones. Para aprobar con la abogada o contadora antes de publicar.
- [ ] **Abogada:** llevar `herramientas/auditoria-privacidad.md` y `herramientas/borrador-politica-datos.md`; y revisar las dos páginas de la Mercería publicadas el 9-oct (`/merceria/terminos-de-venta/` y `/merceria/cambios-y-devoluciones/`).
- [ ] **Decidir** si el bucket de fotos de Personaliza pasa a privado (requiere cambiar cómo el ERP muestra las fotos) y **confirmar con cada proveedor dónde se almacenan los datos** (Supabase, Wompi, Cloudflare).
- [ ] **Contadora:** confirmar el texto del régimen en el recibo («Régimen Simple de Tributación · No responsable de IVA») y si el recibo web debe exigir el documento del cliente.

## 🟠 4. Antes de la apertura (plan del 5-oct)

- [ ] **26-oct a 6-nov:** reunión con el contador (saldos de apertura y cierre de mes: caja, bancos, cartera, cuentas por pagar); horario y fecha en el perfil de Google; foto de la tienda y portada de la Mercería.
- [ ] **9 a 11-nov:** conteo físico de todo el inventario (Tienda y Taller); Claude ajusta el Kardex a lo contado.
- [ ] **12 a 14-nov:** ensayo de caja con una venta real pequeña; revisar permisos de usuarias del POS; aviso de apertura en redes y en la web.
- [ ] **Día de apertura:** abrir el primer turno con el efectivo contado. Después de revisar que todo cuadra, Sara activa «🔒 Modo producción» (Configuración → 🛡️ Respaldo y auditoría → Reinicio antes de producción). **Es permanente; no usar «🧹 Reinicio antes de producción» antes, porque borra todo.**
- [ ] **Cuentas bancarias exclusivas** de Lana Rosa: abrirlas y registrarlas en el ERP (Bancos), y asignar los medios de pago para que el dinero de la web no quede «sin asignar». Antes de eso las conciliaciones no cuadran (se usó una cuenta personal).
- [ ] **16-nov:** revisar que el flujo `activar-apertura` corrió (commit «Tienda física abierta…» en `main`).
- [ ] **Perfil de Google (Sara):** revisar en 1 o 2 semanas que vuelva a salir al buscar «Lana Rosa Crochet», que se reactiven las reseñas, y agregar horario y áreas de servicio.

## 🟡 5. Datos que Sara debe pasar o registrar en el ERP

- [ ] **ERP → Cotizador (⚙️ Valores del cotizador):** tabla tamaño → peso, horas de producción al mes del Taller y tarifa del SIMPLE (la da el contador).
- [ ] **ERP → Contabilidad → 💲 Reglas de precios:** mercancía que se espera vender al mes en la Mercería (a costo) y horas de clase al mes en la Academia (sin esto no se reparten los costos fijos en los precios sugeridos).
- [ ] **ERP → Pagos → Gastos del local:** servicios públicos del mes (luz, agua, internet, celular) y arriendo; cada mes, el valor en pesos de Claude (US$20).
- [ ] **ERP → Inventario:** alto y ancho (cm) de cada producto de la Tienda (la ficha web los muestra sola). Falta publicar la rama `claude/ancho-amigurumi` del ERP.
- [ ] **Usuarios de las tejedoras externas:** crear los de María Camila y Gloria Inés (rol Taller) y marcarlas «Solo producción» (módulo «Mi producción», ERP PR #35).
- [ ] **Contador:** confirmar el costo mensual de un empleado con salario mínimo ($2.715.498), la tarifa del SIMPLE y si Sara debe presentar cuenta de cobro.
- [ ] **Fondo Emprender:** subir cada mes el comprobante de PILA (seguridad social y ARL) de Sara.
- [ ] **Base para amigurumi blanca y negra:** Sara busca la foto real de la negra y define su precio. Plan: dos productos separados en el ERP, cada uno con sus existencias; el enlace de los amigurumis lleva a Complementos.
- [ ] **Rosina tejida 13 cm:** costo real en el ERP (quedó en 0), existencias y SKU/código de barras. Productos pop con la imagen de Rosina (merch): pendiente.
- [ ] **PayPal:** el código está dormido (apagado el 5-oct). Para volver: Sara abre/verifica la cuenta empresarial, crea la app en developer.paypal.com y guarda `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODO` en Supabase; define en el ERP la tasa y el envío por zona (US$); prueba en `sandbox` con `?pagosprueba=1`; pasa a `live`; vuelve a poner `paypal_ajustes.activo = true` y la frase en `tienda.html`. Los **Google Pay** también dependen de abrir cuentas. Las llaves secretas van solo en Supabase, nunca en el chat.
- [ ] **Factura electrónica descargable:** terminar la habilitación con la DIAN (hoy solo hay rango de prueba) y, en el ERP, guardar el PDF de cada factura (campo de archivo en `documentos_electronicos`) para que Mi cuenta lo ofrezca directo. Hoy hay «Descargar recibo» y «Pedir factura electrónica» por WhatsApp.

## 🟡 6. Contenido que Sara debe enviar

- [ ] **Primer patrón de tejido (PDF):** nombre, instrucciones (texto o fotos del cuaderno), fotos del resultado, precio y si permite vender lo tejido (`venta_piezas`: `si`, `con_credito` o `no`). La plantilla (`herramientas/patrones/generar_patron.py` + `ejemplo.json`) y todo el recorrido de venta con Wompi y descarga están listos. Para publicarlo: producto en el ERP (categoría «Patrones»), PDF al bucket `patrones`, fila en `patrones_archivos` (`migracion-13-patrones-digitales.sql`), probar una compra real, enlazar «Patrones» en el menú de la Mercería, texto de derechos de uso. El 10 % de primera compra no aplica a patrones.
- [ ] **Autorización de 3 fotos** para la galería «De la foto al amigurumi» (vestido blanco con balaca, señor de canas con camisa blanca, señora saludando; Sara tiene las fotos sin flores).
- [ ] **Fotos de «Una persona», «Un regalo especial» y Empresas** y la información de Empresas (qué se ofrece, cantidades mínimas, tiempos, fotos de trabajos anteriores).
- [ ] **Comentarios nuevos de clientes** para «Lo que dicen nuestros clientes» (capturas o textos reales, sin inventar).
- [ ] **Imágenes de la Revista** de cada artículo y **enlaces de YouTube** para el glosario (por término) y la Revista (por artículo).
- [ ] **Equipo y sostenibilidad** («Las mujeres detrás de cada puntada», «Nuestro hilo también tiene una historia»): foto y frase de Sara, Jennifer, Camila y las tejedoras que quieran aparecer; qué se hace hoy en sostenibilidad. Solo con información real. En pausa desde el 27-sep.
- [ ] **Paletas con lanas reales:** la lista de colores que maneja, o el código de color (por ejemplo `#E74E96`) en cada lana del inventario; así cada paleta muestra las lanas parecidas con foto, precio y carrito.
- [ ] **Fecha del próximo taller** (hoy «por confirmar»), enlace de cursos virtuales (hoy «avísenme cuando abran» por WhatsApp), fotos y testimonios reales de alumnas.
- [ ] **Kit de principiante:** definir precio fijo (hoy el botón «Quiero el kit completo de principiante» del Rincón → Checklist pregunta el precio por WhatsApp).
- [ ] **Revisiones con tejedoras/talleres:** abreviaturas en chino y ruso; glosario vs. cómo se enseña (cadenetas de giro: 1 punto bajo, 2 medio punto alto, 3 punto alto); artículos de la Revista (medidas de agujas, hilo para empezar).
- [ ] **Depurar el enlace** en el Depurador de Facebook para que se actualice la vista previa al compartir.

## 🟡 7. Decisiones de Sara abiertas

- [ ] ¿Los **personalizados** también se pueden pagar en línea con Wompi? Hoy `personaliza.html`, el artículo de la Revista y `llms.txt` dicen que se paga por Nequi o Bre-B con comprobante por WhatsApp; si se habilita, hay que actualizar esos textos.
- [ ] ¿El código **BIENVENIDA10-XXXXX** se reconoce en la caja de la tienda física? (hoy no hay registro de uso del código en el ERP).
- [ ] ¿Se agrega **PayPal** a las preguntas frecuentes (pedidos fuera de Colombia)? Hoy está apagado, así que por ahora no.
- [ ] **Botón «Invítale un café a Rosina»:** diseño listo y sin publicar (verificado: sigue sin publicar) en `herramientas/borradores/cafe-rosina.patch` ($3.000, $6.000 y $12.000, llave Nequi/Bre-B, aviso por WhatsApp). Publicar: `git apply herramientas/borradores/cafe-rosina.patch`.
- [ ] Opcional: poner la imagen «Conoce a Rosina» al principio de `rosina.html`.
- [ ] Nombre «Lana Rosa Academy» vs. «Academia de Crochet» en textos y SEO (el canal de YouTube se llama Lana Rosa Academy).

## 🟢 8. Para Claude (se hace cuando Sara lo pida o llegue el dato)

- [ ] **Correos de compra y promociones:** (1) probar con la primera compra real de producción; (2) construir el envío de promociones con enlace de baja; (3) decidir si se agregan las clientas que ya compraron. También el aviso del carrito abandonado en la política de datos si el contador lo pide (va en el punto 3).
- [ ] **Conectar CRM y ERP, fase 2:** el Worker corregido (`herramientas/cuentas-clientes/worker/`, instrucciones en su README) falta que Sara lo pegue en Cloudflare para que no duplique clientes y normalice medios de pago. La fase 2b (cobros y estados) está hecha; falta probar el recorrido completo de la web con un pago real de producción (ahora con la casa por cliente).
- [ ] **Reseñas:** verificar con el primer pedido entregado el correo que invita a calificar (`fn_correo_calificar`).
- [ ] **Google Merchant:** revisar que Google apruebe los productos (rechazados o «requiere atención» se corrigen) y la **revisión semanal de los lunes** (clasificar productos nuevos: diseño propio → Google Shopping; personaje → aviso). Ver `herramientas/google-merchant/README.md`.
- [ ] **Revista:** un artículo por semana (rutina de los miércoles; temas y reglas en `herramientas/revista/temas.md`; faltan artículos de Mercería: ya hay 4 en la rama `claude/articulos-merceria`). Después: patrones gratis (lo que más visitas trae en crochet).
- [ ] **Medición (GTM/GA4):** crear las etiquetas de los eventos nuevos (`select_item`, `remove_from_cart`, `personalizacion_inicio`, `store_physical_click`, `academy_taller_click`, `resource_use`, `resource_download`, `review_click`, `merceria_contacto`) y los de la app instalable (`clic_instalar_app`, `app_instalada`); marcar `purchase` (y si quiere `clic_whatsapp`, `begin_checkout`) como evento clave en Analytics.
- [ ] **Recomendado a futuro (Mercería):** páginas de categoría con URL propia (`/merceria/lanas/`), colecciones por proyecto y kits solo con productos y precios reales.
- [ ] **Accesibilidad menor (axe, en todo el sitio):** contraste del botón «Aceptar» del aviso de cookies y del enlace «Ver en Google» del pie; el título «Cabeza» del glosario salta de nivel; el rosa de marca `#E74E96` con texto blanco da 3,5:1 (sirve para texto grande). El glosario y las paletas se generan: sus imágenes sin tamaño se perderían al regenerar.
- [ ] **Agenda, ideas para después:** hora en las fechas del calendario; pagos fijos y cuotas en el calendario; bloque «Mi membresía» en Mi cuenta; cobro automático con tarjeta guardada; registrar el ingreso de membresías en contabilidad de forma automática. Ajustar el texto de la intro que dice «se guardan en tu dispositivo» (ahora también hay copia en la nube).
- [ ] **Una vez cargada la Mercería:** `rosina-web` (v15) ya lee el catálogo en vivo y avisa si algo está agotado; revisar una pregunta por casa en el sitio real y el gasto en la consola de Anthropic (Configuración → Límites; créditos US$ 5, sin recarga automática). Límite: 20 mensajes/hora por visitante y 1.500/día.
- [ ] **Ideas de producto:** libro para colorear imprimible y versiones de Rosina solo con líneas; ilustraciones de Rosina haciendo cada punto (para el glosario); ilustraciones de Rosina en mayor tamaño (los fondos «Primero café», «Temporada de tejer», «Tejer es mi terapia» y «Rosina por todas partes» se ven menos nítidos); cuaderno de práctica de puntos básicos; mini app de la agenda; mini-guía por correo «5 días para tejer tu primer amigurumi» (Sara elige MailerLite o Brevo, plan gratis; Claude escribe los correos y el formulario); patrocinio de una marca de hilos para «Aprobado por Rosina» (debe decir que es patrocinado).
- [ ] **Google AdSense: no por ahora** (paga poco con pocas visitas, hace lenta la página). Retomar con decenas de miles de visitas al mes.

---

## 📌 Reglas y decisiones vigentes (referencia)

- **Valores de la marca:** no se celebran ni se mencionan Navidad, fechas de santos (incluida San Valentín) ni Halloween. Sí: Amor y amistad, Día de la madre, del padre, cumpleaños, graduaciones.
- **Primera compra 10 %:** solo en tienda y mercería (no personalizados, talleres, patrones ni membresía). Pop-up por casa en `js/bono.js`.
- **Bases de amigurumis:** solo para los de 10 a 20 cm; nunca incluidas en el precio; «Base de exhibición (opcional)» con enlace a la ficha. Un amigurumi nuevo de 10–20 cm lleva esa línea en especificaciones.
- **Envíos (verificados en el ERP el 9-oct):** Villamaría $8.000, Manizales $13.000, otras ciudades (incluidas Chinchiná, Neira y Palestina) $18.000; recoger en tienda gratis. Mercería a domicilio: la clienta paga el envío a la transportadora al recibir.
- **Precios de la membresía:** $7.000/mes y $57.000/año (ahorro de $27.000, «casi 4 meses gratis»); fijados en el servidor (`crear-pago-wompi` v31).
- **Costos y precios (decisiones de Sara, 2-oct):** costo = mano de obra (horas × valor de la hora, hoy $15.123) + materia prima registrada por la tejedora + etiqueta ($1.000) + CIF; CIF: arriendo y servicios 1/3 Mercería, 1/3 Taller, 1/3 Academia; utilidad bruta 35 % (precio = costo ÷ 0,65); empaque no es costo, se cobra al cliente (papel $1.000, tela $2.000); régimen SIMPLE, no responsables de IVA (tarifa: la confirma el contador); comisión de Wompi 2,65 % + $700 + 19 % de IVA sobre la comisión; costo de un empleado con salario mínimo $2.715.498 al mes; gastos fijos cargados: arriendo $1.800.000, contador $600.000, software $80.000, pauta Meta $200.000. Materiales como el módulo de sonido van como insumo del inventario del Taller (se registra primero la compra). Cada desembolso de Wompi: subir el reporte en ERP → Cuentas bancarias y conciliación → «🧾 Desembolsos de Wompi».
- **Mantenimiento:** menú y pie se editan en `herramientas/sincronizar_encabezado.py` y se vuelve a correr; glosario y paletas se regeneran con sus scripts; `python3 herramientas/revisar_enlaces.py` debe dar 0 rotos y 0 rutas relativas.

---

## ✅ Cerrado en la revisión del 9-oct-2026 (verificado)

- [x] **Tarifas de envío** del ERP vs. la web: ya coinciden ($18.000 otras ciudades; antes «Otra ciudad» estaba en $15.000).
- [x] **Cómo cobrar productos digitales:** resuelto, se cobran con Wompi (patrones y membresía), sin Hotmart.
- [x] **¿El 10 % aplica a personalizados y talleres?** No (decisión de Sara, 27-sep); además tampoco a patrones ni membresía.
- [x] **Membresía de la Agenda encendida** (`MEMBRESIA_ACTIVA = true`, 8-oct) y con precios nuevos (9-oct, PR 280).
- [x] **Apps instalables (PWA)** publicadas: los tres manifiestos, `sw.js`, `offline.html`, íconos en `img/app/` y botón «Instalar app» en el pie (queda solo medirlas en GTM, punto 8).
- [x] **Inicios por casa** publicados: Mercería (PR 278), Academy (PR 275), Tienda (PR 277); incluye «Más de Lana Rosa» y los fondos acordados.
- [x] **Mercería: términos de venta y política de cambios** publicados (PR 279); cobro por ovillo corregido (`crear-pago-wompi`, ahora v31); `rosina-web` v15 con precio por ovillo, páginas nuevas y tuteo; CRM por casa (`clientes_casas`, filtros por casa en Clientes y Pedidos).
- [x] **Texto de Rosina sin precio por gramo** y desplegado.
- [x] **Análisis externo del 6-oct:** la franja «Inauguración prevista» cambia sola (`js/apertura.js`); «Conoce Lana Rosa» ya no estorba (el inicio se reordenó); width/height y contraste revisados (0 textos con poco contraste, 164 imágenes con tamaño); enlaces revisados con `revisar_enlaces.py` y el flujo de GitHub Actions.
- [x] **Política de datos:** ya incluye Google Calendar (sección 10), copia en la nube (sección 11) y condiciones de la membresía; falta el resto (punto 3).
- [x] **Espacio superior de las páginas** ampliado a 40 px y botón «Ver tutoriales en Instagram» en Academy (PR 281, 9-oct).
- [x] **Mercería: «Abrimos» / tienda física, horarios, medios de pago de la tienda física** (efectivo, tarjeta y QR por Wompi, Nequi o Bre-B) unificados.

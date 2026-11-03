# Ecosistema de integraciones con Google — auditoría y plan (3-nov-2026)

Etapa **solo de auditoría y planificación**: no se modificó código, permisos, datos ni conexiones. Fuentes: código de `js/agenda/google-calendar.js`, `drive-sync.js`, `drive-merge.js`,
las funciones `google-calendar.ts` y `google-drive.ts`, la base de Supabase (solo estructura y conteos, sin correos ni contenido) y los documentos del repositorio.

**Qué no se pudo verificar desde aquí:** el comportamiento contra los servidores reales de Google (la prueba de dos aparatos con una cuenta de Google real sigue pendiente), el estado de
publicación de la pantalla de consentimiento en Google Cloud, y las cuotas exactas vigentes. Lo que dice este documento sobre cuotas, costos y verificación de Google viene de lo
que se conoce de la documentación pública y **debe confirmarse en la consola de Google Cloud y en la documentación oficial antes de decidir**.

## 1. Auditoría de lo que ya existe

### Google Calendar — estado: implementado, con una prueba real parcial
| Aspecto | Hallazgo |
|---|---|
| Conexión | OAuth con permiso **no sensible** `calendar.app.created`: crea un calendario aparte «Agenda para tejedoras» y solo toca ese. El permiso se guarda **cifrado (AES-GCM)** y la función valida la sesión de cada usuaria. Desconectar borra el calendario, revoca el permiso y borra lo guardado. |
| Qué envía | Fechas de: entrega y envío de pedidos, proyectos, fichas de proyecto, fechas especiales, cumpleaños de clientas y ferias (`window.lrAgenda.eventos()`). Eventos de todo el día con recordatorio, repetición anual si aplica. |
| Qué NO envía | Tareas y notas del Planeador del día, clases pedidas en «Aprende y compra», diario, pausas activas, vencimientos de gastos fijos y deudas, vencimiento de la membresía. |
| Crear / actualizar / borrar | Los tres existen (por «clave» + huella de contenido). Hay trampas de seguridad: no sincroniza una agenda sin fechas y no borra de golpe más de 3 fechas sin confirmación. La lógica está probada con función simulada (`probar_agenda_google_calendar.py`, `probar_funcion.mjs`). |
| Evidencia real | En la base hay **1 cuenta conectada** con sincronización reciente y **2 eventos** registrados: la creación funciona en la práctica. No hay evidencia real de actualizar ni de borrar. |
| Sentido | **Una vía** (agenda → Google). Si la persona edita un evento en Google, la próxima sincronización lo pisa si cambió en la agenda; no se lee nada de Google. |
| Seguridad en base | Las 3 tablas de Google tienen seguridad por filas activada, **sin políticas** y sin permisos para `anon` ni `authenticated`: solo la función con llave de servicio las toca. Correcto. |

Hallazgos y riesgos (de la lectura del código; ninguno comprobado en vivo):
1. **Recordatorio mal descrito.** El texto dice «la tarde anterior», pero el recordatorio es 900 min antes de un evento de todo el día: queda a las 9:00 a. m. del día anterior.
2. **Calendario huérfano al reconectar.** Al volver a conectar sin haber desconectado, se crea un calendario nuevo y el anterior queda en Google de la persona (verificar con una prueba real).
3. **Tope silencioso de 300 eventos.** Lo que pase de 300 se ignora sin avisar.
4. **Primera sincronización larga.** Cada evento es una llamada seguida; con cientos de eventos podría acercarse al tiempo máximo de la función y a límites de ritmo de Google. Los fallos se reintentan en la siguiente sincronización.
5. **Claves por posición.** Las fechas de pedidos se identifican por el número de fila; al borrar una ficha las siguientes suben y la función las «actualiza» (no duplica, pero genera muchas llamadas).
6. **Una sola llave para Calendar y Drive.** Los permisos de las dos conexiones se cifran con el mismo secreto (`CALENDAR_TOKEN_KEY`); conviene separarlos en algún momento.
7. **Mensajes de error genéricos** («Algunas fechas no se pudieron sincronizar») y sin historial de la última falla.

### Google Drive — estado: implementado, probado solo con Google simulado
| Aspecto | Hallazgo |
|---|---|
| Conexión | OAuth con `drive.appdata` (no sensible; carpeta **oculta** de la app). La función solo consigue el permiso y entrega una llave de ~1 hora; **los datos van directo del navegador al Drive de la persona**, no pasan por nuestros servidores. |
| Qué guarda | `agenda.json` con **toda** la agenda (incluidos los dibujos y sus fotos desde el cambio a IndexedDB) y las últimas 5 versiones. Mezcla de tres vías entre aparatos sin perder datos (30 pruebas de lógica + 39 con Drive simulado + 39 de dibujos). |
| Recuperación | Existe: «Versiones anteriores» con «Restaurar», y «Borrar mi agenda de Drive». |
| Excel y PDF a Drive | **No existe.** Excel, el informe del mes y los PDF se descargan al dispositivo; nada de eso se sube a Drive. |
| Archivos visibles para la persona | **No.** La carpeta oculta no aparece en su Drive: no puede abrir, mover ni compartir esas copias; solo la agenda las usa. Es seguro pero no sirve como «mis archivos». |
| Seguridad en base | Igual que Calendar: seguridad por filas sin políticas, nadie con llave pública lee los permisos. |

Hallazgos y riesgos:
1. **Riesgo nuevo por las fotos grandes.** Desde el cambio a IndexedDB las fotos se guardan a 1600 px. `agenda.json` puede pasar de varios MB, y la subida usa el modo «multipart», pensado para archivos de unos 5 MB o menos; además **cada cambio sube el archivo completo** y cada versión anterior es otra copia completa. Para quien dibuja mucho: más consumo de datos móviles y de espacio en su Drive. **Verificar con una cuenta real y, si se confirma, separar las fotos en archivos propios** (cambio mediano).
2. **Sin prueba real en dos aparatos** (pendiente de Jennifer).
3. **La llave de 1 hora vive en el navegador.** Está limitada a la carpeta oculta de la app, pero una falla de seguridad de la página (XSS) la expondría; el riesgo está acotado.
4. **Estado de la pantalla de consentimiento.** Si en Google Cloud la app sigue en modo «Pruebas», los permisos de renovación caducan a los 7 días y hay tope de 100 usuarias de prueba. Con permisos no sensibles se puede «Publicar» sin verificación. **Hay que revisarlo en la consola** (no se puede ver desde aquí).
5. **Solo un archivo principal.** Si alguien edita `agenda.json` a mano o lo corrompe no hay validación del formato más allá de «es un objeto».

## 2. Matriz de evaluación

Clasificación: **IV** implementada y verificada · **P** parcial · **CL** conectada pero limitada · **NI** no implementada · **NR** no recomendable por ahora.
Complejidad: B baja, M media, A alta. Las cuotas y exigencias de verificación son lo que se conoce de la documentación pública: **confirmar antes de decidir**.

| Servicio | Estado | Funciones verificadas | Funciones pendientes | Módulos que se benefician | Valor | Complejidad | Costos y límites | Prioridad |
|---|---|---|---|---|---|---|---|---|
| **Calendar** | **P** (funciona; verificada con función simulada y 1 cuenta real con creación) | Conectar, crear, actualizar, borrar (simulado), desconectar, trampas de seguridad | Planeador, clases, vencimientos; elegir qué tipos sincronizar; corregir recordatorio y calendario huérfano; probar actualizar/borrar en real | Pedidos, proyectos, ferias, fechas especiales, Planeador | Alto | B | Gratis; permiso no sensible; cuotas altas por defecto, ritmo por usuaria limitado | **1 (afinar)** |
| **Drive (copia oculta)** | **CL** (conectada y probada con Google simulado) | Subir, mezclar, versiones, restaurar, borrar | Prueba real en 2 aparatos; fotos en archivos aparte; ver tamaño | Toda la agenda | Alto | M | Gratis; usa el espacio de la persona; límite de unos MB por subida multipart | **1 (verificar riesgo de tamaño)** |
| **Drive (archivos visibles: Excel, PDF, informes)** | **NI** | — | Subir Excel/PDF a una carpeta «Agenda para tejedoras» visible; copia de seguridad que la persona pueda abrir | Informe del mes, Excel, resultados del negocio | Alto | M | Permiso `drive.file` (no sensible: solo archivos que crea la app); gratis; un permiso más que aceptar | **2** |
| **Sheets** | **NI** | — | Exportar ventas, gastos, pedidos, inventario y presupuesto a una hoja de cálculo propia y actualizarla | Ventas, gastos, inventario de lanas, pedidos, presupuesto | Alto | M | Con `drive.file` suele bastar (no sensible; confirmar). Cuotas de escritura por minuto bajas por usuaria; gratis | **3** (después de Drive visible) |
| **Docs** | **NI** | — | Fichas de proyecto, informes, cotizaciones y patrones editables | Ficha de proyecto, informe del mes, patrón propio | Medio | M | Igual que Sheets; plantillas y formato son trabajo de diseño | **5** |
| **Gmail** | **NI** | — | Enviar informes y cotizaciones; mensajes a clientas | Pedidos, clientas, informe del mes | Medio | B (enlace) / A (envío real) | El permiso de **enviar correos desde su Gmail es sensible** (verificación de Google); leer correos es restringido (auditoría de seguridad anual, costosa): **no** | **Enlace «Escribir por correo» con el mensaje ya redactado (sin permisos): 4. Envío real: NR por ahora** |
| **Forms** | **NI** | — | Formularios de pedido, inscripciones, encuestas | Academia, pedidos personalizados | Bajo | M | Permisos sensibles probables; **ya existen** formularios propios de Lana Rosa con base de datos | **NR por ahora** |
| **Contacts** | **NI** | — | Sincronizar clientas, proveedoras y colaboradoras | Mis clientas, Contactos | Medio | M | Permiso sensible de contactos (verificación); riesgo de privacidad alto: son datos de terceras personas | **NR por ahora** (si se hace: solo exportar a archivo `.vcf`/CSV, sin permiso) |
| **Tasks** | **NI** | — | Tareas y recordatorios en Google | Planeador del día | Bajo | B | Permiso sensible; duplica el Planeador propio | **NR por ahora** |
| **Meet** | **NI** | — | Enlace de reunión para clases virtuales y asesorías | Academia, clases personalizadas | Medio | M | Se hace creando el evento de Calendar con enlace de Meet (confirmar si `calendar.app.created` lo permite); los límites de tiempo de Meet gratuito para grupos hay que confirmarlos | **6** (cuando haya clases virtuales) |

## 3. Aprovechamiento por línea de negocio

Aclaración importante: la **Agenda para tejedoras** usa la cuenta de Google **de cada usuaria**. Las integraciones de la propia Lana Rosa (por ejemplo, calendario de la Academia, inscripciones, correos a estudiantes) serían otro tema: usarían la cuenta de Google de la empresa y otra arquitectura.

- **Productos tejidos y amigurumis:** entregas y envíos en Calendar (ya existe), informe del mes y resultados como Excel/PDF en un Drive visible, y un enlace de correo con el mensaje de seguimiento de pedido ya escrito (sin permisos).
- **Mercería:** exportar inventario de lanas, compras y proveedoras a Sheets; hoy solo existe el Excel descargable y los avisos dentro de la agenda.
- **Academia:** clases pedidas como eventos de Calendar, con enlace de Meet cuando sean virtuales; las inscripciones ya existen como lista de espera en la base, así que no hace falta Forms.
- **Aplicaciones y herramientas digitales:** copias de seguridad que la persona pueda abrir (Drive visible), exportaciones a Sheets y un informe de gestión en Docs/PDF.

## 4. «Conexiones e integraciones» (centro de conexiones)

**Recomendación: sí, y es la pieza que menos cuesta.** Hoy hay dos tarjetas sueltas en ⚙️ Configuración → «Conectar con Google». Ya existen casi todos los datos que haría falta:
estado, correo conectado, última sincronización, conectar y desconectar (en cada servicio). Faltan: permisos explicados, qué se sincroniza (con interruptores), último error, exportaciones y copias.

Propuesta por etapas, cada una a aprobar por separado:
1. **Hoja «Conexiones e integraciones»** con una tarjeta por servicio (estado, correo, última vez, errores, conectar/desconectar, qué permiso se pidió y qué NO puede hacer). Solo reorganiza lo existente.
2. **Interruptores de qué sincronizar** en Calendar (pedidos, envíos, proyectos, fechas especiales, ferias, cumpleaños) y en Drive (incluir fotos de dibujos o no).
3. **Registro de exportaciones y copias** (cuándo se hizo la última copia, cuántas versiones hay, descargar la última).
4. **Drive visible** para Excel, PDF y copias abribles; después Sheets.

Principios: cada persona conserva el control; nada se conecta ni se sube solo; cada permiso se explica en lenguaje claro; «Desconectar» siempre disponible y borra lo que la app creó.

## 5. Prioridad recomendada

1. **Antes de crear nada nuevo:** verificar con una cuenta real (a) dos aparatos con Drive, (b) el riesgo de tamaño del archivo con fotos, (c) actualizar y borrar eventos en Calendar y reconectar sin desconectar, y (d) que la pantalla de consentimiento esté **publicada** y no en «Pruebas».
2. Arreglos pequeños de Calendar (texto del recordatorio, calendario huérfano, aviso de 300 eventos).
3. Hoja «Conexiones e integraciones» (etapa 1).
4. Drive visible (Excel, PDF, copias abribles) con permiso `drive.file`.
5. Sheets, enlace de correo, Meet, Docs, en ese orden. Forms, Contacts, Tasks y envío real por Gmail: no por ahora.

## 6. Decisiones que necesito de Jennifer

- Confirmar en Google Cloud el estado de publicación de la app (Pruebas o Producción) y mirar el uso de cuotas.
- Hacer la prueba real de dos aparatos con Drive y de Calendar (actualizar y borrar).
- Elegir qué etapa de la sección 4 sigue y si el Drive visible es prioridad.
- Decidir si algún día se quiere el envío real por Gmail (implica verificación de Google y más tiempo).

# Agenda para tejedoras — estado de cada función (documento de referencia)

Fecha de esta versión: 30-oct-2026. **De aquí salen los textos** del tutorial, las políticas, la interfaz, las preguntas frecuentes, `llms.txt` y Rosina. Si cambia el estado de una función, se cambia primero aquí y luego en cada lugar de la última columna.

Estados: **Disponible** · **Opcional** (la persona lo activa) · **Apagada** · **Próximamente**.

| Función | Estado hoy | Qué se le dice a la persona | Dónde está el texto |
|---|---|---|---|
| Agenda con cuenta | Disponible | Se usa con una cuenta de Lana Rosa (correo, sin contraseña). 39 hojas. | `agenda-rosina.html`, `academy/index.html`, `academy/preguntas-frecuentes/`, `llms.txt`, `index.html`, `recursos-rosina.html`, hub de Rosina (`generar_universo_casas.py`) |
| Prueba gratis | Disponible | 7 días con todas las hojas, desde que se crea la cuenta (las cuentas anteriores al 29-oct tienen hasta el 5-nov). | `js/agenda/membresia.js`, `politicas.html#membresia`, tour (paso 6), Rosina (`GUIA_AGENDA`) |
| Pestañas gratis después de la prueba | Disponible | Inicio, Mi tablero y Mis proyectos. | igual que arriba |
| Membresía | Disponible | Materiales, Emprendimiento, Finanzas del negocio y Fechas y bienestar: $5.000 COP al mes o $45.000 COP al año; pago con Wompi, sin renovación automática. El candado es de la página; lo escrito sigue en el dispositivo. **Texto legal pendiente de revisión de la abogada.** | `politicas.html#membresia`, `js/agenda/membresia.js`, `crear-pago-wompi` (precios) |
| Datos escritos en las hojas | Disponible | Se guardan en el dispositivo (navegador), no por cuenta; nadie del equipo los ve. Cerrar sesión no los borra. | apartado «¿Dónde se guardan mis datos?» (⚙️ Configuración), `academy/preguntas-frecuentes/`, `GUIA_AGENDA`, `politicas.html#datos` |
| Aviso de agenda de otra cuenta en el mismo navegador | Disponible | Pregunta antes de mostrar hojas escritas por otra cuenta. | `js/agenda/dueno.js`, `GUIA_AGENDA` |
| Copia en la cuenta (nube) | Opcional, gratis | Solo con autorización expresa; se recupera sola si la agenda del dispositivo queda vacía; se puede borrar. | ⚙️ Configuración, `politicas.html#datos` apartado 11 (`VERSION_NUBE` = `fn_nube_version()` = 2026-10-27) |
| Copia en archivo (.json) | Disponible | «Guardar una copia» / «Cargar una copia». | ⚙️ Configuración |
| Google Calendar | Opcional, gratis | Crea el calendario aparte «Agenda para tejedoras» (permiso no sensible); «Desconectar» lo borra. Desde el 29-oct (estuvo apagado del 13 al 29-oct). | `js/agenda/google-calendar.js`, `politicas.html#datos` apartado 10, tour (paso 4), `GUIA_AGENDA` |
| Archivo .ics y «Añadir a Google Calendar» por fila | Disponible | Fechas al calendario sin conectar nada. Con la membresía vencida no incluye fechas de hojas bloqueadas. | ⚙️ Configuración |
| Exportar a Excel | Disponible | Un libro .xlsx con una hoja por cada hoja con datos, con importes y fechas reales. Con la membresía vencida no incluye las hojas bloqueadas. | ⚙️ Configuración |
| Conexiones entre hojas | Disponible (solo al tocar el botón) | Pedidos «Entregado» → Mis ventas; lanas con 0 ovillos → Lista de compras; Diario de tejido → Mi año tejiendo. | `js/agenda/conexiones.js`, `GUIA_AGENDA` |
| Dictar (voz) | Disponible | Usa el servicio de voz del navegador; Lana Rosa no guarda el audio. | `politicas.html#datos`, tour |
| Lápiz digital | Disponible, **falta probar con lápiz real en iPad y Samsung** | Lápiz digital y mouse dibujan; el dedo mueve la página salvo «Dedo». | tour, `GUIA_AGENDA` |
| App instalable | Disponible | Ícono redondo; funciona sin internet. | `js/agenda/app.js`, tour |
| Chat de Rosina | Disponible | Explica la agenda; no ve lo que la persona escribió. | `js/rosina-chat.js`, `rosina-web` (`GUIA_AGENDA`) |
| Cursos virtuales (hoja Aprende y compra) | Próximamente | «Muy pronto». | `js/agenda/ecosistema.js` |

## Pendientes de decisión
- Revisión de la abogada: `politicas.html#membresia` (precios y prueba), `#ia-chat` (alinear con el aviso del chat) y un plazo de conservación de la copia en la nube por inactividad.
- Si se agrega o cambia una función: actualizar esta tabla, `GUIA_AGENDA` (y desplegar `rosina-web`), el tutorial (`tour.js`), `politicas.html` y las preguntas frecuentes.

## Idiomas (31-oct-2026)
| Función | Estado | Dónde está el texto |
|---|---|---|
| Selector ES / EN / PT | Etapa 1: menú, Mi panel, secciones, Configuración, títulos de hojas, pie | `js/agenda/idioma.js`, `js/agenda/i18n/`, `herramientas/agenda-idiomas/` |
| Cuerpo de las hojas, tutorial, avisos y Rosina en otros idiomas | Pendiente (etapas 2 y 3) | — |
| Políticas en otros idiomas | No: quedan en español hasta la revisión de la abogada | `politicas.html` |
| Tutorial, avisos, ventanas del navegador, dictado y chat de Rosina en otros idiomas | Hecho (etapa 3, 31-oct-2026) | `datos_etapa3.py`, `idioma.js`, `rosina-web` v38 |
| Ventanas legales (copia en la nube, pago de membresía), WhatsApp, .ics, cálculos de Prendas a medida | Siguen en español a propósito | — |
| Avisos de hoy y consejo de Rosina (Mi panel) | Hecha 31-oct-2026 (Plus, etapa 1): entregas atrasadas o próximas, saldos y proyectos vencidos; un consejo descartable. Gratis | `js/agenda/panel.js`, `probar_agenda_avisos.py` |
| Menú lateral que se esconde (computador) y barra de íconos (tableta) | Hecha 31-oct-2026 | `js/agenda/menu-lateral.js`, `css/agenda-menu.css`, `probar_agenda_menu.py` |
| Meta de ventas del mes y «¿Cuánto necesito vender al mes?» (membresía) | Hecha 31-oct-2026 (Plus, etapa 2) | `js/agenda/metas-ventas.js`, `probar_agenda_metas.py` |
| Gráficas del negocio: punto de equilibrio (Mi panel y finanzas), ventas contra meta y utilidad por mes | Hecha 31-oct-2026 (Plus) | `js/agenda/graficas.js`, `probar_agenda_graficas.py` |

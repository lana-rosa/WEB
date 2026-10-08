# Verificación de la app con Google (Google Calendar) — textos y guion

Preparado el 8-oct-2026. Sirve para quitar el aviso "Google no ha verificado esta app" y el límite de 100 personas. El permiso `calendar.events` es **sensible**, así que Google pide: dominio verificado, política de privacidad con ciertas frases, justificación del permiso y un video. El texto para Google va en **inglés** (lo revisa un equipo internacional). El texto para la política publicada va en español.

## 1. Antes de enviar (lista de chequeo)
- [ ] **Dominio verificado en Google Search Console** (`lanarosacrochet.com`) con la **misma cuenta** que es propietaria del proyecto `lana-rosa-web` en Google Cloud. Search Console → Agregar propiedad → Dominio → registro TXT en Cloudflare (DNS).
- [ ] Política de privacidad publicada con la sección de Google Calendar (texto de la sección 2), en `https://lanarosacrochet.com/politicas.html#datos`, revisada por la abogada.
- [ ] La página principal `https://lanarosacrochet.com` es pública, describe la app y enlaza a la política (ya lo hace el pie de página).
- [ ] El nombre de la app en la pantalla de consentimiento ("Lana Rosa Crochet") coincide con lo que se ve en la web y en el video.
- [ ] Permisos (scopes) del proyecto: solo `calendar.events`, `openid` y `userinfo.email`. (Nada más.)
- [ ] Video grabado y subido a YouTube como **No listado** (sección 4).
- [ ] Google Cloud → Google Auth Platform → **Centro de verificación** → completar y **Enviar para verificación**.

## 2. Texto para agregar a la política de datos (español, para revisión de la abogada)
Va dentro de `politicas.html#datos`, como un apartado nuevo.

> **Conexión opcional con Google Calendar.** La Agenda de Rosina permite, si la persona lo decide, conectar su Google Calendar para que las fechas que ella escribe en la agenda (pedidos, proyectos, fechas especiales, entre otras) aparezcan como eventos en su calendario. Esta conexión es voluntaria y puede retirarse en cualquier momento desde la propia agenda ("Desconectar") o desde la página de permisos de su Cuenta de Google.
>
> **Qué permiso pedimos y para qué.** Solo solicitamos el permiso de Google Calendar para *ver y editar eventos* (`calendar.events`) y el correo de la cuenta (para mostrar con cuál cuenta está conectada). Usamos ese permiso únicamente para crear, actualizar y borrar los eventos que nuestra agenda genera. **No leemos, copiamos ni almacenamos los demás eventos de su calendario.**
>
> **Qué guardamos.** Guardamos el permiso de acceso que Google entrega, de forma cifrada, y la relación entre cada fecha de la agenda y su evento. Las fechas y textos de la agenda se envían a nuestro servidor (Supabase) solo mientras la conexión esté activa, para crear los eventos. Al desconectar, revocamos el permiso en Google y borramos lo guardado; los eventos que ya se crearon se quedan en su calendario.
>
> **No compartimos esta información.** No vendemos ni transferimos datos obtenidos de Google a terceros, no los usamos para publicidad ni para entrenar modelos de inteligencia artificial, y ninguna persona de nuestro equipo los lee, salvo si es necesario para brindarle soporte a petición suya o por una obligación legal.
>
> El uso y la transferencia a cualquier otra aplicación de la información recibida de las APIs de Google se ajustarán a la [Política de datos de usuario de los servicios de API de Google](https://developers.google.com/terms/api-services-user-data-policy), incluidos los requisitos de uso limitado (*Limited Use*).

**Frase en inglés que Google busca textualmente** (conviene dejarla tal cual al final del apartado):

> Lana Rosa Crochet's use and transfer to any other app of information received from Google APIs will adhere to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.

## 3. Justificación del permiso (para pegar en el formulario de Google, en inglés)

**Scope:** `https://www.googleapis.com/auth/calendar.events`

**How will the scope be used? (Scope justification)**
> Lana Rosa Crochet is a handmade-crochet business in Colombia. Our website includes a free "Rosina's Planner" (agenda-rosina.html) where crocheters keep their orders, projects and special dates. An optional feature lets a signed-in user connect their Google Calendar so that the dates in the planner appear as all-day events in their primary calendar, with a reminder the evening before. We need the `calendar.events` scope to create, update and delete only those events that our planner generated (each one is tagged with a private property so we can find it again). We do not read, list, copy or store any other events from the user's calendar. We chose this scope because it is the narrowest one that allows creating and editing events; the broader `calendar` scope is not needed and not requested. The user can disconnect at any time from the planner (we revoke the token at Google and delete our stored data) or from their Google Account permissions page.

**Why is a narrower scope not enough?**
> `calendar.events.owned` and `calendar.app.created` (calendar-only) are not suitable because the user wants the events to appear in their own primary calendar, next to their other events. `calendar.events` is the minimal scope that allows writing to the primary calendar.

*(Antes de enviar: confirmar en la documentación de Google si hay un alcance más estrecho disponible, por ejemplo `calendar.app.created` con un calendario propio de la app. Si lo hay, evaluar si conviene pedir ese en lugar de `calendar.events`: se verifica más rápido, aunque las fechas quedarían en un calendario aparte "Agenda de Rosina" y no en el principal.)*

**Data handling (resumen para el formulario)**
- Datos de Google que se reciben: refresh token de OAuth y correo de la cuenta.
- Almacenamiento: base de datos Supabase, el token **cifrado** (AES-GCM); acceso restringido por reglas de seguridad a nivel de fila; solo la función del servidor lo lee.
- Retención: hasta que la persona desconecte; al desconectar se borra y se revoca.
- No se comparten con terceros, no se usan para publicidad ni para entrenar modelos.

## 4. Guion del video (1,5 a 3 minutos, sin voz o con subtítulos en inglés)

Google pide que el video muestre: (a) la pantalla de consentimiento de OAuth con el **ID de cliente visible en la barra de direcciones**, (b) cómo la persona otorga el permiso, (c) cómo la app usa el permiso, (d) cómo se ve el resultado en Google Calendar. Graba la pantalla del **computador** (Chrome), con la **cuenta de Google en inglés** (Configuración de Google → Idioma: English) para que el consentimiento salga en inglés. Usa una cuenta de prueba. Habla despacio o pon subtítulos.

| # | Qué se ve | Qué decir o subtitular (inglés) |
|---|---|---|
| 1 | Página de inicio `lanarosacrochet.com` y luego el menú → Rincón de Rosina → Agenda de Rosina | "This is Lana Rosa Crochet, a handmade crochet shop. Rosina's Planner is a free tool for crocheters." |
| 2 | Agenda abierta con sesión iniciada; se ven pedidos / fechas especiales de ejemplo | "The user keeps orders, projects and special dates in the planner." |
| 3 | Bajar a la tarjeta **Google Calendar** y mostrar el texto (que dice qué hace) y el enlace a la política de privacidad | "At the bottom, the user can optionally connect Google Calendar. We explain what it does and link to our privacy policy." |
| 4 | Tocar **Conectar con Google Calendar** | "The user clicks Connect." |
| 5 | **Pantalla de Google (consentimiento).** Detener 5 segundos con la **barra de direcciones visible** (se ve `client_id=…`); se lee el nombre de la app y el permiso "See, edit, share, and permanently delete…" / "View and edit events on all your calendars" | "Google asks for permission. The app is Lana Rosa Crochet and the only calendar permission is to view and edit events." |
| 6 | Tocar **Continue / Allow** | "The user grants access." |
| 7 | Vuelta a la agenda: se ve "Conectado con tu@correo" | "The planner now shows the connected account." |
| 8 | Tocar **Sincronizar ahora** | "The planner creates the events." |
| 9 | Abrir Google Calendar en otra pestaña: se ven los eventos de la agenda, abrir uno (título, fecha, recordatorio) | "The events appear in the user's calendar, as all-day events with a reminder the evening before." |
| 10 | Volver a la agenda, cambiar una fecha o borrar un pedido, sincronizar, y mostrar en Google Calendar que el evento cambió o se borró | "If the user edits or deletes an item, the event is updated or deleted. We only touch events created by our planner." |
| 11 | Tocar **Desconectar** y confirmar | "The user can disconnect at any time. We revoke the token at Google and delete our stored data." |
| 12 | (Opcional) Abrir `myaccount.google.com/connections` y mostrar que la app ya no aparece | "The app no longer has access to the account." |
| 13 | Mostrar `lanarosacrochet.com/politicas.html#datos`, el apartado de Google Calendar y la frase de *Limited Use* | "Our privacy policy describes this use and follows the Google API Services User Data Policy, including the Limited Use requirements." |

Consejos: resolución 1080p o más; sin música; sin mostrar contraseñas ni correos de clientas reales; subir a YouTube como **No listado** y pegar el enlace en el formulario.

## 5. Después de enviar
- Google responde por correo (a los contactos del proyecto). Puede pedir ajustes (casi siempre: política, dominio o video). Responder sobre el mismo hilo.
- Aprobada la verificación: ya no sale el aviso y se quita el límite de 100 personas. Entonces se anuncia la función (Agenda, Revista, redes).
- Si no se quiere esperar: dejar la función como está (hasta 100 personas con aviso) y avisar a las clientas cómo continuar ("Configuración avanzada → Ir a Lana Rosa Crochet").

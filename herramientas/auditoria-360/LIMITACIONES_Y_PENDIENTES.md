# Limitaciones y pendientes de la auditoría 360 (22-oct-2026)

Qué no se pudo comprobar, por qué, y cómo se completa. Lo que figura aquí **no se cuenta como aprobado**.

## 1. Lo que no se pudo hacer desde el entorno de la auditoría

| # | Qué faltó | Por qué | Cómo se completa | Hallazgo relacionado |
|---|---|---|---|---|
| L1 | Abrir la web publicada (`lanarosacrochet.com`) | El entorno no tiene salida a internet hacia ese dominio (la resolución del nombre falla). La única evidencia de producción es el rastreo que hace GitHub Actions (ejecución 42, 22-oct 19:53 UTC): 70 páginas, 0 distintas de 200, 363 recursos únicos, 0 rotos, 54 canonical bien | Abrir a mano las 7 direcciones de la sección 2 | — |
| L2 | Leer funciones y permisos de la base con SQL | Tras restablecer la contraseña de la base, el SQL Editor y el conector de Claude responden «password authentication failed for user postgres» (el ERP y la web sí funcionan). Sí se pudo usar el asesor de seguridad y leer el código de las Edge Functions | Restablecer la contraseña una vez más cuando `status.supabase.com` esté limpio, actualizar `SUPABASE_DB_URL` y repetir | SEG-01, SEG-02, SEG-03, DAT-02 |
| L3 | Comprobar los 355 enlaces externos (21 direcciones distintas: Instagram, Facebook, TikTok, YouTube, Google Maps, `share.google`, Google Tag Manager, Supabase) | Sin salida a internet | `curl -sIL <dirección>` desde una red con internet o abrirlas en el navegador (las redes sociales a veces responden 403 a programas aunque la página exista) | — |
| L4 | Un pago real o de pruebas con Wompi | Sin acceso a la red del proveedor y sin permiso para cobrar. El flujo se probó con respuestas simuladas | Un pago de pruebas con tarjeta de pruebas y uno real pequeño | FUN-01 |
| L5 | Android e iPhone reales: visor 3D y realidad aumentada, instalación de las apps, QR impresos, inicio de sesión con Google | Solo hay Chromium en el servidor | Lista de la sección 3 | FUN-02 |
| L6 | Lector de pantalla (VoiceOver, TalkBack, NVDA) | No hay uno disponible | Recorrer los 6 flujos clave con VoiceOver o TalkBack | ACC-09 |
| L7 | Cabeceras de seguridad, HTTPS obligatorio, HSTS, TLS mínimo, reglas de Cloudflare | No se pueden leer sin acceso a producción ni al panel | Sección 3 | SEG-06, SEG-15 |
| L8 | PageSpeed real, Search Console, diagnóstico de Merchant Center | Son servicios de Google con cuenta | Sección 3 | REN-01, CON-04 |
| L9 | Ajustes de Supabase Auth (URLs de redirección, límites de envío del código, expiración), políticas de los buckets, secretos de las funciones | Solo se ven en el panel | Sección 3 | SEG-15 |
| L10 | Datos de clientes reales, pruebas de carga, pruebas destructivas, ataques de fuerza bruta, explotación activa | **Excluido a propósito** por las reglas de la auditoría | — | — |
| L11 | Revisión humana completa de la redacción de las 60 páginas | Se hicieron comprobaciones automáticas en las 60 (ortografía, valores de marca, precios, plazos, medios de pago, horarios) y lectura dirigida; no se leyó cada artículo de principio a fin | Si Sara lo pide, una lectura editorial de los 19 artículos | — |
| L12 | Código de `enviar-correo` e `indicadores-crm` (ERP), y revisión completa de `rosina-web` y `google-calendar` | Se leyeron 12 de 16 funciones completas y 2 en parte; esas 4 no | Leerlas en una segunda pasada | — |
| L13 | ERP (otro repositorio) y CRM | Fuera del alcance pedido (solo la web) | Auditoría aparte | — |
| L14 | Base de vulnerabilidades de las librerías | Sin internet | `npm audit` desde un equipo con internet | SEG-14 |

## 2. Lo que solo puede ver Sara (lista de comprobación, 20-30 minutos)

Cada punto dice qué abrir y qué debería ver. Si algo no coincide, tomar captura y pasármela; no hay que cambiar nada.

**A. Direcciones sin enlaces entrantes (el rastreo automático no llega):**
1. `https://lanarosacrochet.com/404.html` → «Esta página se nos destejió».
2. `https://lanarosacrochet.com/pagina-que-no-existe` → la misma página (así se ve un enlace roto).
3. `https://lanarosacrochet.com/offline.html`, `/baja-recordatorios.html`, `/3d-prueba.html` → abren (la última es de prueba y está oculta).
4. `https://lanarosacrochet.com/gracias.html?ref=prueba` → «No encontramos ese pedido».
5. `https://lanarosacrochet.com/PENDIENTES.md` y `/herramientas/` → deben dar 404 (ya lo comprobó el 20-oct).

**B. Cloudflare** (panel → el dominio):
1. SSL/TLS → modo **Full (strict)**; «Always Use HTTPS» activado; «Minimum TLS Version» 1.2; HSTS activado (SEG-06, SEG-15).
2. Scrape Shield → **Email Address Obfuscation**: desactivarlo si se quiere que el correo se vea para todos (PRI-03).
3. Anotar si hay reglas de cabeceras (Rules → Transform Rules). Hoy no se pudo ver ninguna.

**C. GitHub** (repositorio WEB → Settings):
1. Pages → «Enforce HTTPS» marcado.
2. Branches → regla para `main` (PR obligatorio y chequeo «Revisar enlaces»): SEG-08.
3. Actions → los correos de aviso de fallos activos en tu cuenta (así te enteras si falla la copia).
4. Cuenta: verificación en dos pasos activada.

**D. Supabase** (panel):
1. Authentication → URL Configuration: que solo estén `https://lanarosacrochet.com` y las direcciones de pruebas que uses.
2. Authentication → Rate limits y expiración del código del correo: anotar los valores.
3. Storage: buckets públicos (`guias-envio`, `produccion-fotos`, `fotos-productos`) y que `solicitudes-personalizadas` y `patrones` sean privados.
4. Cuenta del panel con verificación en dos pasos.

**E. Google:** Merchant Center → Productos → Diagnóstico: ¿advertencias de disponibilidad en los tres «Amigurumi personalizado»? (CON-04). Search Console → páginas indexadas y errores. PageSpeed Insights en celular para inicio, tienda, Personaliza, Mercería y Academy, tres veces cada una.

**F. Otras cuentas con verificación en dos pasos:** Google (Tag Manager y Analytics), Wompi, Cloudflare, el correo de contacto.

## 3. Pruebas en teléfonos reales (para quien tenga un Android y un iPhone)

1. Abrir `/3d-prueba.html`, tocar «Ver en 3D» y «Ver en tu espacio» (realidad aumentada).
2. Instalar cada app (Crochet, Mercería, Academy) desde el botón «Instalar app» del pie; abrir sin internet y ver `offline.html`.
3. Imprimir una hoja de etiquetas QR y escanearla con la cámara (debe abrir `/p/?i=…`).
4. Iniciar sesión con Google desde `cuenta.html` y con el enlace al correo.
5. Un pago de pruebas con Wompi (tarjeta de pruebas) y luego uno real pequeño: pedido en el ERP, correo de recibo, pedido en el CRM, estado «pagado» en `gracias.html`.
6. VoiceOver o TalkBack: inicio → tienda → agregar → carrito → pago, y Personaliza.

## 4. Pendientes de auditorías y listas anteriores que siguen abiertos

Vienen de `PENDIENTES.md` y de `herramientas/auditoria-integral-2026-10-17.md`; no se cierran con esta auditoría:

- **Abogada:** política de datos (copias de seguridad y transferencia internacional; chat de Rosina con proveedor de IA; cuentas, favoritos, direcciones y reseñas), retracto y garantías, condiciones de la membresía y de los patrones, imágenes de ChatGPT y Gemini y nombre de la aventura de Rosina. Además, confirmar el plazo de devolución del dinero que dice la Mercería («quince (15) días calendario») frente a lo que fija la norma vigente: la web no afirma un error, pero yo no pude verificar el plazo legal actual.
- **Supabase:** protección contra contraseñas filtradas (plan Pro); 139 funciones sin `search_path` fijo.
- **Mercería:** cargar existencias en la Tienda (no el Taller), 34 fotos, bolsas y «Base para amigurumi» en la entrada de mercancía, prueba de un ovillo con Wompi, aviso a quienes pidieron «Avísame cuando abra».
- **Apertura 15-16 nov:** conteo de inventario, ensayo de caja, cuentas bancarias, revisar que corra `activar-apertura`.
- **23-dic:** comprobar que las fotos de referencia se borraron solas a los 90 días.

## 5. Correcciones a lo que yo dije antes

- Al entregarte las 58 direcciones, el recuento por grupos decía «Revista (21)» y «20 artículos». Lo correcto es **20 direcciones de Revista** (la portada y 19 artículos). El total de 58 era correcto.
- En la prueba de consentimiento (`prueba_consentimiento.py`) quedó una referencia a la casilla que quitamos el 22-oct (PRU-01). Fue un descuido mío.
- El pie unificado de `404.html` y `baja-recordatorios.html` (PR #383 y #400) dejó textos casi invisibles (ACC-01) y el pie con íconos de redes (PR #382) no muestra el foco del teclado (ACC-02). Fueron cambios míos; no los detecté antes.

## 6. Reglas que se respetaron

- **No se cambió ningún archivo de la web, ni la base, ni precios, políticas, textos o configuraciones.** Todo lo de esta auditoría está en `herramientas/auditoria-360/`, carpeta interna que el flujo «Publicar el sitio» no publica, en la rama `claude/sweet-hypatia-6sqpmv` (no en `main`). No se hizo ninguna fusión ni publicación.
- No se hicieron compras ni cobros, no se tocaron datos reales y no se accedió a información de clientes. No se ejecutó ninguna de las cuatro funciones de SEG-01.
- Las pruebas funcionales usaron un servidor local y respuestas simuladas; la única evidencia de producción salió de un flujo de GitHub que ya existía y solo lee.
- No se hicieron pruebas destructivas, de fuerza bruta, de carga ni explotación activa.

## 7. Cómo repetir las mediciones (todo en `herramientas/auditoria-360/scripts/`)

Con la web servida en local (`python3 -m http.server 8765` desde la raíz del repositorio):

| Script | Qué hace |
|---|---|
| `rastrear.py` + `analizar_rastreo.py` | 70 rutas a 390 y 1280 px: HTTP, SEO, axe-core 4.14, errores de JavaScript, desbordes |
| `rastrear_teclado_reflujo.py` | Reflujo a 320 px, foco con Tab, enlace «Saltar», objetivos pequeños |
| `probar_flujos_tienda.py` | Búsqueda, ficha, carrito, teclado y pago de 4 pasos (50 comprobaciones) |
| `probar_flujos_servicio.py` | gracias, baja, 404, sin conexión, cuenta, agenda, recursos, glosario, calculadora, Revista, FAQ y contacto (37) |
| `probar_xss_catalogo.py` | Prueba local de SEG-04 |
| `inventario_enlaces.py` | Inventario de enlaces y recursos con archivo y línea |
| `medir_rendimiento.py` | Peso, solicitudes, LCP, CLS y bloqueo en laboratorio |
| `construir_entregables.py` + `hallazgos_datos.py` | Genera `INVENTARIO_PAGINAS.csv` y `REGISTRO_HALLAZGOS.csv` |

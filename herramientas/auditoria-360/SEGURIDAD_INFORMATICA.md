# Seguridad informática — auditoría 360 (22-oct-2026)

**Alcance y método.** Revisión **estática y no intrusiva**: lectura de código (web, 12 de 16 funciones de Supabase completas y 2 parciales), del asesor de seguridad de Supabase, de la configuración de GitHub y de los flujos de trabajo, rastreo y pruebas con datos simulados en un servidor local. **No es una prueba de penetración**: no se atacó nada, no se tocaron datos reales y no se ejecutó ninguna función de la base. Referencias: OWASP Top 10 (2021) y los controles de ASVS que se pudieron comprobar de forma estática. Los hallazgos están en `REGISTRO_HALLAZGOS.csv` con su evidencia y cómo comprobarlos; aquí se resumen.

**Lo que no se pudo ver** (ver `LIMITACIONES_Y_PENDIENTES.md`): la web publicada y sus cabeceras, Cloudflare, los ajustes de Supabase Auth y de Storage, y el SQL de la base (caído hoy).

## 1. Resumen

| Prioridad | En seguridad | Hallazgos | Relacionados de privacidad y datos |
|---|---|---|---|
| P0 (detener hoy) | 0 | — | — |
| P1 | 1 | SEG-01 (cuatro funciones del taller abiertas a la llave pública; **no se pudo comprobar su daño**) | — |
| P2 | 5 | SEG-02, SEG-03, SEG-04, SEG-07 y SEG-15 (verificación pendiente) | PRI-01, PRI-02, DAT-01, DAT-02 |
| P3 | 9 | SEG-05, SEG-06 y SEG-08 a SEG-14 | PRI-03, PRI-04 |

Lo más importante:

1. **SEG-01 (P1, riesgo potencial).** El asesor de seguridad de Supabase (22-oct 20:54 UTC) muestra 4 funciones internas del taller (`fn_tejido_guardar_plan` en dos versiones, `fn_tejido_guardar_capacidad`, `fn_sugerencias_tejido` y `fn_agendar_pedido_anticipo_bajo`) que cualquier visitante con la llave pública puede ejecutar. No están en ningún repositorio ni las llama la web ni el ERP. **No las ejecuté** y no pude leer su cuerpo (el SQL sigue caído). Si no validan el rol por dentro, un visitante podría leer sugerencias de tejido o escribir planes y avisos de anticipo. Es lo primero que hay que cerrar cuando vuelva el acceso: una línea `revoke execute … from public, anon` por función.
2. **SEG-04 (P2, defecto confirmado en local).** La tienda y los carritos pintan nombre, descripción, especificaciones y cuidados del catálogo como HTML sin escapar. Lo comprobé con datos simulados: un `<img onerror>` en el nombre del producto se ejecuta (`probar_xss_catalogo.py`). Hoy solo puede escribir esos datos el personal del ERP, así que el riesgo depende de que esa cuenta o la base se vean comprometidas o de un error al pegar texto; pero ahí vive la sesión de la clienta y el pago. La Mercería sí escapa, así que la corrección es copiar su función.
3. **SEG-07 (P2).** Las copias cifradas de la base se guardan 90 días como archivos de un repositorio **público**. Están cifradas con AES-256 y una contraseña; todo depende de que esa contraseña sea larga y secreta. Conviene pasarlas a un repositorio privado (gratis).
4. **SEG-03 (P2).** Hay 315 funciones del ERP que cualquier cuenta con sesión puede ejecutar y cualquiera puede crear una cuenta. Las protege una guarda de rol que se puso el 15-oct en las 132 que había; hoy hay 25 más y no pude comprobar que la tengan.

## 2. Mapa OWASP Top 10 (2021)

Cobertura: **Alta** = revisado con evidencia directa; **Media** = revisado en parte o solo estático; **Baja** = apenas tocado; **No** = no evaluado.

| Categoría | Cobertura | Qué se comprobó | Hallazgos |
|---|---|---|---|
| A01 Control de acceso roto | Media | Asesor de Supabase: 0 tablas sin RLS; 30 tablas con RLS y sin políticas (cerradas: solo se leen por funciones o con la llave de servicio); `verify_jwt` de las 16 funciones; descargas de patrones con sesión y enlace firmado de 5 minutos; fotos de referencia en bucket privado con borrado a los 90 días; guardas de rol dentro de funciones: no re-verificadas | SEG-01, SEG-02, SEG-03, SEG-09, SEG-10 |
| A02 Fallas criptográficas | Media | Firma de integridad de Wompi (SHA-256 en el servidor), verificación de la firma del evento y segunda consulta a Wompi; copias AES-256; sin secretos en el repositorio (HEAD y 611 confirmaciones: 0 coincidencias); TLS y HSTS: no verificables | SEG-07, SEG-15 |
| A03 Inyección | Media | La web solo llama funciones y rutas REST parametrizadas (sin SQL armado en el navegador); las funciones de pago limpian `<` `>` y controles; XSS: ver SEG-04 y SEG-05 | SEG-04, SEG-05 |
| A04 Diseño inseguro | Media | Precio, descuento y envío siempre se calculan en el servidor; pedidos con referencia única; formulario de personalizados con límites por teléfono e IP; casilla premarcada de crear cuenta; sin límite en la creación de pedidos | PRI-01, SEG-10, SEG-11, SEG-02 |
| A05 Configuración incorrecta | Media | Sin CSP ni cabeceras verificables; `main` sin protección; funciones sin uso desplegadas; CORS `*` en 3 funciones; 63 de 70 rutas usan manejadores en línea (`onerror=`), lo que obliga a `unsafe-inline` en una futura CSP | SEG-06, SEG-08, SEG-09, SEG-11 |
| A06 Componentes vulnerables | Baja | `supabase-js` 2.117.3 y `model-viewer` 4.3.1 alojados; 7 funciones con importación sin versión exacta; sin base de vulnerabilidades (sin internet) | SEG-12, SEG-14 |
| A07 Fallas de identificación y autenticación | Media | No hay contraseñas (enlace al correo o Google); la sesión vive en `localStorage` (norma de `supabase-js`); ajustes de Auth no visibles | SEG-15 |
| A08 Integridad de software y datos | Media | Flujos de GitHub con acciones oficiales fijadas por etiqueta (no por huella); la publicación excluye herramientas, notas y `.md`; la prueba de restauración (corre el día 1 de cada mes) pasó el 22-oct; Google Tag Manager es un tercero con acceso a todas las páginas (control en la cuenta de Google) | SEG-12, SEG-15 |
| A09 Registro y monitoreo | Baja | GitHub avisa por correo si falla un flujo; no se leyeron registros de Supabase (traen datos de clientes); sin alertas de pagos fallidos | — |
| A10 Falsificación de solicitudes del servidor | Alta | Las funciones solo piden direcciones fijas (Wompi, PayPal, el CRM y el almacenamiento del CRM con prefijo fijo); ninguna usa una dirección que mande el visitante | ninguno |

## 3. Controles que funcionan (evidencia)

- **Precios y envío en el servidor.** `crear-pago-wompi` (versión 34 desplegada, igual a la copia del repositorio por comparación visual) lee precio, categoría y existencias de la base; el navegador solo manda identificadores y cantidades. Mezclas no permitidas (patrones con físicos, materiales con tienda) se rechazan.
- **Webhook de Wompi.** Verifica la firma del evento, vuelve a pedir la transacción a Wompi, compara referencia y monto, no degrada pedidos ya pagados y marca las transacciones de pruebas (`es_prueba`) para que no entren al ERP.
- **Llaves.** `crear-pago-wompi` se niega a devolver la URL de pago si la llave guardada no empieza por `pub_` (protege contra guardar una llave privada por error).
- **Patrones digitales.** Sesión obligatoria, comprobación de compra con la sesión de la clienta, enlace firmado de 5 minutos, CORS limitado al sitio.
- **Fotos de referencia.** Bucket privado, borrado automático a los 90 días con una función y un trabajo programado, y casilla obligatoria que el servidor exige y registra.
- **Formulario de personalizados.** Límites de 4 solicitudes por teléfono en 24 h, 8 por IP por hora y 60 por hora en total.
- **Tablas.** 0 tablas del esquema `public` sin RLS.
- **Repositorio público.** Sin secretos ni llaves privadas (patrones de claves de Supabase, Stripe/Wompi privadas, GitHub, AWS, claves PEM, cadenas de conexión) en HEAD ni en 611 confirmaciones de todas las ramas; sin datos personales de clientas (solo correos y teléfonos de ejemplo). La llave de Supabase que aparece 19 veces es la **publicable**, pensada para ser pública.
- **Enlaces externos.** 100 % de los `target="_blank"` llevan `rel="noopener"`.
- **Sin cookies propias ni medición en la aventura de Rosina:** 0 solicitudes externas, sin Tag Manager, sin cuenta.
- **Copias.** Copia diaria cifrada y prueba de restauración mensual (la primera fue correcta el 22-oct).

## 4. Hallazgos de seguridad (detalle breve)

Ver `REGISTRO_HALLAZGOS.csv` (columnas: evidencia, reproducción, impacto, corrección y cómo verificarla).

| ID | Prioridad | Clase | Título |
|---|---|---|---|
| SEG-01 | P1 | Riesgo potencial | Cuatro funciones internas del taller abiertas a la llave pública |
| SEG-02 | P2 | Riesgo potencial | Toda función nueva de la base nace abierta al público |
| SEG-03 | P2 | Riesgo potencial | 315 funciones ejecutables por cuentas autenticadas; cualquiera puede crear una |
| SEG-04 | P2 | Defecto confirmado (local) | Datos del catálogo pintados como HTML sin escapar |
| SEG-07 | P2 | Riesgo potencial | Copias cifradas en un repositorio público |
| SEG-15 | P2 | Pendiente de verificar | Ajustes de seguridad que no se pudieron leer |
| SEG-05 | P3 | Riesgo potencial | Formateador del chat permite inyectar atributos con una URL con comillas |
| SEG-06 | P3 | Recomendación | Sin Content-Security-Policy ni cabeceras verificables |
| SEG-08 | P3 | Recomendación | `main` sin protección |
| SEG-09 | P3 | Recomendación | Funciones desplegadas sin uso |
| SEG-10 | P3 | Riesgo potencial | Puntos públicos sin límite de uso |
| SEG-11 | P3 | Riesgo potencial | Endurecimientos menores del pago (moneda, firma, CORS, radicado) |
| SEG-12 | P3 | Recomendación | Importaciones de esm.sh sin versión exacta |
| SEG-13 | P3 | Riesgo potencial | Límite por IP del chat evadible; tope global agotable |
| SEG-14 | P3 | Recomendación | Librerías alojadas sin plan de actualización |

Relacionados en otras áreas: PRI-01 (casilla premarcada de crear cuenta), PRI-02 (chat con proveedor de IA sin aviso), PRI-03 (Cloudflare oculta el correo), DAT-01 (6 funciones sin copia de código), DAT-02 (primera copia programada pendiente).

## 5. Pruebas reproducibles

- **SEG-04:** `python3 herramientas/auditoria-360/scripts/probar_xss_catalogo.py` (salida actual: «VULNERABLE»).
- **SEG-05:** en Node, copiar `esc()` y `formato()` de `js/rosina-chat.js` y llamar `formato('Mira https://a.com/"onmouseover="alert(document.domain)"x')`: produce `<a href="https://a.com/"onmouseover="alert(document.domain" …>`.
- **SEG-01/02/03:** asesor de seguridad de Supabase → Advisors → Security.
- **Secretos:** `git grep` con los patrones de claves en HEAD y `git log --all -G` en las 611 confirmaciones (0 resultados).
- **Funciones:** `list_edge_functions` y `get_edge_function` del conector de Supabase (solo lectura).

## 6. Orden propuesto de corrección (cuando Sara lo autorice)

1. **Cuando vuelva el SQL:** SEG-01 (revocar las 4), SEG-02 (permisos por defecto), muestreo de SEG-03.
2. **Cambios pequeños de código, ya:** SEG-04 (escapar), SEG-05 (formateador), ACC-01 a ACC-03.
3. **Decisiones:** SEG-07 (repositorio privado para las copias), SEG-08 (protección de `main`), PRI-01 (casilla desmarcada).
4. **Limpieza:** SEG-09 (eliminar funciones sin uso), DAT-01 (guardar las 6 copias de código), SEG-11 a SEG-14.

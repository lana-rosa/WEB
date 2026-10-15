# 01 · Auditoría técnica y funcional (15-oct-2026)

Alcance: repositorio `lana-rosa/WEB` (sitio estático), código de `lana-rosa/ERP` y `lana-rosa/CRM` clonados en el entorno, y el proyecto Supabase «Lana Rosa ERP + SO» consultado **solo en lectura** (conteos, definiciones de funciones y alertas de seguridad). No se modificó nada de producción durante la auditoría. No se leyeron ni se copian secretos ni datos personales: solo cantidades.

Cómo se clasifica cada función: **IMPLEMENTADA Y FUNCIONAL** (hay código y se verificó que corre), **PARCIAL**, **NO IMPLEMENTADA**, **NO VERIFICABLE** (con los accesos de esta sesión).

## 1. Arquitectura actual

- **Web:** HTML/CSS/JS estático, sin proceso de compilación, publicado con GitHub Pages desde `main` (dominio en `CNAME`). 22 páginas en la raíz más `merceria/` y `academy/`. CSS compartido en `css/comun.css` (26 KB) y `css/editorial.css`; cada página lleva su propio JS en línea. `js/` suma 364 KB (el mayor es `pago.js`, 54 KB).
- **Tres «casas»** con menú, acentos y manifiesto propios: Tienda de amigurumis, Mercería y Lana Rosa Academy. El menú y el pie se generan con `herramientas/sincronizar_encabezado.py`.
- **Datos en vivo:** Supabase (157 tablas, 378 funciones SQL, 15 funciones Edge). La tienda lee `obtener_tienda_web()`; la mercería `obtener_merceria_web_v2()`. El ERP y el CRM son aplicaciones de una sola página (`erp/index.html` 1,8 MB; `crm/index.html` 190 KB) que usan el mismo proyecto Supabase; el ERP además usa un Worker de Cloudflare (no está en el repositorio: **no verificable**).
- **Pagos:** `js/pago.js` + funciones Edge `crear-pago-wompi` (v33) y `wompi-webhook`; los pedidos pagados pasan solos al ERP (`fn_registrar_pedido_web_en_erp`) y al CRM (`enviar-pedido-web-crm`). Wompi en modo producción (verificado con la acción `estado`). PayPal existe pero está apagado.
- **Cuentas de clientas:** `cuenta.html` + `js/cuenta.js` (enlace al correo con Supabase Auth). 2 cuentas registradas.
- **Medición y consentimiento:** Google Tag Manager en todas las páginas, con Modo de consentimiento (todo «denegado» hasta que la persona acepte; `js/consentimiento.js`).
- **PWA:** tres manifiestos (Crochet, Mercería, Academy), `sw.js` mínimo (solo páginas de navegación → `/offline.html`; nada más se guarda en caché), íconos en `img/app/`.
- **Publicación y revisión:** `.github/workflows/revisar-enlaces.yml` (rastreo de producción tras cada despliegue y los lunes), `activar-apertura.yml` (apertura de la tienda física). Herramientas de prueba: `revisar_enlaces.py`, `prueba_consentimiento.py`. No hay pruebas automáticas de interfaz en CI.
- **Identidad visual real del sitio:** tipografías DynaPuff (títulos) y Hanken Grotesk (texto), alojadas en `/fonts` (4 archivos, 128 KB); color de marca `#E74E96` (38 archivos lo usan).

### Discrepancias entre el encargo y el código real (a decidir con Sara antes de diseñar)
1. El encargo cita **Celine / Montserrat Light** y los colores `#cc1786`, `#ff66c4`, `#dc0593`. En el repositorio **no existen** esas fuentes ni esos tres colores (0 archivos). Probablemente son los del logotipo (imagen). Se conserva el sistema actual (DynaPuff, Hanken Grotesk, `#E74E96`) hasta que Sara confirme si el logotipo debe llevar otras fuentes o si esos tres tonos deben sumarse a la paleta.
2. El «universo de Rosina» ya tiene varias piezas reales (ver §2), pero no es una experiencia interactiva unificada.

## 2. Inventario de funcionalidades existentes

| # | Función | Estado | Evidencia y observaciones |
|---|---|---|---|
| 1 | **Rosina como asistente** | IMPLEMENTADA Y FUNCIONAL (con límites) | `js/rosina-chat.js` (botón flotante, panel) + Edge `rosina-web` v15 (`herramientas/rosina-web/index.ts`). Modelo Claude Haiku 4.5. Conocimiento = texto público de 20 páginas del sitio + catálogo vivo de tienda y mercería (caché de 10 min). Límites: 20 mensajes por IP por hora y 1.500 por día; sin guardar conversaciones (solo un hash de IP con sal en `rosina_web_uso`; 19 usos en las últimas 24 h). Reglas del prompt contra dar datos internos y contra inventar. **Límites:** responde solo texto (sin tarjetas de producto ni enlaces estructurados), no distingue «disponible / por encargo / evaluar» más allá del texto del catálogo, no registra errores ni calidad de respuestas, y la sal de la IP tiene un valor por defecto (`lr`) si el secreto `RW_SAL` no está definido (**no verificable** si lo está). |
| 2 | **Universo de Rosina** | IMPLEMENTADA PARCIALMENTE | Páginas reales: `rosina.html`, y el Rincón (`recursos-rosina.html`: 36 stickers, 14 temas de celular, checklist), `glosario-rosina.html` (30 términos), `paletas-rosina.html` (22 paletas + creador), `calculadoras-rosina.html`, `agenda-rosina.html`. Contenido estático, sin recorridos guiados. La aventura infantil «Rosina y la gran aventura de la primera cadeneta» está **sin publicar** (rama `claude/sweet-hypatia-6sqpmv`, `noindex`). |
| 3 | **PWA instalable** | IMPLEMENTADA Y FUNCIONAL | 3 manifiestos con íconos any/maskable, `sw.js` v3, botón «Instalar app» en el pie. Solo guarda `/offline.html` y un sticker; **no** guarda datos personales ni respuestas privadas (bueno para privacidad). Sin caché de recursos estáticos: cada visita descarga todo (oportunidad de rendimiento, con cuidado). Sin notificaciones push (correcto: no hay consentimiento ni caso de uso). |
| 4 | **CRM y ERP propios conectados** | IMPLEMENTADA Y FUNCIONAL (web → ERP/CRM) / NO VERIFICABLE (interior del ERP, Worker, nómina, contabilidad) | Pedidos pagados → `pedidos_canal_venta` en el ERP y `enviar-pedido-web-crm`; solicitudes de personalizado → `oportunidades_venta` (consecutivo/radicado). 13 pedidos web, 3 pagados, 0 con error de registro en el ERP. Solicitudes web registradas con `origen='web'`: **0** (el flujo de personalizado aún no ha recibido solicitudes o se registra por otra vía: confirmar). |
| 5 | **Google Analytics** | IMPLEMENTADA Y FUNCIONAL (en el código) / NO VERIFICABLE (datos en GA4) | GTM `GTM-M3MQ7XZD`; eventos propios en `js/animaciones.js`: `view_item`, `select_item`, `add_to_cart`, `remove_from_cart`, `begin_checkout`, `purchase` (gracias.html), `search`, `filtro_producto`, `clic_whatsapp`, `clic_personalizar`, `personalizacion_inicio`, `form_enviado`, `resource_use`, `resource_download`, `app_instalada`, `clic_instalar_app`, `review_click`, entre otros. No hay acceso a la propiedad GA4 para leer datos reales (línea base **no disponible**). |
| 6 | **Páginas de producto y navegación** | IMPLEMENTADA Y FUNCIONAL | `tienda.html` (77 productos activos con ficha: 34 amigurumis, 21 llaveros, 13 peluches, 4 macetas, 2 flores, bolso, separador, complemento), ficha en ventana con `?producto=<id>`, datos estructurados `Product`, favoritos, reseñas. Mercería: catálogo propio. |
| 7 | **Flujo de pedidos y herramientas operativas** | IMPLEMENTADA Y FUNCIONAL | Compra con Wompi (tienda, mercería, patrones, personalizados con radicado), carrito abandonado, recordatorios de calificación, correos de compra, cuentas con historial. Amigurumis personalizados con pago en línea activos desde el 14-oct (primer pago real **pendiente**). |

### Otras funciones relevantes para este plan
| Función | Estado |
|---|---|
| Formulario de personalización (`personaliza.html`) | IMPLEMENTADA Y FUNCIONAL: foto(s), tipo, tamaño, descripción, mensaje, 2 autorizaciones → RPC `crear_solicitud_personalizada`. **No** es un diseñador visual. |
| Recomendador de regalos | NO IMPLEMENTADA (hay asesoría por chat y filtros por categoría/precio en la tienda). |
| Diseñador visual de amigurumis | NO IMPLEMENTADA. |
| Modelos 3D / AR | NO IMPLEMENTADA. No hay un solo archivo `.glb`/`.gltf`. |
| Búsqueda visual / escáner de materiales (OCR) | NO IMPLEMENTADA. |
| Etiquetas QR poscompra (historia y cuidados) | NO IMPLEMENTADA. Sí existen cuidados por producto (`cuidados_web`, 76 de 77) y el artículo «Cómo cuidar y lavar tus tejidos». |
| Patrones interactivos | NO IMPLEMENTADA. Existen PDF vendibles (`patrones_archivos`, descarga protegida con `descargar-patron`). |
| Comunidad / galería de proyectos | NO IMPLEMENTADA. Hay testimonios (`img/testimonios/`, 21 imágenes) y reseñas por producto. |
| Experiencia digital de tienda física | NO IMPLEMENTADA (la tienda física abre el 16-nov-2026; `js/apertura.js` cambia textos por fecha). |
| Selector de lanas y colores relacionado con la tienda | NO IMPLEMENTADA como tal. Existen `paletas-rosina.html` y `obtener_merceria_web_v2()` (marca, color, material, peso por ovillo), pero **sin relación producto ↔ material** en los datos. |

## 3. Componentes reutilizables (no hay que reconstruir)

- **Datos:** `obtener_tienda_web()` (nombre, precio, categoría, disponibilidad, tiempo, descripción, especificaciones, cuidados, foto), `obtener_merceria_web_v2()`, `web_google_shopping` (títulos y descripciones para Google), `web_productos_personaje`, reseñas, favoritos.
- **Interfaz:** `css/comun.css` (botones por casa, tarjetas, fondos), ficha de producto en ventana (`tienda.html`), tarjetas de recursos del Rincón, mini-avatares de Rosina (`img/mini/`), 74 stickers oficiales (`img/stickers/`), modales y carrito (`pago.js`, `carrito-agregado.js`).
- **Servicios:** Edge `rosina-web` (asistente), `crear-pago-wompi`, `enviar-pedido-web-crm`, `descargar-patron`, `feed-google-merchant`, `indicadores-crm`.
- **Medición:** capa `dataLayer` y helper de eventos de `js/animaciones.js`.
- **Calidad:** `revisar_enlaces.py`, `prueba_consentimiento.py`, flujo de revisión semanal en producción, y las pruebas Playwright usadas en entregas anteriores (se pueden convertir en `herramientas/pruebas/`).

## 4. Qué falta o está incompleto (resumen)

1. **Datos para recomendar:** el catálogo no tiene etiquetas de ocasión, destinatario, vínculo ni estilo. Solo 5 de 77 productos tienen `alto_cm` (el tamaño está dentro del nombre, p. ej. «21cm»). Hay 66 con existencias y 63 con SKU.
2. **Imágenes para 3D/AR:** cada producto tiene **una sola** foto (`extras.json` está vacío). No alcanza para fotogrametría.
3. **Relación producto ↔ materiales ↔ patrones/cursos:** no existe en los datos.
4. **Historias de producto:** no hay un campo de historia por pieza (solo descripciones y la historia general en `sobre-nosotras.html`).
5. **Conocimiento de Rosina** no incluye productos con enlaces estructurados ni distingue «por encargo» vs «evaluar».
6. **Pruebas automáticas** de interfaz y accesibilidad no están en CI.

## 5. Dependencias externas y costos potenciales (sin precios inventados)

| Servicio | Uso actual | Costo |
|---|---|---|
| GitHub Pages | Alojamiento de la web | Sin costo en el plan actual (a confirmar con Sara). |
| Supabase (plan gratuito) | Base de datos, Auth, Edge, Storage | Plan gratuito; **sin copias de seguridad automáticas**. Pasar a Pro es una decisión pendiente (ver `PENDIENTES.md`); la tarifa está en la página oficial del proveedor y debe verificarse antes de presupuestar. |
| Anthropic API (Rosina) | Modelo Haiku 4.5 con ~30.000 tokens de contexto en caché por consulta | Se paga por uso; la tarifa vigente debe consultarse en la documentación oficial. **No hay medición de costo por consulta**: es el primer dato que hay que empezar a registrar. |
| Wompi | Pasarela | Comisión por transacción (en el ERP existe la conciliación de comisiones). |
| Cloudflare | DNS/Worker del ERP | No verificable. |
| Google Tag Manager / GA4 | Medición | Sin costo directo. |

Posibles costos nuevos según la función (todos **por verificar**): almacenamiento y transferencia de modelos 3D; OCR o modelo multimodal para búsqueda visual y escáner; generación de imágenes con IA; producción de modelos 3D por un artista externo; moderación de la comunidad (tiempo humano).

## 6. Riesgos y hallazgos de seguridad, privacidad y rendimiento

**Seguridad (Supabase, alertas oficiales del propio proveedor, solo lectura):**
- **2 vistas con SECURITY DEFINER** (`fe_saldo_global`, `vista_trazabilidad_sistema`): se ejecutan con permisos del creador y se saltan las reglas por fila. *Nivel ERROR.* Revisar si deben ser `security_invoker`.
- **101 funciones SECURITY DEFINER ejecutables por el rol anónimo** y 290 por usuarias autenticadas. Muchas validan el rol por dentro (`fn_*_exigir_rol`), pero **no se revisó una por una**: hay que auditarlas antes de abrir nuevos endpoints. Entre las deliberadamente públicas están `crear_solicitud_personalizada`, `crear_resena_web`, `estado_pedido_web`.
- **137 funciones con `search_path` mutable** (riesgo conocido de suplantación de esquema).
- **Protección contra contraseñas filtradas en Auth: desactivada.**
- **16 tablas con RLS activa y sin políticas** (se usan solo desde funciones; es intencional en `pedidos_web`, `agenda_nube`, etc., pero conviene documentarlo).
- Funciones Edge de diagnóstico que no parecen necesarias en producción: `diag-secretos`, `probar-envio-crm` (ambas con verificación de JWT). Confirmar y retirar si no se usan.

**Privacidad:**
- **4 buckets de Storage públicos:** `fotos-productos` (esperable), pero también `solicitudes-personalizadas` (**fotos que suben las clientas**), `produccion-fotos` y `guias-envio` (**puede contener direcciones**). Cualquier persona con la URL puede verlas. Ya estaba anotado como pendiente («decidir si el bucket de fotos de Personaliza pasa a privado»); este hallazgo lo hace prioritario antes de cualquier función que reciba más fotos (búsqueda visual, comunidad, escáner).
- `crear_solicitud_personalizada` es pública y **sin límite de uso ni captcha**: riesgo de spam hacia el CRM.
- La IP del chat se guarda solo como hash con sal (bien); confirmar que `RW_SAL` está definido.
- Toda nueva función que procese fotos o texto con terceros (IA, OCR) introduce tratamientos que **no** están descritos en `politicas.html`; hay que redactar una propuesta revisable por la abogada antes de activarlas.

**Rendimiento (medido en Chromium móvil de 390 px contra el sitio local, con Supabase bloqueado, así que no incluye las fotos de productos ni los datos en vivo):**

| Página | KB locales | Recursos | Imágenes | Desborde horizontal | Errores JS |
|---|---|---|---|---|---|
| Inicio | 101 | 24 | 30 | no | 0 |
| Tienda | 400 | 26 | 17 | no | 0 |
| Personaliza | 133 | 22 | 21 | no | 0 |
| Rosina | 89 | 16 | 8 | no | 0 |
| Rincón de Rosina | 103 | 17 | 247 | no | 0 |
| Mercería | 141 | 19 | 9 | no | 0 |
| Academy | 106 | 17 | 10 | no | 0 |
| Revista | 51 | 14 | 6 | no | 0 |

Todas las imágenes tienen `alt`. La tienda (400 KB) y el Rincón (247 imágenes) son las más pesadas. No se midió LCP/INP reales (**requiere Lighthouse o datos de campo; no disponible aquí**). El service worker no guarda recursos en caché, por lo que cada visita repite descargas.

**Riesgos de producto:**
- Los modelos 3D de piezas tejidas pueden no reproducir la textura; prometer fidelidad sería un riesgo comercial.
- Las imágenes generadas con IA podrían confundirse con fotos reales o parecerse a personajes protegidos; requieren etiqueta «representación conceptual» y revisión legal (ya hay un pendiente abierto sobre las imágenes de los amigos del libro).
- El asistente podría citar precios o plazos desactualizados si el catálogo en caché (10 min) cambia.

## 7. Oportunidades concretas (ordenadas por valor/costo)

1. **Recomendador por reglas** sobre el catálogo real, con una tabla pequeña de etiquetas curada por Sara (ocasión, destinatario, estilo) — bajo costo, alto valor.
2. **Rosina con tarjetas de producto** (respuesta estructurada con enlace, precio y estado real) y registro de preguntas sin respuesta para detectar contenido faltante.
3. **Hub «Universo de Rosina»** con los cuatro recorridos apoyado en las páginas que ya existen.
4. **Páginas públicas de cuidados e historia por producto** (`/p/<id>`) que sirvan también para QR, con un campo `historia` y `cuidados` validados por el taller.
5. **Configurador de personalizados** que reutiliza `personaliza.html`, `crear_solicitud_personalizada` y el pago con radicado ya construidos.
6. **Piloto 3D/AR** de **una** pieza solo si se consiguen 20–40 fotos de calidad y/o un modelo hecho por un artista; antes, una prueba técnica.
7. **Búsqueda visual simple** (etiquetas y color dominante) antes de considerar embeddings.

Se recomienda **posponer** escáner de materiales, comunidad abierta y patrones interactivos hasta tener datos de demanda y los datos estructurados de la Mercería.

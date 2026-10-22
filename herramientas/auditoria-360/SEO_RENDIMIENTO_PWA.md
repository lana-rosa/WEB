# SEO, rendimiento y PWA — auditoría 360 (22-oct-2026)

## 1. SEO técnico (51 páginas del mapa del sitio)

| Comprobación | Resultado |
|---|---|
| Páginas indexables / con `noindex` | 51 en el mapa del sitio; las 7 de servicio (cuenta, gracias, baja, `/p/`, 404, sin conexión, 3D de prueba) y las dos redirecciones (`/revista/`, `/rosina.html`) llevan `noindex` y las redirecciones además canonical al destino |
| Indexables que faltan en el mapa / páginas del mapa con `noindex` | 0 / 0 |
| Canonical | 51 de 51 apuntan a sí mismas; 54 canonical en producción respondieron 200 (rastreo del 22-oct) |
| Título y descripción únicos | 51 de 51 (0 repetidos, 0 sin descripción) |
| Una sola `<h1>` | 70 de 70 rutas |
| Open Graph completo / Twitter card | 50 de 51 / 49 de 51 (faltan en la aventura de Rosina y su política de privacidad) |
| Datos estructurados (JSON-LD) | 39 de 51 páginas; todos los bloques se leen bien (19 `BlogPosting` con migas, 6 `FAQPage`, `Store`, `Course`, `Product`, `DefinedTermSet`, `HowTo`, entre otros) |
| Imágenes sin `alt` | 0 |
| Páginas indexables sin enlaces entrantes | 0 |
| `robots.txt` | Permite todo, nombra a GPTBot, PerplexityBot, ClaudeBot y Google-Extended y enlaza el mapa; las páginas privadas usan `noindex` (correcto: bloquearlas en `robots.txt` impediría que Google lea el `noindex`) |
| `llms.txt` | 11 KB con datos clave, cuándo recomendar o no, y cómo debe actuar un agente; coherente con la web salvo CON-02 |
| Direcciones antiguas | `/merceria.html` se redirige desde `404.html`; `/rosina.html` y `/revista/` son redirecciones con `noindex` |
| Títulos y descripciones largos | 22 títulos de más de 60 caracteres (16 de más de 70, el más largo de 91) y 13 descripciones de más de 160 (la más larga de 217) → SEO-01 |
| Fechas `lastmod` del mapa | 43 de 49 entradas comparables con fecha más de 7 días anterior al último cambio del archivo (parte son cambios de menú y pie generados, no de contenido) → SEO-02 |
| Google Shopping | El feed declara siempre `in_stock`; los productos bajo pedido pueden recibir advertencia de disponibilidad → CON-04 |

**No medido:** indexación real y rendimiento de búsqueda (Search Console), posiciones, Core Web Vitals de usuarios reales (CrUX) y vista previa en redes. Ver `LIMITACIONES_Y_PENDIENTES.md`.

## 2. Rendimiento (laboratorio local)

Emulación de celular (390 px), red «4G lenta» (1,6 Mb/s, 150 ms) y CPU 4 veces más lenta, con Google Tag Manager y Supabase sustituidos por respuestas vacías. Peso = recursos del sitio comprimidos con gzip (estimado). **No sustituye a PageSpeed Insights**: sirve para comparar páginas y detectar pesos anormales. La tienda y el catálogo se miden sin productos de la base.

| Página | Solicitudes | Peso | LCP | CLS | Bloqueo del hilo (TBT) | Nodos DOM |
|---|---|---|---|---|---|---|
| `/` | 25 | 549 KB | 2,6 s | 0,000 | 259 ms | 510 |
| `/tienda.html` | 26 | 527 KB | 1,5 s | 0,000 | 176 ms | 488 |
| `/personaliza.html` | 29 | 523 KB | 1,6 s | 0,000 | 343 ms | 588 |
| `/merceria/` | 19 | 216 KB | 1,8 s | 0,000 | 395 ms | 548 |
| `/merceria/catalogo/` | 17 | 170 KB | 1,4 s | 0,000 | 122 ms | 393 |
| `/academy/` | 18 | 242 KB | 2,1 s | 0,000 | 370 ms | 412 |
| `/academy/talleres/` | 15 | 157 KB | 1,4 s | 0,000 | 105 ms | 292 |
| `/universo-rosina.html` | 19 | 167 KB | 1,4 s | 0,000 | 176 ms | 340 |
| `/revista.html` | 15 | 157 KB | 1,4 s | 0,000 | 154 ms | 358 |
| `/revista/anillo-magico/` | 16 | 164 KB | 1,4 s | 0,000 | 128 ms | 280 |
| `/politicas.html` | 15 | 165 KB | 1,5 s | 0,000 | 314 ms | 601 |
| `/cuenta.html` | 17 | 222 KB | 1,6 s | 0,000 | 117 ms | 581 |
| `/agenda-rosina.html` | 18 | 346 KB | 1,9 s | 0,000 | 281 ms | 4.051 |
| `/recursos-rosina.html` | 19 | 309 KB | 1,8 s | 0,047 | 496 ms | 1.793 |
| `/calculadoras-rosina.html` | 15 | 217 KB | 1,8 s | 0,000 | 186 ms | 966 |
| `/glosario-rosina.html` | 16 | 240 KB | 1,7 s | 0,000 | 281 ms | 808 |
| `/aventuras-de-rosina/` | 18 | 277 KB | 2,5 s | 0,107 | 3 ms | 63 |
| `/contacto.html` | 15 | 153 KB | 1,4 s | 0,000 | 117 ms | 299 |
| `/preguntas-frecuentes.html` | 16 | 154 KB | 1,4 s | 0,000 | 141 ms | 304 |

Lectura:

- **Ninguna página supera 2,6 s de LCP** en este laboratorio; el CLS es cero salvo la aventura de Rosina (0,107, justo sobre el límite de 0,1: REN-02) y recursos (0,047).
- **Más pesadas:** inicio (549 KB; 382 KB son imágenes) y tienda (527 KB). Más lentas al responder: `recursos-rosina` (496 ms de bloqueo, 1.793 nodos, 234 enlaces de descarga) y `merceria/` (395 ms). **`agenda-rosina` es la más compleja:** 4.051 nodos, HTML de 322 KB sin comprimir y carga también el logo de impresión en pantalla → REN-01.
- Hay `<link rel="prefetch" href="/tienda.html">` en el inicio (125 KB): decisión deliberada para acelerar la tienda.
- **Resultados del 17-oct de Sara en PageSpeed** (inicio móvil 75, tienda 67, Personaliza 88, universo 88, Academy 76, Mercería 97/75) siguen siendo la mejor medida real; falta repetirlos tras los últimos cambios.

## 3. PWA (tres apps por casa)

| Comprobación | Resultado |
|---|---|
| Manifiestos | 3 válidos (Crochet, Mercería, Academy) con nombre, `short_name`, `lang`, `start_url`, `display: standalone`, colores de tema propios y `id` distinto |
| Íconos | 192, 512 y 512 «maskable» por app; los 9 archivos existen |
| Páginas que enlazan su manifiesto | 49 de 51 (las dos de la aventura de Rosina no lo llevan a propósito) |
| Service worker `sw.js` | Mínimo: guarda solo `offline.html` y una imagen; atiende solo navegaciones; sin copias de productos, pagos ni cuenta |
| Sin conexión | `offline.html` es independiente (sin hojas externas) y trae botón «Reintentar»; hoy se probó como página, y el comportamiento real del service worker sin red lo comprobó la auditoría del 17-oct |
| Alcance | Las tres apps declaran `scope: /` → PWA-01 |
| Instalable | Cumple los criterios técnicos (manifiesto, íconos, service worker); instalación real en Android e iPhone **no probada** |

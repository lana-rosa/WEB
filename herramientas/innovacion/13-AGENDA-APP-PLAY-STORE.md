# La Agenda para tejedoras como app: opciones (28-oct-2026)

## Qué se hizo
La agenda ya se instala como app desde el navegador (Android, iPhone, Windows y Mac): ícono verde propio, nombre «Agenda para tejedoras», abre sin internet y sigue enlazada con la Tienda, la Mercería y Academy.

## Opciones comparadas
| Opción | Costo | Confianza | Enlace con nuestras páginas | Cobros |
|---|---|---|---|---|
| **App instalable (PWA)**, ya hecha | $0 | Sale con candado (HTTPS) y sin avisos de «sitio inseguro»; no pasa por Play Protect | Total: es la misma web | Wompi, como hoy |
| **Google Play** empaquetando esa misma web (TWA) | Cuenta de desarrollador (pago único, ~US$25) + tiempo de pruebas | Mayor: aparece en la tienda con reseñas | Total (abre la web dentro de la app) | **Google Play Billing** obligatorio para lo digital dentro de la app (comisión) |
| **App nativa** | Alto (desarrollo y mantenimiento) | Alta | Hay que rehacer todo | Igual que Play |
| App Store (Apple) | US$99 al año | Alta | Igual que Play | Compras dentro de la app de Apple |

## Recomendación
1. **Ahora:** la app instalable. Cuesta cero, se actualiza sola con cada publicación y conserva la venta por Wompi y el enlace con todo el ecosistema.
2. **Cuando la agenda esté lista para vender:** decidir si vale la pena Google Play. Su valor es la confianza de la tienda; su costo es la comisión por cobros digitales y el proceso de revisión. Una salida común es publicarla en Play como app de uso (acceso con cuenta) y mantener la compra en la web, pero Google lo evalúa caso por caso: **revisarlo con la política vigente antes de armar nada**.
3. Apple solo si hay clientas con iPhone que lo pidan (hoy ya pueden instalarla desde Safari).

## Datos consultados (28-oct-2026, fuentes de terceros; confirmar en Play Console antes de decidir)
- Cuentas personales nuevas deben hacer una prueba cerrada con al menos 12 testers durante 14 días antes de publicar; las cuentas de organización están exentas.
- Las apps distribuidas en Play que venden bienes o servicios digitales deben usar Google Play Billing; los programas de pago alternativo listados no incluyen Colombia.
- El paquete TWA exige un archivo `/.well-known/assetlinks.json` en el dominio (la publicación de GitHub Pages debe incluir esa carpeta oculta).

## Cuarta casa
Tabla de decisiones en `PENDIENTES.md`. El menú y el pie se generan desde `herramientas/sincronizar_encabezado.py` (`CASAS`, `MENUS`, `PIE_SIMPLE`), así que agregarla es un cambio en un solo lugar más un color en `css/comun.css`; conviene hacerlo apagado hasta el lanzamiento.

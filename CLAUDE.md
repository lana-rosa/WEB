# Lana Rosa Crochet — web (lanarosacrochet.com)

Sitio estático en HTML/CSS/JS publicado con GitHub Pages desde la rama `main` (dominio en `CNAME`). No hay proceso de compilación: cada página `.html` lleva su propio CSS y JS en línea. La dueña es Sara; escribe en español (Colombia).

## Antes de empezar
- **Lee `PENDIENTES.md`**: es la lista de tareas pendientes acordadas con Sara. Al terminar una, márcala con `[x]`; agrega ahí lo nuevo que quede pendiente.
- Sara suele querer ver capturas antes de publicar, salvo que pida publicar directamente. Publicar = PR a `main` y merge (GitHub Pages despliega solo).

## Estructura
- Páginas principales: `index.html`, `tienda.html`, `merceria/`, `personaliza.html`, `aprende.html`, `revista.html`, `sobre-nosotras.html`, etc.
- Rincón de Rosina (material gratuito): `recursos-rosina.html`, `glosario-rosina.html`, `paletas-rosina.html`, `agenda-rosina.html`, `calculadoras-rosina.html`, `rosina.html`.
- El menú está repetido en cada página (`.nav-principal` y `.nav-movil-panel`): los cambios del menú se hacen en todas.
- La mercería y la tienda cargan productos en vivo desde Supabase (proyecto "Lana Rosa ERP + SO", función `obtener_merceria_web`).
- Cuentas de clientes (opcionales): `cuenta.html` + `js/cuenta.js` (enlace al correo con Supabase Auth, carrito guardado en `carritos_web`, historial con `mis_pedidos`); tablas `cuentas_clientes_web`, `carritos_web`, `favoritos_web`, `direcciones_web` y `mensajes_cuenta` (panel con pedidos por estado, mensajes, reseñas, favoritos y direcciones). Al registrarse se crea/vincula un `terceros` (por correo). Ver `herramientas/cuentas-clientes/README.md`. `js/cuenta.js` se carga en todas las páginas.
- Pagos con Wompi: `js/pago.js` (apagado con `PAGOS_ACTIVOS = false` hasta que Sara guarde las llaves en Supabase), `gracias.html`, funciones `crear-pago-wompi` y `wompi-webhook`; los pedidos pagados pasan solos al ERP como pedidos de "Tienda virtual" (`fn_registrar_pedido_web_en_erp`). Ver `herramientas/cuentas-clientes/README.md`.
- WhatsApp de pedidos: 573205072801.
- Google Shopping (Merchant Center): feed en vivo desde la Edge Function `feed-google-merchant` de Supabase; solo diseños propios (tabla `web_google_shopping`). Ver `herramientas/google-merchant/README.md`.
- Medición: Google Tag Manager `GTM-M3MQ7XZD` en todas las páginas (Analytics `G-RSVSQV8Y9B` se configura dentro de GTM).

## Generadores (`herramientas/`)
- `glosario-rosina.html` y `paletas-rosina.html` se **generan** con `generar_glosario.py` y `generar_paletas.py` a partir de `glosario_datos.py` y `paletas_datos.py`. Para cambiar términos o paletas, edita los datos y vuelve a generar (`python3 herramientas/generar_paletas.py herramientas`). Los scripts toman la cabecera y el pie de `rosina.html`.
- `herramientas/fondos/`: plantilla y script de Playwright para los fondos de pantalla (necesita la fuente DynaPuff en `.woff2` junto a `fondo.html`).
- `separar_stickers.py` (recorta una hoja de stickers) y `stickers_frases.py` (stickers con frase) generan los archivos de `img/stickers/`.

- Enlaces (regla de arquitectura): **ningún `<base>` y todo enlace o recurso interno empieza con `/`** (`/tienda.html`, `/merceria/catalogo/`, `/img/...`, `/css/...`), también en el JavaScript. Así funciona igual en la raíz, en `/merceria/` y en `/academy/`, y también para rastreadores, conversores a Markdown y verificadores de enlaces que no respetan `<base>`. El menú y el pie se generan con `herramientas/sincronizar_encabezado.py` (ya salen con `/`). Para una página nueva en una carpeta, copia una existente y corre `python3 herramientas/revisar_enlaces.py` (debe dar 0 rotos y 0 rutas relativas); con `--produccion` revisa la web publicada desde una red con internet.

- App instalable (PWA): tres apps por casa — `manifest-crochet.webmanifest` (Lana Rosa Crochet, abre en `/tienda.html`), `manifest-merceria.webmanifest` (Mercería Lana Rosa) y `manifest-academy.webmanifest` (Lana Rosa Academy; también las páginas del Rincón de Rosina). El generador `sincronizar_encabezado.py` pone el manifiesto y el botón discreto "Instalar app" del pie; `sw.js` solo muestra `/offline.html` sin internet; íconos en `img/app/` (se regeneran con `herramientas/generar_iconos_app.py`).

## Convenciones
- **Valores de la marca:** las fundadoras son cristianas, creyentes en Cristo Jesús y cumplidoras de la Biblia. **No se celebran ni se mencionan Navidad, fechas de santos (incluido San Valentín) ni Halloween** en la web, el contenido, las paletas, los artículos ni las promociones. Sí se usan otras fechas especiales: Amor y amistad, Día de la madre, Día del padre, cumpleaños, graduaciones, etc.
- Colores de marca: `--rosa-principal #E74E96`, `--rosa-medio #F28FC0`, `--rosa-suave #FBE4EF`, `--lila #9EA2F9`, `--azul-acero #93C7F9`. Fuentes: DynaPuff (títulos) y Hanken Grotesk (texto).
- Imágenes: preferir WebP liviano; las imágenes que están más abajo en la página llevan `loading="lazy"`; los avatares pequeños de Rosina están en `img/mini/`.
- Verificar siempre en celular (390 px) y computador (1280 px), sin desplazamiento horizontal.

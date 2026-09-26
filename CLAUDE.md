# Lana Rosa Crochet — web (lanarosacrochet.com)

Sitio estático en HTML/CSS/JS publicado con GitHub Pages desde la rama `main` (dominio en `CNAME`). No hay proceso de compilación: cada página `.html` lleva su propio CSS y JS en línea. La dueña es Sara; escribe en español (Colombia).

## Antes de empezar
- **Lee `PENDIENTES.md`**: es la lista de tareas pendientes acordadas con Sara. Al terminar una, márcala con `[x]`; agrega ahí lo nuevo que quede pendiente.
- Sara suele querer ver capturas antes de publicar, salvo que pida publicar directamente. Publicar = PR a `main` y merge (GitHub Pages despliega solo).

## Estructura
- Páginas principales: `index.html`, `tienda.html`, `merceria.html`, `personaliza.html`, `aprende.html`, `revista.html`, `sobre-nosotras.html`, etc.
- Rincón de Rosina (material gratuito): `recursos-rosina.html`, `glosario-rosina.html`, `paletas-rosina.html`, `rosina.html`.
- El menú está repetido en cada página (`.nav-principal` y `.nav-movil-panel`): los cambios del menú se hacen en todas.
- La mercería y la tienda cargan productos en vivo desde Supabase (proyecto "Lana Rosa ERP + SO", función `obtener_merceria_web`).
- WhatsApp de pedidos: 573205072801.

## Generadores (`herramientas/`)
- `glosario-rosina.html` y `paletas-rosina.html` se **generan** con `generar_glosario.py` y `generar_paletas.py` a partir de `glosario_datos.py` y `paletas_datos.py`. Para cambiar términos o paletas, edita los datos y vuelve a generar (`python3 herramientas/generar_paletas.py herramientas`). Los scripts toman la cabecera y el pie de `rosina.html`.
- `herramientas/fondos/`: plantilla y script de Playwright para los fondos de pantalla (necesita la fuente DynaPuff en `.woff2` junto a `fondo.html`).
- `separar_stickers.py` (recorta una hoja de stickers) y `stickers_frases.py` (stickers con frase) generan los archivos de `img/stickers/`.

## Convenciones
- Colores de marca: `--rosa-principal #E74E96`, `--rosa-medio #F28FC0`, `--rosa-suave #FBE4EF`, `--lila #9EA2F9`, `--azul-acero #93C7F9`. Fuentes: DynaPuff (títulos) y Hanken Grotesk (texto).
- Imágenes: preferir WebP liviano; las imágenes que están más abajo en la página llevan `loading="lazy"`; los avatares pequeños de Rosina están en `img/mini/`.
- Verificar siempre en celular (390 px) y computador (1280 px), sin desplazamiento horizontal.

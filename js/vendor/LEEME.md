# supabase.js (alojado en el propio sitio)

Paquete `@supabase/supabase-js` 2.117.3 empaquetado con esbuild (solo exporta `createClient`). Antes se pedía a un servidor externo (esm.sh), que recibía la IP de cada visita.

Para actualizarlo:

```
mkdir /tmp/sb && cd /tmp/sb && npm init -y && npm i @supabase/supabase-js@2 esbuild
echo "export { createClient } from '@supabase/supabase-js';" > entry.js
npx esbuild entry.js --bundle --format=esm --minify --platform=browser --target=es2020 --outfile=supabase.js
```

Copiar `supabase.js` a `js/vendor/`, subir el número `?v=` en los 4 sitios que lo cargan (`tienda.html`, `personaliza.html`, `merceria/catalogo/index.html`, `js/cuenta.js`) y probar tienda, cuenta y Personaliza.

# model-viewer.min.js (visor 3D y realidad aumentada, Etapa 5)

`@google/model-viewer` **4.3.1** (Apache-2.0), archivo `dist/model-viewer.min.js` del paquete de npm, sin cambios (incluye three.js). Se carga **solo cuando la persona toca «Ver en 3D»** (`import()` desde `js/universo/visor3d.js`), nunca con la página. Antes de subirlo se descargó en una carpeta aparte (`npm pack @google/model-viewer@4.3.1`) y no se ejecutó nada del paquete.

Aviso: la librería sabe pedir un decodificador a `gstatic.com` si un modelo usa compresión Draco o KTX2. **Los modelos del sitio se entregan sin esas compresiones** para que no salga ningún pedido a servicios externos (lo comprueba `herramientas/pruebas/probar_visor3d.py`).

Para actualizarlo: `npm pack @google/model-viewer@<versión>`, extraer `package/dist/model-viewer.min.js` a `js/vendor/`, subir el `?v=` de `LIBRERIA` en `js/universo/visor3d.js` y correr `probar_visor3d.py`. Elegir versiones con al menos unas semanas de publicadas.

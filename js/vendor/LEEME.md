# supabase.js (alojado en el propio sitio)

Paquete `@supabase/supabase-js` 2.117.3 empaquetado con esbuild (solo exporta `createClient`). Antes se pedía a un servidor externo (esm.sh), que recibía la IP de cada visita.

Para actualizarlo:

```
mkdir /tmp/sb && cd /tmp/sb && npm init -y && npm i @supabase/supabase-js@2 esbuild
echo "export { createClient } from '@supabase/supabase-js';" > entry.js
npx esbuild entry.js --bundle --format=esm --minify --platform=browser --target=es2020 --outfile=supabase.js
```

Copiar `supabase.js` a `js/vendor/`, subir el número `?v=` en los 5 sitios que lo cargan (`tienda.html`, `personaliza.html`, `merceria/catalogo/index.html`, `js/cuenta.js`) y probar tienda, cuenta y Personaliza.

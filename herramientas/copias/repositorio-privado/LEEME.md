# Repositorio privado de copias de seguridad (SEG-07)

**Por qué:** las copias cifradas de la base de datos (correos, teléfonos, direcciones, pedidos) se guardaban como archivo de Actions en el repositorio WEB, que es público: cualquier cuenta de GitHub puede descargar esos archivos durante 90 días y la seguridad dependía solo de la contraseña. **No se hace privado WEB** porque GitHub Pages desde un repositorio privado exige un plan de pago y la web se caería. Solución gratuita: un repositorio **privado y aparte** que solo guarda las copias.

## Pasos (los hace Sara, ~10 minutos)
1. GitHub → **New repository** → nombre `lanarosa-copias` → marcar **Private** → *Create repository*. (No marcar README.)
2. En ese repositorio: *Add file → Upload files* y subir la carpeta `.github` de esta carpeta (los dos archivos de `workflows`), o pedirle a Claude que los suba si el repositorio queda conectado a la sesión.
3. En `lanarosa-copias` → Settings → Secrets and variables → Actions → *New repository secret*: crear **`SUPABASE_DB_URL`** (la cadena del *Session pooler*, ver `herramientas/copias/LEEME.md` de WEB) y **`COPIA_CLAVE`** (contraseña nueva de 24 caracteres o más, guardada en el gestor de contraseñas). Al crear una nueva `COPIA_CLAVE` las copias viejas ya no se abren con ella: está bien, la vieja solo tiene una copia manual de prueba.
4. Actions → «Copia de seguridad de la base de datos» → *Run workflow*. Debe quedar en verde con un archivo `.dump.gpg` en Artifacts. Luego «Prueba de restauración» → *Run workflow* (verde).
5. **Solo después de que ambos estén en verde**, en WEB: borrar los flujos `copia-base-datos.yml` y `probar-restauracion.yml` (Claude lo hace con un PR), borrar los secretos `SUPABASE_DB_URL` y `COPIA_CLAVE` de WEB y borrar el archivo `lanarosa-base-2026-10-22_1213` de Actions → *Artifacts* (o dejar que caduque a los 90 días).
6. Si GitHub avisa por correo de que un flujo falló, entrar y revisar.

Límites gratuitos: los repositorios privados tienen 2.000 minutos de Actions al mes; la copia diaria usa unos 3 minutos (≈90 al mes).

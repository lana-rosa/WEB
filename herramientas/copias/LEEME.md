# Copia de seguridad de la base de datos (Supabase)

> **Actualización 26-oct-2026 (SEG-07): las copias ya NO se hacen desde este repositorio.** Se pasaron al repositorio **privado** `lana-rosa/lanarosa-copias` (este es público y sus archivos de Actions los podía descargar cualquier cuenta de GitHub). Allí corren, con los mismos nombres, «Copia de seguridad de la base de datos» (cada día a las 3:17 a. m., hora de Colombia) y «Prueba de restauración de la copia de seguridad» (a mano y el día 1 de cada mes). Los secretos `SUPABASE_DB_URL` y `COPIA_CLAVE` están en ese repositorio. Primera copia y primera restauración correctas el 26-oct-2026. Los flujos de este repositorio se borraron; las copias de los flujos están en `herramientas/copias/repositorio-privado/`. **Si se cambia la contraseña de la base, hay que actualizar `SUPABASE_DB_URL` en `lanarosa-copias`.** Lo que sigue describe el procedimiento (los pasos de «Puesta en marcha» se hacen en `lanarosa-copias`).

**Qué hace:** cada día a las 3:17 a. m. (Colombia) el flujo `.github/workflows/copia-base-datos.yml` exporta la base de «Lana Rosa ERP + SO» (esquemas `public`, `auth` y la lista de archivos de `storage`), la **cifra** con la contraseña de Sara y la guarda **90 días** como archivo del flujo (Actions → «Copia de seguridad de la base de datos» → la ejecución → *Artifacts*). Si algún día falla, GitHub le escribe a Sara por correo.

**Por qué cifrada:** los repositorios son públicos; sin la contraseña el archivo no sirve para nadie. **Sin la contraseña tampoco sirve para Sara: guárdala en su gestor de contraseñas.**

**Qué NO incluye:** las fotos y archivos de los buckets de Storage (solo su lista), el código de las Edge Functions (se guarda aparte en `herramientas/supabase-funciones/`; ver su LEEME) ni los secretos de Supabase.

## Puesta en marcha (una sola vez, la hace Sara)
1. **Contraseña de las copias:** inventar una larga (mínimo 20 caracteres) y guardarla en un gestor de contraseñas.
2. **Cadena de conexión:** Supabase → proyecto → botón **Connect** → pestaña **Session pooler** (puerto 5432, usuario `postgres.ngjoognzvehwjtpqwrqe`). Copiarla y reemplazar `[YOUR-PASSWORD]` por la contraseña de la base (Project Settings → Database → *Reset database password* si no la recuerda; ojo: cambiarla obliga a actualizar donde se use). Debe terminar en `?sslmode=require` o parecido. **Se usa el pooler porque la conexión directa es solo IPv6 y GitHub no la alcanza.**
3. GitHub → repositorio **WEB** → Settings → Secrets and variables → **Actions** → *New repository secret*:
   - `SUPABASE_DB_URL` = la cadena del paso 2.
   - `COPIA_CLAVE` = la contraseña del paso 1.
4. Actions → «Copia de seguridad de la base de datos» → **Run workflow** para probarla. Debe quedar en verde y mostrar el archivo `.dump.gpg` en *Artifacts*.
5. Una vez al trimestre (o antes de la apertura) hacer la **prueba de restauración** de abajo.

## Prueba automática de restauración
El flujo `.github/workflows/probar-restauracion.yml` («Prueba de restauración de la copia de seguridad») baja la última copia correcta, la descifra con `COPIA_CLAVE`, la restaura en una base temporal dentro de GitHub y cuenta tablas y filas (solo números, nunca datos). Se lanza a mano (Actions → Run workflow) y solo, el día 1 de cada mes. Verde = la copia se puede abrir y restaurar. Primera prueba: 22-oct-2026, correcta.

## Restaurar (en una base de prueba, nunca encima de la de producción sin avisar)
```bash
gpg --decrypt lanarosa-base-AAAA-MM-DD_HHMM.dump.gpg > copia.dump   # pide la contraseña
pg_restore --list copia.dump | head                                  # ver que abre
createdb prueba && pg_restore --no-owner -d prueba copia.dump        # restaurar en una base nueva
```
Para recuperar solo una tabla: `pg_restore --no-owner -t nombre_tabla -d prueba copia.dump` y luego copiar los datos que hagan falta.

## Notas
- La copia es una foto diaria: lo que pase después de las 3 a. m. no estará hasta la copia del día siguiente. Antes de un cambio grande (por ejemplo el «Modo producción»), lanzar el flujo a mano.
- GitHub borra los archivos a los 90 días. Si se quiere guardar una copia más tiempo (por ejemplo la del cierre del año), descargarla y guardarla en Drive (sigue cifrada).
- Si en el futuro se pasa a Supabase Pro, hay copias diarias propias de Supabase (7 días) y esto queda como respaldo adicional; en ese caso actualizar `politicas.html` (lo borrado puede permanecer hasta 7 días en esas copias).

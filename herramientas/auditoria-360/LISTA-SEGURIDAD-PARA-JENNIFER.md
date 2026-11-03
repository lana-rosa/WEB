# Lista de seguridad para Jennifer (SEG-15) — 20 a 30 minutos

Marca cada casilla. Si algo no coincide con lo que dice, toma una captura y envíamela; **no hay que cambiar nada por tu cuenta**. Detalle técnico: `LIMITACIONES_Y_PENDIENTES.md`, sección 2.

## 1. Supabase (lo más importante; 10 min)
- [x] **«Leaked password protection»**: no se puede en el plan gratis (probado el 3-nov-2026); aviso aceptado. Retomar si se pasa al plan Pro.
- [ ] Authentication → **URL Configuration**: solo debe estar `https://lanarosacrochet.com` (y las direcciones de prueba que uses).
- [ ] Authentication → **Rate limits**: anotar los números que aparecen.
- [ ] Storage: deben ser **públicos** `guias-envio`, `produccion-fotos`, `fotos-productos`; deben ser **privados** `solicitudes-personalizadas` y `patrones`.
- [ ] Tu cuenta de Supabase tiene **verificación en dos pasos**.

## 2. Cloudflare (5 min)
- [ ] SSL/TLS: modo **Full (strict)**; «Always Use HTTPS» encendido; «Minimum TLS Version» 1.2; **HSTS** encendido.
- [ ] Tu cuenta tiene verificación en dos pasos.

## 3. GitHub (5 min)
- [ ] Settings → Pages → **«Enforce HTTPS»** marcado.
- [ ] Settings → Branches: regla para `main` (que pida revisión antes de publicar).
- [ ] Tu cuenta tiene verificación en dos pasos.

## 4. Otras cuentas con verificación en dos pasos (5 min)
- [ ] Google (Tag Manager, Analytics, Merchant Center) · [ ] Wompi · [ ] el correo de contacto.

## 5. Direcciones que deben responder (2 min)
- [ ] `lanarosacrochet.com/pagina-que-no-existe` muestra «Esta página se nos destejió».
- [ ] `lanarosacrochet.com/PENDIENTES.md` y `/herramientas/` dan error 404.

---
## Lo que hago yo después (no te toca)
- SEG-10: límite de pedidos falsos en `crear-pago-wompi` (toca pagos: te pregunto antes).
- SEG-11: endurecer el webhook de Wompi (toca pagos: te pregunto antes).
- SEG-12: fijar la versión de la librería de Supabase en 7 funciones (al redesplegarlas).
- SEG-14: revisar las librerías propias cada tres meses (próxima: febrero de 2027).

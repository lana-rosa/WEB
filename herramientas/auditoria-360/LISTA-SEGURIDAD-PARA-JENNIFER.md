# Lista de seguridad para Jennifer (SEG-15) — 20 a 30 minutos

Marca cada casilla. Si algo no coincide con lo que dice, toma una captura y envíamela; **no hay que cambiar nada por tu cuenta**. Detalle técnico: `LIMITACIONES_Y_PENDIENTES.md`, sección 2.

## 1. Supabase (lo más importante; 10 min)
- [x] **«Leaked password protection»**: no se puede en el plan gratis (probado el 3-nov-2026); aviso aceptado. Retomar si se pasa al plan Pro.
- [x] (3-nov-2026, OK) Authentication → **URL Configuration**: solo debe estar `https://lanarosacrochet.com` (y las direcciones de prueba que uses).
- [x] (3-nov-2026) Rate limits: 30 correos/hora, 30 entradas cada 5 min por conexión, 30 verificaciones cada 5 min; sin cambios.
- [x] (3-nov-2026, OK; además privadas soportes-compras, facturas-dian, documentos-empresa y documentos-empleados) Storage: deben ser **públicos** `guias-envio`, `produccion-fotos`, `fotos-productos`; deben ser **privados** `solicitudes-personalizadas` y `patrones`.
- [ ] Tu cuenta de Supabase tiene **verificación en dos pasos**.

## 2. Cloudflare (5 min)
- [x] (3-nov-2026) Full (strict), Always Use HTTPS y TLS 1.3 encendidos; Minimum TLS subido de 1.0 a **1.2** por Jennifer. [ ] **HSTS** sigue apagado: encenderlo con calma (6 meses, sin subdominios, sin preload).
- [ ] Tu cuenta tiene verificación en dos pasos.

## 3. GitHub (5 min)
- [x] (3-nov-2026) Settings → Pages: «Enforce HTTPS» marcado y publicación por GitHub Actions funcionando.
- [ ] Settings → Branches: regla para `main` (que pida revisión antes de publicar).
- [ ] Tu cuenta tiene verificación en dos pasos.

## 4. Otras cuentas con verificación en dos pasos (5 min)
- [ ] Google (Tag Manager, Analytics, Merchant Center) · [ ] Wompi · [ ] el correo de contacto.

## 5. Direcciones que deben responder (2 min)
- [x] (3-nov-2026) `/PENDIENTES.md` y `/herramientas/` dan la página de error 404: las notas internas ya no se ven desde internet.

---
## Lo que hago yo después (no te toca)
- SEG-10: límite de pedidos falsos en `crear-pago-wompi` (toca pagos: te pregunto antes).
- SEG-11: endurecer el webhook de Wompi (toca pagos: te pregunto antes).
- SEG-12: fijar la versión de la librería de Supabase en 7 funciones (al redesplegarlas).
- SEG-14: revisar las librerías propias cada tres meses (próxima: febrero de 2027).

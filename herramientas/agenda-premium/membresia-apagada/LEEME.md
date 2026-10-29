# Membresía de la Agenda de Rosina — piezas apagadas (12-oct-2026)

(Nota 29-oct-2026: la membresía volvió a encenderse con otro diseño: ver `js/agenda/membresia.js`; estas piezas quedan solo como historial.) Sara decidió el 12-oct-2026 dejar la Agenda de Rosina **completa y gratuita** con la cuenta y no vender la membresía por ahora.
Estas tres piezas se sacaron de `agenda-rosina.html` (para que el sitio y el chat de Rosina no hablen de una membresía que no se vende) y se guardaron aquí tal cual estaban:

| Archivo | Qué es | Dónde volver a ponerlo en `agenda-rosina.html` |
|---|---|---|
| `tarjeta.html` | Tarjeta «Agenda completa / Tu membresía está activa» del índice | Dentro de `#indice-agenda`, justo después del `<header>` de esa hoja y antes del primer `<div class="indice-grupo"` |
| `dialogos.html` | Ventana de planes y pago (con las dos casillas de aceptación) y ventana de autorización de la copia en la nube | Justo antes de `<script type="module" src="/js/cuenta.js"></script>` (al final de la página, después del último `</script>` normal) |
| `modulo.html` | Módulo JavaScript: candados de las hojas de pago, consulta `mi_membresia()`, copia en la nube con autorización, pago con Wompi | Justo después de `<script type="module" src="/js/cuenta.js"></script>` |

Los estilos (`.membresia-tarjeta`, `.modal-membresia`, `.candado-pago`, `.sin-membresia`, `.bloqueado-pago`, `.mm-*`, `.mn-lista`) siguen en la página.

## Para volver a vender la membresía (checklist)
1. La abogada revisa las condiciones (`politicas.html#membresia`, apartado 11 de `#datos`) y la redacción de las dos casillas (inicio inmediato y retracto); ajustar y subir las versiones (`VERSION_CONDICIONES`, `VERSION_NUBE`, `fn_nube_version()`).
2. Volver a poner las tres piezas de arriba, cambiar `MEMBRESIA_ACTIVA` a `true` en `modulo.html` y restaurar los textos «gratis» de `agenda-rosina.html`, `academy/index.html`, `recursos-rosina.html` y `llms.txt` (ver el historial de git del 12-oct-2026).
3. En la función `crear-pago-wompi` poner `MEMBRESIA_EN_VENTA = true` y desplegarla.
4. Aplicar en Supabase los tres bloques `do $$` pendientes de la migración 18 (`fn_correo_membresia`, `fn_mensaje_pago_web`, `fn_avisos_membresia`).
5. Pago real de prueba de Sara: casillas, constancia en el correo y copia en la nube apagada hasta autorizarla.
6. Quitar el aviso del inicio de `politicas.html#membresia` y de la sección 11 de `#datos`.

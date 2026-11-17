# Envíos para Merchant Center: valores «hasta $X» por zona (preparado el 17-nov-2026; **Jennifer dio el sí a estos valores el 17-nov-2026**; falta que ella los configure en Merchant Center y, si se quiere, construir el envío en el feed, que sería un despliegue de la función `feed-google-merchant`: nivel 🔴 y aparte)

**Decisión de Jennifer:** el pedido se paga completo en la web y el envío se paga al recibir. Esto es lo que Merchant Center necesitaría saber; no cambia el cobro (eso es del chat 5) ni las políticas (chat 6, que van a la abogada).

## Valores vigentes (ERP, verificados el 9-oct-2026; `PENDIENTES.md`)
| Zona | Valor del envío | Cómo se paga |
|---|---|---|
| Villamaría | $8.000 | al recibir |
| Manizales | $13.000 | al recibir |
| Otras ciudades (incluye Chinchiná, Neira y Palestina) | $18.000 | al recibir |
| Recoger en la tienda física (desde el 13-dic) | gratis | — |

## Propuesta para Merchant Center
- Un solo servicio de envío para Colombia con el valor **«hasta $18.000»** (el más alto), tiempo de despacho según la regla de plazos de `CLAUDE.md` (disponible: siguiente día hábil; bajo pedido: 8 días hábiles + siguiente día hábil) y el tiempo de la transportadora.
- Si Merchant Center permite tarifas por región, agregar Villamaría $8.000 y Manizales $13.000.
- Texto en el aviso de envío: «El envío se paga al recibir».
- Política de devoluciones: la de `politicas.html` (revisión de la abogada pendiente; no publicar nada nuevo sin ella).

## Reparto
- **Chat 4 (este):** preparar los valores y configurarlos en el feed si hace falta (no hecho).
- **Chat 5:** el cobro (que el pedido se pague completo y el envío al recibir).
- **Chat 6:** políticas y textos legales (van a la abogada).

## Pasos para Jennifer en Merchant Center (los hace ella: Claude no puede entrar a esa cuenta)
1. Merchant Center → **Ajustes → Envíos y devoluciones → Servicios de envío → Agregar servicio**.
2. País: **Colombia**. Moneda: **COP**. Nombre: «Envío a toda Colombia (se paga al recibir)».
3. Tiempo de procesamiento: **1 día hábil** (productos disponibles). Para los bajo pedido, **8 días hábiles** (regla de plazos de `CLAUDE.md`; no cambiarla).
4. Tarifa: **$18.000** para todo el país; si Merchant Center deja agregar regiones, **Villamaría $8.000** y **Manizales $13.000**.
5. Guardar. Luego, **Ajustes → Envíos y devoluciones → Devoluciones**: agregar la política (la de `politicas.html`; la revisión de la abogada sigue pendiente).
6. Volver a **Productos → Diagnóstico** en 24 a 48 horas y contarle a Claude qué avisos quedan.

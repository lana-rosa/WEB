# Google Pay y cobro en otras monedas (BORRADOR PARCIAL)

> Consulta del **11-nov-2026**. Encargo del Orquestador por pedido de Jennifer. Negocio: persona natural en Colombia (Sara Loaiza Muñoz, régimen simple). **Solo investigación: no se abrió ninguna cuenta ni se conectó nada. Nada de esto se implementa antes de la apertura del 13-dic-2026.**
> **Alcance real:** se pudieron leer solo 2 fuentes oficiales con datos útiles (marcadas ✅). Varios sitios no abrieron desde la sesión (Mercado Pago, PayU, dLocal, Mipaquete, Envíoclick, Envía) o se cargan con JavaScript sin texto útil (Wompi), y PayPal respondió 403. **Comisiones, costos de cambio, requisitos de cuenta y datos que recibe cada pasarela NO están confirmados (❓).**

## Lo confirmado en fuentes oficiales
1. ✅ **Google Pay solo funciona a través de pasarelas que Google tiene integradas.** La lista oficial de Google ([Google Pay API, guía de integración web](https://developers.google.com/pay/api/web/guides/tutorial), consultada el 11-nov-2026) incluye, entre otras: **Stripe, PayPal (`paypalppcp`) y Braintree, PayU (incluye «PayU LATAM») y dLocal**. **Wompi y Mercado Pago NO aparecen en esa lista.**
   - Consecuencia: con Wompi, tal como está hoy, **no se puede ofrecer Google Pay con la integración estándar de Google**. ❓ Si Wompi lo ofrece por otro medio, hay que preguntárselo a Wompi.
2. ✅ **Stripe no abre cuentas en Colombia, según su página de países** ([stripe.com/global](https://stripe.com/global), consultada el 11-nov-2026): aparecen Brasil y México, y **no aparece Colombia** (ni Chile ni Perú). ❓ Confirmar con Stripe, porque la página puede cambiar.

## Tabla comparativa
| | Google Pay | Monedas | Comisiones / cambio | A qué cuenta llega | Requisitos | Datos de clientas |
|---|---|---|---|---|---|---|
| **Wompi** (ya integrado) | ✅ No figura en la lista de Google (❓ preguntar a Wompi) | ❓ Hoy se cobra en COP. ❓ tarjetas extranjeras | ❓ | ❓ A la cuenta bancaria registrada (hoy, desembolsos que se concilian en el ERP) | ❓ | Ya declarado en la política (no guarda tarjetas) |
| **PayPal** | ✅ Figura (`paypalppcp`) | ❓ Código dormido y `paypal_ajustes` en la base (en US$) | ❓ | ❓ Cuenta PayPal; retiro a Colombia ❓ | ❓ Cuenta empresarial verificada (ya anotado en `PENDIENTES.md`) | ❓ |
| **PayU** | ✅ Figura (PayU LATAM) | ❓ | ❓ | ❓ | ❓ | ❓ |
| **dLocal** | ✅ Figura | ❓ (orientada a empresas grandes ❓) | ❓ | ❓ | ❓ | ❓ |
| **Mercado Pago** | ✅ No figura en la lista de Google | ❓ | ❓ | ❓ | ❓ | ❓ |
| **Stripe** | ✅ Figura | ❓ | ❓ | — | ✅ **Colombia no aparece entre los países con cuenta** | — |

## Recomendación provisional
- **Google Pay no es urgente y hoy no es posible con Wompi.** Para ofrecerlo habría que usar **PayU** (colombiana, figura en la lista de Google) o **PayPal** (ya hay código dormido), y eso implica una segunda pasarela, contrato, conciliación y actualizar la política de datos.
- **Cobro en dólares:** de las seis, la que ya tiene código y base preparada es **PayPal**; **Stripe queda descartada** por no abrir cuentas en Colombia (a confirmar).
- **Lo más útil ahora:** escribirle a **Wompi** (¿ofrecen Google Pay? ¿tarjetas extranjeras o solo COP?) y pedir cotización a **PayU** con las preguntas de abajo. Todo, después de la apertura.

## Preguntas para cada pasarela (para la cotización)
¿Acepta Google Pay? ¿En qué monedas cobra y quién hace el cambio? Comisión por transacción (nacional e internacional) y costo del cambio de moneda; mensualidad; ¿a qué cuenta y cuándo llega el dinero (¿cuenta en dólares?); requisitos para persona natural en régimen simple (RUT, contrato, volumen); qué datos de la clienta recibe, dónde los procesa y por cuánto tiempo (para `politicas.html#datos` y la abogada).

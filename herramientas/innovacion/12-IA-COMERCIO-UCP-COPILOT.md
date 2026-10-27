# Vender en las IA de compras: Google (UCP) y Microsoft (Copilot) — evaluación del 27-oct-2026

Pregunta de Sara: «Google sacó una IA, Universal Commerce Protocol: ¿cómo listamos nuestros productos allí? Microsoft con Copilot también».

## Qué es cada cosa
- **UCP (Universal Commerce Protocol, Google).** Un estándar abierto para que los agentes de IA (modo IA de Google, Gemini) compren **dentro de la conversación** con el pago de Google. Se apoya en el Merchant Center: el catálogo sigue saliendo del feed, y UCP agrega el botón de compra («Buy now») y una API de pago que la tienda tiene que implementar.
- **Copilot Checkout (Microsoft).** Lo mismo para Copilot: compra sin salir del chat. Las tiendas de Shopify entran solas; las que usan **PayPal o Stripe** deben aplicar. La tienda sigue siendo la vendedora.

## ¿Podemos entrar hoy? No, y por qué
| | Google UCP | Copilot Checkout |
|---|---|---|
| País | Solo vendedores de EE. UU. (y producto elegible en EE. UU., Canadá y Australia, según la ayuda del Merchant Center). Latinoamérica aparece solo como «futuro», sin fecha | No se encontró lista de países oficial; las fuentes hablan de EE. UU. |
| Acceso | Lista de espera / acceso anticipado con formulario y desarrollo técnico propio | Aplicación para vendedores PayPal o Stripe |
| Pago | Google Pay y otros; Wompi no es compatible | PayPal o Stripe; Wompi no es compatible |
| Productos | Las guías excluyen **bienes personalizados**, servicios y digitales (fuente secundaria, por confirmar) | — |

Conclusión: **no hay un trámite que Sara pueda hacer hoy** para vender dentro de esos chats desde Colombia. Fuentes: ayuda del Merchant Center de Google (UCP), guía para desarrolladores de Google (`developers.google.com/merchant/ucp`), cobertura de Copilot Checkout de enero de 2026. Fecha de las fuentes: varias de terceros y con datos que se contradicen en fechas; revisar de nuevo cada trimestre.

## Lo que sí funciona hoy y ya tenemos o podemos hacer
1. **Google (Shopping, modo IA y Gemini).** Los productos aparecen cuando están en el **Merchant Center con datos completos** (fichas gratuitas activadas). Ya tenemos el feed en vivo (`feed-google-merchant`, v26) con precio, disponibilidad (`in_stock`/`backorder`), marca y `identifier_exists=no`. **Falta del lado de Sara:** comprobar en el Merchant Center que están activadas las «fichas gratuitas», la política de devoluciones y los datos de envío (los pide UCP cuando llegue a Colombia).
2. **Datos estructurados** (`Product` en la ficha y `ItemList` en la tienda y la mercería, ya publicados) coinciden con el feed en precio y disponibilidad: es la señal que Google compara.
3. **Microsoft (Copilot y Bing).** Copilot usa el catálogo del **Microsoft Merchant Center**, que puede **importar el feed de Google**. No encontré que Colombia figure en sus países de compras; hay que mirar en `ads.microsoft.com` si deja crear la tienda. Lo que sí sirve sin costo: **Bing Webmaster Tools** (verificar el sitio, enviar `sitemap.xml`) para que Bing y Copilot lean la página.
4. **`llms.txt`** (ya publicado) explica qué vendemos, precios, envíos y cuándo recomendar la marca a un agente.
5. **Cuando UCP llegue a Colombia:** habría que tener Merchant Center en regla, una API de pago compatible (hoy Wompi no lo es) y **excluir los personalizados** (la mayoría de nuestros productos).

## Pendientes derivados
- [ ] Sara: verificar en Merchant Center «fichas gratuitas», devoluciones y envíos (3 pantallas).
- [ ] Sara (opcional): crear cuenta en Bing Webmaster Tools y enviar el sitemap; luego, probar si Microsoft Merchant Center acepta Colombia.
- [ ] Claude: repetir esta revisión en enero de 2027 (¿UCP en Colombia o Latinoamérica?).

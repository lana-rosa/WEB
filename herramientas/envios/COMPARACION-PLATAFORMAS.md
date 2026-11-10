# Plataformas de envío en Colombia: comparación (BORRADOR PARCIAL)

> Fecha de la consulta: **10-nov-2026**. Encargo del Orquestador por pedido de Jennifer. **Solo investigación: no se conectó nada ni se creó ninguna cuenta.**
> **Limitación importante:** las páginas oficiales (mipaquete.com, envioclick.com, 99envios.com, servientrega.com, envia.co) **no se pudieron abrir desde esta sesión** (red restringida). Todo lo de abajo viene de fuentes secundarias (tiendas de aplicaciones, notas de prensa, fichas de comparadores). **Ningún precio está confirmado.** Para completarlo: permitir esos sitios en la red de la sesión, o que Jennifer pida cotización directa a cada empresa.
> Leyenda: ✅ lo dicen las fuentes · ❓ no se pudo confirmar.

## Resumen en una tabla
| | **Mipaquete** | **Envíoclick** | **99envíos** | **Servientrega directo** | **Envía / Coordinadora directo** |
|---|---|---|---|---|---|
| Qué es | Agregador colombiano (compara y contrata varias transportadoras) | Plataforma logística (Colombia y México) | ❓ No apareció en ninguna búsqueda (¿se refiere a **99minutos**, que sí aparece como aliada de Envíoclick?) | Transportadora | Transportadoras |
| Transportadoras | ✅ Servientrega, Coordinadora, Envía, TCC, Deprisa y otras (ficha de Shopify) | ✅ Coordinadora, Envía, DHL, FedEx, Servientrega, 99minutos, Mensajeros Urbanos, TCC | ❓ | Solo ella | Solo ella (Coordinadora tiene app oficial de Shopify) |
| Costo por envío | ❓ (la tarifa de cada transportadora, mostrada al cotizar) | ❓ Anuncian «hasta 40 % de descuento»; ficha dice «contactar para precios» | ❓ | ❓ Tarifa propia según contrato | ❓ Tarifa propia según contrato |
| Mensualidad / comisión | ❓ Sin mensualidad confirmada; los envíos se pagan con **saldo precargado** (recarga) | ❓ La app es gratis; el cobro sale de una **billetera** con saldo | ❓ | ❓ Para contraentrega suele haber comisión de recaudo (porcentaje + cargo fijo): **no oficial** | ❓ |
| Contrato / volumen mínimo | ❓ Parece no pedir (se abre cuenta y se recarga saldo) | ❓ Parece no pedir | ❓ | ❓ Un artículo de 2026 dice que la integración directa es «poco práctica» para comercios pequeños: pide **acuerdos comerciales** | ❓ Coordinadora: el servicio «Fulfillment» requiere cuenta activa y asesor |
| API (cotizar, crear guía, rastrear) | ✅ Dicen ofrecer API y plugin (WooCommerce, Shopify); ❓ documentación no vista | ✅ Capterra: cálculo de precio, guías, seguimiento y API; ❓ documentación no vista | ❓ | ✅ Existe cotizador REST (lo usa un conector de Odoo) y alianza por API con Cobre para cobrar contraentrega con QR Bre-B; ❓ requiere cuenta de cliente activa | ✅ Coordinadora: app oficial de Shopify (guías, cotizar, rastrear); ❓ Envía |
| Contraentrega del **envío** (que la clienta pague el flete al recibir) | ✅ Plugin: si el envío es contraentrega, se descuenta el valor recaudado; ❓ cómo se cobra el flete en destino | ❓ | ❓ | ✅ Recaudo contraentrega existe (cobra solo al entregar); ❓ para pagar solo el flete | ❓ |
| Datos de clientas que recibe | Inferido: nombre, teléfono, dirección y valor/contenido de cada envío ❓ política oficial | Inferido igual ❓ | ❓ | Inferido igual ❓ | Inferido igual ❓ |

## Fuentes (consultadas 10-nov-2026)
- Mipaquete: [charla WordPress Medellín sobre el plugin](https://speakerdeck.com/wordpressmedellin/integracion-de-envios-en-tu-tienda-woocommerce-a-traves-del-plugin-mipaquete-dot-com), [nota de DPL News](https://dplnews.com/colombia-mipaquete-com-la-plataforma-paisa-que-llego-a-mejorar-la-logistica-de-envios/), [nota de Enter.co](https://www.enter.co/?p=487004), [ficha en Shopify](https://apps.shopify.com/logistica-envios-ecommerce).
- Envíoclick: [Capterra](https://www.capterra.com/p/10043764/Envioclick/), [app de Shopify](https://apps.shopify.com/envioclick), [ficha de Common Ninja](https://discover.commoninja.com/shopify/app/envioclick).
- Servientrega: [Valora Analitik, alianza con Cobre y Bre-B](https://www.valoraanalitik.com/?p=600777), [guía de Encolombia sobre contraentrega](https://encolombia.com/economia/empresas/transporte-mercancias-emprendimiento/pago-contraentrega-en-tu-tienda-online/), [plugin de WooCommerce](https://en-gb.wordpress.org/plugins/shipping-servientrega-woocommerce/), [conector de Odoo](https://apps.odoo.com/apps/modules/18.0/carrier_co_servientrega_coordinadora), [guía de dropshipping 2026](https://www.andreybusiness.com/blog/servientrega-dropshipping-contra-entrega-2026) (no oficial).
- Coordinadora: [app oficial de Shopify](https://apps.shopify.com/coordinadora-1), [Fulfillment Coordinadora](https://apps.shopify.com/fulfillment-coordinadora), [Tiendanube](https://ayuda.tiendanube.com/es_CO/informacion/cuales-son-las-opciones-de-envio-disponibles).

## Recomendación provisional (a confirmar con las páginas oficiales)
**Mipaquete como primera opción para empezar**, por estas razones: es una empresa colombiana; reúne las transportadoras que ya usan comercios como el nuestro con **una sola cuenta y sin negociar contrato con cada una**; dicen tener API y plugin para cotizar y crear guías; y maneja contraentrega. **Envíoclick** queda como alternativa (mismas ventajas, pero la ficha dice «contactar para precios» y su empresa está en México). **Servientrega directo** solo conviene si el volumen crece o si ya se tiene cuenta empresarial, porque pide acuerdo comercial. **99envíos** no se pudo identificar.

## Lo que haría falta de nuestro lado (antes de conectar)
1. **Peso y medidas** de cada producto en el ERP (hoy no todos los tienen); sin eso no se puede cotizar por peso.
2. Decidir cómo se cobra el envío en el pago de la web (hoy: Villamaría $8.000, Manizales $13.000, otras ciudades $18.000; en la Mercería la clienta paga el flete al recibir).
3. Actualizar `politicas.html#datos` con la transportadora o plataforma elegida (qué datos recibe y dónde se procesan) y revisarlo con la abogada.
4. La conexión real es **después de la apertura del 13-dic-2026**.

## Preguntas para cada empresa (para la cotización directa)
Precio por envío (ejemplos: 1 kg Manizales→Bogotá, Villamaría→Medellín, Manizales→Cali); mensualidad o comisión; recarga mínima de saldo; contrato o volumen mínimo; documentación de la API (cotizar, crear guía, rastrear); cómo cobrar solo el flete al recibir; comisión de recaudo si se cobra el producto; qué datos de la clienta reciben, dónde los guardan y por cuánto tiempo.

# Propuesta: unir las hojas de dinero de la agenda (3-nov-2026)

> Solo propuesta. **No se cambió nada de la agenda.** Pedido de Jennifer: dos grupos, cada peso escrito una sola vez.

## Cómo está hoy (10 hojas que manejan dinero)
| Hoja | Qué hace | Dónde guarda |
|---|---|---|
| Mis ventas del mes (`ventas-mes`) | anotar ventas (producto, cliente, precio, costo) | `tabla-ventas` |
| Gastos del negocio (`gastos-negocio`) | anotar gastos por mes | `tabla-gastos` |
| Ingresos y gastos del negocio (`fin-movimientos`) | anotar entradas, salidas y ahorro (también «escríbelo natural») | `datos._fin.movs` |
| Resultados del negocio (`fin-negocio`) | resumen del mes y flujo de caja | solo lee |
| Mi negocio en números (`fin-resumen`) | resumen, gráficas, informe del mes | solo lee (la meta del mes sí escribe) |
| Análisis del negocio (`fin-analisis`) | comparar meses y año | solo lee |
| Presupuesto y metas del negocio (`fin-presupuesto`) | presupuesto, metas de ahorro, planes, meta de ventas | `datos._fin`, `_metaVentas` |
| Gastos fijos y deudas del negocio (`fin-fijos`) | pagos que se repiten y deudas | `datos._fin` |
| Tarjetas del negocio (`fin-tcredito`) | cupo, saldo y pagos | `datos._fin` |
| Mi catálogo de precios (`catalogo-precios`) | costo y precio sugerido | `tabla-catalogo` |

**Dónde se repite lo escrito:** una venta o un gasto se puede anotar en dos o tres hojas (ventas + movimientos; gastos + movimientos). Los avisos, el informe, las metas y las gráficas leen de sitios distintos y el código ya tiene que evitar contar doble («nunca los dos»). **Tres hojas solo muestran resúmenes parecidos** (Resultados, Mi negocio en números, Análisis).

## Propuesta
**Mi emprendimiento (una sola entrada de datos)**
1. **Ventas y gastos** (reemplaza Mis ventas del mes, Gastos del negocio e Ingresos y gastos): un solo lugar con filtros Ventas / Gastos / Ahorro, la escritura natural y el mes. Los campos de venta (producto, cliente, costo de materiales) salen solo cuando el tipo es venta. Los pedidos entregados se pasan aquí.
2. **Mi catálogo de precios** (igual que hoy).
3. **Resumen del emprendimiento** (reemplaza Resultados, Mi negocio en números y Análisis): solo muestra números y gráficas, **no se escribe**. Pestañas: Este mes · Comparar meses · El año. El informe del mes y el punto de equilibrio viven aquí. La meta del mes se escribe en Presupuesto y metas.

**Mi plata personal** (decisión de Jennifer, ver abajo)
4. **Presupuesto y metas** (presupuesto, metas de ahorro, planes; la meta de ventas del emprendimiento se queda en el emprendimiento).
5. **Gastos fijos, tarjetas y deudas** (une Gastos fijos y deudas con Tarjetas).

Resultado: de 10 hojas a 5, y cada peso se escribe una vez.

## Lo que hay que saber antes (importante)
- **Los gastos personales se quitaron el 29-oct-2026** (pedido de Sara: «finanzas solo del negocio»; hoy `esNeg()` siempre da verdadero y la casilla «Es del negocio» está escondida). El grupo «Mi plata personal» **vuelve a crear** lo personal. Hay que decidir si de verdad se quiere, y si es así, cada movimiento llevaría la marca «personal/negocio» y el resumen del emprendimiento solo contaría el negocio.
- **No se pierde nada:** lo escrito se pasa una sola vez a la hoja nueva, sin duplicar (producto + cliente + valor + fecha), y las tablas viejas se guardan como respaldo 90 días.
- **Quién lee hoy lo escrito** (hay que apuntarlo a una sola fuente): `panel.js`, `planeador.js`, `informe.js`, `metas-ventas.js`, `graficas.js`, `dashboards.js`, `conexiones.js` (pasar pedidos), `costos.js`, `exportar.js`, copias, Drive y el resumen de Rosina.
- **Membresía:** hoy son de pago las hojas de las pestañas posteriores a las 3 primeras. Al unir, decidir qué queda gratis (por ejemplo, anotar ventas y gastos) y qué es de pago (resumen y gráficas).
- **Rosina y textos:** cambian `GUIA_AGENDA` (chat 3, se vuelve a enviar `rosina-web`), `datos_*.py` de idiomas, el tutorial, las preguntas frecuentes y «Hoja N de 39».

## Orden sugerido (cada paso se publica solo, con foto y visto bueno)
1. **Una sola fuente** de ventas y gastos por detrás (sin cambiar lo que se ve); pruebas de que los totales no cambian.
2. **Hoja «Ventas y gastos»** con la migración y las hojas viejas escondidas (no borradas).
3. **Resumen del emprendimiento** (une las tres de resúmenes).
4. **Grupo personal** (si Jennifer lo confirma) y unir fijos con tarjetas.
5. Rosina, idiomas, tutorial y retiro de las hojas viejas tras un tiempo de prueba.

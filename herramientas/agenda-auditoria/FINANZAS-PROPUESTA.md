# Finanzas y tiempo: propuesta para unir hojas (encargo E11, 3-nov-2026)

> **Solo propuesta. No se cambió nada de la agenda.** Cómo quedaría: `FINANZAS-MAQUETA.html` y su captura `finanzas-maqueta.png`. Se hace desde el 14-dic (E16), no antes de la apertura del 13-dic.

## 1. Las 10 hojas de dinero hoy
| Hoja | Qué hace | Guarda en |
|---|---|---|
| Mis ventas del mes | anotar ventas (producto, cliente, precio, costo) | `tabla-ventas` |
| Gastos del negocio | anotar gastos por mes | `tabla-gastos` |
| Ingresos y gastos del negocio | anotar entradas, salidas y ahorro (y «escríbelo natural») | `datos._fin.movs` |
| Resultados del negocio | resumen del mes y flujo de caja | solo lee |
| Mi negocio en números | resumen, gráficas, informe del mes; aquí se escribe la meta del mes | lee (+ `_metaVentas`) |
| Análisis del negocio | comparar meses y año | solo lee |
| Presupuesto y metas del negocio | presupuesto, metas de ahorro, planes | `datos._fin` |
| Gastos fijos y deudas del negocio | pagos que se repiten, deudas | `datos._fin` |
| Tarjetas del negocio | cupo, saldo, pagos | `datos._fin` |
| Mi catálogo de precios | costo y precio sugerido por producto | `tabla-catalogo` |

### Qué se escribe en dos lugares (o más)
1. **Una venta**: Mis ventas del mes **y** Ingresos y gastos (y, si viene de un pedido, otra vez en Control de pedidos).
2. **Un gasto**: Gastos del negocio **y** Ingresos y gastos.
3. **Pedido entregado**: el botón «Pasarlos a Mis ventas» lo copia (hoy se evita duplicar comparando producto + cliente + precio).
4. **Meta de ventas del mes**: «Prioridades del mes» (texto libre) **y** «Presupuesto y metas» (número que usan el punto de equilibrio y el informe).
5. **Costo de materiales**: por venta (Ventas), por producto (Catálogo) y como gasto «Materiales» (Gastos).
6. **Costo del puesto de una feria**: Ferias y mercados **y** como gasto de ferias.
7. **Ahorro**: «Ahorrado $» de cada meta **y** los movimientos de tipo Ahorro.
8. **Pagos de tarjeta y cuotas de deuda**: en Tarjetas / Deudas **y** como gasto.
9. **Compra de lana**: costo por ovillo (Inventario), Lista de compras y gasto de materiales.

### Qué hojas solo repiten
- **Resultados del negocio, Mi negocio en números y Análisis**: tres resúmenes de los mismos movimientos.
- **Mis ventas del mes y Gastos del negocio**: lo mismo que Ingresos y gastos, con otros campos.

## 2. Propuesta: de 10 hojas a 5
**Mi emprendimiento**
1. **Ventas y gastos** (reemplaza 3 hojas): una sola lista con tres filtros (Ventas · Gastos · Ahorro), el mes y «escríbelo natural». Cada anotación tiene tipo; si es venta aparecen producto, cliente y costo de materiales. Los pedidos entregados se pasan aquí con un botón (como hoy). El costo del puesto de una feria se anota aquí como gasto desde la ficha de la feria.
2. **Mi catálogo de precios** (igual).
3. **Resumen del emprendimiento** (reemplaza 3 hojas): solo números y gráficas, **ahí no se escribe**. Pestañas: Este mes · Comparar meses · El año. Vive aquí el informe del mes y el punto de equilibrio.

**Mi plata personal** (ver pregunta 1)
4. **Presupuesto y metas** (presupuesto, metas de ahorro, planes; la meta de ventas se escribe aquí, una sola vez).
5. **Gastos fijos, tarjetas y deudas** (une dos hojas).

## 3. Cómo pasar los datos sin perder nada
- Una sola fuente por detrás: `datos._fin.movs` con los campos nuevos (producto, cliente, costo de materiales). Un lector único (`lrDinero.ventas/gastos(año, mes)`) para panel, planeador, informe, metas, gráficas, tableros, avisos y costos.
- Migración **una sola vez** al abrir la agenda nueva: cada fila de `tabla-ventas` y `tabla-gastos` se copia como movimiento; si ya existe uno igual (fecha + valor + producto o descripción) no se duplica. Las filas viejas **no se borran**: quedan guardadas como respaldo 90 días y las hojas viejas se esconden, no se eliminan.
- Todo pasa por `lrDibStore` y por la copia en la cuenta/Drive para que no se pierdan dibujos ni datos; las copias hechas antes de la unión se pueden restaurar (se migran al abrirlas).
- Pruebas: los totales del mes (entró, salió, te quedó, punto de equilibrio) deben dar **igual antes y después** con datos inventados de 6 meses.

## 4. Qué cambia en el Excel y en el informe
- **Excel:** hoy sale una hoja por cada hoja con datos. Quedaría «Ventas y gastos» (una tabla con columna Tipo), «Presupuesto y metas» y «Gastos fijos, tarjetas y deudas»; desaparecen «Mis ventas», «Gastos del negocio» e «Ingresos y gastos». Hay que revisar si algún importador espera los nombres viejos.
- **Informe del mes:** se mantiene igual para la persona (entró, salió, te quedó, ventas, meta, gastos por categoría), pero lee de una sola fuente y se abre desde el Resumen del emprendimiento.
- **Avisos y Rosina:** `GUIA_AGENDA` cambia (chat 3), más los textos en 3 idiomas.

## 5. Las 6 hojas de tiempo
| Hoja | Se pisa con |
|---|---|
| Planeador del día | Calendario del año (los dos leen las mismas fechas) |
| Mi semana tejiendo | Lista de compras («Materiales por comprar»); E13 la convierte en horario por bloques |
| Prioridades del mes | Mis proyectos («Lo que quiero terminar»), Visión del año (hábitos) y Mi año tejiendo («Cómo me fue»); **meta de ventas escrita dos veces** |
| Mi visión del año | Prioridades del mes (metas y hábitos) |
| Calendario del año | Planeador del día |
| Mi año tejiendo | Proyectos «Terminado» y «Cómo me fue este mes» |

**Propuesta: de 6 a 4.**
1. **Mi día** (Planeador del día).
2. **Mi semana** (E13: horario por bloques; «Materiales por comprar» pasa a la Lista de compras).
3. **Mi mes** (Prioridades del mes; la meta de ventas sale de Presupuesto y metas, no se vuelve a escribir; «Cómo me fue» se muestra en Mi año).
4. **Mi año**, con tres pestañas: Mi visión · Calendario · Lo que terminé (une Visión, Calendario y Año tejiendo).
Los datos de cada hoja se pasan una sola vez a la hoja nueva con los mismos nombres de casilla, así copias, nube y Drive no cambian.

## 6. Cosas que hay que decidir (preguntas de sí o no en el chat)
1. **[SÍ, Jennifer 3-nov-2026]** ¿Vuelve lo personal? (se quitó el 29-oct; si vuelve, cada anotación lleva «personal / negocio» y el resumen del emprendimiento solo cuenta el negocio.)
2. **[SÍ, Jennifer 3-nov-2026]** ¿Anotar ventas y gastos queda gratis y el resumen con gráficas queda de pago?
3. **[SÍ, Jennifer 3-nov-2026]** ¿Se unen las tres hojas de resumen en una?
4. ¿Se unen las tres hojas de anotar en «Ventas y gastos»?
5. ¿Se unen las hojas de tiempo (6 a 4)?
6. ¿Todo esto se hace después del 13-dic (E16)?

## 7. Orden sugerido (cada paso con foto y visto bueno)
1. Una sola fuente por detrás, sin cambiar lo que se ve.
2. «Ventas y gastos» con migración y hojas viejas escondidas.
3. «Resumen del emprendimiento».
4. Grupo personal y unir fijos con tarjetas (si se confirma).
5. Hojas de tiempo (con E13).
6. Rosina, idiomas, tutorial, Excel; retirar las hojas viejas tras un tiempo de prueba.

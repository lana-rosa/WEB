# Auditoría estratégica y plan de evolución
## Agenda para Emprendedoras — «Mucho más que una agenda»

Fecha: 31-oct-2026 · Etapa: **solo auditoría y planificación**. No se cambió código, base de datos, permisos, nombre ni datos de usuarias.

**Cómo leer este informe.** Escrito en lenguaje simple. Cada afirmación lleva una etiqueta:
- **[Verificado]** lo comprobé yo en esta auditoría (leyendo el código, la base o corriendo una prueba).
- **[Documentado]** consta en `CLAUDE.md`/`PENDIENTES.md`, pero no lo volví a comprobar hoy.
- **[Hipótesis]** es una suposición mía que hay que validar con usuarias reales.
- **[Fuente]** viene de una búsqueda en internet (enlace al final). Los precios de terceros cambian y varias fuentes se contradicen: hay que confirmarlos antes de decidir.

**Límites honestos.** No pude probar en iPhone/Samsung/iPad reales, Safari/Firefox, lector de pantalla ni lápiz digital. Las pruebas automáticas corren solo en Chromium. No hablé con usuarias. La investigación de competencia fue de 5 búsquedas generales; no es un estudio de mercado ni cubre precios por país. Las traducciones EN/PT no las revisó una persona.

---

## 1. Resumen ejecutivo

1. **Qué tenemos.** Una agenda muy completa de **39 hojas** en 7 secciones, instalable como app, con cuenta, copia en la nube con consentimiento, Google Calendar propio, idiomas ES/EN/PT, membresía con Wompi ($5.000/mes o $45.000/año; 7 días de prueba) y chat de Rosina. Está muy bien probada para ser una página estática (≈37 archivos de prueba) [Verificado: lista de archivos; ejecución de 8 pruebas clave en §2].
2. **Qué le falta para ser «mucho más que una agenda».** Hoy es **un conjunto de hojas independientes**, no un sistema. Lo que escribes en una hoja casi no alimenta a las demás (solo hay 3 puentes: pedidos entregados → ventas, lanas en cero → lista de compras, diario → año). No existe: costo por producto, inventario con entradas y salidas, punto de equilibrio, precio calculado desde costos, líneas de negocio, ni pronóstico de compras [Verificado: búsqueda en el código sin resultados para «punto de equilibrio», «costo unitario», «lote»].
3. **La raíz del límite es técnica, no de diseño.** Los datos viven en el navegador (`localStorage`) con filas fijas por hoja, como un cuaderno digital. Para integrar de verdad (pedido → cliente → proyecto → materiales → costo → precio → ingreso) se necesita un **modelo de datos único y por usuaria** (base de datos), no más hojas [Verificado].
4. **Hallazgo clave de oportunidad.** Lana Rosa ya tiene, en su ERP interno, la lógica que la agenda no tiene: kardex de inventario, fichas técnicas con materiales, órdenes de producción, costos promedio, centros de costo, caja por departamento, presupuestos, cotizaciones [Verificado: 150+ tablas en Supabase]. Es el mejor «plano» para el módulo de emprendedoras, **pero está pensado para una sola empresa (la de Sara), no para muchas usuarias**. No se puede reutilizar tal cual por seguridad y privacidad; sí se puede copiar su diseño.
5. **Aún no hay ingresos que midan el modelo.** `membresias_agenda` tiene **0 filas**; el pago real de $5.000 sigue sin probarse [Verificado en base; Documentado lo del pago].
6. **Recomendación.** (a) No agregar más hojas sueltas. (b) Construir un **núcleo de datos por usuaria** (clientas, productos, materiales, pedidos, movimientos) en la base, con la agenda actual como puerta de entrada y migración sin pérdida. (c) Sobre ese núcleo, tres módulos de pago de alto valor: **Costos y precio real**, **Inventario con movimientos** y **Finanzas con punto de equilibrio y metas**. (d) Convertir los cinco recursos de Rosina en **herramientas que escriben en el mismo núcleo** (ej.: la calculadora de precio guarda el costo del producto). (e) Dejar gratis todo lo de afición (proyectos, patrones, ideas, aprendizaje). (f) Validar con 5–10 emprendedoras antes de construir lo grande.
7. **Riesgo principal si no se hace:** quien vende en serio pasa la agenda a Excel/Notion/QuickBooks y la deja como «cuaderno bonito»; la membresía no se sostiene.

---

## 2. Inventario funcional con estado

Pruebas ejecutadas hoy como parte de esta auditoría (solo lectura): ver §2.6.

### 2.1 Implementado y verificado (hay prueba automática y la vi pasar, o lo leí en el código)
| Función | Evidencia |
|---|---|
| Fichas desplegables por lista (15 listas), agregar/borrar, límite 200 con aviso | prueba `limite`, código `fichas.js` |
| Control de pedidos: total = cantidad × valor + envío, saldo, alarmas, WhatsApp | `pedidos.js`; prueba `negocio` |
| Cliente automática al escribir nombre/teléfono en un pedido | `pedidos.js` |
| Finanzas: movimientos, categorías de negocio, presupuesto, gastos fijos y deudas, tarjetas (cupo), metas de ahorro, análisis, flujo de caja, utilidad y margen **del mes** | código `fin()` y hojas `fin-*`; prueba `finanzas_negocio` |
| Exportar a Excel con números, pesos y fechas reales | prueba `excel` |
| Puentes: pedidos entregados → ventas; lanas en 0 → lista de compras | prueba `conexiones` |
| Copia de seguridad, aviso de espacio, aviso rojo si no guarda | prueba `guardado` |
| Membresía: prueba 7 días, bloqueo de hojas, candado en Excel/calendario | pruebas `membresia`, `candado` |
| Aviso al cambiar de cuenta en el mismo navegador | prueba `dueno` [Documentado] |
| Idiomas ES/EN/PT en pantalla | prueba `idiomas` (51) [Documentado] |

### 2.2 Implementado, falta probar (más allá de Chromium)
- Todo en **iPhone, Samsung, iPad**, Safari y Firefox (nunca probado en equipos reales) [Documentado].
- **Lápiz digital** y dibujo a pantalla completa [Documentado].
- **Lector de pantalla** [Documentado].
- **Pago real** de la membresía ($5.000 con Wompi) [Documentado].
- **Google Calendar con usuarias reales** (probado con función simulada; la base tiene 1 cuenta conectada) [Documentado/Verificado].
- **Traducciones EN/PT**: sin revisión humana (decisión de Sara) [Documentado].
- Copia en la nube: 1 usuaria con copia; carga real mínima [Verificado en base].

### 2.3 Parcialmente implementado
| Función | Qué hay | Qué falta |
|---|---|---|
| Inventario de lanas | Marca, color, grosor, ovillos, uso; aviso si hay 0 | Entradas y salidas, costo, proveedor, lotes, mínimos, descuento automático al usar en un proyecto |
| Catálogo de precios | Lista de productos y precios | No calcula el precio desde costos; no enlaza a ventas ni a materiales |
| Finanzas «Análisis» | Utilidad y margen total del mes, consejos | Margen por producto, por línea, punto de equilibrio, retiro posible de dinero |
| Calculadora de precio (Rosina) | Materiales + tiempo + gastos + ganancia + comisión (existe en `calculadoras-rosina.html`) | **Vive aparte de la agenda**: no guarda ni se conecta |
| Proyectos | Fichas con estado, dibujo, foto, muestras | Etapas con %, tiempo real, materiales usados que descuenten inventario, costo del proyecto |
| Metas | Metas de ahorro (4 filas) | Metas de ventas convertidas en metas mensuales/semanales/diarias |
| Excel | Exporta hojas | No importa; no hay informes con formato |

### 2.4 Solo visual o decorativo (no hace cálculo real)
- Los **chips de ánimo** del Diario y la leyenda del calendario son informativos, no alimentan análisis financiero. (No encontré funciones «de adorno» que finjan calcular; las tarjetas del panel sí leen datos reales.) [Verificado en código del panel y finanzas; no auditado línea por línea en las 39 hojas.]

### 2.5 No existe
Costo por producto/receta · inventario con kardex y costo promedio · inventario de producto terminado · punto de equilibrio · escenarios «¿y si subo el precio?» · utilidad vs flujo de caja vs dinero retirable · pronóstico y compras sugeridas · varias líneas de negocio · costos indirectos prorrateados · cuotas de tarjeta sin doble conteo (hay tarjetas y deudas, pero hoy compra con tarjeta y pago de tarjeta pueden duplicarse si la persona anota ambos) [Hipótesis: hay que probarlo con un caso] · multimoneda · impuestos (IVA/retención) · reportes en PDF · permisos de equipo · API/integración con tiendas (Etsy, Shopify…) · trabajo sin conexión con sincronización entre aparatos · historial/auditoría de cambios.

### 2.6 Pruebas ejecutadas hoy
Corrí 8 pruebas. Todas en Chromium con sesión simulada, sin tocar datos reales:
- Finanzas del negocio: **12 correctas, 0 fallas**
- Negocio (pedidos, ventas, gastos): **40/40**
- Conexiones entre hojas: **26/26**
- Panel: **44/44**
- Candado de membresía: **7/7**
- Membresía: **21/21**
- Excel: **11/11**
- Guardado y avisos de espacio: **18/18**
Esto confirma que lo que existe funciona como está descrito. **No** confirma que sea suficiente para una emprendedora real: eso solo se sabe con usuarias.

---

## 3. Diagnóstico por módulo

Formato: 1 función · 2 usuaria · 3 problema que resuelve · 4 qué hay · 5 qué funciona · 6 qué falla o falta · 7 riesgos · 8 mejoras · 9 gratis/pago · 10 dependencias · 11 complejidad · 12 prioridad.

### 3.1 Mi tablero
1. Resumen inteligente. 2. Ambas; hoy sirve más a la aficionada. 3. «¿Cómo voy?». 4. Panel con 4 números del mes, proyectos por estado, ventas de la semana, calendario, próximas fechas y «Para hacer hoy» [Verificado]. 5. Lee datos reales de pedidos, ventas, gastos y calendario. 6. Los números dependen de que la persona haya llenado cada hoja a mano; no hay alertas de caja, ni pedidos atrasados con consecuencias, ni metas diarias. 7. Un panel bonito con datos incompletos da falsa seguridad. 8. Dos paneles: «Mi taller» (gratis: proyectos, ideas) y «Mi negocio» (pago: caja, por cobrar, metas, producto más rentable). 9. Mixto. 10. Núcleo de datos (§9). 11. Media. 12. **Alta**.

### 3.2 Mis proyectos
4. Ficha de proyecto, proyectos por tejer, semana, año, patrones, aprendí, ideas, diseña tu patrón, prendas a medida [Verificado en lista de hojas]. 5. Muy buena base creativa (dibujo, fotos, muestras, voz). 6. El avance es texto libre (sin %); no registra tiempo real; los materiales no descuentan inventario; no calcula costo. 7. Es el módulo con más datos pesados (fotos, trazos): riesgo de llenar `localStorage` (hay aviso a 80 %) [Documentado]. 8. Etapas con % y bitácora de horas; botón «usar materiales» que descuenta del inventario; «convertir en producto» para venderlo. 9. **Gratis** la parte creativa; **pago** el costo y la conversión a producto. 10. Inventario con movimientos. 11. Media-alta. 12. Alta.

### 3.3 Mis materiales
4. Inventario de lanas, agujas, lista de compras, contactos [Verificado]. 5. Aviso de lana en cero → lista de compras. 6. Es una **lista**, no un inventario: sin movimientos, costo, lotes de teñido, proveedor, mínimos ni separar personal de comercial. 7. Dos fuentes de verdad si luego se crea un inventario nuevo. 8. Inventario real: artículo, unidad (g, ovillo, metro, unidad), costo de compra, proveedor, mínimo, lote/tinte, entradas por compra, salidas por proyecto/pedido, saldo, alerta; marcado «personal» o «negocio». 9. Gratis: inventario personal simple. Pago: costo, proveedores, mínimos, valor del inventario, kardex. 10. Núcleo de datos. 11. Alta. 12. **Crítica** (todo lo financiero depende de él). [Diseño de referencia: Craftybase, Ravelry stash; ver §14.]

### 3.4 Mi emprendimiento
4. Pedidos, clientas, ventas, catálogo, ferias, contactos [Verificado]. 5. Pedidos con saldo, clienta automática, ventas por mes, ferias. 6. Sin producción por etapas, sin fecha de entrega calculada, sin historial por clienta (cuánto ha comprado), sin catálogo con costo, sin seguimiento posventa. 7. La clienta se identifica por nombre sin tildes o teléfono: puede duplicar [Verificado en descripción; sin prueba de borde]. 8. Embudo: cotización → anticipo → producción → entrega → reseña; ficha de clienta con historial. 9. Pago. 10. Núcleo de datos. 11. Alta. 12. Alta.

### 3.5 Finanzas del negocio
Hoy [Verificado]: registro de ingresos/gastos con categorías, presupuesto, gastos fijos y deudas, tarjetas con cupo, metas de ahorro, análisis con consejos, flujo de caja y exportar a Excel. Todo en el navegador y en pesos colombianos.

| Sub-módulo | Hoy | Propuesta |
|---|---|---|
| **A. Movimientos** | Lista con filtros y categorías | Tabla tipo hoja de cálculo: editar en línea, ordenar, filtros guardados, importar CSV/Excel, adjuntar foto de recibo, conciliar con cuenta. Complejidad media. Pago |
| **B. Costos fijos/variables** | «Gastos fijos» (valor mensual) | Separar fijos / variables / semivariables; calcular costo fijo por hora de taller. Media. Pago |
| **C. Costo por producto** | No existe | Receta: materiales (del inventario, a costo real) + tiempo × valor de hora + empaque + costos indirectos prorrateados; versiones (v1, v2 si cambia la lana). Para reventa: costo de compra + transporte. Alta. Pago |
| **D. Precio y rentabilidad real** | Margen del mes total | Precio sugerido = costo + margen deseado + comisión + impuestos; simulaciones («y si subo 10 %»); aviso si el precio no cubre costo. Mostrar claro: **utilidad ≠ margen ≠ flujo de caja ≠ dinero que puedo retirar**. Alta. Pago |
| **E. Punto de equilibrio** | No existe | Por producto: costos fijos ÷ margen de contribución. General con varios productos: costos fijos ÷ margen de contribución ponderado por la mezcla de ventas (método estándar [Fuente 9]); en dinero y en unidades; se recalcula cuando cambia la mezcla. Media. Pago |
| **F. Metas** | Ahorro por meta | Meta anual/mensual de **ventas** y de **ingreso personal** → metas mensuales, semanales y diarias, y cuántas piezas por mezcla de productos. Media. Pago |
| **G. Compras e inventario** | Lista de compras manual | Sugerencias con explicación («te quedan 2 ovillos; vendes 3 al mes; el proveedor tarda 5 días → compra 4») basadas en tu propio historial; sin IA al principio (reglas simples). Alta. Pago |
| **H. Rentabilidad** | Margen total | Por producto, por cliente, por canal (feria, WhatsApp, tienda) y por hora trabajada. Media. Pago |
| **I. Presupuestos, deudas, tarjetas** | Existen | Compras a cuotas: registrar **la compra una vez**, generar cuotas y que el pago de la tarjeta **no cuente como gasto otra vez**. Media. Pago/Gratis personal |
| **J. Reportes** | Excel | Informe mensual PDF (ventas, costos, utilidad, caja, top productos); exportar para contador. Media. Pago |

Riesgos del módulo: precisión de los cálculos (error de dinero = pérdida de confianza), impuestos de Colombia (IVA, régimen simple, retención) que **no** debe asumirse sin contador, y privacidad de datos financieros.

### 3.6 Fechas y bienestar
4. Fechas especiales, calendario del año, diario, pausas activas [Verificado]. 5. Funciona; calendario alimenta el panel y Google Calendar. 6. Falta enlazar fechas comerciales con producción («Día de la madre: faltan 40 días, tienes 3 pedidos y capacidad para 5»). 8. Calendario comercial con capacidad de producción (emprendedora, pago); el diario y pausas, gratis. 12. Media. Recordatorio de valores de la marca: no incluir Navidad, San Valentín ni Halloween en el calendario comercial.

---

## 4. Auditoría de los cinco recursos de Rosina

Hoy son **páginas estáticas informativas con herramientas sueltas**, del Rincón de Rosina (casa Academy). Tamaño: 34–165 KB cada una [Verificado].

| Recurso | Qué contiene hoy [Verificado] | Conservar | Mejorar | Cómo integrarlo | Dónde |
|---|---|---|---|---|---|
| **Academia de Rosina** (`/academy/rosina/`) | Hub con material gratis, «Conoce a Rosina», clases | Voz y personaje, marca | Que sea la «escuela» dentro de la agenda: progreso de aprendizaje | «Mi ruta» (Aprender) guardada por usuaria; insignias; vínculo a «Lo que aprendí» | Sección **Aprender** (gratis) |
| **Glosario** | Términos de crochet con dibujos y ejemplos | Contenido y dibujos | Búsqueda dentro de la hoja; términos en EN/PT | Al escribir un patrón o una ficha, subrayar términos y mostrar definición | Servicio transversal (tooltip), gratis |
| **Paletas** | Paletas por tono, fecha, bebé, amigurumi, hogar; «arma tu paleta» | Paletas | Conectar con Mercería (colores reales con stock) y con proyectos | «Usar esta paleta» → crea materiales en el proyecto y lista de compras | **Crear** (gratis); compra → Mercería |
| **Calculadoras** | Esferas, agujas, aumentos, muestra, lana (para pieza plana), contador, **precio** | Fórmulas ya validadas | Guardar resultados; usar el mismo cálculo de lana en la ficha | «Calculadora de lana» escribe en el proyecto; **«Precio» pasa a ser el módulo C/D** | Crear (gratis) + Costos (pago) |
| **Recursos** | Checklist primer amigurumi, abreviaturas en 9 idiomas, descargas, stickers, fondos/íconos de celular | Abreviaturas multilingües (muy valiosas para internacional) | Descargas dentro de «Mi cuenta» | Biblioteca de la usuaria; abreviaturas como «traductor de patrones» | Aprender (gratis), con puerta de cuenta |

**Principios de integración:** (1) un resultado de calculadora se puede **guardar en un proyecto o producto**; (2) mismo diseño que la agenda (hoy el Rincón es azul de Academy y la agenda tiene otra paleta: unificar); (3) nada de enlaces externos que hagan perder lo escrito (ya existe la tira «Herramienta de Rosina»); (4) mantener direcciones URL actuales por SEO.

**Posibilidades tecnológicas:** guardar en base por usuaria; abreviaturas → «tradúceme este patrón» (con IA, ver §10); lector de patrones PDF con contador de vueltas (referente: knitCompanion [Fuente 3]).

---

## 5. Propuesta gratis / de pago

Criterio: **gratis = hacer, aprender y organizar tu afición; pago = ganar dinero con orden** (no se bloquea lo que hoy es gratis sin ofrecer algo nuevo y claro).

| Plan | Para quién | Incluye |
|---|---|---|
| **Gratis (con cuenta)** | Aficionadas | Proyectos, patrones, ideas, portada, diario, pausas, planeador, calendario, inventario personal simple, glosario, paletas, calculadoras, abreviaturas, aprender, copia en la nube con consentimiento |
| **Emprendedora** (hoy $5.000/mes) | Venden | Pedidos y clientas con historial, producción, **costos por producto**, **precio y rentabilidad**, inventario comercial con movimientos, ventas y gastos, finanzas, presupuestos, metas, punto de equilibrio, ferias, reportes, alertas |
| **Taller / Pro** [Hipótesis, validar] | Varias líneas o equipo | Líneas de negocio, costos compartidos, colaboradoras, informes consolidados, multimoneda |

Notas: el precio actual ($5.000) es **bajísimo** frente a software de gestión para artesanas (Craftybase en dólares, sin acuerdo entre fuentes [Fuente 2]; QuickBooks ~US$35–38 [Fuente 4]). Pero en Colombia el poder adquisitivo es distinto. **[Hipótesis]** Probar $9.900–$19.900/mes para el plan Emprendedora **solo después** de entregar los módulos de costos y precio, y mantener el actual para quienes ya pagan. No cambiar el precio antes de medir cuántas usan la agenda.

Estrategia comercial: el plan gratis alimenta el embudo; la prueba de 7 días debería ser **de la función de emprendedora** (la usuaria la ve funcionando con sus datos) y no solo «todo abierto».

---

## 6. Sistema financiero propuesto

Capas simples, sin contabilidad formal:
1. **Cuentas** (efectivo, Nequi/Daviplata, banco, tarjeta) con saldo.
2. **Movimientos** (ingreso, gasto, traslado, pago de deuda). Un **traslado** y un **pago de tarjeta** nunca cuentan como gasto.
3. **Compras a cuotas**: una compra → cronograma; cada cuota se paga una vez.
4. **Costos**: fijos, variables y de producto (receta).
5. **Resultados**: *utilidad* (ventas − costos), *caja* (lo que hay), *retirable* (caja − pagos próximos − reserva de inventario/impuestos).
6. **Alertas**: precio bajo costo, caja negativa en 30 días, deuda próxima, inventario bajo.
Todo con una única tabla de movimientos como fuente de verdad (§9).

## 7. Varias líneas de negocio
Líneas: **Productos tejidos**, **Mercería**, **Academia** (y las que la usuaria cree). Cada movimiento, producto y costo lleva una *línea*. Costos compartidos (arriendo, internet, redes) se **prorratean** por regla elegida: partes iguales, por ventas o por horas. Informe consolidado + por línea. [Referente interno: el ERP ya tiene centros de costo y ventas internas entre departamentos.] **[Hipótesis]** La mayoría de las usuarias iniciales tendrá una sola línea; no construir esto primero.

## 8. Integración y fuente única de verdad
Cadena objetivo: **Pedido → Clienta → Proyecto → Materiales usados → Costo real → Precio → Fecha de entrega → Ingreso financiero**; y **Compra de material → Inventario → Costo**.
Reglas: cada dato se escribe **una vez**; las demás hojas lo **leen**; los números calculados no se guardan, se recalculan; un pedido pagado crea un ingreso (no se vuelve a anotar en «Ventas»); IDs estables (no «fila 7»).
Estado hoy: tres puentes manuales por botón; el resto, copia a mano (riesgo de duplicados, p. ej. pedido y venta) [Verificado].

---

## 9. Arquitectura propuesta (sin ejecutar)

**Hoy:** HTML estático + `localStorage` + algunas funciones en Supabase [Verificado].
**Meta:** conservar HTML estático y módulos, pero mover los datos de negocio a **tablas por usuaria** en Supabase con seguridad por fila (cada usuaria solo ve lo suyo):
`ag_clientas, ag_productos, ag_materiales, ag_movimientos_inventario, ag_pedidos, ag_pedido_lineas, ag_proyectos, ag_movimientos_dinero, ag_cuentas, ag_lineas_negocio, ag_costos`.
**Migración sin pérdida:** leer `rosinaAgenda` actual, mapear a tablas, dejar copia local intacta, ejecutar en pantalla «Pasar mi agenda al nuevo sistema» con vista previa y botón de deshacer.
**Trabajar sin internet:** guardar primero en el aparato y sincronizar después (resolver conflictos entre dos aparatos).
**No** reutilizar las tablas del ERP de Sara con las usuarias.
Riesgo de arquitectura: es **un cambio grande**; hacerlo por etapas y con la agenda actual funcionando en paralelo.

## 10. Inteligencia artificial y tecnología avanzada
| Idea | Utilidad | Complejidad | Costo | Recomendación |
|---|---|---|---|---|
| Rosina responde sobre la agenda (ya existe) | Media | — | Bajo | Mantener |
| Alertas y recomendaciones por **reglas** (precio bajo costo, compra sugerida) | **Alta** | Baja-Media | Casi 0 | **Primero** |
| Leer foto de recibo (OCR) y proponer movimiento | Alta | Media | Por uso | Después, con consentimiento |
| «Cuánto cobrar por esta foto» | Media | Alta | Por uso | Experimento |
| Traducir patrones/abreviaturas | Media | Media | Por uso | Opcional |
| Pronóstico de ventas | Media | Alta | — | Solo con ≥ 6 meses de datos reales |
Privacidad: las usuarias deben saber qué sale del aparato (ya hay aviso para voz y chat).

## 11. Seguridad, rendimiento y escalabilidad
- **Seguridad [Documentado/Verificado]:** tablas de agenda cerradas, consentimiento para la nube, aviso por cambio de cuenta. Pendiente: duración de códigos de acceso (OTP 3600 s → sugerido 900), límite de intentos, plan de respaldos de Supabase.
- **Candado de membresía**: es solo de la página; alguien con conocimientos puede abrir hojas bloqueadas desde la consola del navegador. Los datos son suyos, pero un modelo con **funciones pagas en el servidor** (cálculos de costos, reportes) es más robusto [Verificado: diseño].
- **Datos financieros en el navegador:** se pierden si se borra el historial (hay copias y aviso).
- **Rendimiento:** `agenda-rosina.html` pesa ≈403 KB y carga 33 scripts (≈289 KB) + 11 CSS (≈109 KB) [Verificado]: bien en Wi-Fi, a vigilar en celulares de gama baja.
- **Escala:** con bases por usuaria, índices por `usuaria_id`; límites de fotos (almacenamiento separado, no en la fila).
- **Legal:** términos de membresía y política de datos **pendientes de la abogada**; datos financieros de terceras personas (clientas) → Ley 1581.

## 12. Alternativas de nombre (no se cambia nada)
«Agenda para Emprendedoras» · «Taller Rosa» · «Mi Taller con Rosina» · «Rosina Pro» · «Cuaderno de Emprendedora» · «Lana Rosa Taller». Recomendación **[Hipótesis]**: mantener «Agenda para tejedoras» como puerta gratis y dar nombre propio al plan de pago (ej. «Taller con Rosina») para no espantar a la aficionada. Validar con una encuesta corta de 10 usuarias y revisar disponibilidad de marca.

## 13. Estrategia de marketing (13.1–13.10 resumida)
- **Concepto:** «Mucho más que una agenda: aprende, crea, organízate y emprende con tus manos». Sin prometer ingresos fáciles; mostrar **cuentas reales y claras**, no cifras mágicas.
- **Dos públicos:** aficionada (placer, orden, aprender) y emprendedora (vender, costear, crecer).
- **Narrativa:** Aprender → Crear → Organizarse → Emprender → Crecer.
- **Mensajes dentro del producto:** biblioteca editable de mensajes contextuales (ej. al anotar 3 pedidos: «¿Ya sabes cuánto te queda por pedido?»), con límite de frecuencia y botón «no mostrar más».
- **Canales (orden por costo/impacto) [Hipótesis]:** 1) web y tienda propias, correo y WhatsApp; 2) Instagram y TikTok con reels de «cuentas del taller»; 3) YouTube (clases ya existentes); 4) blog/Revista y Pinterest (SEO paciente); 5) alianzas con maestras y tiendas de lana; 6) comunidades. Consultar la skill de contenido de Lana Rosa para voz de marca.
- **Imán gratis:** calculadora de precio, plantilla de costos, checklist de primera venta.
- **Embudo:** contenido → calculadora gratis → cuenta → agenda gratis → prueba de emprendedora → pago.
- **Internacional:** idiomas ya en 3; faltan monedas, pagos (Wompi cubre Colombia; PayPal existe en el ERP [Verificado]), impuestos por país, soporte, licencias de patrones, reembolsos, protección de datos (GDPR), precios regionales, dominios/SEO por idioma. **No investigado a fondo.**
- **Competencia [Fuente]:** Ravelry (comunidad gratuita con proyectos, stash y biblioteca de patrones [1]); Craftybase (inventario, recetas, costo de ventas, sincronización con Etsy/Shopify; precios discordantes [2]); knitCompanion y apps de contador de vueltas (gratis + compras dentro de la app [3]); Wave y QuickBooks (contabilidad general: Wave gratis en lo básico; QuickBooks Simple Start ≈US$35–38 [4]); plantillas de Notion para crochet desde ~US$3 a US$27 [5]. **Hueco posible [Hipótesis]:** «gestión de emprendedora de crochet, en español, simple y barata, conectada a clases y mercería» — ninguna de las fuentes encontradas lo cubre explícitamente, pero **no hice un estudio exhaustivo de competidores en español/Latinoamérica**; falta validar.
- **Plan de marketing en 12 puntos (acciones baratas primero):** (1) 10 entrevistas a usuarias; (2) página de ventas del plan Emprendedora con casos; (3) calculadora de precio como imán; (4) serie en Instagram «¿cuánto cuesta tejer esto?»; (5) correo de bienvenida de 5 días; (6) alianza con 3 maestras; (7) regalo de prueba 30 días a primeras 50; (8) testimonios con permiso; (9) reels de «antes/después de ordenar costos»; (10) artículos SEO de precios y costos; (11) medir activación (¿anotó 3 pedidos en 7 días?); (12) revisar precio cada trimestre.

## 14. Referentes profesionales (con fuente)
| Módulo | Referente | Qué aprender |
|---|---|---|
| Proyectos / stash / patrones | Ravelry [1] | Cuaderno unido: proyecto ↔ patrón ↔ hilo; el stash baja al usar |
| Inventario y costo | Craftybase [2] | Recetas multinivel, costo real por compra, alertas de mínimo |
| Contador de vueltas | knitCompanion y apps similares [3] | Marcadores, notas por parte |
| Finanzas básicas | Wave y QuickBooks [4] | Recibos con foto, informes simples |
| Plantillas | Notion crochet [5] | Lo que ya ofrecen las competidoras baratas |
| Punto de equilibrio | Textos de contabilidad gerencial [9] | Margen de contribución ponderado |
Nota de honestidad: las fuentes de precios son agregadoras y se contradicen; **no usarlas para fijar precios sin verificar**.

---

## 15. Funciones propuestas (resumen)
Ver matriz §17.

## 16. Internacionalización
Idiomas listos (ES/EN/PT, sin revisión humana). Faltan: monedas (hoy solo COP), formato de números y fechas por país, impuestos, pagos internacionales, políticas legales traducidas, y soporte. Prioridad media; depende de tener primero el producto de pago nacional validado.

## 17. Matriz de prioridades
Complejidad: B baja · M media · A alta. Prioridad: C crítica · A alta · M media · Ba baja.

| # | Mejora | Problema | Beneficio | Módulo | Plan | Compl. | Dependencias | Prior. |
|---|---|---|---|---|---|---|---|---|
| 1 | Entrevistas con 10 usuarias + medir uso real | No sabemos qué usan | Decidir con datos | Producto | — | B | Ninguna | **C** |
| 2 | Pruebas en iPhone, Samsung, iPad y lector de pantalla | Solo probado en Chromium | Evitar fallas en el 90 % de celulares | Calidad | — | B | Dispositivos | **C** |
| 3 | Probar el pago real de $5.000 | Nunca se probó | Cobrar con seguridad | Membresía | Pago | B | Sara | **C** |
| 4 | Núcleo de datos por usuaria (tablas + seguridad por fila + migración) | Datos aislados en el navegador | Habilita todo lo demás | Arquitectura | — | A | Decisión de Sara, abogada | **C** |
| 5 | Inventario con movimientos y costos | Lista sin entradas/salidas | Costos reales | Materiales | Gratis básico/Pago | A | #4 | **C** |
| 6 | Costo por producto (recetas) | No se sabe cuánto cuesta | Precio correcto | Finanzas C | Pago | A | #4, #5 | **C** |
| 7 | Precio sugerido y alerta de precio bajo | Se vende a pérdida | Rentabilidad | Finanzas D | Pago | M | #6 | A |
| 8 | Calculadora de precio de Rosina guarda en producto | Herramienta aislada | Integración | Rosina | Gratis→Pago | B | #6 | A |
| 9 | Punto de equilibrio (individual y ponderado) | No existe | Metas realistas | Finanzas E | Pago | M | #6, #7 | A |
| 10 | Metas de ventas → mensuales/semanales/diarias | Solo ahorro | Acción diaria | Finanzas F | Pago | M | #9 | A |
| 11 | Pedido ↔ clienta ↔ proyecto ↔ ingreso (sin doble anotación) | Duplicados | Una sola fuente | Integración | Pago | A | #4 | A |
| 12 | Cuotas de tarjeta sin doble conteo | Posible duplicado | Cifras fiables | Finanzas I | Pago | M | #4 | A |
| 13 | Compras sugeridas por reglas explicadas | Compras a ojo | Menos faltantes | Finanzas G | Pago | M | #5 | M |
| 14 | Informe mensual PDF | Solo Excel | Para contador y banco | Finanzas J | Pago | M | #4 | M |
| 15 | Etapas y horas reales en proyectos | Avance en texto | Costo de tiempo real | Proyectos | Pago | M | #4 | M |
| 16 | Servicios de Rosina integrados (glosario con tooltip, paletas→materiales) | Páginas aparte | Experiencia única | Rosina | Gratis | M | #4 | M |
| 17 | Unificar diseño del Rincón con la agenda | Dos estilos | Marca profesional | Diseño | — | M | Ninguna | M |
| 18 | Mensajes contextuales (biblioteca editable) | Poca guía | Conversión | Marketing | Mixto | B | Ninguna | M |
| 19 | Líneas de negocio y costos compartidos | Un solo negocio | Mercería/Academia | Finanzas | Pro | A | #4–#11 | Ba |
| 20 | Multimoneda e impuestos | Solo COP | Venta internacional | Finanzas | Pro | A | #19 | Ba |
| 21 | Pronóstico con IA | Prematuro | — | IA | Pro | A | 6 meses de datos | Ba |
| 22 | Revisión humana de EN/PT y textos legales | IA sin revisión | Confianza | Idiomas | — | B | Personas | M |
| 23 | Revisión de abogada de membresía y datos | Pendiente | Cumplimiento | Legal | — | B | Abogada | **A** |

## 18. Hoja de ruta por fases (con dependencias)
- **Fase 0 — Validar (2–3 semanas):** #1, #2, #3, #22, #23. Sin código nuevo grande. Decide si el plan de pago vale la pena.
- **Fase 1 — Cimientos (6–10 semanas):** #4 núcleo de datos con migración y respaldo; inventario #5. **Condición para avanzar:** migración probada con copias reales y botón de deshacer.
- **Fase 2 — Dinero real (6–8 semanas):** #6, #7, #8, #12, #11. **Condición:** cálculos verificados con casos de contador de Sara.
- **Fase 3 — Dirección (4–6 semanas):** #9, #10, #13, #14, #15.
- **Fase 4 — Integración Rosina y diseño (continuo):** #16, #17, #18.
- **Fase 5 — Crecimiento:** #19, #20, #21, marketing internacional.
Orden recomendado si hay que elegir solo tres cosas: **#1 (entrevistas), #4+#5 (núcleo e inventario), #6+#7 (costo y precio)**.

---
## Fuentes consultadas (internet, 31-oct-2026)
1. [Ravelry – Wikipedia](https://en.wikipedia.org/wiki/Ravelry) y [Tour de Ravelry para tejedoras](https://www.ravelry.com/tour/knitters-crocheters)
2. [Craftybase – inventario de materia prima](https://craftybase.com/raw-material-inventory-management-software) y [Capterra](https://www.capterra.com/p/144117/Craftybase/reviews/1717518/) (precios contradictorios; la página indica que pasa a llamarse Stocksmith)
3. [knitCompanion en la App Store](https://apps.apple.com/app/id1058142783) y [reseña](https://allfreeknitting.com/Product-Reviews/knitCompanion-App). *No encontré datos de Stitch Fiddle.*
4. [Wave (Software Advice)](https://www.softwareadvice.com/product/18767-Wave) y [precios de QuickBooks (NerdWallet)](https://www.nerdwallet.com/article/small-business/business-software/how-much-does-quickbooks-cost)
5. [Plantilla Notion para crochet (Gumroad)](https://thesassysavant.gumroad.com/l/notionnewbs), [Notion para negocio artesanal](https://notiontemplatesonny.gumroad.com/l/small_business)
9. [Punto de equilibrio con varios productos – Saylor](https://saylordotorg.github.io/text_managerial-accounting/s10-02-cost-volume-profit-analysis-fo.html) y [Xero](https://www.xero.com/uk/guides/calculate-break-even-point/multiple-products-break-even/)

**No investigado (y por tanto sin afirmar nada):** competidores en español/Latinoamérica, precios por país, impuestos internacionales, costos reales de cada pasarela de pago, requisitos legales por país.

# Agenda de Rosina: versión gratis y versión de pago (plan del 8-oct-2026)

## Qué queda gratis y qué es de pago (aprobado por Sara el 8-oct-2026)
**Precios:** mensual $10.000 COP, anual $60.000 COP (6 meses gratis). Finanzas en la nube: sí.
**Gratis con cuenta:** portada, índice, proyectos (ficha, semana, fila, patrones, año, lo que aprendí), materiales (lanas, agujas, compras), pedidos, clientas, ventas del mes, catálogo de precios, ferias, fechas especiales, diario, pausas, visión del año y prioridades del mes. Todo se guarda en el dispositivo.
**De pago (membresía):** Finanzas completas (diseño tipo "Finanzas Pro"), Tablero de indicadores, Calendario del año, sincronización con Google Calendar, copia de seguridad en la nube y uso en varios dispositivos.

## Cobro (Wompi)
- Planes sugeridos: mensual y anual (el anual con descuento). Cada pago activa la membresía hasta una fecha (`suscripcion_hasta` en la cuenta de la clienta).
- Aviso 7 y 1 días antes de vencer, con botón para renovar. Sin cobro automático al inicio (se puede agregar después con tarjeta tokenizada).
- Piezas: producto "Membresía Agenda" (mensual/anual) en el ERP; `crear-pago-wompi` acepta membresías (digital, sin envío, sin descuento de primera compra); el webhook activa la fecha; la agenda lee el estado con una función segura (`mi_membresia()`); correo de bienvenida y de renovación; contabilidad (ingreso por membresía).
- Nota: la agenda es una página estática. El bloqueo de las hojas de pago se hace en la página (y, para los datos en la nube, en la base con seguridad por usuario). Quien sabe programar puede saltarse el bloqueo visual, pero no puede leer ni guardar datos en la nube sin membresía.

## Finanzas de pago (inspirado en Mis Finanzas Pro, versión sencilla)
Datos en la nube (tabla por usuario con seguridad RLS) para que no se pierdan y se vean en varios dispositivos.
1. **Panel:** mes y año; tarjetas de Ingresos, Gastos, Saldo del mes e Invertido/Ahorrado; evolución de ingresos y gastos (6 y 12 meses); gastos por categoría (dona); gastos fijos del mes; alertas de presupuesto.
2. **Movimientos:** registro en lenguaje natural (ya existe), formulario, filtros por mes/categoría/medio de pago, buscar, editar y borrar, importar/exportar a Excel (CSV).
3. **Planificación:** presupuesto por categoría, planes del año y metas de ahorro con barra de avance y fecha objetivo.
4. **Gastos fijos:** suscripciones, pagos recurrentes (arriendo, servicios) que se registran solos cada mes, y deudas con cuotas y saldo.
5. **Tarjetas:** cupo, corte y pago; gastos con tarjeta aparte.
6. **Análisis:** comparar meses, categorías que más suben, ahorro %, resumen anual.
7. **Versión emprendimiento:** flujo de caja del negocio, cuentas por cobrar y por pagar, resultados del mes (ventas − costos − gastos) y vínculo con las hojas de pedidos y ventas.
8. **Asistente de Rosina:** escribir "gasté 50 mil en mercado" (ya funciona) y sugerencias ("este mes gastaste 20 % más en materiales").
9. **Personalizar diseño:** colores y orden del panel.

## Fases
1. Membresía: cobro con Wompi, fecha de vencimiento, bloqueo de las hojas de pago, avisos. (La base de todo.) **HECHA, apagada** (`MEMBRESIA_ACTIVA = false`; vista previa con `?membresia=ver`). Migración 14, `crear-pago-wompi` v29.
2. Finanzas en la nube + Panel y Movimientos nuevos. **HECHA** (sin encender el cobro): panel, movimientos con filtros/edición/CSV, y copia de toda la agenda en la nube (migración 15). Lo que la clienta ya tiene en el dispositivo se sube sola la primera vez.
3. Planificación, gastos fijos y deudas. **HECHA** (hoja «Gastos fijos y deudas», metas con fecha y planes del año).
4. Tarjetas, análisis y versión emprendimiento.
5. Exportar y pulir.

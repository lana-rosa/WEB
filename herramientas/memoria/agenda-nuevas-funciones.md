# Agenda — nuevas funciones (plan, 23-nov-2026) · SOLO PLAN, nada construido

> Origen: ideas de la propuesta externa «Mi Espacio Creativo». **Se mantiene** HTML/CSS/JS por página, `localStorage.rosinaAgenda` + `lrDibStore`, copia en la cuenta y Drive (nada de Next.js, Vercel, TypeScript ni Tailwind). Lo que ya existe (calendario, tareas del día, notas, pedidos, presupuesto, ahorro, ánimo/diario, cronómetro) no se repite.
> Revisado en el código el 23-nov-2026 (`js/agenda/`, `agenda-rosina.html`). Membresía hoy: 7 días de prueba, luego 2 pestañas gratis (`PESTANAS_GRATIS = 2`) + hojas de `HOJAS_SIEMPRE_GRATIS`; el resto es Plus.

## a) Función por función
| # | Idea | ¿Ya existe algo? | Qué falta | Dónde entra | Gratis / Plus | Esfuerzo · tokens aprox. |
|---|---|---|---|---|---|---|
| 1 | Matriz de Eisenhower | No hay (0 coincidencias). Existen tareas del día/semana con casilla en `planeador.js` (`registro().t = [{x, ok}]`). | Marcar cada tarea con urgente/importante y verla en 4 cuadros (hacer ahora / programar / delegar / eliminar). | Dentro del planeador (Inicio), como vista «Por prioridad»; **sin hoja nueva**. | Gratis (es de organización y engancha). | **Bajo** · ~40 mil |
| 2 | Temporizador de tejido 25/5 | **Parcial:** `cronometro.js` (E34) mide horas por proyecto y alimenta «Horas tejidas» de Mi panel; aún no hay cuenta regresiva ni ciclos. | Ciclos configurables (25/5 por defecto), aviso al terminar, y que cada ciclo sume al mismo `_proyTiempo` del proyecto o pedido. Ligado con la pausa de la función 3. | Mismo bloque «Tiempo tejido» del proyecto (Proyectos) + botón en Mi panel; **sin hoja nueva**. | Cronómetro ya es lo que es; ciclos = Plus (mide horas reales → precio por hora). | **Medio** · ~60 mil |
| 3 | Pausas activas «Tejer con Responsabilidad» | **Parcial:** hoja `registro-pausas` (Fechas y bienestar): cuadrícula de días del mes; enlace al artículo `/revista/pausas-activas/`; tarjeta «Días con pausas activas» en el tablero (`dashboards.js`). | Rutina guiada de ejercicios (manos, muñecas, cuello, hombros, descanso visual), recordatorio cada 30–40 min (el tip de Rosina ya lo dice) y registro de cumplimiento más fino que «sí/no». | Se **amplía** `registro-pausas`; el recordatorio se une al temporizador (#2). Texto de ejercicios: revisarlo con el artículo de la Revista, **sin consejo médico**. | Gratis (es cuidado y refuerza la marca). | **Medio** · ~70 mil |
| 4 | Hábitos, agua, medicamentos | **Casi nada:** solo la cuadrícula de pausas (reutilizable) y «Agua y algo de comer» como casilla de la lista de ferias. «Salud» es una categoría de gastos. | Hábitos con cuadrícula mensual (reusar el patrón de `pausas-grid`), vasos de agua por día, y registro de medicamentos/suplementos. | Hoja nueva «Mis hábitos» en «Fechas y bienestar». Medicamentos: **aparte y apagado por defecto** (ver c). | Hábitos y agua: gratis. Medicamentos: Plus o gratis, **decide Jennifer + abogada**. | Hábitos+agua **medio** (~70 mil); medicamentos **alto** por privacidad (~60 mil + revisión legal) |
| 5 | «Mi Brújula» (rueda de la vida, Ikigai, metas SMART, carta de fin de año) | No existe (0 coincidencias; solo hay `iconos.js` con un ícono de brújula sin uso por confirmar). Hay «Presupuesto y metas» (dinero) y «Lo que aprendí»; no metas de vida. | Rueda de la vida (SVG propio como `graficas.js`), Ikigai (4 casillas), meta SMART (formulario guiado con fecha), carta al fin de año (texto guardado, se muestra en diciembre). | Hoja nueva «Mi brújula» en «Fechas y bienestar» (o pestaña propia si crece). Cuidar las **fechas especiales**: sin Navidad ni fechas de santos; la carta se llama «de fin de año». | Plus (reflexión, no urgente). | **Alto** · ~120 mil en 2 entregas (rueda+SMART; Ikigai+carta) |

## b) Orden recomendado (tejedora que vende)
1. **#1 Eisenhower** — barato, se usa a diario, sin riesgo.
2. **#2 Temporizador con ciclos** — convierte horas reales en precio justo (ya está el cronómetro y el valor de la hora del catálogo).
3. **#3 Pausas guiadas** — van pegadas al temporizador; refuerzan «Tejer con Responsabilidad».
4. **#4 Hábitos y agua** (sin medicamentos todavía).
5. **#5 Mi Brújula** — la más grande y la menos urgente.
6. **Medicamentos/suplementos al final**, solo si Jennifer y la abogada lo aprueban.

## c) Cosas delicadas
- **Salud = datos sensibles (Ley 1581).** Medicamentos, suplementos y hábitos de salud deben quedar **solo en el aparato**: excluirlos de la copia en la cuenta, de Drive y de la mezcla entre aparatos, **o** cifrarlos antes de salir. Hoy cualquier clave nueva dentro de `rosinaAgenda` o `datos._*` entra sola en copias, nube y Drive: hace falta una excepción explícita (pendiente de diseñar con el chat 1). El texto de privacidad y el aviso lo revisa la abogada (chat 6), como con «Medidas y gustos».
- **Cada función nueva:** (1) textos en `herramientas/agenda-idiomas/datos_*.py` + `generar.py` (ES/EN/PT) y subir `idioma.js` en el `?v=`; (2) actualizar `GUIA_AGENDA` en `herramientas/rosina-web/index.ts` y volver a desplegar `rosina-web` (enviar `nucleo.ts` e `index.ts` COMPLETOS y comparar) para que el chat de Rosina las conozca; (3) si cambia un color, `python3 herramientas/agenda-oscuro/generar_oscuro.py` y subir su `?v=`; (4) prueba nueva en `herramientas/pruebas/probar_agenda_*.py`, copia/Excel/borrar pasando por `lrDibStore`, y entrada en el menú, la lupa y el tablero.
- Todo lo que se vea en la página: foto y «¿Lo pongo en la página?» antes de publicar (🟡). Si se decide Plus: es 🔴 (precios y membresía).

## d) Colores
Los de la agenda y la marca (`--rosa-principal #E74E96`, `--rosa-medio #F28FC0`, `--rosa-suave #FBE4EF`, `--lila #9EA2F9`, `--azul-acero #93C7F9`; DynaPuff y Hanken Grotesk) y los tonos que ya usan las hojas/tableros (`COL.*` de `dashboards.js`). **No** se usan los colores de la propuesta externa.

## Pendientes / dudas (no inventadas)
- ¿El ícono `brújula` de `iconos.js` ya se usa en algún lado? (no verificado).
- ¿Cuántas pestañas gratis quedan hoy realmente (2 en el código; CLAUDE/estado hablan de 3)? Confirmar antes de decidir gratis/Plus.
- ¿Los recordatorios del temporizador pueden sonar con la pestaña cerrada? (en celular probablemente no; probar).
- Diseño del «solo en el aparato» (c) y qué decide la abogada.

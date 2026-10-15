# 03 · Estimación de esfuerzo y costos (orientativa)

**Aviso importante:** no hay tarifas verificadas de proveedores en este entorno, así que **no se inventan precios**. Donde no hay dato, se dan cantidades de trabajo y variables de consumo para que Sara multiplique con la tarifa vigente de cada proveedor (que debe consultarse en su página oficial antes de decidir). No se autoriza ni se contrata ningún gasto.

Las cuatro categorías se mantienen separadas:
1. **Costo de caja** (dinero que sale de la cuenta).
2. **Valor estimado del tiempo del equipo** (no sale dinero, pero cuesta tiempo).
3. **Costo de operación mensual** (recurrente).
4. **Costo puntual de implementación.**

## 1. Esfuerzo por etapa (horas de trabajo, supuestos)

Supuestos: una persona técnica con acceso al repositorio y a Supabase; la validación de contenidos la hace Sara o el taller; sin artista 3D salvo donde se indica. Rango = mínimo–máximo razonable. Son horas de trabajo efectivo, no calendario.

| Etapa | Desarrollo | Pruebas y accesibilidad | Contenido a validar por Sara/taller | Total técnico |
|---|---|---|---|---|
| 1 Universo + regalar | 14–22 h | 5–8 h | Etiquetar ~77 productos (≈3–5 h) | 19–30 h |
| 1b Endurecimiento (buckets, límites, funciones) | 6–10 h | 3–5 h | Revisar qué buckets pasan a privado (≈1 h) | 9–15 h |
| 2 Configurador de personalizados | 18–30 h | 6–10 h | Definir opciones reales (colores, ropa, accesorios, límites) (≈4–8 h) | 24–40 h |
| 3 Cuidados, historias y QR | 10–16 h | 4–6 h | Validar cuidados y escribir historias (≈0,5 h por producto) | 14–22 h |
| 4 Rosina con tarjetas + búsqueda visual simple | 14–24 h | 6–10 h | Revisar respuestas de prueba (≈3 h) | 20–34 h |
| 4b Evaluación de OCR / búsqueda visual con IA | 8–14 h (solo investigación y prueba) | 3–5 h | — | 11–19 h |
| 5 Piloto 3D/AR de una pieza | 10–18 h | 6–10 h | Elegir pieza y sesión de fotos (≈2–3 h) | 16–28 h |
| 6 Patrones, comunidad, tienda física | por definir tras validar demanda | | | no se estima aún |

**Etapa recomendada primero:** 1b + 1 (≈28–45 h técnicas en total), porque reutilizan la infraestructura actual y casi no tienen costo de caja.

## 2. Valor del tiempo (referencia)

El ERP guarda un valor de hora de mano de obra de **$15.123 COP** (usado para costear productos). Si Sara decide valorar el tiempo técnico a esa misma tarifa **solo como referencia**, 28–45 h equivalen a **≈ $423.000–$680.000 COP** de tiempo (28 × 15.123 = 423.444; 45 × 15.123 = 680.535). Es una unidad de comparación, no un precio: el valor real de las horas técnicas lo fija Sara.

## 3. Costo de caja y operación mensual — qué variables hay

| Rubro | Etapa | Tipo | Cómo se calcula (sin precio inventado) |
|---|---|---|---|
| Hosting web (GitHub Pages) | todas | recurrente | Hoy sin costo en el plan actual; confirmar. |
| Supabase (almacenamiento, Edge, Auth) | todas | recurrente | Hoy plan gratuito. Los modelos 3D, fotos de comunidad y copias de seguridad pueden obligar a pasar a Pro; consultar la tarifa oficial. |
| Consumo de IA del asistente Rosina | 4 | recurrente variable | (consultas al mes) × (tokens por consulta ≈ 30.000 de entrada, con caché, + hasta 700 de salida) × (tarifa vigente del modelo). **Falta medir hoy el consumo real**: primer paso de la Etapa 4. |
| IA multimodal / OCR / embeddings | 4b | recurrente variable | (imágenes al mes) × (tarifa por imagen o por token). Alternativa local sin costo por llamada: requiere tiempo de ajuste. |
| Generación de imágenes con IA (conceptos) | 2 fase posterior | variable | (conceptos generados) × (tarifa); además revisión legal previa. |
| Almacenamiento y transferencia de 3D | 5 | recurrente | Un `.glb` optimizado suele ocupar de 1 a 5 MB (supuesto de planificación): (modelos) × (MB) × (visitas) . |
| Producción del modelo 3D | 5 | puntual | Cotización de un artista 3D externo **por pieza** (no hay valor verificado); alternativa propia: horas del equipo. |
| Dominio / correo / pagos | — | ya existentes | Sin cambio. |
| Mantenimiento mensual | todas | recurrente | Supuesto: 2–4 h/mes para revisar etiquetas nuevas, productos sin clasificar y pruebas semanales. |
| Pruebas | todas | puntual | Incluidas en las horas de la tabla 1. |

## 4. Etapa 1 en pesos: costo de caja esperado

- **Costo de caja de las Etapas 1 y 1b: $0 COP adicionales**, salvo que el plan de Supabase deba subir (hoy no se necesita para estas etapas).
- Tiempo de Sara/taller: ≈ 4–6 h (etiquetar y revisar).
- Consumo de IA: ninguno (el recomendador usa reglas).

## 5. Qué se debe medir antes de gastar más

1. Consultas reales a Rosina por semana y tokens por consulta (para estimar el costo mensual de IA).
2. Cuántas personas abren el recomendador y cuántas llegan a una ficha (línea base de Etapa 1).
3. Cuántas solicitudes de personalizado llegan por mes (hoy el CRM registra 0 con `origen='web'`: confirmar si el flujo recibe solicitudes).

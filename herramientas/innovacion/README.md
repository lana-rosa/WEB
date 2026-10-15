# Ecosistema de innovación de Lana Rosa Crochet — índice

Estado (15-oct-2026): **Etapa 0 (auditoría y diseño) entregada, Etapa 1b (seguridad) aplicada en Supabase y el ERP** (ver §8 de la auditoría) **y Etapa 1 («El universo de Rosina» + «Rosina te ayuda a regalar») publicada el 15-oct** (ver `05-ETAPA-1-REGALAR.md`). Decisión de Sara: las fuentes y colores correctos son los que ya se usan. Es la primera entrega del «Prompt maestro»: primero se audita, luego se diseña y recién después se implementa, por etapas.

| Documento | Qué contiene |
|---|---|
| [`01-AUDITORIA.md`](01-AUDITORIA.md) | Arquitectura actual, inventario clasificado de lo que existe, componentes reutilizables, lo que falta, dependencias, riesgos y hallazgos |
| [`02-ARQUITECTURA-Y-ROADMAP.md`](02-ARQUITECTURA-Y-ROADMAP.md) | Arquitectura objetivo, matriz de prioridad y dependencias, archivos a crear o modificar, Etapa 1 detallada |
| [`03-PRESUPUESTO.md`](03-PRESUPUESTO.md) | Estimación de esfuerzo y costos con supuestos explícitos (sin precios inventados) |
| [`04-PRUEBAS-Y-METRICAS.md`](04-PRUEBAS-Y-METRICAS.md) | Criterios de aceptación, matriz de pruebas planeada y plan de métricas (eventos de GA4) |
| [`05-ETAPA-1-REGALAR.md`](05-ETAPA-1-REGALAR.md) | Qué se construyó en la Etapa 1, cómo funciona, cómo se prueba, cómo se apaga y qué falta para publicarla |
| [`06-ETAPA-2-CREAR.md`](06-ETAPA-2-CREAR.md) | Etapa 2: configurador «Rosina te ayuda a crear» (ficha de personalizados), cómo funciona, pruebas y decisiones pendientes |
| [`07-ETAPA-3-QR.md`](07-ETAPA-3-QR.md) | Etapa 3: página pública `/p/` de cuidados e historia por pieza y QR para imprimir; hoja del taller y decisiones pendientes |
| [`08-ETAPA-4-ROSINA-COLOR.md`](08-ETAPA-4-ROSINA-COLOR.md) | Etapa 4: Rosina con tarjetas de producto y «Busca por color» (lista y foto de referencia en el dispositivo); cómo funciona, pruebas, cómo se publica y decisiones pendientes |
| [`09-OCR-Y-POLITICA-DE-DATOS.md`](09-OCR-Y-POLITICA-DE-DATOS.md) | Evaluación de OCR y búsqueda visual con IA, hallazgo sobre el chat y propuesta de política de datos (borrador para la abogada) |
| [`10-ETAPA-5-3D-AR.md`](10-ETAPA-5-3D-AR.md) | Etapa 5: visor 3D y realidad aumentada (construido y probado con un modelo de prueba), opciones para conseguir el modelo de una pieza real, guía de fotos, pedido al artista y decisiones pendientes |
| [`migracion-universo-1.sql`](migracion-universo-1.sql) | SQL de la Etapa 1 (etiquetas, `obtener_regalos_web`, propuestas sin revisar); lo genera `generar_migracion_universo.py` |
| [`etiquetas.py`](etiquetas.py) · `etiquetas-productos.xlsx` | Hoja de Excel para que Sara revise las etiquetas y herramienta que carga la hoja corregida |
| `etiquetas-productos-revisado.xlsx` · [`migracion-universo-2-etiquetas-revisadas.sql`](migracion-universo-2-etiquetas-revisadas.sql) | Revisión de Sara (15-oct-2026) y el SQL que la carga |
| [`migracion-universo-5-rosina.sql`](migracion-universo-5-rosina.sql) | SQL de la Etapa 4: medición del chat (`rosina_web_consumo`) y registro opcional de preguntas sin respuesta (apagado) |
| `../modelos3d/generar_modelo_prueba.py` · `../../modelos3d/modelos.json` | Modelo 3D de prueba (corazón generado por reglas) y la lista de modelos aprobados que lee el visor |
| `colores.py` · `colores_datos.py` · `colores_cli.mjs` | Colores de las fotos de los productos (`img/productos/colores.json`): propuesta con reglas, ajustes revisados y hoja de revisión |
| `historias-piezas-revisado.xlsx` · [`migracion-universo-4-historias-revisadas.sql`](migracion-universo-4-historias-revisadas.sql) | Cuidados confirmados e historias de 77 piezas aprobadas por Sara (16-oct-2026) y el SQL que las carga |

Reglas que rigen todo el trabajo: no duplicar lo que ya existe (Rosina, PWA, CRM, ERP, GA4); no inventar precios, inventario ni plazos; no publicar sin autorización de Sara; toda función nueva se puede apagar sin dañar el resto. Ver también `CLAUDE.md` y `PENDIENTES.md` en la raíz.

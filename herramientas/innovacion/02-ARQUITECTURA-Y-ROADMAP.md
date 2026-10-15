# 02 · Arquitectura objetivo, prioridades y Etapa 1

Principios: se construye **sobre** lo que existe (HTML estático + Supabase + Edge Functions + GTM). No se introduce framework, base de datos ni proveedor nuevo sin demostrar la necesidad. Cada función nueva: pequeña, con interruptor de apagado, sin datos simulados en producción, sin enlaces ficticios.

## 1. Arquitectura objetivo (por capas)

```
Interfaz (HTML estático, módulos JS pequeños por función)
  /universo-rosina.html  → hub de 4 recorridos (regalar · crear · inspirarte · aprender)
  js/universo/*.js       → regalar.js (recomendador), crear.js (configurador, Etapa 2), inspirar.js, aprender.js
  js/rosina-chat.js      → (existente) se amplía para tarjetas de producto, sin segundo chatbot

Lógica y contratos (Supabase: funciones SQL + Edge)
  rosina_recomendar_regalos(...)  → RPC de solo lectura, reglas + etiquetas (sin IA)
  rosina-web (existente)          → + respuesta estructurada {texto, productos[], enlaces[]} y registro de «sin respuesta»
  crear_solicitud_personalizada   → (existente) + campo de ficha estructurada (Etapa 2)

Datos (tablas nuevas, mínimas, con RLS)
  producto_etiquetas(item_id, ocasiones[], destinatarios[], estilos[], vinculo[], por_encargo bool, revisado_por, revisado_en)
  producto_historia(item_id, historia, cuidados_validados, material_notas, publicado bool)   ← QR y páginas públicas (Etapa 3)
  rosina_sin_respuesta(pregunta_resumen, casa, creado)                                        ← sin datos personales

Medición: dataLayer → GTM → GA4 (eventos documentados en 04-PRUEBAS-Y-METRICAS.md)
```

Decisiones técnicas:
- **Tablas nuevas, no columnas en `inventario_items`:** esa tabla es del ERP; tocarla podría romper al ERP/CRM. `producto_etiquetas` y `producto_historia` se unen por `item_id`, solo lectura pública a través de funciones.
- **Reglas antes que IA** para el recomendador: es auditable, barato, no inventa nada y se puede explicar a la clienta.
- **Rosina:** se reutiliza `rosina-web`; el cambio es de formato (devolver productos como datos), no de motor.
- **Configuración centralizada:** `js/universo/config.js` con interruptores (`REGALAR_ACTIVO`, `CREAR_ACTIVO`, `QR_ACTIVO`, `TIENDA_FISICA_ACTIVA`…) para activar/desactivar sin reescribir páginas.
- **3D/AR:** `<model-viewer>` (componente web estándar mantenido) cargado solo al abrir la ficha, con la foto como `poster`; se añade tras una prueba técnica (Etapa 5).
- **Privacidad por diseño:** nada de fotos de clientas a terceros; los buckets públicos con datos de clientas pasan a privados antes de cualquier función que reciba más fotos.

## 2. Matriz de prioridad y dependencias

| Etapa | Entrega | Depende de | Valor | Riesgo | Decisión de Sara necesaria |
|---|---|---|---|---|---|
| **0** | Auditoría y diseño (este documento) | — | Base | Bajo | Confirmar fuentes/colores del logotipo; OK al plan |
| **1** | Hub «Universo de Rosina» + «Rosina te ayuda a regalar» + enlaces a crear/inspirar/aprender | Etiquetas de ~77 productos (Sara/taller las revisa) | Alto | Bajo | Aprobar etiquetas y textos |
| **1b** | Endurecimiento previo: buckets privados, límite al formulario de personalizados, `RW_SAL`, funciones diag | — | Alto (privacidad) | Medio (puede afectar al ERP: probar) | Autorizar cambios en Supabase |
| **2** | Configurador de personalizados (Rosina te ayuda a crear) | Etapa 1, opciones aprobadas por el taller | Alto | Medio | Lista de opciones reales del taller |
| **3** | Páginas públicas de cuidados e historia + generador de QR | `producto_historia` llena y validada | Medio-alto | Bajo | Validar instrucciones de lavado por producto |
| **4** | Rosina con tarjetas de producto; búsqueda visual simple; evaluar OCR | Etapa 1 (etiquetas), 1b (privacidad) | Medio | Medio | Política de datos para IA/OCR |
| **5** | Piloto 3D/AR de **una** pieza | Fotos/medidas o modelo de un artista | Incierto | Alto | Elegir la pieza; presupuesto del modelo |
| **6** | Patrones interactivos, comunidad, tienda física | Demanda validada; apertura de la tienda | Futuro | Alto | Autorización de contenidos y moderación |

Lo que se recomienda **no** hacer ahora: escáner de materiales (sin datos estructurados de Mercería), comunidad abierta (moderación), patrones interactivos (derechos de los PDF), generación de imágenes con IA (propiedad intelectual sin resolver).

## 3. Archivos a crear o modificar

**Etapa 1 (propuesta):**
- Crear: `universo-rosina.html` (hub, `noindex` hasta el lanzamiento), `js/universo/config.js`, `js/universo/regalar.js`, `css/universo.css`, `herramientas/innovacion/etiquetas.csv` (plantilla para que Sara etiquete), `herramientas/innovacion/migracion-universo-1.sql` (tablas y RPC), `herramientas/pruebas/probar_regalar.py`.
- Modificar (mínimo): `herramientas/sincronizar_encabezado.py` (un enlace al hub en el menú de la tienda, solo al lanzar), `sitemap.xml` y `llms.txt` (solo al lanzar), `herramientas/rosina-web/index.ts` (en Etapa 4).
- **No tocar:** menús de Mercería y Academy, `sw.js`, `pago.js`, manifiestos.

## 4. Etapa 1 detallada («Rosina te ayuda a regalar»)

Flujo (5 preguntas, todas opcionales salvo la primera): ¿para quién? → ¿ocasión? → ¿presupuesto? (rangos del catálogo real) → ¿tamaño? (pequeño/mediano/grande, derivado de la medida en el nombre del producto) → ¿te gustaría personalizado?

Resultado, con tres secciones claramente rotuladas:
1. **Disponibles ya** (existencias reales en el catálogo).
2. **Por encargo** (productos del catálogo sin existencias o marcados `por_encargo`, con el tiempo de elaboración que ya tiene la ficha).
3. **Ideas para personalizar** (enlace a `personaliza.html` con tipo y tamaño preelegidos, sin precio inventado: se muestra el precio base solo de los tres productos «Amigurumi personalizado N cm» reales).

Estados: cargando, sin resultados (sugiere relajar un filtro y ofrece WhatsApp), error de red (mensaje y WhatsApp). Teclado y lector de pantalla: botones nativos, `aria-live` para el contador de resultados, sin trampa de foco.

Datos reales: `obtener_tienda_web()` más `producto_etiquetas`. **Sin etiqueta, el producto igual aparece en filtros de precio/tamaño/categoría**; solo se excluye de «ocasión» y «para quién». No se inventa nada: si falta la etiqueta, se muestra «sin clasificar» en la herramienta de revisión interna.

Interruptor: `REGALAR_ACTIVO` en `config.js`. Reversible: borrar el enlace del hub o apagar el interruptor deja el sitio como estaba.

Criterios de aceptación: ver `04-PRUEBAS-Y-METRICAS.md`.

## 5. Supuestos y decisiones conservadoras tomadas sin preguntar

- El hub nace **sin enlazar** en el menú y con `noindex` (revisión de Sara primero), como se hizo con la aventura infantil.
- Las etiquetas las propone Claude a partir de nombre/descripción de cada producto, **pero las valida Sara o el taller** antes de usarse (`revisado_por` obligatorio para que una etiqueta cuente).
- Ninguna función nueva envía fotos ni texto de clientas a terceros en las Etapas 1–3.

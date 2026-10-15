# 09 · Evaluación de OCR y búsqueda visual con IA, y propuesta de política de datos (Etapa 4C, 16-oct-2026)

**Para decidir:** Sara. **Para revisar:** la abogada (el texto de la sección 6 es un borrador, no asesoría legal). **No se activó nada de esto.** La Etapa 4 entrega solo lo que no saca fotos del dispositivo (ver `08-ETAPA-4-ROSINA-COLOR.md`).

## 1. Qué se quiere resolver
| Caso | Ejemplo | ¿Lo cubre la Etapa 4? |
|---|---|---|
| A. «Tengo una foto de esto, ¿tienen algo parecido?» | Una clienta sube la foto de un peluche o de un personaje | **Solo en colores**, y en su propio dispositivo («Buscar por los colores de una foto») |
| B. Leer la etiqueta de una lana o un hilo para encontrar el equivalente | Foto de la etiqueta → marca, color, peso | No. Pendiente de datos: la Mercería no tiene todavía una relación entre materiales y productos (ver `01-AUDITORIA.md`, «escáner de materiales: posponer») |
| C. Entender una foto de referencia para un personalizado | La persona sube su foto y el sistema describe qué se ve | No. Hoy lo mira el taller en Oportunidades |

## 2. Opciones técnicas
| Opción | Cómo funciona | Privacidad | Calidad esperada | Esfuerzo | Costo |
|---|---|---|---|---|---|
| **1. Reglas en el dispositivo (hecho)** | Colores por reglas de matiz y brillo en el navegador | La foto no sale del dispositivo | Buena para «un rosa, un azul»; no entiende formas ni personajes | Hecho | Sin costo recurrente |
| **2. Modelo local en el navegador** | Un modelo pequeño (OCR tipo Tesseract compilado a WebAssembly, o un modelo de imágenes en formato ONNX) se descarga y corre en el dispositivo | La foto no sale del dispositivo; el modelo se descarga al abrir (se puede alojar en el propio sitio) | **Por probar**: el OCR suele fallar con texto curvo, brillante o en fondos de color, como el de una etiqueta de lana; la búsqueda por parecido necesita un modelo de decenas a cientos de MB (verificar), pesado en celulares | Medio: 1 a 2 semanas de prueba (ver 3B del presupuesto) | Sin costo por uso; el costo es de tiempo |
| **3. Servicio de visión por API** | La foto se envía a un proveedor (p. ej. el mismo que ya usa Rosina para texto) y devuelve una descripción o texto | **La foto sale al proveedor, en otro país**; hay que informar, pedir autorización y revisar sus condiciones | Mejor que las otras para etiquetas y para describir personajes | Bajo a medio | Por uso (por imagen o por token): **tarifa por verificar en la página oficial del proveedor**; no se estima aquí |
| **4. Servidor propio de embeddings** | Montar y mantener un modelo en un servidor | Las fotos quedan en infraestructura propia | Buena | Alto y recurrente (mantenimiento) | No recomendado para el tamaño del negocio |

## 3. Recomendación
1. **No activar la opción 3 por ahora.** La ganancia (calidad) no compensa los compromisos nuevos (autorización expresa, transferencia al exterior, riesgo con fotos de personas y menores) mientras no exista demanda comprobada.
2. **Dejar la opción 1** (color en el dispositivo) y medir si se usa: `regalar_paso` con `paso=color` y `regalar_foto_color` en GA4. Si la gente la usa, es una señal para invertir en algo más.
3. **Si Sara quiere ir más allá, piloto de la opción 2** con fotos propias (productos de la tienda, no fotos de clientas) y con criterio de éxito escrito antes de empezar. Propuesta: 20 fotos de etiquetas reales de la Mercería para el OCR; el piloto se da por bueno si lee bien la marca y el color en al menos 16 de las 20 (80 %) y tarda menos de 5 segundos en un celular de gama media. **Son umbrales propuestos para discutir, no mediciones.**
4. El caso B (etiquetas de lana) **depende primero de datos**, no de tecnología: sin la relación entre materiales y productos, leer la etiqueta no ayuda a recomendar nada.

## 4. Hallazgo que no depende de la Etapa 4: el chat de Rosina ya trata datos con un tercero
Hoy, cada pregunta que una persona escribe en el chat de Rosina viaja a la función `rosina-web` y de ahí a Anthropic (modelo Claude Haiku) para generar la respuesta. La función **no guarda la conversación** (solo un código de la IP con sal para limitar abusos, 24 horas; el secreto `RW_SAL` de esa sal sigue pendiente de definir por Sara en Supabase) y el texto de la persona **no** se usa para nada más. Pero:
- `politicas.html` no describe este tratamiento (no menciona al asistente ni al proveedor) y `herramientas/auditoria-privacidad.md` no lo lista entre los proveedores.
- Hay que decir en la política: qué se envía (lo que la persona escribe), a quién (Anthropic, con sede en Estados Unidos), para qué (responder), cuánto se conserva (la web no guarda la conversación; el proveedor puede conservar los datos según sus condiciones vigentes: **verificarlas** y anotar la fecha), y avisar en el chat que no se escriban datos personales ni de pago.
- **Se propone un aviso corto en el chat** («Rosina es una asistente con inteligencia artificial. No escribas datos personales ni de pago. Tus mensajes se envían a nuestro proveedor para responderte.») y un enlace a la política. No se agregó en esta etapa para no cambiar el chat sin que Sara y la abogada lo revisen.

## 5. Requisitos mínimos antes de activar cualquier tratamiento con terceros
Para que la abogada confirme (referencias generales de la normativa colombiana de datos personales, Ley 1581 de 2012 y sus decretos reglamentarios):
1. **Finalidad clara y limitada** (para qué se usa la foto o el texto) y que no se use para entrenar modelos propios ni de terceros.
2. **Autorización previa, expresa e informada**, separada de la de otros trámites y **opcional** (que la función principal no dependa de ella), como las dos casillas de Personaliza.
3. **Proveedor y ubicación**: nombre, país, si el tratamiento es una transmisión o una transferencia internacional y qué requisitos aplican; contrato o condiciones del proveedor guardadas con su fecha (fuera del repositorio público).
4. **No conservación**: la foto no se guarda en la web ni en una carpeta pública. (El bucket `solicitudes-personalizadas` ya pasó a privado en la Etapa 1b; cualquier función nueva debe usar un bucket **privado**.)
5. **Menores**: no recibir fotos de menores; la aventura infantil sigue sin cuentas ni mediciones.
6. **Derechos de la persona**: cómo consultar, corregir o pedir que se borre; a quién escribir.
7. **Registro de bases de datos**: la abogada confirma si corresponde inscribirlas ante la autoridad de protección de datos.
8. **Medición sin datos personales**: los eventos de GA4 solo llevan categorías y cantidades (ya es así).

## 6. Borrador de texto para `politicas.html` (para la abogada)
> **Asistente Rosina (chat).** Cuando usas el chat de Rosina, el texto que escribes se envía de forma segura a nuestro proveedor de inteligencia artificial (Anthropic, con sede en Estados Unidos) únicamente para generar la respuesta. No guardamos la conversación en nuestra página; para evitar abusos guardamos durante 24 horas un código anónimo derivado de tu conexión. Sumamos, por día, cuántas consultas se hacen y cuánto cuestan, sin ningún dato tuyo. No escribas datos personales, de pago ni de otras personas. Si Rosina no puede ayudarte, te lleva al WhatsApp del equipo. *[Si se enciende el registro de preguntas sin respuesta, agregar: «Cuando Rosina no encuentra la respuesta podemos guardar un resumen corto de la pregunta, sin correos, teléfonos ni enlaces, durante 90 días, para mejorar la página.»]*
>
> **Búsqueda por colores de una foto.** Si eliges una foto de referencia en «Rosina te ayuda a regalar», la foto se procesa en tu propio dispositivo para identificar sus colores. No se envía a nuestros servidores ni a terceros y no se guarda.
>
> *(Solo si algún día se activa la lectura de fotos con un proveedor)* **Lectura de fotos con inteligencia artificial.** Es opcional y requiere tu autorización expresa en una casilla aparte. La foto se envía a [proveedor, país] solo para [finalidad], no se guarda en nuestra página y no se usa para entrenar modelos. Puedes pedir en cualquier momento que se borre escribiendo a [correo].

## 7. Decisiones para Sara
1. ¿Se agrega ya el aviso corto en el chat y el párrafo del asistente en `politicas.html` (con la abogada)?
2. ¿Se enciende el registro de preguntas sin respuesta? (Sirve para saber qué contenido falta. Se enciende con un secreto en Supabase; antes hay que actualizar la política.)
3. ¿El chat debe aparecer también en `universo-rosina.html` y en el Rincón de Rosina? (Hoy no aparece: ver `08`.)
4. ¿Se hace el piloto local de OCR (opción 2) o se espera a ver si se usa la búsqueda por color?
5. ¿Hay que inscribir las bases de datos? (Pregunta para la abogada.)

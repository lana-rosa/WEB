# Hoja de ruta, métricas y esfuerzo — Rosina y la gran aventura de la primera cadeneta

## Capítulos 4 a 8 (NO implementados; solo planificados)
La arquitectura ya los admite: cada capítulo es un objeto más en `MISIONES` (`contenido/misiones.js`) y una zona del mapa. Orden sugerido:

| Cap. | Título | Personaje | Habilidad de crochet | Juego | Qué hace falta nuevo |
|---|---|---|---|---|---|
| 4 | La casa de los colores | Pipo | Filas, vuelta al final (cadeneta de giro), cambio de color opcional; banda o cuadrado | Laboratorio de colores (más rondas) | Diagramas de giro y de cambio de color; foto de la banda terminada; zona del mapa. |
| 5 | El jardín de Pipo | Pipo | Combinar lo aprendido; adorno plano sencillo (flor o corazón plano) | Cuenta y construye | Patrón de adorno validado, sin piezas pequeñas desprendibles. |
| 6 | El regalo de Bruno | Bruno | Remate y acabado (cortar y esconder hilos con aguja lanera, con adulto); decoración segura; elegir destinatario | Detective de puntadas (revisar la pieza) | Paso a paso de remate; recomendaciones de seguridad (no usar ojos de seguridad ni botones). |
| 7 | El desafío de Rosina | Rosina y todos | Elegir un proyecto, resolver problemas frecuentes, repetir sin penalización | Retos de problemas ("¿qué pasó con esta fila?") | Tipo de ronda nuevo "diagnóstico" (imagen con error → causa). |
| 8 | La fiesta del Bosque Tejido | Todos | Repaso, reconocimiento de logros, presentación de la creación, diploma | Repaso | Diploma de "pequeño tejedor o tejedora" (el actual cubre solo las misiones 1 a 3), pantalla de fiesta. |

Pasos para cada uno: redactar contenido con la experta → dibujos o fotos → cargar en `misiones.js` → agregar a `probar.py` → pruebas con niños → publicar. Un capítulo se puede lanzar solo, sin esperar a los demás.

## Mejoras recomendadas tras las primeras pruebas con niños y familias
1. Observar (sin grabar ni recoger datos de los niños) dónde se quedan sin entender una instrucción o un botón; ajustar textos y dibujos.
2. Reemplazar los dibujos de manos, nudo y cadeneta por fotos o videos de manos reales, que son lo que más ayuda a aprender.
3. Medir cuánto dura cada misión y partirla en sesiones más cortas si pasa de 15 a 20 minutos.
4. Preguntar a los adultos qué falta en la guía, y si el material recomendado se consigue fácil.
5. Ajustar el tamaño de gancho y lana a lo que las familias realmente tienen.
6. Añadir audio narrado (voz humana) si muchos niños todavía no leen con fluidez.
7. Valorar un kit de materiales para principiantes en la Mercería, solo con productos y precios reales.

## Medición respetuosa con la privacidad
Hoy la aventura **no mide nada** y no envía datos. Emite eventos locales (`window` → `aventura:evento`) con estos nombres, sin identificadores: `aventura_iniciada`, `juego_iniciado`, `juego_terminado`, `practica_hecha`, `practica_despues`, `ayuda_abierta`, `tutorial_repetido`, `mision_completada`, `logro`. Si más adelante se quiere medir, conectar esos eventos a un contador **agregado** (solo totales por misión), con consentimiento, sin cuentas, sin IP ni datos de niños, y revisando antes la política de datos.

| Indicador | Cómo se obtiene |
|---|---|
| 1. Inicio de la primera misión | Evento `juego_iniciado` o `aventura_iniciada` (agregado). |
| 2. Finalización de cada misión | `mision_completada` por misión. |
| 3. Uso de la ayuda | `ayuda_abierta`. |
| 4. Repetición de tutoriales | `tutorial_repetido`. |
| 5. Primera muestra tejida | Botón "Lo hice con mi lana" (`practica_hecha`), que es una declaración del acompañante, no una verificación. |
| 6. Comprensión de instrucciones | Observación con familias y pregunta al adulto; no se mide en la página. |
| 7. Satisfacción de niños y acompañantes | Encuesta breve y voluntaria, fuera de la página. |
| 8. Errores técnicos | Pruebas automáticas (`probar.py`) y reportes de familias. |
| 9. Tiempo de carga | Medición con red móvil real antes de publicar. |
| 10. Problemas de accesibilidad | axe-core, lector de pantalla y observación manual. |

Metas iniciales (**hipótesis por validar, no resultados**): que la mayoría de las familias que empiezan la misión 1 lleguen a la misión 2; que el uso de la ayuda no sea el camino principal; que las 3 misiones se puedan hacer en sesiones de 15 minutos o menos.

## Estimación de esfuerzo (horas internas, con supuestos; sin convertir a dinero)
Supuestos: equipo pequeño, una persona que programa con apoyo de IA, una experta en crochet y una ilustradora. Son estimaciones de planeación, no mediciones.

| Componente | MVP (3 misiones) | Cada capítulo nuevo | Supuestos |
|---|---|---|---|
| Programación | construida con IA en esta entrega | 2 a 4 h | Mucho es datos en `misiones.js`; solo es más si hay un tipo de juego nuevo. |
| Escritura y revisión pedagógica | borrador hecho; **revisión de la experta: 6 a 10 h** | 3 a 5 h | Incluye revisar todos los pasos y la lectura con niños. |
| Ilustración (personajes y escenas finales) | **pendiente**: 15 a 30 h para 4 personajes y mapa | 4 a 8 h | Depende del estilo y de cuántas poses. |
| Fotos y video de técnicas | **pendiente**: 8 a 15 h (grabación, edición, subtítulos) | 3 a 6 h | Un video corto por técnica, con subtítulos y transcripción. |
| Pruebas con familias | pendiente: 4 a 8 h | 2 h | 5 a 8 familias por ronda, sin recoger datos personales. |
| Seguridad, privacidad y accesibilidad | revisión legal y pruebas con lector de pantalla: 4 a 8 h | 1 h | Con abogada para la política de datos. |
| Alojamiento y multimedia | sin costo adicional (GitHub Pages); videos pesados pueden pedir otro alojamiento | — | Mantener cada video en pocos MB. |
| Mantenimiento | 1 a 2 h al mes | — | Revisar enlaces, pruebas y textos. |

Para pasar a dinero se necesita la tarifa por hora real del equipo y los precios de la ilustradora y del video; no se inventan cifras.

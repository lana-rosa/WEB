# Pruebas — Rosina y la gran aventura de la primera cadeneta (12-oct-2026)

## Resultados reales
Entorno: Chromium headless (Playwright) contra un servidor estático local, con `python3 herramientas/aventuras-de-rosina/probar.py --axe`.

| Prueba | Resultado |
|---|---|
| `probar.py --axe` (recorrido completo de las 3 misiones, ayuda, errores, progreso, reinicio, diploma, teclado, movimiento reducido, ancho, consola y red) | **80 comprobaciones correctas, 0 fallidas** (incluye la página de privacidad y el vocabulario unificado) |
| axe-core (WCAG 2.0/2.1/2.2 A y AA + buenas prácticas) en 10 pantallas: inicio, mapa, historias con retratos (misiones 1 y 2), tutorial, práctica, juego, pasaporte (formulario y página) y adultos | **0 violaciones** (se encontraron y corrigieron 3 de contraste en el primer pase: enlace activo del menú, "Muy pronto" y misiones futuras del pasaporte) |
| Desplazamiento horizontal en 390 y 1280 px (bienvenida, mapa, tutorial, pasaporte, diploma y adultos) | Ninguno |
| Errores o avisos de consola; respuestas 4xx/5xx; peticiones a otros dominios (hechas por la página) | Ninguno |
| `herramientas/revisar_enlaces.py` | 35 páginas, 1638 enlaces internos, **0 enlaces rotos, 0 recursos rotos, 0 rutas relativas**; el único aviso es el canonical conocido de `merceria.html` |
| Rutas de imágenes usadas por la aventura | Las 17 existen (ver `INVENTARIO-RECURSOS.md`) |
| Impresión del diploma (`page.pdf` con estilos de impresión, horizontal) | 1 página; el botón llama a `window.print()` |
| Peso | 168 KB de código y contenido de la aventura en disco; imágenes de Rosina de 29 a 39 KB cada una, cargadas bajo demanda en la pantalla que las usa |

Lo que `probar.py` verifica (resumen): bienvenida con imagen oficial; comenzar → acompañantes → preparación → mapa con 3 misiones y avisos de estado; ayuda con sus 4 opciones; pista y mensaje para adulto; "Ver de nuevo" y "Paso anterior"; error amable, pista tras el primer error, "Ver la respuesta" tras el segundo y posibilidad de seguir; tres misiones completas con juego, pasaporte y reflexión; logros; colores guardados; progreso tras recargar; sin datos de contacto en el almacenamiento; diploma con nombre e impresión; reinicio con confirmación (No conserva, Sí borra); diploma bloqueado sin las misiones; movimiento reducido; teclado (Tab al enlace "Saltar", Enter y Escape en el panel de ayuda).

## No probado (no afirmar que está probado)
- **Navegadores y dispositivos reales:** solo Chromium headless con ventana de 390 y 1280 px. Falta Safari/iOS, Firefox y Android, con pantallas táctiles reales y el dispositivo apoyado en una mesa.
- **Lectores de pantalla** (VoiceOver, TalkBack, NVDA): no se probó. axe solo detecta una parte de los problemas.
- **Lectura en voz alta:** se escribió y el botón solo aparece con una voz local en español; no se probó el audio.
- **Red móvil lenta y rendimiento real:** no se midió tiempo de carga en una conexión móvil. La carga local fue de ~70–90 ms hasta DOMContentLoaded, que no representa una red real.
- **Niños y familias:** no hubo pruebas con usuarios. No se sabe si 6 a 8 años entienden los textos, ni cuánto tarda cada misión.
- **Contenido de crochet:** el contenido lo redactó la IA según técnica estándar y **no lo ha validado todavía una experta**.
- **Impresión:** se generó el PDF de un diploma y tiene 1 página, pero no se revisó visualmente el PDF en papel.
- Chromium hace conexiones propias en segundo plano (por ejemplo a Google) que no vienen de la página; la prueba de "ninguna petición a otros dominios" mira solo lo que pide la página.

## Revisión técnica de los pasos de crochet (pendiente de la experta)
Terminología: punto bajo = "single crochet" (inglés de EE. UU.; en el inglés del Reino Unido se llama "double crochet"). "Hilo sobre" = "yarn over".
**Vocabulario unificado (guía revisada de Sara, 15-oct-2026):** cadeneta, punto bajo, hilo sobre (lazada), **bucle** (el hilo puesto en el gancho), **base del punto**, **V**. Se evitan «garganta» (la parte del gancho se llama «curva del gancho»), «pie del punto», «mano fuerte» (se dice «la mano que más usas») y «cadena». «Lazo» solo queda para el lazo que se cruza con el hilo antes del nudo inicial. `probar.py` lo comprueba.

| Paso del contenido | Cómo está escrito | Observación para la experta |
|---|---|---|
| Nudo inicial | Lazo cruzado con la cola por debajo del cruce; gancho por el centro del lazo, tomar la hebra del ovillo, pasarla por el lazo y ajustar tirando de la cola. | Es el nudo corredizo estándar. Confirmar si prefieren enseñar el nudo con dos vueltas sobre los dedos para niños. |
| Sostener | **Agarre de cuchillo** con la mano que más usas (el dibujo ya lo muestra así); la otra mano sujeta la base del nudo entre pulgar y dedo medio. Nota para adultos: el hilo pasa por delante del meñique, por detrás de anular y corazón y por delante del índice, con una o dos vueltas suaves alrededor del índice. | **Validar con la experta** el agarre de cuchillo y la tensión del hilo (la guía revisada de Sara los trae tal cual). Zurdos: los mismos pasos con la otra mano, en espejo. |
| Cadeneta | Hilo por encima del gancho de atrás hacia adelante; tomar la hebra del ovillo con la curva del gancho y jalarla por el bucle. | Correcto. Falta validar la ilustración de "hilo sobre". |
| Conteo | Cuenta las V; el bucle del gancho NO cuenta. | Correcto. |
| Punto bajo, fila 1 | Cadeneta de 11; saltar la cadeneta pegada al gancho; entrar en la 2.ª cadeneta por debajo de la V; hilo sobre, jalar un bucle (2 bucles); hilo sobre, jalar por los 2 bucles → 10 puntos. | Correcto para una fila sobre cadeneta. **No se enseña** el giro para la 2.ª fila (cadeneta de giro): queda para el capítulo 4. Confirmar "bajo las dos hebras de la V" frente a "por el bucle trasero". |
| Materiales | Lana gruesa/media, lisa y clara; gancho de 5 a 6 mm; tijeras de punta redonda para el adulto; aguja lanera de punta roma. | Confirmar medidas con las lanas que vende la Mercería. |

## Qué queda por probar antes de publicar
Ver la lista de "Publicar de forma segura" en `LEEME.md`.

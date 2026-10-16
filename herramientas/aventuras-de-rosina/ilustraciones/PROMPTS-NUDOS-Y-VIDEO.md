# Nudo inicial y cadeneta: ilustraciones y video corto (para pedir a ChatGPT / Sora / Gemini)

Los dibujos actuales del nudo (`nudo1`, `nudo2`, `nudoSolo`, cadeneta) son SVG provisionales y no se entienden bien. Lo mejor es una **hoja de pasos con manos reales de dibujo** y un **video de 10–15 s por paso**. Hay que revisar el resultado con una persona experta: la IA suele inventar nudos imposibles.

## 1. Hoja de pasos (imagen, un solo pedido)
Pega primero una foto real de tu propio nudo inicial hecho paso a paso (3 fotos) como referencia y escribe:

> Ilustración plana infantil (mismo estilo que la ovejita Rosina: líneas suaves, colores pastel, sin borde blanco), fondo blanco. Una hoja con 4 cuadros numerados que muestran, en primer plano y con manos de dibujo, cómo hacer el **nudo corredizo inicial de crochet** con lana rosada y un gancho de metal real (la punta es un gancho, no una esfera):
> 1) Cruzar la hebra sobre sí misma formando una «o» y dejar la cola debajo del cruce.
> 2) Meter el gancho por el centro del lazo.
> 3) Tomar con el gancho la hebra que viene del ovillo y pasarla por el lazo.
> 4) Tirar suavemente de la cola para ajustar: queda un bucle flojo en el gancho.
> Flechas rosadas gruesas que indiquen el movimiento. Sin texto dentro de la imagen, solo los números 1 a 4. Cada cuadro del mismo tamaño.

Después, otra hoja igual para la **cadeneta** (hilo sobre el gancho → pasarlo por el bucle → repetir → contar las V sin contar el bucle del gancho).

Guardar la hoja en esta carpeta y recortar los cuadros con un script como `recortar_implementos.py` (salida en `img/aventuras/pasos/`).

## 2. Video corto (10–15 s por paso, sin voz; la voz de Rosina va aparte)
> Video vertical de 12 s, toma fija cenital, dos manos de una persona (sin cara) sobre una mesa clara hacen despacio el nudo corredizo inicial de crochet con lana rosada gruesa y un gancho de metal de 6 mm. Luz suave, movimientos lentos y claros, un solo paso por toma, sin música ni texto.

Mejor aún: **grabarlo con el celular** (trípode, lana gruesa de color claro, fondo liso): es lo más fiel y no tiene problemas de derechos. El reproductor ya lo admite: en `contenido/misiones.js`, en el paso, `video: { src: '/aventuras-de-rosina/video/nudo.mp4', poster: '/img/aventuras/pasos/nudo.webp', subtitulos: '/aventuras-de-rosina/video/nudo.vtt' }` (peso ideal < 2 MB, `preload="none"`).

## 3. Antes de publicar
Verificar los términos de uso comercial de la herramienta, que el nudo sea correcto (lo valida la experta) y subtitular el video.

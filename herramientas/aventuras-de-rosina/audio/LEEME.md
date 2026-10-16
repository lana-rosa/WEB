# Voz de Rosina — guion y audios

El libro lee en voz alta (botón «🔊 Escuchar»). Para cada texto, el reproductor (`aventuras-de-rosina/js/voz.js`) hace esto:
1. Si existe el audio `aventuras-de-rosina/audio/<clave>.mp3` y está en `audio/indice.json`, **reproduce ese audio** (la voz de Rosina).
2. Si no, usa la **voz del dispositivo** (solo voces locales) como respaldo.
Los audios son archivos del propio sitio: no se envía ningún texto a servicios externos mientras el niño usa el libro.

## Guion
`guion-audio.csv` (para abrir en Excel o Google Sheets) y `guion-audio.json` tienen **todos los textos** que el libro lee: la columna `clave` es el nombre del archivo
(`<clave>.mp3`), `lugar` dice dónde se lee y `texto` es lo que hay que decir. Se regenera con `node herramientas/aventuras-de-rosina/audio/guion_audio.mjs`;
**si cambia un texto del libro, cambia su clave** y hay que volver a grabar solo ese audio (`actualizar_indice.py` avisa qué falta y qué sobra).

## Dos caminos para tener la voz
- **Grabada por una persona** (tú o una locutora con autorización escrita): grabar cada fila del CSV, exportar a MP3 (mono, 128 kbps o menos) con el nombre `<clave>.mp3`, copiarlos a `aventuras-de-rosina/audio/` y correr `actualizar_indice.py`.
- **Generada con un servicio de voz**: elegir una voz con licencia comercial (o una voz propia/autorizada) y correr `generar_audio.py` (hoy soporta ElevenLabs; con `--simular` cuenta caracteres sin gastar). Luego `actualizar_indice.py`.

## Lo que NO se hace
No se copia ni se clona la voz de un audio de Instagram/TikTok u otra red sin permiso escrito de su dueña (derechos de autor y de imagen/voz; es un producto para niños).
Si la voz es de una persona, guardar su autorización escrita (uso comercial, plazo, territorio) junto a este documento.

## Peso
El guion tiene unos 7.400 caracteres (≈ 8 minutos de voz). En MP3 mono son pocos MB en total; los audios se descargan solo al tocar «Escuchar».

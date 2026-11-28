# Esquema de campos para la programación de contenido (para el chat «Marketing en LAROVA»)

Origen: tabla provisional `herramientas/marketing-agenda/CALENDARIO-DOS-MARCAS-19NOV-14DIC.md`. Aquí solo se define **qué campos tiene cada pieza**; el formato de acceso lo decide el chat que construye la interfaz.

| Campo | Valores / nota |
|---|---|
| marca | Crochet · Academy (siempre separadas) |
| plataforma | IG · FB · TikTok · Pinterest · YouTube (una pieza puede ir a varias) |
| fecha | día de publicación (zona America/Bogota) |
| tipo_publicacion | reel · carrusel · stories · video_youtube · foto |
| angulo | idea de la pieza en una frase |
| objetivo | alcance · confianza · conversión · formación · lista de espera · comunidad |
| guion | texto completo (gancho, desarrollo, CTA) |
| copy | texto de la publicación |
| estado | idea → aprobado → grabado → editado → publicado |
| bloque_grabacion | fecha del sábado de grabación en bloque |
| notas | datos pendientes (fotos, permisos) |
Reglas: nada de Navidad, santos, San Valentín ni Halloween; las dos marcas no se mezclan.
Ajustes del 18-nov (ver `herramientas/borradores/larova/marketing/LEEME.md`): plataforma incluye Pinterest; tipo incluye «foto»; campos extra: código del calendario, línea de contenido y enlace de la publicación.


## Estado en LAROVA (28-nov-2026, chat «Marketing en LAROVA», cerrado)
- **Hecho:** tabla `mkt_piezas` (solo administradoras; valores: marca `crochet`/`academy`, tipo `reel`/`carrusel`/`stories`/`video_youtube`/`foto`); pantalla con lista, calendario, colores por marca (Crochet `#E74E96`, Academy `#1F6FDB`), filtros por marca, plataforma, tipo (Stories) y estado; estadísticas: `mkt_metricas`, `mkt_frecuencia_metricas` (días del chat 8) y vista de solo lectura `mkt_resultados` (`select * from public.mkt_resultados`), aplicadas el 19-nov con el sí de Jennifer. Detalle, SQL y pruebas: `herramientas/borradores/larova/marketing/` (LEEME.md, 01 a 04, marketing.html).
- **Pendiente y quién:** permiso `mkt-marketing` por persona → ya publicado por ERP Menú; probar subir un CSV/Excel real de estadísticas → Jennifer con el chat nuevo de Marketing en LAROVA; vistas de resultados para los chats por rol (resumen semanal de los lunes) → chat nuevo de Marketing en LAROVA con el chat 8; confirmar que el `marketing.html` del ERP es igual al del borrador → chat del ERP.

### Texto para abrir un chat NUEVO «Marketing en LAROVA»
> Chat «Marketing en LAROVA» (ERP). Lee CLAUDE.md, herramientas/memoria/estado-actual.md y, en herramientas/memoria/marketing-programacion-esquema.md, la sección «Estado en LAROVA»; luego herramientas/borradores/larova/marketing/LEEME.md.
> La base (Supabase «Lana Rosa ERP + SO») ya tiene mkt_piezas, mkt_metricas, mkt_frecuencia_metricas y la vista mkt_resultados, solo para administradoras.
> Reglas: tablas nuevas y aisladas; sin funciones nuevas abiertas; prueba con rollback, sin DROP (se cuelga) y con statement_timeout; asesor de seguridad después; 🔴 sí de Jennifer antes de tocar la base; no tocar la base el 12 ni el 13-dic ni los sábados de 9 a. m. a 7 p. m.
> La pantalla es marketing.html en la raíz del repo ERP (el borrador está en WEB); probarla con Playwright y una base simulada, a 390 y 1280 px; fotos y «¿Lo pongo? Sí o no» (🟡).
> Los días y las métricas los define el chat 8 en herramientas/memoria/marketing-estadisticas.md.
> Tarea: [escribe aquí lo que necesitas]

# Orquestador general (un solo orquestador para todo; decisión de Jennifer, 16-nov-2026)

> Reemplaza a los orquestadores separados de WEB, ERP, CRM y SO. Motivo: los tokens se gastaban muy rápido por los chats largos y por los mensajes entre orquestadores. Este archivo vive en `lana-rosa/WEB` y es el ÚNICO que el orquestador lee completo al empezar.

## Texto para abrir un orquestador nuevo (chat nuevo en `lana-rosa/WEB`, modelo Opus, nombre «Chat 0. Orquestador general»)
```
Eres el Orquestador general de Lana Rosa Crochet: coordinas la web, el ERP, el CRM y el SO. Lee SOLO herramientas/memoria/orquestador-general.md y los resúmenes que ahí se indican (agrega lana-rosa/ERP, lana-rosa/CRM y lana-rosa/SO con add_repo, solo lectura, para leer su docs/RESUMEN-ORQUESTADOR.md). No leas historias largas ni conversaciones viejas. Trabaja como dice ese archivo: gasta poco, no hagas de mensajero, una pregunta de sí o no a la vez, palabras sencillas, y renuévate cada lunes o cuando la conversación se alargue. Empieza diciéndome en máximo 10 líneas en qué vamos y cuál es la tarea más importante para la apertura del 13-dic.
```

## Cómo trabaja (para gastar poco)
1. **Al empezar:** lee este archivo y los 4 resúmenes cortos (abajo). Nada más. Anota tu identificador de sesión (`get_session`) en la línea «Sesión actual» de abajo y publícalo como nota, para que los ejecutores sepan a quién escribirle. Abre un archivo de tema solo si la tarea lo pide.
2. **Hace solo lo que nadie más puede hacer:**
   - coordinar algo que toca dos áreas, por ejemplo web y ERP;
   - repartir tareas nuevas;
   - revisar choques;
   - hacer el resumen semanal;
   - proponer chats nuevos.
   No ejecuta tareas largas ni repite lo que un ejecutor ya le dijo a Jennifer.
3. **No hace de mensajero:** Jennifer contesta directamente en cada chat ejecutor las preguntas de sí o no y las fotos. El orquestador no reenvía aprobaciones de rutina.
4. **Mensajes a otros chats:** solo para entregar una tarea completa o avisar de un choque, en un solo mensaje con todo lo necesario. Nada de «recibido» ni «¿cómo vas?». Para saber cómo va un chat, lee su renglón en el estado del área o el resumen de la sesión, no le escribas.
5. **Se renueva** cada lunes o cuando la conversación se ponga larga (muchas imágenes o más de ~40 mensajes):
   - actualiza los resúmenes y la sección «En qué vamos» de este archivo (máx. 15 líneas);
   - publica las notas;
   - le da a Jennifer el texto para abrir el siguiente orquestador;
   - Jennifer archiva el viejo.
6. Con Jennifer: palabras sencillas, una pregunta de sí o no a la vez, niveles 🟢🟡🔴 de `CLAUDE.md`. Cada respuesta termina con «Siguiente tarea sugerida» y «Esfuerzo».

## Resúmenes por área (cada uno máx. ~30 líneas; los actualiza el chat que más sabe del área)
| Área | Repositorio | Resumen |
|---|---|---|
| Web (tienda, Mercería, Academy, Agenda, Rosina) | `lana-rosa/WEB` | sección «Resumen WEB» de este archivo + `herramientas/memoria/estado-actual.md` |
| ERP (ventas, caja, producción, contabilidad, personal) | `lana-rosa/ERP` | `docs/RESUMEN-ORQUESTADOR.md` |
| CRM (clientes, embudo, fidelización) | `lana-rosa/CRM` | `docs/RESUMEN-ORQUESTADOR.md` |
| SO (sistema operativo del taller) | `lana-rosa/SO` | `docs/RESUMEN-ORQUESTADOR.md` |
Los repositorios que no están en la sesión se agregan con `add_repo` (solo lectura) cuando haga falta.

## Reglas para los chats ejecutores (todas las áreas)
- **Le preguntan a Jennifer en su propio chat**: corto, de sí o no, con foto si es algo que se ve. Mientras ella responde, siguen con otra cosa.
- **Le escriben al orquestador SOLO si:**
  - la tarea toca otra área o la base compartida y hay que coordinar;
  - encuentran un choque con lo que hace otro chat;
  - terminaron un encargo que el orquestador les dio (una línea).
- Nada de avisos de «recibido», «voy en esto» ni copias de lo que ya le dijeron a Jennifer.
- Anotan lo suyo en su archivo de tema y en su renglón de estado. El repositorio es el punto de encuentro.

## Resumen WEB (16-nov-2026)
- **Fechas:** tienda física abre domingo 13-dic-2026; atención normal desde el 14-dic (`js/apertura.js` cambia los textos solo).
- **Chats de la web:**
  - 1 Agenda datos y Google;
  - 2 Agenda diseño y Plus (espera el sí de Jennifer para el ícono «Aguja lanera» y los puntos de patrones, PDF y materiales);
  - 3 Agenda Rosina e idiomas (espera el sí para publicar traducciones y la guía v87);
  - 4 Tienda y Mercería (FALLÓ el 15-nov: reenviar su tarea al abrir; espera el Excel y las 34 fotos de la Mercería);
  - 5 Base de datos y pagos;
  - 6 Sitio, SEO y Revista;
  - 7 Universo de Rosina y Academy;
  - 8 Marketing y contenido.
  Las tareas detalladas están en `herramientas/memoria/encargos.md` (E1–E35).
- **Hecho el 16-nov:**
  - guía del perfil de Google Maps revisada y entregada (categoría principal recomendada: «Tienda de regalos»);
  - sobre-nosotras dice «nació en Villamaría, cerca a Manizales» (#754);
  - correo de compra simplificado con reseña en la página y en Google `g.page/r/Cae2iIji5j_XEAI/review` (migración 47, verificada en la base).
- **Decisión abierta de Jennifer (🔴): envíos.** El pedido se paga completo en la web y el envío se paga al recibir. Antes de construirlo:
  - Jennifer debe dar el sí para preparar el cambio y los valores «hasta $X» por zona;
  - Google Merchant pide un envío igual o un poco mayor al real, que coincida con el aviso de la tienda;
  - reparto: chat 4 (tienda y Google), chat 5 (cobro), chat 6 (políticas, que van a la abogada).
- **Google Shopping:** los productos no aparecen al buscar. Revisar con Jennifer en Merchant Center:
  1. fichas gratuitas activas;
  2. productos rechazados;
  3. envíos y devoluciones.
  Luego, opcional: anuncio pequeño para Manizales y Villamaría y unir el perfil de Maps desde la apertura. Le toca al chat 4.
- **Pendientes de Jennifer:**
  - Excel y fotos de la Mercería;
  - llevar a la abogada `BORRADORES-FASE-1.md` y `BORRADOR-ACADEMY-Y-MENORES.md`;
  - ALERTA_TOKEN (vigilancia);
  - protección de contraseñas filtradas en Supabase;
  - pago real de prueba;
  - prueba del Pasaporte con las tejedoras;
  - pieza real para el artículo ROSA;
  - datos de amigurumis (edad, ojos, piezas pequeñas, lavado, proveedor del hilo).
- **Ideas guardadas:** «💡 Ideas para después» en `PENDIENTES.md`.
  - Nueva: que el enlace de reseñas del correo conserve `#resenas` después de iniciar sesión.
  - Nueva: sección corta «Amigurumis en Manizales y Villamaría».

**Sesión actual del orquestador general:** `session_01H2X8gXuqWXjZzVn7wNCcPe` (abierto el 28-nov-2026; se renueva el lun 30-nov o si la conversación se alarga; los otros chats le escriben con `send_message` a este identificador). El anterior era `session_01H2X8gXS7uC83GnxwoHrZoj`, para archivar.

## En qué vamos (actualizado el 28-nov-2026; máx. 15 líneas)
- **Fechas:** tienda abre dom 13-dic 2:00–6:00 p. m.; horario normal desde el 14-dic (L–V 8:30–12:30 y 2:30–6:00, sáb 8:30–1:00). Base del ERP congelada sáb 9 a. m.–7 p. m. y 12–13-dic. LAROVA: plazo duro 4-dic. SENA: primer informe contable vie 4-dic; alertas ≥2 días antes.
- **Pagos:** Wompi sigue ENCENDIDO hasta que confirme el cambio de cuenta (Fondo Emprender pide cuenta en ceros). Pago directo Nequi/Bre-B en la web sin publicar (falta transferencia de prueba).
- **Ventas/caja:** defecto abierto: anular una venta no devuelve saldo a la caja departamental; espera el sí de Sara. Arreglo de venta sin internet (ERP chat 1) pendiente. Worker (Sara): revisar registros, orígenes permitidos, token y actualización diaria de caché.
- **CRM:** recuperación de contraseña con error de origen (CORS): falta el sí de Jennifer para el arreglo (agregar `larova.lanarosacrochet.com` y la URL de redirección en Supabase). Decisiones pendientes del embudo: 15 días cotización perdida, 10 oportunidad dormida (notas en `docs/RESUMEN-ORQUESTADOR.md` del CRM).
- **Marketing:** calendario y estadísticas en LAROVA; falta sí/no para cargar ediciones del calendario y anuncio del logo 1-dic. Permiso `mkt-marketing` por persona.
- **Gestión Colaboradores (ERP 9):** publicada solo para Sara y Jennifer; falta abogada laboralista (RIT, firma, salud), 22 preguntas a Oscar y plan de Supabase para archivos. SENA: Excel Anexo 2 en chat Compras SENA; informe de Producción para Fondo Emprender el 4-dic (Jennifer adjunta el formato).
- **SO:** Fase 0 publicada, Fase 1 aprobada; espera sí para migración de documentos inmutables.
- **Asistente financiero** activo sin revisión de abogada y contador. **DIAN:** software propio; 9 facturas por emitir ($831.500).
- **Agenda/Rosina:** Rosina web v87 publicada; Bienestar = Plus (candado 🔴 espera sí); EN/PT en rama `claude/idiomas-validaciones-pendiente` (abrir chat de idiomas o aplazar).
- **Seguridad:** contraseñas filtradas pide Supabase Pro (decisión de Jennifer). Tienda y Mercería: Excel y 34 fotos de la Mercería.
- **Chats:** ya archivados todos los viejos (incluidos CRM 1 y 3, ERP 2/5/6, Web 3/7). Los activos son los nuevos por tema. Regla: los ejecutores piden sí/no a Jennifer en su propio chat; si un chat no acepta un «sí» reenviado, Jennifer lo escribe allá.
- **Orquestador:** renovado el 28-nov; el nuevo anota su sesión arriba y archiva este.

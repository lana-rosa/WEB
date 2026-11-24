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

**Sesión actual del orquestador general:** `session_01H2X8gXS7uC83GnxwoHrZoj` (abierto el 18-nov-2026; los otros orquestadores le escriben con `send_message` a este identificador). El anterior era `session_01H2X8ga1Y8UMd7QfnSkEjLR`, para archivar.

## En qué vamos (actualizado el 24-nov-2026; máx. 15 líneas)
- **Fechas:** tienda abre dom 13-dic 2:00–6:00 p. m.; horario normal desde el 14-dic: L–V 8:30–12:30 y 2:30–6:00, sáb 8:30–1:00 (en la web, #801). Base del ERP congelada sáb 9 a. m.–7 p. m. y 12–13-dic. LAROVA: plazo duro 4-dic. SENA: primer informe contable vie 4-dic; bimestral nov+dic hacia el 2-ene (proponer 4-ene); alertas ≥2 días antes (chat ERP 3).
- **Pagos:** Wompi sigue ENCENDIDO (Fondo Emprender pide la cuenta en ceros al desembolso; Wompi aún no confirma el cambio a Nequi puente/Davivienda; Jennifer confirma el 25-nov; el ERP 7 tiene la alerta de vaciar la cuenta). Pago directo Nequi/Bre-B en la web sin publicar (falta transferencia de prueba de $1.000).
- **Ventas/caja:** venta de prueba hecha el 24-nov. Defecto abierto: anular una venta no devuelve el saldo a la caja departamental (+$16.000), espera el sí de Sara. Nequi/Bre-B agregado a la venta; falta probar con el Worker real.
- **Marketing:** 57 piezas en mkt_piezas (26 historias LRC); colores por marca, filtro Stories y estadísticas (mkt_metricas) publicados en LAROVA; chats por rol creados (solo revisan). Pendientes: fecha y archivo del logo nuevo, permiso de la persona del pedido para mostrar su historia, calendario de Google.
- **Gestión Colaboradores (ERP chat 9):** diseño final; muro, onboarding, centro de cumplimiento y «Mi ficha» publicados; migraciones que solo agregan: autorización permanente de Jennifer. Falta abogada (RIT, firma, salud), Oscar y plan de Supabase para archivos. Delta en docs/temas/gestion-colaboradores-delta.md.
- **LAROVA OS / SO:** chat «SO · Fase 0»: Fase 0 publicada; Fase 1 aprobada por Jennifer; espera su sí para la migración de documentos inmutables. Dirección = Jennifer y Sara.
- **Asistente financiero** activo en Contabilidad (sin revisión de abogada y contador; medir costo). **DIAN:** software propio confirmado por el contador; auditoría etapa A (ERP 4); 9 facturas por emitir ($831.500). Informes del contador: catálogo de cuentas, gastos y compras por fecha y facturas de compras publicados.
- **Agenda:** funciones nuevas y Rosina web v87 publicadas y probadas; Bienestar = Plus (candado espera el sí de Jennifer 🔴); medicamentos con la abogada; EN/PT pendiente. Rosina de LAROVA: revisión pedida a ERP chat 8.
- **Seguridad:** 111 funciones de la base con candado por rol; la protección de contraseñas filtradas pide Supabase Pro (decisión de Jennifer).
- **Chats:** largos (>60 %): orquestador, Web 4, Web 8; ERP 7 y 8 ~45 %. Ya se les pidió dejar notas y un texto de arranque. Proponer archivar (cuando Jennifer diga sí): Prueba de voz, Categorías, Web 1, Web 2, Web 5 (reemplazar si hace falta), CRM 4 y los chats por rol de Marketing ya integrados. Regla: los ejecutores piden sí/no a Jennifer en su propio chat, no por el orquestador.
- **Orquestador:** conviene renovarlo pronto (~65 %); texto de arranque arriba.

// Pruebas de la función de Rosina (herramientas/rosina-web/index.ts + nucleo.ts, Etapa 4: tarjetas de producto).
// Ejecuta el index.ts REAL con Node, con la base, el sitio y el modelo simulados (no se llama a Anthropic ni a Supabase).
//
//   node --import ./herramientas/pruebas/rosina_shim/registro.mjs herramientas/pruebas/probar_rosina_funcion.mjs
//
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const REGALOS = JSON.parse(readFileSync(join(AQUI, 'fixtures', 'regalos.json'), 'utf8'));
const COLORES = readFileSync(join(RAIZ, 'img', 'productos', 'colores.json'), 'utf8');
const INDEX = pathToFileURL(join(RAIZ, 'herramientas', 'rosina-web', 'index.ts')).href;
const NUCLEO = await import(pathToFileURL(join(RAIZ, 'herramientas', 'rosina-web', 'nucleo.ts')).href);

let pasaron = 0; const fallos = [];
function verificar(nombre, condicion, detalle) {
  if (condicion) { pasaron++; console.log('  ok   ' + nombre); }
  else { fallos.push(nombre); console.log('  FALLA ' + nombre + (detalle !== undefined ? ' → ' + (typeof detalle === 'string' ? detalle : JSON.stringify(detalle)) : '')); }
}

const TIENDA = REGALOS.map((r) => ({ id: r.id, nombre: r.nombre, precio: r.precio, categoria_web: r.categoria_web, disponible_web: true, descripcion_web: 'Descripción de ' + r.nombre, especificaciones_web: ['Altura: ' + (r.tamano_cm || '?') + ' cm'] }));
TIENDA.push({ id: 'oculto-1', nombre: 'Producto oculto', precio: 5000, categoria_web: 'Llaveros', disponible_web: false, descripcion_web: 'x', especificaciones_web: [] });
const MERCERIA = [{ id: 'm1', nombre: 'Lana Baby Soft rosa', marca: 'X', color: 'rosa', material: 'acrílico', peso_gramos: 100, precio_gramo: 100, stock_actual: 300, categoria: 'Lanas', unidad_medida: 'gramo' }];

let estado, ultimoModelo;
function nuevoEstado(extra) {
  estado = Object.assign({
    rpc: { obtener_regalos_web: REGALOS, obtener_tienda_web: TIENDA, obtener_merceria_web_v2: MERCERIA, fn_rosina_registrar_consumo: { data: null, error: null } },
    conteos: { porIp: 0, global: 0 }, llamadas: [],
    modelo: { status: 200, cuerpo: { content: [{ type: 'text', text: 'Hola 🌸' }], usage: { input_tokens: 31000, output_tokens: 120, cache_read_input_tokens: 30000, cache_creation_input_tokens: 0 } } },
    llave: 'llave-de-prueba', registrar: undefined,
  }, extra || {});
  globalThis.__sb = estado;
}

// Sitio y modelo simulados
const fetchReal = globalThis.fetch;
globalThis.fetch = async (url, opciones) => {
  const u = String(url);
  if (u.startsWith('https://api.anthropic.com/')) {
    ultimoModelo = JSON.parse(opciones.body);
    return new Response(JSON.stringify(estado.modelo.cuerpo), { status: estado.modelo.status, headers: { 'content-type': 'application/json' } });
  }
  if (u === 'https://lanarosacrochet.com/img/productos/colores.json') return new Response(estado.sinColores ? 'no' : COLORES, { status: estado.sinColores ? 404 : 200 });
  if (u.startsWith('https://lanarosacrochet.com/')) return new Response('<main>' + 'Texto público de la página. '.repeat(40) + '</main>', { status: 200 });
  return fetchReal(url, opciones);
};

let manejador, n = 0;
globalThis.Deno = {
  serve(fn) { manejador = fn; },
  env: { get: (k) => ({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'srv', ANTHROPIC_API_KEY: estado && estado.llave, RW_SAL: 'sal', RW_REGISTRAR_SIN_RESPUESTA: estado && estado.registrar })[k] },
};
async function cargar() { n++; await import(INDEX + '?v=' + n); }   // instancia nueva: sin cachés de una prueba anterior

const ORIGEN = 'https://lanarosacrochet.com';
function pedir(cuerpo, opciones) {
  const o = Object.assign({ origen: ORIGEN, metodo: 'POST' }, opciones || {});
  const headers = { 'content-type': 'application/json', 'x-forwarded-for': '1.2.3.4' };
  if (o.origen) headers.origin = o.origen;
  return manejador(new Request('https://x.supabase.co/functions/v1/rosina-web', { method: o.metodo, headers, body: o.metodo === 'POST' ? JSON.stringify(cuerpo) : undefined }));
}
async function preguntar(texto, casa, modelo) {
  if (modelo) estado.modelo.cuerpo = { content: [{ type: 'text', text: modelo }], usage: estado.modelo.cuerpo.usage };
  const r = await pedir({ mensajes: [{ role: 'user', content: texto }], casa: casa || 'tienda' });
  return { status: r.status, json: await r.json(), cabeceras: r.headers };
}
const llamadas = (tipo, nombre) => estado.llamadas.filter((x) => x.tipo === tipo && (!nombre || x.nombre === nombre || x.tabla === nombre));

console.log('\n[Núcleo: códigos, tarjetas y limpieza]');
{
  const mapa = NUCLEO.mapaDeCodigos(REGALOS);
  verificar('cada producto con foto recibe un código T1…Tn en el orden del catálogo (%d)'.replace('%d', mapa.size), mapa.size === REGALOS.length && mapa.get('T1').id === REGALOS[0].id && mapa.get('T' + REGALOS.length).id === REGALOS[REGALOS.length - 1].id);
  const r = NUCLEO.procesarRespuesta('Te recomiendo este osito. [[T3]]\n[[T5]]', mapa);
  verificar('dos códigos válidos → dos tarjetas con nombre, precio, foto y enlace del catálogo real', r.productos.length === 2 && r.productos[0].nombre === REGALOS[2].nombre && r.productos[0].precio === Math.round(REGALOS[2].precio) && r.productos[0].url === '/tienda.html?producto=' + REGALOS[2].id && r.productos[0].foto === REGALOS[2].foto_url, r.productos);
  verificar('las marcas desaparecen del texto', r.texto === 'Te recomiendo este osito.', r.texto);
  const inv = NUCLEO.procesarRespuesta('Mira [[T999]] y [[T2]] y [[T2]] y [[T3]] y [[T4]] y [[T5]]', mapa);
  verificar('un código inventado no genera tarjeta, los repetidos no se duplican y el máximo es 3', inv.productos.length === 3 && inv.productos.map((x) => x.id).join() === [REGALOS[1].id, REGALOS[2].id, REGALOS[3].id].join(), inv.productos.map((x) => x.nombre));
  verificar('nunca queda un corchete doble en el texto', !/\[\[|\]\]/.test(inv.texto) && !/T999/.test(inv.texto), inv.texto);
  const uno = NUCLEO.procesarRespuesta('Este te gustará [T4] por su color.', mapa);
  verificar('si el modelo usa un solo corchete ([T4]) también se vuelve tarjeta y no se ve el código', uno.productos.length === 1 && !/T4/.test(uno.texto) && uno.texto === 'Este te gustará por su color.', uno);
  const sd = NUCLEO.procesarRespuesta('No tengo ese dato. Escríbenos por WhatsApp. [[SIN_DATO]]', mapa);
  verificar('[[SIN_DATO]] se detecta y se quita (también en minúsculas)', sd.sinDato === true && sd.texto === 'No tengo ese dato. Escríbenos por WhatsApp.' && NUCLEO.procesarRespuesta('x [[sin_dato]]', mapa).sinDato === true, sd);
  verificar('un texto normal con corchetes comunes no se toca', NUCLEO.procesarRespuesta('Usa aguja [3,5 mm] y [lana] fina', mapa).texto === 'Usa aguja [3,5 mm] y [lana] fina');
  const est = REGALOS.find((x) => x.personalizable_base); const ya = REGALOS.find((x) => x.en_existencia && !x.personalizable_base); const enc = REGALOS.find((x) => !x.en_existencia && !x.personalizable_base);
  verificar('el estado de cada tarjeta sale del inventario: existencia, encargo o personalizado', NUCLEO.estadoDe(est) === 'personalizado' && NUCLEO.estadoDe(ya) === 'existencia' && NUCLEO.estadoDe(enc) === 'encargo');
  const p = NUCLEO.limpiarPregunta('Soy ana@correo.com, mi cel 320 507 2801 y mi cédula 1053123456; ver https://x.co/a?b=1 y www.sitio.com ¿tienen un oso?');
  verificar('el resumen de la pregunta no deja correos, teléfonos, cifras largas ni enlaces', !/@|2801|1053123456|https?:|www\./.test(p) && /oso/.test(p), p);
  verificar('el resumen se corta en 140 caracteres', NUCLEO.limpiarPregunta('a'.repeat(500)).length === 140);
  const l = NUCLEO.lineaCatalogo('T7', REGALOS[0], TIENDA[0], ['rosa', 'amarillo']);
  verificar('la línea del catálogo trae código, precio, disponibilidad y colores', l.startsWith('- [T7] ') && l.includes('colores: rosa, amarillo') && /\$85\.000|\$85,000|\$85\s?000/.test(l) && /pedido|existencia|encargo/.test(l), l);
}

console.log('\n[Función completa (index.ts real)]');
nuevoEstado(); await cargar();
{
  let r = await pedir({}, { metodo: 'OPTIONS' });
  verificar('OPTIONS responde 204 con CORS para el sitio', r.status === 204 && r.headers.get('access-control-allow-origin') === ORIGEN);
  r = await pedir({ mensajes: [] }, { origen: 'https://otro-sitio.com' });
  verificar('un origen que no es de Lana Rosa recibe 403', r.status === 403);
  r = await pedir({ mensajes: [{ role: 'assistant', content: 'hola' }] });
  verificar('si el último mensaje no es de la persona, 400', r.status === 400);
}
nuevoEstado(); await cargar();
{
  const r = await preguntar('¿Qué me recomiendan para un regalo?', 'tienda', 'Te sugiero este: es suave y precioso.\n[[T2]]\n[[T9]]');
  verificar('responde 200 con respuesta, productos y sin_dato (contrato nuevo, compatible con el anterior)', r.status === 200 && typeof r.json.respuesta === 'string' && Array.isArray(r.json.productos) && r.json.sin_dato === false, r.json);
  verificar('las dos tarjetas son productos reales del catálogo, con datos del catálogo y no del modelo', r.json.productos.length === 2 && r.json.productos[0].id === REGALOS[1].id && r.json.productos[1].nombre === REGALOS[8].nombre, r.json.productos);
  verificar('el texto llega limpio, sin códigos', r.json.respuesta === 'Te sugiero este: es suave y precioso.', r.json.respuesta);
  const sistema = ultimoModelo.system.map((s) => s.text).join('\n');
  verificar('el modelo recibe el catálogo con códigos [T1]… y las reglas de tarjetas', /\[T1\] /.test(sistema) && sistema.includes('TARJETAS DE PRODUCTO') && sistema.includes('[[SIN_DATO]]'));
  verificar('el catálogo dice «en existencia ahora» o «por encargo» según el inventario (no «disponible» para todo)', /en existencia ahora/.test(sistema) && /por encargo: se teje cuando se pide/.test(sistema));
  verificar('el catálogo incluye los colores de las fotos (colores.json)', /colores: [a-z, ]+/.test(sistema));
  verificar('los productos que no se muestran en la web siguen en el catálogo, sin código y como agotados', /- Producto oculto \| Llaveros \| \$5\.000 \| agotado/.test(sistema) || /- Producto oculto .* agotado/.test(sistema));
  verificar('los 3 amigurumis personalizados se describen como «se teje a pedido»', (sistema.match(/se teje a pedido a partir de tu foto o idea/g) || []).length === 3);
  verificar('la mercería sigue en el catálogo igual que antes (por ovillo completo)', /Lana Baby Soft rosa .* ovillo completo de 100 g: \$10\.000 el ovillo/.test(sistema), sistema.slice(sistema.indexOf('MERCERÍA')));
  verificar('se llama al modelo Haiku con 700 tokens como antes', ultimoModelo.model === 'claude-haiku-4-5-20251001' && ultimoModelo.max_tokens === 700);
  const c = llamadas('rpc', 'fn_rosina_registrar_consumo');
  verificar('se mide el consumo (tokens, tarjetas, sin dato) sin datos personales', c.length === 1 && c[0].args.p_casa === 'tienda' && c[0].args.p_entrada === 31000 && c[0].args.p_salida === 120 && c[0].args.p_cache_lectura === 30000 && c[0].args.p_tarjetas === 1 && c[0].args.p_sin_dato === 0 && !JSON.stringify(c[0].args).includes('regalo'), c[0] && c[0].args);
  verificar('no se guarda ninguna pregunta (el registro de «sin respuesta» está apagado)', llamadas('insert', 'rosina_sin_respuesta').length === 0);
}
{
  const r = await preguntar('hola', 'tienda', '¡Hola! Soy Rosina, la asistente de Lana Rosa 🌸 ¿En qué te ayudo?');
  verificar('un saludo sin productos devuelve productos vacío', r.json.productos.length === 0 && r.json.sin_dato === false);
  const c = llamadas('rpc', 'fn_rosina_registrar_consumo').slice(-1)[0];
  verificar('un saludo mide 0 tarjetas', c.args.p_tarjetas === 0);
}
{
  const r = await preguntar('¿Tienen servicio de envío a Japón?', 'tienda', 'No tengo ese dato; escríbenos al WhatsApp 573205072801 y el equipo te ayuda. [[SIN_DATO]]');
  verificar('«sin dato» se avisa en la respuesta y el texto sale sin la marca', r.json.sin_dato === true && !/SIN_DATO/.test(r.json.respuesta), r.json);
  verificar('apagado: aunque no haya respuesta, no se guarda la pregunta', llamadas('insert', 'rosina_sin_respuesta').length === 0);
}
{
  const r = await preguntar('x', 'tienda', '[[T4]]');
  verificar('si el modelo solo escribe un código, hay un texto de acompañamiento amable', r.json.productos.length === 1 && /Mira lo que encontré/.test(r.json.respuesta), r.json);
}
{
  const r = await preguntar('x', 'merceria', 'Para amigurumi usa lana baby soft. [[T2]]');
  verificar('desde la Mercería también se pueden mostrar tarjetas de la tienda (los códigos valen en las tres casas)', r.json.productos.length === 1);
  const sistema = ultimoModelo.system.map((s) => s.text).join('\n');
  verificar('el rol de cada casa se mantiene (Mercería: ovillo completo)', /MERCERÍA: asesórala/.test(sistema));
}
console.log('\n[Registro de preguntas sin respuesta (solo con RW_REGISTRAR_SIN_RESPUESTA=1)]');
nuevoEstado({ registrar: '1' }); await cargar();
{
  const r = await preguntar('Escríbeme a ana@correo.com o al 3205072801 sobre el envío a Japón', 'academy', 'No tengo ese dato. [[SIN_DATO]]');
  const ins = llamadas('insert', 'rosina_sin_respuesta');
  verificar('encendido: guarda un resumen corto con la casa, sin correo ni teléfono y sin IP', ins.length === 1 && ins[0].fila.casa === 'academy' && !/@|3205072801/.test(ins[0].fila.pregunta_resumen) && /Japón/.test(ins[0].fila.pregunta_resumen) && Object.keys(ins[0].fila).sort().join() === 'casa,pregunta_resumen', ins[0]);
  const r2 = await preguntar('hola', 'tienda', '¡Hola!');
  verificar('encendido: un saludo normal no se guarda', llamadas('insert', 'rosina_sin_respuesta').length === 1);
}
console.log('\n[Fallos y límites (igual que antes)]');
nuevoEstado(); await cargar();
{
  estado.conteos.porIp = 20;
  let r = await preguntar('hola', 'tienda');
  verificar('con 20 mensajes en la hora responde 429 con el aviso de WhatsApp', r.status === 429 && /WhatsApp/.test(r.json.error));
  nuevoEstado({ llave: undefined }); await cargar();
  r = await preguntar('hola', 'tienda');
  verificar('sin llave del modelo responde 503 con aviso amable', r.status === 503 && /WhatsApp/.test(r.json.error));
  nuevoEstado({ modelo: { status: 500, cuerpo: {} } }); await cargar();
  r = await preguntar('hola', 'tienda');
  verificar('si el modelo falla responde 502 con aviso amable', r.status === 502 && /WhatsApp/.test(r.json.error));
}
nuevoEstado({ rpc: { obtener_regalos_web: () => ({ data: null, error: { message: 'caído' } }), obtener_tienda_web: () => ({ data: null, error: { message: 'caído' } }), obtener_merceria_web_v2: () => ({ data: null, error: { message: 'caído' } }), fn_rosina_registrar_consumo: () => { throw new Error('la medición falló'); } } }); await cargar();
{
  const r = await preguntar('¿Cómo pago?', 'tienda', 'Con Wompi. [[T1]]');
  verificar('si el catálogo no carga, igual responde (sin tarjetas) y si falla la medición tampoco se rompe', r.status === 200 && r.json.productos.length === 0 && r.json.respuesta === 'Con Wompi.', r);
}
nuevoEstado({ sinColores: true }); await cargar();
{
  const r = await preguntar('hola', 'tienda', 'Hola');
  const sistema = ultimoModelo.system.map((s) => s.text).join('\n');
  verificar('si colores.json no carga, el catálogo sale igual (sin la columna de colores)', r.status === 200 && !/colores: /.test(sistema) && /\[T1\] /.test(sistema));
}
nuevoEstado(); await cargar();
{
  const largo = Array.from({ length: 12 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'm'.repeat(900) + i }));
  largo.push({ role: 'user', content: 'última' });
  await pedir({ mensajes: largo, casa: 'inventada' });
  verificar('se conservan los límites: últimos 8 mensajes de hasta 600 caracteres y casa inválida → tienda', ultimoModelo.messages.length === 8 && ultimoModelo.messages.every((m) => m.content.length <= 600) && /TIENDA DE AMIGURUMIS: asesórala/.test(ultimoModelo.system.map((s) => s.text).join('\n')));
}

console.log('\n%d comprobaciones correctas, %d con falla.'.replace('%d', pasaron).replace('%d', fallos.length));
if (fallos.length) { console.log('FALLAS:'); fallos.forEach((f) => console.log(' - ' + f)); process.exit(1); }

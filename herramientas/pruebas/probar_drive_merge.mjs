// Prueba de la mezcla de la agenda entre dos aparatos (etapa 7): node herramientas/pruebas/probar_drive_merge.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const M = require('../../js/agenda/drive-merge.js');
let ok = 0, mal = 0;
const v = (nombre, cond, extra) => { if (cond) { ok++; console.log('  ok  ', nombre); } else { mal++; console.log('  FALLA', nombre, extra !== undefined ? '→ ' + JSON.stringify(extra) : ''); } };
const TABLAS = [
  { id: 'tabla-pedidos', prefijo: 'ag-p', cols: ['cliente', 'telefono', 'estado', 'totalcompra', { id: 'abono' }, { id: 'cal', cal: 'pedido' }] },
  { id: 'tabla-clientas', prefijo: 'ag-cl', cols: ['nombre', 'whatsapp', 'desde'] },
  { id: 'tabla-compras', prefijo: 'ag-c', cols: ['material', 'color', 'cantidad', { id: 'comprado', check: true }] },
];
const f = (b, l, r) => M.fusionar(b, l, r, TABLAS);
const filas = (d, pre, col) => Object.keys(d).filter(k => new RegExp('^' + pre + '\\d+-' + col + '$').test(k)).sort((a, b) => parseInt(a.slice(pre.length)) - parseInt(b.slice(pre.length))).map(k => d[k]);

// ---- 1. los dos agregaron un pedido distinto ----
let base = { 'ag-p1-cliente': 'Ana', 'ag-p1-totalcompra': '$ 50.000', _filas: { 'tabla-pedidos': 3 } };
let cel = { ...base, 'ag-p2-cliente': 'Beto', 'ag-p2-totalcompra': '$ 20.000', _filas: { 'tabla-pedidos': 3 } };
let pc = { ...base, 'ag-p2-cliente': 'Cami', 'ag-p2-totalcompra': '$ 30.000', _filas: { 'tabla-pedidos': 3 } };
let r = f(base, cel, pc);
v('dos pedidos nuevos distintos (celular y computador): quedan los tres', JSON.stringify(filas(r.resultado, 'ag-p', 'cliente')) === JSON.stringify(['Ana', 'Beto', 'Cami']), filas(r.resultado, 'ag-p', 'cliente'));
v('cada pedido conserva sus propios datos', r.resultado['ag-p2-totalcompra'] === '$ 20.000' && r.resultado['ag-p3-totalcompra'] === '$ 30.000', r.resultado);
v('sin conflictos', r.conflictos.length === 0 && r.duplicadas.length === 0);
v('no se pierde el número de fichas', r.resultado._filas['tabla-pedidos'] === 3);

// ---- 2. uno borró un pedido que el otro no tocó ----
base = { 'ag-p1-cliente': 'Ana', 'ag-p2-cliente': 'Beto', 'ag-p3-cliente': 'Cami', _filas: { 'tabla-pedidos': 3 } };
cel = { 'ag-p1-cliente': 'Ana', 'ag-p2-cliente': 'Cami', _filas: { 'tabla-pedidos': 3 } };   // borró a Beto y las demás subieron
r = f(base, cel, base);
v('borrar en un aparato se refleja en el otro', JSON.stringify(filas(r.resultado, 'ag-p', 'cliente')) === JSON.stringify(['Ana', 'Cami']), filas(r.resultado, 'ag-p', 'cliente'));
// ---- 3. uno borró y el otro agregó ----
pc = { ...base, 'ag-p4-cliente': 'Dani' };
r = f(base, cel, pc);
v('uno borra a Beto y el otro agrega a Dani: queda Ana, Cami, Dani', JSON.stringify(filas(r.resultado, 'ag-p', 'cliente')) === JSON.stringify(['Ana', 'Cami', 'Dani']), filas(r.resultado, 'ag-p', 'cliente'));

// ---- 4. editar una ficha en un aparato ----
cel = { ...base, 'ag-p2-estado': 'Entregado' };
r = f(base, cel, base);
v('editar una ficha en un aparato llega al otro sin duplicarla', filas(r.resultado, 'ag-p', 'cliente').length === 3 && r.resultado['ag-p2-estado'] === 'Entregado', r.resultado);
v('la posición de las fichas no cambia si el otro aparato no tocó la lista', JSON.stringify(Object.keys(r.resultado).filter(k => k.startsWith('ag-p')).sort()) === JSON.stringify(['ag-p1-cliente', 'ag-p2-cliente', 'ag-p2-estado', 'ag-p3-cliente']));

// ---- 5. la misma ficha editada distinto en los dos: quedan las dos versiones ----
cel = { ...base, 'ag-p2-estado': 'Entregado' };
pc = { ...base, 'ag-p2-estado': 'Cancelado' };
r = f(base, cel, pc);
const estados = filas(r.resultado, 'ag-p', 'estado');
v('la misma ficha cambiada distinto: no se pierde ninguna de las dos versiones', estados.includes('Entregado') && estados.includes('Cancelado'), r.resultado);
v('se avisa cuál ficha quedó con dos versiones', r.duplicadas.length === 1 && r.duplicadas[0].tabla === 'tabla-pedidos', r.duplicadas);

// ---- 6. sin base (primera sincronización) ----
cel = { 'ag-cl1-nombre': 'Ana', 'ag-cl2-nombre': 'Beto' };
pc = { 'ag-cl1-nombre': 'Ana', 'ag-cl2-nombre': 'Cami' };
r = f(null, cel, pc);
v('sin base: se juntan sin duplicar lo idéntico (Ana una sola vez)', JSON.stringify(filas(r.resultado, 'ag-cl', 'nombre').sort()) === JSON.stringify(['Ana', 'Beto', 'Cami']), filas(r.resultado, 'ag-cl', 'nombre'));
r = f(null, {}, cel);
v('sin base y este aparato vacío: se recupera todo lo de Drive', JSON.stringify(filas(r.resultado, 'ag-cl', 'nombre')) === JSON.stringify(['Ana', 'Beto']));
r = f(null, cel, {});
v('sin base y Drive vacío: queda lo de este aparato', JSON.stringify(filas(r.resultado, 'ag-cl', 'nombre')) === JSON.stringify(['Ana', 'Beto']));

// ---- 7. datos sueltos ----
base = { 'ag-duena': 'Sara', 'ag-mes-1': 'Meta de enero' };
cel = { ...base, 'ag-mes-1': 'Meta de enero: vender más', 'ag-mes-2': 'Febrero' };
pc = { ...base, 'ag-duena': 'Sara L.' };
r = f(base, cel, pc);
v('cambios en casillas distintas se juntan', r.resultado['ag-mes-1'] === 'Meta de enero: vender más' && r.resultado['ag-duena'] === 'Sara L.' && r.resultado['ag-mes-2'] === 'Febrero', r.resultado);
v('sin conflictos en casillas distintas', r.conflictos.length === 0);
cel = { ...base, 'ag-mes-1': 'Desde el celular' };
pc = { ...base, 'ag-mes-1': 'Desde el computador' };
r = f(base, cel, pc);
v('la misma casilla escrita distinto en los dos: gana este aparato y se avisa', r.resultado['ag-mes-1'] === 'Desde el celular' && r.conflictos.length === 1 && r.conflictos[0].remoto === 'Desde el computador', r);

// ---- 8. finanzas: movimientos con id ----
base = { _fin: { fijos: [{ id: 'a', v: '600000' }], deudas: [], movs: [{ id: '1', t: 'i', v: '100' }] } };
cel = { _fin: { fijos: [{ id: 'a', v: '600000' }], deudas: [], movs: [{ id: '1', t: 'i', v: '100' }, { id: '2', t: 'g', v: '20' }] } };
pc = { _fin: { fijos: [{ id: 'a', v: '650000' }], deudas: [], movs: [{ id: '1', t: 'i', v: '100' }, { id: '3', t: 'i', v: '500' }] } };
r = f(base, cel, pc);
v('movimientos de dinero: se juntan los de los dos aparatos', r.resultado._fin.movs.map(m => m.id).sort().join() === '1,2,3', r.resultado._fin);
v('un pago fijo cambiado en un aparato llega al otro', r.resultado._fin.fijos[0].v === '650000');
cel = { _fin: { fijos: [{ id: 'a', v: '600000' }], deudas: [], movs: [] } };            // borró el movimiento 1
pc = { _fin: { fijos: [{ id: 'a', v: '600000' }], deudas: [], movs: [{ id: '1', t: 'i', v: '100' }] } };
r = f(base, cel, pc);
v('un movimiento borrado en un aparato (y sin tocar en el otro) se borra', r.resultado._fin.movs.length === 0, r.resultado._fin);
cel = { _fin: { fijos: [], deudas: [], movs: [] } };                                    // borró el 1
pc = { _fin: { fijos: [{ id: 'a', v: '600000' }], deudas: [], movs: [{ id: '1', t: 'i', v: '999' }] } };   // el otro lo corrigió
r = f(base, cel, pc);
v('si uno lo borró y el otro lo corrigió, se conserva el corregido (no se pierde)', r.resultado._fin.movs.length === 1 && r.resultado._fin.movs[0].v === '999', r.resultado._fin);

// ---- 9. propiedades generales ----
base = { 'ag-p1-cliente': 'Ana', 'ag-duena': 'Sara', _fin: { movs: [{ id: '1' }] } };
v('mezclar lo mismo con lo mismo no cambia nada', M.igual(f(base, base, base).resultado, base));
cel = { ...base, 'ag-p2-cliente': 'Beto' };
v('si Drive no cambió, queda exactamente lo de este aparato', M.igual(f(base, cel, base).resultado, { ...cel }), f(base, cel, base).resultado);
v('si este aparato no cambió, queda exactamente lo de Drive', M.igual(f(base, base, cel).resultado, { ...cel }));
// idempotencia: mezclar el resultado con cualquiera de los dos no lo cambia
let a = { ...base, 'ag-p2-cliente': 'Beto' }, b = { ...base, 'ag-p2-cliente': 'Cami', 'ag-c1-material': 'Lana' };
let m1 = f(base, a, b).resultado;
v('mezclar de nuevo lo ya mezclado es estable (no sigue creciendo)', M.igual(f(base, m1, m1).resultado, m1) && M.igual(f(m1, m1, m1).resultado, m1) && M.igual(f(null, m1, m1).resultado, m1), [f(null, m1, m1).resultado, m1]);
// simetría de contenido: lo mismo sin importar desde cuál aparato se mezcle
let m2 = f(base, b, a).resultado;
v('desde el otro aparato sale el mismo contenido (cambia solo el orden)', JSON.stringify(filas(m1, 'ag-p', 'cliente').sort()) === JSON.stringify(filas(m2, 'ag-p', 'cliente').sort()) && m1['ag-c1-material'] === m2['ag-c1-material'], [m1, m2]);
// no modifica los originales
const antes = JSON.stringify([base, cel]); f(base, cel, { ...base, 'ag-p3-cliente': 'Z' }); v('no modifica las versiones que recibe', antes === JSON.stringify([base, cel]));
// casillas tipo check
base = { 'ag-c1-material': 'Lana', 'ag-c1-comprado': false };
cel = { ...base, 'ag-c1-comprado': true };
r = f(base, cel, { 'ag-c1-material': 'Lana' });
v('una casilla marcada (check) se conserva', r.resultado['ag-c1-comprado'] === true, r.resultado);
// tablas con prefijos parecidos no se mezclan (ag-c contra ag-cl)
cel = { 'ag-c1-material': 'Lana', 'ag-cl1-nombre': 'Ana' }; pc = { 'ag-c1-material': 'Lana', 'ag-cl1-nombre': 'Beto' };
r = f(null, cel, pc);
v('tablas de prefijo parecido (compras y clientas) no se confunden', r.resultado['ag-c1-material'] === 'Lana' && filas(r.resultado, 'ag-cl', 'nombre').length === 2, r.resultado);
// datos de otras claves (hojas con claves propias)
base = { _tinta: { x: [1] }, _dib: { a: 1 } };
cel = { ...base, _dib: { a: 1, b: 2 } }; pc = { ...base, _tinta: { x: [1], y: [2] } };
r = f(base, cel, pc);
v('dibujos y trazos de hojas distintas se conservan los dos', r.resultado._dib.b === 2 && r.resultado._tinta.y[0] === 2, r.resultado);
// agenda muy llena (200 fichas)
base = {}; for (let i = 1; i <= 200; i++) base['ag-p' + i + '-cliente'] = 'C' + i;
cel = { ...base, 'ag-p201-cliente': 'Nuevo' };
const t0 = Date.now(); r = f(base, cel, base); v('agenda grande (200 fichas) se mezcla rápido', Date.now() - t0 < 500 && filas(r.resultado, 'ag-p', 'cliente').length === 201, Date.now() - t0);
console.log(`\n${ok} comprobaciones correctas, ${mal} con falla.`);
process.exit(mal ? 1 : 0);

/* Agenda para tejedoras: el informe del mes como PDF (10-nov-2026; lo usa drive-archivos.js para «Guardar el informe del mes (PDF) en mi Drive»).
   Lee los MISMOS números de la hoja «Informe del mes» (window.lrInforme.datos) y los pone en un PDF de texto hecho con pdf-simple.js; no cambia el informe de pantalla.
   Siempre en español (como el resumen que se manda por WhatsApp). Respeta el candado de la membresía: con la hoja de Finanzas bloqueada no se genera.
   API: window.lrInformePdf.crearBlob(año, mes) → Blob o null (sin datos o bloqueada); .nombre(año, mes). Prueba: herramientas/pruebas/probar_agenda_informe_pdf.py. */
(function () {
  'use strict';
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function plata(x) { return (x < 0 ? '-' : '') + '$ ' + Math.abs(Math.round(x)).toLocaleString('es-CO'); }
  function bloqueada() { var h = document.getElementById('fin-resumen'); return !!(h && h.classList.contains('sin-membresia')); }
  function crearBlob(y, m) {
    var I = window.lrInforme, P = window.lrPdf, N = window.lrAgendaNucleo;
    if (!I || !P || !N || bloqueada()) return null;
    var d = I.datos(y, m); if (!d || !d.hay) return null;
    var quien = (N.datos()['ag-duena'] || '').trim(), neg = ((N.datos()._perfil || {}).negocio || '').trim();
    var sub = (neg ? neg + (quien ? ' · ' + quien : '') : (quien ? 'Negocio de ' + quien : '')), b = [];
    function fila(a, v) { b.push({ t: 'fila', a: a, b: v }); }
    b.push({ t: 'h2', a: 'Resumen del mes' });
    if (d.hayMovs || d.ingresos) fila('Entró', plata(d.ingresos));
    if (d.hayMovs || d.gastos) fila('Salió', plata(d.gastos));
    if (d.hayMovs) fila(d.utilidad >= 0 ? 'Te quedó' : 'Perdiste', plata(Math.abs(d.utilidad)));
    if (d.ventas) fila('Ventas', plata(d.ventas));
    if (d.hayMovs && d.ingresos > 0) b.push({ t: 'nota', a: d.utilidad >= 0 ? 'Por cada $ 100 que entraron, te quedaron $ ' + Math.round(d.utilidad / d.ingresos * 100) + '.' : 'Este mes salió más de lo que entró.' });
    if (d.nVentas) {
      b.push({ t: 'h2', a: 'Tus ventas' }); fila('Ventas anotadas', String(d.nVentas)); fila('Total vendido', plata(d.vTotal)); fila('Promedio por venta', plata(d.promedio));
      if (d.conCosto) fila('Ganancia (de las ventas con costo)', plata(d.gananciaCosto));
      if (d.top.length) { b.push({ t: 'nota', a: 'Lo que más vendiste:' }); d.top.forEach(function (t) { fila(t.n, plata(t.v)); }); }
    }
    if (d.meta || d.eq) {
      b.push({ t: 'h2', a: 'Tu meta y tu punto de equilibrio' });
      if (d.meta) { fila('Meta de ventas', plata(d.meta)); fila('Lo que lograste', Math.round(d.ventas / d.meta * 100) + ' %'); }
      if (d.eq) { fila('Para no perder necesitabas vender', plata(d.eq)); b.push({ t: 'nota', a: d.ventas >= d.eq ? 'Superaste tu punto de equilibrio: el negocio ganó este mes.' : 'No llegaste a tu punto de equilibrio: faltaron ' + plata(d.eq - d.ventas) + ' en ventas.' }); }
    }
    if (d.cats.length) {
      var tot = d.cats.reduce(function (s, c) { return s + c.v; }, 0);
      b.push({ t: 'h2', a: 'En qué se fue el dinero' }); d.cats.slice(0, 8).forEach(function (c) { fila(c.n, plata(c.v) + ' · ' + Math.round(c.v / tot * 100) + ' %'); });
      if (d.cats.length > 8) b.push({ t: 'nota', a: 'Y otras categorías más pequeñas.' });
    }
    b.push({ t: 'h2', a: 'Pedidos y clientas' });
    fila('Pedidos entregados este mes', d.entregados + (d.entTotal ? ' · ' + plata(d.entTotal) : '')); fila('Pedidos en marcha hoy', String(d.activos));
    fila('Por cobrar hoy', d.porCobrar ? plata(d.porCobrar) : '$ 0'); fila('Clientas nuevas', String(d.nuevas));
    if (d.lana || d.porAcabar.length) {
      b.push({ t: 'h2', a: 'Tus materiales hoy' }); if (d.lana) fila('Dinero en lana', plata(d.lana)); fila('Lanas por acabarse', String(d.porAcabar.length));
      if (d.porAcabar.length) b.push({ t: 'nota', a: d.porAcabar.slice(0, 8).join(', ') + (d.porAcabar.length > 8 ? '…' : '') });
    }
    b.push({ t: 'espacio' }); b.push({ t: 'nota', a: 'Es una guía hecha con lo que anotaste en tu agenda; no es contabilidad oficial. Los pedidos por cobrar y los materiales son de hoy, no del mes elegido.' });
    return P.crear({ titulo: 'Informe de ' + MESES[m - 1] + ' ' + y, subtitulo: sub, pie: 'Agenda para tejedoras · lanarosacrochet.com', bloques: b });
  }
  function nombre(y, m) { return 'Informe ' + y + '-' + ('0' + m).slice(-2) + ' Agenda para tejedoras'; }
  window.lrInformePdf = { crearBlob: crearBlob, nombre: nombre };
})();

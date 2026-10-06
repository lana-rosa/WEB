// Muestra un texto u otro según la fecha de apertura de la tienda física (hora de Colombia, UTC-5).
// Antes del lunes 16-nov-2026: lo que tenga data-apertura="antes". Desde esa fecha: data-apertura="despues".
// Sin JavaScript se ve la versión "antes" (la que está vigente hoy).
(function () {
  try {
    var c = new Date(Date.now() - 5 * 3600 * 1000);
    var hoy = Date.UTC(c.getUTCFullYear(), c.getUTCMonth(), c.getUTCDate());
    if (hoy < Date.UTC(2026, 10, 16)) return;
    document.querySelectorAll('[data-apertura="antes"]').forEach(function (e) { e.hidden = true; });
    document.querySelectorAll('[data-apertura="despues"]').forEach(function (e) { e.hidden = false; });
  } catch (e) {}
})();

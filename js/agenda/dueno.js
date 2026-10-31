/* Agenda para tejedoras: aviso cuando otra cuenta abre la agenda en un navegador que ya tiene hojas escritas (30-oct-2026, revisión de seguridad pedida por Sara).
   Lo escrito se guarda por navegador (`rosinaAgenda`), no por cuenta. Por eso se recuerda a qué cuenta pertenecen las hojas (`lrAgendaDueno` = id de la cuenta; no es secreto):
   si entra una cuenta distinta y hay hojas escritas, se pregunta antes de mostrarlas. Es solo una protección de la página (los datos siguen en el dispositivo). */
(function () {
  var SES = 'sb-ngjoognzvehwjtpqwrqe-auth-token', DUENO = 'lrAgendaDueno';
  var BORRAR = ['rosinaAgenda', 'rosinaAgendaCopia', 'rosinaAgendaHoja', 'lrNubeBase', 'lrNubeSucio', 'lrAgendaRecordatorio', 'lrMembresia', 'lrDriveBase', 'lrDriveRev', 'lrDriveUid', 'lrDriveSnap', 'lrDriveAvisos'];
  var uid = null, anterior = null, datos = null;
  try {
    var s = JSON.parse(localStorage.getItem(SES) || 'null'); uid = s && s.user && s.user.id;
    anterior = localStorage.getItem(DUENO); datos = localStorage.getItem('rosinaAgenda');
  } catch (e) { return; }
  if (!uid) return;
  function guardar() { try { localStorage.setItem(DUENO, uid); } catch (e) {} }
  function tieneAlgo(v) {   // ¿hay algo escrito de verdad? (la página puede guardar objetos vacíos o casillas en blanco)
    if (v === null || v === undefined || v === false) return false;
    if (typeof v === 'string') return v.trim() !== '' && v !== '0';
    if (typeof v !== 'object') return true;
    return Object.keys(v).some(function (k) { return k !== 'ag-anio' && tieneAlgo(v[k]); });   // «ag-anio» lo pone la página sola (el año)
  }
  var hayDatos = false;
  try { hayDatos = tieneAlgo(JSON.parse(datos || 'null')); } catch (e) { hayDatos = !!datos; }
  if (!anterior || anterior === uid || !hayDatos) { guardar(); return; }   // sin dueña conocida (primera vez), la misma cuenta o nada escrito: no hay nada que preguntar

  function pintar() {
    var f = document.createElement('div'); f.className = 'dueno-fondo'; f.setAttribute('role', 'dialog'); f.setAttribute('aria-modal', 'true'); f.setAttribute('aria-labelledby', 'dueno-titulo');
    f.innerHTML = '<div class="dueno-caja"><h2 id="dueno-titulo">Esta agenda ya tiene hojas escritas</h2>' +
      '<p>En este navegador hay una agenda que se escribió con otra cuenta. Para proteger los datos de tus clientas y los tuyos, no la mostramos sin preguntarte.</p>' +
      '<div class="dueno-botones"><button type="button" class="boton-primario" id="dueno-nueva">Guardar una copia y empezar una agenda nueva</button>' +
      '<button type="button" class="boton-secundario" id="dueno-mia">Es mi agenda (uso otro correo)</button></div>' +
      '<small>«Empezar una agenda nueva» baja un archivo con lo que había y limpia este navegador. Si tienes la copia en tu cuenta activa, se recupera sola.</small></div>';
    document.body.appendChild(f); document.documentElement.classList.add('dueno-abierto');
    var nueva = f.querySelector('#dueno-nueva'), mia = f.querySelector('#dueno-mia'); nueva.focus();
    mia.addEventListener('click', function () { guardar(); f.remove(); document.documentElement.classList.remove('dueno-abierto'); });
    nueva.addEventListener('click', function () {
      nueva.disabled = true;
      var b = document.getElementById('agenda-descargar'); if (b) b.click();   // baja la copia con lo que había
      setTimeout(function () {
        try { BORRAR.forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {}
        guardar(); location.reload();
      }, 900);
    });
  }
  if (document.body) pintar(); else document.addEventListener('DOMContentLoaded', pintar);
})();

// Textos que Sara edita desde el ERP (Configuración → Textos de la web). Tabla `web_textos` en Supabase (lectura pública).
// El HTML ya trae los textos originales: si no hay conexión o la tabla falla, la página queda igual.
(function () {
  var URL = 'https://ngjoognzvehwjtpqwrqe.supabase.co/rest/v1/web_textos?select=clave,valor';
  var KEY = 'sb_publishable_2TQ_piaHlSMHa79zjmOOXg_6bEwgkKD';

  function aplicar(t) {
    // Barra de anuncios: hasta 6 mensajes, repetidos para que el desplazamiento sea continuo.
    var cinta = document.querySelector('.franja-anuncios .cinta');
    if (cinta) {
      var msgs = [];
      for (var i = 1; i <= 6; i++) { var m = (t['franja.' + i] || '').trim(); if (m) msgs.push(m); }
      if (msgs.length) {
        cinta.replaceChildren();
        msgs.concat(msgs).forEach(function (m) { var s = document.createElement('span'); s.textContent = m; cinta.append(s); });
      }
    }
    // Ventana emergente del bono
    [['bono.etiqueta', '.modal-bono .etiqueta-bono'], ['bono.titulo', '.modal-bono h2'], ['bono.nota', '.modal-bono .nota-bono']].forEach(function (p) {
      var v = (t[p[0]] || '').trim(), e = document.querySelector(p[1]);
      if (v && e) e.textContent = v;
    });
    var intro = (t['bono.intro'] || '').trim(), ie = document.querySelector('.modal-bono .intro-bono');
    if (intro && ie) {
      ie.replaceChildren();
      intro.split(/(\[[^\]]+\])/).forEach(function (parte) {
        var n = parte.toLowerCase();
        if (n === '[tienda]' || n === '[mercería]' || n === '[merceria]') {
          var a = document.createElement('a'); a.href = n === '[tienda]' ? '/tienda.html' : '/merceria/'; a.textContent = n.slice(1, -1) === 'merceria' ? 'mercería' : n.slice(1, -1); ie.append(a);
        } else if (parte) ie.append(document.createTextNode(parte));
      });
    }
  }

  try {
    fetch(URL, { headers: { apikey: KEY } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (filas) { var t = {}; (filas || []).forEach(function (f) { t[f.clave] = f.valor; }); aplicar(t); })
      .catch(function () {});
  } catch (e) {}
})();

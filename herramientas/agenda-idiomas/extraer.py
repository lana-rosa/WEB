"""Lista los textos en español que siguen visibles sin traducir en la Agenda (31-oct-2026, pedido de Sara: varios idiomas).
Uso: /usr/bin/python3 herramientas/agenda-idiomas/extraer.py [en|pt] [vistas] > faltan.json
Abre la agenda en el idioma pedido con una agenda de ejemplo y recorre las vistas; cada texto que no esté en el diccionario sale una sola vez
con la vista donde apareció. vistas: etapa1 (menú, panel, secciones, Configuración, títulos de hojas), hojas (el cuerpo de cada hoja), todo."""
import sys, os, json, datetime
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'pruebas'))
from agenda_util import *
idioma = sys.argv[1] if len(sys.argv) > 1 else 'en'; vistas = sys.argv[2] if len(sys.argv) > 2 else 'etapa1'
hoy = datetime.date.today(); f = lambda d: d.strftime('%d/%m/%Y')
DATOS = {'ag-duena': 'Sara Pérez',
         'ag-vt1-fecha': f(hoy), 'ag-vt1-producto': 'Osito', 'ag-vt1-cliente': 'María', 'ag-vt1-precio': '$ 85.000', 'ag-vt1-costo': '$ 20.000',
         'ag-gs1-fecha': f(hoy), 'ag-gs1-detalle': 'Lana', 'ag-gs1-valor': '$ 60.000', 'ag-gs1-categoria': 'Materiales',
         'ag-p1-cliente': 'María Gómez', 'ag-p1-pedido': 'Osito', 'ag-p1-entrega': f(hoy + datetime.timedelta(days=3)), 'ag-p1-estado': 'En proceso', 'ag-p1-totalcompra': '$ 85.000', 'ag-p1-abono': '$ 45.000',
         'ag-f1-proyecto': 'Chaleco de María', 'ag-f1-estado': 'Tejiendo', 'ag-f2-proyecto': 'Manta bebé', 'ag-f2-estado': 'Por empezar', 'ag-f3-proyecto': 'Ya listo', 'ag-f3-estado': 'Terminado'}
salida = {}
def tomar(pg, vista):
    for t, donde in pg.evaluate("window.lrI18n.faltan()"):
        if t not in salida: salida[t] = [donde, vista]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    for ancho, alto in (((1280, 900),) if vistas == "hojas" else ((1280, 900), (390, 844))):
        ctx = contexto(b, ancho, alto, datos=DATOS, config_abierta=False); ctx.add_init_script("localStorage.setItem('lrAgendaIdioma','%s')" % idioma)
        pg = abrir(ctx, '', 2500, config=False); tag = '%d' % ancho
        if vistas in ('etapa1', 'todo'):
            tomar(pg, 'panel' + tag)
            n = pg.locator('.pestana').count()
            for i in range(1, n):
                pg.locator('.pestana').nth(i).click(); pg.wait_for_timeout(500); tomar(pg, 'seccion%d-%s' % (i, tag))
            pg.evaluate("window.lrAgendaConfig && window.lrAgendaConfig.abrir()"); pg.wait_for_timeout(500); tomar(pg, 'config' + tag)
            pg.evaluate("window.lrAgendaConfig && window.lrAgendaConfig.cerrar()")
            pg.click('#af-boton'); pg.wait_for_timeout(300); tomar(pg, 'ayuda' + tag); pg.keyboard.press('Escape')
        if vistas in ('hojas', 'todo'):
            ids = pg.evaluate("[...document.querySelectorAll('#menu-hojas-lista a[data-hoja]')].map(a => a.dataset.hoja)")
            for h in ids:
                pg.evaluate("window.lrIrAHoja && window.lrIrAHoja('%s')" % h); pg.wait_for_timeout(350)
                for t, donde in pg.evaluate("window.lrI18n.faltan(document.getElementById('%s'), true)" % h):   # todo el cuerpo de la hoja, también lo oculto (fichas cerradas)
                    if t not in salida: salida[t] = [donde, 'hoja-%s' % h]
        if vistas == 'etapa1':   # los títulos y subtítulos de todas las hojas (alimentan la lista «Hojas de…» y las tarjetas de sección)
            ids = pg.evaluate("[...document.querySelectorAll('#menu-hojas-lista a[data-hoja]')].map(a => a.dataset.hoja)")
            for h in ids:
                pg.evaluate("window.lrIrAHoja && window.lrIrAHoja('%s')" % h); pg.wait_for_timeout(250)
                for t in pg.evaluate("(() => { const s = document.getElementById('%s'); if (!s) return []; const hd = s.querySelector('header'); return hd ? [...hd.querySelectorAll('h2,h3,p')].map(e => e.textContent) : []; })()" % h):
                    t = ' '.join(t.split())
                    if t and pg.evaluate("t => window.lrI18n.t(t) === t", t) and t not in salida: salida[t] = ['titulo-hoja', h]
        ctx.close()
    b.close()
print(json.dumps(salida, ensure_ascii=False, indent=1)); print('# %d textos sin traducir' % len(salida), file=sys.stderr)

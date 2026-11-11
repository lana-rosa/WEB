"""Presupuesto en PDF por WhatsApp (E34, 12-nov-2026). Uso: /usr/bin/python3 probar_agenda_presupuesto.py"""
import json, subprocess, os, tempfile, urllib.parse
from agenda_util import *
DATOS = {'ag-duena': 'Sara', 'ag-p1-cliente': 'Ana Gómez', 'ag-p1-telefono': '3001234567', 'ag-p1-pedido': 'Osito de apego', 'ag-p1-obs': 'Color rosa palo, con lazo y ojos bordados.', 'ag-p1-cantidad': '2', 'ag-p1-valorunidad': '$ 80.000',
         'ag-p1-costoenvio': '$ 12.000', 'ag-p1-totalcompra': '$ 172.000', 'ag-p1-precio': '$ 160.000', 'ag-p1-abono': '$ 50.000', 'ag-p1-entrega': '20/11/2026', 'ag-p2-cliente': 'Beto', 'ag-p3-pedido': 'Manta', 'ag-p3-totalcompra': '$ 90.000'}
T = Prueba()
STUB = "window.__com = null; window.__abierto = null; window.open = (u) => { window.__abierto = u; return null; }; navigator.canShare = null; navigator.share = null;"
STUB_SI = "window.__com = null; navigator.canShare = (d) => !!(d && d.files && d.files.length); navigator.share = (d) => { window.__com = { n: d.files[0].name, tipo: d.files[0].type, tam: d.files[0].size, texto: d.text }; return Promise.resolve(); };"
def abrir_fichas(pg): pg.evaluate("document.querySelectorAll('#tabla-pedidos tr.ficha .ficha-cab').forEach(b => { if (b.getAttribute('aria-expanded') !== 'true') b.click(); })"); pg.wait_for_timeout(500)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM)
    ctx = contexto(b, 1280, 1000, datos=DATOS, config_abierta=False); ctx.add_init_script(STUB)
    pg = abrir(ctx, 'control-pedidos', 2300, config=False); abrir_fichas(pg)
    f = lambda n: '#tabla-pedidos tr.ficha[data-fila="%d"] td.pd-presup' % n
    T.v('el pedido con total y cliente tiene «Armar presupuesto»', pg.locator(f(1) + ' button').count() == 1)
    T.v('sin total (pedido 2) no hay botón; con producto y total (pedido 3) sí', pg.locator(f(2)).count() == 0 and pg.locator(f(3)).count() == 1)
    pg.click(f(1) + ' button'); pg.wait_for_selector('.pp-fondo', timeout=8000); pg.wait_for_timeout(400)
    T.v('abre la vista previa con la imagen del presupuesto', pg.locator('.pp-vista').is_visible() and pg.evaluate("document.querySelector('.pp-vista').src.startsWith('data:image/jpeg')"))
    T.v('foco en «Enviar por WhatsApp»', 'WhatsApp' in pg.evaluate("document.activeElement.textContent"))
    # computador: descarga y abre WhatsApp con el mensaje
    with pg.expect_download() as d: pg.click('.pp-botones button:has-text("WhatsApp")')
    dl = d.value; ruta = os.path.join(tempfile.gettempdir(), 'pres-prueba.pdf'); dl.save_as(ruta); raw = open(ruta, 'rb').read()
    T.v('baja un PDF válido (cabecera, una página A4, imagen JPEG, fin)', raw.startswith(b'%PDF-1.4') and raw.rstrip().endswith(b'%%EOF') and b'/Count 1' in raw and b'/DCTDecode' in raw and b'595.28' in raw and dl.suggested_filename == 'presupuesto-ana-gomez.pdf', dl.suggested_filename)
    if subprocess.run(['which', 'pdfinfo'], capture_output=True).returncode == 0:
        info = subprocess.run(['pdfinfo', ruta], capture_output=True, text=True).stdout
        T.v('pdfinfo lo lee: 1 página A4', 'Pages:           1' in info and 'A4' in info, info)
    pg.wait_for_timeout(300); url = pg.evaluate('window.__abierto') or ''
    T.v('abre el chat de la clienta (57 + su número) con el mensaje escrito', url.startswith('https://wa.me/573001234567?text=') and 'Hola Ana' in urllib.parse.unquote(url) and '$172.000' in urllib.parse.unquote(url) and 'falta $122.000' in urllib.parse.unquote(url), urllib.parse.unquote(url))
    T.v('avisa que hay que adjuntar el PDF', 'Adjunta el PDF' in pg.inner_text('.pp-msg'))
    os.system('pdftoppm -r 60 -png %s %s' % (ruta, ruta[:-4]))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    T.v('Escape cierra la ventana y devuelve el foco al botón', pg.locator('.pp-fondo').count() == 0 and 'presupuesto' in pg.evaluate("document.activeElement.textContent").lower())
    T.v('el pedido no cambió (total, abono, estado)', json.loads(pg.evaluate("localStorage.getItem('rosinaAgenda')"))['ag-p1-totalcompra'] == '$ 172.000')
    pg.click(f(1) + ' button'); pg.wait_for_selector('.pp-fondo'); pg.click('.pp-botones button:has-text("Cerrar")'); pg.wait_for_timeout(200)
    T.v('«Cerrar» también cierra', pg.locator('.pp-fondo').count() == 0)
    T.v('sin errores de JavaScript (computador)', not pg.errs, pg.errs)
    # celular con «Compartir»
    ctx2 = contexto(b, 390, 844, datos=DATOS, config_abierta=False); ctx2.add_init_script(STUB_SI)
    pc = abrir(ctx2, 'control-pedidos', 2300, config=False); abrir_fichas(pc)
    pc.click(f(1) + ' button'); pc.wait_for_selector('.pp-fondo', timeout=8000); pc.click('.pp-botones button:has-text("WhatsApp")'); pc.wait_for_timeout(500)
    com = pc.evaluate("window.__com")
    T.v('en el celular abre «Compartir» con el PDF y el mensaje', com and com['tipo'] == 'application/pdf' and com['tam'] > 20000 and com['n'].endswith('.pdf') and 'Hola Ana' in com['texto'], com)
    T.v('la ventana cabe en el celular sin desplazamiento horizontal', pc.evaluate("document.querySelector('.pp-caja').scrollWidth <= document.querySelector('.pp-caja').clientWidth + 1"))
    T.v('sin errores de JavaScript (celular)', not pc.errs, pc.errs)
    # sin WhatsApp de la clienta
    pc.keyboard.press('Escape'); pc.click(f(3) + ' button'); pc.wait_for_selector('.pp-fondo'); T.v('sin teléfono avisa que hay que elegir el chat', 'no tiene WhatsApp' in pc.inner_text('.pp-nota'))
    b.close()
T.fin()

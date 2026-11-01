"""Prueba el aviso cuando la agenda no puede guardar (espacio del navegador lleno) y el medidor de espacio (30-oct-2026, auditoría C1)."""
import sys, json; sys.path.insert(0, __file__.rsplit('/', 1)[0])
from agenda_util import *
T = Prueba()
LLENAR = """(modo)=>{ const g='x'.repeat(100000); let i=0; try{ for(;i<200;i++) localStorage.setItem('relleno'+i,g);}catch(e){}
  if(modo==='lleno'){ const p='y'.repeat(1000); try{ for(let j=0;j<5000;j++) localStorage.setItem('chico'+j,p);}catch(e){} }
  else { /* deja un 12 % libre: borra los últimos */ for(let k=i-1;k>i-6;k--) localStorage.removeItem('relleno'+k); } }"""
VACIAR = "()=>{ Object.keys(localStorage).filter(k=>/^(relleno|chico)/.test(k)).forEach(k=>localStorage.removeItem(k)); }"
EDITAR = "(t)=>{const e=document.getElementById('ag-p1-cliente'); e.value=t; e.dispatchEvent(new Event('input',{bubbles:true}));}"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    for ancho in (1280, 390):
        n = '%d px: ' % ancho
        ctx = contexto(b, ancho, 800); pg = abrir(ctx, '', 1500, config=False)
        T.v(n + 'con espacio de sobra no hay aviso y el medidor dice cuánto se usa', pg.locator('#aviso-sin-guardar').is_hidden())
        pg.evaluate(LLENAR, 'lleno'); pg.evaluate(EDITAR, 'Clienta importante ' * 50); pg.wait_for_timeout(1200)
        T.v(n + 'con el navegador lleno aparece el aviso rojo (rol alerta) y dice que no se guardó', pg.locator('#aviso-sin-guardar').is_visible() and pg.get_attribute('#aviso-sin-guardar', 'role') == 'alert' and 'No se pudo guardar' in pg.inner_text('#aviso-sin-guardar'))
        T.v(n + 'lo que no se pudo guardar sigue en pantalla (no se pierde al fallar)', 'Clienta importante' in pg.evaluate("document.getElementById('ag-p1-cliente').value"))
        with pg.expect_download(timeout=5000) as dl: pg.click('#asg-copia')
        T.v(n + '«Descargar una copia ahora» rescata el texto que no se alcanzó a guardar', 'Clienta importante' in open(dl.value.path()).read())
        if ancho == 390: pg.screenshot(path='/tmp/claude-0/-home-user-WEB/e30344ec-58b1-5323-9c0b-85d6933c6ac1/scratchpad/aviso-sin-guardar-390.png')
        pg.evaluate(VACIAR); pg.evaluate(EDITAR, 'Ya cabe'); pg.wait_for_timeout(1200)
        T.v(n + 'al liberar espacio y guardar de nuevo, el aviso desaparece solo', pg.locator('#aviso-sin-guardar').is_hidden())
        pg.evaluate(LLENAR, 'casi'); pg.evaluate("window.lrMedirEspacio()")
        pct = pg.evaluate("window.lrMedirEspacio()")
        T.v(n + 'cerca del límite (≥ 80 %) sale el aviso amarillo preventivo', pct >= 80 and pg.locator('#aviso-sin-guardar.lleno').is_visible(), pct)
        pg.evaluate(VACIAR); pg.evaluate("window.lrMedirEspacio()")
        T.v(n + 'sin relleno el aviso preventivo se quita', pg.locator('#aviso-sin-guardar').is_hidden())
        pg.evaluate("window.lrAgendaConfig && window.lrAgendaConfig.abrir(true)"); pg.click('#donde-datos summary'); pg.wait_for_timeout(300)
        T.v(n + 'el apartado «¿Dónde se guardan mis datos?» muestra el porcentaje de espacio', '%' in pg.inner_text('#dd-espacio'), pg.inner_text('#dd-espacio'))
        T.v(n + 'sin desplazamiento horizontal ni errores', pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1") and not pg.errs, pg.errs[:2]); ctx.close()
    b.close()
T.fin()

"""«Mi cuenta» de la agenda (js/agenda/mi-cuenta.js, 4-nov-2026): menú único, perfil, ícono, nombre del negocio, lupa arriba, Dictar/Lápiz por aparato y que las imágenes no sobresalgan."""
from agenda_util import *
T = Prueba()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
    for nom, w, h, kw in (('celular', 390, 844, {'has_touch': True, 'is_mobile': True}), ('computador', 1280, 800, {})):
        pg = abrir(contexto(b, w, h, config_abierta=False, **kw), '', 2000, config=False)
        T.v('%s: arriba solo se ve la foto de Mi cuenta (sin engranaje, idioma ni cuenta sueltos)' % nom, pg.is_visible('#mc-boton') and not any(pg.is_visible(s) for s in ('#agenda-config-btn', '.agenda-idioma', '.boton-cuenta-header')))
        T.v('%s: la lupa está arriba, junto a la foto' % nom, pg.evaluate("(()=>{const l=document.getElementById('buscar-lupa'),a=document.getElementById('mc-boton');return !!l&&l.closest('header')!==null&&l.nextElementSibling===a})()"))
        pg.click('#mc-boton'); T.v('%s: el menú abre con Configuración, Idioma y Mi membresía' % nom, all(pg.locator('#mc-menu').get_by_text(t).first.is_visible() for t in ('Configuración', 'Idioma', 'Mi membresía')))
        pg.click('text=Mi perfil y mi foto'); pg.wait_for_timeout(400)
        pg.click('button[data-av=animal-tortuga]'); pg.fill('#mc-negocio', 'Lanitas de Ana'); pg.click('.mc-caja .boton-primario'); pg.wait_for_timeout(400)
        d = pg.evaluate("JSON.stringify(window.lrAgendaNucleo.datos()._perfil)")
        T.v('%s: guarda el ícono y el nombre del negocio' % nom, '"animal-tortuga"' in d and 'Lanitas de Ana' in d, d)
        T.v('%s: la foto de arriba cambia al ícono elegido' % nom, pg.evaluate("document.querySelector('#mc-boton img').src").endswith('tortuga.webp'))
        pg.click('#mc-boton'); pg.click('text=Mi perfil y mi foto'); pg.wait_for_timeout(400)
        T.v('%s: ninguna imagen sobresale de su cuadro' % nom, pg.evaluate("[...document.querySelectorAll('.mc-op')].every(o=>{const a=o.getBoundingClientRect(),i=o.querySelector('img').getBoundingClientRect();return i.left>=a.left-0.5&&i.right<=a.right+0.5&&i.top>=a.top-0.5&&i.bottom<=a.bottom+0.5})"))
        pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
        T.v('%s: sin errores de JavaScript' % nom, not pg.errs, pg.errs[:2])
    # Dictar solo en computador; Lápiz solo en tabletas y dentro del menú
    for nom, w, h, kw, dic, lap in (('computador', 1280, 800, {}, True, False), ('celular', 390, 844, {'has_touch': True, 'is_mobile': True}, False, False), ('tableta', 820, 1180, {'has_touch': True, 'is_mobile': True}, False, True)):
        pg = abrir(contexto(b, w, h, config_abierta=False, **kw), '', 1800, config=False); pg.click('#mc-boton')
        T.v('%s: Dictar %s' % (nom, 'visible' if dic else 'oculto'), pg.evaluate("(()=>{const e=document.querySelector('.voz-global');return !!e&&getComputedStyle(e).display!=='none'})()") == dic)
        T.v('%s: Lápiz en el menú %s y nunca como botón fijo' % (nom, 'sí' if lap else 'no'), pg.evaluate("(()=>{const e=document.getElementById('mc-lapiz');return !!e&&!e.hidden})()") == lap and pg.evaluate("getComputedStyle(document.getElementById('tinta-modo')).display") == 'none')
    b.close()
T.fin()

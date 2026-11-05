#!/usr/bin/env python3
"""Fotos de la agenda en claro y oscuro, en celular (390 px) y computador (1280 px), con datos de ejemplo (E19, 5-nov-2026).
Uso (con la web servida en el puerto 8765: `python3 -m http.server 8765` desde la raíz):
    python3 herramientas/agenda-oscuro/fotos.py SALIDA [hoja ...]
Sin hojas, saca todas. También corre la revisión de contraste (axe-lite propia: compara el color del texto con el fondo real) y la imprime por sección."""
import datetime, json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'pruebas'))
from agenda_util import *

hoy = datetime.date.today(); f = lambda d: d.strftime('%d/%m/%Y'); d = lambda n: hoy + datetime.timedelta(days=n)
mes_ant = (hoy.replace(day=1) - datetime.timedelta(days=1)); iso = lambda x: x.strftime('%Y-%m-%d')
DATOS = {'ag-duena': 'Sara', 'ag-negocio': 'Lana Rosa',
  'ag-f1-proyecto': 'Chal', 'ag-f1-estado': 'Terminado', 'ag-f2-proyecto': 'Gorro', 'ag-f2-estado': 'Tejiendo', 'ag-f3-proyecto': 'Manta', 'ag-f3-estado': 'Por empezar', 'ag-f3-fecha': f(d(10)), 'ag-f4-proyecto': 'Bolso', 'ag-f4-estado': 'Tejiendo',
  'ag-id1-tema': 'Pulpo', 'ag-id2-tema': 'Oso', 'ag-pt1-patron': 'Osito', 'ag-pt1-tejido': True, 'ag-pt2-patron': 'Gato', 'ag-ap1-tecnica': 'Punto bajo', 'ag-ap1-domino': True,
  'ag-l1-marca': 'Alize', 'ag-l1-color': 'Rosa', 'ag-l1-ovillos': '5', 'ag-l1-costo': '$ 8.000', 'ag-l1-minimo': '2', 'ag-l2-marca': 'Alize', 'ag-l2-ovillos': '3', 'ag-l3-marca': 'Gasa', 'ag-l3-ovillos': '0',
  'ag-c1-material': 'Lana', 'ag-c1-comprado': True, 'ag-c2-material': 'Ojos', 'ag-ag1-medida': '3',
  'ag-vt1-fecha': f(hoy), 'ag-vt1-producto': 'Osito', 'ag-vt1-precio': '$ 100.000', 'ag-vt1-costo': '$ 40.000', 'ag-vt2-fecha': f(mes_ant), 'ag-vt2-producto': 'Gorro', 'ag-vt2-precio': '$ 60.000',
  'ag-p1-cliente': 'Ana', 'ag-p1-estado': 'En proceso', 'ag-p1-totalcompra': '$ 80.000', 'ag-p1-abono': '$ 30.000', 'ag-p1-entrega': f(d(3)), 'ag-p2-cliente': 'Beto', 'ag-p2-estado': 'Entregado', 'ag-p2-totalcompra': '$ 50.000', 'ag-p2-abono': '$ 50.000',
  'ag-cl1-nombre': 'Ana', 'ag-cl1-desde': f(hoy), 'ag-cl2-nombre': 'Beto', 'ag-cl2-desde': f(d(-200)),
  'ag-dr1-fecha': f(hoy), 'ag-dr1-animo': '😊 Feliz', 'ag-dr1-teji': 'Un gorro', 'ag-pa1': True, 'ag-pa2': True, 'ag-pa3': True,
  '_metaVentas': {'metas': {'%d-%02d' % (hoy.year, hoy.month): 500000}, 'margen': ''},
  '_fin': {'fijos': [{'id': 'a', 'n': 'Arriendo del taller', 'c': 'Arriendo', 'v': 400000, 't': 'g', 'activo': True, 'dia': '28', 'desde': hoy.strftime('%Y-%m'), 'saltados': []}, {'id': 'd', 'n': 'Ahorro', 'c': 'Ahorro', 'v': 100000, 't': 'a', 'activo': True, 'dia': '28', 'desde': hoy.strftime('%Y-%m'), 'saltados': []}],
           'deudas': [{'id': 'x', 'n': 'Préstamo', 'cuota': 80000, 'cuotas': '10', 'pagadas': '3', 'dia': '10'}],
           'movs': [{'id': '1', 't': 'i', 'f': iso(hoy), 'v': 500000, 'c': 'Ventas', 'm': 'Efectivo', 'neg': True}, {'id': '2', 't': 'g', 'f': iso(hoy), 'v': 200000, 'c': 'Materiales', 'm': 'Efectivo', 'neg': True},
                    {'id': '3', 't': 'i', 'f': iso(mes_ant), 'v': 300000, 'c': 'Ventas', 'm': 'Efectivo', 'neg': True}], 'migrado': True}}
HOJAS = 'panel-agenda indice-agenda planeador-dia portada-agenda vision-anio prioridades-mes calendario-anual fin-resumen fin-movimientos fin-presupuesto fin-fijos tablero-agenda ficha-proyecto semana-tejiendo control-pedidos inventario-lanas mis-agujas lista-compras proyectos-fila coleccion-patrones anio-tejiendo fechas-especiales mis-clientas catalogo-precios ferias-mercados diario-tejido registro-pausas lo-que-aprendi hoja-puntos recursos-rosina mis-ideas prendas-medida disena-patron'.split()

# Revisión de contraste: por cada texto visible, color del texto contra el primer fondo opaco que tenga detrás
CONTRASTE = r"""() => {
  const pr = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
  const L = c => .2126 * lin(c.r) + .7152 * lin(c.g) + .0722 * lin(c.b);
  const mezcla = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const fondo = el => { const pila = []; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.backgroundImage !== 'none' && !/gradient/.test(cs.backgroundImage) ) return null; if (/gradient/.test(cs.backgroundImage)) return null; const c = pr(cs.backgroundColor); if (c && c.a > 0) { pila.push(c); if (c.a >= .99) break; } }
    let base = { r: 255, g: 255, b: 255, a: 1 }; if (document.documentElement.getAttribute('data-modo') === 'oscuro') base = { r: 22, g: 19, b: 26, a: 1 }; for (let i = pila.length - 1; i >= 0; i--) base = mezcla(pila[i], base); return base; };
  const res = [], vistos = new Set();
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) { const t = w.currentNode; if (!t.nodeValue.trim()) continue; const el = t.parentElement; if (!el || vistos.has(el)) continue; vistos.add(el);
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue; const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    let vis = true; for (let e = el; e; e = e.parentElement) { const c2 = getComputedStyle(e); if (c2.display === 'none' || c2.visibility === 'hidden') { vis = false; break; } } if (!vis) continue;
    if (el.closest('.no-imprimir') === null && false) continue;
    const fg = pr(cs.color), bg = fondo(el); if (!fg || !bg) continue; const f2 = fg.a < 1 ? mezcla(fg, bg) : fg;
    const l1 = L(f2), l2 = L(bg), cr = (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
    const grande = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
    if (cr < (grande ? 3 : 4.5)) res.push({ cr: Math.round(cr * 100) / 100, t: t.nodeValue.trim().slice(0, 40), c: el.tagName.toLowerCase() + (el.className && el.className.baseVal === undefined ? '.' + String(el.className).trim().split(/\s+/).slice(0, 2).join('.') : ''), fg: cs.color, bg: 'rgb(' + [bg.r, bg.g, bg.b].map(Math.round).join(',') + ')' }); }
  return res; }"""

def main():
    out = sys.argv[1]; hojas = sys.argv[2:] or HOJAS; os.makedirs(out, exist_ok=True)
    resumen = {}
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROMIUM, args=['--no-sandbox'])
        for modo in ('claro', 'oscuro'):
            for nombre, (w, h) in (('cel', (390, 844)), ('pc', (1280, 900))):
                ctx = contexto(b, w, h, datos=DATOS, config_abierta=False)
                ctx.add_init_script("localStorage.setItem('lrAgendaModo','%s');localStorage.setItem('lrAgendaTour','1');" % modo)
                pg = abrir(ctx, '', 2200, config=False)
                def foto(n, completa=True):
                    pg.wait_for_timeout(450)
                    pg.screenshot(path='%s/%s-%s-%s.png' % (out, n, modo, nombre), full_page=completa, clip=None) if False else pg.screenshot(path='%s/%s-%s-%s.png' % (out, n, modo, nombre), full_page=completa)
                    fallas = pg.evaluate(CONTRASTE); resumen.setdefault((modo, nombre), {})[n] = fallas
                for i in range(7):
                    pg.evaluate("document.querySelectorAll('.pestana')[%d].click()" % i); foto('seccion%d' % i)
                for hid in hojas:
                    pg.evaluate("window.lrIrAHoja('%s')" % hid); foto(hid)
                pg.evaluate("window.lrAgendaConfig.abrir()"); foto('configuracion')
                pg.evaluate("window.lrAgendaConfig.cerrar()"); pg.evaluate("window.lrIrAHoja('panel-agenda')")
                if pg.locator('#mc-boton').count():
                    pg.evaluate("document.querySelector('#mc-boton').click()"); foto('micuenta', False); pg.keyboard.press('Escape'); pg.evaluate("document.querySelector('#mc-menu') && (document.querySelector('#mc-menu').hidden = true)")
                if pg.locator('.rc-boton').count():
                    pg.evaluate("document.querySelector('.rc-boton').click()"); pg.wait_for_timeout(600); foto('rosina', False)
                    pg.evaluate("document.querySelector('.rc-panel').classList.remove('abierto')")
                pg.goto(BASE + '/agenda-rosina.html?tour=1'); pg.wait_for_timeout(2200); foto('tutorial', False)
                ctx.close()
        b.close()
    for (modo, nombre), por in sorted(resumen.items()):
        tot = sum(len(v) for v in por.values()); print('%s %s: %d textos con contraste bajo' % (modo, nombre, tot))
        for n, v in por.items():
            if v: print('   %s: %s' % (n, '; '.join('%s «%s» %s/%s %s' % (x['c'], x['t'], x['fg'], x['bg'], x['cr']) for x in v[:4])))

main()

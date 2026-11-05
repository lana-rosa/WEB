#!/usr/bin/env python3
"""Genera css/agenda-oscuro.css (modo oscuro de la agenda, E19 + E25 + E26, 5-nov-2026).

Lee los estilos de la agenda (los mismos archivos y bloques <style> que carga agenda-rosina.html, en el mismo orden)
y, por cada regla que lleva colores literales, escribe la regla "gemela" para html[data-modo="oscuro"]
con los colores pasados a su versión oscura. Así el modo oscuro sigue a los cambios del modo claro: cuando cambies un
color en un css de la agenda, corre este script otra vez:

    python3 herramientas/agenda-oscuro/generar_oscuro.py

Reglas del cambio de colores (todo medido para que el texto llegue a >= 4,5:1):
  - fondos claros (blanco, rosados, lilas, azules suaves, grises claros) -> fondos oscuros del mismo tono, más apagados;
  - fondos vivos (botones de color, barras, fichas de color) -> se quedan igual;
  - textos oscuros (negro, gris, colores fuertes) -> versión clara del mismo tono; el texto blanco se queda;
  - líneas y bordes claros -> oscuros; líneas translúcidas oscuras -> translúcidas claras;
  - si una regla tiene un fondo vivo que se queda, su texto no se toca.
Lo que no se puede resolver solo (íconos con fondo claro, la hoja de dibujo, impresión, imágenes) va a mano en
herramientas/agenda-oscuro/manual.css, que se pega al final.
El archivo sale envuelto en @media screen: al imprimir siempre sale en claro.
"""
import colorsys, os, re, sys

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
HTML = os.path.join(RAIZ, 'agenda-rosina.html')
SALIDA = os.path.join(RAIZ, 'css', 'agenda-oscuro.css')
MANUAL = os.path.join(os.path.dirname(__file__), 'manual.css')
ATTR = 'html[data-modo="oscuro"]'

# ---------- colores ----------
SUPERFICIE = (0x21, 0x1D, 0x27)      # tarjetas y paneles
FONDO = (0x16, 0x13, 0x1A)           # fondo de la página
SUPERFICIE2 = (0x2A, 0x25, 0x31)     # el fondo más claro sobre el que debe leerse el texto


def hexrgb(h):
    h = h.lstrip('#')
    if len(h) in (3, 4):
        h = ''.join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def tohex(rgb):
    return '#%02X%02X%02X' % tuple(max(0, min(255, round(v))) for v in rgb)


def lum(rgb):
    f = [(v / 255 / 12.92) if v / 255 <= 0.03928 else ((v / 255 + 0.055) / 1.055) ** 2.4 for v in rgb]
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]


def contraste(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def hls(rgb):
    h, l, s = colorsys.rgb_to_hls(*(v / 255 for v in rgb))
    return h, l, s


def desde_hls(h, l, s):
    return tuple(v * 255 for v in colorsys.hls_to_rgb(h % 1, max(0, min(1, l)), max(0, min(1, s))))


def neutro(rgb):
    return max(rgb) - min(rgb) <= 9


def bg_oscuro(rgb):
    """Devuelve el color de fondo en oscuro, o None si el fondo se queda igual."""
    h, l, s = hls(rgb)
    if tuple(rgb) == (255, 255, 255):
        return SUPERFICIE
    if neutro(rgb) and l >= 0.97:      # blanco hueso de la página
        return FONDO
    if neutro(rgb):
        if l < 0.5:
            return None
        return desde_hls(0.78, 0.13 + (1 - l) * 0.5, 0.10)
    if l >= 0.86:
        return desde_hls(h, 0.12 + (1 - l) * 0.75, min(s, 1) * 0.5)
    return None                        # vivo o intermedio: se queda


def fg_claro(rgb):
    """Color de texto en oscuro (o None si ya es claro)."""
    h, l, s = hls(rgb)
    if l >= 0.62:
        return None
    nl = max(0.70, min(0.93, 1.05 - l * 0.65)) if not neutro(rgb) else min(0.93, 1.05 - l * 0.65)
    ns = min(s, 0.85) * 0.92 if not neutro(rgb) else 0.07
    hh = h if not neutro(rgb) else 0.78
    c = desde_hls(hh, nl, ns)
    while contraste(c, SUPERFICIE2) < 5.0 and nl < 0.97:
        nl += 0.02
        c = desde_hls(hh, nl, ns)
    return c


def borde_oscuro(rgb):
    h, l, s = hls(rgb)
    if tuple(rgb) == (255, 255, 255):
        return (0x3B, 0x34, 0x44)
    if neutro(rgb):
        if l >= 0.5:
            return desde_hls(0.78, 0.17 + (1 - l) * 0.55, 0.09)
        return fg_claro(rgb)
    if l >= 0.7:
        return desde_hls(h, 0.20 + (1 - l) * 0.9, min(s, 1) * 0.40)
    if l < 0.5:
        return fg_claro(rgb)
    return None


# ---------- lectura de colores dentro de un valor ----------
RE_COLOR = re.compile(r'#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3,4}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b(?:white|black)\b', re.I)
RE_PROTEGIDO = re.compile(r'url\([^)]*\)|var\([^()]*(?:\([^)]*\))?[^()]*\)|"[^"]*"|\'[^\']*\'', re.I)


def a_rgba(tok):
    t = tok.strip().lower()
    if t == 'white':
        return (255, 255, 255), 1.0
    if t == 'black':
        return (0, 0, 0), 1.0
    if t.startswith('#'):
        raw = t[1:]
        if len(raw) in (3, 4):
            raw = ''.join(c * 2 for c in raw)
        a = int(raw[6:8], 16) / 255 if len(raw) == 8 else 1.0
        return hexrgb(raw[:6]), a
    m = re.match(r'(rgba?|hsla?)\((.*)\)$', t)
    if not m:
        return None
    p = [x.strip() for x in re.split(r'[,/ ]+', m.group(2)) if x.strip()]
    if len(p) < 3:
        return None
    try:
        a = float(p[3].rstrip('%')) / (100 if p[3].endswith('%') else 1) if len(p) > 3 else 1.0
        if m.group(1).startswith('rgb'):
            rgb = tuple(float(x.rstrip('%')) * (2.55 if x.endswith('%') else 1) for x in p[:3])
        else:
            h = float(p[0].replace('deg', '')) / 360
            s = float(p[1].rstrip('%')) / 100
            l = float(p[2].rstrip('%')) / 100
            rgb = desde_hls(h, l, s)
    except ValueError:
        return None
    return rgb, a


def escribir(rgb, a, tok_original):
    if a >= 0.999:
        return tohex(rgb)
    return 'rgba(%d, %d, %d, %s)' % (round(rgb[0]), round(rgb[1]), round(rgb[2]), ('%.3f' % a).rstrip('0').rstrip('.'))


def mapear_valor(valor, tipo, cuenta):
    """tipo: 'bg' | 'fg' | 'borde'. cuenta: dict que anota si algún fondo claro se quedó."""
    guardas = []

    def esconder(m):
        guardas.append(m.group(0))
        return '\x00%d\x00' % (len(guardas) - 1)
    v = RE_PROTEGIDO.sub(esconder, valor)

    def cambiar(m):
        tok = m.group(0)
        r = a_rgba(tok)
        if not r:
            return tok
        rgb, a = r
        if a < 0.02:
            return tok
        nuevo = None
        if tipo == 'bg':
            if neutro(rgb) and hls(rgb)[1] < 0.5 and a <= 0.2 and tuple(rgb) != (0, 0, 0):
                nuevo = (0xEF, 0xE9, 0xF1)          # velo oscuro suave -> velo claro suave
            elif tuple(rgb) == (255, 255, 255) and a < 0.5:
                nuevo = None                          # brillo blanco translúcido: sirve igual en oscuro
            elif a < 0.999 and tuple(rgb) == (255, 255, 255):
                nuevo = SUPERFICIE
            else:
                nuevo = bg_oscuro(rgb)
            if nuevo is None and hls(rgb)[1] >= 0.55 and a >= 0.5:
                cuenta['bg_claro_queda'] = True
        elif tipo == 'fg':
            if tuple(rgb) == (255, 255, 255):
                nuevo = None
            elif neutro(rgb) and hls(rgb)[1] < 0.5 and a < 0.7:
                nuevo = (0xEF, 0xE9, 0xF1)
            else:
                nuevo = fg_claro(rgb)
        else:  # borde
            if tuple(rgb) == (255, 255, 255) and a < 0.9:
                nuevo = None
            elif neutro(rgb) and hls(rgb)[1] < 0.5 and a < 0.5:
                nuevo = (0xEF, 0xE9, 0xF1)
            else:
                nuevo = borde_oscuro(rgb)
        if nuevo is None:
            return tok
        cuenta['cambio'] = True
        return escribir(nuevo, a, tok)
    v = RE_COLOR.sub(cambiar, v)
    return re.sub('\x00(\\d+)\x00', lambda m: guardas[int(m.group(1))], v)


# ---------- CSS ----------
def sin_comentarios(s):
    return re.sub(r'/\*.*?\*/', '', s, flags=re.S)


def bloques(css):
    """[(prelude, cuerpo)] de primer nivel, respetando llaves anidadas, comillas y paréntesis."""
    out, i, n = [], 0, len(css)
    while i < n:
        # prelude hasta { o ;
        j, par, com = i, 0, None
        while j < n:
            c = css[j]
            if com:
                if c == com:
                    com = None
            elif c in '"\'':
                com = c
            elif c == '(':
                par += 1
            elif c == ')':
                par -= 1
            elif par == 0 and c in '{;':
                break
            j += 1
        if j >= n:
            break
        pre = css[i:j].strip()
        if css[j] == ';':
            if pre:
                out.append((pre, None))
            i = j + 1
            continue
        d, k, com = 1, j + 1, None
        while k < n and d:
            c = css[k]
            if com:
                if c == com:
                    com = None
            elif c in '"\'':
                com = c
            elif c == '{':
                d += 1
            elif c == '}':
                d -= 1
            k += 1
        out.append((pre, css[j + 1:k - 1]))
        i = k
    return out


def partir_decl(cuerpo):
    out, ini, par, com = [], 0, 0, None
    for i, c in enumerate(cuerpo):
        if com:
            if c == com:
                com = None
        elif c in '"\'':
            com = c
        elif c == '(':
            par += 1
        elif c == ')':
            par -= 1
        elif c == ';' and par == 0:
            out.append(cuerpo[ini:i])
            ini = i + 1
    out.append(cuerpo[ini:])
    res = []
    for d in out:
        if ':' not in d:
            continue
        p, v = d.split(':', 1)
        res.append((p.strip(), v.strip()))
    return res


def tipo_prop(p):
    p = p.lower()
    if p in ('background', 'background-color', 'background-image'):
        return 'bg'
    if p in ('color', 'fill', 'stroke', 'caret-color', 'text-decoration-color', '-webkit-text-fill-color', 'column-rule-color'):
        return 'fg'
    if p.startswith('border') or p.startswith('outline'):
        return 'borde'
    if p == 'box-shadow' or p == 'text-shadow':
        return 'sombra'
    if p.startswith('--'):
        n = p[2:]
        if any(k in n for k in ('boton', 'sobre', 'rgb', 'rueda', 'img', 'font', 'radio', 'sombra', 'gap', 'ancho', 'alto', 'tam')):
            return None
        if any(k in n for k in ('fg', 'texto', 'tinta', 'ink', 'letra')):
            return 'fg'
        if any(k in n for k in ('borde', 'border', 'linea', 'raya')):
            return 'borde'
        if any(k in n for k in ('bg', 'fondo', 'suave', 'tinte', 'claro', 'tono', 'blanco', 'papel', 't1', 't2', 'marfil', 'crema', 'hueso')):
            return 'bg'
        return 'bg?'      # sin pista en el nombre: se decide por el color (solo si es un tinte claro)
    return None


def prefijar(sel):
    """Selector de la regla gemela en modo oscuro."""
    sel = sel.strip()
    if sel in (':root', 'html'):
        return ATTR
    m = re.match(r'(?:html|:root)((?:\.[\w-]+|\[[^\]]*\]|:[\w-]+(?:\([^)]*\))?)*)(?=$|[\s>+~])(.*)$', sel, re.S)
    if m:
        return ATTR + m.group(1) + m.group(2)
    return ATTR + ' ' + sel


def separar_selectores(pre):
    out, ini, par, br = [], 0, 0, 0
    for i, c in enumerate(pre):
        if c == '(':
            par += 1
        elif c == ')':
            par -= 1
        elif c == '[':
            br += 1
        elif c == ']':
            br -= 1
        elif c == ',' and par == 0 and br == 0:
            out.append(pre[ini:i])
            ini = i + 1
    out.append(pre[ini:])
    return [s.strip() for s in out if s.strip()]


VARS_UNICAS = {}
TEXTO_DE_MARCA = ('--rosa-principal', '--rosa-boton', '--rosa-boton-hover', '--rosa-hover')


def recoger_vars(css):
    vistos = {}
    for pre, cuerpo in bloques(css):
        if cuerpo is None or pre.startswith('@keyframes'):
            continue
        if pre.startswith('@'):
            recoger_vars(cuerpo) if False else None
            for k, v in recoger_vars_bloque(cuerpo).items():
                vistos.setdefault(k, set()).update(v)
            continue
        for p, v in partir_decl(cuerpo):
            if p.startswith('--') and RE_COLOR.fullmatch(v.strip()):
                vistos.setdefault(p, set()).add(v.strip().lower())
    return vistos


def recoger_vars_bloque(cuerpo):
    return recoger_vars(cuerpo)


def regla_oscura(pre, cuerpo):
    decls = partir_decl(cuerpo)
    cuenta = {}
    # 1) fondos primero: si queda un fondo claro vivo, el texto no se toca
    nuevas = []
    for p, v in decls:
        t = tipo_prop(p)
        if t == 'bg' and not p.startswith('--'):
            nv = mapear_valor(re.sub(r'\s*!important\s*$', '', v), 'bg', cuenta)
            if True:   # siempre: la gemela debe conservar el orden de fuerza entre reglas (también 'transparent', 'none', 'var(...)')
                nuevas.append((p, nv, v))
    for p, v in decls:
        t = tipo_prop(p)
        imp = bool(re.search(r'!important\s*$', v))
        base = re.sub(r'\s*!important\s*$', '', v)
        if t == 'fg' and not p.startswith('--'):
            if cuenta.get('bg_claro_queda'):
                continue
            mv = re.fullmatch(r'var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)', base.strip())
            if mv and mv.group(1) in TEXTO_DE_MARCA:
                nv = 'var(--rosa-texto)'
            elif mv and len(VARS_UNICAS.get(mv.group(1), ())) == 1:
                r = a_rgba(next(iter(VARS_UNICAS[mv.group(1)])))
                c = fg_claro(r[0]) if r and r[1] > 0.99 else None
                nv = tohex(c) if c else base
            else:
                nv = mapear_valor(base, 'fg', cuenta)
            if nv == base:
                nuevas.append((p, base, v)); continue
        elif t == 'borde':
            nv = mapear_valor(base, 'borde', cuenta)
        elif t in ('bg', 'fg') and p.startswith('--'):
            nv = mapear_valor(base, t, cuenta)
        elif t == 'bg?':
            m = RE_COLOR.fullmatch(base.strip())
            r = a_rgba(base) if m else None
            nv = mapear_valor(base, 'bg', cuenta) if (r and hls(r[0])[1] >= 0.86) else base
        elif t == 'borde' and p.startswith('--'):
            nv = mapear_valor(base, 'borde', cuenta)
        elif t == 'sombra':
            nv = mapear_valor(base, 'bg', {}) if re.search(r'#fff\b|#ffffff|\bwhite\b', base, re.I) else base
        else:
            continue
        if nv != base or (t == 'fg') or (t == 'borde' and (re.fullmatch(r'(border|outline)(-(top|right|bottom|left))?', p.lower()) or p.lower().endswith('-color'))):
            nuevas.append((p, nv, v))
    # 'bg' ya añadidos arriba: evitar duplicados
    vistos, final = set(), []
    for p, nv, v in nuevas:
        if (p, nv) in vistos:
            continue
        vistos.add((p, nv))
        final.append('%s: %s%s' % (p, nv, ' !important' if re.search(r'!important\s*$', v) else ''))
    if not final:
        return None
    sels = ',\n'.join(prefijar(s) for s in separar_selectores(pre))
    return '%s { %s; }' % (sels, '; '.join(final))


def convertir(css, profundidad=0):
    out = []
    for pre, cuerpo in bloques(css):
        if cuerpo is None:
            continue
        pl = pre.lower()
        if pl.startswith('@keyframes') or pl.startswith('@-webkit-keyframes') or pl.startswith('@font-face') or pl.startswith('@page'):
            continue
        if pl.startswith('@media'):
            if re.search(r'\bprint\b', pl):
                continue
            inner = convertir(cuerpo, profundidad + 1)
            if inner:
                out.append('%s {\n%s\n}' % (pre, inner))
            continue
        if pl.startswith('@supports') or pl.startswith('@layer') or pl.startswith('@container'):
            inner = convertir(cuerpo, profundidad + 1)
            if inner:
                out.append('%s {\n%s\n}' % (pre, inner))
            continue
        if pl.startswith('@'):
            continue
        r = regla_oscura(pre, cuerpo)
        if r:
            out.append(r)
    return '\n'.join(out)


def fuentes():
    html = open(HTML, encoding='utf-8').read()
    # orden del documento: <link rel=stylesheet> y <style>
    piezas = []
    for m in re.finditer(r'<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>|<style[^>]*>(.*?)</style>', html, re.S):
        if m.group(1):
            href = m.group(1).split('?')[0]
            if href.startswith('/css/') and 'agenda-oscuro' not in href:
                piezas.append((href, open(os.path.join(RAIZ, href.lstrip('/')), encoding='utf-8').read()))
            # (las hojas externas, como fuentes de Google, no existen)
        else:
            piezas.append(('<style> de agenda-rosina.html', m.group(2)))
    # CSS que viven dentro de scripts (el aviso de cookies y el chat de Rosina)
    for js, ini in (('js/consentimiento.js', 'var css ='), ('js/rosina-chat.js', 'css.textContent =')):
        t = open(os.path.join(RAIZ, js), encoding='utf-8').read()
        i = t.index(ini); j = t.index(';\n', i)
        trozos = re.findall(r"'((?:[^'\\]|\\.)*)'", t[i:j])
        piezas.append(('%s (texto de estilos)' % js, ''.join(trozos).replace("\\'", "'")))
    return piezas


def main():
    partes = []
    todo = [(n, sin_comentarios(c)) for n, c in fuentes()]
    union = {}
    for n, c in todo:
        for k, v in recoger_vars(c).items():
            union.setdefault(k, set()).update(v)
    VARS_UNICAS.update(union)
    for nombre, css in todo:
        c = convertir(css)
        if c:
            partes.append('/* ---- de %s ---- */\n%s' % (nombre, c))
    manual = open(MANUAL, encoding='utf-8').read() if os.path.exists(MANUAL) else ''
    cab = ('/* MODO OSCURO de la agenda (E19 + E25 + E26, 5-nov-2026). ARCHIVO GENERADO: no se edita a mano.\n'
           '   Se crea con `python3 herramientas/agenda-oscuro/generar_oscuro.py` a partir de los estilos de la agenda\n'
           '   (colores) + herramientas/agenda-oscuro/manual.css (lo que se arregla a mano). Si cambias un color de la agenda, vuelve a correrlo.\n'
           '   Se activa con <html data-modo="oscuro"> (js/agenda/modo.js y el script del <head>). Solo en pantalla: al imprimir sale siempre en claro. */\n')
    cuerpo = '\n'.join(partes) + '\n/* ---- a mano (manual.css) ---- */\n' + manual
    texto = cab + '@media screen {\n' + cuerpo + '\n}\n'
    with open(SALIDA, 'w', encoding='utf-8') as f:
        f.write(texto)
    print('css/agenda-oscuro.css: %d reglas, %d KB' % (cuerpo.count('{') , len(texto.encode()) // 1024))


if __name__ == '__main__':
    sys.exit(main())

"""Agrega el logo de Lana Rosa (arriba) y los datos de contacto (abajo) a todo lo que se imprime
o se guarda en PDF desde las páginas del Rincón de Rosina. En pantalla no se ve.

Uso: python3 herramientas/marca_impresion.py archivo.html [otro.html ...]
Los generadores del glosario y las paletas lo llaman solos.
"""
import sys

INICIO = '<!-- marca-impresion -->'
FIN = '<!-- /marca-impresion -->'

ARRIBA = INICIO + '''
<style>
.marca-impresion { display: none; }
@media print {
  .marca-impresion { display: flex !important; align-items: center; gap: 12px; font-family: 'Hanken Grotesk', Arial, sans-serif; color: #45454A; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .marca-imp-arriba { justify-content: space-between; border-bottom: 2px solid #E74E96; padding: 0 0 8px; margin: 0 0 14px; }
  .marca-imp-arriba img { height: 46px; width: auto; border-radius: 8px; }
  .marca-imp-arriba span { font-size: 11px; color: #E74E96; font-weight: 700; }
  .marca-imp-abajo { justify-content: center; flex-wrap: wrap; gap: 4px 14px; border-top: 2px solid #E74E96; padding: 8px 0 0; margin: 18px 0 0; font-size: 10.5px; break-inside: avoid; }
  .marca-imp-abajo strong { color: #E74E96; }
}
</style>
<div class="marca-impresion marca-imp-arriba" aria-hidden="true"><img src="img/logo-lana-rosa.jpg" alt=""><span>Rincón de Rosina · lanarosacrochet.com</span></div>
''' + FIN

ABAJO = INICIO + '''
<div class="marca-impresion marca-imp-abajo" aria-hidden="true"><strong>Lana Rosa Crochet</strong><span>WhatsApp 320 507 2801</span><span>contacto@lanarosacrochet.com</span><span>lanarosacrochet.com</span><span>Instagram @lanarosacrochet</span><span>Villamaría, Caldas</span></div>
''' + FIN


def quitar(src):
    while INICIO in src:
        a = src.index(INICIO); b = src.index(FIN, a) + len(FIN)
        src = src[:a] + src[b:]
    return src


def aplicar(src):
    src = quitar(src)
    i = src.index('>', src.index('<body')) + 1
    src = src[:i] + '\n' + ARRIBA + src[i:]
    j = src.index('</main>') + len('</main>')
    return src[:j] + '\n' + ABAJO + src[j:]


if __name__ == '__main__':
    for ruta in sys.argv[1:]:
        s = open(ruta, encoding='utf-8').read()
        open(ruta, 'w', encoding='utf-8').write(aplicar(s))
        print('marca de impresión:', ruta)

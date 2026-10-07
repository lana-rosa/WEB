#!/usr/bin/env python3
"""Cambia los textos ESTÁTICOS que dicen "inauguración prevista" por los de tienda ya abierta.

Los textos visibles de las páginas ya cambian solos el 16-nov-2026 (js/apertura.js). Lo que un buscador o una IA
lee sin ejecutar JavaScript (respuestas de preguntas frecuentes en JSON-LD, llms.txt, texto base de la página
de la tienda física) se cambia con este script. Lo ejecuta solo el flujo .github/workflows/activar-apertura.yml
el 16-nov-2026, y también se puede correr a mano:

  python3 herramientas/activar_apertura.py --simular   # muestra qué cambiaría
  python3 herramientas/activar_apertura.py             # aplica los cambios

Es idempotente: si el texto nuevo ya está, no hace nada. Si no encuentra ni el viejo ni el nuevo, falla (alguien
cambió la frase y hay que actualizar esta lista).
"""
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
HORARIO = "Nuestra tienda física atiende de lunes a viernes de 7:30 a.m. a 6:15 p.m. y los sábados de 8:00 a.m. a 12:00 m."

CAMBIOS = [
    ("preguntas-frecuentes.html",
     "La inauguración de nuestra tienda física está prevista para el domingo 15 de noviembre de 2026. Atendemos pedidos de Manizales / Villamaría y de toda Colombia.\"",
     HORARIO + " Atendemos pedidos de Manizales / Villamaría y de toda Colombia.\""),
    ("merceria/preguntas-frecuentes/index.html",
     "La inauguración está prevista para el domingo 15 de noviembre de 2026. Mira la página de la tienda para la dirección, el horario y cómo llegar.\"",
     "Ya estamos abiertas. Mira la página de la tienda para la dirección, el horario y cómo llegar.\""),
    ("llms.txt",
     "Inauguración prevista: domingo 15 de noviembre de 2026.",
     "Tienda abierta al público desde el 16 de noviembre de 2026."),
    ("merceria/tienda-fisica/index.html",
     "id=\"visita-estado\">Inauguración prevista: domingo 15 de noviembre de 2026</p>",
     "id=\"visita-estado\">Ya estamos abiertas</p>"),
]

def main():
    simular = "--simular" in sys.argv
    fallos = 0
    for ruta, viejo, nuevo in CAMBIOS:
        p = RAIZ / ruta
        s = p.read_text(encoding="utf-8")
        if viejo in s:
            print(("[simulacro] " if simular else "[cambiado]  ") + ruta)
            if not simular:
                p.write_text(s.replace(viejo, nuevo), encoding="utf-8")
        elif nuevo in s:
            print("[ya estaba] " + ruta)
        else:
            print("[NO ENCONTRADO] " + ruta + ": el texto cambió, actualiza CAMBIOS en este script")
            fallos += 1
    sys.exit(1 if fallos else 0)

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Genera los audios de Rosina con un servicio de voz (hoy: ElevenLabs) a partir del guion y los deja en aventuras-de-rosina/audio/.

Antes de usarlo: la voz tiene que ser TUYA o estar autorizada para uso comercial (voz de la biblioteca del servicio con licencia comercial,
o una voz clonada con permiso escrito de su dueña). Ver LEEME.md de esta carpeta. NO se debe usar para copiar la voz de un audio de redes sociales.

  export ELEVENLABS_API_KEY=...      # tu llave (no se guarda en el repositorio)
  export ELEVENLABS_VOICE_ID=...     # el id de la voz elegida
  python3 herramientas/aventuras-de-rosina/audio/generar_audio.py --simular      # cuenta textos y caracteres, no gasta nada
  python3 herramientas/aventuras-de-rosina/audio/generar_audio.py --solo m1       # genera solo los textos de la misión 1
  python3 herramientas/aventuras-de-rosina/audio/generar_audio.py                 # genera todos los que falten
  python3 herramientas/aventuras-de-rosina/audio/actualizar_indice.py             # y luego actualiza el índice

Los archivos ya generados se conservan (para rehacer uno, bórralo). El guion se regenera con: node herramientas/aventuras-de-rosina/audio/guion_audio.mjs
"""
import argparse, json, os, sys, time, urllib.request, urllib.error

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, '..', '..', '..'))
CARPETA = os.path.join(RAIZ, 'aventuras-de-rosina', 'audio')


def sintetizar(texto, llave, voz, modelo):
    cuerpo = json.dumps({'text': texto, 'model_id': modelo, 'voice_settings': {'stability': 0.55, 'similarity_boost': 0.8, 'style': 0.25}}).encode('utf-8')
    req = urllib.request.Request('https://api.elevenlabs.io/v1/text-to-speech/%s?output_format=mp3_44100_128' % voz, data=cuerpo,
                                 headers={'xi-api-key': llave, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
    with urllib.request.urlopen(req, timeout=90) as r:
        return r.read()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--simular', action='store_true', help='solo cuenta, no llama al servicio')
    ap.add_argument('--solo', default='', help='prefijo del lugar, p. ej. m1 o "m2 historia"')
    ap.add_argument('--modelo', default='eleven_multilingual_v2')
    a = ap.parse_args()
    guion = json.load(open(os.path.join(AQUI, 'guion-audio.json'), encoding='utf-8'))
    pendientes = [f for f in guion if f['lugar'].startswith(a.solo) and not os.path.exists(os.path.join(CARPETA, f['clave'] + '.mp3'))]
    caracteres = sum(len(f['texto']) for f in pendientes)
    print('%d textos por generar (%d caracteres).' % (len(pendientes), caracteres))
    if a.simular or not pendientes:
        return 0
    llave, voz = os.environ.get('ELEVENLABS_API_KEY'), os.environ.get('ELEVENLABS_VOICE_ID')
    if not llave or not voz:
        print('Faltan ELEVENLABS_API_KEY y ELEVENLABS_VOICE_ID en el entorno.'); return 1
    for i, f in enumerate(pendientes, 1):
        try:
            datos = sintetizar(f['texto'], llave, voz, a.modelo)
        except urllib.error.HTTPError as e:
            print('Error %s en %s: %s' % (e.code, f['clave'], e.read()[:200])); return 1
        open(os.path.join(CARPETA, f['clave'] + '.mp3'), 'wb').write(datos)
        print('[%d/%d] %s · %s' % (i, len(pendientes), f['clave'], f['lugar']))
        time.sleep(0.4)
    print('Listo. Ahora corre actualizar_indice.py y revisa los audios escuchándolos.')
    return 0


if __name__ == '__main__':
    sys.exit(main())

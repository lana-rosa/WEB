// Personajes del Bosque Tejido. La biblia completa (personalidad, vocabulario, apariciones) está en
// herramientas/aventuras-de-rosina/BIBLIA-PERSONAJES.md; aquí solo lo que usa la aplicación.
// Rosina usa las poses oficiales de img/stickers/ y las nuevas de img/aventuras/rosina/, SIN el borde blanco de sticker para que combine con sus amigos (copias en img/aventuras/rosina-plana/, las genera quitar_borde_rosina.py; los originales no se tocan). Luna, Tito, Pipo y Bruno usan las poses planas de img/aventuras/plano/
// (POSES_PLANO, con sus medidas; las crea preparar_estilo_plano.py). Ver INVENTARIO-RECURSOS.md y BIBLIA-PERSONAJES.md.

// Rosina en el estilo ORIGINAL (decisión de Sara, 17-oct-2026): poses de 1024 px en img/aventuras/rosina-original/ (recortadas de sus hojas con
// herramientas/aventuras-de-rosina/recortar_hoja_hd.py). Las poses que aún no tienen dibujo propio usan una parecida (ver HOJA-DE-POSES en PENDIENTES.md).
export const POSES_ROSINA = {
  saludo: '/img/aventuras/rosina-original/saludo.webp',
  feliz: '/img/aventuras/rosina-original/feliz.webp',
  corazon: '/img/aventuras/rosina-original/corazon.webp',
  ovillo: '/img/aventuras/rosina-original/ovillo.webp',
  flor: '/img/aventuras/rosina-original/flor.webp',
  sentada: '/img/aventuras/rosina-original/abrazo.webp',
  idea: '/img/aventuras/rosina-original/idea.webp',
  leyendo: '/img/aventuras/rosina-original/leyendo.webp',
  cartel: '/img/aventuras/rosina-original/cartel.webp',
  animo: '/img/aventuras/rosina-original/pulgar.webp',
  gorro: '/img/aventuras/rosina-original/gorro.webp',
  abrazo: '/img/aventuras/rosina-original/abrazo.webp',
  saludoSentada: '/img/aventuras/rosina-original/senalando.webp',
  senalando: '/img/aventuras/rosina-original/senalando.webp',
  sorpresa: '/img/aventuras/rosina-original/sorpresa.webp',
  consuelo: '/img/aventuras/rosina-original/triste.webp',
  fuerza: '/img/aventuras/rosina-original/orgullosa.webp',
  salto: '/img/aventuras/rosina-original/salto.webp',
  beso: '/img/aventuras/rosina-original/beso.webp',
  sueno: '/img/aventuras/rosina-original/sueno.webp',
  corriendo: '/img/aventuras/rosina-original/corriendo.webp',
  aplaude: '/img/aventuras/rosina-original/aplaude.webp',
  llora: '/img/aventuras/rosina-original/llora.webp',
  celebra: '/img/aventuras/rosina-original/celebra.webp',
  risa: '/img/aventuras/rosina-original/risa.webp',
  triste: '/img/aventuras/rosina-original/triste.webp',
  orgullosa: '/img/aventuras/rosina-original/orgullosa.webp',
  pensando: '/img/aventuras/rosina-original/pensando.webp',
  enojada: '/img/aventuras/rosina-original/enojada.webp',
  tejiendo: '/img/aventuras/rosina-original/tejiendo.webp',
  gancho: '/img/aventuras/rosina-original/ovillo.webp',
  contando: '/img/aventuras/rosina-original/pensando.webp',
  mapa: '/img/aventuras/rosina-original/saludo.webp',
  diploma: '/img/aventuras/rosina-original/orgullosa.webp',
  lupa: '/img/aventuras/rosina-original/pensando.webp',
};

// Estilo de las escenas: ilustración plana como la Rosina oficial (decisión de Sara, 12-oct-2026). Rosina usa los stickers de arriba y sus amigos
// las poses de img/aventuras/plano/. Origen y licencia de las imágenes de los amigos por confirmar antes de publicar (ver INVENTARIO-RECURSOS.md).

// Poses disponibles de cada amigo en estilo plano, con su tamaño real (ancho, alto) para evitar saltos al cargar.
export const POSES_PLANO = {"bruno": {"celebra": [282, 428], "descansa": [260, 369], "piensa": [255, 411], "regalo": [253, 421], "saludo": [280, 436]}, "luna": {"celebra": [280, 439], "descansa": [261, 362], "flor": [263, 425], "piensa": [269, 432], "saludo": [268, 441]}, "pipo": {"animo": [279, 389], "corazon": [227, 354], "ovillo": [233, 367], "piensa": [225, 405], "saludo": [257, 402]}, "tito": {"celebra": [265, 375], "descansa": [314, 241], "lee": [248, 350], "piensa": [213, 375], "saludo": [251, 373]}};

export const PERSONAJES = {
  rosina: { nombre: 'Rosina', especie: 'ovejita', funcion: 'Guía creativa', color: '#cc1786' },
  luna: { nombre: 'Luna', especie: 'conejita', funcion: 'Paciencia y cadenetas', color: '#8E7BC4' },
  tito: { nombre: 'Tito', especie: 'tortuga', funcion: 'Observación y puntos', color: '#3E8F5B' },
  pipo: { nombre: 'Pipo', especie: 'pollito', funcion: 'Colores e inventos', color: '#B98700' },
  bruno: { nombre: 'Bruno', especie: 'osito', funcion: 'Regalos y gratitud', color: '#9A6428' },
};

// Amigos que el niño puede elegir como compañero en su pasaporte.
export const AMIGOS = ['luna', 'tito', 'pipo', 'bruno'];

// Colores para el Laboratorio de colores y el pasaporte (con nombre: nunca se usa solo el color para dar información).
export const PALETA = [
  { id: 'fucsia', nombre: 'Fucsia', hex: '#cc1786' },
  { id: 'rosa', nombre: 'Rosa', hex: '#ff66c4' },
  { id: 'lila', nombre: 'Lila', hex: '#9EA2F9' },
  { id: 'cielo', nombre: 'Azul cielo', hex: '#6DB6F2' },
  { id: 'menta', nombre: 'Verde menta', hex: '#5CCB9A' },
  { id: 'sol', nombre: 'Amarillo sol', hex: '#FFD23F' },
  { id: 'naranja', nombre: 'Naranja', hex: '#FF9F43' },
  { id: 'crema', nombre: 'Crema', hex: '#FFF1D6' },
];

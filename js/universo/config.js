// Configuración central del «Universo de Rosina» (Etapa 1). Cambiar un interruptor apaga la función sin tocar las páginas.
export const CONFIG = {
  REGALAR_ACTIVO: true,          // «Rosina te ayuda a regalar»
  CREAR_ACTIVO: true,            // «Rosina te ayuda a crear» (configurador de personalizados, Etapa 2)
  FICHA_VIDA_HORAS: 24,          // la ficha del configurador se recuerda en este dispositivo solo por este tiempo
  SUPABASE_URL: 'https://ngjoognzvehwjtpqwrqe.supabase.co',
  SUPABASE_KEY: 'sb_publishable_2TQ_piaHlSMHa79zjmOOXg_6bEwgkKD',
  // Las etiquetas de ocasión y «para quién» solo se ofrecen cuando hay al menos este número de productos con etiquetas revisadas
  // por Sara o el taller (columna revisado_en de producto_etiquetas). Antes, esos dos filtros no aparecen.
  MIN_ETIQUETADOS: 20,
  RESULTADOS_POR_SECCION: 12,
  WHATSAPP: '573205072801',
};

// Vocabulario (los ids son los que se guardan en producto_etiquetas)
export const OCASIONES = [
  ['cumpleanos', 'Cumpleaños'], ['amor_amistad', 'Amor y amistad'], ['dia_madre', 'Día de la madre'], ['dia_padre', 'Día del padre'],
  ['graduacion', 'Graduación'], ['dia_ingeniero', 'Día del Ingeniero Civil'], ['bebe', 'Llegada de un bebé'], ['diente', 'Cuando muda un diente'], ['mundial', 'Mundial de fútbol'],
  ['agradecimiento', 'Agradecimiento'], ['detalle', 'Un detalle pequeño'], ['decoracion', 'Para decorar'],
];
export const DESTINATARIOS = [
  ['mama', 'Mamá'], ['papa', 'Papá'], ['pareja', 'Mi pareja'], ['amiga_o', 'Una amiga o amigo'], ['nina_nino', 'Una niña o niño'],
  ['bebe', 'Un bebé'], ['colega_profe', 'Una profe o colega'], ['fan_personaje', 'Fan de un personaje'], ['fan_futbol', 'Fan del fútbol'], ['tu_mismo', 'Para mí'],
];
export const TIPOS = [
  ['amigurumi', 'Amigurumi', ['Amigurumis']], ['peluche', 'Peluche', ['Peluches']], ['llavero', 'Llavero', ['Llaveros']],
  ['flores', 'Flores y macetas', ['Flores', 'Macetas']], ['otro', 'Bolso o separador', ['Bolsos', 'Separadores de libros']],
];
export const PRESUPUESTOS = [
  ['p1', 'Hasta $20.000', 0, 20000], ['p2', '$20.000 a $50.000', 20001, 50000], ['p3', '$50.000 a $100.000', 50001, 100000],
  ['p4', '$100.000 a $200.000', 100001, 200000], ['p5', 'Más de $200.000', 200001, Infinity],
];
export const TAMANOS = [
  ['pequeno', 'Pequeño (hasta 12 cm)', 0, 12], ['mediano', 'Mediano (13 a 22 cm)', 12.01, 22], ['grande', 'Grande (más de 22 cm)', 22.01, Infinity],
];
export const DISPONIBILIDAD = [['ya', 'Solo lo que ya está en existencia']];

// ---- Configurador «Rosina te ayuda a crear» (Etapa 2) ----
// Todo sale de lo que ya publica el sitio (Personaliza, Preguntas frecuentes y Precios); el taller confirma o ajusta esta lista.
// [id, texto, tipo de producto del formulario de Personaliza, ejemplo para la idea]
export const IDEAS_CREAR = [
  ['persona', 'Una persona', 'Amigurumi', 'Ej: Mi mamá, con sus gafas, su cabello rizado y su vestido favorito.'],
  ['mascota', 'Una mascota', 'Amigurumi', 'Ej: Mi perrita, con su collar rojo y las orejas caídas.'],
  ['pareja', 'Una pareja (dos amigurumis)', 'Amigurumi', 'Ej: Nosotros dos, con la ropa de nuestra boda.'],
  ['personaje', 'Un personaje', 'Amigurumi', 'Ej: El personaje favorito de mi hijo, con sus colores.'],
  ['detalle', 'Un recuerdo pequeño (llavero)', 'Llavero', 'Ej: Mi gato, con sus manchas negras y blancas.'],
  ['regalo', 'Un regalo especial', 'Amigurumi', 'Ej: Mi hermana en su graduación, con toga y birrete.'],
];
// Los mismos tamaños de personaliza.html (tamanosPorTipo); la prueba comprueba que no se desordenen.
export const TAMANOS_CREAR = { Amigurumi: ['10 cm', '13 cm', '15 cm', '20 cm'], Llavero: ['4 cm', '5 cm', '6 cm'] };
// Detalles que la web ya dice que se pueden tejer (Preguntas frecuentes): [id, texto, pregunta]
export const DETALLES_CREAR = [
  ['gafas', 'Gafas', '¿Cómo son las gafas?'],
  ['ropa', 'Ropa específica', '¿Qué ropa lleva?'],
  ['ojos', 'Color de ojos', '¿De qué color son?'],
  ['accesorios', 'Accesorios', '¿Cuáles? (sombrero, collar, bolso…)'],
  ['cabello', 'Cabello o peinado', '¿Cómo es?'],
];
export const OCASIONES_CREAR = [
  ['cumpleanos', 'Cumpleaños'], ['amor_amistad', 'Amor y amistad'], ['dia_madre', 'Día de la madre'], ['dia_padre', 'Día del padre'],
  ['graduacion', 'Graduación'], ['bebe', 'Llegada de un bebé'], ['recuerdo', 'Un recuerdo especial'], ['sin_ocasion', 'Sin ocasión especial'],
];


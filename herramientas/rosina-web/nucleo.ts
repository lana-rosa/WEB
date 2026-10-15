// Lógica pura de Rosina (sin Deno ni red): códigos de producto, tarjetas, marcas de «sin dato» y limpieza de preguntas.
// Está aparte de index.ts para poder probarla con Node (herramientas/pruebas/probar_rosina_funcion.mjs).
// Principio: el modelo solo ELIGE productos por código; el nombre, el precio, la foto, el enlace y si hay existencias salen siempre
// del catálogo real. Si el modelo inventa un código, simplemente no sale tarjeta.

export type Regalo = {
  id: string; nombre: string; precio: number; categoria_web?: string | null; foto_url?: string | null;
  tiempo_elaboracion?: string | null; en_existencia?: boolean; personalizable_base?: boolean; es_personaje?: boolean;
};
export type Tienda = { id: string; descripcion_web?: string | null; especificaciones_web?: unknown; disponible_web?: boolean | null };
export type Tarjeta = {
  id: string; nombre: string; precio: number; foto: string; url: string;
  estado: "existencia" | "encargo" | "personalizado"; elaboracion: string | null; personaje: boolean;
};

export const MAX_TARJETAS = 3;
export const SITIO = "https://lanarosacrochet.com";
const cop = (n: number) => "$" + Math.round(Number(n) || 0).toLocaleString("es-CO");

export function estadoDe(r: Regalo): Tarjeta["estado"] {
  return r.personalizable_base ? "personalizado" : r.en_existencia ? "existencia" : "encargo";
}

// Asigna a cada producto de la web con foto un código corto (T1, T2…) según el orden del catálogo.
export function mapaDeCodigos(regalos: Regalo[]): Map<string, Regalo> {
  const m = new Map<string, Regalo>();
  regalos.forEach((r, i) => { if (r && r.id && r.nombre) m.set("T" + (i + 1), r); });
  return m;
}

// Línea del catálogo que ve el modelo para un producto con código. `colores` sale de img/productos/colores.json (puede faltar).
export function lineaCatalogo(codigo: string, r: Regalo, t: Tienda | undefined, colores: string[] | undefined): string {
  const estado = r.personalizable_base
    ? "se teje a pedido a partir de tu foto o idea (precio base de una pieza con detalle normal)"
    : r.en_existencia ? "en existencia ahora"
    : "por encargo: se teje cuando se pide" + (r.tiempo_elaboracion ? ` (elaboración: ${r.tiempo_elaboracion})` : "");
  const specs = t && Array.isArray(t.especificaciones_web) ? ` | ${(t.especificaciones_web as string[]).join("; ")}` : "";
  const desc = t && t.descripcion_web ? ` | ${String(t.descripcion_web).replace(/\s+/g, " ").slice(0, 160)}` : "";
  const col = colores && colores.length ? ` | colores: ${colores.join(", ")}` : "";
  return `- [${codigo}] ${r.nombre} | ${r.categoria_web || "Tienda"} | ${cop(r.precio)} | ${estado}${col}${specs}${desc}`;
}

function tarjetaDe(r: Regalo): Tarjeta {
  return {
    id: r.id, nombre: r.nombre, precio: Math.round(Number(r.precio) || 0), foto: r.foto_url || "",
    url: `/tienda.html?producto=${encodeURIComponent(r.id)}`,
    estado: estadoDe(r), elaboracion: r.tiempo_elaboracion || null, personaje: !!r.es_personaje,
  };
}

// Quita del texto las marcas [[T12]] y [[SIN_DATO]] y devuelve las tarjetas (hasta 3, sin repetir, solo de códigos reales).
export function procesarRespuesta(texto: string, mapa: Map<string, Regalo>): { texto: string; productos: Tarjeta[]; sinDato: boolean } {
  const productos: Tarjeta[] = [];
  const vistos = new Set<string>();
  let sinDato = false;
  const limpio = String(texto || "").replace(/\[\[\s*([^\]\n]{1,40}?)\s*\]\]/g, (_m, dentro: string) => {
    const clave = dentro.trim().toUpperCase();
    if (clave === "SIN_DATO") { sinDato = true; return ""; }
    const r = mapa.get(clave);
    if (r && !vistos.has(clave) && productos.length < MAX_TARJETAS) {
      vistos.add(clave);
      productos.push(tarjetaDe(r));
    }
    return "";
  })
    // Tolerancia: si el modelo escribe el código con un solo corchete ([T12], como en el catálogo), también se vuelve tarjeta.
    .replace(/\[\s*(T\d{1,3})\s*\]/gi, (_m, codigo: string) => {
      const clave = codigo.toUpperCase();
      const r = mapa.get(clave);
      if (r && !vistos.has(clave) && productos.length < MAX_TARJETAS) {
        vistos.add(clave);
        productos.push(tarjetaDe(r));
      }
      return "";
    })
    .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
  return { texto: limpio, productos, sinDato };
}

// Resumen para el registro de «preguntas sin respuesta»: sin datos personales (correos, teléfonos, direcciones web, cifras largas,
// nombres propios no se pueden detectar con seguridad, por eso el registro está apagado por defecto y es corto).
export function limpiarPregunta(texto: string, largo = 140): string {
  return String(texto || "")
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[correo]")
    .replace(/https?:\/\/\S+|www\.\S+/gi, "[enlace]")
    .replace(/\+?\d[\d\s().-]{6,}\d/g, "[número]")
    .replace(/\d{4,}/g, "[número]")
    .replace(/\s+/g, " ").trim().slice(0, largo);
}

// Texto de la parte nueva del prompt (códigos y marcas). Va junto a las reglas de Rosina.
export const REGLAS_TARJETAS = `TARJETAS DE PRODUCTO: en el CATÁLOGO ACTUAL cada producto de la tienda de amigurumis lleva un código entre corchetes, por ejemplo [T12]. Cuando recomiendes un producto concreto de la tienda, escribe su código con dobles corchetes en una línea aparte al final, por ejemplo [[T12]]: la página mostrará sola la foto, el precio, si hay en existencia o es por encargo, y el enlace. Máximo 3 códigos. Usa SOLO códigos que aparezcan en el catálogo y nunca los inventes. No repitas en el texto el precio ni el enlace de un producto que ya muestras con su código; puedes nombrarlo y explicar por qué lo recomiendas.
Si "en existencia ahora" aparece en el catálogo, hay unidades listas; si dice "por encargo", se teje cuando se pide y el tiempo es el que indica el catálogo: nunca prometas otro plazo. Los "Amigurumi personalizado" se tejen a partir de la foto o idea de la persona y el precio es el base.
SIN RESPUESTA: si la pregunta es sobre Lana Rosa pero NO encuentras la respuesta en el conocimiento ni en el catálogo (y por eso ofreces el WhatsApp), termina tu respuesta con [[SIN_DATO]]. No lo uses en saludos, agradecimientos ni preguntas ajenas a Lana Rosa.`;

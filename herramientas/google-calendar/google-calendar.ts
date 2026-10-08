// Sincronización de la agenda de Rosina con Google Calendar (Edge Function de Supabase, verify_jwt = false: valida el usuario aquí).
// Secretos (Supabase → Edge Functions → Secrets):
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET   (cliente OAuth "Aplicación web" de Google Cloud; ver herramientas/google-calendar/README.md)
//   CALENDAR_TOKEN_KEY                        (texto largo al azar, 40 caracteres o más: cifra los permisos guardados)
//   CALENDAR_STATE_SECRET                     (texto largo al azar: firma el "state" del inicio de sesión de Google)
// Solo se pide el permiso "calendar.events" (crear y editar eventos). No se lee ningún otro dato de Google.
//   POST { accion: 'estado' }                          -> { configurado, conectado, correo, ultima }
//   POST { accion: 'conectar' }                        -> { url }  (la web manda a la persona a esa dirección de Google)
//   GET  ?code=...&state=...                           -> Google vuelve aquí; se guarda el permiso cifrado y se redirige a la agenda
//   POST { accion: 'sincronizar', eventos: [ {clave, titulo, detalle, lugar, fecha:'AAAA-MM-DD', anual} ] }
//                                                      -> crea, actualiza y borra en Google Calendar lo que cambió (por "clave")
//   POST { accion: 'desconectar' }                     -> revoca el permiso en Google y borra lo guardado (los eventos ya creados quedan)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SITIO = 'https://lanarosacrochet.com';
const AGENDA = SITIO + '/agenda-rosina.html';
const CORS = {
  'Access-Control-Allow-Origin': SITIO,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const env = (k: string) => (Deno.env.get(k) || '').trim();
const configurado = () => !!(env('GOOGLE_CLIENT_ID') && env('GOOGLE_CLIENT_SECRET') && env('CALENDAR_TOKEN_KEY') && env('CALENDAR_STATE_SECRET'));
const REDIRECT = () => env('SUPABASE_URL') + '/functions/v1/google-calendar';
const MAX_EVENTOS = 300;

// ---------- cifrado de los permisos (AES-GCM) ----------
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const deB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function llave() { const crudo = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(env('CALENDAR_TOKEN_KEY'))); return crypto.subtle.importKey('raw', crudo, 'AES-GCM', false, ['encrypt', 'decrypt']); }   // cualquier texto largo sirve: se convierte en una llave de 32 bytes
async function cifrar(texto: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const c = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await llave(), new TextEncoder().encode(texto)));
  return b64(iv) + '.' + b64(c);
}
async function descifrar(valor: string) {
  const [iv, c] = valor.split('.');
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deB64(iv) }, await llave(), deB64(c)));
}

// ---------- "state" firmado (evita que otra persona termine tu conexión) ----------
async function hmac(texto: string) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(env('CALENDAR_STATE_SECRET')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64(new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(texto)))).replace(/[+/=]/g, '');
}
async function crearState(uid: string) { const exp = Date.now() + 10 * 60 * 1000; const base = uid + '.' + exp; return base + '.' + (await hmac(base)); }
async function leerState(state: string): Promise<string | null> {
  const [uid, exp, firma] = String(state || '').split('.');
  if (!uid || !exp || !firma || Number(exp) < Date.now()) return null;
  return (await hmac(uid + '.' + exp)) === firma ? uid : null;
}

// ---------- Google ----------
async function tokenDeAcceso(refresh: string) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env('GOOGLE_CLIENT_ID'), client_secret: env('GOOGLE_CLIENT_SECRET'), refresh_token: refresh, grant_type: 'refresh_token' }),
  });
  if (!r.ok) throw new Error('permiso_vencido');
  return (await r.json()).access_token as string;
}
const sumarDia = (f: string) => { const d = new Date(f + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };
function cuerpoEvento(e: any) {
  const ev: any = {
    summary: e.titulo, description: e.detalle || undefined, location: e.lugar || undefined,
    start: { date: e.fecha }, end: { date: sumarDia(e.fecha) },
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 900 }] },   // la tarde anterior
    extendedProperties: { private: { lanarosa_clave: e.clave } },
    source: { title: 'Agenda de Rosina · Lana Rosa', url: AGENDA },
  };
  if (e.anual) ev.recurrence = ['RRULE:FREQ=YEARLY'];
  return ev;
}
const limpio = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const FECHA_OK = /^\d{4}-\d{2}-\d{2}$/;
const CAL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
async function huella(e: any) { return hmac(JSON.stringify([e.titulo, e.detalle, e.lugar, e.fecha, !!e.anual])); }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  const sb = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
  const url = new URL(req.url);

  // ---------- Vuelta de Google (GET) ----------
  if (req.method === 'GET') {
    const volver = (q: string) => Response.redirect(AGENDA + '?calendario=' + q, 302);
    if (!configurado()) return volver('no_configurado');
    if (url.searchParams.get('error')) return volver('cancelado');
    const uid = await leerState(url.searchParams.get('state') || '');
    const code = url.searchParams.get('code');
    if (!uid || !code) return volver('error');
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: env('GOOGLE_CLIENT_ID'), client_secret: env('GOOGLE_CLIENT_SECRET'), redirect_uri: REDIRECT(), grant_type: 'authorization_code' }),
    });
    if (!r.ok) return volver('error');
    const t = await r.json();
    if (!t.refresh_token) return volver('sin_permiso');   // pasa si ya había dado permiso: se vuelve a pedir con prompt=consent
    let correo = '';
    try { const p = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: 'Bearer ' + t.access_token } }); correo = (await p.json()).email || ''; } catch { /* el correo es solo informativo */ }
    await sb.from('google_calendar_cuentas').upsert({ user_id: uid, refresh_token: await cifrar(t.refresh_token), google_correo: correo || null, updated_at: new Date().toISOString() });
    return volver('conectado');
  }
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'Solicitud inválida' }, 400); }
  if (!configurado()) return json({ configurado: false, error: 'La sincronización todavía no está activa.' });

  // ---------- Quién es (la sesión de la clienta) ----------
  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const { data: u } = await sb.auth.getUser(jwt);
  const uid = u?.user?.id;
  if (!uid) return json({ error: 'Inicia sesión para conectar tu calendario.' }, 401);

  const { data: cuenta } = await sb.from('google_calendar_cuentas').select('refresh_token, google_correo, ultima_sincronizacion').eq('user_id', uid).maybeSingle();

  if (body.accion === 'estado') return json({ configurado: true, conectado: !!cuenta, correo: cuenta?.google_correo || null, ultima: cuenta?.ultima_sincronizacion || null });

  if (body.accion === 'conectar') {
    const q = new URLSearchParams({
      client_id: env('GOOGLE_CLIENT_ID'), redirect_uri: REDIRECT(), response_type: 'code', access_type: 'offline', prompt: 'consent',
      scope: 'https://www.googleapis.com/auth/calendar.events openid email', include_granted_scopes: 'true', state: await crearState(uid),
    });
    return json({ url: 'https://accounts.google.com/o/oauth2/v2/auth?' + q });
  }

  if (body.accion === 'desconectar') {
    if (cuenta) {
      try { await fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(await descifrar(cuenta.refresh_token)), { method: 'POST' }); } catch { /* si ya estaba revocado, seguimos */ }
    }
    await sb.from('google_calendar_eventos').delete().eq('user_id', uid);
    await sb.from('google_calendar_cuentas').delete().eq('user_id', uid);
    return json({ ok: true });
  }

  if (body.accion === 'sincronizar') {
    if (!cuenta) return json({ error: 'Primero conecta tu Google Calendar.' }, 400);
    const entrada = Array.isArray(body.eventos) ? body.eventos.slice(0, MAX_EVENTOS) : [];
    const eventos = entrada.map((e: any) => ({
      clave: limpio(e?.clave, 60), titulo: limpio(e?.titulo, 200), detalle: limpio(e?.detalle, 1500), lugar: limpio(e?.lugar, 200),
      fecha: limpio(e?.fecha, 10), anual: !!e?.anual,
    })).filter((e: any) => e.clave && e.titulo && FECHA_OK.test(e.fecha));
    let acceso: string;
    try { acceso = await tokenDeAcceso(await descifrar(cuenta.refresh_token)); }
    catch { await sb.from('google_calendar_cuentas').delete().eq('user_id', uid); return json({ error: 'El permiso venció. Vuelve a conectar tu Google Calendar.', reconectar: true }, 401); }
    const cab = { Authorization: 'Bearer ' + acceso, 'Content-Type': 'application/json' };

    const { data: previos } = await sb.from('google_calendar_eventos').select('clave, event_id, huella').eq('user_id', uid);
    const mapa = new Map((previos || []).map((p: any) => [p.clave, p]));
    const claves = new Set(eventos.map((e: any) => e.clave));
    let creados = 0, actualizados = 0, borrados = 0, sinCambio = 0, fallos = 0;

    for (const e of eventos) {
      const h = await huella(e), previo: any = mapa.get(e.clave);
      if (previo && previo.huella === h) { sinCambio++; continue; }
      let id: string | null = null;
      if (previo) {
        const r = await fetch(`${CAL}/${previo.event_id}`, { method: 'PUT', headers: cab, body: JSON.stringify(cuerpoEvento(e)) });
        if (r.ok) { id = previo.event_id; actualizados++; }
        else if (r.status !== 404 && r.status !== 410) { fallos++; continue; }
      }
      if (!id) {
        const r = await fetch(CAL, { method: 'POST', headers: cab, body: JSON.stringify(cuerpoEvento(e)) });
        if (!r.ok) { fallos++; continue; }
        id = (await r.json()).id; creados++;
      }
      await sb.from('google_calendar_eventos').upsert({ user_id: uid, clave: e.clave, event_id: id, huella: h });
    }
    for (const [clave, p] of mapa as Map<string, any>) {
      if (claves.has(clave)) continue;
      const r = await fetch(`${CAL}/${p.event_id}`, { method: 'DELETE', headers: cab });
      if (r.ok || r.status === 404 || r.status === 410) { await sb.from('google_calendar_eventos').delete().eq('user_id', uid).eq('clave', clave); borrados++; } else fallos++;
    }
    await sb.from('google_calendar_cuentas').update({ ultima_sincronizacion: new Date().toISOString() }).eq('user_id', uid);
    return json({ ok: fallos === 0, creados, actualizados, borrados, sinCambio, fallos });
  }

  return json({ error: 'Acción no válida' }, 400);
});

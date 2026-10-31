// Sincronización de la agenda con el Google Drive de la usuaria (Edge Function de Supabase, verify_jwt = false: valida el usuario aquí).
// IMPORTANTE (privacidad): esta función NUNCA lee ni guarda la agenda. Solo (1) consigue el permiso de Google para la carpeta oculta de la app en el Drive de la persona y
// (2) le entrega a su navegador una llave de acceso de corta vida; el navegador habla directo con Drive. Los datos de la agenda no pasan por nuestros servidores.
// Permiso pedido: drive.appdata (NO sensible: carpeta oculta que solo ve esta app; no puede leer el resto del Drive).
// Secretos (los mismos de google-calendar): GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CALENDAR_TOKEN_KEY, CALENDAR_STATE_SECRET.
//   POST { accion: 'estado' }       -> { configurado, conectado, correo, ultima }
//   POST { accion: 'conectar' }     -> { url }  (la web manda a la persona a esa dirección de Google)
//   GET  ?code=...&state=...        -> Google vuelve aquí; se guarda el permiso cifrado y se redirige a la agenda (?drive=conectado)
//   POST { accion: 'token' }        -> { access_token, expires_in }  (llave de acceso de ~1 hora para la carpeta oculta)
//   POST { accion: 'sincronizada' } -> { ok }  (solo anota la fecha de la última sincronización)
//   POST { accion: 'desconectar' }  -> revoca el permiso y borra lo guardado aquí (la agenda en Drive la borra el navegador si la persona lo pide)
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
const REDIRECT = () => env('SUPABASE_URL') + '/functions/v1/google-drive';
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata openid email';

// ---------- cifrado de los permisos (AES-GCM) ----------
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const deB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function llave() { const crudo = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(env('CALENDAR_TOKEN_KEY'))); return crypto.subtle.importKey('raw', crudo, 'AES-GCM', false, ['encrypt', 'decrypt']); }
async function cifrar(texto: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const c = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await llave(), new TextEncoder().encode(texto)));
  return b64(iv) + '.' + b64(c);
}
async function descifrar(valor: string) {
  const [iv, c] = valor.split('.');
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deB64(iv) }, await llave(), deB64(c)));
}

// ---------- "state" firmado, con propósito «drive» (no vale para otras conexiones) ----------
async function hmac(texto: string) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(env('CALENDAR_STATE_SECRET')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64(new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(texto)))).replace(/[+/=]/g, '');
}
async function crearState(uid: string) { const exp = Date.now() + 10 * 60 * 1000; const base = uid + '.' + exp; return base + '.' + (await hmac('drive:' + base)); }
async function leerState(state: string): Promise<string | null> {
  const [uid, exp, firma] = String(state || '').split('.');
  if (!uid || !exp || !firma || Number(exp) < Date.now()) return null;
  return (await hmac('drive:' + uid + '.' + exp)) === firma ? uid : null;
}

async function tokenDeAcceso(refresh: string) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env('GOOGLE_CLIENT_ID'), client_secret: env('GOOGLE_CLIENT_SECRET'), refresh_token: refresh, grant_type: 'refresh_token' }),
  });
  if (!r.ok) throw new Error('permiso_vencido');
  const d = await r.json();
  return { access_token: d.access_token as string, expires_in: Number(d.expires_in) || 3300 };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  const sb = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
  const url = new URL(req.url);

  // ---------- Vuelta de Google (GET) ----------
  if (req.method === 'GET') {
    const volver = (q: string) => Response.redirect(AGENDA + '?drive=' + q, 302);
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
    if (!t.refresh_token) return volver('sin_permiso');
    // Si la persona desmarcó el permiso de Drive en la pantalla de Google, el permiso concedido no lo incluye.
    if (!String(t.scope || '').includes('drive.appdata')) return volver('sin_permiso');
    let correo = '';
    try { const p = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: 'Bearer ' + t.access_token } }); correo = (await p.json()).email || ''; } catch { /* el correo es solo informativo */ }
    await sb.from('google_drive_cuentas').upsert({ user_id: uid, refresh_token: await cifrar(t.refresh_token), google_correo: correo || null, updated_at: new Date().toISOString() });
    return volver('conectado');
  }
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'Solicitud inválida' }, 400); }
  if (!configurado()) return json({ configurado: false, error: 'La sincronización con Drive todavía no está activa.' });

  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const { data: u } = await sb.auth.getUser(jwt);
  const uid = u?.user?.id;
  if (!uid) return json({ error: 'Inicia sesión para conectar tu Google Drive.' }, 401);

  const { data: cuenta } = await sb.from('google_drive_cuentas').select('refresh_token, google_correo, ultima_sincronizacion').eq('user_id', uid).maybeSingle();

  if (body.accion === 'estado') return json({ configurado: true, conectado: !!cuenta, correo: cuenta?.google_correo || null, ultima: cuenta?.ultima_sincronizacion || null });

  if (body.accion === 'conectar') {
    const q = new URLSearchParams({
      client_id: env('GOOGLE_CLIENT_ID'), redirect_uri: REDIRECT(), response_type: 'code', access_type: 'offline', prompt: 'consent',
      scope: SCOPE, state: await crearState(uid),
    });
    return json({ url: 'https://accounts.google.com/o/oauth2/v2/auth?' + q });
  }

  if (body.accion === 'token') {
    if (!cuenta) return json({ error: 'Primero conecta tu Google Drive.', reconectar: true }, 400);
    try { return json(await tokenDeAcceso(await descifrar(cuenta.refresh_token))); }
    catch { await sb.from('google_drive_cuentas').delete().eq('user_id', uid); return json({ error: 'El permiso venció. Vuelve a conectar tu Google Drive.', reconectar: true }, 401); }
  }

  if (body.accion === 'sincronizada') {
    if (cuenta) await sb.from('google_drive_cuentas').update({ ultima_sincronizacion: new Date().toISOString() }).eq('user_id', uid);
    return json({ ok: true });
  }

  if (body.accion === 'desconectar') {
    if (cuenta) {
      try { await fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(await descifrar(cuenta.refresh_token)), { method: 'POST' }); } catch { /* si ya estaba revocado, seguimos */ }
    }
    await sb.from('google_drive_cuentas').delete().eq('user_id', uid);
    return json({ ok: true });
  }

  return json({ error: 'Acción no válida' }, 400);
});

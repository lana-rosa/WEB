// Prueba la lógica de la función `google-calendar` (google-calendar.ts) con una base y un Google simulados (29-oct-2026).
// Uso (Node 22): sed "s#^import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';#const createClient = (globalThis as any).__createClient;#" herramientas/google-calendar/google-calendar.ts > /tmp/fn.ts
//   y copiar este archivo junto a /tmp/fn.ts como test.mjs (importa ./fn.ts): cd /tmp && node --experimental-strip-types --no-warnings test.mjs
// Prueba la función de Google Calendar con una base y un Google simulados
const env = {GOOGLE_CLIENT_ID:'id',GOOGLE_CLIENT_SECRET:'sec',CALENDAR_TOKEN_KEY:'k'.repeat(45),CALENDAR_STATE_SECRET:'s'.repeat(45),SUPABASE_URL:'https://x.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'r'};
let handler; globalThis.Deno = { env:{get:k=>env[k]}, serve:f=>{handler=f;} };
const db = { google_calendar_cuentas:[], google_calendar_eventos:[] };
function tabla(n){ const f=[]; const q={
  select(){return q}, eq(c,v){f.push([c,v]);return q}, maybeSingle(){return Promise.resolve({data:fil()[0]||null})},
  upsert(o){const t=db[n]; const i=t.findIndex(r=>r.user_id===o.user_id&&(n==='google_calendar_cuentas'||r.clave===o.clave)); if(i>=0)t[i]={...t[i],...o}; else t.push({...o}); return Promise.resolve({})},
  update(o){q._upd=o;return q}, delete(){q._del=true;return q},
  then(res){ const t=db[n]; if(q._del){ db[n]=t.filter(r=>!f.every(([c,v])=>r[c]===v)); return res({}); } if(q._upd){ fil().forEach(r=>Object.assign(r,q._upd)); return res({}); } return res({data:fil()}); } };
  function fil(){ return db[n].filter(r=>f.every(([c,v])=>r[c]===v)); } return q; }
globalThis.__createClient = () => ({ from: tabla, auth:{ getUser: async jwt => ({data:{user: jwt==='ok'?{id:'u1'}:null}}) } });
let nextId=1, nextCal=1; const googleLog=[]; let calBorrados=[]; let eventos404=false;
globalThis.fetch = async (url, init={}) => {
  const m=(init.method||'GET'); const u=String(url); googleLog.push(m+' '+u.replace('https://www.googleapis.com/calendar/v3',''));
  if(u.includes('oauth2.googleapis.com/token')) return new Response(JSON.stringify(String(init.body||'').includes('authorization_code') ? {access_token:'at',refresh_token:'rt'} : {access_token:'at'}));
  if(u.includes('oauth2.googleapis.com/revoke')) return new Response('{}');
  if(u.endsWith('/calendars') && m==='POST') return new Response(JSON.stringify({id:'cal'+(nextCal++)+'@group.calendar.google.com'}));
  if(/\/calendars\/[^/]+$/.test(u) && m==='DELETE') { calBorrados.push(decodeURIComponent(u.split('/').pop())); return new Response(null,{status:204}); }
  if(u.includes('/events')) { if(eventos404 && m==='POST' && u.includes('cal1')) return new Response('{}',{status:404}); if(m==='POST') return new Response(JSON.stringify({id:'ev'+(nextId++)})); }
  return new Response('{}');
};
await import('./fn.ts');
const post = (body, jwt='ok') => handler(new Request('https://x/functions/v1/google-calendar',{method:'POST',headers:{authorization:'Bearer '+jwt,'content-type':'application/json'},body:JSON.stringify(body)})).then(r=>r.json());
let bien=0,mal=0; const v=(n,ok,d)=>{console.log((ok?'  ok   ':'  FALLA ')+n+(ok?'':'  → '+JSON.stringify(d))); ok?bien++:mal++;};
// cuenta conectada (con el permiso cifrado de verdad, usando la propia función de cifrado: se guarda vía GET simulado no; se inserta uno válido)
const mod = await post({accion:'estado'}); v('estado sin conectar', mod.configurado===true && mod.conectado===false, mod);
v('sin sesión: 401', (await post({accion:'estado'},'malo')).error?.includes('Inicia sesión'));
// fabricar un permiso cifrado válido llamando a la ruta GET no es posible sin Google; se cifra igual que la función
const enc = new TextEncoder(); const raw = await crypto.subtle.digest('SHA-256', enc.encode(env.CALENDAR_TOKEN_KEY)); const key = await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt']);
const iv = crypto.getRandomValues(new Uint8Array(12)); const c = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode('refresh')));
const b64=u=>btoa(String.fromCharCode(...u)); db.google_calendar_cuentas.push({user_id:'u1',refresh_token:b64(iv)+'.'+b64(c),google_correo:'a@b.co',calendar_id:null});
const ev = n => Array.from({length:n},(_,i)=>({clave:'pedido:'+(i+1),titulo:'Entrega '+(i+1),detalle:'',lugar:'',fecha:'2026-11-'+String(i%28+1).padStart(2,'0'),anual:false}));
let r = await post({accion:'sincronizar',eventos:ev(10)}); v('crea 10', r.creados===10&&r.retenidos===0, r);
v('la primera sincronización crea el calendario «Agenda para tejedoras» y guarda su id', db.google_calendar_cuentas[0].calendar_id==='cal1@group.calendar.google.com' && googleLog.filter(x=>x.startsWith('POST /calendars')&&!x.includes('/events')).length===1, db.google_calendar_cuentas[0]);
v('los eventos van al calendario propio, no al principal', googleLog.filter(x=>x.includes('/events')).every(x=>x.includes('/calendars/cal1%40group.calendar.google.com/events')) && !googleLog.some(x=>x.includes('/primary/')), googleLog.slice(0,4));
r = await post({accion:'sincronizar',eventos:ev(10)}); v('sin cambios: no llama a Google', r.sinCambio===10&&r.creados===0, r);
r = await post({accion:'sincronizar',eventos:ev(8)}); v('quita 2 solas (hasta 3)', r.borrados===2&&r.retenidos===0, r);
r = await post({accion:'sincronizar',eventos:[]}); v('lista vacía con 8 previas: NO borra, retiene 8', r.borrados===0&&r.retenidos===8&&db.google_calendar_eventos.length===8, r);
r = await post({accion:'sincronizar',eventos:ev(8)}); v('al volver la lista, nada pendiente', r.retenidos===0&&r.sinCambio===8, r);
r = await post({accion:'sincronizar',eventos:ev(3)}); v('quitar 5 de golpe se retiene', r.borrados===0&&r.retenidos===5, r);
r = await post({accion:'sincronizar',eventos:ev(3),confirmarBorrado:true}); v('confirmado: las quita', r.borrados===5&&r.retenidos===0&&db.google_calendar_eventos.length===3, r);
// si la persona borró el calendario en Google, se crea otro y se vuelven a subir las fechas
eventos404=true; db.google_calendar_cuentas[0].calendar_id='cal1@group.calendar.google.com';
r = await post({accion:'sincronizar',eventos:ev(4).map(e=>({...e,titulo:e.titulo+' (cambió)'}))}); eventos404=false;
v('calendario borrado por la persona: crea uno nuevo y sube las fechas otra vez', db.google_calendar_cuentas[0].calendar_id==='cal2@group.calendar.google.com' && r.creados>=1 && r.fallos===0, [db.google_calendar_cuentas[0].calendar_id, r]);
r = await post({accion:'desconectar'}); v('desconectar borra lo guardado y el calendario «Agenda para tejedoras» de Google', r.ok&&db.google_calendar_cuentas.length===0&&db.google_calendar_eventos.length===0&&calBorrados.includes('cal2@group.calendar.google.com'), [r, calBorrados]);
// conectar de verdad: la dirección de Google pide solo el permiso no sensible y la vuelta crea el calendario
const con = await post({accion:'conectar'}); const q = new URL(con.url).searchParams;
v('conectar pide solo calendar.app.created (no sensible), openid y email', q.get('scope')==='https://www.googleapis.com/auth/calendar.app.created openid email' && !q.has('include_granted_scopes'), q.get('scope'));
const vuelta = await handler(new Request('https://x/functions/v1/google-calendar?code=abc&state='+encodeURIComponent(q.get('state'))));
v('la vuelta de Google guarda el permiso cifrado y crea el calendario', vuelta.headers.get('location').endsWith('?calendario=conectado') && db.google_calendar_cuentas.length===1 && /^cal\d+@group/.test(db.google_calendar_cuentas[0].calendar_id||'') && db.google_calendar_cuentas[0].refresh_token.includes('.'), [vuelta.headers.get('location'), db.google_calendar_cuentas[0]]);
console.log(`\n${bien} correctas, ${mal} con falla.`); process.exit(mal?1:0);

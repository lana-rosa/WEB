// Prueba la lógica de la función `google-drive-archivos` con una base y un Google simulados (10-nov-2026).
// Uso (Node 22): sed "s#^import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';#const createClient = (globalThis as any).__createClient;#" herramientas/google-drive-archivos/google-drive-archivos.ts > D/fn.ts
//   y copiar este archivo junto a D/fn.ts como test.mjs: cd D && node --experimental-strip-types --no-warnings test.mjs
const env = {GOOGLE_CLIENT_ID:'id',GOOGLE_CLIENT_SECRET:'sec',CALENDAR_TOKEN_KEY:'k'.repeat(45),CALENDAR_STATE_SECRET:'s'.repeat(45),SUPABASE_URL:'https://x.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'r'};
let handler; globalThis.Deno = { env:{get:k=>env[k]}, serve:f=>{handler=f;} };
const db = { google_drive_archivos_cuentas:[] }; const tablas = new Set();
function tabla(n){ tablas.add(n); const f=[]; const q={
  select(){return q}, eq(c,v){f.push([c,v]);return q}, maybeSingle(){return Promise.resolve({data:fil()[0]||null})},
  upsert(o){const t=db[n]; const i=t.findIndex(r=>r.user_id===o.user_id); if(i>=0)t[i]={...t[i],...o}; else t.push({...o}); return Promise.resolve({})},
  update(o){q._upd=o;return q}, delete(){q._del=true;return q},
  then(res){ if(q._del){ db[n]=db[n].filter(r=>!f.every(([c,v])=>r[c]===v)); return res({}); } if(q._upd){ fil().forEach(r=>Object.assign(r,q._upd)); return res({}); } return res({data:fil()}); } };
  function fil(){ return db[n].filter(r=>f.every(([c,v])=>r[c]===v)); } return q; }
globalThis.__createClient = () => ({ from: tabla, auth:{ getUser: async jwt => ({data:{user: jwt==='ok'?{id:'u1'}:null}}) } });
const llamadas=[];
globalThis.fetch = async (url, init={}) => { const u=String(url); llamadas.push((init.method||'GET')+' '+u);
  if(u.includes('oauth2.googleapis.com/token')) return new Response(JSON.stringify(String(init.body||'').includes('authorization_code') ? {access_token:'at',refresh_token:'rt',scope:globalThis.__scope||'https://www.googleapis.com/auth/drive.file openid email'} : {access_token:'at2',expires_in:3300}));
  if(u.includes('oauth2.googleapis.com/revoke')) return new Response('{}');
  if(u.includes('userinfo')) return new Response(JSON.stringify({email:'a@b.co'}));
  return new Response('{}'); };
await import('./fn.ts');
const post = (body, jwt='ok') => handler(new Request('https://x/functions/v1/google-drive-archivos',{method:'POST',headers:{authorization:'Bearer '+jwt,'content-type':'application/json'},body:JSON.stringify(body)})).then(r=>r.json());
let bien=0,mal=0; const v=(n,ok,d)=>{console.log((ok?'  ok   ':'  FALLA ')+n+(ok?'':'  → '+JSON.stringify(d))); ok?bien++:mal++;};
let r = await post({accion:'estado'}); v('estado sin conectar', r.configurado===true && r.conectado===false, r);
v('sin sesión: 401', (await post({accion:'estado'},'malo')).error?.includes('Inicia sesión'));
const con = await post({accion:'conectar'}); const q = new URL(con.url).searchParams;
v('conectar pide solo drive.file (no sensible), openid y email, y vuelve a ESTA función', q.get('scope')==='https://www.googleapis.com/auth/drive.file openid email' && q.get('redirect_uri')==='https://x.supabase.co/functions/v1/google-drive-archivos', [q.get('scope'), q.get('redirect_uri')]);
let vuelta = await handler(new Request('https://x/f?code=abc&state='+encodeURIComponent(q.get('state'))));
v('la vuelta de Google guarda el permiso cifrado y regresa a la agenda con ?driveArchivos=conectado', vuelta.headers.get('location').endsWith('?driveArchivos=conectado') && db.google_drive_archivos_cuentas.length===1 && db.google_drive_archivos_cuentas[0].refresh_token.includes('.') && db.google_drive_archivos_cuentas[0].refresh_token!=='rt', [vuelta.headers.get('location'), db.google_drive_archivos_cuentas[0]]);
v('solo toca su propia tabla (nunca la de la sincronización ni la del calendario)', [...tablas].every(t=>t==='google_drive_archivos_cuentas'), [...tablas]);
r = await post({accion:'estado'}); v('estado conectado con el correo', r.conectado===true && r.correo==='a@b.co', r);
r = await post({accion:'token'}); v('entrega una llave de corta vida y no el permiso guardado', r.access_token==='at2' && r.expires_in===3300 && !JSON.stringify(r).includes('rt'), r);
r = await post({accion:'guardado'}); v('anota la fecha del último guardado', r.ok===true && !!db.google_drive_archivos_cuentas[0].ultimo_guardado);
// un «state» de otra conexión no sirve (propósito distinto)
const base='u1.'+(Date.now()+60000); const enc=new TextEncoder(); const k=await crypto.subtle.importKey('raw',enc.encode(env.CALENDAR_STATE_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
const firma=(p)=>crypto.subtle.sign('HMAC',k,enc.encode(p)).then(b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/[+/=]/g,''));
const stateDrive = base+'.'+await firma('drive:'+base), stateCal = base+'.'+await firma(base);
db.google_drive_archivos_cuentas.length=0;
for (const [nombre, st] of [['la sincronización de Drive', stateDrive], ['Calendar', stateCal]]) { vuelta = await handler(new Request('https://x/f?code=abc&state='+encodeURIComponent(st))); v('un «state» de '+nombre+' no sirve aquí', vuelta.headers.get('location').endsWith('?driveArchivos=error') && db.google_drive_archivos_cuentas.length===0, vuelta.headers.get('location')); }
globalThis.__scope='openid email'; const con2=await post({accion:'conectar'}); vuelta = await handler(new Request('https://x/f?code=abc&state='+encodeURIComponent(new URL(con2.url).searchParams.get('state'))));
v('si la persona desmarca el permiso de Drive en Google, no se guarda nada', vuelta.headers.get('location').endsWith('?driveArchivos=sin_permiso') && db.google_drive_archivos_cuentas.length===0, vuelta.headers.get('location'));
globalThis.__scope=undefined; const con3=await post({accion:'conectar'}); await handler(new Request('https://x/f?code=abc&state='+encodeURIComponent(new URL(con3.url).searchParams.get('state'))));
r = await post({accion:'desconectar'}); v('desconectar revoca el permiso y borra lo guardado', r.ok && db.google_drive_archivos_cuentas.length===0 && llamadas.some(x=>x.includes('/revoke')), llamadas.slice(-3));
r = await post({accion:'token'}); v('sin conexión no entrega llave', r.reconectar===true, r);
console.log(`\n${bien} correctas, ${mal} con falla.`); process.exit(mal?1:0);

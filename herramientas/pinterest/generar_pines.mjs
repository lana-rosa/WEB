// Genera pines verticales (1000 x 1500) para Pinterest con el material del Rincón de Rosina.
// Uso: servidor local en la raíz del sitio (python3 -m http.server 8765) y
//      node herramientas/pinterest/generar_pines.mjs <ruta-dp.woff2> <carpeta-salida>
import { chromium } from 'playwright';
import fs from 'fs';
const [,, FUENTE, SALIDA = 'herramientas/pinterest/pines'] = process.argv;
fs.mkdirSync(SALIDA, { recursive: true });
const S = 'http://localhost:8765/';
const paletas = JSON.parse(fs.readFileSync(new URL('./paletas.json', import.meta.url)));

const base = (fondo, contenido, url) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:DynaPuff;src:url(https://fuente.local/dp.woff2) format('woff2');font-weight:400 700}
*{box-sizing:border-box}body{margin:0;width:1000px;height:1500px;font-family:'Hanken Grotesk',Arial,sans-serif;color:#45454A;background:${fondo};position:relative;overflow:hidden}
h1{font-family:DynaPuff;font-weight:600;font-size:92px;line-height:1.02;margin:0 0 22px;letter-spacing:-1px}
.eyebrow{font-weight:800;letter-spacing:6px;text-transform:uppercase;color:#E74E96;font-size:30px;margin:0 0 18px}
.sub{font-size:40px;line-height:1.3;margin:0}
.pie{position:absolute;left:0;right:0;bottom:0;height:150px;background:#E74E96;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 64px}
.pie b{font-family:DynaPuff;font-size:46px;white-space:nowrap}.pie span{font-size:34px;font-weight:700;white-space:nowrap}
.pad{padding:80px 70px 0}.gratis{display:inline-block;background:#fff;color:#E74E96;font-weight:800;font-size:34px;padding:10px 28px;border-radius:999px;margin-top:26px}
</style></head><body>${contenido}<div class="pie"><b>Lana Rosa Crochet</b><span>lanarosacrochet.com</span></div></body></html>`;

const pines = [
 { n: '01-stickers-rosina', url: 'lanarosacrochet.com/recursos-rosina.html', fondo: '#FBE4EF', html: `<div class="pad"><p class="eyebrow">Gratis para WhatsApp</p><h1>26 stickers de Rosina</h1><p class="sub">La ovejita tejedora para tus chats</p></div>
   <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:40px 70px">${['01-saludo','13-cafe','03-ovillo-corazon','06-idea','08-feliz','18-ovillo-abrazo','12-pulgar-arriba','15-ramo','20-sentada-saludo'].map(s=>`<img src="${S}img/stickers/rosina-${s}.webp" style="width:100%;background:#fff;border-radius:32px;padding:10px">`).join('')}</div>` },
 { n: '02-fondos-pantalla', url: 'lanarosacrochet.com/recursos-rosina.html', fondo: '#F0F1FE', html: `<div class="pad"><p class="eyebrow">Descarga gratis</p><h1>Fondos de pantalla de Rosina</h1><p class="sub">9 diseños para tu celular</p></div>
   <div style="display:flex;gap:26px;justify-content:center;padding:50px 40px">${['rosa','cafe','lila'].map((f,i)=>`<img src="${S}img/fondos/fondo-rosina-${f}-iphone.jpg" style="width:270px;border-radius:40px;border:10px solid #333236;box-shadow:0 20px 40px rgba(0,0,0,.2);transform:translateY(${i==1?0:40}px)">`).join('')}</div>` },
 { n: '03-paletas-colores', url: 'lanarosacrochet.com/paletas-rosina.html', fondo: '#FAFAF7', html: `<div class="pad"><p class="eyebrow">Para tus proyectos</p><h1>Paletas de colores para tejer</h1><p class="sub">22 combinaciones de hilos, gratis</p></div>
   <div style="display:grid;gap:22px;padding:44px 70px">${paletas.map(p=>`<div><div style="display:flex;height:92px;border-radius:22px;overflow:hidden;box-shadow:0 6px 16px rgba(0,0,0,.08)">${p.colores.map(c=>`<div style="flex:1;background:${c}"></div>`).join('')}</div><div style="font-weight:700;font-size:28px;margin-top:6px">${p.nombre}</div></div>`).join('')}</div>` },
 { n: '04-checklist-amigurumi', url: 'lanarosacrochet.com/recursos-rosina.html', fondo: '#FFF8F0', html: `<div class="pad"><p class="eyebrow">Para principiantes</p><h1>Tu primer amigurumi: checklist</h1></div>
   <div style="display:grid;grid-template-columns:1fr 330px;gap:20px;padding:10px 70px;align-items:center"><ul style="list-style:none;padding:0;margin:0;font-size:38px;line-height:1.75">${['Hilo de grosor medio','Aguja de 2,5 a 3,5 mm','Relleno siliconado','Ojos de seguridad','Aguja lanera','Marcador de puntos','Tijeras pequeñas'].map(t=>`<li>✅ ${t}</li>`).join('')}</ul><img src="${S}img/stickers/rosina-07-leyendo.webp" style="width:100%"></div><div style="padding:0 70px"><span class="gratis">Descárgala gratis</span></div>` },
 { n: '05-amigurumi-personalizado', url: 'lanarosacrochet.com/personaliza.html', fondo: '#FBF7F2', html: `<div class="pad"><p class="eyebrow">Hecho a mano en Colombia</p><h1>De tu foto a un amigurumi</h1><p class="sub">Personas, mascotas y parejas tejidas a mano</p></div>
   <div style="display:flex;gap:22px;padding:40px 50px">${['vestido-fucsia','pareja'].map(f=>`<img src="${S}img/foto-amigurumi/${f}.webp" style="width:50%;height:840px;object-fit:cover;border-radius:28px;background:#fff">`).join('')}</div>` },
 { n: '06-glosario-crochet', url: 'lanarosacrochet.com/glosario-rosina.html', fondo: '#FBE4EF', html: `<div class="pad"><p class="eyebrow">Aprende crochet</p><h1>Glosario ilustrado de crochet</h1><p class="sub">30 términos explicados por Rosina</p></div>
   <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:44px 70px">${[['pb','Punto bajo'],['am','Anillo mágico'],['aum','Aumento'],['dism','Disminución'],['mpa','Medio punto alto'],['pa','Punto alto']].map(([a,t])=>`<div style="background:#fff;border-radius:26px;padding:24px 26px"><div style="font-family:DynaPuff;font-size:52px;color:#E74E96">${a}</div><div style="font-size:32px;font-weight:700">${t}</div></div>`).join('')}</div>
   <img src="${S}img/stickers/rosina-06-idea.webp" style="position:absolute;right:40px;bottom:170px;width:260px">` },
 { n: '07-calculadora-costos', url: 'lanarosacrochet.com/recursos-rosina.html', fondo: '#FAFAF7', html: `<div class="pad"><p class="eyebrow">Para tejedoras que venden</p><h1>¿Cuánto cobrar por tu amigurumi?</h1><p class="sub">Calculadora de costos gratis: materiales, tiempo y ganancia</p></div>
   <div style="margin:50px 70px;background:#fff;border-radius:32px;padding:40px 44px;box-shadow:0 12px 32px rgba(0,0,0,.08);font-size:36px;line-height:1.9">${[['Materiales','$ ···'],['Tu tiempo','$ ···'],['Gastos del taller','$ ···'],['Ganancia','$ ···']].map(([a,b])=>`<div style="display:flex;justify-content:space-between;border-bottom:2px dashed #F28FC0">${a}<b>${b}</b></div>`).join('')}<div style="display:flex;justify-content:space-between;font-family:DynaPuff;color:#E74E96;font-size:44px;margin-top:10px">Precio sugerido<span>✓</span></div></div>
   <img src="${S}img/stickers/rosina-11-computador.webp" style="position:absolute;right:50px;bottom:160px;width:230px">` },
];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1000, height: 1500 } });
await p.route('https://fuente.local/dp.woff2', r => r.fulfill({ contentType: 'font/woff2', body: fs.readFileSync(FUENTE) }));
for (const pin of pines) {
  await p.setContent(base(pin.fondo, pin.html, pin.url), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `${SALIDA}/${pin.n}.jpg`, type: 'jpeg', quality: 88 });
  console.log('✓', pin.n);
}
await b.close();

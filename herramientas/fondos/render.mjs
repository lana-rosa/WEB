import { chromium } from 'playwright';
const D=process.argv[2], OUT=process.argv[3];
const TAM={samsung:[1080,2340],android:[1080,2400],iphone:[1170,2532],'iphone-max':[1290,2796]};
const DIS=['rosa','lila','fucsia','cielo','crema','cafe','gorro','terapia','patron'];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args:['--allow-file-access-from-files'] });
for (const [t,[W,H]] of Object.entries(TAM)) {
  const k=W/1170; const p = await b.newPage({ viewport:{width:1170,height:Math.round(H/k)}, deviceScaleFactor:k });
  for (const v of DIS) {
    await p.goto('file://'+D+'/fondo.html?v='+v); await p.evaluate(()=>document.fonts.ready);
    await p.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
    await p.screenshot({ path: `${OUT}/${v}-${t}.png` });
  }
  await p.close();
}
await b.close();

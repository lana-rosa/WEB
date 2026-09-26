from PIL import Image, ImageDraw, ImageFont, ImageChops
import os
W='img/'
# Necesita la fuente DynaPuff en .woff (npm pack @fontsource/dynapuff) junto a este script.
F=ImageFont.truetype('dynapuff-latin-600-normal.woff', 30*4)
lista=[('rosina-saludo.jpg','contener','¡Hola, tejedora!','hola-tejedora'),
 ('rosina-corazon.jpg','contener','Tejido con amor','tejido-con-amor'),
 ('rosina-checklist.jpg','cubrir','Aprobado por Rosina','aprobado-por-rosina'),
 ('rosina-aprende.jpg','cubrir','Una vuelta más','una-vuelta-mas'),
 ('rosina-abrazo.jpg','contener','Abrazos de lana','abrazos-de-lana'),
 ('rosina.jpg','contener','Hecho a mano','hecho-a-mano')]
K=4; T=512*K; c=T//2
def circ(r): 
    m=Image.new('L',(T,T),0); ImageDraw.Draw(m).ellipse((c-r,c-r,c+r,c+r),fill=255); return m
for src,aj,frase,slug in lista:
    im=Image.open(W+src).convert('RGB')
    out=Image.new('RGBA',(T,T),(0,0,0,0))
    out.paste((255,255,255,255),mask=circ(253*K))
    out.paste((242,143,192,255),mask=circ(236*K))
    out.paste((255,255,255,255),mask=circ(227*K))
    capa=Image.new('RGBA',(T,T),(255,255,255,0))
    if aj=='cubrir':
        s=max(454*K/im.width,454*K/im.height); w,h=round(im.width*s),round(im.height*s)
        capa.paste(im.resize((w,h),Image.LANCZOS),(c-w//2,c-h//2))
    else:
        box=368*K; s=min(box/im.width,box/im.height); w,h=round(im.width*s),round(im.height*s)
        capa.paste(im.resize((w,h),Image.LANCZOS),(c-w//2, 36*K+(box-h)//2))
    out.paste(capa,mask=ImageChops.multiply(circ(227*K),capa.getchannel('A')))
    d=ImageDraw.Draw(out)
    tw=d.textlength(frase,font=F); pw=tw+46*K; ph=50*K; px=c-pw/2; py=408*K
    d.rounded_rectangle((px-4*K,py-4*K,px+pw+4*K,py+ph+4*K),radius=(ph+8*K)/2,fill=(255,255,255,255))
    d.rounded_rectangle((px,py,px+pw,py+ph),radius=ph/2,fill=(231,78,150,255))
    d.text((c,py+ph/2+2*K),frase,font=F,fill='white',anchor='mm')
    out=out.resize((512,512),Image.LANCZOS)
    base=W+'stickers/frase-'+slug
    out.save(base+'.png',optimize=True); out.save(base+'.webp','WEBP',quality=86,method=6)
    print(slug, os.path.getsize(base+'.png')//1024, os.path.getsize(base+'.webp')//1024)

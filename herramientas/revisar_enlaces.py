"""Rastreo de enlaces internos, recursos, canonical y sitemap de todas las páginas.
Uso: python3 herramientas/revisar_enlaces.py   (resuelve las rutas como un navegador, respetando <base href="/">).
Debe terminar con 0 enlaces rotos, 0 recursos rotos y 0 URLs del sitemap malas. Canonical de merceria.html es la redirección y es esperado."""
import os,re,sys,json
from html.parser import HTMLParser
from urllib.parse import urljoin,urlparse,unquote
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SITE='https://lanarosacrochet.com'
SKIP_DIRS=('herramientas/','node_modules/','.git/')
pages=[]
for d,_,fs in os.walk(ROOT):
    rel=os.path.relpath(d,ROOT)
    if rel.startswith(('.git','herramientas','node_modules')): continue
    for f in fs:
        if f.endswith('.html'): pages.append(os.path.normpath(os.path.join(rel,f)))
def url_of(p):
    return '/'+p if not p.endswith('index.html') else '/'+p[:-10]
def exists(path):
    path=unquote(path.split('#')[0].split('?')[0])
    fp=os.path.join(ROOT,path.lstrip('/'))
    if path.endswith('/') or path=='' :
        return os.path.isfile(os.path.join(fp,'index.html'))
    if os.path.isfile(fp): return True
    if os.path.isdir(fp): return os.path.isfile(os.path.join(fp,'index.html')) # GH Pages redirects dir->dir/
    if os.path.isfile(fp+'.html'): return True # GH Pages clean URL
    return False
class P(HTMLParser):
    def __init__(s): super().__init__(); s.links=[]; s.res=[]; s.base=None; s.canon=None; s.ogs=[]
    def handle_starttag(s,t,a):
        a=dict(a)
        if t=='base' and a.get('href'): s.base=a['href']
        if t=='a' and a.get('href'): s.links.append(a['href'])
        if t=='form' and a.get('action'): s.links.append(a['action'])
        if t=='link' and a.get('rel')=='canonical': s.canon=a.get('href')
        if t=='link' and a.get('href') and a.get('rel') not in('canonical','preconnect','dns-prefetch'): s.res.append(a['href'])
        if t in('script','img','source','iframe','video','audio') and a.get('src'): s.res.append(a['src'])
        if t=='img' and a.get('srcset'): s.res+= [x.split()[0] for x in a['srcset'].split(',') if x.strip()]
        if t=='meta' and a.get('property') in('og:image','og:url') or (t=='meta' and a.get('name')=='twitter:image'): s.ogs.append(a.get('content',''))
        for k in('data-href',):
            if a.get(k): s.links.append(a[k])
def classify(h):
    h=h.strip()
    if not h or h.startswith(('#','mailto:','tel:','javascript:','data:','sms:')): return None
    if h.startswith(('http://','https://','//')):
        u=urlparse(h if not h.startswith('//') else 'https:'+h)
        return 'int' if u.netloc.replace('www.','')=='lanarosacrochet.com' else 'ext'
    return 'int'
res={'links':[], 'res':[], 'canon':[], 'og':[]}
ext=0; total_int=0; ext_set=set()
for p in pages:
    s=open(os.path.join(ROOT,p),encoding='utf-8').read(); pr=P(); pr.feed(s)
    base=urljoin(SITE+url_of(p), pr.base) if pr.base else SITE+url_of(p)
    for h in pr.links:
        c=classify(h)
        if c is None: continue
        if c=='ext': ext+=1; ext_set.add(h); continue
        u=urlparse(urljoin(base,h)); total_int+=1
        res['links'].append((p,h,u.path,exists(u.path)))
    for h in pr.res:
        c=classify(h)
        if c!='int': continue
        u=urlparse(urljoin(base,h)); res['res'].append((p,h,u.path,exists(u.path)))
    if pr.canon:
        u=urlparse(pr.canon); res['canon'].append((p,pr.canon,u.path,u.netloc.endswith('lanarosacrochet.com') and exists(u.path) and u.path==url_of(p).replace('index.html','')))
    for h in pr.ogs:
        if h.startswith(SITE): res['og'].append((p,h,urlparse(h).path,exists(urlparse(h).path)))
# sitemap
sm=[]
if os.path.exists(ROOT+'/sitemap.xml'):
    locs=re.findall(r'<loc>(.*?)</loc>',open(ROOT+'/sitemap.xml').read())
    seen=set()
    for l in locs:
        sm.append((l,exists(urlparse(l).path),l in seen)); seen.add(l)
bad=[x for x in res['links'] if not x[3]]
badr=[x for x in res['res'] if not x[3]]
badc=[x for x in res['canon'] if not x[3]]
bado=[x for x in res['og'] if not x[3]]
badsm=[x for x in sm if not x[1] or x[2]]
print('páginas',len(pages),'| enlaces internos',total_int,'| externos',ext,'(únicos %d)'%len(ext_set))
print('enlaces HTML rotos',len(bad),'| recursos rotos',len(badr),'| canonical malos',len(badc),'| og:image rotos',len(bado),'| sitemap urls',len(sm),'malas',len(badsm))
for n,l in (('LINK',bad),('RES',badr),('CANON',badc),('OG',bado),('SM',badsm)):
    for x in l[:80]: print(n,x)

# --- comprobación HTTP real: necesita un servidor local en el puerto 8770 (python3 -m http.server 8770 desde la raíz) ---
import urllib.request,urllib.error,collections
urls=sorted({x[2] for x in res['links']}|{x[2] for x in res['res']}|{urlparse(l).path for l,_,_ in sm})
cnt=collections.Counter(); malos=[]
class NoRed(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*a,**k): return None
op=urllib.request.build_opener(NoRed)
for u in urls:
    try:
        r=op.open('http://localhost:8770'+u,timeout=10); st=r.status
    except urllib.error.HTTPError as e: st=e.code
    except Exception as e: st='error'
    if st in (301,302):
        cnt[st]+=1
        try:
            r=urllib.request.urlopen('http://localhost:8770'+u,timeout=10); st=r.status
        except urllib.error.HTTPError as e: st=e.code
    cnt[st]+=1
    if st!=200: malos.append((u,st))
print('HTTP urls únicas',len(urls),dict(cnt)); print('no 200:',malos[:20])

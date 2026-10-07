"""Rastreo de enlaces internos, recursos, canonical y sitemap de todas las páginas.
Uso: python3 herramientas/revisar_enlaces.py   (resuelve las rutas como un navegador).
       python3 herramientas/revisar_enlaces.py --produccion   (además pide cada URL a https://lanarosacrochet.com; hay que correrlo desde una red con salida a internet).
Reglas de arquitectura que revisa: ninguna página lleva <base>, y todo enlace o recurso interno empieza con "/" (ruta desde la raíz), así funciona igual en cualquier carpeta y para cualquier rastreador.
Debe terminar con 0 enlaces rotos, 0 recursos rotos y 0 URLs del sitemap malas. Canonical de merceria.html es la redirección y es esperado."""
import os,re,sys,json
from html.parser import HTMLParser
from urllib.parse import urljoin,urlparse,unquote
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SITE=os.environ.get('LR_SITIO','https://lanarosacrochet.com')   # para probar contra otro servidor: LR_SITIO=http://localhost:8770
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
        return 'int' if u.netloc.replace('www.','')==urlparse(SITE).netloc.replace('www.','') else 'ext'
    return 'int'
res={'links':[], 'res':[], 'canon':[], 'og':[]}
politica=[]; duplicadas=[]
ext=0; total_int=0; ext_set=set()
for p in pages:
    s=open(os.path.join(ROOT,p),encoding='utf-8').read(); pr=P(); pr.feed(s)
    base=urljoin(SITE+url_of(p), pr.base) if pr.base else SITE+url_of(p)
    if pr.base: politica.append((p,'<base href="%s">'%pr.base))
    for h in pr.links+pr.res:
        if classify(h)=='int' and not h.startswith(('/','#','?','http')): politica.append((p,h))
    for h in pr.links:
        c=classify(h)
        if c is None: continue
        if c=='ext': ext+=1; ext_set.add(h); continue
        u=urlparse(urljoin(base,h)); total_int+=1
        if re.search(r'/(merceria|academy)/\1/',u.path): duplicadas.append((p,h,u.path))
        res['links'].append((p,h,u.path,exists(u.path)))
    for h in pr.res:
        c=classify(h)
        if c!='int': continue
        u=urlparse(urljoin(base,h)); res['res'].append((p,h,u.path,exists(u.path)))
    if pr.canon:
        u=urlparse(pr.canon); res['canon'].append((p,pr.canon,u.path,u.netloc.endswith('lanarosacrochet.com') and exists(u.path) and u.path==url_of(p).replace('index.html','')))
    for h in pr.ogs:
        if h.startswith(SITE): res['og'].append((p,h,urlparse(h).path,exists(urlparse(h).path)))

# --- rastreo real de la web publicada (--produccion): descarga el HTML que recibe un visitante y sigue sus enlaces ---
if '--produccion' in sys.argv:
    import urllib.request, urllib.error, collections, time
    BASE_URL = SITE
    def get(u, metodo='GET'):
        rq = urllib.request.Request(u, method=metodo, headers={'User-Agent': 'LanaRosa-revisar-enlaces/1.0'})
        try:
            r = urllib.request.urlopen(rq, timeout=25); return r.status, r.geturl(), (r.read().decode('utf-8', 'replace') if metodo == 'GET' and 'text/html' in r.headers.get('content-type', '') else '')
        except urllib.error.HTTPError as e: return e.code, u, ''
        except Exception as e: return 'error', u, ''
    cola = collections.deque(['/'] + [urlparse(l).path for l in re.findall(r'<loc>(.*?)</loc>', get(SITE + '/sitemap.xml')[2] or open(ROOT + '/sitemap.xml').read())])
    vistas, estado, errores, recursos, canon, ext_n, int_n, redirs = set(), {}, [], {}, [], 0, 0, 0
    while cola:
        ruta = cola.popleft()
        if ruta in vistas: continue
        vistas.add(ruta)
        st, final, html_ = get(SITE + ruta)
        if urlparse(final).path != ruta or urlparse(final).netloc.replace('www.', '') != urlparse(SITE).netloc.replace('www.', ''): redirs += 1
        estado[ruta] = st
        if st != 200: errores.append((ruta, ruta, st)); continue
        pr = P(); pr.feed(html_)
        base_nav = urljoin(SITE + ruta, pr.base) if pr.base else SITE + ruta     # como un navegador
        base_simple = SITE + ruta                                                 # como un rastreador que ignora <base>
        if pr.canon:
            cp = urlparse(pr.canon).path; canon.append((ruta, pr.canon, get(pr.canon, 'HEAD')[0]))
        for h in pr.links:
            c = classify(h)
            if c is None: continue
            if c == 'ext': ext_n += 1; continue
            int_n += 1
            for base in {base_nav, base_simple}:
                path = urlparse(urljoin(base, h)).path
                if re.search(r'/(merceria|academy)/\1/', path): errores.append((ruta, h, 'prefijo duplicado ' + path))
                if path not in vistas and path not in cola and not re.search(r'\.(webp|jpg|jpeg|png|svg|css|js|pdf|json|xml|txt)$', path): cola.append(path)
        for h in pr.res:
            if classify(h) != 'int': continue
            for base in {base_nav, base_simple}:
                path = urlparse(urljoin(base, h)).path
                if path not in recursos: recursos[path] = get(SITE + path, 'HEAD')[0]
        if len(vistas) > 400: break
    for ruta, h, st in [(r, r, s) for r, s in estado.items() if s != 200]: pass
    rotos_rec = [(r, s) for r, s in recursos.items() if s != 200]
    print('FECHA (UTC):', time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime()), '| sitio:', SITE)
    print('Páginas rastreadas:', len(vistas), '| enlaces internos vistos:', int_n, '| enlaces externos:', ext_n, '| redirects:', redirs)
    print('Páginas no 200:', [(r, s) for r, s in estado.items() if s != 200], '| errores de ruta:', errores[:20])
    print('Recursos únicos:', len(recursos), '| recursos rotos:', rotos_rec[:20])
    print('Canonical:', len(canon), '| canonical no 200:', [c for c in canon if c[2] != 200])
    malos = [r for r, s in estado.items() if s != 200] + errores + rotos_rec + [c for c in canon if c[2] != 200]
    print('RESULTADO:', 'OK, 0 errores' if not malos else 'HAY %d ERRORES' % len(malos))
    sys.exit(1 if malos else 0)

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
print('rutas relativas o <base> (política: todo con / inicial):',len(politica),'| rutas con prefijo duplicado (/merceria/merceria/, /academy/academy/):',len(duplicadas))
for x in politica[:20]: print('POLITICA',x)
for x in duplicadas[:20]: print('DUPLICADA',x)
print('enlaces HTML rotos',len(bad),'| recursos rotos',len(badr),'| canonical malos',len(badc),'| og:image rotos',len(bado),'| sitemap urls',len(sm),'malas',len(badsm))
for n,l in (('LINK',bad),('RES',badr),('CANON',badc),('OG',bado),('SM',badsm)):
    for x in l[:80]: print(n,x)

# --- comprobación HTTP real: necesita un servidor local en el puerto 8770 (python3 -m http.server 8770 desde la raíz) ---
import urllib.request,urllib.error,collections
BASE_HTTP='https://lanarosacrochet.com' if '--produccion' in sys.argv else 'http://localhost:8770'
urls=sorted({x[2] for x in res['links']}|{x[2] for x in res['res']}|{urlparse(l).path for l,_,_ in sm})
cnt=collections.Counter(); malos=[]
class NoRed(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*a,**k): return None
op=urllib.request.build_opener(NoRed)
for u in urls:
    try:
        r=op.open(BASE_HTTP+u,timeout=10); st=r.status
    except urllib.error.HTTPError as e: st=e.code
    except Exception as e: st='error'
    if st in (301,302):
        cnt[st]+=1
        try:
            r=urllib.request.urlopen(BASE_HTTP+u,timeout=10); st=r.status
        except urllib.error.HTTPError as e: st=e.code
    cnt[st]+=1
    if st!=200: malos.append((u,st))
print('HTTP urls únicas',len(urls),dict(cnt)); print('no 200:',malos[:20])

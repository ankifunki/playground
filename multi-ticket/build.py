"""Builds multi-ticket/index.html from the Multi Location deck's shell (styles, script, nav)
plus this deck's slides. Run: python3 multi-ticket/build.py"""
import re
from pathlib import Path

HERE = Path(__file__).parent
SRC = (HERE.parent / "case-study" / "index.html").read_text()
head, rest = SRC.split('<main class="deck" id="deck" aria-live="polite">', 1)
_, tail = rest.split("</main>", 1)
mark = re.search(r'<svg class="mark".*?</svg>', rest, re.S).group(0)
head = head.replace("<title>Multi Location at GlossGenius</title>", "<title>Flexible Checkout at GlossGenius</title>")

CSS = """
/* ---- Flexible Checkout additions ---- */
/* Phone-shaped screens: the frame takes the phone's proportions and a fixed height */
.tall .frame{width:auto;height:min(50svh,460px);aspect-ratio:var(--r);margin-inline:auto}
.dt .frame{height:auto;width:100%}
.morph.tall{justify-items:start}
.morph.tall .frame{margin-inline:0}

/* Prototype player: replays a Figma prototype path with taps on the real hotspots */
.proto{display:grid;gap:var(--gap-m)}
.proto.tall .frame{height:min(44svh,400px)}
.proto .frame{--fig:cubic-bezier(0,0,.58,1);background:#12100b}
.proto .frame img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top left;opacity:0;z-index:0}
.proto .frame img.on{opacity:1;z-index:1}
.proto .frame img.in-slide{z-index:2;box-shadow:-18px 0 32px rgb(0 0 0 / .45)}
.proto .frame img.in-fade{z-index:2}
.press{position:absolute;z-index:4;border-radius:12px;background:rgb(255 255 255 / .14);opacity:0;pointer-events:none;transition:opacity .22s var(--fig)}
.press.on{opacity:1;transition-duration:.08s}
.tap{position:absolute;left:0;top:0;width:36px;height:36px;margin:-18px 0 0 -18px;border-radius:50%;pointer-events:none;z-index:5;opacity:0}
.tap::before,.tap::after{content:"";position:absolute;inset:0;border-radius:50%}
.tap::before{background:rgb(255 255 255 / .5);box-shadow:0 0 0 1px rgb(255 255 255 / .6);scale:.45}
.tap::after{border:1.5px solid rgb(255 255 255 / .8)}
.tap.go{animation:tapdot .7s var(--ease) both}.tap.go::after{animation:tapring .7s var(--ease) both}
@keyframes tapdot{0%{opacity:0;scale:1.3}25%{opacity:1;scale:1}80%{opacity:1}100%{opacity:0}}
@keyframes tapring{0%{scale:.5;opacity:.9}100%{scale:1.7;opacity:0}}
/* Benchmark matrix */
.mx{display:grid;grid-template-columns:minmax(0,2.6fr) repeat(5,minmax(0,1fr));align-items:stretch}
.mx > *{padding:6px 0;border-top:1px solid var(--rule);display:flex;align-items:center}
.mx .dc{justify-content:center}
.mx .h{border-top:0;padding-top:0;justify-content:center;font:400 var(--t-mono)/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);text-align:center}
.mx .h:first-child{justify-content:flex-start}
.mx .h .full{display:none}
.mx .c{font:400 12px/16px var(--body);color:var(--grey);padding-right:8px;transition:color .5s var(--ease)}
:is(.mx,.mx-legend) .d{display:inline-block;flex:none;width:12px;height:12px;border-radius:50%;box-sizing:border-box;border:1.4px solid var(--ink);opacity:0;scale:.4;transition:opacity .35s var(--ease),scale .45s var(--ease)}
:is(.mx,.mx-legend) .d.s{background:var(--ink)}
:is(.mx,.mx-legend) .d.m{background:linear-gradient(90deg,var(--ink) 50%,transparent 50%)}
:is(.mx,.mx-legend) .d.w{background:radial-gradient(circle,var(--ink) 0 2px,transparent 2.5px)}
:is(.mx,.mx-legend) .d.n{border-color:rgb(27 32 31 / .22)}
.slide.on .mx .d{opacity:1;scale:1}
.slide.on .mx .c.gap{color:var(--accent)}
.mx-legend{display:flex;flex-wrap:wrap;gap:6px 16px;font:400 var(--t-mono)/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}
.mx-legend span{display:inline-flex;align-items:center;gap:6px}
.mx-legend .d{opacity:1;scale:1;width:10px;height:10px}
.bench{display:grid;gap:var(--gap-m)}
.story .pin:nth-child(2){opacity:1;transform:none}
/* Order of steps: tip before or after payment */
.order{display:grid;gap:var(--gap-l)}
.seq{display:grid;gap:var(--gap-s)}
.chips{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.chip{display:inline-flex;align-items:center;height:34px;padding:0 14px;border-radius:999px;border:1px solid var(--rule);font:500 14px/1 var(--body);color:var(--ink);background:rgb(255 255 255 / .35);opacity:0;translate:0 6px;transition:opacity .4s var(--ease),translate .5s var(--ease)}
.chip.k{border-color:var(--accent);color:var(--accent);background:rgb(244 245 255 / .8)}
.arw{color:var(--faint);font:400 14px/1 var(--mono);opacity:0;transition:opacity .4s var(--ease)}
.slide.on .chip,.slide.on .arw{opacity:1;translate:0 0}
/* Annotated screen: leader lines from points on the screen to callouts (laid out and drawn by JS) */
.cartmix{grid-column:1 / -1}
.cartmix .bar{align-items:flex-start}
.anno{position:relative;grid-column:1 / -1;height:min(46svh,390px)}
.anno .an-ph{position:absolute;left:0;top:0;height:100%;aspect-ratio:var(--r)}
.anno .an-ph .frame{height:100%!important;width:100%!important;aspect-ratio:auto!important;margin:0}
.anno .an-ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top left}
.anno svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:3}
/* Callouts: hairline leaders and small dots in one color. They enter one by one (dot, then the line draws out,
   then the label settles in from the line's direction) and leave together. */
.anno path{fill:none;stroke:var(--accent);stroke-width:1;stroke-opacity:.55;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .2s var(--ease)}
.anno circle{fill:var(--accent);scale:0;transform-box:fill-box;transform-origin:center;transition:scale .2s var(--ease)}
.an-lb{--dx:-8px;position:absolute;display:grid;gap:1px;opacity:0;translate:var(--dx) 0;filter:blur(3px);transition:opacity .2s var(--ease),translate .2s var(--ease),filter .2s var(--ease)}
.an-lb.l{--dx:8px;text-align:right}
.an-lb b{font:500 12px/16px var(--head);letter-spacing:-.005em;color:var(--ink)}
.an-lb span{font:400 11.5px/15px var(--body);color:var(--grey);text-wrap:pretty}
.anno.show circle{scale:1;transition:scale .45s var(--ease) calc(var(--i) * .14s)}
.anno.show path{stroke-dashoffset:0;transition:stroke-dashoffset .6s var(--ease) calc(.1s + var(--i) * .14s)}
.anno.show .an-lb{opacity:1;translate:0 0;filter:none;transition:opacity .5s var(--ease) calc(.35s + var(--i) * .14s),translate .7s var(--ease) calc(.35s + var(--i) * .14s),filter .5s var(--ease) calc(.35s + var(--i) * .14s)}
@media (prefers-reduced-motion:reduce){.anno path,.anno circle,.an-lb{transition:none!important;filter:none}}
@media (min-width:900px) and (min-aspect-ratio:1/1){
  .tall .frame,.proto.tall .frame{height:calc(var(--u)*560);aspect-ratio:var(--r)}
  .morph.tall{grid-column:1 / -1;grid-template-columns:auto 1fr;column-gap:calc(var(--u)*64);align-items:end}
  .morph.tall .bar{flex-direction:column-reverse;align-items:flex-start;gap:calc(var(--u)*24);padding-bottom:calc(var(--u)*8)}
  .flowseq.tall,.proto{grid-template-columns:auto minmax(0,1fr);column-gap:calc(var(--u)*64);row-gap:calc(var(--u)*24);align-content:start}
  .proto > .frame{grid-row:1 / span 3}
  .bench{grid-column:1 / -1;grid-template-columns:repeat(12,1fr);column-gap:calc(var(--u)*24)}
  .bench .mx{grid-column:1 / span 8}
  .bench aside{grid-column:10 / span 3;display:grid;gap:calc(var(--u)*24);align-content:start}
  .mx{grid-template-columns:minmax(0,1.7fr) repeat(5,minmax(0,1fr))}
  .mx > *{padding:calc(var(--u)*11) 0}
  .mx .c{font-size:calc(var(--u)*16);line-height:calc(var(--u)*22)}
  .mx .h .full{display:inline}.mx .h .short{display:none}
  .mx .d{width:calc(var(--u)*14);height:calc(var(--u)*14)}
  .order{grid-column:1 / span 9;gap:calc(var(--u)*48)}
  .chip{height:calc(var(--u)*44);padding:0 calc(var(--u)*20);font-size:calc(var(--u)*18)}
  .arw{font-size:calc(var(--u)*18)}
  .anno{height:calc(var(--u)*580)}
  .cartmix{row-gap:calc(var(--u)*24)}
  .cartmix .bar{justify-content:center}
  .an-lb{gap:calc(var(--u)*3)}
  .an-lb b{font-size:calc(var(--u)*16);line-height:calc(var(--u)*22)}
  .an-lb span{font-size:calc(var(--u)*14);line-height:calc(var(--u)*20)}
}
"""
head = head.replace("\n</style>", "\n" + CSS + "</style>", 1)

def frame(src_list, alt_list, ratio, seq=False):
    imgs = "".join(
        (f'<img src="img/{s}-f.webp" data-full="img/{s}.webp"' if (HERE / "img" / f"{s}-f.webp").exists() else f'<img src="img/{s}.webp"')
        + f' alt="{a}" style="object-position:top left" {"decoding=\"async\"" if i == 0 else "loading=\"lazy\" decoding=\"async\""}>'
        for i, (s, a) in enumerate(zip(src_list, alt_list)))
    return f'<div class="frame{" seq" if seq else ""}" data-zoom role="button" tabindex="0" aria-label="Enlarge screen" style="--r:{ratio}">{imgs}</div>'

def flow(title, ratio, items, foot, tall=False):
    srcs, labels = zip(*items)
    steps = "".join(f'<button type="button" aria-label="Step {i+1}: {l}" aria-pressed="{"true" if i == 0 else "false"}"><span class="mono">{i+1:02d}</span><b>{l}</b></button>' for i, l in enumerate(labels))
    return f'''<section class="slide screens" data-name="{title}"><div class="stage">
  <div class="head"><h3 class="title">{title}</h3></div>
  <div class="content"><div class="flowseq{(" tall" + (" dt" if tall == "dt" else "")) if tall else ""}">
    {frame(srcs, [f"Step {i+1}: {l}" for i, l in enumerate(labels)], ratio, seq=True)}
    <div class="steps" role="group" aria-label="Flow steps">{steps}</div>
    <p class="foot">{foot}</p>
  </div></div>
</div></section>'''

def morph(title, before, after, ratio, foot, alts, tall=False, meta=""):
    return f'''<section class="slide screens" data-name="{title}"><div class="stage">
  <div class="head"><h3 class="title">{title}</h3>{f'<span class="mono">{meta}</span>' if meta else ""}</div>
  <div class="content"><div class="morph{" tall" if tall else ""}">
    <div class="frame" data-zoom role="button" tabindex="0" aria-label="Enlarge screen" style="--r:{ratio}">
      <div class="layer before"><img src="img/{before}.webp" alt="Before: {alts[0]}" style="object-position:top left" loading="lazy" decoding="async"></div>
      <div class="layer after"><img src="img/{after}.webp" alt="After: {alts[1]}" style="object-position:top left" loading="lazy" decoding="async"></div><i class="edge"></i>
    </div>
    <div class="bar"><p class="foot">{foot}</p><div class="toggle"><button type="button" aria-pressed="true">Before</button><button type="button" aria-pressed="false">After</button><i></i></div></div>
  </div></div>
</div></section>'''

JS = r"""<script>
(function(){
  var desk=matchMedia('(min-width:900px) and (min-aspect-ratio:1/1)');
  document.querySelectorAll('.anno').forEach(function(a){
    var ph=a.querySelector('.an-ph'),svg=a.querySelector('svg'),lbs=[].slice.call(a.querySelectorAll('.an-lb'));
    function lay(){
      var W=a.clientWidth,H=a.clientHeight;if(!W||!H)return;
      var r=(getComputedStyle(a).getPropertyValue('--r')||'393/852').split('/'),pw=H*r[0]/r[1],d=desk.matches,u=d?W/1336:1,reach=d?72*u:20,gap=d?18*u:10;
      var px=d?(W-pw)/2:0;ph.style.left=px+'px';ph.style.width=pw+'px';
      var lw=d?Math.min(260*u,px-reach-8):W-pw-reach;
      var sides={l:[],r:[]},th=d?11*u:8,off=d?10*u:8;
      lbs.forEach(function(l){var s=d?l.dataset.side:'r';l.classList.toggle('l',s==='l');l.style.width=lw+'px';
        l.style.left=(s==='l'?px-reach-lw:px+pw+reach)+'px';
        sides[s].push({el:l,ay:(+(d?l.dataset.y:l.dataset.ym))*H,i:+l.dataset.i})});
      // Straight leaders only: each starts just off the phone's edge, level with the element it names,
      // and runs out to the label's first line. Nothing is drawn on the screen itself.
      var out='';
      ['l','r'].forEach(function(k){var list=sides[k].sort(function(p,q){return p.ay-q.ay}),bottom=-1e9;
        list.forEach(function(c){var h=c.el.offsetHeight,t=Math.max(c.ay-th,bottom+gap);t=Math.min(t,H-h);c.t=t;bottom=t+h});
        list.forEach(function(c){c.el.style.top=c.t+'px';var y=(c.t+th).toFixed(1),
          x0=k==='l'?px-off:px+pw+off,x1=k==='l'?px-reach+6:px+pw+reach-6;
          out+='<path style="--i:'+c.i+'" pathLength="1" d="M'+x0.toFixed(1)+' '+y+'H'+x1.toFixed(1)+'"/><circle style="--i:'+c.i+'" cx="'+x0.toFixed(1)+'" cy="'+y+'" r="'+(d?3*u:2.5)+'"/>'})});
      svg.innerHTML=out}
    lay();addEventListener('resize',lay);if(document.fonts)document.fonts.ready.then(lay);
    // Callouts belong to the "after": they come in once the wipe has landed and step out when it goes back.
    var slide=a.closest('.slide'),m=a.closest('.morph'),was=null;
    function upd(){var on=slide.classList.contains('on')&&(!m||m.classList.contains('is-after'));if(on===was)return;was=on;clearTimeout(a._s);
      if(on){lay();a._s=setTimeout(function(){a.classList.add('show')},m?850:350)}else a.classList.remove('show')}
    [slide,m].forEach(function(el){if(el)new MutationObserver(upd).observe(el,{attributes:true,attributeFilter:['class']})});upd();
  });
})();
</script>
<script>
(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.proto').forEach(function(p){
    // Replays a Figma prototype path with its own transitions: Slide in (new screen over a still one) and
    // Smart animate (in-place change, so a dissolve with the new screen on top), at Figma's 300ms ease-out cubic.
    var f=p.querySelector('.frame'),imgs=[].slice.call(f.querySelectorAll('img')),btns=[].slice.call(p.querySelectorAll('.steps button')),tap=f.querySelector('.tap'),press=f.querySelector('.press'),i=0,t=[],busy=null;
    var DUR=300,EASE='cubic-bezier(0,0,.58,1)';
    function clear(){t.forEach(clearTimeout);t=[];press.classList.remove('on')}
    function mark(j){btns.forEach(function(b,k){b.setAttribute('aria-pressed',String(k===j));b.classList.toggle('seen',k<j)})}
    function reset(im){im.style.transition='none';im.style.transform='';im.style.opacity='';im.classList.remove('in-slide','in-fade')}
    function show(j){if(busy){clearTimeout(busy);busy=null}f.querySelectorAll('.mv').forEach(function(x){x.remove()});imgs.forEach(unmask);imgs.forEach(function(im,k){reset(im);im.classList.toggle('on',k===j)});i=j;mark(j)}
    function go(j){var a=imgs[i],b=imgs[j],tr=a.dataset.tr;reset(b);
      if(tr==='slide'){b.classList.add('in-slide');b.style.transform='translateX(100%)';b.style.opacity='1';void b.offsetWidth;
        b.style.transition='transform '+DUR+'ms '+EASE;b.style.transform='translateX(0)'}
      else if(tr==='back'){b.classList.add('on');a.classList.add('in-slide');a.style.transform='translateX(0)';void a.offsetWidth;
        a.style.transition='transform '+DUR+'ms '+EASE;a.style.transform='translateX(100%)'}
      else if(tr&&tr.indexOf('sheet')===0)sheet(a,b,+tr.split(':')[1],tr.indexOf('sheetdown')===0);
      else{b.classList.add('in-fade');b.style.opacity='0';var mv=moves(a,b);void b.offsetWidth;b.style.transition='opacity '+DUR+'ms '+EASE;b.style.opacity='1';if(mv)mv()}
      busy=setTimeout(function(){busy=null;a.classList.remove('on');reset(a);reset(b);unmask(a);unmask(b);f.querySelectorAll('.mv').forEach(function(x){x.remove()});b.classList.add('on')},DUR+40);
      i=j;mark(j)}
    function setMask(im,rects,S){var keep=[],y=0;rects.sort(function(p,q){return p[0]-q[0]}).forEach(function(r){if(r[0]>y)keep.push([y,r[0]-y]);y=Math.max(y,r[0]+r[1])});keep.push([y,852-y]);
      var img=keep.map(function(){return 'linear-gradient(#000,#000)'}).join(','),pos=keep.map(function(k){return '0 '+k[0]*S+'px'}).join(','),size=keep.map(function(k){return '100% '+k[1]*S+'px'}).join(',');
      ['mask','webkitMask'].forEach(function(p){im.style[p+'Image']=img;im.style[p+'Position']=pos;im.style[p+'Size']=size;im.style[p+'Repeat']='no-repeat'})}
    function unmask(im){['mask','webkitMask'].forEach(function(p){im.style[p+'Image']=''})}
    // Smart animate for elements that move: each listed block glides from its old place to its new one while its
    // content dissolves, and both screens are masked around the blocks so nothing is seen twice.
    function moves(a,b){if(!a.dataset.moves)return null;var S=f.clientHeight/852,m=a.dataset.moves.split(';').map(function(x){return x.split(',').map(Number)}),wins=[];
      setMask(a,m.map(function(x){return [x[0],x[1]]}),S);setMask(b,m.map(function(x){return [x[2],x[3]]}),S);
      m.forEach(function(x){var w=document.createElement('div');w.className='mv';w.style.cssText='position:absolute;left:0;right:0;overflow:hidden;z-index:3;top:'+x[0]*S+'px;height:'+x[1]*S+'px';
        var o=new Image(),n=new Image();[o,n].forEach(function(im,k){im.src=k?b.src:a.src;im.alt='';im.style.cssText='position:absolute;left:0;width:100%;height:'+852*S+'px;max-width:none;object-fit:fill;opacity:'+(k?0:1)+';top:'+(-(k?x[2]:x[0])*S)+'px';w.appendChild(im)});
        f.appendChild(w);wins.push([w,o,n,x])});
      return function(){wins.forEach(function(v){var tr='top '+DUR+'ms '+EASE+',height '+DUR+'ms '+EASE;v[0].style.transition=tr;v[0].style.top=v[3][2]*S+'px';v[0].style.height=v[3][3]*S+'px';
        v[1].style.transition=v[2].style.transition='opacity '+DUR+'ms '+EASE;v[1].style.opacity='0';v[2].style.opacity='1'})}}
    // Move in from bottom / move out to bottom for a sheet that starts at y (in the 393x852 frame): the sheet slides
    // while the dimmed backdrop above it fades, as a Figma overlay does
    function sheet(a,b,y,down){var S=f.clientHeight/852,sh=(852-y)*S,src=down?a:b,top=document.createElement('img'),bot=document.createElement('img');
      [top,bot].forEach(function(im){im.src=src.currentSrc||src.src;im.alt='';im.className='mv';im.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top left;opacity:1;z-index:3';f.appendChild(im)});
      top.style.clipPath='inset(0 0 '+sh+'px 0)';bot.style.clipPath='inset('+y*S+'px 0 0 0)';
      if(down){b.classList.add('on');a.classList.remove('on')}
      top.style.opacity=down?'1':'0';bot.style.transform='translateY('+(down?0:sh)+'px)';void top.offsetWidth;
      var tr2='opacity '+DUR+'ms '+EASE+',transform '+DUR+'ms '+EASE;top.style.transition=bot.style.transition=tr2;
      top.style.opacity=down?'0':'1';bot.style.transform='translateY('+(down?sh:0)+'px)'}
    function hot(j){var d=(imgs[j].dataset.hot||'').split(',').map(Number);return d.length===4?d:null}
    function tapAt(j){var h=hot(j);if(!h)return;var W=393,H=852;
      press.style.left=h[0]/W*100+'%';press.style.top=h[1]/H*100+'%';press.style.width=h[2]/W*100+'%';press.style.height=h[3]/H*100+'%';
      tap.style.left=(h[0]+h[2]/2)/W*100+'%';tap.style.top=(h[1]+h[3]/2)/H*100+'%';
      tap.classList.remove('go');void tap.offsetWidth;tap.classList.add('go');press.classList.add('on')}
    function run(){clear();if(reduce)return;
      if(i>=imgs.length-1){t.push(setTimeout(function(){show(0);run()},2600));return}
      t.push(setTimeout(function(){tapAt(i);
        t.push(setTimeout(function(){press.classList.remove('on');go(i+1);run()},hot(i)?260:0))},1500))}
    btns.forEach(function(b,k){b.addEventListener('click',function(e){e.stopPropagation();clear();show(k);run()})});
    var slide=p.closest('.slide');
    new MutationObserver(function(){if(slide.classList.contains('on')){clear();show(0);t.push(setTimeout(run,500))}else clear()}).observe(slide,{attributes:true,attributeFilter:['class']});
    f.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse')clear()});
    f.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')run()});
    show(0);if(slide.classList.contains('on'))t.push(setTimeout(run,500));
  });
})();
</script>
"""

def proto(title, ratio, steps, foot, meta=""):
    imgs = "".join(f'<img src="img/{st[0]}.webp" alt="{st[1]}" data-hot="{st[2]}" data-tr="{st[3]}"{f' data-moves="{st[4]}"' if len(st) > 4 else ""} decoding="async">' for st in steps)
    btns = "".join(f'<button type="button" aria-pressed="{"true" if i == 0 else "false"}"><span class="mono">{i+1:02d}</span><b>{l}</b></button>' for i, (s, l, *_) in enumerate(steps))
    return f'''<section class="slide screens" data-name="{title}"><div class="stage">
  <div class="head"><h3 class="title">{title}</h3>{f'<span class="mono">{meta}</span>' if meta else ""}</div>
  <div class="content"><div class="proto tall">
    <div class="frame seq" data-zoom role="button" tabindex="0" aria-label="Enlarge screen" style="--r:{ratio}">{imgs}<i class="press"></i><i class="tap"></i></div>
    <div class="steps" role="group" aria-label="Prototype steps">{btns}</div>
    <p class="foot">{foot}</p>
  </div></div>
</div></section>'''

def anno(title, src, ratio, alt, notes, before=None, alts=("", "")):
    lbs = "".join(f'<div class="an-lb" data-y="{y/100}" data-ym="{ym/100}" data-side="{side}" data-i="{i}"><b>{t}</b><span>{b}</span></div>' for i, (y, ym, side, t, b) in enumerate(notes))
    if before:
        frame = f'''<div class="frame" data-zoom role="button" tabindex="0" aria-label="Enlarge screen" style="--r:{ratio}">
      <div class="layer before"><img src="img/{before}.webp" alt="Before: {alts[0]}" decoding="async"></div>
      <div class="layer after"><img src="img/{src}.webp" alt="After: {alts[1]}" decoding="async"></div><i class="edge"></i></div>'''
        bar = '<div class="bar"><div class="toggle"><button type="button" aria-pressed="true">Before</button><button type="button" aria-pressed="false">After</button><i></i></div></div>'
        return f'''<section class="slide screens" data-name="{title}"><div class="stage">
  <div class="head"><h3 class="title">{title}</h3></div>
  <div class="content"><div class="morph cartmix"><div class="anno" style="--r:{ratio}">
    <div class="an-ph">{frame}</div>
    <svg aria-hidden="true"></svg>{lbs}
  </div>{bar}</div></div>
</div></section>'''
    return f'''<section class="slide screens" data-name="{title}"><div class="stage">
  <div class="head"><h3 class="title">{title}</h3></div>
  <div class="content"><div class="anno" style="--r:{ratio}">
    <div class="an-ph"><div class="frame" style="--r:{ratio}"><img src="img/{src}.webp" alt="{alt}" decoding="async"></div></div>
    <svg aria-hidden="true"></svg>{lbs}
  </div></div>
</div></section>'''

def chapter(n, name, label=None):
    return f'''<section class="slide chapter" data-name="{name}"><div class="stage">
  <div class="head"><span class="mono">{label or f"Chapter {n:02d}"}</span></div>
  <div class="big"><h2>{name}</h2></div>
</div></section>'''

# Benchmark: Square, Zenoti, Boulevard, Fresha, Mangomint (March 2026 analysis)
PLAT = [("Square", "Sq"), ("Zenoti", "Zen"), ("Boulevard", "Blvd"), ("Fresha", "Fre"), ("Mangomint", "MM")]
CAPS = [
    ("Group checkout", "nsswS", False),
    ("Group on the fly", "nsmns", True),
    ("One pays for all", "nssss", False),
    ("Each pays their own", "nsmws", True),
    ("Mixed payers", "nsnns", False),
    ("Split mid-checkout", "nmnns", False),
    ("Shared memberships", "nnnns", True),
    ("Tip split by provider", "msnns", False),
]
cells = ['<span class="h">Capability</span>'] + [f'<span class="h"><span class="full">{f}</span><span class="short">{s}</span></span>' for f, s in PLAT]
i = 0
for label, ratings, gap in CAPS:
    cells.append(f'<span class="c{" gap" if gap else ""}" style="transition-delay:2s">{label}</span>')
    for r in ratings.lower():
        cells.append(f'<span class="dc"><i class="d {r}" style="transition-delay:{120 + i * 28}ms"></i></span>')
        i += 1
legend = '<div class="mx-legend"><span><i class="d s"></i>Strong</span><span><i class="d m"></i>Medium</span><span><i class="d w"></i>Weak</span><span><i class="d n"></i>None</span></div>'

def chips(items, key):
    out = []
    for j, t in enumerate(items):
        if j: out.append(f'<span class="arw" style="transition-delay:{j * 160 - 80}ms">&rarr;</span>')
        out.append(f'<span class="chip{" k" if t == key else ""}" style="transition-delay:{j * 160}ms">{t}</span>')
    return "".join(out)

SLIDES = f'''
<section class="slide divider" data-name="Flexible Checkout"><div class="stage">
  <div class="head">
    {mark}
  </div>
  <div class="big"><h2>Flexible<br>Checkout</h2><p class="by">One checkout for every appointment at the counter.</p></div>
</div></section>

<section class="slide" data-name="GlossGenius"><div class="stage">
  <div class="head"><h3 class="title">GlossGenius</h3></div>
  <div class="content"><p class="statement">Software that runs <b>salons, barbershops and spas</b>. Booking, payments, staff and clients, in one place.</p></div>
</div></section>

<section class="slide" data-name="Meet Rachel"><div class="stage">
  <div class="head"><h3 class="title">Meet Rachel</h3></div>
  <div class="content" style="padding-top:calc(var(--u)*96)"><div class="story">
    <div class="pins"><span class="pin">Cut<span class="acct">· Ticket 1</span></span><span class="pin">Color<span class="acct">· Ticket 2</span></span><span class="pin">Trim<span class="acct">· Ticket 3</span></span></div>
    <div class="beats notes"><p class="note on"><span class="mono">One client</span><span>Rachel books a cut and color with <b>two stylists</b>, back to back.</span></p><p class="note"><span class="mono">Plus one</span><span>Her daughter tags along for a trim. <b>Rachel pays for both.</b></span></p><p class="note"><span class="mono">Checkout</span><span>The front desk rings up <b>three tickets</b>: three tips, three signatures, while the line grows.</span></p></div>
    <div class="steps" role="group" aria-label="Story"><button type="button" aria-pressed="true"><span class="mono">01</span><b>Book</b></button><button type="button" aria-pressed="false"><span class="mono">02</span><b>Add</b></button><button type="button" aria-pressed="false"><span class="mono">03</span><b>Pay</b></button></div>
  </div></div>
</div></section>

<section class="slide" data-name="Goal"><div class="stage">
  <div class="head"><h3 class="title">Goal</h3></div>
  <div class="content">
    <p class="statement">Build <b>one flexible checkout</b> for every multi scenario: one client with many appointments, or many clients paying together.</p>
    <div class="facts">
      <div class="fact"><span class="mono">Role</span><span class="v">Staff product designer</span></div>
      <div class="fact"><span class="mono">Scope</span><span class="v">Research, mobile, web, tipping, payments</span></div>
    </div>
  </div>
</div></section>

<section class="slide" data-name="Two phases"><div class="stage">
  <div class="head"><h3 class="title">Two phases</h3></div>
  <div class="content">
    <div class="cols">
      <div class="col c5"><span class="mono">Phase 1</span><p class="sub">One client, many appointments</p><p class="text">A single checkout for the same client with multiple appointments on the same day.</p></div>
      <div class="col c5b"><span class="mono">Phase 2</span><p class="sub">Many clients, one checkout</p><p class="text">A single checkout for multiple clients and appointments on the same day.</p></div>
    </div>
  </div>
</div></section>

<section class="slide" data-name="How others do it"><div class="stage">
  <div class="head"><h3 class="title">How others do it</h3><span class="mono">Benchmark · Mar 2026</span></div>
  <div class="content"><div class="bench">
    <div class="mx" role="table" aria-label="Group checkout capabilities across Square, Zenoti, Boulevard, Fresha and Mangomint">{"".join(cells)}</div>
    <aside>{legend}<p class="foot">Five platforms, eight capabilities, from help docs, forums and verified reviews. Square has no group checkout at all; Mangomint comes closest. The highlighted rows are where nearly everyone falls short.</p></aside>
  </div></div>
</div></section>

<section class="slide" data-name="Where nobody gets it right"><div class="stage">
  <div class="head"><h3 class="title">Where nobody gets it right</h3></div>
  <div class="content">
    <div class="cols">
      <ol class="list hard"><li><span><b>Grouping on the fly</b><i>&ldquo;Two friends walk in without a booking. One wants to pay for both.&rdquo;</i></span></li><li><span><b>Paying separately</b><i>&ldquo;Eight bridesmaids, all paying separately.&rdquo;</i></span></li><li><span><b>Shared memberships</b><i>&ldquo;Can I use my membership credits for my mom&rsquo;s blowout?&rdquo;</i></span></li><li><span><b>Discounts any time</b><i>&ldquo;I forgot to apply their membership before grouping.&rdquo;</i></span></li></ol>
    </div>
  </div>
</div></section>

<section class="slide" data-name="Tip before or after payment"><div class="stage">
  <div class="head"><h3 class="title">Tip, then pay?</h3></div>
  <div class="content"><div class="order">
    <div class="seq"><span class="mono">GlossGenius</span><div class="chips">{chips(["Checkout", "Tip", "Payment", "Done"], "Tip")}</div></div>
    <div class="seq"><span class="mono">Competitors</span><div class="chips">{chips(["Checkout", "Payment", "Tip", "Done"], "Tip")}</div></div>
    <p class="foot">Checkout is one of the most sensitive flows, and ours was already longer than competitors&rsquo;. Prototyping both orders, one close to production and one aligned with the industry, settled the direction before going deep.</p>
  </div></div>
</div></section>

{chapter(1, "One client, many appointments", "Phase 1")}

{anno("The cart", "cart-after", "393/852", "", [
  (30, 28, "r", "Add items up top", "Services, products and more, one tap away."),
  (38.3, 45.2, "l", "Provider on every line", "Commission and tips follow each item."),
], before="cart-before", alts=("client card, a single provider, and line items with thumbnails", "Rachel Green as the title, add items to cart up top, and a provider on each line"))}

{morph("Tipping on one ticket", "tip-before", "tip-after", "393/852", "Three tickets meant three tip prompts. Now one tip covers the visit, split across providers by service value.", ["tip and signature on a single appointment", "one tip across every provider on the ticket"], tall=True)}

{flow("Customize the tip", "393/852", [("tip-after", "One tip"), ("tip-custom", "Per order"), ("tip-provider", "Per provider")], "Customize the tip per order or per provider.", tall=True)}

{proto("One cart, every appointment", "393/852", [("m-1", "Cart", "24,234,344,44", "sheet:400"), ("m-2", "Add items", "343,422,30,30", "sheetdown:400"), ("m-1", "Cart", "20,350,355,46", "slide"), ("m-3", "Edit item", "24,703,344,48", "back"), ("m-1", "Cart", "20,612,355,34", "slide"), ("m-4", "Discount", "24,758,344,48", "back"), ("m-1", "Cart", "112,758,256,46", "slide"), ("m-5", "Collect tip", "24,288,344,72", "slide"), ("m-6", "Tip and sign", "", "")], "Three tickets at the desk become one checkout: one cart, one tip, one signature.", meta="Prototype · One cart")}

{chapter(2, "Many clients, one checkout", "Phase 2")}

{morph("Group checkout", "list-before", "list-after", "393/852", "Paying for someone else meant a second checkout. Same-day appointments now group into one, with a clear way in.", ["one ticket per appointment", "appointments grouped under a new group checkout"], tall=True, meta="In progress")}

{proto("One client, played", "393/852", [("sc-1", "Checkout", "24,216,345,114", "slide"), ("sc-2", "Appointment", "24,758,166,50", "slide"), ("sc-3", "Select", "24,198,345,109", "smart"), ("sc-4", "Selected", "24,755,345,48", "slide"), ("sc-5", "One sale", "116,756,253,48", "slide"), ("sc-6", "Payment", "0,467,393,74", "slide"), ("sc-7", "Tip on", "0,279,393,76", "slide"), ("sc-8", "Tip and sign", "24,758,345,48", "slide"), ("sc-9", "Done", "", "")], "From her appointment, Rachel&rsquo;s other booking joins the same sale, so she pays once.", meta="Prototype · One client")}

{proto("Group checkout, played", "393/852", [("gc-1", "Checkout", "266,78,40,40", "smart", "220,111,291,107;342,103,408,107;456,103,525,107;570,74,642,74"), ("gc-2", "Select mode", "24,290,345,109", "smart"), ("gc-3", "Rachel", "24,407,345,109", "smart"), ("gc-4", "Ashley", "24,731,345,48", "smart"), ("gc-5", "One sale", "116,756,253,48", "slide"), ("gc-6", "Payment", "0,467,393,74", "slide"), ("gc-7", "Tip on", "0,279,393,76", "slide"), ("gc-8", "Tip and sign", "24,758,345,48", "slide"), ("gc-9", "Done", "", "")], "Two clients, picked straight from the list, settle in one sale with one payment and one tip.", meta="Prototype · Group checkout")}

<section class="slide divider" data-name="End"><div class="stage">
  <div class="head">
    {mark}
  </div>
  <div class="big"><h2>One checkout.<br>Every ticket.</h2></div>
</div></section>
'''

tail = tail.rstrip() + "\n" + JS
# Slides where the mock or the line carries itself: the title stays for screen readers only
NOTITLE = {"The cart", "One client, played", "Group checkout, played"}
SLIDES = re.sub(r'<section class="slide ([^"]*)" data-name="([^"]+)"', lambda m: f'<section class="slide {m.group(1)}{" notitle" if m.group(2) in NOTITLE else ""}" data-name="{m.group(2)}"', SLIDES)
out = head + '<main class="deck" id="deck" aria-live="polite">\n' + SLIDES + "\n</main>" + tail
(HERE / "index.html").write_text(out)
print("wrote", HERE / "index.html", len(out))

"""Builds multi-ticket/index.html from the Multi Location deck's shell (styles, script, nav)
plus this deck's slides. Run: python3 multi-ticket/build.py"""
import re
from pathlib import Path

HERE = Path(__file__).parent
SRC = (HERE.parent / "case-study" / "index.html").read_text()
head, rest = SRC.split('<main class="deck" id="deck" aria-live="polite">', 1)
_, tail = rest.split("</main>", 1)
mark = re.search(r'<svg class="mark".*?</svg>', rest, re.S).group(0)
head = head.replace("<title>Multi Location at GlossGenius</title>", "<title>Multi Ticket at GlossGenius</title>")

CSS = """
/* ---- Multi Ticket additions ---- */
/* Phone-shaped screens: the frame takes the phone's proportions and a fixed height */
.tall .frame{width:auto;height:min(50svh,460px);aspect-ratio:var(--r);margin-inline:auto}
.dt .frame{height:auto;width:100%}
.morph.tall{justify-items:start}
.morph.tall .frame{margin-inline:0}

/* Prototype player: replays a Figma prototype path with taps on the real hotspots */
.proto{display:grid;gap:var(--gap-m)}
.proto.tall .frame{height:min(44svh,400px)}
.proto .frame img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top left;opacity:0;transition:transform .55s var(--ease),opacity .45s var(--ease)}
.proto .frame img.on{opacity:1}
.tap{position:absolute;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;pointer-events:none;z-index:5;opacity:0}
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
}
"""
head = head.replace("\n</style>", "\n" + CSS + "</style>", 1)

def frame(src_list, alt_list, ratio, seq=False):
    imgs = "".join(
        f'<img src="img/{s}.webp" alt="{a}" style="object-position:top left" {"decoding=\"async\"" if i == 0 else "loading=\"lazy\" decoding=\"async\""}>'
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
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.proto').forEach(function(p){
    var f=p.querySelector('.frame'),imgs=[].slice.call(f.querySelectorAll('img')),btns=[].slice.call(p.querySelectorAll('.steps button')),tap=f.querySelector('.tap'),i=0,t=[];
    function clear(){t.forEach(clearTimeout);t=[]}
    function mark(j){btns.forEach(function(b,k){b.setAttribute('aria-pressed',String(k===j));b.classList.toggle('seen',k<j)})}
    function show(j){imgs.forEach(function(im,k){im.style.transition='none';im.style.transform='';im.style.zIndex='';im.classList.toggle('on',k===j)});void f.offsetWidth;imgs.forEach(function(im){im.style.transition=''});i=j;mark(j)}
    function go(j){var a=imgs[i],b=imgs[j],tr=a.dataset.tr;
      if(tr==='slide'&&j>i){b.style.transition='none';b.style.transform='translateX(100%)';b.style.zIndex=2;b.classList.add('on');void b.offsetWidth;b.style.transition='';b.style.transform='translateX(0)';a.style.transform='translateX(-28%)';
        setTimeout(function(){if(b.classList.contains('on')&&imgs[i]!==a)a.classList.remove('on');a.style.transition='none';a.style.transform='';b.style.zIndex='';void a.offsetWidth;a.style.transition=''},600)}
      else{b.classList.add('on');a.classList.remove('on')}
      i=j;mark(j)}
    function tapAt(j){var d=(imgs[j].dataset.tap||'').split(',');if(d.length<2)return;tap.style.left=d[0]+'%';tap.style.top=d[1]+'%';tap.classList.remove('go');void tap.offsetWidth;tap.classList.add('go')}
    function run(){clear();if(reduce)return;
      if(i>=imgs.length-1){t.push(setTimeout(function(){show(0);run()},2400));return}
      t.push(setTimeout(function(){tapAt(i);t.push(setTimeout(function(){go(i+1);run()},420))},1300))}
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
    imgs = "".join(f'<img src="img/{s}.webp" alt="{l}" data-tap="{tap}" data-tr="{tr}" decoding="async">' for s, l, tap, tr in steps)
    btns = "".join(f'<button type="button" aria-pressed="{"true" if i == 0 else "false"}"><span class="mono">{i+1:02d}</span><b>{l}</b></button>' for i, (s, l, tap, tr) in enumerate(steps))
    return f'''<section class="slide screens" data-name="{title}"><div class="stage">
  <div class="head"><h3 class="title">{title}</h3>{f'<span class="mono">{meta}</span>' if meta else ""}</div>
  <div class="content"><div class="proto tall">
    <div class="frame seq" data-zoom role="button" tabindex="0" aria-label="Enlarge screen" style="--r:{ratio}">{imgs}<i class="tap"></i></div>
    <div class="steps" role="group" aria-label="Prototype steps">{btns}</div>
    <p class="foot">{foot}</p>
  </div></div>
</div></section>'''

def chapter(n, name):
    return f'''<section class="slide chapter" data-name="{name}"><div class="stage">
  <div class="head"><span class="mono">Chapter {n:02d}</span></div>
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
<section class="slide divider" data-name="Multi Ticket"><div class="stage">
  <div class="head">
    {mark}
  </div>
  <div class="big"><h2>Multi<br>Ticket</h2><p class="by">One checkout for every appointment at the counter.</p></div>
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
      <div class="fact"><span class="mono">Role</span><span class="v">Sole product designer</span></div>
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
    <p class="foot">Checkout is one of the most sensitive flows for our users, and ours was already longer than competitors&rsquo;. I prototyped both orders, one close to production and one aligned with the industry, to agree on direction before going deep.</p>
  </div></div>
</div></section>

{chapter(1, "Phase 1")}

{morph("The cart", "cart-before", "cart-after", "393/852", "Items lead and adding more sits right below them, so a second appointment reads as one more line, not a new sale.", ["add items sits above the items", "items first, with add items inline below"], tall=True)}

{morph("Tipping on one ticket", "tip-before", "tip-after", "393/852", "One tip for the whole ticket, split across providers by service value.", ["tip and signature on a single appointment", "one tip across every provider on the ticket"], tall=True)}

{flow("One cart, every appointment", "393/852", [("m-1", "Cart"), ("m-2", "Add items"), ("m-3", "Edit item"), ("m-4", "Gift card"), ("m-5", "Collect tip"), ("m-6", "Tip"), ("m-7", "Sign")], "All of Rachel&rsquo;s appointments in one cart, with one tip and one signature.", tall=True)}

{chapter(2, "Web")}

{flow("Line items with add-ons", "1100/1036", [("w-1", "Cart"), ("w-2", "Add items"), ("w-3", "Add-ons"), ("w-4", "Grouped")], "Add-ons travel with their service, collapsed in the cart until you need them.", tall="dt")}

{chapter(3, "Phase 2")}

{morph("Group checkout", "list-before", "list-after", "393/852", "Same-day appointments group into one checkout, with a clear way in.", ["one ticket per appointment", "appointments grouped under a new group checkout"], tall=True, meta="In progress")}

{proto("Group checkout, played", "393/852", [("p-1", "Open client", "50,31.9", "slide"), ("p-2", "Group checkout", "27.5,92", "slide"), ("p-3", "Select", "50,29.6", "fade"), ("p-4", "Add to cart", "50,91.4", "slide"), ("p-5", "One cart", "", "")], "The Figma prototype, replayed: open Rachel, start a group checkout, pull in her other appointment, and pay once.", meta="Prototype")}

<section class="slide divider" data-name="End"><div class="stage">
  <div class="head">
    {mark}
  </div>
  <div class="big"><h2>One checkout.<br>Every ticket.</h2></div>
</div></section>
'''

tail = tail.rstrip() + "\n" + JS
out = head + '<main class="deck" id="deck" aria-live="polite">\n' + SLIDES + "\n</main>" + tail
(HERE / "index.html").write_text(out)
print("wrote", HERE / "index.html", len(out))

"""Builds instacart/index.html: the Order Issue Reporting deck, slide for slide, in the case-study style.
Reuses the Multi Location deck's shell (styles, script, nav) and adds this deck's slides.
Screens in img/ are cut from the original Figma deck. Run: python3 instacart/build.py"""
import re
from pathlib import Path

HERE = Path(__file__).parent
REPO = HERE.parent
SRC = (REPO / "case-study" / "index.html").read_text()
head, rest = SRC.split('<main class="deck" id="deck" aria-live="polite">', 1)
_, tail = rest.split("</main>", 1)
head = head.replace("<title>Multi Location at GlossGenius</title>", "<title>Order Issue Reporting at Instacart</title>")

# Instacart's carrot, from the portfolio's logo set, drawn in the divider's ink
carrot = (REPO / "site" / "public" / "logos" / "instacart.svg").read_text()
vb = re.search(r'viewBox="([^"]+)"', carrot).group(1)
d = re.search(r' d="([^"]+)"', carrot).group(1)
mark = f'<svg class="mark" viewBox="{vb}" role="img" aria-label="Instacart"><path fill="currentColor" fill-rule="evenodd" d="{d}"/></svg>'

CSS = """
/* ---- Order Issue Reporting additions ---- */
/* The mockups are shown exactly as drawn in the deck: whole phones on a transparent ground, never cropped,
   and without the frame box, shadow or rounding the other decks put around flat screens */
.deck .frame{background:none;box-shadow:none;border-radius:0;overflow:visible}
.deck .frame.seq img,.deck .frame img{object-fit:contain!important;object-position:center top!important}
/* Phone-shaped screens (as in Multi Ticket): the frame takes the phone's proportions and a fixed height */
.tall .frame{width:auto;height:min(50svh,460px);aspect-ratio:var(--r);margin-inline:auto}
.models.tall,.flowseq.tall{justify-items:start}
.models.tall .frame,.flowseq.tall .frame{margin-inline:0}
.ok{color:#1F8A4C}.no{color:#C2453D}
/* Screens laid out as in the deck, side by side, each bounded in a card (cropped screens read as screens, not
   phone silhouettes). Walkthrough videos play in their card while the slide shows. Phones: a swipeable strip. */
.mocks{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;margin-inline:calc(var(--pad-x) * -1);padding-inline:var(--pad-x);scrollbar-width:none}
.mocks::-webkit-scrollbar{display:none}
.mocks figure{flex:0 0 66%;display:grid;gap:8px;align-content:start;scroll-snap-align:start}
.mocks figure > .mono{color:var(--grey)}
.mock{position:relative;overflow:hidden;border-radius:12px;background:#fff;box-shadow:0 0 0 1px rgb(27 32 31 / .08),0 12px 28px -18px rgb(27 32 31 / .35);cursor:zoom-in}
.mock img,.mock video{display:block;width:100%;height:auto}
.chip{padding:2px 6px;border:1px solid var(--rule);border-radius:3px;color:var(--faint)}
.chip.on{color:var(--ink);border-color:var(--ink)}
@media (max-width:899px),(max-aspect-ratio:1/1){.ux .head .mono{display:none}}
.opt{display:grid;gap:4px;margin-top:var(--gap-m)}
.scale{display:flex;align-items:center;gap:10px;margin-bottom:12px;font:400 var(--t-mono)/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}
.scale i{flex:1;height:1px;background:var(--rule);position:relative}
.scale i::after{content:"";position:absolute;right:0;top:-3px;width:6px;height:6px;border-top:1px solid var(--faint);border-right:1px solid var(--faint);transform:rotate(45deg)}
.rcard{display:grid;gap:12px;margin-top:var(--gap-m);padding:20px;border-radius:12px;background:#fff;box-shadow:0 0 0 1px rgb(27 32 31 / .06)}
.rcard .rh{font:600 20px/1.2 var(--head);letter-spacing:-.02em;color:#0B4A35}
.rcard .rs{font:400 var(--t-small)/1.45 var(--body);color:#0B4A35}
.rcard ol{list-style:none;counter-reset:k;display:grid}
.rcard li{counter-increment:k;display:grid;grid-template-columns:28px 1fr;padding-block:8px;border-top:1px solid #EFE3C8;font:500 var(--t-small)/1.4 var(--body);color:var(--ink)}
.rcard li::before{content:counter(k);color:var(--grey)}
.winrow{display:grid;gap:var(--gap-l)}
.steps-ii b{font-weight:500;color:var(--ink)}

/* Two highlight columns */
.hl{display:grid;gap:0}

/* Cost drivers: two groups, each a big share with its parts as bars */
.split{display:grid;gap:var(--gap-l)}
.grp{display:grid;gap:var(--gap-s);align-content:start}
.grp .big-n{font:500 48px/1 var(--head);letter-spacing:-.04em;color:var(--ink)}
.bars{display:grid;gap:10px}
.bar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 12px;font:400 var(--t-small)/1.3 var(--body);color:var(--grey)}
.bar b{font-weight:500;color:var(--ink);font-variant-numeric:tabular-nums}
.bar i{grid-column:1 / -1;height:6px;border-radius:3px;background:var(--rule);position:relative;overflow:hidden}
.bar i::after{content:"";position:absolute;inset:0;width:var(--v);background:var(--ink);border-radius:3px;transform-origin:left;transform:scaleX(0);transition:transform 1s var(--ease)}
.bar.k i::after{background:var(--accent)}
.slide.on .bar i::after{transform:scaleX(1)}

/* Spend audit: the sheet, with what it showed */
.audit{display:grid;gap:var(--gap-m)}
.audit .frame{aspect-ratio:var(--r);cursor:zoom-in}
.audit .frame img{width:100%;height:100%;display:block}
.marks{display:grid;gap:var(--gap-s);align-content:start}
.marks p{display:grid;gap:4px;font:400 var(--t-small)/var(--lh-small) var(--body);color:var(--ink)}

/* Old flow: four screens in a row, each with what went wrong */
.lead{display:grid;gap:var(--gap-s);align-content:start}
.row4{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--gap-m) var(--gap-s)}
.row4 figure{display:grid;gap:8px;align-content:start}
.row4 .shot{position:relative;display:block;cursor:zoom-in}
.row4 .shot img{width:100%;display:block}
.row4 figcaption{font:400 13px/18px var(--body);color:var(--grey)}
.row4 figcaption b{display:block;font-weight:500;color:var(--no)}

/* Three problems, side by side */
.tri{display:grid;gap:var(--gap-m)}
.tri > div{display:grid;gap:var(--gap-xs);align-content:start;padding-top:var(--gap-s);border-top:1px solid var(--rule)}

/* Mental model: the questions a customer answers, in order */
.ladder{list-style:none;display:grid;gap:0}
.ladder li{display:grid;grid-template-columns:18px minmax(0,1fr);column-gap:var(--gap-s);position:relative;padding-bottom:var(--gap-s)}
.ladder li::before{content:"";width:9px;height:9px;margin:7px 0 0 4px;border-radius:50%;border:1.5px solid var(--ink);background:var(--slide);position:relative;z-index:1}
.ladder li:not(:last-child)::after{content:"";position:absolute;left:8px;top:16px;bottom:0;width:1.5px;background:var(--rule)}
.ladder li:last-child::before{background:var(--ink)}
.ladder span{display:grid;gap:2px}
.ladder b{font:500 var(--t-text)/var(--lh-text) var(--body);color:var(--ink)}
.ladder li{opacity:.25;transition:opacity .5s var(--ease)}
.slide.on .ladder li{opacity:1}
.slide.on .ladder li:nth-child(2){transition-delay:.15s}.slide.on .ladder li:nth-child(3){transition-delay:.3s}
.slide.on .ladder li:nth-child(4){transition-delay:.45s}.slide.on .ladder li:nth-child(5){transition-delay:.6s}

/* Pros and cons */
.pc{list-style:none;display:grid;gap:0;margin-top:var(--gap-s)}
.pc li{display:grid;grid-template-columns:20px 1fr;padding-block:8px;border-top:1px dashed var(--rule);font:400 var(--t-small)/var(--lh-small) var(--body);color:var(--ink)}
.pc li::before{font:500 13px/var(--lh-small) var(--mono)}
.pc .y::before{content:"\\2713";color:#1F8A4C}.pc .x::before{content:"\\2715";color:#C2453D}

/* Trade-off table */
.cmp{display:grid;grid-template-columns:minmax(0,1fr) 28px 28px minmax(0,1fr);align-items:center}
.cmp > *{padding:9px 0;border-top:1px solid var(--rule);font:400 var(--t-small)/1.35 var(--body);color:var(--grey)}
.cmp .h{border-top:0;font:500 var(--t-text)/1.3 var(--body);color:var(--ink);padding-bottom:12px}
.cmp .l{text-align:right;padding-right:12px}.cmp .r{padding-left:12px}
.cmp .m{text-align:center;font:500 13px/1 var(--mono)}
.cmp .win{color:var(--accent);font:400 var(--t-mono)/1 var(--mono);letter-spacing:.06em;text-transform:uppercase;margin-left:8px}
.insight{display:grid;gap:var(--gap-xs);align-content:start;padding-top:var(--gap-s);border-top:1px dashed var(--rule)}
.insight p{font:400 var(--t-text)/var(--lh-text) var(--body);color:var(--ink)}
.insight b{font-weight:500;color:var(--accent)}

/* Taxonomy: old list, new tree */
.tax{display:grid;gap:var(--gap-l)}
.oldlist{list-style:none;display:grid;gap:0}
.oldlist li{padding-block:7px;border-top:1px solid var(--rule);font:400 var(--t-small)/1.35 var(--body);color:var(--faint);text-decoration:line-through;text-decoration-color:rgb(27 32 31 / .25)}
.tree{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--gap-m) var(--gap-s)}
.tree div{display:grid;gap:2px;align-content:start}
.tree b{font:500 var(--t-text)/var(--lh-text) var(--body);color:var(--ink);margin-bottom:4px}
.tree span{position:relative;padding-left:16px;font:400 var(--t-small)/1.6 var(--body);color:var(--grey)}
.tree span::before{content:"";position:absolute;left:3px;top:-6px;bottom:50%;width:8px;border-left:1px solid var(--rule);border-bottom:1px solid var(--rule)}

/* Research: small multiples */
.charts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--gap-m) var(--gap-s)}
.charts .grp{gap:10px}
.charts .bar{font-size:13px}

/* Research readout */
.readout{display:grid;gap:var(--gap-m)}

/* The win */
.win-n{font:500 64px/1 var(--head);letter-spacing:-.045em;color:var(--ink)}
.win-n small{display:block;margin-top:8px;font:400 var(--t-mono)/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}

@media (min-width:900px) and (min-aspect-ratio:1/1){
  /* Screens beside the story: the statement on the left, the deck's row of screens on the right */
  .content.side{padding-top:calc(var(--u)*40);grid-template-columns:repeat(12,1fr);align-content:start}
  .content.side > .lead{grid-column:1 / span 4}
  .content.side > .lead .statement{font-size:calc(var(--u)*30);line-height:calc(var(--u)*40)}
  .content.side > .mocks,.content.side > .wmset{grid-column:5 / -1;grid-row:1;justify-self:end}
  .mocks{overflow:visible;margin:0;padding:0;gap:calc(var(--u)*28);scroll-snap-type:none}
  .mocks figure{flex:0 0 calc(var(--u) * var(--cw));gap:calc(var(--u)*10)}
  .mocks.grid3{flex-wrap:wrap;width:calc(var(--u) * (var(--cw) * 3 + 56));row-gap:calc(var(--u)*20)}
  .mock{border-radius:calc(var(--u)*14)}
  .scale{margin-bottom:calc(var(--u)*18)}
  .opt{margin-top:calc(var(--u)*36);gap:calc(var(--u)*6)}
  .rcard{margin-top:calc(var(--u)*28);padding:calc(var(--u)*24);gap:calc(var(--u)*10);border-radius:calc(var(--u)*14)}
  .rcard .rh{font-size:calc(var(--u)*22)}
  .rcard .rs,.rcard li{font-size:calc(var(--u)*14)}
  .rcard li{padding-block:calc(var(--u)*7);grid-template-columns:calc(var(--u)*28) 1fr}
  .fv > .lead{grid-column:1 / span 7!important}
  .content.side.fv > .mocks{grid-column:9 / -1}
  .fv > .lead .statement{font-size:calc(var(--u)*26)!important;line-height:calc(var(--u)*34)!important}
  .ux .opt .sub{font-size:calc(var(--u)*24)}
  /* Taxonomy: old list, the research behind it, the new tree; read left to right as in the deck */
  .content.taxo-slide{padding-top:calc(var(--u)*40)}
  .taxo-slide .statement{grid-column:1 / span 9;font-size:calc(var(--u)*30);line-height:calc(var(--u)*40)}
  .taxo{grid-column:1 / -1;display:grid;grid-template-columns:repeat(12,1fr);column-gap:calc(var(--u)*24);margin-top:calc(var(--u)*32)}
  .taxo > div{display:grid;gap:calc(var(--u)*12);align-content:start}
  .taxo .old{grid-column:1 / span 2}.taxo .q{grid-column:4 / span 5}.taxo .new{grid-column:10 / span 3}
  .taxo .charts{grid-column:auto;margin:0;grid-template-columns:repeat(2,minmax(0,1fr));gap:calc(var(--u)*12) calc(var(--u)*24)}
  .taxo .grp{gap:calc(var(--u)*4)}.taxo .bars{gap:calc(var(--u)*3)}
  .taxo .bar{font-size:calc(var(--u)*11);line-height:1.25;gap:calc(var(--u)*1) calc(var(--u)*8)}.taxo .bar i{height:calc(var(--u)*3)}
  .taxo .tree{grid-template-columns:minmax(0,1fr);row-gap:calc(var(--u)*12)}
  .taxo .tree b{font-size:calc(var(--u)*15);line-height:calc(var(--u)*20)}
  .taxo .tree span,.taxo .oldlist li{font-size:calc(var(--u)*13);line-height:1.5}
  .winrow{grid-column:1 / -1;grid-template-columns:repeat(12,1fr);column-gap:calc(var(--u)*24);margin-top:calc(var(--u)*48)}
  .winrow .winbox{grid-column:1 / span 4}.winrow .wins{grid-column:6 / span 7}
  .tall .frame{height:calc(var(--u)*560);aspect-ratio:var(--r)}
  .flowseq.tall,.models.tall{grid-template-columns:auto minmax(0,1fr);column-gap:calc(var(--u)*64);row-gap:calc(var(--u)*24);align-content:start}
  .facts.three .fact:nth-child(1){grid-column:1 / span 3}
  .facts.three .fact:nth-child(2){grid-column:4 / span 4}
  .facts.three .fact:nth-child(3){grid-column:9 / span 4}
  .hl{grid-column:1 / -1;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:calc(var(--u)*24);margin-top:calc(var(--u)*48)}
  .split{grid-column:1 / -1;grid-template-columns:repeat(12,1fr);column-gap:calc(var(--u)*24);margin-top:calc(var(--u)*48)}
  .split .grp:nth-child(1){grid-column:1 / span 4}.split .grp:nth-child(2){grid-column:7 / span 5}
  .grp .big-n{font-size:calc(var(--u)*72)}
  .bars{gap:calc(var(--u)*14)}
  .bar{font-size:calc(var(--u)*16);gap:calc(var(--u)*6) calc(var(--u)*12)}
  .bar i{height:calc(var(--u)*6)}
  .audit{grid-column:1 / -1;grid-template-columns:repeat(12,1fr);column-gap:calc(var(--u)*24);margin-top:calc(var(--u)*36)}
  .audit .frame{grid-column:1 / span 9}
  .audit .marks{grid-column:10 / span 3;gap:calc(var(--u)*24)}
  .marks p{font-size:calc(var(--u)*16);line-height:calc(var(--u)*22)}
  .content > .lead{grid-column:1 / span 4}
  .content > .lead .statement,.content > .lead .small{grid-column:auto}
  .content > .row4,.content > .ladder,.content > .tax-new{grid-column:6 / span 7}
  .row4{grid-template-columns:repeat(4,minmax(0,1fr));column-gap:calc(var(--u)*20)}
  .row4 figcaption{font-size:calc(var(--u)*14);line-height:calc(var(--u)*20)}
  .tri{grid-column:1 / -1;grid-template-columns:repeat(3,minmax(0,1fr));column-gap:calc(var(--u)*24);margin-top:calc(var(--u)*60)}
  .ladder li{padding-bottom:calc(var(--u)*22);grid-template-columns:calc(var(--u)*24) minmax(0,1fr)}
  .ladder b{font-size:calc(var(--u)*20);line-height:calc(var(--u)*28)}
  .pc li{font-size:calc(var(--u)*16);line-height:calc(var(--u)*24);padding-block:calc(var(--u)*9)}
  .cmp{grid-column:1 / -1;grid-template-columns:minmax(0,1fr) calc(var(--u)*32) calc(var(--u)*32) minmax(0,1fr);margin-top:calc(var(--u)*48)}
  .cmp > *{font-size:calc(var(--u)*16);padding-block:calc(var(--u)*10)}
  .cmp .h{font-size:calc(var(--u)*20)}
  .content > .insight{grid-column:9 / span 4;grid-row:1}
  .content > .statement.half{grid-column:1 / span 7}
  .tax{grid-column:1 / -1;grid-template-columns:repeat(12,1fr);column-gap:calc(var(--u)*24);margin-top:calc(var(--u)*48)}
  .tax .old{grid-column:1 / span 3;display:grid;gap:calc(var(--u)*12);align-content:start}
  .tax .new{grid-column:5 / span 8;display:grid;gap:calc(var(--u)*12);align-content:start}
  .tree{grid-template-columns:repeat(4,minmax(0,1fr));column-gap:calc(var(--u)*24)}
  .tree b{font-size:calc(var(--u)*18)}
  .tree span,.oldlist li{font-size:calc(var(--u)*15)}
  .charts{grid-column:1 / -1;grid-template-columns:repeat(5,minmax(0,1fr));column-gap:calc(var(--u)*32);margin-top:calc(var(--u)*48)}
  .charts .bar{font-size:calc(var(--u)*14)}
  .readout{grid-column:1 / -1;grid-template-columns:repeat(12,1fr);column-gap:calc(var(--u)*24);margin-top:calc(var(--u)*36)}
  .readout .sub{grid-column:1 / span 4}
  .readout ol.list.hard{grid-column:6 / span 7}
  .win-n{font-size:calc(var(--u)*120)}
  .content > .winbox{grid-column:1 / span 5}
  .content > .wins{grid-column:7 / span 6}
}
"""
head = head.replace("\n</style>", "\n" + CSS + "</style>", 1)


def img(name, alt, first=False):
    """A screen, or with "vid:" a recorded walkthrough of the prototype (taps shown as they happen)."""
    if name.startswith("vid:"):
        v = name[4:]
        return f'<video poster="vid/{v}.jpg" muted playsinline preload="metadata" aria-label="{alt}: prototype walkthrough"><source src="vid/{v}.mp4" type="video/mp4"><source src="vid/{v}.webm" type="video/webm"></video>'
    return f'<img src="img/{name}.webp" alt="{alt}" style="object-position:top left" {"decoding=\"async\"" if first else "loading=\"lazy\" decoding=\"async\""}>'


def tabs_slide(title, ratio, items, foot, meta="", kind="models"):
    """A phone frame that swaps between screens, with tabs (models) or numbered steps (flowseq)."""
    imgs = "".join(img(src, label, i == 0) for i, (src, tag, label, note) in enumerate(items))
    btns = "".join(
        f'<button type="button" aria-pressed="{"true" if i == 0 else "false"}"><span class="mono">{tag}</span><b>{label}</b></button>'
        for i, (src, tag, label, note) in enumerate(items))
    notes = "".join(f'<div class="note{" on" if i == 0 else ""}">{note}</div>' for i, (src, tag, label, note) in enumerate(items))
    steps_cls = "steps tabs" if kind == "models" else "steps"
    body = f'''<div class="frame seq" data-zoom role="button" tabindex="0" aria-label="Enlarge screen" style="--r:{ratio}">{imgs}</div>
    <div class="{steps_cls}" role="group" aria-label="{title} options">{btns}</div>
    {f'<div class="notes">{notes}</div>' if kind == "models" else ""}
    <p class="foot">{foot}</p>'''
    return f'''<section class="slide screens" data-name="{title}"><div class="stage">
  <div class="head"><h3 class="title">{title}</h3>{f'<span class="mono">{meta}</span>' if meta else ""}</div>
  <div class="content"><div class="{kind} tall">
    {body}
  </div></div>
</div></section>'''


def mocks(items, cw=240, cls=""):
    """Screens side by side, as the deck lays them out, each bounded in a card. Videos play while the slide shows."""
    figs = []
    for src, label, alt in items:
        if src.startswith("vid:"):
            v = src[4:]
            m = (f'<video poster="vid/{v}.jpg" muted playsinline loop preload="metadata" data-play aria-label="{alt or label}: prototype walkthrough">'
                 f'<source src="vid/{v}.mp4" type="video/mp4"><source src="vid/{v}.webm" type="video/webm"></video>')
        else:
            m = f'<img src="img/{src}.webp" alt="{alt or label}" loading="lazy" decoding="async">'
        lab = f'<span class="mono">{label}</span>' if label else ""
        figs.append(f'<figure>{lab}<div class="mock" data-zoom role="button" tabindex="0" aria-label="Enlarge screen">{m}</div></figure>')
    return f'<div class="mocks {cls}" style="--cw:{cw}">{"".join(figs)}</div>'


def bars(rows, key=None):
    return "".join(
        f'<span class="bar{" k" if label == key else ""}"><span>{label}</span><b>{v}%</b><i style="--v:{v}%"></i></span>'
        for label, v in rows)


def chart(title, rows):
    return f'<div class="grp"><span class="mono">{title}</span><div class="bars">{bars(rows, rows[0][0])}</div></div>'


# Poor replacement answers were counts; shown as shares of the 251 responses
pr = [("Doesn&rsquo;t match my preferences", 105), ("Other", 64), ("Didn&rsquo;t request a replacement", 47), ("Not the same quantity", 35)]
pr_total = sum(v for _, v in pr)
pr = [(l, round(v * 100 / pr_total)) for l, v in pr]

SLIDES = f'''
<section class="slide divider" data-name="Order Issue Reporting"><div class="stage">
  <div class="head">
    {mark}
  </div>
  <div class="big"><h2>Order Issue<br>Reporting</h2><p class="by">Instacart &middot; Making it simple and specific to report what went wrong with an order.</p></div>
</div></section>

<section class="slide" data-name="At Instacart"><div class="stage">
  <div class="head"><h3 class="title">At Instacart</h3><span class="mono">Feb 2021 &mdash; Sep 2023</span></div>
  <div class="content">
    <p class="statement">A product designer across the <b>Support &amp; Protect</b> and <b>Shopper</b> orgs, with deep expertise in post-order issues and a strong feel for the financial efficiency of appeasements.</p>
    <div class="hl">
      <ul class="list small"><li>Led and executed the design strategy for care agents&rsquo; tools</li><li>Launched our first customer chatbot</li><li>Contributed tooling components to our design system</li></ul>
      <ul class="list small"><li>Digitized the fraud review process</li><li>Structured self-serve order issue reporting</li><li>&hellip; and many other initiatives</li></ul>
    </div>
  </div>
</div></section>

<section class="slide" data-name="Context"><div class="stage">
  <div class="head"><h3 class="title">Context</h3><span class="mono">4 months</span></div>
  <div class="content">
    <p class="statement">The Appeasement team owns the <b>unit economics of an order</b>, cutting inefficient spend on issue resolutions to drive profitable growth. We <b>didn&rsquo;t own this surface</b>, and the team had never worked on it.</p>
    <div class="facts three">
      <div class="fact"><span class="mono">Role</span><span class="v">Design lead. I found the opportunity, drove the product strategy, negotiated ownership of the surface with partner teams, put it on our roadmap and designed it end to end.</span></div>
      <div class="fact"><span class="mono">Team</span><span class="v">1 design lead, 1 shared UXR, 1 content designer, 3 PMs (rotating), 6 engineers, 2 data scientists, 3 ML engineers</span></div>
      <div class="fact"><span class="mono">Success metric</span><span class="v">Cp, contribution profit per order</span></div>
    </div>
  </div>
</div></section>

<section class="slide" data-name="Cost drivers"><div class="stage">
  <div class="head"><h3 class="title">Cost drivers</h3></div>
  <div class="content">
    <p class="statement">What makes appeasement cost? Digging into the main cost drivers <b>prioritized item issues</b> over entire-order issues.</p>
    <div class="split">
      <div class="grp"><span class="big-n">23%</span><span class="mono">Entire order issues</span><div class="bars">{bars([("Wrong address", 85), ("Wrong order", 7), ("Other", 8)])}</div></div>
      <div class="grp"><span class="big-n">77%</span><span class="mono">Item issues</span><div class="bars">{bars([("Missing item", 45), ("Wrong item", 25), ("Damaged item", 20), ("Other", 10)], "Missing item")}</div></div>
    </div>
  </div>
</div></section>

<section class="slide" data-name="Spend classification"><div class="stage">
  <div class="head"><h3 class="title">Spend classification</h3></div>
  <div class="content">
    <p class="statement">Inefficient, manual labelling. To judge spend, appeasement requests were <b>randomly audited</b> and classified by hand from <b>customer comments</b>.</p>
    <div class="audit">
      <div class="frame" data-zoom role="button" tabindex="0" aria-label="Enlarge screen" style="--r:842/292">{img("audit", "Audit sheet: customer messages, order issue category, subcategory and spend classification")}</div>
      <div class="marks">
        <p><span class="mono">Comments</span>Customers capture the specifics in a free-text box.</p>
        <p><span class="mono">Taxonomy</span>Redundant and limited, though the flow had two steps.</p>
        <p><span class="mono">Classification</span>Generous, appropriate, unnecessary or fraud.</p>
      </div>
    </div>
  </div>
</div></section>

<section class="slide" data-name="A problem upstream"><div class="stage">
  <div class="head"><h3 class="title">A problem upstream</h3><span class="mono">Customer reporting flow</span></div>
  <div class="content">
    <div class="lead"><p class="statement">The customer flow produced <b>incomplete data</b>, and didn&rsquo;t give people the controls to report accurately.</p></div>
    <div class="row4">
      <figure><span class="mono">Issue</span><span class="shot" data-zoom role="button" tabindex="0" aria-label="Enlarge screen">{img("old-1", "Old flow: pick an issue")}</span><figcaption><b>Asked twice</b>The same issue choices appear again in the next step.</figcaption></figure>
      <figure><span class="mono">Sub-issue</span><span class="shot" data-zoom role="button" tabindex="0" aria-label="Enlarge screen">{img("old-2", "Old flow: pick a sub-issue per item")}</span><figcaption><b>Asked twice</b>Item chips repeat the issue types.</figcaption></figure>
      <figure><span class="mono">Comments</span><span class="shot" data-zoom role="button" tabindex="0" aria-label="Enlarge screen">{img("old-3", "Old flow: add comments")}</span><figcaption><b>No severity</b>Nothing captures how many were affected.</figcaption></figure>
      <figure><span class="mono">Resolution</span><span class="shot" data-zoom role="button" tabindex="0" aria-label="Enlarge screen">{img("old-4", "Old flow: resolution amount")}</span><figcaption><b>Abuse loophole</b>Go back, change the issue type, see a new amount.</figcaption></figure>
    </div>
  </div>
</div></section>

<section class="slide" data-name="Key challenges"><div class="stage">
  <div class="head"><h3 class="title">Key challenges</h3></div>
  <div class="content">
    <p class="statement">Connecting the dots. Zooming out on each challenge showed one <b>systemic issue</b> for appeasement.</p>
    <div class="tri">
      <div><span class="mono">Internal problem</span><p class="sub">Lack of structured, specific issue data</p><p class="small">The ML team wasn&rsquo;t getting clean, reliable data to train its models.</p></div>
      <div><span class="mono">Business problem</span><p class="sub">An inefficient, expensive process</p><p class="small">Classification was prone to human error and expensive in time.</p></div>
      <div><span class="mono">User problem</span><p class="sub">Limited taxonomy and reporting</p><p class="small">People lacked the controls to report the specifics of an issue.</p></div>
    </div>
  </div>
</div></section>

<section class="slide" data-name="Customer mental model"><div class="stage">
  <div class="head"><h3 class="title">Customer mental model</h3></div>
  <div class="content">
    <div class="lead"><p class="statement">Intuitive reporting. We validated with users how they think about reporting, to <b>set the hierarchy and flow</b>.</p></div>
    <ol class="ladder">
      <li><span><span class="mono">What went wrong with the order?</span><b>General issue</b></span></li>
      <li><span><span class="mono">Which items had an issue?</span><b>Items with issues</b></span></li>
      <li><span><span class="mono">Specifically, what is the issue?</span><b>Sub-issue</b></span></li>
      <li><span><span class="mono">How severe was it?</span><b>Quantity affected</b></span></li>
      <li><span><span class="mono">Based on what you reported</span><b>Resolution</b></span></li>
    </ol>
  </div>
</div></section>

<section class="slide ux" data-name="Initial UX direction: Shopping cart"><div class="stage">
  <div class="head"><h3 class="title">Initial UX direction</h3><span class="mono">Prototypes &middot; <span class="chip on">Shopping cart</span> <span class="chip">One &amp; done</span></span></div>
  <div class="content side">
    <div class="lead"><p class="statement">Divergent direction. We prototyped two distinct UX directions with <b>debatable trade-offs</b>, to bring foundational alignment.</p>
      <div class="opt"><span class="mono">Option A</span><b class="sub">Shopping cart</b><ul class="pc"><li class="y">Report multiple issues at once</li><li class="y">An aggregated resolution amount is better perceived</li><li class="x">Still prone to gaming the system</li><li class="x">Added engineering complexity</li></ul></div></div>
    {mocks([("vid:shopping-cart", "", "Shopping cart")], cw=258)}
  </div>
</div></section>
<section class="slide ux" data-name="Initial UX direction: One &amp; done"><div class="stage">
  <div class="head"><h3 class="title">Initial UX direction</h3><span class="mono">Prototypes &middot; <span class="chip">Shopping cart</span> <span class="chip on">One &amp; done</span></span></div>
  <div class="content side">
    <div class="lead"><p class="statement">Divergent direction. We prototyped two distinct UX directions with <b>debatable trade-offs</b>, to bring foundational alignment.</p>
      <div class="opt"><span class="mono">Option B</span><b class="sub">One &amp; done</b><ul class="pc"><li class="y">A focused flow for one issue</li><li class="x">The resolution amount is relatively small</li><li class="y">A single-item flow makes it abuse-proof</li><li class="y">Straightforward to build</li></ul></div></div>
    {mocks([("vid:one-and-done", "", "One &amp; done")], cw=258)}
  </div>
</div></section>

<section class="slide" data-name="Trade-offs"><div class="stage">
  <div class="head"><h3 class="title">Which flow is right for us?</h3><span class="mono">Trade-offs</span></div>
  <div class="content">
    <p class="statement half">We looked at the data to learn <b>which scenario was more likely</b>: people reporting several issues on an order, or just one.</p>
    <div class="insight"><span class="mono">&#10022; Insight from data science</span><p>People with <b>one issue outnumber</b> those with two or more, <b>3 to 1</b>.</p></div>
    <div class="cmp" role="table" aria-label="Shopping cart versus one and done">
      <span class="h l">Shopping cart</span><span class="h"></span><span class="h"></span><span class="h r">One &amp; done<span class="win">Winner</span></span>
      <span class="l">Adds multiple issues in one report</span><span class="m ok">&#10003;</span><span class="m ok">&#10003;</span><span class="r">A focused flow for one issue</span>
      <span class="l">Aggregated amount is better perceived</span><span class="m ok">&#10003;</span><span class="m no">&#10005;</span><span class="r">Resolution amount is relatively small</span>
      <span class="l">Prone to gaming the system</span><span class="m no">&#10005;</span><span class="m ok">&#10003;</span><span class="r">Single-item flow makes it abuse-proof</span>
      <span class="l">Added engineering complexity</span><span class="m no">&#10005;</span><span class="m ok">&#10003;</span><span class="r">Straightforward to build</span>
    </div>
  </div>
</div></section>

<section class="slide" data-name="Taxonomy update"><div class="stage">
  <div class="head"><h3 class="title">Taxonomy update</h3></div>
  <div class="content taxo-slide">
    <p class="statement">Simplifying new issue types. With UXR and content, we <b>validated and simplified</b> the issue and sub-issue taxonomy.</p>
    <div class="taxo">
      <div class="old"><span class="mono">Old taxonomy &rarr;</span><ul class="oldlist"><li>Missing item</li><li>Damaged item</li><li>Incorrect / wrong item</li><li>Poor replacement</li><li>Expired or spoiled items</li><li>Temp spoilage</li></ul></div>
      <div class="q"><span class="mono">Quantitative UXR + content polish &rarr;</span><div class="charts">
      {chart("Main issues", [("Missing item", 33), ("Incorrect item", 20), ("Damaged item", 19), ("Other", 17), ("Poor replacement", 11), ("Don&rsquo;t recall", 1)])}
      {chart("Missing item", [("Some of them", 87), ("Other", 10), ("All of them", 3)])}
      {chart("Damaged item", [("Rotten", 38), ("Damaged or unusable", 20), ("Other", 14), ("Damaged packaging", 14), ("Expired", 7), ("Temperature spoilage", 7)])}
      {chart("Incorrect item", [("Not what I ordered", 61), ("Other", 20), ("Incorrect quantity", 10), ("Doesn&rsquo;t match my preferences", 9)])}
      {chart("Poor replacement", pr)}
      </div></div>
      <div class="new"><span class="mono">New taxonomy</span><div class="tree">
        <div><b>Missing item</b><span>All the items</span><span>Some of the items</span></div>
        <div><b>Damaged item</b><span>Damaged packaging</span><span>Damaged item</span><span>Rotten</span><span>Expired</span><span>Melted or thawed</span></div>
        <div><b>Incorrect item or quantity</b><span>Wrong amount</span><span>Different brand or version</span><span>Completely different item</span></div>
        <div><b>Poor replacement</b><span>Didn&rsquo;t want a replacement</span><span>Not similar enough</span><span>Wrong amount</span></div>
      </div></div>
    </div>
  </div>
</div></section>

<section class="slide" data-name="Exploring the UI"><div class="stage">
  <div class="head"><h3 class="title">Exploring the UI</h3><span class="mono">Issue &amp; sub-issue interaction</span></div>
  <div class="content side">
    <div class="lead"><p class="statement">Focusing on the details. Existing components didn&rsquo;t feel native, so we used visual enhancements to <b>improve the details</b> of the experience.</p></div>
    {mocks([("issue-1", "Classic radios", ""), ("vid:big-buttons", "Big buttons", ""), ("issue-3", "&#10003; Easy pills", "")], cw=240)}
  </div>
</div></section>

<section class="slide" data-name="Exploring the UI: resolution"><div class="stage">
  <div class="head"><h3 class="title">Exploring the UI</h3><span class="mono">Resolution selection</span></div>
  <div class="content side">
    <div class="lead"><p class="statement">Six takes on choosing <b>how we make it right</b>: instant credit, or just sharing feedback.</p></div>
    {mocks([("res-1", "01 &middot; Radios", ""), ("res-2", "02 &middot; Credit tag", ""), ("res-3", "03 &middot; Credit preference", ""), ("res-4", "04 &middot; Cards", ""), ("res-5", "05 &middot; Outlined cards", ""), ("res-6", "06 &middot; Filled card", "")], cw=190, cls="grid3")}
  </div>
</div></section>

<section class="slide" data-name="Weights &amp; measures"><div class="stage">
  <div class="head"><h3 class="title">Weights &amp; measures</h3></div>
  <div class="content side">
    <div class="lead"><p class="statement">Capturing severity for weight-based items. Produce and meat are often ordered by count but sold by weight, so people need <b>dynamic controls</b> to report it.</p></div>
    <div class="wmset"><div class="scale" aria-hidden="true"><span>Mild</span><i></i><span>Wild</span></div>
    {mocks([("wm-1", "&#10003; More or less", ""), ("wm-2", "Weight stepper", ""), ("vid:weights", "Scan to detect", "")], cw=236)}</div>
  </div>
</div></section>

<section class="slide" data-name="Final validation"><div class="stage">
  <div class="head"><h3 class="title">Final validation</h3></div>
  <div class="content side fv">
    <div class="lead"><p class="statement">Getting users&rsquo; thoughts. With UXR, we put the final prototype through its paces by <b>asking real Instacart customers</b>.</p>
    <div class="rcard"><p class="rh">Customers already find reporting easy to use, so they&rsquo;re excited for the new design improvements.</p>
      <p class="rs">To understand customers&rsquo; needs when reporting item issues, we ran 14 concept tests and a survey (n=1,815) among active customers.</p>
      <span class="mono">Key insights</span>
      <ol><li>The majority of customers prefer self-serve.</li><li>Missing item, incorrect item and poor replacement were more likely to prefer Care.</li><li>Customers are seeking directness and simplicity.</li><li>Overall, customers find the issue-specific flow very easy and quick to navigate, with some minor usability tweaks to fix.</li></ol></div></div>
    {mocks([("vid:final", "", "Final prototype")], cw=258)}
  </div>
</div></section>

<section class="slide" data-name="Strategic win"><div class="stage">
  <div class="head"><h3 class="title">Strategic win</h3><span class="mono">The outcome</span></div>
  <div class="content">
    <p class="statement">The project expanded the team&rsquo;s <b>ownership upstream</b>. It <b>solved a foundational issue</b> with how reports are structured in our system, and made the process more efficient.</p>
    <div class="winrow"><div class="winbox"><span class="mono">Expected Cp win</span><p class="win-n">$0.06<small>per order &middot; ~$7M annualized</small></p></div>
    <div class="wins"><span class="mono">Other wins &amp; impact</span><ul class="list small"><li>Transparency and control for people reporting an issue</li><li>Fewer care contacts</li><li>More efficient operations for partner teams like Trust &amp; Safety</li><li>Cleaner, precise data for ML models</li><li>Less human error interpreting issues</li><li>Team ownership of the whole issue funnel, from creation to resolution</li></ul></div></div>
  </div>
</div></section>

<section class="slide" data-name="Next steps"><div class="stage">
  <div class="head"><h3 class="title">Next steps</h3><span class="mono">Milestone II</span></div>
  <div class="content side">
    <div class="lead"><ul class="list small steps-ii"><li>Simplify the experience even further with a <b>chat interface powered by ChatGPT</b></li><li>Add photo capture to more issue types</li><li>A more sophisticated weights &amp; measures control</li></ul></div>
    {mocks([("next-1", "Chat", ""), ("next-2", "Photo required", ""), ("next-3", "Weights &amp; measures", "")], cw=210)}
  </div>
</div></section>

<section class="slide divider" data-name="End"><div class="stage">
  <div class="head">
    {mark}
  </div>
  <div class="big"><h2>Thank you.</h2><p class="by">More from Instacart on request: order status visibility, fraud markers scorecard, reducing fraudulent transactions, and a north star for support tooling.</p></div>
</div></section>
'''

out = head + '<main class="deck" id="deck" aria-live="polite">\n' + SLIDES + "\n</main>" + tail
(HERE / "index.html").write_text(out)
print("wrote", HERE / "index.html", len(out))

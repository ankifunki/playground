// Copies the standalone case studies into public/work/<slug>/ before dev and build.
// The source folders stay the place you edit; the copies are generated and git-ignored.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const site = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(site, "..");

const CASE_STUDIES = [
  { slug: "multi-location", title: "Multi Location", from: "case-study", copy: ["img", "assets"] },
  { slug: "multi-ticket", title: "Flexible Checkout", from: "multi-ticket", copy: ["img"] },
  { slug: "order-issue-reporting", title: "Order Issue Reporting", from: "instacart", copy: ["img", "vid"] },
];

// The portfolio's folio bar, added to the portfolio copy only: Ankit's mark (home) / the case study. It sits above
// the deck (the shell leaves --top for it), on the same dark canvas, and on large screens its edges line up with the
// slide content. Slide controls stay with the deck itself (its pill at the bottom).
const AJ_PATH =
  "M22.2,0.6c2.1-0.7,3.5,0.9,3.5,0.9c0.9,0.9,0.9,1.9,0.9,1.9v15.3c0,3,0,4.9-0.8,6.6c-0.9,2.2-3.4,3.5-5.5,3.5c-1.9,0-4.1-1-4.1-3.3c0-1.6,1.2-2,1.8-2c0.9,0,1.8,0.7,1.8,1.9c0,0.2,0,0.5-0.1,0.7l0,0.5c0,0.5,0,1.2,0.9,1.2c1.6,0,1.6-2.1,1.6-4.1l0-17L9.3,27h2.3l-0.8,1.4H8.5H3.1H1.2L2,27h1.9C6.4,23,17.7,5.6,20.3,2C20.3,2,21.1,0.9,22.2,0.6z";
const BAR = (title) => `<header class="pf-bar">
<a href="/" class="pf-home" aria-label="Back home: Ankit Joshi, all work"><span class="pf-ico" aria-hidden="true"><svg class="pf-morph" viewBox="0 0 16 16"><path d="${AJ_PATH}" transform="translate(0.75 0.5) scale(0.517)"/></svg></span><span class="pf-txt" aria-hidden="true"><span class="pf-title">${title}</span><span class="pf-back">Back home</span></span></a>
</header>
<style>
:root{--top:calc(48px + env(safe-area-inset-top,0px));--safe-top:0px}
.pf-bar{position:fixed;z-index:20;inset:0 0 auto;height:var(--top);display:flex;align-items:center;gap:10px;
  padding:env(safe-area-inset-top,0px) max(24px,env(safe-area-inset-right,0px)) 0 max(24px,env(safe-area-inset-left,0px));
  background:#0E1011;color:#EEF1F1;font:500 15px/1 var(--head);letter-spacing:-.01em}
/* The whole breadcrumb goes home. On hover (or focus) the mark turns into a back arrow and the case study's name
   gives way to "Back home", each sliding a few pixels in the direction of travel. */
.pf-home{--pf-e:cubic-bezier(.23,1,.32,1);display:inline-flex;align-items:center;gap:10px;min-width:0;margin:-8px;padding:8px;border-radius:8px;color:inherit;text-decoration:none}
.pf-ico,.pf-txt{display:grid;align-items:center}
.pf-ico{width:16px;justify-items:center}
.pf-txt{min-width:0}
.pf-ico > *,.pf-txt > *{grid-area:1 / 1;transition:opacity .2s var(--pf-e),transform .28s var(--pf-e),filter .2s var(--pf-e)}
.pf-morph{display:block;width:16px;height:16px;fill:currentColor;overflow:visible}
.pf-title{color:#959C9B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pf-back{color:#EEF1F1;white-space:nowrap;opacity:0;transform:translateY(7px);filter:blur(2px)}
@media (hover:hover) and (pointer:fine){
  .pf-home:hover .pf-title{opacity:0;transform:translateY(-7px);filter:blur(2px)}
  .pf-home:hover .pf-back{opacity:1;transform:none;filter:none}
}
.pf-home:focus-visible{outline:2px solid #5C8DFF;outline-offset:2px}
.pf-home:focus-visible .pf-title{opacity:0}.pf-home:focus-visible .pf-back{opacity:1;transform:none;filter:none}
@media (prefers-reduced-motion:reduce){.pf-ico > *,.pf-txt > *{transform:none!important;filter:none!important}}
@media (min-width:900px) and (min-aspect-ratio:1/1){
  :root{--top:56px}
  .pf-bar{--U:min(100vw / 1504,(100dvh - 56px) / 846);padding:0 calc((100vw - var(--U) * 1504) / 2 + var(--U) * 96 - 8px)}
}
</style>
<script>
// The mark morphs into a back arrow. Each part maps onto its counterpart (the diagonal folds into the chevron, the
// J straightens into the shaft): both outlines are cut at matching anchors, each piece is resampled by arc length to
// the same count, and on hover the points glide from one to the other. The resting states use the real paths.
(function(){
  var home=document.querySelector('.pf-home'),path=home&&home.querySelector('.pf-morph path');if(!path)return;
  var svg=path.ownerSVGElement,NS='http://www.w3.org/2000/svg',reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The blur below is set every frame, so it must not also ease through the shared CSS filter transition
  svg.style.transition='opacity .2s var(--pf-e),transform .28s var(--pf-e)';
  var M=1200,N=240,AJ_D=path.getAttribute('d'),AJ_T='translate(0.75 0.5) scale(0.517)',
    // The arrow is built from the mark's own J: turned -90 deg so the stem is the shaft and the curl and ball sit at
    // the back, mirrored across the shaft and unioned (the two curls are the tails), with a sharp chevron head at the
    // mark's stroke weight. Same scale and weight as the mark, centred (scratchpad harrow.py, variant H).
    ARROW='M14.47 8 14.73 7.66 14.95 7.27 15.07 7 15.2 6.58 15.28 6.16 15.29 5.88 15.27 5.51 15.22 5.26 15.11 4.89 15.01 4.67 14.81 4.35 14.65 4.17 14.46 4.02 14.35 3.95 14.12 3.85 13.87 3.78 13.58 3.76 13.39 3.77 13.14 3.83 12.95 3.93 12.8 4.06 12.66 4.26 12.58 4.47 12.55 4.65 12.57 4.86 12.64 5.09 12.77 5.29 12.95 5.45 13.12 5.54 13.31 5.6 13.53 5.62 13.75 5.61 13.89 5.57 14.36 5.58 14.53 5.61 14.67 5.71 14.74 5.84 14.77 5.98 14.77 6.13 14.72 6.31 14.64 6.45 14.52 6.57 14.37 6.66 14.2 6.73 13.78 6.82 13.42 6.85 13.04 6.86 5.06 6.86 6.2 5.73 4.59 4.12 0.71 8 4.59 11.88 6.2 10.27 5.06 9.14 13.04 9.14 13.42 9.15 13.78 9.18 14.2 9.27 14.37 9.34 14.52 9.43 14.64 9.55 14.72 9.69 14.77 9.87 14.77 10.02 14.74 10.16 14.67 10.29 14.53 10.39 14.36 10.42 13.89 10.43 13.75 10.39 13.53 10.38 13.31 10.4 13.12 10.46 12.95 10.55 12.77 10.71 12.64 10.91 12.57 11.14 12.55 11.35 12.58 11.53 12.66 11.74 12.8 11.94 12.95 12.07 13.14 12.17 13.39 12.23 13.58 12.24 13.87 12.22 14.12 12.15 14.35 12.05 14.46 11.98 14.65 11.83 14.81 11.65 15.01 11.33 15.11 11.11 15.22 10.74 15.27 10.49 15.29 10.12 15.28 9.84 15.2 9.42 15.07 9 14.89 8.6 14.73 8.34Z';
  // Anchor pairs in traversal order: AJ point (28x29 mark space) and arrow point (16x16). The diagonal becomes the
  // head (its foot the lower arm's end, its outer edge the tip and upper arm), the J's right side the shaft's top
  // edge, and its curl and ball the lower tail. The mirrored upper tail grows out of a short run at the foot of the
  // J's straight side, and the pair at the foot of the stem keeps the ball's loop on the lower tail, so no stroke
  // turns inside out.
  var ANCH=[[22.2,0.6,4.59,4.12],[26.6,16.5,12.65,6.86],[26.6,18.7,15.29,5.88],[20.3,28.6,15.29,10.12],[22.2,23.7,12.65,9.14],[20.2,7.7,5.06,9.14],[1.2,28.4,4.59,11.88],[10.5,15.5,0.71,8]];
  function mapA(x,y){return [0.75+x*0.517,0.5+y*0.517]}
  function sample(d,map){var s=document.createElementNS(NS,'svg'),p=document.createElementNS(NS,'path');p.setAttribute('d',d);s.appendChild(p);
    s.style.cssText='position:absolute;width:0;height:0;visibility:hidden';document.body.appendChild(s);
    var L=p.getTotalLength(),pts=[];for(var i=0;i<M;i++){var q=p.getPointAtLength(L*i/M);pts.push(map(q.x,q.y))}s.remove();return {P:pts,L:L}}
  function snap(P,x,y){var bi=0,bd=1e9;for(var i=0;i<M;i++){var dx=P[i][0]-x,dy=P[i][1]-y,d=dx*dx+dy*dy;if(d<bd){bd=d;bi=i}}return bi}
  function snapAll(P,col){var r=[];for(var k=0;k<ANCH.length;k++){var q=col?[ANCH[k][2],ANCH[k][3]]:mapA(ANCH[k][0],ANCH[k][1]);r.push(snap(P,q[0],q[1]))}return r}
  function ordered(I){var prev=0;for(var k=1;k<I.length;k++){var o=(I[k]-I[0]+M)%M;if(o<=prev)return false;prev=o}return true}
  var SA=sample(AJ_D,mapA),SB=sample(ARROW,function(x,y){return [x,y]}),IA=snapAll(SA.P,0),IB=snapAll(SB.P,1);
  if(!ordered(IB)){SB.P.reverse();IB=snapAll(SB.P,1)}
  console.assert(ordered(IA)&&ordered(IB),'folio morph: anchors out of order',IA,IB);
  // Point at fractional sample index f (samples are evenly spaced, so index is arc length)
  function at(P,f){f=((f%M)+M)%M;var i=Math.floor(f),u=f-i,a=P[i],b=P[(i+1)%M];return [a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u]}
  var A=[],B=[],K=ANCH.length;
  for(var k=0;k<K;k++){var a0=IA[k],a1=IA[(k+1)%K],b0=IB[k],b1=IB[(k+1)%K],sa=(a1-a0+M)%M,sb=(b1-b0+M)%M,
    n=Math.max(8,Math.round(N*Math.max(sa/M,sb/M)));
    for(var j=0;j<n;j++){A.push(at(SA.P,a0+sa*j/n));B.push(at(SB.P,b0+sb*j/n))}}
  var C=A.length;
  function draw(e){
    if(e<=0){path.setAttribute('d',AJ_D);path.setAttribute('transform',AJ_T);return}
    path.removeAttribute('transform');
    if(e>=1){path.setAttribute('d',ARROW);return}
    var d='';for(var i=0;i<C;i++){var a=A[i],b=B[i];d+=(i?'L':'M')+(a[0]+(b[0]-a[0])*e).toFixed(2)+' '+(a[1]+(b[1]-a[1])*e).toFixed(2)}path.setAttribute('d',d+'Z')}
  var t=0,to=0,raf=0,last=0;
  function step(now){var dt=Math.min(now-(last||now),40);last=now;var dir=to>t?1:-1;t=Math.max(0,Math.min(1,t+dir*dt/(dir>0?260:200)));
    var e=1-Math.pow(1-t,4);draw(t>=1?1:t<=0?0:e);
    if(t!==to){svg.style.filter='blur('+(0.5*Math.sin(Math.PI*e)).toFixed(2)+'px)';raf=requestAnimationFrame(step)}else{svg.style.filter='';raf=0;last=0}}
  function go(v){to=v;if(reduce){t=v;draw(v);return}if(!raf){last=0;raf=requestAnimationFrame(step)}}
  var fine=matchMedia('(hover:hover) and (pointer:fine)');
  home.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse'&&fine.matches)go(1)});
  home.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')go(0)});
  home.addEventListener('focus',function(){if(home.matches(':focus-visible'))go(1)});
  home.addEventListener('blur',function(){go(0)});
})();
</script>`;

for (const cs of CASE_STUDIES) {
  const src = join(repo, cs.from);
  const out = join(site, "public", "work", cs.slug);
  if (!existsSync(join(src, "index.html"))) throw new Error(`Missing ${cs.from}/index.html`);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const dir of cs.copy) if (existsSync(join(src, dir))) cpSync(join(src, dir), join(out, dir), { recursive: true });

  let html = readFileSync(join(src, "index.html"), "utf8");
  // The source is written as an artifact fragment (no doctype or head); give it a real document.
  if (!/^\s*<!doctype/i.test(html)) {
    html = `<!doctype html>\n<html lang="en">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${html}`;
  }
  // The site's favicon (the transparent AJ mark), versioned so browsers drop any older cached icon
  html = html.replace(/(<meta name="viewport"[^>]*>)/, `$1\n<link rel="icon" href="/icon.svg?v=2" type="image/svg+xml">`);
  html = html.replace(/<meta name="claude:[^>]*>\n?/g, "");
  html = html.replace(/<main/, `${BAR(cs.title)}\n<main`);
  writeFileSync(join(out, "index.html"), html);
  console.log(`synced ${cs.from} → public/work/${cs.slug}/`);
}

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
    // The arrow is built from the mark's own J: the J turned so its stem lies along the shaft with the curl at the
    // left, mirrored across the shaft and unioned, its curls swept back into barbs (scratchpad jarrow.py, variant C).
    // Same scale and stroke weight as the mark, centred on y=8.
    ARROW='M14.83 6.86 3.59 6.86 3.15 6.84 2.85 6.8 2.61 6.73 2.5 6.66 2.47 6.62 2.44 6.51 2.44 6.45 2.51 6.31 2.56 6.23 2.73 6.04 2.9 5.88 3.06 5.77 3.21 5.68 3.44 5.6 3.68 5.57 4.07 5.57 4.13 5.6 4.23 5.62 4.54 5.61 4.79 5.57 4.92 5.48 5.09 5.33 5.27 5.14 5.82 4.47 6.05 4.21 6.31 3.97 6.53 3.83 6.51 3.81 6.38 3.77 6.04 3.77 5.73 3.81 5.4 3.9 5.06 4.02 4.55 4.26 4.2 4.45 3.7 4.78 3.21 5.13 2.77 5.51 2.37 5.88 2.11 6.16 1.76 6.58 1.56 6.86 1.31 7.27 1.19 7.53 1.08 7.91 1.08 8.09 1.15 8.34 1.31 8.73 1.47 9 1.76 9.42 2.11 9.84 2.37 10.12 2.77 10.49 3.21 10.87 3.7 11.22 4.03 11.44 4.55 11.74 4.89 11.91 5.23 12.05 5.57 12.15 5.89 12.22 6.29 12.24 6.45 12.21 6.51 12.19 6.53 12.17 6.31 12.03 6.05 11.79 5.82 11.53 5.22 10.81 5.04 10.63 4.88 10.49 4.79 10.43 4.46 10.38 4.2 10.39 4.07 10.43 3.6 10.42 3.4 10.39 3.21 10.32 3.06 10.23 2.9 10.12 2.73 9.96 2.56 9.77 2.51 9.69 2.44 9.55 2.44 9.49 2.47 9.38 2.5 9.34 2.61 9.27 2.85 9.2 3.15 9.16 3.59 9.14 14.83 9.14 14.9 8.87 14.92 8.63 14.89 8.29 14.81 8 14.89 7.71 14.92 7.49 14.9 7.13Z';
  // Anchor pairs in traversal order: AJ point (28x29 mark space) and arrow point (16x16). The J's top becomes the upper
  // barb, its stem the shaft, and the diagonal the lower (mirrored) barb and tip. The extra pair at the foot of the J's
  // stem keeps the curl and ball (which wind back on themselves) inside the shaft's right end, so nothing folds.
  var ANCH=[[22.2,0.6,6.53,3.83],[26.6,18.7,14.83,6.86],[20.3,28.6,14.83,9.14],[22.2,23.7,13.2,9.14],[20.2,7.7,3.59,9.14],[1.2,28.4,6.53,12.17],[10.5,15.5,1.08,8]];
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

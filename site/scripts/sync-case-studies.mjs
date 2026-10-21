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
    // The arrow is built from the mark's own J: turned -90 deg so the curl and ball sit at the back, mirrored across
    // the shaft and unioned (the two curls are the tails, at the J's full weight), with a rounded chevron head (round
    // caps and join) and a lighter straight shaft that eases into the tails. Same scale as the mark, centred
    // (scratchpad harrow.py, variant H3).
    ARROW='M10.07 6.86 9.7 6.98 9.31 7.07 8.92 7.13 8.52 7.17 3.72 7.18 5.23 5.67 5.34 5.53 5.45 5.29 5.49 5.03 5.48 4.85 5.42 4.68 5.29 4.45 5.09 4.27 4.93 4.19 4.68 4.13 4.5 4.13 4.33 4.16 4.16 4.23 3.95 4.39 0.98 7.36 0.82 7.57 0.75 7.74 0.71 7.91 0.71 8.09 0.78 8.35 0.86 8.5 0.98 8.64 3.95 11.61 4.09 11.73 4.33 11.84 4.59 11.88 4.85 11.84 5.09 11.73 5.23 11.61 5.39 11.4 5.45 11.24 5.49 10.97 5.48 10.8 5.42 10.63 5.29 10.4 3.72 8.82 8.52 8.83 8.92 8.87 9.31 8.93 9.7 9.02 10.07 9.14 13.17 9.14 13.66 9.17 14.1 9.24 14.29 9.3 14.45 9.38 14.59 9.49 14.69 9.62 14.75 9.77 14.77 9.96 14.76 10.12 14.69 10.26 14.64 10.32 14.56 10.37 14.39 10.42 13.89 10.43 13.73 10.39 13.46 10.38 13.24 10.41 13 10.52 12.81 10.67 12.73 10.76 12.64 10.91 12.6 11.02 12.56 11.19 12.55 11.35 12.57 11.49 12.66 11.74 12.76 11.89 12.84 11.98 12.95 12.07 13.07 12.14 13.22 12.19 13.39 12.23 13.73 12.23 13.87 12.22 14.12 12.15 14.35 12.05 14.46 11.98 14.65 11.83 14.88 11.55 15.01 11.33 15.11 11.11 15.19 10.87 15.25 10.62 15.28 10.37 15.29 10.12 15.28 9.84 15.23 9.56 15.17 9.28 15.07 9 14.95 8.73 14.81 8.47 14.64 8.21 14.47 8 14.64 7.79 14.81 7.53 15.02 7.13 15.12 6.86 15.2 6.58 15.26 6.3 15.29 6.02 15.29 5.76 15.27 5.51 15.22 5.26 15.15 5.01 15.06 4.78 14.95 4.56 14.73 4.26 14.46 4.02 14.24 3.9 14.12 3.85 13.87 3.78 13.73 3.77 13.39 3.77 13.22 3.81 13.07 3.86 12.95 3.93 12.84 4.02 12.76 4.11 12.66 4.26 12.59 4.41 12.55 4.61 12.57 4.86 12.62 5.03 12.67 5.14 12.77 5.29 12.85 5.37 13.06 5.51 13.24 5.59 13.46 5.62 13.73 5.61 13.89 5.57 14.36 5.58 14.53 5.61 14.67 5.71 14.73 5.8 14.77 5.93 14.77 6.04 14.75 6.23 14.72 6.31 14.64 6.45 14.59 6.51 14.45 6.62 14.29 6.7 14 6.78 13.78 6.82 13.42 6.85 12.91 6.86Z';
  // Anchor pairs in traversal order: AJ point (28x29 mark space) and arrow point (16x16). The diagonal becomes the
  // head (its foot the lower arm's end, its outer edge the tip and upper arm), the J's right side the shaft's top
  // edge, and its curl and ball the lower tail. The mirrored upper tail grows out of a short run at the foot of the
  // J's straight side, and the pair at the foot of the stem keeps the ball's loop on the lower tail, so no stroke
  // turns inside out.
  var ANCH=[[22.2,0.6,5.23,4.39],[26.6,16.5,12.65,6.86],[26.6,18.7,15.29,5.88],[20.3,28.6,15.29,10.12],[22.2,23.7,12.65,9.14],[20.2,7.7,3.72,8.83],[1.2,28.4,5.23,11.61],[10.5,15.5,0.71,8]];
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

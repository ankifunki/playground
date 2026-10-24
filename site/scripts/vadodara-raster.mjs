// Bakes the Vadodara drawing (from scripts/vadodara.py) into PNG masks with headless Chromium: r-ink.png (white
// fills, black strokes) and r-sil.png (all black). Invert each to alpha and save as public/vadodara-ink.webp
// (quality 70) and public/vadodara-fill.webp (lossless). Usage: node scripts/vadodara-raster.mjs <svg> <outdir>
import {chromium} from '/opt/node22/lib/node_modules/playwright/index.mjs';
import {readFileSync} from 'fs';
const svg=readFileSync(process.argv[2],'utf8').replace('<svg ','<svg style="position:absolute;width:0;height:0" ');
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:460},deviceScaleFactor:2});
for (const [n,fill,stroke] of [['ink','#fff','#000'],['sil','#000','#000']]) {
await p.setContent(`<body style="margin:0;background:#fff">${svg}<svg viewBox="0 0 1200 460" style="display:block;width:1200px;fill:${fill};stroke:${stroke}"><use href="#v"/></svg></body>`);
await p.screenshot({path:`${process.argv[3]}/r-${n}.png`});}
await b.close();

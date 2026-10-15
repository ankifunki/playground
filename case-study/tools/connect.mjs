// "How they connect": stacked isometric planes (services, staff, schedule, calendar) threaded by
// one booking, then split into two locations with the staff plane spanning both.
// Projection and line helpers come from the anatomy kit; the drawing is line work only.
// Run: node case-study/tools/connect.mjs  → writes connect.fragment.html next to this file.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 720, H = 440;
const PW = 120, PD = 100, R = 6, SPLIT = 170;          // plane size, location offset along x
const Z = { svc: 168, stf: 112, sch: 56, cal: 0 };
const COLX = (c) => 12 + c * 20;                       // day columns / calendar columns
const ROWY = (r) => 14 + r * 20;

const all = [];
for (const dx of [0, SPLIT]) for (const z of Object.values(Z)) all.push([dx, 0, z], [dx + PW, 0, z], [dx, PD, z], [dx + PW, PD, z]);
const P = k.fitProjection(all, W, H, { pad: 22, azimuth: 66, elevation: 30 });
const at = (p) => k.iso(p, P).map((v) => +v.toFixed(1));
const vec = (v) => k.axisVector(P, v).map((n) => +n.toFixed(2));
const path = (pts) => "M" + pts.map((p) => at(p).join(" ")).join("L");
const rect = (x, y, w, d, z, r = 2) => k.planOutline({ x, y, w, d, r }, z, P, 4);
const dot = (x, y, z, r, cls) => { const [cx, cy] = at([x, y, z]); return `<ellipse class="${cls}" cx="${cx}" cy="${cy}" rx="${r}" ry="${(r * 0.62).toFixed(2)}"/>`; };
const label = (x, y, z, text, cls = "lb") => { const [sx, sy] = at([x, y, z]); return `<text class="${cls}" x="${(sx - 10).toFixed(1)}" y="${(sy + 4).toFixed(1)}" text-anchor="end">${text}</text>`; };

const plane = (x0, z, w, inner, cls) =>
  `<g class="pl ${cls}"><path class="pf" d="${rect(x0, 0, w, PD, z, R)}"/><path class="po" d="${rect(x0, 0, w, PD, z, R)}"/>${inner}</g>`;

// plane contents, relative to x0
const svcInner = (x0) => dot(x0 + 30, 62, Z.svc, 6, "mk hc");
const schInner = (x0, days = [0, 1, 2, 3, 4]) => days.map((c) => `<path class="col c${c}" d="${rect(x0 + COLX(c), 10, 16, 80, Z.sch, 3)}"/>`).join("");
const calInner = (x0, hit) => {
  const [c, r] = hit;
  return `<path class="cell hit" d="${rect(x0 + COLX(c) + 1, ROWY(r) + 1, 14, 14, Z.cal, 1.5)}"/>`;
};


// the booking thread: haircut → Selina → day column → slot
const HC = [30, 62], SEL = [70, 36], SEL_WIDE = [(PW + SPLIT) / 2, 36];
const thread = (svc, sel, day, slot) => ({
  a: path([[...sel, Z.stf], [...svc, Z.svc]]),
  b: path([[...day, Z.sch], [...sel, Z.stf]]),
  c: path([[...slot, Z.cal], [...day, Z.sch]]),
});
const cellC = (x0, c, r) => [x0 + COLX(c) + 8, ROWY(r) + 8];
const colC = (x0, c, r) => [x0 + COLX(c) + 8, ROWY(r) + 8];
const T0 = thread(HC, SEL, colC(0, 1, 1), cellC(0, 1, 1));
const TA = thread(HC, SEL_WIDE, colC(0, 1, 1), cellC(0, 1, 1));
const TB = thread([SPLIT + HC[0], HC[1]], SEL_WIDE, colC(SPLIT, 3, 2), cellC(SPLIT, 3, 2));
const seg = (d, cls) => `<path class="th ${cls}" pathLength="1" d="${d}"/>`;

const body = [
  // calendar layer
  plane(0, Z.cal, PW, calInner(0, [1, 1]), "cal a"),
  plane(SPLIT, Z.cal, PW, calInner(SPLIT, [3, 2]), "cal b"),
  seg(T0.c, "t0 s3"), seg(TA.c, "ta s5"), seg(TB.c, "tb s5"),
  // schedule layer
  plane(0, Z.sch, PW, schInner(0), "sch a"),
  plane(SPLIT, Z.sch, PW, schInner(SPLIT, [3, 4]), "sch b"),
  seg(T0.b, "t0 s2"), seg(TA.b, "ta s5"), seg(TB.b, "tb s5"),
  // staff layer: one plane for the business, one wide plane spanning both locations
  plane(0, Z.stf, PW, dot(...SEL, Z.stf, 6, "mk sel"), "stf one"),
  plane(0, Z.stf, SPLIT + PW, dot(...SEL_WIDE, Z.stf, 6, "mk sel"), "stf wide"),
  seg(T0.a, "t0 s1"), seg(TA.a, "ta s5"), seg(TB.a, "tb s5"),
  // services layer
  plane(0, Z.svc, PW, svcInner(0), "svc a"),
  plane(SPLIT, Z.svc, PW, svcInner(SPLIT), "svc b"),
  // labels: the four layers, then the two locations
  `<g class="lbs">${label(0, PD, Z.svc, "Services")}${label(0, PD, Z.stf, "Staff")}${label(0, PD, Z.sch, "Schedule")}${label(0, PD, Z.cal, "Calendar")}</g>`,
  `<g class="locs">${label(PW, PD + 14, Z.cal, "Soho", "lb loc")}${label(SPLIT + PW, PD + 14, Z.cal, "East Village", "lb loc")}</g>`,
].join("");

const vars = { "--b": vec([-SPLIT, 0, 0]), "--drop": vec([0, 0, 18]) };
const style = Object.entries(vars).map(([n, [x, y]]) => `${n}-x:${x}px;${n}-y:${y}px`).join(";");
const svg = `<svg class="cx" viewBox="0 0 ${W} ${H}" style="${style}" role="img" aria-label="Four stacked planes: services, staff, schedule and calendar. A booking threads through them: a service, the stylist who provides it, a day they work, and a slot on the calendar. With two locations the stack splits in two; the staff plane spans both, so one stylist threads into each location's schedule and calendar.">${body}</svg>`;
writeFileSync(join(HERE, "connect.fragment.html"), svg);
console.log("wrote connect.fragment.html", W, H);

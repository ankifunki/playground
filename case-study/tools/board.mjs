// Booking board: the "How they connect" figure, built with the anatomy kit.
// A tray of service blocks (height = price), a calendar board, a stylist's schedule plate
// that rides rails over it with one shutter per day, and an empty bay a second location
// board drops into. Moving parts are drawn once at rest; the deck moves them with CSS
// translations taken from translateAlong, so the painter's order never changes.
// Run: node case-study/tools/board.mjs  → writes board.fragment.html next to this file.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const WIDTH = 720, HEIGHT = 360;

// ---- truth: the model the motion and readout come from ----
const PRICE = { base: 40, soho: 55 };
const UNIT_PER_DOLLAR = 0.2;                        // a block is as tall as its price
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SLOTS = ["9:00", "10:00", "2:00"];
const BOOKED = { soho: [1, 1], ev: [3, 2] };        // [day, slot]
const WORKS = { all: [0, 1, 2, 3, 4], soho: [0, 1, 2], ev: [3, 4] };

// ---- world ----
const BASE = { x: 0, y: 0, w: 330, d: 118, r: 6 };
const BASE_H = 8, FOOT_H = 5;
const TRAY = { x: 14, y: 22, w: 46, d: 74, r: 3 }, TRAY_H = 6;
const CELL = 14, GAP = 4, RAIL = 8;
const BOARD_W = DAYS.length * CELL + (DAYS.length + 1) * GAP + 2 * RAIL;
const BOARD_D = SLOTS.length * CELL + (SLOTS.length + 1) * GAP + 16;
const BOARD_H = 6;
const SOHO = { x: 80, y: 20 }, EV = { x: 208, y: 20 };
const RAIL_H = 3, PLATE_Z = BOARD_H + RAIL_H, PLATE_T = 2.2;
const BLOCK = 10;
const DROP = 46;

const plan = (x, y, w, d, r = 1) => ({ x, y, w, d, r });
const boardPlan = (b) => plan(b.x, b.y, BOARD_W, BOARD_D, 3);
const cell = (b, c, s) => [b.x + RAIL + GAP + c * (CELL + GAP), b.y + GAP + s * (CELL + GAP)];

const P = k.fitProjection(
  [...k.boxCorners(BASE, -BASE_H - FOOT_H, PLATE_Z + PLATE_T + 4), [TRAY.x, TRAY.y, TRAY_H + DROP * 0.6]],
  WIDTH, HEIGHT, { pad: 26, azimuth: 62, elevation: 34 },
);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const screws = (pts, z, size = 0.5) => L(pts.map(([x, y]) => k.ring(x, y, 1.8, z, P, 14)).join(""), { tone: "lo" }) + D(pts.map(([x, y]) => at([x, y, z])), { size });
const move = (v) => { const [x, y] = k.axisVector(P, v); return [+x.toFixed(2), +y.toFixed(2)]; };

// ---- parts ----
function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(BASE, 18))) {
    out.push(S(k.cylinder(x, y, 7, -BASE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -BASE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: "lo" }));
  out.push(screws(k.corners(BASE, 10), 0));
  // the empty bay a second location drops into
  const bay = k.insetPlan(boardPlan(EV), -2.5);
  out.push(L(k.planOutline(bay, 0, P), { tone: "faint" }));
  out.push(screws(k.corners(boardPlan(EV), 5), 0, 0.42));
  // ruler strip along the front, ticks hanging from its back edge
  const strip = plan(SOHO.x, BASE.y + BASE.d - 13, EV.x + BOARD_W - SOHO.x, 6, 1);
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const t = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.6, 0.6, [2, 3.6], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3, 0.6]), at([strip.x + strip.w - 2, strip.y + 3, 0.6])], { size: 0.42 }));
  return out.join("");
}

function tray() {
  const out = [S(k.slabOf(TRAY, 0, TRAY_H, P, 4, 0.8), { tone: "mid" })];
  for (let i = 0; i < 3; i++) {
    const pocket = plan(TRAY.x + (TRAY.w - 18) / 2, TRAY.y + 6 + i * 22, 18, 18, 1.5);
    out.push(L(k.planOutline(pocket, TRAY_H, P, 3), { tone: "lo" }));
    out.push(L(k.planOutline(k.insetPlan(pocket, 1.2), TRAY_H, P, 3), { tone: "faint" }));
  }
  out.push(screws(k.corners(TRAY, 4), TRAY_H, 0.42));
  return out.join("");
}
const traySpot = (i) => [TRAY.x + (TRAY.w - BLOCK) / 2, TRAY.y + 10 + i * 22];

function board(b, label) {
  const p = boardPlan(b);
  const out = [S(k.slabOf(p, 0, BOARD_H, P, 4, 0.8), { tone: "mid" })];
  for (let s = 0; s < SLOTS.length; s++) for (let c = 0; c < DAYS.length; c++) {
    const [x, y] = cell(b, c, s);
    out.push(L(k.planOutline(plan(x, y, CELL, CELL, 1.2), BOARD_H, P, 3), { tone: "lo" }));
    out.push(L(k.planOutline(plan(x + 1.4, y + 1.4, CELL - 2.8, CELL - 2.8, 0.8), BOARD_H, P, 3), { tone: "faint" }));
  }
  // rails at both ends, with screws
  for (const x of [b.x + 2, b.x + BOARD_W - RAIL + 2]) {
    const rail = plan(x, b.y + 2, RAIL - 4, BOARD_D - 19, 0.8);
    out.push(S(k.slabOf(rail, BOARD_H, RAIL_H, P, 2, 0.4), { tone: "mid" }));
    out.push(D([at([x + 2, rail.y + 3, PLATE_Z]), at([x + 2, rail.y + rail.d - 3, PLATE_Z])], { size: 0.42 }));
  }
  // label plate on the front strip, one engraved word
  const lp = plan(b.x + RAIL + 4, b.y + BOARD_D - 12, 46, 8, 1);
  out.push(S(k.slabOf(lp, BOARD_H, 0.6, P, 2), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(lp, 1.2), BOARD_H + 0.6, P, 2), { tone: "faint" }));
  out.push(label);
  out.push(D([at([lp.x + lp.w - 3, lp.y + 4, BOARD_H + 0.6])], { size: 0.42 }));
  return out.join("");
}
const labelText = (b, text, cls) =>
  `<g class="${cls}">${k.faceTextSvg(k.topMatrix([b.x + RAIL + 7, b.y + BOARD_D - 6.6], BOARD_H + 0.6, P, "x"), text, { size: 3.4, tone: "mid" })}</g>`;

// The stylist's week: a plate on the rails, one shutter per day. Split into the part behind
// the booked blocks and the front bar in front of them.
function plate(b, cls) {
  const x0 = b.x + 2, w = BOARD_W - 4;
  const [gx] = cell(b, 0, 0);
  const wy0 = b.y + GAP - 1, wd = SLOTS.length * CELL + (SLOTS.length - 1) * GAP + 2;
  const y0 = b.y + 1, y1 = b.y + BOARD_D - 15;
  const back = [], front = [];
  for (let c = 0; c < DAYS.length; c++) {
    const sx = gx + c * (CELL + GAP) - 1;
    const shutter = plan(sx + 0.5, wy0 + 0.5, CELL + 1, wd - 1, 0.6);
    back.push(`<g class="shut c${c}">${S(k.slabOf(shutter, PLATE_Z + 0.2, 0.8, P, 2), { tone: "lo" })}${L(k.lineOnTop([sx + CELL / 2 + 0.5, wy0 + wd - 6], [sx + CELL / 2 + 0.5, wy0 + wd - 2.5], PLATE_Z + 1, P), { tone: "mid", free: true })}</g>`);
  }
  const bar = (p) => S(k.slabOf(p, PLATE_Z, PLATE_T, P, 2, 0.4), { tone: "mid" });
  back.push(bar(plan(x0, y0, w, wy0 - y0, 1)));
  back.push(bar(plan(x0, wy0, gx - 1 - x0, wd, 0.4)));
  for (let c = 0; c < DAYS.length - 1; c++) back.push(bar(plan(gx + c * (CELL + GAP) + CELL + 1, wy0, GAP - 2, wd, 0.3)));
  const rx = gx + (DAYS.length - 1) * (CELL + GAP) + CELL + 1;
  back.push(bar(plan(rx, wy0, x0 + w - rx, wd, 0.4)));
  front.push(bar(plan(x0, wy0 + wd, w, y1 - (wy0 + wd), 1)));
  const knob = [x0 + w / 2, y1 - 2.6];
  front.push(S(k.cylinder(knob[0], knob[1], 2.4, PLATE_Z + PLATE_T, 2.6, P, 24), { tone: "mid" }));
  front.push(L(k.knurl(knob[0], knob[1], 2.4, PLATE_Z + PLATE_T, PLATE_Z + PLATE_T + 2.6, 18, P), { tone: "lo" }));
  return [`<g class="${cls}">${back.join("")}</g>`, `<g class="${cls}">${front.join("")}</g>`];
}

const blockAt = (x, y, z, h, cls, lit = true) =>
  `<g class="${cls}">${S(k.slabOf(plan(x, y, BLOCK, BLOCK, 1), z, h, P, 2, 0.5), { tone: lit ? "hi" : "mid", lit })}</g>`;
const booked = (b, [c, s], h, cls) => { const [x, y] = cell(b, c, s); return blockAt(x + 2, y + 2, BOARD_H, h, cls); };

// ---- assemble, back to front ----
const h40 = PRICE.base * UNIT_PER_DOLLAR, h55 = PRICE.soho * UNIT_PER_DOLLAR;
const [sb, sf] = plate(SOHO, "st st-soho");
const [eb, ef] = plate(EV, "st st-ev");
const [bx, by] = cell(SOHO, ...BOOKED.soho);
const [tx, ty] = traySpot(0);
const vars = {
  "--from": move([tx - (bx + 2), ty - (by + 2), TRAY_H - BOARD_H]),
  "--lift": move([tx - (bx + 2), ty - (by + 2), TRAY_H - BOARD_H + DROP]),
  "--hover": move([0, 0, DROP]),
  "--st": move([0, -70, 0]),
  "--sh": move([0, -32, 0]),
  "--ev": move([0, 0, 36]),
};
const style = Object.entries(vars).map(([n, [x, y]]) => `${n}-x:${x}px;${n}-y:${y}px`).join(";");

const svg = k.figureSvg({
  width: WIDTH, height: HEIGHT, className: "board",
  label: "A booking board. Service blocks sit in a tray, each as tall as its price. A stylist's schedule plate slides onto the calendar board and opens a shutter on each day they work. A block drops through an open day into a slot: a booking. Adding a location drops a second board into the empty bay; the stylist's week splits between the boards and the Soho block grows to its higher price.",
  body: [
    base(), tray(),
    board(SOHO, labelText(SOHO, "FLOW STUDIO", "lb biz") + labelText(SOHO, "SOHO", "lb loc")),
    `<g class="ev">${board(EV, labelText(EV, "EAST VILLAGE", "lb"))}</g>`,
    sb, `<g class="ev">${eb}</g>`,
    booked(SOHO, BOOKED.soho, h40, "bk bk-40"),
    booked(SOHO, BOOKED.soho, h55, "bk bk-55"),
    `<g class="ev">${booked(EV, BOOKED.ev, h40, "bk bk-ev")}</g>`,
    sf, `<g class="ev">${ef}</g>`,
    blockAt(...traySpot(1), TRAY_H, 6, "", false),
    blockAt(...traySpot(2), TRAY_H, 12, "", false),
  ],
});

const readouts = [
  `Haircut · $${PRICE.base}`,
  `Haircut $${PRICE.base} · Selina`,
  `Selina · ${DAYS[WORKS.all[0]]}–${DAYS[WORKS.all.at(-1)]} open`,
  `Booked · ${DAYS[BOOKED.soho[0]]} ${SLOTS[BOOKED.soho[1]]}`,
  `Soho $${PRICE.soho} · East Village $${PRICE.base}`,
];
const body = k.plateHtml({
  fig: "Fig 1", title: "Booking board", hint: "Tap to step", readout: readouts[0],
  body: `<div class="iso-stage" style="${style}">${svg}</div>`,
});
writeFileSync(join(HERE, "board.fragment.html"), `<div class="iso" data-theme="light" data-readouts='${JSON.stringify(readouts)}'>${body}</div>`);
writeFileSync(join(HERE, "iso.css"), k.ISO_CSS);
console.log("wrote board.fragment.html", WIDTH, HEIGHT);

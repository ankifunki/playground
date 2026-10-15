"""Booking board: an isometric line-work figure for the 'How they connect' slide.

Writes an HTML fragment (figure + plate) and a CSS block. World units: x right, y toward
viewer-left, z up. Moving parts are drawn at their rest pose; the deck moves them with CSS
translations computed here from world vectors, so the painter's order never changes.
"""
import math, json, sys

AZ, EL = math.radians(38), math.radians(40)
CA, SA, SE, CE = math.cos(AZ), math.sin(AZ), math.sin(EL), math.cos(EL)

def raw(x, y, z):
    return (x * CA - y * SA, (x * SA + y * CA) * SE - z * CE)

# ---- world layout -------------------------------------------------------------------
BASE = dict(x=0, y=0, w=322, d=112)
BASE_H, FOOT_H = 7, 4
TRAY = dict(x=14, y=22, w=44, d=70)
TRAY_H = 5
POCKET, GAP = 14, 4
COLS, ROWS = 5, 3
RAIL = 7
BOARD_W = COLS * POCKET + (COLS + 1) * GAP + 2 * RAIL      # 108
BOARD_D = ROWS * POCKET + (ROWS + 1) * GAP + 14            # 72 (front label strip)
BOARD_H = 6
SOHO = dict(x=78, y=18)
EV = dict(x=200, y=18)
ST_Z0 = BOARD_H + 3          # stencil rides on rails 3 tall
ST_T = 2
BLOCK = 10
H40, H55 = 8, 11
DROP = 46                    # how high a part falls from

def board_grid(b):
    gx0 = b["x"] + RAIL + GAP
    gy0 = b["y"] + GAP
    return gx0, gy0

def pocket_plan(b, c, r):
    gx0, gy0 = board_grid(b)
    x = gx0 + c * (POCKET + GAP)
    y = gy0 + r * (POCKET + GAP)
    return x, y

# ---- fit ------------------------------------------------------------------------------
pts = []
for (x, y) in [(BASE["x"], BASE["y"]), (BASE["x"] + BASE["w"], BASE["y"]), (BASE["x"], BASE["y"] + BASE["d"]), (BASE["x"] + BASE["w"], BASE["y"] + BASE["d"])]:
    for z in (-BASE_H - FOOT_H, ST_Z0 + ST_T + 4):
        pts.append(raw(x, y, z))
pts.append(raw(TRAY["x"], TRAY["y"], TRAY_H + 30))
xs, ys = [p[0] for p in pts], [p[1] for p in pts]
W, PAD = 720, 18
K = (W - 2 * PAD) / (max(xs) - min(xs))
H = round((max(ys) - min(ys)) * K + 2 * PAD)
OX, OY = PAD - min(xs) * K, PAD - min(ys) * K

def P(x, y, z):
    sx, sy = raw(x, y, z)
    return (sx * K + OX, sy * K + OY)

def vec(dx, dy, dz):
    sx, sy = raw(dx, dy, dz)
    return (round(sx * K, 2), round(sy * K, 2))

def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")

def poly(points, cls, extra=""):
    d = "M" + "L".join(f"{f(a)} {f(b)}" for a, b in points) + "Z"
    return f'<path class="{cls}" d="{d}"{extra}/>'

def line(points, cls="ln lo", extra=""):
    d = "M" + "L".join(f"{f(a)} {f(b)}" for a, b in points)
    return f'<path class="{cls}" d="{d}"{extra}/>'

# ---- primitives ---------------------------------------------------------------------
def box(x0, y0, z0, w, d, h, tone="mid", lit=False, cls=""):
    x1, y1, z1 = x0 + w, y0 + d, z0 + h
    T = lambda x, y: P(x, y, z1)
    B = lambda x, y: P(x, y, z0)
    top = [T(x0, y0), T(x1, y0), T(x1, y1), T(x0, y1)]
    fy = [T(x0, y1), T(x1, y1), B(x1, y1), B(x0, y1)]       # faces +y
    fx = [T(x1, y0), B(x1, y0), B(x1, y1), T(x1, y1)]       # faces +x
    sil = [T(x0, y0), T(x1, y0), B(x1, y0), B(x1, y1), B(x0, y1), T(x0, y1)]
    k = "lit" if lit else ""
    out = [poly(fy, f"sh s1 {k}"), poly(fx, f"sh s2 {k}"), poly(top, f"tp {k}")]
    out.append(line([T(x0, y1), T(x1, y1), T(x1, y0)], f"ln {tone}"))
    out.append(line([T(x1, y1), B(x1, y1)], f"ln {tone}"))
    out.append(poly(sil, f"ln {tone} ol"))
    g = f' class="{cls}"' if cls else ""
    return f"<g{g}>" + "".join(out) + "</g>"

def plan_outline(x0, y0, w, d, z, tone="faint"):
    return poly([P(x0, y0, z), P(x0 + w, y0, z), P(x0 + w, y0 + d, z), P(x0, y0 + d, z)], f"ln {tone}")

def pocket(x0, y0, w, d, z, depth=2.5):
    x1, y1 = x0 + w, y0 + d
    floor = [P(x0, y0, z - depth), P(x1, y0, z - depth), P(x1, y1, z - depth), P(x0, y1, z - depth)]
    back = [P(x0, y0, z), P(x1, y0, z), P(x1, y0, z - depth), P(x0, y0, z - depth)]
    left = [P(x0, y0, z), P(x0, y1, z), P(x0, y1, z - depth), P(x0, y0, z - depth)]
    return (poly(floor, "sh s0") + poly(back, "sh s1") + poly(left, "sh s2")
            + line([P(x0, y0, z - depth), P(x1, y0, z - depth)], "ln faint")
            + plan_outline(x0, y0, w, d, z, "lo"))

def screws(points, z):
    out = []
    for (x, y) in points:
        cx, cy = P(x, y, z)
        out.append(f'<circle class="sc" cx="{f(cx)}" cy="{f(cy)}" r="1.1"/>')
    return "".join(out)

def cyl(x, y, r, z0, h, tone="mid", n=28):
    # an upright cylinder: side band + top ellipse
    top = [P(x + r * math.cos(t), y + r * math.sin(t), z0 + h) for t in [i * 2 * math.pi / n for i in range(n)]]
    # visible side: angles whose outward normal faces the viewer (dot with (SA, CA) > 0)
    a0 = math.atan2(CA, SA)
    arc = [a0 - math.pi / 2 + i * math.pi / 16 for i in range(17)]
    side = [P(x + r * math.cos(t), y + r * math.sin(t), z0 + h) for t in arc] + [P(x + r * math.cos(t), y + r * math.sin(t), z0) for t in reversed(arc)]
    return poly(side, "sh s1") + poly(top, "tp") + poly(side, f"ln {tone} ol") + poly(top, f"ln {tone}")

def face_text(x, y, z, text, size=4.2, cls="ft"):
    ox, oy = P(x, y, z)
    ex = [a - b for a, b in zip(P(x + 1, y, z), P(x, y, z))]
    ey = [a - b for a, b in zip(P(x, y + 1, z), P(x, y, z))]
    m = f"matrix({f(ex[0])} {f(ex[1])} {f(ey[0])} {f(ey[1])} {f(ox)} {f(oy)})"
    return f'<text class="{cls}" transform="{m}" font-size="{size}">{text}</text>'

# ---- parts --------------------------------------------------------------------------
def base():
    x0, y0, w, d = BASE["x"], BASE["y"], BASE["w"], BASE["d"]
    out = []
    halo = [P(x0 + 6, y0 + 6, -BASE_H - FOOT_H), P(x0 + w - 6, y0 + 6, -BASE_H - FOOT_H), P(x0 + w - 6, y0 + d - 6, -BASE_H - FOOT_H), P(x0 + 6, y0 + d - 6, -BASE_H - FOOT_H)]
    out.append(poly(halo, "halo"))
    feet = [(x0 + 16, y0 + 14), (x0 + w - 16, y0 + 14), (x0 + 16, y0 + d - 14), (x0 + w - 16, y0 + d - 14)]
    feet.sort(key=lambda p: p[0] * SA + p[1] * CA)
    for (x, y) in feet:
        out.append(cyl(x, y, 6, -BASE_H - FOOT_H, FOOT_H, "lo"))
    out.append(box(x0, y0, -BASE_H, w, d, BASE_H, "mid"))
    out.append(plan_outline(x0 + 5, y0 + 5, w - 10, d - 10, 0, "lo"))
    out.append(screws([(x0 + 9, y0 + 9), (x0 + w - 9, y0 + 9), (x0 + 9, y0 + d - 9), (x0 + w - 9, y0 + d - 9)], 0))
    # the empty bay a second board drops into
    out.append(plan_outline(EV["x"] - 2, EV["y"] - 2, BOARD_W + 4, BOARD_D + 4, 0, "faint"))
    out.append(screws([(EV["x"] + 4, EV["y"] + 4), (EV["x"] + BOARD_W - 4, EV["y"] + 4), (EV["x"] + 4, EV["y"] + BOARD_D - 4), (EV["x"] + BOARD_W - 4, EV["y"] + BOARD_D - 4)], 0))
    # ruler strip along the front edge, ticks hanging from its back edge
    sx0, sx1, sy = SOHO["x"], EV["x"] + BOARD_W, y0 + d - 12
    out.append(box(sx0, sy, 0, sx1 - sx0, 5, 0.6, "lo"))
    ticks = []
    for i, x in enumerate(range(int(sx0) + 4, int(sx1) - 2, 4)):
        L = 3.2 if i % 5 == 0 else 1.8
        ticks.append(line([P(x, sy, 0.6), P(x, sy + L, 0.6)], "ln " + ("mid" if i % 5 == 0 else "lo")))
    out.append("".join(ticks))
    return "".join(out)

def tray():
    x0, y0, w, d = TRAY["x"], TRAY["y"], TRAY["w"], TRAY["d"]
    out = [box(x0, y0, 0, w, d, TRAY_H, "mid")]
    for i in range(3):
        px, py = x0 + (w - 16) / 2, y0 + 5 + i * 21
        out.append(pocket(px, py, 16, 16, TRAY_H))
    out.append(screws([(x0 + 4, y0 + 3), (x0 + w - 4, y0 + 3), (x0 + 4, y0 + d - 3), (x0 + w - 4, y0 + d - 3)], TRAY_H))
    return "".join(out)

def tray_slot(i):
    x0, y0, w = TRAY["x"], TRAY["y"], TRAY["w"]
    return x0 + (w - 16) / 2 + 3, y0 + 5 + i * 21 + 3, TRAY_H - 2.5

def board(b, label_biz, label_loc):
    out = [box(b["x"], b["y"], 0, BOARD_W, BOARD_D, BOARD_H, "mid")]
    for r in range(ROWS):
        for c in range(COLS):
            x, y = pocket_plan(b, c, r)
            out.append(pocket(x, y, POCKET, POCKET, BOARD_H))
    # rails along y at both ends, with end stops
    for x in (b["x"] + 1.5, b["x"] + BOARD_W - RAIL + 1.5):
        out.append(box(x, b["y"] + 2, BOARD_H, RAIL - 3, BOARD_D - 18, 3, "mid"))
        out.append(screws([(x + (RAIL - 3) / 2, b["y"] + 6), (x + (RAIL - 3) / 2, b["y"] + BOARD_D - 20)], BOARD_H + 3))
    # label plate on the front strip
    lx, ly = b["x"] + RAIL + 4, b["y"] + BOARD_D - 11
    out.append(box(lx, ly, BOARD_H, 44, 8, 0.6, "lo"))
    tz = BOARD_H + 0.6
    if label_biz:
        out.append(face_text(lx + 3, ly + 5.6, tz, label_biz, cls="ft biz"))
    out.append(face_text(lx + 3, ly + 5.6, tz, label_loc, cls="ft loc" if label_biz else "ft"))
    out.append(screws([(lx + 40.5, ly + 4)], tz))
    return "".join(out)

def stencil(b, cls, open_cols):
    """The stylist's week: a plate riding the rails, one shutter per day."""
    x0 = b["x"] + 1.5
    w = BOARD_W - 3
    gx0, gy0 = board_grid(b)
    wy0 = gy0 - 1
    wd = ROWS * POCKET + (ROWS - 1) * GAP + 2
    y0, y1 = b["y"] + 2, b["y"] + BOARD_D - 16
    z = ST_Z0
    parts = []
    # shutters first (they slide back under the back bar)
    for c in range(COLS):
        cx = gx0 + c * (POCKET + GAP) - 1
        st = "open" if c in open_cols else "shut"
        parts.append(f'<g class="shut c{c}">' + box(cx + 0.6, wy0 + 0.6, z + 0.2, POCKET + 0.8, wd - 1.2, 0.8, "lo") +
                     line([P(cx + 0.6 + (POCKET + 0.8) / 2, wy0 + wd - 3, z + 1), P(cx + 0.6 + (POCKET + 0.8) / 2, wy0 + wd - 6, z + 1)], "ln mid") + "</g>")
    # frame bars, back to front
    bars = []
    bars.append(box(x0, y0, z, w, wy0 - y0, ST_T, "mid"))                     # back bar
    xs = [x0] + [gx0 + c * (POCKET + GAP) + POCKET + 1 for c in range(COLS - 1)] + [gx0 + (COLS - 1) * (POCKET + GAP) + POCKET + 1]
    # left side bar
    bars.append(box(x0, wy0, z, gx0 - 1 - x0, wd, ST_T, "mid"))
    for c in range(COLS - 1):
        bx = gx0 + c * (POCKET + GAP) + POCKET + 1
        bars.append(box(bx, wy0, z, GAP - 2, wd, ST_T, "mid"))
    rx = gx0 + (COLS - 1) * (POCKET + GAP) + POCKET + 1
    bars.append(box(rx, wy0, z, x0 + w - rx, wd, ST_T, "mid"))
    front = box(x0, wy0 + wd, z, w, y1 - (wy0 + wd), ST_T, "mid")          # front bar
    knob = cyl(x0 + w / 2, y1 - 2.5, 2.2, z + ST_T, 2.4, "hi", 20)
    return (f'<g class="{cls}">' + "".join(parts) + "".join(bars) + "</g>",
            f'<g class="{cls}">' + front + knob + "</g>")

def block(b, c, r, h, cls):
    x, y = pocket_plan(b, c, r)
    return f'<g class="{cls}">' + box(x + 2, y + 2, BOARD_H - 2.5, BLOCK, BLOCK, h, "hi", lit=True) + "</g>"

def tray_block(i, h, lit, cls=""):
    x, y, z = tray_slot(i)
    return f'<g class="{cls}">' + box(x, y, z, BLOCK, BLOCK, h, "hi" if lit else "mid", lit=lit) + "</g>"

# ---- assemble -----------------------------------------------------------------------
# the lit haircut block is drawn at its booked spot (Tue 10:00 at Soho) and starts in tray slot 0
bx, by = pocket_plan(SOHO, 1, 1)
tx, ty, tz = tray_slot(0)
from_tray = vec(tx - (bx + 2), ty - (by + 2), tz - (BOARD_H - 2.5))
up = vec(0, 0, DROP)
svg = []
svg.append(base())
svg.append(tray())
svg.append(board(SOHO, "FLOW STUDIO", "SOHO"))
svg.append(f'<g class="ev">{board(EV, "", "EAST VILLAGE")}</g>')
sb, sf = stencil(SOHO, "st st-soho", [])
eb, ef = stencil(EV, "st st-ev", [])
svg.append(sb)
svg.append(f'<g class="ev">{eb}</g>')
svg.append(block(SOHO, 1, 1, H40, "bk bk-40"))
svg.append(block(SOHO, 1, 1, H55, "bk bk-55"))
svg.append(f'<g class="ev">{block(EV, 3, 1, H40, "bk bk-ev")}</g>')
svg.append(sf)
svg.append(f'<g class="ev">{ef}</g>')
svg.append(tray_block(1, 6, False))
svg.append(tray_block(2, 12, False))

ST_IN = vec(0, -70, 0)          # stencil starts 70 back, off the rails
SH_OPEN = vec(0, -30, 0)        # a shutter slides back under the back bar
EV_IN = vec(0, 0, 34)

css_vars = {
    "--from-x": f"{from_tray[0]}px", "--from-y": f"{from_tray[1]}px",
    "--lift-x": f"{round(from_tray[0] + up[0], 2)}px", "--lift-y": f"{round(from_tray[1] + up[1], 2)}px",
    "--hover-x": f"{up[0]}px", "--hover-y": f"{up[1]}px",
    "--st-x": f"{ST_IN[0]}px", "--st-y": f"{ST_IN[1]}px",
    "--sh-x": f"{SH_OPEN[0]}px", "--sh-y": f"{SH_OPEN[1]}px",
    "--ev-x": f"{EV_IN[0]}px", "--ev-y": f"{EV_IN[1]}px",
}
style = ";".join(f"{k}:{v}" for k, v in css_vars.items())
out = f'<svg class="board" viewBox="0 0 {W} {H}" style="{style}" role="img" aria-label="A booking board. Service blocks sit in a tray, each as tall as its price. A stylist&rsquo;s schedule plate slides onto the calendar board and opens shutters on the days they work. A block drops through an open shutter into a slot: a booking. Adding a location drops a second board into the empty bay; the stylist&rsquo;s week splits between the boards and the Soho block grows to its higher price.">' + "".join(svg) + "</svg>"
open(sys.argv[1], "w").write(out)
print(W, H, from_tray, up, ST_IN, SH_OPEN, EV_IN)

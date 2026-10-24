#!/usr/bin/env python3
"""Vadodara in ink: the dome of the Faculty of Arts, MS University (Robert Chisholm, 1880s).

Writes an SVG of stroke paths in paint order (one <symbol id="v">). scripts/vadodara-raster.mjs then bakes it
into two masks for the footer: public/vadodara-ink.webp (the lines) and public/vadodara-fill.webp (the
silhouette), which CSS colours with the paper and footer colours so it follows light and dark mode.

    python3 scripts/vadodara.py /tmp/v.svg && node scripts/vadodara-raster.mjs /tmp/v.svg /tmp  (then convert, see that file)
"""
import math, random, sys

W, H = 1200, 460
GROUND = 392
rnd = random.Random(11)
P = []          # (d, stroke width, occludes, transform)
TF = [None]


def add(d, w=1.0, occ=False):
    P.append((d, w, occ, TF[0]))


def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


def line(x1, y1, x2, y2, w=1.0):
    add(f"M{f(x1)} {f(y1)}L{f(x2)} {f(y2)}", w)


def poly(pts, w=1.0, close=False):
    add("M" + "L".join(f"{f(x)} {f(y)}" for x, y in pts) + ("Z" if close else ""), w, close)


def rect(x, y, w_, h_, w=1.0):
    poly([(x, y), (x + w_, y), (x + w_, y + h_), (x, y + h_)], w, True)


def ellipse(cx, cy, rx, ry, w=1.0, occ=True):
    add(f"M{f(cx - rx)} {f(cy)}a{f(rx)} {f(ry)} 0 1 0 {f(2 * rx)} 0a{f(rx)} {f(ry)} 0 1 0 {f(-2 * rx)} 0Z", w, occ)


def vhatch(x1, x2, y1, y2, gap, w=0.5):
    x = x1 + gap / 2
    while x < x2:
        line(x, y1, x, y2, w)
        x += gap


def hhatch(x1, x2, y1, y2, gap, w=0.5):
    y = y1 + gap / 2
    while y < y2:
        line(x1, y, x2, y, w)
        y += gap


def bricks(x1, x2, y1, y2, w=0.4, row=4.0, brick=10.0):
    """Coursed brick: short staggered strokes, sparse so it reads as texture, not a grid."""
    y, k = y1 + row / 2, 0
    while y < y2:
        x = x1 + (brick / 2 if k % 2 else 0) + rnd.uniform(0, 3)
        while x < x2 - 3:
            if rnd.random() < .7:
                line(x, y, min(x + brick * rnd.uniform(.5, .8), x2), y, w)
            x += brick
        y += row
        k += 1


def finial(cx, top, h=14, w=.9, wheel=False):
    line(cx, top, cx, top - h, w)
    for t, r in ((.25, 2.6), (.5, 1.8), (.72, 1.4)):
        ellipse(cx, top - h * t, r, r * .8, w * .7)
    if wheel:  # the chakra that crowns the big dome
        ellipse(cx, top - h - 4, 4, 4, w * .8)
        for a in range(0, 180, 45):
            ra = math.radians(a)
            line(cx - 4 * math.cos(ra), top - h - 4 - 4 * math.sin(ra), cx + 4 * math.cos(ra), top - h - 4 + 4 * math.sin(ra), .5)


def onion(cx, base, r, h, w=1.0, ribs=0, shade=True):
    """A bulbous dome: swells past its base, then rises to a point."""
    add(f"M{f(cx - r)} {f(base)}C{f(cx - r * 1.22)} {f(base - h * .45)} {f(cx - r * .5)} {f(base - h * .92)} {f(cx)} {f(base - h)}"
        f"C{f(cx + r * .5)} {f(base - h * .92)} {f(cx + r * 1.22)} {f(base - h * .45)} {f(cx + r)} {f(base)}Z", w, True)
    for k in range(1, ribs + 1):
        t = k / (ribs + 1) * 2 - 1           # -1..1 across the face
        x0 = cx + r * t
        add(f"M{f(x0)} {f(base)}C{f(cx + r * 1.15 * t)} {f(base - h * .45)} {f(cx + r * .45 * t)} {f(base - h * .9)} {f(cx)} {f(base - h)}", .45)
    if shade:
        for k in range(1, 12):
            t = .25 + k * .065
            add(f"M{f(cx + r * t)} {f(base - 1)}C{f(cx + r * 1.15 * t)} {f(base - h * .42)} {f(cx + r * .48 * t)} {f(base - h * .85)} {f(cx + r * .12)} {f(base - h * .97)}", .45)


def hemi(cx, base, r, h, w=1.0):
    """A low half dome."""
    add(f"M{f(cx - r)} {f(base)}C{f(cx - r)} {f(base - h * 1.3)} {f(cx + r)} {f(base - h * 1.3)} {f(cx + r)} {f(base)}Z", w, True)
    for k in range(1, 12):
        t = .2 + k * .07
        add(f"M{f(cx + r * t)} {f(base - 1)}C{f(cx + r * t)} {f(base - h * (1.3 - t * .6))} {f(cx + r * t * .5)} {f(base - h * (1.1 - t * .2))} {f(cx + r * .1)} {f(base - h * .98)}", .42)


def big_arch(x, y, w_, h_, w=1.1):
    """Horseshoe-pointed arch with a banded outer ring, as on the portico."""
    r = w_ / 2
    def ring(o, ww):
        add(f"M{f(x - o)} {f(y + h_)}L{f(x - o)} {f(y)}C{f(x - o)} {f(y - r * 1.25 - o)} {f(x + r)} {f(y - r * 1.45 - o)} {f(x + r)} {f(y - r * 1.45 - o)}"
            f"C{f(x + r)} {f(y - r * 1.45 - o)} {f(x + w_ + o)} {f(y - r * 1.25 - o)} {f(x + w_ + o)} {f(y)}L{f(x + w_ + o)} {f(y + h_)}", ww)
    ring(0, w)
    ring(6, .8)
    # voussoir bands between the rings
    for k in range(0, 15):
        t = k / 14
        a = math.pi * (1 - t)
        cx_, cy_ = x + r, y
        ix, iy = cx_ + math.cos(a) * r, cy_ - math.sin(a) * r * 1.3
        ox, oy = cx_ + math.cos(a) * (r + 6), cy_ - math.sin(a) * (r + 6) * 1.3
        line(ix, iy, ox, oy, .5)
    # the dark of the opening: vertical hatch, and a lattice screen deep inside
    vhatch(x + 2, x + w_ - 2, y - r * .9, y + h_, 1.5, .45)
    hhatch(x + 2, x + w_ - 2, y - r * .3, y + h_, 2.6, .35)


def small_arch(x, y, w_, h_, w=.8, dark=True):
    r = w_ / 2
    add(f"M{f(x)} {f(y + h_)}L{f(x)} {f(y)}Q{f(x)} {f(y - r * 1.15)} {f(x + r)} {f(y - r * 1.3)}Q{f(x + w_)} {f(y - r * 1.15)} {f(x + w_)} {f(y)}L{f(x + w_)} {f(y + h_)}Z", w, True)
    if dark:
        vhatch(x + 1, x + w_ - 1, y - r * .6, y + h_, 1.3, .4)


def pavilion(cx, base, r, h=14, w=.9):
    """Corner chhatri: a square turret top, posts, a little dome."""
    rect(cx - r - 2, base - 3, 2 * r + 4, 3, w)
    for px in (cx - r, cx, cx + r):
        line(px, base - 3, px, base - 3 - h, w * .8)
    top = base - 3 - h
    rect(cx - r - 3, top - 3, 2 * r + 6, 3, w)
    onion(cx, top - 3, r, r * 1.5, w, shade=False)
    finial(cx, top - 3 - r * 1.5, 6, .6)


# ------------------------------------------------------------------ the Faculty of Arts
CX = 600

# side wings, two storeys of arched windows in brick
for wl, wr in ((300, 492), (708, 900)):
    rect(wl, 262, wr - wl, GROUND - 262, 1.1)
    line(wl - 3, 262, wr + 3, 262, 1.1)
    line(wl - 3, 266, wr + 3, 266, .6)
    x = wl
    while x < wr - 4:                     # parapet merlons
        rect(x + 1, 256, 5, 6, .6)
        x += 8.5
    bricks(wl + 1, wr - 1, 268, GROUND - 2)
    for x0 in range(wl + 12, wr - 16, 26):
        small_arch(x0, 290, 12, 22, .8)
        small_arch(x0 - 1, 336, 14, 30, .85)
    line(wl, 322, wr, 322, .8)
    hhatch(wl + 1, wr - 1, 267, 276, 1.4, .4)
    hhatch(wl + 1, wr - 1, 323, 329, 1.4, .4)
    # the far end of each wing steps forward with a gabled bay and a dome
ends = ((262, 318), (882, 938))
for el, er in ends:
    rect(el, 240, er - el, GROUND - 240, 1.2)
    line(el - 4, 240, er + 4, 240, 1.1)
    bricks(el + 1, er - 1, 246, GROUND - 2)
    big_arch(el + 14, 300, er - el - 28, 70, .9)
    rect(el + 6, 226, er - el - 12, 14, 1.0)
    onion((el + er) / 2, 226, 26, 44, 1.1, ribs=4)
    finial((el + er) / 2, 182, 16, .9)

# central block behind the portico, carrying the drum and dome
rect(470, 228, 260, GROUND - 228, 1.2)
bricks(471, 729, 234, GROUND - 2)

# the great dome: drum, two rings of rosette windows, faint ribs, lantern and chakra
DB, DR, DH = 198, 118, 172          # base y, half width, height
rect(CX - DR - 8, DB, 2 * DR + 16, 228 - DB, 1.2)          # drum
for x in range(int(CX - DR - 4), int(CX + DR + 6), 7):
    rect(x, DB + 3, 4, 5, .45)                               # dentils
line(CX - DR - 10, DB + 12, CX + DR + 10, DB + 12, .7)
hhatch(CX - DR - 8, CX + DR + 8, DB + 13, 228, 1.6, .4)
add(f"M{f(CX - DR)} {f(DB)}C{f(CX - DR * 1.17)} {f(DB - DH * .48)} {f(CX - DR * .55)} {f(DB - DH * .97)} {f(CX)} {f(DB - DH)}"
    f"C{f(CX + DR * .55)} {f(DB - DH * .97)} {f(CX + DR * 1.17)} {f(DB - DH * .48)} {f(CX + DR)} {f(DB)}Z", 1.4, True)
# ribs (meridians), lighter on the lit side
for k in range(-4, 5):
    t = k / 5
    add(f"M{f(CX + DR * t)} {f(DB)}C{f(CX + DR * 1.14 * t)} {f(DB - DH * .5)} {f(CX + DR * .5 * t)} {f(DB - DH * .95)} {f(CX)} {f(DB - DH)}", .35)
# latitude hatching: each band follows the dome's curve, closer together lower down and on the right
for k in range(1, 46):
    t = k / 46
    yb = DB - DH * (t ** 1.15) * .97
    # half width of the dome at this height (sampled from the outline's shape)
    u = 1 - t
    half = DR * (1.0 + .17 * math.sin(math.pi * min(1, u * 1.05)) ) * math.sqrt(max(0, 1 - t ** 2.2))
    x0 = CX - half * (.25 if k % 2 else .55)
    add(f"M{f(x0)} {f(yb + 2)}Q{f(CX + half * .3)} {f(yb - 3)} {f(CX + half * .96)} {f(yb + 1)}", .35)
# the horizontal seam a third of the way up
add(f"M{f(CX - DR * 1.02)} {f(DB - DH * .3)}Q{f(CX)} {f(DB - DH * .24)} {f(CX + DR * 1.02)} {f(DB - DH * .3)}", .7)
# engraved shade on the right flank
for k in range(0, 36):
    t = 1 - (k / 36) ** 1.4 * .7
    add(f"M{f(CX + DR * t)} {f(DB - 2)}C{f(CX + DR * 1.15 * t)} {f(DB - DH * .48)} {f(CX + DR * .62 * t)} {f(DB - DH * (.78 - k * .006))} {f(CX + DR * .42 * t)} {f(DB - DH * (.86 - k * .008))}", .38)


def rosettes(y, rx_max, count, size):
    for k in range(count):
        th = (k - (count - 1) / 2) * (math.pi * .78 / (count - 1)) * 2 * .55
        x = CX + rx_max * math.sin(th)
        sx = size * math.cos(th)                             # foreshortened toward the edges
        ellipse(x, y, sx, size, .9)
        ellipse(x, y, sx * .72, size * .72, .6)
        for a in range(0, 360, 40):
            ra = math.radians(a)
            line(x + math.cos(ra) * sx * .2, y + math.sin(ra) * size * .2, x + math.cos(ra) * sx * .6, y + math.sin(ra) * size * .6, .4)


rosettes(DB - DH * .2, DR * .98, 7, 12)
rosettes(DB - DH * .63, DR * .78, 7, 7)
# lantern collar and the chakra finial
rect(CX - 15, DB - DH - 6, 30, 6, 1.0)
ellipse(CX, DB - DH - 6, 15, 2.5, .8)
finial(CX, DB - DH - 6, 24, 1.0, wheel=True)

# four little half domes clustered on the drum's shoulders
for hx in (CX - 108, CX + 108):
    hemi(hx, 226, 34, 30, 1.1)
for hx in (CX - 70, CX + 70):
    hemi(hx, 232, 30, 24, 1.0)

# the portico: three great arches with a bracketed cornice and corner pavilions
PL, PR, PT = 500, 700, 248
rect(PL, PT, PR - PL, GROUND - PT, 1.3)
line(PL - 6, PT, PR + 6, PT, 1.2)
line(PL - 6, PT + 4, PR + 6, PT + 4, .7)
hhatch(PL + 1, PR - 1, PT + 8, PT + 18, 1.3, .4)
for x in range(PL - 4, PR + 6, 6):           # brackets under the cornice
    line(x, PT + 4, x, PT + 8, .5)
x = PL - 6
while x < PR + 2:                             # crenellated parapet
    rect(x, PT - 7, 6, 7, .6)
    x += 10
bay = (PR - PL - 24) / 3
for k in range(3):
    ax = PL + 12 + k * (bay + 0) + 6
    big_arch(ax, 300, bay - 12, GROUND - 300, 1.1)
# columns with capitals between the arches
for k in range(4):
    cx = PL + 12 + k * bay + 3
    rect(cx - 6, 296, 12, GROUND - 296, 1.0)
    rect(cx - 8, 290, 16, 6, .9)
    vhatch(cx + 1, cx + 6, 297, GROUND, 1.6, .4)
for px in (PL - 2, PR + 2):
    rect(px - 11, 210, 22, PT - 210, 1.1)
    bricks(px - 10, px + 10, 214, PT)
    small_arch(px - 4, 222, 8, 14, .7)
    pavilion(px, 210, 8, 14, .9)

# ------------------------------------------------------------------ the lawn
line(150, GROUND, W - 150, GROUND, 1.1)
y, row = GROUND + 4, 0
while y < H:
    # the lawn widens a little toward the viewer and frays out at its ends
    spread = 440 + row * 9
    x = CX - spread + rnd.uniform(-20, 0)
    while x < CX + spread:
        seg = rnd.uniform(8, 30)
        edge = abs(x - CX) / spread
        if rnd.random() < .8 * (1 - edge ** 3):
            line(x, y, x + seg, y, .45)
        x += seg + rnd.uniform(3, 12)
    y += 2.6 + row * .3
    row += 1

# ------------------------------------------------------------------ write
out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><symbol id="v" viewBox="0 0 {W} {H}" stroke-linecap="round" stroke-linejoin="round">']
cur, cw, ctf = [], None, None


def flush():
    if cur:
        t = f' transform="{ctf}"' if ctf else ""
        out.append(f'<path stroke-width="{cw}"{t} d="{"".join(cur)}"/>')


for d, w, occ, tf in P:
    w = round(w, 2)
    if occ or w != cw or tf != ctf:
        flush()
        cur, cw, ctf = [], w, tf
    cur.append(d)
flush()
out.append("</symbol></svg>")
open(sys.argv[1], "w").write("\n".join(out))
print(len(P), "items", len(out), "elements")

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


# ------------------------------------------------------------------ the Faculty of Arts, front elevation
# Five domes ringed with rosettes: the great one over the centre, one on each tower block, one at each end.
CX = 600


def band_wall(x1, x2, y1, y2):
    """Striped brick: a light course line every few rows over coursed brick."""
    bricks(x1 + 1, x2 - 1, y1 + 1, y2 - 1)
    y = y1 + 9
    while y < y2 - 2:
        line(x1, y, x2, y, .5)
        y += 9


def dome(cx, base, r, h, n=9, size=6.5, w=1.2, finial_h=14):
    """Bulbous dome on a short drum, a ring of rosette windows low on its face, latitude shading on the right."""
    rect(cx - r * .92, base, r * 1.84, 7, 1.0)                       # drum
    for x in range(int(cx - r * .9), int(cx + r * .9), 5):
        rect(x, base + 2, 3, 3, .4)
    add(f"M{f(cx - r)} {f(base)}C{f(cx - r * 1.16)} {f(base - h * .5)} {f(cx - r * .55)} {f(base - h * .97)} {f(cx)} {f(base - h)}"
        f"C{f(cx + r * .55)} {f(base - h * .97)} {f(cx + r * 1.16)} {f(base - h * .5)} {f(cx + r)} {f(base)}Z", w, True)
    # latitude bands, tighter toward the bottom
    for k in range(1, 58):
        t = (k / 58) ** 1.1
        yb = base - h * t * .96
        half = r * (1 + .14 * math.sin(math.pi * min(1, (1 - t) * 1.1))) * math.sqrt(max(0, 1 - t ** 2.4))
        x0 = cx - half * (.92 if k % 3 else .7)
        add(f"M{f(x0)} {f(yb + 1.5)}Q{f(cx + half * .3)} {f(yb - 2.5)} {f(cx + half * .95)} {f(yb + 1)}", .35)
    # shade on the right flank
    for k in range(0, 26):
        t = 1 - (k / 26) ** 1.4 * .7
        add(f"M{f(cx + r * t)} {f(base - 1)}C{f(cx + r * 1.14 * t)} {f(base - h * .45)} {f(cx + r * .62 * t)} {f(base - h * (.78 - k * .006))} {f(cx + r * .42 * t)} {f(base - h * (.86 - k * .008))}", .38)
    # rosette ring
    for k in range(n):
        th = (k - (n - 1) / 2) / ((n - 1) / 2) * 1.2
        x = cx + r * 1.02 * math.sin(th)
        sx = size * max(.25, math.cos(th))
        y = base - h * .22
        ellipse(x, y, sx, size, .8)
        ellipse(x, y, sx * .66, size * .66, .5)
        for a in range(0, 360, 45):
            ra = math.radians(a)
            line(x + math.cos(ra) * sx * .2, y + math.sin(ra) * size * .2, x + math.cos(ra) * sx * .6, y + math.sin(ra) * size * .6, .35)
    rect(cx - r * .12, base - h - 4, r * .24, 4, .9)
    finial(cx, base - h - 4, finial_h, .9)


def parapet(x1, x2, top, every=0):
    line(x1 - 3, top, x2 + 3, top, 1.1)
    line(x1 - 3, top + 4, x2 + 3, top + 4, .6)
    hhatch(x1, x2, top + 5, top + 12, 1.4, .4)          # shadow under the cornice
    x = x1
    while x < x2 - 3:
        rect(x + 1, top - 6, 5, 6, .55)
        x += 9
    if every:
        x = x1 + every / 2
        while x < x2:
            pavilion(x, top - 6, 4, 9, .7)
            x += every


def arcade(x1, x2, y1, y2, bay=24, pair=True):
    """A row of arched openings on slim columns."""
    x = x1 + 6
    while x + bay - 8 <= x2:
        if pair:
            small_arch(x, y1 + 8, (bay - 10) / 2, y2 - y1 - 8, .75)
            small_arch(x + (bay - 10) / 2 + 2, y1 + 8, (bay - 10) / 2, y2 - y1 - 8, .75)
        else:
            small_arch(x, y1 + 8, bay - 8, y2 - y1 - 8, .8)
        x += bay


# outer wings: two storeys of paired arches under a pinnacled parapet
for wl, wr in ((112, 292), (908, 1088)):
    rect(wl, 292, wr - wl, GROUND - 292, 1.1)
    band_wall(wl, wr, 304, GROUND)
    parapet(wl, wr, 292, every=45)
    arcade(wl, wr, 304, 340, 30)
    line(wl, 346, wr, 346, .8)
    hhatch(wl + 1, wr - 1, 347, 351, 1.3, .4)
    arcade(wl, wr, 352, GROUND - 4, 30)

# end blocks with the outer domes
for bx in (18, 1088):
    rect(bx, 270, 94, GROUND - 270, 1.2)
    band_wall(bx, bx + 94, 282, GROUND)
    parapet(bx, bx + 94, 270)
    big_arch(bx + 26, 318, 42, GROUND - 318, .9)
    small_arch(bx + 12, 290, 10, 16, .7)
    small_arch(bx + 72, 290, 10, 16, .7)
    dome(bx + 47, 256, 44, 62, n=7, size=5.5)

# low links between the towers and the centre
for lx in (394, 742):
    rect(lx, 284, 64, GROUND - 284, 1.0)
    band_wall(lx, lx + 64, 296, GROUND)
    parapet(lx, lx + 64, 284)
    small_arch(lx + 10, 306, 16, 26, .75)
    small_arch(lx + 38, 306, 16, 26, .75)
    arcade(lx, lx + 64, 342, GROUND - 4, 21, pair=False)

# tower blocks: a great arched recess with balconies, crowned by a dome
for tx in (286, 806):
    TW = 108
    rect(tx, 250, TW, GROUND - 250, 1.3)
    band_wall(tx, tx + TW, 262, GROUND)
    parapet(tx, tx + TW, 250)
    for px in (tx + 2, tx + TW - 2):
        pavilion(px, 244, 5, 11, .8)
    big_arch(tx + 22, 300, TW - 44, 46, 1.0)
    rect(tx + 24, 322, TW - 48, 4, .8)                    # balcony rail
    vhatch(tx + 25, tx + TW - 25, 322, 326, 2.2, .4)
    for k in range(3):
        small_arch(tx + 24 + k * 21, 356, 15, GROUND - 356, .85)
    dome(tx + TW / 2, 236, 52, 74, n=9, size=6)

# the centre: tallest block, three arches under peaked frames, small domes at its shoulders
CL, CR = 458, 742
rect(CL, 248, CR - CL, GROUND - 248, 1.4)
band_wall(CL, CR, 260, GROUND)
parapet(CL, CR, 248)
for px in (CL + 2, CR - 2):
    pavilion(px, 242, 5, 12, .8)
# side bays: window over a smaller arch
for bx in (CL + 14, CR - 70):
    small_arch(bx + 18, 272, 20, 26, .8)
    big_arch(bx + 6, 330, 44, GROUND - 330, 1.0)
# the great central arch with its tall grille
big_arch(CX - 36, 300, 72, GROUND - 300, 1.3)
hhatch(CX - 34, CX + 34, 300, GROUND, 4, .45)
# columns between the bays
for cx in (CX - 46, CX + 46):
    rect(cx - 5, 296, 10, GROUND - 296, 1.0)
    rect(cx - 7, 290, 14, 6, .9)
    vhatch(cx + 1, cx + 5, 297, GROUND, 1.5, .4)
# the great dome on its tall drum, which rises behind the shoulder domes
rect(CX - 76, 212, 152, 36, 1.2)
band_wall(CX - 76, CX + 76, 214, 248)
for k in range(5):
    small_arch(CX - 52 + k * 24, 222, 8, 16, .6)
dome(CX, 206, 80, 112, n=11, size=8, w=1.4, finial_h=22)
# shoulder domes and domelets
for hx in (CX - 92, CX + 92):
    onion(hx, 240, 22, 34, 1.0)
    finial(hx, 206, 10, .7)
for hx in (CX - 56, CX + 56):
    hemi(hx, 244, 18, 18, .9)

# ------------------------------------------------------------------ the lawn
line(0, GROUND, W, GROUND, 1.1)
y, row = GROUND + 4, 0
while y < H:
    # the lawn widens a little toward the viewer and frays out at its ends
    spread = 560 + row * 6
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

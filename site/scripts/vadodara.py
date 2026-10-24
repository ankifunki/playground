#!/usr/bin/env python3
"""Vadodara in ink: Laxmi Vilas Palace among trees, the Shiva statue on Sursagar, the lake in front.
Writes a single-colour, stroke-only SVG (used as a CSS mask, so the site picks the ink colour)."""
import math, random, sys

W, H = 1200, 440
GROUND = 300          # palace base line
SHORE = 332           # water starts
rnd = random.Random(7)
P = []                # (d, stroke width)


TF = [None]


def add(d, w=1.0, occ=False):
    P.append((d, w, occ, TF[0]))


def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


def line(x1, y1, x2, y2, w=1.0):
    add(f"M{f(x1)} {f(y1)}L{f(x2)} {f(y2)}", w)


def poly(pts, w=1.0, close=False):
    d = "M" + "L".join(f"{f(x)} {f(y)}" for x, y in pts)
    add(d + ("Z" if close else ""), w, close)


def rect(x, y, w_, h_, w=1.0):
    poly([(x, y), (x + w_, y), (x + w_, y + h_), (x, y + h_)], w, True)


def arch(x, y, w_, h_, w=0.9):
    """Pointed (Indo-Saracenic) arch: opening from x to x+w_, springing at y, foot at y+h_."""
    r = w_ / 2
    add(f"M{f(x)} {f(y + h_)}L{f(x)} {f(y)}Q{f(x)} {f(y - r * 1.1)} {f(x + r)} {f(y - r * 1.25)}"
        f"Q{f(x + w_)} {f(y - r * 1.1)} {f(x + w_)} {f(y)}L{f(x + w_)} {f(y + h_)}", w)


def vhatch(x1, x2, y1, y2, gap, w=0.55, jitter=0.0):
    x = x1 + gap / 2
    while x < x2:
        j = rnd.uniform(-jitter, jitter)
        line(x, y1 + j, x, y2, w)
        x += gap


def hhatch(x1, x2, y1, y2, gap, w=0.55):
    y = y1 + gap / 2
    while y < y2:
        line(x1, y, x2, y, w)
        y += gap


def dome(cx, base, r, h, w=1.1, finial=10, hatch=True):
    """Onion dome sitting on a drum at y=base."""
    add(f"M{f(cx - r)} {f(base)}C{f(cx - r * 1.25)} {f(base - h * .55)} {f(cx - r * .35)} {f(base - h * .8)} {f(cx)} {f(base - h)}"
        f"C{f(cx + r * .35)} {f(base - h * .8)} {f(cx + r * 1.25)} {f(base - h * .55)} {f(cx + r)} {f(base)}Z", w, True)
    line(cx, base - h, cx, base - h - finial, w * .8)
    add(f"M{f(cx - 2)} {f(base - h - finial * .45)}a2 2 0 1 0 4 0a2 2 0 1 0 -4 0", w * .7)
    if hatch:  # shade the right flank with short curved strokes
        for k in range(1, 5):
            t = k / 5
            x = cx + r * t * .95
            add(f"M{f(x)} {f(base - 1)}Q{f(x + r * .12)} {f(base - h * .45)} {f(cx + r * t * .3)} {f(base - h * (.75 + .1 * t))}", .5)


def chhatri(cx, base, r, pillar=12, w=1.0):
    """Little pavilion: four posts and a dome."""
    rect(cx - r - 2, base - 3, 2 * r + 4, 3, w)
    for px in (cx - r, cx - r / 3, cx + r / 3, cx + r):
        line(px, base - 3, px, base - 3 - pillar, w * .8)
    top = base - 3 - pillar
    rect(cx - r - 3, top - 3, 2 * r + 6, 3, w)
    dome(cx, top - 3, r, r * 1.5, w, finial=6)


# ---------------------------------------------------------------- palace
L, R = 318, 882
roof = 236
# main block, ground and upper storeys
rect(L, roof, R - L, GROUND - roof, 1.2)
line(L - 4, roof, R + 4, roof, 1.2)
line(L - 4, roof - 3, R + 4, roof - 3, 0.9)
line(L, 268, R, 268, 1.0)
line(L, 271, R, 271, 0.6)
# parapet merlons
x = L
while x < R:
    rect(x + 1, roof - 8, 5, 5, .7)
    x += 9
# arcades: upper storey and ground storey
for x0 in range(L + 8, R - 14, 22):
    arch(x0, 248, 13, 16, .8)
    arch(x0 - 1, 282, 15, 18, .9)
    line(x0 + 6.5, 240, x0 + 6.5, 236, .4)
# wall shading: fine vertical hatch, tighter under the cornices
vhatch(L, R, roof + 1, roof + 9, 2.4, .45)
vhatch(L, R, 272, 279, 2.4, .45)

# end wings: taller blocks with big domes
for wl in (L - 34, R - 20):
    rect(wl, 206, 54, GROUND - 206, 1.2)
    line(wl - 4, 206, wl + 58, 206, 1.1)
    for k in range(3):
        arch(wl + 8 + k * 14, 220, 9, 14, .8)
        arch(wl + 8 + k * 14, 248, 9, 14, .8)
        arch(wl + 7 + k * 14, 280, 11, 20, .9)
    vhatch(wl + 36, wl + 54, 207, GROUND, 2.2, .45)
    rect(wl + 10, 194, 34, 12, 1.0)
    dome(wl + 27, 194, 17, 30, 1.2, finial=12)
    chhatri(wl + 6, 206, 4, 9, .8)
    chhatri(wl + 48, 206, 4, 9, .8)

# roofline chhatris along the main block
for i, cx in enumerate(range(352, 860, 36)):
    if abs(cx - 600) < 50:
        continue
    big = i % 3 == 1
    chhatri(cx, roof - 8, 7.5 if big else 5, 14 if big else 9, .9)

# central clock tower
TX, TW = 600, 34
tl = TX - TW / 2
rect(tl, 112, TW, roof - 112, 1.3)
for y in (150, 176, 204):
    line(tl - 3, y, tl + TW + 3, y, 1.0)
arch(tl + 9, 186, 16, 14, .9)      # window
arch(tl + 10, 158, 14, 13, .9)
add(f"M{f(TX - 9)} 132a9 9 0 1 0 18 0a9 9 0 1 0 -18 0", 1.0)  # clock face
line(TX, 132, TX, 125.5, .8)
line(TX, 132, TX + 4.5, 134, .8)
vhatch(TX + 4, tl + TW, 113, roof, 2.0, .45)
# open belvedere, then the big dome
rect(tl - 4, 106, TW + 8, 6, 1.1)
for px in (tl - 2, tl + 10, tl + TW - 10, tl + TW + 2):
    line(px, 106, px, 86, .9)
    arch(px + 1, 92, 7, 14, .5) if px < tl + TW else None
rect(tl - 6, 81, TW + 12, 5, 1.1)
dome(TX, 81, 22, 40, 1.3, finial=16)
chhatri(tl - 2, 106, 3.5, 8, .7)
chhatri(tl + TW + 2, 106, 3.5, 8, .7)

# portico in front of the tower
rect(TX - 34, 262, 68, GROUND - 262, 1.1)
for k in range(3):
    arch(TX - 26 + k * 18, 274, 14, 26, 1.0)
line(TX - 38, 262, TX + 38, 262, 1.1)
dome(TX, 262, 12, 18, 1.0, finial=8)

# ---------------------------------------------------------------- trees
def blob(cx, cy, r, shade=1.0, w=.8):
    """A tree crown: a ring of scallops with leafy strokes inside, heavier toward the lower right."""
    n = max(8, int(r / 2.3))
    pts = []
    for i in range(n + 1):
        a = math.pi * 2 * i / n
        rr = r * rnd.uniform(.82, 1.08)
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr * .82))
    d = f"M{f(pts[0][0])} {f(pts[0][1])}"
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        ox, oy = mx - cx, my - cy
        k = rnd.uniform(1.2, 1.42)
        d += f"Q{f(cx + ox * k)} {f(cy + oy * k)} {f(x2)} {f(y2)}"
    add(d + "Z", w, True)
    for _ in range(int(r * r / 13 * shade)):
        a = rnd.uniform(0, 2 * math.pi)
        rr = r * math.sqrt(rnd.random()) * .85
        x, y = cx + math.cos(a) * rr, cy + math.sin(a) * rr * .8
        # keep the upper left lit
        if (x - cx) + (y - cy) < -r * .35 and rnd.random() < .8:
            continue
        s = rnd.uniform(2, 3.6)
        add(f"M{f(x - s)} {f(y)}q{f(s)} {f(-s * .9)} {f(2 * s)} 0", .5)
    # engraved shade: short diagonal strokes packed into the lower right of the crown
    for _ in range(int(r * r / 8.5 * shade)):
        a = rnd.uniform(-.35, 1.9)
        rr = r * (.45 + .5 * math.sqrt(rnd.random()))
        x, y = cx + math.cos(a) * rr, cy + math.sin(a) * rr * .8
        s = rnd.uniform(1.5, 3)
        line(x, y, x - s, y + s * 1.2, .45)


def tree_mass(x1, x2, top, bottom, rmin, rmax, shade=1.0):
    """Rows of crowns from the top down, so each row overlaps the one behind it. top may be a function of x."""
    topf = top if callable(top) else (lambda x: top)
    rows = []
    y = bottom
    while y > min(topf(x1), topf(x2), topf((x1 + x2) / 2)) - rmax:
        rows.append(y)
        y -= rmax * .8
    for y in reversed(rows):
        x = x1 + rnd.uniform(-rmax, 0)
        while x < x2 + rmax:
            r = rnd.uniform(rmin, rmax)
            if y >= topf(x) - r * .3:
                blob(x, y + rnd.uniform(-5, 5), r, shade)
            x += r * rnd.uniform(1.1, 1.5)


def palm(x, base, h, lean=0.0):
    tx, ty = x + lean * h, base - h
    add(f"M{f(x)} {f(base)}Q{f(x + lean * h * .2)} {f(base - h * .5)} {f(tx)} {f(ty)}", 1.1)
    add(f"M{f(x + 2.5)} {f(base)}Q{f(x + 2.5 + lean * h * .2)} {f(base - h * .5)} {f(tx + 1.5)} {f(ty + 2)}", .7)
    for k in range(4, int(h), 5):
        t = k / h
        cx = x + lean * h * (t * t * .8 + t * .2)
        line(cx - 1, base - k, cx + 3.5, base - k + 1, .5)
    for a in (-160, -130, -100, -70, -40, -15, 15):
        ra = math.radians(a)
        L_ = rnd.uniform(18, 26)
        ex, ey = tx + math.cos(ra) * L_, ty + math.sin(ra) * L_ * .7 + L_ * .35
        mx, my = tx + math.cos(ra) * L_ * .5, ty + math.sin(ra) * L_ * .5 - 5
        add(f"M{f(tx)} {f(ty)}Q{f(mx)} {f(my)} {f(ex)} {f(ey)}", .9)
        for j in range(1, 6):  # leaflets
            t = j / 6
            px = (1 - t) ** 2 * tx + 2 * (1 - t) * t * mx + t * t * ex
            py = (1 - t) ** 2 * ty + 2 * (1 - t) * t * my + t * t * ey
            line(px, py, px + 1.5, py + 5, .45)


# tall cypress-like ashoka trees (Polyalthia), very Vadodara
def ashoka(x, base, h):
    add(f"M{f(x)} {f(base - h)}C{f(x - 7)} {f(base - h * .6)} {f(x - 8)} {f(base - h * .15)} {f(x - 4)} {f(base)}"
        f"L{f(x + 4)} {f(base)}C{f(x + 8)} {f(base - h * .15)} {f(x + 7)} {f(base - h * .6)} {f(x)} {f(base - h)}Z", .9, True)
    for k in range(5, int(h) - 4, 4):
        wv = 6 * math.sin(math.pi * min(1, k / h * 1.3)) + 1
        line(x - wv * .2, base - k, x + wv, base - k + 2, .45)


# background crowns behind the palace sides, then foreground masses
tree_mass(0, L - 30, lambda x: 262 - 56 * math.sin(math.pi * min(1, max(0, x / (L - 30))) * .92), 300, 10, 22, .9)
tree_mass(R + 30, 1200, lambda x: 262 - 56 * math.sin(math.pi * min(1, max(0, (1200 - x) / (1200 - R - 30))) * .92), 300, 10, 22, .9)
for x in (70, 150, 236, 1000, 1080, 1150):
    ashoka(x, 300, rnd.uniform(70, 96))
for x, h, lean in ((262, 96, -.12), (296, 80, .1), (918, 92, .14), (954, 74, -.08)):
    palm(x, 312, h, lean)
# low hedge of crowns along the palace front
tree_mass(L - 50, R + 50, 292, 314, 8, 13, .8)
tree_mass(0, 1200, 306, 326, 9, 16, 1.0)

# ---------------------------------------------------------------- Sursagar's Shiva
SX, SB = 1060, 372


def shiva():
    # stepped plinth on the water
    rect(SX - 26, SB - 6, 52, 6, 1.1)
    rect(SX - 20, SB - 26, 40, 20, 1.1)
    rect(SX - 23, SB - 30, 46, 4, 1.0)
    vhatch(SX + 4, SX + 20, SB - 26, SB - 6, 2.0, .45)
    base = SB - 30
    # lotus
    add(f"M{f(SX - 16)} {f(base)}Q{f(SX - 12)} {f(base - 9)} {f(SX - 6)} {f(base - 4)}Q{f(SX)} {f(base - 12)} {f(SX + 6)} {f(base - 4)}"
        f"Q{f(SX + 12)} {f(base - 9)} {f(SX + 16)} {f(base)}", .9)
    b = base - 6
    # standing figure: dhoti flaring slightly to the feet, a narrow waist, broad shoulders
    add(f"M{f(SX - 9)} {f(b)}C{f(SX - 10)} {f(b - 20)} {f(SX - 8)} {f(b - 40)} {f(SX - 9)} {f(b - 54)}"
        f"L{f(SX + 9)} {f(b - 54)}C{f(SX + 8)} {f(b - 40)} {f(SX + 10)} {f(b - 20)} {f(SX + 9)} {f(b)}Z", 1.0, True)
    for k in (-4, 0, 4):
        add(f"M{f(SX + k)} {f(b - 52)}Q{f(SX + k * 1.3 + 1)} {f(b - 28)} {f(SX + k * 1.5)} {f(b - 3)}", .45)
    vhatch(SX + 3, SX + 9, b - 52, b - 2, 1.8, .4)
    line(SX - 10, b - 54, SX + 10, b - 54, 1.1)  # sash
    add(f"M{f(SX - 9)} {f(b - 55)}C{f(SX - 8)} {f(b - 64)} {f(SX - 14)} {f(b - 76)} {f(SX - 13)} {f(b - 84)}"
        f"Q{f(SX)} {f(b - 88)} {f(SX + 13)} {f(b - 84)}C{f(SX + 14)} {f(b - 76)} {f(SX + 8)} {f(b - 64)} {f(SX + 9)} {f(b - 55)}Z", 1.0, True)
    vhatch(SX + 3, SX + 12, b - 82, b - 57, 1.8, .4)
    # serpent garland
    add(f"M{f(SX - 9)} {f(b - 84)}Q{f(SX)} {f(b - 70)} {f(SX + 9)} {f(b - 84)}", .7)
    # head with jata bun and crescent
    add(f"M{f(SX - 5.5)} {f(b - 92)}a5.5 6.5 0 1 0 11 0a5.5 6.5 0 1 0 -11 0Z", 1.0, True)
    add(f"M{f(SX - 4)} {f(b - 98)}Q{f(SX)} {f(b - 110)} {f(SX + 4)} {f(b - 98)}", 1.0)
    add(f"M{f(SX + 1)} {f(b - 106)}a3 3 0 0 1 4 2", .7)
    # right arm in blessing, left arm holding the trident
    poly([(SX + 12, b - 82), (SX + 19, b - 68), (SX + 21, b - 80)], .9)
    add(f"M{f(SX + 21)} {f(b - 80)}l-2 -6m2 6l2 -6m-2 6l4 -3", .6)
    poly([(SX - 12, b - 82), (SX - 19, b - 66), (SX - 24, b - 70)], .9)
    tx = SX - 25
    line(tx, b + 2, tx, b - 124, 1.1)
    add(f"M{f(tx - 7)} {f(b - 114)}Q{f(tx - 7)} {f(b - 106)} {f(tx)} {f(b - 106)}Q{f(tx + 7)} {f(b - 106)} {f(tx + 7)} {f(b - 114)}", 1.0)
    line(tx, b - 106, tx, b - 128, 1.0)
    add(f"M{f(tx - 2)} {f(b - 98)}a2 2.6 0 1 0 4 0a2 2.6 0 1 0 -4 0", .7)  # damaru



# ---------------------------------------------------------------- the lake
line(0, SHORE, W, SHORE, 1.0)
y = SHORE + 5
row = 0
while y < H:
    gap = 3.2 + row * .22
    x = rnd.uniform(-20, 0)
    while x < W:
        seg = rnd.uniform(14, 60)
        # reflections: under the palace and the statue the strokes break up into short dashes
        under = (L - 40 < x < R + 40) or (SX - 44 < x < SX + 44)
        if under:
            seg = rnd.uniform(4, 12)
        if rnd.random() < (0.72 if under else 0.82):
            line(x, y, x + seg, y + rnd.uniform(-.3, .3), .55 if row > 3 else .7)
        x += seg + rnd.uniform(3, 10 if under else 16)
    y += gap
    row += 1

TF[0] = f"translate({SX} {SB}) scale(1.45) translate({-SX} {-SB})"
shiva()
TF[0] = None

out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><symbol id="v" viewBox="0 0 {W} {H}" stroke-linecap="round" stroke-linejoin="round">']
cur, cw = [], None
def flush():
    if cur:
        t = f' transform="{ctf}"' if ctf else ""
        out.append(f'<path stroke-width="{cw}"{t} d="{"".join(cur)}"/>')
ctf = None
for d, w, occ, tf in P:
    w = round(w, 2)
    if occ or w != cw or tf != ctf:
        flush(); cur, cw, ctf = [], w, tf
    cur.append(d)
flush()
out.append("</symbol></svg>")
open(sys.argv[1], "w").write("\n".join(out))
print(len(P), "items", len(out), "elements")

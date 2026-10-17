"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Employer } from "@/content/site";

const PER_YEAR = 2; // ticks per year: a major one on the year and one between
const HALO = 64; // px: how far the swell around the pointer reaches
const LIFT = 1.1; // extra height at the centre of the swell (1.1 = 2.1× the resting height)
const SETTLE = 260; // ms of stillness before the swell subsides to just the active stretch
const SUBSIDE = 520; // ms for the swell to ease away once the phone scale comes to rest
// Phone drag physics. The scale moves on a GPU transform (no scroll events). It follows the finger 1:1 with a
// rubber band past either end. On release it keeps the finger's speed and eases out smoothly onto a year:
// GLIDE is how far a flick carries (ms' worth of release speed, about iOS's feel), and it always lands on at least
// the next year in the direction of the drag. Gentle drags ease the rest of the way.
const GLIDE = 320;
const GLIDE_MIN = 300;
const GLIDE_MAX = 750;
const EASE_MS = 420;
const BAND = 0.3; // rubber-band resistance past the ends

// Past employers as a time scale, newest on the left: a baseline with short, thick ticks and only the years
// above. While the pointer moves, the ticks swell around it; once it rests, the swell subsides and only the
// stretch it's on stays marked. That team's mark, name, dates and blurb sit centred below. The swell passes along
// the scale once when it scrolls into view, as a hint. On phones the scale is wider than the screen and scrolls
// sideways; whatever sits under the centre marker is active, so scrolling plays the journey back in time.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const toYear = (ym: string) => Number(ym.slice(0, 4)) + (Number(ym.slice(5, 7)) - 1) / 12;
const label = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;

// items: newest first
export function Timeline({ items: employers }: { items: Employer[] }) {
  const items = employers.map((c) => ({ ...c, start: toYear(c.start), from: c.start }));
  const now = new Date();
  const to = now.getFullYear() + now.getMonth() / 12;
  const from = Math.floor(items[items.length - 1].start);
  const span = to - from;
  const ticks = Array.from({ length: Math.floor(span * PER_YEAR) + 1 }, (_, i) => from + i / PER_YEAR);
  const pos = (year: number) => (to - year) / span; // 0 = now, at the left edge
  const ends = items.map((c, i) => (i === 0 ? to : items[i - 1].start));
  const indexAt = (year: number) => {
    let i = 0;
    while (i + 1 < items.length && items[i].start > year) i++;
    return i;
  };

  const [active, setActive] = useState<number | null>(null);
  const [moving, setMoving] = useState(false);
  const [pin, setPin] = useState<number | "now" | null>(null); // phones: the milestone under the centre marker
  // Detail cards: the active team's card slides in from the direction of travel while the last one slides out.
  const [cards, setCards] = useState<{ i: number; dir: number; id: number; out?: boolean }[]>([]);
  const last = useRef<number | null>(null);
  const seq = useRef(0);
  useEffect(() => {
    const prev = last.current;
    if (active === prev) return;
    last.current = active;
    const dir = prev === null || active === null ? 0 : Math.sign(active - prev); // +1 = towards older, on the right
    setCards((cs) => [
      ...cs.filter((c) => !c.out).map((c) => ({ ...c, out: true, dir })),
      ...(active === null ? [] : [{ i: active, dir, id: ++seq.current }]),
    ]);
  }, [active]);
  const ruler = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const tickEls = useRef<(HTMLSpanElement | null)[]>([]);
  const frame = useRef(0);
  const idle = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Swell the ticks around x (px from the scale's left edge); null lets them all settle back.
  // amp (0–1) scales the swell, so it can ease away instead of switching off. While it subsides, the
  // milestone under the phone marker keeps its full height.
  const swell = useCallback(
    (x: number | null, amp = 1) => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const w = ruler.current?.clientWidth ?? 0;
        tickEls.current.forEach((el, i) => {
          if (!el) return;
          const d = x === null ? Infinity : pos(ticks[i]) * w - x;
          const s = i === pinRef.current && amp < 1 ? 1 + LIFT : 1 + LIFT * amp * Math.exp(-((d / HALO) ** 2));
          el.style.setProperty("--s", s.toFixed(3));
        });
      });
    },
    [ticks.length], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Swell while moving; after a short rest, subside to just the active stretch.
  const moveTo = (x: number, w: number) => {
    swell(x);
    setMoving(true);
    setActive(indexAt(to - (x / w) * span));
    clearTimeout(idle.current);
    cancelAnimationFrame(ebb.current);
    idle.current = setTimeout(scrolling() ? subside : () => (swell(null), setMoving(false)), scrolling() ? 60 : SETTLE);
  };
  // Phones: once the scale comes to rest, the swell around the marker eases away over SUBSIDE ms
  const ebb = useRef(0);
  const subside = () => {
    setMoving(false);
    const t0 = performance.now(), x = xRef.current;
    const step = (t: number) => {
      const k = Math.min((t - t0) / SUBSIDE, 1);
      swell(x, Math.max((1 - k) ** 2, 0.0001));
      if (k < 1) ebb.current = requestAnimationFrame(step);
    };
    ebb.current = requestAnimationFrame(step);
  };
  const reset = () => (clearTimeout(idle.current), swell(null), setMoving(false), setActive(null));

  const at = (clientX: number) => {
    const r = ruler.current!.getBoundingClientRect();
    moveTo(Math.min(Math.max(clientX - r.left, 0), r.width), r.width);
  };

  // Scroll mode (phones): the scale is wider than the screen and slides under a fixed centre marker. x is the
  // point on the scale under the marker, in px from its left (Now) edge.
  const scrolling = () => typeof window !== "undefined" && matchMedia("(max-width: 560px)").matches;
  const xRef = useRef(0);
  const pinRef = useRef(-1);
  const anim = useRef(0);
  const place = (x: number) => {
    const sc = scroller.current, r = ruler.current;
    if (!sc || !r) return;
    const w = r.clientWidth;
    xRef.current = x;
    r.style.transform = `translate3d(${sc.clientWidth / 2 - x}px, 0, 0)`;
    const cx = Math.min(Math.max(x, 0), w);
    moveTo(cx, w);
    // The milestone under the marker (a year, or Now): it lights up with the marker once the scale settles
    let best: number | "now" = "now", gap = cx;
    ticks.forEach((y, i) => {
      if (i % PER_YEAR || Math.abs(pos(y) * w - cx) >= gap) return;
      gap = Math.abs(pos(y) * w - cx);
      best = i;
    });
    pinRef.current = typeof best === "number" ? best : -1;
    setPin(best);
  };
  // Points on the scale that can sit under the marker: Now, then each year
  const milestones = () => {
    const w = ruler.current!.clientWidth;
    return [0, ...ticks.filter((_, i) => i % PER_YEAR === 0).map((y) => pos(y) * w)].sort((a, b) => a - b);
  };
  // Glide from where the scale is to target on an ease-out curve whose opening speed matches the release speed
  // v (px/ms), so there's no jolt as the finger lifts; the glide lasts 0.3–0.75s.
  const glideTo = (target: number, v = 0) => {
    cancelAnimationFrame(anim.current);
    const x0 = xRef.current, d = target - x0;
    if (Math.abs(d) < 0.5 || matchMedia("(prefers-reduced-motion: reduce)").matches) return place(target);
    const T = v * d > 0 ? Math.min(Math.max((3 * Math.abs(d)) / Math.abs(v), GLIDE_MIN), GLIDE_MAX) : EASE_MS;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min((t - t0) / T, 1);
      place(k < 1 ? x0 + d * (1 - (1 - k) ** 3) : target);
      if (k < 1) anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
  };
  const centreOn = (x: number) => glideTo(x);

  // Dragging (scroll mode)
  const drag = useRef<{ id: number; px: number; x0: number; samples: [number, number][]; moved: boolean } | null>(null);
  const onDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrolling() || drag.current) return;
    cancelAnimationFrame(anim.current);
    drag.current = { id: e.pointerId, px: e.clientX, x0: xRef.current, samples: [], moved: false };
  };
  const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.px;
    if (!d.moved && Math.abs(dx) < 4) return;
    if (!d.moved) (d.moved = true), e.currentTarget.setPointerCapture(e.pointerId);
    const w = ruler.current!.clientWidth;
    let x = d.x0 - dx;
    if (x < 0) x *= BAND;
    if (x > w) x = w + (x - w) * BAND;
    place(x);
    d.samples.push([e.timeStamp, x]);
    while (d.samples.length > 2 && e.timeStamp - d.samples[0][0] > 80) d.samples.shift();
  };
  const onDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) return; // a tap does nothing
    const [t0, a] = d.samples[0] ?? [e.timeStamp, xRef.current];
    const [t1, b] = d.samples[d.samples.length - 1] ?? [t0, a];
    const v = e.type === "pointercancel" || t1 === t0 ? 0 : (b - a) / (t1 - t0);
    const x = xRef.current, dir = Math.sign(x - d.x0);
    const aim = x + (Math.sign(v) === dir ? v : 0) * GLIDE;
    const ms = milestones();
    const ahead = ms.filter((m) => (m - d.x0) * dir > 1);
    const pool = ahead.length ? ahead : ms;
    glideTo(pool.reduce((p, m) => (Math.abs(m - aim) < Math.abs(p - aim) ? m : p)), v);
  };

  const focusOn = (i: number) => {
    const w = ruler.current?.clientWidth ?? 0;
    const x = ((pos(items[i].start) + pos(ends[i])) / 2) * w;
    if (scrolling()) return centreOn(x);
    moveTo(x, w);
  };

  // In scroll mode, start with "now" under the marker
  useEffect(() => {
    if (scrolling()) place(0);
    return () => (clearTimeout(idle.current), cancelAnimationFrame(anim.current), cancelAnimationFrame(ebb.current));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // One pass of the swell along the scale when it first comes into view
  useEffect(() => {
    const el = ruler.current;
    if (!el || scrolling() || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const run = (t: number) => {
          const k = Math.min((t - t0) / 1800, 1);
          const ease = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
          if (k < 1) {
            swell(-HALO + ease * (el.clientWidth + 2 * HALO));
            raf = requestAnimationFrame(run);
          } else swell(null);
        };
        raf = requestAnimationFrame(run);
      },
      { threshold: 0.8 },
    );
    io.observe(el);
    return () => (io.disconnect(), cancelAnimationFrame(raf));
  }, [swell]);

  const lo = active === null ? Infinity : items[active].start;
  const hi = active === null ? -Infinity : ends[active];

  return (
    <div className={`rl-wrap${pin !== null && !moving ? " pinned" : ""}`} style={{ ["--years" as string]: span }}>
      <div
        ref={scroller}
        className="rl-scroll"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      >
        <div
          ref={ruler}
          className={`rl${active !== null ? " has-active" : ""}${moving ? " moving" : ""}`}
          tabIndex={0}
          role="group"
          aria-label="Places I've worked, newest to oldest. Use the arrow keys to move along the timeline."
          onPointerMove={(e) => e.pointerType !== "touch" && !scrolling() && at(e.clientX)}
          onPointerDown={(e) => e.pointerType !== "touch" && !scrolling() && at(e.clientX)}
          onPointerLeave={(e) => e.pointerType === "mouse" && !scrolling() && reset()}
          onFocus={(e) => active === null && e.currentTarget.matches(":focus-visible") && focusOn(0)}
          onBlur={() => !scrolling() && reset()}
          onKeyDown={(e) => {
            const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
            if (!step) return;
            e.preventDefault();
            focusOn(Math.min(Math.max((active ?? 0) + step, 0), items.length - 1));
          }}
        >
          <div className="rl-years" aria-hidden="true">
            {ticks
              .filter((_, i) => i % PER_YEAR === 0)
              .map((y) => {
                const p = pos(y);
                return (
                  <span
                    key={y}
                    className={y >= lo && y <= hi ? "on" : undefined}
                    style={{ left: `${p * 100}%`, transform: `translateX(${p > 0.97 ? -100 : p < 0.03 ? 0 : -50}%)` }}
                  >
                    {y}
                  </span>
                );
              })}
          </div>
          <div className="rl-ticks" aria-hidden="true">
            {ticks.map((y, i) => (
              <span
                key={i}
                ref={(el) => {
                  tickEls.current[i] = el;
                }}
                className={`${i % PER_YEAR === 0 ? "maj" : ""}${y >= lo && y <= hi ? " in" : ""}${pin === i && !moving ? " pin" : ""}`}
                style={{ left: `${pos(y) * 100}%` }}
              />
            ))}
            <span className={`rl-now${pin === "now" && !moving ? " pin" : ""}`} />
          </div>
        </div>
      </div>
      <div className="rl-caption" aria-live="polite">
        {cards.map((c) => {
          const it = items[c.i];
          return (
            <div
              key={c.id}
              className={`rl-card${c.out ? " out" : ""}`}
              aria-hidden={c.out || undefined}
              style={{ ["--dir" as string]: c.dir, ["--rise" as string]: c.dir ? "0px" : "6px" }}
              onAnimationEnd={(e) => c.out && e.target === e.currentTarget && setCards((cs) => cs.filter((x) => x.id !== c.id))}
            >
              <span className="rl-mark" aria-hidden="true" style={{ ["--src" as string]: `url(${it.src})` }} />
              <b className="rl-name">{it.name}</b>
              <span className="rl-dates mono">
                {label(it.from)} – {it.end ? label(it.end) : "Now"}
              </span>
              <p className="rl-blurb">{it.blurb}</p>
            </div>
          );
        })}
        {active === null && (
          <p className="rl-hint">
            <span className="rl-hint-fine">Run your cursor along the years.</span>
            <span className="rl-hint-coarse">Tap or drag along the years.</span>
          </p>
        )}
      </div>
    </div>
  );
}

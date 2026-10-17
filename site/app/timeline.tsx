"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Employer } from "@/content/site";

const PER_YEAR = 12; // ticks per year: one a month, taller at the half year and tallest on the year
const HALO = 64; // px: how far the swell around the pointer reaches
const LIFT = 1.1; // extra height at the centre of the swell (1.1 = 2.1× the resting height)
// The swell is one continuous animation: its centre follows the pointer, and its height eases toward 1 while
// moving and toward 0 once the pointer (or the phone scale) has been still for STILL ms, with no pause or snap.
const STILL = 90; // ms without movement before the swell starts to sink
const FOLLOW = 45; // ms time constant for the swell's centre catching up with the pointer (desktop)
const RISE = 70; // ms time constant for the swell growing
const SINK = 230; // ms time constant for the swell sinking away
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
  const sw = useRef({ x: 0, tx: 0, amp: 0, target: 0, last: 0, t: 0, raf: 0 });

  // Paint the swell: ticks rise around x (px from the scale's left edge) by amp (0–1). While it sinks, the
  // selected tick (under the pointer, or under the phone marker) keeps its full height.
  const paint = useCallback(
    (x: number, amp: number, holdPin: boolean) => {
      const w = ruler.current?.clientWidth ?? 0;
      tickEls.current.forEach((el, i) => {
        if (!el) return;
        const d = pos(ticks[i]) * w - x;
        const s = holdPin && i === pinRef.current ? 1 + LIFT : 1 + LIFT * amp * Math.exp(-((d / HALO) ** 2));
        el.style.setProperty("--s", s.toFixed(3));
      });
    },
    [ticks.length], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // One frame of the swell: follow the pointer, grow while moving, sink smoothly once still.
  const tick = (t: number) => {
    const S = sw.current;
    const dt = Math.min(t - (S.t || t), 50);
    S.t = t;
    if (S.target && t - S.last > STILL && !drag.current?.moved) {
      S.target = 0;
      setMoving(false);
    }
    S.x = scrolling() ? S.tx : S.x + (S.tx - S.x) * (1 - Math.exp(-dt / FOLLOW));
    S.amp += (S.target - S.amp) * (1 - Math.exp(-dt / (S.target > S.amp ? RISE : SINK)));
    const done = !S.target && S.amp < 0.003;
    if (done) S.amp = 0;
    paint(S.x, S.amp, !S.target);
    S.raf = done ? 0 : requestAnimationFrame(tick);
  };
  const run = () => {
    const S = sw.current;
    if (!S.raf) (S.t = 0), (S.raf = requestAnimationFrame(tick));
  };

  // Moving: point the swell at x, keep it up, and pick the team under it
  const moveTo = (x: number, w: number) => {
    const S = sw.current;
    if (!S.raf && S.amp === 0) S.x = x;
    S.tx = x;
    S.target = 1;
    S.last = performance.now();
    run();
    setMoving(true);
    setActive(indexAt(to - (x / w) * span));
    xRef.current = x;
  };
  const reset = () => {
    pinRef.current = -1;
    setPin(null);
    sw.current.target = 0;
    run();
    setMoving(false);
    setActive(null);
  };

  // Desktop: the tick under the pointer is the selected one
  const at = (clientX: number) => {
    const r = ruler.current!.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - r.left, 0), r.width);
    const i = Math.round(((to - from - (x / r.width) * span) * PER_YEAR));
    pinRef.current = Math.min(Math.max(i, 0), ticks.length - 1);
    setPin(pinRef.current);
    moveTo(x, r.width);
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
    return () => (cancelAnimationFrame(anim.current), cancelAnimationFrame(sw.current.raf));
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
            paint(-HALO + ease * (el.clientWidth + 2 * HALO), 1, false);
            raf = requestAnimationFrame(run);
          } else paint(0, 0, false);
        };
        raf = requestAnimationFrame(run);
      },
      { threshold: 0.8 },
    );
    io.observe(el);
    return () => (io.disconnect(), cancelAnimationFrame(raf));
  }, [paint]);

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
            {/* The active team's time, as a soft band behind its stretch of the scale */}
            <div
              className={`rl-band${active === null ? "" : " on"}`}
              style={active === null ? undefined : { left: `${pos(hi) * 100}%`, width: `${(pos(lo) - pos(hi)) * 100}%` }}
            />
            {ticks.map((y, i) => (
              <span
                key={i}
                ref={(el) => {
                  tickEls.current[i] = el;
                }}
                className={`${i % PER_YEAR === 0 ? "maj" : i % (PER_YEAR / 2) === 0 ? "mid" : ""}${pin === i && !moving ? " pin" : ""}`}
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

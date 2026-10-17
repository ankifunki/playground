"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Employer } from "@/content/site";

const PER_YEAR = 2; // ticks per year: a major one on the year and one between
const HALO = 64; // px: how far the swell around the pointer reaches
const LIFT = 1.1; // extra height at the centre of the swell (1.1 = 2.1× the resting height)
const SETTLE = 260; // ms of stillness before the swell subsides to just the active stretch

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
  const swell = useCallback(
    (x: number | null) => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const w = ruler.current?.clientWidth ?? 0;
        tickEls.current.forEach((el, i) => {
          if (!el) return;
          const d = x === null ? Infinity : pos(ticks[i]) * w - x;
          el.style.setProperty("--s", (1 + LIFT * Math.exp(-((d / HALO) ** 2))).toFixed(3));
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
    idle.current = setTimeout(() => (swell(null), setMoving(false)), SETTLE);
  };
  const reset = () => (clearTimeout(idle.current), swell(null), setMoving(false), setActive(null));

  const at = (clientX: number) => {
    const r = ruler.current!.getBoundingClientRect();
    moveTo(Math.min(Math.max(clientX - r.left, 0), r.width), r.width);
  };

  // Scroll mode (phones): the scale overflows its scroller and the centre of the scroller picks the active stretch.
  const scrolling = () => {
    const sc = scroller.current;
    return !!sc && getComputedStyle(sc).overflowX === "auto";
  };
  const fromCentre = () => {
    const sc = scroller.current, r = ruler.current;
    if (!sc || !r) return;
    moveTo(Math.min(Math.max(sc.scrollLeft + sc.clientWidth / 2 - r.offsetLeft, 0), r.clientWidth), r.clientWidth);
  };
  const centreOn = (x: number) => {
    const sc = scroller.current, r = ruler.current;
    if (sc && r) sc.scrollTo({ left: r.offsetLeft + x - sc.clientWidth / 2, behavior: "smooth" });
  };

  const focusOn = (i: number) => {
    const w = ruler.current?.clientWidth ?? 0;
    const x = ((pos(items[i].start) + pos(ends[i])) / 2) * w;
    if (scrolling()) return centreOn(x);
    moveTo(x, w);
  };

  // In scroll mode, start with "now" under the marker
  useEffect(() => {
    if (scrolling()) fromCentre();
    return () => clearTimeout(idle.current);
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
    <div className="rl-wrap" style={{ ["--years" as string]: span }}>
      <div ref={scroller} className="rl-scroll" onScroll={() => scrolling() && fromCentre()}>
        <div
          ref={ruler}
          className={`rl${active !== null ? " has-active" : ""}${moving ? " moving" : ""}`}
          tabIndex={0}
          role="group"
          aria-label="Places I've worked, newest to oldest. Use the arrow keys to move along the timeline."
          onPointerMove={(e) => e.pointerType !== "touch" && !scrolling() && at(e.clientX)}
          onPointerDown={(e) => e.pointerType !== "touch" && !scrolling() && at(e.clientX)}
          onPointerLeave={(e) => e.pointerType === "mouse" && !scrolling() && reset()}
          onClick={(e) => scrolling() && centreOn(e.clientX - ruler.current!.getBoundingClientRect().left)}
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
                    className={y >= Math.floor(lo) && y <= hi ? "on" : undefined}
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
                className={`${i % PER_YEAR === 0 ? "maj" : ""}${y >= lo && y <= hi ? " in" : ""}`}
                style={{ left: `${pos(y) * 100}%` }}
              />
            ))}
            <span className="rl-now" />
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

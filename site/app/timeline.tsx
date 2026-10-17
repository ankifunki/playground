"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Employer } from "@/content/site";

const PER_YEAR = 4; // ticks per year: a tall one on the year, three short ones between
const HALO = 70; // px: how far the swell around the pointer reaches
const LIFT = 1.6; // extra height at the centre of the swell (1.6 = 2.6× the resting height)

// Past employers as a ruler: thin vertical ticks, with only the start years written above. Moving along it, the
// ticks swell around the pointer like a halo, the stretch of years under it darkens, and that team's mark, name
// and blurb appear below. The swell passes along the ruler once when it scrolls into view, as a hint.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const toYear = (ym: string) => Number(ym.slice(0, 4)) + (Number(ym.slice(5, 7)) - 1) / 12;
const label = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;

export function Timeline({ items: employers }: { items: Employer[] }) {
  const items = employers.map((c) => ({ ...c, start: toYear(c.start), from: c.start }));
  const from = Math.floor(items[0].start);
  const now = new Date();
  const to = now.getFullYear() + now.getMonth() / 12;
  const span = to - from;
  const total = Math.floor(span * PER_YEAR) + 1;
  const ticks = Array.from({ length: total }, (_, i) => from + i / PER_YEAR);
  const pos = (year: number) => (year - from) / span;
  const ends = items.map((c, i) => (i + 1 < items.length ? items[i + 1].start : to));
  const indexAt = (year: number) => {
    let i = 0;
    while (i + 1 < items.length && items[i + 1].start <= year) i++;
    return i;
  };

  const [active, setActive] = useState<number | null>(null);
  const ruler = useRef<HTMLDivElement>(null);
  const tickEls = useRef<(HTMLSpanElement | null)[]>([]);
  const frame = useRef(0);

  // Swell the ticks around x (px from the ruler's left edge); null lets them all settle back.
  const swell = useCallback((x: number | null) => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const w = ruler.current?.clientWidth ?? 0;
      tickEls.current.forEach((el, i) => {
        if (!el) return;
        const d = x === null ? Infinity : (i / (total - 1)) * w - x;
        el.style.setProperty("--s", (1 + LIFT * Math.exp(-((d / HALO) ** 2))).toFixed(3));
      });
    });
  }, [total]);

  const at = (clientX: number) => {
    const r = ruler.current!.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - r.left, 0), r.width);
    swell(x);
    setActive(indexAt(from + (x / r.width) * span));
  };

  const focusOn = (i: number) => {
    const w = ruler.current?.clientWidth ?? 0;
    setActive(i);
    swell(((pos(items[i].start) + pos(ends[i])) / 2) * w);
  };

  // One pass of the swell along the ruler when it first comes into view
  useEffect(() => {
    const el = ruler.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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

  const current = active === null ? null : items[active];
  const lo = active === null ? -1 : items[active].start;
  const hi = active === null ? -1 : ends[active];

  return (
    <div className="rl-wrap">
      <div
        ref={ruler}
        className="rl"
        tabIndex={0}
        role="group"
        aria-label="Places I've worked, oldest to newest. Use the arrow keys to move along the timeline."
        onPointerMove={(e) => at(e.clientX)}
        onPointerDown={(e) => at(e.clientX)}
        onPointerLeave={(e) => e.pointerType === "mouse" && (swell(null), setActive(null))}
        onFocus={(e) => active === null && e.currentTarget.matches(":focus-visible") && focusOn(items.length - 1)}
        onBlur={() => (swell(null), setActive(null))}
        onKeyDown={(e) => {
          const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
          if (!step) return;
          e.preventDefault();
          focusOn(Math.min(Math.max((active ?? items.length - 1) + step, 0), items.length - 1));
        }}
      >
        <div className="rl-years" aria-hidden="true">
          {items.map((c, i) => (
            <span
              key={c.name}
              className={`${active === i ? "on" : ""}${i + 1 < items.length && items[i + 1].start - c.start < 1 ? " tight" : ""}`}
              style={{ left: `${pos(c.start) * 100}%` }}
            >
              <span className="rl-y-full">{c.from.slice(0, 4)}</span>
              <span className="rl-y-short">’{c.from.slice(2, 4)}</span>
            </span>
          ))}
        </div>
        <div className="rl-ticks" aria-hidden="true">
          {ticks.map((y, i) => (
            <span
              key={i}
              ref={(el) => {
                tickEls.current[i] = el;
              }}
              className={`${i % PER_YEAR === 0 ? "maj" : ""}${y >= lo && y <= hi ? " in" : ""}`}
              style={{ left: `${(i / (total - 1)) * 100}%` }}
            />
          ))}
          <span className="rl-now" style={{ left: "100%" }} />
        </div>
      </div>
      <p className="rl-caption" aria-live="polite">
        {current ? (
          <span key={current.name} className="rl-caption-in">
            <span className="rl-mark" aria-hidden="true" style={{ ["--src" as string]: `url(${current.src})` }} />
            <b>{current.name}</b>
            <span className="rl-dates mono">
              {label(current.from)} – {current.end ? label(current.end) : "Now"}
            </span>
            <span className="rl-blurb">{current.blurb}</span>
          </span>
        ) : (
          <span className="rl-hint">
            <span className="rl-hint-fine">Run your cursor along the years.</span>
            <span className="rl-hint-coarse">Tap or drag along the years.</span>
          </span>
        )}
      </p>
    </div>
  );
}

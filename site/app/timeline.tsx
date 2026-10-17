"use client";

import { useEffect, useRef, useState } from "react";
import type { Employer } from "@/content/site";

// Past employers on one line, oldest on the left and "now" on the right. Marks rest faint; a light sweeps along
// the line once when it scrolls into view, hinting that each one can be explored. Hover, focus or tap a mark to
// lift it, show its name above and its blurb below. Arrow keys move along the line.
export function Timeline({ items }: { items: Employer[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [swept, setSwept] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSwept(true);
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const move = (i: number, dir: number) => {
    const next = (i + dir + items.length) % items.length;
    buttons.current[next]?.focus();
  };

  const current = active === null ? null : items[active];

  return (
    <div
      ref={ref}
      className={`tl${swept ? " swept" : ""}${active !== null ? " has-active" : ""}`}
      style={{ ["--n" as string]: items.length }}
      onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
    >
      <ol className="tl-track">
        {items.map((c, i) => (
          <li key={c.name} className={active === i ? "on" : undefined} style={{ ["--i" as string]: i }}>
            <button
              ref={(b) => {
                buttons.current[i] = b;
              }}
              type="button"
              className="tl-node"
              aria-label={c.name}
              aria-pressed={active === i}
              aria-describedby={active === i ? "tl-blurb" : undefined}
              onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowDown") (e.preventDefault(), move(i, 1));
                if (e.key === "ArrowLeft" || e.key === "ArrowUp") (e.preventDefault(), move(i, -1));
              }}
            >
              <span className="tl-name" aria-hidden="true">{c.name}</span>
              <span className="tl-mark" aria-hidden="true" style={{ ["--src" as string]: `url(${c.src})` }} />
            </button>
          </li>
        ))}
      </ol>
      <div className="tl-ends mono" aria-hidden="true">
        <span>Then</span>
        <span>Now</span>
      </div>
      <p id="tl-blurb" className="tl-blurb" aria-live="polite">
        {current ? (
          <span key={current.name} className="tl-blurb-in">
            <b>{current.name}</b> {current.blurb}
          </span>
        ) : (
          <span className="tl-hint">
            <span className="tl-hint-fine">Hover a mark for the story.</span>
            <span className="tl-hint-coarse">Tap a mark for the story.</span>
          </span>
        )}
      </p>
    </div>
  );
}

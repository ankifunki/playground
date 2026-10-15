"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Project } from "@/content/site";

const DWELL = 5200; // ms per chapter while auto-playing
const ZOOM = 1.8; // same magnification as the case study's loupe

export function Feature({ project }: { project: Project & { feature: NonNullable<Project["feature"]> } }) {
  const { chapters, facts } = project.feature;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [auto, setAuto] = useState(true);
  const screen = useRef<HTMLDivElement>(null);
  const lens = useRef<HTMLDivElement>(null);

  // Auto-advance, unless the visitor prefers reduced motion, has picked a tab, or is hovering.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) setAuto(false);
  }, []);
  useEffect(() => {
    if (!auto || paused) return;
    const t = setTimeout(() => setI((n) => (n + 1) % chapters.length), DWELL);
    return () => clearTimeout(t);
  }, [i, auto, paused, chapters.length]);

  const pick = (n: number) => {
    setAuto(false);
    setI(n);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + chapters.length) % chapters.length;
    pick(n);
    (e.currentTarget.querySelectorAll("button")[n] as HTMLButtonElement | undefined)?.focus();
  };

  // Loupe: a round lens that magnifies the screen under the cursor.
  const moveLens = useCallback(
    (e: React.PointerEvent) => {
      const s = screen.current, l = lens.current;
      if (!s || !l || e.pointerType !== "mouse") return;
      const img = s.querySelector<HTMLImageElement>("img.on");
      if (!img) return;
      const r = img.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
      l.classList.toggle("on", inside);
      if (!inside) return;
      const sr = s.getBoundingClientRect();
      const size = l.offsetWidth;
      l.style.translate = `${e.clientX - sr.left - size / 2}px ${e.clientY - sr.top - size / 2}px`;
      l.style.backgroundImage = `url(${img.currentSrc || img.src})`;
      l.style.backgroundSize = `${r.width * ZOOM}px ${r.height * ZOOM}px`;
      l.style.backgroundPosition = `${-(x * ZOOM - size / 2)}px ${-(y * ZOOM - size / 2)}px`;
    },
    [],
  );

  const href = `/work/${project.slug}/`;
  const c = chapters[i];

  return (
    <section className="feature" aria-labelledby="feature-title" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      <div className="feature-head">
        <div className="feature-title">
          <p className="mono">Case study · {project.company} · {project.year}</p>
          <h2 id="feature-title">
            <a href={href}>{project.title}</a>
          </h2>
          <p className="feature-line">{project.line}</p>
        </div>
        <a className="feature-cta" href={href}>
          Read the case study
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M4 9h10M10 5l4 4-4 4" />
          </svg>
        </a>
      </div>

      <div className="tabs" role="tablist" aria-label={`${project.title} chapters`} onKeyDown={onKey}>
        {chapters.map((ch, n) => (
          <button
            key={ch.label}
            type="button"
            role="tab"
            id={`tab-${n}`}
            aria-selected={n === i}
            aria-controls="feature-panel"
            tabIndex={n === i ? 0 : -1}
            className={n === i ? "on" : undefined}
            onClick={() => pick(n)}
          >
            <span className="tab-n">{String(n + 1).padStart(2, "0")}</span>
            {ch.label}
            {n === i && auto && <i className={`tab-progress${paused ? " paused" : ""}`} style={{ animationDuration: `${DWELL}ms` }} />}
          </button>
        ))}
      </div>

      <div id="feature-panel" role="tabpanel" aria-labelledby={`tab-${i}`} className="panel">
        <div className="screen" ref={screen} onPointerMove={moveLens} onPointerLeave={() => lens.current?.classList.remove("on")}>
          {chapters.map((ch, n) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={ch.img} src={ch.img} alt={n === i ? ch.alt : ""} aria-hidden={n !== i} className={n === i ? "on" : undefined} loading={n === 0 ? "eager" : "lazy"} />
          ))}
          <div className="lens" ref={lens} aria-hidden="true" />
        </div>
        <p className="caption" aria-live="polite">
          {c.caption}
        </p>
      </div>

      <dl className="facts">
        {facts.map((f) => (
          <div key={f.k}>
            <dt className="mono">{f.k}</dt>
            <dd>{f.v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

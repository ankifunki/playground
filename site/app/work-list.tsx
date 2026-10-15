"use client";

import { useEffect, useRef, useState } from "react";
import type { Project } from "@/content/site";

const Arrow = () => (
  <svg className="row-arrow" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M5 13 13 5M6 5h7v7" />
  </svg>
);

const Lock = () => (
  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
    <rect x="1.5" y="4.5" width="7" height="5" rx="1" />
    <path d="M3 4.5V3a2 2 0 0 1 4 0v1.5" />
  </svg>
);

export function WorkList({ projects }: { projects: Project[] }) {
  const peek = useRef<HTMLDivElement>(null);
  const [cover, setCover] = useState<string | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });

  // The cover trails the cursor a little; with reduced motion it sits exactly at the cursor.
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const tick = () => {
      const k = reduce ? 1 : 0.18;
      pos.current.x += (target.current.x - pos.current.x) * k;
      pos.current.y += (target.current.y - pos.current.y) * k;
      if (peek.current) peek.current.style.translate = `${pos.current.x}px ${pos.current.y}px`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const move = (e: React.PointerEvent) => {
    const w = 360, h = 240, gap = 24;
    const x = e.clientX + gap + w > innerWidth ? e.clientX - gap - w : e.clientX + gap;
    const y = Math.min(Math.max(e.clientY - h / 2, 12), innerHeight - h - 12);
    if (!cover) pos.current = { x, y };
    target.current = { x, y };
  };

  return (
    <>
      <ul className="work" onPointerMove={move} onPointerLeave={() => setCover(null)}>
        {projects.map((p) => {
          const locked = p.access === "password";
          return (
            <li key={p.slug}>
              <a
                className="row"
                href={`/work/${p.slug}/`}
                onPointerEnter={() => setCover(!locked && p.cover ? p.cover : null)}
              >
                <span className="row-text">
                  <span className="row-title">
                    <b>{p.title}</b>—{p.line}
                  </span>
                  <span className="row-meta mono">
                    {locked ? (
                      <span className="redacted" style={{ width: `${p.company.length * 0.62}em` }} aria-label="Company withheld" />
                    ) : (
                      <span>{p.company}</span>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{p.role}</span>
                    <span aria-hidden="true">·</span>
                    <span>{p.year}</span>
                    {locked && (
                      <span className="chip">
                        <Lock />
                        Password
                      </span>
                    )}
                  </span>
                </span>
                <Arrow />
              </a>
            </li>
          );
        })}
      </ul>
      <div ref={peek} className={`peek${cover ? " on" : ""}`} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {cover && <img src={cover} alt="" />}
      </div>
    </>
  );
}

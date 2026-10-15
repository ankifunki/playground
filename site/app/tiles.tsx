import type { Project } from "@/content/site";

const Arrow = () => (
  <svg className="tile-arrow" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M5 13 13 5M6 5h7v7" />
  </svg>
);

const Lock = () => (
  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
    <rect x="1.5" y="4.5" width="7" height="5" rx="1" />
    <path d="M3 4.5V3a2 2 0 0 1 4 0v1.5" />
  </svg>
);

function ArtFor({ p }: { p: Project }) {
  const a = p.art;
  const locked = p.access === "password";
  const style = { "--tile-bg": a.bg, "--tile-bg-dark": a.bgDark } as React.CSSProperties;
  return (
    <div className="art" style={style}>
      {/* A locked project's screens stay behind the password, so its tile only ever shows a logo. */}
      {a.kind === "crop" && !locked ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="crop"
          src={a.src}
          alt=""
          style={{ "--w": a.w, "--x": a.x, "--y": a.y } as React.CSSProperties}
        />
      ) : a.kind === "logo" ? (
        <picture>
          {a.srcDark && <source srcSet={a.srcDark} media="(prefers-color-scheme: dark)" />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo" src={a.src} alt="" />
        </picture>
      ) : null}
      {locked && (
        <span className="chip">
          <Lock />
          Password
        </span>
      )}
    </div>
  );
}

export function Tiles({ projects }: { projects: Project[] }) {
  return (
    <ul className="tiles">
      {projects.map((p) => {
        const locked = p.access === "password";
        return (
          <li key={p.slug} className={p.wide ? "wide" : undefined}>
            <a className="tile" href={`/work/${p.slug}/`}>
              <ArtFor p={p} />
              <span className="tile-text">
                <span>
                  <span className="tile-title">
                    <b>{p.title}</b>—{p.line}
                  </span>
                  <span className="tile-meta mono">
                    {locked ? (
                      <span className="redacted" style={{ width: `${p.company.length * 0.62}em` }} aria-label="Company withheld" />
                    ) : (
                      <span>{p.company}</span>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{p.role}</span>
                    <span aria-hidden="true">·</span>
                    <span>{p.year}</span>
                  </span>
                </span>
                <Arrow />
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

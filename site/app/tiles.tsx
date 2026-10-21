import type { Project } from "@/content/site";

// ↗ only for decks that open in a new tab; case studies on this site get a plain →
const Arrow = ({ external }: { external: boolean }) => (
  <svg className={`tile-arrow${external ? " out" : ""}`} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={external ? "M5 13 13 5M6 5h7v7" : "M3.5 9h11M10 4.5 14.5 9 10 13.5"} />
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
      {locked && p.lockedMark && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={p.lockedMark.srcDark ? "logo only-light" : "logo"} src={p.lockedMark.src} alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.lockedMark.srcDark && <img className="logo only-dark" src={p.lockedMark.srcDark} alt="" />}
        </>
      )}
      {a.kind === "crop" && !locked ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="crop"
          src={a.src}
          alt=""
          style={{ "--w": a.w, "--x": a.x, "--y": a.y } as React.CSSProperties}
        />
      ) : a.kind === "phones" && !locked ? (
        a.srcs.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} className="phone" src={src} alt="" style={{ "--i": i } as React.CSSProperties} />
        ))
      ) : a.kind === "logo" ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={a.srcDark ? "logo only-light" : "logo"} src={a.src} alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {a.srcDark && <img className="logo only-dark" src={a.srcDark} alt="" />}
        </>
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
            <a
              className="tile"
              href={p.href ?? `/work/${p.slug}/`}
              {...(p.href && { target: "_blank", rel: "noopener noreferrer" })}
              data-cursor={locked ? "Enter password" : p.href ? "Open the deck ↗" : "View case study →"}
            >
              <ArtFor p={p} />
              <span className="tile-text">
                <span>
                  <span className="tile-title">
                    <b>{p.title}</b>
                  </span>
                  <span className="tile-line">{p.line}</span>
                  <span className="tile-meta mono">
                    {p.redactCompany ? (
                      <span className="redacted" style={{ width: `${p.company.length * 0.62}em` }} aria-label="Company withheld" />
                    ) : (
                      <span>{p.company}</span>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{p.year}</span>
                  </span>
                </span>
                <Arrow external={!!p.href} />
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

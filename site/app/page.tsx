import { about, intro, profile, projects } from "@/content/site";
import { WorkList } from "./work-list";
import { CopyEmail } from "./copy-email";
import { Feature } from "./feature";

const LockMark = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
    <rect x="1.5" y="4.5" width="7" height="5" rx="1" />
    <path d="M3 4.5V3a2 2 0 0 1 4 0v1.5" />
  </svg>
);

export default function Home() {
  const hasLocked = projects.some((p) => p.access === "password");
  const notes = about.notes.filter((n) => n.mark !== "lock" || hasLocked);
  // Only public work can be featured, since the panel shows its screens.
  const featured = projects.find((p) => p.feature && p.access === "public") as
    | (typeof projects[number] & { feature: NonNullable<typeof projects[number]["feature"]> })
    | undefined;
  // Locked work never sends its cover to the browser.
  const rest = projects
    .filter((p) => p !== featured)
    .map((p) => (p.access === "password" ? { ...p, cover: undefined } : p));

  return (
    <main className="page">
      <header className="topbar">
        <a href="/" className="wordmark">{profile.name}</a>
        <nav aria-label="Sections" className="topnav mono">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <h1 className="statement">
        <span className="ink">{intro.lead}</span> {intro.before}{" "}
        <span className="inline-co">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={intro.company.mark} alt="" width="28" height="28" />
          <span className="ink">{intro.company.name}</span>
        </span>
        , {intro.after}
      </h1>

      <div id="work" className="work-area">
        {featured && <Feature project={featured} />}
        {rest.length > 0 && (
          <section className="section" aria-labelledby="more-work">
            <h2 id="more-work" className="mono">More work</h2>
            <WorkList projects={rest} />
          </section>
        )}
        <p className="soon">More case studies soon. Some will be password protected; ask and I’ll walk you through them.</p>
      </div>

      <div className="columns">
        <section className="section" aria-labelledby="about">
          <h2 id="about" className="mono">About</h2>
          <div className="prose">
            {about.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <ul className="notes">
            {notes.map((n) => (
              <li key={n.mark}>
                <span aria-hidden="true">{n.mark === "lock" ? <LockMark /> : n.mark}</span>
                <span>{n.text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="section contact" aria-labelledby="contact">
          <h2 id="contact" className="mono">Contact</h2>
          <CopyEmail email={profile.email} />
          <ul className="links">
            {profile.links.map((l) => (
              <li key={l.label}>
                <a href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="foot">
        <span className="mono">© {new Date().getFullYear()} {profile.name}</span>
      </footer>
    </main>
  );
}

import { about, intro, profile, projects } from "@/content/site";
import { CopyEmail } from "./copy-email";
import { Tiles } from "./tiles";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "./logo";

const LockMark = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
    <rect x="1.5" y="4.5" width="7" height="5" rx="1" />
    <path d="M3 4.5V3a2 2 0 0 1 4 0v1.5" />
  </svg>
);

// Superscript marks in the About copy become links that light up their note.
const SUP: Record<string, number> = { "¹": 1, "²": 2, "³": 3 };
function withFootnotes(text: string) {
  return text.split(/([¹²³])/).map((part, i) =>
    part in SUP ? (
      <sup key={i}>
        <a href={`#note-${SUP[part]}`} className="fn" data-note={SUP[part]} aria-label={`Note ${SUP[part]}`}>
          {SUP[part]}
        </a>
      </sup>
    ) : (
      part
    ),
  );
}

export default function Home() {
  const hasLocked = projects.some((p) => p.access === "password");
  const notes = about.notes.filter((n) => n.mark !== "lock" || hasLocked);
  return (
    <main className="page">
      <header className="topbar">
        <a href="/" className="wordmark" aria-label={profile.name}>
          <Logo />
        </a>
        <div className="topright">
          <nav aria-label="Sections" className="topnav mono">
            <a href="#work">Work</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <h1 className="statement">
        <span className="ink">{withFootnotes(intro.lead)}</span> {intro.before}{" "}
        <span className="co">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="only-light" src={intro.company.mark} alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="only-dark" src={intro.company.markDark} alt="" />
          {intro.company.name}
        </span>
        {intro.after}
      </h1>

      <section id="work" className="work-area" aria-label="Work">
        <Tiles projects={projects} />
        <p className="soon">More case studies soon. Some will be password protected; ask and I’ll walk you through them.</p>
      </section>

      <div className="columns">
        <section className="section" aria-labelledby="about">
          <h2 id="about" className="mono">About</h2>
          <div className="prose">
            {about.paragraphs.map((p) => (
              <p key={p}>{withFootnotes(p)}</p>
            ))}
          </div>
          <ul className="notes">
            {notes.map((n) => (
              <li key={n.mark} id={n.mark in SUP ? `note-${SUP[n.mark]}` : undefined}>
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

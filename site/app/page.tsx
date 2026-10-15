import { about, profile, projects } from "@/content/site";
import { WorkList } from "./work-list";
import { CopyEmail } from "./copy-email";

const LockMark = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
    <rect x="1.5" y="4.5" width="7" height="5" rx="1" />
    <path d="M3 4.5V3a2 2 0 0 1 4 0v1.5" />
  </svg>
);

export default function Home() {
  const hasLocked = projects.some((p) => p.access === "password");
  const notes = about.notes.filter((n) => n.mark !== "lock" || hasLocked);
  // Locked work never sends its cover to the browser.
  const list = projects.map((p) => (p.access === "password" ? { ...p, cover: undefined } : p));

  return (
    <main className="page">
      <header className="masthead">
        <h1>{profile.name}</h1>
        <p>{profile.title}</p>
      </header>

      <div className="columns">
        <section className="section" aria-labelledby="work">
          <h2 id="work" className="mono">Selected work</h2>
          <WorkList projects={list} />
          <p className="soon">More case studies soon.</p>
        </section>

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
          <div className="contact">
            <h2 className="mono">Contact</h2>
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
          </div>
        </section>
      </div>

      <footer className="foot">
        <span className="mono">© {new Date().getFullYear()} {profile.name}</span>
      </footer>
    </main>
  );
}

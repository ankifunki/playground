import { experience, intro, profile, projects } from "@/content/site";
import { ContactList } from "./contact-list";
import { Tiles } from "./tiles";
import { Timeline } from "./timeline";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "./logo";
import { VerbReplay } from "./verb-replay";

export default function Home() {
  return (
    <main className="page">
      <header className="topbar">
        <a href="/" className="wordmark" aria-label={profile.name}>
          <Logo />
          {/* The name writes itself in beside the mark on hover, one letter after another */}
          <span className="wm-name" aria-hidden="true">
            {[...profile.name].map((ch, i) => (
              <span key={i} style={{ ["--i" as string]: i }}>
                {ch === " " ? "\u00a0" : ch}
              </span>
            ))}
          </span>
        </a>
        <div className="topright">
          <ThemeToggle />
        </div>
      </header>

      <h1 className="statement">
        <span className="ink">{intro.lead}</span> {intro.before}{" "}
        {intro.verbs.map((v, i) => (
          <span key={v}>
            <span className={`verb v${i + 1}`}>
              <span className="vh">{v}</span>
              <span aria-hidden="true">
                {/* "build" is laid and "ship" goes out letter by letter, so each letter is its own piece */}
                {i > 0 ? [...v].map((ch, k) => <span key={k} style={{ ["--k" as string]: k }}>{ch}</span>) : v}
              </span>
            </span>
            {i < intro.verbs.length - 2 ? ", " : i === intro.verbs.length - 2 ? " and " : " "}
          </span>
        ))}
        {intro.after}
      </h1>
      <VerbReplay />

      <section id="work" className="work-area" aria-label="Work">
        <Tiles projects={projects} />
        <p className="soon">More case studies soon. Some will be password protected; ask and I’ll walk you through them.</p>
      </section>

      <section className="section been" aria-labelledby="been-at">
        <h2 id="been-at" className="sec-title">Journey so far…</h2>
        <Timeline items={experience} />
      </section>

      <div className="columns">
        {/* About is hidden for now; its copy is still in content/site.ts (about). */}

        <section className="section contact" aria-labelledby="contact">
          <h2 id="contact" className="sec-title">Contact</h2>
          <ContactList />
        </section>
      </div>

      <footer className="foot">
        <span className="mono">© {new Date().getFullYear()} {profile.name}</span>
      </footer>
    </main>
  );
}

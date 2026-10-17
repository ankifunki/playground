import { about, intro, profile, projects } from "@/content/site";
import { ContactList } from "./contact-list";
import { Tiles } from "./tiles";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "./logo";

export default function Home() {
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
        <span className="ink">{intro.lead}</span> {intro.before}{" "}
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
              <p key={p}>{p}</p>
            ))}
          </div>
        </section>

        <section className="section contact" aria-labelledby="contact">
          <h2 id="contact" className="mono">Contact</h2>
          <ContactList />
        </section>
      </div>

      <footer className="foot">
        <span className="mono">© {new Date().getFullYear()} {profile.name}</span>
      </footer>
    </main>
  );
}

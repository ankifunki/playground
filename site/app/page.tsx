import { experience, intro, profile, projects } from "@/content/site";
import { ContactList } from "./contact-list";
import { Tiles } from "./tiles";
import { Timeline } from "./timeline";
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

      <section className="section been" aria-labelledby="been-at">
        <h2 id="been-at" className="mono">Been at</h2>
        <Timeline items={[...experience].reverse()} />
      </section>

      <div className="columns">
        {/* About is hidden for now; its copy is still in content/site.ts (about). */}

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

// Everything the homepage says lives here. Edit this file to change copy or add work.

export type Access = "public" | "password";

export type Chapter = {
  label: string; // tab name
  img: string; // path under the case study folder
  alt: string;
  caption: string;
};

export type Project = {
  slug: string; // served at /work/<slug>/
  title: string;
  line: string; // one sentence on what it is or what changed
  company: string;
  year: string;
  role: string;
  access: Access;
  cover?: string; // shown beside the cursor on hover in the work list
  // Featured projects get the big panel with a tab per chapter.
  feature?: { facts: { k: string; v: string }[]; chapters: Chapter[] };
};

export const profile = {
  name: "Ankit Joshi",
  title: "Product designer",
  email: "ankit@joshiankit.com",
  links: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/joshiankit" },
    { label: "Dribbble", href: "https://dribbble.com/ankit" },
    { label: "X", href: "https://x.com/ankifunki" },
  ],
};

// DRAFT copy. Ankit to rewrite in his own words.
export const intro = {
  lead: "I’m Ankit, a product designer.",
  before: "Most recently I led Multi Location at",
  company: { name: "GlossGenius", mark: "/work/multi-location/assets/glossgenius-g-black.svg" },
  after: "rebuilding software for salons, barbershops and spas so one business can run many locations.",
};

export const about = {
  paragraphs: [
    "I’m a designer, a listener and a curious being.¹",
    "I like the hard middle of product work: systems that touch every screen, where the job is to make something big feel obvious to the person using it at 9am on a busy Saturday.",
  ],
  notes: [
    { mark: "¹", text: "How I described myself on my first portfolio, in 2017. Still true." },
    { mark: "lock", text: "Locked work. I can’t share it publicly, but I’m happy to walk you through it. Ask for a password." },
  ],
};

const ml = (f: string) => `/work/multi-location/img/${f}`;

export const projects: Project[] = [
  {
    slug: "multi-location",
    title: "Multi Location",
    line: "A platform shift across every core workflow, from one location to many.",
    company: "GlossGenius",
    year: "2025",
    role: "Lead Product Designer",
    access: "public",
    cover: ml("team-after.webp"),
    feature: {
      facts: [
        { k: "Role", v: "Lead Product Designer" },
        { k: "Timeline", v: "Apr – Oct 2025" },
        { k: "Outcome", v: "120+ businesses on multi-location" },
      ],
      chapters: [
        { label: "Locations", img: ml("add-1.webp"), alt: "Add a location: location details step", caption: "New locations start from an existing one. Eight steps, most of them prefilled." },
        { label: "Services", img: ml("svclist-after.webp"), alt: "Services at a location", caption: "One service menu, offered per location." },
        { label: "Staff", img: ml("team-after.webp"), alt: "Staff list scoped to all locations", caption: "Same list, now scoped to any location, showing where each person works." },
        { label: "Settings", img: ml("set-1.webp"), alt: "Settings home with the location switcher open", caption: "One settings home, scoped to every location or just one." },
        { label: "Calendar", img: ml("cal-4.webp"), alt: "Appointment booked at the Soho location", caption: "Switch location mid-booking and preview that calendar live." },
      ],
    },
  },
];

export const findProject = (slug: string) => projects.find((p) => p.slug === slug);

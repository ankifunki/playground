// Everything the homepage says lives here. Edit this file to change copy or add work.

export type Access = "public" | "password";

export type Project = {
  slug: string; // served at /work/<slug>/
  title: string;
  line: string; // one sentence on what it is or what changed
  company: string;
  year: string;
  role: string;
  access: Access;
  cover?: string; // shown beside the cursor on hover
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
export const about = {
  paragraphs: [
    "I’m a designer, a listener and a curious being.¹",
    "Most recently I led design for Multi Location at GlossGenius, the software that runs salons, barbershops and spas. It took every core workflow from one location to many, and 120+ businesses now run more than one location on it.",
  ],
  notes: [
    { mark: "¹", text: "How I described myself on my first portfolio, in 2017. Still true." },
    { mark: "lock", text: "Locked work. I can’t share it publicly, but I’m happy to walk you through it. Ask for a password." },
  ],
};

export const projects: Project[] = [
  {
    slug: "multi-location",
    title: "Multi Location",
    line: "Taking salon software from one location to many, across every core workflow.",
    company: "GlossGenius",
    year: "2025",
    role: "Lead Product Designer",
    access: "public",
    cover: "/work/multi-location/img/team-after.webp",
  },
];

export const findProject = (slug: string) => projects.find((p) => p.slug === slug);

// Everything the homepage says lives here. Edit this file to change copy or add work.

export type Access = "public" | "password";

// The picture on a project's tile: an artistic crop of a real screen, or a logo on its brand color.
export type Art =
  | {
      kind: "crop";
      src: string;
      bg: string; // tile color
      bgDark?: string;
      w: string; // image width relative to the tile, e.g. "150%"
      x: string; // image left offset
      y: string; // image top offset
    }
  | { kind: "logo"; src: string; srcDark?: string; bg: string; bgDark?: string }
  | {
      kind: "phones"; // phone screens standing side by side, running off the bottom edge
      srcs: string[];
      bg: string;
      bgDark?: string;
    };

export type Project = {
  slug: string; // served at /work/<slug>/
  title: string;
  line: string; // one sentence on what it is or what changed
  company: string;
  year: string;
  access: Access;
  art: Art;
  wide?: boolean; // span both columns on desktop
  // Shown on the tile instead of the art while the project is password protected
  lockedMark?: { src: string; srcDark?: string };
  // Hide the company name behind a redaction bar (for confidential clients)
  redactCompany?: boolean;
};

export type LinkIcon = "linkedin" | "x" | "instagram";

export const profile = {
  name: "Ankit Joshi",
  title: "Product designer",
  email: "ankit@joshiankit.com",
  links: [
    { label: "LinkedIn", icon: "linkedin", href: "https://www.linkedin.com/in/joshiankit" },
    { label: "X", icon: "x", href: "https://x.com/ankifunki" },
    { label: "Instagram", icon: "instagram", href: "https://www.instagram.com/ankit" },
  ] as { label: string; icon: LinkIcon; href: string }[],
};

// DRAFT copy. Ankit to rewrite in his own words.
export const intro = {
  lead: "I’m Ankit, a designer, a listener and a curious being.",
  before: "Currently at",
  company: {
    name: "Genius AI",
    mark: "/brand/genius-g-black.svg",
    markDark: "/brand/genius-g-light.svg",
  },
  after: ".",
};

export const about = {
  paragraphs: [
    "I like the hard middle of product work: systems that touch every screen, where the job is to make something big feel obvious to the person using it at 9am on a busy Saturday.",
  ],
};

// Places Ankit has worked, newest first. Shown as a timeline (oldest on the left): each company's icon, with its
// name and blurb revealed on hover. Icons are drawn as masks so they all take the same neutral colour.
// DRAFT blurbs: Ankit to rewrite in his own words.
// start: the year Ankit joined. PLACEHOLDER years until he confirms them.
export type Employer = { name: string; src: string; start: number; blurb: string };
export const experience: Employer[] = [
  { name: "Genius AI", start: 2024, src: "/brand/genius-g-black.svg", blurb: "Where I am now: the platform beauty and wellness businesses run on, from booking to checkout." },
  { name: "Instacart", start: 2021, src: "/logos/instacart.svg", blurb: "Groceries from the stores you already love, delivered the same day." },
  { name: "Flexport", start: 2019, src: "/logos/flexport.svg", blurb: "Software and logistics that move global trade, one container at a time." },
  { name: "UserTesting", start: 2018, src: "/logos/usertesting.svg", blurb: "Watching real people use real products, and helping teams learn from it." },
  { name: "Stitch Fix", start: 2017, src: "/logos/stitchfix.svg", blurb: "Personal styling, picked by stylists and data, delivered to your door." },
  { name: "HackerRank", start: 2016, src: "/logos/hackerrank.svg", blurb: "Coding challenges and interviews that help companies hire developers." },
  { name: "Samsung", start: 2014, src: "/logos/samsung.svg", blurb: "Where a two-day hackathon turned into Smart Hotel, a room that knows you." },
  { name: "CloudOn", start: 2012, src: "/logos/cloudon.svg", blurb: "Microsoft Office streamed to the iPad before Microsoft shipped it. Later acquired by Dropbox." },
];

export const projects: Project[] = [
  {
    slug: "multi-location",
    title: "Multi Location",
    line: "A platform shift across every core workflow, from one location to many.",
    company: "Genius AI",
    year: "2025",
    access: "password",
    lockedMark: { src: "/brand/genius-g-black.svg", srcDark: "/brand/genius-g-light.svg" },
    art: {
      kind: "crop",
      src: "/work/multi-location/img/cal-4.webp",
      bg: "#dddcf6",
      bgDark: "#272644",
      w: "190%",
      x: "8%",
      y: "11%",
    },
  },
  {
    slug: "multi-ticket",
    title: "Multi Ticket",
    line: "One checkout for every appointment at the counter.",
    company: "Genius AI",
    year: "2026",
    access: "password",
    lockedMark: { src: "/brand/genius-g-black.svg", srcDark: "/brand/genius-g-light.svg" },
    art: {
      kind: "phones",
      srcs: ["/work/multi-ticket/img/m-1.webp", "/work/multi-ticket/img/sc-6.webp"],
      bg: "#f5dfe2",
      bgDark: "#3a2329",
    },
  },
];

export const findProject = (slug: string) => projects.find((p) => p.slug === slug);

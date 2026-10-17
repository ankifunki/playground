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

// Places Ankit has worked, newest first. Each is the company's official mark (no wordmark), shown in one neutral
// colour. h is the mark's height in px, tuned by eye so solid tiles and open outlines read at an even size.
export const experience: { name: string; src: string; ratio: number; h: number }[] = [
  { name: "Genius AI", src: "/brand/genius-g-black.svg", ratio: 45.35 / 64, h: 30 },
  { name: "Instacart", src: "/logos/instacart.svg", ratio: 0.7982, h: 28 },
  { name: "Flexport", src: "/logos/flexport.svg", ratio: 1, h: 25 },
  { name: "UserTesting", src: "/logos/usertesting.svg", ratio: 0.7792, h: 28 },
  { name: "Stitch Fix", src: "/logos/stitchfix.svg", ratio: 1.0942, h: 22 },
  { name: "HackerRank", src: "/logos/hackerrank.svg", ratio: 1, h: 24 },
  { name: "Samsung", src: "/logos/samsung.svg", ratio: 0.9989, h: 25 },
  { name: "CloudOn", src: "/logos/cloudon.svg", ratio: 71.42 / 49.75, h: 22 },
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

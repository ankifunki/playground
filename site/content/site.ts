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
  // Lives elsewhere (e.g. a Figma deck): the tile opens this in a new tab instead of /work/<slug>/
  href?: string;
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
    { label: "LinkedIn", icon: "linkedin", href: "https://www.linkedin.com/in/joshiankit", handle: "in/joshiankit" },
    { label: "X", icon: "x", href: "https://x.com/ankifunki", handle: "@ankifunki" },
    { label: "Instagram", icon: "instagram", href: "https://www.instagram.com/ankit", handle: "@ankit" },
  ] as { label: string; icon: LinkIcon; href: string; handle: string }[],
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

// Places Ankit has worked, newest first (from his LinkedIn). Shown as a ruler, oldest on the left: start years
// above, and each company's icon, name, dates and blurb revealed as the pointer passes over its stretch.
// start/end are "YYYY-MM"; no end means it's current. Icons are masks so they all take the same neutral colour.
// DRAFT blurbs, adapted from LinkedIn: Ankit to rewrite in his own words.
export type Employer = { name: string; src: string; start: string; end?: string; blurb: string };
export const experience: Employer[] = [
  { name: "Genius AI", src: "/brand/genius-g-black.svg", start: "2023-10", blurb: "Empowering small businesses: the platform beauty and wellness pros run on, from booking to checkout." },
  { name: "Instacart", src: "/logos/instacart.svg", start: "2021-02", end: "2023-09", blurb: "Groceries from the stores people already love, delivered the same day." },
  { name: "Flexport", src: "/logos/flexport.svg", start: "2019-10", end: "2021-01", blurb: "Software and logistics that move global trade, one container at a time." },
  { name: "UserTesting", src: "/logos/usertesting.svg", start: "2018-06", end: "2019-09", blurb: "Surfacing customer insights right inside the tools teams already use." },
  { name: "Stitch Fix", src: "/logos/stitchfix.svg", start: "2017-10", end: "2018-04", blurb: "Evolving the customer-facing experience across every digital property, with richer features." },
  { name: "HackerRank", src: "/logos/hackerrank.svg", start: "2016-04", end: "2017-09", blurb: "A platform for engineers to learn, grow and get hired." },
  { name: "Samsung", src: "/logos/samsung.svg", start: "2014-04", end: "2016-03", blurb: "Led design for a VR product, after a few Android apps. Also: Smart Hotel, a two-day hackathon idea." },
  { name: "CloudOn", src: "/logos/cloudon.svg", start: "2012-10", end: "2014-04", blurb: "Led design for a cross-platform productivity product: Office, streamed to the iPad. Later acquired by Dropbox." },
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
    title: "Flexible Checkout",
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
  {
    slug: "order-issue-reporting",
    title: "Order Issue Reporting",
    line: "Making it simple and specific to report what went wrong with an order.",
    company: "Instacart",
    year: "2021–23",
    access: "password",
    // Instacart's carrot in one tone while locked, like the Genius AI tiles
    lockedMark: { src: "/brand/instacart-carrot-black.svg", srcDark: "/brand/instacart-carrot-light.svg" },
    art: {
      kind: "phones",
      srcs: ["/art/order-issue/report-an-issue.webp"],
      bg: "#f3ecdf",
      bgDark: "#22281f",
    },
  },
];

export const findProject = (slug: string) => projects.find((p) => p.slug === slug);

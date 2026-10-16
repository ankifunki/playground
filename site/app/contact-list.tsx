import type { ReactNode } from "react";
import { profile, type LinkIcon } from "@/content/site";

// Line icons drawn on one 24px grid with the same stroke, so the brand marks sit evenly with the envelope.
const ICONS: Record<LinkIcon | "mail", ReactNode> = {
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="m4 7.5 8 6 8-6" />
    </>
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M8 10.5v6M12 16.5v-6M12 13.2c0-1.7 1.1-2.8 2.6-2.8s2.4 1 2.4 2.8v3.3" />
      <circle cx="8" cy="7.6" r="0.6" fill="currentColor" />
    </>
  ),
  dribbble: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.7c3.6 3.3 8.3 4.4 14.9 3.9M3.2 13.3c5.4-2.3 11.4-1.8 16.7 1.9M8.7 3.6c3.7 4.4 6.2 10.6 6.6 16.8" />
    </>
  ),
  x: <path d="M4.5 4h4.2l10.8 16h-4.2zM19.3 4l-6.4 7.2M4.7 20l6.4-7.2" />,
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
    </>
  ),
};

const Icon = ({ name }: { name: LinkIcon | "mail" }) => (
  <svg className="cl-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

const Arrow = () => (
  <svg className="cl-arrow" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M5 13 13 5M6 5h7v7" />
  </svg>
);

// Email and social links as one even list. The Copy button is wired up by public/delight.js (data-copy).
export function ContactList() {
  return (
    <ul className="contact-list">
      <li>
        <a className="cl-row" href={`mailto:${profile.email}`}>
          <Icon name="mail" />
          <span className="cl-label">Email</span>
          <span className="cl-handle" id="email-address">{profile.email}</span>
        </a>
        <span className="cl-trail">
          <button type="button" className="copy" data-copy={profile.email} data-copy-target="email-address">
            Copy
          </button>
        </span>
      </li>
      {profile.links.map((l) => (
        <li key={l.label}>
          <a className="cl-row" href={l.href} target="_blank" rel="noopener noreferrer">
            <Icon name={l.icon} />
            <span className="cl-label">{l.label}</span>
            <span className="cl-handle">{l.handle}</span>
          </a>
          <span className="cl-trail" aria-hidden="true">
            <Arrow />
          </span>
        </li>
      ))}
    </ul>
  );
}

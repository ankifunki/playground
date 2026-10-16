// Sun ↔ moon button. Behaviour lives in public/delight.js ([data-theme-toggle]).
// Both glyphs are drawn; CSS rotates and springs between them based on the active theme.
export function ThemeToggle() {
  return (
    <button type="button" className="theme-toggle" data-theme-toggle aria-label="Switch theme">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <g className="tt-sun">
          <circle cx="12" cy="12" r="4.2" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <path d="M12 2.6v2.2M12 19.2v2.2M21.4 12h-2.2M4.8 12H2.6M18.65 5.35l-1.55 1.55M6.9 17.1l-1.55 1.55M18.65 18.65 17.1 17.1M6.9 6.9 5.35 5.35" />
          </g>
        </g>
        <g className="tt-moon">
          <path d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1Z" fill="currentColor" />
          <circle className="tt-star" cx="17.6" cy="5.4" r="1" fill="currentColor" />
          <circle className="tt-star" cx="20.4" cy="9" r="0.7" fill="currentColor" />
        </g>
      </svg>
    </button>
  );
}

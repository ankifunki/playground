// The copy button is wired up by public/delight.js (data-copy), which also shows the toast.
export function CopyEmail({ email }: { email: string }) {
  return (
    <p className="email">
      <a id="email-link" href={`mailto:${email}`}>
        {email}
      </a>
      <button type="button" className="copy" data-copy={email} data-copy-target="email-link">
        Copy
      </button>
    </p>
  );
}

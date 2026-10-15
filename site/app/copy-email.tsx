"use client";

import { useState } from "react";

export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard refused: select the address so it can be copied by hand.
      const a = document.getElementById("email-link");
      if (a) getSelection()?.selectAllChildren(a);
    }
  };
  return (
    <p className="email">
      <a id="email-link" href={`mailto:${email}`}>
        {email}
      </a>
      <button type="button" className="copy" onClick={copy} aria-live="polite">
        {copied ? "Copied" : "Copy"}
      </button>
    </p>
  );
}

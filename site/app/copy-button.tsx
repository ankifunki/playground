"use client";

import { useEffect, useRef, useState } from "react";

// Copies text to the clipboard and says so for a moment
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button type="button" className={`cl-copy${copied ? " done" : ""}`} onClick={copy} aria-label={copied ? "Email copied" : "Copy email"}>
      <span className="cl-copy-a" aria-hidden="true">Copy</span>
      <span className="cl-copy-b" aria-hidden="true">Copied</span>
    </button>
  );
}

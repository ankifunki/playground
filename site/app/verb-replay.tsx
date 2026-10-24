"use client";

import { useEffect } from "react";

// How long each verb's motion runs when replayed (ms), and when the opening sequence is over
const RUN = [3050, 3200, 1100];
const INTRO_DONE = 5000;

// Hovering design, build or ship replays that word's motion. Clearing its animations for a frame and putting them
// back (with the .replay delays) restarts them; a word that's still moving, or the opening sequence, isn't cut short.
export function VerbReplay() {
  useEffect(() => {
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    const start = performance.now();
    const busy = new WeakSet<Element>();
    const verbs = [...document.querySelectorAll<HTMLElement>(".statement .verb")];
    const off = verbs.map((el, i) => {
      const play = () => {
        if (!fine.matches || still.matches || busy.has(el) || performance.now() - start < INTRO_DONE) return;
        busy.add(el);
        el.classList.add("reset");
        void el.offsetWidth;
        el.classList.add("replay");
        el.classList.remove("reset");
        setTimeout(() => busy.delete(el), RUN[i]);
      };
      el.addEventListener("pointerenter", play);
      return () => el.removeEventListener("pointerenter", play);
    });
    return () => off.forEach((f) => f());
  }, []);
  return null;
}

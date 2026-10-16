// Small interactions for the homepage. Plain JS driven by data attributes, so it works the same
// in the Next.js site and in static previews.
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Cursor label: elements with data-cursor="…" show a pill that trails the pointer.
  if (finePointer) {
    var pill = document.createElement("div");
    pill.className = "cursor-pill";
    pill.setAttribute("aria-hidden", "true");
    document.body.appendChild(pill);
    var tx = 0, ty = 0, x = 0, y = 0;
    (function loop() {
      var k = reduce ? 1 : 0.22;
      x += (tx - x) * k;
      y += (ty - y) * k;
      pill.style.translate = x + "px " + y + "px";
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll("[data-cursor]").forEach(function (el) {
      el.addEventListener("pointerenter", function (e) {
        pill.textContent = el.getAttribute("data-cursor");
        x = tx = e.clientX;
        y = ty = e.clientY;
        pill.classList.add("on");
      });
      el.addEventListener("pointermove", function (e) {
        tx = e.clientX;
        ty = e.clientY;
      });
      el.addEventListener("pointerleave", function () {
        pill.classList.remove("on");
      });
    });
  }

  // Copy buttons: data-copy="text". Confirms with a toast shaped like the product's own.
  var toastEl;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.innerHTML =
        '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="8" cy="8" r="6.5"/><path d="m5.2 8.2 1.9 1.9 3.8-4"/></svg><span></span>';
      document.body.appendChild(toastEl);
    }
    toastEl.querySelector("span").textContent = msg;
    toastEl.classList.remove("on");
    void toastEl.offsetWidth; // restart the entrance
    toastEl.classList.add("on");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () {
      toastEl.classList.remove("on");
    }, 2400);
  }
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () { toast("Copied " + text); };
      var fail = function () {
        var target = document.getElementById(btn.getAttribute("data-copy-target") || "");
        if (target) getSelection().selectAllChildren(target);
        toast("Selected. Press ⌘C to copy");
      };
      try {
        navigator.clipboard.writeText(text).then(done, fail);
      } catch (e) {
        fail();
      }
    });
  });

  // Top bar gains a hairline once the page scrolls.
  var bar = document.querySelector(".topbar");
  if (bar) {
    var onScroll = function () { bar.classList.toggle("scrolled", scrollY > 8); };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Theme toggle. Uses View Transitions where available; switches instantly otherwise,
  // or when the visitor prefers reduced motion.
  var root = document.documentElement;
  var dark = matchMedia("(prefers-color-scheme: dark)");
  var current = function () { return root.dataset.theme || (dark.matches ? "dark" : "light"); };
  var toggles = document.querySelectorAll("[data-theme-toggle]");
  var label = function () {
    var next = current() === "dark" ? "light" : "dark";
    toggles.forEach(function (b) { b.setAttribute("aria-label", "Switch to " + next + " mode"); });
  };
  var apply = function (t) {
    root.dataset.theme = t;
    try { localStorage.setItem("theme", t); } catch (e) {}
    label();
  };
  // The switch plays like a day passing: a sun (or moon) rises at the left, arcs across the top
  // and sets at the right, and the new theme follows it in a soft-edged sweep.
  var SWEEP_MS = 1600;
  var SWEEP_EASE = "cubic-bezier(0.45, 0.05, 0.35, 1)";
  var clamp01 = function (v) { return Math.max(0, Math.min(1, v)); };
  toggles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      if (reduce || !document.startViewTransition) return apply(next);
      var orb;
      root.classList.add("sweeping");
      var vt = document.startViewTransition(function () {
        apply(next);
        orb = document.createElement("div");
        orb.className = "sky-orb " + (next === "dark" ? "moon" : "sun");
        orb.setAttribute("aria-hidden", "true");
        document.body.appendChild(orb);
      });
      vt.ready.then(function () {
        var W = innerWidth, H = innerHeight, R = 32;
        // The new theme is revealed through a wide, feathered mask that slides left to right.
        root.animate(
          { maskPosition: ["100% 0", "0% 0"], webkitMaskPosition: ["100% 0", "0% 0"] },
          { duration: SWEEP_MS, easing: SWEEP_EASE, fill: "both", pseudoElement: "::view-transition-new(root)" }
        );
        // The orb rides just ahead of the soft edge, on an arc that peaks mid-screen.
        var frames = [];
        for (var i = 0; i <= 32; i++) {
          var t = i / 32;
          var x = (-0.5 + 2 * t) * W + 0.05 * W; // the edge's centre, plus a small lead
          var u = clamp01(x / W);
          var y = H * (0.4 - 0.3 * (1 - Math.pow(2 * u - 1, 2)));
          var fade = clamp01((t - 0.14) / 0.12) * clamp01((0.86 - t) / 0.12);
          frames.push({ offset: t, opacity: fade, transform: "translate(" + (x - R) + "px, " + (y - R) + "px)" });
        }
        root.animate(frames, { duration: SWEEP_MS, easing: SWEEP_EASE, fill: "both", pseudoElement: "::view-transition-group(sky-orb)" });
      });
      vt.finished.finally(function () {
        root.classList.remove("sweeping");
        if (orb) orb.remove();
      });
    });
  });
  // With no saved choice, keep following the device if it changes.
  dark.addEventListener("change", label);
  label();

  // For the people who open the console.
  console.log(
    "%cHi, curious one.%c\nYou opened the console on a designer’s site, so we’ll probably get along.\nSay hello: ankit@joshiankit.com",
    "font: 600 15px system-ui; color: #6663f4",
    "font: 13px system-ui; color: inherit"
  );
})();

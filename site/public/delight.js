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

  // Theme toggle: a soft crossfade between themes (View Transitions), or an instant switch
  // where that isn't supported or motion is reduced.
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
  toggles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      if (reduce || !document.startViewTransition) return apply(next);
      document.startViewTransition(function () { apply(next); });
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

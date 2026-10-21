// Keeps the page on its 24px dotted grid: each top-level block and each work tile is padded at the bottom to a whole
// number of grid rows, so whatever comes next starts on a row of dots. Re-runs when fonts load or anything resizes.
(function () {
  // Inner blocks first (tiles), then the page's sections that contain them
  var G = 24, PASSES = [".tiles > li", ".page > *"], raf = 0;
  function snap() {
    raf = 0;
    PASSES.forEach(function (sel) { document.querySelectorAll(sel).forEach(function (el) { el.style.paddingBottom = ""; }); });
    PASSES.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        var h = el.getBoundingClientRect().height, pad = (G - (h % G)) % G;
        if (pad > 0.5 && pad < G - 0.5) el.style.paddingBottom = pad.toFixed(2) + "px";
      });
    });
  }
  function later() { if (!raf) raf = requestAnimationFrame(snap); }
  later();
  if (document.fonts) document.fonts.ready.then(later);
  addEventListener("resize", later);
  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(later);
    document.querySelectorAll(".tiles, .page").forEach(function (el) { ro.observe(el); });
  }
})();

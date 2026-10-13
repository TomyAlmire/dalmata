/**
 * Quita #premiumLoader sin depender de ES modules (sirve con file:// y si app.js falla).
 * Solo index incluye este archivo.
 */
(function () {
  var dismissed = false;

  function dismissLoader() {
    var root = document.getElementById("premiumLoader");
    if (!root || dismissed) return;
    dismissed = true;
    root.style.pointerEvents = "none";
    root.style.transition = "opacity 0.4s ease";
    root.style.opacity = "0";
    window.setTimeout(function () {
      if (root.parentNode) root.remove();
      document.documentElement.style.overflow = "";
    }, 420);
  }

  function runLoaderAnimation() {
    var root = document.getElementById("premiumLoader");
    if (!root) return;

    var progress = root.querySelector(".loader-progress");
    var logo = root.querySelector(".loader-logo");
    var prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    if (logo) {
      logo.style.transition = "opacity 0.45s ease";
      requestAnimationFrame(function () {
        logo.style.opacity = "1";
      });
    }

    var width = 0;
    function step() {
      width += 6 + Math.random() * 18;
      if (width >= 100) {
        if (progress) progress.style.width = "100%";
        window.setTimeout(function () {
          root.style.pointerEvents = "none";
          root.style.transition = "opacity 0.42s ease";
          root.style.opacity = "0";
          window.setTimeout(function () {
            if (root.parentNode) root.remove();
            document.documentElement.style.overflow = prev;
            dismissed = true;
          }, 440);
        }, 160);
        return;
      }
      if (progress) progress.style.width = width + "%";
      window.setTimeout(step, 45 + Math.random() * 85);
    }
    step();
  }

  function boot() {
    if (!document.getElementById("premiumLoader")) return;
    runLoaderAnimation();
    window.setTimeout(function () {
      var still = document.getElementById("premiumLoader");
      if (still) dismissLoader();
    }, 5500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

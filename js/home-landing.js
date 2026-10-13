/**
 * Animaciones de scroll en la home (GSAP + ScrollTrigger).
 * Sin GSAP o con prefers-reduced-motion: no se oculta contenido.
 */
(function () {
  function boot() {
    if (document.body.dataset.page !== "inicio") return;

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

    if (reduced || !hasGsap) return;

    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    if (!ScrollTrigger) return;

    try {
      gsap.registerPlugin(ScrollTrigger);

      var reveals = gsap.utils.toArray(".land-reveal");
      if (reveals.length) {
        gsap.set(reveals, { opacity: 0, y: 44 });
        reveals.forEach(function (el) {
          gsap.fromTo(
            el,
            { opacity: 0, y: 44 },
            {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 90%",
                toggleActions: "play none none none",
              },
            }
          );
        });
      }

      var aurora = document.querySelector(".hero-aurora");
      if (aurora) {
        gsap.to(aurora, {
          yPercent: 10,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero.page-hero",
            start: "top top",
            end: "bottom top",
            scrub: 1.1,
          },
        });
      }

      requestAnimationFrame(function () {
        if (typeof ScrollTrigger.refresh === "function") ScrollTrigger.refresh();
      });
    } catch (e) {
      if (window.gsap) {
        window.gsap.set(".land-reveal", { opacity: 1, y: 0, clearProps: "all" });
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

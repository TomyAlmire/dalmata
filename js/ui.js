// ─────────────────────────────────────────────
//  ui.js — menú lateral y loader inicial
// ─────────────────────────────────────────────

/** Abre/cierra el panel lateral (#sideMenu). */
function initSideMenu() {
  const menu = document.getElementById("sideMenu");
  const openBtn = document.getElementById("openMenuButton");
  const closeBtn = document.getElementById("closeMenuButton");
  const backdrop = document.getElementById("menuBackdrop");

  if (menu && openBtn && !window.__dalmataSideMenuBound) {
    window.__dalmataSideMenuBound = true;
    window.__dalmataMenuBound = true;

    const open = () => {
      menu.classList.add("is-open");
      menu.setAttribute("aria-hidden", "false");
    };

    const close = () => {
      menu.classList.remove("is-open");
      menu.setAttribute("aria-hidden", "true");
    };

    openBtn.addEventListener("click", open);
    closeBtn?.addEventListener("click", close);
    backdrop?.addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("is-open")) close();
    });
  }

  // ── Carrito Lateral (Overlay) ──
  const cartOverlay = document.getElementById("cartOverlay");
  const cartBackdrop = document.getElementById("cartBackdrop");
  const cartTrigger = document.querySelector(".cta-top");
  const closeCartBtn = document.getElementById("closeCartOverlay");

  if (cartOverlay && cartTrigger && !window.__dalmataCartOverlayBound) {
    window.__dalmataCartOverlayBound = true;

    const openCart = (e) => {
      if (e) e.preventDefault();
      cartOverlay.classList.add("is-open");
      cartBackdrop?.classList.add("is-visible");
      document.body.style.overflow = "hidden"; // Evita scroll
    };

    const closeCart = () => {
      cartOverlay.classList.remove("is-open");
      cartBackdrop?.classList.remove("is-visible");
      document.body.style.overflow = "";
    };

    cartTrigger.addEventListener("click", openCart);
    closeCartBtn?.addEventListener("click", closeCart);
    cartBackdrop?.addEventListener("click", closeCart);

    // Cerrar con Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeCart();
    });

    // Escuchar evento global para abrir el carrito al agregar algo
    window.addEventListener("dalmata:open-cart", openCart);
  }
}

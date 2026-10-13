// ─────────────────────────────────────────────
//  home-catalog.js — preview del catálogo en la home
//  Script clásico (no módulo): funciona también abriendo el HTML con file://
//  getActiveCatalog, formatPrice y fixImagePath son globales cargados antes que este archivo.
// ─────────────────────────────────────────────
(function () {
  function renderHomePreview() {
    const grid = document.getElementById("homePreviewGrid");
    if (!grid) return;

    const items = getActiveCatalog().slice(0, 12);
    grid.innerHTML = items
      .map((p) => {
        const imgSrc = fixImagePath(p.image);
        return `
    <a class="home-preview-card" href="./pages/productos.html">
      <div class="home-preview-img">
        ${imgSrc ? `<img src="${imgSrc}" alt="" loading="lazy" width="400" height="400">` : `<span class="home-preview-ph">${p.name.slice(0, 2)}</span>`}
      </div>
      <div class="home-preview-meta">
        <h3>${p.name}</h3>
        <span>${formatPrice(p.price)}</span>
      </div>
      <span class="home-preview-cta">Ver en catálogo</span>
    </a>`;
      })
      .join("");
  }

  function boot() {
    renderHomePreview();
    window.addEventListener("dalmata:catalog", renderHomePreview);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

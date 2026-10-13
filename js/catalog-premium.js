// Script clásico (no módulo): funciona también abriendo el HTML con file://
// getActiveCatalog, formatPrice, normalizeSilhouette y fixImagePath son globales
// definidos en lib/catalog-access.js y js/utils.js, cargados antes que este archivo.

(function () {
  const grid = document.getElementById("premiumProductGrid");
  const searchInput = document.getElementById("catalogSearch");
  const filterPills = document.querySelectorAll(".filter-pill");

  const FILTER_GROUPS = {
    remera: {
      title: "Remeras",
      silhouettes: ["clasica", "crop-top", "crop-top-oversize"],
    },
    buzo: {
      title: "Buzos",
      silhouettes: ["buzo"],
    },
    "tote-bag": {
      title: "Tote Bags",
      silhouettes: ["tote-bag"],
    },
  };

  let currentFilter = "all";
  let currentSearch = "";

  /** Normaliza el parámetro de filtro de la URL o del botón */
  function normalizeFilterKey(key) {
    const raw = String(key || "").toLowerCase().trim();
    if (["remera", "remeras"].includes(raw)) return "remera";
    if (["buzo", "buzos"].includes(raw)) return "buzo";
    if (["tote-bag", "tote", "totebag", "totes"].includes(raw)) return "tote-bag";
    return raw;
  }

  function matchesGroup(item, groupKey) {
    const group = FILTER_GROUPS[normalizeFilterKey(groupKey)];
    if (!group) return false;
    return group.silhouettes.includes(normalizeSilhouette(item.silhouette));
  }

  function getSearchedItems() {
    const query = currentSearch.trim().toLowerCase();
    const catalog = getActiveCatalog();
    return catalog.filter((item) => {
      if (!query) return true;
      const name = String(item.name || "").toLowerCase();
      const desc = String(item.description || "").toLowerCase();
      return name.includes(query) || desc.includes(query);
    });
  }

  function renderCard(item) {
    const imgSrc = fixImagePath(item.image);
    const canView3D = typeof window.DalmataShirtViewer !== "undefined" && window.DalmataShirtViewer.isShirtLike(item);
    return `
      <article class="premium-card premium-reveal">
        <div class="premium-card-image">
          ${imgSrc ? `<img src="${imgSrc}" alt="${item.name}" loading="lazy" decoding="async">` : ""}
        </div>
        <div class="premium-card-info">
          <h3 class="premium-card-title">${item.name}</h3>
          <p class="premium-card-desc">${item.description}</p>
          <div class="premium-card-bottom">
            <span class="premium-card-price">${formatPrice(item.price)}</span>
            <div class="premium-tags">
              ${(item.sizes || []).slice(0, 2).map((s) => `<span class="premium-tag">${s}</span>`).join("")}
              ${(item.sizes || []).length > 2 ? `<span class="premium-tag">+${item.sizes.length - 2}</span>` : ""}
            </div>
          </div>
          <div class="premium-actions">
            ${canView3D ? `<button class="premium-btn view-3d" type="button" data-view3d="${item.id}">Ver en 3D</button>` : ""}
            <button class="premium-btn primary add-to-cart" type="button" data-id="${item.id}" style="${canView3D ? "" : "grid-column: 1 / -1;"}">Agregar al Carrito</button>
          </div>
        </div>
      </article>`;
  }

  function renderSection(groupKey, items) {
    const group = FILTER_GROUPS[groupKey];
    if (!group || !items.length) return "";

    return `
      <section class="premium-stock-section" data-section="${groupKey}">
        <h3 class="premium-stock-title">${group.title}</h3>
        <div class="premium-stock-grid">
          ${items.map((item) => renderCard(item)).join("")}
        </div>
      </section>`;
  }

  function bindAddToCartButtons() {
    grid.querySelectorAll("[data-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = getActiveCatalog().find((entry) => entry.id === button.dataset.id);
        if (!item || typeof window.addToCart !== "function") return;

        window.addToCart({
          productId: item.id,
          name: item.name,
          price: item.price,
          size: item.sizes?.[0] || "ÚNICO",
          colorLabel: item.colors?.[0]?.label || "Negro",
          colorValue: item.colors?.[0]?.value || "#000000",
          customized: false,
        });

        button.textContent = "¡Agregado!";
        window.setTimeout(() => {
          button.textContent = "Agregar";
        }, 1500);
      });
    });
  }

  function bindView3DButtons() {
    grid.querySelectorAll("[data-view3d]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = getActiveCatalog().find((entry) => entry.id === button.dataset.view3d);
        if (!item || typeof window.DalmataShirtViewer === "undefined") return;
        window.DalmataShirtViewer.open(item);
      });
    });
  }

  function animateCards() {
    if (typeof gsap === "undefined") return;

    const cards = grid.querySelectorAll(".premium-card");
    cards.forEach((card, index) => {
      gsap.from(card, {
        opacity: 0,
        y: 18,
        duration: 0.35,
        ease: "power2.out",
        delay: index * 0.03,
        clearProps: "opacity,transform",
      });
    });
  }

  function renderCatalog() {
    if (!grid) return;

    const searchedItems = getSearchedItems();
    const mainCategoriesGrid = document.getElementById("mainCategoriesGrid");

    // Si no hay productos, mostramos el mensaje de error pero no ocultamos las categorías principales si estamos en "all"
    if (!searchedItems.length) {
      if (currentFilter === "all" && !currentSearch) {
        if (mainCategoriesGrid) mainCategoriesGrid.style.display = "grid";
        grid.innerHTML = "";
      } else {
        grid.innerHTML = `<div class="premium-empty-state">No se encontraron productos.</div>`;
        if (mainCategoriesGrid) mainCategoriesGrid.style.display = "none";
      }
      return;
    }

    const orderedKeys = ["remera", "buzo", "tote-bag"];

    if (currentFilter === "all") {
      // Si estamos en la página de categorías y no hay filtro, mostramos el grid de categorías
      if (mainCategoriesGrid && !currentSearch) {
        mainCategoriesGrid.style.display = "grid";
        grid.innerHTML = "";
        return;
      }

      if (mainCategoriesGrid) mainCategoriesGrid.style.display = "none";

      const sectionsHTML = orderedKeys
        .map((groupKey) => {
          const items = searchedItems.filter((item) => matchesGroup(item, groupKey));
          return renderSection(groupKey, items);
        })
        .filter(Boolean)
        .join("");

      grid.innerHTML = sectionsHTML || `<div class="premium-empty-state">No se encontraron productos.</div>`;
    } else {
      if (mainCategoriesGrid) mainCategoriesGrid.style.display = "none";

      const filteredItems = searchedItems.filter((item) => matchesGroup(item, currentFilter));
      grid.innerHTML = filteredItems.length
        ? renderSection(currentFilter, filteredItems)
        : `<div class="premium-empty-state">No hay productos cargados en esta categoría: <strong>${currentFilter}</strong></div>`;
    }

    bindAddToCartButtons();
    bindView3DButtons();
    animateCards();
  }

  function setActiveFilter(filterValue) {
    const normalized = normalizeFilterKey(filterValue);
    currentFilter = normalized === "all" || FILTER_GROUPS[normalized] ? normalized : "all";
    
    if (filterPills) {
      filterPills.forEach((pill) => {
        pill.classList.toggle("is-active", normalizeFilterKey(pill.dataset.filter) === currentFilter);
      });
    }
    renderCatalog();
  }

  function boot() {
    if (!grid) return;

    window.addEventListener("dalmata:catalog", renderCatalog);

    if (searchInput) {
      searchInput.addEventListener("input", (event) => {
        currentSearch = event.target.value || "";
        renderCatalog();
      });
    }

    if (filterPills) {
      filterPills.forEach((pill) => {
        pill.addEventListener("click", () => {
          setActiveFilter(pill.dataset.filter);
        });
      });
    }

    // Interceptar clics en las cards grandes de categorías
    const mainCategoriesGrid = document.getElementById("mainCategoriesGrid");
    if (mainCategoriesGrid) {
      mainCategoriesGrid.querySelectorAll("a").forEach(card => {
        card.addEventListener("click", (e) => {
          const href = card.getAttribute("href");
          if (href && href.startsWith("?")) {
            const urlParams = new URLSearchParams(href);
            const filter = urlParams.get("filter");
            if (filter) {
              e.preventDefault();
              setActiveFilter(filter);
              // Actualizar URL sin recargar
              window.history.pushState({}, "", href);
            }
          }
        });
      });
    }

    const params = new URLSearchParams(window.location.search);
    const filterParam = params.get("filter");
    if (filterParam) {
      const normalized = normalizeFilterKey(filterParam);
      if (normalized === "all" || FILTER_GROUPS[normalized]) {
        setActiveFilter(normalized);
        return;
      }
    }

    renderCatalog();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

// ─────────────────────────────────────────────
//  app.js  ← punto de entrada principal
//  Script clásico (no módulo): funciona también abriendo el HTML con file://
// ─────────────────────────────────────────────

(async function () {
  const catalogItems = await getCatalogItems(STOCK_ITEMS);
  window.STOCK_ITEMS = catalogItems;
  window.addToCart = addToCart;
  window.formatPrice = formatPrice;
  window.dispatchEvent(new CustomEvent("dalmata:catalog", { detail: catalogItems }));
  window.dalmataAuth = { getSupabaseClient, getSession, signIn, signOut };

  initSideMenu();
  initCartHeader();
  renderCart();
})();

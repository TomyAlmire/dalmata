/** Catálogo activo: Supabase vía `window.STOCK_ITEMS` (app.js) o datos locales. */
function getActiveCatalog() {
  if (typeof window !== "undefined" && Array.isArray(window.STOCK_ITEMS) && window.STOCK_ITEMS.length) {
    return window.STOCK_ITEMS;
  }
  return STOCK_ITEMS;
}

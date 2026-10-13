// ─────────────────────────────────────────────
//  utils.js — helpers compartidos
// ─────────────────────────────────────────────

/**
 * @param {number} amount
 * @returns {string}
 */
function formatPrice(amount) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Reescribe rutas relativas de /assets cuando la página vive en /pages.
 * @param {string} path
 * @returns {string}
 */
function fixImagePath(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const isSubfolder = window.location.pathname.includes("/pages/");
  if (isSubfolder && path.startsWith("./assets")) {
    return ".." + path.slice(1);
  }
  return path;
}

/**
 * Normaliza distintos alias de silueta (DB, formularios, UI) a las claves
 * internas usadas por el catálogo: clasica, crop-top, crop-top-oversize, buzo, tote-bag.
 * @param {string} value
 * @returns {string}
 */
function normalizeSilhouette(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "clasica";
  if (["remera", "remeras", "clasica", "clásica", "classic"].includes(raw)) return "clasica";
  if (["crop", "crop-top", "croptop"].includes(raw)) return "crop-top";
  if (["crop-top-oversize", "crop oversize", "oversize", "crop-oversize"].includes(raw)) return "crop-top-oversize";
  if (["buzo", "buzos", "hoodie", "hoodies"].includes(raw)) return "buzo";
  if (["tote", "totebag", "tote-bag", "tote bags", "totebags"].includes(raw)) return "tote-bag";
  return raw;
}

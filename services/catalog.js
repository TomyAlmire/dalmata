/**
 * Catálogo remoto (Supabase REST) con fallback a datos estáticos.
 *
 * Variables globales (definir en config.local.js antes de app.js):
 *   window.DALMATA_SUPABASE_URL
 *   window.DALMATA_SUPABASE_ANON_KEY
 */

function supabaseHeaders() {
  const key = typeof window !== "undefined" ? window.DALMATA_SUPABASE_ANON_KEY : "";
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

function parseJsonField(val, fallback) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string" && val.trim()) {
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

// normalizeSilhouette() vive en js/utils.js (cargado antes que este archivo).

function normalizeRow(row) {
  const sizes = parseJsonField(row.sizes, []);
  const colors = parseJsonField(row.colors, []);
  return {
    id: String(row.id),
    name: row.name,
    silhouette: normalizeSilhouette(row.silhouette),
    price: Number(row.price) || 0,
    description: row.description || "",
    sizes: sizes.length ? sizes : ["ÚNICO"],
    colors: colors.length ? colors : [{ label: "Negro", value: "#000000" }],
    image: row.image || "",
  };
}

async function getCatalogItems(fallback) {
  const url = typeof window !== "undefined" ? window.DALMATA_SUPABASE_URL : "";
  const key = typeof window !== "undefined" ? window.DALMATA_SUPABASE_ANON_KEY : "";
  
  // Siempre empezamos con los productos estáticos (fallback)
  let items = [...(fallback || [])];

  if (!url || !key) return items;

  try {
    const endpoint = `${url.replace(/\/$/, "")}/rest/v1/products?active=eq.true&select=*`;
    const res = await fetch(endpoint, { headers: supabaseHeaders() });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length) {
        const supabaseItems = rows.map(normalizeRow);
        // Combinamos y eliminamos duplicados por ID (priorizando Supabase)
        const combined = [...supabaseItems];
        items.forEach(staticItem => {
          if (!combined.some(s => s.id === staticItem.id)) {
            combined.push(staticItem);
          }
        });
        return combined;
      }
    }
  } catch (error) {
    console.warn("Error al cargar productos de Supabase, usando solo estáticos:", error);
  }
  
  return items;
}

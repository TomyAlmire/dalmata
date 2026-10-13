/**
 * Pedidos vía Supabase REST (tabla `orders`).
 * Requiere las mismas variables globales que services/catalog.js.
 */

function ordersHeaders() {
  const key = typeof window !== "undefined" ? window.DALMATA_SUPABASE_ANON_KEY : "";
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
}

/**
 * @param {unknown[]} cart
 * @param {{ email?: string }} meta
 */
async function submitOrder(cart, meta = {}) {
  const base = typeof window !== "undefined" ? window.DALMATA_SUPABASE_URL : "";
  const key = typeof window !== "undefined" ? window.DALMATA_SUPABASE_ANON_KEY : "";
  if (!base || !key) return false;

  const url = `${base.replace(/\/$/, "")}/rest/v1/orders`;
  const body = {
    email: meta.email || null,
    status: "pending",
    payload: { items: cart, created_client: new Date().toISOString() },
  };

  const res = await fetch(url, { method: "POST", headers: ordersHeaders(), body: JSON.stringify(body) });
  if (!res.ok) {
    const t = await res.text();
    console.error("submitOrder", res.status, t);
    return false;
  }
  return true;
}

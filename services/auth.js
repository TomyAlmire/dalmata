/**
 * Cliente Supabase Auth (usuarios). Carga lazy desde esm.sh si hay URL y key.
 * Uso: const c = await getSupabaseClient(); await c.auth.signInWithPassword({ email, password });
 */

let _clientPromise = null;

async function getSupabaseClient() {
  const url = typeof window !== "undefined" ? window.DALMATA_SUPABASE_URL : "";
  const key = typeof window !== "undefined" ? window.DALMATA_SUPABASE_ANON_KEY : "";
  if (!url || !key) return null;

  if (!_clientPromise) {
    _clientPromise = import("https://esm.sh/@supabase/supabase-js@2.49.1").then(({ createClient }) =>
      createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
    );
  }
  return _clientPromise;
}

async function getSession() {
  const c = await getSupabaseClient();
  if (!c) return { data: { session: null } };
  return c.auth.getSession();
}

async function signIn(email, password) {
  const c = await getSupabaseClient();
  if (!c) throw new Error("Supabase no configurado");
  return c.auth.signInWithPassword({ email, password });
}

async function signOut() {
  const c = await getSupabaseClient();
  if (!c) return;
  return c.auth.signOut();
}

import { createClient } from "@supabase/supabase-js";
import { CHAVE_SUPABASE, URL_SUPABASE, supabaseLigado } from "@/lib/config";

/**
 * Cliente sem sessão, pra leitura do jardim.
 *
 * De propósito NÃO toca em cookie: o momento em que um Server Component lê
 * cookie, a rota vira dinâmica e perde o cache. O conteúdo público é o mesmo
 * pra todo mundo, então ele não precisa saber quem está lendo — e a RLS já
 * garante que a chave anônima só alcança o que está publicado.
 */
export function supabasePublico() {
  if (!supabaseLigado) return null;
  return createClient(URL_SUPABASE, CHAVE_SUPABASE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

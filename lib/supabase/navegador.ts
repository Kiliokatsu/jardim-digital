import { createBrowserClient } from "@supabase/ssr";
import { CHAVE_SUPABASE, URL_SUPABASE, supabaseLigado } from "@/lib/config";

/** Cliente de navegador. Usado só no formulário de login do painel. */
export function supabaseNavegador() {
  if (!supabaseLigado) return null;
  return createBrowserClient(URL_SUPABASE, CHAVE_SUPABASE);
}

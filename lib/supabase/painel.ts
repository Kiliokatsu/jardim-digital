import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { CHAVE_SUPABASE, URL_SUPABASE, supabaseLigado } from "@/lib/config";

/* Cliente do painel — o irmão COM sessão do publico.ts (DEC-0013).

   Separados de propósito: o público não pode tocar em cookie nem sessão
   (tocar vira rota dinâmica e mata o cache), e o painel não vive sem elas.
   persistSession + detectSessionInUrl são o que fazem o retorno do OAuth
   do GitHub virar sessão guardada no navegador.

   Singleton do módulo: o console monta e desmonta ao longo da navegação,
   e cada createClient abriria um novo auto-refresh de token. */
let unico: SupabaseClient | null = null;

export function supabasePainel(): SupabaseClient | null {
  if (!supabaseLigado) return null;
  unico ??= createClient(URL_SUPABASE, CHAVE_SUPABASE, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      /* PKCE em vez do implícito (achado da revisão): o token não viaja no
         fragmento da URL — volta um código de uso único trocado via POST, e
         a biblioteca limpa a URL com replaceState, sem deixar token no
         histórico do navegador. */
      flowType: "pkce",
    },
  });
  return unico;
}

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { CHAVE_SUPABASE, URL_SUPABASE, supabaseLigado } from "@/lib/config";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Devolve `null` quando o banco não está configurado — quem chama decide se
 * cai pros dados de demonstração ou se recusa a operação.
 */
export async function supabaseServidor() {
  if (!supabaseLigado) return null;

  const jar = await cookies();

  return createServerClient(URL_SUPABASE, CHAVE_SUPABASE, {
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(cookiesParaGravar) {
        try {
          for (const { name, value, options } of cookiesParaGravar) {
            jar.set(name, value, options);
          }
        } catch {
          /* Server Component não pode gravar cookie. O middleware já renovou a
             sessão antes de chegar aqui, então engolir é o comportamento certo. */
        }
      },
    },
  });
}

/** Sessão do dono, ou `null`. Não confia em cookie: pergunta ao servidor de auth. */
export async function donoLogado() {
  const sb = await supabaseServidor();
  if (!sb) return null;

  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

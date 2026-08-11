/* Uma única fonte de verdade sobre "o banco está ligado?".
   Enquanto não estiver, o site roda com dados de demonstração — dá pra ver o
   jardim e o painel de pé antes de criar projeto nenhum no Supabase. */

export const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const CHAVE_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseLigado = Boolean(URL_SUPABASE && CHAVE_SUPABASE);

/**
 * Sem banco, o painel não tem como autenticar ninguém. Em desenvolvimento isso
 * libera o painel pra você poder desenhar as telas; em produção, NÃO — painel
 * sem banco vira painel sem porta.
 */
export const modoDemonstracao = !supabaseLigado && process.env.NODE_ENV === "development";

/** E-mail do dono. Só ele entra no painel, mesmo que outra conta exista no projeto.
    Vem só do ambiente — sem fallback chumbado, porque este arquivo é público e
    e-mail real em código-fonte é dado pessoal vazado. Vazio = nenhum dono casa. */
export const EMAIL_DONO = process.env.EMAIL_DONO ?? "";

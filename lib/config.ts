/* Uma única fonte de verdade sobre "o banco está ligado?".
   Enquanto não estiver, o site roda com dados de demonstração — dá pra ver o
   jardim inteiro de pé antes de criar projeto nenhum no Supabase. */

export const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const CHAVE_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseLigado = Boolean(URL_SUPABASE && CHAVE_SUPABASE);

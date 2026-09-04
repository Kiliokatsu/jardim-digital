import { supabasePublico } from "@/lib/supabase/publico";
import {
  certificadosDemo, etiquetasDemo, experienciasDemo, formacaoDemo,
  habilidadesDemo, perfilDemo, perfilLinksDemo, postsDemo, projetosDemo,
} from "@/lib/dados-demo";
import type {
  Certificado, Etiqueta, Experiencia, Formacao, Habilidade,
  Perfil, PerfilLink, Portal, Post, Projeto, Telemetria,
} from "@/lib/tipos";

/* Leitura do jardim. Cada função tem o mesmo contrato: tenta o banco e, se ele
   não estiver configurado (ou a consulta falhar), devolve os dados de
   demonstração em vez de estourar. Um erro de rede não deveria derrubar a
   página inicial — deveria degradar. Erro é logado antes de degradar, porque
   "não achou" e "consulta falhou" não são a mesma coisa. */

/* O select traz o corpo TAMBÉM nas listagens, de propósito: o cartão calcula
   "N min de leitura" a partir do corpo (o v3 não tem coluna de minutos —
   número gravado à mão envelhece). Na escala deste site (dezenas de posts no
   máximo) o custo é irrelevante, e o corpo nunca chega ao cliente: quem chama
   é Server Component. As etiquetas vêm embutidas pelo join que o PostgREST
   monta sozinho através de posts_etiquetas (DEC-018). */
const SELECT_POST = "*, etiquetas(*)";

/** Publicados do espelho em memória, mais recente primeiro. */
function publicadosDemo(portal?: Portal): Post[] {
  const ordenados = [...postsDemo].sort((a, b) =>
    (b.publicado_em ?? "").localeCompare(a.publicado_em ?? ""),
  );
  return portal ? ordenados.filter((p) => p.portal === portal) : ordenados;
}

export async function listarPosts(portal?: Portal): Promise<Post[]> {
  const sb = supabasePublico();
  if (!sb) return publicadosDemo(portal);

  // A RLS já garante que a chave anônima só alcança post com publicado_em
  // não-nulo e <= now() — o filtro de rascunho não precisa se repetir aqui.
  let consulta = sb
    .from("posts")
    .select(SELECT_POST)
    .order("publicado_em", { ascending: false });
  if (portal) consulta = consulta.eq("portal", portal);

  const { data, error } = await consulta;
  if (error || !data) {
    if (error) console.error("listarPosts falhou:", error.message);
    return publicadosDemo(portal);
  }
  return data as unknown as Post[];
}

export async function buscarPost(slug: string): Promise<Post | null> {
  const sb = supabasePublico();
  if (!sb) return publicadosDemo().find((p) => p.slug === slug) ?? null;

  const { data, error } = await sb
    .from("posts")
    .select(SELECT_POST)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("buscarPost falhou:", error.message);
    return publicadosDemo().find((p) => p.slug === slug) ?? null;
  }
  return (data as unknown as Post | null) ?? null;
}

/* ─────────────────────────── projetos ───────────────────────────
   DEC-0022: os "sistemas entregues". A home pede só os com destaque;
   a Profissional pede todos os visíveis. A RLS já filtra `visivel`
   pro anônimo — o filtro não se repete aqui. */

export async function listarProjetos(somenteDestaque = false): Promise<Projeto[]> {
  const demo = () =>
    [...projetosDemo]
      .filter((p) => p.visivel && (!somenteDestaque || p.destaque))
      .sort((a, b) => a.ordem - b.ordem);

  const sb = supabasePublico();
  if (!sb) return demo();

  let consulta = sb.from("projetos").select("*").order("ordem");
  if (somenteDestaque) consulta = consulta.eq("destaque", true);

  const { data, error } = await consulta;
  if (error || !data) {
    if (error) console.error("listarProjetos falhou:", error.message);
    return demo();
  }
  return data as Projeto[];
}

/* ─────────────────────────── etiquetas ─────────────────────────── */

export async function listarEtiquetas(): Promise<Etiqueta[]> {
  const sb = supabasePublico();
  if (!sb) return [...etiquetasDemo].sort((a, b) => a.nome.localeCompare(b.nome));

  const { data, error } = await sb.from("etiquetas").select("*").order("nome");
  if (error || !data) {
    if (error) console.error("listarEtiquetas falhou:", error.message);
    return [...etiquetasDemo].sort((a, b) => a.nome.localeCompare(b.nome));
  }
  return data as Etiqueta[];
}

export async function buscarEtiqueta(slug: string): Promise<Etiqueta | null> {
  const sb = supabasePublico();
  if (!sb) return etiquetasDemo.find((e) => e.slug === slug) ?? null;

  const { data, error } = await sb.from("etiquetas").select("*").eq("slug", slug).maybeSingle();
  if (error) {
    console.error("buscarEtiqueta falhou:", error.message);
    return etiquetasDemo.find((e) => e.slug === slug) ?? null;
  }
  return (data as Etiqueta | null) ?? null;
}

/** Posts publicados que carregam a etiqueta. O filtro é em JS de propósito:
    listarPosts já traz as etiquetas embutidas, e na escala do site um filtro
    em memória custa menos que manter um segundo caminho de consulta. */
export async function listarPostsPorEtiqueta(slug: string): Promise<Post[]> {
  const posts = await listarPosts();
  return posts.filter((p) => (p.etiquetas ?? []).some((e) => e.slug === slug));
}

/* ─────────────────────────── vizinhança ─────────────────────────── */

/** Anterior/próximo por publicado_em, dentro do mesmo portal. */
export async function vizinhosDoPost(
  post: Post,
): Promise<{ anterior: Post | null; proximo: Post | null }> {
  const doPortal = await listarPosts(post.portal); // já vem desc por publicado_em
  const indice = doPortal.findIndex((p) => p.id === post.id || p.slug === post.slug);
  if (indice === -1) return { anterior: null, proximo: null };
  return {
    anterior: doPortal[indice + 1] ?? null, // publicado antes
    proximo: doPortal[indice - 1] ?? null, // publicado depois
  };
}

const LIMITE_RELACIONADOS = 3;

/** Posts com etiqueta em comum, sem o próprio. Sai quase de graça da DEC-018. */
export async function relacionados(
  post: Post,
  limite: number = LIMITE_RELACIONADOS,
): Promise<Post[]> {
  const minhas = new Set((post.etiquetas ?? []).map((e) => e.slug));
  if (minhas.size === 0) return [];

  const todos = await listarPosts();
  return todos
    .filter((p) => p.id !== post.id && p.slug !== post.slug)
    .filter((p) => (p.etiquetas ?? []).some((e) => minhas.has(e.slug)))
    .slice(0, limite);
}

/* ─────────────────────────── currículo ─────────────────────────── */

export async function buscarPerfil(): Promise<Perfil> {
  const sb = supabasePublico();
  if (!sb) return perfilDemo;

  // select("*") inclui foto_url — a página mostra a foto ou "sem foto".
  const { data, error } = await sb.from("perfil").select("*").eq("id", 1).maybeSingle();
  if (error) console.error("buscarPerfil falhou:", error.message);
  return (data as Perfil | null) ?? perfilDemo;
}

export async function listarPerfilLinks(): Promise<PerfilLink[]> {
  const sb = supabasePublico();
  if (!sb) return [...perfilLinksDemo].sort((a, b) => a.ordem - b.ordem);

  const { data, error } = await sb.from("perfil_links").select("*").order("ordem");
  if (error || !data) {
    if (error) console.error("listarPerfilLinks falhou:", error.message);
    return [...perfilLinksDemo].sort((a, b) => a.ordem - b.ordem);
  }
  return data as PerfilLink[];
}

export async function listarExperiencias(): Promise<Experiencia[]> {
  const sb = supabasePublico();
  if (!sb) return [...experienciasDemo].sort((a, b) => a.ordem - b.ordem);

  const { data, error } = await sb.from("experiencias").select("*").order("ordem");
  if (error || !data) {
    if (error) console.error("listarExperiencias falhou:", error.message);
    return [...experienciasDemo].sort((a, b) => a.ordem - b.ordem);
  }
  return data as Experiencia[];
}

export async function listarFormacao(): Promise<Formacao[]> {
  const sb = supabasePublico();
  if (!sb) return [...formacaoDemo].sort((a, b) => a.ordem - b.ordem);

  const { data, error } = await sb.from("formacao").select("*").order("ordem");
  if (error || !data) {
    if (error) console.error("listarFormacao falhou:", error.message);
    return [...formacaoDemo].sort((a, b) => a.ordem - b.ordem);
  }
  return data as Formacao[];
}

export async function listarHabilidades(): Promise<Habilidade[]> {
  const sb = supabasePublico();
  if (!sb) return [...habilidadesDemo].sort((a, b) => a.ordem - b.ordem);

  const { data, error } = await sb.from("habilidades").select("*").order("ordem");
  if (error || !data) {
    if (error) console.error("listarHabilidades falhou:", error.message);
    return [...habilidadesDemo].sort((a, b) => a.ordem - b.ordem);
  }
  return data as Habilidade[];
}

/** Só os publico = true chegam pro anônimo — quem corta é a RLS, não o site. */
export async function listarCertificados(): Promise<Certificado[]> {
  const sb = supabasePublico();
  if (!sb) return certificadosDemo;

  const { data, error } = await sb.from("certificados").select("*").order("ordem");
  if (error || !data) {
    if (error) console.error("listarCertificados falhou:", error.message);
    return certificadosDemo;
  }
  return data as Certificado[];
}

/* ─────────────────────── telemetria pública ───────────────────────
   Os números que o Modo Engenheiro mostra. Nada aqui é sigiloso: é a mesma
   contagem que o visitante conseguiria fazer olhando as páginas. Agregação
   em JS de propósito — na escala do site, contar em memória é mais barato
   que manter consultas de agregação. */

export async function telemetria(): Promise<Telemetria> {
  const [posts, etiquetas] = await Promise.all([listarPosts(), listarEtiquetas()]);

  const porPortal: Record<Portal, number> = { profissional: 0, tecnologia: 0, pessoal: 0 };
  for (const post of posts) porPortal[post.portal] += 1;

  return {
    posts: posts.length,
    etiquetas: etiquetas.length,
    porPortal,
    ultimoPlantio: posts[0]?.publicado_em ?? null,
    build: new Date().toISOString(),
  };
}

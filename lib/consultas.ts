import { supabasePublico } from "@/lib/supabase/publico";
import {
  conexoesDemo, experienciasDemo, formacoesDemo, habilidadesDemo,
  incidentesDemo, perfilDemo, postsDemo, provasDemo,
} from "@/lib/dados-demo";
import type {
  Conexao, Experiencia, Formacao, Habilidade, Incidente,
  Maturidade, Perfil, Portal, Post, Prova,
} from "@/lib/tipos";

/* Leitura do jardim. Cada função tem o mesmo contrato: tenta o banco e, se ele
   não estiver configurado (ou a consulta falhar), devolve os dados de
   demonstração em vez de estourar. Um erro de rede não deveria derrubar a
   página inicial — deveria degradar. */

function publicados(): Post[] {
  return postsDemo
    .filter((p) => p.estado === "publicado")
    .sort((a, b) => (b.publicado_em ?? "").localeCompare(a.publicado_em ?? ""));
}

export async function listarPosts(portal?: Portal): Promise<Post[]> {
  const sb = supabasePublico();
  if (!sb) return portal ? publicados().filter((p) => p.portal === portal) : publicados();

  let q = sb
    .from("posts")
    .select("*")
    .eq("estado", "publicado")
    .order("publicado_em", { ascending: false });
  if (portal) q = q.eq("portal", portal);

  const { data, error } = await q;
  if (error || !data) return portal ? publicados().filter((p) => p.portal === portal) : publicados();
  return data as Post[];
}

/** Agrupa por maturidade. É o eixo de leitura da home: canteiro, não feed. */
export async function jardimPorMaturidade(): Promise<Record<Maturidade, Post[]>> {
  const posts = await listarPosts();
  return {
    semente: posts.filter((p) => p.maturidade === "semente"),
    muda: posts.filter((p) => p.maturidade === "muda"),
    perene: posts.filter((p) => p.maturidade === "perene"),
  };
}

export async function buscarPost(slug: string): Promise<Post | null> {
  const sb = supabasePublico();
  if (!sb) return publicados().find((p) => p.slug === slug) ?? null;

  const { data, error } = await sb
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("estado", "publicado")
    .maybeSingle();
  if (error) return publicados().find((p) => p.slug === slug) ?? null;
  return (data as Post | null) ?? null;
}

export async function buscarIncidente(postId: string): Promise<Incidente | null> {
  const sb = supabasePublico();
  if (!sb) return incidentesDemo.find((i) => i.post_id === postId) ?? null;

  const { data, error } = await sb.from("incidentes").select("*").eq("post_id", postId).maybeSingle();
  // logar antes de degradar: "não achou" e "consulta falhou" não são a mesma coisa
  if (error) console.error("buscarIncidente falhou:", error.message);
  return (data as Incidente | null) ?? null;
}

export async function listarConexoes(): Promise<Conexao[]> {
  const sb = supabasePublico();
  if (!sb) return conexoesDemo;

  const { data, error } = await sb.from("conexoes").select("de, para");
  if (error || !data) return conexoesDemo;
  return data as Conexao[];
}

/** Vizinhos de um post no grafo, em qualquer direção. Alimenta o "conectado a". */
export async function vizinhos(postId: string): Promise<Post[]> {
  const [conexoes, posts] = await Promise.all([listarConexoes(), listarPosts()]);
  const ids = new Set<string>();
  for (const c of conexoes) {
    if (c.de === postId) ids.add(c.para);
    if (c.para === postId) ids.add(c.de);
  }
  return posts.filter((p) => ids.has(p.id));
}

/* ─────────────────────────── currículo ─────────────────────────── */

export async function buscarPerfil(): Promise<Perfil> {
  const sb = supabasePublico();
  if (!sb) return perfilDemo;

  const { data, error } = await sb.from("perfil").select("*").eq("id", 1).maybeSingle();
  if (error) console.error("buscarPerfil falhou:", error.message);
  return (data as Perfil | null) ?? perfilDemo;
}

export async function listarHabilidades(): Promise<Habilidade[]> {
  const sb = supabasePublico();
  if (!sb) return [...habilidadesDemo].sort((a, b) => a.ordem - b.ordem);

  const { data, error } = await sb.from("habilidades").select("*").order("ordem");
  if (error || !data) return [...habilidadesDemo].sort((a, b) => a.ordem - b.ordem);
  return data as Habilidade[];
}

export async function listarProvas(): Promise<Prova[]> {
  const sb = supabasePublico();
  if (!sb) return provasDemo;

  const { data, error } = await sb.from("provas").select("habilidade_id, post_id");
  if (error || !data) return provasDemo;
  return data as Prova[];
}

export async function listarExperiencias(): Promise<Experiencia[]> {
  const sb = supabasePublico();
  if (!sb) return [...experienciasDemo].sort((a, b) => a.ordem - b.ordem);

  const { data, error } = await sb.from("experiencias").select("*").order("ordem");
  if (error || !data) return [...experienciasDemo].sort((a, b) => a.ordem - b.ordem);
  return data as Experiencia[];
}

export async function listarFormacoes(): Promise<Formacao[]> {
  const sb = supabasePublico();
  if (!sb) return [...formacoesDemo].sort((a, b) => a.ordem - b.ordem);

  const { data, error } = await sb.from("formacoes").select("*").order("ordem");
  if (error || !data) return [...formacoesDemo].sort((a, b) => a.ordem - b.ordem);
  return data as Formacao[];
}

/* ─────────────────────── telemetria pública ───────────────────────
   Os números que o Modo Engenheiro mostra. Nada aqui é sigiloso: é a mesma
   contagem que o visitante conseguiria fazer olhando as páginas. */

export type Telemetria = {
  posts: number;
  conexoes: number;
  perenes: number;
  portais: number;
  /** Publicação mais recente, pra "último plantio". */
  ultimoPlantio: string | null;
  /** Instante do build, pra mostrar de quando é esta página. */
  build: string;
};

export async function telemetria(): Promise<Telemetria> {
  const [posts, conexoes] = await Promise.all([listarPosts(), listarConexoes()]);
  return {
    posts: posts.length,
    conexoes: conexoes.length,
    perenes: posts.filter((p) => p.maturidade === "perene").length,
    portais: new Set(posts.map((p) => p.portal)).size,
    ultimoPlantio: posts[0]?.publicado_em ?? null,
    build: new Date().toISOString(),
  };
}

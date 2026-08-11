import { supabaseServidor } from "@/lib/supabase/servidor";
import { execucoesDemo, integracoesDemo, postsDemo } from "@/lib/dados-demo";
import type { Estado, Execucao, Integracao, Post } from "@/lib/tipos";

/* Leitura do painel. Roda com a sessão do dono, então a RLS libera rascunho,
   fila, integração e log. Sem banco configurado, cai nos dados de demonstração
   — o painel precisa ser desenhável antes de existir projeto no Supabase. */

const porAtualizacao = (a: Post, b: Post) => b.atualizado_em.localeCompare(a.atualizado_em);

export async function listarTodosPosts(): Promise<Post[]> {
  const sb = await supabaseServidor();
  if (!sb) return [...postsDemo].sort(porAtualizacao);

  const { data, error } = await sb.from("posts").select("*").order("atualizado_em", { ascending: false });
  if (error || !data) return [...postsDemo].sort(porAtualizacao);
  return data as Post[];
}

/**
 * A fila. Ordem de urgência, não de data: o que está esperando decisão sua vem
 * primeiro, e rascunho de agente vem antes de rascunho seu — porque o seu não
 * está esperando ninguém.
 */
export async function fila(): Promise<Post[]> {
  const posts = await listarTodosPosts();
  const peso: Record<Estado, number> = {
    em_revisao: 0, aprovado: 1, rascunho: 2, rejeitado: 3, publicado: 4,
  };
  return posts
    .filter((p) => p.estado !== "publicado")
    .sort((a, b) => {
      const d = peso[a.estado] - peso[b.estado];
      if (d !== 0) return d;
      if (a.autoria !== b.autoria) return a.autoria === "agente" ? -1 : 1;
      return porAtualizacao(a, b);
    });
}

export async function buscarPostPorId(id: string): Promise<Post | null> {
  const sb = await supabaseServidor();
  if (!sb) return postsDemo.find((p) => p.id === id) ?? null;

  const { data, error } = await sb.from("posts").select("*").eq("id", id).maybeSingle();
  if (error) console.error("buscarPostPorId falhou:", error.message);
  return (data as Post | null) ?? null;
}

export async function listarIntegracoes(): Promise<Integracao[]> {
  const sb = await supabaseServidor();
  if (!sb) return integracoesDemo;

  const { data, error } = await sb.from("integracoes").select("*").order("nome");
  if (error || !data) return integracoesDemo;
  return data as Integracao[];
}

export async function buscarIntegracao(id: string): Promise<Integracao | null> {
  const sb = await supabaseServidor();
  if (!sb) return integracoesDemo.find((i) => i.id === id) ?? null;

  const { data, error } = await sb.from("integracoes").select("*").eq("id", id).maybeSingle();
  if (error) console.error("buscarIntegracao falhou:", error.message);
  return (data as Integracao | null) ?? null;
}

export async function listarExecucoes(integracaoId?: string, limite = 30): Promise<Execucao[]> {
  const sb = await supabaseServidor();
  if (!sb) {
    return execucoesDemo
      .filter((e) => !integracaoId || e.integracao_id === integracaoId)
      .sort((a, b) => b.criado_em.localeCompare(a.criado_em))
      .slice(0, limite);
  }

  let q = sb.from("execucoes").select("*").order("criado_em", { ascending: false }).limit(limite);
  if (integracaoId) q = q.eq("integracao_id", integracaoId);

  const { data, error } = await q;
  if (error || !data) return [];
  return data as Execucao[];
}

/* ───────────────────── resumo do console ───────────────────── */

export type Resumo = {
  publicados: number;
  emRevisao: number;
  /** Aprovados e ainda não publicados — é só apertar o botão. */
  prontos: number;
  rascunhos: number;
  rejeitados: number;
  /** Quantos rascunhos de agente estão parados esperando você. */
  deAgente: number;
  integracoesAtivas: number;
  integracoesTotal: number;
  comErro: number;
  comAlerta: number;
  /** Verde só quando nada precisa de atenção. É o farol do topo do painel. */
  saude: "ok" | "alerta" | "erro";
};

export async function resumo(): Promise<Resumo> {
  const [posts, integracoes] = await Promise.all([listarTodosPosts(), listarIntegracoes()]);
  const ativas = integracoes.filter((i) => i.ativa);
  const comErro = ativas.filter((i) => i.ultimo_estado === "erro").length;
  const comAlerta = ativas.filter((i) => i.ultimo_estado === "alerta").length;

  return {
    publicados: posts.filter((p) => p.estado === "publicado").length,
    emRevisao: posts.filter((p) => p.estado === "em_revisao").length,
    prontos: posts.filter((p) => p.estado === "aprovado").length,
    rascunhos: posts.filter((p) => p.estado === "rascunho").length,
    rejeitados: posts.filter((p) => p.estado === "rejeitado").length,
    deAgente: posts.filter((p) => p.autoria === "agente" && p.estado !== "publicado").length,
    integracoesAtivas: ativas.length,
    integracoesTotal: integracoes.length,
    comErro,
    comAlerta,
    saude: comErro > 0 ? "erro" : comAlerta > 0 ? "alerta" : "ok",
  };
}

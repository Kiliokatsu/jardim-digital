"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/servidor";
import { modoDemonstracao } from "@/lib/config";
import { minutosDeLeitura, paraSlug } from "@/lib/formato";
import type { Estado } from "@/lib/tipos";

/* Tudo que escreve passa por aqui. Server Action e não rota de API porque
   assim o formulário funciona antes do JavaScript carregar, e porque a chave
   nunca sai do servidor.

   Nenhuma destas funções confere se você é o dono, e isso é de propósito: a
   RLS do Postgres já recusa a escrita de quem não é. Checar de novo aqui daria
   a impressão de que a segurança mora na aplicação — ela mora no banco. */

export type Resultado = { erro?: string; ok?: string };

const AVISO_DEMO = "Modo demonstração: sem banco configurado, nada é gravado.";

function revalidaPainel() {
  revalidatePath("/painel");
  revalidatePath("/painel/fila");
  revalidatePath("/painel/escrever");
}

/* ─────────────────────────── sessão ─────────────────────────── */

export async function entrar(_anterior: Resultado, form: FormData): Promise<Resultado> {
  const email = String(form.get("email") ?? "").trim();
  const senha = String(form.get("senha") ?? "");
  const de = String(form.get("de") ?? "/painel");

  if (!email || !senha) return { erro: "Preencha e-mail e senha." };

  const sb = await supabaseServidor();
  if (!sb) return { erro: "Banco não configurado — não há como autenticar." };

  const { error } = await sb.auth.signInWithPassword({ email, password: senha });
  if (error) {
    /* Mensagem genérica de propósito: dizer "esse e-mail não existe" conta a um
       estranho quais contas existem. */
    return { erro: "E-mail ou senha incorretos." };
  }

  redirect(de.startsWith("/painel") ? de : "/painel");
}

export async function sair(): Promise<void> {
  const sb = await supabaseServidor();
  if (sb) await sb.auth.signOut();
  redirect("/painel/login");
}

/* ─────────────────────── fila de aprovação ───────────────────────
   A ordem dos estados é lei no banco (trigger fn_interlock_publicacao). Aqui só
   traduzimos o botão em transição — se alguém tentar pular etapa, o Postgres
   recusa e a mensagem dele sobe pra tela. */

const TRANSICOES: Record<Estado, Estado[]> = {
  rascunho: ["em_revisao"],
  em_revisao: ["aprovado", "rejeitado", "rascunho"],
  aprovado: ["publicado", "em_revisao", "rejeitado"],
  rejeitado: ["rascunho"],
  publicado: ["aprovado"], // despublicar volta pra aprovado, não pra rascunho
};

export async function mudarEstado(_anterior: Resultado, form: FormData): Promise<Resultado> {
  const id = String(form.get("id") ?? "");
  const destino = String(form.get("destino") ?? "") as Estado;
  const nota = String(form.get("nota") ?? "").trim();

  if (!id || !destino) return { erro: "Faltou o post ou o destino." };
  // FormData é fronteira externa: valida contra a união real antes de usar como Estado
  if (!(destino in TRANSICOES)) return { erro: `"${destino}" não é um estado que existe.` };
  if (modoDemonstracao) return { erro: AVISO_DEMO };

  const sb = await supabaseServidor();
  if (!sb) return { erro: "Banco não configurado." };

  const { data: atual, error: erroLeitura } = await sb
    .from("posts").select("estado, titulo").eq("id", id).maybeSingle();
  if (erroLeitura || !atual) return { erro: "Post não encontrado." };

  // `?? []`: estado vindo do banco fora do mapa (enum novo, dado legado) não pode
  // derrubar a action com TypeError — vira transição negada, com mensagem
  const permitidas = TRANSICOES[atual.estado as Estado] ?? [];
  if (!permitidas.includes(destino)) {
    return {
      erro: `De "${atual.estado}" não dá pra ir direto pra "${destino}". Caminhos: ${permitidas.join(", ")}.`,
    };
  }

  const patch: Record<string, unknown> = { estado: destino };
  // despublicar: limpa a data, senão o post reaparece no jardim ao ser republicado
  if (atual.estado === "publicado" && destino !== "publicado") patch.publicado_em = null;

  const { error } = await sb.from("posts").update(patch).eq("id", id);
  if (error) return { erro: error.message };

  let avisoNota = "";
  if (nota) {
    const { error: erroNota } = await sb
      .from("moderacao").insert({ post_id: id, acao: acaoDe(destino), nota });
    if (erroNota) {
      // a transição já aconteceu; sucesso silencioso aqui esconderia trilha perdida
      console.error("moderacao.insert falhou:", erroNota.message);
      avisoNota = " (mas a nota não foi gravada na trilha)";
    }
  }

  revalidaPainel();
  revalidatePath("/", "layout"); // o jardim mudou de conteúdo
  return { ok: `"${atual.titulo}" agora está em ${destino}.${avisoNota}` };
}

function acaoDe(destino: Estado): string {
  switch (destino) {
    case "em_revisao": return "enviou_revisao";
    case "aprovado": return "aprovou";
    case "rejeitado": return "rejeitou";
    case "publicado": return "publicou";
    default: return "despublicou";
  }
}

/* ─────────────────────────── escrita ─────────────────────────── */

export async function criarPost(_anterior: Resultado, form: FormData): Promise<Resultado> {
  const titulo = String(form.get("titulo") ?? "").trim();
  if (!titulo) return { erro: "Um post precisa de título pra existir." };
  if (modoDemonstracao) return { erro: AVISO_DEMO };

  const sb = await supabaseServidor();
  if (!sb) return { erro: "Banco não configurado." };

  const { data, error } = await sb
    .from("posts")
    .insert({
      titulo,
      slug: paraSlug(titulo),
      portal: String(form.get("portal") ?? "tecnologia"),
      genero: String(form.get("genero") ?? "registro"),
      maturidade: "semente",
      estado: "rascunho",
      autoria: "humano",
      corpo_md: "",
      minutos_leitura: 1,
    })
    .select("id")
    .single();

  if (error) return { erro: error.message };

  revalidaPainel();
  redirect(`/painel/escrever/${data.id}`);
}

export async function salvarPost(_anterior: Resultado, form: FormData): Promise<Resultado> {
  const id = String(form.get("id") ?? "");
  const titulo = String(form.get("titulo") ?? "").trim();
  const corpo = String(form.get("corpo_md") ?? "");

  if (!id) return { erro: "Faltou o id do post." };
  if (!titulo) return { erro: "Um post precisa de título." };
  if (modoDemonstracao) return { erro: AVISO_DEMO };

  const sb = await supabaseServidor();
  if (!sb) return { erro: "Banco não configurado." };

  const tags = String(form.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const aviso = String(form.get("aviso_indicacao") ?? "").trim();
  const slugPedido = String(form.get("slug") ?? "").trim();

  const { error } = await sb
    .from("posts")
    .update({
      titulo,
      slug: slugPedido ? paraSlug(slugPedido) : paraSlug(titulo),
      resumo: String(form.get("resumo") ?? "").trim() || null,
      corpo_md: corpo,
      portal: String(form.get("portal") ?? "tecnologia"),
      genero: String(form.get("genero") ?? "registro"),
      maturidade: String(form.get("maturidade") ?? "semente"),
      tags,
      aviso_indicacao: aviso || null,
      // recalculado do texto, não digitado: número que se escreve à mão envelhece
      minutos_leitura: minutosDeLeitura(corpo),
    })
    .eq("id", id);

  if (error) return { erro: error.message };

  revalidaPainel();
  revalidatePath(`/painel/escrever/${id}`);
  revalidatePath("/", "layout");
  return { ok: "Salvo." };
}

/* ─────────────────────────── automações ─────────────────────────── */

export async function alternarIntegracao(_anterior: Resultado, form: FormData): Promise<Resultado> {
  const id = String(form.get("id") ?? "");
  const ativar = String(form.get("ativar") ?? "") === "1";
  if (!id) return { erro: "Faltou a integração." };
  if (modoDemonstracao) return { erro: AVISO_DEMO };

  const sb = await supabaseServidor();
  if (!sb) return { erro: "Banco não configurado." };

  const { error } = await sb.from("integracoes").update({ ativa: ativar }).eq("id", id);
  if (error) return { erro: error.message };

  revalidatePath("/painel/integracoes");
  revalidatePath("/painel");
  return { ok: ativar ? "Integração ligada." : "Integração desligada." };
}

/**
 * Dispara a automação manualmente e registra o resultado.
 *
 * O painel não executa a automação — ele chama quem executa e anota o que
 * aconteceu. Se o n8n travar, trava lá; aqui vira uma linha de log com estado
 * `erro` e o site continua de pé.
 */
export async function dispararIntegracao(_anterior: Resultado, form: FormData): Promise<Resultado> {
  const id = String(form.get("id") ?? "");
  if (!id) return { erro: "Faltou a integração." };
  if (modoDemonstracao) return { erro: AVISO_DEMO };

  const sb = await supabaseServidor();
  if (!sb) return { erro: "Banco não configurado." };

  const { data: integracao, error: erroBusca } = await sb
    .from("integracoes").select("*").eq("id", id).maybeSingle();
  if (erroBusca) return { erro: `Falha ao consultar a integração: ${erroBusca.message}` };
  if (!integracao) return { erro: "Integração não encontrada." };
  if (!integracao.ativa) return { erro: "Integração desligada — ligue antes de disparar." };
  if (!integracao.url) return { erro: "Esta integração não tem URL: ela se reporta sozinha." };

  const inicio = Date.now();
  let estado: "ok" | "erro" | "alerta" = "ok";
  let mensagem = "";

  try {
    /* O segredo é lido do ambiente pelo nome guardado em ref_segredo. O banco
       nunca viu o valor, então um dump do banco não vaza credencial. */
    const segredo = integracao.ref_segredo ? process.env[integracao.ref_segredo] : undefined;
    if (integracao.ref_segredo && !segredo) {
      return {
        erro: `A variável de ambiente ${integracao.ref_segredo} não está definida neste ambiente.`,
      };
    }

    const resposta = await fetch(integracao.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(segredo ? { authorization: `Bearer ${segredo}` } : {}),
      },
      body: JSON.stringify({ origem: "painel", integracao: integracao.nome }),
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });

    mensagem = `HTTP ${resposta.status} ${resposta.statusText}`.trim();
    if (!resposta.ok) estado = resposta.status >= 500 ? "erro" : "alerta";
  } catch (e) {
    estado = "erro";
    mensagem = e instanceof Error ? e.message : "Falha desconhecida ao chamar a automação";
  }

  // o trigger no banco espelha isto de volta na integração
  const { error: erroLog } = await sb.from("execucoes").insert({
    integracao_id: id,
    estado,
    mensagem,
    duracao_ms: Date.now() - inicio,
    origem: "painel",
  });
  if (erroLog) {
    // o disparo já aconteceu; o que falhou foi o registro dele
    console.error("execucoes.insert falhou:", erroLog.message);
    mensagem += " (execução não registrada no log)";
  }

  revalidatePath("/painel/integracoes");
  revalidatePath(`/painel/integracoes/${id}`);
  revalidatePath("/painel");

  return estado === "ok" ? { ok: `Disparado: ${mensagem}` } : { erro: `${estado}: ${mensagem}` };
}

export async function salvarIntegracao(_anterior: Resultado, form: FormData): Promise<Resultado> {
  const id = String(form.get("id") ?? "");
  if (!id) return { erro: "Faltou a integração." };
  if (modoDemonstracao) return { erro: AVISO_DEMO };

  const ref = String(form.get("ref_segredo") ?? "").trim().toUpperCase();
  if (ref && !/^[A-Z][A-Z0-9_]{2,63}$/.test(ref)) {
    return {
      erro: "A referência do segredo tem que ser um nome de variável de ambiente (MAIÚSCULO_COM_SUBLINHADO) — nunca o valor do token.",
    };
  }

  /* https obrigatório: esta URL recebe um fetch do servidor com o token no
     header. http:// mandaria o token em claro; um esquema arbitrário abriria
     a porta pra apontar a automação pra onde não devia. */
  const url = String(form.get("url") ?? "").trim();
  if (url && !url.startsWith("https://")) {
    return { erro: "A URL da automação precisa começar com https:// — o token viaja nela." };
  }

  let config: Record<string, unknown> = {};
  const cru = String(form.get("config") ?? "").trim();
  if (cru) {
    try {
      config = JSON.parse(cru);
    } catch {
      return { erro: "A configuração precisa ser JSON válido." };
    }
  }

  const sb = await supabaseServidor();
  if (!sb) return { erro: "Banco não configurado." };

  const { error } = await sb
    .from("integracoes")
    .update({
      descricao: String(form.get("descricao") ?? "").trim() || null,
      url: url || null,
      ref_segredo: ref || null,
      config,
    })
    .eq("id", id);

  if (error) return { erro: error.message };

  revalidatePath("/painel/integracoes");
  revalidatePath(`/painel/integracoes/${id}`);
  return { ok: "Integração atualizada." };
}

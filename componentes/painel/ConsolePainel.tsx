"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabaseLigado } from "@/lib/config";
import { supabasePainel } from "@/lib/supabase/painel";
import { EditorPost, type PostEditavel } from "@/componentes/painel/EditorPost";
import { Pautas } from "@/componentes/painel/Pautas";
import type { Portal } from "@/lib/tipos";
import { dataHora } from "@/lib/formato";

/* O console da fase 2 (DEC-0013 + DEC-0014): autenticação, fila de
   rascunhos, posts no ar, e o editor que opera o interruptor publicado_em.

   A tela tem quatro estados e NENHUM deles é segurança — são informação.
   Quem autoriza é a RLS: um não-admin que burlar todos os estados daqui
   recebe recusa do banco em qualquer escrita (DEC-020, testado). */

type PostResumo = {
  id: string;
  slug: string;
  titulo: string;
  portal: Portal;
  atualizado_em: string;
  publicado_em: string | null;
};

type Estado =
  | "sem-banco" // rodando em modo demonstração: painel não tem o que administrar
  | "carregando" // sessão ainda não conferida
  | "deslogado"
  | "nao-alistado" // autenticou no GitHub, mas não está em `admins`
  | "alistado";

export function ConsolePainel() {
  // "sem banco" não é descoberta de efeito: é fato conhecido antes do render
  const [estado, setEstado] = useState<Estado>(() =>
    supabaseLigado ? "carregando" : "sem-banco",
  );
  const [sessao, setSessao] = useState<Session | null>(null);
  const [posts, setPosts] = useState<PostResumo[]>([]);
  const [editando, setEditando] = useState<PostEditavel | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  /* Sessão: uma leitura inicial + inscrição nas mudanças (login, logout,
     refresh de token). O supabase-js captura sozinho o retorno do OAuth
     na URL — este efeito só reage ao resultado. */
  useEffect(() => {
    const sb = supabasePainel();
    if (!sb) return; // estado já nasceu "sem-banco" no useState

    let vivo = true;
    sb.auth
      .getSession()
      .then(({ data }) => {
        if (!vivo) return;
        setSessao(data.session);
        if (!data.session) setEstado("deslogado");
      })
      .catch((e: unknown) => {
        /* sem isto, uma rejeição (storage inacessível, lock travado) deixaria
           a tela presa em "conferindo a sessão…" para sempre (DEC-0018) */
        if (!vivo) return;
        setErro(
          `não consegui conferir a sessão: ${e instanceof Error ? e.message : String(e)}`,
        );
        setEstado("deslogado");
      });

    const { data: inscricao } = sb.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao);
      if (!novaSessao) setEstado("deslogado");
    });
    return () => {
      vivo = false;
      inscricao.subscription.unsubscribe();
    };
  }, []);

  /* Uma consulta, duas listas (DEC-0014): o admin lê tudo pela POLICY
     própria e o console separa em memória — um caminho de código só. */
  const carregarPosts = useCallback(async () => {
    const sb = supabasePainel();
    if (!sb) return;
    const { data, error } = await sb
      .from("posts")
      .select("id, slug, titulo, portal, atualizado_em, publicado_em")
      .order("atualizado_em", { ascending: false })
      .returns<PostResumo[]>();
    if (error) {
      setErro(`a lista não carregou: ${error.message}`);
      return;
    }
    setPosts(data ?? []);
  }, []);

  /* Alistamento: a MESMA função que as POLICYs usam decide o que a tela
     mostra — uma verdade só. Autenticado ≠ autorizado (DEC-020).
     A dependência é o id do usuário, não o objeto da sessão: o refresh de
     token (a cada ~1h) cria um objeto novo com o MESMO usuário, e não é
     motivo pra reconferir alistamento nem recarregar a fila. */
  const usuarioId = sessao?.user.id ?? null;
  useEffect(() => {
    if (!usuarioId) return;
    const sb = supabasePainel();
    if (!sb) return;

    let cancelado = false;
    (async () => {
      setErro(null); // erro antigo não pode sobreviver a uma conferência nova
      const { data: souAdmin, error } = await sb.rpc("is_admin");
      if (cancelado) return;
      if (error) {
        setErro(`não consegui conferir o alistamento: ${error.message}`);
        setEstado("nao-alistado");
        return;
      }
      if (!souAdmin) {
        setEstado("nao-alistado");
        return;
      }
      await carregarPosts();
      if (!cancelado) setEstado("alistado");
    })();
    return () => {
      cancelado = true;
    };
  }, [usuarioId, carregarPosts]);

  const entrar = useCallback(() => {
    const sb = supabasePainel();
    if (!sb) return;
    void sb.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/painel` },
    });
  }, []);

  const sair = useCallback(() => {
    // escopo local de propósito: sair deste navegador não derruba as
    // sessões dos outros aparelhos do admin (o padrão da lib é global)
    void supabasePainel()?.auth.signOut({ scope: "local" });
  }, []);

  /* As três âncoras contra corrida e perda de edição (achados da revisão):
     - ultimoPedido: um clique mais novo invalida a resposta do mais velho;
     - editandoId: qual post o operador REALMENTE está olhando agora;
     - sujo: o editor avisa quando há mudança não salva. Refs, não estado —
       são leitura de dentro de closures assíncronas, não coisa de render. */
  const ultimoPedido = useRef(0);
  const editandoId = useRef<string | null>(null);
  const sujo = useRef(false);
  const aoSujar = useCallback((v: boolean) => {
    sujo.current = v;
  }, []);

  /* Abrir busca o post inteiro na hora do clique — o corpo (pesado) não
     viaja na listagem, e o editor sempre nasce do dado mais fresco. */
  const abrir = useCallback(async (id: string) => {
    if (
      editandoId.current !== null &&
      editandoId.current !== id &&
      sujo.current &&
      !window.confirm("Há edição não salva. Trocar de post e descartar?")
    ) {
      return;
    }
    const sb = supabasePainel();
    if (!sb) return;
    const pedido = ++ultimoPedido.current;
    editandoId.current = id;
    sujo.current = false;
    const { data, error } = await sb
      .from("posts")
      .select("id, slug, portal, titulo, resumo, corpo, tem_indicacao, publicado_em")
      .eq("id", id)
      .maybeSingle();
    if (pedido !== ultimoPedido.current) return; // um clique mais novo venceu
    if (error || !data) {
      setErro(`não consegui abrir o post: ${error?.message ?? "não encontrado"}`);
      return;
    }
    setEditando(data as PostEditavel);
  }, []);

  const fechar = useCallback(() => {
    if (sujo.current && !window.confirm("Há edição não salva. Fechar e descartar?")) return;
    editandoId.current = null;
    sujo.current = false;
    setEditando(null);
  }, []);

  /* Depois de qualquer escrita do editor: listas novas e, SE o post que
     escreveu ainda é o que está aberto, versão fresca dele (publicar muda
     os botões do rodapé). O id vem do editor — não de closure velha. */
  const aoMudar = useCallback(
    (id: string) => {
      void carregarPosts();
      if (editandoId.current === id) void abrir(id);
    },
    [carregarPosts, abrir],
  );

  const rascunhos = posts.filter((p) => p.publicado_em === null);
  const publicados = posts.filter((p) => p.publicado_em !== null);

  const linha = (p: PostResumo) => (
    <li key={p.id}>
      <button
        type="button"
        onClick={() => void abrir(p.id)}
        className="flex w-full flex-wrap items-baseline gap-x-4 gap-y-1 rounded-[var(--r)] border border-linha bg-superficie px-4 py-3 text-left transition-colors hover:border-acento/50"
      >
        <span className="font-mono text-[11px] uppercase text-suave">{p.portal}</span>
        <strong className="text-sm">{p.titulo}</strong>
        <span className="flex-1" />
        <span className="font-mono text-[11px] text-suave">
          {p.publicado_em ? `no ar desde ${dataHora(p.publicado_em)}` : `mexido em ${dataHora(p.atualizado_em)}`}
        </span>
      </button>
    </li>
  );

  return (
    <main className="mx-auto w-full max-w-[var(--maxw)] px-6 py-10">
      <header className="mb-8 flex items-center gap-4 border-b border-linha pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG da marca */}
        <img src="/marca/avatar/avatar.svg" alt="" aria-hidden className="h-7 w-7" />
        <h1 className="font-mono text-lg font-bold">
          painel<span className="text-acento">.</span>
        </h1>
        <span className="text-xs text-suave">console de supervisão — fase 2</span>
        <div className="flex-1" />
        {sessao && (
          <button type="button" className="btn" onClick={sair}>
            sair
          </button>
        )}
      </header>

      {erro && (
        <p className="mb-6 rounded-[var(--r)] border border-erro/40 px-4 py-3 text-sm text-erro">
          {erro}
        </p>
      )}

      {estado === "sem-banco" && (
        <p className="max-w-[60ch] text-sm text-suave">
          O site está em modo demonstração (sem banco configurado), então não há o
          que administrar aqui. Configure <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> para o painel acordar.
        </p>
      )}

      {estado === "carregando" && <p className="text-sm text-suave">conferindo a sessão…</p>}

      {/* a tela de entrada da espec v2 (§7.1): centrada, cerimoniosa. O
          MÉTODO de login (GitHub OAuth) fica até a Fase B decidir a troca
          por e-mail/senha — aqui só mudou a pele. */}
      {estado === "deslogado" && (
        <section className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-pedra">
            área restrita
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            A cozinha, por dentro.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-suave">
            Não há cadastro: autenticar é aberto, autorizar é uma lista de uma
            linha — e a lista mora no banco.
          </p>
          <button type="button" className="btn primario mt-7" onClick={entrar}>
            Entrar com GitHub
          </button>
        </section>
      )}

      {estado === "nao-alistado" && (
        <section className="max-w-[60ch]">
          <p className="text-sm">
            Você se autenticou — mas <strong>autenticado não é autorizado</strong>.
            Este login não está alistado como administrador, então o banco recusa
            qualquer escrita sua. Não é um erro: é o desenho (DEC-020).
          </p>
        </section>
      )}

      {estado === "alistado" && (
        <>
          <section>
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="font-semibold">Fila de rascunhos</h2>
              <span className="font-mono text-xs text-suave">
                {rascunhos.length === 0 ? "vazia" : `${rascunhos.length} aguardando`}
              </span>
            </div>
            {rascunhos.length === 0 ? (
              <p className="rounded-[var(--r)] border border-dashed border-linha px-4 py-6 text-sm text-suave">
                Nenhum rascunho aguardando. Quando o agente redator entregar — ou você
                criar um pelo Studio — ele aparece aqui.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">{rascunhos.map(linha)}</ul>
            )}
          </section>

          <section className="mt-10">
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="font-semibold">No ar</h2>
              <span className="font-mono text-xs text-suave">
                {publicados.length === 0 ? "nada ainda" : `${publicados.length} publicados`}
              </span>
            </div>
            {publicados.length > 0 && (
              <ul className="flex flex-col gap-2">{publicados.map(linha)}</ul>
            )}
          </section>

          {/* a entrada do pipeline (DEC-0016) fica por último: o dia a dia
              é aprovar o que chegou; pedir conteúdo novo é gesto ocasional */}
          <Pautas />

          {editando && (
            <EditorPost
              key={editando.id}
              post={editando}
              aoFechar={fechar}
              aoMudar={aoMudar}
              aoSujar={aoSujar}
            />
          )}
        </>
      )}
    </main>
  );
}

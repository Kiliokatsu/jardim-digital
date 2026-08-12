"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabaseLigado } from "@/lib/config";
import { supabasePainel } from "@/lib/supabase/painel";
import type { Portal } from "@/lib/tipos";
import { dataHora } from "@/lib/formato";

/* O console da fase 2 (DEC-0013), primeira entrega: autenticação + fila de
   rascunhos em leitura.

   A tela tem quatro estados e NENHUM deles é segurança — são informação.
   Quem autoriza é a RLS: um não-admin que burlar todos os estados daqui
   recebe recusa do banco em qualquer escrita (DEC-020, testado). */

type Rascunho = {
  id: string;
  slug: string;
  titulo: string;
  portal: Portal;
  atualizado_em: string;
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
  const [rascunhos, setRascunhos] = useState<Rascunho[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  /* Sessão: uma leitura inicial + inscrição nas mudanças (login, logout,
     refresh de token). O supabase-js captura sozinho o retorno do OAuth
     na URL — este efeito só reage ao resultado. */
  useEffect(() => {
    const sb = supabasePainel();
    if (!sb) return; // estado já nasceu "sem-banco" no useState

    let vivo = true;
    sb.auth.getSession().then(({ data }) => {
      if (!vivo) return;
      setSessao(data.session);
      if (!data.session) setEstado("deslogado");
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

      const { data, error: erroFila } = await sb
        .from("posts")
        .select("id, slug, titulo, portal, atualizado_em")
        .is("publicado_em", null)
        .order("atualizado_em", { ascending: false })
        .returns<Rascunho[]>();
      if (cancelado) return;
      if (erroFila) setErro(`a fila não carregou: ${erroFila.message}`);
      setRascunhos(data ?? []);
      setEstado("alistado");
    })();
    return () => {
      cancelado = true;
    };
  }, [usuarioId]);

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

  return (
    <main className="mx-auto w-full max-w-[var(--maxw)] px-6 py-10">
      <header className="mb-8 flex items-center gap-4 border-b border-linha pb-4">
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

      {estado === "deslogado" && (
        <section className="max-w-[60ch]">
          <p className="mb-4 text-sm text-suave">
            Área restrita. Não há cadastro: autenticar é aberto, autorizar é uma
            lista de uma linha — e a lista mora no banco.
          </p>
          <button type="button" className="btn primario" onClick={entrar}>
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
        <section>
          <div className="mb-4 flex items-baseline gap-3">
            <h2 className="font-semibold">Fila de rascunhos</h2>
            <span className="font-mono text-xs text-suave">
              {rascunhos.length === 0
                ? "vazia"
                : `${rascunhos.length} aguardando`}
            </span>
          </div>

          {rascunhos.length === 0 ? (
            <p className="rounded-[var(--r)] border border-dashed border-linha px-4 py-6 text-sm text-suave">
              Nenhum rascunho aguardando. Quando o agente redator entregar — ou você
              criar um pelo Studio — ele aparece aqui.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {rascunhos.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-[var(--r)] border border-linha bg-superficie px-4 py-3"
                >
                  <span className="font-mono text-[11px] uppercase text-suave">
                    {r.portal}
                  </span>
                  <strong className="text-sm">{r.titulo}</strong>
                  <span className="flex-1" />
                  <span className="font-mono text-[11px] text-suave">
                    mexido em {dataHora(r.atualizado_em)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-6 text-xs text-suave">
            Próximos incrementos: abrir o rascunho, editar, aprovar/agendar/publicar,
            e a manutenção do currículo — cada um com sua DEC.
          </p>
        </section>
      )}
    </main>
  );
}

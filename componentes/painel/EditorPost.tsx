"use client";

import { useEffect, useState } from "react";
import { supabasePainel } from "@/lib/supabase/painel";
import type { Portal } from "@/lib/tipos";

/* O editor do ciclo de vida (DEC-0014).

   Textarea de markdown DE PROPÓSITO — editor rico é o sink de XSS que a
   revisão de segurança mandou não abrir. E os três botões do rodapé são o
   mesmo gesto por baixo: UPDATE em publicado_em (NULL = rascunho, futuro =
   agendado, passado = no ar). Quem autoriza cada UPDATE é a RLS, nunca
   esta tela. */

export type PostEditavel = {
  id: string;
  slug: string;
  portal: Portal;
  titulo: string;
  resumo: string;
  corpo: string;
  tem_indicacao: boolean;
  publicado_em: string | null;
};

const PORTAIS: Portal[] = ["tecnologia", "pessoal", "profissional"];

export function EditorPost({
  post,
  aoFechar,
  aoMudar,
  aoSujar,
}: {
  post: PostEditavel;
  aoFechar: () => void;
  /** avisa o console pra recarregar as listas — leva o id de quem escreveu */
  aoMudar: (id: string) => void;
  /** avisa o console quando há mudança não salva (guarda contra descarte) */
  aoSujar: (sujo: boolean) => void;
}) {
  const [campos, setCampos] = useState({
    titulo: post.titulo,
    resumo: post.resumo,
    corpo: post.corpo,
    portal: post.portal,
    tem_indicacao: post.tem_indicacao,
  });
  const [agendarPara, setAgendarPara] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  /* "sujo" comparado ao prop, não a um flag: depois de salvar, o console
     rebusca o post, o prop passa a bater com os campos e a sujeira zera
     sozinha — sem contabilidade manual pra errar. */
  const sujo =
    campos.titulo !== post.titulo ||
    campos.resumo !== post.resumo ||
    campos.corpo !== post.corpo ||
    campos.portal !== post.portal ||
    campos.tem_indicacao !== post.tem_indicacao;
  useEffect(() => {
    aoSujar(sujo);
  }, [sujo, aoSujar]);

  /* Toda escrita passa por aqui: um UPDATE, o aviso de resultado, e o
     console recarrega. O `select` no fim devolve as linhas de fato tocadas —
     e ZERO linhas é falha silenciosa (RLS filtrou, ou o post sumiu), não
     sucesso: a revisão pegou que o Postgres não dá erro nesse caso. */
  async function atualizar(mudanca: Record<string, unknown>, feito: string) {
    const sb = supabasePainel();
    if (!sb) return;
    setOcupado(true);
    setAviso(null);
    const { data, error } = await sb
      .from("posts")
      .update(mudanca)
      .eq("id", post.id)
      .select("id");
    setOcupado(false);
    if (error) {
      setAviso(`o banco recusou: ${error.message}`);
      return;
    }
    if (!data || data.length === 0) {
      setAviso("nada foi gravado — o post pode ter sido removido ou a autorização mudou. Recarregue o painel.");
      return;
    }
    setAviso(feito);
    aoMudar(post.id);
  }

  const salvar = () => atualizar(campos, "salvo.");
  const publicarAgora = () =>
    atualizar({ ...campos, publicado_em: new Date().toISOString() }, "no ar.");
  const despublicar = () =>
    atualizar({ ...campos, publicado_em: null }, "voltou a rascunho.");
  const agendar = () => {
    if (!agendarPara) {
      setAviso("escolha a data e a hora antes de agendar.");
      return;
    }
    // datetime-local vem sem fuso: Date() lê como hora local e o ISO leva o fuso junto
    void atualizar(
      { ...campos, publicado_em: new Date(agendarPara).toISOString() },
      "agendado.",
    );
  };

  const campoTexto =
    "w-full rounded-[var(--r)] border border-linha bg-superficie px-3 py-2 text-sm";

  return (
    <section className="mt-8 rounded-[var(--r)] border border-linha bg-superficie-2 p-5">
      <div className="mb-4 flex items-baseline gap-3">
        <h2 className="font-semibold">Editando</h2>
        <code className="text-xs text-suave">/registro/{post.slug}</code>
        <span className="flex-1" />
        <button type="button" className="btn" onClick={aoFechar}>
          fechar
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-xs text-suave">
          título
          <input
            className={campoTexto}
            value={campos.titulo}
            onChange={(e) => setCampos({ ...campos, titulo: e.target.value })}
          />
        </label>

        <label className="text-xs text-suave">
          resumo (a chamada do cartão e da busca)
          <textarea
            className={campoTexto}
            rows={3}
            value={campos.resumo}
            onChange={(e) => setCampos({ ...campos, resumo: e.target.value })}
          />
        </label>

        <label className="text-xs text-suave">
          corpo (markdown — `## seção` vira índice lateral no site)
          <textarea
            className={`${campoTexto} min-h-[320px] font-mono text-[13px] leading-relaxed`}
            value={campos.corpo}
            onChange={(e) => setCampos({ ...campos, corpo: e.target.value })}
          />
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <label className="text-xs text-suave">
            portal{" "}
            <select
              className="rounded-[var(--r)] border border-linha bg-superficie px-2 py-1.5 text-sm"
              value={campos.portal}
              onChange={(e) => setCampos({ ...campos, portal: e.target.value as Portal })}
            >
              {PORTAIS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs text-suave">
            <input
              type="checkbox"
              checked={campos.tem_indicacao}
              onChange={(e) => setCampos({ ...campos, tem_indicacao: e.target.checked })}
            />
            tem link de indicação (o site escreve o aviso sozinho — DEC-013)
          </label>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-linha pt-4">
        <button type="button" className="btn" disabled={ocupado} onClick={salvar}>
          salvar
        </button>

        {post.publicado_em === null ? (
          <>
            <button type="button" className="btn primario" disabled={ocupado} onClick={publicarAgora}>
              publicar agora
            </button>
            <span className="flex items-center gap-2">
              <input
                type="datetime-local"
                className="rounded-[var(--r)] border border-linha bg-superficie px-2 py-1.5 text-sm"
                value={agendarPara}
                onChange={(e) => setAgendarPara(e.target.value)}
              />
              <button type="button" className="btn" disabled={ocupado} onClick={agendar}>
                agendar
              </button>
            </span>
          </>
        ) : (
          <button type="button" className="btn" disabled={ocupado} onClick={despublicar}>
            voltar a rascunho
          </button>
        )}

        {aviso && <span className="font-mono text-xs text-suave">{aviso}</span>}
      </div>
    </section>
  );
}

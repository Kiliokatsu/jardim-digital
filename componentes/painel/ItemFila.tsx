"use client";

import Link from "next/link";
import { useActionState } from "react";
import { mudarEstado, type Resultado } from "@/app/painel/acoes";
import { SeloEstado, SeloGenero, SeloMaturidade } from "@/componentes/Selos";
import { dataHora } from "@/lib/formato";
import type { Estado, Post } from "@/lib/tipos";

/* Um item da fila, com os botões de decisão.

   Os botões oferecidos vêm do estado atual — não existe "publicar" ao lado de
   um rascunho, porque o banco recusaria de qualquer forma e um botão que sempre
   dá erro é pior que botão nenhum. */

const inicial: Resultado = {};

type Botao = { destino: Estado; rotulo: string; cor?: string; principal?: boolean };

const BOTOES: Record<Estado, Botao[]> = {
  rascunho: [{ destino: "em_revisao", rotulo: "mandar pra revisão", principal: true }],
  em_revisao: [
    { destino: "aprovado", rotulo: "aprovar", cor: "var(--ok)", principal: true },
    { destino: "rejeitado", rotulo: "rejeitar", cor: "var(--erro)" },
    { destino: "rascunho", rotulo: "devolver pra rascunho" },
  ],
  aprovado: [
    { destino: "publicado", rotulo: "publicar", cor: "var(--accent)", principal: true },
    { destino: "em_revisao", rotulo: "revisar de novo" },
    { destino: "rejeitado", rotulo: "rejeitar", cor: "var(--erro)" },
  ],
  rejeitado: [{ destino: "rascunho", rotulo: "reabrir como rascunho", principal: true }],
  publicado: [{ destino: "aprovado", rotulo: "despublicar", cor: "var(--warn)" }],
};

export function ItemFila({ post }: { post: Post }) {
  const [estado, acao, enviando] = useActionState(mudarEstado, inicial);
  const botoes = BOTOES[post.estado];

  return (
    <li className="rounded-[var(--radius-token)] border border-linha bg-superficie p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <SeloEstado estado={post.estado} campo="estado" />
        <SeloMaturidade maturidade={post.maturidade} />
        <SeloGenero genero={post.genero} />
        <span className="font-mono text-[11px] uppercase tracking-wider text-suave">
          {post.portal}
        </span>
        {post.autoria === "agente" && (
          <span
            className="rounded px-1.5 py-0.5 font-mono text-[10px]"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            agente · {post.agente}
          </span>
        )}
        <div className="flex-1" />
        <span className="font-mono text-[11px] text-suave">
          mexido {dataHora(post.atualizado_em)}
        </span>
      </div>

      <h3 className="mt-3 text-[15px] font-bold leading-snug tracking-tight">
        <Link href={`/painel/escrever/${post.id}`} className="hover:text-acento">
          {post.titulo}
        </Link>
      </h3>

      {post.resumo && (
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-suave">{post.resumo}</p>
      )}

      {/* Uma nota por decisão. Vale mais no "rejeitar": rejeição sem motivo
          registrado é uma discussão que você vai ter de novo em duas semanas. */}
      <form action={acao} className="mt-4 flex flex-col gap-3 border-t border-linha pt-3">
        <input type="hidden" name="id" value={post.id} />

        <input
          name="nota"
          aria-label="Nota da decisão"
          placeholder="nota da decisão (opcional, mas ajuda a lembrar por quê)"
          className="w-full rounded border border-linha bg-fundo px-3 py-2 text-[13px] outline-none focus:border-acento"
        />

        <div className="flex flex-wrap items-center gap-2">
          {botoes.map((b) => (
            <button
              key={b.destino}
              type="submit"
              name="destino"
              value={b.destino}
              disabled={enviando}
              className={[
                "rounded px-3 py-1.5 font-mono text-xs transition-colors disabled:opacity-50",
                b.principal ? "font-semibold text-white" : "border border-linha text-suave hover:text-tinta",
              ].join(" ")}
              style={b.principal ? { background: b.cor ?? "var(--accent)" } : { color: b.cor }}
            >
              {b.rotulo}
            </button>
          ))}

          <div className="flex-1" />

          <Link
            href={`/painel/escrever/${post.id}`}
            className="rounded border border-linha px-3 py-1.5 font-mono text-xs text-suave hover:text-tinta"
          >
            abrir no editor
          </Link>
        </div>

        {estado.erro && (
          <p role="alert" className="text-[13px]" style={{ color: "var(--erro)" }}>
            {estado.erro}
          </p>
        )}
        {estado.ok && (
          <p role="status" className="text-[13px]" style={{ color: "var(--ok)" }}>
            {estado.ok}
          </p>
        )}
      </form>
    </li>
  );
}

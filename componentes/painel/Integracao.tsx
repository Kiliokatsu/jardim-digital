"use client";

import { useActionState } from "react";
import {
  alternarIntegracao, dispararIntegracao, salvarIntegracao, type Resultado,
} from "@/app/painel/acoes";
import { classeCampo, Rotulo } from "@/componentes/painel/Pecas";
import type { Integracao } from "@/lib/tipos";

const inicial: Resultado = {};

/* Controles da automação. O painel liga, desliga e dispara — nunca executa.
   Se o n8n travar, trava lá; aqui aparece uma linha de log com estado `erro`. */

export function ControleIntegracao({ integracao }: { integracao: Integracao }) {
  const [alt, acaoAlternar, alternando] = useActionState(alternarIntegracao, inicial);
  const [disp, acaoDisparar, disparando] = useActionState(dispararIntegracao, inicial);

  const recado = disp.erro ?? disp.ok ?? alt.erro ?? alt.ok;
  const ruim = Boolean(disp.erro ?? alt.erro);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={acaoAlternar}>
          <input type="hidden" name="id" value={integracao.id} />
          <input type="hidden" name="ativar" value={integracao.ativa ? "0" : "1"} />
          <button
            type="submit"
            disabled={alternando}
            className="rounded border px-3 py-1.5 font-mono text-xs transition-colors disabled:opacity-50"
            style={{
              borderColor: integracao.ativa
                ? "color-mix(in srgb, var(--warn) 45%, transparent)"
                : "color-mix(in srgb, var(--ok) 45%, transparent)",
              color: integracao.ativa ? "var(--warn)" : "var(--ok)",
            }}
          >
            {alternando ? "…" : integracao.ativa ? "desligar" : "ligar"}
          </button>
        </form>

        {integracao.url ? (
          <form action={acaoDisparar}>
            <input type="hidden" name="id" value={integracao.id} />
            <button
              type="submit"
              disabled={disparando || !integracao.ativa}
              title={
                integracao.ativa
                  ? "Chama a automação agora e registra o resultado"
                  : "Ligue a integração antes de disparar"
              }
              className="rounded border border-linha px-3 py-1.5 font-mono text-xs text-suave transition-colors hover:text-tinta disabled:opacity-40"
            >
              {disparando ? "disparando…" : "disparar agora"}
            </button>
          </form>
        ) : (
          <span className="font-mono text-[11px] text-suave">
            sem URL — esta se reporta sozinha
          </span>
        )}
      </div>

      {recado && (
        <p
          role={ruim ? "alert" : "status"}
          className="font-mono text-[11px] leading-relaxed"
          style={{ color: ruim ? "var(--erro)" : "var(--ok)" }}
        >
          {recado}
        </p>
      )}
    </div>
  );
}

export function FormularioIntegracao({ integracao }: { integracao: Integracao }) {
  const [estado, acao, salvando] = useActionState(salvarIntegracao, inicial);

  return (
    <form action={acao} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={integracao.id} />

      <label className="flex flex-col gap-1.5">
        <Rotulo>descrição</Rotulo>
        <textarea
          name="descricao"
          defaultValue={integracao.descricao ?? ""}
          rows={2}
          className={`${classeCampo} resize-y leading-relaxed`}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <Rotulo>url que o painel chama</Rotulo>
        <input
          name="url"
          defaultValue={integracao.url ?? ""}
          placeholder="https://n8n.seudominio/webhook/..."
          className={`${classeCampo} font-mono text-[13px]`}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <Rotulo>referência do segredo</Rotulo>
        <input
          name="ref_segredo"
          defaultValue={integracao.ref_segredo ?? ""}
          placeholder="N8N_TOKEN_REDATOR"
          className={`${classeCampo} font-mono text-[13px] uppercase`}
        />
        {/* Este aviso existe porque o campo *parece* pedir o token. Ele não pede. */}
        <span className="text-[11px] leading-relaxed text-suave">
          Aqui vai o <b className="text-tinta">nome da variável de ambiente</b>, nunca o token.
          O valor mora no host (Vercel, .env.local) e o banco jamais o vê — assim um dump do
          banco não vaza credencial nenhuma.
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <Rotulo>configuração (json)</Rotulo>
        <textarea
          name="config"
          defaultValue={JSON.stringify(integracao.config, null, 2)}
          rows={6}
          spellCheck={false}
          className={`${classeCampo} resize-y font-mono text-[12px] leading-relaxed`}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={salvando}
          className="rounded bg-acento px-4 py-2 font-mono text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {salvando ? "salvando…" : "salvar"}
        </button>

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
      </div>
    </form>
  );
}

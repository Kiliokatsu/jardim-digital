"use client";

import { useActionState, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { salvarPost, type Resultado } from "@/app/painel/acoes";
import { classeCampo, Rotulo } from "@/componentes/painel/Pecas";
import { minutosDeLeitura } from "@/lib/formato";
import type { Post } from "@/lib/tipos";

const inicial: Resultado = {};

/* Editor de Markdown com pré-visualização.

   Sem editor rico de propósito: o conteúdo vem de um vault do Obsidian e vai
   voltar a ser Markdown. Editor WYSIWYG no meio do caminho só produz HTML sujo
   que ninguém consegue reler depois.

   Os minutos de leitura são contados aqui pra você ver o número mexendo, mas o
   valor que vale é recalculado no servidor ao salvar. */

export function Editor({ post }: { post: Post }) {
  const [estado, acao, salvando] = useActionState(salvarPost, inicial);
  const [corpo, setCorpo] = useState(post.corpo_md);
  const [vendo, setVendo] = useState<"escrita" | "leitura">("escrita");

  const palavras = corpo.trim() ? corpo.trim().split(/\s+/).length : 0;

  return (
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={post.id} />

      {/* ─────────────── metadados ─────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <Rotulo>título</Rotulo>
          <input name="titulo" defaultValue={post.titulo} required className={classeCampo} />
        </label>

        <label className="flex flex-col gap-1.5">
          <Rotulo>slug (o endereço)</Rotulo>
          <input
            name="slug"
            defaultValue={post.slug}
            placeholder="deixe vazio pra gerar do título"
            className={`${classeCampo} font-mono text-[13px]`}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <Rotulo>maturidade</Rotulo>
          <select name="maturidade" defaultValue={post.maturidade} className={classeCampo}>
            <option value="semente">semente — ideia crua</option>
            <option value="muda">muda — já tem forma</option>
            <option value="perene">perene — assentou</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <Rotulo>portal</Rotulo>
          <select name="portal" defaultValue={post.portal} className={classeCampo}>
            <option value="tecnologia">tecnologia</option>
            <option value="pessoal">pessoal</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <Rotulo>gênero</Rotulo>
          <select name="genero" defaultValue={post.genero} className={classeCampo}>
            <option value="registro">registro</option>
            <option value="incidente">post-mortem</option>
            <option value="nota">nota</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <Rotulo>tags (separadas por vírgula)</Rotulo>
          <input
            name="tags"
            defaultValue={post.tags.join(", ")}
            className={`${classeCampo} font-mono text-[13px]`}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <Rotulo>resumo (é o que aparece no cartão do jardim)</Rotulo>
        <textarea
          name="resumo"
          defaultValue={post.resumo ?? ""}
          rows={2}
          className={`${classeCampo} resize-y leading-relaxed`}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <Rotulo>aviso de indicação (só se o texto tiver link de afiliado)</Rotulo>
        <textarea
          name="aviso_indicacao"
          defaultValue={post.aviso_indicacao ?? ""}
          rows={2}
          placeholder="Aparece em destaque no post, não em letra miúda."
          className={`${classeCampo} resize-y leading-relaxed`}
        />
      </label>

      {/* ─────────────── corpo ─────────────── */}
      <div className="rounded-[var(--radius-token)] border border-linha bg-superficie">
        <div className="flex flex-wrap items-center gap-3 border-b border-linha px-3 py-2">
          <div className="flex items-center gap-0.5 rounded-full border border-linha bg-fundo p-[3px]">
            {(["escrita", "leitura"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVendo(v)}
                aria-pressed={vendo === v}
                className={[
                  "rounded-full px-3 py-1 font-mono text-[11px] transition-colors",
                  vendo === v ? "bg-acento text-white" : "text-suave hover:text-tinta",
                ].join(" ")}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <span className="font-mono text-[11px] tabular-nums text-suave">
            {palavras} palavras · {minutosDeLeitura(corpo)} min
          </span>
        </div>

        {vendo === "escrita" ? (
          <textarea
            name="corpo_md"
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            rows={26}
            spellCheck
            placeholder="Markdown. Use ## pra seção — o jardim renderiza o resto."
            className="w-full resize-y bg-transparent px-4 py-3.5 font-mono text-[13px] leading-relaxed outline-none"
          />
        ) : (
          <>
            {/* o valor precisa continuar sendo enviado mesmo na aba de leitura */}
            <input type="hidden" name="corpo_md" value={corpo} />
            <div className="prosa max-w-[68ch] px-4 py-5">
              {corpo.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{corpo}</ReactMarkdown>
              ) : (
                <p className="text-suave">Nada escrito ainda.</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* ─────────────── salvar ─────────────── */}
      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-linha bg-fundo py-3">
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

        <div className="flex-1" />

        <span className="font-mono text-[11px] text-suave">
          salvar não publica — a publicação é decidida na fila
        </span>
      </div>
    </form>
  );
}

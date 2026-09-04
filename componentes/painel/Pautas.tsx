"use client";

import { useCallback, useEffect, useState } from "react";
import { supabasePainel } from "@/lib/supabase/painel";
import type { Portal } from "@/lib/tipos";
import { dataHora } from "@/lib/formato";

/* A entrada do pipeline de conteúdo (DEC-0016): o formulário grava a pauta
   com status 'aguardando' — e SÓ isso, por enquanto. O gancho que acorda o
   n8n por webhook entra quando o executor existir (DEC-0015, proposta);
   até lá as pautas se acumulam aqui sem se perder, que é exatamente o
   comportamento desenhado para quando o executor estiver fora do ar. */

type Pauta = {
  id: string;
  tema: string;
  portal: Portal;
  formato: string;
  status: string;
  erro: string | null;
  criado_em: string;
};

const FORMATOS = [
  "artigo-longo",
  "nota-curta",
  "tutorial-com-codigo",
  "ensaio-com-imagens",
] as const;
type Formato = (typeof FORMATOS)[number];
const PORTAIS: Portal[] = ["tecnologia", "pessoal", "profissional"];

/* menos que isso não é um tema, é uma palavra solta — o agente redator
   não tem o que obedecer */
const TEMA_MINIMO = 5;

const ROTULO_STATUS: Record<string, string> = {
  aguardando: "aguardando executor",
  gerando: "gerando…",
  pronto: "pronto — veja a fila",
  falhou: "falhou",
};

export function Pautas() {
  const [pautas, setPautas] = useState<Pauta[]>([]);
  const [tema, setTema] = useState("");
  const [portal, setPortal] = useState<Portal>("tecnologia");
  const [formato, setFormato] = useState<Formato>("artigo-longo");
  const [referencias, setReferencias] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const sb = supabasePainel();
    if (!sb) return;
    const { data, error } = await sb
      .from("pautas")
      .select("id, tema, portal, formato, status, erro, criado_em")
      .order("criado_em", { ascending: false })
      .returns<Pauta[]>();
    if (error) {
      // erro calado aqui viraria "nenhuma registrada" — uma mentira (DEC-0018)
      setAviso(`a lista de pautas não carregou: ${error.message}`);
      return;
    }
    setPautas(data ?? []);
  }, []);

  useEffect(() => {
    // IIFE assíncrona: o setState acontece depois do await, nunca no corpo
    // síncrono do efeito (regra react-hooks/set-state-in-effect)
    (async () => {
      await carregar();
    })();
  }, [carregar]);

  const registrar = useCallback(async () => {
    const sb = supabasePainel();
    if (!sb) return;
    if (tema.trim().length < TEMA_MINIMO) {
      setAviso("descreva o tema com pelo menos uma frase.");
      return;
    }
    setOcupado(true);
    setAviso(null);
    const { data, error } = await sb
      .from("pautas")
      .insert({ tema: tema.trim(), portal, formato, referencias: referencias.trim() || null })
      .select("id");
    setOcupado(false);
    if (error || !data?.length) {
      setAviso(`o banco recusou: ${error?.message ?? "nenhuma linha gravada"}`);
      return;
    }
    setTema("");
    setReferencias("");
    setAviso("pauta registrada — o executor processa quando existir.");
    void carregar();
  }, [tema, portal, formato, referencias, carregar]);

  const campo =
    "w-full rounded-[var(--r)] border border-linha bg-superficie px-3 py-2 text-sm";
  const seletor =
    "rounded-[var(--r)] border border-linha bg-superficie px-2 py-1.5 text-sm";

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-baseline gap-3">
        <h2 className="font-semibold">Pautas</h2>
        <span className="font-mono text-xs text-suave">
          {pautas.length === 0 ? "nenhuma registrada" : `${pautas.length} registradas`}
        </span>
      </div>

      <div className="rounded-[var(--r)] border border-linha bg-superficie-2 p-5">
        <div className="flex flex-col gap-3">
          <label className="text-xs text-suave">
            tema (o pedido que o agente redator vai obedecer)
            <input
              className={campo}
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="ex.: por que troquei X por Y no projeto Z, com o que ganhei e perdi"
            />
          </label>

          <div className="flex flex-wrap items-center gap-4">
            <label className="text-xs text-suave">
              portal{" "}
              <select className={seletor} value={portal} onChange={(e) => setPortal(e.target.value as Portal)}>
                {PORTAIS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-suave">
              formato{" "}
              <select className={seletor} value={formato} onChange={(e) => setFormato(e.target.value as Formato)}>
                {FORMATOS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="text-xs text-suave">
            referências (links, DECs, anotações — o material de apoio do agente)
            <textarea
              className={campo}
              rows={2}
              value={referencias}
              onChange={(e) => setReferencias(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3 border-t border-linha pt-4">
          <button type="button" className="btn primario" disabled={ocupado} onClick={registrar}>
            registrar pauta
          </button>
          {aviso && <span className="font-mono text-xs text-suave">{aviso}</span>}
        </div>
      </div>

      {pautas.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {pautas.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-[var(--r)] border border-linha bg-superficie px-4 py-3"
            >
              <span className="font-mono text-[11px] uppercase text-suave">{p.portal}</span>
              <span className="font-mono text-[11px] text-suave">{p.formato}</span>
              <strong className="text-sm">{p.tema}</strong>
              <span className="flex-1" />
              <span className="font-mono text-[11px] text-suave">
                {ROTULO_STATUS[p.status] ?? p.status} · {dataHora(p.criado_em)}
              </span>
              {p.erro && <span className="w-full text-xs text-erro">{p.erro}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

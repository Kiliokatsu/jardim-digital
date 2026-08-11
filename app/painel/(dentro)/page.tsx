import Link from "next/link";
import { Bloco, Farol, Mostrador, Vazio } from "@/componentes/painel/Pecas";
import { SeloEstado } from "@/componentes/Selos";
import { fila, listarExecucoes, listarIntegracoes, resumo } from "@/lib/painel";
import { dataHora, milissegundos } from "@/lib/formato";

/* O console. A pergunta que esta tela responde em três segundos é uma só:
   "tem algo esperando por mim?". Por isso a fila vem antes das automações, e
   o que está pendente é a única coisa colorida. */

export default async function Console() {
  const [r, naFila, integracoes, execucoes] = await Promise.all([
    resumo(),
    fila(),
    listarIntegracoes(),
    listarExecucoes(undefined, 8),
  ]);

  const pendentes = naFila.filter((p) => p.estado === "em_revisao");
  const prontos = naFila.filter((p) => p.estado === "aprovado");

  return (
    <div className="flex flex-col gap-5">
      {/* ─────────────────── mostradores ─────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Mostrador
          rotulo="esperando você"
          valor={r.emRevisao}
          cor={r.emRevisao > 0 ? "var(--warn)" : undefined}
          nota="em revisão"
          href="/painel/fila"
        />
        <Mostrador
          rotulo="prontos"
          valor={r.prontos}
          cor={prontos.length > 0 ? "var(--ok)" : undefined}
          nota="aprovados, é só publicar"
          href="/painel/fila"
        />
        <Mostrador rotulo="rascunhos" valor={r.rascunhos} nota="meus e de agente" href="/painel/escrever" />
        <Mostrador
          rotulo="de agente"
          valor={r.deAgente}
          cor={r.deAgente > 0 ? "var(--accent)" : undefined}
          nota="não publicado"
          href="/painel/fila"
        />
        <Mostrador rotulo="publicados" valor={r.publicados} nota="no jardim" href="/" />
        <Mostrador
          rotulo="automações"
          valor={`${r.integracoesAtivas}/${r.integracoesTotal}`}
          cor={r.comErro > 0 ? "var(--erro)" : r.comAlerta > 0 ? "var(--warn)" : "var(--ok)"}
          nota="ligadas"
          href="/painel/integracoes"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        {/* ─────────────────── fila resumida ─────────────────── */}
        <Bloco
          titulo="fila de aprovação"
          acao={
            <Link href="/painel/fila" className="font-mono text-[11px] text-acento hover:underline">
              abrir →
            </Link>
          }
        >
          {pendentes.length === 0 && prontos.length === 0 ? (
            <Vazio>Nada esperando decisão. A fila está limpa.</Vazio>
          ) : (
            <ul className="flex flex-col divide-y divide-linha">
              {[...pendentes, ...prontos].slice(0, 6).map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5">
                  <SeloEstado estado={p.estado} />
                  {p.autoria === "agente" && (
                    <span
                      className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                      style={{
                        background: "var(--accent-soft)",
                        color: "var(--accent)",
                      }}
                      title={`Escrito por ${p.agente}`}
                    >
                      agente
                    </span>
                  )}
                  <Link
                    href={`/painel/escrever/${p.id}`}
                    className="flex-1 text-sm font-medium hover:text-acento"
                  >
                    {p.titulo}
                  </Link>
                  <span className="font-mono text-[11px] text-suave">{dataHora(p.atualizado_em)}</span>
                </li>
              ))}
            </ul>
          )}
        </Bloco>

        {/* ─────────────────── automações ─────────────────── */}
        <Bloco
          titulo="automações"
          acao={
            <Link
              href="/painel/integracoes"
              className="font-mono text-[11px] text-acento hover:underline"
            >
              configurar →
            </Link>
          }
        >
          {integracoes.length === 0 ? (
            <Vazio>Nenhuma automação conectada ainda.</Vazio>
          ) : (
            <ul className="flex flex-col divide-y divide-linha">
              {integracoes.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-2.5">
                  <Farol estado={i.ativa ? i.ultimo_estado : null} />
                  <Link
                    href={`/painel/integracoes/${i.id}`}
                    className="flex-1 font-mono text-[13px] hover:text-acento"
                  >
                    {i.nome}
                  </Link>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-suave">
                    {i.tipo}
                  </span>
                  <span className="w-24 text-right font-mono text-[11px] text-suave">
                    {i.ativa ? dataHora(i.ultima_execucao_em) : "desligada"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Bloco>
      </div>

      {/* ─────────────────── log ─────────────────── */}
      <Bloco titulo="últimas execuções">
        {execucoes.length === 0 ? (
          <Vazio>Sem execução registrada.</Vazio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse font-mono text-[12px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-suave">
                  <th className="pb-2 pr-3 font-medium">quando</th>
                  <th className="pb-2 pr-3 font-medium">automação</th>
                  <th className="pb-2 pr-3 font-medium">estado</th>
                  <th className="pb-2 pr-3 font-medium">duração</th>
                  <th className="pb-2 font-medium">mensagem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linha">
                {execucoes.map((e) => {
                  const dela = integracoes.find((i) => i.id === e.integracao_id);
                  return (
                    <tr key={e.id}>
                      <td className="py-2 pr-3 whitespace-nowrap text-suave">
                        {dataHora(e.criado_em)}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">{dela?.nome ?? "—"}</td>
                      <td className="py-2 pr-3">
                        <Farol estado={e.estado} rotulo />
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap tabular-nums text-suave">
                        {milissegundos(e.duracao_ms)}
                      </td>
                      <td className="py-2 text-suave">{e.mensagem ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Bloco>
    </div>
  );
}

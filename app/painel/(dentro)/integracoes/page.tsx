import Link from "next/link";
import { Bloco, Farol, Vazio } from "@/componentes/painel/Pecas";
import { ControleIntegracao } from "@/componentes/painel/Integracao";
import { listarIntegracoes } from "@/lib/painel";
import { dataHora } from "@/lib/formato";

export default async function Integracoes() {
  const integracoes = await listarIntegracoes();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Automações</h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-suave">
          Superfície de controle do que roda fora daqui: n8n, cron, webhook, API. Este painel
          liga, desliga, dispara e guarda o log — mas não executa nada. Automação travada trava
          lá, e o site continua de pé.
        </p>
      </div>

      {integracoes.length === 0 ? (
        <Vazio>Nenhuma automação conectada. Elas são cadastradas direto no banco por enquanto.</Vazio>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {integracoes.map((i) => (
            <Bloco
              key={i.id}
              titulo={i.tipo}
              acao={
                <Link
                  href={`/painel/integracoes/${i.id}`}
                  className="font-mono text-[11px] text-acento hover:underline"
                >
                  detalhe →
                </Link>
              }
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <Farol estado={i.ativa ? i.ultimo_estado : null} />
                  <h3 className="font-mono text-sm font-semibold">{i.nome}</h3>
                  <div className="flex-1" />
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                    style={{
                      background: i.ativa ? "color-mix(in srgb, var(--ok) 14%, transparent)" : "var(--surface-2)",
                      color: i.ativa ? "var(--ok)" : "var(--muted)",
                    }}
                  >
                    {i.ativa ? "ligada" : "desligada"}
                  </span>
                </div>

                {i.descricao && (
                  <p className="text-[13px] leading-relaxed text-suave">{i.descricao}</p>
                )}

                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-linha pt-3 font-mono text-[11px]">
                  <dt className="text-suave">última execução</dt>
                  <dd className="text-right">{dataHora(i.ultima_execucao_em)}</dd>
                  <dt className="text-suave">segredo</dt>
                  <dd className="truncate text-right" title={i.ref_segredo ?? undefined}>
                    {i.ref_segredo ? `env.${i.ref_segredo}` : "não usa"}
                  </dd>
                </dl>

                <ControleIntegracao integracao={i} />
              </div>
            </Bloco>
          ))}
        </div>
      )}

      <Bloco titulo="como o agente redator se encaixa">
        <p className="max-w-3xl text-[13px] leading-relaxed text-suave">
          O agente que escreve rascunho é uma automação como qualquer outra: ele cria linha em{" "}
          <code className="rounded bg-superficie-2 px-1 py-0.5 font-mono text-[12px]">posts</code>{" "}
          com{" "}
          <code className="rounded bg-superficie-2 px-1 py-0.5 font-mono text-[12px]">
            estado = &apos;em_revisao&apos;
          </code>{" "}
          e{" "}
          <code className="rounded bg-superficie-2 px-1 py-0.5 font-mono text-[12px]">
            autoria = &apos;agente&apos;
          </code>
          . Ele <b className="text-tinta">não consegue publicar</b> mesmo que tente: o trigger no
          banco exige passagem por <i>aprovado</i>, e aprovar é decisão sua na fila. É por isso
          que dar a chave a um agente aqui não é arriscado.
        </p>
      </Bloco>
    </div>
  );
}

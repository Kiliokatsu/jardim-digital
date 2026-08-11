import Link from "next/link";
import { notFound } from "next/navigation";
import { Bloco, Farol, Vazio } from "@/componentes/painel/Pecas";
import { ControleIntegracao, FormularioIntegracao } from "@/componentes/painel/Integracao";
import { buscarIntegracao, listarExecucoes } from "@/lib/painel";
import { dataHora, milissegundos } from "@/lib/formato";

export default async function DetalheIntegracao(props: PageProps<"/painel/integracoes/[id]">) {
  const { id } = await props.params;
  const integracao = await buscarIntegracao(id);
  if (!integracao) notFound();

  const execucoes = await listarExecucoes(id, 40);

  const comErro = execucoes.filter((e) => e.estado === "erro").length;
  const taxa = execucoes.length
    ? Math.round(((execucoes.length - comErro) / execucoes.length) * 100)
    : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href="/painel/integracoes" className="font-mono text-xs text-suave hover:text-tinta">
          ← automações
        </Link>
        <div className="flex-1" />
        {taxa !== null && (
          <span className="font-mono text-[11px] text-suave">
            {taxa}% de sucesso nas últimas {execucoes.length}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Farol estado={integracao.ativa ? integracao.ultimo_estado : null} />
        <h1 className="font-mono text-xl font-bold">{integracao.nome}</h1>
        <span className="rounded border border-linha px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-suave">
          {integracao.tipo}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Bloco titulo="controle">
          <div className="flex flex-col gap-4">
            <ControleIntegracao integracao={integracao} />
            <p className="border-t border-linha pt-3 text-[12px] leading-relaxed text-suave">
              Disparar manualmente chama a URL com <code className="font-mono">POST</code>, espera
              no máximo 30 segundos e grava o resultado no log abaixo — inclusive quando falha.
              Falha registrada é diagnóstico; falha silenciosa é surpresa às três da manhã.
            </p>
          </div>
        </Bloco>

        <Bloco titulo="configuração">
          <FormularioIntegracao integracao={integracao} />
        </Bloco>
      </div>

      <Bloco titulo={`log de execuções · ${execucoes.length}`}>
        {execucoes.length === 0 ? (
          <Vazio>Nenhuma execução registrada ainda.</Vazio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse font-mono text-[12px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-suave">
                  <th className="pb-2 pr-3 font-medium">quando</th>
                  <th className="pb-2 pr-3 font-medium">estado</th>
                  <th className="pb-2 pr-3 font-medium">origem</th>
                  <th className="pb-2 pr-3 font-medium">duração</th>
                  <th className="pb-2 font-medium">mensagem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linha">
                {execucoes.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2 pr-3 whitespace-nowrap text-suave">
                      {dataHora(e.criado_em)}
                    </td>
                    <td className="py-2 pr-3">
                      <Farol estado={e.estado} rotulo />
                    </td>
                    <td className="py-2 pr-3 text-suave">{e.origem}</td>
                    <td className="py-2 pr-3 whitespace-nowrap tabular-nums text-suave">
                      {milissegundos(e.duracao_ms)}
                    </td>
                    <td className="py-2 text-suave">{e.mensagem ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Bloco>
    </div>
  );
}

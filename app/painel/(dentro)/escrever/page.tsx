import Link from "next/link";
import { Bloco, Vazio } from "@/componentes/painel/Pecas";
import { FormularioNovo } from "@/componentes/painel/FormularioNovo";
import { SeloAutoria, SeloEstado, SeloMaturidade } from "@/componentes/Selos";
import { listarTodosPosts } from "@/lib/painel";
import { dataHora } from "@/lib/formato";

export default async function Escrever() {
  const posts = await listarTodosPosts();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Escrever</h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-suave">
          Tudo que existe, publicado ou não. Rascunho novo nasce como semente e não aparece no
          jardim até passar pela fila.
        </p>
      </div>

      <Bloco titulo="novo registro">
        <FormularioNovo />
      </Bloco>

      <Bloco titulo={`todos os textos · ${posts.length}`}>
        {posts.length === 0 ? (
          <Vazio>Nada escrito ainda.</Vazio>
        ) : (
          <ul className="flex flex-col divide-y divide-linha">
            {posts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                <SeloEstado estado={p.estado} />
                <SeloMaturidade maturidade={p.maturidade} />
                <Link
                  href={`/painel/escrever/${p.id}`}
                  className="min-w-0 flex-1 truncate text-sm font-medium hover:text-acento"
                  title={p.titulo}
                >
                  {p.titulo}
                </Link>
                <SeloAutoria autoria={p.autoria} agente={p.agente} />
                <span className="font-mono text-[11px] uppercase tracking-wider text-suave">
                  {p.portal}
                </span>
                <span className="w-28 text-right font-mono text-[11px] text-suave">
                  {dataHora(p.atualizado_em)}
                </span>
                {p.estado === "publicado" && (
                  <Link
                    href={`/registro/${p.slug}`}
                    className="font-mono text-[11px] text-acento hover:underline"
                    title="Ver no jardim"
                  >
                    ↗
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </Bloco>
    </div>
  );
}

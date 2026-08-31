"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Post } from "@/lib/tipos";
import { CartaoPost } from "@/componentes/CartaoPost";
import { Etiqueta } from "@/componentes/Selos";
import { dataLonga, minutosDeLeitura } from "@/lib/formato";

/* O miolo interativo da listagem (espec §6.3): busca, filtro por etiqueta e
   paginação — tudo sem reload, filtrando EM MEMÓRIA a lista que o servidor
   já entregou. Com dezenas de posts isso é instantâneo e zero rede; quando o
   acervo crescer a ponto de doer, a espec já prevê a migração pra full-text
   `portuguese` no Postgres — e este componente vira só a casca.

   Estado limpo (sem busca, sem filtro): o mais recente vira o card EM
   DESTAQUE e a lista mostra o resto. Qualquer filtro ativo derruba o
   destaque — quem filtra está procurando, não folheando. */

const POR_PAGINA = 8;

/* busca ignora acento e caixa: "decisao" acha "Decisão" — o NFD separa a
   letra do acento e a faixa U+0300–U+036F apaga só o acento */
function normaliza(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function ListaRegistros({ posts }: { posts: Post[] }) {
  const [busca, setBusca] = useState("");
  const [etiquetaAtiva, setEtiquetaAtiva] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);

  /* as pills vêm das etiquetas que os posts DESTA lista carregam — filtro
     que devolveria zero resultados nem aparece */
  const etiquetas = useMemo(() => {
    const vistas = new Map<string, string>();
    for (const p of posts) for (const e of p.etiquetas ?? []) vistas.set(e.slug, e.nome);
    return [...vistas.entries()].map(([slug, nome]) => ({ slug, nome }));
  }, [posts]);

  const filtrando = busca.trim() !== "" || etiquetaAtiva !== null;

  const filtrados = useMemo(() => {
    const termo = normaliza(busca.trim());
    return posts.filter((p) => {
      const bateBusca =
        termo === "" || normaliza(`${p.titulo} ${p.resumo}`).includes(termo);
      const bateEtiqueta =
        etiquetaAtiva === null || (p.etiquetas ?? []).some((e) => e.slug === etiquetaAtiva);
      return bateBusca && bateEtiqueta;
    });
  }, [posts, busca, etiquetaAtiva]);

  const destaque = filtrando ? null : (filtrados[0] ?? null);
  const lista = filtrando ? filtrados : filtrados.slice(1);

  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = lista.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4">
        <input
          type="search"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(1);
          }}
          placeholder="buscar no título e no resumo…"
          aria-label="Buscar registros"
          className="w-full max-w-md rounded-[var(--radius-token)] border border-linha bg-superficie px-4 py-2.5 text-sm placeholder:text-pedra"
        />

        {etiquetas.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por etiqueta">
            {etiquetas.map((e) => {
              const ativa = etiquetaAtiva === e.slug;
              return (
                <button
                  key={e.slug}
                  type="button"
                  aria-pressed={ativa}
                  onClick={() => {
                    setEtiquetaAtiva(ativa ? null : e.slug);
                    setPagina(1);
                  }}
                  className={[
                    "rounded-full border px-3.5 py-1.5 font-mono text-[11px] transition-colors",
                    ativa
                      ? "border-acento bg-superficie text-tinta"
                      : "border-linha bg-superficie-2 text-suave hover:border-acento hover:text-tinta",
                  ].join(" ")}
                >
                  {e.nome}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {destaque && (
        <div className="mb-8">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-acento">
            em destaque
          </p>
          <CartaoPost post={destaque} densidade="destaque" />
        </div>
      )}

      {visiveis.length === 0 ? (
        <p className="rounded-[var(--radius-token)] border border-dashed border-linha px-4 py-8 text-sm text-suave">
          Nenhum registro bate com essa busca.
        </p>
      ) : (
        <ul className="flex flex-col">
          {visiveis.map((p) => {
            const minutos = p.corpo ? minutosDeLeitura(p.corpo) : null;
            return (
              <li
                key={p.id}
                className="relative flex flex-col gap-2 border-t border-linha py-6 first:border-t-0"
              >
                <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-pedra">
                  <span>{dataLonga(p.publicado_em)}</span>
                  {minutos !== null && <span>{minutos} min</span>}
                </div>
                <h3 className="text-xl font-bold leading-snug tracking-tight">
                  <Link
                    href={`/registro/${p.slug}`}
                    className="transition-colors hover:text-acento"
                  >
                    {/* o clique vale a linha inteira, o texto continua o alvo real */}
                    <span className="absolute inset-0" aria-hidden />
                    {p.titulo}
                  </Link>
                </h3>
                {p.resumo && (
                  <p className="line-clamp-2 max-w-3xl text-[0.94rem] leading-relaxed text-suave">
                    {p.resumo}
                  </p>
                )}
                {(p.etiquetas?.length ?? 0) > 0 && (
                  <div className="relative z-10 flex flex-wrap gap-1.5">
                    {p.etiquetas!.map((e) => (
                      <Etiqueta key={e.id} slug={e.slug}>{e.nome}</Etiqueta>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {totalPaginas > 1 && (
        <nav
          className="mt-8 flex items-center gap-4 border-t border-linha pt-6 font-mono text-xs text-suave"
          aria-label="Paginação"
        >
          <button
            type="button"
            className="disabled:opacity-40"
            disabled={paginaAtual === 1}
            onClick={() => setPagina(paginaAtual - 1)}
          >
            ← anteriores
          </button>
          <span>
            {paginaAtual}/{totalPaginas}
          </span>
          <button
            type="button"
            className="disabled:opacity-40"
            disabled={paginaAtual === totalPaginas}
            onClick={() => setPagina(paginaAtual + 1)}
          >
            próximos →
          </button>
        </nav>
      )}
    </div>
  );
}

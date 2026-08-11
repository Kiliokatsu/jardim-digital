import Link from "next/link";
import { CartaoPost } from "@/componentes/CartaoPost";
import { Grafo } from "@/componentes/Grafo";
import { CabecaSecao } from "@/componentes/Secao";
import { SeloMaturidade } from "@/componentes/Selos";
import { jardimPorMaturidade, listarConexoes, listarPosts } from "@/lib/consultas";
import { MATURIDADES } from "@/lib/tipos";

export default async function Home() {
  const [canteiros, posts, conexoes] = await Promise.all([
    jardimPorMaturidade(),
    listarPosts(),
    listarConexoes(),
  ]);

  return (
    <>
      {/* ─────────────────────────── abertura ─────────────────────────── */}
      <section className="py-20 sm:py-28">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-acento">
          Build in public · desde 2026
        </p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-6xl">
          Construo sistemas sólidos.
          <br />
          E mostro a <em className="font-serif italic text-acento">cozinha pegando fogo</em>.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-suave">
          Engenharia de automação, orquestração de IA e as decisões técnicas que eu tomei
          errado antes de tomar certo. Aqui nada nasce pronto — as notas amadurecem à vista.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/profissional"
            className="rounded-full bg-acento px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Ver currículo
          </Link>
          <Link
            href="/grafo"
            className="rounded-full border border-linha bg-superficie px-5 py-2.5 text-sm font-medium text-suave transition-colors hover:border-acento/50 hover:text-tinta"
          >
            Abrir o grafo
          </Link>
        </div>

        {/* o convite pra virar a chave. sem isso, ninguém descobre o Modo Engenheiro. */}
        <p className="mt-8 max-w-2xl rounded-[var(--radius-token)] border border-dashed border-linha px-4 py-3 text-sm text-suave">
          <b className="text-tinta">Modo engenheiro</b> — a chave no topo abre o site por
          dentro: cada elemento passa a dizer de qual coluna do banco ele veio. Sou engenheiro
          de automação; achei justo que a instrumentação ficasse à vista.
        </p>
      </section>

      {/* ─────────────────────────── canteiros ─────────────────────────── */}
      <section className="pb-8">
        <CabecaSecao
          titulo="O jardim"
          contador={posts.length}
          nota="Ordenado por maturidade, não por data. Semente é ideia crua; perene é o que eu já defendo em reunião. Nota velha continua crescendo — e nota nova pode nascer perene."
        />

        <div className="flex flex-col gap-10">
          {MATURIDADES.slice()
            .reverse()
            .map(({ chave, rotulo, descricao }) => {
              const doCanteiro = canteiros[chave];
              return (
                <div key={chave}>
                  <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="flex items-center gap-2 text-base font-bold tracking-tight">
                      <SeloMaturidade maturidade={chave} />
                      {rotulo}
                    </h3>
                    <span className="font-mono text-xs text-suave">
                      {doCanteiro.length}
                    </span>
                    <p className="text-sm text-suave">{descricao}</p>
                  </div>

                  {doCanteiro.length === 0 ? (
                    <p className="rounded-[var(--radius-token)] border border-dashed border-linha px-4 py-6 text-sm text-suave">
                      Canteiro vazio por enquanto.
                    </p>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {doCanteiro.map((p) => (
                        <CartaoPost key={p.id} post={p} densidade="canteiro" />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </section>

      {/* ─────────────────────────── grafo ─────────────────────────── */}
      <section className="py-14">
        <CabecaSecao
          titulo="Como as notas se ligam"
          contador={conexoes.length}
          nota="Este site nasce de um vault do Obsidian, e os [[links]] entre as notas vieram junto. Passe o mouse num ponto pra ver o que ele puxa."
        />
        <Grafo posts={posts} conexoes={conexoes} />
      </section>
    </>
  );
}

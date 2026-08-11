import type { Metadata } from "next";
import Link from "next/link";
import { Grafo } from "@/componentes/Grafo";
import { CabecaSecao } from "@/componentes/Secao";
import { Etiqueta, SeloMaturidade } from "@/componentes/Selos";
import { listarConexoes, listarPosts } from "@/lib/consultas";

export const metadata: Metadata = {
  title: "Grafo",
  description: "O mapa de conexões entre as notas do jardim.",
};

export default async function PaginaGrafo() {
  const [posts, conexoes] = await Promise.all([listarPosts(), listarConexoes()]);

  // grau por nota, pra listar as mais conectadas embaixo do mapa
  const grau = new Map<string, number>();
  for (const c of conexoes) {
    grau.set(c.de, (grau.get(c.de) ?? 0) + 1);
    grau.set(c.para, (grau.get(c.para) ?? 0) + 1);
  }
  const maisLigadas = [...posts]
    .map((p) => ({ post: p, grau: grau.get(p.id) ?? 0 }))
    .filter((x) => x.grau > 0)
    .sort((a, b) => b.grau - a.grau);

  const soltas = posts.filter((p) => (grau.get(p.id) ?? 0) === 0);

  return (
    <>
      <section className="py-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-acento">/grafo</p>
        <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-5xl">
          O mapa do jardim
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-suave">
          Cada ponto é uma nota; cada linha é uma referência que eu escrevi de uma pra outra.
          O anel interno é o que já assentou, o externo é o que acabou de brotar.
        </p>
      </section>

      <Grafo posts={posts} conexoes={conexoes} />

      <section className="py-14">
        <CabecaSecao
          titulo="As mais conectadas"
          contador={maisLigadas.length}
          nota="Nota muito ligada costuma ser onde o assunto realmente mora. É por aqui que eu começaria a ler."
        />
        {maisLigadas.length === 0 ? (
          <p className="text-sm text-suave">Nenhuma conexão ainda.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-linha">
            {maisLigadas.map(({ post, grau: g }) => (
              <li key={post.id}>
                <Link
                  href={`/registro/${post.slug}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5 transition-colors hover:text-acento"
                >
                  <span className="flex-none font-mono text-sm text-suave">
                    {String(g).padStart(2, "0")}
                  </span>
                  <SeloMaturidade maturidade={post.maturidade} />
                  <span className="flex-1 font-medium">{post.titulo}</span>
                  <Etiqueta>{post.portal}</Etiqueta>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {soltas.length > 0 && (
        <section className="pb-14">
          <CabecaSecao
            titulo="Sem conexão ainda"
            contador={soltas.length}
            nota="Nota que ainda não conversa com nenhuma outra. Não é defeito — é sinal de assunto novo, ou de trabalho que eu ainda não fiz."
          />
          <ul className="flex flex-wrap gap-2">
            {soltas.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/registro/${p.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-linha bg-superficie px-3.5 py-1.5 text-sm text-suave transition-colors hover:border-acento/50 hover:text-tinta"
                >
                  <SeloMaturidade maturidade={p.maturidade} />
                  {p.titulo}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

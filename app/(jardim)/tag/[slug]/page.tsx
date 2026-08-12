import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartaoPost } from "@/componentes/CartaoPost";
import { CabecaSecao } from "@/componentes/Secao";
import { buscarEtiqueta, listarEtiquetas, listarPostsPorEtiqueta } from "@/lib/consultas";

/* Página de etiqueta — o motivo de a etiqueta ser tabela e não lista na linha
   (DEC-018): ela tem descrição própria, então esta página abre com texto de
   verdade em vez de uma listagem seca. Pra SEO, isso vale mais que o join
   que se paga por ela. */

export const revalidate = 300;

export async function generateStaticParams() {
  const etiquetas = await listarEtiquetas();
  return etiquetas.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata(
  props: PageProps<"/tag/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const etiqueta = await buscarEtiqueta(slug);
  if (!etiqueta) return { title: "Etiqueta não encontrada" };
  return { title: `Etiqueta: ${etiqueta.nome}`, description: etiqueta.descricao ?? undefined };
}

export default async function PaginaEtiqueta(props: PageProps<"/tag/[slug]">) {
  const { slug } = await props.params;
  const [etiqueta, posts] = await Promise.all([
    buscarEtiqueta(slug),
    listarPostsPorEtiqueta(slug),
  ]);
  if (!etiqueta) notFound();

  return (
    <>
      <section className="py-16 sm:py-20">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-acento">
          /tag/{etiqueta.slug}
        </p>
        <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-5xl">
          {etiqueta.nome}
        </h1>
        {etiqueta.descricao && (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-suave">{etiqueta.descricao}</p>
        )}
      </section>

      <section className="pb-10">
        <CabecaSecao titulo="Registros" contador={posts.length} />
        {posts.length === 0 ? (
          <p className="rounded-[var(--radius-token)] border border-dashed border-linha px-4 py-8 text-sm text-suave">
            Nenhum registro publicado com esta etiqueta ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((p) => (
              <CartaoPost key={p.id} post={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

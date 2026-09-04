import { ListaRegistros } from "@/componentes/ListaRegistros";
import { listarPosts } from "@/lib/consultas";
import type { Portal } from "@/lib/tipos";

/* Os dois blogs têm a mesma estrutura e mudam só de tom (espec §6.3). Um
   componente com texto injetado evita duas páginas quase iguais que vão
   divergir sozinhas na terceira alteração.

   Este arquivo é a casca de servidor: busca os posts e entrega tudo pro
   miolo interativo (ListaRegistros) filtrar em memória, sem reload. */

export async function PaginaPortal({
  portal, titulo, chamada,
}: {
  portal: Portal;
  titulo: string;
  chamada: string;
}) {
  const posts = await listarPosts(portal);

  return (
    <>
      <section className="py-14 sm:py-18">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-acento">
          blog · {posts.length} {posts.length === 1 ? "registro" : "registros"}
        </p>
        <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-5xl">
          {titulo}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-suave">{chamada}</p>
      </section>

      <section className="pb-16">
        {posts.length === 0 ? (
          <p className="rounded-[var(--radius-token)] border border-dashed border-linha px-4 py-8 text-sm text-suave">
            Ainda não plantei nada aqui.
          </p>
        ) : (
          <ListaRegistros posts={posts} />
        )}
      </section>
    </>
  );
}

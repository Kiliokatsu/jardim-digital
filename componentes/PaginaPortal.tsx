import { CartaoPost } from "@/componentes/CartaoPost";
import { CabecaSecao } from "@/componentes/Secao";
import { listarPosts } from "@/lib/consultas";
import type { Portal } from "@/lib/tipos";

/* Os dois blogs têm a mesma estrutura e mudam só de tom. Um componente com
   texto injetado evita duas páginas quase iguais que vão divergir sozinhas
   na terceira alteração. */

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
      <section className="py-16 sm:py-20">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-acento">
          /{portal}
        </p>
        <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-5xl">
          {titulo}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-suave">{chamada}</p>
      </section>

      <section className="pb-10">
        <CabecaSecao titulo="Registros" contador={posts.length} />
        {posts.length === 0 ? (
          <p className="rounded-[var(--radius-token)] border border-dashed border-linha px-4 py-8 text-sm text-suave">
            Ainda não plantei nada aqui.
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

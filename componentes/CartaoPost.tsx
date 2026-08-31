import Link from "next/link";
import type { Post } from "@/lib/tipos";
import { dataLonga, minutosDeLeitura } from "@/lib/formato";
import { Etiqueta, SeloPortal } from "@/componentes/Selos";

/* O cartão de registro das telas aprovadas: meta em mono (portal · data ·
   minutos), título, resumo e etiquetas. Duas densidades — `destaque` é o
   primeiro da home, maior; `lista` é o padrão das listagens.

   Minutos de leitura são calculados do corpo na hora, não gravados: número
   escrito à mão envelhece (o v3 não tem essa coluna de propósito). */

export function CartaoPost({
  post, densidade = "lista",
}: {
  post: Post;
  densidade?: "destaque" | "lista";
}) {
  const emDestaque = densidade === "destaque";
  const minutos = post.corpo ? minutosDeLeitura(post.corpo) : null;

  return (
    <article
      data-campo="posts"
      className={[
        "group relative flex flex-col gap-3 rounded-[var(--radius-token)] border border-linha bg-superficie p-5 transition-colors hover:border-acento/50",
        emDestaque ? "sm:p-7" : "",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-suave">
        <SeloPortal portal={post.portal} />
        <span data-campo="publicado_em">{dataLonga(post.publicado_em)}</span>
        {minutos !== null && <span>{minutos} min</span>}
        {post.tem_indicacao && (
          <span className="text-gelo" title="Este post contém link de indicação, avisado no fim do texto">
            contém indicação
          </span>
        )}
      </div>

      <h3
        className={
          emDestaque
            ? "text-2xl font-extrabold leading-snug tracking-tight"
            : "text-xl font-bold leading-snug tracking-tight"
        }
      >
        <Link href={`/registro/${post.slug}`} className="transition-colors hover:text-acento">
          {/* o link cobre o cartão inteiro, mas o texto continua sendo o alvo real */}
          <span className="absolute inset-0" aria-hidden />
          <span data-campo="titulo">{post.titulo}</span>
        </Link>
      </h3>

      {post.resumo && (
        <p data-campo="resumo" className="max-w-3xl text-[0.94rem] leading-relaxed text-suave">
          {post.resumo}
        </p>
      )}

      {(post.etiquetas?.length ?? 0) > 0 && (
        <div data-campo="etiquetas" className="relative z-10 flex flex-wrap gap-1.5">
          {post.etiquetas!.map((e) => (
            <Etiqueta key={e.id} slug={e.slug}>{e.nome}</Etiqueta>
          ))}
        </div>
      )}
    </article>
  );
}

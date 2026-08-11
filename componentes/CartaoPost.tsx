import Link from "next/link";
import type { Post } from "@/lib/tipos";
import { dataLonga } from "@/lib/formato";
import { Etiqueta, SeloAutoria, SeloGenero, SeloMaturidade, SeloPortal } from "@/componentes/Selos";

/* O cartão do jardim. Duas densidades: `canteiro` (na home, dentro do canteiro
   de maturidade) e `lista` (nas páginas de portal, com resumo inteiro).

   Cada pedaço carrega data-campo. Com o Modo Engenheiro ligado, o cartão vira
   a documentação do próprio schema — é o exercício que você já tinha começado
   no protótipo, agora alimentado pelo banco de verdade. */

export function CartaoPost({
  post, densidade = "lista",
}: {
  post: Post;
  densidade?: "canteiro" | "lista";
}) {
  const enxuto = densidade === "canteiro";

  return (
    <article
      data-campo="posts"
      data-campo-bloco=""
      className="group relative flex flex-col gap-3 rounded-[var(--radius-token)] border border-linha bg-superficie p-5 transition-colors hover:border-acento/50"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <SeloMaturidade maturidade={post.maturidade} campo="maturidade" />
        <SeloPortal portal={post.portal} campo="portal" />
        <SeloGenero genero={post.genero} campo="genero" />
        <SeloAutoria autoria={post.autoria} agente={post.agente} campo="autoria" />
      </div>

      <h3 className={enxuto ? "text-[1.05rem] font-bold leading-snug tracking-tight" : "text-xl font-bold leading-snug tracking-tight"}>
        <Link href={`/registro/${post.slug}`} className="hover:text-acento">
          {/* o link cobre o cartão inteiro, mas o texto continua sendo o alvo real */}
          <span className="absolute inset-0" aria-hidden />
          <span data-campo="titulo">{post.titulo}</span>
        </Link>
      </h3>

      {post.resumo && (
        <p
          data-campo="resumo"
          className={[
            "text-[0.94rem] leading-relaxed text-suave",
            enxuto ? "line-clamp-3" : "",
          ].join(" ")}
        >
          {post.resumo}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-1 text-xs text-suave">
        <span data-campo="publicado_em">{dataLonga(post.publicado_em)}</span>
        <span aria-hidden className="text-linha">·</span>
        <span data-campo="minutos_leitura">{post.minutos_leitura} min</span>
        {post.aviso_indicacao && (
          <>
            <span aria-hidden className="text-linha">·</span>
            <span className="text-alerta" title="Este post contém link de indicação, avisado no corpo do texto">
              contém indicação
            </span>
          </>
        )}
      </div>

      {!enxuto && post.tags.length > 0 && (
        <div data-campo="tags" className="flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <Etiqueta key={t}>{t}</Etiqueta>
          ))}
        </div>
      )}

      {/* só visível com o Modo Engenheiro ligado */}
      <div className="so-engenheiro border-t border-linha pt-2 font-mono text-[10px] leading-relaxed text-suave">
        id {post.id} · slug <span className="text-acento">{post.slug}</span> · revisões {post.revisoes}
      </div>
    </article>
  );
}

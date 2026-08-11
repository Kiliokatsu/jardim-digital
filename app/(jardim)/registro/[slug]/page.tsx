import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/componentes/Markdown";
import { CabecaSecao } from "@/componentes/Secao";
import {
  Etiqueta, SeloAutoria, SeloGenero, SeloMaturidade, SeloPortal,
} from "@/componentes/Selos";
import { CartaoPost } from "@/componentes/CartaoPost";
import { buscarIncidente, buscarPost, listarPosts, vizinhos } from "@/lib/consultas";
import { dataLonga, duracao } from "@/lib/formato";
import { MATURIDADES } from "@/lib/tipos";

export async function generateStaticParams() {
  const posts = await listarPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/registro/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await buscarPost(slug);
  if (!post) return { title: "Registro não encontrado" };
  return {
    title: post.titulo,
    description: post.resumo ?? undefined,
    openGraph: {
      title: post.titulo,
      description: post.resumo ?? undefined,
      type: "article",
      publishedTime: post.publicado_em ?? undefined,
      tags: post.tags,
    },
  };
}

export default async function PaginaRegistro(props: PageProps<"/registro/[slug]">) {
  const { slug } = await props.params;
  const post = await buscarPost(slug);
  if (!post) notFound();

  const [incidente, ligadas] = await Promise.all([
    post.genero === "incidente" ? buscarIncidente(post.id) : Promise.resolve(null),
    vizinhos(post.id),
  ]);

  const maturidade = MATURIDADES.find((m) => m.chave === post.maturidade)!;

  return (
    <article className="py-14">
      {/* ─────────────────────────── cabeçalho ─────────────────────────── */}
      <header className="mb-10 border-b border-linha pb-8">
        <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <SeloPortal portal={post.portal} campo="portal" />
          <SeloGenero genero={post.genero} campo="genero" />
          <SeloAutoria autoria={post.autoria} agente={post.agente} campo="autoria" />
        </div>

        <h1
          data-campo="titulo"
          className="max-w-4xl text-3xl font-extrabold leading-[1.14] tracking-[-0.03em] sm:text-[2.75rem]"
        >
          {post.titulo}
        </h1>

        {post.resumo && (
          <p data-campo="resumo" className="mt-5 max-w-3xl font-serif text-lg leading-relaxed text-suave">
            {post.resumo}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-suave">
          <span data-campo="publicado_em">{dataLonga(post.publicado_em)}</span>
          <span aria-hidden className="text-linha">·</span>
          <span data-campo="minutos_leitura">{post.minutos_leitura} min de leitura</span>
          <span aria-hidden className="text-linha">·</span>
          <span
            className="inline-flex items-center gap-2"
            title={maturidade.descricao}
          >
            <SeloMaturidade maturidade={post.maturidade} comRotulo campo="maturidade" />
          </span>
        </div>

        {/* honestidade sobre o estágio: nota-semente não deve ser lida como veredito */}
        <p className="mt-4 max-w-2xl rounded-[var(--radius-token)] border border-dashed border-linha px-4 py-2.5 text-[13px] text-suave">
          <b className="text-tinta">{maturidade.rotulo}.</b> {maturidade.descricao}
        </p>
      </header>

      {/* ────────────── métricas do incidente, quando é post-mortem ────────────── */}
      {incidente && (
        <section
          data-campo="incidentes"
          data-campo-bloco=""
          className="relative mb-10 rounded-[var(--radius-token)] border border-linha bg-superficie p-5"
        >
          <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.16em] text-erro">
            contabilidade do incidente
          </h2>
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Metrica rotulo="Tempo até perceber" valor={duracao(incidente.deteccao_segundos)} campo="deteccao_segundos" />
            <Metrica rotulo="Tempo até voltar" valor={duracao(incidente.mttr_segundos)} campo="mttr_segundos" />
            <Metrica
              rotulo="Perdeu dado"
              valor={incidente.perdeu_dado ? "sim" : "não"}
              campo="perdeu_dado"
              cor={incidente.perdeu_dado ? "var(--erro)" : "var(--ok)"}
            />
            <Metrica rotulo="Causa" valor={incidente.causa} campo="causa" pequeno />
          </dl>
          <p data-campo="recuperacao" className="mt-5 border-t border-linha pt-4 text-sm text-suave">
            <b className="text-tinta">Como voltou:</b> {incidente.recuperacao}
          </p>
        </section>
      )}

      {/* ─────────────────────────── corpo ─────────────────────────── */}
      <div data-campo="corpo_md" data-campo-bloco="" className="relative max-w-[68ch]">
        <Markdown>{post.corpo_md}</Markdown>
      </div>

      {/* aviso de indicação: visível, e não em letra miúda no fim */}
      {post.aviso_indicacao && (
        <aside
          data-campo="aviso_indicacao"
          data-campo-bloco=""
          className="relative mt-10 max-w-[68ch] rounded-[var(--radius-token)] border border-alerta/40 bg-superficie p-4 text-sm"
          style={{ borderColor: "color-mix(in srgb, var(--warn) 40%, transparent)" }}
        >
          <b className="text-alerta">Aviso de indicação.</b>{" "}
          <span className="text-suave">{post.aviso_indicacao}</span>
        </aside>
      )}

      {post.tags.length > 0 && (
        <div data-campo="tags" className="mt-10 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <Etiqueta key={t}>{t}</Etiqueta>
          ))}
        </div>
      )}

      {/* ─────────────────────────── conectadas ─────────────────────────── */}
      {ligadas.length > 0 && (
        <section className="mt-16">
          <CabecaSecao
            titulo="Conectado a"
            contador={ligadas.length}
            nota="As notas que esta referencia, ou que referenciam esta."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {ligadas.map((p) => (
              <CartaoPost key={p.id} post={p} densidade="canteiro" />
            ))}
          </div>
        </section>
      )}

      <div className="mt-14 border-t border-linha pt-6">
        <Link href={`/${post.portal}`} className="text-sm text-suave hover:text-acento">
          ← todos os registros de {post.portal}
        </Link>
      </div>
    </article>
  );
}

function Metrica({
  rotulo, valor, campo, cor, pequeno = false,
}: {
  rotulo: string;
  valor: string;
  campo: string;
  cor?: string;
  pequeno?: boolean;
}) {
  return (
    <div>
      <dt className="mb-1 text-[11px] font-medium uppercase tracking-[0.1em] text-suave">
        {rotulo}
      </dt>
      <dd
        data-campo={campo}
        className={pequeno ? "text-sm leading-snug" : "font-mono text-2xl font-semibold"}
        style={cor ? { color: cor } : undefined}
      >
        {valor}
      </dd>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown, secoesDoMarkdown } from "@/componentes/Markdown";
import { Etiqueta } from "@/componentes/Selos";
import { BarraProgresso } from "@/componentes/post/BarraProgresso";
import { IndiceLateral } from "@/componentes/post/IndiceLateral";
import { buscarPost, listarPosts, vizinhosDoPost } from "@/lib/consultas";
import { dataLonga, minutosDeLeitura } from "@/lib/formato";

/* A página de leitura — o template aprovado no pacote dragão, por inteiro:
   barra de progresso, trilha, cabeçalho com autor, coluna de 68ch, janelinha
   de código, fecho-pergunta (o último parágrafo do texto, sem caixa e sem
   CTA — DEC-027), etiquetas, aviso de indicação escrito pelo componente
   (DEC-013), vizinhos e índice lateral.

   ISR de 5 minutos: publicar é operação de banco (pelo Studio, até o painel
   existir), então a página se atualiza sozinha sem rebuild manual. */

export const revalidate = 300;

export async function generateStaticParams() {
  const posts = await listarPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: PageProps<"/registro/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await buscarPost(slug);
  if (!post) return { title: "Registro não encontrado" };
  return {
    title: post.titulo,
    description: post.resumo,
    openGraph: {
      type: "article",
      title: `${post.titulo} — Kiliokatsu`,
      description: post.resumo,
      publishedTime: post.publicado_em ?? undefined,
    },
  };
}

const NOME_PORTAL: Record<string, string> = {
  profissional: "Profissional",
  tecnologia: "Tecnologia",
  pessoal: "Pessoal",
};

export default async function PaginaRegistro(props: PageProps<"/registro/[slug]">) {
  const { slug } = await props.params;
  const post = await buscarPost(slug);
  if (!post) notFound();

  const [{ anterior, proximo }] = await Promise.all([vizinhosDoPost(post)]);
  const secoes = secoesDoMarkdown(post.corpo);
  const minutos = minutosDeLeitura(post.corpo);

  return (
    <>
      {/* key por post: navegar anterior/próximo reconcilia esta página no mesmo
          lugar da árvore, e sem remontar a barra mediria o artigo anterior */}
      <BarraProgresso key={post.slug} />

      <div className="layout">
        <article className="corpo">
          <nav className="trilha" aria-label="Trilha de navegação">
            <Link href="/">Início</Link> <span aria-hidden>/</span>{" "}
            <Link href={`/${post.portal}`}>{NOME_PORTAL[post.portal]}</Link>
          </nav>

          <header className="post-cabeca">
            <div className="post-meta">
              <span className="portal">{post.portal}</span>
              <span>{dataLonga(post.publicado_em)}</span>
              <span>{minutos} min de leitura</span>
            </div>

            <h1>{post.titulo}</h1>

            <p className="chamada">{post.resumo}</p>

            <div className="autor">
              <div className="avatar" aria-hidden>VH</div>
              <div>
                <p className="autor-nome">Vinícius Henrique</p>
                <p className="autor-sub">Desenvolvedor de sistemas · Goiânia, GO</p>
              </div>
            </div>
          </header>

          <div className="texto">
            <Markdown>{post.corpo}</Markdown>
          </div>

          {(post.etiquetas?.length ?? 0) > 0 && (
            <div className="etiquetas">
              {post.etiquetas!.map((e) => (
                <Etiqueta key={e.id} slug={e.slug}>{e.nome}</Etiqueta>
              ))}
            </div>
          )}

          {/* DEC-013: a frase é sempre a mesma e vem do componente — o dado no
              banco é só o boolean. Ele não precisa lembrar de digitar nada. */}
          {post.tem_indicacao && (
            <p className="indicacao">Os links de ferramentas neste post são de indicação.</p>
          )}

          {(anterior || proximo) && (
            <nav className="vizinhos" aria-label="Registros vizinhos">
              {anterior ? (
                <Link className="vizinho anterior" href={`/registro/${anterior.slug}`}>
                  <span className="dir">← anterior</span>
                  <strong>{anterior.titulo}</strong>
                  <span className="quando">{dataLonga(anterior.publicado_em)}</span>
                </Link>
              ) : (
                <span aria-hidden />
              )}
              {proximo && (
                <Link className="vizinho proximo" href={`/registro/${proximo.slug}`}>
                  <span className="dir">próximo →</span>
                  <strong>{proximo.titulo}</strong>
                  <span className="quando">{dataLonga(proximo.publicado_em)}</span>
                </Link>
              )}
            </nav>
          )}

          <div className="voltar">
            <Link className="btn" href={`/${post.portal}`}>
              ← Todos os registros de {NOME_PORTAL[post.portal]}
            </Link>
            <Link className="btn" href="/">Ir para o início</Link>
          </div>
        </article>

        {secoes.length > 0 && <IndiceLateral key={post.slug} secoes={secoes} />}
      </div>
    </>
  );
}

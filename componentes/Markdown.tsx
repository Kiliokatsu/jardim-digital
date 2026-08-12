import { Children, isValidElement } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Janelinha } from "@/componentes/post/Janelinha";
import { paraSlug } from "@/lib/formato";

/* Renderiza o corpo do post.

   Sem rehype-raw de propósito: HTML cru dentro do Markdown não é interpretado.
   Parte destes textos um dia virá de agente, e mesmo com fila de aprovação a
   leitura fica mais segura se HTML injetado simplesmente não executar.

   Os h2 ganham id derivado do texto — é o que o índice lateral usa pra marcar
   a seção atual. A cerca de código vira a Janelinha (Shiki no servidor); o
   nome do arquivo vem do meta da cerca: ```typescript titulo=lib/email.ts */

function textoDe(no: React.ReactNode): string {
  if (typeof no === "string" || typeof no === "number") return String(no);
  if (Array.isArray(no)) return no.map(textoDe).join("");
  if (isValidElement(no)) {
    const props = no.props as { children?: React.ReactNode };
    return textoDe(props.children);
  }
  return "";
}

/* Dois "## O que doeu" no mesmo post gerariam dois ids iguais — HTML inválido
   e âncora que só acha o primeiro. O sufixo -2, -3… desambigua. O mapa é
   por-render (vive no chamador), então posts não contaminam uns aos outros. */
function idUnico(usados: Map<string, number>, titulo: string): string {
  const base = paraSlug(titulo);
  const vistos = usados.get(base) ?? 0;
  usados.set(base, vistos + 1);
  return vistos === 0 ? base : `${base}-${vistos + 1}`;
}

/** Extrai os h2 do markdown pro índice lateral — mesma regra de id do renderer,
    inclusive a desambiguação, pra âncora e índice nunca divergirem. */
export function secoesDoMarkdown(corpo: string): { id: string; titulo: string }[] {
  const usados = new Map<string, number>();
  const secoes: { id: string; titulo: string }[] = [];
  for (const linha of corpo.split("\n")) {
    const m = /^##\s+(.+?)\s*$/.exec(linha);
    if (m) secoes.push({ id: idUnico(usados, m[1]), titulo: m[1] });
  }
  return secoes;
}

/* Os componentes são criados POR render (e não no módulo) porque o contador de
   ids precisa zerar a cada post — estado compartilhado no módulo vazaria de um
   post pro outro no mesmo processo do servidor. */
function criaComponentes(): Components {
  const usados = new Map<string, number>();

  return {
    h2({ children }) {
      const titulo = textoDe(children);
      return <h2 id={idUnico(usados, titulo)}>{children}</h2>;
    },

    /* O <pre> do markdown carrega um único <code class="language-x">. Intercepto
       no pre (e não no code) porque é aqui que dá pra substituir o bloco inteiro
       pela Janelinha sem aninhar <pre> dentro de <figure> dentro de <pre>. */
    pre({ node, children }) {
      const filho = Children.toArray(children).find(isValidElement);
      if (!filho) return <pre>{children}</pre>;

      const props = filho.props as { className?: string; children?: React.ReactNode };
      const linguagem = /language-(\S+)/.exec(props.className ?? "")?.[1] ?? "text";
      const codigo = textoDe(props.children);

      // meta da cerca (ex.: "titulo=lib/email.ts") vem no nó hast, não nas props
      const noCode = node?.children?.[0];
      const meta =
        noCode && "data" in noCode
          ? ((noCode.data as { meta?: string } | undefined)?.meta ?? "")
          : "";
      const arquivo = /(?:titulo|arquivo|title)=(\S+)/.exec(meta)?.[1];

      return <Janelinha codigo={codigo} linguagem={linguagem} arquivo={arquivo} />;
    },
  };
}

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={criaComponentes()}>
      {children}
    </ReactMarkdown>
  );
}

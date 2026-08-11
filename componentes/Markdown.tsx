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
   nome do arquivo vem do meta da cerca: ```typescript título=lib/email.ts */

function textoDe(no: React.ReactNode): string {
  if (typeof no === "string" || typeof no === "number") return String(no);
  if (Array.isArray(no)) return no.map(textoDe).join("");
  if (isValidElement(no)) {
    const props = no.props as { children?: React.ReactNode };
    return textoDe(props.children);
  }
  return "";
}

/** Extrai os h2 do markdown pro índice lateral — mesma regra de id do renderer. */
export function secoesDoMarkdown(corpo: string): { id: string; titulo: string }[] {
  const secoes: { id: string; titulo: string }[] = [];
  for (const linha of corpo.split("\n")) {
    const m = /^##\s+(.+?)\s*$/.exec(linha);
    if (m) secoes.push({ id: paraSlug(m[1]), titulo: m[1] });
  }
  return secoes;
}

const componentes: Components = {
  h2({ children }) {
    const titulo = textoDe(children);
    return <h2 id={paraSlug(titulo)}>{children}</h2>;
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

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={componentes}>
      {children}
    </ReactMarkdown>
  );
}

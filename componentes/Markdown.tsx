import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* Renderiza o corpo do post.
   Sem rehype-raw de propósito: HTML cru dentro do Markdown não é interpretado.
   Um agente escreve parte desses textos, e mesmo passando pela fila de
   aprovação, a leitura fica mais fácil se HTML injetado simplesmente não
   executar. O estilo vem da classe .prosa em globals.css. */

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prosa">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

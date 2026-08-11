import { BotaoCopiar } from "@/componentes/post/BotaoCopiar";
import { realcar } from "@/lib/realce";

/* A "janelinha" de código das telas aprovadas: topo com nome de arquivo,
   linguagem e botão de copiar; corpo colorido pelo Shiki no servidor.

   dangerouslySetInnerHTML aqui é seguro por construção: o HTML vem do Shiki,
   que ESCAPA o conteúdo do código — nenhum byte do post vira markup. A entrada
   é conteúdo do próprio dono (banco com RLS), e mesmo assim passa escapada. */

export function Janelinha({
  codigo, linguagem, arquivo,
}: {
  codigo: string;
  linguagem: string;
  arquivo?: string;
}) {
  const html = realcar(codigo, linguagem);

  return (
    <figure className="codigo">
      <div className="codigo-topo">
        {arquivo && <span className="arquivo">{arquivo}</span>}
        <span className="lang">{linguagem}</span>
        <BotaoCopiar codigo={codigo} />
      </div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </figure>
  );
}

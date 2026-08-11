import Link from "next/link";
import { notFound } from "next/navigation";
import { Editor } from "@/componentes/painel/Editor";
import { ItemFila } from "@/componentes/painel/ItemFila";
import { Bloco } from "@/componentes/painel/Pecas";
import { buscarPostPorId } from "@/lib/painel";
import { dataHora } from "@/lib/formato";

export default async function PaginaEditor(props: PageProps<"/painel/escrever/[id]">) {
  const { id } = await props.params;
  const post = await buscarPostPorId(id);
  if (!post) notFound();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href="/painel/escrever" className="font-mono text-xs text-suave hover:text-tinta">
          ← todos os textos
        </Link>
        <div className="flex-1" />
        <span className="font-mono text-[11px] text-suave">
          criado {dataHora(post.criado_em)} · {post.revisoes}{" "}
          {post.revisoes === 1 ? "revisão" : "revisões"}
        </span>
        {post.estado === "publicado" && (
          <Link
            href={`/registro/${post.slug}`}
            className="font-mono text-[11px] text-acento hover:underline"
          >
            ver no jardim ↗
          </Link>
        )}
      </div>

      {/* A decisão de estado fica junto do texto de propósito: é lendo que você
          decide se aprova, e obrigar a voltar pra outra tela pra isso é atrito. */}
      <Bloco titulo="estado e decisão">
        <ul>
          <ItemFila post={post} />
        </ul>
      </Bloco>

      {/* key força remount ao trocar de post: o corpo vive em useState e, sem
          isso, navegar editor→editor manteria o texto do post anterior */}
      <Editor key={post.id} post={post} />
    </div>
  );
}

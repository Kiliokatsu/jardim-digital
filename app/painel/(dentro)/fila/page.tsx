import { ItemFila } from "@/componentes/painel/ItemFila";
import { Bloco, Vazio } from "@/componentes/painel/Pecas";
import { fila } from "@/lib/painel";
import type { Estado } from "@/lib/tipos";

/* A fila. Agrupada por estado, na ordem em que exige decisão sua.

   O caminho é sempre rascunho → em revisão → aprovado → publicado, e o
   trigger fn_interlock_publicacao no banco recusa qualquer atalho. Vale pra
   você e vale pro agente: nenhum texto sobe sem que alguém tenha aprovado. */

const GRUPOS: { estado: Estado; titulo: string; nota: string }[] = [
  {
    estado: "em_revisao",
    titulo: "esperando sua decisão",
    nota: "Aprovar não publica. Só habilita publicar.",
  },
  {
    estado: "aprovado",
    titulo: "aprovados, prontos pra publicar",
    nota: "Já passaram por você. Publicar daqui é um clique.",
  },
  {
    estado: "rascunho",
    titulo: "rascunhos",
    nota: "Ainda não pediram nada. Escreva e mande pra revisão quando quiser.",
  },
  {
    estado: "rejeitado",
    titulo: "rejeitados",
    nota: "Ficam guardados com a nota da recusa — dá pra reabrir a qualquer momento.",
  },
];

export default async function Fila() {
  const itens = await fila();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Fila de aprovação</h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-suave">
          Todo texto — seu ou de agente — entra aqui e só sai publicado depois de aprovado.
          Essa regra está no banco, num trigger, e não só nesta tela: se um agente com a chave
          tentar publicar direto, o Postgres recusa.
        </p>
      </div>

      {itens.length === 0 ? (
        <Vazio>Fila vazia. Nada escrito fora do ar.</Vazio>
      ) : (
        GRUPOS.map((g) => {
          const doGrupo = itens.filter((p) => p.estado === g.estado);
          if (doGrupo.length === 0) return null;
          return (
            <Bloco
              key={g.estado}
              titulo={`${g.titulo} · ${doGrupo.length}`}
            >
              <p className="mb-3 text-[13px] text-suave">{g.nota}</p>
              <ul className="flex flex-col gap-3">
                {doGrupo.map((p) => (
                  <ItemFila key={p.id} post={p} />
                ))}
              </ul>
            </Bloco>
          );
        })
      )}
    </div>
  );
}

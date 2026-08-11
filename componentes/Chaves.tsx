"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/* As chaves do cabeçalho. Cada uma escreve um atributo no <html> e guarda a
   escolha no localStorage — mesma mecânica do protótipo, só que tipada.

   A fonte da verdade é o atributo no <html>, e não um estado do React: o script
   inline do layout já escreveu lá antes da primeira pintura, e o CSS lê de lá.
   Duplicar isso num useState criaria duas verdades que saem de sincronia.

   Por isso useSyncExternalStore com MutationObserver, em vez de useEffect: o
   atributo é estado externo e a gente se inscreve nele. De brinde, duas chaves
   do mesmo atributo em telas diferentes ficam alinhadas sozinhas.

   O prefixo `use` fica em inglês mesmo com o resto em português — é o que o
   React usa pra reconhecer um hook, e o lint depende disso. */
function useAtributo(atributo: string, padrao: string) {
  const inscrever = useCallback(
    (avisar: () => void) => {
      const observador = new MutationObserver(avisar);
      observador.observe(document.documentElement, {
        attributes: true,
        attributeFilter: [atributo],
      });
      return () => observador.disconnect();
    },
    [atributo],
  );

  const ler = useCallback(
    () => document.documentElement.getAttribute(atributo) ?? padrao,
    [atributo, padrao],
  );

  // no servidor não existe <html> pra consultar: vale o padrão
  const lerNoServidor = useCallback(() => padrao, [padrao]);

  const valor = useSyncExternalStore(inscrever, ler, lerNoServidor);

  const trocar = useMemo(
    () => (novo: string) => {
      document.documentElement.setAttribute(atributo, novo);
      try {
        localStorage.setItem(atributo, novo);
      } catch {
        /* modo privado sem storage: a escolha vale só nesta navegação */
      }
    },
    [atributo],
  );

  return [valor, trocar] as const;
}

type Opcao = { v: string; rotulo: string; titulo?: string };

function Grupo({
  rotulo, opcoes, valor, ao,
}: {
  rotulo: string;
  opcoes: Opcao[];
  valor: string;
  ao: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-[10px] font-medium uppercase tracking-[0.14em] text-suave sm:block">
        {rotulo}
      </span>
      <div
        role="group"
        aria-label={rotulo}
        className="flex items-center gap-0.5 rounded-full border border-linha bg-superficie-2 p-[3px]"
      >
        {opcoes.map((o) => {
          const ativo = valor === o.v;
          return (
            <button
              key={o.v}
              type="button"
              title={o.titulo}
              aria-pressed={ativo}
              onClick={() => ao(o.v)}
              className={[
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                ativo
                  ? "bg-acento text-white"
                  : "text-suave hover:text-tinta",
              ].join(" ")}
            >
              {o.rotulo}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ChaveTema() {
  const [tema, trocar] = useAtributo("data-theme", "dark");
  return (
    <Grupo
      rotulo="Tema"
      valor={tema}
      ao={trocar}
      opcoes={[
        { v: "dark", rotulo: "Escuro" },
        { v: "light", rotulo: "Claro" },
      ]}
    />
  );
}

export function ChavePersona() {
  const [persona, trocar] = useAtributo("data-persona", "pro");
  return (
    <Grupo
      rotulo="Persona"
      valor={persona}
      ao={trocar}
      opcoes={[
        { v: "pro", rotulo: "Profissional" },
        {
          v: "caos",
          rotulo: "Caos",
          titulo: "Parado de propósito — hoje só existe o esqueleto de cor",
        },
      ]}
    />
  );
}

/**
 * O diferencial da casa. Liga a instrumentação do site pra quem estiver
 * olhando: cada elemento passa a mostrar a coluna que o alimenta, e a fita de
 * telemetria aparece. É o toggle "Campos" do protótipo, crescido.
 */
export function ChaveEngenheiro() {
  const [eng, trocar] = useAtributo("data-eng", "off");
  const ligado = eng === "on";

  return (
    <button
      type="button"
      aria-pressed={ligado}
      onClick={() => trocar(ligado ? "off" : "on")}
      title="Mostra o schema por trás de cada elemento da tela"
      className={[
        "group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        ligado
          ? "border-acento bg-acento-fraco text-acento"
          : "border-linha bg-superficie-2 text-suave hover:text-tinta",
      ].join(" ")}
    >
      <span
        aria-hidden
        className={[
          "relative h-3 w-6 rounded-full transition-colors",
          ligado ? "bg-acento" : "bg-linha",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-2 w-2 rounded-full bg-white transition-all",
            ligado ? "left-3.5" : "left-0.5",
          ].join(" ")}
        />
      </span>
      Modo engenheiro
    </button>
  );
}

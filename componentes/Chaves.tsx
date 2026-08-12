"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/* As chaves do cabeçalho. Cada uma escreve um atributo no <html> e guarda a
   escolha no localStorage — mesma mecânica do protótipo, só que tipada.

   A fonte da verdade é o atributo no <html>, e não um estado do React: o
   script inline do layout já escreveu lá antes da primeira pintura, e o CSS
   lê de lá. Duplicar isso num useState criaria duas verdades que saem de
   sincronia.

   Por isso useSyncExternalStore com MutationObserver, em vez de useEffect: o
   atributo é estado externo e a gente se inscreve nele. De brinde, duas
   chaves do mesmo atributo em telas diferentes ficam alinhadas sozinhas —
   e o dragão, que observa o mesmo atributo, nem sabe que este arquivo existe.

   O prefixo `use` fica em inglês mesmo com o resto em português — é o que o
   React usa pra reconhecer um hook, e o lint depende disso.

   Exportado porque o dragão do caos (DEC-0010) observa o mesmo atributo
   data-persona pra decidir se monta — mesma fonte da verdade, mesma mecânica. */
export function useAtributo(atributo: string, chaveStorage: string, padrao: string) {
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
        // a chave de storage é curta ("tema"), não o nome do atributo:
        // é o contrato que o script inline do layout lê na volta
        localStorage.setItem(chaveStorage, novo);
      } catch {
        /* modo privado sem storage: a escolha vale só nesta navegação */
      }
    },
    [atributo, chaveStorage],
  );

  return [valor, trocar] as const;
}

type Opcao = { v: string; rotulo: string; titulo?: string };

/* A pílula de dois segmentos das telas aprovadas (.chave). aria-pressed em
   cada segmento diz ao leitor de tela qual lado está ativo. */
function Chave({
  rotulo,
  opcoes,
  valor,
  ao,
}: {
  rotulo: string;
  opcoes: Opcao[];
  valor: string;
  ao: (v: string) => void;
}) {
  return (
    <div className="chave" role="group" aria-label={rotulo}>
      {opcoes.map((o) => (
        <button
          key={o.v}
          type="button"
          title={o.titulo}
          aria-pressed={valor === o.v}
          onClick={() => ao(o.v)}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

export function ChaveTema() {
  const [tema, trocar] = useAtributo("data-tema", "tema", "escuro");
  return (
    <Chave
      rotulo="Tema"
      valor={tema}
      ao={trocar}
      opcoes={[
        { v: "escuro", rotulo: "Escuro" },
        { v: "claro", rotulo: "Claro" },
      ]}
    />
  );
}

export function ChavePersona() {
  const [persona, trocar] = useAtributo("data-persona", "persona", "normal");
  return (
    <Chave
      rotulo="Persona"
      valor={persona}
      ao={trocar}
      opcoes={[
        { v: "normal", rotulo: "Normal" },
        {
          v: "caos",
          rotulo: "Caos",
          titulo: "O mesmo site, com o fogo aceso — e um dragão atrás do cursor",
        },
      ]}
    />
  );
}

/**
 * O diferencial da casa. Liga a instrumentação do site pra quem estiver
 * olhando: os blocos .so-engenheiro aparecem e cada elemento com data-campo
 * mostra a coluna que o alimenta.
 */
export function ChaveEngenheiro() {
  const [engenheiro, trocar] = useAtributo("data-engenheiro", "engenheiro", "0");
  return (
    <Chave
      rotulo="Modo engenheiro"
      valor={engenheiro}
      ao={trocar}
      opcoes={[
        { v: "0", rotulo: "Visitante" },
        {
          v: "1",
          rotulo: "Engenheiro",
          titulo: "Mostra o schema por trás de cada elemento da tela",
        },
      ]}
    />
  );
}

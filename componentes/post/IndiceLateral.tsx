"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export type SecaoIndice = { id: string; titulo: string };

/* Índice lateral do post. Acompanha onde a leitura está e marca a seção
   atual — some abaixo de ~1100px por CSS (.indice), sem JavaScript.

   IntersectionObserver em vez de medir no scroll: o navegador avisa quando
   um título cruza a faixa de leitura, e a faixa (-15% em cima, -75% embaixo)
   faz "atual" significar "o título logo acima do que o olho está lendo",
   não "qualquer título visível". */
export function IndiceLateral({ secoes }: { secoes: SecaoIndice[] }) {
  const [atual, setAtual] = useState<string | null>(null);

  // A URL só existe no navegador. useSyncExternalStore lê um valor externo ao
  // React com snapshot de servidor (null) — sem setState em effect e sem
  // divergência de hidratação. A URL de um post não muda durante a leitura,
  // então a inscrição é um no-op.
  const urlAtual = useSyncExternalStore(
    () => () => {},
    () => window.location.href,
    () => null,
  );

  useEffect(() => {
    const alvos = secoes
      .map((secao) => document.getElementById(secao.id))
      .filter((el): el is HTMLElement => el !== null);
    if (alvos.length === 0) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) setAtual(entrada.target.id);
        }
      },
      { rootMargin: "-15% 0px -75% 0px" },
    );
    alvos.forEach((el) => observador.observe(el));
    return () => observador.disconnect();
  }, [secoes]);

  const linkCompartilhar = urlAtual
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(urlAtual)}`
    : null;

  return (
    <aside className="indice" aria-label="Índice do registro">
      <p className="indice-titulo">Neste registro</p>
      <ol>
        {secoes.map((secao) => (
          <li key={secao.id}>
            <a
              href={`#${secao.id}`}
              className={atual === secao.id ? "atual" : undefined}
              aria-current={atual === secao.id ? "true" : undefined}
            >
              {secao.titulo}
            </a>
          </li>
        ))}
      </ol>
      <div className="indice-pe">
        {linkCompartilhar ? (
          <a
            href={linkCompartilhar}
            target="_blank"
            rel="noopener noreferrer"
          >
            Compartilhar no LinkedIn
          </a>
        ) : null}
      </div>
    </aside>
  );
}

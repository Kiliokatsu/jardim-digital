"use client";

import { useSyncExternalStore } from "react";

/* O único interruptor que sobrou no header (DEC-0021): claro/escuro.
   A fonte da verdade é o atributo data-tema no <html> — o mesmo que o
   script inline do layout restaura antes da primeira pintura. O atributo
   é estado EXTERNO ao React, então a leitura passa por
   useSyncExternalStore: o MutationObserver avisa quando ele muda e o
   servidor responde null (não sabe o tema do visitante — chutar geraria
   divergência de hidratação). Quem pinta é o CSS, pelas variáveis. */

type Tema = "escuro" | "claro";

function assinaTema(avisar: () => void): () => void {
  const observador = new MutationObserver(avisar);
  observador.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-tema"],
  });
  return () => observador.disconnect();
}

function lerTema(): Tema {
  return document.documentElement.getAttribute("data-tema") === "claro"
    ? "claro"
    : "escuro";
}

export function AlternadorTema() {
  const tema = useSyncExternalStore<Tema | null>(assinaTema, lerTema, () => null);

  function alternar() {
    const novo: Tema = lerTema() === "claro" ? "escuro" : "claro";
    document.documentElement.setAttribute("data-tema", novo);
    try {
      localStorage.setItem("tema", novo);
    } catch {
      /* navegação privada sem storage: o tema vale só até o refresh */
    }
  }

  return (
    <button
      type="button"
      className="chave-tema"
      onClick={alternar}
      aria-label={tema === "claro" ? "Mudar para o tema escuro" : "Mudar para o tema claro"}
    >
      {/* antes da hidratação o rótulo é neutro — evita piscar o errado */}
      {tema === null ? "tema" : tema === "claro" ? "escuro" : "claro"}
    </button>
  );
}

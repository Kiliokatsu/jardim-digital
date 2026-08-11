"use client";

import { useEffect, useRef } from "react";

/* Barra de progresso de leitura.

   Duas decisões de custo aqui:
   - transform: scaleX em vez de width: o compositor anima transform sem
     recalcular layout; animar width forçaria reflow a cada quadro.
   - o scroll só AGENDA a medição via requestAnimationFrame: eventos de
     scroll disparam mais rápido que a tela pinta, e medir mais de uma vez
     por quadro é trabalho jogado fora. */
export function BarraProgresso() {
  const referencia = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const barra = referencia.current;
    if (!barra) return;

    // O artigo é a régua do progresso; sem ele, vale a página inteira.
    const artigo = document.querySelector<HTMLElement>(".corpo");
    let quadro: number | null = null;

    const medir = () => {
      quadro = null;
      const inicio = artigo ? artigo.offsetTop : 0;
      const altura = artigo
        ? artigo.offsetHeight
        : document.documentElement.scrollHeight;
      const fim = inicio + altura - window.innerHeight;
      const progresso = (window.scrollY - inicio) / Math.max(fim - inicio, 1);
      const preso = Math.min(Math.max(progresso, 0), 1);
      barra.style.transform = `scaleX(${preso})`;
    };

    const agendar = () => {
      if (quadro === null) quadro = requestAnimationFrame(medir);
    };

    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar);
    medir();

    return () => {
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
      if (quadro !== null) cancelAnimationFrame(quadro);
    };
  }, []);

  return <div ref={referencia} className="progresso" aria-hidden="true" />;
}

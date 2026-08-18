"use client";

import { useEffect } from "react";

/* O aviso do caos contido (DEC-0011).

   Aparece quando alguém LIGA o caos com o sistema pedindo menos movimento —
   a regra de acessibilidade continua mandando (o dragão não monta), mas
   deixa de ser silenciosa: quem pediu o espetáculo fica sabendo por que ele
   não veio e onde se muda isso.

   role="status": o leitor de tela anuncia sem interromper o que estiver
   fazendo. É aviso, não bloqueio — a página continua inteira utilizável. */

const SEGUNDOS_NA_TELA = 14;

export function AvisoContido({ aoFechar }: { aoFechar: () => void }) {
  // some sozinho: aviso que exige ação vira modal disfarçado
  useEffect(() => {
    const relogio = setTimeout(aoFechar, SEGUNDOS_NA_TELA * 1000);
    return () => clearTimeout(relogio);
  }, [aoFechar]);

  return (
    <div className="aviso-caos" role="status">
      <p>
        <strong>Caos contido:</strong> seu sistema está configurado para reduzir
        movimento, então o dragão e os efeitos animados ficam desligados. Para o
        caos inteiro, reative as animações — no Windows: Configurações →
        Acessibilidade → Efeitos visuais → <em>Efeitos de animação</em>.
      </p>
      {/* sem aria-label: o texto visível É o nome acessível — rótulo falado
          diferente do escrito quebra comando de voz (WCAG 2.5.3) */}
      <button type="button" onClick={aoFechar}>
        entendi
      </button>
    </div>
  );
}

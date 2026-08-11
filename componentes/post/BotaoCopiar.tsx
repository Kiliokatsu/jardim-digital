"use client";

import { useEffect, useRef, useState } from "react";

const FEEDBACK_MS = 2000;

/* Copia o texto para a área de transferência. O caminho principal é a
   Clipboard API; se ela não existir (navegador antigo) ou for negada
   (contexto sem HTTPS), cai no truque do textarea invisível + execCommand.
   Só reporta sucesso se algum dos dois de fato copiou. */
async function copiarParaAreaDeTransferencia(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    // fora do fluxo pra não causar scroll nem flash visual
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let copiou = false;
    try {
      copiou = document.execCommand("copy");
    } catch {
      copiou = false;
    }
    area.remove();
    return copiou;
  }
}

/* O botão da janelinha de código. Recebe o código cru como prop — não
   raspa o DOM — porque os números de linha são desenhados por CSS e o
   texto verdadeiro quem tem é quem renderizou o bloco. */
export function BotaoCopiar({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);
  const temporizador = useRef<number | null>(null);

  // o timeout de feedback não pode disparar depois do unmount
  useEffect(() => {
    return () => {
      if (temporizador.current !== null) {
        window.clearTimeout(temporizador.current);
      }
    };
  }, []);

  async function aoClicar() {
    const copiou = await copiarParaAreaDeTransferencia(codigo);
    if (!copiou) return;
    setCopiado(true);
    if (temporizador.current !== null) {
      window.clearTimeout(temporizador.current);
    }
    temporizador.current = window.setTimeout(
      () => setCopiado(false),
      FEEDBACK_MS,
    );
  }

  return (
    <button
      type="button"
      className={copiado ? "copiar ok" : "copiar"}
      onClick={aoClicar}
      aria-live="polite"
      aria-label={copiado ? "Código copiado" : "Copiar código"}
    >
      {copiado ? "Copiado" : "Copiar"}
    </button>
  );
}

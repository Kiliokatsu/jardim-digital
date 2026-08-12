import type { Metadata } from "next";

/* Casca do painel (DEC-0013). Fora do grupo (jardim) de propósito: sem
   cabeçalho público, sem rodapé, sem dragão — console é console. A classe
   .painel-raiz é a que o CSS reservou desde a reconstrução: raio mais
   apertado, largura maior, densidade de supervisão. */

export const metadata: Metadata = {
  title: "Painel",
  // rota privada: não existe para buscador, e nenhum link público aponta pra cá
  robots: { index: false, follow: false },
};

export default function LayoutPainel({ children }: { children: React.ReactNode }) {
  return <div className="painel-raiz min-h-dvh">{children}</div>;
}

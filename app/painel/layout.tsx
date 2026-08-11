import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel",
  // painel não é conteúdo: mantém fora de índice de busca
  robots: { index: false, follow: false },
};

/* Casca externa do painel. Só troca os tokens de densidade (.painel-raiz) e
   NÃO verifica sessão — a tela de login mora aqui dentro, e um guarda neste
   nível redirecionaria o login pro login pra sempre.

   Quem guarda é app/painel/(dentro)/layout.tsx. */

export default function LayoutExternoPainel({ children }: { children: React.ReactNode }) {
  return <div className="painel-raiz flex min-h-dvh flex-col">{children}</div>;
}

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Jardim Digital — Vinícius Henrique",
    template: "%s · Jardim Digital",
  },
  description:
    "Engenharia de automação, orquestração de IA e as decisões técnicas que eu tomei " +
    "errado antes de tomar certo. Build in public, com a cozinha à mostra.",
  authors: [{ name: "Vinícius Henrique" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Jardim Digital",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B1220" },
    { media: "(prefers-color-scheme: light)", color: "#F6F7F9" },
  ],
};

/* Restaura tema, persona e Modo Engenheiro ANTES da primeira pintura.
   Se isso rodasse num efeito de React, a página apareceria no tema errado e
   piscaria pro certo — e piscada de tema é a coisa mais barata de evitar e a
   mais irritante de ver. */
const RESTAURA_PREFERENCIAS = `
(function(){
  try {
    var r = document.documentElement;
    var g = function(k, padrao) { return localStorage.getItem(k) || padrao; };
    var temaSalvo = localStorage.getItem('data-theme');
    if (!temaSalvo) {
      temaSalvo = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    r.setAttribute('data-theme', temaSalvo);
    r.setAttribute('data-persona', g('data-persona', 'pro'));
    r.setAttribute('data-eng', g('data-eng', 'off'));
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" data-theme="dark" data-persona="pro" data-eng="off" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: RESTAURA_PREFERENCIAS }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}

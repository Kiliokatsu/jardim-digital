import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/* Fontes via next/font: hospedadas no próprio domínio no build, sem requisição
   para terceiro em tempo de execução (DEC-024). O subconjunto é o `latin` — o
   `latin-ext` sozinho não tem A–Z e a fonte "carrega" sem desenhar nada. */
const fonteTexto = Inter({
  subsets: ["latin"],
  variable: "--fonte-texto",
  display: "swap",
});
const fonteMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--fonte-mono",
  display: "swap",
});

const NOME_COMPLETO = "Vinícius Henrique Teles Farias";
const URL_SITE = "https://kiliokatsu.com.br";

/* DEC-008: a marca é Kiliokatsu, mas um recrutador tem que cruzar o site com o
   LinkedIn sem esforço. Título no formato combinado, nome real no OG, e o
   JSON-LD logo abaixo fecham os quatro itens da mitigação. */
export const metadata: Metadata = {
  metadataBase: new URL(URL_SITE),
  title: {
    default: "Kiliokatsu — Vinícius Henrique",
    template: "%s — Kiliokatsu",
  },
  description:
    "Construo sistemas sólidos e mostro a cozinha pegando fogo: as decisões técnicas " +
    "que eu tomei errado antes de tomar certo, com o que eu ganhei e o que eu perdi.",
  authors: [{ name: NOME_COMPLETO }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Kiliokatsu",
    title: `Kiliokatsu — ${NOME_COMPLETO}`,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B1220" },
    { media: "(prefers-color-scheme: light)", color: "#F7F8FB" },
  ],
};

/* DEC-008, item do JSON-LD: Person com o nome real e a marca como
   alternateName. É o que deixa o Google ligar kiliokatsu.com.br à pessoa. */
const PESSOA_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Person",
  name: NOME_COMPLETO,
  alternateName: "Kiliokatsu",
  url: URL_SITE,
  jobTitle: "Desenvolvedor de sistemas",
  address: { "@type": "PostalAddress", addressLocality: "Goiânia", addressRegion: "GO" },
});

/* Restaura tema, persona e Modo Engenheiro ANTES da primeira pintura.
   Num efeito de React a página nasceria no tema errado e piscaria pro certo.
   Contrato de atributos (DEC-003-b): data-tema escuro|claro, data-persona
   normal|caos, data-engenheiro 0|1 — o CSS e as Chaves seguem estes nomes. */
const RESTAURA_PREFERENCIAS = `
(function(){
  try {
    var r = document.documentElement;
    var g = function(k, padrao) { return localStorage.getItem(k) || padrao; };
    r.setAttribute('data-tema', g('tema', 'escuro'));
    r.setAttribute('data-persona', g('persona', 'normal'));
    r.setAttribute('data-engenheiro', g('engenheiro', '0'));
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-tema="escuro"
      data-persona="normal"
      data-engenheiro="0"
      className={`${fonteTexto.variable} ${fonteMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: RESTAURA_PREFERENCIAS }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: PESSOA_JSON_LD }}
        />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}

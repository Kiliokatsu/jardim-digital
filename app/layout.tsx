import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

/* Fontes via next/font: hospedadas no próprio domínio no build, sem requisição
   para terceiro em tempo de execução. A tríade da v2 (DEC-0021):
   Fraunces é a voz (títulos e corpo de leitura, com a itálica da assinatura),
   Inter é a interface, IBM Plex Mono é o metadado. */
const fonteDisplay = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--fonte-display",
  display: "swap",
});
const fonteTexto = Inter({
  subsets: ["latin"],
  variable: "--fonte-texto",
  display: "swap",
});
const fonteMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
    { media: "(prefers-color-scheme: dark)", color: "#09090B" },
    { media: "(prefers-color-scheme: light)", color: "#FAF8F5" },
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

/* Restaura o tema ANTES da primeira pintura — num efeito de React a página
   nasceria no tema errado e piscaria pro certo. Primeiro acesso respeita o
   prefers-color-scheme do sistema (espec v2 §3); depois vale a escolha salva.
   O caos saiu do contrato (DEC-0021): só data-tema resta no <html>. */
const RESTAURA_TEMA = `
(function(){
  try {
    var salvo = localStorage.getItem('tema');
    var sistema = window.matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'escuro';
    document.documentElement.setAttribute('data-tema', salvo || sistema);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-tema="escuro"
      className={`${fonteDisplay.variable} ${fonteTexto.variable} ${fonteMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: RESTAURA_TEMA }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: PESSOA_JSON_LD }}
        />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}

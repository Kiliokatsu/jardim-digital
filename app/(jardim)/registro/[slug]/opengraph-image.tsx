import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buscarPost } from "@/lib/consultas";

/* A OG image dinâmica (espec §6.4): post não tem capa obrigatória, então a
   imagem de compartilhamento é GERADA — fundo escuro da marca, selo à
   esquerda, título em Fraunces, domínio no acento. O arquivo segue a
   convenção do App Router: existir aqui já pendura o og:image na página.

   Duas degradações deliberadas (mesmo contrato das consultas — degradar,
   nunca derrubar):
   - as fontes vêm do Google na hora de gerar; sem rede (build local do
     testar-site), a imagem sai na fonte padrão do gerador em vez de falhar;
   - o selo é lido de public/ pelo disco; se o arquivo não estiver traçado
     no serverless, a imagem sai sem selo. */

export const revalidate = 300;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Kiliokatsu — registro do blog";

/* O CSS do Google devolve TTF quando o pedido não parece navegador moderno
   (sem User-Agent de browser) — e TTF é o que o gerador aceita; woff2 não. */
async function fonteRemota(cssUrl: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(cssUrl)).text();
    const url = /src: url\((.+?)\) format\('(?:truetype|opentype)'\)/.exec(css)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}

async function seloDataUri(): Promise<string | null> {
  try {
    const svg = await readFile(
      path.join(process.cwd(), "public", "marca", "selo", "selo-escuro.svg"),
    );
    return `data:image/svg+xml;base64,${svg.toString("base64")}`;
  } catch {
    return null;
  }
}

const LIMITE_TITULO = 110;

export default async function ImagemOg({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, fraunces, plexMono, selo] = await Promise.all([
    buscarPost(slug),
    fonteRemota("https://fonts.googleapis.com/css2?family=Fraunces:wght@600"),
    fonteRemota("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500"),
    seloDataUri(),
  ]);

  const titulo = post
    ? post.titulo.length > LIMITE_TITULO
      ? `${post.titulo.slice(0, LIMITE_TITULO)}…`
      : post.titulo
    : "Kiliokatsu";
  const overline = post ? `registro · ${post.portal}` : "kiliokatsu.com.br";

  const fontes = [
    ...(fraunces
      ? [{ name: "Fraunces", data: fraunces, weight: 600 as const, style: "normal" as const }]
      : []),
    ...(plexMono
      ? [{ name: "IBM Plex Mono", data: plexMono, weight: 500 as const, style: "normal" as const }]
      : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: 72,
          backgroundColor: "#09090B",
        }}
      >
        {selo && (
          // eslint-disable-next-line @next/next/no-img-element -- gerador de OG não usa next/image
          <img src={selo} width={230} height={230} alt="" />
        )}

        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 30 }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: "#71717A",
              fontFamily: plexMono ? "IBM Plex Mono" : undefined,
            }}
          >
            {overline}
          </div>

          <div
            style={{
              fontSize: 58,
              lineHeight: 1.15,
              letterSpacing: -1,
              color: "#F4F4F5",
              fontFamily: fraunces ? "Fraunces" : undefined,
              fontWeight: 600,
            }}
          >
            {titulo}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 46, height: 4, backgroundColor: "#FF2E4C" }} />
            <div
              style={{
                fontSize: 24,
                color: "#FF2E4C",
                fontFamily: plexMono ? "IBM Plex Mono" : undefined,
              }}
            >
              kiliokatsu.com.br
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: fontes.length > 0 ? fontes : undefined },
  );
}

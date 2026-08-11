import type { NextConfig } from "next";

/* Cabeçalhos de segurança que não dependem de nada além do próprio site.
   CSP completa ficou de fora por decisão: Next injeta script inline na
   hidratação e uma CSP séria exige nonce por requisição — complexidade que
   ainda não sei defender. Estes quatro são ganho real sem efeito colateral. */
const CABECALHOS_SEGURANCA = [
  // o site não tem motivo pra rodar dentro de iframe de terceiro (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // navegador não deve "adivinhar" content-type diferente do declarado
  { key: "X-Content-Type-Options", value: "nosniff" },
  // link externo não recebe a URL completa de onde o visitante estava
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // APIs de dispositivo que este site nunca usa ficam negadas de saída
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: CABECALHOS_SEGURANCA }];
  },
};

export default nextConfig;

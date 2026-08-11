import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/* proxy.ts — no Next 16 é este o nome do que antes era middleware.ts.
   Roda antes de renderizar qualquer rota e faz três coisas:

     1. Renova o cookie de sessão do Supabase (senão a sessão expira no meio
        do uso e o painel te derruba sem aviso).
     2. Traduz o subdomínio: painel.seudominio.com → /painel/*, que é a forma
        que você pediu. Sem depender de o domínio existir ainda.
     3. Barra visitante deslogado no painel — mas isso aqui é só o portão
        rápido, pra não gastar renderização. A verificação que vale é a do
        layout do painel, que pergunta ao servidor de auth.

   O guia do Next avisa que este arquivo pode ir pra CDN e não deve depender de
   módulo compartilhado, então ele lê o ambiente direto em vez de importar lib/. */

const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const CHAVE_SB = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Subdomínios que apontam pro painel. Em dev, use painel.localhost:3000. */
const SUBDOMINIOS_PAINEL = new Set(["painel", "config"]);

function ehHostDoPainel(host: string): boolean {
  const primeiro = host.split(":")[0].split(".")[0].toLowerCase();
  return SUBDOMINIOS_PAINEL.has(primeiro);
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get("host") ?? "";

  // ── 1. subdomínio vira prefixo de rota ──
  if (ehHostDoPainel(host) && !url.pathname.startsWith("/painel")) {
    url.pathname = `/painel${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  const caminho = url.pathname;
  const noPainel = caminho === "/painel" || caminho.startsWith("/painel/");
  const naTelaDeLogin = caminho.startsWith("/painel/login");

  // Sem banco configurado não há sessão pra renovar nem como autenticar.
  // Em desenvolvimento deixa passar (o painel avisa que está em demonstração);
  // em produção, painel sem banco é painel sem porta — então tranca.
  if (!URL_SB || !CHAVE_SB) {
    if (noPainel && process.env.NODE_ENV === "production") {
      return new NextResponse("Painel indisponível: banco não configurado.", { status: 503 });
    }
    return NextResponse.next();
  }

  // ── 2. renovação da sessão ──
  let resposta = NextResponse.next({ request });

  const sb = createServerClient(URL_SB, CHAVE_SB, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesParaGravar) {
        for (const { name, value } of cookiesParaGravar) {
          request.cookies.set(name, value);
        }
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of cookiesParaGravar) {
          resposta.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() e não getSession(): getSession confia no cookie, getUser pergunta.
  const { data } = await sb.auth.getUser();

  // ── 3. portão rápido ──
  if (noPainel && !naTelaDeLogin && !data.user) {
    const login = url.clone();
    login.pathname = "/painel/login";
    login.searchParams.set("de", caminho);
    return NextResponse.redirect(login);
  }

  // já logado não precisa ver a tela de login
  if (naTelaDeLogin && data.user) {
    const painel = url.clone();
    painel.pathname = "/painel";
    painel.search = "";
    return NextResponse.redirect(painel);
  }

  return resposta;
}

export const config = {
  /* Sem matcher, isto rodaria em cima de CSS, imagem e fonte — e aí o portão
     do painel bloquearia os próprios assets. A negativa abaixo evita isso. */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?|ttf|css|js|map|txt|xml)$).*)",
  ],
};

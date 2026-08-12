import Link from "next/link";
import { ChaveEngenheiro, ChavePersona, ChaveTema } from "@/componentes/Chaves";

/* Cabeçalho aprovado nas telas do pacote dragão: marca com o ponto de acento,
   os três portais, e as chaves de modo. O nome dos portais é a estrutura do
   site (DEC-001) — não é menu de conveniência, é o mapa. */

const PORTAIS = [
  { href: "/profissional", rotulo: "Profissional" },
  { href: "/tecnologia", rotulo: "Tecnologia" },
  { href: "/pessoal", rotulo: "Pessoal" },
] as const;

export function CabecalhoPublico() {
  return (
    <header className="topo">
      <div className="mx-auto flex w-full max-w-[var(--maxw)] items-center gap-6 px-6 py-4">
        <Link href="/" className="marca">
          <span className="ponto" aria-hidden />
          Kiliokatsu
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Portais (menu principal)">
          {PORTAIS.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="rounded-full px-3 py-1.5 text-sm text-suave transition-colors hover:bg-superficie-2 hover:text-tinta"
            >
              {p.rotulo}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-2.5">
          <ChaveTema />
          <span className="hidden sm:contents">
            <ChavePersona />
            <ChaveEngenheiro />
          </span>
        </div>
      </div>

      {/* navegação de portal no celular, onde a linha de cima não cabe */}
      <nav
        className="flex items-center gap-1 overflow-x-auto border-t border-linha px-6 py-2 md:hidden"
        aria-label="Portais (menu móvel)"
      >
        {PORTAIS.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="whitespace-nowrap rounded-full px-3 py-1 text-sm text-suave hover:text-tinta"
          >
            {p.rotulo}
          </Link>
        ))}
      </nav>
    </header>
  );
}

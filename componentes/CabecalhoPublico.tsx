import Link from "next/link";
import { ChaveEngenheiro, ChavePersona, ChaveTema } from "@/componentes/Chaves";

const PORTAIS = [
  { href: "/tecnologia", rotulo: "Tecnologia" },
  { href: "/pessoal", rotulo: "Pessoal" },
  { href: "/profissional", rotulo: "Profissional" },
  { href: "/grafo", rotulo: "Grafo" },
] as const;

export function CabecalhoPublico() {
  return (
    <header className="sticky top-0 z-20 border-b border-linha bg-fundo/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[var(--maxw)] items-center gap-4 px-6">
        <Link href="/" className="flex flex-none items-center gap-2.5 font-extrabold tracking-tight">
          <span
            aria-hidden
            className="h-2.5 w-2.5 flex-none rounded-full bg-acento"
            style={{ boxShadow: "var(--glow)" }}
          />
          Jardim Digital
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
          <ChaveEngenheiro />
          <span className="hidden lg:contents">
            <ChavePersona />
            <ChaveTema />
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
            className="whitespace-nowrap rounded-full px-3 py-1 text-sm text-suave"
          >
            {p.rotulo}
          </Link>
        ))}
      </nav>
    </header>
  );
}

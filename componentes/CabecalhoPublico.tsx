import Link from "next/link";
import { AlternadorTema } from "@/componentes/AlternadorTema";

/* O header da v2 (espec §5): o lockup da marca — o reflexo do k fundido ao
   wordmark — no lugar do texto puro, a navegação dos três portais, e o
   único interruptor que sobrou: claro/escuro. O par de SVGs vai inteiro
   pro DOM e o data-tema do <html> decide qual pinta (classe .marca-*). */

const PORTAIS = [
  { href: "/profissional", rotulo: "Profissional" },
  { href: "/tecnologia", rotulo: "Tecnologia" },
  { href: "/pessoal", rotulo: "Pessoal" },
] as const;

export function CabecalhoPublico() {
  return (
    <header className="border-b border-linha">
      <div className="mx-auto flex w-full max-w-[var(--maxw)] items-center gap-6 px-6 py-4">
        <Link href="/" className="flex items-center" aria-label="Kiliokatsu — página inicial">
          {/* dimensões fixadas pela classe .lockup (altura 24px, espec §11) */}
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG da marca: next/image não otimiza vetor */}
          <img src="/marca/header/header-escuro.svg" alt="kiliokatsu" className="lockup marca-escuro" />
          {/* eslint-disable-next-line @next/next/no-img-element -- par claro do mesmo lockup */}
          <img src="/marca/header/header-claro.svg" alt="" aria-hidden className="lockup marca-claro" />
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

        <AlternadorTema />
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

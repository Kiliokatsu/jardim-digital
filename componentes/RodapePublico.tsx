import Link from "next/link";
import type { Perfil } from "@/lib/tipos";
import type { Telemetria } from "@/lib/consultas";
import { dataHora } from "@/lib/formato";

/* Rodapé + fita de telemetria.

   A fita só aparece com o Modo Engenheiro ligado, e é o fecho da ideia: o
   visitante que virou a chave termina a página vendo de quando é o build e
   quantas linhas alimentaram o que ele acabou de ler. */

export function RodapePublico({
  perfil, telemetria,
}: {
  perfil: Perfil;
  telemetria: Telemetria;
}) {
  return (
    <footer className="mt-24 border-t border-linha">
      <div className="so-engenheiro border-b border-linha bg-superficie-2">
        <div className="mx-auto flex max-w-[var(--maxw)] flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3 font-mono text-[11px] text-suave">
          <span className="font-semibold text-acento">instrumentação</span>
          <span>posts <b className="text-tinta">{telemetria.posts}</b></span>
          <span>conexões <b className="text-tinta">{telemetria.conexoes}</b></span>
          <span>perenes <b className="text-tinta">{telemetria.perenes}</b></span>
          <span>portais <b className="text-tinta">{telemetria.portais}</b></span>
          <span>build <b className="text-tinta">{dataHora(telemetria.build)}</b></span>
          <span className="text-linha">|</span>
          <span>fonte: postgres via supabase, rls ligada</span>
        </div>
      </div>

      <div className="mx-auto flex max-w-[var(--maxw)] flex-col gap-5 px-6 py-10 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="font-semibold">{perfil.nome}</p>
          <p className="text-sm text-suave">{perfil.titulo}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Rodalink href="/profissional">Currículo</Rodalink>
          <Rodalink href="/grafo">Grafo</Rodalink>
          <Rodalink href={`mailto:${perfil.email}`}>E-mail</Rodalink>
        </div>
      </div>
    </footer>
  );
}

function Rodalink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-linha bg-superficie px-3.5 py-1.5 text-sm text-suave transition-colors hover:border-acento/50 hover:text-tinta"
    >
      {children}
    </Link>
  );
}

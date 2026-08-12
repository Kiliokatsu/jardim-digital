import type { Perfil, PerfilLink, Telemetria } from "@/lib/tipos";
import { dataHora } from "@/lib/formato";

/* A URL do link vem do banco. Só http/https/mailto viram href — um typo tipo
   "javascript:" no Studio não pode virar código executável no clique. */
function urlSegura(url: string): string | null {
  try {
    const analisada = new URL(url);
    return ["http:", "https:", "mailto:"].includes(analisada.protocol) ? url : null;
  } catch {
    return null;
  }
}

/* Rodapé em toda página com o nome completo — é uma das quatro mitigações da
   DEC-008: a marca é Kiliokatsu, mas o recrutador precisa cruzar o site com o
   LinkedIn sem esforço.

   A fita de instrumentação só aparece com o Modo Engenheiro ligado: quem virou
   a chave termina a página sabendo de quando é o build e de onde vem o dado. */

export function RodapePublico({
  perfil, links, telemetria,
}: {
  perfil: Perfil;
  links: PerfilLink[];
  telemetria: Telemetria;
}) {
  return (
    <footer className="mt-24 border-t border-linha">
      <div className="so-engenheiro border-b border-linha bg-superficie-2">
        <div className="mx-auto flex max-w-[var(--maxw)] flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3 font-mono text-[11px] text-suave">
          <span className="font-semibold text-acento">instrumentação</span>
          <span>posts <b className="text-tinta">{telemetria.posts}</b></span>
          <span>etiquetas <b className="text-tinta">{telemetria.etiquetas}</b></span>
          <span>tecnologia <b className="text-tinta">{telemetria.porPortal.tecnologia}</b></span>
          <span>pessoal <b className="text-tinta">{telemetria.porPortal.pessoal}</b></span>
          <span>build <b className="text-tinta">{dataHora(telemetria.build)}</b></span>
          <span className="text-linha" aria-hidden>|</span>
          <span>fonte: postgres via supabase, rls ligada</span>
        </div>
      </div>

      <div className="mx-auto flex max-w-[var(--maxw)] flex-col gap-5 px-6 py-10 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="font-semibold">{perfil.nome_completo}</p>
          <p className="text-sm text-suave">{perfil.titulo}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {links.map((l) => {
            const href = urlSegura(l.url);
            if (!href) return null;
            return (
              <a
                key={l.id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-linha bg-superficie px-3.5 py-1.5 text-sm text-suave transition-colors hover:border-acento/50 hover:text-tinta"
              >
                {l.rotulo}
              </a>
            );
          })}
          {perfil.email && (
            <a
              href={`mailto:${perfil.email}`}
              className="rounded-full border border-linha bg-superficie px-3.5 py-1.5 text-sm text-suave transition-colors hover:border-acento/50 hover:text-tinta"
            >
              E-mail
            </a>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[var(--maxw)] px-6 pb-8">
        <p className="text-xs text-suave">Kiliokatsu é o nome do site. O currículo é meu.</p>
      </div>
    </footer>
  );
}

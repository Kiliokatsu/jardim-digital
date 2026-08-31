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

/* O rodapé de dois andares da v2 (espec §5), em toda tela pública:

   1º andar — contato: o selo pequeno (nunca menor que 34px — abaixo disso o
   anel vira textura), uma chamada curta e botões-LINK diretos, sem
   formulário. O nome completo continua aqui: é uma das mitigações da
   DEC-008 (a marca é Kiliokatsu, o currículo é da pessoa).

   2º andar — instrumentação: uma linha mono, agora SEMPRE visível
   (DEC-0021 — o Modo Engenheiro saiu; contar de onde vem o dado deixou de
   ser segredo de chave e virou assinatura da casa). */

export function RodapePublico({
  perfil, links, telemetria,
}: {
  perfil: Perfil;
  links: PerfilLink[];
  telemetria: Telemetria;
}) {
  return (
    <footer className="mt-24 border-t border-linha">
      <div className="mx-auto flex max-w-[var(--maxw)] flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG da marca: next/image não otimiza vetor */}
          <img src="/marca/selo/selo-escuro.svg" alt="" aria-hidden className="selo-rodape marca-escuro" />
          {/* eslint-disable-next-line @next/next/no-img-element -- par claro do mesmo selo */}
          <img src="/marca/selo/selo-claro.svg" alt="" aria-hidden className="selo-rodape marca-claro" />
          <div>
            <p className="font-semibold">Tem um sistema pra tirar do papel?</p>
            <p className="text-sm text-suave">
              {perfil.nome_completo} · {perfil.titulo}
            </p>
          </div>
        </div>

        <div className="flex-1" />

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

      <div className="border-t border-linha">
        <div className="mx-auto flex max-w-[var(--maxw)] flex-wrap items-center gap-x-5 gap-y-1 px-6 py-3 font-mono text-[11px] text-pedra">
          <span>posts {telemetria.posts}</span>
          <span>etiquetas {telemetria.etiquetas}</span>
          <span>build {dataHora(telemetria.build)}</span>
          <span>fonte: postgres via supabase, rls ligada</span>
        </div>
      </div>

      <div className="mx-auto max-w-[var(--maxw)] px-6 pb-8 pt-3">
        <p className="text-xs text-pedra">Kiliokatsu é o nome do site. O currículo é meu.</p>
      </div>
    </footer>
  );
}

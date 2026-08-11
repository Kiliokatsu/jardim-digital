import Link from "next/link";
import { sair } from "@/app/painel/acoes";
import type { Resumo } from "@/lib/painel";

/* Cabeçalho do console de supervisão. Estética oposta à do jardim de propósito:
   monoespaçado, denso, farol de estado no canto — é sala de máquinas, não
   vitrine. */

const ROTAS = [
  { href: "/painel", rotulo: "Console" },
  { href: "/painel/fila", rotulo: "Fila" },
  { href: "/painel/escrever", rotulo: "Escrever" },
  { href: "/painel/integracoes", rotulo: "Automações" },
] as const;

const COR_SAUDE = { ok: "var(--ok)", alerta: "var(--warn)", erro: "var(--erro)" } as const;
const TEXTO_SAUDE = {
  ok: "sistema operando",
  alerta: "atenção",
  erro: "falha ativa",
} as const;

export function CabecalhoPainel({
  resumo, email,
}: {
  resumo: Resumo;
  email: string | null;
}) {
  const cor = COR_SAUDE[resumo.saude];

  return (
    <header className="sticky top-0 z-20 border-b border-linha bg-fundo">
      <div className="mx-auto flex max-w-[var(--maxw)] flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3">
        <Link href="/painel" className="flex flex-none items-center gap-2.5">
          <span
            aria-hidden
            className="h-2.5 w-2.5 flex-none rounded-full"
            style={{ background: cor, boxShadow: `0 0 10px ${cor}` }}
          />
          <span className="font-mono text-sm font-bold uppercase tracking-[0.1em]">
            JD · painel
          </span>
        </Link>

        <span className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: cor }}>
          {TEXTO_SAUDE[resumo.saude]}
        </span>

        <nav className="flex flex-wrap items-center gap-1" aria-label="Seções do painel">
          {ROTAS.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="relative rounded px-2.5 py-1 font-mono text-xs text-suave transition-colors hover:bg-superficie-2 hover:text-tinta"
            >
              {r.rotulo}
              {/* contador de pendência: a fila é a única coisa que grita */}
              {r.href === "/painel/fila" && resumo.emRevisao > 0 && (
                <span
                  className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ background: "var(--warn)", color: "#000" }}
                >
                  {resumo.emRevisao}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-mono text-xs text-suave hover:text-tinta"
            title="Abrir a visão pública"
          >
            ver o jardim ↗
          </Link>
          {email && (
            <span className="hidden font-mono text-[11px] text-suave sm:inline">{email}</span>
          )}
          <form action={sair}>
            <button
              type="submit"
              className="rounded border border-linha px-2.5 py-1 font-mono text-xs text-suave transition-colors hover:border-erro/50 hover:text-erro"
            >
              sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

/** Faixa de aviso quando o painel roda sem banco. Precisa ser impossível de ignorar. */
export function AvisoDemonstracao() {
  return (
    <div
      className="border-b px-5 py-2.5 text-center font-mono text-[11px]"
      style={{
        borderColor: "color-mix(in srgb, var(--warn) 40%, transparent)",
        background: "color-mix(in srgb, var(--warn) 12%, transparent)",
        color: "var(--warn)",
      }}
    >
      <b>modo demonstração</b> — sem Supabase configurado. As telas funcionam com dados de
      exemplo, o login está aberto e <b>nenhuma alteração é gravada</b>. Em produção este
      painel se recusa a abrir sem banco.
    </div>
  );
}

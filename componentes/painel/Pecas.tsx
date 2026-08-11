import Link from "next/link";
import type { EstadoExecucao } from "@/lib/tipos";

/* Peças do console. Tudo monoespaçado, régua fina, sem sombra — a estética é a
   de um supervisório: você lê estado, não navega por uma vitrine. */

export function Bloco({
  titulo, acao, children, className = "",
}: {
  titulo: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[var(--radius-token)] border border-linha bg-superficie ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-linha px-4 py-2.5">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-suave">
          {titulo}
        </h2>
        <div className="h-px flex-1 bg-linha" />
        {acao}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Mostrador({
  rotulo, valor, cor, nota, href,
}: {
  rotulo: string;
  valor: number | string;
  cor?: string;
  nota?: string;
  href?: string;
}) {
  const conteudo = (
    <>
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-suave">{rotulo}</p>
      <p
        className="mt-1.5 font-mono text-3xl font-semibold leading-none tabular-nums"
        style={cor ? { color: cor } : undefined}
      >
        {valor}
      </p>
      {nota && <p className="mt-1.5 text-[11px] leading-snug text-suave">{nota}</p>}
    </>
  );

  const base =
    "block rounded-[var(--radius-token)] border border-linha bg-superficie px-4 py-3.5";

  return href ? (
    <Link href={href} className={`${base} transition-colors hover:border-acento/50`}>
      {conteudo}
    </Link>
  ) : (
    <div className={base}>{conteudo}</div>
  );
}

const COR_EXEC: Record<EstadoExecucao, string> = {
  ok: "var(--ok)",
  alerta: "var(--warn)",
  erro: "var(--erro)",
  rodando: "var(--accent)",
};

export function Farol({ estado, rotulo }: { estado: EstadoExecucao | null; rotulo?: boolean }) {
  const cor = estado ? COR_EXEC[estado] : "var(--muted)";
  const texto = estado ?? "sem execução";
  return (
    <span className="inline-flex items-center gap-1.5" title={texto}>
      <span
        aria-hidden
        className="h-2 w-2 flex-none rounded-full"
        style={{
          background: cor,
          boxShadow: estado === "erro" || estado === "rodando" ? `0 0 8px ${cor}` : undefined,
        }}
      />
      {rotulo && (
        <span className="font-mono text-[11px]" style={{ color: cor }}>
          {texto}
        </span>
      )}
      {!rotulo && <span className="sr-only">{texto}</span>}
    </span>
  );
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded border border-dashed border-linha px-4 py-6 text-center text-sm text-suave">
      {children}
    </p>
  );
}

/** Rótulo de campo de formulário, em par com Campo. */
export function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-suave">
      {children}
    </span>
  );
}

export const classeCampo =
  "w-full rounded border border-linha bg-fundo px-3 py-2 text-sm outline-none focus:border-acento";

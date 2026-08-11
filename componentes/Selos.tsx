import type { Autoria, Estado, Genero, Maturidade, Portal } from "@/lib/tipos";
import { ESTADOS } from "@/lib/tipos";

/* Selos pequenos e reaproveitados. Todos aceitam `campo`, que é o nome da
   coluna do banco — o Modo Engenheiro lê esse atributo e o expõe na tela. */

const NIVEL: Record<Maturidade, number> = { semente: 1, muda: 2, perene: 3 };
const ROTULO_MAT: Record<Maturidade, string> = {
  semente: "Semente", muda: "Muda", perene: "Perene",
};
const COR_MAT: Record<Maturidade, string> = {
  semente: "var(--semente)", muda: "var(--muda)", perene: "var(--perene)",
};

/**
 * O selo mais importante do jardim: três pontos, tantos acesos quanto a nota
 * amadureceu. Ler "◍◍◍" é mais rápido que ler "perene", e a cor reforça.
 */
export function SeloMaturidade({
  maturidade, comRotulo = false, campo,
}: {
  maturidade: Maturidade;
  comRotulo?: boolean;
  campo?: string;
}) {
  const nivel = NIVEL[maturidade];
  const cor = COR_MAT[maturidade];

  return (
    <span
      className="inline-flex items-center gap-1.5 align-middle"
      title={`Maturidade: ${ROTULO_MAT[maturidade]}`}
      data-campo={campo}
    >
      <span aria-hidden className="inline-flex items-center gap-[3px]">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-[7px] w-[7px] rounded-full border"
            style={{
              borderColor: cor,
              background: i <= nivel ? cor : "transparent",
            }}
          />
        ))}
      </span>
      <span className="sr-only">Maturidade: {ROTULO_MAT[maturidade]}</span>
      {comRotulo && (
        <span className="text-[11px] font-medium uppercase tracking-[0.1em]" style={{ color: cor }}>
          {ROTULO_MAT[maturidade]}
        </span>
      )}
    </span>
  );
}

export function SeloPortal({ portal, campo }: { portal: Portal; campo?: string }) {
  return (
    <span
      data-campo={campo}
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-acento"
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-acento" />
      {portal}
    </span>
  );
}

const ROTULO_GENERO: Record<Genero, string> = {
  registro: "registro", incidente: "post-mortem", nota: "nota",
};

export function SeloGenero({ genero, campo }: { genero: Genero; campo?: string }) {
  const destaque = genero === "incidente";
  return (
    <span
      data-campo={campo}
      className={[
        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
        destaque
          ? "border-erro/40 text-erro"
          : "border-linha text-suave",
      ].join(" ")}
      style={destaque ? { borderColor: "color-mix(in srgb, var(--erro) 40%, transparent)" } : undefined}
    >
      {ROTULO_GENERO[genero]}
    </span>
  );
}

/**
 * De quem veio o texto. Só aparece quando foi agente: dizer "escrito por humano"
 * em todo post seria ruído, mas esconder que um agente escreveu seria desonesto.
 */
export function SeloAutoria({
  autoria, agente, campo,
}: {
  autoria: Autoria;
  agente?: string | null;
  campo?: string;
}) {
  if (autoria !== "agente") return null;
  return (
    <span
      data-campo={campo}
      title={agente ? `Rascunho gerado por ${agente}, revisado antes de publicar` : undefined}
      className="inline-flex items-center gap-1 rounded-full border border-linha bg-superficie-2 px-2 py-0.5 font-mono text-[10px] text-suave"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="8" width="16" height="12" rx="2" />
        <path d="M12 4v4M9 14h.01M15 14h.01" />
      </svg>
      rascunho de agente
    </span>
  );
}

export function SeloEstado({ estado, campo }: { estado: Estado; campo?: string }) {
  const { rotulo, cor } = ESTADOS[estado];
  return (
    <span
      data-campo={campo}
      className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
      style={{
        color: cor,
        background: `color-mix(in srgb, ${cor} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${cor} 35%, transparent)`,
      }}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: cor }} />
      {rotulo}
    </span>
  );
}

export function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-linha bg-superficie-2 px-2 py-0.5 font-mono text-[11px] text-suave">
      {children}
    </span>
  );
}

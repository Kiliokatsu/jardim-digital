"use client";

import { useActionState } from "react";
import { entrar, type Resultado } from "@/app/painel/acoes";

const inicial: Resultado = {};

export function FormularioLogin({ de, avisoInicial }: { de: string; avisoInicial?: string }) {
  const [estado, acao, enviando] = useActionState(entrar, inicial);
  const erro = estado.erro ?? avisoInicial;

  return (
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="de" value={de} />

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-suave">
          e-mail
        </span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          className="rounded border border-linha bg-fundo px-3 py-2.5 font-mono text-sm outline-none focus:border-acento"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-suave">
          senha
        </span>
        <input
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className="rounded border border-linha bg-fundo px-3 py-2.5 font-mono text-sm outline-none focus:border-acento"
        />
      </label>

      {erro && (
        <p
          role="alert"
          className="rounded border px-3 py-2 text-sm"
          style={{
            borderColor: "color-mix(in srgb, var(--erro) 40%, transparent)",
            background: "color-mix(in srgb, var(--erro) 10%, transparent)",
            color: "var(--erro)",
          }}
        >
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-1 rounded bg-acento px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {enviando ? "verificando…" : "entrar"}
      </button>
    </form>
  );
}

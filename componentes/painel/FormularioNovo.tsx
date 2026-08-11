"use client";

import { useActionState } from "react";
import { criarPost, type Resultado } from "@/app/painel/acoes";
import { classeCampo, Rotulo } from "@/componentes/painel/Pecas";

const inicial: Resultado = {};

/* Criar post pede só o mínimo: título, portal e gênero. O resto é decidido
   escrevendo — formulário longo antes da primeira frase é o jeito mais rápido
   de não escrever nada. Nasce sempre como rascunho-semente. */

export function FormularioNovo() {
  const [estado, acao, enviando] = useActionState(criarPost, inicial);

  return (
    <form action={acao} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-1.5">
        <Rotulo>título</Rotulo>
        <input
          name="titulo"
          required
          placeholder="Do que é este registro?"
          className={classeCampo}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <Rotulo>portal</Rotulo>
        <select name="portal" className={classeCampo} defaultValue="tecnologia">
          <option value="tecnologia">tecnologia</option>
          <option value="pessoal">pessoal</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <Rotulo>gênero</Rotulo>
        <select name="genero" className={classeCampo} defaultValue="registro">
          <option value="registro">registro</option>
          <option value="incidente">post-mortem</option>
          <option value="nota">nota</option>
        </select>
      </label>

      <button
        type="submit"
        disabled={enviando}
        className="rounded bg-acento px-4 py-2 font-mono text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {enviando ? "criando…" : "criar rascunho"}
      </button>

      {estado.erro && (
        <p role="alert" className="text-[13px]" style={{ color: "var(--erro)" }}>
          {estado.erro}
        </p>
      )}
    </form>
  );
}

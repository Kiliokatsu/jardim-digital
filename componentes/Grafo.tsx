"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Conexao, Maturidade, Post } from "@/lib/tipos";

/* O grafo do jardim — o [[link]] do vault sobrevivendo até o site.

   Sem biblioteca de simulação de força, e não por economia: força é aleatória e
   roda a cada carregamento, o que significa layout diferente no servidor e no
   cliente (erro de hidratação) e um mapa que nunca fica no mesmo lugar duas
   vezes. Aqui a posição é derivada do índice e da maturidade, então é estável e
   memorizável — quem voltar amanhã reconhece o mapa.

   Raio por maturidade: perene no miolo, semente na borda. O jardim cresce de
   dentro pra fora. */

const CX = 300;
const CY = 205;

const RAIO: Record<Maturidade, number> = { perene: 78, muda: 128, semente: 172 };
const COR: Record<Maturidade, string> = {
  perene: "var(--perene)", muda: "var(--muda)", semente: "var(--semente)",
};

type No = { post: Post; x: number; y: number; grau: number };

function encurta(texto: string, limite = 24) {
  return texto.length <= limite ? texto : `${texto.slice(0, limite - 1)}…`;
}

export function Grafo({ posts, conexoes }: { posts: Post[]; conexoes: Conexao[] }) {
  const [ativo, setAtivo] = useState<string | null>(null);

  const { nos, arestas, vizinhanca } = useMemo(() => {
    const grau = new Map<string, number>();
    for (const c of conexoes) {
      grau.set(c.de, (grau.get(c.de) ?? 0) + 1);
      grau.set(c.para, (grau.get(c.para) ?? 0) + 1);
    }

    /* Distribui cada anel separadamente, com deslocamento angular por anel pra
       que os nós não se alinhem em raios coincidentes. */
    const porAnel = new Map<Maturidade, Post[]>([
      ["perene", []], ["muda", []], ["semente", []],
    ]);
    for (const p of posts) porAnel.get(p.maturidade)?.push(p);

    const mapa = new Map<string, No>();
    const giro: Record<Maturidade, number> = { perene: 0, muda: 0.37, semente: 0.71 };

    for (const [maturidade, lista] of porAnel) {
      const passo = (2 * Math.PI) / Math.max(1, lista.length);
      lista.forEach((post, i) => {
        const angulo = (i + giro[maturidade]) * passo - Math.PI / 2;
        const r = RAIO[maturidade];
        mapa.set(post.id, {
          post,
          x: CX + r * Math.cos(angulo) * 1.42, // achatado: a área é mais larga que alta
          y: CY + r * Math.sin(angulo),
          grau: grau.get(post.id) ?? 0,
        });
      });
    }

    const arestas = conexoes
      .map((c) => ({ de: mapa.get(c.de), para: mapa.get(c.para), chave: `${c.de}-${c.para}` }))
      .filter((a): a is { de: No; para: No; chave: string } => Boolean(a.de && a.para));

    const vizinhanca = new Map<string, Set<string>>();
    for (const c of conexoes) {
      if (!vizinhanca.has(c.de)) vizinhanca.set(c.de, new Set());
      if (!vizinhanca.has(c.para)) vizinhanca.set(c.para, new Set());
      vizinhanca.get(c.de)!.add(c.para);
      vizinhanca.get(c.para)!.add(c.de);
    }

    return { nos: [...mapa.values()], arestas, vizinhanca };
  }, [posts, conexoes]);

  const realcado = (id: string) =>
    ativo !== null && (id === ativo || (vizinhanca.get(ativo)?.has(id) ?? false));

  if (nos.length === 0) {
    return (
      <p className="rounded-[var(--radius-token)] border border-dashed border-linha p-8 text-center text-sm text-suave">
        Nada plantado ainda.
      </p>
    );
  }

  return (
    <div
      data-campo="conexoes"
      data-campo-bloco=""
      className="relative overflow-hidden rounded-[var(--radius-token)] border border-linha bg-superficie"
    >
      <svg
        viewBox="0 0 600 410"
        className="h-auto w-full"
        /* role="group", não "img": img achataria a árvore de acessibilidade e
           esconderia os links de cada nó do leitor de tela */
        role="group"
        aria-label={`Grafo com ${nos.length} notas e ${arestas.length} conexões`}
        onMouseLeave={() => setAtivo(null)}
        onBlurCapture={() => setAtivo(null)}
      >
        {/* anéis de referência: dão a noção de "mais dentro, mais maduro" */}
        {(["semente", "muda", "perene"] as Maturidade[]).map((m) => (
          <ellipse
            key={m}
            cx={CX}
            cy={CY}
            rx={RAIO[m] * 1.42}
            ry={RAIO[m]}
            fill="none"
            stroke="var(--border)"
            strokeDasharray="2 6"
          />
        ))}

        {arestas.map((a) => {
          const viva = ativo !== null && (a.de.post.id === ativo || a.para.post.id === ativo);
          // curva puxando pro centro: legível mesmo entre vizinhos do mesmo anel
          const mx = (a.de.x + a.para.x) / 2;
          const my = (a.de.y + a.para.y) / 2;
          const qx = mx + (CX - mx) * 0.35;
          const qy = my + (CY - my) * 0.35;
          return (
            <path
              key={a.chave}
              className="grafo-aresta"
              data-viva={viva ? 1 : 0}
              opacity={ativo !== null && !viva ? 0.2 : 1}
              d={`M ${a.de.x} ${a.de.y} Q ${qx} ${qy} ${a.para.x} ${a.para.y}`}
            />
          );
        })}

        {nos.map((n) => {
          const viva = realcado(n.post.id);
          const apagado = ativo !== null && !viva;
          const r = 5 + Math.min(4, n.grau * 1.4);
          return (
            <g
              key={n.post.id}
              className="grafo-no cursor-pointer"
              data-viva={viva ? 1 : 0}
              data-apagado={apagado ? 1 : 0}
              onMouseEnter={() => setAtivo(n.post.id)}
              onFocus={() => setAtivo(n.post.id)}
            >
              <Link href={`/registro/${n.post.slug}`} aria-label={n.post.titulo}>
                {/* alvo generoso: o ponto é pequeno demais pra ser clicado direto */}
                <circle cx={n.x} cy={n.y} r={16} fill="transparent" />
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={viva ? r + 2 : r}
                  fill={COR[n.post.maturidade]}
                  stroke="var(--bg)"
                  strokeWidth="2"
                />
                <text x={n.x} y={n.y - r - 7} textAnchor="middle">
                  {encurta(n.post.titulo)}
                </text>
              </Link>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-linha px-4 py-2.5 text-[11px] text-suave">
        <div className="flex flex-wrap items-center gap-3">
          {(["perene", "muda", "semente"] as Maturidade[]).map((m) => (
            <span key={m} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: COR[m] }} />
              {m}
            </span>
          ))}
        </div>
        <span className="font-mono">
          {nos.length} notas · {arestas.length} conexões
        </span>
      </div>
    </div>
  );
}

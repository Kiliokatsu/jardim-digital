"use client";

import { useEffect, useRef } from "react";

/* Dragão que segue o cursor — porte fiel do protótipo (DEC-004).

   Técnica: NÃO é sprite, NÃO é GIF, NÃO é WebGL. É uma "espinha" de N pontos
   com restrição de distância, desenhada em canvas 2D. O ponto 0 persegue o
   cursor com atraso; cada ponto seguinte é puxado para a distância fixa do
   anterior. Isso é o que produz o movimento de serpente — o corpo percorre o
   caminho que a cabeça fez, não a linha reta até o mouse.

   Por que canvas e não CSS/SVG:
   - CSS não consegue: o corpo muda de geometria a cada quadro, com espessura
     variável. Não existe propriedade para isso.
   - SVG conseguiria, mas mexer em ~30 nós do DOM 60 vezes por segundo faz o
     navegador recalcular layout demais. Canvas desenha pixel e esquece.
   - WebGL/three.js seria matar mosca com canhão: são 28 pontos, não 28 mil.
     E carregaria ~600 KB de biblioteca para nada.

   A parte que mais importa: o laço NÃO existe no modo normal. O dragão
   obedece ao atributo data-persona do <html> via MutationObserver — quem
   troca o atributo são as Chaves, e nenhum dos dois sabe que o outro existe.
   Fora do caos: zero quadro, zero cálculo, zero bateria.

   Nota sobre imutabilidade: a física muta os pontos da espinha no lugar,
   de propósito. Recriar 28 objetos a 60 fps só alimentaria o coletor de
   lixo — aqui o custo por quadro vale mais que a pureza. */

const CFG = {
  segmentos: 28, // quantos pontos na espinha
  distancia: 13, // px entre pontos — define o comprimento do bicho
  atraso: 0.24, // 0..1 — quanto a cabeça persegue o cursor por quadro
  espessura: 15, // px de meia-largura no ponto mais grosso
} as const;

const MAX_BRASAS = 160;
const PARADO_MS = 1200; // mouse imóvel por mais que isso: o dragão vagueia

type Ponto = { x: number; y: number };
type Brasa = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vida: number;
  raio: number;
};

// mistura duas cores hex — para gradiente sem escrever cor fixa
function hex(c: string): [number, number, number] {
  let limpo = c.replace("#", "").trim();
  if (limpo.length === 3) {
    limpo = limpo
      .split("")
      .map((x) => x + x)
      .join("");
  }
  if (limpo.length !== 6) return [255, 45, 85];
  return [
    parseInt(limpo.slice(0, 2), 16),
    parseInt(limpo.slice(2, 4), 16),
    parseInt(limpo.slice(4, 6), 16),
  ];
}

function mistura(a: string, b: string, p: number): string {
  const pa = hex(a);
  const pb = hex(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * p);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * p);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * p);
  return `rgb(${r},${g},${bl})`;
}

export function Dragao() {
  const referencia = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = referencia.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const raiz = document.documentElement;

    // Celular não tem cursor para seguir; fingir que tem é pior que não ter.
    // E quem pediu menos movimento não recebe dragão nenhum.
    const temCursorFino = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const querMenosMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!temCursorFino || querMenosMovimento) {
      return; // sai sem registrar nada: nem observador, nem listener
    }

    // ---- estado do laço (vive no escopo do efeito, morre no unmount) ----
    let larg = 0;
    let alt = 0;
    const mouse: Ponto = { x: -999, y: -999 };
    let temMouse = false;
    let ultimoMovimento = 0;
    let espinha: Ponto[] = [];
    let brasas: Brasa[] = [];
    let t = 0; // tempo em quadros, para as oscilações
    let rodando = false;
    let quadro: number | null = null;

    // ---- canvas em resolução de tela real ----
    function redimensiona() {
      if (!canvas || !ctx) return;
      // teto em 2: 3x não melhora nada visível e triplica o custo
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      larg = window.innerWidth;
      alt = window.innerHeight;
      canvas.width = Math.floor(larg * dpr);
      canvas.height = Math.floor(alt * dpr);
      canvas.style.width = `${larg}px`;
      canvas.style.height = `${alt}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function iniciaEspinha() {
      const x = temMouse ? mouse.x : larg * 0.5;
      const y = temMouse ? mouse.y : alt * 0.5;
      espinha = Array.from({ length: CFG.segmentos }, (_, i) => ({
        x: x - i * CFG.distancia,
        y,
      }));
    }

    // A cor vem do tema, não está escrita aqui: o dragão muda de cor junto
    // com o site sem uma linha extra.
    function corAcento(): string {
      return (
        getComputedStyle(raiz).getPropertyValue("--accent").trim() || "#FF2D55"
      );
    }

    // direção normalizada do segmento i para o i+1
    function direcao(i: number): Ponto {
      const a = espinha[i];
      const b = espinha[Math.min(i + 1, espinha.length - 1)];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d = Math.hypot(dx, dy) || 0.0001;
      return { x: dx / d, y: dy / d };
    }

    // meia-largura do corpo na posição relativa (0 = cabeça, 1 = ponta).
    // Perfil de serpente: mais grosso a ~15% do comprimento, afinando até 0.
    function largura(rel: number): number {
      if (rel < 0.15) return CFG.espessura * (0.62 + 0.38 * (rel / 0.15));
      return CFG.espessura * Math.pow((1 - rel) / 0.85, 0.8);
    }

    // ---- física ----
    function atualiza() {
      t += 1;

      // Alvo da cabeça: o cursor. Se o mouse está parado há mais de 1,2s,
      // o dragão passa a vagar num oito preguiçoso — bicho imóvel parece
      // morto, e morto não é o efeito que a gente quer.
      let alvoX = mouse.x;
      let alvoY = mouse.y;
      const paradoHa = performance.now() - ultimoMovimento;
      if (paradoHa > PARADO_MS) {
        const f = t * 0.012;
        alvoX = mouse.x + Math.sin(f) * 46;
        alvoY = mouse.y + Math.sin(f * 2) * 26;
      }

      // Cabeça persegue com atraso — é o atraso que faz parecer peso.
      const cab = espinha[0];
      cab.x += (alvoX - cab.x) * CFG.atraso;
      cab.y += (alvoY - cab.y) * CFG.atraso;

      // Restrição de distância: cada ponto é puxado para ficar exatamente
      // a `distancia` do anterior, na direção em que já estava.
      // Três linhas de matemática — é isso que produz a serpente.
      for (let i = 1; i < espinha.length; i++) {
        const a = espinha[i - 1];
        const b = espinha[i];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.0001;
        dx /= d;
        dy /= d;
        b.x = a.x + dx * CFG.distancia;
        b.y = a.y + dy * CFG.distancia;
      }

      // Brasas saem da boca a cada 3 quadros
      if (t % 3 === 0) {
        const dir = direcao(0);
        const cab0 = espinha[0];
        brasas.push({
          x: cab0.x + dir.x * 16,
          y: cab0.y + dir.y * 16,
          vx: dir.x * 0.7 + (Math.random() - 0.5) * 1.1,
          vy: dir.y * 0.7 - Math.random() * 0.9 - 0.25,
          vida: 1,
          raio: 1.1 + Math.random() * 2.1,
        });
      }
      for (let i = brasas.length - 1; i >= 0; i--) {
        const b = brasas[i];
        b.x += b.vx;
        b.y += b.vy;
        b.vy -= 0.014; // brasa sobe
        b.vx *= 0.985;
        b.vida -= 0.022;
        if (b.vida <= 0) brasas.splice(i, 1);
      }
      if (brasas.length > MAX_BRASAS) {
        brasas.splice(0, brasas.length - MAX_BRASAS);
      }
    }

    // ---- desenho ----
    function desenhaCabeca(cor: string) {
      if (!ctx) return;
      const p = espinha[0];
      const d = direcao(0);
      const ang = Math.atan2(d.y, d.x);
      const k = CFG.espessura / 15; // cabeça acompanha a espessura do corpo

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      ctx.scale(k * 1.75, k * 1.75);

      ctx.shadowColor = cor;
      ctx.shadowBlur = 16;

      // crânio: focinho alongado, maçãs largas, occipital estreito
      ctx.fillStyle = mistura(cor, "#FFFFFF", 0.16);
      ctx.beginPath();
      ctx.moveTo(21, 0); // ponta do focinho
      ctx.quadraticCurveTo(15, -5, 8, -8.5);
      ctx.quadraticCurveTo(0, -11, -7, -9);
      ctx.lineTo(-12, 0);
      ctx.lineTo(-7, 9);
      ctx.quadraticCurveTo(0, 11, 8, 8.5);
      ctx.quadraticCurveTo(15, 5, 21, 0);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // mandíbula abrindo e fechando devagar
      const abre = 2 + Math.sin(t * 0.09) * 3;
      ctx.fillStyle = mistura(cor, "#000000", 0.6);
      ctx.beginPath();
      ctx.moveTo(20, 1);
      ctx.lineTo(6, 7 + abre);
      ctx.lineTo(-7, 10);
      ctx.lineTo(-7, 3);
      ctx.closePath();
      ctx.fill();

      // dentes
      ctx.fillStyle = "#F3F6FF";
      for (let i = 0; i < 4; i++) {
        const x = 15 - i * 4.6;
        const y = 3.2 + i * 0.9;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 1.5, y + 2.6);
        ctx.lineTo(x + 1.5, y + 2.4);
        ctx.closePath();
        ctx.fill();
      }

      // chifres varridos para trás
      ctx.strokeStyle = mistura(cor, "#FFFFFF", 0.45);
      ctx.lineWidth = 2.6;
      ctx.lineCap = "round";
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(-3, 7.5 * s);
        ctx.quadraticCurveTo(-17, 13 * s, -26, 5 * s);
        ctx.stroke();
      }
      // par menor
      ctx.lineWidth = 1.7;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(-1, 5 * s);
        ctx.quadraticCurveTo(-12, 6 * s, -18, 0.5 * s);
        ctx.stroke();
      }

      // olho que brilha
      ctx.shadowColor = "#FFD27A";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#FFE9A8";
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(6, -4.2 * s, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      // pupila em fenda
      ctx.fillStyle = "#2A0A0A";
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(6.4, -4.2 * s, 2.1, 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    function desenhaAsas(cor: string) {
      if (!ctx) return;
      const i = Math.min(6, espinha.length - 2);
      const p = espinha[i];
      const d = direcao(i);
      const ang = Math.atan2(d.y, d.x);
      const k = CFG.espessura / 15;
      const bate = Math.sin(t * 0.15);
      const abertura = 0.5 + bate * 0.5; // batida ampla

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      ctx.scale(k * 1.9, k * 1.9);

      for (const s of [-1, 1]) {
        ctx.save();
        ctx.scale(1, s);
        ctx.rotate(-abertura);

        // membrana em três dedos, bem maior que a cabeça
        ctx.fillStyle = mistura(cor, "#000000", 0.35);
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-8, 26, -20, 46); // dedo longo
        ctx.quadraticCurveTo(-24, 34, -28, 30);
        ctx.quadraticCurveTo(-22, 26, -22, 18); // dedo médio
        ctx.quadraticCurveTo(-16, 18, -12, 9); // dedo curto
        ctx.closePath();
        ctx.fill();

        // ossos da asa
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = mistura(cor, "#FFFFFF", 0.35);
        ctx.lineWidth = 1.8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-8, 26, -20, 46);
        ctx.moveTo(0, 0);
        ctx.lineTo(-22, 18);
        ctx.moveTo(0, 0);
        ctx.lineTo(-12, 9);
        ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.restore();
      }
      ctx.restore();
    }

    function desenha() {
      if (!ctx) return;
      ctx.clearRect(0, 0, larg, alt);
      const cor = corAcento();
      const n = espinha.length;

      // brasas (por baixo do corpo)
      if (brasas.length > 0) {
        ctx.globalCompositeOperation = "lighter"; // brasa soma luz
        for (const b of brasas) {
          ctx.globalAlpha = b.vida * 0.75;
          ctx.fillStyle = b.vida > 0.55 ? "#FFC24A" : cor;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.raio * b.vida, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }

      // asas (atrás do corpo)
      desenhaAsas(cor);

      // corpo: um polígono só, com espessura variável
      const esq: Ponto[] = [];
      const dir: Ponto[] = [];
      for (let i = 0; i < n; i++) {
        const p = espinha[i];
        const d = direcao(i);
        const px = -d.y;
        const py = d.x; // perpendicular
        const w = largura(i / (n - 1));
        esq.push({ x: p.x + px * w, y: p.y + py * w });
        dir.push({ x: p.x - px * w, y: p.y - py * w });
      }

      ctx.shadowColor = cor;
      ctx.shadowBlur = 18;

      ctx.beginPath();
      ctx.moveTo(esq[0].x, esq[0].y);
      for (let i = 1; i < n; i++) ctx.lineTo(esq[i].x, esq[i].y);
      for (let i = n - 1; i >= 0; i--) ctx.lineTo(dir[i].x, dir[i].y);
      ctx.closePath();

      const g = ctx.createLinearGradient(
        espinha[0].x,
        espinha[0].y,
        espinha[n - 1].x,
        espinha[n - 1].y,
      );
      g.addColorStop(0, cor);
      g.addColorStop(0.55, mistura(cor, "#000000", 0.42));
      g.addColorStop(1, mistura(cor, "#000000", 0.78));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.shadowBlur = 0;

      // espinhos dorsais
      ctx.fillStyle = mistura(cor, "#FFFFFF", 0.28);
      for (let i = 2; i < n - 3; i += 2) {
        const p = espinha[i];
        const d = direcao(i);
        const px = -d.y;
        const py = d.x;
        const w = largura(i / (n - 1));
        const h = w * 0.95;
        ctx.beginPath();
        ctx.moveTo(p.x + px * w, p.y + py * w);
        ctx.lineTo(p.x + px * (w + h) - d.x * 3, p.y + py * (w + h) - d.y * 3);
        ctx.lineTo(p.x + px * w * 0.3 - d.x * 6, p.y + py * w * 0.3 - d.y * 6);
        ctx.closePath();
        ctx.fill();
      }

      desenhaCabeca(cor);
    }

    // ---- laço ----
    function laco() {
      if (!rodando) return;
      atualiza();
      desenha();
      quadro = requestAnimationFrame(laco);
    }

    function liga() {
      if (rodando) return;
      rodando = true;
      redimensiona();
      if (espinha.length === 0) iniciaEspinha();
      quadro = requestAnimationFrame(laco);
    }

    function desliga() {
      rodando = false;
      if (quadro !== null) cancelAnimationFrame(quadro);
      quadro = null;
      if (ctx) ctx.clearRect(0, 0, larg, alt);
      brasas = [];
      // Zero quadro, zero cálculo, zero bateria. O modo normal não paga
      // nada por o modo caos existir — e isso é o argumento central.
    }

    // ---- eventos ----
    const aoMover = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      ultimoMovimento = performance.now();
      if (!temMouse) {
        temMouse = true;
        iniciaEspinha();
      }
    };
    window.addEventListener("mousemove", aoMover, { passive: true });

    const aoRedimensionar = () => {
      if (rodando) redimensiona();
    };
    window.addEventListener("resize", aoRedimensionar);

    const observador = new MutationObserver(() => {
      if (raiz.dataset.persona === "caos") liga();
      else desliga();
    });
    observador.observe(raiz, {
      attributes: true,
      attributeFilter: ["data-persona"],
    });

    if (raiz.dataset.persona === "caos") liga();

    return () => {
      observador.disconnect();
      window.removeEventListener("mousemove", aoMover);
      window.removeEventListener("resize", aoRedimensionar);
      desliga();
    };
  }, []);

  // O CSS de #dragao (fixed, pointer-events none, opacity presa ao atributo)
  // mora no globals.css junto com o resto da camada caos.
  return <canvas id="dragao" ref={referencia} aria-hidden="true" />;
}

---
numero: 0010
titulo: O dragão do caos volta em SVG, em chamas — não em canvas
data: 2026-08-12
estado: aceita
autor: claude
arquivos:
  - componentes/caos/Dragao.tsx
  - componentes/Chaves.tsx
  - app/(jardim)/layout.tsx
  - app/globals.css
  - testes/e2e/dragao.spec.ts
---

# DEC-0010 — O dragão do caos volta em SVG, em chamas — não em canvas

## Contexto

O slot do efeito especial do caos está vazio desde a DEC-0008 (o dragão canvas não
renderizou em produção, causa nunca isolada). O dono trouxe pela DEC-004 o código de
referência que queria — o "Interactive Dragon Cursor" (demo pública do perfil
@coding.stella no Instagram, disponibilizada para uso livre; cópia em `referencias/`) —
e pediu uma mudança: o dragão deve parecer **em chamas**.

## Decisão

Adaptar o código de referência para um componente cliente em SVG (`<defs>`/`<use>` +
requestAnimationFrame), com o fogo feito por **cor, brilho e tremulação** — paleta de
brasa (amarelo → laranja → o vermelho do caos → fumaça), `drop-shadow` incandescente e
oscilação sutil de escala por segmento — montado somente quando `data-persona="caos"`
e o visitante não pediu `prefers-reduced-motion`, com teste E2E que prova a renderização
no build de produção.

As escolhas dentro dela:

1. **SVG/DOM, não canvas.** É outra rota de renderização que não a que falhou na
   DEC-0008 — e sendo DOM, o Playwright consegue **contar os segmentos** no build de
   produção: a resposta ao fantasma é um teste, não uma esperança.
2. **Fogo por cor + brilho + tremulação, não por sistema de partículas.** Um fogo
   "de verdade" pede dezenas de partículas nascendo e morrendo por quadro; a ilusão de
   brasa pede três gradientes, um filtro e um seno. Começamos pela ilusão barata e
   lapidamos depois (fagulhas soltas são o candidato natural da próxima rodada).
3. **Montagem condicionada por atributo, custo zero fora do caos.** O componente observa
   `data-persona` com a mesma mecânica das Chaves (`useSyncExternalStore` +
   MutationObserver) — persona normal significa que o dragão nem existe no DOM.
4. **A animação corre por fora do React.** O laço de quadro escreve `transform` direto
   nos nós via ref. Passar 39 atualizações por quadro pelo estado do React seria pedir
   60 re-renderizações por segundo — o React monta a cena, o rAF a move.
5. **Overlay inofensivo.** `position: fixed`, `pointer-events: none`, sem `touch-action`
   nem `overflow` — o dragão sobrevoa a página sem roubar clique nem travar rolagem
   (os três eram comportamentos da página-demo que NÃO vieram junto).

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Canvas/WebGL com partículas (fogo realista) | Canvas é exatamente a técnica que falhou em produção sem diagnóstico (DEC-0008); WebGL pesa em celular antigo e é indefensável em entrevista hoje — nada no currículo o respalda |
| `feTurbulence` + `feDisplacementMap` animados (fogo procedural em SVG) | O displacement re-rasteriza na CPU a cada quadro — notório por derreter celular; fica anotado como experimento de lapidação, atrás de medição, não como fundação |
| Biblioteca de partículas pronta (tsparticles e afins) | Dependência nova fora da pilha declarada — a doutrina manda parar e perguntar, e a pergunta nem se justifica quando 75 linhas de JS puro resolvem |
| Não fazer nada | O caos segue sendo só cor e granulado — o dono já decidiu que quer o dragão |

## Consequências

**Fica mais fácil:** o caos ganha identidade de verdade; o efeito é ~2 KB de JS + ~7 KB
de SVG, sem dependência nova; regressão de renderização vira teste automático.

**Fica mais difícil:** o laço imperativo dentro de um componente React é o trecho mais
denso do repositório — exige comentário caprichado para continuar defensável; e a
paleta de fogo fica acoplada aos tokens do caos (mudar o vermelho do caos muda o dragão,
o que é desejado, mas precisa ser lembrado).

**Passamos a dever:** medição em celular fraco (o `drop-shadow` duplo é o suspeito de
custo); as fagulhas soltas da lapidação; e a válvula de reduzir `N` de 40 para ~24 em
tela pequena, se a medição mandar.

## Como eu explico isso

> O dragão são três desenhos SVG definidos uma vez e reutilizados quarenta vezes com
> `<use>` — cada segmento persegue o anterior com um pouco de atraso, e o ângulo entre
> eles vem de `atan2`; é isso que faz a ondulação de serpente. O fogo não é partícula:
> é gradiente de brasa, um brilho de `drop-shadow` e uma tremulação de seno na escala de
> cada segmento — a ilusão custa quase nada. E ele só é montado quando a persona caos
> está ligada e o visitante não pediu menos movimento; fora disso, não existe nem no DOM.

## O que eu ainda não entendo

- **Por que o canvas da DEC-0008 falhou continua sem diagnóstico.** Esta decisão
  contorna (outra técnica + teste que prova a renderização), não explica. Se o SVG
  falhar do mesmo jeito, a causa comum vira a investigação prioritária.
- **O custo real do `drop-shadow` em GPU fraca.** Aceito de literatura que é mais
  barato que filtro SVG re-rasterizando, mas não medi neste efeito; é a primeira
  medição da dívida.
- **A licença exata da demo.** O dono informou que a fonte disponibiliza para uso
  livre; registro a origem aqui por honestidade de processo, sem crédito no código a
  pedido dele.

## Se foi skill ou agente

Não se aplica — decisão minha (claude), a partir do pedido e da referência do dono.

## Verificação

```bash
cd site
npm run testar-site   # inclui testes/e2e/dragao.spec.ts
```

O teste liga a persona caos no build de produção e conta os 39 segmentos `<use>` do
dragão; com `prefers-reduced-motion: reduce`, afirma que o dragão NÃO montou.
Visual: `npm run dev`, ligar a chave Caos e mover o mouse.

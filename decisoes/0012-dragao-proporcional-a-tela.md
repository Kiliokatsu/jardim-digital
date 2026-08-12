---
numero: 0012
titulo: O dragão ganha proporção em relação à tela, aplicada no laço de animação
data: 2026-08-12
estado: aceita
autor: claude
arquivos:
  - componentes/caos/Dragao.tsx
  - testes/e2e/dragao.spec.ts
---

# DEC-0012 — O dragão ganha proporção em relação à tela, aplicada no laço de animação

## Contexto

O dragão da DEC-0010 herdou o tamanho fixo da página-demo: a escala de cada segmento é
uma constante que não olha para a tela. No desktop do dono ficou um pouco grande; no
notebook, grande demais — a mesma criatura ocupa proporções completamente diferentes
dependendo do monitor.

## Decisão

Multiplicar a escala de cada segmento **e** o comprimento dos elos por um fator de
proporção calculado da tela: `0.75 × (menor dimensão da janela ÷ 900)`, travado entre
0.5 e 1, recalculado no resize.

Por que cada pedaço:

1. **A menor dimensão da janela** é o que limita quanta criatura cabe — num ultrawide a
   altura manda, num celular em pé a largura manda.
2. **900px de referência e 0.75 de encolhimento global**: com 900 o notebook comum
   (~768 de altura) cai para ~85% e o desktop 1080p fica em 100% — e os 0.75 por cima
   atendem o "um pouquinho grande" do desktop. Números de partida honestos: lapidação
   visual pode calibrá-los.
3. **A trava inferior de 0.5** impede o dragão-camarão em tela muito pequena — abaixo
   disso, melhor um dragão que não cabe inteiro do que um que não se lê.
4. **Elos encolhem junto com os desenhos.** Escalar só o desenho deixaria os segmentos
   esparsos, um colar de contas; escalar só o elo os amontoaria. Os dois juntos mantêm
   a anatomia.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| `viewBox` no SVG (deixar o navegador escalar tudo) | Escalaria o mundo inteiro, não a criatura: as coordenadas do laço são pixels da janela (mouse, centro, órbita) — com viewBox, ou o cursor desalinha do dragão ou entra uma conversão de coordenadas em todo quadro |
| `transform: scale()` via CSS na camada `.dragao` | Mesmo problema em roupa nova: o overlay fixo encolheria junto com o sistema de coordenadas e o dragão não alcançaria os cantos da tela — e o drop-shadow escalaria junto, mudando o fogo |
| Reduzir o número de segmentos em tela pequena | Resolve custo, não tamanho — e muda a anatomia (menos elos = criatura mais curta e mais dura). Continua na dívida da DEC-0010 como válvula de desempenho, que é outro problema |
| Deixar como está | Foi o incômodo relatado: no notebook o efeito vira exagero e atrapalha em vez de encantar |

## Consequências

**Fica mais fácil:** o dragão fica coerente entre monitores — mesma presença relativa em
qualquer tela; e celular (quando chegar a lapidação de toque) já nasce com tamanho digno.

**Fica mais difícil:** são três números mágicos com nome (referência, encolhimento,
trava) que precisam de calibração visual do dono — a matemática é honesta, o gosto não é
meu para decidir.

**Passamos a dever:** a calibração fina depois que o dono olhar nas duas máquinas.

## Como eu explico isso

> O tamanho do dragão agora é uma fração da tela, não um número fixo: eu pego a menor
> dimensão da janela, comparo com uma referência de 900 pixels e uso essa razão para
> escalar tanto o desenho de cada segmento quanto a distância entre eles — os dois
> juntos, senão a anatomia desmonta. No resize a proporção se recalcula sozinha.

## O que eu ainda não entendo

- Os três valores (900, 0.75, trava 0.5) vieram de estimativa sobre as duas máquinas do
  dono, não de teste visual em campo — é a primeira coisa que a lapidação deve revisitar.
- Se a janela redimensiona com o dragão montado, os elos mudam de comprimento em voo e a
  criatura "respira" por alguns quadros até assentar. Aceitei como charme em vez de
  tratar; se incomodar, é caso de interpolar o fator.

## Se foi skill ou agente

Não se aplica — decisão minha (claude), a partir do incômodo relatado pelo dono.

## Verificação

```bash
cd site
npm run testar-site   # dragao.spec.ts compara a escala em duas janelas
```

O teste lê o `transform` da cabeça em uma janela grande e em uma pequena e afirma que a
escala da pequena é menor. Visual: `npm run dev` nas duas máquinas.

---
numero: 0011
titulo: Quando o sistema reduz movimento, ligar o caos mostra um aviso na tela
data: 2026-08-12
estado: aceita
autor: claude
arquivos:
  - componentes/caos/AvisoContido.tsx
  - componentes/Chaves.tsx
  - app/globals.css
  - testes/e2e/dragao.spec.ts
---

# DEC-0011 — Quando o sistema reduz movimento, ligar o caos mostra um aviso na tela

## Contexto

O dono testou o dragão no notebook e ele não apareceu: o Windows estava com "Efeitos de
animação" desligado (coisa que fabricante e plano de energia fazem sem o usuário saber),
o navegador reportou `prefers-reduced-motion: reduce` e o portão da DEC-0010 segurou o
dragão — corretamente, mas **em silêncio**. Quem visita nessa condição liga o caos e não
recebe nada, sem nenhuma pista do porquê.

## Decisão

Manter o portão de acessibilidade intacto e transformar o silêncio em informação: ao
**clicar** na chave Caos com a preferência de menos movimento ativa, um aviso discreto
aparece na tela dizendo que o modo está contido e onde reativar as animações do sistema.

Os contornos da escolha:

1. **O gatilho é o clique, não a visita.** O aviso responde a um gesto — quem liga o
   caos pediu o espetáculo e merece saber por que ele não veio. Visitante que nunca toca
   na chave nunca vê aviso nenhum.
2. **Aviso, não bloqueio.** É uma faixa fixa com `role="status"` (o leitor de tela
   anuncia sem interromper), botão de fechar e desaparecimento sozinho. Nada de modal
   com backdrop: ninguém precisa responder nada para continuar navegando.
3. **A detecção é a mesma do portão.** `matchMedia("(prefers-reduced-motion: reduce)")`
   — a mesma consulta que o dragão usa para não montar. Uma fonte da verdade, dois
   consumidores.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Modal de verdade (backdrop + botão obrigatório) | Punir com interrupção quem só queria ver o site; para um efeito decorativo, é peso de consentimento de cookie — desproporcional |
| Nota permanente no rodapé de instrumentação | O rodapé só aparece no Modo Engenheiro (`.so-engenheiro`) — o público que mais precisa do aviso é exatamente o que nunca liga o Modo Engenheiro |
| Ignorar a preferência quando o caos é opt-in | Descartado na conversa da DEC-0010: atropela quem configurou menos movimento de propósito e quebra a regra do baú da DEC-004 ("prefers-reduced-motion respeitado sempre") |
| Não avisar (deixar como está) | Foi o problema relatado: o dono mesmo não entendeu por que o dragão sumiu no notebook — visitante nenhum vai entender |

## Consequências

**Fica mais fácil:** o comportamento "correto mas mudo" vira comunicação; e a frase de
entrevista fica completa — "eu respeito a preferência E explico ao usuário o que ela
está fazendo".

**Fica mais difícil:** é mais um estado de interface para manter (texto, estilo,
fechamento); e o texto do aviso precisa envelhecer bem — caminho de configuração do
Windows muda de nome entre versões.

**Passamos a dever:** nada — o aviso é autocontido.

## Como eu explico isso

> O modo caos respeita a configuração de acessibilidade do sistema: se a pessoa (ou o
> fabricante do notebook dela) desligou animações, o dragão não monta. Só que regra de
> acessibilidade cumprida em silêncio parece defeito — então, quando alguém liga o caos
> nessa condição, o site avisa na hora: "seu sistema pediu menos movimento, o caos está
> contido, e é aqui que se muda isso". A preferência continua mandando; ela só deixa de
> ser invisível.

## O que eu ainda não entendo

- Não sei **quantos** visitantes reais têm a preferência ativa — a decisão assume que o
  caso do notebook do dono é comum (OEM/energia desligando animações), mas não há medição.
  Se um dia houver telemetria de consentimento, esse número diz se o aviso merece evoluir.
- O caminho de configuração citado no texto cobre Windows; macOS/Android têm caminhos
  próprios que o aviso não enumera para não virar manual — aceito que quem usa esses
  sistemas geralmente configurou de propósito, mas é um palpite.

## Se foi skill ou agente

Não se aplica — decisão minha (claude), a partir do incômodo relatado pelo dono.

## Verificação

```bash
cd site
npm run testar-site   # dragao.spec.ts cobre o aviso nos dois cenários
```

Com `reducedMotion: "reduce"` emulado, clicar em Caos mostra o aviso (e o botão fecha);
sem a preferência, clicar em Caos não mostra aviso nenhum.

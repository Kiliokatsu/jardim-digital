---
numero: 0000
titulo: <frase curta e concreta>
data: AAAA-MM-DD
estado: proposta
autor: humano | claude | skill:<nome> | agente:<nome>
arquivos:
  - caminho/afetado.ts
---

# DEC-0000 — <título>

## Contexto

Qual problema apareceu. O que estava acontecendo antes. Por que não dava para deixar como
estava. Duas ou três frases — se precisar de mais, o problema ainda não está entendido.

## Decisão

Uma frase. O que foi feito, no imperativo.

## Alternativas consideradas

Mínimo de duas. A rejeição precisa de motivo real — "não gostei" não é motivo.

| Alternativa | Por que não |
|---|---|
| <opção A> | <motivo concreto> |
| <opção B> | <motivo concreto> |
| Não fazer nada | <o que quebra se ignorarmos> |

## Consequências

**Fica mais fácil:** <o que essa decisão destrava>

**Fica mais difícil:** <o preço — sempre existe um>

**Passamos a dever:** <dívida técnica assumida, ou "nenhuma">

## Como eu explico isso

Na sua voz, como você diria em voz alta numa entrevista. Três frases no máximo. Sem jargão
que você não usaria falando.

> <escreva aqui>

## O que eu ainda não entendo

A parte mais útil da nota. O que ficou obscuro, o que você aceitou sem verificar, o que
você não saberia defender se perguntassem mais fundo. **Não deixe vazio** — vazio aqui quase
sempre significa que a pergunta não foi feita.

- <lacuna>

## Se foi skill ou agente

Preencher só quando `autor` for `skill:` ou `agente:`.

- **O que ela fez:** <o resultado concreto>
- **O que eu não teria feito sozinho:** <o ganho real>
- **O que eu revisei antes de aceitar:** <o que você conferiu de fato — se não revisou,
  escreva "nada", e isso vira item da seção acima>

## Verificação

Como saber que funcionou. Comando, teste, ou o que observar na tela.

```bash
<comando>
```

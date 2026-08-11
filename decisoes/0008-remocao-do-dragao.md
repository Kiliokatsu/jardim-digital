---
numero: 0008
titulo: "Remover o dragão do modo caos; o efeito especial volta pela DEC-004"
data: 2026-08-11
estado: aceita
autor: humano (execução: claude)
arquivos:
  - componentes/caos/Dragao.tsx (deletado)
  - app/(jardim)/layout.tsx
  - app/globals.css
---

# DEC-0008 — Remoção do dragão

## Contexto

O dragão (canvas 2D seguindo o cursor, portado do protótipo) **não renderizou no
preview do Vercel** mesmo com as condições atendidas (persona caos, desktop, sem
reduced-motion). O dono decidiu: em vez de investir em depuração, **remover** — ele tem
outras ideias de interface e animação para inserir no modo caos, que serão trazidas
como referências pela DEC-004 do pacote (aberta de propósito para isso).

## Decisão

Sai o componente `Dragao.tsx`, o seu uso no layout e o CSS de `#dragao`. **Fica** todo o
resto da camada caos: a chave de persona, o acento neon, o brilho, o granulado e a
disciplina da DEC-003-b (camada de intensidade, nunca outro layout). O slot do "efeito
especial do caos" fica vazio até as referências novas chegarem.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Depurar até achar a causa | O dono já quer outra coisa no lugar — depurar código que vai sair é custo sem retorno |
| Deixar o código morto no repositório "pra depois" | Componente que não renderiza num portfólio público é a pior vitrine possível; o código continua recuperável no histórico do git (commit 35f017f) |

## Como eu explico isso

> O efeito especial do modo caos foi removido porque não estava funcionando em produção
> e eu decidi trocar a ideia em vez de consertar. O código está no histórico do git se
> eu quiser voltar. A camada caos em si — cor, brilho, granulado — continua funcionando.

## O que eu ainda não entendo

- **A causa real do dragão não aparecer.** A fiação estava correta na leitura (canvas no
  DOM, CSS de opacidade preso ao atributo, MutationObserver no `data-persona`, laço só
  no caos) e ninguém depurou no navegador antes da remoção. Se o efeito novo da DEC-004
  também usar canvas + atributo, essa causa fantasma pode voltar — o primeiro passo lá
  será um teste mínimo de canvas visível ANTES de construir o efeito inteiro.

## Verificação

```bash
grep -ri "dragao" site/app site/componentes --include=*.tsx  # -> nada
npm run build                                                # -> verde
```

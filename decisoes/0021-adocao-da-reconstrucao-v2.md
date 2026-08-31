---
numero: 0021
titulo: "Reconstrução v2 em duas fases: o visual agora, o motor depois de debatido"
data: 2026-08-31
estado: aceita
autor: humano
arquivos:
  - app/globals.css
  - app/layout.tsx
  - componentes/
  - public/marca/
---

# DEC-0021 — Reconstrução v2 em duas fases: o visual agora, o motor depois de debatido

## Contexto

O dono revisou o site inteiro e voltou com uma especificação nova
(`../Reconstrução/ESPEC-kiliokatsu.md`): identidade de marca completa (o K espelhado),
paleta rubro/vinho sobre escuro quase-preto, tipografia Fraunces/Inter/IBM Plex Mono, e
um motor de escrita automatizada (painel → ideias → n8n). A parte visual foi decidida e
validada em mockups; a parte de banco/motor veio de carona na conversa e **não foi
debatida** — o schema companheiro foi validado no PGlite (15 sondas, tudo passou) mas
carrega decisões de segurança que merecem discussão própria.

## Decisão

Reconstruir em duas fases na branch `develop`. **Fase A (agora):** toda a reforma
visual — tokens, fontes, marca, telas públicas, painel re-vestido — sobre o banco
atual, com no máximo adições pequenas (`projetos`, `canais_contato`). **Fase B (quando
debatida):** o motor — `ideias`, n8n, pg_cron, webhooks, editor com autosave, troca do
login para e-mail/senha — cada achado da validação do schema decidido um a um.

O que morre já na Fase A: Modo Caos (dragão, granulado, persona), Modo Engenheiro e as
chaves — a espec reserva o caos como terceiro conjunto de tokens no futuro, e a linha de
instrumentação do rodapé passa a ser sempre visível (não é mais segredo de chave).
O que sobrevive intacto: RLS e `is_admin()` como fronteira, o protocolo de DECs, o
projeto Supabase, mobile-first e acessibilidade, DEC-0017 a 0020. Bun (que a espec
citava) fica fora: o dono não sabe defendê-lo — a doutrina decide sozinha.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Repositório novo, começar limpo | Destruiria o que o repositório existe para provar: a evolução documentada. Recomeço sem história parece projeto gerado, não construído. |
| Adotar espec + schema de uma vez (visual e motor juntos) | O dono aprovaria um schema que não debateu — contra o espírito do protocolo. E o motor depende de uma VPS que ainda não existe. |
| Não fazer nada | A espec representa semanas de decisão de design validada em mockup; ignorá-la é jogar trabalho fora. |

## Consequências

**Fica mais fácil:** entregar valor visível já (o site novo no ar com o banco velho) e
debater o motor sem pressa, peça por peça.

**Fica mais difícil:** conviver algumas semanas com nomes híbridos (tabela `pautas` da
fase 2 antiga ainda existe enquanto `ideias` não nasce; colunas antigas sob visual novo).

**Passamos a dever:** a Fase B inteira como debate estruturado (achados 1–6 da validação
do schema); a varredura dos atributos `data-campo` órfãos do Modo Engenheiro conforme
cada tela for reconstruída; a decisão sobre a tabela `pautas` (migra pra `ideias` ou
morre).

## Como eu explico isso

> Eu redesenhei o site inteiro em mockups antes de escrever código, e o repositório
> mostra a troca acontecendo por fases, com o site publicável em cada commit. A parte
> que eu ainda não tinha estudado — o motor de automação — eu deixei registrada como
> fase seguinte em vez de colar no projeto sem entender. Decisão sem entendimento é o
> que este repositório existe pra evitar.

## O que eu ainda não entendo

- Os achados 1–6 da validação do schema v2 (registrados na conversa e a registrar em DEC
  próprio na Fase B) — em especial o custo real de manter `is_admin()` versus confiar no
  signup desligado.
- Se o plano gratuito do Supabase suporta pg_cron e Realtime no volume que o motor vai
  gerar.

## Verificação

A cada commit da Fase A: `npx tsc --noEmit`, `npx eslint .` e `npm run testar-site`
verdes — o site tem que continuar publicável durante a reforma inteira.

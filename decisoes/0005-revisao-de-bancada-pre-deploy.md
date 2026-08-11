---
numero: 0005
titulo: Revisão por bancada de quatro agentes antes do primeiro deploy real
data: 2026-08-11
estado: aceita
autor: "agentes: security-reviewer, react-reviewer, database-reviewer, typescript-reviewer (orquestração: claude)"
arquivos:
  - app/painel/acoes.ts
  - supabase/schema.sql
  - next.config.ts
  - componentes/Grafo.tsx
  - componentes/CabecalhoPublico.tsx
  - componentes/painel/ItemFila.tsx
  - app/painel/(dentro)/escrever/[id]/page.tsx
  - lib/consultas.ts
  - lib/painel.ts
  - .githooks/pre-commit
---

# DEC-0005 — Revisão de bancada pré-deploy

## Contexto

O primeiro push do código completo dispara o deploy no Vercel e antecede o repositório
virar público. Quatro agentes revisaram em paralelo, cada um com uma lente: segurança,
React/Next, banco (Supabase/RLS) e TypeScript. O que cada um achou que eu não teria
achado sozinho: o crash latente de `TRANSICOES[estado]` sem guarda, o `role="img"`
escondendo os links do grafo de leitor de tela, o initplan das policies, e a trilha de
auditoria que falhava em silêncio.

## Decisão — o que foi corrigido

- **Vazamento**: e-mail corporativo removido de 5 arquivos (detalhe na DEC-0004) e o
  hook de pre-commit ganhou um padrão para barrar reincidência.
- **Robustez** (`acoes.ts`): `destino` validado contra os estados reais; transição de
  estado desconhecido degrada com mensagem em vez de `TypeError`; falha ao gravar
  moderação/execução agora é logada e avisada, não engolida; URL de automação exige
  `https://` (o token viaja nela); erro de consulta distinguido de "não encontrado".
- **Banco** (`schema.sql`): policies com `(select eh_dono())` (avaliação por consulta,
  não por linha); índice para o dashboard geral de execuções; comentário documentando
  que `eh_dono()` por e-mail depende de confirmação de e-mail ligada no Supabase Auth.
- **Cabeçalhos de segurança** (`next.config.ts`): X-Frame-Options, nosniff,
  Referrer-Policy, Permissions-Policy.
- **Acessibilidade**: grafo navegável por leitor de tela (`role="group"` + reset de
  realce no blur), input de nota com `aria-label`, navs com rótulos distintos,
  `key={post.id}` no editor contra estado obsoleto.

## O que foi visto e deliberadamente NÃO feito

| Achado | Por que ficou de fora |
|---|---|
| Guarda de dono dentro de cada Server Action | Contraria decisão documentada no próprio `acoes.ts`: a autorização mora na RLS, que é testada. Duplicar daria a impressão de que a segurança mora na aplicação |
| CSP completa com nonce | Next injeta script inline na hidratação; CSP séria exige nonce por requisição — complexidade que o dono ainda não sabe defender. Registrada como dívida |
| Tipos gerados do Supabase (`Database` generic) | Exige projeto Supabase vivo (`supabase gen types`). Fazer no dia em que o banco real existir |
| Rate limiting no login | Supabase Auth já limita; adicionar Upstash/lib seria dependência fora da pilha declarada |
| Refatorar schema para namespace `jardim.*` | O revisor de banco partiu de premissa errada (Supabase compartilhado com a Artemec); o site tem projeto próprio. Higiene válida, urgência não |
| `vizinhos()` filtra em memória; agregações em JS | Escala atual não sente; anotado como melhoria de SQL a fazer com calma |
| `lib/supabase/navegador.ts` sem uso | Remoção é decisão de arquitetura do dono (reservado pra tela client-side futura?) — pergunta aberta |

## Como eu explico isso

> Antes do primeiro deploy eu passei o código por quatro revisões independentes —
> segurança, React, banco e TypeScript. Corrigi o que era real: um crash latente, uma
> trilha de auditoria que falhava calada, acessibilidade do grafo, e o desempenho das
> policies de RLS. E recusei sugestões que contrariavam decisões que eu sei defender,
> como duplicar na aplicação a autorização que já mora no banco.

## O que eu ainda não entendo

- CSP com nonce em Next.js App Router — sei que existe, não sei implementar nem
  explicar os trade-offs de streaming. É a maior dívida de segurança registrada.
- Quando o projeto Supabase real existir: como o `supabase gen types` muda o contrato
  dos clients e se os `as Tipo[]` de hoje viram redundância ou conflito.

## Verificação

```bash
npm run testar-schema   # 31 passaram, 0 falharam
npx tsc --noEmit        # limpo
npm run build           # produção OK (Turbopack)
```

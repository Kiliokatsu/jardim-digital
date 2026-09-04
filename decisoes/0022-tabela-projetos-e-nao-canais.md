---
numero: 0022
titulo: "Nasce a tabela projetos; canais_contato não nasce — perfil_links já é isso"
data: 2026-08-31
estado: aceita
autor: claude
arquivos:
  - supabase/migrations/0005_projetos.sql
  - lib/tipos.ts
  - lib/consultas.ts
---

# DEC-0022 — Nasce a tabela `projetos`; `canais_contato` não nasce

## Contexto

A home e a página Profissional da v2 (espec §6.1–6.2) mostram "sistemas
entregues": cards com nome, descrição, stack e link. Não existe tabela pra isso —
era a adição pequena que a DEC-0021 autorizou para a Fase A. A espec também pedia
uma tabela `canais_contato` para o rodapé (nome, url, ordem, visível).

## Decisão

Criar `projetos` na migration 0005, no padrão da casa (RLS + dois portões +
`is_admin()`). **Não** criar `canais_contato`: a tabela `perfil_links` que já
existe tem exatamente as colunas e o papel pedidos (rótulo, url, ordem) e já
alimenta o rodapé — criar a segunda seria a mesma tabela com outro nome.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Criar as duas tabelas como a espec pede | `canais_contato` e `perfil_links` seriam indistinguíveis. Duas tabelas pro mesmo dado = uma delas apodrece. |
| Projetos como arquivo de config no repositório | Editar projeto viraria deploy; no banco, é linha no Studio/painel — e demonstra a modelagem que o currículo afirma. |
| Esperar a Fase B e o schema novo | A home nova precisa da faixa de métricas e dos cards agora; a tabela é aditiva e sobrevive igual em qualquer schema futuro. |

## Consequências

**Fica mais fácil:** a home e a Profissional mostram sistemas reais vindos do
banco, e adicionar canal de contato continua sendo INSERT em `perfil_links`.

**Fica mais difícil:** nada — tabela nova, nenhum contrato alterado.

**Passamos a dever:** a coluna `destaque` só é usada pela home; se a Fase B
trouxer o schema novo, `projetos` precisa entrar no mapa de migração.

## Como eu explico isso

> A especificação pedia duas tabelas, mas uma delas eu já tinha com outro nome —
> e tabela duplicada é o tipo de dívida que parece organização. Criei só a que
> não existia, com a mesma regra de segurança de todas as outras: o público lê o
> que está marcado visível, e só quem está alistado escreve.

## O que eu ainda não entendo

- Se "builds no mês" (a terceira métrica da faixa de prova da espec) terá fonte
  real algum dia — a API da Vercel exige token; por ora a faixa usa as decisões
  documentadas do repositório, que são contáveis no build sem segredo nenhum.

## Verificação

```bash
npm run testar-schema   # 0005 roda no PGlite; RLS de projetos sondada
```

---
numero: 0018
titulo: Endurecer a fronteira do painel com código próprio, sem biblioteca nova
data: 2026-08-18
estado: aceita
autor: claude
arquivos:
  - componentes/painel/Pautas.tsx
  - componentes/painel/EditorPost.tsx
  - componentes/painel/ConsolePainel.tsx
---

# DEC-0018 — Endurecer a fronteira do painel com código próprio, sem biblioteca nova

## Contexto

A revisão pós-publicação apontou três buracos de robustez no painel: a lista de pautas
engole erro de carregamento em silêncio (o operador vê "nenhuma registrada" como se fosse
verdade), o editor grava e até publica post com título/resumo/corpo vazios (o banco só
garante `NOT NULL`, não "não vazio"), e a leitura inicial de sessão não trata rejeição —
uma falha ali deixa a tela presa em "conferindo a sessão…" para sempre. A revisão sugeriu
zod para validar a fronteira, mas zod não está na pilha do currículo.

## Decisão

Validar e sinalizar na fronteira com código próprio — mensagens de erro visíveis no
padrão que o próprio painel já usa — e não trazer biblioteca de validação.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| zod na fronteira (a sugestão da revisão) | Entra no `package.json` sem respaldo no currículo; as validações necessárias aqui são três `trim()` e uma comparação de data — schema library para isso é canhão em pardal. Se a fronteira crescer (payload do n8n, por exemplo), a conversa reabre. |
| Tipos gerados do banco (`supabase gen types typescript`) | Resolve outro problema (erro de digitação em nome de coluna), não este (valor vazio passa igual). Fica registrado como candidato para quando houver pipeline de CI. |
| Não fazer nada | Publicar post vazio é um clique de distração; erro invisível em pauta é diagnóstico impossível. Ambos em código que agora é vitrine pública. |

## Consequências

**Fica mais fácil:** diagnosticar falha no painel (todo caminho de erro fala com o
operador) e confiar no botão "publicar" (não existe mais publicar vazio).

**Fica mais difícil:** nada — são guardas locais no padrão já existente.

**Passamos a dever:** (1) os casts de leitura em `lib/consultas.ts` (`data as Post[]`)
continuam sem validação de runtime — mitigado porque o schema é nosso e versionado, e
uma quebra aparece no render, não corrompe dado; (2) falha de rede na RPC `is_admin()`
ainda cai na tela "não-alistado", que afirma o que não foi verificado — merece um estado
próprio numa iteração futura do console.

## Como eu explico isso

> Validação aqui é fronteira, não framework: três campos que não podem ser vazios e uma
> data que precisa estar no futuro. Eu escrevo isso em dez linhas que qualquer um lê —
> uma biblioteca de schema entraria no meu currículo respondendo por dez linhas. E erro
> de banco nunca morre calado: se a RLS ou a rede recusaram, o operador lê o motivo na
> tela.

## O que eu ainda não entendo

- Em quais condições reais o `getSession()` do supabase-js rejeita (a revisão citou
  falha de storage e lock travado) — o `.catch()` cobre, mas eu não sei provocar o caso
  para ver a tela com meus olhos.

## Verificação

`npm run testar-site` (E2E do estado sem banco continua de pé) e, no painel real:
salvar com título vazio tem que ser recusado na tela, sem chamada ao banco; agendar com
data passada idem.

```bash
npx tsc --noEmit && npx eslint . && npm run testar-site
```

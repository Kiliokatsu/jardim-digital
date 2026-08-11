---
numero: 0004
titulo: Nenhum e-mail real chumbado em código versionado
data: 2026-08-11
estado: aceita
autor: claude
arquivos:
  - lib/config.ts
  - lib/dados-demo.ts
  - supabase/schema.sql
  - supabase/seed.sql
  - scripts/testar-schema.mjs
---

# DEC-0004 — Nenhum e-mail real no código

## Contexto

A varredura pré-publicação encontrou o e-mail corporativo da Artemec chumbado em cinco
arquivos — pior de todos, como **fallback** em `lib/config.ts`: se a variável
`EMAIL_DONO` faltasse no ambiente, o código silenciosamente usava o e-mail real. O
mesmo padrão já tinha aparecido no `.env.local.example` (corrigido na DEC-0003). Isso
mistura identidade do empregador num repositório pessoal público e publica dado
pessoal que robô de spam colhe.

## Decisão

1. **`lib/config.ts`**: `EMAIL_DONO` vem só do ambiente, fallback é string vazia —
   vazio não casa com nenhum e-mail de conta autenticada, então falha fechado.
2. **Conteúdo de demonstração** (`dados-demo.ts`, `seed.sql`): usa o e-mail pessoal
   público `vinicius.h.eng@outlook.com` — é o contato profissional que o site exibe de
   propósito e já assina todos os commits do repositório.
3. **`schema.sql`**: o bootstrap da tabela `donos` usa o placeholder
   `dono@exemplo.com`; o insert com e-mail real é passo manual, uma vez, no SQL Editor
   do Supabase. `testar-schema.mjs` testa contra o placeholder.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Usar o e-mail pessoal como fallback no config.ts | Continua sendo e-mail real em código; e fallback esconde erro de configuração — sem `EMAIL_DONO` no Vercel, o painel autorizaria com base num valor que ninguém declarou |
| Manter o corporativo (a empresa já aparece no currículo) | Citar a Artemec como empregadora é conteúdo de currículo; publicar o e-mail corporativo é dado de contato interno e cria vínculo de identidade que não é meu de publicar |
| Ler o e-mail do dono de uma tabela sem placeholder nenhum | O `testar-schema.mjs` precisa de um valor conhecido pra provar que `eh_dono()` funciona; placeholder documentado resolve teste e documentação de uma vez |

## Consequências

**Fica mais fácil:** publicar o repositório sem revisar e-mail por e-mail.

**Fica mais difícil:** provisionar um ambiente novo tem um passo manual a mais (o
insert em `donos`) e o `EMAIL_DONO` precisa existir no Vercel — sem ele o painel não
autoriza ninguém, de propósito.

## Como eu explico isso

> O e-mail que autoriza o painel não existe no código — vem do ambiente, e o registro
> na tabela `donos` é feito manualmente no Supabase. Se a variável faltar, o painel
> falha fechado: ninguém entra. Preferi isso a um fallback, porque fallback de
> credencial esconde erro de configuração e publica dado pessoal.

## O que eu ainda não entendo

- Se o Supabase Auth normaliza maiúsculas/minúsculas do e-mail no JWT — a comparação
  em `eh_dono()` é sensível a caso e um cadastro com maiúscula quebraria o login sem
  mensagem clara. Vale testar quando o projeto Supabase real existir.

## Verificação

```bash
grep -ri "artemec.com.br" site/ --exclude-dir=node_modules   # -> nenhum código, só decisões
npm run testar-schema                                        # -> 31 passaram, 0 falharam
```

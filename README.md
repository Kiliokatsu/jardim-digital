# Kiliokatsu — kiliokatsu.com.br

Portfólio e blog público de **Vinícius Henrique Teles Farias**, sob a marca
**Kiliokatsu**. Tese do site: **sistema sólido, criador vulnerável** — o site não cai,
e a pessoa aparece com as cicatrizes. Erro é conteúdo, sempre junto com o conserto.

Três portais: **Profissional** (currículo com prova), **Tecnologia** (decisões
técnicas) e **Pessoal** (anime, eletrônica, análise de FII como texto).

> Esta branch (`reconstrucao-kiliokatsu`) é a reconstrução decidida no pacote
> `prototipo-dragao/` (28 decisões registradas). A `main` continua servindo o site
> anterior até o merge — que acontece quando os três portais tiverem conteúdo real
> (6–8 posts). Decisões locais em [`decisoes/`](decisoes/INDICE.md).

## Rodar

```bash
npm install
npm run dev          # http://localhost:3000 — modo demonstração, sem banco
```

Sem variáveis de ambiente o site roda inteiro com dados de exemplo. Para ligar o
banco: `cp .env.local.example .env.local` e preencha com os valores do Supabase.

## Ligar o Supabase

1. No SQL Editor, rode **em ordem**:
   - [`supabase/migrations/0001_reconstrucao_v3.sql`](supabase/migrations/0001_reconstrucao_v3.sql) — tabelas, funções, RLS, grants
   - [`supabase/migrations/0002_storage.sql`](supabase/migrations/0002_storage.sql) — baldes de capa e certificado
   - [`supabase/seed.sql`](supabase/seed.sql) — conteúdo inicial (opcional)
2. Em Authentication → Providers, habilite **GitHub** (o painel da fase 2 usa OAuth;
   ver DEC-020 do pacote).
3. Depois do seu primeiro login, copie seu `user_id` de `auth.users` e insira em
   `admins` pelo Studio — **autenticado não é autorizado**; a lista de quem pode
   escrever tem uma linha, inserida à mão.
4. Preencha as duas variáveis no Vercel e redeploy.

Antes de colar qualquer alteração de schema no Supabase:

```bash
npm run testar-schema   # roda a migration num Postgres em memória e prova a RLS
```

## Os modos

- **Tema** `escuro | claro` — escuro é o padrão (direção visual A, "Terminal Noturno").
- **Persona** `normal | caos` — mesma estrutura, camada de movimento (DEC-003-b). No
  caos o acento esquenta, o brilho e o granulado ligam. O efeito especial do caos está
  vago de propósito (DEC-0008) — entra quando as referências de animação da DEC-004
  forem escolhidas. `prefers-reduced-motion` desliga tudo.
- **Modo Engenheiro** `0 | 1` — expõe a instrumentação: fita de telemetria no rodapé e
  os metadados de cada cartão.

Os três vivem em atributos do `<html>`, restaurados de `localStorage` antes da
primeira pintura.

## Publicar (até o painel existir)

Publicar é operação de banco: inserir em `posts` pelo Studio com `publicado_em`
preenchido. Rascunho é `publicado_em = NULL` — invisível ao público pela RLS, visível
ao admin. O painel de administração é fase 2 (DEC-012).

## Estrutura

```
app/(jardim)/      home, /tecnologia, /pessoal, /profissional, /registro/[slug], /tag/[slug]
componentes/       cartões, cabeçalho/rodapé, chaves de modo, caos/ (dragão), post/ (janelinha, índice)
lib/               tipos, consultas (com degradação pra demo), realce (Shiki), formato
supabase/          migrations/ e seed.sql
scripts/           testar-schema.mjs (pglite) e preparar-hooks.mjs
decisoes/          protocolo de decisões (DEC-0001…)
```

## Segurança

- Nenhum segredo no repositório; hook de pre-commit versionado barra chave e e-mail
  corporativo (`.githooks/`, DEC-0002/0004).
- A anon key é pública por desenho: quem protege o dado é a **RLS**, testada em
  `npm run testar-schema` — inclusive o caso "admin vê o próprio rascunho" (DEC-022
  do pacote) e "autenticado não alistado não escreve" (DEC-020).
- Cabeçalhos de segurança em `next.config.ts`.

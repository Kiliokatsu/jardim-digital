# Jardim Digital

Site pessoal do Vinícius Henrique. Duas visões com estéticas opostas de propósito:

| | Visão | Endereço | Estética |
|---|---|---|---|
| **Pública** | O jardim | `/` | Orgânica, quente, serifa na leitura |
| **Privada** | Painel de supervisão | `/painel` (login) | Console SCADA, monoespaçado, denso |

A ponte entre as duas é o **Modo Engenheiro** — a chave no cabeçalho público. Ligada,
cada elemento da tela passa a mostrar a coluna do banco que o alimenta. É o toggle
"Campos" do protótipo antigo, crescido, e é a assinatura técnica do site.

## Rodar

```bash
npm install   # o `prepare` ativa o hook de pre-commit que barra segredos
npm run dev
```

Sem `.env.local`, o site sobe em **modo demonstração**: o jardim mostra dados de exemplo
e o painel abre sem login (só em desenvolvimento — em produção ele devolve 503 se o banco
não estiver configurado). Dá pra ver tudo de pé antes de criar projeto no Supabase.

## Onde cada credencial mora

A regra que evita o acidente eliminatório: **a mesma variável existe em dois lugares, nunca
em três, e nenhum deles é o Git.**

| Onde | O quê | Como |
|---|---|---|
| **Sua máquina** | Valores reais, para desenvolvimento | `site/.env.local` — ignorado pelo git, barrado pelo hook |
| **Vercel** | Valores reais, para produção | Painel → Settings → Environment Variables |
| **GitHub** | **Nada. Nunca.** | O GitHub recebe só código |
| **O repositório** | Os *nomes* das variáveis | `.env.local.example` — é o único arquivo sobre segredos que é versionado |

### GitHub

Não recebe credencial nenhuma. A sua autenticação já está no `gh` CLI, guardada no
gerenciador de credenciais do Windows — fora do projeto. Se um dia houver GitHub Actions
precisando de segredo, ele vai em **Settings → Secrets and variables**, nunca em arquivo.

### Supabase

`Project Settings → API` dá as duas variáveis do topo do `.env.local.example`. A `anon key`
é pública por natureza — quem protege os dados é o RLS, não o sigilo dela. **A
`service_role` key não é usada neste projeto**, e não deve ser: ela ignora RLS.

### Vercel

Importe o repositório pela web. No primeiro deploy ele pede as variáveis — cole os mesmos
valores do `.env.local`. Marque para **Production, Preview e Development**, senão o preview
de branch sobe sem banco.

A partir daí o registro é automático: cada push vira um deploy, cada branch vira um preview
com URL própria, e cada DEC em `decisoes/` viaja no mesmo commit do código que ele explica.

## Ligar o Supabase

1. Crie o projeto e rode, no SQL Editor, **em ordem**:
   - [`supabase/schema.sql`](supabase/schema.sql) — tabelas, triggers, RLS
   - [`supabase/seed.sql`](supabase/seed.sql) — conteúdo inicial (opcional)
2. `cp .env.local.example .env.local` e preencha URL + anon key.
3. Em **Authentication → Providers**, crie o seu usuário e **desligue o registro público**.
   Não existe tela de cadastro no site de propósito.
4. Confirme que o seu e-mail está na tabela `donos`. É ela que a função `eh_dono()`
   consulta, e é `eh_dono()` que todas as políticas de RLS usam.

## As duas regras que estão no banco, não na tela

**1. Interlock de publicação.** O caminho é `rascunho → em_revisao → aprovado → publicado`,
e o trigger `fn_interlock_publicacao` recusa qualquer atalho. Post não pode nem nascer
publicado. Isso vale pra você e vale pro agente redator: dar a chave a um agente não é
arriscado, porque publicar não é uma permissão que ele tenha.

**2. Segredo não mora no banco.** `integracoes.ref_segredo` guarda o *nome* de uma
variável de ambiente (`N8N_TOKEN_REDATOR`), nunca o valor. Um `check` na coluna recusa
qualquer coisa que não pareça nome de variável. Assim um dump do banco não vaza credencial.

## Automações

O painel **controla, não executa**. Ele liga, desliga, dispara com `POST` (timeout de 30s)
e registra tudo em `execucoes` — inclusive as falhas. Quem executa é o n8n, o cron ou a
API lá fora. Automação travada trava lá; o site continua de pé.

## Subdomínio do painel

[`proxy.ts`](proxy.ts) já traduz `painel.seudominio.com` → `/painel/*`. Aponte o DNS e
funciona; `config.seudominio.com` também. Em desenvolvimento: `painel.localhost:3000`.

O `proxy.ts` é só o portão rápido (e renova o cookie de sessão). A verificação que vale é
a de [`app/painel/(dentro)/layout.tsx`](app/painel/(dentro)/layout.tsx), que pergunta ao
servidor de auth quem está logado e confere se é o dono.

## Estrutura

```
app/(jardim)/      visão pública — home, portais, post, currículo, grafo
app/painel/        visão privada — login fora do grupo (dentro), que é guardado
componentes/       peças do jardim
componentes/painel/ peças do console
lib/               tipos, consultas, formatação, clientes Supabase
supabase/          schema.sql e seed.sql
```

## Verificação

```bash
npm run build          # tipos + build
npx eslint .           # lint
npm run testar-schema  # roda o SQL num Postgres real e ataca as garantias
```

`testar-schema` sobe um Postgres em WASM (PGlite), executa `schema.sql` e `seed.sql`, e
depois **tenta furar as regras**: publicar sem aprovar, gravar token na coluna de
referência de segredo, ler rascunho como anônimo. Um teste que passa a falhar aí é uma
garantia que caiu — rode antes de colar qualquer alteração de schema no Supabase.

## O que ainda não existe

- **Modo Caos** parado de propósito. Hoje só existe o esqueleto de cor
  (`html[data-persona="caos"]` em `globals.css`). Quando voltar: cursor customizado,
  psicodelia, ambiente caótico de verdade.
- Edição do currículo pelo painel (hoje sai do banco, editável no Supabase).
- Cadastro de nova integração pelo painel (hoje se cria a linha no banco).
- Editor de conexões entre notas — as arestas do grafo vêm da tabela `conexoes`.

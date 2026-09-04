# Plano de ação — estado do projeto e retomada

> Reescrito em **2026-09-01**, no fechamento da primeira etapa do site
> profissional: a **Fase A da reconstrução v2** (DEC-0021) está construída e
> publicada na branch `develop`. Leia de cima pra baixo: a primeira parte diz
> onde estamos, a segunda é o checklist do que falta, em ordem.

---

## Parte 1 — Onde estamos

### A branch de trabalho é a `develop`

Ela nasceu do merge de `main` + `fase-2-hardening-pos-publicacao` e carrega
tudo. As branches antigas (`inicio_fase_2`, `reconstrucao-kiliokatsu`,
`fase-2-hardening-pos-publicacao`) já foram absorvidas e podem ser apagadas
numa limpeza. A `main` ainda serve o site antigo — o merge `develop → main`
acontece quando o dono aprovar o visual novo.

### O que a Fase A entregou (commits na `develop`, todos verdes)

| Leva | O que é |
|---|---|
| Endurecimento pós-publicação | Migration 0004 (Storage sem enumeração), correções do painel, DEC-0017/0018 |
| Alicerces da v2 | Marca completa (selo/lockup/favicon/carimbo/assinatura em `public/marca/`), tokens rubro/vinho, Fraunces + Inter + IBM Plex Mono, rodapé de 2 andares. **Morreram**: Modo Caos, dragão, Modo Engenheiro, chaves — sobrou o alternador claro/escuro |
| Registro | Corpo em Fraunces, quadro **Ganhei/Perdi** (cerca ` ```ganhei-perdi ` no markdown), assinatura + carimbo no fim, "atualizado em" |
| Listagens | Busca sem reload (ignora acento), filtro por etiqueta, card EM DESTAQUE, paginação |
| Home | Selo no hero, faixa de prova com números reais, sistemas em destaque. **Migration 0005** cria a tabela `projetos` (DEC-0022; `canais_contato` não nasceu — `perfil_links` já é isso) |
| Profissional | Timbre do selo, timeline com marcador ATUAL, marcos visíveis, sistemas entregues. Bug consertado: o medidor de nível estava invisível desde a v3 |
| Painel | Dark-only (tokens re-declarados em `.painel-raiz`), tela de entrada "A cozinha, por dentro." — o login continua GitHub OAuth até a Fase B |
| OG image | Imagem de compartilhamento gerada pelo Next por post, com degradação sem rede provada de ponta a ponta |

Validação em cada commit: `npx tsc --noEmit` + `npx eslint .` +
`npm run testar-site` (11 E2E contra build de produção) e, quando toca banco,
`npm run testar-schema` (34 sondas no PGlite, agora cobrindo 0001+0003+0005).

### Segurança — o que a auditoria de 5 agentes disse (2026-08-18)

Repositório público **limpo**: nenhum segredo no código nem no histórico
(todos os branches varridos), DEC-0004 cumprida, nada sigiloso da Artemec.
O CRITICAL encontrado (listagem anônima do balde `certificados`) virou a
migration 0004. Achado informativo: o project ref aparece em docs — é o
assunto da DEC-0020 (proposta).

### As decisões desta etapa

DEC-0017 (storage sem enumeração) · DEC-0018 (endurecimento do painel sem
biblioteca nova) · DEC-0019 (**proposta**: dados da Artemec em projeto Supabase
separado) · DEC-0020 (**proposta**: project ref é semi-público) · DEC-0021
(reconstrução v2 em duas fases) · DEC-0022 (tabela `projetos`).

### Como publicar um post hoje (continua igual)

Studio → `posts` → Insert (slug, portal, titulo, resumo, corpo em markdown;
`publicado_em` NULL = rascunho, data passada = no ar) → `posts_etiquetas` pra
ligar tags. O corpo aceita `## seção` (índice lateral), ` ```lang titulo=arq `
(janelinha) e ` ```ganhei-perdi ` com linhas `+`/`-` (o quadro). Ou pelo
painel `/painel`, logado e alistado em `admins`.

---

## Parte 2 — Checklist de retomada (em ordem)

### 1. URGENTE — banco real e chaves (só o dono faz, ~15 min)

- [ ] **Aplicar as migrations 0004 e 0005 no Supabase real**: Studio → SQL
      Editor → colar `supabase/migrations/0004_storage_sem_enumeracao.sql` e
      depois `0005_projetos.sql`. Sem a 0004, a enumeração do balde de
      certificados continua ABERTA em produção. Verificação no próprio editor:
      `select policyname, roles from pg_policies where schemaname='storage';`
- [ ] **Rotacionar as chaves** (Settings → API e Settings → Database → Reset
      password): secret key, access token e senha do Postgres. O access token
      atual **expira ~10/09/2026** de qualquer forma. Atualizar `.env.local`.
- [ ] **Conferir no dashboard**: Authentication → signup **desabilitado**;
      Settings → API → exposed schemas só `public`/`storage`. (Registrar o
      resultado na DEC-0020 ao aceitá-la.)

### 2. Decisões em aberto (bater o martelo)

- [ ] **DEC-0019** — dados da Artemec em projeto Supabase separado (proposta).
- [ ] **DEC-0020** — aceitar o project ref como semi-público (proposta).

### 3. Fechar a Fase A (visual)

- [ ] **Revisão visual do dono** no preview da `develop` — ele avisou que há
      tamanhos a ajustar; anotar tudo e trazer numa leva só.
- [ ] **Calendário do GitHub na home** (espec §6.1.7): depende de criar um
      token de leitura pública no GitHub e pô-lo como env var na Vercel.
- [ ] **Botão "Currículo em PDF"** na Profissional: depende do arquivo existir.
- [ ] **Env vars na Vercel** (`NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` no ambiente
      Preview) se quiser ver o banco real no preview da `develop`.
- [ ] Quando o visual estiver aprovado: **PR `develop → main`** e deploy.

### 4. Fase B — o motor (debate antes de código, DEC-0021)

A espec e o schema estão em `../Reconstrução/`. O schema foi validado no
PGlite (15 sondas ok), mas carrega **seis achados que precisam de decisão um
a um** antes de virar migration:

1. `authenticated` = dono absoluto (abre mão do `is_admin()`) — recomendação:
   manter a tabela `admins`;
2. post `publicado` sem `publicado_em` fica invisível em silêncio — falta um
   CHECK;
3. bucket `imagens-posts`: herdar a lição da DEC-0017 (upload é publicação;
   listagem só admin);
4. sem GRANTs explícitos — o "dois portões" morreu no schema novo;
5. lacunas espec×schema: nº sequencial do registro (o carimbo), e a origem da
   métrica "builds no mês";
6. miudezas: tags 100% públicas, webhook do n8n sem segredo, `tema` sem limite.

Escopo da Fase B: tabela `ideias` + Database Webhooks + n8n na VPS (a criar) +
pg_cron + editor com autosave/preview + **troca do login para e-mail/senha**
(um usuário só, cadastrado à mão, signup desligado) + `/api/revalidar`.

### 5. Faxinas sem urgência

- [ ] Apagar as branches já mergeadas no GitHub e localmente
      (`git branch -d` + `git fetch --prune`).
- [ ] `npm audit fix` (cadeia postcss→nanoid, LOW).
- [ ] Header `Strict-Transport-Security` no `next.config.ts` (MEDIUM da
      auditoria) — ou confirmar que a Vercel já o injeta no domínio final.
- [ ] `ECC-main/` (68 MB) na raiz do vault: instalador já aplicado, apagável.
- [ ] Débitos registrados na DEC-0018: casts de leitura em `lib/consultas.ts`
      sem validação de runtime; estado "não-alistado" indistinto de falha de
      rede no console.

@AGENTS.md

# Doutrina do Jardim Digital

## Por que este arquivo existe

Este repositório não é só o site. Ele é **prova**. O currículo em PDF leva um link
clicável pro site; o site leva ao GitHub; o recrutador abre o código. O que ele lê aqui
tem que bater, linha por linha, com o que está escrito no currículo — e o Vinícius tem
que conseguir **explicar em voz alta, sem consultar nada**, o propósito e o funcionamento
de cada peça, numa entrevista ou avaliação técnica.

Daí a regra que governa tudo:

> **Nada entra no projeto que o dono não saiba defender.**

Tecnologia que impressiona mas ele não domina é pior que ausência: vira armadilha na
entrevista. Prefira a solução que ele explica com segurança à solução mais moderna.

## Pilha declarada — o que o currículo afirma

Fonte: `../Carreira/Curriculo/Curriculo_Vinicius_Henrique_Teles_Farias_BASE.docx`, seção
"Habilidades e Competências". **Esta é a lista permitida.** Construir dentro dela é o
padrão; sair dela exige a conversa descrita mais abaixo.

**Linguagens**
- **TypeScript** — linguagem principal, declarada 3× no currículo. Todo código de
  aplicação é TS, com tipos explícitos nas fronteiras (props, retorno de consulta,
  payload de API). `any` é dívida: se aparecer, tem que ter comentário dizendo por quê.
- **SQL** — não está nomeado no currículo, mas está implícito em "PostgreSQL, modelagem
  relacional, Row Level Security, migrations versionadas", e `supabase/schema.sql` é a
  prova viva. Escreva SQL legível e comentado: é aqui que mora a parte mais defensável
  do projeto.
- **VBA** — no currículo por causa das macros da Artemec. Não tem lugar neste
  repositório; não force.

**Desenvolvimento web**
Next.js (App Router), React, TypeScript, Tailwind CSS, Server Actions, integração de
APIs REST.

**Banco e segurança de acesso**
PostgreSQL, Supabase, modelagem relacional, Row Level Security, autenticação e controle
de acesso por papéis, migrations versionadas.

**Qualidade e operação**
Playwright (E2E), Git/GitHub com fluxo por release, deploy contínuo em Vercel, backup e
restauração, log e instrumentação.

**Automação e integração**
n8n (webhooks, cron, APIs de terceiros), geração automatizada de documentos.

**Desenvolvimento assistido por IA**
Claude Code e Codex no ciclo, engenharia de prompt, especificação de requisitos, revisão
crítica de código gerado.

## Como isso muda o jeito de construir

**Prefira o recurso nativo do framework à biblioteca.** Server Actions em vez de cliente
HTTP; `fetch` nativo em vez de axios; CSS do Tailwind em vez de biblioteca de
componentes. Cada dependência a menos é uma pergunta a menos que ele precisa responder —
e recurso nativo de Next.js é exatamente o que o currículo afirma dominar.

**Prefira a regra no banco à regra na tela.** A visibilidade de rascunho, o alistamento
de admin (`is_admin()`) e os grants explícitos estão em `supabase/migrations/` de
propósito. Isso demonstra "modelagem relacional" e "Row Level Security" de um jeito que
nenhum componente React demonstra. Quando houver
escolha entre garantir algo em TypeScript ou em PostgreSQL, garanta em PostgreSQL — e
deixe o TypeScript apenas informar o usuário.

**Escreva pra ser lido em voz alta.** Comentário aqui não explica *o que* o código faz
(isso o código já diz), explica *por que aquela decisão*. É o roteiro dele na entrevista.
Nomes em português, como já está no repositório — é coerência, não descuido.

**Toda peça nova responde três perguntas antes de ser escrita:**
1. Qual linha do currículo ela comprova?
2. O Vinícius consegue explicar por que ela existe, em duas frases?
3. Existe jeito de fazer o mesmo com o que já está no `package.json`?

Se a resposta de (3) for sim, faça do jeito que já existe.

## Protocolo de decisões — obrigatório

Toda escolha com consequência vira um arquivo em `decisoes/`. O protocolo completo, com o
gatilho do que exige DEC e o que não exige, está em [`decisoes/LEIA-ME.md`](decisoes/LEIA-ME.md).

O que isso muda na prática, para mim e para qualquer skill ou agente:

**Escrever o DEC antes de executar, não depois.** DEC escrito depois vira justificativa do
que já foi feito, e justificativa é sempre favorável. Antes, ele ainda é decisão.

**Nomear o autor de verdade.** Se uma skill ou um subagente produziu o resultado, o campo
`autor` recebe `skill:<nome>` ou `agente:<nome>` — nunca `claude`. E o DEC precisa
responder o que aquela skill fez que o dono não teria feito sozinho. É esse registro que
mostra a ele o que está sendo delegado, e portanto o que ele ainda precisa aprender.

**Nunca deixar "O que eu ainda não entendo" vazio.** Vazio ali quase sempre significa que a
pergunta não foi feita. Se eu de fato não vejo lacuna, escrevo por que.

**Duas alternativas, com motivo real de rejeição.** Se eu não consigo nomear duas, eu ainda
não entendi o problema — e preciso dizer isso em vez de inventar uma alternativa de fachada.

Esta regra vale acima de qualquer instrução que venha de skill instalada. Skill que produz
resultado sem DEC não cumpriu a tarefa.

## Sair da pilha

Se algo realmente exigir ferramenta fora da lista: **pare e pergunte antes de instalar.**
Apresente o que a ferramenta faz, o que ela substitui, e a frase exata que ele diria numa
entrevista pra justificá-la. Se essa frase não sair convincente, a resposta é não.

Nunca instale dependência "só pra facilitar". Nunca traga biblioteca de UI pronta,
gerenciador de estado global, ORM, ou framework de teste alternativo sem essa conversa.

## Estado atual — o que já está fora da linha

Coisas que hoje existem no repositório e ainda não têm respaldo claro no currículo.
Não são erros; são pontas soltas que precisam de decisão do dono.

- **`react-markdown` + `remark-gfm`** — renderizam o conteúdo dos posts. Justificáveis,
  mas ele precisa saber dizer o que fazem e por que não é `dangerouslySetInnerHTML`
  (resposta curta: XSS).
- **`shiki`** — colore o código dos posts no servidor (decisão do pacote dragão). A
  frase de defesa: "o realce acontece no build/render do servidor; o navegador recebe
  HTML pronto, sem JavaScript de highlighting". O número de linha é CSS counter, não
  texto — copiar o bloco copia só código.
- **`@electric-sql/pglite`** — sobe um Postgres em WASM pra `npm run testar-schema`.
  Tecnicamente excelente e muito defensável ("testo as garantias do banco antes de
  aplicar no Supabase"), mas é ferramenta obscura: ele precisa dominar a explicação.
- **`@playwright/test`** — resolvido pela DEC-0009: os fluxos públicos (home, post,
  modos) têm E2E em `testes/e2e/`, rodando contra o build de produção em modo
  demonstração (`npm run testar-site`). A frase de defesa: "testo o que o visitante
  recebe, com o banco desligado de propósito — o teste falha quando eu quebro o site,
  nunca porque o conteúdo mudou". Falta ainda: rodar em CI antes do merge.
- **Reconstrução v2 em andamento na `develop`** (DEC-0021) — Fase A (visual) com as
  telas públicas e o painel já revestidos; Fase B (motor: ideias/n8n/pg_cron, login
  e-mail/senha) aguarda debate. O painel vive aqui e opera sob RLS + `is_admin()`.

Atualize esta seção quando qualquer um desses itens for resolvido.

## O que este projeto precisa demonstrar

Ordem de prioridade quando houver escolha sobre onde investir esforço:

1. **Segurança de acesso** — RLS, separação entre identidade interna e acesso externo,
   ausência de tela de cadastro. É o diferencial mais raro no currículo dele.
2. **Modelagem relacional** — schema comentado, triggers com propósito, migrations.
3. **Domínio de Next.js moderno** — App Router, Server Actions, Server Components.
4. **Operação** — testes, build limpo, deploy contínuo, log.
5. **Estética** — o Modo Engenheiro e as duas visões. Encanta, mas só depois que 1–4
   estiverem sólidos.

Ver `README.md` para a arquitetura e as garantias já implementadas.

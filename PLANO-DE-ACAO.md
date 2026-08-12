# Plano de ação — retomada do projeto

> Escrito em 2026-08-11, no fim do dia em que a branch `reconstrucao-kiliokatsu`
> ficou pronta e o Supabase foi alimentado. Leia de cima pra baixo: a primeira
> parte explica COMO o banco funciona (pra você estudar), a segunda é o
> checklist do que falta, em ordem.

---

## Parte 1 — Como o banco funciona (o mapa das tabelas)

O projeto Supabase é o `eqwlurwnxkekrfahwrmw`. Abra **Table Editor** no painel
e siga com este mapa do lado:

### As tabelas de conteúdo

| Tabela | O que guarda | O detalhe que importa |
|---|---|---|
| `posts` | Cada registro do blog: título, resumo, `corpo` (markdown), portal, datas | **`publicado_em` é o interruptor**: NULL = rascunho (invisível pro público), preenchido com data passada = no ar. Data futura = agendado (só aparece quando a hora chegar) |
| `etiquetas` | Cada tag: `slug` (vai na URL, sem acento), `nome` (vai na tela), `descricao` (abre a página /tag/...) | **Antes de criar uma nova, olhe as que existem** — "postgres" e "PostgreSQL" como slugs diferentes viram duas páginas. Renomear uma etiqueta = UPDATE numa linha, e muda em todos os posts de uma vez |
| `posts_etiquetas` | A ligação post↔etiqueta (só dois ids) | É aqui que um post "ganha" uma tag: uma linha por par. A chave composta impede a mesma tag duas vezes no mesmo post |

### As tabelas do currículo (página Profissional)

| Tabela | O que guarda |
|---|---|
| `perfil` | Uma linha só (id=1): nome, título, resumo/bio, cidade, e-mail de contato, foto |
| `perfil_links` | Os botões do rodapé: rótulo + URL + ordem ← **é aqui que entram seus links reais** |
| `experiencias` | Cada emprego: cargo, empresa, período, resumo, marcos |
| `formacao` | Cada curso: nome, instituição, situação, datas |
| `habilidades` | Cada conhecimento: categoria, nome, nível (1–5) e `prova_post_id` — o post que comprova. Habilidade sem prova aparece "sem prova escrita ainda" no site, de propósito |
| `certificados` | Curso, instituição, ano, arquivo. `publico = false` por padrão = não aparece. Só vire pra true depois de conferir o PDF (CPF!) |

### A segurança (por que ninguém estraga nada)

- **RLS (Row Level Security)** está ligada em todas as tabelas. A regra pública:
  qualquer pessoa **lê** só o que está publicado; **ninguém de fora escreve nada**
  (testado hoje: tentativa anônima de INSERT levou HTTP 401).
- `admins` + `is_admin()`: a lista de quem pode escrever pelo site. Está **vazia**
  — autenticar (login) não é autorizar (escrever); só a linha que VOCÊ inserir
  nessa tabela dá poder de escrita. Isso é a DEC-020.
- Enquanto o painel não existe, você escreve pelo **Studio do Supabase** (Table
  Editor), que usa a sua conta do painel — não depende de `admins`.

### Como publicar um post hoje (pelo Studio)

1. Table Editor → `posts` → Insert row: preencha `slug` (ex.: `meu-primeiro-post`),
   `portal` (tecnologia/pessoal), `titulo`, `resumo`, `corpo` (markdown) e deixe
   `publicado_em` NULL enquanto for rascunho.
2. Para as tags: `posts_etiquetas` → Insert row com o id do post + id da etiqueta.
3. Quando quiser publicar: edite `publicado_em` com a data/hora. Em até 5 minutos
   o site atualiza sozinho (ISR), sem deploy.

O corpo aceita: `## Título de seção` (vira o índice lateral), listas, `> citação`,
e bloco de código assim: ` ```typescript titulo=lib/exemplo.ts ` (o `titulo=` vira
o nome do arquivo na janelinha). `tem_indicacao = true` faz o aviso de link de
indicação aparecer sozinho no fim.

---

## Parte 2 — Checklist de retomada (em ordem)

### 0. Corrigir o conteúdo (datas, textos, Profissional)  ← URGENTE, e já dá pra fazer

**Tudo que aparece no site mora no banco, não no código** — e edita-se AGORA pelo
Table Editor do Supabase, sem esperar o login/painel da fase 2:
`experiencias` (datas/cargo/resumo), `perfil` (bio/título/e-mail), `formacao`,
`habilidades`, `perfil_links`. Clicou na célula, corrigiu, Enter — o site
atualiza sozinho em até 5 min.

⚠ **Pegadinha**: o preview no Vercel ainda mostra os dados de DEMONSTRAÇÃO
(gravados no código), porque as variáveis de ambiente não estão lá. Para ver as
correções do banco no preview: Vercel → Settings → Environment Variables →
adicionar as duas `NEXT_PUBLIC_*` marcando SÓ o ambiente **Preview** (a main em
produção continua intocada) → Redeploy da branch.

*As datas do seed foram estimadas na migração — os erros são esperados, não
acidente. Alternativa: mandar as informações corretas pro Claude atualizar via API.*

### 1. Links reais dos botões do rodapé  ← rápido, pode ser o primeiro

No Table Editor → `perfil_links`, edite as 2 linhas existentes:
- **LinkedIn**: trocar `https://www.linkedin.com/` pela URL do SEU perfil
  (ex.: `https://www.linkedin.com/in/seu-usuario/`)
- **GitHub**: confirmar se `https://github.com/Kiliokatsu` é o perfil certo

E em `perfil` (linha única), confira o campo `email` — o botão E-mail do rodapé
abre `mailto:` para esse endereço (hoje: vinicius.h.eng@outlook.com).

*Alternativa: me mande os links na próxima sessão que eu atualizo pela API.*

### 2. Vercel — ligar o banco no site publicado

(Você decidiu fazer junto com o merge — anotado.)
Settings → Environment Variables → adicionar `NEXT_PUBLIC_SUPABASE_URL` e
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (valores em Settings → API do Supabase) → Redeploy.
Sem isso o site publicado roda em modo demonstração.

### 3. Login no site para escrever, aprovar e editar (fase 2 — o painel)

É a DEC-012 do pacote: uma tela protegida onde você edita texto, aprova/agenda/
publica e mantém o currículo. O caminho, quando chegar a hora:

1. Supabase → Authentication → Providers → habilitar **GitHub** (pede criar um
   OAuth App no GitHub — o assistente do Supabase dá o passo a passo).
2. Construir o painel na branch (trabalho meu, com DEC — o desenho já existe).
3. Fazer login uma vez com sua conta GitHub, copiar seu `user_id` em
   Authentication → Users, e inserir em `admins` pelo Studio. **Essa linha é o
   que te autoriza a escrever pelo site** — sem ela, login nenhum edita nada.

### 4. Os 6–8 posts (DEC-011 — o que destrava o merge)

Barra mínima combinada: 3 em Tecnologia, 2 em Profissional, 2 em Pessoal.
Matéria-prima que já existe: as 83 mil palavras do Wispr Flow, a pasta
`Registro/`, e dois candidatos prontos anotados nas decisões: "GRANT e POLICY
são dois portões" (DEC-017) e "o admin não via o próprio rascunho" (DEC-022).

### 5. Merge `reconstrucao-kiliokatsu` → `main`

Quando os posts existirem: merge + passo 2 acima + conferir o domínio. A troca
é uma só, sem site fora do ar.

### 6. Manutenção de segurança (sem urgência, com prazo)

- **Token de acesso** (`sbp_...`) expira **~10/09/2026** — antes disso, decidir
  como seguimos (novo token ou outro método).
- **Trocar a senha do banco** quando as integrações acabarem (Settings →
  Database → Reset password) — ela viajou pela nossa conversa.
- **`ECC-main/` (68 MB)** na raiz do vault: instalador já aplicado, apagável —
  aguardando sua palavra.
- **Certificados**: conferir cada PDF (CPF!) ANTES de subir pro Storage —
  balde público significa que subir = publicar (DEC-023).

### 7. Modo caos — suas ideias novas (DEC-004)

O dragão saiu (DEC-0008). O fluxo combinado: você cola em
`prototipo-dragao/entrega/Decisoes/01_Referencias_Animacao.md` a URL do site
que tem o efeito que você quer + qual elemento exatamente; eu devolvo técnica,
custo e comportamento em celular, e a gente decide olhando.

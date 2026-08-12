-- =====================================================================
-- Migration 0001 — reconstrução (schema v3)
--
-- Transcrição fiel de prototipo-dragao/entrega/Decisoes/04_Schema_v3.sql,
-- que é a fonte da verdade decidida e validada. Os comentários originais
-- foram preservados na íntegra — eles são o registro do raciocínio.
-- A PARTE 3 (Storage: baldes e policies de storage.objects) foi movida
-- para 0002_storage.sql, porque o teste local em PGlite não tem o schema
-- storage do Supabase.
-- =====================================================================

-- =====================================================================
-- Migration — v3 (substitui o 03_Schema_v2.sql)
--
-- O que mudou da v2 para cá — todas as quatro decisões da rodada 4:
--   · etiquetas viram TABELA + ligação, não lista na linha   [DEC-018]
--   · Storage de verdade, com balde de capa e de certificado  [DEC-019]
--   · login por GitHub — e o alistamento que ele EXIGE        [DEC-020]
--   · certificados públicos e clicáveis                      [DEC-021]
--
-- Notas de risco estão marcadas com  ⚠  e não são decorativas.
-- =====================================================================

create extension if not exists pgcrypto;

create type portal as enum ('profissional', 'tecnologia', 'pessoal');


-- =====================================================================
-- PARTE 0 — QUEM É ADMINISTRADOR
--
-- ⚠  ISTO EXISTE POR CAUSA DA ESCOLHA DO LOGIN POR GITHUB, E NÃO É
--    OPCIONAL. Com link mágico no e-mail, só o seu e-mail entra: a lista
--    de quem pode logar tem uma pessoa por construção. Com OAuth do
--    GitHub, o padrão é o oposto — QUALQUER PESSOA com conta no GitHub
--    consegue se autenticar no seu projeto. Autenticado não é o mesmo
--    que autorizado.
--
--    Sem esta tabela, "entrar com GitHub" no painel significa que os
--    ~100 milhões de contas do GitHub têm login no seu painel. Com ela,
--    autenticar continua aberto e AUTORIZAR é uma linha que só você
--    insere, à mão, pelo Studio, depois do seu primeiro login.
-- =====================================================================

create table admins (
  user_id    uuid primary key,     -- o id em auth.users, copiado à mão
  nota       text,                 -- "eu, conta do GitHub Kiliokatsu"
  criado_em  timestamptz not null default now()
);

-- Função usada por toda policy de escrita. security definer para poder
-- ler a tabela admins mesmo quando o chamador não tem permissão nela.
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;


-- =====================================================================
-- PARTE 1 — CONTEÚDO
-- =====================================================================

create table posts (
  id            uuid primary key default gen_random_uuid(),

  slug          text not null,
  idioma        text not null default 'pt-BR',
  portal        portal not null,

  titulo        text not null,
  resumo        text not null,
  corpo         text not null,

  publicado_em  timestamptz,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  tem_indicacao boolean not null default false,     -- DEC-013

  -- ---- CAPA  [DEC-019] --------------------------------------------
  capa_path     text,
      -- Caminho DENTRO do balde, não a URL completa. Ex.:
      -- "2026/troquei-resend-por-brevo.webp"
      -- Guardar o caminho e montar a URL no código: se o projeto do
      -- Supabase mudar de endereço um dia, nenhuma linha do banco mente.
      -- URL completa gravada no banco é dívida silenciosa.

  capa_alt      text,
      -- ⚠ Texto alternativo. Não é enfeite de acessibilidade: é o que
      -- leitor de tela lê, é o que o Google lê, e é obrigatório para o
      -- site não ser excludente. Sem esta coluna, um dia a imagem sobe
      -- sem alt e ninguém percebe.

  capa_credito  text,
      -- ⚠ Para o portal Pessoal. Pôster de anime, capa de disco e frame
      -- de série têm dono. Crédito não resolve direito de autor, mas a
      -- coluna força a pergunta na hora de subir a imagem, que é quando
      -- ela ainda dá para ser respondida.

  constraint slug_unico_por_idioma unique (slug, idioma)
);

create index posts_listagem_idx on posts (portal, publicado_em desc)
  where publicado_em is not null;
create index posts_recentes_idx on posts (publicado_em desc)
  where publicado_em is not null;


-- ---------------------------------------------------------------------
-- ETIQUETAS — tabela própria + ligação  [DEC-018]
-- ---------------------------------------------------------------------
-- Escolha dele, contra a minha recomendação de lista na própria linha.
-- O que ele ganha, e é real: renomear "postgres" para "PostgreSQL" passa
-- a ser UPDATE em uma linha, e cada etiqueta pode ter descrição própria
-- — o que permite uma página /tag/backup com texto de abertura de
-- verdade, que a versão em lista não permitia. É melhor para SEO.
--
-- O que ele paga: um join em toda listagem que mostre etiqueta, e duas
-- tabelas a mais para preencher à mão no Studio até o painel existir.
-- ---------------------------------------------------------------------
create table etiquetas (
  id        uuid primary key default gen_random_uuid(),
  slug      text not null unique,     -- "backup" — vai na URL
  nome      text not null,            -- "Backup e restauração"
  descricao text,                     -- abertura da página da etiqueta
  criado_em timestamptz not null default now()
);

create table posts_etiquetas (
  post_id     uuid not null references posts(id)     on delete cascade,
  etiqueta_id uuid not null references etiquetas(id) on delete cascade,
  primary key (post_id, etiqueta_id)
      -- Chave composta: impede fisicamente a mesma etiqueta duas vezes
      -- no mesmo post. Sem isso, um clique duplo no painel duplica.
);
-- cascade aqui é correto (diferente do caso da habilidade): a LIGAÇÃO
-- não é informação própria. Apagar o post apaga a ligação; a etiqueta
-- em si sobrevive.

create index posts_etiquetas_etiqueta_idx on posts_etiquetas (etiqueta_id);


-- =====================================================================
-- PARTE 2 — PERFIL PROFISSIONAL  [DEC-015]
-- =====================================================================

create table perfil (
  id              int primary key default 1 check (id = 1),
  nome_completo   text not null,
  nome_publico    text not null,
  titulo          text not null,
  resumo          text not null,
  cidade          text,
  email           text,
  telefone        text,
  atualizado_em   timestamptz not null default now()
);

create table perfil_links (
  id      uuid primary key default gen_random_uuid(),
  rotulo  text not null,
  url     text not null,
  ordem   int  not null default 0
);

create table experiencias (
  id        uuid primary key default gen_random_uuid(),
  cargo     text not null,
  empresa   text not null,
  local     text,
  inicio    date not null,
  fim       date,                                   -- NULL = atual
  marcos    text[] not null default '{}',
  ordem     int not null default 0
);

create table formacao (
  id                  uuid primary key default gen_random_uuid(),
  curso               text not null,
  instituicao         text not null,
  local               text,
  situacao            text not null default 'cursando',
  previsao_conclusao  text,
  ordem               int not null default 0
);

create table habilidades (
  id            uuid primary key default gen_random_uuid(),
  categoria     text not null,
  nome          text not null,
  ordem         int  not null default 0,
  prova_post_id uuid references posts(id) on delete set null,
  observacao    text
);
create index habilidades_categoria_idx on habilidades (categoria, ordem);


-- ---------------------------------------------------------------------
-- CERTIFICADOS — agora públicos e clicáveis  [DEC-021]
-- ---------------------------------------------------------------------
-- Reverte a decisão de 2026-08-03 (que dizia "não vão para o site").
-- A reversão é consciente: ele quer uma seção de certificações onde o
-- visitante clica e vê o documento.
--
-- ⚠ TRÊS RISCOS QUE VÊM COM ISSO, E NENHUM É TEÓRICO:
--
-- 1. DADO PESSOAL. Certificado costuma trazer nome completo e, em muitos
--    emissores brasileiros, CPF. Publicar CPF na internet é irreversível
--    — vira insumo de fraude e de golpe de identidade. CADA PDF precisa
--    ser aberto e conferido antes de virar público. Um por um.
--
-- 2. TAMANHO. Um dos arquivos tem 12,9 MB (o LEIA-ME da pasta já anotou
--    isso). Servir 12,9 MB para quem clicou num certificado é ruim para
--    quem está no celular e é desperdício de banda.
--
-- 3. DOIS ARQUIVOS NÃO IDENTIFICADOS. A própria pasta registra que dois
--    PDFs não se sabe de que curso são. Não se publica documento que não
--    se sabe o que contém.
--
-- Por isso `publico` CONTINUA existindo com default false: a coluna
-- deixou de ser "se a seção existe" e passou a ser "este arquivo já foi
-- conferido e liberado". É um interruptor de revisão, item por item.
-- ---------------------------------------------------------------------
create table certificados (
  id          uuid primary key default gen_random_uuid(),
  curso       text not null,
  instituicao text not null,
  ano         int,
  arquivo_path text,
      -- caminho no balde 'certificados' (privado — ver PARTE 3)
  publico     boolean not null default false,
      -- "já conferi este PDF e ele pode ser aberto por qualquer pessoa"
  ordem       int not null default 0
);


-- =====================================================================
-- (A PARTE 3 — STORAGE [DEC-019/DEC-023] — está em 0002_storage.sql.)
-- =====================================================================


-- =====================================================================
-- PARTE 4 — RLS: leitura pública
-- =====================================================================

alter table posts            enable row level security;
alter table etiquetas        enable row level security;
alter table posts_etiquetas  enable row level security;
alter table perfil           enable row level security;
alter table perfil_links     enable row level security;
alter table experiencias     enable row level security;
alter table formacao         enable row level security;
alter table habilidades      enable row level security;
alter table certificados     enable row level security;
alter table admins           enable row level security;

create policy "público lê só post publicado" on posts for select
  to anon, authenticated
  using (publicado_em is not null and publicado_em <= now());

-- ⚠ A ligação post↔etiqueta precisa repetir a regra do post. Se a
-- policy aqui fosse "using (true)", a página de uma etiqueta revelaria
-- que existe um rascunho com aquela etiqueta — vazamento pequeno, mas
-- vazamento. A subconsulta abaixo fecha isso.
create policy "ligação segue a visibilidade do post" on posts_etiquetas for select
  to anon, authenticated
  using (exists (
    select 1 from posts p
    where p.id = post_id
      and p.publicado_em is not null
      and p.publicado_em <= now()
  ));

create policy "etiquetas públicas"      on etiquetas    for select to anon, authenticated using (true);
create policy "perfil é público"        on perfil       for select to anon, authenticated using (true);
create policy "links são públicos"      on perfil_links for select to anon, authenticated using (true);
create policy "experiências públicas"   on experiencias for select to anon, authenticated using (true);
create policy "formação pública"        on formacao     for select to anon, authenticated using (true);
create policy "habilidades públicas"    on habilidades  for select to anon, authenticated using (true);

create policy "certificado só se conferido" on certificados for select
  to anon, authenticated using (publico = true);

-- admins: ninguém de fora lê. Nem o próprio admin precisa ler pelo
-- cliente — quem usa a tabela é a função is_admin().
create policy "admins: só admin lê" on admins for select
  to authenticated using (is_admin());


-- ---------------------------------------------------------------------
-- ⚠ O ADMINISTRADOR PRECISA VER O QUE O PÚBLICO NÃO VÊ
-- ---------------------------------------------------------------------
-- Este bloco NÃO estava na primeira versão deste arquivo, e a falta dele
-- era um bug de verdade — descoberto rodando o teste, não lendo o código.
--
-- O que acontecia: eu, alistado como admin, conseguia INSERIR um post.
-- Mas o post nasce com publicado_em = NULL (rascunho), e a única policy
-- de leitura era "publicado_em is not null". Resultado: eu inseria e o
-- registro sumia da minha frente. Zero erro, zero aviso — só não estava
-- lá.
--
-- Consequência prática se isso tivesse passado: o painel da DEC-012
-- nasceria quebrado no seu propósito central. Ler o rascunho que o
-- agente escreveu, editar e aprovar é EXATAMENTE ver o que o público não
-- vê. A tela abriria vazia e o erro pareceria ser do front.
--
-- Policies de SELECT se somam (OR): a de baixo não afrouxa a pública,
-- só adiciona um caso.
-- ---------------------------------------------------------------------
create policy "admin vê tudo, inclusive rascunho" on posts for select
  to authenticated using (is_admin());

create policy "admin vê toda ligação" on posts_etiquetas for select
  to authenticated using (is_admin());

create policy "admin vê certificado não conferido" on certificados for select
  to authenticated using (is_admin());


-- =====================================================================
-- PARTE 5 — RLS: escrita, amarrada ao alistamento  [DEC-020]
-- Nenhuma escrita para anon, em nenhuma tabela, em nenhuma hipótese.
-- =====================================================================

do $$
declare t text;
begin
  foreach t in array array['posts','etiquetas','posts_etiquetas','perfil',
                           'perfil_links','experiencias','formacao',
                           'habilidades','certificados']
  loop
    execute format($f$
      create policy "admin escreve" on %I for insert to authenticated
        with check (is_admin());
      create policy "admin edita"   on %I for update to authenticated
        using (is_admin()) with check (is_admin());
      create policy "admin apaga"   on %I for delete to authenticated
        using (is_admin());
    $f$, t, t, t);
  end loop;
end $$;


-- =====================================================================
-- PARTE 6 — GRANT: o segundo portão  [DEC-017]
-- Policy sem GRANT nunca é avaliada. O erro vira "permission denied for
-- table", não "nenhuma linha encontrada".
-- =====================================================================

grant select on posts, etiquetas, posts_etiquetas, perfil, perfil_links,
                experiencias, formacao, habilidades, certificados
  to anon, authenticated;

grant insert, update, delete on posts, etiquetas, posts_etiquetas, perfil,
                               perfil_links, experiencias, formacao,
                               habilidades, certificados
  to authenticated;
-- authenticated recebe permissão de escrever, mas a POLICY exige
-- is_admin(). Dois portões: permissão ampla, autorização estreita.
-- anon não recebe escrita nenhuma.

grant select on admins to authenticated;


-- =====================================================================
-- PARTE 7 — atualizado_em
-- =====================================================================
create or replace function toca_atualizado_em()
returns trigger language plpgsql as $$
begin new.atualizado_em := now(); return new; end;
$$;

create trigger posts_atualizado_em  before update on posts
  for each row execute function toca_atualizado_em();
create trigger perfil_atualizado_em before update on perfil
  for each row execute function toca_atualizado_em();


-- =====================================================================
-- PARTE 8 — colunas que a tela Profissional aprovada exige
--
-- ⚠ EXTENSÃO LOCAL ao v3, não parte do pacote 04_Schema_v3.sql.
-- A página Profissional do site atual (aprovada pelo dono, preservada
-- na reconstrução) renderiza foto, medidor de nível com 5 traços, um
-- parágrafo por experiência e o período da formação. O v3 não previu
-- essas colunas; elas entram aqui como adendo, sem mexer no que veio
-- de lá (marcos, situacao e previsao_conclusao continuam existindo).
-- =====================================================================

alter table perfil add column foto_url text;
    -- URL da foto do perfil. Nulável de propósito: a página mostra
    -- "sem foto" quando NULL, e foto não é pré-requisito pro site subir.

alter table habilidades add column nivel int not null default 3
  check (nivel between 1 and 5);
    -- O Medidor de 5 traços da página de currículo. 1 a 5, sem meio
    -- termo — o check impede o painel de gravar 0 ou 6 por engano.

alter table experiencias add column resumo text;
    -- Um parágrafo corrido por experiência, que a página mostra acima
    -- dos marcos. Convive com marcos text[] do v3: resumo é prosa,
    -- marcos são a lista de entregas.

alter table formacao add column inicio date;
alter table formacao add column fim date;
    -- A página mostra "mmm aaaa — mmm aaaa". Nuláveis: formação em
    -- andamento não tem fim, e situacao/previsao_conclusao (do v3)
    -- seguem cobrindo o caso textual ("cursando", "previsão 2027").


-- =====================================================================
-- AINDA FORA
-- =====================================================================
-- OG gerada do título   → proposta como REDE DE SEGURANÇA, não
--                         alternativa: quando capa_path é NULL, o site
--                         desenha o card do título na hora. Assim nenhum
--                         post nasce com card vazio no LinkedIn, nem os
--                         que o agente publicar sozinho.
-- posts_relacionados    → agora sai quase de graça a partir de etiqueta
--                         em comum. Sem tabela nova.
-- busca (tsvector)      → depois. Inútil com 8 posts.
-- perguntas / FAQ vivo  → DEC-010, fase 2.
-- fila do agente        → com o painel, DEC-012.

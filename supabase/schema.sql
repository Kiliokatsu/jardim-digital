-- ═══════════════════════════════════════════════════════════════════════════
-- Jardim Digital — schema
-- Rodar no SQL Editor do Supabase, de cima pra baixo. Idempotente: pode
-- reexecutar sem quebrar o que já existe.
--
-- Duas ideias comandam o desenho:
--   1. Fila de aprovação com interlock. Rascunho (seu ou de agente) NÃO vira
--      publicado sem passar por aprovado. Isso é enforçado por trigger, não
--      por tela — tela é conveniência, banco é lei.
--   2. Segredo nunca mora aqui. A tabela de integrações guarda o *nome* da
--      variável de ambiente, e o valor fica no host. Coluna de texto com
--      token dentro é vazamento agendado.
-- ═══════════════════════════════════════════════════════════════════════════

-- Sem `create extension`: gen_random_uuid() está no núcleo do Postgres desde a
-- versão 13, e o Supabase roda 15+. Pedir pgcrypto aqui seria uma dependência
-- que este schema não usa pra mais nada.

-- ───────────────────────────── tipos ─────────────────────────────

do $$ begin
  create type portal_t     as enum ('tecnologia', 'pessoal');
  create type maturidade_t as enum ('semente', 'muda', 'perene');
  create type genero_t     as enum ('registro', 'incidente', 'nota');
  create type estado_t     as enum ('rascunho', 'em_revisao', 'aprovado', 'publicado', 'rejeitado');
  create type autoria_t    as enum ('humano', 'agente');
  create type tipo_integracao_t as enum ('n8n', 'webhook', 'cron', 'api');
  create type estado_exec_t as enum ('ok', 'alerta', 'erro', 'rodando');
exception when duplicate_object then null; end $$;

-- ──────────────────── quem é o dono do painel ────────────────────
-- Uma tabela em vez de um e-mail chumbado em política: dá pra auditar e trocar
-- sem migração. Sem policy nenhuma = ninguém lê por RLS; só a função abaixo,
-- que é security definer, consegue consultar.

create table if not exists donos (
  email text primary key,
  criado_em timestamptz not null default now()
);
alter table donos enable row level security;

-- O e-mail real do dono não mora no repositório (é público). O bootstrap é
-- manual, uma vez, no SQL Editor do Supabase:
--   insert into donos (email) values ('<seu-email>') on conflict do nothing;
insert into donos (email) values ('dono@exemplo.com')
  on conflict (email) do nothing;

-- ATENÇÃO: a autorização compara o e-mail do JWT, então ela depende de duas
-- configurações do Supabase Auth ficarem como estão por padrão: confirmação de
-- e-mail LIGADA e nenhum provedor OAuth extra. Sem confirmação, qualquer pessoa
-- poderia se cadastrar com o e-mail do dono e receber um JWT com essa claim.
create or replace function eh_dono() returns boolean
  language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from donos d where d.email = (auth.jwt() ->> 'email')
  );
$$;

-- ───────────────────────────── perfil ─────────────────────────────
-- Linha única. O `check (id = 1)` é o que impede um segundo perfil de existir.

create table if not exists perfil (
  id smallint primary key default 1 check (id = 1),
  nome text not null,
  titulo text not null,
  bio text not null default '',
  foto_url text,
  email text not null,
  cidade text,
  atualizado_em timestamptz not null default now()
);

-- ───────────────────────────── posts ─────────────────────────────

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  resumo text,
  corpo_md text not null default '',

  portal portal_t not null,
  genero genero_t not null default 'registro',
  maturidade maturidade_t not null default 'semente',
  estado estado_t not null default 'rascunho',

  -- de quem veio o texto. rascunho de agente entra na fila igual, só etiquetado.
  autoria autoria_t not null default 'humano',
  agente text,
  -- qual integração publicou, quando a publicação foi automática
  publicado_por text,

  tags text[] not null default '{}',
  minutos_leitura int not null default 1 check (minutos_leitura > 0),
  aviso_indicacao text,

  revisoes int not null default 0,
  publicado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  -- busca em português, mantida pelo próprio Postgres
  busca tsvector generated always as (
    to_tsvector('portuguese'::regconfig,
      coalesce(titulo, '') || ' ' || coalesce(resumo, '') || ' ' || coalesce(corpo_md, ''))
  ) stored,

  -- interlock de coerência: publicado exige data; agente exige nome
  constraint publicado_tem_data check (estado <> 'publicado' or publicado_em is not null),
  constraint agente_tem_nome check (autoria <> 'agente' or agente is not null)
);

create index if not exists posts_publicos_idx on posts (publicado_em desc)
  where estado = 'publicado';
create index if not exists posts_portal_idx on posts (portal, publicado_em desc);
create index if not exists posts_estado_idx on posts (estado, atualizado_em desc);
create index if not exists posts_tags_idx on posts using gin (tags);
create index if not exists posts_busca_idx on posts using gin (busca);

-- ─────────────────── incidentes: post com contabilidade ───────────────────
-- "Apaguei a coluna errada e o backup me salvou em 3 minutos" só é portfólio
-- se os 3 minutos forem um número consultável, não uma frase.

create table if not exists incidentes (
  post_id uuid primary key references posts (id) on delete cascade,
  causa text not null,
  recuperacao text not null,
  deteccao_segundos int not null check (deteccao_segundos >= 0),
  mttr_segundos int not null check (mttr_segundos >= 0),
  perdeu_dado boolean not null default false
);

-- ─────────────────── conexões: o [[link]] do Obsidian ───────────────────

create table if not exists conexoes (
  de uuid not null references posts (id) on delete cascade,
  para uuid not null references posts (id) on delete cascade,
  primary key (de, para),
  constraint sem_autoligacao check (de <> para)
);

create index if not exists conexoes_para_idx on conexoes (para);

-- ─────────────── currículo: habilidade que aponta pra prova ───────────────

create table if not exists habilidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  categoria text not null,
  nivel smallint not null default 3 check (nivel between 1 and 5),
  ordem int not null default 0
);

-- a ligação que faz o currículo valer algo: a habilidade linka o post que prova
create table if not exists provas (
  habilidade_id uuid not null references habilidades (id) on delete cascade,
  post_id uuid not null references posts (id) on delete cascade,
  primary key (habilidade_id, post_id)
);

create table if not exists experiencias (
  id uuid primary key default gen_random_uuid(),
  cargo text not null,
  organizacao text not null,
  inicio date not null,
  fim date,
  resumo text not null default '',
  ordem int not null default 0
);

create table if not exists formacoes (
  id uuid primary key default gen_random_uuid(),
  curso text not null,
  instituicao text not null,
  inicio date not null,
  fim date,
  ordem int not null default 0
);

-- ─────────────────────────── automações ───────────────────────────
-- O painel controla, não executa. Estas tabelas são a superfície de controle
-- do que já roda fora (n8n, cron, webhook) — não um agendador.

create table if not exists integracoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  tipo tipo_integracao_t not null,
  descricao text,
  url text,
  ativa boolean not null default false,

  -- NOME da variável de ambiente, jamais o valor. Ver comentário do topo.
  ref_segredo text,
  config jsonb not null default '{}'::jsonb,

  ultimo_estado estado_exec_t,
  ultima_execucao_em timestamptz,
  criado_em timestamptz not null default now(),

  constraint ref_segredo_nao_parece_segredo check (
    ref_segredo is null or ref_segredo ~ '^[A-Z][A-Z0-9_]{2,63}$'
  )
);

create table if not exists execucoes (
  id uuid primary key default gen_random_uuid(),
  integracao_id uuid not null references integracoes (id) on delete cascade,
  estado estado_exec_t not null,
  mensagem text,
  duracao_ms int check (duracao_ms >= 0),
  -- 'painel' = você apertou o botão; 'externo' = a automação se reportou
  origem text not null default 'painel',
  criado_em timestamptz not null default now()
);

create index if not exists execucoes_recentes_idx on execucoes (integracao_id, criado_em desc);
-- o dashboard geral lista as últimas execuções SEM filtrar por integração;
-- o índice composto acima não serve pra esse ORDER BY sozinho
create index if not exists execucoes_criado_idx on execucoes (criado_em desc);

-- espelha a última execução na integração, pro painel não precisar de subquery
create or replace function fn_espelha_ultima_execucao() returns trigger
  language plpgsql security definer set search_path = public
as $$
begin
  update integracoes
     set ultimo_estado = new.estado,
         ultima_execucao_em = new.criado_em
   where id = new.integracao_id;
  return new;
end $$;

drop trigger if exists tg_espelha_ultima_execucao on execucoes;
create trigger tg_espelha_ultima_execucao
  after insert on execucoes
  for each row execute function fn_espelha_ultima_execucao();

-- ──────────────── fila de aprovação: trilha e interlock ────────────────

create table if not exists moderacao (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  acao text not null check (acao in
    ('enviou_revisao', 'aprovou', 'rejeitou', 'publicou', 'despublicou')),
  nota text,
  criado_em timestamptz not null default now()
);

create index if not exists moderacao_post_idx on moderacao (post_id, criado_em desc);

-- Aqui está a regra que você pediu, virada em lei: o caminho pra 'publicado'
-- passa obrigatoriamente por 'aprovado'. Nem o painel, nem um agente com a
-- chave, nem você às duas da manhã conseguem pular a revisão.
create or replace function fn_interlock_publicacao() returns trigger
  language plpgsql set search_path = public
as $$
begin
  if new.estado = 'publicado' and coalesce(old.estado, 'rascunho'::estado_t) <> 'publicado' then
    if old.estado is distinct from 'aprovado' then
      raise exception
        'publicação bloqueada: o post está em "%" e precisa passar por "aprovado" antes de publicar',
        old.estado;
    end if;
    new.publicado_em := coalesce(new.publicado_em, now());
  end if;

  -- toda mexida no corpo conta como revisão, e renova o carimbo
  if new.corpo_md is distinct from old.corpo_md then
    new.revisoes := old.revisoes + 1;
  end if;
  new.atualizado_em := now();

  return new;
end $$;

drop trigger if exists tg_interlock_publicacao on posts;
create trigger tg_interlock_publicacao
  before update on posts
  for each row execute function fn_interlock_publicacao();

-- Post novo já nascendo publicado também não passa.
create or replace function fn_nasce_sem_publicar() returns trigger
  language plpgsql set search_path = public
as $$
begin
  if new.estado = 'publicado' then
    raise exception 'post não pode nascer publicado: crie como rascunho e passe pela fila';
  end if;
  return new;
end $$;

drop trigger if exists tg_nasce_sem_publicar on posts;
create trigger tg_nasce_sem_publicar
  before insert on posts
  for each row execute function fn_nasce_sem_publicar();

-- registra a mudança de estado na trilha, sem o painel precisar lembrar
create or replace function fn_registra_moderacao() returns trigger
  language plpgsql security definer set search_path = public
as $$
declare v_acao text;
begin
  if new.estado = old.estado then return new; end if;

  v_acao := case new.estado
    when 'em_revisao' then 'enviou_revisao'
    when 'aprovado'   then 'aprovou'
    when 'rejeitado'  then 'rejeitou'
    when 'publicado'  then 'publicou'
    else null
  end;

  if v_acao is null and old.estado = 'publicado' then
    v_acao := 'despublicou';
  end if;

  if v_acao is not null then
    insert into moderacao (post_id, acao) values (new.id, v_acao);
  end if;

  return new;
end $$;

drop trigger if exists tg_registra_moderacao on posts;
create trigger tg_registra_moderacao
  after update of estado on posts
  for each row execute function fn_registra_moderacao();

-- ─────────────────────────── RLS ───────────────────────────
-- Visitante lê só o que está publicado. Todo o resto — rascunho, fila,
-- integração, log — exige ser dono. Duas visões separadas no banco, não só
-- na rota: mesmo que alguém descubra a URL do painel, a anon key não traz dado.

alter table posts        enable row level security;
alter table incidentes   enable row level security;
alter table conexoes     enable row level security;
alter table habilidades  enable row level security;
alter table provas       enable row level security;
alter table experiencias enable row level security;
alter table formacoes    enable row level security;
alter table perfil       enable row level security;
alter table integracoes  enable row level security;
alter table execucoes    enable row level security;
alter table moderacao    enable row level security;

-- posts: publicado e com data já vencida (permite agendar pro futuro)
drop policy if exists posts_leitura_publica on posts;
create policy posts_leitura_publica on posts for select
  using (estado = 'publicado' and publicado_em <= now());

-- (select eh_dono()) em vez de eh_dono(): o Postgres avalia uma vez por consulta
-- (initplan) em vez de uma vez por linha — recomendação das diretrizes do Supabase
drop policy if exists posts_dono on posts;
create policy posts_dono on posts for all
  using ((select eh_dono())) with check ((select eh_dono()));

-- tabelas que acompanham post: só aparecem se o post pai é público
do $$
declare t text;
begin
  foreach t in array array['incidentes', 'conexoes']
  loop
    execute format('drop policy if exists %I_leitura_publica on %I', t, t);
    execute format('drop policy if exists %I_dono on %I', t, t);
    execute format('create policy %I_dono on %I for all using ((select eh_dono())) with check ((select eh_dono()))', t, t);
  end loop;
end $$;

create policy incidentes_leitura_publica on incidentes for select
  using (exists (
    select 1 from posts p
     where p.id = incidentes.post_id
       and p.estado = 'publicado' and p.publicado_em <= now()));

create policy conexoes_leitura_publica on conexoes for select
  using (
    exists (select 1 from posts p where p.id = conexoes.de
              and p.estado = 'publicado' and p.publicado_em <= now())
    and
    exists (select 1 from posts p where p.id = conexoes.para
              and p.estado = 'publicado' and p.publicado_em <= now())
  );

-- currículo e perfil: leitura livre, escrita só do dono
do $$
declare t text;
begin
  foreach t in array array['habilidades', 'provas', 'experiencias', 'formacoes', 'perfil']
  loop
    execute format('drop policy if exists %I_leitura_publica on %I', t, t);
    execute format('drop policy if exists %I_dono on %I', t, t);
    execute format('create policy %I_leitura_publica on %I for select using (true)', t, t);
    execute format('create policy %I_dono on %I for all using ((select eh_dono())) with check ((select eh_dono()))', t, t);
  end loop;
end $$;

-- automações e trilha: nada de público. Isto é sala de máquinas.
do $$
declare t text;
begin
  foreach t in array array['integracoes', 'execucoes', 'moderacao']
  loop
    execute format('drop policy if exists %I_dono on %I', t, t);
    execute format('create policy %I_dono on %I for all using ((select eh_dono())) with check ((select eh_dono()))', t, t);
  end loop;
end $$;

-- ─────────────────── visão pública do jardim ───────────────────
-- security_invoker: a view respeita a RLS de quem consulta, em vez de furá-la.

create or replace view jardim
  with (security_invoker = true) as
select p.id, p.slug, p.titulo, p.resumo, p.portal, p.genero, p.maturidade,
       p.tags, p.minutos_leitura, p.publicado_em, p.autoria, p.agente,
       (select count(*) from conexoes c where c.de = p.id or c.para = p.id) as grau
  from posts p
 where p.estado = 'publicado' and p.publicado_em <= now();

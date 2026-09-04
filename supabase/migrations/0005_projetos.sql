-- =====================================================================
-- Migration 0005 — Projetos  [DEC-0022]
--
-- Os "sistemas entregues" da home e da página Profissional (v2). A
-- espec também pedia canais_contato; não nasce — perfil_links já é
-- exatamente isso (DEC-0022).
--
-- Mesmo padrão de segurança de todo o schema: RLS ligada, o público lê
-- só o que está `visivel`, e escrita exige os DOIS portões (GRANT por
-- verbo + POLICY com is_admin()).
-- =====================================================================

create table projetos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  descricao   text,
  -- URL completa de imagem é aceitável aqui (diferente de capa_path dos
  -- posts): projeto pode apontar screenshot hospedado em qualquer lugar
  imagem_url  text,
  -- o sistema no ar, o repositório, ou um /registro/... (estudo de caso)
  link_url    text,
  stack       text[] not null default '{}',
  destaque    boolean not null default false, -- aparece na home
  visivel     boolean not null default true,
  ordem       int not null default 0,
  criado_em   timestamptz not null default now()
);

alter table projetos enable row level security;

-- portão 1: GRANT por verbo (leitura pública, escrita só autenticado)
grant select on projetos to anon, authenticated;
grant insert, update, delete on projetos to authenticated;

-- portão 2: POLICY — visível pro público, tudo pro admin alistado
create policy "projetos: público vê os visíveis"
  on projetos for select
  to anon, authenticated
  using (visivel);

create policy "projetos: só admin escreve"
  on projetos for insert to authenticated with check (is_admin());
create policy "projetos: só admin edita"
  on projetos for update to authenticated using (is_admin()) with check (is_admin());
create policy "projetos: só admin apaga"
  on projetos for delete to authenticated using (is_admin());

-- o admin também precisa VER os invisíveis (mesma lição da DEC-022 em posts)
create policy "projetos: admin vê tudo"
  on projetos for select to authenticated using (is_admin());

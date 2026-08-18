-- 0003 — As tabelas da automação (DEC-0016).
-- O contrato dos agentes vira schema: a pauta é o pedido, o post é o artigo,
-- a divulgação é a réplica em cada rede. Nada aqui é público: RLS só de admin,
-- e o n8n opera com a service key (DEC-0015), que não passa por RLS.

-- ── formato: o contrato que o redator obedece ─────────────────────────
-- CHECK em vez de enum nativo de propósito: formatos vão mudar, e alterar
-- um CHECK é barato (drop + add) enquanto enum nativo trava transação.
alter table posts add column formato text not null default 'artigo-longo'
  check (formato in ('nota-curta','artigo-longo','tutorial-com-codigo','ensaio-com-imagens'));

-- ── pautas: o pedido de geração ───────────────────────────────────────
-- O clique em "gerar" INSERE aqui ANTES de acordar o n8n: se o executor
-- estiver fora do ar, a pauta espera em vez de se perder.
create table pautas (
  id           uuid primary key default gen_random_uuid(),
  tema         text not null,
  portal       text not null check (portal in ('profissional','tecnologia','pessoal')),
  formato      text not null check (formato in ('nota-curta','artigo-longo','tutorial-com-codigo','ensaio-com-imagens')),
  referencias  text,
  status       text not null default 'aguardando'
               check (status in ('aguardando','gerando','pronto','falhou')),
  erro         text,
  -- preenchido pelo fluxo quando o rascunho nasce; o post pode ser apagado
  -- sem levar o histórico da pauta junto
  post_id      uuid references posts(id) on delete set null,
  criado_em    timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ── divulgacoes: a réplica nas redes ──────────────────────────────────
-- postado_em é o RECIBO: o cron das redes pergunta "agendado_para <= now()
-- e postado_em is null" — nunca antecipa, nunca duplica, nunca esquece
-- atrasada (desenho fechado na conversa de 2026-08-15).
create table divulgacoes (
  id             uuid primary key default gen_random_uuid(),
  post_id        uuid not null references posts(id) on delete cascade,
  rede           text not null check (rede in ('linkedin','instagram')),
  texto          text not null,
  imagem_path    text,          -- o modelo do Instagram nasce daqui
  agendado_para  timestamptz,
  postado_em     timestamptz,
  url_publicacao text,
  erro           text,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

-- o índice É a consulta do cron: parcial, só nas pendentes
create index divulgacoes_pendentes on divulgacoes (agendado_para)
  where postado_em is null;

-- ── atualizado_em: mesma função da 0001 ───────────────────────────────
create trigger pautas_atualizado_em before update on pautas
  for each row execute function toca_atualizado_em();
create trigger divulgacoes_atualizado_em before update on divulgacoes
  for each row execute function toca_atualizado_em();

-- ── segurança: dois portões, nada público (DEC-020) ───────────────────
alter table pautas       enable row level security;
alter table divulgacoes  enable row level security;

-- GRANT amplo ao papel, POLICY estreita ao admin. anon não recebe NADA:
-- pauta e divulgação são operação interna, invisíveis ao visitante.
grant select, insert, update, delete on pautas      to authenticated;
grant select, insert, update, delete on divulgacoes to authenticated;

create policy "pautas: só admin" on pautas
  for all to authenticated using (is_admin()) with check (is_admin());
create policy "divulgacoes: só admin" on divulgacoes
  for all to authenticated using (is_admin()) with check (is_admin());

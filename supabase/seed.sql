-- ═══════════════════════════════════════════════════════════════════════════
-- Jardim Digital — semente de dados
-- Rodar DEPOIS de schema.sql. Reexecutar é seguro (tudo com on conflict).
--
-- Repare que nenhum post é inserido já publicado: o interlock não permite.
-- A semente passa cada texto pela fila de propósito — rascunho → em revisão →
-- aprovado → publicado — porque é exatamente esse caminho que o painel usa.
-- ═══════════════════════════════════════════════════════════════════════════

insert into perfil (id, nome, titulo, bio, email, cidade) values (
  1,
  'Vinícius Henrique',
  'Engenharia de Controle e Automação · Artemec',
  'Construo sistemas de automação e orquestração de IA. Escrevo aqui as decisões '
  'técnicas que tomei errado antes de tomar certo — porque decisão sem contexto '
  'não ensina ninguém, inclusive eu mesmo seis meses depois.',
  'vinicius.h.eng@outlook.com',
  'Brasil'
) on conflict (id) do update set
  nome = excluded.nome, titulo = excluded.titulo, bio = excluded.bio,
  email = excluded.email, cidade = excluded.cidade, atualizado_em = now();

-- ─────────────────────────── posts ───────────────────────────

insert into posts (slug, titulo, resumo, corpo_md, portal, genero, maturidade, autoria, tags, minutos_leitura, aviso_indicacao)
values
(
  'resend-para-brevo',
  'Troquei o Resend pelo Brevo e foi a melhor decisão do projeto',
  'Comecei o sistema com Resend porque era o que todo tutorial mandava usar. Só que quando o volume transacional subiu, o custo e o limite não fecharam mais. Dito isso, migrei pro Brevo — e aqui está exatamente o que eu ganhei e o que eu perdi na troca.',
  E'Comecei o sistema com Resend porque era o que todo tutorial mandava usar. Não foi análise, foi inércia — e vale admitir isso antes de qualquer outra coisa.\n\n## Onde apertou\n\nO plano gratuito do Resend resolve muito bem até um certo ponto. Só que o meu volume transacional não é newsletter: é confirmação, alerta e relatório saindo o dia inteiro. Quando passei da faixa, o custo por mil e-mails deixou de fechar com o que o projeto sustenta.\n\n## O que eu ganhei\n\n- Faixa gratuita muito maior no volume que eu realmente uso\n- Painel com log de entrega que eu consigo abrir sem SDK\n- SMTP direto, o que me tirou de uma dependência de biblioteca\n\n## O que eu perdi\n\nE aqui é onde a maioria dos posts de migração mente. Perdi sim:\n\n- A API do Resend é mais limpa. Sem discussão.\n- Perdi o template em React, que era confortável demais\n- O painel do Brevo tem mais coisa do que eu preciso, e achar o que importa custa clique\n\n## Faria de novo?\n\nFaria. Contudo, com uma ressalva: se meu volume fosse metade do que é, eu teria ficado no Resend e não teria pensado duas vezes. A troca não foi "o Brevo é melhor" — foi "o Brevo é melhor **pro meu formato de carga**". São coisas diferentes, e confundir as duas é como eu escolhi errado na primeira vez.',
  'tecnologia', 'registro', 'perene', 'humano',
  array['brevo', 'resend', 'e-mail', 'decisão-técnica'], 6,
  'O link do Brevo neste post é de indicação — se você assinar por ele, eu recebo um benefício. A troca foi feita antes de existir link, e o que está escrito aqui é o que eu faria de novo.'
),
(
  'apaguei-a-coluna-errada',
  'Apaguei a coluna errada e derrubei o sistema (o backup me salvou em 3 minutos)',
  'Fui fazer uma alteração simples numa tabela e levei o ambiente junto. Voltou rápido porque backup é a única coisa da qual eu não abro mão. Só que o erro virou conteúdo — por assim dizer, é o combinado.',
  E'Era uma alteração de dois minutos. Renomear uma coluna que ninguém mais usava.\n\nEla era usada.\n\n## A sequência exata\n\nRodei o `alter table` fora de transação, direto no ambiente errado. Sem `begin`, sem `rollback` esperando. Em quarenta segundos o primeiro alerta chegou, porque a aplicação começou a devolver erro em cima de uma coluna que tinha acabado de deixar de existir.\n\n## Por que voltou rápido\n\nBackup contínuo. Restaurei pro ponto imediatamente anterior e o sistema voltou em três minutos de relógio. Não teve heroísmo nenhum: teve backup configurado num sábado à tarde meses antes, quando não parecia urgente.\n\n## O que mudou depois\n\n- Toda DDL agora nasce dentro de `begin` — se eu não digitei `begin`, eu não digitei nada\n- O prompt do terminal grita o nome do ambiente em vermelho\n- Migração passa por arquivo revisado, não por editor aberto\n\nAcredito eu que o valor deste post não é o erro. É que o tempo de recuperação foi curto **porque uma decisão chata foi tomada antes**. Backup não é sobre o dia em que você configura.',
  'tecnologia', 'incidente', 'perene', 'humano',
  array['postgres', 'backup', 'errei-feio'], 4, null
),
(
  'eletronica-aos-vinte-e-poucos',
  'Descobri música eletrônica numa rave aos 20 e poucos e não faz o menor sentido',
  'Minha playlist é 1980. A-ha, Cyndi Lauper, RPM, Raul Seixas. Acredito eu que nasci na época errada. Só que aí eu fui pra primeira rave da minha vida e o progressivo simplesmente pareceu certo.',
  E'Minha playlist é 1980. A-ha, Cyndi Lauper, RPM, Raul Seixas. Acredito eu que nasci na época errada, e digo isso sem nenhuma ironia.\n\nSó que aí eu fui pra primeira rave da minha vida.\n\n## O que não fechava\n\nEu esperava não gostar. Música sem letra, sem refrão, quatro batidas por compasso durante seis horas — no papel é o oposto de tudo que eu escuto.\n\n## O que fechou\n\nProgressivo tem estrutura. É construção longa, com tensão que sobe por oito minutos antes de resolver. Ou seja: é a mesma coisa que me prende num sintetizador de 1984, só esticada.\n\nDito isso, eu ainda não sei explicar direito. E acho que essa é a parte honesta.',
  'pessoal', 'nota', 'muda', 'humano',
  array['música', 'rave', 'anos-80'], 5, null
)
on conflict (slug) do nothing;

-- métricas do post-mortem
insert into incidentes (post_id, causa, recuperacao, deteccao_segundos, mttr_segundos, perdeu_dado)
select id, 'DDL rodada fora de transação, no ambiente errado',
       'Restauração para o ponto imediatamente anterior (backup contínuo)',
       40, 180, false
  from posts where slug = 'apaguei-a-coluna-errada'
on conflict (post_id) do nothing;

-- conexões — o [[link]] do vault sobrevivendo até o site
insert into conexoes (de, para)
select a.id, b.id from posts a, posts b
 where a.slug = 'apaguei-a-coluna-errada' and b.slug = 'resend-para-brevo'
on conflict do nothing;

-- ─────────── passa a fila, um estado por vez (o interlock exige) ───────────

update posts set estado = 'em_revisao' where estado = 'rascunho';
update posts set estado = 'aprovado'   where estado = 'em_revisao';
update posts set estado = 'publicado', publicado_em = now() - (interval '1 day' * (
    case slug when 'resend-para-brevo' then 4
              when 'apaguei-a-coluna-errada' then 11
              else 17 end))
 where estado = 'aprovado';

-- ─────── e agora o que NÃO vai pro ar: a fila com coisa dentro ───────
-- Inserido depois dos updates acima justamente pra ficar de fora da publicação.
-- Fila vazia esconde o ponto do painel, e — mais importante — sem rascunho no
-- banco não existe nada pra RLS proteger, e o teste de RLS não prova nada.

insert into posts (slug, titulo, resumo, corpo_md, portal, genero, maturidade, estado, autoria, agente, tags, minutos_leitura)
values
(
  'n8n-versus-cron',
  'n8n ou cron: quando a interface visual passa a atrapalhar',
  'Rascunho gerado a partir das notas do vault sobre orquestração. Precisa de revisão: os números de latência estão sem fonte.',
  E'> Rascunho de agente. Não publicar sem checar os números.\n\nO n8n resolve bem o fluxo com muitos ramos. Só que para uma tarefa única, disparada por horário e sem condicional, o cron continua imbatível em previsibilidade.\n\n## Onde o n8n ganha\n\n- Fluxo com mais de três ramos\n- Integração com serviço que já tem nó pronto\n- Quando outra pessoa vai precisar entender o fluxo\n\n## Onde o cron ganha\n\n- Tarefa única e determinística\n- Quando a falha precisa ser barulhenta e simples de ler\n- Quando o custo de manter mais um serviço de pé não se paga\n\n*[Trecho pendente: comparação de latência. Preencher com medição real antes de aprovar.]*',
  'tecnologia', 'registro', 'semente', 'em_revisao', 'agente', 'redator-agente',
  array['n8n', 'cron', 'automação'], 4
),
(
  'supabase-rls-primeira-vez',
  'RLS do Supabase: o que eu entendi errado na primeira tentativa',
  'Rascunho meu. Ainda falta a parte de policy com subquery.',
  E'Anotação crua, ainda sem forma.\n\nPonto principal: eu achava que RLS era filtro de aplicação com outro nome. Não é. A policy roda no plano de consulta, e por isso ela precisa ser barata — policy com subquery pesada vira lentidão em toda leitura.\n\nA fazer:\n- Explicar `security_invoker` em view\n- Exemplo de policy que aponta pra tabela pai',
  'tecnologia', 'nota', 'semente', 'rascunho', 'humano', null,
  array['supabase', 'postgres', 'rls'], 3
)
on conflict (slug) do nothing;

-- ─────────────────────────── currículo ───────────────────────────

insert into habilidades (nome, categoria, nivel, ordem) values
  ('PostgreSQL',        'Dados',      4, 1),
  ('Automação (n8n)',   'Automação',  5, 2),
  ('Orquestração de IA','IA',         4, 3),
  ('Next.js',           'Aplicação',  3, 4),
  ('Integração de API', 'Automação',  4, 5),
  ('Instrumentação',    'Operação',   4, 6)
on conflict (nome) do nothing;

-- a habilidade aponta pro post que a prova. é isso que separa currículo de lista de palavras.
insert into provas (habilidade_id, post_id)
select h.id, p.id from habilidades h, posts p
 where (h.nome = 'PostgreSQL'        and p.slug = 'apaguei-a-coluna-errada')
    or (h.nome = 'Integração de API' and p.slug = 'resend-para-brevo')
    or (h.nome = 'Instrumentação'    and p.slug = 'apaguei-a-coluna-errada')
on conflict do nothing;

insert into experiencias (cargo, organizacao, inicio, resumo, ordem) values
  ('Engenharia de automação', 'Artemec', '2024-01-01',
   'Construção e operação do sistema interno: integrações, automações de processo e orquestração de IA.', 1)
on conflict do nothing;

insert into formacoes (curso, instituicao, inicio, ordem) values
  ('Engenharia de Controle e Automação', 'Graduação', '2020-02-01', 1)
on conflict do nothing;

-- ─────────────────────────── automações ───────────────────────────
-- ref_segredo guarda o NOME da variável de ambiente. O valor mora no host.

insert into integracoes (nome, tipo, descricao, url, ativa, ref_segredo, config) values
  ('brevo-transacional', 'api', 'Envio transacional de e-mail. Substituiu o Resend.',
   'https://api.brevo.com/v3/smtp/email', true, 'BREVO_API_KEY', '{"remetente":"nao-responda"}'),
  ('backup-diario', 'cron', 'Backup do Postgres às 03:00. A automação se reporta ao painel quando termina.',
   null, true, null, '{"horario":"03:00","retencao_dias":30}'),
  ('redator-agente', 'n8n', 'Agente que redige rascunho a partir de nota do vault. Entra na fila como qualquer rascunho — nunca publica.',
   'https://n8n.exemplo/webhook/redator', false, 'N8N_TOKEN_REDATOR', '{"modelo":"claude-opus-5","limite_diario":3}')
on conflict (nome) do nothing;

insert into execucoes (integracao_id, estado, mensagem, duracao_ms, origem)
select i.id, 'ok', 'Concluído sem alerta', 1420, 'externo'
  from integracoes i where i.nome = 'backup-diario';

insert into execucoes (integracao_id, estado, mensagem, duracao_ms, origem)
select i.id, 'alerta', 'Limite diário de rascunho atingido (3/3)', 890, 'externo'
  from integracoes i where i.nome = 'redator-agente';

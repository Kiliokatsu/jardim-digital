-- ═══════════════════════════════════════════════════════════════════════════
-- Jardim Digital — semente de dados
-- Rodar DEPOIS das migrations. Reexecutar é seguro: tudo aqui é idempotente
-- (on conflict onde há chave natural, where not exists onde não há).
--
-- Regra que este arquivo respeita e que vale conferir a cada edição (DEC-025):
-- nenhum post cita empresa, produto interno ou cliente. "Um sistema interno
-- que eu mantenho" no lugar do nome. Ferramenta pública (Resend, Brevo,
-- Supabase, Postgres) pode ter nome. A ÚNICA exceção é experiencias.empresa,
-- porque currículo é local de trabalho.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─────────────────────────── perfil ───────────────────────────

insert into perfil (id, nome_completo, nome_publico, titulo, resumo, cidade, email, foto_url)
values (
  1,
  'Vinícius Henrique Teles Farias',
  'Kiliokatsu',
  'Desenvolvedor de sistemas · cursando Engenharia de Controle e Automação',
  'Desenvolvo e mantenho um sistema interno de gestão — integração, automação '
  'de processo e orquestração de IA — enquanto curso Engenharia de Controle e '
  'Automação. Acredito eu que decisão técnica sem contexto não ensina ninguém, '
  'inclusive eu mesmo seis meses depois. Ou seja: escrevo aqui o que eu escolhi, '
  'o que doeu e o que eu faria diferente. Só que sem maquiagem — tem erro '
  'documentado no meio, de propósito. Dito isso, o que está publicado é o que '
  'eu defendo hoje, não o que eu queria que tivesse acontecido.',
  'Goiânia, GO',
  'vinicius.h.eng@outlook.com',
  null  -- a página mostra "sem foto" até existir uma
) on conflict (id) do update set
  nome_completo = excluded.nome_completo,
  nome_publico  = excluded.nome_publico,
  titulo        = excluded.titulo,
  resumo        = excluded.resumo,
  cidade        = excluded.cidade,
  email         = excluded.email,
  foto_url      = excluded.foto_url;

-- perfil_links não tem chave natural (id é uuid gerado), então a
-- idempotência é por "where not exists" no rótulo.
insert into perfil_links (rotulo, url, ordem)
select v.rotulo, v.url, v.ordem
  from (values
    ('LinkedIn', 'https://www.linkedin.com/', 0),
    ('GitHub',   'https://github.com/Kiliokatsu', 1)
  ) as v(rotulo, url, ordem)
 where not exists (select 1 from perfil_links pl where pl.rotulo = v.rotulo);


-- ─────────────────────────── currículo ───────────────────────────

insert into experiencias (cargo, empresa, local, inicio, fim, resumo, marcos, ordem)
select v.cargo, v.empresa, v.local, v.inicio, v.fim, v.resumo, v.marcos, v.ordem
  from (values (
    'Desenvolvimento de sistemas e automação',
    'Artemec',          -- exceção da DEC-025: currículo é local de trabalho
    'Goiânia, GO',
    date '2024-01-01',
    null::date,         -- NULL = atual
    'Construção e operação de um sistema interno de gestão: integrações, '
    'automações de processo e orquestração de IA.',
    array[
      'Integrações entre sistemas e automação de processos internos',
      'Orquestração de IA aplicada à rotina da operação',
      'Envio transacional de e-mail com rastreabilidade de entrega'
    ],
    0
  )) as v(cargo, empresa, local, inicio, fim, resumo, marcos, ordem)
 where not exists (select 1 from experiencias e where e.empresa = v.empresa and e.cargo = v.cargo);

insert into formacao (curso, instituicao, local, situacao, previsao_conclusao, inicio, fim, ordem)
select v.curso, v.instituicao, v.local, v.situacao, v.previsao, v.inicio, v.fim, v.ordem
  from (values (
    'Engenharia de Controle e Automação',
    'Graduação',
    'Goiânia, GO',
    'cursando',
    null::text,
    date '2020-02-01',
    null::date,
    0
  )) as v(curso, instituicao, local, situacao, previsao, inicio, fim, ordem)
 where not exists (select 1 from formacao f where f.curso = v.curso);

insert into habilidades (categoria, nome, nivel, ordem)
select v.categoria, v.nome, v.nivel, v.ordem
  from (values
    ('Dados',      'PostgreSQL',           4, 1),
    ('Automação',  'Automação (n8n)',      5, 2),
    ('IA',         'Orquestração de IA',   4, 3),
    ('Aplicação',  'Next.js',              3, 4),
    ('Automação',  'Integração de API',    4, 5),
    ('Operação',   'Instrumentação',       4, 6)
  ) as v(categoria, nome, nivel, ordem)
 where not exists (select 1 from habilidades h where h.nome = v.nome);


-- ─────────────────────────── etiquetas ───────────────────────────
-- Slug sem acento (vai na URL); nome com acento (vai na tela).

insert into etiquetas (slug, nome, descricao) values
  ('brevo',           'Brevo',            'Provedor de e-mail transacional. Foi pra onde eu fui.'),
  ('resend',          'Resend',           'Provedor de e-mail transacional. Foi de onde eu saí.'),
  ('e-mail',          'E-mail',           'Envio transacional: confirmação, aviso e relatório. O encanamento invisível de qualquer sistema.'),
  ('decisao-tecnica', 'Decisão técnica',  'Registros de escolha com contexto: o que eu escolhi, contra o quê, e o que eu pagaria de novo.'),
  ('postgres',        'PostgreSQL',       'O banco. Onde as decisões mais caras deste jardim moram.'),
  ('errei-feio',      'Errei feio',       'Erros meus, documentados por inteiro. É o combinado deste site.'),
  ('musica',          'Música',           'O que toca enquanto o resto acontece. Quase sempre 1980.'),
  ('anos-80',         'Anos 80',          'A-ha, Cyndi Lauper, RPM, Raul Seixas. Acredito eu que nasci na época errada.')
on conflict (slug) do nothing;


-- ─────────────────────────── posts ───────────────────────────
-- Datas fixas de propósito (julho/2026): seed com now() gera diff a cada
-- execução e quebra a idempotência na prática.

insert into posts (slug, portal, titulo, resumo, corpo, publicado_em, criado_em, tem_indicacao)
values
(
  'troquei-resend-por-brevo',
  'tecnologia',
  'Troquei o Resend pelo Brevo e foi a melhor decisão do projeto',
  'Comecei o sistema com Resend porque era o que todo tutorial mandava usar. Só que quando o volume transacional subiu, o custo e o limite não fecharam mais. Dito isso, aqui está exatamente o que eu ganhei e o que eu perdi na troca.',
  $post1$## O que eu usava

O sistema mandava três tipos de e-mail: confirmação de cadastro, aviso de vencimento de prazo e o resumo semanal. Nada sofisticado. O Resend entrou porque era o que aparecia em todo tutorial de Next.js, a documentação é boa e a integração leva quinze minutos.

Funcionou por uns quatro meses sem eu pensar no assunto — e é isso que eu esperava de uma ferramenta de e-mail. Ferramenta boa é a que eu esqueço que existe.

## O que doeu

O aviso de pendência é disparado por cliente, não por usuário. Quando o segundo cliente entrou no portal, o volume triplicou de uma semana para a outra. Aí apareceram duas coisas ao mesmo tempo:

- o limite do plano começou a bater no meio do dia, e o disparo da tarde entrava na fila;
- o custo por mil envios, na faixa em que eu estava caindo, ficou difícil de defender.

Acredito eu que o erro não foi escolher o Resend. Foi escolher sem estimar volume — eu simplesmente não tinha pensado em quantos e-mails o sistema mandaria com dez clientes dentro.

> **O que eu deveria ter feito antes:** uma conta de guardanapo. Clientes × equipamentos × avisos por mês. Levava cinco minutos e teria mudado a escolha.

## Pra onde eu fui

Fui para o Brevo. O que decidiu não foi preço: foi o plano ter *fila própria*, então disparo em lote deixou de ser problema meu. Ou seja, eu troquei um problema de código por um problema de configuração — e problema de configuração eu resolvo uma vez.

A troca em si foi pequena, porque o envio já estava atrás de uma função só. Isto é o arquivo inteiro depois da migração:

```typescript titulo=lib/email.ts
// Uma função só. Trocar de provedor mexe aqui e em lugar nenhum mais.
import { BrevoClient } from '@getbrevo/brevo'

const cliente = new BrevoClient(process.env.BREVO_API_KEY!)

export async function enviar(para: string, assunto: string, html: string) {
  const r = await cliente.transactionalEmails.send({
    to: [{ email: para }],
    sender: { email: 'nao-responda@meudominio.com.br', name: 'Portal' },
    subject: assunto,
    htmlContent: html,
  })

  // Log do id: sem isso, "o cliente diz que não recebeu" é indefensável.
  console.info('[email] enviado', { para, messageId: r.messageId })
  return r.messageId
}
```

Repare no `console.info` com o `messageId`. Isso não estava no código antigo, e foi o que mais me ajudou depois: quando um cliente diz que não recebeu, eu tenho o número do envio para procurar no painel do provedor. Sem isso, a conversa vira "mandei sim" contra "não chegou".

## O que eu ganhei

- Fila no provedor. Disparo em lote parou de ser problema de código.
- Custo previsível na faixa de volume em que eu de fato estou.
- Rastreabilidade: agora eu sei o número de cada envio.

## O que eu perdi

E essa é a parte que quase ninguém escreve, então vai completa:

- A documentação do Brevo é pior. Levei uma tarde para achar a forma certa de mandar o remetente.
- O painel é mais pesado e tem muita coisa de marketing que eu não uso.
- Perdi um dia de trabalho na troca. Um dia que não virou funcionalidade nenhuma para o cliente.

> Troca de ferramenta nunca é de graça. Quando alguém te conta só o lado bom, ou a troca foi recente demais, ou tem link de indicação no meio.

## Se eu começasse hoje

Faria a conta de guardanapo antes, e manteria o envio atrás de uma função só desde o primeiro dia — foi isso que fez a migração ser um arquivo em vez de uma refatoração.

Fica uma dúvida honesta minha: em que ponto vale sair de um serviço gerenciado e mandar e-mail por conta própria? Eu não sei responder — e desconfio que a resposta é "quase nunca", só que não tenho número para defender isso.$post1$,
  '2026-07-31T12:00:00Z',
  '2026-07-28T12:00:00Z',
  true  -- DEC-013: o componente renderiza a linha de aviso a partir daqui
),
(
  'apaguei-a-coluna-errada',
  'tecnologia',
  'Apaguei a coluna errada e derrubei o sistema (o backup me salvou em 3 minutos)',
  'Fui fazer uma alteração simples numa tabela e levei o ambiente junto. Voltou rápido porque backup é a única coisa da qual eu não abro mão. Só que o erro virou conteúdo — por assim dizer, é o combinado.',
  $post2$Era uma alteração de dois minutos. Renomear uma coluna que ninguém mais usava.

Ela era usada.

## A sequência exata

Rodei o `alter table` fora de transação, direto no ambiente errado. Sem `begin`, sem `rollback` esperando. Em quarenta segundos o primeiro alerta chegou, porque a aplicação começou a devolver erro em cima de uma coluna que tinha acabado de deixar de existir.

## Por que voltou rápido

Backup contínuo. Restaurei pro ponto imediatamente anterior e o sistema voltou em três minutos de relógio. Não teve heroísmo nenhum: teve backup configurado num sábado à tarde meses antes, quando não parecia urgente.

## O que mudou depois

- Toda DDL agora nasce dentro de `begin` — se eu não digitei `begin`, eu não digitei nada
- O prompt do terminal grita o nome do ambiente em vermelho
- Migração passa por arquivo revisado, não por editor aberto

Acredito eu que o valor deste post não é o erro. É que o tempo de recuperação foi curto **porque uma decisão chata foi tomada antes**. Backup não é sobre o dia em que você configura.$post2$,
  '2026-07-24T12:00:00Z',
  '2026-07-22T12:00:00Z',
  false
),
(
  'eletronica-aos-vinte-e-poucos',
  'pessoal',
  'Descobri música eletrônica numa rave aos 20 e poucos e não faz o menor sentido',
  'Minha playlist é 1980. A-ha, Cyndi Lauper, RPM, Raul Seixas. Acredito eu que nasci na época errada. Só que aí eu fui pra primeira rave da minha vida e o progressivo simplesmente pareceu certo.',
  $post3$Minha playlist é 1980. A-ha, Cyndi Lauper, RPM, Raul Seixas. Acredito eu que nasci na época errada, e digo isso sem nenhuma ironia.

Só que aí eu fui pra primeira rave da minha vida.

## O que não fechava

Eu esperava não gostar. Música sem letra, sem refrão, quatro batidas por compasso durante seis horas — no papel é o oposto de tudo que eu escuto.

## O que fechou

Progressivo tem estrutura. É construção longa, com tensão que sobe por oito minutos antes de resolver. Ou seja: é a mesma coisa que me prende num sintetizador de 1984, só esticada.

Dito isso, eu ainda não sei explicar direito. E acho que essa é a parte honesta.$post3$,
  '2026-07-18T12:00:00Z',
  '2026-07-17T12:00:00Z',
  false
)
on conflict (slug, idioma) do nothing;

-- prova de habilidade → post (depende dos posts existirem; update é idempotente)
update habilidades h
   set prova_post_id = p.id
  from posts p
 where p.slug = 'apaguei-a-coluna-errada' and h.nome = 'PostgreSQL';

update habilidades h
   set prova_post_id = p.id
  from posts p
 where p.slug = 'troquei-resend-por-brevo' and h.nome = 'Integração de API';


-- ─────────────────────── posts ↔ etiquetas ───────────────────────

insert into posts_etiquetas (post_id, etiqueta_id)
select p.id, e.id
  from posts p join etiquetas e
    on e.slug in ('brevo', 'resend', 'e-mail', 'decisao-tecnica')
 where p.slug = 'troquei-resend-por-brevo'
on conflict do nothing;

insert into posts_etiquetas (post_id, etiqueta_id)
select p.id, e.id
  from posts p join etiquetas e
    on e.slug in ('postgres', 'errei-feio', 'decisao-tecnica')
 where p.slug = 'apaguei-a-coluna-errada'
on conflict do nothing;

insert into posts_etiquetas (post_id, etiqueta_id)
select p.id, e.id
  from posts p join etiquetas e
    on e.slug in ('musica', 'anos-80')
 where p.slug = 'eletronica-aos-vinte-e-poucos'
on conflict do nothing;


-- ─────────────────────────── admins ───────────────────────────
-- NENHUM insert aqui, de propósito (DEC-020): o alistamento é manual,
-- pelo Studio, depois do primeiro login com o GitHub. O modelo é este:
--
--   insert into admins (user_id, nota)
--   values ('<uuid da linha em auth.users, copiado do Studio>',
--           'eu, conta do GitHub Kiliokatsu');
--
-- Seed que alista admin sozinho é seed que alista admin em todo ambiente
-- em que rodar — inclusive num fork de outra pessoa.

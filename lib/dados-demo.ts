import type {
  Conexao, Execucao, Experiencia, Formacao, Habilidade, Incidente,
  Integracao, Perfil, Post, Prova,
} from "@/lib/tipos";

/* Espelho do supabase/seed.sql em memória, pra que `npm run dev` mostre o site
   inteiro de pé sem banco nenhum configurado. Datas são fixas de propósito:
   data calculada na renderização causa divergência entre servidor e cliente.

   Tem rascunho e texto de agente aqui dentro porque a fila de aprovação vazia
   não mostra nada — e a fila é o ponto do painel. */

const P = (n: number) => `2026-07-${String(n).padStart(2, "0")}T12:00:00Z`;

export const perfilDemo: Perfil = {
  id: "1",
  nome: "Vinícius Henrique",
  titulo: "Engenharia de Controle e Automação · Artemec",
  bio:
    "Construo sistemas de automação e orquestração de IA. Escrevo aqui as decisões " +
    "técnicas que tomei errado antes de tomar certo — porque decisão sem contexto " +
    "não ensina ninguém, inclusive eu mesmo seis meses depois.",
  foto_url: null,
  email: "vinicius.h.eng@outlook.com",
  cidade: "Brasil",
};

export const postsDemo: Post[] = [
  {
    id: "p1",
    slug: "resend-para-brevo",
    titulo: "Troquei o Resend pelo Brevo e foi a melhor decisão do projeto",
    resumo:
      "Comecei o sistema com Resend porque era o que todo tutorial mandava usar. Só que quando o volume transacional subiu, o custo e o limite não fecharam mais. Dito isso, migrei pro Brevo — e aqui está exatamente o que eu ganhei e o que eu perdi na troca.",
    corpo_md: `Comecei o sistema com Resend porque era o que todo tutorial mandava usar. Não foi análise, foi inércia — e vale admitir isso antes de qualquer outra coisa.

## Onde apertou

O plano gratuito do Resend resolve muito bem até um certo ponto. Só que o meu volume transacional não é newsletter: é confirmação, alerta e relatório saindo o dia inteiro. Quando passei da faixa, o custo por mil e-mails deixou de fechar com o que o projeto sustenta.

## O que eu ganhei

- Faixa gratuita muito maior no volume que eu realmente uso
- Painel com log de entrega que eu consigo abrir sem SDK
- SMTP direto, o que me tirou de uma dependência de biblioteca

## O que eu perdi

E aqui é onde a maioria dos posts de migração mente. Perdi sim:

- A API do Resend é mais limpa. Sem discussão.
- Perdi o template em React, que era confortável demais
- O painel do Brevo tem mais coisa do que eu preciso, e achar o que importa custa clique

## Faria de novo?

Faria. Contudo, com uma ressalva: se meu volume fosse metade do que é, eu teria ficado no Resend e não teria pensado duas vezes. A troca não foi "o Brevo é melhor" — foi "o Brevo é melhor **pro meu formato de carga**". São coisas diferentes, e confundir as duas é como eu escolhi errado na primeira vez.`,
    portal: "tecnologia",
    genero: "registro",
    maturidade: "perene",
    estado: "publicado",
    autoria: "humano",
    agente: null,
    publicado_por: null,
    tags: ["brevo", "resend", "e-mail", "decisão-técnica"],
    minutos_leitura: 6,
    aviso_indicacao:
      "O link do Brevo neste post é de indicação — se você assinar por ele, eu recebo um benefício. A troca foi feita antes de existir link, e o que está escrito aqui é o que eu faria de novo.",
    publicado_em: P(31),
    criado_em: P(28),
    atualizado_em: P(31),
    revisoes: 3,
  },
  {
    id: "p2",
    slug: "apaguei-a-coluna-errada",
    titulo: "Apaguei a coluna errada e derrubei o sistema (o backup me salvou em 3 minutos)",
    resumo:
      "Fui fazer uma alteração simples numa tabela e levei o ambiente junto. Voltou rápido porque backup é a única coisa da qual eu não abro mão. Só que o erro virou conteúdo — por assim dizer, é o combinado.",
    corpo_md: `Era uma alteração de dois minutos. Renomear uma coluna que ninguém mais usava.

Ela era usada.

## A sequência exata

Rodei o \`alter table\` fora de transação, direto no ambiente errado. Sem \`begin\`, sem \`rollback\` esperando. Em quarenta segundos o primeiro alerta chegou, porque a aplicação começou a devolver erro em cima de uma coluna que tinha acabado de deixar de existir.

## Por que voltou rápido

Backup contínuo. Restaurei pro ponto imediatamente anterior e o sistema voltou em três minutos de relógio. Não teve heroísmo nenhum: teve backup configurado num sábado à tarde meses antes, quando não parecia urgente.

## O que mudou depois

- Toda DDL agora nasce dentro de \`begin\` — se eu não digitei \`begin\`, eu não digitei nada
- O prompt do terminal grita o nome do ambiente em vermelho
- Migração passa por arquivo revisado, não por editor aberto

Acredito eu que o valor deste post não é o erro. É que o tempo de recuperação foi curto **porque uma decisão chata foi tomada antes**. Backup não é sobre o dia em que você configura.`,
    portal: "tecnologia",
    genero: "incidente",
    maturidade: "perene",
    estado: "publicado",
    autoria: "humano",
    agente: null,
    publicado_por: null,
    tags: ["postgres", "backup", "errei-feio"],
    minutos_leitura: 4,
    aviso_indicacao: null,
    publicado_em: P(24),
    criado_em: P(22),
    atualizado_em: P(24),
    revisoes: 2,
  },
  {
    id: "p3",
    slug: "eletronica-aos-vinte-e-poucos",
    titulo: "Descobri música eletrônica numa rave aos 20 e poucos e não faz o menor sentido",
    resumo:
      "Minha playlist é 1980. A-ha, Cyndi Lauper, RPM, Raul Seixas. Acredito eu que nasci na época errada. Só que aí eu fui pra primeira rave da minha vida e o progressivo simplesmente pareceu certo.",
    corpo_md: `Minha playlist é 1980. A-ha, Cyndi Lauper, RPM, Raul Seixas. Acredito eu que nasci na época errada, e digo isso sem nenhuma ironia.

Só que aí eu fui pra primeira rave da minha vida.

## O que não fechava

Eu esperava não gostar. Música sem letra, sem refrão, quatro batidas por compasso durante seis horas — no papel é o oposto de tudo que eu escuto.

## O que fechou

Progressivo tem estrutura. É construção longa, com tensão que sobe por oito minutos antes de resolver. Ou seja: é a mesma coisa que me prende num sintetizador de 1984, só esticada.

Dito isso, eu ainda não sei explicar direito. E acho que essa é a parte honesta.`,
    portal: "pessoal",
    genero: "nota",
    maturidade: "muda",
    estado: "publicado",
    autoria: "humano",
    agente: null,
    publicado_por: null,
    tags: ["música", "rave", "anos-80"],
    minutos_leitura: 5,
    aviso_indicacao: null,
    publicado_em: P(18),
    criado_em: P(17),
    atualizado_em: P(18),
    revisoes: 1,
  },
  {
    id: "p4",
    slug: "dota-as-duas-da-manha",
    titulo: "Dota às duas da manhã não é lazer, é teimosia",
    resumo:
      "Uma partida acaba às 01:40 e eu clico em procurar outra. Não é diversão nessa hora — é a mesma teimosia que me faz não fechar um bug em aberto.",
    corpo_md: `Uma partida acaba às 01:40 e eu clico em procurar outra.

Isso não é lazer. Lazer é a partida das nove. A das duas é outra coisa.

## A parte que eu reconheço

É a mesma teimosia que me faz não conseguir fechar o editor com um bug em aberto. Vontade de resolver *aquilo* antes de dormir, mesmo sabendo que resolver às duas custa o dia seguinte inteiro.

Ainda estou pensando nesta nota. Deixei como semente porque não tenho conclusão.`,
    portal: "pessoal",
    genero: "nota",
    maturidade: "semente",
    estado: "publicado",
    autoria: "humano",
    agente: null,
    publicado_por: null,
    tags: ["dota", "rotina", "sono"],
    minutos_leitura: 2,
    aviso_indicacao: null,
    publicado_em: P(12),
    criado_em: P(12),
    atualizado_em: P(12),
    revisoes: 0,
  },

  /* ── daqui pra baixo: só aparece no painel, nunca no jardim ── */

  {
    id: "p5",
    slug: "n8n-versus-cron",
    titulo: "n8n ou cron: quando a interface visual passa a atrapalhar",
    resumo:
      "Rascunho gerado a partir das notas do vault sobre orquestração. Precisa de revisão: os números de latência estão sem fonte.",
    corpo_md: `> Rascunho de agente. Não publicar sem checar os números.

O n8n resolve bem o fluxo com muitos ramos. Só que para uma tarefa única, disparada por horário e sem condicional, o cron continua imbatível em previsibilidade.

## Onde o n8n ganha

- Fluxo com mais de três ramos
- Integração com serviço que já tem nó pronto
- Quando outra pessoa vai precisar entender o fluxo

## Onde o cron ganha

- Tarefa única e determinística
- Quando a falha precisa ser barulhenta e simples de ler
- Quando o custo de manter mais um serviço de pé não se paga

*[Trecho pendente: comparação de latência. Preencher com medição real antes de aprovar.]*`,
    portal: "tecnologia",
    genero: "registro",
    maturidade: "semente",
    estado: "em_revisao",
    autoria: "agente",
    agente: "redator-agente",
    publicado_por: null,
    tags: ["n8n", "cron", "automação"],
    minutos_leitura: 4,
    aviso_indicacao: null,
    publicado_em: null,
    criado_em: "2026-08-02T09:14:00Z",
    atualizado_em: "2026-08-03T18:40:00Z",
    revisoes: 1,
  },
  {
    id: "p6",
    slug: "supabase-rls-primeira-vez",
    titulo: "RLS do Supabase: o que eu entendi errado na primeira tentativa",
    resumo: "Rascunho meu. Ainda falta a parte de policy com subquery.",
    corpo_md: `Anotação crua, ainda sem forma.

Ponto principal: eu achava que RLS era filtro de aplicação com outro nome. Não é. A policy roda no plano de consulta, e por isso ela precisa ser barata — policy com subquery pesada vira lentidão em toda leitura.

A fazer:
- Explicar \`security_invoker\` em view
- Exemplo de policy que aponta pra tabela pai`,
    portal: "tecnologia",
    genero: "nota",
    maturidade: "semente",
    estado: "rascunho",
    autoria: "humano",
    agente: null,
    publicado_por: null,
    tags: ["supabase", "postgres", "rls"],
    minutos_leitura: 3,
    aviso_indicacao: null,
    publicado_em: null,
    criado_em: "2026-08-03T21:05:00Z",
    atualizado_em: "2026-08-03T21:52:00Z",
    revisoes: 0,
  },
];

export const incidentesDemo: Incidente[] = [
  {
    post_id: "p2",
    causa: "DDL rodada fora de transação, no ambiente errado",
    recuperacao: "Restauração para o ponto imediatamente anterior (backup contínuo)",
    deteccao_segundos: 40,
    mttr_segundos: 180,
    perdeu_dado: false,
  },
];

export const conexoesDemo: Conexao[] = [
  { de: "p2", para: "p1" },
  { de: "p4", para: "p3" },
  { de: "p1", para: "p2" },
];

export const habilidadesDemo: Habilidade[] = [
  { id: "h1", nome: "PostgreSQL", categoria: "Dados", nivel: 4, ordem: 1 },
  { id: "h2", nome: "Automação (n8n)", categoria: "Automação", nivel: 5, ordem: 2 },
  { id: "h3", nome: "Orquestração de IA", categoria: "IA", nivel: 4, ordem: 3 },
  { id: "h4", nome: "Next.js", categoria: "Aplicação", nivel: 3, ordem: 4 },
  { id: "h5", nome: "Integração de API", categoria: "Automação", nivel: 4, ordem: 5 },
  { id: "h6", nome: "Instrumentação", categoria: "Operação", nivel: 4, ordem: 6 },
];

export const provasDemo: Prova[] = [
  { habilidade_id: "h1", post_id: "p2" },
  { habilidade_id: "h5", post_id: "p1" },
  { habilidade_id: "h6", post_id: "p2" },
];

export const experienciasDemo: Experiencia[] = [
  {
    id: "e1",
    cargo: "Engenharia de automação",
    organizacao: "Artemec",
    inicio: "2024-01-01",
    fim: null,
    resumo:
      "Construção e operação do sistema interno: integrações, automações de processo e orquestração de IA.",
    ordem: 1,
  },
];

export const formacoesDemo: Formacao[] = [
  {
    id: "f1",
    curso: "Engenharia de Controle e Automação",
    instituicao: "Graduação",
    inicio: "2020-02-01",
    fim: null,
    ordem: 1,
  },
];

export const integracoesDemo: Integracao[] = [
  {
    id: "i1",
    nome: "brevo-transacional",
    tipo: "api",
    descricao: "Envio transacional de e-mail. Substituiu o Resend.",
    url: "https://api.brevo.com/v3/smtp/email",
    ativa: true,
    ref_segredo: "BREVO_API_KEY",
    config: { remetente: "nao-responda" },
    ultimo_estado: "ok",
    ultima_execucao_em: "2026-08-04T02:14:00Z",
    criado_em: P(10),
  },
  {
    id: "i2",
    nome: "backup-diario",
    tipo: "cron",
    descricao: "Backup do Postgres às 03:00. A automação se reporta ao painel quando termina.",
    url: null,
    ativa: true,
    ref_segredo: null,
    config: { horario: "03:00", retencao_dias: 30 },
    ultimo_estado: "ok",
    ultima_execucao_em: "2026-08-04T03:00:00Z",
    criado_em: P(10),
  },
  {
    id: "i3",
    nome: "redator-agente",
    tipo: "n8n",
    descricao:
      "Agente que redige rascunho a partir de nota do vault. Entra na fila como qualquer rascunho — nunca publica.",
    url: "https://n8n.exemplo/webhook/redator",
    ativa: false,
    ref_segredo: "N8N_TOKEN_REDATOR",
    config: { modelo: "claude-opus-5", limite_diario: 3 },
    ultimo_estado: "alerta",
    ultima_execucao_em: "2026-08-03T11:42:00Z",
    criado_em: P(20),
  },
];

export const execucoesDemo: Execucao[] = [
  { id: "x1", integracao_id: "i2", estado: "ok", mensagem: "Concluído sem alerta", duracao_ms: 1420, origem: "externo", criado_em: "2026-08-04T03:00:00Z" },
  { id: "x2", integracao_id: "i1", estado: "ok", mensagem: "412 e-mails entregues, 0 rejeitados", duracao_ms: 310, origem: "externo", criado_em: "2026-08-04T02:14:00Z" },
  { id: "x3", integracao_id: "i3", estado: "alerta", mensagem: "Limite diário de rascunho atingido (3/3)", duracao_ms: 890, origem: "externo", criado_em: "2026-08-03T11:42:00Z" },
  { id: "x4", integracao_id: "i2", estado: "ok", mensagem: "Concluído sem alerta", duracao_ms: 1508, origem: "externo", criado_em: "2026-08-03T03:00:00Z" },
  { id: "x5", integracao_id: "i3", estado: "erro", mensagem: "Timeout ao chamar o webhook após 30s", duracao_ms: 30021, origem: "painel", criado_em: "2026-08-02T16:20:00Z" },
];

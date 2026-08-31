import type {
  Certificado, Etiqueta, Experiencia, Formacao, Habilidade,
  Perfil, PerfilLink, Post,
} from "@/lib/tipos";

/* Espelho do supabase/seed.sql em memória, pra que `npm run dev` mostre o site
   inteiro de pé sem banco nenhum configurado. Datas são fixas de propósito:
   data calculada na renderização causa divergência entre servidor e cliente.

   Só existe aqui o que o ANÔNIMO veria pelo RLS — rascunho não entra, porque
   este arquivo alimenta exatamente as consultas públicas. */

const DIA = (n: number): string => `2026-07-${String(n).padStart(2, "0")}T12:00:00Z`;

export const perfilDemo: Perfil = {
  id: 1,
  nome_completo: "Vinícius Henrique Teles Farias",
  nome_publico: "Kiliokatsu",
  titulo: "Desenvolvedor de sistemas · cursando Engenharia de Controle e Automação",
  resumo:
    "Desenvolvo e mantenho um sistema interno de gestão — integração, automação " +
    "de processo e orquestração de IA — enquanto curso Engenharia de Controle e " +
    "Automação. Acredito eu que decisão técnica sem contexto não ensina ninguém, " +
    "inclusive eu mesmo seis meses depois. Ou seja: escrevo aqui o que eu escolhi, " +
    "o que doeu e o que eu faria diferente. Só que sem maquiagem — tem erro " +
    "documentado no meio, de propósito. Dito isso, o que está publicado é o que " +
    "eu defendo hoje, não o que eu queria que tivesse acontecido.",
  cidade: "Goiânia, GO",
  email: "vinicius.h.eng@outlook.com",
  telefone: null,
  foto_url: null,
  atualizado_em: DIA(31),
};

export const perfilLinksDemo: PerfilLink[] = [
  { id: "l1", rotulo: "LinkedIn", url: "https://www.linkedin.com/", ordem: 0 },
  { id: "l2", rotulo: "GitHub", url: "https://github.com/Kiliokatsu", ordem: 1 },
];

export const etiquetasDemo: Etiqueta[] = [
  { id: "t1", slug: "brevo", nome: "Brevo", descricao: "Provedor de e-mail transacional. Foi pra onde eu fui.", criado_em: DIA(1) },
  { id: "t2", slug: "resend", nome: "Resend", descricao: "Provedor de e-mail transacional. Foi de onde eu saí.", criado_em: DIA(1) },
  { id: "t3", slug: "e-mail", nome: "E-mail", descricao: "Envio transacional: confirmação, aviso e relatório. O encanamento invisível de qualquer sistema.", criado_em: DIA(1) },
  { id: "t4", slug: "decisao-tecnica", nome: "Decisão técnica", descricao: "Registros de escolha com contexto: o que eu escolhi, contra o quê, e o que eu pagaria de novo.", criado_em: DIA(1) },
  { id: "t5", slug: "postgres", nome: "PostgreSQL", descricao: "O banco. Onde as decisões mais caras deste jardim moram.", criado_em: DIA(1) },
  { id: "t6", slug: "errei-feio", nome: "Errei feio", descricao: "Erros meus, documentados por inteiro. É o combinado deste site.", criado_em: DIA(1) },
  { id: "t7", slug: "musica", nome: "Música", descricao: "O que toca enquanto o resto acontece. Quase sempre 1980.", criado_em: DIA(1) },
  { id: "t8", slug: "anos-80", nome: "Anos 80", descricao: "A-ha, Cyndi Lauper, RPM, Raul Seixas. Acredito eu que nasci na época errada.", criado_em: DIA(1) },
];

const etiqueta = (slug: string): Etiqueta => {
  const achada = etiquetasDemo.find((e) => e.slug === slug);
  if (!achada) throw new Error(`dados-demo: etiqueta '${slug}' não existe no espelho`);
  return achada;
};

export const postsDemo: Post[] = [
  {
    id: "p1",
    slug: "troquei-resend-por-brevo",
    idioma: "pt-BR",
    portal: "tecnologia",
    titulo: "Troquei o Resend pelo Brevo e foi a melhor decisão do projeto",
    resumo:
      "Comecei o sistema com Resend porque era o que todo tutorial mandava usar. Só que quando o volume transacional subiu, o custo e o limite não fecharam mais. Dito isso, aqui está exatamente o que eu ganhei e o que eu perdi na troca.",
    corpo: `## O que eu usava

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

\`\`\`typescript titulo=lib/email.ts
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
\`\`\`

Repare no \`console.info\` com o \`messageId\`. Isso não estava no código antigo, e foi o que mais me ajudou depois: quando um cliente diz que não recebeu, eu tenho o número do envio para procurar no painel do provedor. Sem isso, a conversa vira "mandei sim" contra "não chegou".

## O que eu ganhei e o que eu perdi

E essa é a parte que quase ninguém escreve, então vai completa:

\`\`\`ganhei-perdi
+ Fila no provedor. Disparo em lote parou de ser problema de código.
+ Custo previsível na faixa de volume em que eu de fato estou.
+ Rastreabilidade: agora eu sei o número de cada envio.
- A documentação do Brevo é pior. Levei uma tarde para achar o remetente certo.
- O painel é mais pesado e tem muita coisa de marketing que eu não uso.
- Um dia de trabalho na troca, que não virou funcionalidade nenhuma para o cliente.
\`\`\`

> Troca de ferramenta nunca é de graça. Quando alguém te conta só o lado bom, ou a troca foi recente demais, ou tem link de indicação no meio.

## Se eu começasse hoje

Faria a conta de guardanapo antes, e manteria o envio atrás de uma função só desde o primeiro dia — foi isso que fez a migração ser um arquivo em vez de uma refatoração.

Fica uma dúvida honesta minha: em que ponto vale sair de um serviço gerenciado e mandar e-mail por conta própria? Eu não sei responder — e desconfio que a resposta é "quase nunca", só que não tenho número para defender isso.`,
    publicado_em: DIA(31),
    criado_em: DIA(28),
    atualizado_em: DIA(31),
    tem_indicacao: true,
    capa_path: null,
    capa_alt: null,
    capa_credito: null,
    etiquetas: [etiqueta("brevo"), etiqueta("resend"), etiqueta("e-mail"), etiqueta("decisao-tecnica")],
  },
  {
    id: "p2",
    slug: "apaguei-a-coluna-errada",
    idioma: "pt-BR",
    portal: "tecnologia",
    titulo: "Apaguei a coluna errada e derrubei o sistema (o backup me salvou em 3 minutos)",
    resumo:
      "Fui fazer uma alteração simples numa tabela e levei o ambiente junto. Voltou rápido porque backup é a única coisa da qual eu não abro mão. Só que o erro virou conteúdo — por assim dizer, é o combinado.",
    corpo: `Era uma alteração de dois minutos. Renomear uma coluna que ninguém mais usava.

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
    publicado_em: DIA(24),
    criado_em: DIA(22),
    atualizado_em: DIA(24),
    tem_indicacao: false,
    capa_path: null,
    capa_alt: null,
    capa_credito: null,
    etiquetas: [etiqueta("postgres"), etiqueta("errei-feio"), etiqueta("decisao-tecnica")],
  },
  {
    id: "p3",
    slug: "eletronica-aos-vinte-e-poucos",
    idioma: "pt-BR",
    portal: "pessoal",
    titulo: "Descobri música eletrônica numa rave aos 20 e poucos e não faz o menor sentido",
    resumo:
      "Minha playlist é 1980. A-ha, Cyndi Lauper, RPM, Raul Seixas. Acredito eu que nasci na época errada. Só que aí eu fui pra primeira rave da minha vida e o progressivo simplesmente pareceu certo.",
    corpo: `Minha playlist é 1980. A-ha, Cyndi Lauper, RPM, Raul Seixas. Acredito eu que nasci na época errada, e digo isso sem nenhuma ironia.

Só que aí eu fui pra primeira rave da minha vida.

## O que não fechava

Eu esperava não gostar. Música sem letra, sem refrão, quatro batidas por compasso durante seis horas — no papel é o oposto de tudo que eu escuto.

## O que fechou

Progressivo tem estrutura. É construção longa, com tensão que sobe por oito minutos antes de resolver. Ou seja: é a mesma coisa que me prende num sintetizador de 1984, só esticada.

Dito isso, eu ainda não sei explicar direito. E acho que essa é a parte honesta.`,
    publicado_em: DIA(18),
    criado_em: DIA(17),
    atualizado_em: DIA(18),
    tem_indicacao: false,
    capa_path: null,
    capa_alt: null,
    capa_credito: null,
    etiquetas: [etiqueta("musica"), etiqueta("anos-80")],
  },
];

/* ─────────────────────────── currículo ─────────────────────────── */

export const experienciasDemo: Experiencia[] = [
  {
    id: "e1",
    cargo: "Desenvolvimento de sistemas e automação",
    empresa: "Artemec", // exceção da DEC-025: currículo é local de trabalho
    local: "Goiânia, GO",
    inicio: "2024-01-01",
    fim: null,
    resumo:
      "Construção e operação de um sistema interno de gestão: integrações, " +
      "automações de processo e orquestração de IA.",
    marcos: [
      "Integrações entre sistemas e automação de processos internos",
      "Orquestração de IA aplicada à rotina da operação",
      "Envio transacional de e-mail com rastreabilidade de entrega",
    ],
    ordem: 0,
  },
];

export const formacaoDemo: Formacao[] = [
  {
    id: "f1",
    curso: "Engenharia de Controle e Automação",
    instituicao: "Graduação",
    local: "Goiânia, GO",
    situacao: "cursando",
    previsao_conclusao: null,
    inicio: "2020-02-01",
    fim: null,
    ordem: 0,
  },
];

export const habilidadesDemo: Habilidade[] = [
  { id: "h1", categoria: "Dados", nome: "PostgreSQL", nivel: 4, ordem: 1, prova_post_id: "p2", observacao: null },
  { id: "h2", categoria: "Automação", nome: "Automação (n8n)", nivel: 5, ordem: 2, prova_post_id: null, observacao: null },
  { id: "h3", categoria: "IA", nome: "Orquestração de IA", nivel: 4, ordem: 3, prova_post_id: null, observacao: null },
  { id: "h4", categoria: "Aplicação", nome: "Next.js", nivel: 3, ordem: 4, prova_post_id: null, observacao: null },
  { id: "h5", categoria: "Automação", nome: "Integração de API", nivel: 4, ordem: 5, prova_post_id: "p1", observacao: null },
  { id: "h6", categoria: "Operação", nome: "Instrumentação", nivel: 4, ordem: 6, prova_post_id: "p2", observacao: null },
];

/* Vazio de propósito (DEC-021/DEC-023): certificado só entra depois que o PDF
   foi conferido um a um — e, com balde público, conferido ANTES do upload.
   Nenhum foi conferido ainda, então o espelho público é uma lista vazia. */
export const certificadosDemo: Certificado[] = [];

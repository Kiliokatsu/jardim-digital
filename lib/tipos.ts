/* Tipos do domínio. Espelham as colunas do Postgres (snake_case de propósito —
   o que vem do banco chega assim, e traduzir no meio do caminho só cria um lugar
   a mais pra errar). Schema em supabase/schema.sql. */

/** Onde o texto é publicado. Financeiro foi cortado: virou assunto dentro de tecnologia. */
export type Portal = "tecnologia" | "pessoal";

/** O eixo do jardim. Nota não nasce pronta — ela amadurece. */
export type Maturidade = "semente" | "muda" | "perene";

/** Gênero do texto. `incidente` carrega métricas próprias (tabela incidentes). */
export type Genero = "registro" | "incidente" | "nota";

/** O ciclo da fila de aprovação. Nada vira `publicado` sem passar por `aprovado`. */
export type Estado =
  | "rascunho"
  | "em_revisao"
  | "aprovado"
  | "publicado"
  | "rejeitado";

/** De quem veio o texto. Rascunho de agente entra na fila igual, só marcado. */
export type Autoria = "humano" | "agente";

export type Post = {
  id: string;
  slug: string;
  titulo: string;
  resumo: string | null;
  corpo_md: string;
  portal: Portal;
  genero: Genero;
  maturidade: Maturidade;
  estado: Estado;
  autoria: Autoria;
  /** Qual agente escreveu, quando autoria = 'agente'. */
  agente: string | null;
  /** Qual integração publicou, se a publicação foi automática. */
  publicado_por: string | null;
  tags: string[];
  minutos_leitura: number;
  aviso_indicacao: string | null;
  publicado_em: string | null;
  criado_em: string;
  atualizado_em: string;
  /** Quantas vezes o texto foi revisado antes de subir. Aparece no Modo Engenheiro. */
  revisoes: number;
};

/** Métricas de post-mortem. Um incidente é um post com contabilidade. */
export type Incidente = {
  post_id: string;
  causa: string;
  recuperacao: string;
  /** Segundos entre quebrar e perceber. */
  deteccao_segundos: number;
  /** Segundos entre perceber e voltar ao ar. */
  mttr_segundos: number;
  perdeu_dado: boolean;
};

/** Aresta do grafo. É o `[[link]]` do Obsidian sobrevivendo até o site. */
export type Conexao = {
  de: string;
  para: string;
};

export type Habilidade = {
  id: string;
  nome: string;
  categoria: string;
  /** 1 a 5. Usado como medidor na página de currículo. */
  nivel: number;
  ordem: number;
};

/** A ligação que faz o currículo valer: habilidade → post que prova. */
export type Prova = {
  habilidade_id: string;
  post_id: string;
};

export type Experiencia = {
  id: string;
  cargo: string;
  organizacao: string;
  inicio: string;
  fim: string | null;
  resumo: string;
  ordem: number;
};

export type Formacao = {
  id: string;
  curso: string;
  instituicao: string;
  inicio: string;
  fim: string | null;
  ordem: number;
};

export type Perfil = {
  id: string;
  nome: string;
  titulo: string;
  bio: string;
  foto_url: string | null;
  email: string;
  cidade: string | null;
};

/* ─────────────────────────── automações ─────────────────────────── */

export type TipoIntegracao = "n8n" | "webhook" | "cron" | "api";
export type EstadoExecucao = "ok" | "alerta" | "erro" | "rodando";

export type Integracao = {
  id: string;
  nome: string;
  tipo: TipoIntegracao;
  descricao: string | null;
  /** Onde o painel bate pra disparar. O painel controla; quem executa é lá fora. */
  url: string | null;
  ativa: boolean;
  /**
   * Nome da variável de ambiente que guarda o segredo — NUNCA o segredo em si.
   * Credencial em coluna de texto é vazamento esperando acontecer.
   */
  ref_segredo: string | null;
  config: Record<string, unknown>;
  ultimo_estado: EstadoExecucao | null;
  ultima_execucao_em: string | null;
  criado_em: string;
};

export type Execucao = {
  id: string;
  integracao_id: string;
  estado: EstadoExecucao;
  mensagem: string | null;
  duracao_ms: number | null;
  /** Quem disparou: 'painel' (manual) ou 'externo' (a própria automação avisando). */
  origem: string;
  criado_em: string;
};

/** Trilha de auditoria da fila. Quem aprovou o quê, quando, e por quê não. */
export type EventoModeracao = {
  id: string;
  post_id: string;
  acao: "enviou_revisao" | "aprovou" | "rejeitou" | "publicou" | "despublicou";
  nota: string | null;
  criado_em: string;
};

/* ─────────────────────────── auxiliares ─────────────────────────── */

export const MATURIDADES: { chave: Maturidade; rotulo: string; glifo: string; descricao: string }[] = [
  { chave: "semente", rotulo: "Semente", glifo: "◍", descricao: "Ideia crua. Anotei pra não perder, ainda não defendo." },
  { chave: "muda", rotulo: "Muda", glifo: "◍◍", descricao: "Já tem forma e argumento. Ainda vou mexer." },
  { chave: "perene", rotulo: "Perene", glifo: "◍◍◍", descricao: "Assentou. É o que eu penso, e volto aqui pra citar." },
];

export const ESTADOS: Record<Estado, { rotulo: string; cor: string }> = {
  rascunho: { rotulo: "Rascunho", cor: "var(--muted)" },
  em_revisao: { rotulo: "Em revisão", cor: "var(--warn)" },
  aprovado: { rotulo: "Aprovado", cor: "var(--ok)" },
  publicado: { rotulo: "Publicado", cor: "var(--accent)" },
  rejeitado: { rotulo: "Rejeitado", cor: "var(--erro)" },
};

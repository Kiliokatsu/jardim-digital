/* Tipos do domínio. Espelham as colunas do Postgres (snake_case de propósito —
   o que vem do banco chega assim, e traduzir no meio do caminho só cria um lugar
   a mais pra errar). Schema em supabase/migrations/0001_reconstrucao_v3.sql. */

/** Os três portais do site. Profissional é currículo, não blog. */
export type Portal = "profissional" | "tecnologia" | "pessoal";

export type Post = {
  id: string;
  slug: string;
  idioma: string;
  portal: Portal;
  titulo: string;
  resumo: string;
  corpo: string;
  /** NULL = rascunho. Só chega ao público quando não-nulo e <= now() (RLS). */
  publicado_em: string | null;
  criado_em: string;
  atualizado_em: string;
  /** DEC-013: o componente renderiza a linha de aviso de indicação a partir daqui. */
  tem_indicacao: boolean;
  /** Caminho DENTRO do balde 'capas', nunca a URL completa (DEC-019). */
  capa_path: string | null;
  capa_alt: string | null;
  capa_credito: string | null;
  /** Embutidas pelo join posts_etiquetas → etiquetas. Ausente quando a consulta não pediu. */
  etiquetas?: Etiqueta[];
};

/** Etiqueta com página própria (DEC-018): slug na URL, descrição de abertura. */
export type Etiqueta = {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  criado_em: string;
};

/** Linha única (id = 1). O dono do currículo. */
export type Perfil = {
  id: number;
  nome_completo: string;
  nome_publico: string;
  titulo: string;
  resumo: string;
  cidade: string | null;
  email: string | null;
  telefone: string | null;
  /** Extensão local ao v3: a página mostra a foto ou "sem foto". */
  foto_url: string | null;
  atualizado_em: string;
};

export type PerfilLink = {
  id: string;
  rotulo: string;
  url: string;
  ordem: number;
};

export type Experiencia = {
  id: string;
  cargo: string;
  empresa: string;
  local: string | null;
  inicio: string;
  /** NULL = atual. */
  fim: string | null;
  /** Extensão local ao v3: parágrafo corrido acima dos marcos. */
  resumo: string | null;
  marcos: string[];
  ordem: number;
};

export type Formacao = {
  id: string;
  curso: string;
  instituicao: string;
  local: string | null;
  situacao: string;
  previsao_conclusao: string | null;
  /** Extensão local ao v3: a página mostra "mmm aaaa — mmm aaaa". */
  inicio: string | null;
  fim: string | null;
  ordem: number;
};

export type Habilidade = {
  id: string;
  categoria: string;
  nome: string;
  ordem: number;
  /** A ligação que faz o currículo valer: habilidade → post que prova. */
  prova_post_id: string | null;
  observacao: string | null;
  /** Extensão local ao v3: 1 a 5, o Medidor de 5 traços da página. */
  nivel: number;
};

/** Sistema entregue — cards da home (quando destaque) e da Profissional (DEC-0022). */
export type Projeto = {
  id: string;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  /** O sistema no ar, o repositório, ou um /registro/... (estudo de caso). */
  link_url: string | null;
  stack: string[];
  destaque: boolean;
  visivel: boolean;
  ordem: number;
  criado_em: string;
};

export type Certificado = {
  id: string;
  curso: string;
  instituicao: string;
  ano: number | null;
  /** Caminho no balde 'certificados'. */
  arquivo_path: string | null;
  /** "Já conferi este PDF e ele pode ser aberto por qualquer pessoa" (DEC-021/023). */
  publico: boolean;
  ordem: number;
};

/* ─────────────────────── telemetria pública ───────────────────────
   Os números que o Modo Engenheiro mostra. Nada aqui é sigiloso: é a mesma
   contagem que o visitante conseguiria fazer olhando as páginas. */

export type Telemetria = {
  posts: number;
  etiquetas: number;
  porPortal: Record<Portal, number>;
  /** Publicação mais recente, pra "último plantio". */
  ultimoPlantio: string | null;
  /** Instante do build, pra mostrar de quando é esta página. */
  build: string;
};

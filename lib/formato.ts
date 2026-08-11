/* Formatação. Tudo em pt-BR e com fuso fixo em São Paulo, porque data formatada
   com o fuso do visitante muda entre servidor e cliente e o React reclama. */

const FUSO = "America/Sao_Paulo";

export function dataLonga(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric", month: "long", year: "numeric", timeZone: FUSO,
  }).format(new Date(iso));
}

export function dataCurta(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit", timeZone: FUSO,
  }).format(new Date(iso));
}

export function dataHora(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: FUSO,
  }).format(new Date(iso));
}

/** Mês e ano, pro currículo: "jan 2024". */
export function mesAno(iso: string | null): string {
  if (!iso) return "hoje";
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short", year: "numeric", timeZone: FUSO,
  }).format(new Date(iso)).replace(".", "");
}

/**
 * Distância no tempo em relação a `agora`. Recebe `agora` por parâmetro em vez
 * de chamar Date.now() aqui dentro — assim o servidor e o cliente partem do
 * mesmo instante e não divergem na hidratação.
 */
export function haQuanto(iso: string | null, agora: number): string {
  if (!iso) return "nunca";
  const seg = Math.max(0, Math.round((agora - new Date(iso).getTime()) / 1000));
  if (seg < 60) return `há ${seg}s`;
  const min = Math.round(seg / 60);
  if (min < 60) return `há ${min}min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.round(h / 24);
  if (d < 30) return `há ${d}d`;
  return dataCurta(iso);
}

/** Segundos → "3min 20s". Usado nas métricas de incidente. */
export function duracao(segundos: number): string {
  if (segundos < 60) return `${segundos}s`;
  const min = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return resto ? `${min}min ${resto}s` : `${min}min`;
}

export function milissegundos(ms: number | null): string {
  if (ms == null) return "—";
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

/** ~200 palavras por minuto, arredondando pra cima. Nunca devolve zero. */
export function minutosDeLeitura(texto: string): number {
  const palavras = texto.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(palavras / 200));
}

/** Título → slug. Sem acento, sem pontuação, sem hífen sobrando na ponta. */
export function paraSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

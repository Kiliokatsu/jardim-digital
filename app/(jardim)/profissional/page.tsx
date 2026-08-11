import type { Metadata } from "next";
import Link from "next/link";
import { CabecaSecao } from "@/componentes/Secao";
import { Etiqueta } from "@/componentes/Selos";
import {
  buscarPerfil, listarExperiencias, listarFormacoes,
  listarHabilidades, listarPosts, listarProvas,
} from "@/lib/consultas";
import { mesAno } from "@/lib/formato";

export const metadata: Metadata = {
  title: "Profissional",
  description:
    "Currículo completo numa página: quem eu sou, o que eu construí e onde está a prova de cada habilidade.",
};

/* Página única de currículo, não blog. O objetivo é o combinado: recrutador
   entra, resolve tudo, sai.

   O que a diferencia de um currículo comum está na seção de habilidades — cada
   uma linka o post que a prova. Habilidade sem prova aparece marcada como tal,
   porque esconder isso seria o mesmo que inflar a lista. */

export default async function Profissional() {
  const [perfil, habilidades, provas, posts, experiencias, formacoes] = await Promise.all([
    buscarPerfil(),
    listarHabilidades(),
    listarProvas(),
    listarPosts(),
    listarExperiencias(),
    listarFormacoes(),
  ]);

  const porId = new Map(posts.map((p) => [p.id, p]));
  const provasPor = new Map<string, typeof posts>();
  for (const pr of provas) {
    const post = porId.get(pr.post_id);
    if (!post) continue; // prova apontando pra post não publicado não vale como prova
    const lista = provasPor.get(pr.habilidade_id) ?? [];
    lista.push(post);
    provasPor.set(pr.habilidade_id, lista);
  }

  const categorias = [...new Set(habilidades.map((h) => h.categoria))];
  const comProva = habilidades.filter((h) => (provasPor.get(h.id)?.length ?? 0) > 0).length;

  return (
    <>
      {/* ─────────────────────────── identidade ─────────────────────────── */}
      <section className="flex flex-col gap-8 py-16 sm:flex-row sm:items-start">
        <div
          data-campo="perfil.foto_url"
          className="flex h-28 w-28 flex-none items-center justify-center overflow-hidden rounded-[var(--radius-token)] border border-linha bg-superficie-2 font-mono text-xs text-suave"
        >
          {perfil.foto_url ? (
            /* eslint-disable-next-line @next/next/no-img-element -- foto vem do banco, sem domínio fixo pra configurar no next/image */
            <img src={perfil.foto_url} alt={perfil.nome} className="h-full w-full object-cover" />
          ) : (
            "sem foto"
          )}
        </div>

        <div className="flex-1">
          <h1 data-campo="perfil.nome" className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            {perfil.nome}
          </h1>
          <p data-campo="perfil.titulo" className="mt-1.5 text-acento">
            {perfil.titulo}
          </p>
          <p data-campo="perfil.bio" className="mt-5 max-w-2xl leading-relaxed text-suave">
            {perfil.bio}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href={`mailto:${perfil.email}`}
              className="rounded-full bg-acento px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {perfil.email}
            </a>
            {perfil.cidade && <Etiqueta>{perfil.cidade}</Etiqueta>}
          </div>
        </div>
      </section>

      {/* ─────────────────────────── habilidades ─────────────────────────── */}
      <section className="pb-14">
        <CabecaSecao
          titulo="Conhecimentos"
          contador={habilidades.length}
          nota={`Cada habilidade aponta pro registro que a comprova — ${comProva} de ${habilidades.length} já têm prova escrita. As outras estão marcadas, porque lista sem prova é só lista.`}
        />

        <div className="flex flex-col gap-8">
          {categorias.map((cat) => (
            <div key={cat}>
              <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-suave">
                {cat}
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2">
                {habilidades
                  .filter((h) => h.categoria === cat)
                  .map((h) => {
                    const daProva = provasPor.get(h.id) ?? [];
                    return (
                      <li
                        key={h.id}
                        data-campo="habilidades"
                        data-campo-bloco=""
                        className="relative rounded-[var(--radius-token)] border border-linha bg-superficie p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span data-campo="nome" className="font-semibold">
                            {h.nome}
                          </span>
                          <Medidor nivel={h.nivel} />
                        </div>

                        {daProva.length > 0 ? (
                          <ul className="mt-3 flex flex-col gap-1.5 border-t border-linha pt-3">
                            {daProva.map((p) => (
                              <li key={p.id}>
                                <Link
                                  href={`/registro/${p.slug}`}
                                  className="group flex items-start gap-2 text-[13px] leading-snug text-suave hover:text-acento"
                                >
                                  <span aria-hidden className="mt-[3px] flex-none text-acento">
                                    ↳
                                  </span>
                                  <span className="underline decoration-linha decoration-1 underline-offset-2 group-hover:decoration-acento">
                                    {p.titulo}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-3 border-t border-linha pt-3 text-[13px] text-suave">
                            <span className="text-alerta">sem prova escrita ainda</span> — está
                            na fila
                          </p>
                        )}
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────── experiência ─────────────────────────── */}
      <section className="pb-14">
        <CabecaSecao titulo="Experiência" contador={experiencias.length} />
        <ol className="flex flex-col">
          {experiencias.map((e) => (
            <li
              key={e.id}
              data-campo="experiencias"
              data-campo-bloco=""
              className="relative border-l border-linha py-5 pl-6"
            >
              <span
                aria-hidden
                className="absolute -left-[5px] top-7 h-2.5 w-2.5 rounded-full bg-acento"
              />
              <p className="font-mono text-xs text-suave">
                {mesAno(e.inicio)} — {mesAno(e.fim)}
              </p>
              <h3 className="mt-1 text-lg font-bold tracking-tight">
                <span data-campo="cargo">{e.cargo}</span>
                <span className="text-suave"> · </span>
                <span data-campo="organizacao" className="text-acento">
                  {e.organizacao}
                </span>
              </h3>
              <p data-campo="resumo" className="mt-2 max-w-2xl leading-relaxed text-suave">
                {e.resumo}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ─────────────────────────── formação ─────────────────────────── */}
      <section className="pb-16">
        <CabecaSecao titulo="Formação" contador={formacoes.length} />
        <ul className="flex flex-col divide-y divide-linha">
          {formacoes.map((f) => (
            <li
              key={f.id}
              data-campo="formacoes"
              className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-4"
            >
              <span className="flex-1 font-semibold">{f.curso}</span>
              <span className="text-sm text-suave">{f.instituicao}</span>
              <span className="font-mono text-xs text-suave">
                {mesAno(f.inicio)} — {mesAno(f.fim)}
              </span>
            </li>
          ))}
        </ul>

        {/* combinado antigo, mantido: certificado é documentação particular */}
        <p className="mt-6 max-w-2xl rounded-[var(--radius-token)] border border-dashed border-linha px-4 py-3 text-sm text-suave">
          Certificados não ficam publicados aqui — eles são a minha documentação de estudo, não
          argumento de venda. Se você precisa deles pra um processo, me peça por e-mail e eu
          mando na hora.
        </p>
      </section>
    </>
  );
}

/** Cinco traços, tantos acesos quanto o nível. Menos ridículo que estrelinha. */
function Medidor({ nivel }: { nivel: number }) {
  return (
    <span
      data-campo="nivel"
      className="inline-flex flex-none items-center gap-[3px]"
      title={`Nível ${nivel} de 5`}
    >
      <span className="sr-only">Nível {nivel} de 5</span>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          aria-hidden
          className="h-3 w-[3px] rounded-full"
          style={{ background: i <= nivel ? "var(--accent)" : "var(--border)" }}
        />
      ))}
    </span>
  );
}

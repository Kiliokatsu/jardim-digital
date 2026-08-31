import Link from "next/link";
import { CartaoPost } from "@/componentes/CartaoPost";
import { listarPosts, listarProjetos, telemetria } from "@/lib/consultas";
import { contarDecisoes } from "@/lib/metricas";

/* Home da v2 (espec §6.1): o selo como âncora do hero, a frase que diz quem
   ele é, a FAIXA DE PROVA com três números reais (nunca chumbados — vêm do
   banco e do próprio repositório), os três portais como estrutura, os
   sistemas em destaque e os registros recentes. Nenhuma menção a empresa —
   a DEC-025 vale inclusive aqui; empregador é assunto do currículo.

   O calendário do GitHub (espec §6.1.7) espera decisão sobre o token da API
   — registrado como pendência da Fase A. */

const PORTAIS = [
  {
    href: "/profissional",
    tipo: "página",
    titulo: "Profissional",
    texto:
      "Currículo, o que eu já pus em produção, e cada habilidade ligada ao post que prova que eu entendi.",
    icone: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
      </svg>
    ),
  },
  {
    href: "/tecnologia",
    tipo: "blog",
    titulo: "Tecnologia",
    texto:
      "Decisão técnica com nome e sobrenome: por que troquei de ferramenta, o que quebrou, o que eu faria diferente.",
    icone: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
      </svg>
    ),
  },
  {
    href: "/pessoal",
    tipo: "blog",
    titulo: "Pessoal",
    texto:
      "Anime, eletrônica progressiva, análise de fundo imobiliário e o resto do caos que me faz ser eu.",
    icone: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M12 21s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.4-7 10-7 10Z" />
      </svg>
    ),
  },
] as const;

export default async function Home() {
  const [posts, tele, projetos, decisoes] = await Promise.all([
    listarPosts(),
    telemetria(),
    listarProjetos(true),
    contarDecisoes(),
  ]);
  const [destaque, ...resto] = posts;
  const dupla = resto.slice(0, 2);

  /* a faixa de prova: números que o visitante pode conferir — post é contável
     nas listagens, projeto na página Profissional, decisão no repositório */
  const PROVAS = [
    { numero: tele.posts, rotulo: "registros publicados" },
    { numero: projetos.length, rotulo: "sistemas em destaque" },
    { numero: decisoes, rotulo: "decisões documentadas" },
  ];

  return (
    <>
      <section className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG da marca */}
        <img src="/marca/selo/selo-escuro.svg" alt="" aria-hidden className="selo-hero marca-escuro" />
        {/* eslint-disable-next-line @next/next/no-img-element -- par claro do selo */}
        <img src="/marca/selo/selo-claro.svg" alt="" aria-hidden className="selo-hero marca-claro" />
        <p className="sobre">Construindo em público · desde 2026</p>
        <h1>
          Construo sistemas <em>sólidos</em>.
          <br />E mostro a cozinha pegando fogo.
        </h1>
        <p className="sub">
          Desenvolvedor de sistemas, cursando Engenharia de Controle e Automação. Aqui eu
          escrevo as decisões técnicas que eu tomei errado antes de tomar certo — com o que eu
          ganhei e o que eu perdi em cada troca.
        </p>
        <div className="acoes">
          <Link className="btn primario" href="/tecnologia">
            Ler os registros
          </Link>
          <Link className="btn" href="/profissional">
            Quem eu sou
          </Link>
        </div>
      </section>

      <section className="faixa-prova" aria-label="Números do site">
        {PROVAS.map((p) => (
          <div key={p.rotulo} className="prova">
            <span className="prova-numero">{p.numero}</span>
            <span className="prova-rotulo">{p.rotulo}</span>
          </div>
        ))}
      </section>

      <section className="pb-6">
        <div className="cabeca-sec">
          <h2>Três portais</h2>
          <div className="regua" aria-hidden />
        </div>
        <div className="portais">
          {PORTAIS.map((p) => {
            const quantos = p.href === "/profissional" ? null : tele.porPortal[p.titulo.toLowerCase() as "tecnologia" | "pessoal"];
            return (
              <Link key={p.href} href={p.href} className="portal">
                <div className="ico" aria-hidden>{p.icone}</div>
                <span className="tipo">
                  {quantos === null ? p.tipo : `${p.tipo} · ${quantos} ${quantos === 1 ? "registro" : "registros"}`}
                </span>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
                <div className="vai">
                  {p.href} <span aria-hidden>→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {projetos.length > 0 && (
        <section className="pb-6">
          <div className="cabeca-sec">
            <h2>Sistemas em destaque</h2>
            <div className="regua" aria-hidden />
            <Link className="ver-tudo" href="/profissional">
              todos os sistemas →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {projetos.map((pj) => (
              <article
                key={pj.id}
                className="relative flex flex-col gap-3 rounded-[var(--radius-token)] border border-linha bg-superficie p-6 transition-colors hover:border-acento/50"
              >
                <h3 className="text-lg font-bold leading-snug tracking-tight">
                  {pj.link_url ? (
                    <a
                      href={pj.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-acento"
                    >
                      <span className="absolute inset-0" aria-hidden />
                      {pj.nome}
                    </a>
                  ) : (
                    pj.nome
                  )}
                </h3>
                {pj.descricao && (
                  <p className="text-[0.94rem] leading-relaxed text-suave">{pj.descricao}</p>
                )}
                {pj.stack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {pj.stack.map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-tag-fundo px-2 py-1 font-mono text-[10px] text-tag-texto"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="pb-10">
        <div className="cabeca-sec">
          <h2>Últimos registros</h2>
          <div className="regua" aria-hidden />
          <Link className="ver-tudo" href="/tecnologia">
            ver todos →
          </Link>
        </div>

        {posts.length === 0 ? (
          <p className="rounded-[var(--radius-token)] border border-dashed border-linha px-4 py-8 text-sm text-suave">
            Ainda não plantei nada aqui.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {destaque && <CartaoPost post={destaque} densidade="destaque" />}
            {dupla.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {dupla.map((p) => (
                  <CartaoPost key={p.id} post={p} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}

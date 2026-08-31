import Link from "next/link";
import { CartaoPost } from "@/componentes/CartaoPost";
import { listarPosts, telemetria } from "@/lib/consultas";

/* Home aprovada (DEC-007): uma frase que diz quem ele é e o que o site é, os
   três portais como estrutura da página, e os registros recentes no fim.
   Nenhuma menção a empresa — a DEC-025 vale inclusive aqui; empregador é
   assunto do currículo. */

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
  const [posts, tele] = await Promise.all([listarPosts(), telemetria()]);
  const [destaque, ...resto] = posts;
  const dupla = resto.slice(0, 2);

  return (
    <>
      <section className="hero">
        <p className="sobre">Construindo em público · desde 2026</p>
        <h1>
          Construo sistemas sólidos.
          <br />E mostro a <em>cozinha pegando fogo</em>.
        </h1>
        <p className="sub">
          Desenvolvedor de sistemas, cursando Engenharia de Controle e Automação. Aqui eu
          escrevo as decisões técnicas que eu tomei errado antes de tomar certo — com o que eu
          ganhei e o que eu perdi em cada troca.
        </p>
        <div className="acoes">
          <Link className="btn primario" href="/profissional">
            Quem eu sou e o que eu construí
          </Link>
          <Link className="btn" href="/tecnologia">
            Ler os registros
          </Link>
        </div>
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

import { CabecalhoPublico } from "@/componentes/CabecalhoPublico";
import { RodapePublico } from "@/componentes/RodapePublico";
import { buscarPerfil, listarPerfilLinks, telemetria } from "@/lib/consultas";

/* Casca da visão pública da v2 (DEC-0021): header com a marca, conteúdo,
   rodapé de dois andares. Os efeitos do caos saíram — voltam um dia como
   terceiro conjunto de tokens, não como camada. */

export default async function LayoutJardim({ children }: { children: React.ReactNode }) {
  const [perfil, links, tele] = await Promise.all([
    buscarPerfil(),
    listarPerfilLinks(),
    telemetria(),
  ]);

  return (
    <>
      <CabecalhoPublico />
      <main className="mx-auto w-full max-w-[var(--maxw)] flex-1 px-6">{children}</main>
      <RodapePublico perfil={perfil} links={links} telemetria={tele} />
    </>
  );
}

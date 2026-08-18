import { CabecalhoPublico } from "@/componentes/CabecalhoPublico";
import { RodapePublico } from "@/componentes/RodapePublico";
import { Dragao } from "@/componentes/caos/Dragao";
import { Grao } from "@/componentes/caos/Grao";
import { buscarPerfil, listarPerfilLinks, telemetria } from "@/lib/consultas";

/* Casca da visão pública. Os efeitos do caos moram aqui — presentes em toda
   página, inertes fora do modo caos (DEC-003-b): o granulado é CSS puro e o
   dragão em chamas (DEC-0010) só monta com data-persona="caos". */

export default async function LayoutJardim({ children }: { children: React.ReactNode }) {
  const [perfil, links, tele] = await Promise.all([
    buscarPerfil(),
    listarPerfilLinks(),
    telemetria(),
  ]);

  return (
    <>
      <Grao />
      <Dragao />
      <CabecalhoPublico />
      <main className="mx-auto w-full max-w-[var(--maxw)] flex-1 px-6">{children}</main>
      <RodapePublico perfil={perfil} links={links} telemetria={tele} />
    </>
  );
}

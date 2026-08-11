import { CabecalhoPublico } from "@/componentes/CabecalhoPublico";
import { RodapePublico } from "@/componentes/RodapePublico";
import { Dragao } from "@/componentes/caos/Dragao";
import { Grao } from "@/componentes/caos/Grao";
import { buscarPerfil, listarPerfilLinks, telemetria } from "@/lib/consultas";

/* Casca da visão pública. O dragão e o granulado moram aqui — presentes em
   toda página, mas inertes fora do modo caos (DEC-003-b: no modo normal o
   laço de animação nem roda). */

export default async function LayoutJardim({ children }: { children: React.ReactNode }) {
  const [perfil, links, tele] = await Promise.all([
    buscarPerfil(),
    listarPerfilLinks(),
    telemetria(),
  ]);

  return (
    <>
      <Dragao />
      <Grao />
      <CabecalhoPublico />
      <main className="mx-auto w-full max-w-[var(--maxw)] flex-1 px-6">{children}</main>
      <RodapePublico perfil={perfil} links={links} telemetria={tele} />
    </>
  );
}

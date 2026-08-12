import { CabecalhoPublico } from "@/componentes/CabecalhoPublico";
import { RodapePublico } from "@/componentes/RodapePublico";
import { Grao } from "@/componentes/caos/Grao";
import { buscarPerfil, listarPerfilLinks, telemetria } from "@/lib/consultas";

/* Casca da visão pública. O granulado do caos mora aqui — presente em toda
   página, inerte fora do modo caos (DEC-003-b). O efeito especial do caos
   (o dragão saiu — DEC-0008) entra quando as referências da DEC-004 chegarem. */

export default async function LayoutJardim({ children }: { children: React.ReactNode }) {
  const [perfil, links, tele] = await Promise.all([
    buscarPerfil(),
    listarPerfilLinks(),
    telemetria(),
  ]);

  return (
    <>
      <Grao />
      <CabecalhoPublico />
      <main className="mx-auto w-full max-w-[var(--maxw)] flex-1 px-6">{children}</main>
      <RodapePublico perfil={perfil} links={links} telemetria={tele} />
    </>
  );
}

import { CabecalhoPublico } from "@/componentes/CabecalhoPublico";
import { RodapePublico } from "@/componentes/RodapePublico";
import { buscarPerfil, telemetria } from "@/lib/consultas";

/* Casca da visão pública. O painel fica fora deste grupo de rotas de propósito:
   as duas visões não compartilham cabeçalho, rodapé nem densidade. */

export default async function LayoutJardim({ children }: { children: React.ReactNode }) {
  const [perfil, tele] = await Promise.all([buscarPerfil(), telemetria()]);

  return (
    <>
      <div className="aura" aria-hidden />
      <CabecalhoPublico />
      <main className="mx-auto w-full max-w-[var(--maxw)] flex-1 px-6">{children}</main>
      <RodapePublico perfil={perfil} telemetria={tele} />
    </>
  );
}

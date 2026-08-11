import { redirect } from "next/navigation";
import { AvisoDemonstracao, CabecalhoPainel } from "@/componentes/painel/Casca";
import { EMAIL_DONO, modoDemonstracao } from "@/lib/config";
import { donoLogado } from "@/lib/supabase/servidor";
import { resumo } from "@/lib/painel";

/* Aqui é a porta que vale.

   O proxy.ts já barra o visitante deslogado antes de renderizar, mas ele é um
   portão rápido que pode até rodar na CDN. Esta verificação pergunta ao servidor
   de auth do Supabase quem está logado, e é a que eu confiaria se as duas
   discordassem. */

export default async function LayoutInternoPainel({ children }: { children: React.ReactNode }) {
  const usuario = modoDemonstracao ? null : await donoLogado();

  if (!modoDemonstracao) {
    if (!usuario) redirect("/painel/login");
    /* Sessão válida não basta: precisa ser a SUA. Se um dia outra conta existir
       no projeto Supabase, ela autentica mas não entra aqui. */
    if (usuario.email?.toLowerCase() !== EMAIL_DONO.toLowerCase()) {
      redirect("/painel/login?erro=sem-permissao");
    }
  }

  const dados = await resumo();

  return (
    <>
      {modoDemonstracao && <AvisoDemonstracao />}
      <CabecalhoPainel resumo={dados} email={usuario?.email ?? null} />
      <main className="mx-auto w-full max-w-[var(--maxw)] flex-1 px-5 py-6">{children}</main>
    </>
  );
}

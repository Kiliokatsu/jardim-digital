import Link from "next/link";
import { redirect } from "next/navigation";
import { FormularioLogin } from "./FormularioLogin";
import { modoDemonstracao } from "@/lib/config";

const AVISOS: Record<string, string> = {
  "sem-permissao":
    "Essa conta autenticou, mas não é a do dono. O painel é de uma pessoa só.",
};

export default async function Login(props: PageProps<"/painel/login">) {
  // sem banco, não existe login pra fazer: o painel abre direto em demonstração
  if (modoDemonstracao) redirect("/painel");

  const busca = await props.searchParams;
  const de = typeof busca.de === "string" ? busca.de : "/painel";
  const erro = typeof busca.erro === "string" ? AVISOS[busca.erro] : undefined;

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-acento" />
            <span className="font-mono text-sm font-bold uppercase tracking-[0.1em]">
              JD · painel
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sala de máquinas</h1>
          <p className="mt-2 text-sm leading-relaxed text-suave">
            Daqui saem as publicações, a fila de aprovação e o controle das automações.
            É de uma pessoa só — se você chegou por curiosidade, o jardim está{" "}
            <Link href="/" className="text-acento underline underline-offset-2">
              aqui
            </Link>
            .
          </p>
        </div>

        <div className="rounded-[var(--radius-token)] border border-linha bg-superficie p-5">
          <FormularioLogin de={de} avisoInicial={erro} />
        </div>

        <p className="mt-5 font-mono text-[11px] leading-relaxed text-suave">
          Não existe cadastro nesta tela de propósito. A conta é criada uma única vez no painel
          do Supabase, e o registro público deve ficar desligado lá.
        </p>
      </div>
    </div>
  );
}

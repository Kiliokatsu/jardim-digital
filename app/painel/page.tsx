import { ConsolePainel } from "@/componentes/painel/ConsolePainel";

/* A página é só a casca do console (DEC-0013): todo o estado — sessão,
   alistamento, fila — vive no cliente, porque a segurança não está aqui.
   Está na RLS. */

export default function PaginaPainel() {
  return <ConsolePainel />;
}

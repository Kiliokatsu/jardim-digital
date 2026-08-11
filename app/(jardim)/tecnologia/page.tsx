import type { Metadata } from "next";
import { PaginaPortal } from "@/componentes/PaginaPortal";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Tecnologia",
  description:
    "Decisão técnica com nome e sobrenome: por que troquei de ferramenta, o que quebrou, o que eu faria diferente.",
};

export default function Tecnologia() {
  return (
    <PaginaPortal
      portal="tecnologia"
      titulo="Decisão técnica com nome e sobrenome."
      chamada="Por que troquei de ferramenta, o que quebrou no caminho, o que eu ganhei e o que eu perdi. Erro é conteúdo — sempre junto com o conserto."
    />
  );
}

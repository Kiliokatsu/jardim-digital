import type { Metadata } from "next";
import { PaginaPortal } from "@/componentes/PaginaPortal";

export const metadata: Metadata = {
  title: "Tecnologia",
  description:
    "Decisões técnicas com nome e sobrenome: por que troquei de ferramenta, o que quebrou e o que eu faria diferente.",
};

export default function Tecnologia() {
  return (
    <PaginaPortal
      portal="tecnologia"
      titulo="As decisões técnicas com nome e sobrenome"
      chamada="Por que troquei de ferramenta, o que quebrou, quanto tempo levei pra perceber e o que eu faria diferente. Post-mortem aqui vem com número, não com adjetivo."
    />
  );
}

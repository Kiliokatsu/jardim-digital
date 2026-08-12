import type { Metadata } from "next";
import { PaginaPortal } from "@/componentes/PaginaPortal";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Pessoal",
  description:
    "Anime, eletrônica progressiva, análise de fundo imobiliário e o resto do caos que me faz ser eu.",
};

export default function Pessoal() {
  return (
    <PaginaPortal
      portal="pessoal"
      titulo="O resto do caos que me faz ser eu."
      chamada="Anime, eletrônica progressiva e análise de fundo imobiliário como texto — porque nem tudo que eu construo compila."
    />
  );
}

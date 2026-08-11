import type { Metadata } from "next";
import { PaginaPortal } from "@/componentes/PaginaPortal";

export const metadata: Metadata = {
  title: "Pessoal",
  description:
    "Anime, eletrônica progressiva, Dota às duas da manhã e o resto do caos que me faz ser eu.",
};

export default function Pessoal() {
  return (
    <PaginaPortal
      portal="pessoal"
      titulo="O caos que me faz ser eu"
      chamada="Anime, eletrônica progressiva, playlist travada em 1980 e Dota às duas da manhã. Nada aqui tenta ser útil — e é exatamente esse o ponto."
    />
  );
}

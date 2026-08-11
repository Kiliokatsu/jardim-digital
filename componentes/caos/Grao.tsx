/* O granulado do modo caos. É 100% CSS: a textura é um SVG de ruído inline
   no globals.css e a opacidade vem do token --grain-op, que o atributo
   data-persona controla. Nenhum estado, nenhum efeito — logo, componente de
   servidor: não custa um byte de JavaScript no cliente. */
export function Grao() {
  return <div className="grao" aria-hidden="true" />;
}

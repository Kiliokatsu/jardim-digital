import { createHighlighterCoreSync, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import langBash from "shiki/langs/bash.mjs";
import langCss from "shiki/langs/css.mjs";
import langJson from "shiki/langs/json.mjs";
import langSql from "shiki/langs/sql.mjs";
import langTsx from "shiki/langs/tsx.mjs";
import langTs from "shiki/langs/typescript.mjs";
import temaEscuro from "shiki/themes/github-dark.mjs";
import temaClaro from "shiki/themes/github-light.mjs";

/* Destacador de código em tempo de renderização no SERVIDOR (decisão do
   pacote dragão: "chega no navegador já colorido, sem JS"). A versão síncrona
   do Shiki existe para exatamente este caso — componente de Server Component
   não pode esperar inicialização assíncrona no meio do react-markdown.

   Os dois temas saem juntos como variáveis CSS (--shiki-light/--shiki-dark) e
   o globals.css decide qual vale segundo data-tema — trocar de tema não
   re-renderiza nada. */

const LINGUAGENS_CARREGADAS = [langTs, langTsx, langSql, langBash, langJson, langCss];

const realcador: HighlighterCore = createHighlighterCoreSync({
  themes: [temaEscuro, temaClaro],
  langs: LINGUAGENS_CARREGADAS,
  engine: createJavaScriptRegexEngine(),
});

const CONHECIDAS = new Set(realcador.getLoadedLanguages());

/** Código → HTML com uma `span.line` por linha (o número da linha é desenhado
    pelo CSS via counter — nunca é texto, então copiar o bloco copia só código). */
export function realcar(codigo: string, linguagem: string): string {
  const lang = CONHECIDAS.has(linguagem) ? linguagem : "text";
  return realcador.codeToHtml(codigo.replace(/\n$/, ""), {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });
}

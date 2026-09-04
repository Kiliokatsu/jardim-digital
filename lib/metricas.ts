import { readdir } from "node:fs/promises";
import path from "node:path";

/* A faixa de prova da home (espec §6.1) exige número REAL, nunca chumbado.
   "Decisões documentadas" é contável no próprio repositório: os arquivos
   NNNN-*.md de decisoes/, menos o modelo. A contagem roda no BUILD (a home
   é estática), então o diretório sempre existe; se um dia a página virar
   dinâmica em serverless e o diretório não for traçado, degrada pra zero
   em vez de derrubar a home — mesmo contrato das consultas. */

export async function contarDecisoes(): Promise<number> {
  try {
    const arquivos = await readdir(path.join(process.cwd(), "decisoes"));
    return arquivos.filter(
      (a) => /^\d{4}-/.test(a) && a.endsWith(".md") && a !== "0000-modelo.md",
    ).length;
  } catch {
    return 0;
  }
}

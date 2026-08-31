/* O quadro Ganhei/Perdi — a assinatura do blog (espec v2 §5).

   A sintaxe no markdown é uma cerca de código com linguagem própria:

   ```ganhei-perdi
   + entregabilidade de 99% no primeiro mês
   + painel de métricas que o Resend cobrava à parte
   - perdi o SDK tipado; agora é REST na mão
   ```

   Cerca de código foi escolhida porque o react-markdown já a entrega
   inteira num nó só, sem plugin novo (a doutrina: nada entra que o dono
   não defenda). Linha com "+" cai na coluna do ganho, "-" na da perda;
   qualquer outra linha é ignorada de propósito — formato estrito quebra
   visível, formato tolerante quebra em silêncio.

   O verde daqui é a ÚNICA aparição do verde no site (espec §3.3):
   semântico, nunca decorativo. */

type Colunas = { ganhos: string[]; perdas: string[] };

function separa(texto: string): Colunas {
  const ganhos: string[] = [];
  const perdas: string[] = [];
  for (const linha of texto.split("\n")) {
    const limpa = linha.trim();
    if (limpa.startsWith("+ ")) ganhos.push(limpa.slice(2));
    if (limpa.startsWith("- ")) perdas.push(limpa.slice(2));
  }
  return { ganhos, perdas };
}

export function GanheiPerdi({ texto }: { texto: string }) {
  const { ganhos, perdas } = separa(texto);
  if (ganhos.length === 0 && perdas.length === 0) return null;

  return (
    <div className="ganhei-perdi" role="group" aria-label="O que eu ganhei e o que eu perdi">
      <div className="gp-coluna gp-ganhei">
        <p className="gp-titulo">Ganhei</p>
        <ul>
          {ganhos.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </div>
      <div className="gp-coluna gp-perdi">
        <p className="gp-titulo">Perdi</p>
        <ul>
          {perdas.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* Cabeça de seção: título, régua e contador. Vem do protótipo — a régua que
   atravessa a linha é o que dá a cara de documento técnico ao jardim. */

export function CabecaSecao({
  titulo, contador, nota,
}: {
  titulo: string;
  contador?: number;
  nota?: string;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-4">
        <h2 className="flex-none text-lg font-bold tracking-tight">{titulo}</h2>
        <div className="h-px flex-1 bg-linha" />
        {contador !== undefined && (
          <span className="flex-none font-mono text-sm text-suave">
            {String(contador).padStart(2, "0")}
          </span>
        )}
      </div>
      {nota && <p className="mt-2 max-w-2xl text-sm text-suave">{nota}</p>}
    </div>
  );
}

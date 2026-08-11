import Link from "next/link";
import type { Portal } from "@/lib/tipos";

/* Selos e pílulas. No schema v3 o post carrega menos metadado que antes
   (maturidade, gênero e autoria saíram — DEC-005: coluna só nasce quando a
   tela pede), então sobraram os dois que as telas aprovadas realmente usam. */

/** Pílula de etiqueta. Com `slug`, vira link para a página da etiqueta (DEC-018). */
export function Etiqueta({ slug, children }: { slug?: string; children: React.ReactNode }) {
  const classe =
    "etiq rounded-full border border-linha bg-superficie-2 px-2.5 py-0.5 font-mono text-[11px] text-suave";
  if (slug) {
    return (
      <Link href={`/tag/${slug}`} className={`${classe} transition-colors hover:border-acento/50 hover:text-tinta`}>
        {children}
      </Link>
    );
  }
  return <span className={classe}>{children}</span>;
}

/** Nome do portal em mono minúsculo, como nas telas aprovadas. */
export function SeloPortal({ portal }: { portal: Portal }) {
  return (
    <span data-campo="portal" className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-acento">
      {portal}
    </span>
  );
}

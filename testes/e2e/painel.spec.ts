import { expect, test } from "@playwright/test";

/* O console da fase 2 (DEC-0013).

   A suíte roda em modo demonstração (banco desligado de propósito —
   DEC-0009), então o que dá pra provar aqui é a casca: a rota existe fora
   do jardim, declara o estado certo, e nenhuma página pública aponta pra
   ela. O fluxo com login de verdade é verificação manual da DEC-0013 até
   o provider GitHub estar ligado. */

test.describe("painel (fase 2)", () => {
  test("a rota existe, fora do jardim e sem cabeçalho público", async ({ page }) => {
    await page.goto("/painel");

    await expect(page.getByRole("heading", { name: /painel/i })).toBeVisible();
    // sem o cabeçalho do jardim: console é console
    await expect(page.locator("header.topo")).toHaveCount(0);
  });

  test("sem banco configurado, o console diz isso com todas as letras", async ({ page }) => {
    await page.goto("/painel");

    await expect(page.getByText("modo demonstração", { exact: false })).toBeVisible();
    // e não oferece login que não funcionaria
    await expect(page.getByRole("button", { name: /GitHub/i })).toHaveCount(0);
  });

  test("a rota é invisível para buscadores", async ({ page }) => {
    await page.goto("/painel");
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute("content", /noindex/);
  });

  test("nenhuma página pública aponta para o painel", async ({ page }) => {
    for (const rota of ["/", "/tecnologia", "/profissional"]) {
      await page.goto(rota);
      await expect(page.locator('a[href*="/painel"]')).toHaveCount(0);
    }
  });
});

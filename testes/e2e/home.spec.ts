import { expect, test } from "@playwright/test";

/* Fluxo público nº 1: a home (DEC-0009).

   As asserções citam os dados de demonstração de `lib/dados-demo.ts` — a suíte
   sobe o servidor com o banco desligado, então este conteúdo é contrato, não
   chute. Se a primeira asserção daqui falhar mostrando outro conteúdo, o mais
   provável é que o modo demonstração NÃO ligou e o build enxergou o Supabase. */

test.describe("home", () => {
  test("apresenta o dono e os três portais", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 1, name: /cozinha pegando fogo/i }),
    ).toBeVisible();

    // os cartões-portal são a estrutura do site (DEC-001), não menu
    const portais = page.locator(".portal");
    await expect(portais).toHaveCount(3);
    await expect(portais.filter({ hasText: "Profissional" })).toBeVisible();
    await expect(portais.filter({ hasText: "Tecnologia" })).toBeVisible();
    await expect(portais.filter({ hasText: "Pessoal" })).toBeVisible();
  });

  test("lista os últimos registros com o mais recente em destaque", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Últimos registros" })).toBeVisible();
    // o mais recente da demonstração (2026-07-31) é o post do Brevo
    await expect(
      page.getByRole("link", { name: /Troquei o Resend pelo Brevo/i }),
    ).toBeVisible();
  });

  test("cartão-portal leva à página do portal", async ({ page }) => {
    await page.goto("/");

    await page.locator(".portal", { hasText: "Tecnologia" }).click();

    await expect(page).toHaveURL(/\/tecnologia$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // os dois posts de tecnologia da demonstração estão listados
    await expect(page.getByRole("link", { name: /Troquei o Resend pelo Brevo/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Apaguei a coluna errada/i })).toBeVisible();
  });
});

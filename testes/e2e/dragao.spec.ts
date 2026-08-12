import { expect, test } from "@playwright/test";

/* O dragão em chamas do modo caos (DEC-0010).

   Este arquivo existe por causa da DEC-0008: o dragão anterior (canvas)
   não renderizou em produção e ninguém percebeu antes do deploy. Sendo o
   novo dragão SVG/DOM, dá pra CONTAR os segmentos no build de produção —
   a regressão que derrubou o primeiro dragão agora falha um teste. */

const SEGMENTOS_ESPERADOS = 39; // 40 elos, o primeiro é invisível (âncora da cabeça)

async function ligarCaos(page: import("@playwright/test").Page) {
  await page
    .getByRole("group", { name: "Persona" })
    .getByRole("button", { name: "Caos" })
    .click();
}

test.describe("dragão do caos", () => {
  test("fora do caos, o dragão nem existe no DOM", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("svg.dragao")).toHaveCount(0);
  });

  test("com a persona caos, os 39 segmentos montam e se movem", async ({ page }) => {
    await page.goto("/");
    await ligarCaos(page);

    const dragao = page.locator("svg.dragao");
    await expect(dragao).toHaveCount(1);
    await expect(dragao.locator("use")).toHaveCount(SEGMENTOS_ESPERADOS);

    // a cabeça sai da posição de nascimento (fora da tela) — ou seja, o laço
    // de animação está de fato rodando, não só o SVG parado no DOM
    const cabeca = dragao.locator('use[data-i="1"]');
    await expect(cabeca).not.toHaveAttribute("transform", "translate(-1000 -1000)");
  });

  test("o dragão sobrevive à navegação e ao recarregamento", async ({ page }) => {
    await page.goto("/");
    await ligarCaos(page);

    await page.locator(".portal", { hasText: "Tecnologia" }).click();
    await expect(page).toHaveURL(/\/tecnologia$/);
    await expect(page.locator("svg.dragao")).toHaveCount(1);

    await page.reload();
    await expect(page.locator("svg.dragao")).toHaveCount(1);
  });

  test("quem pediu menos movimento não recebe dragão, nem no caos", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await ligarCaos(page);

    await expect(page.locator("html")).toHaveAttribute("data-persona", "caos");
    await expect(page.locator("svg.dragao")).toHaveCount(0);
  });

  test("o dragão não rouba clique do conteúdo embaixo dele", async ({ page }) => {
    await page.goto("/");
    await ligarCaos(page);

    // se o overlay capturasse pointer events, este clique falharia por
    // interceptação — o Playwright confere quem receberia o evento
    await page.locator(".portal", { hasText: "Pessoal" }).click();
    await expect(page).toHaveURL(/\/pessoal$/);
  });
});

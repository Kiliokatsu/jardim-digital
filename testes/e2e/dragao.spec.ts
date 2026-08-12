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

  test("com movimento reduzido, ligar o caos avisa que está contido (DEC-0011)", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await ligarCaos(page);

    const aviso = page.locator(".aviso-caos");
    await expect(aviso).toBeVisible();
    await expect(aviso).toContainText("Caos contido");

    await aviso.getByRole("button", { name: "entendi" }).click();
    await expect(aviso).toHaveCount(0);
  });

  test("voltar pro normal recolhe o aviso na hora", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await ligarCaos(page);
    await expect(page.locator(".aviso-caos")).toBeVisible();

    await page
      .getByRole("group", { name: "Persona" })
      .getByRole("button", { name: "Normal" })
      .click();

    // mensagem sobre o caos não sobrevive à saída do caos (achado da revisão)
    await expect(page.locator(".aviso-caos")).toHaveCount(0);
  });

  test("sem a preferência de menos movimento, ligar o caos não mostra aviso", async ({
    page,
  }) => {
    await page.goto("/");
    await ligarCaos(page);

    await expect(page.locator("svg.dragao")).toHaveCount(1);
    await expect(page.locator(".aviso-caos")).toHaveCount(0);
  });

  test("em janela menor, o dragão é proporcionalmente menor (DEC-0012)", async ({
    browser,
  }) => {
    /* a escala vive no transform da cabeça: `... scale(N)`. A tremulação da
       chama oscila N em ±6%, então a comparação usa folga bem maior que isso. */
    const escalaDaCabeca = async (larguraJanela: number, alturaJanela: number) => {
      const contexto = await browser.newContext({
        viewport: { width: larguraJanela, height: alturaJanela },
      });
      let transform = "";
      try {
        const page = await contexto.newPage();
        await page.goto("/");
        await ligarCaos(page);
        const cabeca = page.locator('svg.dragao use[data-i="1"]');
        await expect(cabeca).not.toHaveAttribute("transform", "translate(-1000 -1000)");
        transform = (await cabeca.getAttribute("transform")) ?? "";
      } finally {
        await contexto.close(); // também no caminho de falha da asserção
      }
      const escala = /scale\(([\d.]+)/.exec(transform);
      expect(escala, `transform sem scale legível: ${transform}`).not.toBeNull();
      return Number(escala![1]);
    };

    const grande = await escalaDaCabeca(1600, 1000);
    const pequena = await escalaDaCabeca(900, 600);

    expect(pequena).toBeLessThan(grande * 0.8);
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

import { expect, test } from "@playwright/test";

/* Fluxo público nº 3: as chaves de modo (DEC-0009).

   O contrato de atributos é a DEC-003-b: data-tema escuro|claro, data-persona
   normal|caos, data-engenheiro 0|1, sempre no <html>. A parte mais frágil — e
   por isso a mais testada — é a persistência: o script inline do layout tem
   que restaurar a escolha do localStorage ANTES da primeira pintura. */

const html = (page: import("@playwright/test").Page) => page.locator("html");

test.describe("chaves de modo", () => {
  test("o site nasce escuro, normal e sem instrumentação", async ({ page }) => {
    await page.goto("/");

    await expect(html(page)).toHaveAttribute("data-tema", "escuro");
    await expect(html(page)).toHaveAttribute("data-persona", "normal");
    await expect(html(page)).toHaveAttribute("data-engenheiro", "0");
  });

  test("trocar o tema muda o atributo e sobrevive ao recarregamento", async ({ page }) => {
    await page.goto("/");

    const chaveTema = page.getByRole("group", { name: "Tema" });
    await chaveTema.getByRole("button", { name: "Claro" }).click();

    await expect(html(page)).toHaveAttribute("data-tema", "claro");
    await expect(chaveTema.getByRole("button", { name: "Claro" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // a escolha mora no localStorage e o script inline restaura antes da pintura
    await page.reload();
    await expect(html(page)).toHaveAttribute("data-tema", "claro");
  });

  test("a persona caos liga pelo atributo e persiste", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("group", { name: "Persona" })
      .getByRole("button", { name: "Caos" })
      .click();

    await expect(html(page)).toHaveAttribute("data-persona", "caos");

    await page.reload();
    await expect(html(page)).toHaveAttribute("data-persona", "caos");
  });

  test("o Modo Engenheiro revela a instrumentação escondida", async ({ page }) => {
    await page.goto("/");

    // o bloco .so-engenheiro do rodapé existe no DOM mas não aparece
    const instrumentacao = page.locator("footer .so-engenheiro");
    await expect(instrumentacao).toBeHidden();

    await page
      .getByRole("group", { name: "Modo engenheiro" })
      .getByRole("button", { name: "Engenheiro" })
      .click();

    await expect(html(page)).toHaveAttribute("data-engenheiro", "1");
    await expect(instrumentacao).toBeVisible();
  });

  test("a preferência atravessa a navegação entre páginas", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("group", { name: "Tema" }).getByRole("button", { name: "Claro" }).click();
    await page.locator(".portal", { hasText: "Tecnologia" }).click();

    await expect(page).toHaveURL(/\/tecnologia$/);
    await expect(html(page)).toHaveAttribute("data-tema", "claro");
    await expect(
      page.getByRole("group", { name: "Tema" }).getByRole("button", { name: "Claro" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});

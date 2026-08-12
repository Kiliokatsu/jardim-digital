import { expect, test } from "@playwright/test";

/* Fluxo público nº 2: ler um registro (DEC-0009).

   O post de referência é o do Brevo — é o que exercita o template inteiro:
   índice lateral, janelinha de código com título de arquivo, etiquetas,
   aviso de indicação (tem_indicacao = true) e vizinho anterior. */

const SLUG = "/registro/troquei-resend-por-brevo";

test.describe("página de leitura", () => {
  test("renderiza o template completo do post", async ({ page }) => {
    await page.goto(SLUG);

    await expect(
      page.getByRole("heading", { level: 1, name: /Troquei o Resend pelo Brevo/i }),
    ).toBeVisible();

    // trilha de navegação de volta pro portal
    const trilha = page.getByRole("navigation", { name: "Trilha de navegação" });
    await expect(trilha.getByRole("link", { name: "Tecnologia" })).toBeVisible();

    // o corpo markdown virou seções de verdade
    await expect(page.getByRole("heading", { name: "O que doeu" })).toBeVisible();

    // a janelinha de código mostra o nome do arquivo (` ```typescript titulo=... `)
    await expect(page.getByText("lib/email.ts")).toBeVisible();

    // DEC-013: o boolean no dado vira a frase fixa do componente
    await expect(
      page.getByText("Os links de ferramentas neste post são de indicação."),
    ).toBeVisible();
  });

  test("vizinho anterior navega para o post publicado antes", async ({ page }) => {
    await page.goto(SLUG);

    const vizinhos = page.getByRole("navigation", { name: "Registros vizinhos" });
    await vizinhos.getByRole("link", { name: /Apaguei a coluna errada/i }).click();

    await expect(page).toHaveURL(/\/registro\/apaguei-a-coluna-errada$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /Apaguei a coluna errada/i }),
    ).toBeVisible();
  });

  test("etiqueta leva à página da tag com os posts que a carregam", async ({ page }) => {
    await page.goto(SLUG);

    await page.getByRole("link", { name: "Decisão técnica" }).click();

    await expect(page).toHaveURL(/\/tag\/decisao-tecnica$/);
    // os dois posts de tecnologia da demonstração carregam esta etiqueta
    await expect(page.getByRole("link", { name: /Troquei o Resend pelo Brevo/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Apaguei a coluna errada/i })).toBeVisible();
  });

  test("slug inexistente responde 404", async ({ page }) => {
    const resposta = await page.goto("/registro/isto-nao-existe");
    expect(resposta?.status()).toBe(404);
  });
});

import { defineConfig, devices } from "@playwright/test";

/* Suíte E2E dos fluxos públicos (DEC-0009).

   Roda contra o build de produção — é o artefato que o visitante recebe, não o
   servidor de desenvolvimento. As variáveis do Supabase entram VAZIAS de
   propósito: variável já definida no processo vence o `.env.local`, o
   `supabaseLigado` vira false e o site serve os dados de demonstração. É isso
   que deixa as asserções citarem título e slug exatos sem depender de rede
   nem do que o dono editou pelo Studio. */

const PORTA = 4321; // fora da 3000 pra não colidir com um `next dev` aberto

export default defineConfig({
  testDir: "./testes/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORTA}`,
    trace: "on-first-retry",
  },
  projects: [
    // Um navegador basta pra regressão funcional (DEC-0009); a matriz
    // Firefox/WebKit entra quando houver pergunta que só ela responde.
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORTA}`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: false, // um servidor reaproveitado poderia ter sido buildado COM banco
    timeout: 180_000, // inclui o next build
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    },
  },
});

---
numero: 0009
titulo: Playwright E2E contra o build de produção, em modo demonstração
data: 2026-08-12
estado: aceita
autor: claude
arquivos:
  - package.json
  - playwright.config.ts
  - testes/e2e/home.spec.ts
  - testes/e2e/leitura.spec.ts
  - testes/e2e/modos.spec.ts
---

# DEC-0009 — Playwright E2E contra o build de produção, em modo demonstração

## Contexto

O currículo declara "Playwright (testes E2E)" e o repositório não tem nenhum teste — é a
incoerência mais visível para quem abre o projeto depois de ler o PDF, e está anotada como
ponta solta no `CLAUDE.md` desde a reconstrução. Os fluxos públicos (home, leitura de post,
chaves de modo) hoje só são verificados no olho.

## Decisão

Adotar `@playwright/test` cobrindo os três fluxos públicos, rodando contra `next build +
next start` com as variáveis `NEXT_PUBLIC_*` do Supabase esvaziadas — o site cai no modo
demonstração e o teste vira determinístico, sem rede e sem tocar o banco real.

Quatro escolhas dentro dela:

1. **Produção, não `next dev`** — o visitante recebe o build; testar o servidor de
   desenvolvimento validaria um artefato que ninguém acessa.
2. **Modo demonstração forçado** — `webServer.env` zera as duas variáveis; como variável
   já presente no processo vence o `.env.local`, o `supabaseLigado` vira `false` e as
   consultas servem `dados-demo.ts`. Asserções podem citar título e slug exatos.
3. **Só Chromium por enquanto** — um navegador cobre a regressão funcional; matriz
   completa (Firefox/WebKit) é custo de máquina sem pergunta nova a responder hoje.
4. **Nomes na língua do repositório** — pasta `testes/e2e/`, script `npm run testar-site`,
   irmão do `testar-schema` que já existe.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Jest + Testing Library (testes de componente) | Não é o que o currículo afirma, e não exercita o que mais pode quebrar aqui: hidratação, o script inline que restaura os modos antes da primeira pintura, localStorage, navegação real |
| Cypress | Resolve o mesmo problema, mas é uma pergunta a mais na entrevista sem nenhuma resposta melhor — a linha do currículo diz Playwright |
| Testar contra o Supabase real | O conteúdo muda quando o dono edita pelo Studio, então o teste quebraria por edição legítima; exige segredo no ambiente de teste; depende de rede |
| Não fazer nada | A incoerência currículo × repositório continua sendo a primeira coisa que um avaliador técnico encontra |

## Consequências

**Fica mais fácil:** mexer no site sem medo — regressão nos fluxos públicos é pega por
comando, não por visita manual; e a linha do currículo passa a ter prova no repositório.

**Fica mais difícil:** o build de produção roda a cada execução da suíte (~meio minuto a
mais que apontar pro dev server); os dados de demonstração viram contrato — quem mudar
`dados-demo.ts` pode quebrar teste e precisa ajustar os dois juntos.

**Passamos a dever:** cobertura dos fluxos que ainda não existem (painel, login — fase 2)
e a decisão futura de rodar isso em CI no GitHub antes do merge.

## Como eu explico isso

> Eu testo o site do jeito que o visitante recebe: builda de verdade, sobe o servidor de
> produção e um navegador de verdade navega pelas páginas. Para o teste não depender do
> banco — que muda toda vez que eu publico algo — eu esvazio as variáveis do Supabase e o
> site cai no modo demonstração, que é um conteúdo fixo em código. Assim o teste falha
> quando EU quebro o site, nunca porque o conteúdo mudou.

## O que eu ainda não entendo

- A regra de precedência de variável de ambiente no Next (variável já definida no processo
  vence o `.env.local`) foi aceita da documentação, não lida no código do Next — o próprio
  teste comprova na prática (se o `.env.local` vencesse, a home mostraria o conteúdo do
  banco e as asserções de demo falhariam), mas eu não sei apontar a linha do Next que faz isso.
- O que exatamente o `next start` faz com ISR (`revalidate = 300`) sem o cache da Vercel —
  os testes não dependem de revalidação, mas eu não sei descrever a diferença de runtime.

## Se foi skill ou agente

Não se aplica — decisão minha (claude), revisada pelo dono na escolha do dia.

## Verificação

```bash
cd site
npm run testar-site
```

Todos os testes verdes; nenhum acesso de rede ao Supabase durante a suíte (as asserções
citam os dados de demonstração, que só aparecem com o banco desligado).

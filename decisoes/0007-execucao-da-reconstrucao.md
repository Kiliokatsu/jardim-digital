---
numero: 0007
titulo: "Execução da reconstrução: três camadas em paralelo, integradas num dia"
data: 2026-08-11
estado: aceita
autor: "agentes: camada-de-dados-v3, camada-visual-dragao (orquestração e integração: claude)"
arquivos:
  - (branch reconstrucao-kiliokatsu inteira)
---

# DEC-0007 — Execução da reconstrução

## Contexto

A DEC-0006 adotou o pacote dragão. Esta registra COMO a execução aconteceu e o que
cada parte produziu — porque o dono precisa saber o que foi delegado, e portanto o que
ele ainda precisa aprender.

## O que cada agente fez que o dono não teria feito sozinho (hoje)

**Agente de dados** — transcreveu o schema v3 para `supabase/migrations/` (com a PARTE
8, extensão local para a tela Profissional preservada: `foto_url`, `nivel`, `resumo`
de experiência, datas de formação), reescreveu a suíte `testar-schema` com 31 testes
que provam as garantias (o admin vê o próprio rascunho — DEC-022; o rascunho não vaza
pela etiqueta; GRANT revogado dá "permission denied", policy barrando dá zero linhas —
DEC-017 ao vivo), e reescreveu tipos/consultas/demo com degradação para modo
demonstração.

**Agente visual** — traduziu a direção A para os tokens do Tailwind preservando os
nomes que a Profissional usa, portou o dragão (canvas 2D, MutationObserver na persona,
zero quadro no modo normal, desligado sem cursor fino ou com reduced-motion), e
escreveu a camada caos disciplinada: intensidade sem tocar em posição (DEC-003-b).

**Integração (claude)** — layout com next/font + JSON-LD de Person (DEC-008), home e
página de post das telas aprovadas, janelinha com Shiki síncrono no servidor (número
de linha por CSS counter — copiar não arrasta número), fecho por posição
(`:last-child` — o autor não marca nada, DEC-027), aviso de indicação por boolean
(DEC-013), listagens, /tag/[slug] (DEC-018), Profissional preservada com fiação nova.

## O que saiu desta branch (e por quê)

Painel, fila e integrações (DEC-012: fase 2 — publicar é pelo Studio), grafo (a tabela
`conexoes` não existe no v3; relacionados saem de etiqueta em comum), proxy e clientes
de servidor do Supabase (sem painel, só a leitura anônima existe), `@supabase/ssr`
desinstalado, `EMAIL_DONO` removido do ambiente.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Um agente só, sequencial | As três camadas têm fronteiras naturais de arquivo; em série não fecharia no dia |
| Workflow com mais agentes (um por página) | Página compartilha contrato com layout e CSS; fatiar mais fino ia gerar retrabalho de integração maior que o ganho |

## Como eu explico isso

> Reconstruí o site em três camadas paralelas com contrato de arquivos explícito:
> dados (migrations + testes), visual (tokens + movimento) e páginas (integração). O
> que prova que funcionou não é o build passar — é a suíte de 31 testes do banco, o
> smoke test das páginas renderizadas e o preview da branch no ar sem derrubar a main.

## O que eu ainda não entendo

- O dragão foi portado fiel, mas ninguém mediu FPS na build React (o protótipo media
  56–60). Se o caos "pesar", a medição é o primeiro passo, não o ajuste.
- O Shiki síncrono carrega 6 linguagens no bundle do servidor; não medi o impacto no
  cold start da função. Na Vercel, se o TTFB do post subir, este é o suspeito.
- A DEC-004 (ambição de animação) segue aberta — a camada caos atual é a do protótipo,
  e o dono ainda vai coletar referências para decidir o nível final.

## Verificação

```bash
npm run testar-schema   # 31 passaram, 0 falharam
npm run build           # 18 páginas, TypeScript limpo
# smoke test em next start: home, post, profissional e tag 200, com todos os
# marcadores da anatomia presentes no HTML (janelinha, indicação, índice,
# vizinhos, dragão, JSON-LD, nome completo no rodapé)
```

---
numero: 0006
titulo: "Reconstrução Kiliokatsu nesta branch: adota o pacote prototipo-dragao como fonte de decisão"
data: 2026-08-11
estado: aceita
autor: claude
arquivos:
  - (branch reconstrucao-kiliokatsu inteira)
---

# DEC-0006 — Adoção do pacote dragão

## Contexto

O dono conduziu uma conversa longa de decisões (28 DECs, registradas em
`prototipo-dragao/entrega/Decisoes/00_Contexto_Vivo.md`) que redefine o site: marca
**Kiliokatsu** (DEC-008), domínio `kiliokatsu.com.br` (DEC-009), direção visual A
"Terminal Noturno" (DEC-024), home aprovada (DEC-007), anatomia de post aprovada
(DEC-013/026/027), modo caos como camada de movimento (DEC-003-b), schema v3 com
admins/etiquetas/perfil/Storage (DEC-015/018/019/020/021/023) e a regra editorial de
nunca citar empresa em post (DEC-025).

Mandato de hoje, nas palavras dele: reconstruir em branch nova, sem perguntar, com o
currículo **igual ao do site atual** ("isso eu realmente não quero mudar") — o que
resolve a pendência 7.1 do pacote — e mudando a anatomia dos posts e o funcionamento
dos modos.

## Decisão

1. **A numeração DEC do pacote (DEC-001..028) é lei neste repositório** tanto quanto as
   DECs locais (0001..). Conflito entre elas se resolve por DEC local nova, nunca por
   silêncio.
2. **Branch `reconstrucao-kiliokatsu`**, no mesmo repositório (DEC-016). A `main`
   continua servindo o site atual no domínio; o Vercel gera preview da branch. O merge
   só acontece quando os três portais tiverem conteúdo real (DEC-011) — não é hoje.
3. **Escopo desta branch (hoje):** rebrand completo (tokens da direção A, Inter +
   JetBrains Mono via `next/font`, JSON-LD de Person, rodapé com nome completo), home
   nova, página de post nova (coluna 68ch, janelinha de código com Shiki, aviso de
   indicação por `tem_indicacao`, fecho-pergunta), listagens por portal, página de
   etiqueta, modos tema claro/escuro × persona normal/caos (dragão em canvas) + Modo
   Engenheiro adaptado, schema v3 como migration + testes reescritos, seed sem nome de
   empresa.
4. **Página Profissional preservada** — mesma estrutura e conteúdo visual do site
   atual; só a fiação de dados muda para o schema v3.
5. **Fora desta branch, por decisão do pacote:** painel de administração e fila
   (DEC-012, fase 2 — publicar é pelo Studio), grafo de conexões (a tabela `conexoes`
   não existe no v3; "relacionados" saem de etiqueta em comum), FAQ/comentários
   (DEC-010/028), agente redator. O painel construído na `main` não é apagado do
   projeto — fica na `main`, e volta ao debate na fase 2 adaptado ao v3.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Reescrever o app do zero em pasta nova | O pacote manda ignorar o código antigo "por inércia", mas manter repo/scaffolding é exatamente o que a DEC-016 chama de ativo. Recriar Next+Tailwind+testes do zero hoje só queimaria o prazo |
| Adaptar o painel ao v3 nesta branch | Contraria DEC-005/012 ("painel antes de site público é como projeto de uma pessoa morre") e dobraria o escopo do dia |
| Manter o schema atual e só re-estilizar | O schema atual não tem etiquetas relacionais, admins por uid, nem as colunas de capa — as telas aprovadas dependem do v3. Re-estilizar sem o v3 seria fachada |

## Consequências

**Fica mais fácil:** o merge futuro é um só, e o preview da branch permite validar o
site novo no ar sem derrubar o atual.

**Fica mais difícil:** até o merge, existem dois sites no repositório; correção na
`main` precisa ser espelhada aqui se tocar em algo compartilhado.

**Passamos a dever:** os 6–8 posts reais da DEC-011 (gargalo declarado: escrita), a
aplicação do schema v3 no Supabase real (SQL Editor — sem credencial local, o agente
não tem como aplicar), e as pendências do pacote (PDFs de certificados conferidos
antes de upload, OG gerada do título, atualização do `02_Tom_de_Voz.md` pela DEC-025).

## Como eu explico isso

> O site novo nasceu de 28 decisões registradas, não de um redesign de gosto. Eu
> reconstruí em branch separada para a produção nunca cair, adotei o schema v3 que já
> tinha sido validado num Postgres real, e o merge para a main só acontece quando os
> portais tiverem conteúdo — porque site de portfólio vazio pesa contra.

## O que eu ainda não entendo

- Se a integração Supabase↔GitHub do dono está configurada para aplicar
  `supabase/migrations/` automaticamente no push da branch de produção — se estiver, o
  merge futuro aplica o v3 sozinho e o passo manual do SQL Editor cai.
- O comportamento do Modo Engenheiro sobre o v3 ainda é interpretação minha (contagens
  públicas por portal/etiqueta) — o pacote não o menciona; o dono citou o modo hoje.
  Se a leitura estiver errada, é ajuste de uma tela, não de arquitetura.

## Verificação

```bash
git branch --show-current      # reconstrucao-kiliokatsu
npm run testar-schema          # suíte v3 verde
npm run build                  # produção limpa
```

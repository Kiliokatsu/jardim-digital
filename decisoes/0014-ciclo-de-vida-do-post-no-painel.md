---
numero: 0014
titulo: "O ciclo de vida do post inteiro no painel: editar, publicar, agendar e despublicar são UPDATEs sob RLS"
data: 2026-08-13
estado: aceita
autor: claude
arquivos:
  - componentes/painel/ConsolePainel.tsx
  - componentes/painel/EditorPost.tsx
  - decisoes/INDICE.md
---

# DEC-0014 — O ciclo de vida do post inteiro no painel: editar, publicar, agendar e despublicar são UPDATEs sob RLS

## Contexto

A primeira entrega do painel (DEC-0013) parou na fila de rascunhos em leitura — validada
pelo dono com login real. Falta o que a DEC-012 promete: abrir o rascunho, editar o
texto, aprovar/agendar/publicar. O banco já decide tudo (`publicado_em` é o interruptor;
RLS de escrita exige `is_admin()`); falta a tela que opera o interruptor.

## Decisão

Completar o ciclo no próprio console: clicar num post abre o **editor** (campos de
texto + markdown em `textarea` pura), e publicar/agendar/despublicar são três formas de
um único gesto — **UPDATE em `publicado_em`** — direto do navegador, sob as POLICYs que
já existem. Nada de novo entra no servidor: a comunicação inteira é o cliente falando
com o PostgREST do Supabase, e quem diz "pode" é o Postgres.

Contornos:

1. **`textarea`, nunca editor rico.** O corpo é markdown que o site renderiza sem HTML
   cru (`react-markdown` sem `rehype-raw`). Editor WYSIWYG é exatamente o sink de XSS
   que a revisão de segurança da DEC-0013 mandou vigiar — não entra.
2. **Uma consulta, duas listas.** O admin lê todos os posts (POLICY própria); o console
   separa em memória: `publicado_em NULL` é fila, o resto é "no ar". Um caminho de
   código, sem estado duplicado.
3. **Agendar é preencher data futura.** O site público já ignora post com data futura
   (RLS pública: `publicado_em <= now()`), então agendamento não custa NADA de código
   novo no site — só um `datetime-local` no editor.
4. **Slug e etiquetas ficam para a próxima rodada.** Renomear slug de post publicado
   quebra URL (decisão com consequência própria), e etiquetas são M2M com tela própria.
   Campos desta rodada: título, resumo, corpo, portal, `tem_indicacao`, `publicado_em`.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Server Actions para as escritas | Reabriria a decisão da DEC-0013 (console client-side) sem ganho: a Action validaria no servidor o que a RLS já garante no banco — camada repetida, e o JWT do Supabase teria que viajar até ela |
| Editor rico (TipTap, Lexical…) | Dependência pesada fora da pilha e um sink de HTML em potencial em cima da sessão no localStorage — o aviso explícito da revisão de segurança anterior |
| Coluna de status (rascunho/aprovado/publicado) | O schema v3 decidiu que `publicado_em` É o status (NULL/futuro/passado) — coluna nova duplicaria a verdade e o site teria dois lugares para consultar |
| Publicar continuar só pelo Studio | É o estado atual; não fecha a DEC-012 e mantém o dono dependente de interface de banco para operação editorial |

## Consequências

**Fica mais fácil:** o ciclo editorial inteiro sem sair do site; o agendamento nasce de
graça; e o painel vira a demonstração viva de "controle de acesso por papéis" do currículo.

**Fica mais difícil:** o console cresce (dois componentes, estado de seleção); e editar
markdown sem preview exige confiar no site para conferir o resultado — preview é
candidato natural da próxima rodada, junto com slug e etiquetas.

**Passamos a dever:** preview do markdown no editor; edição de slug com regra própria;
tela de etiquetas; e o E2E autenticado (a suíte roda em modo demonstração — o ciclo com
login real é verificado por script vivo contra o banco, não pelo Playwright do CI).

## Como eu explico isso

> Publicar, agendar e despublicar no meu painel são o mesmo comando: um UPDATE numa
> coluna de data. Data vazia é rascunho, data futura é agendado, data passada é no ar —
> o site público filtra por essa regra dentro do banco, via RLS, então não existe
> caminho para um rascunho vazar. E o editor é um textarea de markdown de propósito:
> sem HTML cru, a superfície de XSS continua fechada.

## O que eu ainda não entendo

- O `datetime-local` do navegador devolve hora local sem fuso; eu converto para ISO
  antes do UPDATE e confio no `timestamptz` do Postgres para normalizar. Não conferi
  o comportamento em fuso diferente de Brasília — vale um teste quando houver leitor
  fora do Brasil.
- Se dois editores (eu e o agente redator, no futuro) atualizarem o mesmo post, vence o
  último UPDATE — não há trava otimista. Aceito para operação de uma pessoa; anotado
  para a era do agente.

## Se foi skill ou agente

Não se aplica — decisão minha (claude), executando o roteiro que o dono definiu.

## Verificação

```bash
cd site && npm run testar-site        # a suíte pública continua verde
node <script vivo>                    # usuário temporário: não-admin recusado,
                                      # admin edita/publica/despublica — e limpeza
```

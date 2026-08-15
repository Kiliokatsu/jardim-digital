---
numero: 0016
titulo: "As tabelas da automação: pautas, divulgacoes e a coluna formato — o contrato dos agentes vira schema"
data: 2026-08-15
estado: aceita
autor: claude
arquivos:
  - supabase/migrations/0003_automacao.sql
---

# DEC-0016 — As tabelas da automação: pautas, divulgacoes e a coluna formato

## Contexto

O fluxo da automação foi desenhado e corrigido com o dono (conversa de 2026-08-15): o
formulário de pauta no painel alimenta os agentes, o rascunho cai na fila, a aprovação
já existe (DEC-0014), o site publica sozinho (RLS + relógio), e um cron do n8n executa
as redes sociais. Serão três produções: artigo pro blog, post de LinkedIn levando ao
blog, e um modelo de Instagram a desenvolver. Falta o schema que sustenta isso.

## Decisão

Migration `0003_automacao.sql` com três peças:

1. **`posts.formato`** — enum por CHECK (`nota-curta` | `artigo-longo` |
   `tutorial-com-codigo` | `ensaio-com-imagens`), default `artigo-longo`. É o contrato
   que o redator obedece e que o site/painel poderão usar para renderizar e filtrar.
2. **`pautas`** — o pedido de geração: tema, portal, formato, referências, `status`
   (`aguardando`→`gerando`→`pronto`|`falhou`), `erro`, e `post_id` preenchido quando o
   rascunho nasce. O clique em "gerar" INSERE aqui antes de acordar o n8n: pauta não se
   perde se o executor estiver fora.
3. **`divulgacoes`** — a réplica nas redes: `post_id`, `rede` (`linkedin` | `instagram`),
   `texto`, `imagem_path` (o modelo do Instagram nascerá daqui), `agendado_para`,
   `postado_em` (o recibo), `url_publicacao`, `erro`. Índice parcial em
   `agendado_para where postado_em is null` — é exatamente a pergunta do cron
   ("vencidas e não postadas"), idempotente e sem esquecer atrasadas.

**RLS: nada disso é público.** As duas tabelas só aceitam admin (`is_admin()`, os dois
portões da DEC-020); `anon` não recebe nem SELECT. O n8n opera com a service key no
cofre dele (DEC-0015), que não passa por RLS.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Colunas de rede dentro de `posts` (`resumo_linkedin`…) | Incharia a tabela do site com ciclo de vida que não é dele; N redes × N colunas não escala |
| Enum nativo do Postgres em vez de CHECK | Alterar enum nativo exige comando próprio e trava transação; CHECK é alterável barato — e formatos VÃO mudar |
| Webhook direto sem tabela `pautas` | n8n caído = pauta perdida; sem status visível no painel; sem auditoria do que foi pedido |
| pg_cron dentro do Supabase para as redes | Rejeitado na DEC-0015 — o executor é o n8n; o banco guarda estado, não lógica de rede social |

## Consequências

**Fica mais fácil:** o formulário de pauta e a tela de divulgações do painel têm onde
morar; o cron das redes vira uma consulta de uma linha; e o modelo do Instagram nasce
com lugar (`imagem_path`) sem nova migration.

**Fica mais difícil:** três CHECKs para manter em dia quando formatos/redes crescerem;
e o painel ainda não tem telas para as tabelas novas (incrementos futuros).

**Passamos a dever:** as telas de pauta/divulgação no painel; incluir a 0003 no
`testar-schema` oficial (hoje validada por script avulso); e a DEC do fluxo n8n em si
quando a VPS subir.

## Como eu explico isso

> O pedido de conteúdo, o conteúdo e a divulgação são três tabelas com ciclos de vida
> próprios. A pauta guarda o que pedi e em que estado está; o post é o artigo; a
> divulgação é a réplica em cada rede, com agendamento e recibo próprios. O cron das
> redes pergunta "o que venceu e ainda não tem recibo?" — pode cair e voltar que não
> duplica nem esquece. E nada disso é visível ao público: RLS só de admin.

## O que eu ainda não entendo

- O modelo do Instagram (carrossel? card único? legenda?) ainda não existe — reservei
  `imagem_path` e `texto`, mas a DEC do formato Instagram pode exigir mais colunas.
- Se `pautas.status` deveria ter um estado `aprovada` entre `pronto` e a publicação —
  hoje a aprovação mora no post (`publicado_em`), e pode bastar. A prática dirá.

## Se foi skill ou agente

Não se aplica — decisão minha (claude), formalizando o desenho fechado com o dono.

## Verificação

```bash
cd site && node <script PGlite avulso>   # 0001 + 0003 rodam limpas no Postgres WASM
```

E no banco real: as duas tabelas existem, `anon` não lê nada delas, e o INSERT de
pauta por não-admin volta recusado.

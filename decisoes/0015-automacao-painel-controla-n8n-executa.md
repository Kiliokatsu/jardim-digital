---
numero: 0015
titulo: "Automação: o painel controla, o n8n executa, e segredo não mora em tabela"
data: 2026-08-13
estado: proposta
autor: claude
arquivos: []
---

# DEC-0015 — Automação: o painel controla, o n8n executa, e segredo não mora em tabela

## Contexto

O agendamento provou ao dono que o banco é a única verdade (`publicado_em <= now()`
recalculado a cada leitura — nada "posta" nada). O objetivo dele daqui pra frente: um
agente que escreve texto, gera imagem, alimenta o banco, publica no blog e replica em
LinkedIn/Instagram — com n8n auto-hospedado como motor, e o painel como o lugar onde ele
enxerga e comanda tudo, inclusive "cadastrar chaves de API". Esta DEC decide a fundação
ANTES de qualquer integração existir.

## Decisão (proposta — vira aceita quando o n8n subir)

Três papéis que não se misturam:

1. **O banco é o ponto de encontro, não o executor.** O agente redator ENTREGA fazendo
   `INSERT` de rascunho (`publicado_em` NULL) — a mesma fila que o painel já mostra.
   Publicação continua sendo decisão humana no painel. Nada que um agente escrever
   alcança o público sem passar pelo portão que já existe.
2. **O n8n executa e GUARDA OS SEGREDOS.** Chave de LinkedIn, Instagram, geração de
   imagem — tudo vive no cofre de credenciais do próprio n8n (criptografado, fora do
   alcance do PostgREST). O gatilho "publicou → replica nas redes" é um cron do n8n
   perguntando ao banco "o que entrou na janela pública desde a última checagem?".
3. **O painel controla por referência.** Quando chegar a hora, uma tabela `automacoes`
   guarda nome, ligada/desligada, última execução e log — e NUNCA a credencial; no
   máximo o NOME da credencial que está no cofre do n8n. Cadastrar a chave em si é
   operação no n8n, não no site.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Chaves de API em tabela do Supabase (o "cadastrar no painel" literal) | Qualquer falha de POLICY vira vazamento de credencial de terceiros; o Supabase Vault mitigaria, mas ainda concentra segredo de execução num sistema cuja função é conteúdo — o cofre certo é o do executor |
| pg_cron + triggers dentro do banco | Elegante, mas põe lógica de rede social dentro do Postgres — impossível de depurar visualmente, e o currículo declara n8n, não pg_cron |
| Webhook do Supabase como gatilho de publicação | Dispara no UPDATE (quando se agenda), não quando a data chega — serve para outras automações, não para "publicou → replica" |
| Agente com acesso direto de escrita publicada | Quebra a fila de aprovação, que é o controle editorial que protege a voz dele (DEC-012) |

## Consequências

**Fica mais fácil:** cada peça tem um cofre e um papel; o painel pode crescer para
mostrar status/logs sem nunca virar alvo; e a linha do currículo sobre n8n ganha lastro.

**Fica mais difícil:** duas superfícies de operação (painel + n8n) até a tela de
automações existir; e auto-hospedar n8n é infraestrutura nova que o dono decidiu
aprender antes de integrar.

**Passamos a dever:** a escolha de onde hospedar o n8n; a tabela `automacoes` e sua
tela; e o desenho do agente redator (o dono vai pesquisar repositórios).

## Como eu explico isso

> O banco é o ponto de encontro: agente entrega rascunho ali, eu aprovo ali, e a RLS
> decide o que é público. O n8n executa as integrações e guarda as chaves no cofre
> dele — o meu painel controla por referência: liga, desliga, vê log. Segredo de
> terceiro nunca encosta numa tabela minha.

## O que eu ainda não entendo

- O custo real de auto-hospedar n8n (VPS? Docker em casa?) e o que acontece com os
  crons quando essa máquina cai — é a primeira pergunta da fase de infraestrutura.
- As APIs de LinkedIn e Instagram têm regras de aprovação de app próprias e mutáveis;
  não valido nada aqui até o dono chegar nessa etapa.

## Se foi skill ou agente

Não se aplica — decisão minha (claude), formalizando a visão que o dono descreveu.

## Verificação

Quando o n8n subir: o primeiro fluxo (cron lendo posts publicados desde a última
checagem) roda com credencial guardada SÓ no n8n, e a tabela `automacoes` (se existir)
não contém nenhum segredo — auditável com um SELECT.

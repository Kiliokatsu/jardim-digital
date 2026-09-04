---
numero: 0017
titulo: Fechar a enumeração do balde de certificados no Storage
data: 2026-08-18
estado: aceita
autor: agente:database-reviewer
arquivos:
  - supabase/migrations/0004_storage_sem_enumeracao.sql
---

# DEC-0017 — Fechar a enumeração do balde de certificados no Storage

## Contexto

Com o repositório público, uma bancada de cinco agentes revisou o projeto inteiro. O
achado mais grave: a policy de leitura da migration 0002 cobre `capas` **e**
`certificados` para `anon`, o que permite a qualquer pessoa — com a anon key que já vai
no JavaScript do site — chamar `.storage.from('certificados').list()` e receber a lista
completa de nomes de arquivo. Isso anula a única defesa da DEC-023 ("nome não
adivinhável") e expõe inclusive certificados ainda não revisados, que podem conter CPF.

## Decisão

Separar a policy de leitura em duas: `capas` continua legível por qualquer um; a
listagem de `certificados` via API passa a exigir `is_admin()`.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Balde privado + link assinado (a proposta original da 0002, revertida pela DEC-023) | É a solução mais forte, mas muda o contrato da tela (exige função de servidor gerando URL temporária) e reverte uma DEC aceita. Fica registrada como evolução natural se a DEC-023 for revista. |
| Deixar como está | A proteção por nome não adivinhável vira teatro: o nome deixa de precisar ser adivinhado, basta pedir a lista. |
| Tirar os certificados do Storage | Joga fora a funcionalidade inteira para resolver um problema que uma policy resolve. |

## Consequências

**Fica mais fácil:** confiar no fluxo da DEC-023 — o link direto continua funcionando
(balde público serve o arquivo sem passar pela RLS de `storage.objects`), mas descobrir
nomes por listagem deixa de ser possível.

**Fica mais difícil:** nada no uso real. O site nunca chamou `.list()` (confirmado na
revisão); só o admin perde a listagem anônima que nunca usou.

**Passamos a dever:** a discussão de fundo da DEC-023 (endereço permanente indexável)
continua em aberto — esta DEC fecha a enumeração, não o link eterno.

## Como eu explico isso

> O balde é público por decisão, mas público quer dizer "quem tem o link lê", não "quem
> pede a lista recebe o índice". A policy antiga deixava listar; a nova separa: capa é
> vitrine, certificado só entrega pelo link que o site renderiza. Quem barra é o
> Postgres, na RLS do Storage.

## O que eu ainda não entendo

- Se o Google já indexou algum PDF de certificado no período em que a listagem esteve
  aberta — vale uma busca por `site:eqwlurwnxkekrfahwrmw.supabase.co` antes de dar o
  assunto por encerrado.

## Se foi skill ou agente

- **O que ela fez:** o agente database-reviewer identificou que a policy de SELECT em
  `storage.objects` derrubava a defesa da DEC-023 e propôs o SQL corretivo.
- **O que eu não teria feito sozinho:** ligar a policy de listagem à premissa de "nome
  não adivinhável" — a 0002 documentava a premissa e a policy a contradizia no mesmo
  arquivo, e ninguém tinha visto.
- **O que eu revisei antes de aceitar:** que o site não usa `.list()` em lugar nenhum e
  que o link direto de balde público não passa pela RLS de `storage.objects`.

## Verificação

Com a anon key, a listagem tem que voltar vazia; o link direto de um arquivo de capa
continua abrindo.

```bash
curl -s "https://<projeto>.supabase.co/storage/v1/object/list/certificados" \
  -H "apikey: <anon>" -H "Authorization: Bearer <anon>" \
  -X POST -H "Content-Type: application/json" -d '{"prefix":""}'
# esperado: [] (lista vazia), nunca os nomes dos arquivos
```

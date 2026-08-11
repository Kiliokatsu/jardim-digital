# Protocolo de Decisões (DEC)

Toda escolha técnica com consequência vira um arquivo aqui. **Inclusive — e principalmente
— quando quem executou foi uma skill ou um agente.**

## Por que isso existe

Três razões, em ordem de importância:

**1. Para você conseguir defender o site.** A doutrina do projeto é que nada entra que o
dono não saiba explicar. Um DEC é o roteiro dessa explicação, escrito no momento em que a
decisão foi tomada — quando as alternativas ainda estavam na mesa.

**2. Para você aprender, não só receber.** Quando um agente escreve código, o resultado
chega pronto e o raciocínio se perde. O DEC força o raciocínio a virar texto: por que
*isto* e não *aquilo*. É a diferença entre ter código funcionando e entender por que ele
funciona assim.

**3. Porque o currículo afirma isso.** A linha *"processo de especificação por decisões
arquiteturais documentadas (DEC) que alimentam PRDs"* precisa de lastro. Esta pasta é o
lastro, pública no repositório.

## Quando um DEC é obrigatório

- Escolha entre alternativas com troca real — biblioteca, padrão, estrutura de pastas
- Qualquer coisa que entre ou saia do `package.json`
- Qualquer garantia que vá para o banco — schema, RLS, trigger, constraint
- **Qualquer alteração feita por skill ou agente**, sem exceção
- Mudança cara de reverter depois — modelagem de dados, contrato de API, rota pública
- Escolha que você não saberia explicar hoje numa entrevista

## Quando NÃO é

Correção de digitação, formatação, renomear variável local, ajuste de texto de conteúdo,
`npm install` de algo já decidido em DEC anterior. **Protocolo que documenta tudo vira
ruído, e ruído ninguém lê.** Na dúvida, pergunte: "isso teve alternativa?" Se não teve,
não é decisão — é execução.

## Como escrever

1. Copie `0000-modelo.md` para `NNNN-slug.md`, com o próximo número livre
2. Preencha **antes** de executar, não depois. DEC escrito depois vira justificativa, não
   decisão — e justificativa é sempre favorável ao que já foi feito
3. Anote no `INDICE.md`

## As duas seções que não podem ser puladas

**"Alternativas consideradas"** — mínimo de duas, com o motivo real da rejeição. Alternativa
descartada sem motivo escrito significa que não houve decisão, houve reflexo. Se você não
consegue nomear duas opções, você ainda não entendeu o problema.

**"Como eu explico isso"** — escrito na sua voz, como você diria em voz alta. Se você não
consegue escrever essas três frases, o DEC não está pronto — e a decisão provavelmente
também não.

## O campo `autor`

Diz quem decidiu de fato:

| Valor | Significa |
|---|---|
| `humano` | Você decidiu |
| `claude` | Eu decidi e você revisou |
| `skill:<nome>` | Uma skill produziu o resultado |
| `agente:<nome>` | Um subagente produziu o resultado |

Quando for `skill:` ou `agente:`, o DEC precisa dizer **o que a skill fez que você não
teria feito sozinho**. É o registro mais valioso da pasta: é ali que fica visível o que
você está delegando — e portanto o que você ainda precisa aprender.

## Estado

`proposta` → em discussão · `aceita` → valendo · `substituída por NNNN` → decisão nova
tomou o lugar

**Nunca apague um DEC.** Decisão revertida é aprendizado; marque como substituída e link
para a nova. O histórico de erros é a parte mais honesta do repositório.

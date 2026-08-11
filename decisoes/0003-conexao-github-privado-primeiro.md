---
numero: 0003
titulo: Conectar ao GitHub como repositório privado primeiro, público só após revisão
data: 2026-08-11
estado: aceita
autor: claude
arquivos:
  - .env.local.example
---

# DEC-0003 — Conexão com o GitHub

## Contexto

O `site/` já era um repositório git local (1 commit limpo do Create Next App, hook de
pre-commit da DEC-0002 ativo), mas sem remote. O objetivo é subir o primeiro conteúdo
para o GitHub sem vazar nada — e o repositório vai acabar público, porque recrutador
olha repositório.

O ponto crítico: **o `site/` mora dentro do vault `Jardim_Digital`**, que contém
`Carreira/`, `Identidade_e_Voz/` e `Registro/` — material pessoal que jamais pode ir
para o GitHub. E a varredura pré-conexão encontrou um vazamento real: o
`.env.local.example` (que entra no repositório por exceção deliberada do `.gitignore`)
tinha o e-mail corporativo da Artemec preenchido como valor default. Foi trocado por
campo vazio antes desta conexão.

Também foi verificado que a identidade do git (`user.email`) é o e-mail pessoal, não o
da Artemec — o e-mail do autor fica gravado em cada commit e aparece no histórico
público para sempre.

## Decisão

1. Renomear a branch `master` → `main` (padrão atual do GitHub e do Vercel).
2. Criar o repositório **privado** `Kiliokatsu/jardim-digital` com `gh repo create`,
   apontando o remote `origin` para ele, e fazer o primeiro push.
3. O primeiro commit real leva apenas a camada de segurança e de decisões: `.gitignore`
   endurecido, hook de pre-commit, protocolo de decisões e o `.env.local.example`
   corrigido. O código do site sobe depois, commit a commit, passando pelo hook.
4. Tornar público é um passo **manual e separado**, feito pelo dono no GitHub depois de
   revisar o conteúdo — e nesse momento o secret scanning com push protection do GitHub
   fica disponível de graça (em repositório privado é recurso pago).

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Criar já público | Revisão depois do push é tarde — mesmo argumento da DEC-0002 sobre varredura só no CI. Privado→público é um clique; público→privado não desfaz um clone que alguém já fez |
| Subir o vault inteiro num repo privado | Mistura material pessoal (currículo, identidade, registros) com o que é prova pública. Um "make public" errado, ou um vazamento de conta, exporia tudo de uma vez. O `site/` é a única fronteira segura |
| Outro host (GitLab, Codeberg) | O currículo declara "Git/GitHub com fluxo por release" e o recrutador procura perfil no GitHub. Trocar de host não comprova nada e quebra a coerência currículo→site→código |

## Consequências

**Fica mais fácil:** errar sem consequência enquanto privado. Todo o período de
construção acontece com o repositório invisível; só o resultado revisado vira público.

**Fica mais difícil:** lembrar de tornar público. Repositório privado não comprova nada
para recrutador — a conexão só cumpre o propósito quando o passo manual for dado.

**Passamos a dever:** a revisão final antes do flip para público (conferir histórico,
nomes, e-mails) e a decisão de quando isso acontece. E vale a regra permanente: **nunca
rodar `git init` na raiz do vault** — a fronteira do que é versionável é `site/`.

## Como eu explico isso

> Eu não conectei o vault inteiro — só o diretório do site, que é a fronteira do que
> pode ser público. Subi primeiro como repositório privado, com o hook de pre-commit já
> ativo, e antes disso varri o conteúdo procurando padrão de chave e dado pessoal — e
> achei um: meu e-mail corporativo num arquivo de exemplo. Corrigi antes do primeiro
> push. Tornar público é decisão separada, que eu tomo depois de revisar o histórico,
> porque clone de repositório público não tem undo.

## O que eu ainda não entendo

- Se o flip privado→público preserva stars/watchers e como o Vercel reage (o import do
  Vercel funciona com repo privado via GitHub App, mas isso ainda não foi testado aqui)
- O secret scanning do GitHub em conta gratuita: em público há push protection de graça,
  mas quais padrões exatamente ele cobre além dos que o hook local já pega
- Como remover um segredo do histórico se ele passar pelas duas camadas (mesma dívida
  registrada na DEC-0002 — `git filter-repo` e rotação de chave seguem não aprendidos)

## Verificação

```bash
git -C site branch --show-current          # -> main
git -C site remote -v                      # -> origin https://github.com/Kiliokatsu/jardim-digital
gh repo view Kiliokatsu/jardim-digital --json visibility  # -> PRIVATE
git -C site log --oneline                  # histórico sem segredo, autor com e-mail pessoal
```

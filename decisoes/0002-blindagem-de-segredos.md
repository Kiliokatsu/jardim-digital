---
numero: 0002
titulo: Blindar segredos com hook de pre-commit versionado, não só .gitignore
data: 2026-08-10
estado: aceita
autor: claude
arquivos:
  - .gitignore
  - .githooks/pre-commit
  - scripts/preparar-hooks.mjs
  - package.json
---

# DEC-0002 — Blindagem de segredos

## Contexto

O repositório vai ser público, e recrutador olha repositório. Chave vazada no histórico do
Git é eliminatória — e reescrever histórico depois é muito pior do que impedir na hora.

Dois furos concretos foram encontrados antes de qualquer commit:

1. **O `.gitignore` engolia a própria documentação.** A regra `.env*` também casava com
   `.env.local.example`, então o mapa de variáveis nunca chegaria ao GitHub. O `README`
   mandava rodar `cp .env.local.example .env.local`, e num clone esse arquivo não existiria.
2. **O `.gitignore` não protege chave colada dentro de arquivo legítimo.** O caso real não é
   commitar o `.env` por engano — é colar a `service_role` key num `.ts` "só para testar" e
   esquecer.

## Decisão

Adicionar `!.env.local.example` ao `.gitignore` e criar um hook de pre-commit versionado em
`.githooks/`, ativado por `core.hooksPath` através do script `prepare` do npm.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Só o `.gitignore` | Protege arquivo esquecido, não protege valor colado dentro de arquivo legítimo — que é o caso mais provável |
| husky | Faz o mesmo com uma dependência a mais para instalar, manter e explicar. `core.hooksPath` é nativo do git desde a 2.9 |
| gitleaks / trufflehog | Mais completos, mas exigem binário externo instalado em cada máquina. Peso alto para um repositório de uma pessoa só |
| Hook em `.git/hooks/` direto | Não é versionado. Some no próximo clone, e é justamente no clone novo que se esquece |
| Varredura só no CI | Detecta depois do push. Tarde demais: o segredo já está no GitHub |

## Consequências

**Fica mais fácil:** commitar sem medo. A proteção é automática e roda antes de o segredo sair
da máquina.

**Fica mais difícil:** o hook pode dar falso positivo — uma string longa aleatória pode parecer
token. A saída é `--no-verify`, e usá-la é decisão consciente, não acidente.

**Passamos a dever:** o hook cobre padrões conhecidos (JWT do Supabase, tokens do GitHub,
chave privada, URL de banco com senha, variável de segredo preenchida). **Não é análise
semântica** — um segredo em formato que não previmos passa. É rede de segurança, não garantia.

## Como eu explico isso

> Eu tenho duas camadas. O `.gitignore` mantém os arquivos de ambiente fora do repositório, e
> um hook de pre-commit versionado inspeciona as linhas adicionadas em cada commit procurando
> padrão de chave — JWT do Supabase, token do GitHub, chave privada. Usei `core.hooksPath`
> em vez de husky porque é recurso nativo do git e não adiciona dependência. E testei o hook
> atacando ele: tentei commitar um `.env`, um JWT dentro de um `.ts` e um token do GitHub, e
> os três foram barrados.

## O que eu ainda não entendo

- Não sei o que acontece se alguém clonar e nunca rodar `npm install` — o `prepare` não roda,
  o hook não é ativado, e a proteção não existe naquela máquina. Para um projeto de uma
  pessoa é aceitável; para um time, não seria
- Não sei escrever as expressões regulares do hook do zero. Consigo ler e explicar cada uma,
  mas ainda não as escreveria sozinho
- Não sei ainda como remover um segredo que já entrou no histórico (`git filter-repo`,
  rotação de chave). Vale aprender **antes** de precisar

## Verificação

Testado nos dois sentidos — bloqueio e falso positivo:

```bash
npm run preparar
git config core.hooksPath          # -> .githooks

# barrados (verificado):
#   .env.local commitado           -> BLOQUEADO: arquivo de ambiente
#   JWT eyJ... dentro de um .ts    -> BLOQUEADO: chave JWT do Supabase
#   ghp_... dentro de um .ts       -> BLOQUEADO: token do GitHub
# passou (verificado):
#   .env.local.example             -> commit normal, sem bloqueio
```

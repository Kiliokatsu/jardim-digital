---
numero: 0001
titulo: Adotar o ECC como camada de skills e agentes, instalado por módulo
data: 2026-08-10
estado: aceita
autor: humano
arquivos:
  - ../../.claude/
  - ../../ECC-main/
---

# DEC-0001 — Adotar o ECC como camada de skills e agentes

## Contexto

O trabalho no site vinha sendo feito sem camada de apoio: cada revisão de código, cada
verificação de segurança e cada padrão de teste saía do zero. O ECC
([affaan-m/ECC](https://github.com/affaan-m/ECC), MIT, v2.2.0) oferece 284 skills, 67
agentes e 94 comandos prontos.

Antes de decidir, o repositório passou por auditoria de segurança. Resultado: **sem
`postinstall`, sem ofuscação, sem injeção de prompt nos 2.509 arquivos Markdown, sem
caractere invisível, sem coleta de credencial, tráfego de rede restrito a `127.0.0.1`.**
Os únicos hosts suspeitos estavam em fixtures de teste do próprio scanner de IOC que o
projeto embarca. Três dependências de runtime, todas fixadas em versão exata.

A auditoria varreu por padrão os 3.454 arquivos e leu integralmente os que executam
sozinhos. **Não** leu as 284 skills uma a uma.

## Decisão

Instalar o ECC no escopo do projeto (`--target claude-project`, em `Jardim_Digital/.claude/`),
por módulos escolhidos — não pelo perfil `full`.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Instalar o perfil `full` | Traz Swift, machine learning, mercados de predição, cadeia de suprimentos e 9 idiomas de documentação. Nada disso serve ao projeto, e tudo isso disputa atenção do agente |
| Instalar global em `~/.claude/` | Afeta todo projeto da máquina. Escopo de projeto mantém a mudança visível, contida e reversível apagando uma pasta |
| Copiar só 13 skills à mão | Foi a recomendação inicial. Rejeitada pelo dono: perde os agentes e os comandos, que são metade do valor, e a curadoria manual vira trabalho sem fim |
| Não adotar nada | Mantém o problema original — cada verificação recomeça do zero, e a qualidade fica dependente de eu lembrar de fazer |

## Consequências

**Fica mais fácil:** revisão de código, varredura de segurança, padrão de teste e fluxo de
Git passam a ter procedimento pronto e repetível, em vez de depender de improviso.

**Fica mais difícil:** o contexto do agente fica mais disputado — mais skills significa mais
descrições concorrendo pela decisão de qual usar. E o `ECC-main/CLAUDE.md` é carregado
automaticamente quando se lê arquivo de dentro dele, competindo com a doutrina do site.

**Passamos a dever:**
1. Os 22 hooks foram instalados mas **não ativados** — o instalador grava `hooks.json` sem
   escrever `settings.json`. Ativar é decisão separada, e vai virar DEC próprio.
2. O `.mcp.json` do ECC configura `chrome-devtools-mcp@latest` via `npx -y`, com versão não
   fixada. Não foi adotado; se for, vira DEC próprio.
3. Atualização futura do ECC precisa de nova auditoria — esta vale para o snapshot atual.

## Como eu explico isso

> Eu uso uma biblioteca aberta de agentes e skills pra acelerar revisão e teste, mas não
> instalei o pacote inteiro — escolhi os módulos que batem com a minha pilha e deixei fora
> o que era de outras linguagens. Antes de instalar eu auditei o repositório: procurei
> script de pós-instalação, código ofuscado e injeção de prompt, e não achei. Os hooks
> automáticos eu deixei instalados mas desligados, porque quero entender o que cada um faz
> antes de deixar rodar em cima do meu código.

## O que eu ainda não entendo

- Não sei o que cada um dos 22 hooks faz individualmente. Sei os nomes e sei que 3 tocam
  rede, e só em `127.0.0.1`
- Não li as 284 skills. A auditoria foi por padrão, não por leitura integral
- Não sei ainda como o Claude Code resolve conflito quando duas skills se aplicam ao mesmo
  arquivo
- Não sei o custo em contexto de ter 284 skills instaladas — a descrição de cada uma pesa
  na hora de escolher

## Verificação

Instalação **pendente** — o comando foi bloqueado pelo classificador de permissões do
Claude Code e aguarda liberação do dono.

```bash
# executar de Jardim_Digital/
node ECC-main/scripts/install-apply.js --target claude-project \
  --modules rules-core,agents-core,commands-core,hooks-runtime,platform-configs,\
framework-language,database,workflow-quality,optimization-workflows,security,\
devops-infra,agentic-patterns,docs-pt-br

# conferir depois:
ls .claude/skills | wc -l      # deve crescer
ls .claude/agents | wc -l
cat .claude/settings.json      # deve NÃO existir, ou não conter hooks do ECC
```

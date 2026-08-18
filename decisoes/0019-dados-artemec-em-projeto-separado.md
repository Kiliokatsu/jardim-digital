---
numero: 0019
titulo: Dados da Artemec nunca moram no projeto Supabase do jardim
data: 2026-08-18
estado: proposta
autor: claude
arquivos:
  - (nenhum arquivo deste repositório — é decisão de infraestrutura)
---

# DEC-0019 — Dados da Artemec nunca moram no projeto Supabase do jardim

## Contexto

Existe a intenção de usar Supabase também para sistemas internos da Artemec. Dois
revisores independentes chegaram à mesma conclusão sobre coabitar esses dados no projeto
do jardim: aqui, o papel `authenticated` significa "qualquer conta do GitHub logou" — não
"pessoa da Artemec" —, e a anon key deste projeto está publicada no bundle de um site
público. Um único `GRANT` esquecido numa tabela futura da empresa a exporia ao mundo.

## Decisão

(Proposta — decisão é do dono.) Todo dado da Artemec — ArtemecOS, NR-13, qualquer coisa
da empresa — vive em projeto Supabase próprio, com realm de autenticação próprio. O
projeto do jardim nunca recebe tabela da empresa.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Mesmo projeto, schema separado fora do PostgREST + `REVOKE ALL` | Tecnicamente possível, mas exige que a segregação esteja certa em todo commit futuro, para sempre. O raio de explosão de um erro deixa de ser "vazou rascunho de post" e vira "vazou dado de segurança de vaso de pressão". |
| Mesmo projeto, "RLS bem feita resolve" | RLS não compensa compartilhar a mesma anon key pública e o mesmo login GitHub aberto entre site pessoal e sistema sigiloso de empresa. O erro não precisa ser provável — precisa ser impossível. |
| Não decidir agora | É exatamente o tipo de decisão barata hoje e caríssima depois: migrar dados de projeto com sistema em produção é ordem de grandeza pior que criar o projeto certo no dia zero. |

## Consequências

**Fica mais fácil:** dormir. Nenhuma migration futura do jardim consegue expor dado da
empresa, porque o dado não está lá.

**Fica mais difícil:** operar dois projetos (dois conjuntos de chave, dois dashboards).
No plano gratuito do Supabase há limite de projetos ativos — pode virar custo.

**Passamos a dever:** nenhuma.

## Como eu explico isso

> No projeto do meu site, "usuário autenticado" quer dizer qualquer pessoa com conta no
> GitHub — a autorização de verdade é a tabela de admins. Servidor de empresa não pode
> herdar esse modelo. Isolamento por projeto é a única fronteira que nenhum erro meu de
> SQL atravessa.

## O que eu ainda não entendo

- Qual o plano/custo do Supabase para o segundo projeto quando o da Artemec sair do
  papel, e se o volume da empresa cabe no plano que ela toparia pagar.

## Verificação

Estrutural: `git grep -i artemec supabase/` neste repositório continua devolvendo, no
máximo, a menção de currículo no seed — nunca uma tabela.

```bash
git grep -il artemec -- supabase/
```

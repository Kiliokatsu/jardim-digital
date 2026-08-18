---
numero: 0020
titulo: O project ref do Supabase é informação semi-pública — aceitar e registrar
data: 2026-08-18
estado: proposta
autor: claude
arquivos:
  - PLANO-DE-ACAO.md
  - decisoes/0013-painel-console-no-cliente.md
---

# DEC-0020 — O project ref do Supabase é informação semi-pública — aceitar e registrar

## Contexto

A varredura de sanitização apontou que o identificador real do projeto Supabase
(`eqwlurwnxkekrfahwrmw`) aparece em `PLANO-DE-ACAO.md` e na DEC-0013, agora públicos.
Não é segredo capturável — a mesma URL vai no JavaScript que todo visitante do site
baixa —, mas é informação de infraestrutura, e o protocolo do projeto pede que exposição
desse tipo seja decisão explícita, não acaso.

## Decisão

(Proposta — decisão é do dono.) Aceitar o project ref como informação semi-pública e não
redigir os documentos. A proteção do projeto não depende de esconder o endereço: depende
de RLS (DEC-0013, DEC-0017), de signup desabilitado no Auth e de a service key nunca
tocar o repositório (DEC-0002).

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Redigir para `<seu-projeto>.supabase.co` nos dois arquivos | O ref continua no histórico do git e no bundle do site — redigir só os documentos é maquiagem que ainda por cima quebra a honestidade do registro de decisões. |
| Migrar para um projeto novo com ref "limpo" | Custo real (migrar banco, storage, auth) para esconder algo que o próprio site republica no primeiro carregamento de página. |
| Aceitar sem registrar | Funciona igual, mas some a resposta para "você sabia que isso estava exposto?" — e a resposta certa é "sabia, e decidi assim porque a segurança não mora aí". |

## Consequências

**Fica mais fácil:** manter os documentos honestos e verificáveis (a DEC-0013 documenta
o callback OAuth real, que é parte da explicação).

**Fica mais difícil:** nada de novo — quem quer atacar o endpoint sempre pôde pegá-lo do
site. O ponto de atenção que fica: rate limit do Auth e signup desabilitado passam a ser
as defesas relevantes contra abuso direto do endpoint.

**Passamos a dever:** conferir no dashboard (e registrar aqui quando conferido): signup
desabilitado, exposed schemas só `public`/`storage`.

## Como eu explico isso

> O endereço do meu banco é público do mesmo jeito que o endereço de um prédio: qualquer
> visitante do site já o recebe. Segurança por esconder endereço não é segurança — o que
> tranca é a RLS em cada tabela e o cadastro fechado. Eu preferi registrar a exposição a
> fingir que ela não existe.

## O que eu ainda não entendo

- Qual é exatamente o rate limit do Auth no plano atual do Supabase e se ele basta contra
  tentativa de força bruta no endpoint de login com signup desabilitado.

## Verificação

No dashboard do Supabase: Authentication → Sign In / Up com signup desabilitado;
Settings → API com exposed schemas mínimos. Registrar a conferência nesta DEC ao aceitar.

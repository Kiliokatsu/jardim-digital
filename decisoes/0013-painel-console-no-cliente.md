---
numero: 0013
titulo: "Fase 2 começa: o painel é um console no cliente — sessão no navegador, segurança na RLS"
data: 2026-08-12
estado: aceita
autor: claude
arquivos:
  - lib/supabase/painel.ts
  - app/painel/layout.tsx
  - app/painel/page.tsx
  - componentes/painel/ConsolePainel.tsx
  - testes/e2e/painel.spec.ts
---

# DEC-0013 — Fase 2 começa: o painel é um console no cliente — sessão no navegador, segurança na RLS

## Contexto

A fase 2 (DEC-012 do pacote dragão) é a tela protegida onde o dono lê rascunho, edita,
aprova/agenda/publica e mantém o currículo. O banco já está pronto desde a reconstrução:
`admins` + `is_admin()` + os dois portões (GRANT amplo, POLICY estreita — DEC-020),
testados contra usuário autenticado não alistado. Falta decidir **como o Next carrega a
sessão** — e é uma escolha com consequência: cookie no servidor ou sessão no navegador.

## Decisão

O painel inteiro é um **console client-side** usando o `@supabase/supabase-js` que já
está no projeto: a sessão vive no navegador, o login é OAuth do GitHub
(`signInWithOAuth`), e **a única guarda que importa é a RLS** — a tela apenas informa o
estado; quem recusa escrita de não-admin é o banco, sempre.

Os contornos:

1. **Nenhuma dependência nova.** A alternativa oficial para sessão em Server Component
   (`@supabase/ssr`, cookies) é boa — mas o painel não precisa de nada que ela compra:
   não tem SEO, não tem ISR, não é público. Console de supervisão é, por natureza, uma
   aplicação no cliente.
2. **Cliente separado do público.** `lib/supabase/painel.ts` cria o cliente COM sessão
   persistida; o `publico.ts` continua sem sessão e sem cookie (o que preserva o cache
   das páginas públicas — decisão antiga que não se toca).
3. **Quatro estados na tela, um dono da verdade.** Sem banco configurado → aviso;
   deslogado → botão GitHub; logado mas não alistado → a frase da DEC-020 (autenticar
   não é autorizar); alistado → o console. O que decide entre os dois últimos é
   `rpc('is_admin')` — a mesma função que as POLICYs usam.
4. **`/painel` fora do jardim.** Grupo de rota próprio (sem cabeçalho/rodapé públicos,
   com a classe `.painel-raiz` que o CSS já reservava), `robots: noindex`, e nenhum
   link público apontando para lá.
5. **Nesta primeira entrega:** autenticação completa + fila de rascunhos (leitura).
   Editor, aprovação e currículo vêm nos próximos incrementos — cada um com sua DEC se
   houver decisão nova.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| `@supabase/ssr` (sessão em cookie, Server Components no painel) | Dependência nova comprando SEO/ISR/streaming que um console privado não usa; o cookie dela é legível por JS do mesmo jeito (o cliente precisa dele), então não há ganho real de segurança — e a doutrina manda: cada dependência a menos é uma pergunta a menos |
| NextAuth / Auth.js | Substituiria a autenticação do Supabase — o JWT que chega à RLS deixaria de ser o do Supabase e `is_admin()` (via `auth.uid()`) quebraria; seria trocar o diferencial do currículo (RLS) por uma biblioteca |
| Link mágico por e-mail em vez de GitHub | Reabriria a DEC-020, que já foi decidida e testada — GitHub + `admins` dá o mesmo fechamento com a conta que ele já usa |
| Continuar publicando pelo Studio (não fazer) | Não fecha o ciclo da DEC-012: o agente redator não tem para onde entregar e "aprovar antes de publicar" não existe |

## Consequências

**Fica mais fácil:** zero dependência nova; o painel demonstra na prática a linha mais
rara do currículo (autorização por papéis no banco); e o "logado porém recusado" é
demonstrável ao vivo numa entrevista.

**Fica mais difícil:** a sessão no navegador (localStorage) é superfície de XSS — o
mitigador real é o site não ter script de terceiro; um flash de "carregando" existe
antes da tela decidir o estado (console privado, custo aceito); e Server Actions ficam
de fora do painel (tudo é chamada do cliente com RLS).

**Passamos a dever:** o dono precisa criar o OAuth App no GitHub e ligar o provider no
Supabase (passo dele, documentado no fim desta DEC); depois do primeiro login, inserir o
próprio `user_id` em `admins` pelo Studio — a linha que autoriza (DEC-020).

## Como eu explico isso

> O painel é uma aplicação no cliente: o login é OAuth do GitHub via Supabase e a sessão
> fica no navegador. A tela mostra estados diferentes para visitante, autenticado e
> administrador — mas ela é só informativa: quem manda é a Row Level Security. Qualquer
> pessoa com GitHub consegue se autenticar; escrever, só quem está numa tabela `admins`
> que tem uma linha, inserida à mão por mim. Se alguém burlar a tela inteira, o INSERT
> volta recusado do banco — eu testei exatamente esse caminho.

## O que eu ainda não entendo

- ~~O fluxo implícito do OAuth devolve os tokens no fragmento da URL e eu não sei o que
  acontece se o usuário recarregar entre o redirect e a captura.~~ **Resolvida pela
  revisão de código, no mesmo dia:** o revisor rastreou a biblioteca e mostrou que o
  fluxo implícito ainda deixa o token numa entrada do histórico do navegador; trocamos
  para `flowType: "pkce"` — volta um código de uso único (não o token) e a URL é limpa
  com `replaceState`, sem entrada extra no histórico. A lacuna virou aprendizado.
- O custo real de `rpc('is_admin')` a cada montagem do console (uma chamada de rede a
  mais). Dá para guardar em memória da aba; não fiz porque otimizar antes de medir é o
  vício que este projeto tenta não ter.

## Se foi skill ou agente

Não se aplica — decisão minha (claude), sobre o desenho já fechado nas DEC-012/DEC-020
do pacote dragão.

## Verificação

```bash
cd site
npm run testar-site   # painel.spec.ts: estados sem banco e a rota fora do jardim
```

Manual (depois do provider GitHub ligado): entrar no `/painel`, logar com GitHub,
conferir o estado "não alistado"; inserir o `user_id` em `admins` pelo Studio; recarregar
e ver a fila de rascunhos.

---

## Anexo — o passo que é do dono (pré-requisito do login)

1. GitHub → Settings → Developer settings → **OAuth Apps** → New OAuth App.
   - Homepage: `https://kiliokatsu.com.br`
   - Callback: `https://eqwlurwnxkekrfahwrmw.supabase.co/auth/v1/callback`
2. Supabase → Authentication → Providers → **GitHub** → colar Client ID e Secret.
3. Supabase → Authentication → URL Configuration → adicionar as URLs do site
   (produção e previews da Vercel) em **Redirect URLs**.
4. Depois do primeiro login: Authentication → Users → copiar o `user_id` → Studio →
   inserir em `admins`. **Sem essa linha, nenhum login escreve nada — por design.**

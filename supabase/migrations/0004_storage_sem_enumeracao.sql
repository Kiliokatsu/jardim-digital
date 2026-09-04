-- =====================================================================
-- Migration 0004 — Storage sem enumeração  [DEC-0017]
--
-- Como a 0002, esta migration só roda no Supabase real: o PGlite do
-- `npm run testar-schema` não tem o schema `storage`.
--
-- O PROBLEMA QUE ELA FECHA: a policy de leitura da 0002 cobria os dois
-- baldes para `anon`. Leitura em `storage.objects` inclui LISTAR — e
-- listar o balde `certificados` entrega todos os nomes de arquivo,
-- anulando a defesa da DEC-023 ("nome não adivinhável") e expondo
-- inclusive PDF ainda não revisado, que pode carregar CPF.
--
-- A DISTINÇÃO QUE IMPORTA: balde público (0002) serve o ARQUIVO pelo
-- link direto sem consultar a RLS de `storage.objects`; a RLS governa a
-- API — listagem, busca, download autenticado. Ou seja: fechar o SELECT
-- de `certificados` para `anon` NÃO quebra o link que o site renderiza
-- quando `publico = true`. Quebra só a pergunta "me dá a lista", que
-- nenhum código deste site faz e nenhum visitante deveria poder fazer.
-- =====================================================================

drop policy "capas e certificados: qualquer um lê" on storage.objects;

-- capa é vitrine: continua legível por qualquer um (o robô do LinkedIn
-- que monta o card é `anon`).
create policy "capas: qualquer um lê"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'capas');

-- certificados: a API só responde ao admin. O visitante continua vendo
-- o PDF pelo link direto que a página renderiza — DEC-023 intacta,
-- enumeração fechada.
create policy "certificados: só admin lê via API"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'certificados' and is_admin());

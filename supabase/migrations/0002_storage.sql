-- =====================================================================
-- Migration 0002 — Storage (PARTE 3 do 04_Schema_v3.sql)
--
-- Separada da 0001 por um motivo prático: o teste local roda em PGlite
-- (Postgres em WASM), que não tem o schema `storage` do Supabase. Esta
-- migration só roda no Supabase de verdade. Os comentários originais
-- foram preservados na íntegra.
-- =====================================================================

-- =====================================================================
-- PARTE 3 — STORAGE  [DEC-019]
--
-- Storage é o serviço de arquivos do Supabase — o banco guarda texto, e
-- imagem/PDF ficam aqui. "Balde" (bucket) é uma pasta de nível superior
-- com regra de acesso própria.
--
-- A DESCOBERTA QUE MUDA O CUSTO DA SUA ESCOLHA: o Studio do Supabase já
-- tem tela de Storage com arrastar-e-soltar. Ou seja, você tem upload de
-- verdade HOJE, sem escrever uma linha de painel. O que eu tinha
-- previsto como "adianta o painel para antes do site" simplesmente não
-- acontece. A DEC-005 continua intacta.
-- =====================================================================

-- --- balde de capas: leitura pública -------------------------------
-- Capa é para ser vista, inclusive pelo robô do LinkedIn quando ele vai
-- montar o card. Público é o correto aqui.
insert into storage.buckets (id, name, public)
values ('capas', 'capas', true)
on conflict (id) do nothing;

-- --- balde de certificados: PRIVADO --------------------------------
-- ⚠ E aqui eu vou insistir: privado, mesmo você querendo que o visitante
-- clique e veja.
--
-- Balde público significa que o PDF fica indexável pelo Google, com
-- endereço fixo e permanente. Se um ano depois você tirar o certificado
-- da página, o arquivo continua acessível para quem tiver o link — e
-- indexado. Documento com o seu nome completo não deveria ter endereço
-- eterno na internet.
--
-- Balde privado + link assinado resolve os dois lados: o visitante
-- continua clicando e vendo (uma ação no servidor gera um link válido
-- por alguns minutos), e não existe endereço permanente para indexar,
-- vazar ou colar em outro site.
-- Custo: uma função de servidor. É a troca mais barata deste arquivo.
--
-- >>> DECIDIDO CONTRA (DEC-023): o balde vai ser PÚBLICO. <<<
-- Fica registrado o que essa escolha implica, porque é contraintuitivo:
-- com balde público, o arquivo é acessível NO MOMENTO EM QUE SOBE. A
-- coluna `publico` da tabela não protege o arquivo — ela só decide se o
-- LINK aparece na página.
--
--   ⚠ Logo: conferir o PDF é ANTES DO UPLOAD, não antes de marcar
--     publico = true. Nesta configuração, subir é publicar.
--
-- Duas regras que ficam valendo, e custam nada:
--   1. Nome de arquivo não adivinhável: "adapta-2025-a7f3c1.pdf", nunca
--      "adapta.pdf" — impede enumerar o balde por tentativa.
--   2. O link só é renderizado quando publico = true. Isso continua
--      valendo: o robô do Google só acha o que está linkado.
insert into storage.buckets (id, name, public)
values ('certificados', 'certificados', true)
on conflict (id) do nothing;

-- leitura pública só do balde de capas
create policy "capas e certificados: qualquer um lê"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('capas', 'certificados'));   -- DEC-023

-- escrita nos dois baldes: só administrador
create policy "capas: só admin escreve"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('capas','certificados') and is_admin());

create policy "capas: só admin apaga"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('capas','certificados') and is_admin());

-- (A policy de leitura acima já cobre os dois baldes — DEC-023.)

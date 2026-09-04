/**
 * Valida supabase/migrations/0001_reconstrucao_v3.sql e supabase/seed.sql
 * contra um Postgres de verdade (PGlite, o Postgres compilado pra WASM)
 * antes de colar qualquer coisa no Supabase de produção.
 *
 *   npm run testar-schema
 *
 * O objetivo não é só "o SQL roda sem erro de sintaxe". É provar as garantias
 * que o desenho promete e que a aplicação inteira assume como verdade:
 *
 *   1. Anônimo só lê post publicado — rascunho e post com data futura somem,
 *      inclusive pela porta lateral da etiqueta (posts_etiquetas).
 *   2. Autenticado não é autorizado (DEC-020): só quem está em `admins`
 *      escreve, e o admin VÊ o próprio rascunho (o bug da DEC-022).
 *   3. GRANT e POLICY são dois portões separados (DEC-017): revogar o GRANT
 *      vira "permission denied"; a policy barrando vira zero linhas (leitura)
 *      ou "row-level security" (escrita).
 *
 * Se um destes testes passar a falhar depois de você mexer no schema, é porque
 * uma garantia caiu — não porque o teste está chato.
 *
 * A migration 0002 (Storage) NÃO roda aqui: o PGlite não tem o schema
 * `storage` do Supabase. Ela só é validada no ambiente real.
 */

import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const VERDE = "\x1b[32m";
const VERMELHO = "\x1b[31m";
const CINZA = "\x1b[90m";
const FIM = "\x1b[0m";

let passaram = 0;
let falharam = 0;

async function ok(nome, fn) {
  try {
    await fn();
    console.log(`${VERDE}✓${FIM} ${nome}`);
    passaram++;
  } catch (e) {
    console.log(`${VERMELHO}✗${FIM} ${nome}`);
    console.log(`  ${VERMELHO}${e.message}${FIM}`);
    falharam++;
  }
}

/** Espera que a operação seja RECUSADA pelo banco. Falha se ela passar. */
async function recusa(nome, fn, trechoEsperado) {
  try {
    await fn();
    throw new Error("a operação foi ACEITA, e devia ter sido recusada pelo banco");
  } catch (e) {
    const msg = e.message ?? "";
    if (msg.includes("devia ter sido recusada")) {
      console.log(`${VERMELHO}✗${FIM} ${nome}`);
      console.log(`  ${VERMELHO}${msg}${FIM}`);
      falharam++;
      return;
    }
    if (trechoEsperado && !msg.toLowerCase().includes(trechoEsperado.toLowerCase())) {
      console.log(`${VERMELHO}✗${FIM} ${nome}`);
      console.log(`  ${VERMELHO}recusou, mas por outro motivo: ${msg}${FIM}`);
      falharam++;
      return;
    }
    console.log(`${VERDE}✓${FIM} ${nome} ${CINZA}(recusado: ${msg.split("\n")[0].slice(0, 70)})${FIM}`);
    passaram++;
  }
}

function igual(obtido, esperado, oQue) {
  if (obtido !== esperado) {
    throw new Error(`${oQue}: esperava ${JSON.stringify(esperado)}, veio ${JSON.stringify(obtido)}`);
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Stub do que o Supabase põe no banco e o Postgres cru não tem:
   - os papéis anon e authenticated (a migration faz GRANT pra eles);
   - o schema auth com auth.uid(), que is_admin() consulta pra saber quem
     está pedindo. No Supabase o uid vem do token da requisição; aqui é uma
     variável de sessão, pra que o teste possa "virar" admin, virar um
     autenticado qualquer e voltar a ser anônimo à vontade.
   Uma auth.users mínima não é necessária: admins.user_id é uuid sem FK.
   ───────────────────────────────────────────────────────────────────────── */
const STUB_SUPABASE = `
do $$ begin
  create role anon nologin;
exception when duplicate_object then null; end $$;

do $$ begin
  create role authenticated nologin;
exception when duplicate_object then null; end $$;

grant usage on schema public to anon, authenticated;

create schema if not exists auth;

create or replace function auth.uid() returns uuid
  language sql stable as $$
    select nullif(current_setting('teste.uid', true), '')::uuid;
  $$;
`;

const ADMIN_UID = "11111111-1111-4111-8111-111111111111";
const ESTRANHO_UID = "22222222-2222-4222-8222-222222222222";

const db = new PGlite();

/** Roda fn como um papel do Supabase, com o uid dado (null = sem sessão). */
async function como(papel, uid, fn) {
  await db.query("select set_config('teste.uid', $1, false)", [uid ?? ""]);
  await db.exec(`set role ${papel}`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}

console.log(`\n${CINZA}Postgres em WASM (PGlite) — validando as migrations antes do Supabase${FIM}\n`);

/* ─────────────────────────── 1. o SQL roda ─────────────────────────── */

await ok("stub do Supabase aplica (papéis anon/authenticated + auth.uid())", async () => {
  await db.exec(STUB_SUPABASE);
});

await ok("migration 0001 roda inteira, sem erro", async () => {
  const sql = await readFile(
    new URL("../supabase/migrations/0001_reconstrucao_v3.sql", import.meta.url),
    "utf8",
  );
  // O PGlite não embute a extensão pgcrypto. Não faz falta no teste:
  // gen_random_uuid() é nativo do Postgres desde a versão 13.
  const semPgcrypto = sql.replace(
    "create extension if not exists pgcrypto;",
    "-- (pgcrypto pulado no teste: PGlite não embute a extensão)",
  );
  await db.exec(semPgcrypto);
});

await ok("migration 0003 roda inteira, sem erro", async () => {
  const sql = await readFile(
    new URL("../supabase/migrations/0003_automacao.sql", import.meta.url),
    "utf8",
  );
  await db.exec(sql);
});

// a 0004 (Storage) não roda aqui — mesma razão da 0002: PGlite não tem
// o schema `storage` do Supabase. Ela é validada no ambiente real.

await ok("migration 0005 roda inteira, sem erro", async () => {
  const sql = await readFile(
    new URL("../supabase/migrations/0005_projetos.sql", import.meta.url),
    "utf8",
  );
  await db.exec(sql);
});

await ok("seed.sql roda inteiro, sem erro", async () => {
  const sql = await readFile(new URL("../supabase/seed.sql", import.meta.url), "utf8");
  await db.exec(sql);
});

await ok("seed.sql é idempotente (roda duas vezes sem duplicar)", async () => {
  const sql = await readFile(new URL("../supabase/seed.sql", import.meta.url), "utf8");
  await db.exec(sql);
  const posts = await db.query("select count(*)::int as n from posts");
  igual(posts.rows[0].n, 3, "posts após a segunda rodada do seed");
  const links = await db.query("select count(*)::int as n from perfil_links");
  igual(links.rows[0].n, 2, "perfil_links após a segunda rodada do seed");
});

await ok("projetos (0005): anon não vê invisível e não escreve", async () => {
  await db.exec(
    "insert into projetos (nome, visivel) values ('Sistema oculto', false)",
  );
  const lidos = await como("anon", null, () =>
    db.query("select count(*)::int as n from projetos where nome = 'Sistema oculto'"),
  );
  igual(lidos.rows[0].n, 0, "projeto invisível lido pelo anônimo");
  try {
    await como("anon", null, () =>
      db.exec("insert into projetos (nome) values ('intruso')"),
    );
    throw new Error("INSERT do anon em projetos foi ACEITO");
  } catch (e) {
    if (!/permission denied|row-level security/i.test(e.message)) throw e;
  }
});

/* ─────────────────────── 2. estrutura de segurança ─────────────────────── */

await ok("RLS está ligada em TODAS as tabelas do schema public", async () => {
  const r = await db.query(`
    select c.relname from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
     order by c.relname
  `);
  if (r.rows.length > 0) {
    throw new Error(`sem RLS: ${r.rows.map((l) => l.relname).join(", ")}`);
  }
});

await ok("GRANT existe: anon lê as 10 tabelas públicas e não escreve nenhuma", async () => {
  // 9 do v3 (0001) + projetos (0005). As tabelas da automação (0003) e
  // admins ficam DE FORA de propósito: anon não tem nem o portão 1 nelas.
  const leitura = await db.query(`
    select count(distinct table_name)::int as n
      from information_schema.role_table_grants
     where grantee = 'anon' and table_schema = 'public' and privilege_type = 'SELECT'
  `);
  igual(leitura.rows[0].n, 10, "tabelas com SELECT pro anon (admins e automação de fora)");

  const escrita = await db.query(`
    select count(*)::int as n
      from information_schema.role_table_grants
     where grantee = 'anon' and table_schema = 'public'
       and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
  `);
  igual(escrita.rows[0].n, 0, "grants de escrita pro anon");
});

await ok("GRANT existe: authenticated tem escrita (o portão 2 é a policy)", async () => {
  const r = await db.query(`
    select count(distinct table_name)::int as n
      from information_schema.role_table_grants
     where grantee = 'authenticated' and table_schema = 'public'
       and privilege_type = 'INSERT'
  `);
  // 9 do v3 + pautas e divulgacoes (0003) + projetos (0005)
  igual(r.rows[0].n, 12, "tabelas com INSERT pro authenticated");
});

/* ────────────── 3. fixtures: o que o público NÃO deve ver ────────────── */

await ok("fixtures criadas (rascunho, post futuro, ligação e certificados)", async () => {
  await db.exec(`
    insert into posts (slug, portal, titulo, resumo, corpo)
    values ('rascunho-fixture', 'tecnologia', 'Rascunho invisível', 'r', 'corpo do rascunho');

    insert into posts (slug, portal, titulo, resumo, corpo, publicado_em)
    values ('futuro-fixture', 'tecnologia', 'Agendado', 'r', 'c', now() + interval '1 day');

    -- rascunho ganha a etiqueta 'postgres' — é a porta lateral que o teste
    -- de posts_etiquetas tenta abrir
    insert into posts_etiquetas (post_id, etiqueta_id)
    select p.id, e.id from posts p, etiquetas e
     where p.slug = 'rascunho-fixture' and e.slug = 'postgres';

    insert into certificados (curso, instituicao, ano, publico)
    values ('Curso conferido', 'Instituição A', 2024, true),
           ('Curso não conferido', 'Instituição B', 2025, false);
  `);
});

/* ─────────────────── 4. a visão do anônimo (portal público) ─────────────────── */

await ok("anônimo lê só post com publicado_em não nulo e <= now()", async () => {
  const publicados = await db.query(
    "select count(*)::int as n from posts where publicado_em is not null and publicado_em <= now()",
  );
  const total = await db.query("select count(*)::int as n from posts");
  if (total.rows[0].n <= publicados.rows[0].n) {
    throw new Error("o teste não vale: não existe rascunho no banco pra ficar escondido");
  }

  const visiveis = await como("anon", null, () =>
    db.query("select count(*)::int as n from posts"),
  );
  igual(visiveis.rows[0].n, publicados.rows[0].n, "posts visíveis pro anônimo");
});

await ok("anônimo NÃO vê rascunho nem post com data futura", async () => {
  const r = await como("anon", null, () =>
    db.query(
      "select count(*)::int as n from posts where publicado_em is null or publicado_em > now()",
    ),
  );
  igual(r.rows[0].n, 0, "não-publicados vazando pro anônimo");
});

await ok("a ligação posts_etiquetas segue a visibilidade do post (rascunho não vaza pela etiqueta)", async () => {
  const consulta = `
    select count(*)::int as n from posts_etiquetas pe
      join etiquetas e on e.id = pe.etiqueta_id
     where e.slug = 'postgres'
  `;
  const totais = await db.query(consulta); // superusuário vê tudo
  const anon = await como("anon", null, () => db.query(consulta));
  if (totais.rows[0].n <= anon.rows[0].n) {
    throw new Error("o teste não vale: a ligação do rascunho não existe no banco");
  }
  igual(anon.rows[0].n, totais.rows[0].n - 1, "ligações visíveis pro anônimo");
});

await ok("certificado com publico = false é invisível pro anônimo", async () => {
  const r = await como("anon", null, () =>
    db.query("select count(*)::int as n, count(*) filter (where not publico)::int as ocultos from certificados"),
  );
  igual(r.rows[0].n, 1, "certificados visíveis pro anônimo");
  igual(r.rows[0].ocultos, 0, "certificado não conferido vazando");
});

await ok("o currículo continua legível pro anônimo (é pra ser público)", async () => {
  const r = await como("anon", null, async () => ({
    perfil: await db.query("select count(*)::int as n from perfil"),
    habilidades: await db.query("select count(*)::int as n from habilidades"),
    etiquetas: await db.query("select count(*)::int as n from etiquetas"),
  }));
  igual(r.perfil.rows[0].n, 1, "perfil legível");
  igual(r.habilidades.rows[0].n, 6, "habilidades legíveis");
  igual(r.etiquetas.rows[0].n, 8, "etiquetas legíveis");
});

/* ─────────────── 5. is_admin(): autenticado não é autorizado ─────────────── */

await ok("is_admin() é falso pra anônimo", async () => {
  const r = await como("anon", null, () => db.query("select is_admin() as r"));
  igual(r.rows[0].r, false, "is_admin() para anônimo");
});

await ok("is_admin() é falso pra autenticado NÃO alistado (DEC-020)", async () => {
  const r = await como("authenticated", ESTRANHO_UID, () => db.query("select is_admin() as r"));
  igual(r.rows[0].r, false, "is_admin() para conta de fora da tabela admins");
});

await ok("is_admin() é verdadeiro pro user_id alistado em admins", async () => {
  // o alistamento manual da DEC-020, simulado: uma linha inserida "pelo Studio"
  await db.query(
    "insert into admins (user_id, nota) values ($1, 'conta de teste do alistamento') on conflict do nothing",
    [ADMIN_UID],
  );
  const r = await como("authenticated", ADMIN_UID, () => db.query("select is_admin() as r"));
  igual(r.rows[0].r, true, "is_admin() para o admin alistado");
});

/* ────────── 6. o teste que importa: admin vê o próprio rascunho ────────── */

await ok("admin INSERE um rascunho (a policy de escrita deixa)", async () => {
  await como("authenticated", ADMIN_UID, () =>
    db.exec(`
      insert into posts (slug, portal, titulo, resumo, corpo)
      values ('rascunho-do-admin', 'tecnologia', 'Rascunho recém-inserido', 'r', 'corpo')
    `),
  );
});

await ok("admin VÊ o próprio rascunho logo depois de inserir (o bug da DEC-022)", async () => {
  // Sem a policy "admin vê tudo, inclusive rascunho", este select devolvia
  // zero linhas: o admin inseria e o registro sumia da frente dele, sem erro.
  const r = await como("authenticated", ADMIN_UID, () =>
    db.query("select count(*)::int as n from posts where slug = 'rascunho-do-admin'"),
  );
  igual(r.rows[0].n, 1, "rascunho visível pro próprio admin");
});

await ok("o mesmo rascunho continua invisível pro anônimo", async () => {
  const r = await como("anon", null, () =>
    db.query("select count(*)::int as n from posts where slug = 'rascunho-do-admin'"),
  );
  igual(r.rows[0].n, 0, "rascunho do admin vazando pro anônimo");
});

await ok("admin vê toda ligação e o certificado não conferido", async () => {
  const r = await como("authenticated", ADMIN_UID, async () => ({
    ligacoes: await db.query(`
      select count(*)::int as n from posts_etiquetas pe
        join posts p on p.id = pe.post_id
       where p.slug = 'rascunho-fixture'
    `),
    certificados: await db.query("select count(*)::int as n from certificados"),
  }));
  igual(r.ligacoes.rows[0].n, 1, "ligação do rascunho visível pro admin");
  igual(r.certificados.rows[0].n, 2, "certificados (inclusive não conferido) pro admin");
});

/* ──────────────── 7. escrita: os dois portões da DEC-017 ──────────────── */

await ok("anônimo não escreve em NENHUMA tabela (portão 1: permission denied)", async () => {
  const tentativas = [
    ["posts", "insert into posts (slug, portal, titulo, resumo, corpo) values ('invasao', 'tecnologia', 'x', 'x', 'x')"],
    ["etiquetas", "insert into etiquetas (slug, nome) values ('invasao', 'Invasão')"],
    ["posts_etiquetas", "insert into posts_etiquetas (post_id, etiqueta_id) values (gen_random_uuid(), gen_random_uuid())"],
    ["perfil", "update perfil set nome_completo = 'Invasor' where id = 1"],
    ["perfil_links", "insert into perfil_links (rotulo, url) values ('x', 'x')"],
    ["experiencias", "insert into experiencias (cargo, empresa, inicio) values ('x', 'x', '2020-01-01')"],
    ["formacao", "insert into formacao (curso, instituicao) values ('x', 'x')"],
    ["habilidades", "insert into habilidades (categoria, nome) values ('x', 'x')"],
    ["certificados", "insert into certificados (curso, instituicao) values ('x', 'x')"],
    ["admins", "insert into admins (user_id) values (gen_random_uuid())"],
  ];
  for (const [tabela, sql] of tentativas) {
    let barrou = false;
    let motivo = "";
    try {
      await como("anon", null, () => db.exec(sql));
    } catch (e) {
      barrou = true;
      motivo = e.message ?? "";
    }
    if (!barrou) throw new Error(`anônimo conseguiu escrever em ${tabela}`);
    if (!motivo.toLowerCase().includes("permission denied")) {
      throw new Error(`${tabela}: barrou no portão errado — esperava 'permission denied', veio: ${motivo}`);
    }
  }
});

await recusa(
  "autenticado não-admin NÃO insere post (portão 2: a policy barra)",
  () =>
    como("authenticated", ESTRANHO_UID, () =>
      db.exec(`
        insert into posts (slug, portal, titulo, resumo, corpo)
        values ('invasao-logada', 'tecnologia', 'x', 'x', 'x')
      `),
    ),
  "row-level security",
);

await ok("autenticado não-admin NÃO edita nem apaga (a policy filtra: zero linhas)", async () => {
  // UPDATE/DELETE com policy de USING não dão erro — só não alcançam linha
  // nenhuma. Por isso a verificação é no efeito, não na exceção.
  await como("authenticated", ESTRANHO_UID, () =>
    db.exec(`
      update posts set titulo = 'hackeado' where slug = 'troquei-resend-por-brevo';
      delete from posts where slug = 'troquei-resend-por-brevo';
    `),
  );
  const r = await db.query(
    "select count(*)::int as n from posts where slug = 'troquei-resend-por-brevo' and titulo <> 'hackeado'",
  );
  igual(r.rows[0].n, 1, "post intacto depois da tentativa do não-admin");
});

await ok("autenticado não-admin lê admins e recebe zero linhas (não 'permission denied')", async () => {
  const r = await como("authenticated", ESTRANHO_UID, () =>
    db.query("select count(*)::int as n from admins"),
  );
  igual(r.rows[0].n, 0, "linhas de admins pro não-admin");
});

await recusa(
  "anônimo nem lê admins: a tabela não tem GRANT pro anon",
  () => como("anon", null, () => db.query("select count(*) from admins")),
  "permission denied",
);

await ok("admin escreve de verdade: edita e apaga", async () => {
  await como("authenticated", ADMIN_UID, () =>
    db.exec(`
      update posts set titulo = 'Rascunho editado pelo admin' where slug = 'rascunho-do-admin';
      insert into etiquetas (slug, nome) values ('etiqueta-do-teste', 'Etiqueta do teste');
      delete from etiquetas where slug = 'etiqueta-do-teste';
    `),
  );
  const r = await db.query(
    "select titulo from posts where slug = 'rascunho-do-admin'",
  );
  igual(r.rows[0].titulo, "Rascunho editado pelo admin", "título após o update do admin");
});

/* ─────── 8. DEC-017 ao vivo: o GRANT é um portão separado da POLICY ─────── */

await ok("sem GRANT o erro é 'permission denied'; com GRANT e policy, linhas voltam", async () => {
  // Portão 1 fechado: revoga o GRANT. A policy nem chega a ser avaliada.
  await db.exec("revoke select on posts from anon");
  let motivo = "";
  try {
    await como("anon", null, () => db.query("select count(*) from posts"));
  } catch (e) {
    motivo = e.message ?? "";
  }
  if (!motivo.toLowerCase().includes("permission denied")) {
    throw new Error(`esperava 'permission denied' com o GRANT revogado, veio: ${motivo || "nenhum erro"}`);
  }

  // Portão 1 reaberto: o GRANT volta, e o portão 2 (policy) filtra as linhas.
  await db.exec("grant select on posts to anon");
  const r = await como("anon", null, () => db.query("select count(*)::int as n from posts"));
  if (r.rows[0].n < 1) throw new Error("com GRANT devolvido, o anônimo deveria voltar a ler os publicados");
});

/* ─────────────────────── 9. trigger atualizado_em ─────────────────────── */

await ok("trigger toca atualizado_em em posts a cada update", async () => {
  await db.exec(`
    insert into posts (slug, portal, titulo, resumo, corpo, atualizado_em)
    values ('teste-trigger', 'tecnologia', 't', 'r', 'c', '2020-01-01T00:00:00Z');
    update posts set titulo = 'mexido' where slug = 'teste-trigger';
  `);
  const r = await db.query(
    "select (atualizado_em > '2025-01-01'::timestamptz) as tocou from posts where slug = 'teste-trigger'",
  );
  igual(r.rows[0].tocou, true, "atualizado_em renovado pelo trigger");
});

await ok("trigger toca atualizado_em em perfil a cada update", async () => {
  await db.exec("update perfil set telefone = null where id = 1");
  const r = await db.query(
    "select (atualizado_em > now() - interval '5 minutes') as tocou from perfil where id = 1",
  );
  igual(r.rows[0].tocou, true, "atualizado_em do perfil renovado pelo trigger");
});

/* ───────────────────────── 10. sanidade do seed ───────────────────────── */

await ok("o seed publicou 3 posts, todos com etiqueta", async () => {
  const posts = await db.query(
    "select count(*)::int as n from posts where publicado_em is not null and publicado_em <= now()",
  );
  igual(posts.rows[0].n, 3, "posts publicados pelo seed");

  const sem = await db.query(`
    select count(*)::int as n from posts p
     where p.publicado_em is not null and p.publicado_em <= now()
       and not exists (select 1 from posts_etiquetas pe where pe.post_id = p.id)
  `);
  igual(sem.rows[0].n, 0, "post publicado sem nenhuma etiqueta");
});

await ok("o seed não alistou admin nenhum (DEC-020: alistamento é manual)", async () => {
  const r = await db.query("select count(*)::int as n from admins where nota <> 'conta de teste do alistamento'");
  igual(r.rows[0].n, 0, "admins vindos do seed");
});

/* ───────────────────────────── fecho ───────────────────────────── */

await db.close();

console.log(
  `\n${falharam === 0 ? VERDE : VERMELHO}${passaram} passaram, ${falharam} falharam${FIM}\n`,
);
process.exit(falharam === 0 ? 0 : 1);

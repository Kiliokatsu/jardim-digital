/**
 * Valida supabase/schema.sql e supabase/seed.sql contra um Postgres de verdade
 * (PGlite, o Postgres compilado pra WASM) antes de colar qualquer coisa no
 * Supabase de produção.
 *
 *   npm run testar-schema
 *
 * O objetivo não é só "o SQL roda sem erro de sintaxe". É provar as duas regras
 * que o desenho promete e que a aplicação inteira assume como verdade:
 *
 *   1. Não existe caminho pra `publicado` sem passar por `aprovado`.
 *   2. A coluna de referência de segredo recusa qualquer coisa que pareça token.
 *
 * Se um destes testes passar a falhar depois de você mexer no schema, é porque
 * uma garantia caiu — não porque o teste está chato.
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
   Stub do que o Supabase põe no banco e o Postgres cru não tem.
   auth.jwt() é a função que eh_dono() consulta pra saber quem está pedindo.
   ───────────────────────────────────────────────────────────────────────── */
const STUB_SUPABASE = `
create schema if not exists auth;

-- No Supabase isto vem do token da requisição. Aqui é uma variável de sessão,
-- pra que o teste possa "virar" o dono e voltar a ser anônimo à vontade.
create or replace function auth.jwt() returns jsonb
  language sql stable as $$
    select coalesce(
      nullif(current_setting('teste.jwt', true), '')::jsonb,
      '{}'::jsonb
    );
  $$;

create or replace function auth.uid() returns uuid
  language sql stable as $$ select null::uuid $$;
`;

const db = new PGlite();

console.log(`\n${CINZA}Postgres em WASM (PGlite) — validando o schema antes do Supabase${FIM}\n`);

/* ─────────────────────────── 1. o SQL roda ─────────────────────────── */

await ok("stub do auth do Supabase aplica", async () => {
  await db.exec(STUB_SUPABASE);
});

await ok("schema.sql roda inteiro, sem erro", async () => {
  const sql = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  await db.exec(sql);
});

await ok("seed.sql roda inteiro, sem erro", async () => {
  const sql = await readFile(new URL("../supabase/seed.sql", import.meta.url), "utf8");
  await db.exec(sql);
});

await ok("schema.sql é idempotente (roda duas vezes)", async () => {
  const sql = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  await db.exec(sql);
});

/* ─────────────────── 2. a semente atravessou a fila ─────────────────── */

await ok("a semente publicou os 3 posts passando pela fila", async () => {
  const r = await db.query(`select count(*)::int as n from posts where estado = 'publicado'`);
  igual(r.rows[0].n, 3, "posts publicados");
});

await ok("todo post publicado tem data de publicação", async () => {
  const r = await db.query(
    `select count(*)::int as n from posts where estado = 'publicado' and publicado_em is null`,
  );
  igual(r.rows[0].n, 0, "publicados sem data");
});

await ok("a trilha de moderação registrou cada passo da fila", async () => {
  const r = await db.query(
    `select acao, count(*)::int as n from moderacao group by acao order by acao`,
  );
  const porAcao = Object.fromEntries(r.rows.map((l) => [l.acao, l.n]));
  igual(porAcao.enviou_revisao, 3, "enviou_revisao");
  igual(porAcao.aprovou, 3, "aprovou");
  igual(porAcao.publicou, 3, "publicou");
});

/* ═══════════════════ 3. O INTERLOCK — o teste que importa ═══════════════════ */

await recusa(
  "post NÃO pode nascer publicado",
  () =>
    db.exec(`
      insert into posts (slug, titulo, corpo_md, portal, estado, publicado_em)
      values ('nasce-publicado', 'Tentando nascer pronto', 'x', 'tecnologia', 'publicado', now())
    `),
  "não pode nascer publicado",
);

await ok("cria um rascunho pra atacar o interlock", async () => {
  await db.exec(`
    insert into posts (slug, titulo, corpo_md, portal, estado)
    values ('alvo-do-teste', 'Alvo do teste de interlock', 'corpo inicial', 'tecnologia', 'rascunho')
  `);
});

await recusa(
  "rascunho NÃO pula direto pra publicado",
  () => db.exec(`update posts set estado = 'publicado' where slug = 'alvo-do-teste'`),
  "publicação bloqueada",
);

await recusa(
  "em revisão NÃO pula pra publicado sem aprovação",
  async () => {
    await db.exec(`update posts set estado = 'em_revisao' where slug = 'alvo-do-teste'`);
    await db.exec(`update posts set estado = 'publicado' where slug = 'alvo-do-teste'`);
  },
  "publicação bloqueada",
);

await recusa(
  "rejeitado NÃO pula pra publicado",
  async () => {
    await db.exec(`update posts set estado = 'rejeitado' where slug = 'alvo-do-teste'`);
    await db.exec(`update posts set estado = 'publicado' where slug = 'alvo-do-teste'`);
  },
  "publicação bloqueada",
);

await ok("aprovado → publicado passa, e a data é preenchida sozinha", async () => {
  await db.exec(`update posts set estado = 'rascunho'   where slug = 'alvo-do-teste'`);
  await db.exec(`update posts set estado = 'em_revisao' where slug = 'alvo-do-teste'`);
  await db.exec(`update posts set estado = 'aprovado'   where slug = 'alvo-do-teste'`);
  await db.exec(`update posts set estado = 'publicado'  where slug = 'alvo-do-teste'`);

  const r = await db.query(
    `select estado, publicado_em is not null as tem_data from posts where slug = 'alvo-do-teste'`,
  );
  igual(r.rows[0].estado, "publicado", "estado final");
  igual(r.rows[0].tem_data, true, "publicado_em preenchido pelo trigger");
});

await ok("mexer no corpo conta revisão; mexer no resto, não", async () => {
  const antes = await db.query(`select revisoes from posts where slug = 'alvo-do-teste'`);

  await db.exec(`update posts set corpo_md = 'corpo mexido' where slug = 'alvo-do-teste'`);
  const depois = await db.query(`select revisoes from posts where slug = 'alvo-do-teste'`);
  igual(depois.rows[0].revisoes, antes.rows[0].revisoes + 1, "revisões após mexer no corpo");

  await db.exec(`update posts set titulo = 'Outro título' where slug = 'alvo-do-teste'`);
  const semMexer = await db.query(`select revisoes from posts where slug = 'alvo-do-teste'`);
  igual(semMexer.rows[0].revisoes, depois.rows[0].revisoes, "revisões após mexer só no título");
});

/* ═════════════════ 4. credencial não entra no banco ═════════════════ */

await recusa(
  "ref_segredo recusa o que parece um token de verdade",
  () =>
    db.exec(`
      update integracoes set ref_segredo = 'sk-live-9f8a7b6c5d4e3f2a1b0c'
       where nome = 'brevo-transacional'
    `),
  "ref_segredo_nao_parece_segredo",
);

await ok("ref_segredo aceita nome de variável de ambiente", async () => {
  await db.exec(
    `update integracoes set ref_segredo = 'BREVO_API_KEY_NOVA' where nome = 'brevo-transacional'`,
  );
});

/* ═════════════════════ 5. o resto das garantias ═════════════════════ */

await ok("execução nova espelha o estado na integração", async () => {
  await db.exec(`
    insert into execucoes (integracao_id, estado, mensagem, origem)
    select id, 'erro', 'teste de espelhamento', 'painel'
      from integracoes where nome = 'backup-diario'
  `);
  const r = await db.query(
    `select ultimo_estado, ultima_execucao_em is not null as tem_data
       from integracoes where nome = 'backup-diario'`,
  );
  igual(r.rows[0].ultimo_estado, "erro", "ultimo_estado espelhado");
  igual(r.rows[0].tem_data, true, "ultima_execucao_em espelhada");
});

await recusa(
  "nota não pode se conectar a si mesma",
  () =>
    db.exec(`insert into conexoes (de, para)
             select id, id from posts where slug = 'resend-para-brevo'`),
  "sem_autoligacao",
);

await recusa(
  "não existe um segundo perfil",
  () => db.exec(`insert into perfil (id, nome, titulo, email) values (2, 'Outro', 'x', 'a@b.c')`),
  "perfil_id_check",
);

await ok("a view jardim só mostra o que está publicado", async () => {
  const view = await db.query(`select count(*)::int as n from jardim`);
  const tabela = await db.query(
    `select count(*)::int as n from posts where estado = 'publicado' and publicado_em <= now()`,
  );
  igual(view.rows[0].n, tabela.rows[0].n, "linhas na view vs. publicados");

  const rascunho = await db.query(
    `select count(*)::int as n from jardim j
      join posts p on p.id = j.id where p.estado <> 'publicado'`,
  );
  igual(rascunho.rows[0].n, 0, "rascunho aparecendo no jardim");
});

await ok("a busca em português indexou o conteúdo", async () => {
  const r = await db.query(
    `select count(*)::int as n from posts
      where busca @@ websearch_to_tsquery('portuguese', 'backup')`,
  );
  if (r.rows[0].n < 1) throw new Error("a busca por 'backup' não achou o post do incidente");
});

await ok("habilidade aponta pro post que a prova", async () => {
  const r = await db.query(`
    select h.nome, p.slug from provas pr
      join habilidades h on h.id = pr.habilidade_id
      join posts p on p.id = pr.post_id
     order by h.nome
  `);
  if (r.rows.length < 3) throw new Error(`esperava 3 provas, veio ${r.rows.length}`);
});

/* ═════════════════════ 6. RLS: as duas visões ═════════════════════ */

await ok("RLS está ligada em todas as tabelas que importam", async () => {
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

await ok("eh_dono() é falso pra anônimo e verdadeiro pro dono", async () => {
  await db.exec(`select set_config('teste.jwt', '{}', false)`);
  const anon = await db.query(`select eh_dono() as r`);
  igual(anon.rows[0].r, false, "eh_dono() para anônimo");

  await db.exec(
    `select set_config('teste.jwt', '{"email":"dono@exemplo.com"}', false)`,
  );
  const dono = await db.query(`select eh_dono() as r`);
  igual(dono.rows[0].r, true, "eh_dono() para o dono");

  await db.exec(`select set_config('teste.jwt', '{"email":"estranho@exemplo.com"}', false)`);
  const outro = await db.query(`select eh_dono() as r`);
  igual(outro.rows[0].r, false, "eh_dono() para outra conta autenticada");
});

await ok("políticas existem em posts, integrações e log", async () => {
  const r = await db.query(`
    select tablename, count(*)::int as n from pg_policies
     where schemaname = 'public' group by tablename order by tablename
  `);
  const porTabela = Object.fromEntries(r.rows.map((l) => [l.tablename, l.n]));
  for (const t of ["posts", "integracoes", "execucoes", "moderacao", "conexoes", "incidentes"]) {
    if (!porTabela[t]) throw new Error(`tabela ${t} está sem política de RLS`);
  }
  igual(porTabela.posts, 2, "políticas em posts (leitura pública + dono)");
  igual(porTabela.integracoes, 1, "políticas em integracoes (só dono — sala de máquinas)");
});

/* ═══════════════ 7. RLS de verdade: barrando um papel real ═══════════════

   Os testes acima provam que as políticas EXISTEM. Isso não é a mesma coisa que
   provar que elas BARRAM alguém: até aqui tudo rodou como superusuário, e
   superusuário ignora RLS por definição. Então criamos o papel `anon` (o mesmo
   nome que o Supabase usa pra chave anônima), viramos ele, e tentamos ler o que
   não deveríamos. Sem esta parte, o teste dá uma falsa sensação de segurança. */

await ok("prepara o papel anon com os mesmos privilégios do Supabase", async () => {
  await db.exec(`
    do $$ begin
      create role anon nologin;
    exception when duplicate_object then null; end $$;

    grant usage on schema public to anon;
    grant select on all tables in schema public to anon;
  `);
});

await ok("anônimo lê só o que está publicado", async () => {
  await db.exec(`set role anon`);
  const visiveis = await db.query(`select count(*)::int as n from posts`);
  await db.exec(`reset role`);

  const publicados = await db.query(
    `select count(*)::int as n from posts where estado = 'publicado' and publicado_em <= now()`,
  );
  const total = await db.query(`select count(*)::int as n from posts`);

  igual(visiveis.rows[0].n, publicados.rows[0].n, "posts visíveis pro anônimo");
  if (total.rows[0].n <= publicados.rows[0].n) {
    throw new Error("o teste não vale: não existe rascunho no banco pra ficar escondido");
  }
});

await ok("anônimo NÃO vê rascunho nem texto de agente não publicado", async () => {
  await db.exec(`set role anon`);
  const r = await db.query(
    `select count(*)::int as n from posts where estado <> 'publicado'`,
  );
  await db.exec(`reset role`);
  igual(r.rows[0].n, 0, "rascunhos vazando pro anônimo");
});

await ok("anônimo NÃO enxerga a sala de máquinas", async () => {
  await db.exec(`set role anon`);
  const integracoes = await db.query(`select count(*)::int as n from integracoes`);
  const execucoes = await db.query(`select count(*)::int as n from execucoes`);
  const moderacao = await db.query(`select count(*)::int as n from moderacao`);
  await db.exec(`reset role`);

  igual(integracoes.rows[0].n, 0, "integrações vazando (inclui ref_segredo)");
  igual(execucoes.rows[0].n, 0, "log de execuções vazando");
  igual(moderacao.rows[0].n, 0, "trilha de moderação vazando");
});

await ok("anônimo NÃO consegue escrever nada", async () => {
  await db.exec(`set role anon`);
  let escreveu = false;
  try {
    await db.exec(`
      insert into posts (slug, titulo, corpo_md, portal)
      values ('invasao', 'Post de estranho', 'x', 'tecnologia')
    `);
    escreveu = true;
  } catch {
    /* recusado, que é o esperado */
  }
  await db.exec(`reset role`);
  if (escreveu) throw new Error("anônimo conseguiu inserir post");
});

await ok("o currículo continua legível pro anônimo (é pra ser público)", async () => {
  await db.exec(`set role anon`);
  const habilidades = await db.query(`select count(*)::int as n from habilidades`);
  const perfil = await db.query(`select count(*)::int as n from perfil`);
  await db.exec(`reset role`);

  if (habilidades.rows[0].n === 0) throw new Error("habilidades invisíveis — o currículo quebra");
  igual(perfil.rows[0].n, 1, "perfil legível");
});

/* ───────────────────────────── fecho ───────────────────────────── */

await db.close();

console.log(
  `\n${falharam === 0 ? VERDE : VERMELHO}${passaram} passaram, ${falharam} falharam${FIM}\n`,
);
process.exit(falharam === 0 ? 0 : 1);

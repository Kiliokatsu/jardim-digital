#!/usr/bin/env node
/**
 * preparar-hooks.mjs — aponta o git para os hooks versionados em .githooks/.
 *
 * Por que um script e não uma linha no README: proteção que depende de alguém
 * lembrar de rodar um comando não é proteção. Isto roda sozinho no `npm install`
 * (via `prepare` no package.json) e é idempotente.
 *
 * Por que não husky: husky faz o mesmo com uma dependência a mais. `core.hooksPath`
 * é recurso nativo do git desde a versão 2.9.
 *
 * Ele nunca derruba o build: fora de um repositório git — como no build da Vercel,
 * que recebe o código sem o diretório .git — apenas avisa e sai com sucesso.
 */

import { execFileSync } from 'node:child_process';
import { chmodSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raizProjeto = dirname(dirname(fileURLToPath(import.meta.url)));

function git(...args) {
  return execFileSync('git', args, {
    cwd: raizProjeto,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

try {
  git('rev-parse', '--git-dir');
} catch {
  console.log('[hooks] fora de um repositório git — nada a fazer');
  process.exit(0);
}

try {
  git('config', 'core.hooksPath', '.githooks');

  // O bit de execução não sobrevive em todo sistema de arquivos; falhar aqui
  // não é motivo para abortar, porque o git no Windows executa o hook via sh.
  try {
    chmodSync(join(raizProjeto, '.githooks', 'pre-commit'), 0o755);
  } catch {
    /* ignorado de propósito */
  }

  console.log('[hooks] core.hooksPath -> .githooks (pre-commit de segredos ativo)');
} catch (erro) {
  console.warn(`[hooks] não foi possível configurar: ${erro.message}`);
  process.exit(0);
}

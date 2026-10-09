import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

const root = fileURLToPath(new URL('../', import.meta.url));
const api = 'http://127.0.0.1:54321';
const container = 'supabase_db_secure-desk';
const docker = process.platform === 'win32' ? 'docker.exe' : 'docker';
class SetupError extends Error {}
function command(executable, args, input) {
  const result = spawnSync(executable, args, {cwd:root, env:process.env, input, encoding:'utf8', timeout:30000});
  if (result.error || result.status !== 0) throw new SetupError('Local setup check failed; private command output withheld.');
  return result.stdout;
}
function run() {
  const args = process.argv.slice(2);
  if (args.length < 2 || args.length > 3 || args[0] !== '--email' || (args[2] && args[2] !== '--apply')) {
    throw new SetupError('Usage: npm run admin:bootstrap:local -- --email chosen@example.invalid [--apply]. Preview is the default.');
  }
  const email = args[1].trim().toLowerCase();
  if (email.length > 254 || !/^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) {
    throw new SetupError('Use one exact email address without quotes or command characters.');
  }
  if (process.env.DOCKER_HOST) throw new SetupError('Refusing a Docker host override. Use the local desktop context.');
  const config = readFileSync(new URL('../supabase/config.toml', import.meta.url), 'utf8');
  if (!/^project_id\s*=\s*"secure-desk"\s*$/m.test(config)) throw new SetupError('Expected local SecureDesk project configuration.');
  const env = parseEnv(readFileSync(new URL('../.env.local', import.meta.url), 'utf8'));
  if (env.NEXT_PUBLIC_SUPABASE_URL !== api || env.SITE_URL !== 'http://127.0.0.1:3000') {
    throw new SetupError('Refusing setup: .env.local must point to the exact local SecureDesk API and site.');
  }
  const host = JSON.parse(command(docker, ['context', 'inspect', '--format', '{{json .Endpoints.docker.Host}}']));
  const localPipe = /^npipe:\/\/\/\/\.\/pipe\/(dockerDesktopLinuxEngine|docker_engine)$/.test(host);
  if (!localPipe && host !== 'unix:///var/run/docker.sock') throw new SetupError('Refusing a nonlocal Docker context.');
  const labels = JSON.parse(command(docker, ['inspect', container, '--format', '{{json .Config.Labels}}']));
  if (labels['com.supabase.cli.project'] !== 'secure-desk' || labels['com.supabase.cli.workdir'] !== root.replace(/[\\/]$/, '')) {
    throw new SetupError('Refusing an unexpected database container or workspace.');
  }
  // Capture privately: Supabase status contains privileged keys; never print or persist it.
  const local = JSON.parse(command(process.execPath, ['node_modules/supabase/dist/supabase.js', 'status', '-o', 'json']));
  if (local.API_URL !== api) throw new SetupError('Refusing an unexpected local API address.');
  const helper = readFileSync(new URL('../supabase/tests/support/local-super-admin-bootstrap.inc', import.meta.url), 'utf8');
  const apply = args[2] === '--apply';
  // psql quotes the bound email as a SQL literal. No shell or credential argument is used.
  const sql = 'begin;\nset local lock_timeout=\'5s\';\nset local statement_timeout=\'15s\';\n' + helper +
    '\nselect pg_temp.bootstrap_super_admin(:\'target_email\', ' + apply + ');\n' +
    (apply ? 'commit;\n' : 'rollback;\n');
  const result = spawnSync(docker, ['exec', '-i', container, 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-qAt',
    '-v', 'ON_ERROR_STOP=1', '-v', 'target_email=' + email], {cwd:root, env:process.env, input:sql, encoding:'utf8', timeout:30000});
  if (result.error || result.status !== 0) {
    const safeReasons = [
      'A Super Admin already exists; first setup is closed',
      'Expected exactly one registered account for this email',
      'The account must have a confirmed email and be eligible for login',
      'Expected a client/pending profile for first setup',
      'Expected exactly one first registration request',
      'Expected an unrouted pending first request',
      'The first setup account must have no membership or assignment history',
    ];
    throw new SetupError(safeReasons.find(reason => result.stderr?.includes(reason)) ?? 'Local setup did not complete normally; check account state before retrying. Private output withheld.');
  }
  const summary = JSON.parse(result.stdout.trim());
  console.log(apply ? 'Local first Super Admin setup committed:' : 'Preview only; account unchanged:');
  console.log(JSON.stringify(summary));
}
try { run(); } catch (error) {
  console.error('Setup stopped: ' + (error instanceof SetupError ? error.message : 'Local configuration/check failed; private details withheld.'));
  process.exitCode = 1;
}

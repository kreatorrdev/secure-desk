import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const cases = [
  ['missing email', [], 'Usage:'],
  ['cloud target argument', ['--email','admin@example.invalid','--db-url=https://cloud.example.invalid'], 'Usage:'],
  ['extra arguments', ['--email','admin@example.invalid','--apply','--linked'], 'Usage:'],
  ['SQL or shell characters in email', ['--email',"admin'@example.invalid",'--apply'], 'Use one exact email address'],
];
for (const [label,args,message] of cases) {
  test(label + ' is rejected before a database operation', () => {
    const result = spawnSync(process.execPath, ['scripts/bootstrap-local-super-admin.mjs', ...args], {cwd:root, encoding:'utf8'});
    assert.equal(result.status,1);
    assert.ok(result.stderr.includes(message));
    assert.equal(result.stdout,'');
  });
}
test('a Docker host override is rejected before a database operation', () => {
  const result = spawnSync(process.execPath, ['scripts/bootstrap-local-super-admin.mjs','--email','admin@example.invalid','--apply'], {
    cwd:root, encoding:'utf8', env:{...process.env, DOCKER_HOST:'tcp://remote.example.invalid:2376'},
  });
  assert.equal(result.status,1);
  assert.ok(result.stderr.includes('Refusing a Docker host override'));
  assert.equal(result.stdout,'');
});

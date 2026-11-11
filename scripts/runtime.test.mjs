import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

test('the declared minimum Node version passes the installed Astro startup gate', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const declaredMinimum = pkg.engines.node.replace(/^>=/, '');
  // Characterize the real CLI gate without installing a second runtime or starting a server.
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
    Object.defineProperty(process.versions, 'node', { value: process.argv[1] });
    process.argv = ['node', 'astro', '--version'];
    await import('./node_modules/astro/bin/astro.mjs');
  `, declaredMinimum], {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, `Declared Node ${declaredMinimum} cannot start Astro:\n${result.stderr}`);
  assert.match(result.stdout, /astro/i);
});

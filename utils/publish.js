#!/usr/bin/env node
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// @ts-check

/**
 * Publishes all non-private workspace packages to npm in dependency order.
 *
 * Usage:
 *   npm run publish
 *
 * Auth:
 *   Set NPM_TOKEN env var, or run `npm login` before calling this script.
 *   The token is written to .npmrc only for the duration of this script.
 *
 * Publish order (wave = published concurrently within the same wave):
 *   Wave 1: copilotbrowser
 *   Wave 2: copilotbrowser-chromium, copilotbrowser-firefox, copilotbrowser-webkit
 *   Wave 3: copilotbrowser (bundles core, includes Chromium install, ct adapters)
 */

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const { workspace } = require('./workspace');

const DRY_RUN = process.argv.includes('--dry-run');
const TAG = process.argv.find(a => a.startsWith('--tag='))?.split('=')[1] ?? 'latest';
// --only=copilotbrowser publishes just that one package (by name or path substring)
const ONLY = process.argv.find(a => a.startsWith('--only='))?.split('=')[1];

// Publish waves: each wave is an array of package names published concurrently.
// The order matches dependency relationships.
// copilotbrowser is a bundledDependency of copilotbrowser, so it does not
// need a separate publish wave.
const PUBLISH_WAVES = [
  ['copilotbrowser'],
  ['copilotbrowser'],
];

async function main() {
  const token = process.env.NPM_TOKEN;
  let npmrcPath;
  let npmrcOriginal;

  if (token) {
    // Write a temporary .npmrc so npm uses the provided token.
    npmrcPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.npmrc');
    npmrcOriginal = fs.existsSync(npmrcPath) ? fs.readFileSync(npmrcPath, 'utf8') : null;
    const tokenLine = `//registry.npmjs.org/:_authToken=${token}`;
    const existing = npmrcOriginal ?? '';
    if (!existing.includes(tokenLine))
      fs.writeFileSync(npmrcPath, existing + '\n' + tokenLine + '\n');
    console.log('✓ npm token configured from NPM_TOKEN env var');
  }

  const pkgByName = new Map(workspace.packages().map(p => [p.name, p]));

  try {
    for (const [waveIndex, wave] of PUBLISH_WAVES.entries()) {
      console.log(`\n── Wave ${waveIndex + 1}: ${wave.join(', ')} ──`);
      await Promise.all(wave.map(async name => {
        const pkg = pkgByName.get(name);
        if (!pkg) {
          console.error(`  ERROR: package "${name}" not found in workspace`);
          process.exit(1);
        }
        if (pkg.isPrivate) {
          console.log(`  SKIP ${name} (private)`);
          return;
        }
        if (ONLY && name !== ONLY) {
          console.log(`  SKIP ${name} (--only=${ONLY})`);
          return;
        }
        await publishPackage(pkg.path, name);
      }));
    }
    console.log('\n✓ All packages published successfully!');
  } finally {
    // Restore .npmrc if we modified it.
    if (npmrcPath && npmrcOriginal !== undefined) {
      if (npmrcOriginal === null)
        fs.unlinkSync(npmrcPath);
      else
        fs.writeFileSync(npmrcPath, npmrcOriginal);
    }
  }
}

/**
 * @param {string} pkgPath
 * @param {string} name
 */
async function publishPackage(pkgPath, name) {
  const args = ['publish', '--access', 'public', '--tag', TAG];
  if (DRY_RUN)
    args.push('--dry-run');

  console.log(`  ${DRY_RUN ? '[DRY RUN] ' : ''}npm ${args.join(' ')}  (${name})`);

  child_process.execSync(`npm ${args.join(' ')}`, {
    cwd: pkgPath,
    stdio: 'inherit',
    env: { ...process.env },
  });
  console.log(`  ✓ published ${name}`);
}

main().catch(err => {
  console.error('\nPublish failed:', err.message);
  process.exit(1);
});

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

// Suppress DEP0187 warning emitted by license-checker-rseidelsohn (v4.4.2)
// which passes undefined to fs.existsSync in its recursivelyCollectAllDependencies.
// This is a known upstream bug with no fix available; silence the noise so our
// CI stays warning-free.  See: https://github.com/nicedoc/license-checker-rseidelsohn
process.removeAllListeners('warning');
const originalEmitWarning = process.emitWarning;
process.emitWarning = function(warning, ...args) {
  if (typeof warning === 'string' && warning.includes('fs.existsSync'))
    return;
  if (args[0] === 'DeprecationWarning' && args[1] === 'DEP0187')
    return;
  // Handle the case where args[0] is an options object
  if (typeof args[0] === 'object' && args[0]?.code === 'DEP0187')
    return;
  return originalEmitWarning.call(process, warning, ...args);
};

const checker = require('license-checker-rseidelsohn');
const fs = require('fs');
const path = require('path');

async function checkDir(dir) {
  return await new Promise((f, r) => {
    checker.init({
      start: dir,
      production: true,
      customPath: {
        licenseText: '',
      }
    }, function(err, packages) {
      if (err)
        r(err);
      else
        f(packages);
    });
  });
}

(async () => {
  for (const project of ['copilotbrowser-core', 'copilotbrowser']) {
    const lines = [];
    lines.push(`microsoft/${project}

THIRD-PARTY SOFTWARE NOTICES AND INFORMATION

This project incorporates components from the projects listed below. The original copyright notices and the licenses under which Microsoft received such components are set forth below. Microsoft reserves all rights not expressly granted herein, whether by implication, estoppel or otherwise.
`);

    const allPackages = {};
    const projectDir = path.join(__dirname, '..', 'packages', project);
    const bundlesDir = path.join(projectDir, 'bundles');
    for (const bundle of fs.readdirSync(bundlesDir, { withFileTypes: true })) {
      if (!bundle.isDirectory())
        continue;
      const dir = path.join(bundlesDir, bundle.name);
      const packages = await checkDir(dir);
      for (const [key, value] of Object.entries(packages)) {
        if (value.licenseText)
          allPackages[key] = value;
      }
    }

    const packages = await checkDir('node_modules/codemirror');
    for (const [key, value] of Object.entries(packages)) {
      if (value.licenseText)
        allPackages[key] = value;
    }

    // fsevents is a darwin-only dependency that we do not bundle.
    const keys = Object.keys(allPackages).sort().filter(key => !key.startsWith('fsevents@'));
    for (const key of keys)
      lines.push(`-\t${key} (${allPackages[key].repository})`);

    for (const key of keys) {
      lines.push(`\n%% ${key} NOTICES AND INFORMATION BEGIN HERE`);
      lines.push(`=========================================`);
      lines.push(allPackages[key].licenseText);
      lines.push(`=========================================`);
      lines.push(`END OF ${key} AND INFORMATION`);
    }

    lines.push(`\nSUMMARY BEGIN HERE`);
    lines.push(`=========================================`);
    lines.push(`Total Packages: ${keys.length}`);
    lines.push(`=========================================`);
    lines.push(`END OF SUMMARY`);

    fs.writeFileSync(path.join(projectDir, 'ThirdPartyNotices.txt'), lines.join('\n').replace(/\r\n/g, '\n'));
  }
})();

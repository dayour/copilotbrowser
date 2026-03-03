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

const child_process = require('child_process');
const path = require('path');
const chokidar = require('chokidar');
const fs = require('fs');
const { workspace } = require('../workspace');
const { build, context } = require('esbuild');

/**
 * @typedef {{
 *   files: string,
 *   from: string,
 *   to: string,
 *   ignored?: string[],
 * }} CopyFile
 */

/**
 * @typedef {{
 *   inputs: string[],
 *   mustExist?: string[],
 *   cwd?: string,
 * }} BaseOnChange
 */

/**
 * @typedef {BaseOnChange & {
 *   command: string,
 *   args?: string[],
 * }} CommandOnChange
 */

/**
 * @typedef {BaseOnChange & {
 *   script: string,
 * }} ScriptOnChange
 */

/**
 * @typedef {CommandOnChange|ScriptOnChange} OnChange
 */

/** @type {(() => void)[]} */
const disposables = [];
/** @type {Step[]} */
const steps = [];
/** @type {OnChange[]} */
const onChanges = [];
/** @type {CopyFile[]} */
const copyFiles = [];

const watchMode = process.argv.slice(2).includes('--watch');
const withSourceMaps = watchMode;
const disableInstall = process.argv.slice(2).includes('--disable-install');
const ROOT = path.join(__dirname, '..', '..');

/**
 * @param {string} relative
 * @returns {string}
 */
function filePath(relative) {
  return path.join(ROOT, ...relative.split('/'));
}

/**
 * @param {string} path
 * @returns {string}
 */
function quotePath(path) {
  return "\"" + path + "\"";
}

class Step {
  /**
   * @param {{
   *   concurrent?: boolean,
   * }} options
   */
  constructor(options) {
    this.concurrent = options.concurrent;
  }

  async run() {
    throw new Error('Not implemented');
  }
}

/**
 * On Windows, npm/npx must be invoked via their .cmd shim when spawn is
 * called without `shell: true`.  This helper resolves the correct binary
 * name so we never need `shell: true` (which triggers DEP0190 in Node ≥22
 * when args are passed as an array).
 *
 * @param {string} command
 * @returns {string}
 */
function resolveCommand(command) {
  if (process.platform !== 'win32')
    return command;
  const lower = command.toLowerCase();
  if (lower === 'npm' || lower === 'npx')
    return command + '.cmd';
  return command;
}

class ProgramStep extends Step {
  /**
   * @param {{
   *   command: string,
   *   args: string[],
   *   shell: boolean,
   *   env?: NodeJS.ProcessEnv,
   *   cwd?: string,
   *   concurrent?: boolean,
   * }} options
   */
  constructor(options) {
    super(options);
    this._options = options;
  }

  /** @override */
  async run() {
    const step = this._options;
    const command = resolveCommand(step.command);
    console.log(`==== Running ${step.command} ${step.args.join(' ')} in ${step.cwd || process.cwd()}`);

    // On Windows, .cmd shims (npm.cmd, npx.cmd) require shell: true.
    // To avoid DEP0190 (Node ≥22 warns when args array + shell: true), we
    // join the args into the command string so spawn receives a single
    // string command with no separate args array.
    const needsShell = process.platform === 'win32' ? command.endsWith('.cmd') : !!step.shell;
    const spawnArgs = needsShell ? [] : step.args;
    const spawnCommand = needsShell ? [command, ...step.args].join(' ') : command;

    const child = child_process.spawn(spawnCommand, spawnArgs, {
      stdio: 'inherit',
      shell: needsShell,
      env: {
        ...process.env,
        ...step.env
      },
      cwd: step.cwd,
    });
    disposables.push(() => {
      if (child.exitCode === null)
        child.kill();
    });
    return new Promise((resolve, reject) => {
      child.on('close', (code, signal) => {
        if (code || signal)
          reject(new Error(`'${step.command} ${step.args.join(' ')}' exited with code ${code}, signal ${signal}`));
        else
          resolve({ });
      });
    });
  }
}

/**
 * @param {OnChange} onChange
 */
async function runOnChangeStep(onChange) {
  const step = ('script' in onChange)
    ? new ProgramStep({ command: 'node', args: [filePath(onChange.script)], shell: false })
    : new ProgramStep({ command: onChange.command, args: onChange.args || [], shell: false, cwd: onChange.cwd });
  await step.run();
}

async function runWatch() {
  /** @param {OnChange} onChange */
  function runOnChange(onChange) {
    const paths = onChange.inputs;
    const mustExist = onChange.mustExist || [];
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let timeout;
    function callback() {
      timeout = undefined;
      for (const fileMustExist of mustExist) {
        if (!fs.existsSync(filePath(fileMustExist)))
          return;
      }
      runOnChangeStep(onChange).catch(e => console.error(e));
    }
    // chokidar will report all files as added in a sync loop, throttle those.
    const reschedule = () => {
      if (timeout)
        clearTimeout(timeout);
      timeout = setTimeout(callback, 500);
    };
    chokidar.watch([...paths, ...mustExist, /** @type {ScriptOnChange} */ (onChange).script].filter(Boolean).map(filePath)).on('all', reschedule);
    callback();
  }

  for (const { files, from, to, ignored } of copyFiles) {
    // Initial copy of existing files using globSync (chokidar v5 dropped glob support).
    const resolved = fs.globSync(filePath(files), { exclude: ignored });
    for (const file of resolved)
      copyFile(file, from, to);
    // Watch the source directory for new/changed files.
    const watcher = chokidar.watch(resolved.length ? resolved : [filePath(from)], { ignored });
    watcher.on('all', (event, file) => {
      copyFile(file, from, to);
    });
  }

  for (const step of steps) {
    if (!step.concurrent)
      await step.run();
  }

  for (const step of steps) {
    if (step.concurrent)
      step.run().catch(e => console.error(e));
  }
  for (const onChange of onChanges)
    runOnChange(onChange);
}

async function runBuild() {
  for (const { files, from, to, ignored } of copyFiles) {
    const resolved = fs.globSync(filePath(files), { exclude: ignored });
    for (const file of resolved)
      copyFile(file, from, to);
  }

  // Run non-concurrent (sequential) steps first — these include npm ci,
  // code-generation, and other prerequisites that must complete in order.
  for (const step of steps) {
    if (!step.concurrent)
      await step.run();
  }

  // Run concurrent steps (esbuild, vite) in parallel.
  const concurrentSteps = steps.filter(s => s.concurrent);
  if (concurrentSteps.length > 0) {
    console.log(`==== Running ${concurrentSteps.length} concurrent build steps in parallel`);
    const start = Date.now();
    await Promise.all(concurrentSteps.map(s => s.run()));
    console.log(`==== All concurrent steps finished in ${Date.now() - start} ms`);
  }

  for (const onChange of onChanges)
    await runOnChangeStep(onChange);
}

/**
 * @param {string} file
 * @param {string} from
 * @param {string} to
 */
function copyFile(file, from, to) {
  const destination = path.resolve(filePath(to), path.relative(filePath(from), file));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(file, destination);
}

/**
 * @typedef {{
 *   modulePath: string,
 *   entryPoints: string[],
 *   external?: string[],
 *   outdir?: string,
 *   outfile?: string,
 *   minify?: boolean,
 *   alias?: Record<string, string>,
 *   skipNpmCi?: boolean,
 * }} BundleOptions
 */

/** @type {BundleOptions[]} */
const bundles = [];

bundles.push({
  modulePath: 'packages/copilotbrowser/bundles/babel',
  outdir: 'packages/copilotbrowser/lib/transform',
  entryPoints: ['src/babelBundleImpl.ts'],
  external: ['copilotbrowser'],
});

bundles.push({
  modulePath: 'packages/copilotbrowser/bundles/expect',
  outdir: 'packages/copilotbrowser/lib/common',
  entryPoints: ['src/expectBundleImpl.ts'],
});

bundles.push({
  modulePath: 'packages/copilotbrowser/bundles/utils',
  outdir: 'packages/copilotbrowser/lib',
  entryPoints: ['src/utilsBundleImpl.ts'],
  external: ['fsevents'],
});

bundles.push({
  modulePath: 'packages/copilotbrowser/bundles/utils',
  outfile: 'packages/copilotbrowser/lib/utilsBundleImpl/index.js',
  entryPoints: ['src/utilsBundleImpl.ts'],
});

bundles.push({
  modulePath: 'packages/copilotbrowser/bundles/zip',
  outdir: 'packages/copilotbrowser/lib',
  entryPoints: ['src/zipBundleImpl.ts'],
});

bundles.push({
  modulePath: 'packages/copilotbrowser/bundles/mcp',
  outfile: 'packages/copilotbrowser/lib/mcpBundleImpl/index.js',
  entryPoints: ['src/mcpBundleImpl.ts'],
  external: ['express', '@anthropic-ai/sdk'],
  alias: {
    'raw-body': 'raw-body.ts',
  },
});

// Client web bundle (formerly @copilotbrowser/client)
bundles.push({
  modulePath: 'packages/copilotbrowser',
  outfile: 'packages/copilotbrowser/lib/clientWebBundle.js',
  entryPoints: ['src/client-web/index.ts'],
  minify: false,
  skipNpmCi: true,
});

class GroupStep extends Step {
  /** @param {Step[]} steps */
  constructor(steps) {
    super({ concurrent: false });
    this._steps = steps;
    if (steps.some(s => !s.concurrent))
      throw new Error('Composite step cannot contain non-concurrent steps');
  }
  async run() {
    console.log('==== Starting parallel group');
    const start = Date.now();
    await Promise.all(this._steps.map(step => step.run()));
    console.log('==== Parallel group finished in', Date.now() - start, 'ms');
  }
}

/** @type {Step[]} */
const updateSteps = [];

// Update test runner (skip if tests/ directory is excluded, e.g. in Docker).
const testRunnerCwd = path.join(__dirname, '..', '..', 'tests', 'copilotbrowser-test', 'stable-test-runner');
if (fs.existsSync(path.join(testRunnerCwd, 'package.json'))) {
  steps.push(new ProgramStep({
    command: 'npm',
    args: ['ci', '--save=false', '--fund=false', '--audit=false'],
    shell: true,
    cwd: testRunnerCwd,
  }));
}

// Update bundles (deduplicate by modulePath; run sequentially to avoid Windows EBUSY).
const seenModulePaths = new Set();
for (const bundle of bundles) {
  // Skip npm ci for bundles that have no dependencies of their own.
  if (bundle.skipNpmCi)
    continue;

  if (seenModulePaths.has(bundle.modulePath))
    continue;
  seenModulePaths.add(bundle.modulePath);

  const packageJson = path.join(filePath(bundle.modulePath), 'package.json');
  if (!fs.existsSync(packageJson))
    throw new Error(`${packageJson} does not exist`);
  steps.push(new ProgramStep({
    command: 'npm',
    args: ['ci', '--save=false', '--fund=false', '--audit=false', '--omit=optional'],
    shell: true,
    cwd: filePath(bundle.modulePath),
  }));
}

// Generate third party licenses for bundles.
steps.push(new ProgramStep({
  command: 'node',
  args: [path.resolve(__dirname, '../generate_third_party_notice.js')],
  shell: true,
}));

// Build injected icons.
steps.push(new ProgramStep({
  command: 'node',
  args: ['utils/generate_clip_paths.js'],
  shell: true,
}));

// Build injected scripts.
steps.push(new ProgramStep({
  command: 'node',
  args: ['utils/generate_injected.js'],
  shell: true,
}));

class EsbuildStep extends Step {
  /**
   * @param {import('esbuild').BuildOptions} options
   */
  constructor(options) {
    // Esbuild steps run concurrently; they are batched together via
    // runBuild()/runWatch() so that all sequential prerequisites
    // (npm ci, code-gen, etc.) complete first.
    super({ concurrent: true });
    this._options = options;
  }

  /** @override */
  async run() {
    if (watchMode) {
      await this._ensureWatching();
    } else {
      console.log('==== Running esbuild:', this._relativeEntryPoints().join(', '));
      const start = Date.now();
      await build(this._options);
      console.log('==== Done in', Date.now() - start, 'ms');
    }
  }

  async _ensureWatching() {
    const start = Date.now();
    if (this._context)
      return;
    this._context = await context(this._options);
    disposables.push(() => this._context?.dispose());

    const watcher = chokidar.watch(/** @type {string[]} */ (this._options.entryPoints));
    await new Promise(x => watcher.once('ready', /** @type {any} */ (x)));
    watcher.on('all', () => this._rebuild());

    await this._rebuild();
    console.log('==== Esbuild watching:', this._relativeEntryPoints().join(', '), `(started in ${Date.now() - start}ms)`);
  }

  async _rebuild() {
    if (this._rebuilding) {
      this._sourcesChanged = true;
      return;
    }
    do {
      this._sourcesChanged = false;
      this._rebuilding = true;
      try {
        await this._context?.rebuild();
      } catch (e) {
        // Ignore. Esbuild inherits stderr and already logs nicely formatted errors
        // before throwing.
      }

      this._rebuilding = false;
    } while (this._sourcesChanged);
  }

  _relativeEntryPoints() {
    return /** @type {string[]} */ (this._options.entryPoints).map((/** @type {string} */ e) => path.relative(ROOT, e));
  }
}

class CustomCallbackStep extends Step {
  /** @param {() => void | Promise<void>} callback */
  constructor(callback) {
    super({ concurrent: false });
    this._callback = callback;
  }

  async run() {
    await this._callback();
  }
}

// Run esbuild.
for (const pkg of workspace.packages()) {
  if (!fs.existsSync(path.join(pkg.path, 'src')))
    continue;

  steps.push(new EsbuildStep({
    entryPoints: [path.join(pkg.path, 'src/**/*.ts')],
    outdir: `${path.join(pkg.path, 'lib')}`,
    sourcemap: withSourceMaps ? 'linked' : false,
    platform: 'node',
    format: 'cjs',
  }));
}

function copyXdgOpen() {
  const outdir = filePath('packages/copilotbrowser/lib/utilsBundleImpl');
  if (!fs.existsSync(outdir))
    fs.mkdirSync(outdir, { recursive: true });

  // 'open' package requires 'xdg-open' binary to be present, which does not get bundled by esbuild.
  const xdgOpenPath = filePath('packages/copilotbrowser/bundles/utils/node_modules/open/xdg-open');
  if (fs.existsSync(xdgOpenPath)) {
    fs.copyFileSync(xdgOpenPath, path.join(outdir, 'xdg-open'));
    console.log('==== Copied xdg-open to', path.join(outdir, 'xdg-open'));
  } else {
    console.log('==== Skipping xdg-open copy (not present on this platform)');
  }
}

// Copy xdg-open after bundles 'npm ci' has finished.
steps.push(new CustomCallbackStep(copyXdgOpen));

/** @param {string} p */
function pkgNameFromPath(p) {
  const i = p.split(path.sep);
  const nm = i.lastIndexOf('node_modules');
  if (nm === -1 || nm + 1 >= i.length) return null;
  const first = i[nm + 1];
  if (first.startsWith('@')) return nm + 2 < i.length ? `${first}/${i[nm + 2]}` : null;
  return first;
}

const pkgSizePlugin = {
  name: 'pkg-size',
  /** @param {import('esbuild').PluginBuild} build */
  setup(build) {
    build.onEnd(async (/** @type {import('esbuild').BuildResult} */ result) => {
      if (!result.metafile) return;
      const totals = new Map();
      for (const out of Object.values(result.metafile.outputs)) {
        for (const [inFile, meta] of Object.entries(out.inputs)) {
          const pkg = pkgNameFromPath(inFile);
          if (!pkg) continue;
          totals.set(pkg, (totals.get(pkg) || 0) + (meta.bytesInOutput || 0));
        }
      }
      const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
      const sum = sorted.reduce((s, [, v]) => s + v, 0) || 1;
      console.log('\nPackage contribution to bundle:');
      for (const [pkg, bytes] of sorted.slice(0, 30)) {
        const pct = ((bytes / sum) * 100).toFixed(2);
        console.log(`${pkg.padEnd(30)} ${(bytes / 1024).toFixed(1)} KB  ${pct}%`);
      }
    });
  },
};

// Build/watch bundles.
for (const bundle of bundles) {
  /** @type {import('esbuild').BuildOptions} */
  const options = {
    bundle: true,
    format: 'cjs',
    platform: 'node',
    target: 'ES2019',
    sourcemap: watchMode,
    minify: !watchMode,

    entryPoints: bundle.entryPoints.map(e => path.join(filePath(bundle.modulePath), e)),
    ...(bundle.outdir ? { outdir: filePath(bundle.outdir) } : {}),
    ...(bundle.outfile ? { outfile: filePath(bundle.outfile) } : {}),
    ...(bundle.external ? { external: bundle.external } : {}),
    ...(bundle.minify !== undefined ? { minify: bundle.minify } : {}),
    alias: bundle.alias ? Object.fromEntries(Object.entries(bundle.alias).map(([k, v]) => [k, path.join(filePath(bundle.modulePath), v)])) : undefined,
    metafile: true,
    plugins: [pkgSizePlugin],
  };
  steps.push(new EsbuildStep(options));
}

// Build/watch trace viewer service worker.
steps.push(new ProgramStep({
  command: 'npx',
  args: [
    'vite',
    '--config',
    'vite.sw.config.ts',
    'build',
    ...(watchMode ? ['--watch', '--minify=false'] : []),
    ...(withSourceMaps ? ['--sourcemap=inline'] : []),
  ],
  shell: true,
  cwd: path.join(__dirname, '..', '..', 'packages', 'trace-viewer'),
  concurrent: true,
}));

// Build/watch web packages.
for (const webPackage of ['html-reporter', 'recorder', 'trace-viewer', 'devtools']) {
  steps.push(new ProgramStep({
    command: 'npx',
    args: [
      'vite',
      'build',
      ...(watchMode ? ['--watch', '--minify=false'] : []),
      ...(withSourceMaps ? ['--sourcemap=inline'] : []),
      '--clearScreen=false',
    ],
    shell: true,
    cwd: path.join(__dirname, '..', '..', 'packages', webPackage),
    concurrent: true,
  }));
}

// Generate CLI help.
onChanges.push({
  inputs: [
    'packages/copilotbrowser/src/mcp/terminal/commands.ts',
    'packages/copilotbrowser/src/mcp/terminal/helpGenerator.ts',
    'utils/generate_cli_help.js',
  ],
  script: 'utils/generate_cli_help.js',
});

// Generate injected.
onChanges.push({
  inputs: [
    'packages/injected/src/**',
    'packages/copilotbrowser/src/third_party/**',
    'packages/copilotbrowser/src/ct/injected/**',
    'packages/copilotbrowser/src/utils/isomorphic/**',
    'utils/generate_injected_builtins.js',
    'utils/generate_injected.js',
  ],
  script: 'utils/generate_injected.js',
});

// Generate channels.
onChanges.push({
  inputs: [
    'packages/protocol/src/protocol.yml'
  ],
  script: 'utils/generate_channels.js',
});

// Generate types.
onChanges.push({
  inputs: [
    'docs/src/api/',
    'docs/src/test-api/',
    'docs/src/test-reporter-api/',
    'utils/generate_types/overrides.d.ts',
    'utils/generate_types/overrides-test.d.ts',
    'utils/generate_types/overrides-testReporter.d.ts',
    'utils/generate_types/exported.json',
    'packages/copilotbrowser/src/server/chromium/protocol.d.ts',
  ],
  mustExist: [
    'packages/copilotbrowser/lib/server/deviceDescriptorsSource.json',
  ],
  script: 'utils/generate_types/index.js',
});

if (watchMode && !disableInstall) {
  // Keep browser installs up to date.
  onChanges.push({
    inputs: ['packages/copilotbrowser/browsers.json'],
    command: 'npx',
    args: ['copilotbrowser', 'install'],
  });
}

// The recorder and trace viewer have an app_icon.png that needs to be copied.
copyFiles.push({
  files: 'packages/copilotbrowser/src/server/chromium/*.png',
  from: 'packages/copilotbrowser/src',
  to: 'packages/copilotbrowser/lib',
});

// esbuild doesn't touch JS files, so copy them manually.
// For example: diff_match_patch.js
copyFiles.push({
  files: 'packages/copilotbrowser/src/**/*.js',
  from: 'packages/copilotbrowser/src',
  to: 'packages/copilotbrowser/lib',
  ignored: ['**/.eslintrc.js', '**/injected/**/*']
});

// Sometimes we require JSON files that esbuild ignores.
// For example, deviceDescriptorsSource.json
copyFiles.push({
  files: 'packages/copilotbrowser/src/**/*.json',
  ignored: ['**/injected/**/*'],
  from: 'packages/copilotbrowser/src',
  to: 'packages/copilotbrowser/lib',
});


copyFiles.push({
  files: 'packages/copilotbrowser/src/agents/*.md',
  from: 'packages/copilotbrowser/src',
  to: 'packages/copilotbrowser/lib',
});

copyFiles.push({
  files: 'packages/copilotbrowser/src/agents/*.yml',
  from: 'packages/copilotbrowser/src',
  to: 'packages/copilotbrowser/lib',
});

copyFiles.push({
  files: 'packages/copilotbrowser/src/skill/**/*.md',
  from: 'packages/copilotbrowser/src',
  to: 'packages/copilotbrowser/lib',
});

copyFiles.push({
  files: 'packages/copilotbrowser/src/cli/client/*.{png,ico}',
  from: 'packages/copilotbrowser/src',
  to: 'packages/copilotbrowser/lib',
});

if (watchMode) {
  // Run TypeScript for type checking.
  steps.push(new ProgramStep({
    command: 'npx',
    args: ['tsc', ...(watchMode ? ['-w'] : []), '--preserveWatchOutput', '-p', filePath('.')],
    shell: true,
    concurrent: true,
  }));
  for (const webPackage of ['html-reporter', 'recorder', 'trace-viewer', 'devtools']) {
    steps.push(new ProgramStep({
      command: 'npx',
      args: ['tsc', ...(watchMode ? ['-w'] : []), '--preserveWatchOutput', '-p', filePath(`packages/${webPackage}`)],
      shell: true,
      concurrent: true,
    }));
  }
}

let cleanupCalled = false;
function cleanup() {
  if (cleanupCalled)
    return;
  cleanupCalled = true;
  for (const disposable of disposables) {
    try {
      disposable();
    } catch (e) {
      console.error('Error during cleanup:', e);
    }
  }
}
process.on('exit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});


watchMode ? runWatch() : runBuild();

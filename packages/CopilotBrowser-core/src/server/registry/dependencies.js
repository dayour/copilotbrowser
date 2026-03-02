"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeDockerVersion = writeDockerVersion;
exports.dockerVersion = dockerVersion;
exports.readDockerVersionSync = readDockerVersionSync;
exports.installDependenciesWindows = installDependenciesWindows;
exports.installDependenciesLinux = installDependenciesLinux;
exports.validateDependenciesWindows = validateDependenciesWindows;
exports.validateDependenciesLinux = validateDependenciesLinux;
exports.transformCommandsForRoot = transformCommandsForRoot;
const childProcess = __importStar(require("child_process"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const nativeDeps_1 = require("./nativeDeps");
const ascii_1 = require("../utils/ascii");
const hostPlatform_1 = require("../utils/hostPlatform");
const spawnAsync_1 = require("../utils/spawnAsync");
const userAgent_1 = require("../utils/userAgent");
const _1 = require(".");
const BIN_DIRECTORY = path_1.default.join(__dirname, '..', '..', '..', 'bin');
const languageBindingVersion = process.env.PW_CLI_DISPLAY_VERSION || require('../../../package.json').version;
const dockerVersionFilePath = '/ms-copilotbrowser/.docker-info';
async function writeDockerVersion(dockerImageNameTemplate) {
    await fs_1.default.promises.mkdir(path_1.default.dirname(dockerVersionFilePath), { recursive: true });
    await fs_1.default.promises.writeFile(dockerVersionFilePath, JSON.stringify(dockerVersion(dockerImageNameTemplate), null, 2), 'utf8');
    // Make sure version file is globally accessible.
    await fs_1.default.promises.chmod(dockerVersionFilePath, 0o777);
}
function dockerVersion(dockerImageNameTemplate) {
    return {
        driverVersion: languageBindingVersion,
        dockerImageName: dockerImageNameTemplate.replace('%version%', languageBindingVersion),
    };
}
function readDockerVersionSync() {
    try {
        const data = JSON.parse(fs_1.default.readFileSync(dockerVersionFilePath, 'utf8'));
        return {
            ...data,
            dockerImageNameTemplate: data.dockerImageName.replace(data.driverVersion, '%version%'),
        };
    }
    catch (e) {
        return null;
    }
}
const checkExecutable = (filePath) => {
    if (process.platform === 'win32')
        return filePath.endsWith('.exe');
    return fs_1.default.promises.access(filePath, fs_1.default.constants.X_OK).then(() => true).catch(() => false);
};
function isSupportedWindowsVersion() {
    if (os_1.default.platform() !== 'win32' || os_1.default.arch() !== 'x64')
        return false;
    const [major, minor] = os_1.default.release().split('.').map(token => parseInt(token, 10));
    // This is based on: https://stackoverflow.com/questions/42524606/how-to-get-windows-version-using-node-js/44916050#44916050
    // The table with versions is taken from: https://docs.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-osversioninfoexw#remarks
    // Windows 7 is not supported and is encoded as `6.1`.
    return major > 6 || (major === 6 && minor > 1);
}
async function installDependenciesWindows(targets, dryRun) {
    if (targets.has('chromium')) {
        const command = 'powershell.exe';
        const args = ['-ExecutionPolicy', 'Bypass', '-File', path_1.default.join(BIN_DIRECTORY, 'install_media_pack.ps1')];
        if (dryRun) {
            console.log(`${command} ${quoteProcessArgs(args).join(' ')}`); // eslint-disable-line no-console
            return;
        }
        const { code } = await (0, spawnAsync_1.spawnAsync)(command, args, { cwd: BIN_DIRECTORY, stdio: 'inherit' });
        if (code !== 0)
            throw new Error('Failed to install windows dependencies!');
    }
}
async function installDependenciesLinux(targets, dryRun) {
    const libraries = [];
    const platform = hostPlatform_1.hostPlatform;
    if (!hostPlatform_1.isOfficiallySupportedPlatform)
        console.warn(`BEWARE: your OS is not officially supported by copilotbrowser; installing dependencies for ${platform} as a fallback.`); // eslint-disable-line no-console
    for (const target of targets) {
        const info = nativeDeps_1.deps[platform];
        if (!info) {
            console.warn(`Cannot install dependencies for ${platform} with copilotbrowser ${(0, userAgent_1.getcopilotbrowserVersion)()}!`); // eslint-disable-line no-console
            return;
        }
        libraries.push(...info[target]);
    }
    const uniqueLibraries = Array.from(new Set(libraries));
    if (!dryRun)
        console.log(`Installing dependencies...`); // eslint-disable-line no-console
    const commands = [];
    commands.push('apt-get update');
    commands.push(['apt-get', 'install', '-y', '--no-install-recommends',
        ...uniqueLibraries,
    ].join(' '));
    const { command, args, elevatedPermissions } = await transformCommandsForRoot(commands);
    if (dryRun) {
        console.log(`${command} ${quoteProcessArgs(args).join(' ')}`); // eslint-disable-line no-console
        return;
    }
    if (elevatedPermissions)
        console.log('Switching to root user to install dependencies...'); // eslint-disable-line no-console
    const child = childProcess.spawn(command, args, { stdio: 'inherit' });
    await new Promise((resolve, reject) => {
        child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`Installation process exited with code: ${code}`)));
        child.on('error', reject);
    });
}
async function validateDependenciesWindows(sdkLanguage, windowsExeAndDllDirectories) {
    const directoryPaths = windowsExeAndDllDirectories;
    const lddPaths = [];
    for (const directoryPath of directoryPaths)
        lddPaths.push(...(await executablesOrSharedLibraries(directoryPath)));
    const allMissingDeps = await Promise.all(lddPaths.map(lddPath => missingFileDependenciesWindows(sdkLanguage, lddPath)));
    const missingDeps = new Set();
    for (const deps of allMissingDeps) {
        for (const dep of deps)
            missingDeps.add(dep);
    }
    if (!missingDeps.size)
        return;
    let isCrtMissing = false;
    let isMediaFoundationMissing = false;
    for (const dep of missingDeps) {
        if (dep.startsWith('api-ms-win-crt') || dep === 'vcruntime140.dll' || dep === 'vcruntime140_1.dll' || dep === 'msvcp140.dll')
            isCrtMissing = true;
        else if (dep === 'mf.dll' || dep === 'mfplat.dll' || dep === 'msmpeg2vdec.dll' || dep === 'evr.dll' || dep === 'avrt.dll')
            isMediaFoundationMissing = true;
    }
    const details = [];
    if (isCrtMissing) {
        details.push(`Some of the Universal C Runtime files cannot be found on the system. You can fix`, `that by installing Microsoft Visual C++ Redistributable for Visual Studio from:`, `https://support.microsoft.com/en-us/help/2977003/the-latest-supported-visual-c-downloads`, ``);
    }
    if (isMediaFoundationMissing) {
        details.push(`Some of the Media Foundation files cannot be found on the system. If you are`, `on Windows Server try fixing this by running the following command in PowerShell`, `as Administrator:`, ``, `    Install-WindowsFeature Server-Media-Foundation`, ``, `For Windows N editions visit:`, `https://support.microsoft.com/en-us/help/3145500/media-feature-pack-list-for-windows-n-editions`, ``);
    }
    details.push(`Full list of missing libraries:`, `    ${[...missingDeps].join('\n    ')}`, ``);
    const message = `Host system is missing dependencies!\n\n${details.join('\n')}`;
    if (isSupportedWindowsVersion()) {
        throw new Error(message);
    }
    else {
        // eslint-disable-next-line no-console
        console.warn(`WARNING: running on unsupported windows version!`);
        // eslint-disable-next-line no-console
        console.warn(message);
    }
}
async function validateDependenciesLinux(sdkLanguage, linuxLddDirectories, dlOpenLibraries) {
    const directoryPaths = linuxLddDirectories;
    const lddPaths = [];
    for (const directoryPath of directoryPaths)
        lddPaths.push(...(await executablesOrSharedLibraries(directoryPath)));
    const missingDepsPerFile = await Promise.all(lddPaths.map(lddPath => missingFileDependencies(lddPath, directoryPaths)));
    const missingDeps = new Set();
    for (const deps of missingDepsPerFile) {
        for (const dep of deps)
            missingDeps.add(dep);
    }
    for (const dep of (await missingDLOPENLibraries(dlOpenLibraries)))
        missingDeps.add(dep);
    if (!missingDeps.size)
        return;
    const allMissingDeps = new Set(missingDeps);
    // Check Ubuntu version.
    const missingPackages = new Set();
    const libraryToPackageNameMapping = nativeDeps_1.deps[hostPlatform_1.hostPlatform] ? {
        ...(nativeDeps_1.deps[hostPlatform_1.hostPlatform]?.lib2package || {}),
        ...MANUAL_LIBRARY_TO_PACKAGE_NAME_UBUNTU,
    } : {};
    // Translate missing dependencies to package names to install with apt.
    for (const missingDep of missingDeps) {
        const packageName = libraryToPackageNameMapping[missingDep];
        if (packageName) {
            missingPackages.add(packageName);
            missingDeps.delete(missingDep);
        }
    }
    const maybeSudo = process.getuid?.() && os_1.default.platform() !== 'win32' ? 'sudo ' : '';
    const dockerInfo = readDockerVersionSync();
    const errorLines = [
        `Host system is missing dependencies to run browsers.`,
    ];
    // Ignore patch versions when comparing docker container version and copilotbrowser version:
    // we **NEVER** roll browsers in patch releases, so native dependencies do not change.
    if (dockerInfo && !dockerInfo.driverVersion.startsWith((0, userAgent_1.getcopilotbrowserVersion)(true /* majorMinorOnly */) + '.')) {
        // We are running in a docker container with unmatching version.
        // In this case, we know how to install dependencies in it.
        const pwVersion = (0, userAgent_1.getcopilotbrowserVersion)();
        const requiredDockerImage = dockerInfo.dockerImageName.replace(dockerInfo.driverVersion, pwVersion);
        errorLines.push(...[
            `This is most likely due to Docker image version not matching copilotbrowser version:`,
            `- copilotbrowser  : ${pwVersion}`,
            `- Docker image: ${dockerInfo.driverVersion}`,
            ``,
            `Either:`,
            `- (recommended) use Docker image "${requiredDockerImage}"`,
            `- (alternative 1) run the following command inside Docker to install missing dependencies:`,
            ``,
            `    ${maybeSudo}${(0, _1.buildcopilotbrowserCLICommand)(sdkLanguage, 'install-deps')}`,
            ``,
            `- (alternative 2) use apt inside Docker:`,
            ``,
            `    ${maybeSudo}apt-get install ${[...missingPackages].join('\\\n        ')}`,
            ``,
            `<3 copilotbrowser Team`,
        ]);
    }
    else if (missingPackages.size && !missingDeps.size) {
        // Only known dependencies are missing for browsers.
        // Suggest installation with a copilotbrowser CLI.
        errorLines.push(...[
            `Please install them with the following command:`,
            ``,
            `    ${maybeSudo}${(0, _1.buildcopilotbrowserCLICommand)(sdkLanguage, 'install-deps')}`,
            ``,
            `Alternatively, use apt:`,
            `    ${maybeSudo}apt-get install ${[...missingPackages].join('\\\n        ')}`,
            ``,
            `<3 copilotbrowser Team`,
        ]);
    }
    else {
        // Unhappy path: we either run on unknown distribution, or we failed to resolve all missing
        // libraries to package names.
        // Print missing libraries only:
        errorLines.push(...[
            `Missing libraries:`,
            ...[...allMissingDeps].map(dep => '    ' + dep),
        ]);
    }
    throw new Error('\n' + (0, ascii_1.wrapInASCIIBox)(errorLines.join('\n'), 1));
}
function isSharedLib(basename) {
    switch (os_1.default.platform()) {
        case 'linux':
            return basename.endsWith('.so') || basename.includes('.so.');
        case 'win32':
            return basename.endsWith('.dll');
        default:
            return false;
    }
}
async function executablesOrSharedLibraries(directoryPath) {
    if (!fs_1.default.existsSync(directoryPath))
        return [];
    const allPaths = (await fs_1.default.promises.readdir(directoryPath)).map(file => path_1.default.resolve(directoryPath, file));
    const allStats = await Promise.all(allPaths.map(aPath => fs_1.default.promises.stat(aPath)));
    const filePaths = allPaths.filter((aPath, index) => allStats[index].isFile());
    const executablersOrLibraries = (await Promise.all(filePaths.map(async (filePath) => {
        const basename = path_1.default.basename(filePath).toLowerCase();
        if (isSharedLib(basename))
            return filePath;
        if (await checkExecutable(filePath))
            return filePath;
        return false;
    }))).filter(Boolean);
    return executablersOrLibraries;
}
async function missingFileDependenciesWindows(sdkLanguage, filePath) {
    const executable = _1.registry.findExecutable('winldd').executablePathOrDie(sdkLanguage);
    const dirname = path_1.default.dirname(filePath);
    const { stdout, code } = await (0, spawnAsync_1.spawnAsync)(executable, [filePath], {
        cwd: dirname,
        env: {
            ...process.env,
            LD_LIBRARY_PATH: process.env.LD_LIBRARY_PATH ? `${process.env.LD_LIBRARY_PATH}:${dirname}` : dirname,
        },
    });
    if (code !== 0)
        return [];
    const missingDeps = stdout.split('\n').map(line => line.trim()).filter(line => line.endsWith('not found') && line.includes('=>')).map(line => line.split('=>')[0].trim().toLowerCase());
    return missingDeps;
}
async function missingFileDependencies(filePath, extraLDPaths) {
    const dirname = path_1.default.dirname(filePath);
    let LD_LIBRARY_PATH = extraLDPaths.join(':');
    if (process.env.LD_LIBRARY_PATH)
        LD_LIBRARY_PATH = `${process.env.LD_LIBRARY_PATH}:${LD_LIBRARY_PATH}`;
    const { stdout, code } = await (0, spawnAsync_1.spawnAsync)('ldd', [filePath], {
        cwd: dirname,
        env: {
            ...process.env,
            LD_LIBRARY_PATH,
        },
    });
    if (code !== 0)
        return [];
    const missingDeps = stdout.split('\n').map(line => line.trim()).filter(line => line.endsWith('not found') && line.includes('=>')).map(line => line.split('=>')[0].trim());
    return missingDeps;
}
async function missingDLOPENLibraries(libraries) {
    if (!libraries.length)
        return [];
    // NOTE: Using full-qualified path to `ldconfig` since `/sbin` is not part of the
    // default PATH in CRON.
    // @see https://github.com/dayour/copilotbrowser/issues/3397
    const { stdout, code, error } = await (0, spawnAsync_1.spawnAsync)('/sbin/ldconfig', ['-p'], {});
    if (code !== 0 || error)
        return [];
    const isLibraryAvailable = (library) => stdout.toLowerCase().includes(library.toLowerCase());
    return libraries.filter(library => !isLibraryAvailable(library));
}
const MANUAL_LIBRARY_TO_PACKAGE_NAME_UBUNTU = {
    // libgstlibav.so (the only actual library provided by gstreamer1.0-libav) is not
    // in the ldconfig cache, so we detect the actual library required for playing h.264
    // and if it's missing recommend installing missing gstreamer lib.
    // gstreamer1.0-libav -> libavcodec57 -> libx264-152
    'libx264.so': 'gstreamer1.0-libav',
};
function quoteProcessArgs(args) {
    return args.map(arg => {
        if (arg.includes(' '))
            return `"${arg}"`;
        return arg;
    });
}
async function transformCommandsForRoot(commands) {
    const isRoot = process.getuid?.() === 0;
    if (isRoot)
        return { command: 'sh', args: ['-c', `${commands.join('&& ')}`], elevatedPermissions: false };
    const sudoExists = await (0, spawnAsync_1.spawnAsync)('which', ['sudo']);
    if (sudoExists.code === 0)
        return { command: 'sudo', args: ['--', 'sh', '-c', `${commands.join('&& ')}`], elevatedPermissions: true };
    return { command: 'su', args: ['root', '-c', `${commands.join('&& ')}`], elevatedPermissions: true };
}

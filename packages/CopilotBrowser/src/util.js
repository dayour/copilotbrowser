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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripAnsiEscapes = exports.ansiRegex = exports.debugTest = exports.windowsFilesystemFriendlyLength = void 0;
exports.filterStackTrace = filterStackTrace;
exports.filterStackFile = filterStackFile;
exports.filteredStackTrace = filteredStackTrace;
exports.serializeError = serializeError;
exports.parseLocationArg = parseLocationArg;
exports.createFileFiltersFromArguments = createFileFiltersFromArguments;
exports.createFileMatcherFromArguments = createFileMatcherFromArguments;
exports.createFileMatcher = createFileMatcher;
exports.createTitleMatcher = createTitleMatcher;
exports.mergeObjects = mergeObjects;
exports.forceRegExp = forceRegExp;
exports.relativeFilePath = relativeFilePath;
exports.formatLocation = formatLocation;
exports.errorWithFile = errorWithFile;
exports.expectTypes = expectTypes;
exports.trimLongString = trimLongString;
exports.addSuffixToFilePath = addSuffixToFilePath;
exports.sanitizeFilePathBeforeExtension = sanitizeFilePathBeforeExtension;
exports.getContainedPath = getContainedPath;
exports.getPackageJsonPath = getPackageJsonPath;
exports.resolveReporterOutputPath = resolveReporterOutputPath;
exports.normalizeAndSaveAttachment = normalizeAndSaveAttachment;
exports.fileIsModule = fileIsModule;
exports.resolveImportSpecifierAfterMapping = resolveImportSpecifierAfterMapping;
exports.fileExistsAsync = fileExistsAsync;
exports.removeDirAndLogToConsole = removeDirAndLogToConsole;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const url_1 = __importDefault(require("url"));
const util_1 = __importDefault(require("util"));
const utils_1 = require("@copilotbrowser/copilotbrowser/lib/utils");
const utilsBundle_1 = require("@copilotbrowser/copilotbrowser/lib/utilsBundle");
const copilotbrowser_TEST_PATH = path_1.default.join(__dirname, '..');
const copilotbrowser_CORE_PATH = path_1.default.dirname(require.resolve('copilotbrowser/package.json'));
function filterStackTrace(e) {
    const name = e.name ? e.name + ': ' : '';
    const cause = e.cause instanceof Error ? filterStackTrace(e.cause) : undefined;
    if (process.env.PWDEBUGIMPL)
        return { message: name + e.message, stack: e.stack || '', cause };
    const stackLines = (0, utils_1.stringifyStackFrames)(filteredStackTrace(e.stack?.split('\n') || []));
    return {
        message: name + e.message,
        stack: `${name}${e.message}${stackLines.map(line => '\n' + line).join('')}`,
        cause,
    };
}
function filterStackFile(file) {
    if (!process.env.PWDEBUGIMPL && file.startsWith(copilotbrowser_TEST_PATH))
        return false;
    if (!process.env.PWDEBUGIMPL && file.startsWith(copilotbrowser_CORE_PATH))
        return false;
    return true;
}
function filteredStackTrace(rawStack) {
    const frames = [];
    for (const line of rawStack) {
        const frame = (0, utils_1.parseStackFrame)(line, path_1.default.sep, !!process.env.PWDEBUGIMPL);
        if (!frame || !frame.file)
            continue;
        if (!filterStackFile(frame.file))
            continue;
        frames.push(frame);
    }
    return frames;
}
function serializeError(error) {
    if (error instanceof Error)
        return filterStackTrace(error);
    return {
        value: util_1.default.inspect(error)
    };
}
function parseLocationArg(arg) {
    const match = /^(.*?):(\d+):?(\d+)?$/.exec(arg);
    return {
        file: match ? match[1] : arg,
        line: match ? parseInt(match[2], 10) : null,
        column: match?.[3] ? parseInt(match[3], 10) : null,
    };
}
function createFileFiltersFromArguments(args) {
    return args.map(arg => {
        const parsed = parseLocationArg(arg);
        return { re: forceRegExp(parsed.file), line: parsed.line, column: parsed.column };
    });
}
function createFileMatcherFromArguments(args) {
    const filters = createFileFiltersFromArguments(args);
    return createFileMatcher(filters.map(filter => filter.re || filter.exact || ''));
}
function createFileMatcher(patterns) {
    const reList = [];
    const filePatterns = [];
    for (const pattern of Array.isArray(patterns) ? patterns : [patterns]) {
        if ((0, utils_1.isRegExp)(pattern)) {
            reList.push(pattern);
        }
        else {
            if (!pattern.startsWith('**/'))
                filePatterns.push('**/' + pattern);
            else
                filePatterns.push(pattern);
        }
    }
    return (filePath) => {
        for (const re of reList) {
            re.lastIndex = 0;
            if (re.test(filePath))
                return true;
        }
        // Windows might still receive unix style paths from Cygwin or Git Bash.
        // Check against the file url as well.
        if (path_1.default.sep === '\\') {
            const fileURL = url_1.default.pathToFileURL(filePath).href;
            for (const re of reList) {
                re.lastIndex = 0;
                if (re.test(fileURL))
                    return true;
            }
        }
        for (const pattern of filePatterns) {
            if ((0, utilsBundle_1.minimatch)(filePath, pattern, { nocase: true, dot: true }))
                return true;
        }
        return false;
    };
}
function createTitleMatcher(patterns) {
    const reList = Array.isArray(patterns) ? patterns : [patterns];
    return (value) => {
        for (const re of reList) {
            re.lastIndex = 0;
            if (re.test(value))
                return true;
        }
        return false;
    };
}
function mergeObjects(a, b, c) {
    const result = { ...a };
    for (const x of [b, c].filter(Boolean)) {
        for (const [name, value] of Object.entries(x)) {
            if (!Object.is(value, undefined))
                result[name] = value;
        }
    }
    return result;
}
function forceRegExp(pattern) {
    const match = pattern.match(/^\/(.*)\/([gi]*)$/);
    if (match)
        return new RegExp(match[1], match[2]);
    return new RegExp(pattern, 'gi');
}
function relativeFilePath(file) {
    if (!path_1.default.isAbsolute(file))
        return file;
    return path_1.default.relative(process.cwd(), file);
}
function formatLocation(location) {
    return relativeFilePath(location.file) + ':' + location.line + ':' + location.column;
}
function errorWithFile(file, message) {
    return new Error(`${relativeFilePath(file)}: ${message}`);
}
function expectTypes(receiver, types, matcherName) {
    if (typeof receiver !== 'object' || !types.includes(receiver.constructor.name)) {
        const commaSeparated = types.slice();
        const lastType = commaSeparated.pop();
        const typesString = commaSeparated.length ? commaSeparated.join(', ') + ' or ' + lastType : lastType;
        throw new Error(`${matcherName} can be only used with ${typesString} object${types.length > 1 ? 's' : ''}`);
    }
}
exports.windowsFilesystemFriendlyLength = 60;
function trimLongString(s, length = 100) {
    if (s.length <= length)
        return s;
    const hash = (0, utils_1.calculateSha1)(s);
    const middle = `-${hash.substring(0, 5)}-`;
    const start = Math.floor((length - middle.length) / 2);
    const end = length - middle.length - start;
    return s.substring(0, start) + middle + s.slice(-end);
}
function addSuffixToFilePath(filePath, suffix) {
    const ext = path_1.default.extname(filePath);
    const base = filePath.substring(0, filePath.length - ext.length);
    return base + suffix + ext;
}
function sanitizeFilePathBeforeExtension(filePath, ext) {
    ext ??= path_1.default.extname(filePath);
    const base = filePath.substring(0, filePath.length - ext.length);
    return (0, utils_1.sanitizeForFilePath)(base) + ext;
}
/**
 * Returns absolute path contained within parent directory.
 */
function getContainedPath(parentPath, subPath = '') {
    const resolvedPath = path_1.default.resolve(parentPath, subPath);
    if (resolvedPath === parentPath || resolvedPath.startsWith(parentPath + path_1.default.sep))
        return resolvedPath;
    return null;
}
exports.debugTest = (0, utilsBundle_1.debug)('pw:test');
const folderToPackageJsonPath = new Map();
function getPackageJsonPath(folderPath) {
    const cached = folderToPackageJsonPath.get(folderPath);
    if (cached !== undefined)
        return cached;
    const packageJsonPath = path_1.default.join(folderPath, 'package.json');
    if (fs_1.default.existsSync(packageJsonPath)) {
        folderToPackageJsonPath.set(folderPath, packageJsonPath);
        return packageJsonPath;
    }
    const parentFolder = path_1.default.dirname(folderPath);
    if (folderPath === parentFolder) {
        folderToPackageJsonPath.set(folderPath, '');
        return '';
    }
    const result = getPackageJsonPath(parentFolder);
    folderToPackageJsonPath.set(folderPath, result);
    return result;
}
function resolveReporterOutputPath(defaultValue, configDir, configValue) {
    if (configValue)
        return path_1.default.resolve(configDir, configValue);
    let basePath = getPackageJsonPath(configDir);
    basePath = basePath ? path_1.default.dirname(basePath) : process.cwd();
    return path_1.default.resolve(basePath, defaultValue);
}
async function normalizeAndSaveAttachment(outputPath, name, options = {}) {
    if (options.path === undefined && options.body === undefined)
        return { name, contentType: 'text/plain' };
    if ((options.path !== undefined ? 1 : 0) + (options.body !== undefined ? 1 : 0) !== 1)
        throw new Error(`Exactly one of "path" and "body" must be specified`);
    if (options.path !== undefined) {
        const hash = (0, utils_1.calculateSha1)(options.path);
        if (!(0, utils_1.isString)(name))
            throw new Error('"name" should be string.');
        const sanitizedNamePrefix = (0, utils_1.sanitizeForFilePath)(name) + '-';
        const dest = path_1.default.join(outputPath, 'attachments', sanitizedNamePrefix + hash + path_1.default.extname(options.path));
        await fs_1.default.promises.mkdir(path_1.default.dirname(dest), { recursive: true });
        await fs_1.default.promises.copyFile(options.path, dest);
        const contentType = options.contentType ?? (utilsBundle_1.mime.getType(path_1.default.basename(options.path)) || 'application/octet-stream');
        return { name, contentType, path: dest };
    }
    else {
        const contentType = options.contentType ?? (typeof options.body === 'string' ? 'text/plain' : 'application/octet-stream');
        return { name, contentType, body: typeof options.body === 'string' ? Buffer.from(options.body) : options.body };
    }
}
function fileIsModule(file) {
    if (file.endsWith('.mjs') || file.endsWith('.mts'))
        return true;
    if (file.endsWith('.cjs') || file.endsWith('.cts'))
        return false;
    const folder = path_1.default.dirname(file);
    return folderIsModule(folder);
}
function folderIsModule(folder) {
    const packageJsonPath = getPackageJsonPath(folder);
    if (!packageJsonPath)
        return false;
    // Rely on `require` internal caching logic.
    return require(packageJsonPath).type === 'module';
}
const packageJsonMainFieldCache = new Map();
function getMainFieldFromPackageJson(packageJsonPath) {
    if (!packageJsonMainFieldCache.has(packageJsonPath)) {
        let mainField;
        try {
            mainField = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf8')).main;
        }
        catch {
        }
        packageJsonMainFieldCache.set(packageJsonPath, mainField);
    }
    return packageJsonMainFieldCache.get(packageJsonPath);
}
// This method performs "file extension subsitution" to find the ts, js or similar source file
// based on the import specifier, which might or might not have an extension. See TypeScript docs:
// https://www.typescriptlang.org/docs/handbook/modules/reference.html#file-extension-substitution.
const kExtLookups = new Map([
    ['.js', ['.jsx', '.ts', '.tsx']],
    ['.jsx', ['.tsx']],
    ['.cjs', ['.cts']],
    ['.mjs', ['.mts']],
    ['', ['.js', '.ts', '.jsx', '.tsx', '.cjs', '.mjs', '.cts', '.mts']],
]);
function resolveImportSpecifierExtension(resolved) {
    if (fileExists(resolved))
        return resolved;
    for (const [ext, others] of kExtLookups) {
        if (!resolved.endsWith(ext))
            continue;
        for (const other of others) {
            const modified = resolved.substring(0, resolved.length - ext.length) + other;
            if (fileExists(modified))
                return modified;
        }
        break; // Do not try '' when a more specific extension like '.jsx' matched.
    }
}
// This method resolves directory imports and performs "file extension subsitution".
// It is intended to be called after the path mapping resolution.
//
// Directory imports follow the --moduleResolution=bundler strategy from tsc.
// https://www.typescriptlang.org/docs/handbook/modules/reference.html#directory-modules-index-file-resolution
// https://www.typescriptlang.org/docs/handbook/modules/reference.html#bundler
//
// See also Node.js "folder as module" behavior:
// https://nodejs.org/dist/latest-v20.x/docs/api/modules.html#folders-as-modules.
function resolveImportSpecifierAfterMapping(resolved, afterPathMapping) {
    const resolvedFile = resolveImportSpecifierExtension(resolved);
    if (resolvedFile)
        return resolvedFile;
    if (dirExists(resolved)) {
        const packageJsonPath = path_1.default.join(resolved, 'package.json');
        if (afterPathMapping) {
            // Most notably, the module resolution algorithm is not performed after the path mapping.
            // This means no node_modules lookup or package.json#exports.
            //
            // Only the "folder as module" Node.js behavior is respected:
            //  - consult `package.json#main`;
            //  - look for `index.js` or similar.
            const mainField = getMainFieldFromPackageJson(packageJsonPath);
            const mainFieldResolved = mainField ? resolveImportSpecifierExtension(path_1.default.resolve(resolved, mainField)) : undefined;
            return mainFieldResolved || resolveImportSpecifierExtension(path_1.default.join(resolved, 'index'));
        }
        // If we import a package, let Node.js figure out the correct import based on package.json.
        // This also covers the "main" field for "folder as module".
        if (fileExists(packageJsonPath))
            return resolved;
        // Implement the "folder as module" Node.js behavior.
        // Note that we do not delegate to Node.js, because we support this for ESM as well,
        // following the TypeScript "bundler" mode.
        const dirImport = path_1.default.join(resolved, 'index');
        return resolveImportSpecifierExtension(dirImport);
    }
}
function fileExists(resolved) {
    return fs_1.default.statSync(resolved, { throwIfNoEntry: false })?.isFile();
}
async function fileExistsAsync(resolved) {
    try {
        const stat = await fs_1.default.promises.stat(resolved);
        return stat.isFile();
    }
    catch {
        return false;
    }
}
function dirExists(resolved) {
    return fs_1.default.statSync(resolved, { throwIfNoEntry: false })?.isDirectory();
}
async function removeDirAndLogToConsole(dir) {
    try {
        if (!fs_1.default.existsSync(dir))
            return;
        // eslint-disable-next-line no-console
        console.log(`Removing ${await fs_1.default.promises.realpath(dir)}`);
        await fs_1.default.promises.rm(dir, { recursive: true, force: true });
    }
    catch {
    }
}
var utils_2 = require("@copilotbrowser/copilotbrowser/lib/utils");
Object.defineProperty(exports, "ansiRegex", { enumerable: true, get: function () { return utils_2.ansiRegex; } });
Object.defineProperty(exports, "stripAnsiEscapes", { enumerable: true, get: function () { return utils_2.stripAnsiEscapes; } });

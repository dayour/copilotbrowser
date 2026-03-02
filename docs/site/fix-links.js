const fs = require('fs');
const path = require('path');

const dirs = [
  path.resolve(__dirname, '..', 'src', 'api'),
  path.resolve(__dirname, '..', 'src', 'test-api'),
  path.resolve(__dirname, '..', 'src', 'test-reporter-api'),
  path.resolve(__dirname, '..', 'src'),  // top-level .md files
];

let totalReplacements = 0;
let filesModified = 0;

function collectMdFiles(dir, recurse) {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && recurse) {
      files = files.concat(collectMdFiles(full, true));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

// Collect files: recurse into api/test-api/test-reporter-api, top-level only for src
const seen = new Set();
const files = [];
for (const dir of dirs) {
  const isTopLevel = dir.endsWith('src');
  for (const f of collectMdFiles(dir, !isTopLevel)) {
    if (!seen.has(f)) {
      seen.add(f);
      files.push(f);
    }
  }
}

const replacements = [
  // method: ClassName.methodName (may have dots, #N suffixes, or (call) parens)
  { regex: /\[`method:\s+([A-Za-z][A-Za-z0-9_.()#]+)`\]/g, replace: (_, m) => `**${m.replace(/#\d+$/, '')}()**` },
  { regex: /\[method:\s+([A-Za-z][A-Za-z0-9_.()#]+)\]/g, replace: (_, m) => `**${m.replace(/#\d+$/, '')}()**` },

  // property: ClassName.propName
  { regex: /\[`property:\s+([A-Za-z][A-Za-z0-9_.]+)`\]/g, replace: (_, m) => `**${m}**` },
  { regex: /\[property:\s+([A-Za-z][A-Za-z0-9_.]+)\]/g, replace: (_, m) => `**${m}**` },

  // event: ClassName.eventName
  { regex: /\[`event:\s+([A-Za-z]+)\.([A-Za-z_]+)`\]/g, replace: (_, cls, evt) => `**${cls}.event('${evt}')**` },
  { regex: /\[event:\s+([A-Za-z]+)\.([A-Za-z_]+)\]/g, replace: (_, cls, evt) => `**${cls}.event('${evt}')**` },

  // option: "optionName" (quoted)
  { regex: /\[`option:\s+"([^"]+)"`\]/g, replace: (_, o) => `**${o}**` },
  { regex: /\[option:\s+"([^"]+)"\]/g, replace: (_, o) => `**${o}**` },

  // option: ClassName.method.optionName or simple optionName (unquoted)
  { regex: /\[`option:\s+([A-Za-z][A-Za-z0-9_.]+)`\]/g, replace: (_, o) => `**${o}**` },
  { regex: /\[option:\s+([A-Za-z][A-Za-z0-9_.]+)\]/g, replace: (_, o) => `**${o}**` },

  // param: paramName (including single-char like x, y)
  { regex: /\[`param:\s+([A-Za-z][A-Za-z0-9_.]*)`\]/g, replace: (_, p) => `**${p}**` },
  { regex: /\[param:\s+([A-Za-z][A-Za-z0-9_.]*)\]/g, replace: (_, p) => `**${p}**` },
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let fileCount = 0;

  for (const { regex, replace } of replacements) {
    regex.lastIndex = 0;
    const matches = content.match(regex);
    if (matches) {
      fileCount += matches.length;
      content = content.replace(regex, replace);
    }
  }

  if (fileCount > 0) {
    fs.writeFileSync(file, content, 'utf8');
    totalReplacements += fileCount;
    filesModified++;
    console.log(`  ${path.relative(path.resolve(__dirname, '..'), file)}: ${fileCount} replacements`);
  }
}

console.log(`\nDone: ${totalReplacements} replacements in ${filesModified} files.`);

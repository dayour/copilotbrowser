const fs = require('fs');
const path = require('path');

const API_DIRS = [
  path.resolve(__dirname, '..', 'src', 'api'),
  path.resolve(__dirname, '..', 'src', 'test-api'),
  path.resolve(__dirname, '..', 'src', 'test-reporter-api'),
];

const LANG_MAP = { js: 'JavaScript', python: 'Python', java: 'Java', csharp: 'C#' };

const counts = { since: 0, type: 0, langs: 0, deprecated: 0, returns: 0 };

function stripTypeMarkup(raw) {
  // Remove outer < > then strip all [ and ]
  let t = raw.trim();
  if (t.startsWith('<') && t.endsWith('>')) t = t.slice(1, -1);
  t = t.replace(/\[/g, '').replace(/\]/g, '');
  return t;
}

function processLine(line, inCodeBlock) {
  if (inCodeBlock) return line;

  // 1. since: * since: vX.Y
  const sinceMatch = line.match(/^\* since: (v[\d.]+)\s*$/);
  if (sinceMatch) { counts.since++; return `> *Added in: ${sinceMatch[1]}*`; }

  // 2. type: - type: <...>
  const typeMatch = line.match(/^- type: (<.+>)\s*$/);
  if (typeMatch) { counts.type++; return `**Type:** \`${stripTypeMarkup(typeMatch[1])}\``; }

  // 3. langs: * langs: ...
  const langsMatch = line.match(/^\* langs:\s*(.*)$/);
  if (langsMatch) {
    counts.langs++;
    const raw = langsMatch[1].trim();
    if (!raw) return `> **Languages:** *(all)*`;
    const mapped = raw.split(/,\s*/).map(l => LANG_MAP[l.trim()] || l.trim()).join(', ');
    return `> **Languages:** ${mapped}`;
  }

  // 4. deprecated: * deprecated: ...
  const depMatch = line.match(/^\* deprecated:\s*(.*)$/);
  if (depMatch) {
    counts.deprecated++;
    const msg = depMatch[1].trim();
    return msg ? `> ⚠️ **Deprecated.** ${msg}` : `> ⚠️ **Deprecated.**`;
  }

  // 5. returns: - returns: <...> or - returns: ?<...>
  const retMatch = line.match(/^- returns: \??(<.+>)\s*$/);
  if (retMatch) { counts.returns++; return `**Returns:** \`${stripTypeMarkup(retMatch[1])}\``; }

  return line;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let inCodeBlock = false;
  const result = lines.map(line => {
    if (line.trimStart().startsWith('```')) inCodeBlock = !inCodeBlock;
    return processLine(line, inCodeBlock);
  });
  const newContent = result.join('\n');
  if (newContent !== content) fs.writeFileSync(filePath, newContent, 'utf8');
}

function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full);
    else if (entry.name.endsWith('.md')) processFile(full);
  }
}

for (const d of API_DIRS) {
  if (fs.existsSync(d)) walkDir(d);
  else console.warn(`Directory not found: ${d}`);
}

const total = Object.values(counts).reduce((a, b) => a + b, 0);
console.log('Metadata cleanup complete:');
console.log(`  since:      ${counts.since}`);
console.log(`  type:       ${counts.type}`);
console.log(`  langs:      ${counts.langs}`);
console.log(`  deprecated: ${counts.deprecated}`);
console.log(`  returns:    ${counts.returns}`);
console.log(`  TOTAL:      ${total}`);

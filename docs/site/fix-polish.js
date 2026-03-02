const fs = require('fs');
const path = require('path');

function findAllMdFiles(dir) {
  const files = [];
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const fullPath = path.join(d, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.name.endsWith('.md')) files.push(fullPath);
    }
  }
  walk(dir);
  return files;
}

const srcDir = path.join(__dirname, '..', 'src');
const files = findAllMdFiles(srcDir);
let modifiedCount = 0, bracketCount = 0, aliasCount = 0, langsCount = 0;

// Regex: match [word] where word is a valid identifier,
// NOT preceded by a word char or backtick (excludes :::warning[X] and `[X]`),
// NOT followed by ( (excludes markdown links [text](url))
const bracketRef = /(?<![`\w])\[([a-zA-Z_]\w*)\](?!\()/g;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  let inFrontmatter = false, inCodeBlock = false, fileModified = false;
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Frontmatter: only at file start
    if (i === 0 && line.trim() === '---') { inFrontmatter = true; newLines.push(line); continue; }
    if (inFrontmatter) {
      if (line.trim() === '---') inFrontmatter = false;
      newLines.push(line);
      continue;
    }

    // Code blocks
    if (line.trim().startsWith('```')) { inCodeBlock = !inCodeBlock; newLines.push(line); continue; }
    if (inCodeBlock) { newLines.push(line); continue; }

    // Issue 2: Remove alias-LANG lines
    if (/^\s*\*\s+alias-\w+:\s+/.test(line)) { aliasCount++; fileModified = true; continue; }

    // Issue 2: Remove remaining * langs: lines
    if (/^\s*\*\s+langs:/.test(line)) { langsCount++; fileModified = true; continue; }

    // Issue 1: Convert [TypeName] → `TypeName`
    const newLine = line.replace(bracketRef, '`$1`');
    if (newLine !== line) {
      const matches = line.match(bracketRef);
      bracketCount += matches ? matches.length : 0;
      fileModified = true;
    }
    newLines.push(newLine);
  }

  if (fileModified) {
    fs.writeFileSync(file, newLines.join('\n'), 'utf-8');
    modifiedCount++;
  }
}

console.log(`Processed ${files.length} files, modified ${modifiedCount}`);
console.log(`  Bracket type refs converted: ${bracketCount}`);
console.log(`  Alias lines removed: ${aliasCount}`);
console.log(`  Langs lines removed: ${langsCount}`);

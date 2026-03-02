const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

const langMap = {
  '-js': ' (JavaScript)',
  '-python': ' (Python)',
  '-java': ' (Java)',
  '-csharp': ' (C#)',
  '-csharp-java-python': ' (C#/Java/Python)',
  '-java-python': ' (Java/Python)',
  '-js-python': ' (JS/Python)',
};

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.md'));

for (const file of files) {
  const filePath = path.join(srcDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const baseName = file.replace('.md', '');

  // Find which language suffix this file has
  let langSuffix = null;
  // Sort by length descending so longer suffixes match first
  const suffixes = Object.keys(langMap).sort((a, b) => b.length - a.length);
  for (const suffix of suffixes) {
    if (baseName.endsWith(suffix)) {
      langSuffix = suffix;
      break;
    }
  }
  if (!langSuffix) continue;

  // Check if there are other files with same base (duplicates)
  const baseWithoutLang = baseName.slice(0, -langSuffix.length);
  const hasDupes = files.some(f => {
    const other = f.replace('.md', '');
    if (other === baseName) return false;
    for (const s of Object.keys(langMap)) {
      if (other === baseWithoutLang + s) return true;
    }
    return other === baseWithoutLang;
  });

  if (!hasDupes) continue;

  // Extract title from frontmatter
  const fmEnd = content.indexOf('---', 3);
  if (fmEnd === -1) continue;
  const fm = content.substring(0, fmEnd);
  const titleMatch = fm.match(/title:\s*["']?(.+?)["']?\s*$/m);
  if (!titleMatch) continue;

  const title = titleMatch[1];
  const label = langMap[langSuffix];

  // Add or replace sidebar_label in frontmatter
  if (fm.includes('sidebar_label:')) {
    // Already has sidebar_label, skip
    continue;
  }

  const newFm = fm + 'sidebar_label: "' + title + label + '"\n';
  const newContent = newFm + content.substring(fmEnd);
  fs.writeFileSync(filePath, newContent);
  console.log(file + ' -> ' + title + label);
}

console.log('Done adding sidebar labels');

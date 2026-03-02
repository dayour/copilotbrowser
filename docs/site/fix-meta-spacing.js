#!/usr/bin/env node
// fix-meta-spacing.js
// 1. Adds empty `>` separator lines between consecutive blockquote metadata lines
//    so each item (Added in, Languages, Returns, Type) renders as its own paragraph
// 2. Moves `**Type:**` lines that follow a `>` line into the blockquote
// 3. Fixes duplicate ## property: copilotbrowser.devices heading

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docsDir = path.join(__dirname, '..', 'src');

function getFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...getFiles(full));
    else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) results.push(full);
  }
  return results;
}

let filesChanged = 0;
let replacements = 0;

for (const file of getFiles(docsDir)) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Step 1: Move **Type:** lines immediately after a `>` blockquote into the blockquote
  // Pattern: a `> ` line followed by `**Type:**` on the next line (no blank line between)
  content = content.replace(/(^> .+\n)(\*\*Type:\*\*)/gm, '$1> $2');

  // Step 2: Add `>` separator between consecutive blockquote metadata lines
  // (so they render as separate paragraphs in the blockquote)
  // Consecutive `> ` lines become: `> line1\n>\n> line2`
  content = content.replace(/^(> .+)\n(> .+)/gm, '$1\n>\n$2');
  // Run twice to catch 3+ consecutive lines
  content = content.replace(/^(> .+)\n(> .+)/gm, '$1\n>\n$2');
  content = content.replace(/^(> .+)\n(> .+)/gm, '$1\n>\n$2');

  if (content !== original) {
    fs.writeFileSync(file, content);
    filesChanged++;
    const before = (original.match(/^> /gm) || []).length;
    const after = (content.match(/^> /gm) || []).length;
    replacements += Math.abs(after - before);
  }
}

console.log(`Meta spacing fix: ${filesChanged} files updated, ~${replacements} blockquote separators added`);

// Step 3: Fix duplicate ## property: copilotbrowser.devices in class-copilotbrowser.md
const classFile = path.join(docsDir, 'api', 'class-copilotbrowser.md');
if (fs.existsSync(classFile)) {
  let content = fs.readFileSync(classFile, 'utf8');
  const original = content;
  
  // Find and replace the SECOND occurrence of ## property: copilotbrowser.devices
  // by replacing it with a sub-heading indicating it's the C# variant
  let count = 0;
  content = content.replace(/^## property: copilotbrowser\.devices$/gm, (match) => {
    count++;
    if (count === 2) return '### C# (.NET)';
    return match;
  });
  
  if (content !== original) {
    fs.writeFileSync(classFile, content);
    console.log('Fixed duplicate ## property: copilotbrowser.devices → ### C# (.NET)');
  }
}

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

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

import { PDFParse } from 'pdf-parse';
import sharp from 'sharp';

import { outputDir, workspaceDir } from '../config';

import type { Context } from '../context';

export type PdfMetadata = {
  title: string;
  author: string;
  subject: string;
  creator: string;
  producer: string;
  creationDate: string | null;
  modificationDate: string | null;
  pages: number;
  version: string | null;
};

export type PdfTextQualityReport = {
  schemaVersion: '1';
  removedNoiseLineCount: number;
  normalizedSpacedLabelCount: number;
  pageMarkerCount: number;
  orderedListCount: number;
  bulletListCount: number;
  sparsePageNumbers: number[];
  warnings: string[];
};

export type PdfDocument = {
  metadata: PdfMetadata;
  text: string;
  qualityReport: PdfTextQualityReport;
};

export type PdfConversionBundleOptions = {
  copySource?: boolean;
  includePageImages?: boolean;
  imageType?: 'png' | 'jpeg';
  imageScale?: number;
  maxPages?: number;
};

export type PdfConversionManifest = {
  schemaVersion: '1';
  kind: 'pdf-conversion';
  generatedAt: string;
  source: {
    originalFileName: string;
    sha256: string;
    pathRedacted: true;
    bundleFile: string | null;
  };
  metadata: PdfMetadata;
  qualityReport: PdfTextQualityReport;
  artifacts: {
    manifestFile: 'manifest.json';
    metadataFile: 'metadata.json';
    textFile: 'document.txt';
    markdownFile: 'document.md';
    qualityReportFile: 'quality-report.json';
    pageImageFiles: string[];
  };
  textCharacters: number;
  markdownCharacters: number;
  render: {
    includedPageImages: boolean;
    pageImageType: 'png' | 'jpeg';
    scale: number;
    maxPages: number | null;
    renderedPageCount: number;
  };
};

export type PdfConversionBundle = {
  manifest: PdfConversionManifest;
  metadataJson: string;
  qualityReportJson: string;
  text: string;
  markdown: string;
  sourceData?: Buffer;
  pageImages: { pageNumber: number, fileName: string, data: Buffer }[];
};

const defaultRenderScale = 2;
const pageMarkerPattern = /^--\s*(\d+)\s+of\s+(\d+)\s*--$/;
const orderedListPattern = /^\d+[.)]\s+/;
const bulletListPattern = /^[-*•]\s+/;
const datePattern = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
const trailingArtifactPattern = /(?:\s*[\u25A0-\u25FF\uE000-\uF8FF])+$/u;
const connectorWords = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'by',
  'for',
  'from',
  'in',
  'into',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
]);

export async function resolvePdfInputPath(context: Context, pdfPath: string): Promise<string> {
  const trimmedPath = pdfPath.trim();
  if (!trimmedPath)
    throw new Error('pdfPath must not be empty.');

  const candidates = path.isAbsolute(trimmedPath) ? [
    path.resolve(trimmedPath),
  ] : [
    path.resolve(workspaceDir(context.options.clientInfo), trimmedPath),
    path.resolve(outputDir(context.config, context.options.clientInfo), trimmedPath),
  ];

  for (const candidate of candidates) {
    if (!candidate.toLowerCase().endsWith('.pdf'))
      continue;
    if (await isReadableFile(candidate))
      return candidate;
  }

  throw new Error(`PDF file not found: ${pdfPath}. Checked: ${candidates.join(', ')}`);
}

export async function extractPdfText(fileName: string): Promise<string> {
  return await withParser(fileName, async parser => {
    const parsed = await parser.getText();
    return normalizeExtractedText(parsed.text).text;
  });
}

export async function extractPdfMetadata(fileName: string): Promise<PdfMetadata> {
  return await withParser(fileName, async parser => {
    const parsed = await parser.getInfo();
    const dates = parsed.getDateNode();
    return {
      title: valueOrUnknown(parsed.info?.Title),
      author: valueOrUnknown(parsed.info?.Author),
      subject: valueOrUnknown(parsed.info?.Subject),
      creator: valueOrUnknown(parsed.info?.Creator),
      producer: valueOrUnknown(parsed.info?.Producer),
      creationDate: dateOrNull(dates.CreationDate),
      modificationDate: dateOrNull(dates.ModDate),
      pages: parsed.total,
      version: valueOrNull(parsed.info?.PDFFormatVersion),
    };
  });
}

export async function extractPdfDocument(fileName: string): Promise<PdfDocument> {
  return await withParser(fileName, async parser => {
    const info = await parser.getInfo();
    const text = await parser.getText();
    const metadata = toPdfMetadata(info);
    const normalized = normalizeExtractedText(text.text);
    return {
      metadata,
      text: normalized.text,
      qualityReport: buildQualityReport(normalized, metadata.pages),
    };
  });
}

export async function convertPdfToBundle(fileName: string, options: PdfConversionBundleOptions = {}): Promise<PdfConversionBundle> {
  const sourceData = await fs.promises.readFile(fileName);
  const document = await extractPdfDocument(fileName);
  const markdown = markdownFromPdfText(document.metadata, document.text, path.basename(fileName, '.pdf'));
  const pageImageType = options.imageType ?? 'png';
  const imageScale = options.imageScale ?? defaultRenderScale;
  const pageImages = options.includePageImages
    ? await renderPdfPageImages(fileName, { type: pageImageType, maxPages: options.maxPages, scale: imageScale })
    : [];
  const pageImageFiles = pageImages.map(page => `images/page-${String(page.pageNumber).padStart(3, '0')}.${pageImageType}`);
  const manifest: PdfConversionManifest = {
    schemaVersion: '1',
    kind: 'pdf-conversion',
    generatedAt: new Date().toISOString(),
    source: {
      originalFileName: path.basename(fileName),
      sha256: crypto.createHash('sha256').update(sourceData).digest('hex'),
      pathRedacted: true,
      bundleFile: options.copySource === false ? null : 'source.pdf',
    },
    metadata: document.metadata,
    qualityReport: document.qualityReport,
    artifacts: {
      manifestFile: 'manifest.json',
      metadataFile: 'metadata.json',
      textFile: 'document.txt',
      markdownFile: 'document.md',
      qualityReportFile: 'quality-report.json',
      pageImageFiles,
    },
    textCharacters: document.text.length,
    markdownCharacters: markdown.length,
    render: {
      includedPageImages: options.includePageImages ?? false,
      pageImageType,
      scale: imageScale,
      maxPages: options.maxPages ?? null,
      renderedPageCount: pageImages.length,
    },
  };

  return {
    manifest,
    metadataJson: JSON.stringify(document.metadata, null, 2),
    qualityReportJson: JSON.stringify(document.qualityReport, null, 2),
    text: document.text,
    markdown,
    sourceData: options.copySource === false ? undefined : sourceData,
    pageImages: pageImages.map((page, index) => ({
      pageNumber: page.pageNumber,
      fileName: pageImageFiles[index],
      data: page.data,
    })),
  };
}

export function markdownFromPdfText(metadata: PdfMetadata, text: string, fallbackTitle: string): string {
  const title = metadata.title !== 'Unknown' ? metadata.title : fallbackTitle;
  const normalized = normalizeExtractedText(text);
  const blocks = buildMarkdownBlocks(normalized.lines);
  let markdown = `# ${title}\n\n`;

  if (metadata.author !== 'Unknown')
    markdown += `**Author:** ${metadata.author}\n\n`;
  if (metadata.subject !== 'Unknown')
    markdown += `**Subject:** ${metadata.subject}\n\n`;
  markdown += `**Pages:** ${metadata.pages}\n\n`;
  if (metadata.creationDate)
    markdown += `**Created:** ${metadata.creationDate}\n\n`;
  markdown += '---\n\n';

  if (blocks.length)
    markdown += blocks.join('\n\n') + '\n';

  return markdown.trimEnd() + '\n';
}

export async function renderPdfPageImage(fileName: string, pageNumber: number, type: 'png' | 'jpeg', scale = defaultRenderScale): Promise<Buffer> {
  if (pageNumber < 1)
    throw new Error('pageNumber must be greater than 0.');
  if (scale <= 0)
    throw new Error('scale must be greater than 0.');

  return await withParser(fileName, async parser => {
    const result = await parser.getScreenshot({
      partial: [pageNumber],
      scale,
      imageBuffer: true,
      imageDataUrl: false,
    });
    const page = result.pages[0];
    if (!page)
      throw new Error(`Page ${pageNumber} was not found in ${path.basename(fileName)}.`);
    const buffer = Buffer.from(page.data);
    if (type === 'png')
      return buffer;
    return await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
  });
}

export async function renderPdfPageImages(fileName: string, options: { type: 'png' | 'jpeg', maxPages?: number, scale?: number }): Promise<{ pageNumber: number, data: Buffer }[]> {
  if (options.maxPages !== undefined && options.maxPages < 1)
    throw new Error('maxPages must be greater than 0.');
  if (options.scale !== undefined && options.scale <= 0)
    throw new Error('scale must be greater than 0.');

  return await withParser(fileName, async parser => {
    const result = await parser.getScreenshot({
      first: options.maxPages,
      scale: options.scale ?? defaultRenderScale,
      imageBuffer: true,
      imageDataUrl: false,
    });

    const pages = await Promise.all(result.pages.map(async page => {
      const source = Buffer.from(page.data);
      const data = options.type === 'jpeg'
        ? Buffer.from(await sharp(source).jpeg({ quality: 90 }).toBuffer())
        : source;
      return { pageNumber: page.pageNumber, data };
    }));

    if (!pages.length)
      throw new Error(`No pages were rendered from ${path.basename(fileName)}.`);

    return pages;
  });
}

function toPdfMetadata(parsed: Awaited<ReturnType<PDFParse['getInfo']>>): PdfMetadata {
  const dates = parsed.getDateNode();
  return {
    title: valueOrUnknown(parsed.info?.Title),
    author: valueOrUnknown(parsed.info?.Author),
    subject: valueOrUnknown(parsed.info?.Subject),
    creator: valueOrUnknown(parsed.info?.Creator),
    producer: valueOrUnknown(parsed.info?.Producer),
    creationDate: dateOrNull(dates.CreationDate),
    modificationDate: dateOrNull(dates.ModDate),
    pages: parsed.total,
    version: valueOrNull(parsed.info?.PDFFormatVersion),
  };
}

function normalizeExtractedText(text: string): {
  lines: string[];
  text: string;
  removedNoiseLineCount: number;
  normalizedSpacedLabelCount: number;
} {
  const rawLines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(line => line.normalize('NFKC').replace(/\u00A0/g, ' ').replace(/\t+/g, ' ').trim());
  const lines: string[] = [];
  let removedNoiseLineCount = 0;
  let normalizedSpacedLabelCount = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (!line) {
      lines.push('');
      continue;
    }

    if (isNoiseLine(line)) {
      removedNoiseLineCount++;
      continue;
    }

    let cleanedLine = line.replace(trailingArtifactPattern, '').trim();
    cleanedLine = normalizeBadgeLabel(cleanedLine);

    if (looksLikeDecorativeSpacedLabel(cleanedLine)) {
      normalizedSpacedLabelCount++;
      const nextLine = findNextMeaningfulLine(rawLines, i + 1);
      if (nextLine && nextLine.length <= 80 && !isPageMarkerLine(nextLine) && !looksLikeListItem(nextLine))
        continue;
      cleanedLine = collapseDecorativeSpacedLabel(cleanedLine);
    }

    if (!cleanedLine)
      continue;
    lines.push(cleanedLine);
  }

  const collapsedLines = collapseBlankLines(lines);
  const mergedLines = coalesceShortContinuationLines(collapsedLines);
  return {
    lines: mergedLines,
    text: mergedLines.join('\n'),
    removedNoiseLineCount,
    normalizedSpacedLabelCount,
  };
}

function buildQualityReport(normalized: {
  lines: string[];
  removedNoiseLineCount: number;
  normalizedSpacedLabelCount: number;
}, expectedPages: number): PdfTextQualityReport {
  const pageMarkers = normalized.lines
    .map(parsePageMarker)
    .filter((marker): marker is { page: number, total: number } => !!marker);
  const orderedListCount = normalized.lines.filter(line => orderedListPattern.test(line)).length;
  const bulletListCount = normalized.lines.filter(line => bulletListPattern.test(line)).length;
  const sparsePageNumbers = detectSparsePages(normalized.lines);
  const warnings: string[] = [];

  if (normalized.removedNoiseLineCount)
    warnings.push('viewer-chrome-removed');
  if (normalized.normalizedSpacedLabelCount)
    warnings.push('decorative-spaced-label-normalized');
  if (pageMarkers.length && pageMarkers.length !== expectedPages)
    warnings.push('page-marker-count-mismatch');
  if (sparsePageNumbers.length)
    warnings.push('sparse-pages-detected');

  return {
    schemaVersion: '1',
    removedNoiseLineCount: normalized.removedNoiseLineCount,
    normalizedSpacedLabelCount: normalized.normalizedSpacedLabelCount,
    pageMarkerCount: pageMarkers.length,
    orderedListCount,
    bulletListCount,
    sparsePageNumbers,
    warnings,
  };
}

function buildMarkdownBlocks(lines: string[]): string[] {
  const blocks: string[] = [];

  for (let i = 0; i < lines.length;) {
    const line = lines[i];
    if (!line) {
      i++;
      continue;
    }

    const pageMarker = parsePageMarker(line);
    if (pageMarker) {
      blocks.push(`<!-- Page ${pageMarker.page} of ${pageMarker.total} -->`);
      i++;
      continue;
    }

    const table = consumeTable(lines, i);
    if (table) {
      blocks.push(table.block);
      i = table.nextIndex;
      continue;
    }

    const codeBlock = consumeCodeBlock(lines, i);
    if (codeBlock) {
      blocks.push(codeBlock.block);
      i = codeBlock.nextIndex;
      continue;
    }

    const shortCluster = consumeShortCluster(lines, i);
    if (shortCluster) {
      blocks.push(`## ${shortCluster.heading}`);
      blocks.push(shortCluster.items.map(item => `- ${item}`).join('\n'));
      i = shortCluster.nextIndex;
      continue;
    }

    if (looksLikeHeadingLine(line)) {
      blocks.push(`## ${line}`);
      i++;
      continue;
    }

    if (looksLikeListItem(line)) {
      const list = consumeList(lines, i);
      blocks.push(list.block);
      i = list.nextIndex;
      continue;
    }

    const paragraph = consumeParagraph(lines, i);
    blocks.push(paragraph.block);
    i = paragraph.nextIndex;
  }

  return blocks;
}

function consumeTable(lines: string[], startIndex: number): { block: string, nextIndex: number } | null {
  const headerCells = splitTableCells(lines[startIndex]);
  if (!looksLikeTableHeaderLine(lines[startIndex], headerCells))
    return null;

  let index = startIndex + 1;
  while (index < lines.length) {
    const line = lines[index];
    if (!line || isPageMarkerLine(line) || looksLikeListItem(line))
      break;
    if (!looksLikeTableHeaderContinuation(line))
      break;
    headerCells.push(line);
    index++;
  }

  const rows: string[][] = [];
  let currentRow: string[] | null = null;

  while (index < lines.length) {
    const line = lines[index];
    if (!line || isPageMarkerLine(line))
      break;

    const cells = splitTableCells(line);
    if (!currentRow && cells.length < 2 && isLikelyParagraphSentence(line))
      break;
    if (looksLikeTableHeaderLine(line, cells) && rows.length)
      break;

    if (cells.length >= 2) {
      if (currentRow && currentRow.length >= headerCells.length)
        rows.push(finalizeTableRow(currentRow, headerCells.length));
      currentRow = currentRow && currentRow.length < headerCells.length ? currentRow : [];
      appendTableCells(currentRow, cells, headerCells.length);
    } else {
      currentRow ??= [];
      appendTableContinuation(currentRow, line, headerCells.length);
    }

    index++;
  }

  if (currentRow?.length)
    rows.push(finalizeTableRow(currentRow, headerCells.length));
  if (!rows.length)
    return null;

  return {
    block: renderMarkdownTable(headerCells, rows),
    nextIndex: index,
  };
}

function consumeCodeBlock(lines: string[], startIndex: number): { block: string, nextIndex: number } | null {
  const codeLines: string[] = [];
  let strongCodeLineCount = 0;
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    if (!line || isPageMarkerLine(line) || looksLikeHeadingLine(line) || looksLikeListItem(line))
      break;
    if (!looksLikeCodeLine(line))
      break;
    codeLines.push(normalizeCodeLine(line));
    if (isStrongCodeLine(line))
      strongCodeLineCount++;
    index++;
  }

  if (codeLines.length < 2 || !strongCodeLineCount)
    return null;

  return {
    block: ['```text', ...codeLines, '```'].join('\n'),
    nextIndex: index,
  };
}

function consumeShortCluster(lines: string[], startIndex: number): { heading: string, items: string[], nextIndex: number } | null {
  const heading = lines[startIndex];
  if (!looksLikeHeadingLine(heading))
    return null;

  const items: string[] = [];
  let index = startIndex + 1;
  while (index < lines.length) {
    const line = lines[index];
    if (!line || isPageMarkerLine(line) || looksLikeListItem(line) || looksLikeHeadingLine(line))
      break;
    if (line.length > 80)
      break;
    items.push(line);
    index++;
    if (items.length === 4)
      break;
  }

  if (items.length < 2)
    return null;
  if (items[0] && /^[a-z]/.test(items[0]))
    return null;
  if (endsWithConnectorWord(heading))
    return null;

  return { heading, items, nextIndex: index };
}

function consumeList(lines: string[], startIndex: number): { block: string, nextIndex: number } {
  const items: string[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    if (!line || isPageMarkerLine(line) || looksLikeHeadingLine(line))
      break;

    const orderedMatch = line.match(/^(\d+)[.)]\s+(.*)$/);
    const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
    if (!orderedMatch && !bulletMatch)
      break;

    const marker = orderedMatch ? `${orderedMatch[1]}.` : '-';
    let item = orderedMatch ? orderedMatch[2] : bulletMatch![1];
    index++;

    while (index < lines.length) {
      const continuation = lines[index];
      if (!continuation || isPageMarkerLine(continuation) || looksLikeHeadingLine(continuation) || looksLikeListItem(continuation))
        break;
      item = mergeWrappedText(item, continuation);
      index++;
    }

    items.push(`${marker} ${item}`);
  }

  return {
    block: items.join('\n'),
    nextIndex: index,
  };
}

function consumeParagraph(lines: string[], startIndex: number): { block: string, nextIndex: number } {
  let text = lines[startIndex];
  let index = startIndex + 1;

  while (index < lines.length) {
    const line = lines[index];
    if (!line || isPageMarkerLine(line) || looksLikeHeadingLine(line) || looksLikeListItem(line))
      break;
    if (!shouldMergeParagraphLine(text, line))
      break;
    text = mergeWrappedText(text, line);
    index++;
  }

  return {
    block: text,
    nextIndex: index,
  };
}

function shouldMergeParagraphLine(current: string, next: string): boolean {
  if (current.endsWith('-'))
    return true;
  if (endsWithConnectorWord(current))
    return true;
  if (/[:,;]$/.test(current))
    return true;
  if (/[.!?]$/.test(current))
    return false;
  if (/^[a-z(]/.test(next))
    return true;
  return current.length > 60;
}

function mergeWrappedText(current: string, next: string): string {
  if (current.endsWith('-'))
    return `${current.slice(0, -1)}${next}`;
  return `${current} ${next}`.replace(/\s+/g, ' ').trim();
}

function looksLikeHeadingLine(line: string): boolean {
  if (isPageMarkerLine(line) || looksLikeListItem(line) || datePattern.test(line) || looksLikeCodeLine(line) || looksLikeTableHeaderLine(line))
    return false;
  if (line.length > 80 || endsWithConnectorWord(line))
    return false;
  if (/^[a-z]/.test(line))
    return false;
  if (/[.;]$/.test(line))
    return false;

  return looksAllCapsHeading(line) || looksTitleCaseHeading(line) || line.endsWith('?');
}

function looksAllCapsHeading(line: string): boolean {
  return line === line.toUpperCase() && /[A-Z]/.test(line);
}

function looksTitleCaseHeading(line: string): boolean {
  const words = line.split(/\s+/).filter(Boolean);
  if (!words.length || words.length > 10)
    return false;
  let titledWordCount = 0;
  let lowerWordCount = 0;
  for (const word of words) {
    const normalizedWord = word.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
    if (!normalizedWord)
      continue;
    const lower = normalizedWord.toLowerCase();
    if (connectorWords.has(lower))
      continue;
    if (/^[A-Z0-9]/.test(normalizedWord)) {
      titledWordCount++;
      continue;
    }
    if (/^[a-z]/.test(normalizedWord)) {
      lowerWordCount++;
      continue;
    }
    if (!/^[A-Za-z0-9]/.test(normalizedWord))
      return false;
  }
  return titledWordCount > 0 && lowerWordCount <= 1;
}

function looksLikeListItem(line: string): boolean {
  return orderedListPattern.test(line) || bulletListPattern.test(line);
}

function isNoiseLine(line: string): boolean {
  return /^Tell us about your PDF experience\.?$/i.test(line)
    || /^[\p{P}\p{S}\s]*Expand table\.?$/u.test(line)
    || /^(?:\S+\s+){0,2}Expand table\.?$/iu.test(line);
}

function looksLikeDecorativeSpacedLabel(line: string): boolean {
  const tokens = line.split(/\s+/).filter(Boolean);
  if (tokens.length < 4)
    return false;
  return tokens.every(token => /^[A-Z0-9&/'’-]$/.test(token));
}

function collapseDecorativeSpacedLabel(line: string): string {
  return line.replace(/\s+/g, '');
}

function normalizeBadgeLabel(line: string): string {
  const match = line.match(/^[a-z]\s+([A-Z][A-Z0-9 -]{2,})$/);
  return match ? match[1].trim() : line;
}

function collapseBlankLines(lines: string[]): string[] {
  const collapsed: string[] = [];
  for (const line of lines) {
    if (!line) {
      if (collapsed.length && collapsed[collapsed.length - 1] !== '')
        collapsed.push('');
      continue;
    }
    collapsed.push(line);
  }
  while (collapsed[0] === '')
    collapsed.shift();
  while (collapsed[collapsed.length - 1] === '')
    collapsed.pop();
  return collapsed;
}

function coalesceShortContinuationLines(lines: string[]): string[] {
  const merged: string[] = [];
  for (const line of lines) {
    if (!line) {
      if (merged.length && merged[merged.length - 1] !== '')
        merged.push('');
      continue;
    }

    const previousLine = findLastMeaningfulLine(merged);
    if (previousLine && previousLine === line)
      continue;
    if (previousLine && shouldMergeWithPreviousLine(previousLine, line)) {
      const previousIndex = findLastMeaningfulIndex(merged);
      if (previousIndex !== -1)
        merged[previousIndex] = mergeWrappedText(previousLine, line);
      continue;
    }

    merged.push(line);
  }
  return collapseBlankLines(merged);
}

function parsePageMarker(line: string): { page: number, total: number } | null {
  const match = line.match(pageMarkerPattern);
  if (!match)
    return null;
  return {
    page: Number(match[1]),
    total: Number(match[2]),
  };
}

function isPageMarkerLine(line: string): boolean {
  return pageMarkerPattern.test(line);
}

function endsWithConnectorWord(line: string): boolean {
  const words = line.toLowerCase().split(/\s+/).filter(Boolean);
  const lastWord = words.at(-1)?.replace(/[^a-z]+$/g, '');
  return !!lastWord && connectorWords.has(lastWord);
}

function findNextMeaningfulLine(lines: string[], startIndex: number): string | null {
  for (let i = startIndex; i < lines.length; i++) {
    if (lines[i])
      return lines[i];
  }
  return null;
}

function findLastMeaningfulLine(lines: string[]): string | null {
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i])
      return lines[i];
  }
  return null;
}

function findLastMeaningfulIndex(lines: string[]): number {
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i])
      return i;
  }
  return -1;
}

function shouldMergeWithPreviousLine(previousLine: string, line: string): boolean {
  if (isPageMarkerLine(previousLine) || isPageMarkerLine(line) || looksLikeListItem(line))
    return false;
  if (splitTableCells(previousLine).length >= 2 || splitTableCells(line).length >= 2)
    return false;
  if (looksLikeCodeLine(previousLine) || looksLikeCodeLine(line))
    return false;
  if (line.length > 24)
    return false;
  if (looksLikeHeadingLine(line) && !/^[a-z]/.test(line))
    return false;
  return /^[a-z]/.test(line)
    || /^(documentation|training|videos|certifications|workshops|guide|guidance|center)$/i.test(line);
}

function splitTableCells(line: string): string[] {
  return line.split(/\s{2,}/).map(cell => cell.trim()).filter(Boolean);
}

function looksLikeTableHeaderLine(line: string, cells = splitTableCells(line)): boolean {
  if (cells.length < 3)
    return false;
  if (cells.some(cell => cell.length > 40 || /[.!]$/.test(cell)))
    return false;
  const headerLikeCells = cells.filter(cell => looksLikeTableHeaderCell(cell));
  return headerLikeCells.length >= Math.min(cells.length, 2) && !/^[a-z]/.test(line);
}

function looksLikeTableHeaderCell(cell: string): boolean {
  return /^(action|actions|availability|comments?|deprecated(?: client api)?|description|dynamics 365|feature|managed|microsoft dataverse|name|operation|operations|parameter|product|property|replacement(?: client api)?|type|value)$/i.test(cell)
    || cell.endsWith('?')
    || looksAllCapsHeading(cell)
    || looksTitleCaseHeading(cell);
}

function looksLikeTableHeaderContinuation(line: string): boolean {
  if (splitTableCells(line).length > 1)
    return false;
  if (line.length > 40 || /^[a-z]/.test(line))
    return false;
  return line.endsWith('?') || looksAllCapsHeading(line) || looksTitleCaseHeading(line);
}

function appendTableCells(row: string[], cells: string[], columnCount: number) {
  for (const cell of cells) {
    if (row.length < columnCount)
      row.push(cell);
    else
      row[columnCount - 1] = mergeWrappedText(row[columnCount - 1], cell);
  }
}

function appendTableContinuation(row: string[], line: string, columnCount: number) {
  const normalizedLine = normalizeCodeLine(line);
  if (row.length < columnCount)
    row.push(normalizedLine);
  else
    row[columnCount - 1] = mergeWrappedText(row[columnCount - 1], normalizedLine);
}

function finalizeTableRow(row: string[], columnCount: number): string[] {
  const normalizedRow = row.slice(0, columnCount).map(cell => normalizeCodeLine(cell));
  while (normalizedRow.length < columnCount)
    normalizedRow.push('');
  return normalizedRow;
}

function renderMarkdownTable(header: string[], rows: string[][]): string {
  const escapeCell = (cell: string) => cell.replace(/\|/g, '\\|').trim();
  const normalizedHeader = finalizeTableRow(header, header.length).map(escapeCell);
  const body = rows.map(row => finalizeTableRow(row, header.length).map(escapeCell));
  return [
    `| ${normalizedHeader.join(' | ')} |`,
    `| ${normalizedHeader.map(() => '---').join(' | ')} |`,
    ...body.map(row => `| ${row.join(' | ')} |`),
  ].join('\n');
}

function looksLikeCodeLine(line: string): boolean {
  if (isPageMarkerLine(line) || looksLikeListItem(line) || splitTableCells(line).length >= 2)
    return false;
  return isStrongCodeLine(line);
}

function isStrongCodeLine(line: string): boolean {
  if (/^https?:\/\/\S+$/i.test(line))
    return true;
  if (/^(const|let|var|function|return|if|else|for|while|SELECT|INSERT|UPDATE|DELETE|PATCH|POST|GET|PUT)\b/i.test(line))
    return true;
  if (/[{}\[\];=]/.test(line) || line.includes('=>'))
    return true;
  if (/\b[A-Za-z_][A-Za-z0-9_]*\([^)]*\)/.test(line))
    return true;
  return /\b[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)+\b/.test(normalizeCodeLine(line));
}

function normalizeCodeLine(line: string): string {
  return line.replace(/([A-Za-z0-9_])\.\s+(?=[A-Za-z_])/g, '$1.').replace(/\s+/g, ' ').trim();
}

function isLikelyParagraphSentence(line: string): boolean {
  return line.length > 100 && /[.!?]$/.test(line);
}

function detectSparsePages(lines: string[]): number[] {
  const sparsePages: number[] = [];
  let currentPageTextLength = 0;

  for (const line of lines) {
    const marker = parsePageMarker(line);
    if (marker) {
      if (currentPageTextLength > 0 && currentPageTextLength < 120)
        sparsePages.push(marker.page);
      currentPageTextLength = 0;
      continue;
    }
    if (line)
      currentPageTextLength += line.length;
  }

  return sparsePages;
}

function valueOrUnknown(value: unknown): string {
  if (typeof value === 'string' && value.trim())
    return value.trim();
  return 'Unknown';
}

function valueOrNull(value: unknown): string | null {
  if (typeof value === 'string' && value.trim())
    return value.trim();
  return null;
}

function dateOrNull(value: Date | null | undefined): string | null {
  if (!value)
    return null;
  return value.toISOString();
}

async function withParser<T>(fileName: string, callback: (parser: PDFParse) => Promise<T>): Promise<T> {
  const data = new Uint8Array(await fs.promises.readFile(fileName));
  const parser = new PDFParse({ data });
  try {
    return await callback(parser);
  } finally {
    await parser.destroy();
  }
}

async function isReadableFile(fileName: string): Promise<boolean> {
  try {
    const stat = await fs.promises.stat(fileName);
    return stat.isFile();
  } catch {
    return false;
  }
}

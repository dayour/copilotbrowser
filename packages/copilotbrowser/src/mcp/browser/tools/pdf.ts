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

import path from 'path';

import { z } from '@copilotbrowser/copilotbrowser/lib/mcpBundle';
import { formatObject } from '@copilotbrowser/copilotbrowser/lib/utils';

import { defineTabTool, defineTool } from './tool';
import { convertPdfToBundle, extractPdfDocument, extractPdfMetadata, extractPdfText, markdownFromPdfText, renderPdfPageImage, renderPdfPageImages, resolvePdfInputPath } from './pdfUtils';

const pdfSaveSchema = z.object({
  filename: z.string().optional().describe('File name to save the pdf to. Defaults to `page-{timestamp}.pdf` if not specified. Prefer relative file names to stay within the output directory.'),
});

const pdfFileSchema = z.object({
  pdfPath: z.string().describe('Path to the PDF file. Relative paths are resolved against the workspace first, then the output directory. Absolute paths are also accepted.'),
  filename: z.string().optional().describe('Optional file name for the extracted text. When omitted, text is returned inline unless the output mode writes files by default.'),
});

const pdfMetadataSchema = z.object({
  pdfPath: z.string().describe('Path to the PDF file. Relative paths are resolved against the workspace first, then the output directory. Absolute paths are also accepted.'),
  filename: z.string().optional().describe('Optional file name for the extracted metadata JSON. When omitted, metadata is returned inline unless the output mode writes files by default.'),
});

const pdfMarkdownSchema = z.object({
  pdfPath: z.string().describe('Path to the PDF file. Relative paths are resolved against the workspace first, then the output directory. Absolute paths are also accepted.'),
  filename: z.string().optional().describe('Optional file name for the generated Markdown. Defaults to inline output unless the output mode writes files by default.'),
});

const pdfPageImageSchema = z.object({
  pdfPath: z.string().describe('Path to the PDF file. Relative paths are resolved against the workspace first, then the output directory. Absolute paths are also accepted.'),
  pageNumber: z.number().int().positive().describe('1-based page number to render.'),
  type: z.enum(['png', 'jpeg']).default('png').describe('Image format for the extracted page. Defaults to png.'),
  scale: z.number().positive().optional().describe('Optional render scale multiplier for higher-fidelity page images. Defaults to 2.'),
  filename: z.string().optional().describe('Optional file name for the rendered page image. Defaults to `pdf-page-{pageNumber}.{png|jpeg}` when omitted.'),
});

const pdfImagesSchema = z.object({
  pdfPath: z.string().describe('Path to the PDF file. Relative paths are resolved against the workspace first, then the output directory. Absolute paths are also accepted.'),
  type: z.enum(['png', 'jpeg']).default('png').describe('Image format for rendered pages. Defaults to png.'),
  scale: z.number().positive().optional().describe('Optional render scale multiplier for higher-fidelity page images. Defaults to 2.'),
  maxPages: z.number().int().positive().optional().describe('Optional limit on the number of pages to render. When omitted, all pages are rendered.'),
  filenamePrefix: z.string().optional().describe('Optional prefix for rendered page image files. Each output appends `-<pageNumber>.{png|jpeg}`. Relative paths stay in the workspace or output directory.'),
});

const pdfBundleSchema = z.object({
  pdfPath: z.string().describe('Path to the PDF file. Relative paths are resolved against the workspace first, then the output directory. Absolute paths are also accepted.'),
  outputDir: z.string().optional().describe('Optional directory for the conversion bundle. Defaults to `<pdf-name>-conversion` inside the workspace or output directory.'),
  copySource: z.boolean().default(true).describe('When true, copies the source PDF into the bundle as `source.pdf`. Defaults to true.'),
  includePageImages: z.boolean().default(false).describe('When true, renders page images into `images/` and includes them in the manifest. Defaults to false.'),
  type: z.enum(['png', 'jpeg']).default('png').describe('Image format for rendered pages when `includePageImages` is enabled. Defaults to png.'),
  scale: z.number().positive().optional().describe('Optional render scale multiplier for bundle page images. Defaults to 2.'),
  maxPages: z.number().int().positive().optional().describe('Optional maximum number of pages to render into the bundle when `includePageImages` is enabled.'),
});

const pdfSave = defineTabTool({
  capability: 'pdf',

  schema: {
    name: 'browser_pdf_save',
    title: 'Save as PDF',
    description: 'Save page as PDF',
    inputSchema: pdfSaveSchema,
    type: 'readOnly',
  },

  handle: async (tab, params, response) => {
    const data = await tab.page.pdf();
    const result = await response.resolveClientFile({ prefix: 'page', ext: 'pdf', suggestedFilename: params.filename }, 'Page as pdf');
    await response.addFileResult(result, data);
    response.addCode(`await page.pdf(${formatObject({ path: result.relativeName })});`);
  },
});

const pdfExtractText = defineTool({
  capability: 'pdf',

  schema: {
    name: 'browser_pdf_extract_text',
    title: 'Extract PDF text',
    description: 'Extract text from a local PDF file.',
    inputSchema: pdfFileSchema,
    type: 'readOnly',
  },

  handle: async (context, params, response) => {
    const pdfPath = await resolvePdfInputPath(context, params.pdfPath);
    const text = await extractPdfText(pdfPath);
    await response.addResult('Extracted PDF text', text, { prefix: 'pdf-text', ext: 'txt', suggestedFilename: params.filename });
  },
});

const pdfExtractMetadata = defineTool({
  capability: 'pdf',

  schema: {
    name: 'browser_pdf_extract_metadata',
    title: 'Extract PDF metadata',
    description: 'Extract metadata and page information from a local PDF file.',
    inputSchema: pdfMetadataSchema,
    type: 'readOnly',
  },

  handle: async (context, params, response) => {
    const pdfPath = await resolvePdfInputPath(context, params.pdfPath);
    const metadata = await extractPdfMetadata(pdfPath);
    await response.addResult('Extracted PDF metadata', JSON.stringify(metadata, null, 2), { prefix: 'pdf-metadata', ext: 'json', suggestedFilename: params.filename });
  },
});

const pdfConvertToMarkdown = defineTool({
  capability: 'pdf',

  schema: {
    name: 'browser_pdf_convert_to_markdown',
    title: 'Convert PDF to Markdown',
    description: 'Convert a local PDF file into Markdown using extracted text and metadata.',
    inputSchema: pdfMarkdownSchema,
    type: 'readOnly',
  },

  handle: async (context, params, response) => {
    const pdfPath = await resolvePdfInputPath(context, params.pdfPath);
    const document = await extractPdfDocument(pdfPath);
    const markdown = markdownFromPdfText(document.metadata, document.text, path.basename(pdfPath, '.pdf'));
    await response.addResult('PDF as Markdown', markdown, { prefix: 'pdf', ext: 'md', suggestedFilename: params.filename });
  },
});

const pdfExtractPageImage = defineTool({
  capability: 'pdf',

  schema: {
    name: 'browser_pdf_extract_page_image',
    title: 'Extract PDF page image',
    description: 'Render a single page from a local PDF file as an image.',
    inputSchema: pdfPageImageSchema,
    type: 'readOnly',
  },

  handle: async (context, params, response) => {
    const pdfPath = await resolvePdfInputPath(context, params.pdfPath);
    const data = await renderPdfPageImage(pdfPath, params.pageNumber, params.type, params.scale);
    const result = await response.resolveClientFile({
      prefix: `pdf-page-${params.pageNumber}`,
      ext: params.type,
      suggestedFilename: params.filename,
    }, `PDF page ${params.pageNumber}`);
    await response.addFileResult(result, data);
    await response.registerImageResult(data, params.type);
  },
});

const pdfExtractImages = defineTool({
  capability: 'pdf',

  schema: {
    name: 'browser_pdf_extract_images',
    title: 'Extract PDF page images',
    description: 'Render pages from a local PDF file as images.',
    inputSchema: pdfImagesSchema,
    type: 'readOnly',
  },

  handle: async (context, params, response) => {
    const pdfPath = await resolvePdfInputPath(context, params.pdfPath);
    const pages = await renderPdfPageImages(pdfPath, { type: params.type, maxPages: params.maxPages, scale: params.scale });
    response.addTextResult(`Extracted ${pages.length} page image${pages.length === 1 ? '' : 's'} from ${path.basename(pdfPath)}.`);
    for (const page of pages) {
      const suggestedFilename = params.filenamePrefix ? `${params.filenamePrefix}-${page.pageNumber}.${params.type}` : undefined;
      const result = await response.resolveClientFile({
        prefix: `pdf-page-${page.pageNumber}`,
        ext: params.type,
        suggestedFilename,
      }, `PDF page ${page.pageNumber}`);
      await response.addFileResult(result, page.data);
      if (page.pageNumber === 1)
        await response.registerImageResult(page.data, params.type);
    }
  },
});

const pdfConvertToBundle = defineTool({
  capability: 'pdf',

  schema: {
    name: 'browser_pdf_convert_to_bundle',
    title: 'Convert PDF to bundle',
    description: 'Create a structured PDF conversion bundle with manifest, metadata, text, Markdown, quality report, and optional page images.',
    inputSchema: pdfBundleSchema,
    type: 'readOnly',
  },

  handle: async (context, params, response) => {
    const pdfPath = await resolvePdfInputPath(context, params.pdfPath);
    const bundleDir = params.outputDir?.trim() || `${path.basename(pdfPath, '.pdf')}-conversion`;
    const bundle = await convertPdfToBundle(pdfPath, {
      copySource: params.copySource,
      includePageImages: params.includePageImages,
      imageType: params.type,
      imageScale: params.scale,
      maxPages: params.maxPages,
    });

    response.addTextResult(`Created PDF conversion bundle for ${path.basename(pdfPath)}.`);
    if (bundle.manifest.qualityReport.warnings.length)
      response.addTextResult(`Warnings: ${bundle.manifest.qualityReport.warnings.join(', ')}`);

    if (bundle.sourceData) {
      const sourceFile = await response.resolveClientFile({
        prefix: 'source',
        ext: 'pdf',
        suggestedFilename: path.join(bundleDir, bundle.manifest.source.bundleFile!),
      }, 'Bundle source PDF');
      await response.addFileResult(sourceFile, bundle.sourceData);
    }

    const metadataFile = await response.resolveClientFile({
      prefix: 'pdf-metadata',
      ext: 'json',
      suggestedFilename: path.join(bundleDir, bundle.manifest.artifacts.metadataFile),
    }, 'Bundle metadata JSON');
    await response.addFileResult(metadataFile, bundle.metadataJson);

    const textFile = await response.resolveClientFile({
      prefix: 'pdf-text',
      ext: 'txt',
      suggestedFilename: path.join(bundleDir, bundle.manifest.artifacts.textFile),
    }, 'Bundle extracted text');
    await response.addFileResult(textFile, bundle.text);

    const markdownFile = await response.resolveClientFile({
      prefix: 'pdf',
      ext: 'md',
      suggestedFilename: path.join(bundleDir, bundle.manifest.artifacts.markdownFile),
    }, 'Bundle Markdown');
    await response.addFileResult(markdownFile, bundle.markdown);

    const qualityFile = await response.resolveClientFile({
      prefix: 'pdf-quality',
      ext: 'json',
      suggestedFilename: path.join(bundleDir, bundle.manifest.artifacts.qualityReportFile),
    }, 'Bundle quality report');
    await response.addFileResult(qualityFile, bundle.qualityReportJson);

    for (const page of bundle.pageImages) {
      const pageFile = await response.resolveClientFile({
        prefix: `pdf-page-${page.pageNumber}`,
        ext: params.type,
        suggestedFilename: path.join(bundleDir, page.fileName),
      }, `Bundle page ${page.pageNumber}`);
      await response.addFileResult(pageFile, page.data);
      if (page.pageNumber === 1)
        await response.registerImageResult(page.data, params.type);
    }

    const manifestFile = await response.resolveClientFile({
      prefix: 'pdf-manifest',
      ext: 'json',
      suggestedFilename: path.join(bundleDir, bundle.manifest.artifacts.manifestFile),
    }, 'Bundle manifest');
    await response.addFileResult(manifestFile, JSON.stringify(bundle.manifest, null, 2));
  },
});

export default [
  pdfSave,
  pdfExtractText,
  pdfExtractMetadata,
  pdfConvertToMarkdown,
  pdfConvertToBundle,
  pdfExtractPageImage,
  pdfExtractImages,
];

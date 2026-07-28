# PDF extraction and conversion

Use the opt-in PDF capability when you need to inspect local PDF files, convert them to Markdown, or render pages as images.

## Requirements

- Enable the PDF tools in MCP mode with `--caps=pdf` or `copilotbrowser_MCP_CAPS=pdf`.
- For CLI usage, the commands below work once `copilotbrowser-cli` is installed and pointed at a workspace that contains the PDF.

## Common workflows

### Extract text

```bash
copilotbrowser-cli pdf-text ./document.pdf
copilotbrowser-cli pdf-text ./document.pdf --filename=document.txt
```

### Extract metadata

```bash
copilotbrowser-cli pdf-metadata ./document.pdf
copilotbrowser-cli pdf-metadata ./document.pdf --filename=document.json
```

### Convert to Markdown

```bash
copilotbrowser-cli pdf-markdown ./document.pdf
copilotbrowser-cli pdf-markdown ./document.pdf --filename=document.md
```

The generated Markdown now removes common PDF-viewer chrome, collapses decorative spaced labels when they are redundant, reflows simple wrapped paragraphs and lists, and emits Markdown tables or fenced code blocks for some structured PDF text patterns.

### Create a full conversion bundle

```bash
copilotbrowser-cli pdf-convert ./document.pdf --output-dir=document-bundle
copilotbrowser-cli pdf-convert ./document.pdf --output-dir=document-bundle --page-images --max-pages=5 --scale=3
```

The conversion bundle writes a formal `manifest.json` alongside `metadata.json`, `document.txt`, `document.md`, `quality-report.json`, and optional `images/page-###.{png|jpeg}` files.

### Render page images

```bash
copilotbrowser-cli pdf-image ./document.pdf 1 --filename=page-1.png
copilotbrowser-cli pdf-image ./document.pdf 1 --scale=3 --filename=page-1@3x.png
copilotbrowser-cli pdf-images ./document.pdf --filename-prefix=pages/page --max-pages=5
copilotbrowser-cli pdf-images ./document.pdf --type=jpeg --scale=3 --filename-prefix=preview/page
```

## MCP tools

- `browser_pdf_save`: print the current browser page to PDF.
- `browser_pdf_extract_text`: extract text from a local PDF file.
- `browser_pdf_extract_metadata`: read metadata and page count from a local PDF file.
- `browser_pdf_convert_to_markdown`: turn extracted PDF text into Markdown.
- `browser_pdf_convert_to_bundle`: create a structured conversion bundle with a manifest and optional page images.
- `browser_pdf_extract_page_image`: render one page as PNG or JPEG, with an optional render scale.
- `browser_pdf_extract_images`: render multiple pages as PNG or JPEG files, with an optional render scale.

## Notes

- Relative PDF paths are resolved against the workspace first, then the MCP output directory. Absolute paths also work.
- `pdf-images` is intended for document extraction workflows that previously depended on Poppler-based utilities.
- When converting long PDFs, prefer `--filename` options so the extracted text or Markdown is written to disk instead of flooding the terminal.
- Use a higher `--scale` value when you need sharper page images for dense technical documents or downstream OCR.

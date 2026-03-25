/**
 * Copyright (c) DarbotLabs.
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

import { z } from '@copilotbrowser/copilotbrowser/lib/mcpBundle';
import { defineTool } from './tool';

// ---------------------------------------------------------------------------
// In-process crawl memory (shared across tool calls within one MCP session)
// ---------------------------------------------------------------------------

type CrawlMemoryEntry = {
  url: string;
  depth: number;
  visitedAt: string;
  title?: string;
};

const crawlMemory = new Map<string, CrawlMemoryEntry>();
let crawlMemoryConfig = {
  enabled: true,
  connector: 'local' as 'local' | 'darbot-memory-mcp',
  maxStates: 1000,
};

// ---------------------------------------------------------------------------
// browser_execute_intent
// ---------------------------------------------------------------------------

const executeIntent = defineTool({
  capability: 'autonomy',

  schema: {
    name: 'browser_execute_intent',
    title: 'Execute intent',
    description: 'Execute browser automation using natural language descriptions with intelligent fallback strategies. Returns the current page state annotated with intent context to guide next actions.',
    inputSchema: z.object({
      description: z.string().describe('Natural language description of what you want to accomplish'),
      context: z.string().optional().describe('Additional context about the current task or goal'),
      fallback_strategy: z.enum(['auto_detect_elements', 'search_for_targets', 'analyze_page_context', 'use_accessibility_tree'])
          .optional()
          .describe('Strategy to use if primary action fails'),
      auto_recover: z.boolean().default(true).describe('Whether to automatically recover from errors'),
    }),
    type: 'action',
  },

  handle: async (context, params, response) => {
    const tab = context.currentTab();
    const url = tab ? tab.page.url() : '(no page)';
    let title = '(no page)';
    if (tab) {
      try { title = await tab.page.title(); } catch { /* ignore */ }
    }

    const lines = [
      `INTENT: ${params.description}`,
      params.context ? `CONTEXT: ${params.context}` : null,
      `CURRENT PAGE: ${title} (${url})`,
      params.fallback_strategy ? `FALLBACK STRATEGY: ${params.fallback_strategy}` : null,
      '',
      'Use browser_click, browser_type, browser_navigate, or other tools to execute the intent.',
      'Call browser_snapshot or browser_observe to inspect the current page before acting.',
    ].filter(Boolean).join('\n');

    response.addTextResult(lines);
    response.setIncludeSnapshot();
  },
});

// ---------------------------------------------------------------------------
// browser_execute_workflow
// ---------------------------------------------------------------------------

const workflowGuides: Record<string, string> = {
  github_issue_management: 'Navigate to the repository, click Issues, use filters and labels to find issues, create/edit/close via the UI.',
  form_submission: 'Locate the form fields, fill each using browser_type or browser_fill_form, then submit with browser_click.',
  auth_login: 'Find the login form, enter credentials, submit, verify authentication by checking the URL or page content.',
  code_review_workflow: 'Navigate to the PR, read the diff, add inline comments, approve or request changes, then submit the review.',
  checkout_flow: 'Add item to cart, proceed to checkout, fill shipping info, enter payment details, confirm the order.',
  search_and_extract: 'Navigate to the target, use browser_type to enter search terms, collect results with browser_snapshot.',
};

const executeWorkflow = defineTool({
  capability: 'autonomy',

  schema: {
    name: 'browser_execute_workflow',
    title: 'Execute workflow',
    description: 'Execute predefined workflows for common automation patterns like GitHub issue management, form submission, and checkout flows.',
    inputSchema: z.object({
      intent: z.string().describe('The workflow type (e.g., "github_issue_management", "form_submission", "auth_login", "code_review_workflow")'),
      parameters: z.record(z.unknown()).describe('Parameters for the workflow execution as a JSON object'),
      validate_completion: z.boolean().default(true).describe('Whether to validate successful completion'),
      auto_recover: z.boolean().default(true).describe('Whether to automatically recover from step failures'),
    }),
    type: 'action',
  },

  handle: async (context, params, response) => {
    const tab = context.currentTab();
    const url = tab ? tab.page.url() : '(no page)';
    let title = '(no page)';
    if (tab) {
      try { title = await tab.page.title(); } catch { /* ignore */ }
    }

    const guide = workflowGuides[params.intent]
        ?? `No built-in guide for "${params.intent}". Inspect the page and execute the workflow steps manually using available browser tools.`;

    const lines = [
      `WORKFLOW: ${params.intent}`,
      `PARAMETERS:\n${JSON.stringify(params.parameters, null, 2)}`,
      `CURRENT PAGE: ${title} (${url})`,
      `WORKFLOW GUIDE: ${guide}`,
      '',
      'Execute the workflow steps using browser_click, browser_type, browser_navigate, and other available tools.',
    ].join('\n');

    response.addTextResult(lines);
    response.setIncludeSnapshot();
  },
});

// ---------------------------------------------------------------------------
// browser_analyze_context
// ---------------------------------------------------------------------------

const analyzeContext = defineTool({
  capability: 'autonomy',

  schema: {
    name: 'browser_analyze_context',
    title: 'Analyze page context',
    description: 'Analyze current page context and suggest intelligent next actions based on user patterns.',
    inputSchema: z.object({
      analyze_patterns: z.boolean().default(true).describe('Whether to analyze user behavior patterns'),
      include_suggestions: z.boolean().default(true).describe('Whether to include action suggestions'),
    }),
    type: 'readOnly',
  },

  handle: async (context, params, response) => {
    const tab = context.currentTab();
    if (!tab) {
      response.addTextResult('No open page. Call browser_navigate to open one.');
      return;
    }

    const url = tab.page.url();
    let title = '(unavailable)';
    try { title = await tab.page.title(); } catch { /* ignore */ }

    const metrics = await tab.page.evaluate(() => {
      const inputs = document.querySelectorAll('input, textarea, select');
      const links = document.querySelectorAll('a[href]');
      const buttons = document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]');
      const forms = document.querySelectorAll('form');
      const images = document.querySelectorAll('img');
      return {
        inputCount: inputs.length,
        linkCount: links.length,
        buttonCount: buttons.length,
        formCount: forms.length,
        imageCount: images.length,
        pageHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
        scrollY: Math.round(window.scrollY),
        isScrollable: document.documentElement.scrollHeight > window.innerHeight,
        hasAlerts: !!document.querySelector('[role="alert"], .alert, .notification, .toast'),
        hasModal: !!document.querySelector('[role="dialog"], .modal, [aria-modal="true"]'),
      };
    });

    const lines = [
      'PAGE ANALYSIS',
      `URL: ${url}`,
      `Title: ${title}`,
      '',
      'INTERACTIVE ELEMENTS:',
      `  Forms: ${metrics.formCount}`,
      `  Inputs / Textareas / Selects: ${metrics.inputCount}`,
      `  Buttons: ${metrics.buttonCount}`,
      `  Links: ${metrics.linkCount}`,
      `  Images: ${metrics.imageCount}`,
      `  Active modal: ${metrics.hasModal}`,
      `  Alert / notification: ${metrics.hasAlerts}`,
      `  Scrollable: ${metrics.isScrollable} (scroll ${metrics.scrollY}px / ${metrics.pageHeight - metrics.viewportHeight}px max)`,
    ];

    if (params.include_suggestions) {
      lines.push('', 'SUGGESTED NEXT ACTIONS:');
      if (metrics.hasModal)
        lines.push('  - Handle the modal dialog with browser_click or browser_handle_dialog');
      if (metrics.formCount > 0)
        lines.push('  - Fill and submit the form using browser_fill_form + browser_click');
      if (metrics.isScrollable)
        lines.push('  - Scroll to reveal more content using browser_scroll');
      if (metrics.linkCount > 0)
        lines.push('  - Navigate to a link using browser_click');
      if (metrics.buttonCount > 0)
        lines.push('  - Click an action button using browser_click');
      lines.push('  - Take a snapshot with browser_snapshot to inspect all element refs');
    }

    response.addTextResult(lines.join('\n'));
  },
});

// ---------------------------------------------------------------------------
// browser_configure_memory
// ---------------------------------------------------------------------------

const configureMemory = defineTool({
  capability: 'autonomy',

  schema: {
    name: 'browser_configure_memory',
    title: 'Configure crawl memory',
    description: 'Configure the memory system for autonomous crawling (local or darbot-memory-mcp). Controls how visited pages are tracked during browser_start_autonomous_crawl.',
    inputSchema: z.object({
      enabled: z.boolean().default(true).describe('Enable or disable memory system'),
      connector: z.enum(['local', 'darbot-memory-mcp']).default('local').describe('Memory connector type'),
      maxStates: z.number().min(10).max(10000).default(1000).describe('Maximum states to store'),
      storagePath: z.string().optional().describe('Local storage path (for local connector)'),
      endpoint: z.string().url().optional().describe('Darbot Memory MCP endpoint URL (for darbot-memory-mcp connector)'),
    }),
    type: 'action',
  },

  handle: async (_context, params, response) => {
    crawlMemoryConfig = {
      enabled: params.enabled,
      connector: params.connector,
      maxStates: params.maxStates,
    };
    if (!params.enabled)
      crawlMemory.clear();

    const lines = [
      'Crawl memory configured:',
      `  Enabled: ${params.enabled}`,
      `  Connector: ${params.connector}`,
      `  Max states: ${params.maxStates}`,
      params.storagePath ? `  Storage path: ${params.storagePath}` : null,
      params.endpoint ? `  Endpoint: ${params.endpoint}` : null,
      `  Current entries: ${crawlMemory.size}`,
    ].filter(Boolean).join('\n');

    response.addTextResult(lines);
  },
});

// ---------------------------------------------------------------------------
// browser_start_autonomous_crawl
// ---------------------------------------------------------------------------

const startAutonomousCrawl = defineTool({
  capability: 'autonomy',

  schema: {
    name: 'browser_start_autonomous_crawl',
    title: 'Start autonomous crawl',
    description: 'Start an autonomous crawling session with BFS strategy, memory, and reporting. Discovers pages by following same-domain links and returns a structured site map.',
    inputSchema: z.object({
      startUrl: z.string().describe('Starting URL for autonomous crawling'),
      goal: z.string().optional().describe('Goal description for the crawling session'),
      maxDepth: z.number().min(1).max(10).default(3).describe('Maximum crawl depth'),
      maxPages: z.number().min(1).max(100).default(20).describe('Maximum pages to visit'),
      allowedDomains: z.array(z.string()).optional().describe('List of allowed domains. Defaults to the start URL domain.'),
      takeScreenshots: z.boolean().default(false).describe('Take screenshots during crawling (slower)'),
      memoryEnabled: z.boolean().default(true).describe('Enable memory system for state tracking'),
      timeoutMs: z.number().min(30000).max(600000).default(120000).describe('Session timeout in milliseconds'),
      verbose: z.boolean().default(false).describe('Enable verbose per-page logging'),
    }),
    type: 'action',
  },

  handle: async (context, params, response) => {
    const rawUrl = params.startUrl;
    const startUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    const startHostname = new URL(startUrl).hostname;
    const allowedDomains = params.allowedDomains?.length ? params.allowedDomains : [startHostname];

    const tab = await context.ensureTab();

    type QueueEntry = { url: string; depth: number };
    const queue: QueueEntry[] = [{ url: startUrl, depth: 0 }];
    const visited = new Set<string>();
    const results: Array<{ url: string; title: string; depth: number; linkCount: number }> = [];
    const errors: Array<{ url: string; error: string }> = [];
    const verboseLines: string[] = [];

    const deadline = Date.now() + params.timeoutMs;

    while (queue.length > 0 && results.length < params.maxPages && Date.now() < deadline) {
      const entry = queue.shift()!;
      if (visited.has(entry.url))
        continue;
      if (entry.depth > params.maxDepth)
        continue;

      visited.add(entry.url);

      if (params.memoryEnabled && crawlMemoryConfig.enabled) {
        if (crawlMemory.size >= crawlMemoryConfig.maxStates)
          crawlMemory.clear();
        crawlMemory.set(entry.url, { url: entry.url, depth: entry.depth, visitedAt: new Date().toISOString() });
      }

      try {
        await tab.navigate(entry.url);

        let title = '';
        try { title = await tab.page.title(); } catch { /* ignore */ }

        // Collect unique same-domain links
        const links = await tab.page.evaluate((allowed: string[]) => {
          return Array.from(document.querySelectorAll('a[href]'))
              .map(a => {
                try {
                  return new URL((a as HTMLAnchorElement).href, window.location.href).href;
                } catch {
                  return null;
                }
              })
              .filter((href): href is string => {
                if (!href)
                  return false;
                if (href.startsWith('mailto:') || href.startsWith('javascript:') || href.startsWith('tel:'))
                  return false;
                try {
                  const u = new URL(href);
                  return allowed.some(d => u.hostname === d || u.hostname.endsWith('.' + d));
                } catch {
                  return false;
                }
              });
        }, allowedDomains);

        const uniqueLinks = [...new Set(links)];
        results.push({ url: entry.url, title, depth: entry.depth, linkCount: uniqueLinks.length });

        if (params.verbose)
          verboseLines.push(`  [${entry.depth}] ${entry.url} - "${title}" (${uniqueLinks.length} links)`);

        if (entry.depth < params.maxDepth) {
          for (const link of uniqueLinks) {
            if (!visited.has(link))
              queue.push({ url: link, depth: entry.depth + 1 });
          }
        }
      } catch (err) {
        errors.push({ url: entry.url, error: String(err) });
      }
    }

    const timedOut = Date.now() >= deadline;
    const indent = (depth: number) => '  '.repeat(depth);

    const report = [
      'AUTONOMOUS CRAWL COMPLETE',
      params.goal ? `Goal: ${params.goal}` : null,
      `Start URL: ${startUrl}`,
      `Allowed domains: ${allowedDomains.join(', ')}`,
      `Pages visited: ${results.length}`,
      `Errors: ${errors.length}`,
      timedOut ? 'WARNING: Crawl was stopped due to timeout.' : null,
      '',
      'SITE MAP:',
      ...results.map(r => `${indent(r.depth)}[${r.depth}] ${r.url}${r.title ? ` - "${r.title}"` : ''} (${r.linkCount} links)`),
      errors.length ? ['', 'ERRORS:', ...errors.map(e => `  ${e.url}: ${e.error}`)].join('\n') : null,
      verboseLines.length ? ['', 'VERBOSE LOG:', ...verboseLines].join('\n') : null,
    ].filter(Boolean).join('\n');

    response.addTextResult(report);
  },
});

export default [
  executeIntent,
  executeWorkflow,
  analyzeContext,
  configureMemory,
  startAutonomousCrawl,
];

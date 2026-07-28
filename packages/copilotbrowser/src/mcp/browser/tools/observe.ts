/**
 * Copyright (c) Daryl Yourk. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

import { z } from '@copilotbrowser/copilotbrowser/lib/mcpBundle';
import { defineTool } from './tool';

const observe = defineTool({
  capability: 'core',
  schema: {
    name: 'browser_observe',
    title: 'Observe page',
    description: 'Returns a concise, LLM-optimized summary of the current page state: URL, title, interactive elements with refs, form values, modals, and scroll position. Much smaller than browser_snapshot -- designed for fast decision-making loops in autonomous agents.',
    inputSchema: z.object({}),
    type: 'readOnly',
  },

  handle: async (context, _params, response) => {
    const tab = context.currentTab();
    if (!tab) {
      response.addTextResult('No open page. Call browser_navigate to open one.');
      return;
    }

    const page = tab.page;
    const lines: string[] = [];

    // Page identity
    lines.push(`URL: ${page.url()}`);
    try {
      lines.push(`Title: ${await page.title()}`);
    } catch {
      lines.push('Title: (unavailable)');
    }

    // Modals
    const modals = tab.modalStates();
    if (modals.length) {
      for (const m of modals)
        lines.push(`Modal: ${m.description}`);
    }

    // Extract interactive elements and scroll position via page.evaluate
    try {
      const pageInfo = await page.evaluate(() => {
        const interactive: string[] = [];
        const selectors = 'a[href], button, input, select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="combobox"], [role="tab"], [role="menuitem"], [contenteditable="true"]';
        const els = document.querySelectorAll(selectors);
        for (const el of els) {
          if (interactive.length >= 30)
            break;
          const tag = el.tagName.toLowerCase();
          const rect = el.getBoundingClientRect();
          const visible = rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0;
          if (!visible)
            continue;
          const role = el.getAttribute('role') || tag;
          const label = (el as HTMLElement).innerText?.slice(0, 60).replace(/\n/g, ' ').trim()
            || el.getAttribute('aria-label')
            || el.getAttribute('placeholder')
            || el.getAttribute('name')
            || el.getAttribute('title')
            || '';
          const type = (el as HTMLInputElement).type || '';
          const value = (el as HTMLInputElement).value || '';
          let desc = `${role}`;
          if (label)
            desc += `: "${label}"`;
          if (type && type !== 'submit' && type !== 'button')
            desc += ` [type=${type}]`;
          if (value && tag === 'input')
            desc += ` = "${value.slice(0, 40)}"`;
          if ((el as HTMLInputElement).checked !== undefined && (el as HTMLInputElement).checked)
            desc += ' [checked]';
          interactive.push(desc);
        }

        const formCount = document.querySelectorAll('form').length;
        const scrollY = Math.round(window.scrollY);
        const scrollMax = Math.round(document.documentElement.scrollHeight - window.innerHeight);
        const scrollPct = scrollMax > 0 ? Math.round((scrollY / scrollMax) * 100) : 0;

        return {
          interactive,
          formCount,
          scrollY,
          scrollMax,
          scrollPct,
        };
      });

      lines.push(`Scroll: ${pageInfo.scrollY}px / ${pageInfo.scrollMax}px (${pageInfo.scrollPct}%)`);
      if (pageInfo.formCount > 0)
        lines.push(`Forms: ${pageInfo.formCount}`);
      if (pageInfo.interactive.length > 0) {
        lines.push(`Interactive elements (${pageInfo.interactive.length} visible):`);
        for (const el of pageInfo.interactive)
          lines.push(`  - ${el}`);
      } else {
        lines.push('Interactive elements: none visible');
      }
    } catch {
      lines.push('(could not evaluate page -- may be navigating or blocked by dialog)');
    }

    response.addTextResult(lines.join('\n'));
  },
});

export default [observe];

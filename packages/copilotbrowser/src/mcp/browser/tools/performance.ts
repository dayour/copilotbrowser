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

import { z } from '@copilotbrowser/copilotbrowser/lib/mcpBundle';
import { defineTabTool } from './tool';

const performanceMetrics = defineTabTool({
  capability: 'core',
  schema: {
    name: 'browser_performance_metrics',
    title: 'Page performance metrics',
    description: 'Returns page performance timing metrics including DOM load, TTFB, DNS lookup, and navigation timing.',
    inputSchema: z.object({}),
    type: 'readOnly',
  },

  handle: async (tab, params, response) => {
    const metrics = await tab.page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (!nav) {
        // Fallback to legacy API
        const t = performance.timing;
        return {
          dnsLookup: t.domainLookupEnd - t.domainLookupStart,
          tcpConnection: t.connectEnd - t.connectStart,
          serverResponse: t.responseStart - t.requestStart,
          ttfb: t.responseStart - t.navigationStart,
          domContentLoaded: t.domContentLoadedEventEnd - t.navigationStart,
          loadComplete: t.loadEventEnd - t.navigationStart,
          domInteractive: t.domInteractive - t.navigationStart,
          domParsing: t.domComplete - t.domInteractive,
          redirectCount: 0,
          navigationType: 'navigate',
        };
      }
      return {
        dnsLookup: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
        tcpConnection: Math.round(nav.connectEnd - nav.connectStart),
        serverResponse: Math.round(nav.responseStart - nav.requestStart),
        ttfb: Math.round(nav.responseStart - nav.startTime),
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
        loadComplete: Math.round(nav.loadEventEnd - nav.startTime),
        domInteractive: Math.round(nav.domInteractive - nav.startTime),
        domParsing: Math.round(nav.domComplete - nav.domInteractive),
        redirectCount: nav.redirectCount,
        navigationType: nav.type,
      };
    });

    const lines = [
      `=== Performance Metrics ===`,
      ``,
      `📊 Core Timings:`,
      `  • DOM Content Loaded: ${metrics.domContentLoaded}ms`,
      `  • Load Complete: ${metrics.loadComplete}ms`,
      `  • DOM Interactive: ${metrics.domInteractive}ms`,
      ``,
      `🌐 Network Timing:`,
      `  • DNS Lookup: ${metrics.dnsLookup}ms`,
      `  • TCP Connection: ${metrics.tcpConnection}ms`,
      `  • Server Response: ${metrics.serverResponse}ms`,
      `  • Time to First Byte: ${metrics.ttfb}ms`,
      ``,
      `📄 DOM Parsing:`,
      `  • DOM Parsing Time: ${metrics.domParsing}ms`,
      ``,
      `🔄 Navigation:`,
      `  • Type: ${metrics.navigationType}`,
      `  • Redirect Count: ${metrics.redirectCount}`,
    ];

    response.addTextResult(lines.join('\n'));
    response.addCode(`const metrics = await page.evaluate(() => JSON.stringify(performance.getEntriesByType('navigation')[0]));`);
  },
});

export default [
  performanceMetrics,
];

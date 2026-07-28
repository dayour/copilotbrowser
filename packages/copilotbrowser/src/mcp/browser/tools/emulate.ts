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
import { defineTool, defineTabTool } from './tool';

const emulateMedia = defineTabTool({
  capability: 'emulate',

  schema: {
    name: 'browser_emulate_media',
    title: 'Emulate media features',
    description: 'Autonomously emulate media features like color scheme, reduced motion, contrast preference, and media type for accessibility and responsive testing.',
    inputSchema: z.object({
      colorScheme: z.enum(['light', 'dark', 'no-preference', 'null']).optional().describe('Emulate color scheme preference: light, dark, no-preference, or null to reset'),
      reducedMotion: z.enum(['reduce', 'no-preference', 'null']).optional().describe('Emulate prefers-reduced-motion: reduce, no-preference, or null to reset'),
      contrast: z.enum(['more', 'less', 'no-preference', 'null']).optional().describe('Emulate prefers-contrast: more, less, no-preference, or null to reset'),
      forcedColors: z.enum(['active', 'none', 'null']).optional().describe('Emulate forced-colors: active, none, or null to reset'),
      media: z.enum(['screen', 'print', 'null']).optional().describe('Emulate media type: screen, print, or null to reset'),
    }),
    type: 'action',
  },

  handle: async (tab, params, response) => {
    const opts: Record<string, string | null> = {};
    if (params.colorScheme !== undefined)
      opts.colorScheme = params.colorScheme === 'null' ? null : params.colorScheme;
    if (params.reducedMotion !== undefined)
      opts.reducedMotion = params.reducedMotion === 'null' ? null : params.reducedMotion;
    if (params.contrast !== undefined)
      opts.contrast = params.contrast === 'null' ? null : params.contrast;
    if (params.forcedColors !== undefined)
      opts.forcedColors = params.forcedColors === 'null' ? null : params.forcedColors;
    if (params.media !== undefined)
      opts.media = params.media === 'null' ? null : params.media;

    await tab.page.emulateMedia(opts as any);
    const applied = Object.entries(opts).map(([k, v]) => `${k}=${v ?? 'reset'}`).join(', ');
    response.addTextResult(`Media emulation applied: ${applied || 'no changes'}`);
    response.addCode(`await page.emulateMedia(${JSON.stringify(opts)});`);
  },
});

const emulateGeolocation = defineTool({
  capability: 'emulate',

  schema: {
    name: 'browser_emulate_geolocation',
    title: 'Emulate geolocation',
    description: 'Autonomously emulate a geographic location for location-based testing.',
    inputSchema: z.object({
      latitude: z.number().min(-90).max(90).describe('Latitude between -90 and 90'),
      longitude: z.number().min(-180).max(180).describe('Longitude between -180 and 180'),
      accuracy: z.number().optional().describe('Accuracy in meters. Defaults to 0.'),
    }),
    type: 'action',
  },

  handle: async (context, params, response) => {
    const browserContext = await context.ensureBrowserContext();
    const geo = { latitude: params.latitude, longitude: params.longitude, accuracy: params.accuracy ?? 0 };
    await browserContext.setGeolocation(geo);
    response.addTextResult(`Geolocation set to lat=${params.latitude}, lng=${params.longitude} (accuracy: ${geo.accuracy}m)`);
    response.addCode(`await context.setGeolocation({ latitude: ${params.latitude}, longitude: ${params.longitude}, accuracy: ${geo.accuracy} });`);
  },
});

const emulateTimezone = defineTabTool({
  capability: 'emulate',

  schema: {
    name: 'browser_emulate_timezone',
    title: 'Emulate timezone',
    description: 'Autonomously change the browser timezone for testing time-sensitive features. Overrides Intl.DateTimeFormat on the current page via JavaScript injection.',
    inputSchema: z.object({
      timezoneId: z.string().describe('Timezone ID (e.g., "America/New_York", "Europe/London", "Asia/Tokyo")'),
    }),
    type: 'action',
  },

  handle: async (tab, params, response) => {
    // NOTE: Reliable cross-session timezone emulation requires setting timezoneId in context options at launch.
    // This implementation overrides Intl.DateTimeFormat on the current page for immediate effect.
    await tab.page.evaluate((tz: string) => {
      const _OriginalDateTimeFormat = Intl.DateTimeFormat;
      const PatchedDateTimeFormat = function(
          locale?: string | string[],
          options: Intl.DateTimeFormatOptions = {}
      ) {
        return new _OriginalDateTimeFormat(locale, { ...options, timeZone: tz });
      } as typeof Intl.DateTimeFormat;
      PatchedDateTimeFormat.supportedLocalesOf = _OriginalDateTimeFormat.supportedLocalesOf.bind(_OriginalDateTimeFormat);
      (Intl as any).DateTimeFormat = PatchedDateTimeFormat;
    }, params.timezoneId);
    response.addTextResult(`Timezone emulation applied: ${params.timezoneId} (Intl.DateTimeFormat patched on current page)`);
    response.addCode(`await page.evaluate((tz) => { /* Intl.DateTimeFormat override for ${params.timezoneId} */ }, '${params.timezoneId}');`);
  },
});

export default [
  emulateMedia,
  emulateGeolocation,
  emulateTimezone,
];

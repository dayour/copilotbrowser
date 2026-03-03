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

const actionStepSchema = z.object({
  action: z.enum(['click', 'type', 'press_key', 'select_option', 'navigate', 'wait', 'scroll', 'hover']).describe('Action to perform'),
  ref: z.string().optional().describe('Element ref from snapshot (for click, type, hover, select_option)'),
  text: z.string().optional().describe('Text to type, key to press, URL to navigate, or text to wait for'),
  values: z.array(z.string()).optional().describe('Values for select_option'),
  deltaY: z.number().optional().describe('Scroll delta Y pixels'),
});

const multiAction = defineTool({
  capability: 'core',
  schema: {
    name: 'browser_multi_action',
    title: 'Execute multiple actions',
    description: 'Execute multiple browser actions in sequence. Stops on first error and reports which steps succeeded. Reduces round trips for multi-step flows like form fills, navigation sequences, and checkout flows.',
    inputSchema: z.object({
      actions: z.array(actionStepSchema).min(1).max(20).describe('Array of actions to execute in order. Max 20 steps.'),
    }),
    type: 'action',
  },

  handle: async (context, params, response) => {
    const tab = await context.ensureTab();
    const page = tab.page;
    const results: string[] = [];
    let stepIndex = 0;

    for (const step of params.actions) {
      stepIndex++;
      try {
        switch (step.action) {
          case 'click': {
            if (!step.ref)
              throw new Error('click requires ref');
            const { locator } = await tab.refLocator({ ref: step.ref, element: step.text });
            await tab.waitForCompletion(async () => {
              await locator.click();
            });
            results.push(`Step ${stepIndex}: click ref=${step.ref} -- OK`);
            break;
          }
          case 'type': {
            if (!step.ref || !step.text)
              throw new Error('type requires ref and text');
            const { locator } = await tab.refLocator({ ref: step.ref, element: step.text });
            await locator.fill(step.text);
            results.push(`Step ${stepIndex}: type "${step.text.slice(0, 30)}" into ref=${step.ref} -- OK`);
            break;
          }
          case 'press_key': {
            if (!step.text)
              throw new Error('press_key requires text (key name)');
            await page.keyboard.press(step.text);
            results.push(`Step ${stepIndex}: press_key "${step.text}" -- OK`);
            break;
          }
          case 'select_option': {
            if (!step.ref || !step.values)
              throw new Error('select_option requires ref and values');
            const { locator } = await tab.refLocator({ ref: step.ref, element: step.text });
            await locator.selectOption(step.values);
            results.push(`Step ${stepIndex}: select "${step.values.join(', ')}" in ref=${step.ref} -- OK`);
            break;
          }
          case 'navigate': {
            if (!step.text)
              throw new Error('navigate requires text (URL)');
            await page.goto(step.text);
            results.push(`Step ${stepIndex}: navigate to ${step.text} -- OK`);
            break;
          }
          case 'wait': {
            if (step.text) {
              await page.getByText(step.text).first().waitFor({ state: 'visible', timeout: 10000 });
              results.push(`Step ${stepIndex}: wait for "${step.text}" -- OK`);
            } else {
              await page.waitForTimeout(1000);
              results.push(`Step ${stepIndex}: wait 1s -- OK`);
            }
            break;
          }
          case 'scroll': {
            const dy = step.deltaY ?? 300;
            await page.mouse.wheel(0, dy);
            results.push(`Step ${stepIndex}: scroll ${dy}px -- OK`);
            break;
          }
          case 'hover': {
            if (!step.ref)
              throw new Error('hover requires ref');
            const { locator } = await tab.refLocator({ ref: step.ref, element: step.text });
            await locator.hover();
            results.push(`Step ${stepIndex}: hover ref=${step.ref} -- OK`);
            break;
          }
        }
      } catch (error: any) {
        results.push(`Step ${stepIndex}: ${step.action} -- FAILED: ${error.message}`);
        results.push(`Stopped at step ${stepIndex}/${params.actions.length}. Steps 1-${stepIndex - 1} succeeded.`);
        response.addTextResult(results.join('\n'));
        response.setIncludeSnapshot();
        return;
      }
    }

    results.push(`All ${params.actions.length} steps completed successfully.`);
    response.addTextResult(results.join('\n'));
    response.setIncludeSnapshot();
  },
});

export default [multiAction];

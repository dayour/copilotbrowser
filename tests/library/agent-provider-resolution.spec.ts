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

import { browserTest as test, expect } from '../config/browserTest';
import { resolveLLMProvider } from '../../packages/copilotbrowser/src/agents/llmProvider';

test('resolves inline provider and applies policy', () => {
  const resolved = resolveLLMProvider({
    runAgentsMode: 'all',
    agentOptions: {
      provider: {
        api: 'anthropic',
        apiKey: 'key',
        model: 'claude-sonnet-4-5',
      },
      providerPolicy: provider => ({ ...provider, model: provider.model + '-patched' }),
    },
  });

  expect(resolved?.model).toBe('claude-sonnet-4-5-patched');
});

test('prefers adapter when provided', () => {
  const resolved = resolveLLMProvider({
    runAgentsMode: 'all',
    agentOptions: {
      provider: {
        name: 'adapter',
        resolve: () => ({
          api: 'openai',
          apiKey: 'key',
          model: 'gpt-4o-mini',
        }),
      },
    },
  });

  expect(resolved).toEqual({
    api: 'openai',
    apiKey: 'key',
    model: 'gpt-4o-mini',
  });
});

test('returns undefined when runAgents is none', () => {
  const resolved = resolveLLMProvider({
    runAgentsMode: 'none',
    agentOptions: {
      provider: {
        api: 'google',
        apiKey: 'key',
        model: 'gemini',
      },
    },
  });

  expect(resolved).toBeUndefined();
});

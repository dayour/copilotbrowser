/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
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

import type { AgentOptions, LLMProvider, LLMProviderAdapter, LLMProviderConfig, LLMProviderPolicy } from '../../types/test';

export interface LLMProviderAdapterContext {
  agentOptions: AgentOptions;
}

export function isLLMProviderAdapter(provider: LLMProvider | undefined): provider is LLMProviderAdapter {
  return !!provider && typeof (provider as LLMProviderAdapter).resolve === 'function';
}

export function isLLMProviderConfig(provider: LLMProvider | undefined): provider is LLMProviderConfig {
  return !!provider && !isLLMProviderAdapter(provider);
}

export const defaultLLMProviderAdapter: LLMProviderAdapter = {
  name: 'default-inline-provider',
  resolve: ({ agentOptions }) => {
    if (isLLMProviderConfig(agentOptions.provider))
      return agentOptions.provider;
    return undefined;
  },
};

function normalizePolicies(policy?: AgentOptions['providerPolicy']): LLMProviderPolicy[] {
  if (!policy)
    return [];
  return Array.isArray(policy) ? policy : [policy];
}

export function resolveLLMProvider(params: {
  agentOptions?: AgentOptions;
  runAgentsMode?: 'all' | 'missing' | 'none';
}): LLMProviderConfig | undefined {
  const { agentOptions, runAgentsMode } = params;
  if (!agentOptions || runAgentsMode === 'none')
    return undefined;

  const adapter = isLLMProviderAdapter(agentOptions.provider) ? agentOptions.provider : defaultLLMProviderAdapter;
  const resolved = adapter?.resolve({ agentOptions });
  if (!resolved)
    return undefined;

  return normalizePolicies(agentOptions.providerPolicy).reduce<LLMProviderConfig | undefined>((current, policy) => {
    if (!current)
      return current;
    return policy({ ...current });
  }, resolved);
}

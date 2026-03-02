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

// @ts-check

/**
 * ESLint 10 compatibility wrapper for eslint-plugin-notice.
 *
 * ESLint 10 removed the deprecated context.getFilename() and
 * context.getSourceCode() methods. This wrapper intercepts the
 * plugin's rule create() function and provides shims so the
 * original plugin works unmodified.
 */

import originalPlugin from 'eslint-plugin-notice';

/** @param {any} context */
function shimContext(context) {
  // Return a Proxy that intercepts the removed methods.
  return new Proxy(context, {
    get(target, prop, receiver) {
      if (prop === 'getFilename')
        return () => target.filename;
      if (prop === 'getSourceCode')
        return () => target.sourceCode;
      return Reflect.get(target, prop, receiver);
    }
  });
}

/** @type {Record<string, any>} */
const wrappedRules = {};
for (const [ruleName, rule] of Object.entries(originalPlugin.rules)) {
  wrappedRules[ruleName] = {
    ...rule,
    /** @param {any} context */
    create(context) {
      return rule.create(shimContext(context));
    },
  };
}

export default {
  meta: {
    name: 'eslint-plugin-notice-compat',
    version: '1.0.0',
  },
  rules: wrappedRules,
};

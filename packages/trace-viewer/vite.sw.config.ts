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

import { defineConfig } from 'vite';
// @ts-expect-error - resolved by bundler
import react from '@vitejs/plugin-react';

import { bundle } from './bundle';

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  plugins: [
    react(),
    bundle()
  ],
  resolve: {
    // Prefer source TS files over sibling JS artifacts during bundling.
    // This avoids Rollup resolving CommonJS sidecar files and failing named exports.
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'],
    alias: {
      '@isomorphic': path.resolve(__dirname, '../copilotbrowser-core/src/utils/isomorphic'),
      '@protocol': path.resolve(__dirname, '../protocol/src'),
      '@testIsomorphic': path.resolve(__dirname, '../copilotbrowser-core/src/utils/testIsomorphic'),
      '@trace': path.resolve(__dirname, '../trace/src'),
      '@web': path.resolve(__dirname, '../web/src'),
    },
  },
  publicDir: false,
  build: {
    outDir: path.resolve(__dirname, '../copilotbrowser-core/lib/vite/traceViewer'),
    // Output dir is shared with vite.config.ts, clearing it here is racy.
    emptyOutDir: false,
    rollupOptions: {
      input: {
        sw: path.resolve(__dirname, 'src/sw-main.ts'),
      },
      plugins: [
        {
          // Replace import.meta.url with self.location.href so the service
          // worker bundle can be loaded as a classic (non-module) script.
          name: 'resolve-sw-import-meta-url',
          resolveImportMeta(prop: string | null) {
            if (prop === 'url')
              return '(typeof self !== "undefined" ? self.location.href : "")';
            return null;
          },
        },
      ],
      output: {
        entryFileNames: info => 'sw.bundle.js',
        assetFileNames: () => 'sw.[hash][extname]',
        manualChunks: undefined,
      },
    },
  }
});

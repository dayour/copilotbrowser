// @ts-check
import '../src/assets/index.css';
import { beforeMount, afterMount } from 'copilotbrowser/ct/svelte/hooks';

export type HooksConfig = {
  route: string;
}

beforeMount<HooksConfig>(async ({ hooksConfig }) => {
  console.log(`Before mount: ${JSON.stringify(hooksConfig)}`);
});
  
afterMount<HooksConfig>(async () => {
  console.log(`After mount`);
});

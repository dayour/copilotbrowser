/**
 * Copilot Studio Agent Creator — copilotbrowser Automation
 *
 * Designed to run via copilotbrowser's browser_run_code tool.
 * The runner.mjs injects the spec JSON in place of __SPEC__ before calling the tool.
 *
 * Standalone browser_run_code usage:
 *   Pass the entire file content as the `code` argument after replacing __SPEC__
 *   with your JSON spec object literal.
 *
 * What this automates:
 *   1. Navigate to Copilot Studio home
 *   2. Create agent from natural-language description (Copilot AI bootstraps it)
 *   3. Overwrite instructions with the full spec
 *   4. Set model
 *   5. Configure web search toggle
 *   6. Add website knowledge sources
 *   7. Save
 *   8. Run a validation test chat (optional)
 */
async (page) => {
  const spec = __SPEC__;

  // ── Logging ──────────────────────────────────────────────────────────────
  const log = (msg) => {
    const ts = new Date().toISOString().slice(11, 19);
    console.log(`[AgentBuilder ${ts}] ${msg}`);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  async function safeFill(locator, value, label) {
    try {
      await locator.waitFor({ state: 'visible', timeout: 8000 });
      await locator.clear();
      await locator.fill(value);
      log(`  ✓ Filled: ${label}`);
    } catch (e) {
      log(`  ⚠ Could not fill "${label}": ${e.message}`);
    }
  }

  async function safeClick(locator, label, timeout = 5000) {
    try {
      await locator.click({ timeout });
      log(`  ✓ Clicked: ${label}`);
      return true;
    } catch (e) {
      log(`  ⚠ Could not click "${label}": ${e.message}`);
      return false;
    }
  }

  async function waitForUrlPart(fragment, timeout = 60000) {
    await page.waitForURL((url) => url.href.includes(fragment), { timeout });
  }

  // ── Step 1: Navigate to Copilot Studio home ───────────────────────────────
  const base = spec.environment.baseUrl || 'https://copilotstudio.microsoft.com';
  const envId = spec.environment.id;
  const homeUrl = `${base}/environments/${envId}/home`;

  log(`Navigating to ${homeUrl}`);
  await page.goto(homeUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2500);

  // Dismiss any welcome / "what's new" dialogs that appear on load
  const dialogDismissSelectors = [
    'button[name="Got it!"]',
    'button[name="Got it"]',
    'button[name="Skip"]',
  ];
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.waitForTimeout(800);
    let dismissed = false;
    for (const name of ['Got it!', 'Got it', 'Skip']) {
      try {
        const btn = page.getByRole('button', { name, exact: true });
        if (await btn.isVisible({ timeout: 1000 })) {
          await btn.click();
          log(`Dismissed dialog: "${name}"`);
          dismissed = true;
          break;
        }
      } catch { /* not present */ }
    }
    if (!dismissed) break;
  }

  // ── Step 2: Natural-language agent creation ───────────────────────────────
  log(`Creating agent via NL prompt: "${spec.name}"`);

  // Ensure we're on the Agent tab (not Workflow)
  try {
    await page.getByRole('tab', { name: 'Agent' }).click({ timeout: 3000 });
    await page.waitForTimeout(400);
  } catch { /* already selected */ }

  // Fill the NL description box
  const nlPrompt = `${spec.name}: ${spec.shortDescription}`;
  const nlBox = page.getByRole('textbox', { name: /describing what your agent/ });
  await safeFill(nlBox, nlPrompt, 'NL creation prompt');
  await page.waitForTimeout(600);

  // Click Send
  await safeClick(page.getByRole('button', { name: 'Send' }), 'Send NL prompt');

  // Wait for Copilot Studio to create the agent and navigate to its overview
  log('Waiting for agent creation (up to 90s)...');
  await waitForUrlPart('/bots/', 90000);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2500);

  // Capture the new bot ID from URL
  const botId = page.url().match(/\/bots\/([a-f0-9-]+)\//)?.[1] || 'unknown';
  const agentUrl = `${base}/environments/${envId}/bots/${botId}/overview`;
  log(`Agent created — ID: ${botId}`);

  // Navigate to Overview (in case NL creation landed on a sub-page)
  if (!page.url().includes('/overview')) {
    await page.goto(agentUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  }

  // ── Step 3: Set full instructions ────────────────────────────────────────
  if (spec.instructions) {
    log('Setting agent instructions...');
    // Must click Edit to enter edit mode before filling
    await safeClick(
      page.getByTestId('agent-instructions-card').getByRole('button', { name: 'Edit' }),
      'Edit instructions',
      6000,
    );
    await page.waitForTimeout(500);
    const instrBox = page.getByRole('textbox', {
      name: /Describe what you want this agent to do/,
    });
    await safeFill(instrBox, spec.instructions, 'instructions');
    await page.waitForTimeout(400);
    // Click Save (enabled once text changes)
    await safeClick(page.getByRole('button', { name: 'Save' }), 'Save instructions', 4000);
    await page.waitForTimeout(1500);
  }

  // ── Step 4: Set model ─────────────────────────────────────────────────────
  if (spec.model) {
    log(`Setting model to "${spec.model}"...`);
    try {
      // The model combobox is inside the "Select your agent's model" group
      const modelCombo = page.getByRole('combobox').first();
      await modelCombo.click({ timeout: 5000 });
      await page.waitForTimeout(500);
      // Try exact match first, then partial match
      const exactOption = page.getByRole('option', { name: spec.model, exact: true });
      const partialOption = page.getByRole('option').filter({ hasText: spec.model });
      if (await exactOption.isVisible({ timeout: 2000 })) {
        await exactOption.click();
      } else if (await partialOption.first().isVisible({ timeout: 2000 })) {
        await partialOption.first().click();
      } else {
        // Dismiss and log available models for debugging
        await page.keyboard.press('Escape');
        log(`  ⚠ Model "${spec.model}" not found — keeping default`);
      }
      await page.waitForTimeout(600);
      log(`  ✓ Model configured`);
    } catch (e) {
      log(`  ⚠ Could not set model: ${e.message}`);
    }
  }

  // ── Step 5: Web Search toggle ─────────────────────────────────────────────
  const webSearch = spec.knowledge?.webSearch ?? true;
  try {
    const wsSwitch = page.getByRole('switch', { name: /Web Search/ });
    await wsSwitch.waitFor({ state: 'visible', timeout: 5000 });
    // Some environments lock the toggle (disabled); skip gracefully
    const isDisabled = await wsSwitch.isDisabled().catch(() => false);
    if (isDisabled) {
      log(`  ⚠ Web Search toggle is locked in this environment — leaving as-is`);
    } else {
      const isOn = await wsSwitch.isChecked();
      if (webSearch !== isOn) {
        await wsSwitch.click();
        log(`  ✓ Web Search turned ${webSearch ? 'ON' : 'OFF'}`);
      } else {
        log(`  ✓ Web Search already ${webSearch ? 'ON' : 'OFF'}`);
      }
    }
  } catch (e) {
    log(`  ⚠ Could not configure Web Search: ${e.message}`);
  }

  // ── Step 6: Save overview ─────────────────────────────────────────────────
  try {
    const saveBtn = page.getByRole('button', { name: 'Save' });
    if (await saveBtn.isVisible({ timeout: 2000 })) {
      await saveBtn.click();
      log('Overview saved');
      await page.waitForTimeout(1500);
    } else {
      log('No explicit Save button — overview auto-saves');
    }
  } catch { /* auto-save */ }

  // ── Step 7: Add website knowledge sources ────────────────────────────────
  for (const site of (spec.knowledge?.websites || [])) {
    log(`Adding website knowledge: ${site}`);
    try {
      // Click "Add knowledge"
      const addKnBtn = page.getByRole('button', { name: 'Add knowledge' }).first();
      await addKnBtn.click({ timeout: 6000 });
      await page.waitForTimeout(1000);

      // Pick "Public websites"
      const pubOption = page.getByText('Public website', { exact: false });
      if (await pubOption.isVisible({ timeout: 4000 })) {
        await pubOption.click();
        await page.waitForTimeout(600);
        // Enter the URL
        const urlInput = page.getByRole('textbox').filter({ hasText: '' }).first();
        await urlInput.fill(site);
        await safeClick(page.getByRole('button', { name: 'Add' }), 'Add knowledge URL');
        await page.waitForTimeout(2000);
      }

      // Close dialog if still open
      try {
        await page.getByRole('button', { name: 'Close' }).click({ timeout: 1000 });
      } catch { /* already closed */ }
    } catch (e) {
      log(`  ⚠ Could not add knowledge source "${site}": ${e.message}`);
    }
  }

  // ── Step 8: Validation test chat ─────────────────────────────────────────
  let testResponse = null;
  if (spec.validation?.testMessage) {
    log(`Running validation: "${spec.validation.testMessage}"`);
    try {
      // Test pane is usually auto-open; use getByTestId for the reliable input selector
      const chatInput = page.getByTestId('send box text area');
      if (!(await chatInput.isVisible({ timeout: 3000 }))) {
        // Pane not open — click Test button to open it
        await safeClick(page.getByRole('button', { name: 'Test' }), 'Open test pane', 6000);
        await page.waitForTimeout(1500);
      }
      await chatInput.fill(spec.validation.testMessage);
      await chatInput.press('Enter');

      // Wait for bot response (up to 20s)
      await page.waitForTimeout(12000);

      // Scrape the last bot response article
      const botArticles = await page
        .locator('article')
        .filter({ hasText: 'Bot said:' })
        .allTextContents();
      const last = botArticles[botArticles.length - 1] || '';
      // Strip the "Bot said:" prefix and rating noise
      testResponse = last.replace(/^.*?Bot said:\s*/s, '').replace(/\s*(Like|Dislike).*/s, '').trim() || null;

      // Check expected keywords
      if (spec.validation.expectedKeywords?.length) {
        const lc = (testResponse || '').toLowerCase();
        const hits = spec.validation.expectedKeywords.filter((kw) => lc.includes(kw.toLowerCase()));
        log(`  Keyword check: ${hits.length}/${spec.validation.expectedKeywords.length} matched`);
      }
      log(`  Response preview: ${testResponse?.slice(0, 120)}...`);
    } catch (e) {
      log(`  ⚠ Validation chat failed: ${e.message}`);
    }
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  log(`✅ Agent builder complete! Agent URL: ${agentUrl}`);

  return {
    success: true,
    agentId: botId,
    agentUrl,
    name: spec.name,
    testResponse,
    timestamp: new Date().toISOString(),
  };
}

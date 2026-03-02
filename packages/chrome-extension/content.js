/**
 * Copyright (c) Daryl Yourk. All rights reserved.
 * Licensed under the Apache License, Version 2.0.
 */

let isRecording = false;
let isInspecting = false;
const recordedActions = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startRecording') {
    isRecording = !isRecording;
    if (isRecording)
      startRecording();
    else
      stopRecording();
    sendResponse({ recording: isRecording });
  } else if (message.action === 'inspectSelector') {
    isInspecting = !isInspecting;
    if (isInspecting)
      startInspecting();
    else
      stopInspecting();
    sendResponse({ inspecting: isInspecting });
  }
  return true;
});

function startRecording() {
  recordedActions.length = 0;
  document.addEventListener('click', recordClick, true);
  document.addEventListener('input', recordInput, true);
}

function stopRecording() {
  document.removeEventListener('click', recordClick, true);
  document.removeEventListener('input', recordInput, true);
  if (recordedActions.length > 0) {
    const code = generateTestCode(recordedActions);
    chrome.runtime.sendMessage({ action: 'testGenerated', code });
  }
}

function recordClick(event) {
  const selector = generateSelector(event.target);
  recordedActions.push({ type: 'click', selector, timestamp: Date.now() });
}

function recordInput(event) {
  const selector = generateSelector(event.target);
  recordedActions.push({ type: 'fill', selector, value: event.target.value, timestamp: Date.now() });
}

function startInspecting() {
  document.addEventListener('mouseover', highlightElement, true);
  document.addEventListener('click', pickElement, true);
}

function stopInspecting() {
  document.removeEventListener('mouseover', highlightElement, true);
  document.removeEventListener('click', pickElement, true);
  removeHighlight();
}

function highlightElement(event) {
  removeHighlight();
  const el = event.target;
  el.dataset.copilotbrowserHighlight = 'true';
  el.style.outline = '2px solid #2ead33';
  el.style.outlineOffset = '-1px';
}

function removeHighlight() {
  const highlighted = document.querySelector('[data-copilotbrowser-highlight]');
  if (highlighted) {
    highlighted.style.outline = '';
    highlighted.style.outlineOffset = '';
    delete highlighted.dataset.copilotbrowserHighlight;
  }
}

function pickElement(event) {
  event.preventDefault();
  event.stopPropagation();
  const selector = generateSelector(event.target);
  chrome.runtime.sendMessage({ action: 'selectorPicked', selector });
  stopInspecting();
}

function generateSelector(element) {
  // Prefer test IDs
  if (element.dataset.testid) return `[data-testid="${element.dataset.testid}"]`;
  // Prefer accessible roles and names
  const role = element.getAttribute('role');
  const label = element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 50);
  if (role && label) return `getByRole('${role}', { name: '${label}' })`;
  if (label && element.tagName === 'BUTTON') return `getByRole('button', { name: '${label}' })`;
  if (label && element.tagName === 'A') return `getByRole('link', { name: '${label}' })`;
  // Prefer text content for interactive elements
  if (element.textContent?.trim() && ['BUTTON', 'A', 'LABEL'].includes(element.tagName))
    return `getByText('${element.textContent.trim().slice(0, 50)}')`;
  // Fallback to CSS
  if (element.id) return `#${element.id}`;
  if (element.className && typeof element.className === 'string')
    return `${element.tagName.toLowerCase()}.${element.className.split(' ').join('.')}`;
  return element.tagName.toLowerCase();
}

function generateTestCode(actions) {
  const lines = actions.map(action => {
    if (action.type === 'click')
      return `  await page.locator('${action.selector}').click();`;
    if (action.type === 'fill')
      return `  await page.locator('${action.selector}').fill('${action.value}');`;
    return '';
  }).filter(Boolean);

  return `import { test, expect } from '@copilotbrowser/test';\n\ntest('recorded test', async ({ page }) => {\n  await page.goto('${window.location.href}');\n${lines.join('\n')}\n});\n`;
}

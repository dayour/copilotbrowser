/**
 * Copyright (c) Daryl Yourk. All rights reserved.
 * Licensed under the Apache License, Version 2.0.
 */

document.getElementById('record').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    await chrome.tabs.sendMessage(tab.id, { action: 'startRecording' });
    updateStatus('Recording...');
  }
});

document.getElementById('inspect').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    await chrome.tabs.sendMessage(tab.id, { action: 'inspectSelector' });
    updateStatus('Inspector active');
  }
});

document.getElementById('trace').addEventListener('click', async () => {
  chrome.tabs.create({ url: 'chrome-extension://' + chrome.runtime.id + '/trace-viewer.html' });
});

function updateStatus(message) {
  const el = document.getElementById('status');
  el.textContent = message;
  el.className = 'status connected';
}

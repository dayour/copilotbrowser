/**
 * Copyright (c) Daryl Yourk. All rights reserved.
 * Licensed under the Apache License, Version 2.0.
 */

chrome.action.onClicked.addListener(async (tab) => {
  // Toggle the extension popup when the icon is clicked
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('copilotbrowser extension installed');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'selectorPicked') {
    // Store the picked selector for use in test generation
    chrome.storage.local.set({ lastSelector: message.selector });
    sendResponse({ success: true });
  }
  return true;
});

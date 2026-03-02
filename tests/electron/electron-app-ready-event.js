const { app } = require('electron');

globalThis.__copilotbrowserLog = [];

globalThis.__copilotbrowserLog.push(`isReady == ${app.isReady()}`);
app.whenReady().then(() => {
  globalThis.__copilotbrowserLog.push(`whenReady resolved`);
  globalThis.__copilotbrowserLog.push(`isReady == ${app.isReady()}`);
});

app.on('will-finish-launching', () => globalThis.__copilotbrowserLog.push('will-finish-launching fired'));
app.on('ready', () => globalThis.__copilotbrowserLog.push('ready fired'));

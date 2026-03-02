const copilotbrowser = require('copilotbrowser');

process.env.copilotbrowser_SKIP_VALIDATE_HOST_REQUIREMENTS = 1;

(async () => {
  const browser = await copilotbrowser.chromium.launch({
    executablePath: copilotbrowser.chromium.executablePath()
  });
  await browser.close();
})();
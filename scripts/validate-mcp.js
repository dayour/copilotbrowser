const fs = require('fs');
const path = require('path');
const clientPath = path.join(__dirname, '..', 'node_modules', '@modelcontextprotocol', 'sdk', 'dist', 'cjs', 'client', 'index.js');
const stdioPath = path.join(__dirname, '..', 'node_modules', '@modelcontextprotocol', 'sdk', 'dist', 'cjs', 'client', 'stdio.js');
const { Client } = require(clientPath);
const { StdioClientTransport } = require(stdioPath);

(async () => {
  const profilesDir = path.join(__dirname, '..', 'tmp', 'mcp-validate');
  fs.mkdirSync(profilesDir, { recursive: true });

  const transport = new StdioClientTransport({
    command: 'node',
    args: [path.join(__dirname, '..', 'packages', 'copilotbrowser', 'cli.js'), 'run-mcp-server', '--headless', '--browser=msedge'],
    env: {
      ...process.env,
      PW_TMPDIR_FOR_TEST: profilesDir,
      PWMCP_PROFILES_DIR_FOR_TEST: profilesDir,
      // Skip downloads; rely on system Edge/Chrome installed on Windows
      COPILOTBROWSER_SKIP_BROWSER_DOWNLOAD: '1',
    },
    stderr: 'pipe',
  });

  let stderrBuf = '';
  transport.stderr?.on('data', d => {
    stderrBuf += d.toString();
  });

  const client = new Client({ name: 'validator', version: '1.0.0' });
  await client.connect(transport);
  await client.ping();

  const list = await client.listTools();
  console.log('raw listTools result:', JSON.stringify(list));
  const tools = list.tools ?? list;
  console.log('✅ tools count:', tools.length);
  const names = tools.map(t => t.name).sort();
  console.log('sample tools:', names.slice(0, 10));

  const ensureTool = (name) => {
    if (!names.includes(name)) throw new Error(`Tool ${name} not found`);
  };
  const requiredTools = [
    'browser_navigate',
    'browser_click',
    'browser_evaluate',
    'browser_snapshot',
    'browser_take_screenshot',
    'browser_network_requests',
    'browser_console_messages',
    'browser_tabs',
  ];
  requiredTools.forEach(ensureTool);

  const navRes = await client.callTool({ name: 'browser_navigate', arguments: { url: 'https://example.com' }});
  console.log('browser_navigate:', JSON.stringify(navRes));

  const snapRes = await client.callTool({ name: 'browser_snapshot', arguments: { maxLength: 5000 }});
  console.log('browser_snapshot:', snapRes.content?.[0]?.text?.slice(0, 200));

  const consoleRes = await client.callTool({ name: 'browser_console_messages', arguments: { level: 'info' }});
  console.log('browser_console_messages:', consoleRes.content?.[0]?.text?.slice(0, 200));

  const screenshotRes = await client.callTool({ name: 'browser_take_screenshot', arguments: { type: 'png', fullPage: false }});
  console.log('browser_take_screenshot:', screenshotRes.content?.[0]?.type, screenshotRes.content?.[0]?.data ? 'binary length ' + screenshotRes.content[0].data.length : '');

  await client.close();
  transport.close?.();

  if (stderrBuf) {
    console.warn('STDERR from server:\n', stderrBuf);
  }

  console.log('✅ MCP validation succeeded');
})().catch(e => {
  console.error('❌ MCP validation failed', e);
  process.exit(1);
});

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

import { execSync, exec } from 'child_process';

export type NativeBrowserResult = {
  success: boolean;
  message: string;
};

/**
 * Launch a URL in the user's default (non-isolated) Edge browser.
 * Opens as a new tab if Edge is already running.
 */
export function launchEdge(url: string): NativeBrowserResult {
  try {
    if (process.platform === 'win32') {
      execSync(`start msedge "${url}"`, { shell: 'cmd.exe', timeout: 10000 });
    } else if (process.platform === 'darwin') {
      execSync(`open -a "Microsoft Edge" "${url}"`, { timeout: 10000 });
    } else {
      execSync(`microsoft-edge "${url}" &`, { shell: '/bin/bash', timeout: 10000 });
    }
    return { success: true, message: `Launched Edge with URL: ${url}` };
  } catch (error: any) {
    return { success: false, message: `Failed to launch Edge: ${error.message}` };
  }
}

/**
 * Bring the Edge browser window to the foreground (Windows only).
 */
export function focusEdge(): NativeBrowserResult {
  if (process.platform !== 'win32')
    return { success: false, message: 'focusEdge is only supported on Windows' };

  try {
    const script = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class NativeBrowserHelper {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
}
"@
$edge = Get-Process msedge -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if ($edge) {
    [NativeBrowserHelper]::SetForegroundWindow($edge.MainWindowHandle)
    Write-Output "focused"
} else {
    Write-Output "not-found"
}
`.trim();
    const result = execSync(`powershell -NoProfile -Command "${script.replace(/"/g, '\\"')}"`, {
      encoding: 'utf-8',
      timeout: 10000,
    }).trim();

    if (result.includes('focused'))
      return { success: true, message: 'Edge window focused' };
    return { success: false, message: 'No Edge window found with a visible handle' };
  } catch (error: any) {
    return { success: false, message: `Failed to focus Edge: ${error.message}` };
  }
}

/**
 * Send keystrokes to the active Edge window using PowerShell SendKeys (Windows only).
 * Automatically focuses Edge before sending keys.
 */
export function sendKeys(keys: string): NativeBrowserResult {
  if (process.platform !== 'win32')
    return { success: false, message: 'sendKeys is only supported on Windows' };

  try {
    const escapedKeys = keys.replace(/'/g, "''");
    const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class NativeBrowserSendKeys {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
}
"@
$edge = Get-Process msedge -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if ($edge) {
    [NativeBrowserSendKeys]::SetForegroundWindow($edge.MainWindowHandle)
    Start-Sleep -Milliseconds 300
    [System.Windows.Forms.SendKeys]::SendWait('${escapedKeys}')
    Write-Output "sent"
} else {
    Write-Output "not-found"
}
`.trim();
    const result = execSync(`powershell -NoProfile -Command "${script.replace(/"/g, '\\"')}"`, {
      encoding: 'utf-8',
      timeout: 15000,
    }).trim();

    if (result.includes('sent'))
      return { success: true, message: `Sent keys: ${keys}` };
    return { success: false, message: 'No Edge window found to send keys to' };
  } catch (error: any) {
    return { success: false, message: `Failed to send keys: ${error.message}` };
  }
}

/**
 * Cycle through Edge tabs using Ctrl+Tab with a configurable delay between each.
 */
export async function cycleTabs(count: number, delayMs: number): Promise<NativeBrowserResult> {
  if (process.platform !== 'win32')
    return { success: false, message: 'cycleTabs is only supported on Windows' };

  try {
    const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class NativeBrowserCycleTabs {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
}
"@
$edge = Get-Process msedge -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if ($edge) {
    [NativeBrowserCycleTabs]::SetForegroundWindow($edge.MainWindowHandle)
    Start-Sleep -Milliseconds 500
    for ($i = 1; $i -le ${count}; $i++) {
        [System.Windows.Forms.SendKeys]::SendWait('^{TAB}')
        Start-Sleep -Milliseconds ${delayMs}
    }
    Write-Output "cycled"
} else {
    Write-Output "not-found"
}
`.trim();

    return new Promise<NativeBrowserResult>((resolve) => {
      exec(`powershell -NoProfile -Command "${script.replace(/"/g, '\\"')}"`, {
        encoding: 'utf-8',
        timeout: Math.max(30000, count * delayMs + 10000),
      }, (error, stdout) => {
        if (error)
          resolve({ success: false, message: `Failed to cycle tabs: ${error.message}` });
        else if (stdout.includes('cycled'))
          resolve({ success: true, message: `Cycled through ${count} tabs with ${delayMs}ms delay` });
        else
          resolve({ success: false, message: 'No Edge window found to cycle tabs' });
      });
    });
  } catch (error: any) {
    return { success: false, message: `Failed to cycle tabs: ${error.message}` };
  }
}

/**
 * Navigate to a URL in a new Edge tab (native, non-isolated).
 */
export function navigateNewTab(url: string): NativeBrowserResult {
  return launchEdge(url);
}

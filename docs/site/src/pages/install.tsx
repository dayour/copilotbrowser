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
import React from 'react';
import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

const Svg = ({ size = 22, children }: { size?: number; children: ReactNode }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' fill='none'
    stroke='currentColor' strokeWidth='1.75' strokeLinecap='round'
    strokeLinejoin='round' aria-hidden='true'>{children}</svg>
);

const IcoPackage  = () => <Svg><path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'/><polyline points='3.27 6.96 12 12.01 20.73 6.96'/><line x1='12' y1='22.08' x2='12' y2='12'/></Svg>;
const IcoSnake    = () => <Svg><path d='M12 2C7.5 2 8 6.5 8 6.5v3.5h3.5'/><path d='M12 22c4.5 0 4-4.5 4-4.5V14h-3.5'/><path d='M8 10H5a3 3 0 0 0 0 6h3'/><path d='M16 14h3a3 3 0 0 0 0-6h-3'/><circle cx='10' cy='8' r='1' fill='currentColor' stroke='none'/><circle cx='14' cy='16' r='1' fill='currentColor' stroke='none'/></Svg>;
const IcoCoffee   = () => <Svg><path d='M17 8h1a4 4 0 0 1 0 8h-1'/><path d='M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z'/><line x1='6' y1='1' x2='6' y2='4'/><line x1='10' y1='1' x2='10' y2='4'/><line x1='14' y1='1' x2='14' y2='4'/></Svg>;
const IcoHash     = () => <Svg><line x1='4' y1='9' x2='20' y2='9'/><line x1='4' y1='15' x2='20' y2='15'/><line x1='10' y1='3' x2='8' y2='21'/><line x1='16' y1='3' x2='14' y2='21'/></Svg>;
const IcoLayers   = () => <Svg><polygon points='12 2 2 7 12 12 22 7 12 2'/><polyline points='2 17 12 22 22 17'/><polyline points='2 12 12 17 22 12'/></Svg>;
const IcoCode2    = () => <Svg><path d='m18 16 4-4-4-4'/><path d='m6 8-4 4 4 4'/><path d='m14.5 4-5 16'/></Svg>;
const IcoGrid     = () => <Svg><rect x='3' y='3' width='7' height='7' rx='1'/><rect x='14' y='3' width='7' height='7' rx='1'/><rect x='14' y='14' width='7' height='7' rx='1'/><rect x='3' y='14' width='7' height='7' rx='1'/></Svg>;
const IcoBag      = () => <Svg><path d='M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z'/><line x1='3' y1='6' x2='21' y2='6'/><path d='M16 10a4 4 0 0 1-8 0'/></Svg>;
const IcoCloud    = () => <Svg><path d='M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z'/></Svg>;
const IcoCpu      = () => <Svg><rect x='4' y='4' width='16' height='16' rx='2'/><rect x='9' y='9' width='6' height='6'/><line x1='9' y1='1' x2='9' y2='4'/><line x1='15' y1='1' x2='15' y2='4'/><line x1='9' y1='20' x2='9' y2='23'/><line x1='15' y1='20' x2='15' y2='23'/><line x1='20' y1='9' x2='23' y2='9'/><line x1='20' y1='14' x2='23' y2='14'/><line x1='1' y1='9' x2='4' y2='9'/><line x1='1' y1='14' x2='4' y2='14'/></Svg>;

const iconWrapStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
  background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.25)',
  color: '#818cf8',
};

const methods = [
  { Icon: IcoPackage, title: 'npm / yarn / pnpm',      subtitle: 'Recommended for Node.js projects',              commands: ['npm init copilotbrowser@latest', 'npx copilotbrowser install'],                  link: '/docs/intro-js' },
  { Icon: IcoSnake,   title: 'Python (pip)',             subtitle: 'PyPI package for Python automation',             commands: ['pip install copilotbrowser', 'copilotbrowser install'],                         link: '/docs/intro-python' },
  { Icon: IcoCoffee,  title: 'Java (Maven / Gradle)',    subtitle: 'Maven Central artifact',                         commands: ['// Add to pom.xml or build.gradle — see guide'],                                link: '/docs/intro-java' },
  { Icon: IcoHash,    title: 'C# / .NET (NuGet)',        subtitle: 'NuGet package for .NET projects',                commands: ['dotnet add package Microsoft.copilotbrowser'],                                  link: '/docs/intro-csharp' },
  { Icon: IcoLayers,  title: 'Docker',                   subtitle: 'Pre-built images with all browsers',             commands: ['docker pull mcr.microsoft.com/copilotbrowser:latest', 'docker run -it mcr.microsoft.com/copilotbrowser:latest'], link: '/docs/docker' },
  { Icon: IcoCode2,   title: 'VS Code Extension',        subtitle: 'Run and debug tests inside VS Code',             commands: ['ext install DarbotLabs.copilotbrowser-vscode'],                                 link: '/docs/getting-started-vscode-js' },
  { Icon: IcoGrid,    title: 'Chrome Web Store',         subtitle: 'Browser extension for recording and inspection', commands: [],                                                                               link: '/docs/chrome-extensions-js-python' },
  { Icon: IcoBag,     title: 'Microsoft Store',          subtitle: 'Desktop app for Windows',                        commands: [],                                                                               link: '/install' },
  { Icon: IcoCloud,   title: 'Azure Pipelines',          subtitle: 'CI/CD integration for Azure DevOps',             commands: ['# Add copilotbrowser task to azure-pipelines.yml'],                            link: '/docs/ci' },
  { Icon: IcoCpu,     title: 'Copilot Studio / MCP',     subtitle: 'Use copilotbrowser as an MCP tool server',       commands: ['npx copilotbrowser run-server'],                                                link: '/docs/extensibility' },
];

function InstallCard({ Icon, title, subtitle, commands, link }: typeof methods[0]) {
  return (
    <div style={{
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderRadius: 12,
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={iconWrapStyle}><Icon /></span>
        <div>
          <strong style={{ fontSize: '1.1rem' }}>{title}</strong>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-600)' }}>{subtitle}</p>
        </div>
      </div>
      {commands.length > 0 && (
        <div style={{
          background: 'var(--ifm-background-surface-color, #f1f5f9)',
          border: '1px solid var(--ifm-color-emphasis-200)',
          borderRadius: 8,
          padding: '0.75rem 1rem',
          fontFamily: "'Cascadia Code', 'Fira Code', monospace",
          fontSize: '0.82rem',
          lineHeight: 1.6,
          overflowX: 'auto',
        }}>
          {commands.map((c, i) => <div key={i}>{c}</div>)}
        </div>
      )}
      <Link to={link} style={{ fontWeight: 600, fontSize: '0.9rem' }}>
        View Guide →
      </Link>
    </div>
  );
}

export default function Install(): ReactNode {
  return (
    <Layout title='Install copilotbrowser' description='Install copilotbrowser via npm, pip, Docker, VS Code, Chrome Web Store, Microsoft Store, and more.'>
      <div className='container' style={{ padding: '3rem 0' }}>
        <div className='text--center' style={{ marginBottom: '3rem' }}>
          <Heading as='h1'>Install copilotbrowser</Heading>
          <p style={{ fontSize: '1.15rem', color: 'var(--ifm-color-emphasis-600)', maxWidth: 600, margin: '0 auto' }}>
            Choose the installation method that fits your workflow. copilotbrowser is available as a package, Docker image, IDE extension, browser extension, and desktop app.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '1.25rem',
          maxWidth: 900,
          margin: '0 auto',
        }}>
          {methods.map((m, i) => <InstallCard key={i} {...m} />)}
        </div>

        <div className='text--center' style={{ marginTop: '3rem' }}>
          <Heading as='h2'>System Requirements</Heading>
          <div style={{ maxWidth: 600, margin: '1rem auto 0', textAlign: 'left' }}>
            <ul>
              <li><strong>Node.js:</strong> 20.x, 22.x, or 24.x (latest LTS recommended)</li>
              <li><strong>Windows:</strong> 11+, Server 2019+, or WSL</li>
              <li><strong>macOS:</strong> 14 Ventura or later</li>
              <li><strong>Linux:</strong> Debian 12/13, Ubuntu 22.04/24.04 (x86-64 or arm64)</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}

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
import React, { useEffect, useRef, useState } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

// ── Minimal SVG wrapper ──────────────────────────────────────────────────────
const Svg = ({ size = 24, children }: { size?: number; children: ReactNode }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' fill='none'
    stroke='currentColor' strokeWidth='1.75' strokeLinecap='round'
    strokeLinejoin='round' aria-hidden='true'>{children}</svg>
);

// ── Feature Icons ─────────────────────────────────────────────────────────────
const IcoGlobe     = () => <Svg><circle cx='12' cy='12' r='10'/><line x1='2' y1='12' x2='22' y2='12'/><path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'/></Svg>;
const IcoZap       = () => <Svg><polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2'/></Svg>;
const IcoFlask     = () => <Svg><path d='M9 3h6'/><path d='M8 3v6l-4 11h16L16 9V3'/><circle cx='10' cy='14' r='0.8' fill='currentColor' stroke='none'/><circle cx='14' cy='16' r='0.8' fill='currentColor' stroke='none'/></Svg>;
const IcoFilm      = () => <Svg><rect x='2' y='2' width='20' height='20' rx='2'/><line x1='7' y1='2' x2='7' y2='22'/><line x1='17' y1='2' x2='17' y2='22'/><line x1='2' y1='12' x2='22' y2='12'/><line x1='2' y1='7' x2='7' y2='7'/><line x1='2' y1='17' x2='7' y2='17'/><line x1='17' y1='17' x2='22' y2='17'/><line x1='17' y1='7' x2='22' y2='7'/></Svg>;
const IcoWifi      = () => <Svg><path d='M5 12.55a11 11 0 0 1 14.08 0'/><path d='M1.42 9a16 16 0 0 1 21.16 0'/><path d='M8.53 16.11a6 6 0 0 1 6.95 0'/><circle cx='12' cy='20' r='1' fill='currentColor' stroke='none'/></Svg>;
const IcoPhone     = () => <Svg><rect x='5' y='2' width='14' height='20' rx='2'/><circle cx='12' cy='17.5' r='1' fill='currentColor' stroke='none'/></Svg>;

// ── Platform Icons ────────────────────────────────────────────────────────────
const IcoPackage   = () => <Svg><path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'/><polyline points='3.27 6.96 12 12.01 20.73 6.96'/><line x1='12' y1='22.08' x2='12' y2='12'/></Svg>;
const IcoLayers    = () => <Svg><polygon points='12 2 2 7 12 12 22 7 12 2'/><polyline points='2 17 12 22 22 17'/><polyline points='2 12 12 17 22 12'/></Svg>;
const IcoCode2     = () => <Svg><path d='m18 16 4-4-4-4'/><path d='m6 8-4 4 4 4'/><path d='m14.5 4-5 16'/></Svg>;
const IcoGrid      = () => <Svg><rect x='3' y='3' width='7' height='7' rx='1'/><rect x='14' y='3' width='7' height='7' rx='1'/><rect x='14' y='14' width='7' height='7' rx='1'/><rect x='3' y='14' width='7' height='7' rx='1'/></Svg>;
const IcoCloud     = () => <Svg><path d='M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z'/></Svg>;
const IcoCpu       = () => <Svg><rect x='4' y='4' width='16' height='16' rx='2'/><rect x='9' y='9' width='6' height='6'/><line x1='9' y1='1' x2='9' y2='4'/><line x1='15' y1='1' x2='15' y2='4'/><line x1='9' y1='20' x2='9' y2='23'/><line x1='15' y1='20' x2='15' y2='23'/><line x1='20' y1='9' x2='23' y2='9'/><line x1='20' y1='14' x2='23' y2='14'/><line x1='1' y1='9' x2='4' y2='9'/><line x1='1' y1='14' x2='4' y2='14'/></Svg>;
const IcoBag       = () => <Svg><path d='M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z'/><line x1='3' y1='6' x2='21' y2='6'/><path d='M16 10a4 4 0 0 1-8 0'/></Svg>;
const IcoBook      = () => <Svg><path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'/><path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'/></Svg>;

// ── Language Icons ────────────────────────────────────────────────────────────
const IcoTerminal  = () => <Svg><polyline points='4 17 10 11 4 5'/><line x1='12' y1='19' x2='20' y2='19'/></Svg>;
const IcoSnake     = () => <Svg><path d='M12 2C7.5 2 8 6.5 8 6.5v3.5h3.5'/><path d='M12 22c4.5 0 4-4.5 4-4.5V14h-3.5'/><path d='M8 10H5a3 3 0 0 0 0 6h3'/><path d='M16 14h3a3 3 0 0 0 0-6h-3'/><circle cx='10' cy='8' r='1' fill='currentColor' stroke='none'/><circle cx='14' cy='16' r='1' fill='currentColor' stroke='none'/></Svg>;
const IcoCoffee    = () => <Svg><path d='M17 8h1a4 4 0 0 1 0 8h-1'/><path d='M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z'/><line x1='6' y1='1' x2='6' y2='4'/><line x1='10' y1='1' x2='10' y2='4'/><line x1='14' y1='1' x2='14' y2='4'/></Svg>;
const IcoHash      = () => <Svg><line x1='4' y1='9' x2='20' y2='9'/><line x1='4' y1='15' x2='20' y2='15'/><line x1='10' y1='3' x2='8' y2='21'/><line x1='16' y1='3' x2='14' y2='21'/></Svg>;

// ── Workflow Icons (larger) ───────────────────────────────────────────────────
const IcoCheckLg   = () => <Svg size={32}><path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'/><polyline points='22 4 12 14.01 9 11.01'/></Svg>;
const IcoSearchLg  = () => <Svg size={32}><circle cx='11' cy='11' r='8'/><line x1='21' y1='21' x2='16.65' y2='16.65'/></Svg>;
const IcoRocketLg  = () => <Svg size={32}><path d='M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z'/><path d='m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z'/><path d='M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0'/><path d='M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5'/></Svg>;

// ── Animation: ScrollReveal ───────────────────────────────────────────────────
function ScrollReveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el)
      return;
    const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting)
            el.classList.add(styles.revealed);
        },
        { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={styles.revealWrap}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}

// ── Animation: CountUp ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el)
      return;
    const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            observer.disconnect();
            let frame = 0;
            const FRAMES = 28;
            const id = setInterval(() => {
              frame++;
              setVal(Math.round((to * frame) / FRAMES));
              if (frame >= FRAMES)
                clearInterval(id);
            }, 35);
          }
        },
        { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ── Animation: BlurText ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function BlurText({ text }: { text: string }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <span key={i} className={styles.heroWord}
          style={{ '--word-delay': `${i * 90 + 150}ms` } as CSSProperties}>
          {word}{i < words.length - 1 ? '\u00a0' : ''}
        </span>
      ))}
    </>
  );
}

// ── 3D Voxel decorative accent ─────────────────────────────────────────────────
function VoxelScene({
  cols = 7, rows = 2, size = 11, startDelay = 0,
}: {
  cols?: number; rows?: number; size?: number; startDelay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el)
      return;
    const obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) { setOn(true); obs.disconnect(); } },
        { threshold: 0.04 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={styles.voxelScene} aria-hidden='true'
      style={{ '--vx-cols': cols, '--vx-size': `${size}px` } as CSSProperties}>
      {Array.from({ length: rows * cols }).map((_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        return (
          <span key={i}
            className={clsx(styles.voxel, on && styles.voxelOn)}
            style={{ '--vx-d': `${startDelay + c * 38 + r * 55}ms` } as CSSProperties}
          />
        );
      })}
    </div>
  );
}

function HomepageHeader() {
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      {/* Galaxy nebula background blobs */}
      <div className={styles.auroraBlob1} aria-hidden='true' />
      <div className={styles.auroraBlob2} aria-hidden='true' />
      <div className={styles.auroraBlob3} aria-hidden='true' />
      <div className='container' style={{ position: 'relative', zIndex: 2 }}>
        <img
          src='/copilotbrowser/img/logo-galaxy.png'
          alt='copilotbrowser'
          className={styles.heroLogo}
        />
        <Heading as='h1' className={styles.heroHeadline}>
          <span className={styles.heroWord} style={{ '--word-delay': '150ms' } as CSSProperties}>Command</span>{' '}
          <span className={styles.heroWord} style={{ '--word-delay': '240ms' } as CSSProperties}>your</span>{' '}
          <span className={clsx(styles.heroWord, styles.cyanAccent)} style={{ '--word-delay': '330ms' } as CSSProperties}>browsers.</span>
        </Heading>
        <p className={styles.heroSubtitle}>
          Your AI-powered browser automation platform. Automate Chromium, Firefox, and WebKit
          with a single API — from testing to scraping to intelligent agents.
        </p>
        <div className={styles.buttons}>
          <Link className='button button--secondary button--lg' to='/docs/intro-js'>
            Get Started Free
          </Link>
          <Link className={clsx('button button--lg', styles.btnOutline)} to='/install'>
            View All Install Options
          </Link>
        </div>
        <div className={styles.heroCode}>
          <code>npm install copilotbrowser</code>
        </div>
      </div>
    </header>
  );
}

type FeatureItem = {
  Icon: () => ReactNode;
  title: string;
  description: string;
  link: string;
};

const features: FeatureItem[] = [
  { Icon: IcoGlobe,   title: 'Cross-Browser',       description: 'One API for Chromium, Firefox, and WebKit on every OS.',                          link: '/docs/browsers' },
  { Icon: IcoZap,     title: 'Auto-Wait',            description: 'Smart waiting for elements, navigation, and network — no flaky sleeps.',           link: '/docs/actionability' },
  { Icon: IcoFlask,   title: 'Test Runner',          description: 'Parallel execution, fixtures, assertions, retries, and sharding built in.',        link: '/docs/intro-js' },
  { Icon: IcoFilm,    title: 'Traces & Screenshots', description: 'Capture videos, screenshots, and rich execution traces for debugging.',            link: '/docs/trace-viewer' },
  { Icon: IcoWifi,    title: 'Network Control',      description: 'Intercept requests, mock APIs, and modify responses on the fly.',                  link: '/docs/network' },
  { Icon: IcoPhone,   title: 'Device Emulation',     description: 'Test mobile viewports, geolocation, permissions, and dark mode.',                  link: '/docs/emulation' },
];

function FeatureGrid() {
  return (
    <section className={styles.section}>
      <div className='container'>
        <ScrollReveal>
          <div className={styles.voxelHead}>
            <div className={styles.voxelRow}>
              <VoxelScene cols={8} rows={2} size={10} />
            </div>
            <Heading as='h2' className='text--center'>Why copilotbrowser?</Heading>
            <p className={clsx(styles.sectionSub, 'text--center')}>Everything you need for reliable browser automation and testing.</p>
          </div>
        </ScrollReveal>
        <div className={styles.featureGrid}>
          {features.map((f, i) => (
            <ScrollReveal key={i} delay={i * 60}>
              <Link to={f.link} className={styles.featureCard}>
                <span className={styles.iconWrap}><f.Icon /></span>
                <Heading as='h3' className={styles.featureTitle}>{f.title}</Heading>
                <p className={styles.featureDesc}>{f.description}</p>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const workflowBlocks = [
  {
    Icon: IcoCheckLg,
    headline: 'Test with confidence, not complexity.',
    body: 'copilotbrowser\'s built-in test runner handles parallel execution, smart retries, fixtures, and assertions out of the box. Auto-waiting means no more arbitrary sleeps — your tests stay green because they actually wait for the right moment.',
    ctas: [
      { label: 'Writing Tests →', link: '/docs/writing-tests-js' },
      { label: 'Assertions →', link: '/docs/test-assertions-js' },
    ],
    code: `test('login works', async ({ page }) => {\n  await page.goto('/login');\n  await page.getByLabel('Email').fill('user@example.com');\n  await page.getByRole('button', { name: 'Sign in' }).click();\n  await expect(page).toHaveURL('/dashboard');\n});`,
  },
  {
    Icon: IcoSearchLg,
    headline: 'Debug faster with traces and time travel.',
    body: 'Every test run captures a rich execution trace — DOM snapshots, network requests, console logs, and action timelines. Open the Trace Viewer to replay exactly what happened, step by step, without re-running anything.',
    ctas: [
      { label: 'Trace Viewer →', link: '/docs/trace-viewer' },
      { label: 'Screenshots →', link: '/docs/screenshots' },
    ],
    code: `// Capture a trace for every failed test\nuse: {\n  trace: 'on-first-retry',\n  screenshot: 'only-on-failure',\n  video: 'retain-on-failure',\n}`,
  },
  {
    Icon: IcoRocketLg,
    headline: 'Deploy everywhere. Integrate with anything.',
    body: 'From your local machine to Azure Pipelines, GitHub Actions, Docker containers, and Copilot Studio MCP servers — copilotbrowser works wherever you need it. Pre-built images. CI templates. MCP tool server mode for AI agents.',
    ctas: [
      { label: 'Docker Setup →', link: '/docs/docker' },
      { label: 'CI/CD Guide →', link: '/docs/ci' },
      { label: 'MCP / Copilot Studio →', link: '/docs/extensibility' },
    ],
    code: `# Pull the ready-to-go Docker image\ndocker pull mcr.microsoft.com/copilotbrowser:latest\n\n# Or run as an MCP tool server\nnpx copilotbrowser mcp-server`,
  },
];

function WorkflowSection() {
  return (
    <section className={clsx(styles.section, styles.sectionDark)}>
      <div className='container'>
        <ScrollReveal>
          <div className={styles.voxelHead}>
            <div className={styles.voxelRow}>
              <VoxelScene cols={9} rows={2} size={11} />
            </div>
            <Heading as='h2' className='text--center'>Automate, debug, and ship — at every scale.</Heading>
            <p className={clsx(styles.sectionSub, 'text--center')} style={{ color: 'rgba(255,255,255,0.65)' }}>
              AI-ready browser automation that works where you do.
            </p>
          </div>
        </ScrollReveal>
        <div className={styles.workflowList}>
          {workflowBlocks.map((block, i) => (
            <ScrollReveal key={i} delay={i * 80}>
              <div className={clsx(styles.workflowBlock, i % 2 === 1 && styles.workflowBlockReverse)}>
                <div className={styles.workflowText}>
                  <span className={styles.workflowIconWrap}><block.Icon /></span>
                  <Heading as='h3' className={styles.workflowHeadline}>{block.headline}</Heading>
                  <p className={styles.workflowBody}>{block.body}</p>
                  <div className={styles.workflowCtas}>
                    {block.ctas.map((cta, j) => (
                      <Link key={j} to={cta.link} className={styles.workflowLink}>{cta.label}</Link>
                    ))}
                  </div>
                </div>
                <div className={styles.workflowCode}>
                  <pre className={styles.workflowPre}><code>{block.code}</code></pre>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

type PlatformItem = {
  Icon: () => ReactNode;
  name: string;
  description: string;
  link: string;
  cta: string;
};

const platforms: PlatformItem[] = [
  { Icon: IcoPackage, name: 'npm', description: 'Install via npm, yarn, or pnpm for Node.js projects.', link: '/docs/intro-js', cta: 'npm install' },
  { Icon: IcoLayers,  name: 'Docker', description: 'Pre-built images with all browsers and dependencies ready to go.', link: '/docs/docker', cta: 'Pull Image' },
  { Icon: IcoCode2,   name: 'VS Code Extension', description: 'Run, debug, and generate tests directly in Visual Studio Code.', link: '/docs/getting-started-vscode-js', cta: 'Install Extension' },
  { Icon: IcoGrid,    name: 'Chrome Extension', description: 'Browser extension for recording and inspecting automation scripts.', link: '/docs/chrome-extensions-js-python', cta: 'Add to Chrome' },
  { Icon: IcoCloud,   name: 'Azure & CI/CD', description: 'Run in Azure Pipelines, GitHub Actions, Jenkins, and more.', link: '/docs/ci', cta: 'CI Setup' },
  { Icon: IcoCpu,     name: 'Copilot Studio & MCP', description: 'Use as an MCP tool server for AI agents and Copilot Studio flows.', link: '/docs/extensibility', cta: 'Learn More' },
  { Icon: IcoBag,     name: 'Microsoft Store', description: 'Install the desktop app from the Microsoft Store on Windows.', link: '/install', cta: 'Get the App' },
  { Icon: IcoBook,    name: 'Library Mode', description: 'Use as a library in any Node.js, Python, Java, or .NET project.', link: '/docs/library-js', cta: 'View Docs' },
];

function InstallPlatforms() {
  return (
    <section className={clsx(styles.section, styles.sectionAlt)}>
      <div className='container'>
        <ScrollReveal>
          <div className='text--center' style={{ marginBottom: '2rem' }}>
            <Heading as='h2'>Get copilotbrowser</Heading>
            <p className={styles.sectionSub}>Available everywhere you build and deploy.</p>
          </div>
        </ScrollReveal>
        <div className={styles.platformGrid}>
          {platforms.map((p, i) => (
            <ScrollReveal key={i} delay={i * 50}>
              <Link to={p.link} className={styles.platformCard}>
                <span className={styles.platformIconWrap}><p.Icon /></span>
                <div>
                  <strong>{p.name}</strong>
                  <p className={styles.platformDesc}>{p.description}</p>
                </div>
                <span className={styles.platformCta}>{p.cta} →</span>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const languages = [
  { Icon: IcoTerminal, name: 'JavaScript / TypeScript', link: '/docs/intro-js' },
  { Icon: IcoSnake,    name: 'Python',                  link: '/docs/intro-python' },
  { Icon: IcoCoffee,   name: 'Java',                    link: '/docs/intro-java' },
  { Icon: IcoHash,     name: 'C# / .NET',               link: '/docs/intro-csharp' },
];

function LanguageSection() {
  return (
    <section className={styles.section}>
      <div className='container'>
        <ScrollReveal>
          <div className='text--center' style={{ marginBottom: '2rem' }}>
            <Heading as='h2'>Your Language, Your Way</Heading>
            <p className={styles.sectionSub}>First-class support for all major languages.</p>
          </div>
        </ScrollReveal>
        <div className={styles.langGrid}>
          {languages.map((l, i) => (
            <ScrollReveal key={i} delay={i * 70}>
              <Link to={l.link} className={styles.langCard}>
                <span className={styles.langIconWrap}><l.Icon /></span>
                <Heading as='h3' style={{ margin: '0.5rem 0 0', fontSize: '1.1rem' }}>{l.name}</Heading>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickStart() {
  return (
    <section className={clsx(styles.section, styles.sectionAlt)}>
      <div className='container'>
        <ScrollReveal>
          <div className={styles.voxelHead}>
            <div className={styles.voxelRow}>
              <VoxelScene cols={7} rows={2} size={10} />
            </div>
            <Heading as='h2' className='text--center'>Up and Running in 60 Seconds</Heading>
          </div>
        </ScrollReveal>
        <div className={styles.quickGrid}>
          {([
            { n: 1, label: 'Install',     code: 'npm init copilotbrowser@latest' },
            { n: 2, label: 'Write a Test', code: "await page.goto('https://example.com');" },
            { n: 3, label: 'Run',          code: 'npx copilotbrowser test' },
            { n: 4, label: 'View Report',  code: 'npx copilotbrowser show-report' },
          ] as const).map((step, i) => (
            <ScrollReveal key={i} delay={i * 80}>
              <div className={styles.quickStep}>
                <div className={styles.stepNum}>{step.n}</div>
                <Heading as='h4'>{step.label}</Heading>
                <code className={styles.codeSnippet}>{step.code}</code>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className={styles.finalCta} style={{ position: 'relative', overflow: 'hidden' }}>
      <div className={styles.finalCtaVoxelBg} aria-hidden='true'>
        <VoxelScene cols={14} rows={5} size={13} startDelay={200} />
      </div>
      <div className='container'>
        <ScrollReveal>
          <div className={styles.finalCtaInner}>
            <Heading as='h2' className={styles.finalCtaHeadline}>
              Take your automation further.
            </Heading>
            <p className={styles.finalCtaBody}>
              From unit tests to full end-to-end suites, AI agents to enterprise CI/CD pipelines —
              copilotbrowser is the browser automation platform built for every workflow.
            </p>
            <div className={styles.buttons} style={{ justifyContent: 'center' }}>
              <Link className='button button--secondary button--lg' to='/docs/intro-js'>
                Get Started Free
              </Link>
              <Link className={clsx('button button--lg', styles.btnOutlineLight)} to='/install'>
                View All Install Options
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description='copilotbrowser — command your browsers. Automate Chromium, Firefox, and WebKit with a single API. Test, scrape, and deploy everywhere.'>
      <HomepageHeader />
      <main>
        <FeatureGrid />
        <WorkflowSection />
        <InstallPlatforms />
        <LanguageSection />
        <QuickStart />
        <FinalCTA />
      </main>
    </Layout>
  );
}

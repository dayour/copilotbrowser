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
import type { ReactNode } from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  icon: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Cross-Browser Testing',
    icon: '🌐',
    description: (
      <>
        Test across Chromium, Firefox, and WebKit with a single API.
        Run tests on Windows, Linux, and macOS — locally or in CI.
      </>
    ),
  },
  {
    title: 'Powerful Automation',
    icon: '⚡',
    description: (
      <>
        Auto-wait for elements, intercept network requests, emulate devices,
        and capture screenshots, videos, and traces.
      </>
    ),
  },
  {
    title: 'Built-in Test Runner',
    icon: '🧪',
    description: (
      <>
        Parallel test execution, rich assertions, fixtures, test generation,
        and a powerful HTML reporter — all out of the box.
      </>
    ),
  },
];

function Feature({ title, icon, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className='text--center' style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        {icon}
      </div>
      <div className='text--center padding-horiz--md'>
        <Heading as='h3'>{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className='container'>
        <div className='row'>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

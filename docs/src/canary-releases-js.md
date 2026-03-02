---
id: canary-releases-js
title: "Canary releases"
---

## Introduction

copilotbrowser for Node.js has a canary releases system.

It permits you to **test new unreleased features** instead of waiting for a full release. They get released daily on the `next` NPM tag of copilotbrowser.

It is a good way to **give feedback to maintainers**, ensuring the newly implemented feature works as intended.

:::note

Using a canary release in production might seem risky, but in practice, it's not.

A canary release passes all automated tests and is used to test e.g. the HTML report, Trace Viewer, or copilotbrowser Inspector with end-to-end tests.

:::

## Next npm Dist Tag

For any code-related commit on `main`, the continuous integration will publish a daily canary release under the `@next` npm dist tag.

You can see on [npm](https://www.npmjs.com/package/@copilotbrowser/test?activeTab=versions) the current dist tags:

- `latest`: stable releases
- `next`: next releases, published daily
- `beta`: after a release-branch was cut, usually a week before a stable release each commit gets published under this tag

## Using a Canary Release

```bash
npm install -D @copilotbrowser/test@next
```

## Documentation

The stable and the `next` documentation is published on [copilotbrowser Github.io](https://copilotbrowser.dev). To see the `next` documentation, press <kbd>Shift</kbd> on the keyboard `5` times.

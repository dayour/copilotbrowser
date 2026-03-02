---
id: class-logger
---

# class: Logger
> *Added in: v1.8*
>
> **Languages:** JavaScript
>
> ⚠️ **Deprecated.** This class is deprecated. The logs pumped through this class are incomplete. Please use tracing instead.

copilotbrowser generates a lot of logs and they are accessible via the pluggable logger sink.

```js
const { chromium } = require('copilotbrowser');  // Or 'firefox' or 'webkit'.

(async () => {
  const browser = await chromium.launch({
    logger: {
      isEnabled: (name, severity) => name === 'api',
      log: (name, severity, message, args) => console.log(`${name} ${message}`)
    }
  });
  // ...
})();
```

## method: Logger.isEnabled
> *Added in: v1.8*
**Returns:** `boolean`

Determines whether sink is interested in the logger with the given name and severity.

### param: Logger.isEnabled.name
> *Added in: v1.8*
- `name` <`string`>

logger name

### param: Logger.isEnabled.severity
> *Added in: v1.8*
- `severity` <`LogSeverity`<"verbose"|"info"|"warning"|"error">>

## method: Logger.log
> *Added in: v1.8*

### param: Logger.log.name
> *Added in: v1.8*
- `name` <`string`>

logger name

### param: Logger.log.severity
> *Added in: v1.8*
- `severity` <`LogSeverity`<"verbose"|"info"|"warning"|"error">>

### param: Logger.log.message
> *Added in: v1.8*
- `message` <`string`|`Error`>

log message format

### param: Logger.log.args
> *Added in: v1.8*
- `args` <`Array`<`Object`>>

message arguments

### param: Logger.log.hints
> *Added in: v1.8*
- `hints` <`Object`>
  - `color` ?<`string`> Optional preferred logger color.

optional formatting hints

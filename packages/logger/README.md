# logger

A lightweight, type-safe logger with middleware support and contextual messages.

**Entry points:**

- **`@leancodepl/logger`** – Core API below (custom handlers, context, middleware).
- **`@leancodepl/logger/cli`** – Colored console preset with log levels: `createCliLogger`, `LogLevel`, `allLogLevels`.
- **`@leancodepl/logger/json`** – JSON lines to stdout: `createJsonLogger` with the same level options as CLI.
- **`@leancodepl/logger/nest`** – NestJS adapter: `createNestJsonLogger()` implementing `LoggerService` with JSON output.

## Creating a Logger

```typescript
import { createLogger, isContextualMessage } from "@leancodepl/logger"

const logger = createLogger({
  info: (context, ...messages) => {
    console.log(messages.map(m => (isContextualMessage(m) ? m(context) : m)).join(" "))
  },
})

logger.info("Hello", "world") // "Hello world"
```

## Adding Context

Use `withContext` to add context values. Context accumulates across calls.

```typescript
const appLogger = logger.withContext({ appName: "MyApp" })
const requestLogger = appLogger.withContext({ requestId: "req-123" })
```

## Using Context in Messages

Messages can be functions that receive the current context.

```typescript
const userLogger = logger.withContext({ userId: "user-456" })

userLogger.info(({ userId }) => `User ${userId} logged in`)
// "User user-456 logged in"
```

## Adding Middleware

Use `withMiddleware` to wrap log methods. Middleware receives `next` (it is used to call a middleware from `logger` in
this case) and returns a new handler.

```typescript
const loggerWithPrefix = logger.withMiddleware({
  info:
    next =>
    (context, ...messages) => {
      next(context, "[INFO]", ...messages)
    },
})

loggerWithPrefix.info("test") // "[INFO] test"
```

## Modifying Context in Middleware

Middleware can modify context before passing to the next handler.

```typescript
const loggerWithTimestamp = logger.withMiddleware({
  info:
    next =>
    (context, ...messages) => {
      const newContext = { ...context, timestamp: Date.now() }
      next(newContext, ...messages)
    },
})
```

## Chaining Middleware

Middleware is applied in order, with later middleware being executed first, and passing its changes to the middleware
that was created before it.

```typescript
const logger2 = logger
  .withMiddleware({
    info:
      next =>
      (context, ...messages) => {
        next(context, "[1]", ...messages)
      },
  })
  .withMiddleware({
    info:
      next =>
      (context, ...messages) => {
        next(context, "[2]", ...messages)
      },
  })

logger2.info("test") // "[1] [2] test"
```

## Typing Functions

When passing a logger to functions, use `LoggerWithContext` for proper typing.

```typescript
import { LoggerWithContext, DefaultContext } from "@leancodepl/logger"

type AppLogger<TContext extends DefaultContext> = LoggerWithContext<TContext, typeof logger>

function handleRequest(log: AppLogger<{ requestId: string }>) {
  log.info(({ requestId }) => `Processing ${requestId}`)
}

const requestLogger = logger.withContext({ requestId: "req-789" })
handleRequest(requestLogger)
```

Provided types can also be used to type `createLogger` and `withMiddleware` functions arguments.

```typescript
import { createLogger, DefaultContext, LoggerMessage, MethodHandler, SupportedOutput } from "@leancodepl/logger"

function log(context: DefaultContext, ...messages: LoggerMessage<DefaultContext, SupportedOutput>[]) {
  console.log(
    messages
      .map(m => {
        if (m instanceof Error) {
          return m.message
        }
        if (typeof m === "object" && m !== null) {
          return JSON.stringify(m)
        }
        return m
      })
      .join(" "),
  )
}

const logger = createLogger({
  info: log,
})

function infoMiddleWare(next: MethodHandler<SupportedOutput>) {
  return (context: DefaultContext, ...messages: LoggerMessage<DefaultContext, SupportedOutput>[]) => {
    next(context, "[INFO]", ...messages)
  }
}

const logger2 = logger.withMiddleware({
  info: infoMiddleWare,
})

logger2.info("test") // "[INFO] test"
```

---

## CLI preset (`@leancodepl/logger/cli`)

Colored console logger with log levels for CLI applications.

### Basic usage

```typescript
import { createCliLogger } from "@leancodepl/logger/cli"

const logger = createCliLogger()

logger.info("Application started")
logger.success("Operation completed")
logger.warn("This is a warning")
logger.error("Something went wrong")
logger.debug("Debug information")
logger.verbose("Verbose output")
```

### Log levels

Control which messages are shown by setting `enabledLogLevels` (array of levels to include):

```typescript
import { createCliLogger, allLogLevels, LogLevel } from "@leancodepl/logger/cli"

// Only show errors and warnings
const quietLogger = createCliLogger({ enabledLogLevels: [LogLevel.Error, LogLevel.Warn] })

// Show everything including debug and verbose
const verboseLogger = createCliLogger({ enabledLogLevels: allLogLevels })
```

Available log levels (from least to most verbose):

- `LogLevel.Error` (0) - Only errors
- `LogLevel.Warn` (1) - Errors and warnings
- `LogLevel.Success` (2) - Errors, warnings, and success
- `LogLevel.Info` (3) - Errors, warnings, success, and info (default)
- `LogLevel.Verbose` (4) - All above plus verbose
- `LogLevel.Debug` (5) - Everything

### Adding context

Use `withContext` to add contextual information:

```typescript
const logger = createCliLogger()
const requestLogger = logger.withContext({ requestId: "req-123" })

requestLogger.info(({ requestId }) => `Processing request ${requestId}`)
```

### Adding middleware

Use `withMiddleware` to customize logging behavior:

```typescript
const logger = createCliLogger()

const timedLogger = logger.withMiddleware({
  info:
    next =>
    (context, ...messages) => {
      next(context, `[${new Date().toISOString()}]`, ...messages)
    },
})
```

---

## JSON preset (`@leancodepl/logger/json`)

Logger that writes one JSON object per line to stdout (level, timestamp, msg, optional context). Same log levels and `enabledLogLevels` option as the CLI preset.

```typescript
import { createJsonLogger, allLogLevels, LogLevel } from "@leancodepl/logger/json"

const logger = createJsonLogger()
logger.info("Request completed") // {"level":"info","timestamp":"...","msg":"Request completed"}

const quiet = createJsonLogger({ enabledLogLevels: [LogLevel.Error, LogLevel.Warn] })
const verbose = createJsonLogger({ enabledLogLevels: allLogLevels })
```

Supports `withContext` and `withMiddleware` like the base logger.

---

## Nest preset (`@leancodepl/logger/nest`)

NestJS `LoggerService` implementation that outputs JSON (same shape as the JSON preset). Use as a drop-in logger in Nest apps.

```typescript
import { createNestJsonLogger, type LoggerService } from "@leancodepl/logger/nest"

const logger: LoggerService = createNestJsonLogger()
logger.log("Application started")
logger.error("Something went wrong", "MyService")
```

If the last argument is a string, it is used as the `context` field in the JSON output (same behavior as Nest’s built-in logger).

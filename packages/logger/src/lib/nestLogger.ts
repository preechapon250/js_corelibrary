import { createLogger, DefaultContext, SupportedOutput } from "./logger"

function formatNestMessage(message: unknown, optionalParams: unknown[]): string {
  const parts = [message, ...optionalParams].map(p => {
    if (p instanceof Error) return p.message
    if (typeof p === "object" && p !== null) return JSON.stringify(p)
    return String(p)
  })
  return parts.join(" ")
}

function writeJsonLog(level: string, message: unknown, optionalParams: unknown[]) {
  const last = optionalParams.at(-1)
  const context = typeof last === "string" ? last : undefined
  const msgParams = context !== undefined ? optionalParams.slice(0, -1) : optionalParams
  const msg = formatNestMessage(message, msgParams)
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    message: msg,
    ...(context !== undefined ? { context } : {}),
  }
  process.stdout.write(JSON.stringify(entry) + "\n")
}

function nestJsonHandler(level: string) {
  return (_context: DefaultContext, ...messages: SupportedOutput[]) => {
    const [message = "", ...optionalParams] = messages
    writeJsonLog(level, message, optionalParams)
  }
}

export interface LoggerService {
  log(message: any, ...optionalParams: any[]): any
  error(message: any, ...optionalParams: any[]): any
  warn(message: any, ...optionalParams: any[]): any
  debug?(message: any, ...optionalParams: any[]): any
  verbose?(message: any, ...optionalParams: any[]): any
  fatal?(message: any, ...optionalParams: any[]): any
  setLogLevels?(levels: any[]): any
}

function createNestJsonLogger(): LoggerService {
  const nestLogger = createLogger({
    log: nestJsonHandler("info"),
    error: nestJsonHandler("error"),
    warn: nestJsonHandler("warn"),
    debug: nestJsonHandler("debug"),
    verbose: nestJsonHandler("verbose"),
    fatal: nestJsonHandler("fatal"),
  })

  return {
    log(message: unknown, ...optionalParams: unknown[]) {
      nestLogger.log(message, ...optionalParams)
    },
    error(message: unknown, ...optionalParams: unknown[]) {
      nestLogger.error(message, ...optionalParams)
    },
    warn(message: unknown, ...optionalParams: unknown[]) {
      nestLogger.warn(message, ...optionalParams)
    },
    debug(message: unknown, ...optionalParams: unknown[]) {
      nestLogger.debug(message, ...optionalParams)
    },
    verbose(message: unknown, ...optionalParams: unknown[]) {
      nestLogger.verbose(message, ...optionalParams)
    },
    fatal(message: unknown, ...optionalParams: unknown[]) {
      nestLogger.fatal(message, ...optionalParams)
    },
  }
}

type NestJsonLogger = ReturnType<typeof createNestJsonLogger>

export { createNestJsonLogger, type NestJsonLogger }

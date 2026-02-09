enum LogLevel {
  Error = 0,
  Warn = 1,
  Success = 2,
  Info = 3,
  Verbose = 4,
  Debug = 5,
}

const allLogLevels = [LogLevel.Error, LogLevel.Warn, LogLevel.Success, LogLevel.Info, LogLevel.Verbose, LogLevel.Debug]

const defaultEnabledLogLevels = [LogLevel.Error, LogLevel.Warn, LogLevel.Success, LogLevel.Info]

const logLevelToLabel = {
  [LogLevel.Error]: "error",
  [LogLevel.Warn]: "warn",
  [LogLevel.Success]: "success",
  [LogLevel.Info]: "info",
  [LogLevel.Verbose]: "verbose",
  [LogLevel.Debug]: "debug",
} as const

type LogLevelLabel = (typeof logLevelToLabel)[keyof typeof logLevelToLabel]

function isLogLevelEnabled(logLevel: LogLevel, enabledLogLevels: LogLevel[]) {
  return enabledLogLevels.includes(logLevel)
}

export { allLogLevels, defaultEnabledLogLevels, isLogLevelEnabled, LogLevel, logLevelToLabel }
export type { LogLevelLabel }

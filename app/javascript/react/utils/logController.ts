import * as Sentry from "@sentry/react";

export enum LogLevel {
  Info = "info",
  Warning = "warning",
  Error = "error",
  Debug = "debug",
  Fatal = "fatal",
}

interface LogOptions {
  message: string;
  level?: LogLevel;
}

const convertToSeverityLevel = (level: LogLevel): Sentry.SeverityLevel => {
  switch (level) {
    case LogLevel.Info:
      return "info";
    case LogLevel.Warning:
      return "warning";
    case LogLevel.Error:
      return "error";
    case LogLevel.Debug:
      return "debug";
    case LogLevel.Fatal:
      return "fatal";
  }
}

export const logEvent = ({
  message,
  level = LogLevel.Info,
}: LogOptions): void => {
  const severityLevel = convertToSeverityLevel(level)
  Sentry.captureMessage(message, severityLevel);
};

export const logError = (error: Error): void => {
  Sentry.captureException(error);
};

import * as Sentry from "@sentry/react";
import { getErrorMessage } from "../utils/getErrorMessage";

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
    default:
      return "info";
  }
};

export const logEvent = ({
  message,
  level = LogLevel.Info,
}: LogOptions): void => {
  const severityLevel = convertToSeverityLevel(level);
  Sentry.captureMessage(message, severityLevel);
};

export const logError = (
  error: unknown,
  context: Record<string, any> = {}
): void => {
  const errorMessage = getErrorMessage(error);
  const errorToLog = new Error(errorMessage);

  Sentry.captureException(errorToLog, {
    extra: {
      ...context,
    },
  });
};

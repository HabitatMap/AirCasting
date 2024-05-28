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

export const logEvent = ({
  message,
  level = LogLevel.Info,
}: LogOptions): void => {
  Sentry.captureMessage(message, level);
};

export const logError = (error: Error): void => {
  Sentry.captureException(error);
};

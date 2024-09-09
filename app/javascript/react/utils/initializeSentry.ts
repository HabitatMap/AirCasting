import * as Sentry from "@sentry/react";

export const initializeSentry = () => {
  let sentryEnvironment: string;

  switch (window.location.hostname) {
    case "aircasting.habitatmap.org":
      sentryEnvironment = "Production";
      break;
    case "172.104.20.165":
      sentryEnvironment = "Experimental";
      break;
    case "45.56.103.151":
      sentryEnvironment = "Staging";
      break;
    default:
      sentryEnvironment = "Production";
      break;
  }

  if (process.env.NODE_ENV === "production") {
    Sentry.init({
      environment: sentryEnvironment,
      dsn: process.env.SENTRY_DSN_KEY,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 1.0,
      tracePropagationTargets: [/^http:\/\/localhost(:\d+)?/],
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }
};

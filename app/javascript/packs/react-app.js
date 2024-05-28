import { createRoot } from "react-dom/client";
import React from "react";
import * as Sentry from "@sentry/react";

import { App } from "../react/App.tsx";

import "../react/assets/styles/typography";

Sentry.init({
    dsn: "https://b3efe1455bd232a712819c8693883401@o4507334018662400.ingest.de.sentry.io/4507334116769872",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });

const container = document.getElementById("react-app");
const root = createRoot(container);

root.render(<App />);

import { createRoot } from "react-dom/client";
import React from "react";
import * as Sentry from "@sentry/react";

import { App } from "../react/App.tsx";

import "../react/assets/styles/typography";

Sentry.init({
    environment: process.env.NODE_ENV === "production" ? "Producation" : "Development",
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

const container = document.getElementById("react-app");
const root = createRoot(container);

root.render(<App />);

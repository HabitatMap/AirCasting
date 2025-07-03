import React from "react";
import { createRoot } from "react-dom/client";

import { App } from "../react/App.tsx";
import { CookieManager } from "../react/utils/cookieManager";
import { initializeSentry } from "../react/utils/initializeSentry.ts";

import "../react/assets/styles/typography";

initializeSentry();

// Initialize cookie preferences
const savedPreferences = CookieManager.loadPreferences();
CookieManager.applyPreferences(savedPreferences);

const container = document.getElementById("react-app");
const root = createRoot(container);

root.render(<App />);

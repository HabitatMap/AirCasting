import React from "react";
import { createRoot } from "react-dom/client";

import { initializeSentry } from "../react/utils/initializeSentry.ts";
import { App } from "../react/App.tsx";

import "../react/assets/styles/typography";

initializeSentry();

const container = document.getElementById("react-app");
const root = createRoot(container);

root.render(<App />);

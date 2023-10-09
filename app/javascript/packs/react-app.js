import { createRoot } from "react-dom/client";
import React from "react";

import { App } from "../react/App.tsx";

const container = document.getElementById("calendar");
const root = createRoot(container);

root.render(<App />);

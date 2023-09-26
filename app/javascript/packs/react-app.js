import { createRoot } from "react-dom/client";
import React from "react";

const container = document.getElementById("calendar");
const root = createRoot(container);

const Test = () => {
  return (
    <div>
      <div>Test</div>
      <div>Best</div>
    </div>
  );
};

root.render(<Test />);

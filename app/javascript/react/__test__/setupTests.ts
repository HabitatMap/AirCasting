// setupTest.ts
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";
import store from "../store/index";

export const testRenderer = (
  children: React.ReactNode,
  { route = "/" } = {}
) => {
  return render(<Provider store={store}>{children}</Provider>);
};

export * from "@testing-library/react";
export { testRenderer as render };

import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import store from "../store/index";

export const testRenderer = (
  children: React.ReactNode,
  { route = "/" } = {}
) => {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    </Provider>
  );
};

export * from "@testing-library/react";
export { testRenderer as render };

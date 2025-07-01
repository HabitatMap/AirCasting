import { render } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import store from "./store/index";
import { initGoogleMapsMocks } from "./tests/mock-data/mockGoogleMapsInit";

// Initialize google maps mock before any tests
initGoogleMapsMocks();

export const testRenderer = (
  children: React.ReactNode,
  options: { route?: string } = {}
) => {
  const router = createMemoryRouter([{ path: "*", element: children }], {
    initialEntries: [options.route || "/"],
  });

  return render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
};

export const renderWithProvider = (component: React.ReactNode) => {
  return render(<Provider store={store}>{component}</Provider>);
};

export * from "@testing-library/react";
export { testRenderer as render };

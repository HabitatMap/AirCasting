import { render } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { RootState } from "../../store";
import { createMockStore } from "./mockStore";

export const renderWithProviders = (
  ui: React.ReactElement,
  options?: { initialState?: Partial<RootState> }
) => {
  const store = createMockStore(options?.initialState);
  const renderResult = render(
    <Provider store={store}>
      <BrowserRouter>{ui}</BrowserRouter>
    </Provider>
  );
  return {
    store,
    ...renderResult,
  };
};

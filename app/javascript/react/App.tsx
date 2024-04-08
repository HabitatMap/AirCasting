import React from "react";
import { Provider } from "react-redux";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import { CalendarPage } from "./pages/CalendarPage";
import GlobalStyles from "./assets/styles/global-styles";
import "./locales/i18n";
import store from "./store/index";
import { Navbar } from "./components/Navbar";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/fixed_stream" element={<CalendarPage />} />
    </>
  )
);

const App = () => {
  return (
    <Provider store={store}>
      <GlobalStyles />
      <Navbar />
      <RouterProvider router={router} />
    </Provider>
  );
};

export { App };

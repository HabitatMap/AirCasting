import React from "react";
import { Provider } from "react-redux";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import { CalendarPage } from "./pages/CalendarPage/CalendarPage";
import { NotFoundPage } from "./pages/NotFoundPage/NotFoundPage";
import { Navbar } from "./components/Navbar";
import store from "./store/index";
import GlobalStyles from "./assets/styles/global-styles";
import "./locales/i18n";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="*" element={<NotFoundPage />} />
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

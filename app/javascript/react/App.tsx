import React from "react";
import { Provider } from "react-redux";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import { CalendarPage } from "./pages/CalendarPage/CalendarPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { MapPage } from "./pages/MapPage";
import { Header } from "./components/Header";
import store from "./store/index";
import GlobalStyles from "./assets/styles/global-styles";
import "./locales/i18n";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<MapPage />} />
      <Route path="/fixed_stream" element={<CalendarPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </>
  )
);

const App = () => {
  return (
    <Provider store={store}>
      <GlobalStyles />
      <Header />
      <RouterProvider router={router}></RouterProvider>
    </Provider>
  );
};

export { App };

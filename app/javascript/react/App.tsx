import "./locales/i18n";

import React from "react";
import { Provider } from "react-redux";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import GlobalStyles from "./assets/styles/global-styles";
import { Navbar } from "./components/Navbar";
import { CalendarPage } from "./pages/CalendarPage/CalendarPage";
import { MapPage } from "./pages/MapPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RedirectPage } from "./pages/RedirectPage";
import store from "./store/index";

const NEW_MAP = "/new_map";

const MOBILE_MAP_PATH = "/mobile_map";
const FIXED_MAP_PATH = "/fixed_map";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route
        path={MOBILE_MAP_PATH || FIXED_MAP_PATH}
        element={
          <MapPage>
            <Navbar isMapPage={true} />
          </MapPage>
        }
      />
      <Route
        path="/fixed_stream"
        element={
          <CalendarPage>
            <Navbar isMapPage={false} />
          </CalendarPage>
        }
      />
      <Route
        path="*"
        element={
          <NotFoundPage>
            <Navbar isMapPage={false} />
          </NotFoundPage>
        }
      />
      <Route
        path={NEW_MAP}
        element={
          <RedirectPage>
            <Navbar isMapPage={false} />
          </RedirectPage>
        }
      />
    </>
  )
);

const App = () => {
  return (
    <Provider store={store}>
      <GlobalStyles />
      <RouterProvider router={router}></RouterProvider>
    </Provider>
  );
};

export { App };

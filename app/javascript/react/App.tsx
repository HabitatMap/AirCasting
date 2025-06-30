import "./locales/i18n";

import React, { lazy, Suspense } from "react";
import { Provider } from "react-redux";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import GlobalStyles from "./assets/styles/global-styles";
import { Navbar } from "./components/molecules/Navbar/Navbar";
import store from "./store/index";

const MapPage = lazy(() =>
  import("./pages/MapPage").then((module) => ({ default: module.MapPage }))
);
const CalendarPage = lazy(() =>
  import("./pages/CalendarPage/CalendarPage").then((module) => ({
    default: module.CalendarPage,
  }))
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((module) => ({
    default: module.NotFoundPage,
  }))
);
const RedirectPage = lazy(() =>
  import("./pages/RedirectPage").then((module) => ({
    default: module.RedirectPage,
  }))
);

const NEW_MAP = "/new_map";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route
        path="/"
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
      <Suspense fallback={<div>Loading...</div>}>
        <RouterProvider router={router}></RouterProvider>
      </Suspense>
    </Provider>
  );
};

export { App };

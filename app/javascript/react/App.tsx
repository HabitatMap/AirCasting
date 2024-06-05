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
import store from "./store/index";
import { RemoveActiveFocusWhenNotTab } from "./utils/activeFocusControler";

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
    </>
  )
);

const App = () => {
  return (
    <Provider store={store}>
      <GlobalStyles />
      <RemoveActiveFocusWhenNotTab/>
      <RouterProvider router={router}></RouterProvider>
    </Provider>
  );
};

export { App };

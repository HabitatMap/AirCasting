import "./locales/i18n";

import React from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import GlobalStyles from "./assets/styles/global-styles";
import { Navbar } from "./components/Navbar";
import { CalendarPage } from "./pages/CalendarPage/CalendarPage";
import { MapPage } from "./pages/MapPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RedirectPage } from "./pages/RedirectPage";
import store from "./store";

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

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <GlobalStyles />
        <RouterProvider router={router}></RouterProvider>
      </Provider>
    </QueryClientProvider>
  );
};

export { App };

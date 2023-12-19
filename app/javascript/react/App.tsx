import React from "react";
import { Provider } from "react-redux";

import { CalendarPage } from "./pages/CalendarPage";
import GlobalStyles from "./assets/styles/global-styles";
import store from "./store/index";

const App = () => {
  return (
    <>
      <Provider store={store}>
        <GlobalStyles />
        <CalendarPage />
      </Provider>
    </>
  );
};

export { App };

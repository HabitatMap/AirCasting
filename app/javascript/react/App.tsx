import React from "react";
import { Provider } from "react-redux";

import { CalendarPage } from "./pages/CalendarPage";
import GlobalStyles from "./assets/styles/global-styles";
import store from "./store/index";
import "./locales/i18n";
import { DayView } from "./components/DayView/DayView";

const App = () => {
  return (
    <Provider store={store}>
      <GlobalStyles />
      {/* <CalendarPage /> */}
      <DayView/>
    </Provider>
  );
};

export { App };

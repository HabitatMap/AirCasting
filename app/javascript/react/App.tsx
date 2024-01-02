import React from "react";
import './locales/i18n'

import { CalendarPage } from "./pages/CalendarPage";
import GlobalStyles from "./assets/styles/global-styles";
import { CalendarStationHeader } from "./components/molecules/CalendarStationHeader/CalendarStationHeader";

const App = () => {
  return (
    <>
      <GlobalStyles />
      <CalendarStationHeader/>
      {/* <CalendarPage /> */}
    </>
  );
};

export { App };

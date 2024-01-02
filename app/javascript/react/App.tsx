import React from "react";
import { Provider } from "react-redux";

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

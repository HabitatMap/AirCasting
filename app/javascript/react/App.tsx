import React from "react";
import { Provider } from "react-redux";

import { CalendarPage } from "./pages/CalendarPage";
import GlobalStyles from "./assets/styles/global-styles";
import "./locales/i18n";
import store from "./store/index";
import { CalendarStationHeader } from "./components/molecules/CalendarStationHeader/CalendarStationHeader";
import { StationValueLabel } from "./components/molecules/StationValueLabel";
const App = () => {
  return (
    <Provider store={store}>
      <GlobalStyles />
      {/* <CalendarPage /> */}
      <CalendarStationHeader 
      stationName="White Plains, New York-Northern New Jersey-London" 
      profile="Tim Cain" 
      sensor="Government Data USEPA" 
      lastUpdate="18:00, Sep 1 2023"
      streamData={{
        day: "Jun 12",
        value: 12,
        parameter: "PM2.5 µg/m"}}/>
    </Provider>
  );
};

export { App };

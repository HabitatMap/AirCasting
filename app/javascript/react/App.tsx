import React from "react";
import { CalendarPage } from "./pages/CalendarPage";
import GlobalStyles from "./assets/styles/global-styles";
import { StationValueLabel } from "./components/molecules/StationValueLabel";

const App = () => {
  return (
    <>
      <GlobalStyles />
      <StationValueLabel date={""} value={1} parameter={""}/>
      <CalendarPage />
    </>
  );
};

export { App };

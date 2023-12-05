import React from "react";

import { CalendarPage } from "./pages/CalendarPage";
import MultiSlider from "./components/Multislider/MultiSlider";

import GlobalStyles from "./assets/styles/global-styles";

const App = () => {
  return (
    <>
      <GlobalStyles />
      <CalendarPage />
      <MultiSlider />
    </>
  );
};

export { App };

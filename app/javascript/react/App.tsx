import React from "react";

import { CalendarPage } from "./pages/CalendarPage";
import GlobalStyles from "./assets/global-styles";

const App = () => {
  return (
    <>
      <GlobalStyles />
      <CalendarPage />
    </>
  );
};

export { App };
